"""The app's family can't see your cards: their moves don't change when the other hands and the stock
are shuffled together and dealt back out (tests/js_hidden.mjs)."""

import json
import shutil
import subprocess
from pathlib import Path

import pytest


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_the_family_plays_the_same_whatever_you_hold():
    out = subprocess.run(["node", str(Path(__file__).with_name("js_hidden.mjs")), "300"],
                         capture_output=True, text=True, check=True)
    result = json.loads(out.stdout)
    assert min(result["counts"].values()) > 500
    assert result["changed"] == []
