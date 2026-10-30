"""How often a trained Nana wins, on fresh duplicate deals (python -m kitc.evaluate).

Each deal is played once from every seat, so both sides get the same cards. Ties (the stock ran
out and the fewest cards were shared) count as neither a win nor a loss.

    .venv/bin/python -m kitc.evaluate runs/p1/checkpoints/best.pt --deals 5000
    .venv/bin/python -m kitc.evaluate web/agents/nana-demons.bin --variant demons --opponent ray
    .venv/bin/python -m kitc.evaluate web/agents/nana-classic.bin --players 4
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .model import PolicyNet, load_policy, numpy_weights
from .policy import read_bin
from .selfplay import Rollouts, SelfPlayConfig


def weights_of(path: str | Path) -> dict:
    path = Path(path)
    if path.suffix == ".bin":
        return read_bin(path)
    return {k: v for k, v in numpy_weights(load_policy(path)).items() if not k.startswith("v.")}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("agent", help="a checkpoint (.pt) or exported weights (.bin)")
    ap.add_argument("--opponent", default="june", help="pip, ray, june, or another agent's .pt/.bin")
    ap.add_argument("--variant", default="classic", choices=["classic", "demons"])
    ap.add_argument("--players", type=int, default=2)
    ap.add_argument("--deals", type=int, default=5000)
    ap.add_argument("--workers", type=int, default=9)
    ap.add_argument("--seed", type=int, default=123_456)
    args = ap.parse_args(argv)

    weights = weights_of(args.agent)
    opponent = args.opponent if args.opponent in ("pip", "ray", "june") else weights_of(args.opponent)
    spec = spec_of(weights)
    rollouts = Rollouts(args.workers, SelfPlayConfig(envs=4), spec, seed=args.seed)
    try:
        ev = rollouts.evaluate(full(weights), args.deals, seed=args.seed, opponent=full(opponent),
                               players=args.players, variant=args.variant)
    finally:
        rollouts.close()
    ev["loss_rate"] = 1 - ev["win_rate"] - ev["tie_rate"]
    ev["baseline"] = 1 / args.players
    print(json.dumps({k: round(v, 4) if isinstance(v, float) else v for k, v in ev.items()}))


def spec_of(weights):
    return {"obs_size": weights["trunk.0.weight"].shape[1], "num_actions": weights["pi.2.weight"].shape[0],
            "hidden": weights["trunk.0.weight"].shape[0]}


def full(weights):
    """Exported weights carry only the policy path; the evaluator's network wants a value head too
    (a blank one, the size of that agent's own network)."""
    if not isinstance(weights, dict) or "v.0.weight" in weights:
        return weights
    blank = numpy_weights(PolicyNet(**spec_of(weights)))
    return {**blank, **weights}


if __name__ == "__main__":
    main()
