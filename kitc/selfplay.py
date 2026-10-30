"""Batched self-play data collection and evaluation, in worker processes.

Many games run at once. Each seat is played by the learner (the current policy, whose decisions
become training data), a frozen snapshot of an earlier policy, or one of the family's bots. Each
step, every network makes all of its pending decisions in one batched forward pass.

A turn is many decisions (each play or pile move, then ending the turn), and each is its own step.
A learner seat's decisions form their own chain through the buffer (`nxt` links each to the same
seat's next one), so the result, +1 for a win, -1 for a loss and 0 for a tie, lands on that seat's
last decision and GAE follows each seat's own timeline.
"""

from __future__ import annotations

import multiprocessing as mp
import random
from collections import defaultdict
from dataclasses import dataclass, field

import numpy as np
import torch

from .bots import BOTS
from .encoding import OBS_SIZE, encode, mask
from .engine import NUM_ACTIONS, Game
from .model import PolicyNet, load_numpy_weights

LEARNER = "learner"


@dataclass
class SelfPlayConfig:
    players: dict[int, float] = field(default_factory=lambda: {2: 1.0})   # table-size weights
    envs: int = 64                     # concurrent games per collector
    # Who sits across from the learner: a bot, a snapshot of an earlier learner, a frozen checkpoint
    # ("fixed": an earlier Nana kept for good), or the learner itself in every seat ("self").
    opponents: dict[str, float] = field(default_factory=lambda: {"june": 0.4, "snapshot": 0.3, "self": 0.2, "ray": 0.1})
    gamma: float = 1.0
    lam: float = 0.95
    variant: str = "classic"           # or "demons" (kitc/engine.py)


class Table:
    def __init__(self, game: Game, controllers: list, bots: dict, kind: str):
        self.game = game
        self.controllers = controllers
        self.bots = bots
        self.kind = kind                 # the opponent kind, for the stats
        self.last: dict[int, int] = {}   # learner seat -> its latest decision's index in the buffer


class Buffer:
    def __init__(self, capacity: int):
        self.obs = np.zeros((capacity, OBS_SIZE), np.float32)
        self.mask = np.zeros((capacity, NUM_ACTIONS), bool)
        self.action = np.zeros(capacity, np.int64)
        self.logp = np.zeros(capacity, np.float32)
        self.value = np.zeros(capacity, np.float32)
        self.reward = np.zeros(capacity, np.float32)
        self.done = np.zeros(capacity, bool)
        self.nxt = np.full(capacity, -1, np.int64)
        self.boot = np.zeros(capacity, np.float32)
        self.size = 0

    def add(self, obs, m, action, logp, value) -> int:
        i = self.size
        self.obs[i], self.mask[i], self.action[i], self.logp[i], self.value[i] = obs, m, action, logp, value
        self.size += 1
        return i


def gae(reward, value, done, nxt, boot, gamma: float, lam: float) -> tuple[np.ndarray, np.ndarray]:
    """Generalized advantage estimation along each seat's chain of decisions."""
    adv = np.zeros(len(reward), np.float32)
    for i in range(len(reward) - 1, -1, -1):  # a seat's next decision always has a higher index
        if done[i]:
            next_value = next_adv = 0.0
        elif nxt[i] >= 0:
            next_value, next_adv = value[nxt[i]], adv[nxt[i]]
        else:
            next_value, next_adv = boot[i], 0.0
        adv[i] = reward[i] + gamma * next_value - value[i] + gamma * lam * next_adv
    return adv, adv + value


def net_from_weights(weights: dict) -> PolicyNet:
    trunk = weights["trunk.0.weight"]
    net = PolicyNet(trunk.shape[1], weights["pi.2.weight"].shape[0], trunk.shape[0])
    load_numpy_weights(net, weights)
    return net.eval()


