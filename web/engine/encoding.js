// What Nana sees: one seat's view of the game as 873 floats, the same vector kitc/encoding.py
// builds (tests/test_js_port.py compares them). Only what that seat may know goes in.

import { CORNERS, FITTERS, MOVE, NUM_ACTIONS, SIDES, fits, isKing, rank } from './game.js';

const MAX_PLAYERS = 4;
const HAND = 0, TABLE = 52, UNSEEN = 104, DECLINED = 156;
const SPOTS = DECLINED + 52 * (MAX_PLAYERS - 1);
const SPOT_SIZE = 33;
const SEATS = SPOTS + 8 * SPOT_SIZE;
const SEAT_SIZE = 5;
const GLOBAL = SEATS + MAX_PLAYERS * SEAT_SIZE;
const EXTRA = GLOBAL + 11;
const EXTRA_SIZE = 6;
const CARDS = EXTRA + EXTRA_SIZE;
const CARD_SIZE = 5;
export const OBS_SIZE = CARDS + 52 * CARD_SIZE;

const STOCK_CARDS = 52 - 2 * 7 - 4;
const KINGS = [12, 25, 38, 51];
const twin = (c) => (3 - Math.floor(c / 13)) * 13 + (c % 13);
const red = (c) => (c >= 13 && c < 39 ? 1 : 0);

export function encode(g, seat, legal = null) {
  const x = new Float32Array(OBS_SIZE);
  const hand = g.hands[seat];
  const mine = new Uint8Array(52);
  const table = new Uint8Array(52);
  for (const c of hand) { mine[c] = 1; x[HAND + c] = 1; }
  for (const p of g.piles) for (const c of p) table[c] = 1;
  for (let c = 0; c < 52; c++) if (table[c]) x[TABLE + c] = 1;
  const unseen = new Uint8Array(52);
  for (let c = 0; c < 52; c++) if (!mine[c] && !table[c]) { unseen[c] = 1; x[UNSEEN + c] = 1; }
  for (let k = 1; k < g.n; k++) {
    const declined = g.lastOpen[(seat + k) % g.n];
    const base = DECLINED + 52 * (k - 1);
    for (let c = 0; c < 52; c++) if (unseen[c] && declined.has(c)) x[base + c] = 1;
  }

  const tops = g.piles.map((p) => (p.length ? p[p.length - 1] : -1));
  g.piles.forEach((p, s) => {
    const o = SPOTS + s * SPOT_SIZE;
    if (!p.length) { x[o] = 1; return; }
    const top = p[p.length - 1];
    const first = p[0];
    x[o + rank(top)] = 1;
    x[o + 14] = red(top);
    x[o + 14 + rank(first)] = 1;
    x[o + 28] = red(first);
    x[o + 29] = p.length / 13;
    const fit = FITTERS[top];
    x[o + 30] = fit.filter((c) => mine[c]).length / 2;
    x[o + 31] = fit.filter((c) => !mine[c] && !table[c]).length / 2;
    if (s < 4) {
      const moves = tops.some((t, j) => t >= 0 && j !== s && FITTERS[t].includes(first))
        || (isKing(first) && CORNERS.some((c) => tops[c] < 0));
      x[o + 32] = moves ? 1 : 0;
    }
  });

  for (let k = 0; k < Math.min(MAX_PLAYERS, g.n); k++) {
    const o = SEATS + k * SEAT_SIZE;
    const n = g.hands[(seat + k) % g.n].length;
    x[o] = 1;
    x[o + 1] = n / 15;
    x[o + 2] = n === 1 ? 1 : 0;
    x[o + 3] = n === 2 ? 1 : 0;
    x[o + 4] = n >= 10 ? 1 : 0;
  }

  let o = GLOBAL;
  x[o] = g.stock.length / STOCK_CARDS;
  x[o + 1] = g.stock.length ? 0 : 1;
  x[o + 2] = g.passes / g.n;
  x[o + 3] = Math.min(g.moves, 20) / 10;
  x[o + 4] = g.drew !== null ? 1 : 0;
  x[o + 5 + g.n - 2] = 1;
  x[o + 8] = SIDES.filter((s) => !g.piles[s].length).length / 4;
  x[o + 9] = CORNERS.filter((s) => !g.piles[s].length).length / 4;
  if (g.current === seat) {
    const moves = legal ?? g.legal();
    x[o + 10] = moves.filter((a) => a < MOVE).length / 10;
  }

  const open = new Uint8Array(52);
  if (tops.slice(0, 4).some((t) => t < 0)) open.fill(1);
  else for (const t of tops) if (t >= 0) for (const c of FITTERS[t]) open[c] = 1;
  if (CORNERS.some((s) => tops[s] < 0)) for (const k of KINGS) open[k] = 1;
  const declinedNext = g.lastOpen[(seat + 1) % g.n];
  let threats = 0;
  let undeclined = 0;
  for (let c = 0; c < 52; c++) {
    if (open[c] && unseen[c]) {
      threats++;
      if (!declinedNext.has(c)) undeclined++;
    }
  }
  o = EXTRA;
  x[o] = threats / 10;
  x[o + 1] = undeclined / 10;
  x[o + 2] = (g.hands[(seat + 1) % g.n].length - hand.length) / 10;
  x[o + 3] = g.variant === 'demons' ? 1 : 0;
  x[o + 4] = (unseen[25] + unseen[38]) / 2;
  x[o + 5] = (unseen[12] + unseen[51]) / 2;

  const live = tops.filter((t) => t >= 0);
  for (const c of hand) {
    const b = CARDS + c * CARD_SIZE;
    x[b] = live.filter((t) => fits(c, t)).length / 4;
    const fit = FITTERS[c];
    x[b + 1] = fit.filter((f) => unseen[f]).length / 2;
    x[b + 2] = fit.filter((f) => mine[f]).length / 2;
    const w = twin(c);
    x[b + 3] = unseen[w];
    x[b + 4] = mine[w];
  }
  return x;
}

export function mask(legal) {
  const m = new Uint8Array(NUM_ACTIONS);
  for (const a of legal) m[a] = 1;
  return m;
}
