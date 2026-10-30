"""The whole family's standings, from the weakest to the strongest (python -m kitc.standings).

Each member sits at a table of Aunt Junes at two, three and four players, then every pair plays
heads-up, in both games. Duplicate deals: every deal is played once with the member in each seat,
the rest of the table being the other side. Ties count as neither a win nor a loss.

    .venv/bin/python -m kitc.standings --deals 2000 --out standings.json
"""

from __future__ import annotations

import argparse
import json
import random
from multiprocessing import Pool

from .bots import BOTS
from .engine import Game
from .policy import NumpyBot, load

FAMILY = ("pip", "ray", "june", "leo", "nana")
LEARNERS = {"leo": "web/agents/leo-{v}.bin", "nana": "web/agents/nana-{v}.bin"}
_policies = {}


def player(who: str, variant: str, seed: int):
    if who in BOTS:
        return BOTS[who](seed=seed)
    if (who, variant) not in _policies:
        _policies[who, variant] = load(LEARNERS[who].format(v=variant))
    return NumpyBot(_policies[who, variant])


def deal(job) -> tuple[int, int, int]:
    """One deal, played once with `me` in each seat: (wins, ties, games)."""
    me, other, players, variant, seed = job
    deck = list(range(52))
    random.Random(seed).shuffle(deck)
    wins = ties = 0
    for seat in range(players):
        bots = {q: player(me if q == seat else other, variant, seed + q) for q in range(players)}
        g = Game(players, deck=list(deck), first=seed % players, variant=variant, power_seed=seed)
        while not g.over:
            g.step(bots[g.current].act(g))
        r = g.result(seat)
        wins += r == 1
        ties += r == 0
    return wins, ties, players


def rate(pool, me: str, other: str, players: int, variant: str, deals: int, seed: int) -> dict:
    rng = random.Random(seed)
    jobs = [(me, other, players, variant, rng.getrandbits(32)) for _ in range(deals)]
    w = t = n = 0
    for a, b, c in pool.imap_unordered(deal, jobs, chunksize=8):
        w, t, n = w + a, t + b, n + c
    return {"win": round(w / n, 4), "tie": round(t / n, 4), "games": n}


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--deals", type=int, default=2000)
    ap.add_argument("--workers", type=int, default=10)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--out", default="standings.json")
    args = ap.parse_args(argv)

    results = {}
    with Pool(args.workers) as pool:
        for variant in ("classic", "demons"):
            for players in (2, 3, 4):
                for me in FAMILY:
                    key = f"{variant} {me} vs june, {players} players"
                    results[key] = rate(pool, me, "june", players, variant, args.deals, args.seed)
                    print(key, json.dumps(results[key]), flush=True)
            for i, me in enumerate(FAMILY):
                for other in FAMILY[i + 1:]:
                    key = f"{variant} {me} vs {other}, heads-up"
                    results[key] = rate(pool, me, other, 2, variant, args.deals, args.seed)
                    print(key, json.dumps(results[key]), flush=True)
    with open(args.out, "w") as f:
        json.dump(results, f, indent=1)


if __name__ == "__main__":
    main()
