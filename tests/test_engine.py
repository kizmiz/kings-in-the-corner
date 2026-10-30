import random

import numpy as np
import pytest

from kitc.bots import BOTS, GreedyBot, HeuristicBot, RandomBot
from kitc.encoding import OBS_SIZE, encode, mask
from kitc.engine import (CORNERS, END, MOVE, SIDES, Game, card_name, is_king, is_red, parse_card, rank)


def C(name):
    return parse_card(name)


def table(piles=None, hands=None, stock=(), players=2):
    """A game set up by hand: piles by spot name, hands per seat, the stock (top last)."""
    g = Game(players, seed=0)
    spots = ["N", "E", "S", "W", "NE", "SE", "SW", "NW"]
    g.piles = [[C(c) for c in (piles or {}).get(s, [])] for s in spots]
    g.hands = [[C(c) for c in h] for h in (hands or [[]] * players)]
    g.stock = [C(c) for c in stock]
    g.current, g.moves, g.passes, g.drew = 0, 0, 0, None
    return g


def test_cards():
    assert card_name(0) == "As" and card_name(51) == "Kc"
    assert all(parse_card(card_name(c)) == c for c in range(52))
    assert is_red(C("Th")) and is_red(C("2d")) and not is_red(C("Qs")) and not is_red(C("5c"))
    assert rank(C("Ah")) == 1 and rank(C("Kd")) == 13 and is_king(C("Ks"))


@pytest.mark.parametrize("players", [2, 3, 4])
def test_deal(players):
    for seed in range(200):
        g = Game(players, seed=seed)
        everything = sorted(c for h in g.hands for c in h) + sorted(c for p in g.piles for c in p) + g.stock
        assert sorted(everything) == list(range(52))
        assert [len(h) for h in g.hands] == [8] + [7] * (players - 1)    # the first player has drawn
        assert all(len(g.piles[s]) == 1 and not is_king(g.piles[s][0]) for s in SIDES)
        assert all(len(g.piles[s]) <= 1 for s in CORNERS)
        assert all(is_king(g.piles[s][0]) for s in CORNERS if g.piles[s])


def test_build_down_other_color():
    g = table({"N": ["9s"]}, [["8h", "8c", "7h"], []])
    legal = g.legal()
    assert C("8h") * 8 + 0 in legal          # red 8 on black 9
    assert C("8c") * 8 + 0 not in legal      # same color
    assert C("7h") * 8 + 0 not in legal      # two ranks down


def test_empty_sides_take_anything_corners_take_kings():
    g = table({"N": ["9s"], "E": ["5d"], "S": ["Jc"]}, [["2c", "Kd"], []])
    legal = g.legal()
    assert C("2c") * 8 + 3 in legal and C("Kd") * 8 + 3 in legal              # the empty west side
    assert C("2c") * 8 + 4 not in legal and C("Kd") * 8 + 4 in legal          # the NE corner


def test_moving_piles():
    g = table({"N": ["9s", "8h"], "E": ["Td"], "S": ["Kh", "Qs"]}, [["2c"], []])
    legal = g.legal()
    assert MOVE + 0 * 8 + 1 in legal          # the pile from black 9 onto red 10
    assert MOVE + 1 * 8 + 0 not in legal      # 10 doesn't go on 8
    assert MOVE + 2 * 8 + 4 in legal          # a pile from a king into an empty corner
    assert MOVE + 0 * 8 + 3 not in legal      # never just across to an empty side
    g.step(MOVE + 0 * 8 + 1)
    assert [card_name(c) for c in g.piles[1]] == ["Td", "9s", "8h"] and g.piles[0] == []
    assert C("2c") * 8 + 0 in g.legal()       # the side it left takes any card


def test_going_out_wins():
    g = table({"N": ["9s"]}, [["8h"], ["2c", "3c"]], stock=["4d"])
    g.step(C("8h") * 8 + 0)
    assert g.over and g.winners == [0] and g.reason == "out"
    assert g.result(0) == 1 and g.result(1) == -1


