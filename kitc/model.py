"""Policy/value network and checkpoints (PyTorch; training only, playing uses kitc/policy.py)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch
from torch import nn


def layer(n_in: int, n_out: int, gain: float = np.sqrt(2)) -> nn.Linear:
    linear = nn.Linear(n_in, n_out)
    nn.init.orthogonal_(linear.weight, gain)
    nn.init.zeros_(linear.bias)
    return linear


class PolicyNet(nn.Module):
    """Shared MLP trunk with a masked policy head (one score per action id) and a value head."""

    def __init__(self, obs_size: int, num_actions: int, hidden: int = 512):
        super().__init__()
        self.spec = {"obs_size": obs_size, "num_actions": num_actions, "hidden": hidden}
        self.trunk = nn.Sequential(layer(obs_size, hidden), nn.ReLU(), layer(hidden, hidden), nn.ReLU())
        self.pi = nn.Sequential(layer(hidden, 256), nn.ReLU(), layer(256, num_actions, gain=0.01))
        self.v = nn.Sequential(layer(hidden, 256), nn.ReLU(), layer(256, 1, gain=1.0))

    def forward(self, obs: torch.Tensor, mask: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        h = self.trunk(obs)
        return self.pi(h).masked_fill(~mask, -1e9), self.v(h).squeeze(-1)

    @torch.no_grad()
    def act(self, obs: np.ndarray, mask: np.ndarray, greedy: bool = False):
        """Batched decisions for numpy inputs: actions, their log-probs, and state values."""
        logits, value = self(torch.from_numpy(obs), torch.from_numpy(mask))
        if greedy:
            action = logits.argmax(-1)
        else:
            action = torch.distributions.Categorical(logits=logits).sample()
        logp = torch.log_softmax(logits, -1).gather(-1, action[:, None]).squeeze(-1)
        return action.numpy(), logp.numpy(), value.numpy()

    @torch.no_grad()
    def value(self, obs: np.ndarray) -> np.ndarray:
        return self.v(self.trunk(torch.from_numpy(obs))).squeeze(-1).numpy()


@torch.no_grad()
def widen(net: PolicyNet, hidden: int) -> PolicyNet:
    """The same network with a wider trunk, playing exactly as before: the new units start with
    fresh incoming weights and no outgoing ones, so they change nothing until training uses them."""
    old = net.spec["hidden"]
    if hidden <= old:
        return net
    wide = PolicyNet(net.spec["obs_size"], net.spec["num_actions"], hidden)
    a, b = net.trunk[0], wide.trunk[0]
    b.weight[:old] = a.weight
    b.bias[:old] = a.bias
    a, b = net.trunk[2], wide.trunk[2]
    b.weight[:old, :old] = a.weight
    b.weight[:old, old:] = 0
    b.bias[:old] = a.bias
    for head in ("pi", "v"):
        a, b = getattr(net, head), getattr(wide, head)
        b[0].weight[:, :old] = a[0].weight
        b[0].weight[:, old:] = 0
        b[0].bias.copy_(a[0].bias)
        b[2].load_state_dict(a[2].state_dict())
    return wide


def numpy_weights(net: nn.Module) -> dict[str, np.ndarray]:
    return {k: v.detach().cpu().numpy() for k, v in net.state_dict().items()}


def load_numpy_weights(net: nn.Module, weights: dict[str, np.ndarray]) -> None:
    net.load_state_dict({k: torch.from_numpy(np.asarray(v)) for k, v in weights.items()})


def save_checkpoint(path: str | Path, net: PolicyNet, **extra) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    state = {k: v.detach().cpu() for k, v in net.state_dict().items()}
    torch.save({"spec": net.spec, "state": state, **extra}, tmp)
    tmp.replace(path)


def load_checkpoint(path: str | Path) -> dict:
    return torch.load(path, map_location="cpu", weights_only=False)


def load_policy(path: str | Path) -> PolicyNet:
    ckpt = load_checkpoint(path)
    net = PolicyNet(**ckpt["spec"])
    net.load_state_dict(ckpt["state"])
    return net.eval()