class Collector:
    def __init__(self, cfg: SelfPlayConfig, net: PolicyNet, seed: int | None = None):
        self.cfg = cfg
        self.net = net
        self.rng = random.Random(seed)
        self.snapshots: dict[int, PolicyNet] = {}
        self.retired: set[int] = set()
        self.fixed: list[int] = []
        self.tables = [self._new_table() for _ in range(cfg.envs)]
        self.stats = self._fresh_stats()

    def add_snapshot(self, sid: int, weights: dict, fixed: bool = False) -> None:
        self.snapshots[sid] = net_from_weights(weights)
        if fixed:
            self.fixed.append(sid)

    def drop_snapshot(self, sid: int) -> None:
        self.retired.add(sid)
        self._purge()

    def _purge(self) -> None:
        in_use = {c for t in self.tables for c in t.controllers}
        for sid in [s for s in self.retired if s not in in_use]:
            self.snapshots.pop(sid, None)
            self.retired.discard(sid)

    def _new_table(self) -> Table:
        cfg = self.cfg
        n = self.rng.choices(list(cfg.players), weights=list(cfg.players.values()))[0]
        kinds = {k: w for k, w in cfg.opponents.items() if w > 0}
        kind = self.rng.choices(list(kinds), weights=list(kinds.values()))[0]
        live = [s for s in self.snapshots if s not in self.retired and s not in self.fixed]
        pool = {"snapshot": live, "fixed": self.fixed}.get(kind)
        if pool is not None and not pool:
            kind, pool = "june", None
        if kind == "self":
            seats = [LEARNER] * n
        else:
            seats = [LEARNER] + [self.rng.choice(pool) if pool is not None else kind for _ in range(n - 1)]
            self.rng.shuffle(seats)
        game = Game(n, seed=self.rng.getrandbits(32), first=self.rng.randrange(n), variant=cfg.variant)
        bots = {q: BOTS[c](seed=self.rng.getrandbits(32)) for q, c in enumerate(seats) if c in BOTS}
        return Table(game, seats, bots, kind)

    def _advance(self, i: int, buf: Buffer) -> None:
        """Settle results and play bot turns until a network must decide; replace finished games."""
        while True:
            t = self.tables[i]
            g = t.game
            if g.over:
                for seat, k in t.last.items():
                    buf.reward[k] += g.result(seat)
                    buf.done[k] = True
                if t.kind != "self":
                    seat = t.controllers.index(LEARNER)
                    r = g.result(seat)
                    s = self.stats[t.kind]
                    s[0] += 1
                    s[1] += r == 1
                    s[2] += r == 0
                self.stats["games"][0] += 1
                self.stats["games"][1] += g.turns
                self.tables[i] = self._new_table()
                self._purge()
                continue
            controller = t.controllers[g.current]
            if controller in BOTS:
                g.step(t.bots[g.current].act(g))
                continue
            return

    def collect(self, steps: int) -> dict:
        """Play until `steps` learner decisions are recorded; return them with advantages and returns."""
        buf = Buffer(steps + 4 * len(self.tables))
        for t in self.tables:
            t.last.clear()  # chains don't cross rollouts; the previous rollout bootstrapped them
        while buf.size < steps:
            groups = defaultdict(list)
            for i in range(len(self.tables)):
                self._advance(i, buf)
                t = self.tables[i]
                groups[t.controllers[t.game.current]].append(i)
            for controller, idxs in groups.items():
                net = self.net if controller == LEARNER else self.snapshots[controller]
                games = [self.tables[i].game for i in idxs]
                legal = [g.legal() for g in games]
                x = np.stack([encode(g, g.current, l) for g, l in zip(games, legal)])
                m = np.stack([mask(l) for l in legal])
                actions, logps, values = net.act(x, m)
                for j, i in enumerate(idxs):
                    t = self.tables[i]
                    if controller == LEARNER:
                        seat = t.game.current
                        k = buf.add(x[j], m[j], actions[j], logps[j], values[j])
                        if seat in t.last:
                            buf.nxt[t.last[seat]] = k
                        t.last[seat] = k
                    t.game.step(int(actions[j]))

        # Seats still mid-game bootstrap from the value of where they stand now.
        pending = [(t, seat, k) for t in self.tables for seat, k in t.last.items() if not buf.done[k]]
        if pending:
            now = np.stack([encode(t.game, seat) for t, seat, _ in pending])
            buf.boot[[k for _, _, k in pending]] = self.net.value(now)

        n = buf.size
        adv, ret = gae(buf.reward[:n], buf.value[:n], buf.done[:n], buf.nxt[:n], buf.boot[:n],
                       self.cfg.gamma, self.cfg.lam)
        stats, self.stats = dict(self.stats), self._fresh_stats()
        return {"obs": buf.obs[:n], "mask": buf.mask[:n], "action": buf.action[:n], "logp": buf.logp[:n],
                "value": buf.value[:n], "adv": adv, "ret": ret, "stats": stats}

    def _fresh_stats(self) -> dict:
        return defaultdict(lambda: [0, 0, 0])   # kind -> [games, wins, ties]; "games" -> [games, turns]


# ---------------------------------------------------------------------- evaluation

