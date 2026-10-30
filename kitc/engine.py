"""Kings in the Corner: the game state machine.

Cards are ints 0..51: suit * 13 + rank - 1, with rank 1 (ace) to 13 (king) and suits in the order
spades, hearts, diamonds, clubs. Hearts and diamonds are red.

The table has eight places ("spots"): the four sides of the cross, N E S W (0-3), and the four
corners NE SE SW NW (4-7). Everyone gets seven cards; four more are turned up, one on each side
(a king turned up goes to a corner and the side gets the next card).

A turn: draw one card from the stock (if any is left), then make any number of moves, then end the
turn. A move is
  play   a card from your hand onto a pile whose top card is one rank higher and the other color,
         or onto an empty side (any card), or an empty corner (kings only);
  move   a whole pile from a side onto another pile its first card fits, or, if that first card is a
         king, into an empty corner. The side it left is empty.
Whoever plays their last card wins. Once the stock is out, a turn with no move is a pass, and when
every player passes in a row the game ends: the fewest cards in hand wins, and players who share the
fewest tie.

Devils in the Corner (variant "demons") is the same game with the kings turned into devils. A devil
played from the hand straight into a corner unleashes its power (a devil dealt to a corner, played
on an empty side or moved there with its pile does nothing):
  red devil (hearts, diamonds)     its player trades hands with a rival (heads-up, the other player;
                                  at a bigger table, one at random) and plays on with the new hand
  black devil (spades, clubs)     the cards on the sides are dealt into new piles at random: the same
                                  number of piles on the same sides, each still building down in
                                  alternating colors
Playing a devil as your last card wins; nothing is swapped. The powers draw from `Rng32`, which the
app's engine (web/engine/game.js) implements bit for bit, so a replay gives the same table.

Moves are action ids, the same ones the network chooses between (see kitc/encoding.py):
  card * 8 + spot             play `card` onto `spot`               0 .. 415
  MOVE + side * 8 + spot      move the pile on `side` onto `spot`   416 .. 447
  END                         end the turn                          448
"""

from __future__ import annotations

import random

SUITS = "shdc"
RANKS = "A23456789TJQK"
SPOTS = ("N", "E", "S", "W", "NE", "SE", "SW", "NW")
SIDES = (0, 1, 2, 3)
CORNERS = (4, 5, 6, 7)
HAND_SIZE = 7
MAX_PLAYERS = 4

MOVE = 52 * 8
END = MOVE + 4 * 8
NUM_ACTIONS = END + 1

VARIANTS = ("classic", "demons")


