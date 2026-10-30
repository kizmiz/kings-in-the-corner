"""PPO training for Nana (python -m kitc.train).

Each iteration, the worker processes play until each has `--steps` learner decisions; the network
then takes a few epochs of clipped-PPO steps on them. Every `--eval-every` iterations the greedy
policy plays duplicate deals against Aunt June (kitc/bots.py), and the best of those becomes
checkpoints/best.pt. runs/<name>/metrics.jsonl has every number.

    .venv/bin/python -m kitc.train --name first
    .venv/bin/python -m kitc.train --name next --init runs/first/checkpoints/best.pt --opponents june:0.6,snapshot:0.4
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch

from .encoding import OBS_SIZE
from .engine import NUM_ACTIONS
from .model import PolicyNet, load_checkpoint, load_policy, numpy_weights, save_checkpoint, widen
from .selfplay import Rollouts, SelfPlayConfig


def weights_arg(text: str, key=str) -> dict:
    out = {}
    for part in text.split(","):
        k, v = part.split(":")
        out[key(k)] = float(v)
    return out


def ppo_update(net, opt, batch, args, device) -> dict:
    n = len(batch["action"])
    obs = torch.from_numpy(batch["obs"]).to(device)
    mask = torch.from_numpy(batch["mask"]).to(device)
    action = torch.from_numpy(batch["action"]).to(device)
    old_logp = torch.from_numpy(batch["logp"]).to(device)
    adv = torch.from_numpy(batch["adv"]).to(device)
    ret = torch.from_numpy(batch["ret"]).to(device)
    adv = (adv - adv.mean()) / (adv.std() + 1e-8)
    stats = {"pg": 0.0, "vf": 0.0, "ent": 0.0, "kl": 0.0, "clip": 0.0}
    steps = 0
    for _ in range(args.epochs):
        perm = torch.randperm(n, device=device)
        for lo in range(0, n, args.minibatch):
            idx = perm[lo:lo + args.minibatch]
            logits, value = net(obs[idx], mask[idx])
            logp_all = torch.log_softmax(logits, -1)
            logp = logp_all.gather(-1, action[idx, None]).squeeze(-1)
            ratio = torch.exp(logp - old_logp[idx])
            a = adv[idx]
            pg = -torch.min(ratio * a, ratio.clamp(1 - args.clip, 1 + args.clip) * a).mean()
            vf = 0.5 * (value - ret[idx]).pow(2).mean()
            p = logp_all.exp()
            ent = -(p * logp_all.masked_fill(~mask[idx], 0.0)).sum(-1).mean()
            loss = pg + args.vf_coef * vf - args.ent_coef * ent
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(net.parameters(), args.max_grad)
            opt.step()
            with torch.no_grad():
                stats["pg"] += pg.item()
                stats["vf"] += vf.item()
                stats["ent"] += ent.item()
                stats["kl"] += (old_logp[idx] - logp).mean().item()
                stats["clip"] += ((ratio - 1).abs() > args.clip).float().mean().item()
            steps += 1
    return {k: v / steps for k, v in stats.items()}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", required=True)
    ap.add_argument("--iters", type=int, default=400)
    ap.add_argument("--workers", type=int, default=9)
    ap.add_argument("--envs", type=int, default=64, help="concurrent games per worker")
    ap.add_argument("--steps", type=int, default=8192, help="learner decisions per worker per iteration")
    ap.add_argument("--hidden", type=int, default=512)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--lr-end", type=float, default=None, help="anneal the learning rate linearly to this")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--minibatch", type=int, default=8192)
    ap.add_argument("--clip", type=float, default=0.2)
    ap.add_argument("--vf-coef", type=float, default=0.5)
    ap.add_argument("--ent-coef", type=float, default=0.01)
    ap.add_argument("--ent-end", type=float, default=None, help="anneal the entropy bonus linearly to this")
    ap.add_argument("--max-grad", type=float, default=0.5)
    ap.add_argument("--gamma", type=float, default=1.0)
    ap.add_argument("--lam", type=float, default=0.95)
    ap.add_argument("--players", default="2:1", help="table sizes and weights, e.g. 2:0.8,3:0.1,4:0.1")
    ap.add_argument("--variant", default="classic", choices=["classic", "demons"])
    ap.add_argument("--opponents", default="june:0.4,snapshot:0.3,self:0.2,ray:0.1")
    ap.add_argument("--snapshot-every", type=int, default=10)
    ap.add_argument("--pool", type=int, default=6, help="snapshots kept as opponents")
    ap.add_argument("--eval-every", type=int, default=10)
    ap.add_argument("--eval-deals", type=int, default=2000, help="duplicate deals (one game per seat each)")
    ap.add_argument("--eval-players", default="2", help="table sizes to evaluate at, e.g. 2,4; best.pt keeps the best mean edge")
    ap.add_argument("--device", default="mps" if torch.backends.mps.is_available() else "cpu")
    ap.add_argument("--init", help="start from this checkpoint's weights (widened to --hidden if that's wider)")
    ap.add_argument("--fixed", default="", help="checkpoints kept as opponents for good (the 'fixed' kind), comma-separated")
    ap.add_argument("--eval-vs", help="also play this checkpoint heads-up at each evaluation (logged as eval_vs)")
    ap.add_argument("--resume", help="continue this run's latest.pt (iteration count, optimizer)")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--keep-evals", action="store_true",
                    help="also keep a checkpoint at every evaluation (to pick one of a chosen strength later)")
    args = ap.parse_args(argv)

    run = Path("runs") / args.name
    (run / "checkpoints").mkdir(parents=True, exist_ok=True)
    torch.manual_seed(args.seed)
    device = torch.device(args.device)

    start = 0
    best = -1.0
    net = PolicyNet(OBS_SIZE, NUM_ACTIONS, args.hidden)
    opt_state = None
    if args.resume:
        ckpt = load_checkpoint(args.resume)
        net = PolicyNet(**ckpt["spec"])
        net.load_state_dict(ckpt["state"])
        start, best, opt_state = ckpt["iteration"], ckpt.get("best", -1.0), ckpt.get("opt")
    elif args.init:
        ckpt = load_checkpoint(args.init)
        net = PolicyNet(**ckpt["spec"])
        net.load_state_dict(ckpt["state"])
        net = widen(net, args.hidden)
    net.to(device)
    opt = torch.optim.Adam(net.parameters(), lr=args.lr, eps=1e-5)
    if opt_state:
        opt.load_state_dict(opt_state)

    cfg = SelfPlayConfig(players=weights_arg(args.players, int), envs=args.envs,
                         opponents=weights_arg(args.opponents), gamma=args.gamma, lam=args.lam,
                         variant=args.variant)
    rollouts = Rollouts(args.workers, cfg, net.spec, seed=args.seed + start)
    for k, path in enumerate(p for p in args.fixed.split(",") if p):
        rollouts.add_snapshot(-1 - k, numpy_weights(load_policy(path)), fixed=True)
    rival = numpy_weights(load_policy(args.eval_vs)) if args.eval_vs else None
    pool: list[int] = []
    (run / "args.json").write_text(json.dumps(vars(args), indent=2))
    metrics = open(run / "metrics.jsonl", "a")

    try:
        for it in range(start, args.iters):
            frac = (it - start) / max(args.iters - start, 1)
            if args.lr_end is not None:
                for group in opt.param_groups:
                    group["lr"] = args.lr + (args.lr_end - args.lr) * frac
            ent = args.ent_coef if args.ent_end is None else args.ent_coef + (args.ent_end - args.ent_coef) * frac
            args_now = argparse.Namespace(**{**vars(args), "ent_coef": ent})

            t0 = time.time()
            weights = numpy_weights(net)
            if it % args.snapshot_every == 0:
                rollouts.add_snapshot(it, weights)
                pool.append(it)
                if len(pool) > args.pool:
                    rollouts.drop_snapshot(pool.pop(0))
            batch = rollouts.collect(weights, args.steps)
            t1 = time.time()
            net.train()
            upd = ppo_update(net, opt, batch, args_now, device)
            net.eval()
            t2 = time.time()

            stats = batch["stats"]
            row = {"iter": it + 1, "decisions": len(batch["action"]), "collect_s": round(t1 - t0, 1),
                   "update_s": round(t2 - t1, 1), "ent_coef": ent, **{k: round(v, 5) for k, v in upd.items()}}
            games, turns = stats.get("games", [0, 0])[:2]
            row["turns_per_game"] = round(turns / max(games, 1), 1)
            for kind, (g, w, tie) in stats.items():
                if kind != "games" and g:
                    row[f"train_{kind}"] = round(w / g, 3)
            if (it + 1) % args.eval_every == 0:
                # Edge: the win rate over the 1/players a June would get in that seat.
                edges, evals = [], {}
                for n in (int(k) for k in args.eval_players.split(",")):
                    deals = max(args.eval_deals * 2 // n, 1)
                    ev = rollouts.evaluate(numpy_weights(net), deals, seed=10_000 + it, opponent="june",
                                          variant=args.variant, players=n)
                    evals[n] = ev
                    edges.append(ev["win_rate"] * n)
                    tag = "eval_june" if n == 2 else f"eval_june_{n}p"
                    row.update({tag: round(ev["win_rate"], 4), f"{tag}_tie": round(ev["tie_rate"], 4),
                                f"{tag}_margin": round(ev["margin95"], 4)})
                score = sum(edges) / len(edges)
                row["eval_edge"] = round(score, 4)
                if rival is not None:
                    ev = rollouts.evaluate(numpy_weights(net), args.eval_deals // 2, seed=20_000 + it, opponent=rival,
                                          variant=args.variant)
                    row.update({"eval_vs": round(ev["win_rate"], 4), "eval_vs_tie": round(ev["tie_rate"], 4)})
                if args.keep_evals:
                    save_checkpoint(run / "checkpoints" / f"iter-{it + 1:04d}.pt", net, iteration=it + 1,
                                    eval=evals[min(evals)], evals=evals, edge=score)
                if score > best:
                    best = score
                    save_checkpoint(run / "checkpoints" / "best.pt", net, iteration=it + 1, eval=evals[min(evals)],
                                    evals=evals, edge=score)
            save_checkpoint(run / "checkpoints" / "latest.pt", net, iteration=it + 1, best=best,
                            opt=opt.state_dict())
            print(json.dumps(row), flush=True)
            metrics.write(json.dumps(row) + "\n")
            metrics.flush()
    finally:
        rollouts.close()


if __name__ == "__main__":
    main()
