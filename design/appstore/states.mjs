// Game positions for the App Store screenshots, made with the app's own engine and Aunt June playing
// every seat. Writes states.json: each one a kept game the app opens straight into.
import { writeFileSync } from 'node:fs';
import { END, Game, MOVE, isKing, isRed, mulberry32 } from '../../web/engine/game.js';
import { HeuristicBot } from '../../web/engine/bots.js';
import { newMatch, scoreHand } from '../../web/engine/match.js';

const NAMES = { leo: 'Leo', june: 'June', nana: 'Nana', ray: 'Ray', pip: 'Pip' };
const POS = { 2: ['top'], 3: ['left', 'right'], 4: ['left', 'top', 'right'] };
const seatsFor = (rivals) => [{ who: 'you', name: 'You', kind: 'you' },
  ...rivals.map((who, i) => ({ who, name: NAMES[who], pos: POS[rivals.length + 1][i], kind: 'bot' }))];
const shuffle = (rng) => { const d = [...Array(52).keys()]; for (let i = 51; i > 0; i--) { const j = rng.below(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
const plays = (g) => g.legal().filter((a) => a < MOVE);

// Play June for every seat until `ok(g)` holds on your turn (before you've moved).
function find(n, variant, ok, { kamikaze = false, tries = 4000 } = {}) {
  for (let seed = 1; seed < tries; seed++) {
    const rng = mulberry32(seed);
    const g = new Game(n, { deck: shuffle(rng), first: seed % n, variant, powerSeed: seed, kamikaze });
    const bots = Array.from({ length: n }, () => new HeuristicBot());
    for (let step = 0; step < 400 && !g.over; step++) {
      if (g.current === 0 && g.moves === 0 && ok(g)) return { g, seed };
      g.step(bots[g.current].act(g));
    }
  }
  throw new Error('no position');
}

const out = {};

// 1. Kings, four at the table, mid-game: corners started, piles built up, your turn with plays.
{
  const { g, seed } = find(4, 'classic', (g) => g.turns >= 8 && g.piles.slice(4).filter((p) => p.length).length >= 2
    && g.piles.slice(0, 4).every((p) => p.length) && g.piles.slice(0, 4).filter((p) => p.length >= 3).length >= 1
    && g.piles.slice(0, 4).filter((p) => p.length >= 2).length >= 3
    && g.hands[0].length >= 6 && g.hands[0].length <= 9 && new Set(plays(g).map((a) => Math.floor(a / 8))).size >= 2
    && g.stock.length >= 3);
  out.kings = { seed, kept: { g, key: 'classic:leo,june,nana', last: null, seats: seatsFor(['leo', 'june', 'nana']) } };
}

// 2. Devils, three at the table: you hold a red devil and a corner is free for it.
{
  const { g, seed } = find(3, 'demons', (g) => g.turns >= 6 && g.hands[0].length >= 5 && g.hands[0].length <= 8
    && plays(g).some((a) => a % 8 >= 4 && isKing(Math.floor(a / 8)) && isRed(Math.floor(a / 8)))
    && g.piles.slice(4).filter((p) => p.length).length >= 1 && g.piles.slice(0, 4).filter((p) => p.length >= 2).length >= 2
    && g.hands[0].length > Math.min(g.hands[1].length, g.hands[2].length) + 1);
  out.devils = { seed, kept: { g, key: 'demons:leo,nana', last: null, seats: seatsFor(['leo', 'nana']) } };
}

// 3. Match to 50: a few hands in, and you just went out.
{
  let found = null;
  for (let seed = 1; seed < 3000 && !found; seed++) {
    const rng = mulberry32(seed);
    const m = newMatch(4, seed % 4);
    for (let hand = 0; hand < 4 && !m.over; hand++) {
      const g = new Game(4, { deck: shuffle(rng), first: m.first, variant: 'classic', powerSeed: seed * 10 + hand, kamikaze: true });
      const bots = Array.from({ length: 4 }, () => new HeuristicBot());
      while (!g.over) g.step(bots[g.current].act(g));
      const before = m.scores.slice();
      scoreHand(m, g);
      if (!m.over && hand >= 1 && g.reason === 'out' && g.winners[0] === 0 && before[0] >= 4
        && m.scores.slice(1).every((s) => s > m.scores[0] && s <= 49) && g.hands.slice(1).every((h) => h.length >= 2 && h.length <= 6)) {
        found = { seed, kept: { g, key: 'classic+match:leo,june,nana', last: null, match: m, seats: seatsFor(['leo', 'june', 'nana']) } };
        break;
      }
    }
  }
  out.match = found;
}

writeFileSync(new URL('./states.json', import.meta.url), JSON.stringify(out));
for (const [k, v] of Object.entries(out)) {
  const g = v.kept.g;
  console.log(k, 'seed', v.seed, 'hand', g.hands[0].length, 'piles', g.piles.map((p) => p.length).join(','), v.kept.match ? `scores ${v.kept.match.scores} hands ${v.kept.match.hands.length}` : '');
}