class Rng32:
    """mulberry32: a small 32-bit generator, written the same way in web/engine/game.js."""

    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF

    def random(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.state
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    def below(self, n: int) -> int:
        return int(self.random() * n)


def rebuild_piles(cards: list[int], k: int, rng: Rng32, tries: int = 60) -> list[list[int]] | None:
    """`cards` dealt into exactly `k` random piles that each build down in alternating colors, or None
    if no attempt found a way. Each attempt shuffles the cards, takes them from the highest rank down
    and puts each on a random pile it fits or, while fewer than `k` piles exist, a new pile."""
    for _ in range(tries):
        order = list(cards)
        for i in range(len(order) - 1, 0, -1):
            j = rng.below(i + 1)
            order[i], order[j] = order[j], order[i]
        order.sort(key=lambda c: -rank(c))      # stable: the shuffle breaks ties
        piles: list[list[int]] = []
        for c in order:
            options = [i for i, p in enumerate(piles) if FITS[c][p[-1]]]
            n = len(options) + (len(piles) < k)
            if n == 0:
                break
            j = rng.below(n)
            if j < len(options):
                piles[options[j]].append(c)
            else:
                piles.append([c])
        else:
            if len(piles) == k:
                return piles
    return None


# A cap on turns, far above any real game, so a bug can't loop forever: the game then ends as if
# everyone had passed.
MAX_TURNS = 1000


def rank(card: int) -> int:
    return card % 13 + 1


def is_red(card: int) -> bool:
    return 13 <= card < 39


def is_king(card: int) -> bool:
    return card % 13 == 12


def kamikaze_hand(hand: list[int]) -> bool:
    """Thirteen cards, ace to king, one of each rank: in match play, an outright win."""
    return len(hand) == 13 and len({rank(c) for c in hand}) == 13


def card_name(card: int) -> str:
    return RANKS[card % 13] + SUITS[card // 13]


def parse_card(name: str) -> int:
    return SUITS.index(name[1]) * 13 + RANKS.index(name[0])


# FITS[card][top]: `card` can go on `top` (one rank lower, the other color).
FITS = [[rank(c) == rank(t) - 1 and is_red(c) != is_red(t) for t in range(52)] for c in range(52)]
# The two cards that go on each card (none on an ace).
FITTERS = [[c for c in range(52) if FITS[c][t]] for t in range(52)]


def describe(action: int) -> str:
    if action == END:
        return "end"
    if action >= MOVE:
        side, spot = divmod(action - MOVE, 8)
        return f"move {SPOTS[side]}->{SPOTS[spot]}"
    card, spot = divmod(action, 8)
    return f"play {card_name(card)}->{SPOTS[spot]}"


class Game:
    """One game. `current` is the player to move; `legal()` lists their moves and `step(a)` makes one.

    Everything here is public except the stock's order and the hands; a player's view of the game is
    `hands[seat]` plus the rest (kitc/encoding.py reads only that). `last_open[q]` is what player q
    left unplayed: the cards that had somewhere to go when q ended their latest turn (q held them or
    not; everyone saw the table).
    """

    def __init__(self, players: int = 2, seed: int | None = None, first: int = 0,
                 deck: list[int] | None = None, variant: str = "classic", power_seed: int | None = None,
                 kamikaze: bool = False):
        assert 2 <= players <= MAX_PLAYERS and variant in VARIANTS
        self.n = players
        self.variant = variant
        self.kamikaze = kamikaze        # match play: a hand of ace to king, one of each, wins outright
        shuffle = random.Random(seed)
        if deck is None:
            deck = list(range(52))
            shuffle.shuffle(deck)
        self.power_seed = shuffle.getrandbits(32) if power_seed is None else power_seed
        self.rng = Rng32(self.power_seed)
        self.powers = 0                 # demon powers unleashed so far
        self.last_power: dict | None = None
        self.deck = list(deck)          # the shuffled order, top of the stock last, kept for replays
        stock = list(deck)
        self.hands: list[list[int]] = [[] for _ in range(players)]
        for _ in range(HAND_SIZE):
            for q in range(players):
                self.hands[q].append(stock.pop())
        self.piles: list[list[int]] = [[] for _ in range(8)]
        for side in SIDES:
            while True:
                card = stock.pop()
                if is_king(card):
                    self.piles[next(s for s in CORNERS if not self.piles[s])].append(card)
                    continue
                self.piles[side].append(card)
                break
        self.stock = stock
        self.current = first
        self.turns = 0
        self.passes = 0                 # turns in a row with no move, once the stock is out
        self.moves = 0                  # moves made this turn
        self.drew: int | None = None    # the card drawn this turn (None once the stock is out)
        self.over = False
        self.winners: list[int] = []
        self.reason = ""                # "out" (someone played their last card), "stuck" (all passed) or "kamikaze"
        self.last_open: list[set[int]] = [set() for _ in range(players)]
        self._start_turn()

    # ------------------------------------------------------------------ rules

    def legal(self) -> list[int]:
        if self.over:
            return []
        piles = self.piles
        tops = [p[-1] if p else -1 for p in piles]
        acts = []
        for card in self.hands[self.current]:
            fits = FITS[card]
            king = is_king(card)
            base = card * 8
            for spot in range(8):
                t = tops[spot]
                if t < 0:
                    if spot < 4 or king:
                        acts.append(base + spot)
                elif fits[t]:
                    acts.append(base + spot)
        for side in SIDES:
            if not piles[side]:
                continue
            first = piles[side][0]
            fits = FITS[first]
            king = is_king(first)
            for spot in range(8):
                if spot == side:
                    continue
                t = tops[spot]
                if t < 0:
                    if spot >= 4 and king:
                        acts.append(MOVE + side * 8 + spot)
                elif fits[t]:
                    acts.append(MOVE + side * 8 + spot)
        acts.append(END)
        return acts

    def step(self, action: int) -> None:
        assert not self.over, "the game is over"
        if action == END:
            self._end_turn()
            return
        if action >= MOVE:
            side, spot = divmod(action - MOVE, 8)
            self.piles[spot].extend(self.piles[side])
            self.piles[side] = []
        else:
            card, spot = divmod(action, 8)
            hand = self.hands[self.current]
            hand.remove(card)
            self.piles[spot].append(card)
            if not hand:
                self.over = True
                self.winners = [self.current]
                self.reason = "out"
            elif self.variant == "demons" and spot >= 4 and is_king(card):
                self._unleash(card)
        self.moves += 1
        self._check_kamikaze()

    def _check_kamikaze(self) -> None:
        if not self.kamikaze or self.over:
            return
        q = next((p for p in range(self.n) if kamikaze_hand(self.hands[p])), None)
        if q is not None:
            self.over = True
            self.winners = [q]
            self.reason = "kamikaze"

    def _unleash(self, demon: int) -> None:
        q = self.current
        if is_red(demon):
            rivals = [p for p in range(self.n) if p != q]
            r = rivals[self.rng.below(len(rivals))]
            self.hands[q], self.hands[r] = self.hands[r], self.hands[q]
            self.last_power = {"demon": demon, "kind": "swap", "by": q, "with": r}
        else:
            sides = [s for s in SIDES if self.piles[s]]
            cards = [c for s in sides for c in self.piles[s]]
            piles = rebuild_piles(cards, len(sides), self.rng)
            if piles is not None:
                for s, p in zip(sides, piles):
                    self.piles[s] = p
            self.last_power = {"demon": demon, "kind": "rebuild", "by": q, "changed": piles is not None}
        self.powers += 1

    def open_cards(self) -> set[int]:
        """Every card that has somewhere to go right now (whoever holds it)."""
        tops = [p[-1] for p in self.piles if p]
        if any(not self.piles[s] for s in SIDES):
            return set(range(52))
        cards = {c for t in tops for c in FITTERS[t]}
        if any(not self.piles[s] for s in CORNERS):
            cards |= {12, 25, 38, 51}
        return cards

    def _start_turn(self) -> None:
        self.moves = 0
        self.turns += 1
        if self.stock:
            self.drew = self.stock.pop()
            self.hands[self.current].append(self.drew)
        else:
            self.drew = None
        self._check_kamikaze()

    def _end_turn(self) -> None:
        q = self.current
        self.last_open[q] = self.open_cards()
        self.passes = self.passes + 1 if self.drew is None and self.moves == 0 else 0
        if self.passes >= self.n or self.turns >= MAX_TURNS:
            fewest = min(len(h) for h in self.hands)
            self.over = True
            self.winners = [p for p in range(self.n) if len(self.hands[p]) == fewest]
            self.reason = "stuck"
            return
        self.current = (q + 1) % self.n
        self._start_turn()

    # ------------------------------------------------------------------ results

    def result(self, seat: int) -> float:
        """+1 for winning alone, 0 for a tie among the fewest cards, -1 otherwise."""
        if seat not in self.winners:
            return -1.0
        return 1.0 if len(self.winners) == 1 else 0.0

    def copy(self) -> Game:
        g = Game.__new__(Game)
        g.__dict__.update(self.__dict__)
        g.hands = [list(h) for h in self.hands]
        g.piles = [list(p) for p in self.piles]
        g.stock = list(self.stock)
        g.winners = list(self.winners)
        g.last_open = [set(s) for s in self.last_open]
        g.rng = Rng32(self.rng.state)
        return g
