"""Nana's first lessons: learn to play like Aunt June before learning to beat her
(python -m kitc.imitate).

From scratch, self-play found Uncle Ray's game (play everything) and stalled there: June's edge
comes from what she doesn't play, which a final +1/-1 teaches slowly. So the network first copies
June's decisions, and her games' results train its value head; PPO (kitc/train.py --init) then
starts from a policy that already plays her game.

    .venv/bin/python -m kitc.imitate --name bc-classic --decisions 1500000
    .venv/bin/python -m kitc.imitate --name bc-demons --variant demons --init runs/bc-classic/checkpoints/best.pt
"""

from __future__ import annotations

import argparse
import json
import random
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
import torch

from .bots import GreedyBot, HeuristicBot, RandomBot
from .encoding import OBS_SIZE, encode, mask
from .engine import NUM_ACTIONS, Game
from .model import PolicyNet, load_checkpoint, numpy_weights, save_checkpoint
from .selfplay import Rollouts, SelfPlayConfig

# Who June plays while we watch: herself, mostly, and the rest of the family.
OPPONENTS = {"june": 0.6, "ray": 0.25, "pip": 0.15}


def _games(job) -> dict:
    seed, decisions, variant, players = job
    rng = random.Random(seed)
    obs, masks, acts, owner, game_of = [], [], [], [], []
    results = []
    while len(acts) < decisions:
        n = rng.choices(list(players), weights=list(players.values()))[0]
        kind = rng.choices(list(OPPONENTS), weights=list(OPPONENTS.values()))[0]
        seats = ["june"] + ["june" if kind == "june" else kind for _ in range(n - 1)]
        rng.shuffle(seats)
        make = {"june": HeuristicBot, "ray": GreedyBot, "pip": RandomBot}
        bots = [make[c](seed=rng.getrandbits(32)) for c in seats]
        g = Game(n, seed=rng.getrandbits(32), first=rng.randrange(n), variant=variant)
        gid = len(results)
        while not g.over:
            q = g.current
            legal = g.legal()
            a = bots[q].act(g)
            if seats[q] == "june":
                obs.append(encode(g, q, legal).astype(np.float16))
                masks.append(np.packbits(mask(legal)))
                acts.append(a)
                owner.append(q)
                game_of.append(gid)
            g.step(a)
        results.append([g.result(q) for q in range(n)])
    value = np.array([results[gi][q] for gi, q in zip(game_of, owner)], np.float32)
    return {"obs": np.stack(obs), "mask": np.stack(masks), "action": np.array(acts, np.int64), "value": value}


def generate(decisions: int, variant: str, players: dict, workers: int, seed: int) -> dict:
    per = -(-decisions // (workers * 4))
    jobs = [(seed * 100_003 + k, per, variant, players) for k in range(workers * 4)]
    with Pool(workers) as pool:
        parts = pool.map(_games, jobs)
    return {k: np.concatenate([p[k] for p in parts]) for k in parts[0]}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", required=True)
    ap.add_argument("--variant", default="classic", choices=["classic", "demons"])
    ap.add_argument("--players", default="2:1")
    ap.add_argument("--decisions", type=int, default=1_500_000)
    ap.add_argument("--epochs", type=int, default=6)
    ap.add_argument("--batch", type=int, default=4096)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--hidden", type=int, default=512)
    ap.add_argument("--vf-coef", type=float, default=0.5)
    ap.add_argument("--workers", type=int, default=9)
    ap.add_argument("--init", help="start from this checkpoint")
    ap.add_argument("--eval-deals", type=int, default=2000)
    ap.add_argument("--device", default="mps" if torch.backends.mps.is_available() else "cpu")
    ap.add_argument("--seed", type=int, default=0)
    args = ap.parse_args(argv)

    run = Path("runs") / args.name
    run.mkdir(parents=True, exist_ok=True)
    players = {int(k): float(v) for k, v in (p.split(":") for p in args.players.split(","))}
    t0 = time.time()
    data = generate(args.decisions, args.variant, players, args.workers, args.seed)
    n = len(data["action"])
    print(f"{n} of June's decisions in {time.time() - t0:.0f}s", flush=True)

    device = torch.device(args.device)
    if args.init:
        ckpt = load_checkpoint(args.init)
        net = PolicyNet(**ckpt["spec"])
        net.load_state_dict(ckpt["state"])
    else:
        net = PolicyNet(OBS_SIZE, NUM_ACTIONS, args.hidden)
    net.to(device)
    opt = torch.optim.Adam(net.parameters(), lr=args.lr)
    steps = args.epochs * (n // args.batch)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=args.lr, total_steps=steps, pct_start=0.1)

    rng = np.random.default_rng(args.seed)
    order = rng.permutation(n)
    held = order[: n // 50]
    train = order[n // 50:]

    def tensors(idx):
        obs = torch.from_numpy(data["obs"][idx].astype(np.float32)).to(device)
        m = torch.from_numpy(np.unpackbits(data["mask"][idx], axis=1)[:, :NUM_ACTIONS].astype(bool)).to(device)
        return obs, m, torch.from_numpy(data["action"][idx]).to(device), torch.from_numpy(data["value"][idx]).to(device)

    log = open(run / "metrics.jsonl", "a")
    for epoch in range(args.epochs):
        net.train()
        rng.shuffle(train)
        tot = {"ce": 0.0, "vf": 0.0, "acc": 0.0}
        batches = 0
        for lo in range(0, len(train) - args.batch + 1, args.batch):
            obs, m, a, v = tensors(train[lo:lo + args.batch])
            logits, value = net(obs, m)
            ce = torch.nn.functional.cross_entropy(logits, a)
            vf = 0.5 * (value - v).pow(2).mean()
            loss = ce + args.vf_coef * vf
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(net.parameters(), 1.0)
            opt.step()
            if batches < steps:
                sched.step()
            tot["ce"] += ce.item()
            tot["vf"] += vf.item()
            tot["acc"] += (logits.argmax(-1) == a).float().mean().item()
            batches += 1
        net.eval()
        with torch.no_grad():
            accs = []
            for lo in range(0, len(held), args.batch):
                obs, m, a, v = tensors(held[lo:lo + args.batch])
                logits, _ = net(obs, m)
                accs.append((logits.argmax(-1) == a).float().mean().item())
        row = {"epoch": epoch + 1, **{k: round(x / batches, 4) for k, x in tot.items()},
               "held_acc": round(float(np.mean(accs)), 4)}
        print(json.dumps(row), flush=True)
        log.write(json.dumps(row) + "\n")

    net.to("cpu")
    cfg = SelfPlayConfig(players=players, envs=8, variant=args.variant)
    rollouts = Rollouts(args.workers, cfg, net.spec, seed=args.seed)
    try:
        ev = rollouts.evaluate(numpy_weights(net), args.eval_deals, seed=77, opponent="june", players=min(players),
                                variant=args.variant)
    finally:
        rollouts.close()
    print(json.dumps({"eval_june": ev}), flush=True)
    log.write(json.dumps({"eval_june": ev}) + "\n")
    save_checkpoint(run / "checkpoints" / "best.pt", net, iteration=0, eval=ev, variant=args.variant)


if __name__ == "__main__":
    main()
