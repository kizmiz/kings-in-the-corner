"""Nana in plain numpy, and her weights for the app.

Training uses PyTorch (kitc/model.py). A checkpoint exported here plays the same moves without it:

    python -m kitc.policy runs/p1/checkpoints/best.pt web/agents/nana-classic.bin
    python -m kitc.policy runs/p1/checkpoints/best.pt nana.npz
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import numpy as np

from .encoding import encode, mask
from .engine import Game

# The linear layers on the way from observation to move scores, with a ReLU between each pair.
LAYERS = ("trunk.0", "trunk.2", "pi.0", "pi.2")


class NumpyPolicy:
    """Move scores from a trained network's weights: the same numbers PolicyNet gives, in numpy."""

    def __init__(self, weights: dict[str, np.ndarray]):
        self.layers = [(np.ascontiguousarray(np.asarray(weights[f"{name}.weight"], np.float32).T),
                        np.asarray(weights[f"{name}.bias"], np.float32)) for name in LAYERS]

    def logits(self, obs: np.ndarray, m: np.ndarray) -> np.ndarray:
        h = np.asarray(obs, np.float32)
        for i, (w, b) in enumerate(self.layers):
            h = h @ w + b
            if i < len(self.layers) - 1:
                h = np.maximum(h, 0)
        return np.where(m, h, np.float32(-1e9))


class NumpyBot:
    """Nana at the table: always her top-rated move."""

    name = "nana"

    def __init__(self, policy: NumpyPolicy):
        self.policy = policy

    def act(self, game: Game) -> int:
        legal = game.legal()
        return int(np.argmax(self.policy.logits(encode(game, game.current, legal), mask(legal))))


def load(path: str | Path) -> NumpyPolicy:
    """A policy from an exported .npz or .bin, or from a PyTorch checkpoint (.pt, needs PyTorch)."""
    path = Path(path)
    if path.suffix == ".npz":
        with np.load(path) as f:
            return NumpyPolicy(dict(f))
    if path.suffix == ".bin":
        return NumpyPolicy(read_bin(path))
    from .model import load_policy, numpy_weights
    return NumpyPolicy(numpy_weights(load_policy(path)))


def export(policy: NumpyPolicy, path: str | Path) -> None:
    """Write the weights the policy plays from (no value head): .npz, or .bin for the app."""
    path = Path(path)
    if path.suffix == ".bin":
        return export_bin(policy, path)
    np.savez(path, **{f"{name}.{part}": (w.T if part == "weight" else b)
                      for name, (w, b) in zip(LAYERS, policy.layers) for part in ("weight", "bias")})
    return None


def export_bin(policy: NumpyPolicy, path: str | Path, half: bool = True) -> None:
    """The format web/engine/policy.js reads: a uint32 header length, a JSON header with each layer's
    [inputs, outputs] and the number format, padding to 4 bytes, then each layer's weights (inputs x
    outputs, row-major) and biases, little-endian. `half` stores 16-bit floats, half the download."""
    dtype = np.float16 if half else np.float32
    header = json.dumps({"layers": [list(w.shape) for w, _ in policy.layers],
                         "dtype": "f16" if half else "f32"}).encode()
    header += b" " * (-(4 + len(header)) % 4)
    with open(path, "wb") as f:
        f.write(struct.pack("<I", len(header)))
        f.write(header)
        for w, b in policy.layers:
            f.write(np.ascontiguousarray(w, dtype=dtype).astype("<" + np.dtype(dtype).str[1:]).tobytes())
            f.write(np.ascontiguousarray(b, dtype=dtype).astype("<" + np.dtype(dtype).str[1:]).tobytes())


def read_bin(path: str | Path) -> dict[str, np.ndarray]:
    data = Path(path).read_bytes()
    (n,) = struct.unpack_from("<I", data)
    header = json.loads(data[4:4 + n])
    dtype = np.dtype("<f2" if header["dtype"] == "f16" else "<f4")
    at = 4 + n
    weights = {}
    for name, (i, o) in zip(LAYERS, header["layers"]):
        w = np.frombuffer(data, dtype, i * o, at).reshape(i, o)
        at += i * o * dtype.itemsize
        b = np.frombuffer(data, dtype, o, at)
        at += o * dtype.itemsize
        weights[f"{name}.weight"] = w.T.astype(np.float32)
        weights[f"{name}.bias"] = b.astype(np.float32)
    return weights


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    export(load(sys.argv[1]), sys.argv[2])
    print(f"wrote {sys.argv[2]}")
