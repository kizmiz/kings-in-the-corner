"""The family: rule-based players, from the weakest to the strongest. Nana, the trained agent, is
in kitc/policy.py.

  Pip        RandomBot     picks among the cards it can play and ending the turn, at random
  Uncle Ray  GreedyBot     plays every card it can, in no particular order
  Aunt June  HeuristicBot  plans the whole turn: searches every order of moves and keeps the one that
                           leaves the fewest cards in hand, the fewest empty sides for the next player
                           and the fewest cards the others are likely to hold a place for

In Devils in the Corner June plays a red devil (which trades hands) when the rival's hand is the
smaller prize to take, and treats a black devil (which redeals the sides) like any king; either
way she plans again once the power has changed the table.

A bot only reads what its seat may know: its own hand and the table (kitc/engine.py, Game).
"""

from __future__ import annotations

import random

from .engine import CORNERS, END, FITS, FITTERS, MOVE, SIDES, Game, is_king, is_red

KINGS = (12, 25, 38, 51)


class RandomBot:
    name = "pip"

    def __init__(self, seed: int | None = None):
        self.rng = random.Random(seed)

    def act(self, game: Game) -> int:
        plays = [a for a in game.legal() if a < MOVE]
        return self.rng.choice(plays + [END])


class GreedyBot:
    name = "ray"

    def __init__(self, seed: int | None = None):
        self.rng = random.Random(seed)

    def act(self, game: Game) -> int:
        legal = game.legal()
        plays = [a for a in legal if a < MOVE]
        if plays:
            return self.rng.choice(plays)
        # A pile move only when it opens a play for a card in hand.
        for a in legal:
            if MOVE <= a < END:
                g = game.copy()
                g.step(a)
                if any(b < MOVE for b in g.legal()):
                    return a
        return END


# ---------------------------------------------------------------------- Aunt June's planner

# Measured heads-up over 4,000 games each: with these weights June beats Ray 78% of the time, and a
# June that only counts cards (both weights 0) 51%. Giving nothing away matters more than speed:
# an empty side is worth twelve cards in hand to her.
EMPTY_SIDE = 12.0    # an empty side left for the next player: they can drop any card there
THREAT = 4.0         # per card the others may hold that would have somewhere to go
NODES = 4000         # search budget per turn


class HeuristicBot:
    name = "june"

    def __init__(self, seed: int | None = None, nodes: int = NODES, empty_side: float = EMPTY_SIDE,
                 threat: float = THREAT):
        self.rng = random.Random(seed)
        self.nodes = nodes
        self.empty_side = empty_side
        self.threat = threat
        self.plan: list[int] = []
        self.key = None

    def act(self, game: Game) -> int:
        # The turn's plan holds while nothing but its own moves has happened since.
        key = (id(game), game.turns, game.current, game.moves, game.powers)
        if not self.plan or key != self.key:
            self.plan = self._search(game)
        a = self.plan.pop(0)
        self.key = key[:3] + (game.moves + 1, game.powers)
        return a

    # The search works on (hand as a bitmask, the eight piles as (first, top) or None).
    def _search(self, game: Game) -> list[int]:
        seat = game.current
        hand = 0
        for c in game.hands[seat]:
            hand |= 1 << c
        piles = tuple((p[0], p[-1]) if p else None for p in game.piles)
        table = 0
        for p in game.piles:
            for c in p:
                table |= 1 << c
        self.start_hand = hand
        self.start_table = table
        # The others' chances of holding a given card, from what can't be seen.
        others = [q for q in range(game.n) if q != seat]
        unseen = 52 - bin(hand).count("1") - bin(table).count("1")
        draw = 1 if game.stock else 0
        held = sum(len(game.hands[q]) + draw for q in others)
        self.p_held = min(1.0, held / unseen) if unseen else 0.0
        # The next player passed these up last turn, so they probably don't hold them (bar the draw).
        nxt = (seat + 1) % game.n
        self.declined = 0
        for c in game.last_open[nxt]:
            self.declined |= 1 << c
        self.urgency = 1.0 + (2.0 if min(len(game.hands[q]) for q in others) <= 2 else 0.0)
        self.demons = game.variant == "demons"
        self.rival_cards = sum(len(game.hands[q]) for q in others) / len(others)

        self.budget = self.nodes
        self.memo: dict = {}
        _, path = self._best(hand, piles)
        return path + [END]

    def _best(self, hand: int, piles: tuple) -> tuple[float, list[int]]:
        key = (hand, piles)
        if key in self.memo:
            return self.memo[key]
        best = (self._score(hand, piles), [])
        if hand and self.budget > 0:
            self.budget -= 1
            for a, h2, p2 in self._moves(hand, piles):
                if self.demons and a < MOVE and a % 8 >= 4 and is_king(a // 8) and h2:
                    # A power: the search can't see past it, so it ends the plan here.
                    score, path = self._demon(a // 8, h2, p2), []
                else:
                    score, path = self._best(h2, p2)
                if score > best[0]:
                    best = (score, [a] + path)
                    if h2 == 0:
                        break
        self.memo[key] = best
        return best

    def _moves(self, hand: int, piles: tuple):
        empty_side = next((s for s in SIDES if piles[s] is None), None)
        empty_corner = next((s for s in CORNERS if piles[s] is None), None)
        h = hand
        while h:
            c = (h & -h).bit_length() - 1
            h &= h - 1
            for s in range(8):
                p = piles[s]
                if p is None:
                    ok = s == empty_side or (s == empty_corner and is_king(c))
                    new = (c, c)
                else:
                    ok = FITS[c][p[1]]
                    new = (p[0], c)
                if ok:
                    yield c * 8 + s, hand & ~(1 << c), piles[:s] + (new,) + piles[s + 1:]
        for side in SIDES:
            p = piles[side]
            if p is None:
                continue
            for s in range(8):
                if s == side:
                    continue
                q = piles[s]
                if q is None:
                    if s != empty_corner or not is_king(p[0]):
                        continue
                    new = p
                elif FITS[p[0]][q[1]]:
                    new = (q[0], p[1])
                else:
                    continue
                lst = list(piles)
                lst[s] = new
                lst[side] = None
                yield MOVE + side * 8 + s, hand, tuple(lst)

    def _demon(self, demon: int, hand: int, piles: tuple) -> float:
        if not is_red(demon):
            return self._score(hand, piles)
        # Trading hands: she ends up holding the rival's count and the rival hers.
        mine = bin(hand).count("1")
        return mine - 2 * self.rival_cards

    def _score(self, hand: int, piles: tuple) -> float:
        cards = bin(hand).count("1")
        if cards == 0:
            return 1000.0
        table = self.start_table | (self.start_hand & ~hand)
        empty_sides = sum(piles[s] is None for s in SIDES)
        score = -cards - self.empty_side * empty_sides * self.urgency
        if empty_sides:
            return score
        # Cards with somewhere to go that someone else might hold.
        open_ = 0
        for p in piles:
            if p is not None:
                for c in FITTERS[p[1]]:
                    open_ |= 1 << c
        if any(piles[s] is None for s in CORNERS):
            for k in KINGS:
                open_ |= 1 << k
        open_ &= ~(hand | table)
        likely = bin(open_ & ~self.declined).count("1") + 0.25 * bin(open_ & self.declined).count("1")
        return score - self.threat * self.p_held * likely * self.urgency


BOTS = {"pip": RandomBot, "ray": GreedyBot, "june": HeuristicBot}
