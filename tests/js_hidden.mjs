// The family can't see your cards: in thousands of positions, the app's own bots (Aunt June, and
// Leo and Nana with the weights the app ships) make exactly the same move after every other hand
// and the stock are shuffled together and dealt back out, the same counts in each. Prints JSON.

import { readFileSync } from 'node:fs';
import { Game, mulberry32 } from '../web/engine/game.js';
import { HeuristicBot } from '../web/engine/bots.js';
import { Policy, PolicyBot, parseWeights } from '../web/engine/policy.js';

const policy = (file) => {
  const bytes = readFileSync(new URL(`../web/agents/${file}`, import.meta.url));
  return new Policy(parseWeights(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)));
};
const policies = Object.fromEntries(['leo', 'nana'].flatMap((who) => ['classic', 'demons'].map((v) => [`${who}-${v}`, policy(`${who}-${v}.bin`)])));
const makers = {
  june: () => new HeuristicBot(),
  leo: (v) => new PolicyBot(policies[`leo-${v}`]),
  nana: (v) => new PolicyBot(policies[`nana-${v}`]),
};

const rng = mulberry32(2026);
const shuffle = (xs) => { for (let i = xs.length - 1; i > 0; i--) { const j = rng.below(i + 1); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
const positions = Number(process.argv[2] ?? 300);
const counts = { june: 0, leo: 0, nana: 0 };
const changed = [];

for (let i = 0; i < positions; i++) {
  const variant = i % 2 ? 'demons' : 'classic';
  const n = 2 + (i % 3);
  const g = new Game(n, { variant, first: i % n, powerSeed: i, deck: shuffle([...Array(52).keys()]) });
  const players = Array.from({ length: n }, () => new HeuristicBot());
  for (let k = rng.below(60); k > 0 && !g.over; k--) g.step(players[g.current].act(g));
  if (g.over) continue;
  const seat = g.current;
  for (const [who, make] of Object.entries(makers)) {
    const a = make(variant).act(g.copy());
    for (let t = 0; t < 4; t++) {
      const h = g.copy();
      const others = [...Array(n).keys()].filter((q) => q !== seat);
      const pool = shuffle([...others.flatMap((q) => h.hands[q]), ...h.stock]);
      for (const q of others) h.hands[q] = pool.splice(0, h.hands[q].length);
      h.stock = pool;
      const b = make(variant).act(h);
      counts[who]++;
      if (a !== b) changed.push({ who, variant, n, position: i, a, b });
    }
  }
}
console.log(JSON.stringify({ counts, changed }));