def evaluate(net: PolicyNet, deals: int = 500, players: int = 2, opponent: str | dict = "june",
             greedy: bool = True, seed: int = 0, concurrent: int = 128, variant: str = "classic") -> dict:
    """The network against `opponent` (a bot name, or another network's weights) in duplicate: each
    deal is played once from every seat, so both sides get the same cards. Returns sums, so results
    from several workers add up: games, wins, ties and the total result (+1/0/-1 per game)."""
    rng = random.Random(seed)
    other = net_from_weights(opponent) if isinstance(opponent, dict) else None

    def games_for(deal_seed: int, first: int):
        deck = list(range(52))
        random.Random(deal_seed).shuffle(deck)
        out = []
        for seat in range(players):
            ctrl = ["opp"] * players
            ctrl[seat] = "net"
            bots = {} if other else {q: BOTS[opponent](seed=deal_seed + q) for q in range(players) if q != seat}
            out.append((Game(players, deck=deck, first=first, variant=variant, power_seed=deal_seed), seat, ctrl, bots))
        return out

    queue = []
    for _ in range(deals):
        queue.extend(games_for(rng.getrandbits(32), rng.randrange(players)))
    total = {"games": 0, "wins": 0, "ties": 0, "result": 0.0}
    active = [queue.pop() for _ in range(min(concurrent, len(queue)))]
    while active:
        deciding = {"net": [], "opp": []}
        for entry in list(active):
            g, seat, ctrl, bots = entry
            while not g.over and ctrl[g.current] == "opp" and bots:
                g.step(bots[g.current].act(g))
            if g.over:
                r = g.result(seat)
                total["games"] += 1
                total["wins"] += r == 1
                total["ties"] += r == 0
                total["result"] += r
                active.remove(entry)
                if queue:
                    active.append(queue.pop())
            else:
                deciding[ctrl[g.current]].append(g)
        for who, gs in deciding.items():
            if not gs:
                continue
            legal = [g.legal() for g in gs]
            x = np.stack([encode(g, g.current, l) for g, l in zip(gs, legal)])
            m = np.stack([mask(l) for l in legal])
            actions, _, _ = (net if who == "net" else other).act(x, m, greedy)
            for g, a in zip(gs, actions):
                g.step(int(a))
    return total


def summarize(total: dict) -> dict:
    n = max(total["games"], 1)
    win = total["wins"] / n
    # Duplicate pairs aren't independent, so this margin is a little generous.
    return {"games": total["games"], "win_rate": win, "tie_rate": total["ties"] / n,
            "mean_result": total["result"] / n, "margin95": 1.96 * np.sqrt(max(win * (1 - win), 1e-9) / n)}


# ---------------------------------------------------------------------- worker processes

def _worker(conn, cfg: SelfPlayConfig, spec: dict, seed: int) -> None:
    torch.set_num_threads(1)
    collector = Collector(cfg, PolicyNet(**spec).eval(), seed)
    while True:
        try:
            cmd, *payload = conn.recv()
        except EOFError:
            return
        if cmd == "collect":
            weights, steps = payload
            load_numpy_weights(collector.net, weights)
            conn.send(collector.collect(steps))
        elif cmd == "eval":
            weights, kwargs = payload
            net = net_from_weights(weights)
            conn.send(evaluate(net, **kwargs))
        elif cmd == "add":
            collector.add_snapshot(*payload)
        elif cmd == "drop":
            collector.drop_snapshot(*payload)
        elif cmd == "players":
            collector.cfg.players = dict(payload[0])
        elif cmd == "close":
            return


class Rollouts:
    """Collectors running in worker processes."""

    def __init__(self, workers: int, cfg: SelfPlayConfig, spec: dict, seed: int = 0):
        self.conns, self.procs = [], []
        ctx = mp.get_context("spawn")
        for w in range(workers):
            parent, child = ctx.Pipe()
            proc = ctx.Process(target=_worker, args=(child, cfg, spec, seed * 1000 + w), daemon=True)
            proc.start()
            self.conns.append(parent)
            self.procs.append(proc)

    def collect(self, weights: dict, steps: int) -> dict:
        for conn in self.conns:
            conn.send(("collect", weights, steps))
        parts = [conn.recv() for conn in self.conns]
        batch = {k: np.concatenate([p[k] for p in parts]) for k in parts[0] if k != "stats"}
        stats = defaultdict(lambda: [0, 0, 0])
        for p in parts:
            for k, v in p["stats"].items():
                stats[k] = [a + b for a, b in zip(stats[k], v)]
        batch["stats"] = dict(stats)
        return batch

    def evaluate(self, weights: dict, deals: int, seed: int, **kwargs) -> dict:
        per = -(-deals // len(self.conns))
        for w, conn in enumerate(self.conns):
            conn.send(("eval", weights, {"deals": per, "seed": seed * 7919 + w, **kwargs}))
        parts = [conn.recv() for conn in self.conns]
        return summarize({k: sum(p[k] for p in parts) for k in parts[0]})

    def add_snapshot(self, sid: int, weights: dict, fixed: bool = False) -> None:
        for conn in self.conns:
            conn.send(("add", sid, weights, fixed))

    def drop_snapshot(self, sid: int) -> None:
        for conn in self.conns:
            conn.send(("drop", sid))

    def set_players(self, weights: dict[int, float]) -> None:
        for conn in self.conns:
            conn.send(("players", weights))

    def close(self) -> None:
        for conn in self.conns:
            conn.send(("close",))
        for proc in self.procs:
            proc.join(timeout=10)
