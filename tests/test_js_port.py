"""The app's engine (web/engine/*.js) against the Python one: the same games, move for move."""

import json
import random
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pytest

from kitc.bots import GreedyBot, HeuristicBot, RandomBot
from kitc.encoding import OBS_SIZE, encode, mask
from kitc.engine import NUM_ACTIONS, Game
from kitc.policy import LAYERS, NumpyPolicy, export_bin, read_bin

ROOT = Path(__file__).resolve().parent.parent
pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="needs node")


def record(players, variant, seed, with_obs=True):
    rng = random.Random(seed)
    g = Game(players, seed=seed, first=seed % players, variant=variant)
    kinds = [rng.choice(["june", "june", "ray", "pip"]) for _ in range(players)]
    make = {"june": HeuristicBot, "ray": GreedyBot, "pip": RandomBot}
    bots = [make[k](seed=seed + q) for q, k in enumerate(kinds)]
    rec = {"players": players, "deck": g.deck, "first": g.current, "variant": variant,
           "power_seed": g.power_seed, "steps": []}
    while not g.over:
        step = {"legal": sorted(g.legal())}
        if with_obs:
            step["obs"] = [float(v) for v in encode(g, g.current)]
        a = bots[g.current].act(g)
        step["action"] = a
        step["june"] = kinds[g.current] == "june"
        g.step(a)
        step["powers"] = g.powers
        rec["steps"].append(step)
    rec["end"] = {"over": g.over, "winners": g.winners, "reason": g.reason, "hands": g.hands, "piles": g.piles}
    return rec


def replay(payload):
    out = subprocess.run(["node", str(ROOT / "tests" / "js_replay.mjs")], input=json.dumps(payload),
                         capture_output=True, text=True, cwd=ROOT, check=True)
    return json.loads(out.stdout)


@pytest.mark.parametrize("variant", ["classic", "demons"])
def test_games_replay_the_same_in_the_app(variant):
    games = [record(seed % 3 + 2, variant, seed, with_obs=seed < 12) for seed in range(60)]
    result = replay({"games": games})
    assert result["problems"] == []
    assert result["steps"] == sum(len(g["steps"]) for g in games)
    assert result["juneMoves"] > 100


def test_demon_powers_come_up_in_the_replays():
    games = [record(2, "demons", seed, with_obs=False) for seed in range(60)]
    assert sum(g["steps"][-1]["powers"] for g in games) > 10


def test_the_network_scores_moves_the_same_in_the_app(tmp_path):
    rng = np.random.default_rng(0)
    sizes = [OBS_SIZE, 64, 64, 32, NUM_ACTIONS]
    weights = {}
    for name, (i, o) in zip(LAYERS, zip(sizes, sizes[1:])):
        weights[f"{name}.weight"] = rng.normal(0, 0.3, (o, i)).astype(np.float32)
        weights[f"{name}.bias"] = rng.normal(0, 0.1, o).astype(np.float32)
    path = tmp_path / "net.bin"
    export_bin(NumpyPolicy(weights), path)
    policy = NumpyPolicy(read_bin(path))          # what the app reads: weights rounded to 16 bits
    cases = []
    for seed in range(8):
        g = Game(2 + seed % 3, seed=seed, variant="demons" if seed % 2 else "classic")
        legal = g.legal()
        cases.append({"obs": [float(v) for v in encode(g, g.current, legal)], "mask": [int(v) for v in mask(legal)]})
    result = replay({"games": [], "policy": {"path": str(path), "cases": cases}})
    for case, js in zip(cases, result["policy"]):
        py = policy.logits(np.array(case["obs"], np.float32), np.array(case["mask"], bool))
        legal = np.flatnonzero(case["mask"])
        assert np.allclose(np.array(js)[legal], py[legal], atol=1e-3)
        assert int(np.argmax(np.array(js))) == int(np.argmax(py))
