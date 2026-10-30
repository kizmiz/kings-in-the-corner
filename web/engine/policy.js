// Nana: the trained network, run in the page. Reads the weights kitc/policy.py exports (.bin) and
// plays her top-rated legal move, the same move numpy picks (tests/test_js_port.py checks).

import { encode, mask } from './encoding.js';

function halfToFloat(h) {
  const s = (h & 0x8000) ? -1 : 1;
  const e = (h >> 10) & 0x1f;
  const f = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (f / 1024);
  if (e === 31) return f ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + f / 1024);
}

export function parseWeights(buffer) {
  const view = new DataView(buffer);
  const n = view.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, n)));
  const half = header.dtype === 'f16';
  const size = half ? 2 : 4;
  let at = 4 + n;
  const read = (count) => {
    const out = new Float32Array(count);
    for (let i = 0; i < count; i++, at += size) out[i] = half ? halfToFloat(view.getUint16(at, true)) : view.getFloat32(at, true);
    return out;
  };
  return header.layers.map(([inputs, outputs]) => ({ inputs, outputs, w: read(inputs * outputs), b: read(outputs) }));
}

export class Policy {
  constructor(layers) { this.layers = layers; }

  static async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`no weights at ${url}`);
    return new Policy(parseWeights(await res.arrayBuffer()));
  }

  logits(x, m) {
    let h = x;
    this.layers.forEach(({ inputs, outputs, w, b }, k) => {
      const out = Float32Array.from(b);
      for (let i = 0; i < inputs; i++) {
        const v = h[i];
        if (v === 0) continue;
        const row = i * outputs;
        for (let j = 0; j < outputs; j++) out[j] += v * w[row + j];
      }
      if (k < this.layers.length - 1) for (let j = 0; j < outputs; j++) if (out[j] < 0) out[j] = 0;
      h = out;
    });
    for (let a = 0; a < h.length; a++) if (!m[a]) h[a] = -1e9;
    return h;
  }
}

// Nana as a bot for the table: act(game) is her move.
export class PolicyBot {
  constructor(policy) { this.policy = policy; }
  act(game) {
    const legal = game.legal();
    const z = this.policy.logits(encode(game, game.current, legal), mask(legal));
    let best = legal[0];
    for (const a of legal) if (z[a] > z[best]) best = a;
    return best;
  }
}
