// Replays games recorded by tests/test_js_port.py through the app's engine (web/engine/*.js) and
// reports every difference from Python: legal moves, observations, Aunt June's choices, demon
// powers and results. Also runs a network's forward pass on recorded inputs. Reads JSON on stdin,
// prints JSON.

import { Game } from '../web/engine/game.js';
import { HeuristicBot } from '../web/engine/bots.js';
import { encode } from '../web/engine/encoding.js';
import { Policy, parseWeights } from '../web/engine/policy.js';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const problems = [];
let steps = 0;
let juneMoves = 0;

for (const [gi, rec] of input.games.entries()) {
  const g = new Game(rec.players, { deck: rec.deck, first: rec.first, variant: rec.variant, powerSeed: rec.power_seed });
  const june = new Map();
  for (const [si, step] of rec.steps.entries()) {
    const where = `game ${gi} step ${si}`;
    const legal = g.legal().slice().sort((a, b) => a - b);
    if (JSON.stringify(legal) !== JSON.stringify(step.legal)) problems.push(`${where}: legal ${legal} != ${step.legal}`);
    if (step.obs) {
      const x = encode(g, g.current);
      const diff = step.obs.reduce((m, v, i) => Math.max(m, Math.abs(v - x[i])), 0);
      if (diff > 1e-6) {
        const i = step.obs.findIndex((v, k) => Math.abs(v - x[k]) > 1e-6);
        problems.push(`${where}: observation differs at ${i} (${x[i]} vs ${step.obs[i]})`);
      }
    }
    if (step.june) {
      if (!june.has(g.current)) june.set(g.current, new HeuristicBot());
      const a = june.get(g.current).act(g);
      juneMoves++;
      if (a !== step.action) problems.push(`${where}: June played ${a}, Python's June ${step.action}`);
    }
    g.step(step.action);
    if (step.powers !== g.powers) problems.push(`${where}: ${g.powers} powers, Python ${step.powers}`);
    steps++;
    if (problems.length > 20) break;
  }
  const end = { over: g.over, winners: g.winners, reason: g.reason, hands: g.hands, piles: g.piles };
  for (const k of Object.keys(end)) {
    if (JSON.stringify(end[k]) !== JSON.stringify(rec.end[k])) problems.push(`game ${gi}: ${k} ${JSON.stringify(end[k])} != ${JSON.stringify(rec.end[k])}`);
  }
  if (problems.length > 20) break;
}

let policy = null;
if (input.policy) {
  const bytes = readFileSync(input.policy.path);
  const p = new Policy(parseWeights(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)));
  policy = input.policy.cases.map(({ obs, mask }) => Array.from(p.logits(Float32Array.from(obs), Uint8Array.from(mask))));
}

console.log(JSON.stringify({ problems, steps, juneMoves, policy }));
