"""Match play in the app: scoring hands, 50 dropping to 25, over 50 losing, Kamikaze (tests/js_match.mjs)."""

import shutil
import subprocess
from pathlib import Path

import pytest


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node")
def test_match_play_in_the_app():
    out = subprocess.run(["node", str(Path(__file__).with_name("js_match.mjs"))], capture_output=True, text=True)
    assert out.returncode == 0, out.stderr
    assert out.stdout.strip() == "ok"