def test_stuck_game_fewest_cards_wins():
    g = table({"N": ["9s"], "E": ["9c"], "S": ["Ks"], "W": ["Kc"]}, [["2c", "3c"], ["4d", "5d", "6d"]])
    for _ in range(2):
        assert not g.over
        g.step(END)
    assert g.over and g.reason == "stuck" and g.winners == [0]
    assert g.result(0) == 1 and g.result(1) == -1


def test_stuck_game_same_count_ties():
    g = table({"N": ["9s"], "E": ["9c"], "S": ["Ks"], "W": ["Kc"]}, [["2c", "3c"], ["4d", "5d"]])
    g.step(END)
    g.step(END)
    assert g.over and g.winners == [0, 1] and g.result(0) == 0 and g.result(1) == 0


def test_a_move_or_a_draw_breaks_the_passes():
    # The stock still has a card: drawing it means that turn isn't a pass.
    g = table({"N": ["9s"], "E": ["9c"], "S": ["Ks"], "W": ["Kc"]}, [["2c", "3c"], ["4d", "6d", "Qd"]], stock=["5h"])
    g.step(END)                 # player 1 draws the 5h
    assert g.drew == C("5h") and not g.over
    g.step(C("Qd") * 8 + 2)     # and plays a move
    g.step(END)
    g.step(END)                 # player 0 passes
    assert not g.over
    g.step(END)                 # player 1 passes: everyone has, in a row
    assert g.over and g.winners == [0]


@pytest.mark.parametrize("players", [2, 3, 4])
def test_games_end_and_keep_every_card(players):
    rng = random.Random(players)
    for seed in range(150):
        g = Game(players, seed=seed, first=seed % players)
        bots = [rng.choice([RandomBot, GreedyBot, HeuristicBot])(seed=seed + q) for q in range(players)]
        while not g.over:
            a = bots[g.current].act(g)
            assert a in g.legal()
            g.step(a)
            everything = [c for h in g.hands for c in h] + [c for p in g.piles for c in p] + g.stock
            assert sorted(everything) == list(range(52))
        assert g.turns < 1000 and g.winners
        if g.reason == "out":
            assert any(not h for h in g.hands)


def test_observation_hides_what_the_seat_cannot_see():
    """The encoding for a seat doesn't change when the others' cards or the stock change."""
    rng = random.Random(7)
    for seed in range(100):
        g = Game(2, seed=seed)
        bots = [GreedyBot(seed=1), GreedyBot(seed=2)]
        for _ in range(rng.randrange(0, 40)):
            if g.over:
                break
            g.step(bots[g.current].act(g))
        if g.over:
            continue
        seat = g.current
        x = encode(g, seat)
        # Swap hidden cards between the other hand and the stock.
        other = g.hands[1 - seat]
        if other and g.stock:
            h = g.copy()
            hidden = h.hands[1 - seat] + h.stock
            rng.shuffle(hidden)
            k = len(h.hands[1 - seat])
            h.hands[1 - seat], h.stock = hidden[:k], hidden[k:]
            assert np.array_equal(encode(h, seat), x)
        assert x.shape == (OBS_SIZE,)


def test_mask_matches_legal():
    g = Game(3, seed=11)
    m = mask(g.legal())
    assert set(np.flatnonzero(m)) == set(g.legal()) and m[END]


def test_heuristic_never_leaves_a_side_empty_when_it_can_fill_it():
    g = table({"N": ["9s"], "E": ["9c"], "S": ["Ks"]}, [["2c", "3h", "5d"], ["4d", "5c"]])
    bot = HeuristicBot()
    while True:
        a = bot.act(g)
        g.step(a)
        if a == END or g.over:
            break
    assert all(g.piles[s] for s in SIDES)


def test_bots_registry():
    assert set(BOTS) == {"pip", "ray", "june"}


# ---------------------------------------------------------------------- Demons in the Corner

def demons(piles=None, hands=None, stock=(), players=2):
    g = table(piles, hands, stock, players)
    g.variant = "demons"
    return g


def valid_pile(p):
    from kitc.engine import FITS
    return all(FITS[b][a] for a, b in zip(p, p[1:]))


