"""What the agent sees: one seat's view of the game as a vector of floats, and which moves it may make.

Besides the raw view, a few counts spell out what June (kitc/bots.py) reasons about: for each card
in hand, how many piles it fits, whether playing it opens a place for cards the others may hold or
covers one, and whether its follow-up is in hand; and how many unseen cards have somewhere to go.

Only what that seat may know goes in: its own hand, everything on the table, how many cards each
player holds and the stock has, and what each other player left unplayed at the end of their latest
turn (the cards that had a place to go then; a player who held one would usually have played it).

The moves are the engine's action ids (kitc/engine.py), so the network's outputs need no translation.
"""

from __future__ import annotations

import numpy as np

from .engine import CORNERS, END, FITS, FITTERS, MAX_PLAYERS, MOVE, NUM_ACTIONS, SIDES, Game, is_king, rank

HAND, TABLE, UNSEEN, DECLINED = 0, 52, 104, 156          # 52 cards each; DECLINED has one block per other seat
SPOTS = DECLINED + 52 * (MAX_PLAYERS - 1)                # 8 spots of SPOT_SIZE
SPOT_SIZE = 33
SEATS = SPOTS + 8 * SPOT_SIZE                            # 4 seats of SEAT_SIZE, from this one round the table
SEAT_SIZE = 5
GLOBAL = SEATS + MAX_PLAYERS * SEAT_SIZE
EXTRA = GLOBAL + 11                                      # threat counts and the demons
EXTRA_SIZE = 6
CARDS = EXTRA + EXTRA_SIZE                               # 52 cards of CARD_SIZE, for the cards in hand
CARD_SIZE = 5
OBS_SIZE = CARDS + 52 * CARD_SIZE

KINGS = (12, 25, 38, 51)


def twin(c: int) -> int:
    """The other card of the same rank and color: it goes on the same cards."""
    return (3 - c // 13) * 13 + c % 13

STOCK_CARDS = 52 - 2 * 7 - 4


def encode(g: Game, seat: int, legal: list[int] | None = None) -> np.ndarray:
    """`legal`, the seat's moves if it is to move (saves listing them again)."""
    x = np.zeros(OBS_SIZE, np.float32)
    hand = g.hands[seat]
    mine = set(hand)
    table = set()
    for p in g.piles:
        table.update(p)
    for c in hand:
        x[HAND + c] = 1
    for c in table:
        x[TABLE + c] = 1
    unseen = [c for c in range(52) if c not in mine and c not in table]
    for c in unseen:
        x[UNSEEN + c] = 1
    for k in range(1, g.n):
        q = (seat + k) % g.n
        base = DECLINED + 52 * (k - 1)
        declined = g.last_open[q]
        for c in unseen:
            if c in declined:
                x[base + c] = 1

    tops = [p[-1] if p else -1 for p in g.piles]
    for s, p in enumerate(g.piles):
        o = SPOTS + s * SPOT_SIZE
        if not p:
            x[o] = 1
            continue
        top, first = p[-1], p[0]
        x[o + rank(top)] = 1
        x[o + 14] = 13 <= top < 39
        x[o + 14 + rank(first)] = 1
        x[o + 28] = 13 <= first < 39
        x[o + 29] = len(p) / 13
        fit = FITTERS[top]
        x[o + 30] = sum(c in mine for c in fit) / 2
        x[o + 31] = sum(c not in mine and c not in table for c in fit) / 2
        if s in SIDES:
            x[o + 32] = any(t >= 0 and j != s and first in FITTERS[t] for j, t in enumerate(tops)) or (
                is_king(first) and any(tops[c] < 0 for c in CORNERS))

    for k in range(MAX_PLAYERS):
        o = SEATS + k * SEAT_SIZE
        if k >= g.n:
            continue
        n = len(g.hands[(seat + k) % g.n])
        x[o] = 1
        x[o + 1] = n / 15
        x[o + 2] = n == 1
        x[o + 3] = n == 2
        x[o + 4] = n >= 10

    o = GLOBAL
    x[o] = len(g.stock) / STOCK_CARDS
    x[o + 1] = not g.stock
    x[o + 2] = g.passes / g.n
    x[o + 3] = min(g.moves, 20) / 10
    x[o + 4] = g.drew is not None
    x[o + 5 + g.n - 2] = 1
    x[o + 8] = sum(not g.piles[s] for s in SIDES) / 4
    x[o + 9] = sum(not g.piles[s] for s in CORNERS) / 4
    if g.current == seat:
        legal = g.legal() if legal is None else legal
        x[o + 10] = sum(a < MOVE for a in legal) / 10

    # What the others could play right now, and the demons still out there.
    unseen_set = set(unseen)
    open_now = set(range(52)) if any(t < 0 for t in tops[:4]) else {c for t in tops if t >= 0 for c in FITTERS[t]}
    if any(tops[s] < 0 for s in CORNERS):
        open_now |= set(KINGS)
    threats = open_now & unseen_set
    declined_next = g.last_open[(seat + 1) % g.n]
    o = EXTRA
    x[o] = len(threats) / 10
    x[o + 1] = len(threats - declined_next) / 10
    x[o + 2] = (len(g.hands[(seat + 1) % g.n]) - len(hand)) / 10
    x[o + 3] = g.variant == "demons"
    x[o + 4] = sum(k in unseen_set for k in (25, 38)) / 2
    x[o + 5] = sum(k in unseen_set for k in (12, 51)) / 2

    live = [t for t in tops if t >= 0]
    for c in hand:
        o = CARDS + c * CARD_SIZE
        x[o] = sum(FITS[c][t] for t in live) / 4
        fit = FITTERS[c]
        x[o + 1] = sum(f in unseen_set for f in fit) / 2
        x[o + 2] = sum(f in mine for f in fit) / 2
        w = twin(c)
        x[o + 3] = w in unseen_set
        x[o + 4] = w in mine
    return x


def mask(legal: list[int]) -> np.ndarray:
    m = np.zeros(NUM_ACTIONS, bool)
    m[legal] = True
    return m


def observe(g: Game) -> tuple[np.ndarray, np.ndarray]:
    """The player to move's view and legal-move mask."""
    legal = g.legal()
    return encode(g, g.current, legal), mask(legal)


__all__ = ["OBS_SIZE", "NUM_ACTIONS", "END", "encode", "mask"]