def test_red_demon_trades_hands():
    g = demons({"N": ["9s"]}, [["Kh", "2c", "3c", "4c"], ["5d"]], stock=["7h"])
    g.step(C("Kh") * 8 + 4)
    assert [card_name(c) for c in g.hands[0]] == ["5d"]
    assert sorted(card_name(c) for c in g.hands[1]) == ["2c", "3c", "4c"]
    assert g.last_power == {"demon": C("Kh"), "kind": "swap", "by": 0, "with": 1} and g.powers == 1
    assert not g.over and g.current == 0          # and the turn goes on with the new hand


def test_classic_kings_have_no_power():
    g = table({"N": ["9s"]}, [["Kh", "2c", "3c"], ["5d"]])
    g.step(C("Kh") * 8 + 4)
    assert sorted(card_name(c) for c in g.hands[0]) == ["2c", "3c"] and g.powers == 0


def test_a_demon_on_a_side_or_as_the_last_card_does_nothing():
    g = demons({"N": ["9s"], "E": ["5c"], "S": ["Jd"]}, [["Kd", "2c"], ["5d"]])
    g.step(C("Kd") * 8 + 3)                       # onto the empty west side
    assert g.powers == 0 and len(g.hands[0]) == 1
    g = demons({"N": ["9s"]}, [["Kd"], ["5d", "6d"]])
    g.step(C("Kd") * 8 + 4)                       # the last card: a win, no trade
    assert g.over and g.winners == [0] and g.powers == 0


def test_black_demon_redeals_the_sides_into_legal_piles():
    for seed in range(50):
        g = demons({"N": ["Qd", "Jc", "Th"], "E": ["9s", "8h", "7c"], "S": ["6d", "5s"], "NE": ["Kh"]},
                   [["Ks", "2c"], ["5d"]])
        g.rng.state = seed
        before = sorted(c for s in SIDES for c in g.piles[s])
        g.step(C("Ks") * 8 + 5)
        assert g.last_power["kind"] == "rebuild" and g.last_power["changed"]
        assert sorted(c for s in SIDES for c in g.piles[s]) == before
        assert [bool(g.piles[s]) for s in SIDES] == [True, True, True, False]   # same sides, same count
        assert all(valid_pile(g.piles[s]) for s in SIDES)
        assert [card_name(c) for c in g.piles[4]] == ["Kh"]                     # corners stay


def test_demon_games_end_and_keep_every_card():
    for seed in range(150):
        g = Game(seed % 3 + 2, seed=seed, variant="demons")
        bots = [HeuristicBot(seed=q) if q % 2 else GreedyBot(seed=q) for q in range(g.n)]
        while not g.over:
            a = bots[g.current].act(g)
            assert a in g.legal()
            g.step(a)
            everything = [c for h in g.hands for c in h] + [c for p in g.piles for c in p] + g.stock
            assert sorted(everything) == list(range(52))
            assert all(valid_pile(p) for p in g.piles)


ACE_TO_KING = ["As", "2h", "3d", "4c", "5s", "6h", "7d", "8c", "9s", "Th", "Jd", "Qc", "Ks"]


def test_kamikaze_ace_to_king_wins_outright_in_match_play():
    # Playing the spare card off leaves ace to king, one of each: an outright win.
    g = table(piles={"N": ["9h"]}, hands=[ACE_TO_KING + ["8s"], ["2c"]])
    g.kamikaze = True
    g.step(C("8s") * 8 + 0)
    assert g.over and g.winners == [0] and g.reason == "kamikaze"
    # Not in a single game, and not with a rank twice.
    g = table(piles={"N": ["9h"]}, hands=[ACE_TO_KING + ["8s"], ["2c"]])
    g.step(C("8s") * 8 + 0)
    assert not g.over
    g = table(piles={"N": ["9h"]}, hands=[ACE_TO_KING[:-1] + ["8h", "8s"], ["2c"]])
    g.kamikaze = True
    g.step(C("8s") * 8 + 0)
    assert not g.over


def test_kamikaze_can_come_with_the_draw():
    g = table(hands=[["5c"], ACE_TO_KING[:-1]], stock=["Kd"])
    g.kamikaze = True
    g.step(END)
    assert g.over and g.winners == [1] and g.reason == "kamikaze"
