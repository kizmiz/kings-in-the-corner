// The family's rule bots, ported from kitc/bots.py. Aunt June's search is deterministic and is
// checked move for move against Python (tests/test_js_port.py); Pip and Ray pick at random.

import { CORNERS, END, FITTERS, MOVE, SIDES, fits, isKing, isRed } from './game.js';

const KINGS = [12, 25, 38, 51];

export class RandomBot {
  constructor(rng = Math.random) { this.rng = rng; }
  act(game) {
    const plays = game.legal().filter((a) => a < MOVE);
    plays.push(END);
    return plays[Math.floor(this.rng() * plays.length)];
  }
}

export class GreedyBot {
  constructor(rng = Math.random) { this.rng = rng; }
  act(game) {
    const legal = game.legal();
    const plays = legal.filter((a) => a < MOVE);
    if (plays.length) return plays[Math.floor(this.rng() * plays.length)];
    for (const a of legal) {
      if (a >= MOVE && a < END) {
        const g = game.copy();
        g.step(a);
        if (g.legal().some((b) => b < MOVE)) return a;
      }
    }
    return END;
  }
}

const EMPTY_SIDE = 12.0;
const THREAT = 4.0;
const NODES = 4000;


// The search state: the hand as a sorted list of cards, the piles as [first, top] or null.
export class HeuristicBot {
  constructor({ nodes = NODES, emptySide = EMPTY_SIDE, threat = THREAT } = {}) {
    this.nodes = nodes;
    this.emptySide = emptySide;
    this.threat = threat;
    this.plan = [];
    this.key = null;
  }

  act(game) {
    // The turn's plan holds while nothing but its own moves has happened since.
    const key = `${game.turns}/${game.current}/${game.moves}/${game.powers}`;
    if (!this.plan.length || key !== this.key || this.game !== game) this.plan = this._search(game);
    this.game = game;
    this.key = `${game.turns}/${game.current}/${game.moves + 1}/${game.powers}`;
    return this.plan.shift();
  }

  _search(game) {
    const seat = game.current;
    const hand = [...game.hands[seat]].sort((a, b) => a - b);
    const piles = game.piles.map((p) => (p.length ? [p[0], p[p.length - 1]] : null));
    this.startHand = new Uint8Array(52);
    for (const c of hand) this.startHand[c] = 1;
    this.startTable = new Uint8Array(52);
    let onTable = 0;
    for (const p of game.piles) for (const c of p) { this.startTable[c] = 1; onTable++; }
    const others = [...Array(game.n).keys()].filter((q) => q !== seat);
    const unseen = 52 - hand.length - onTable;
    const draw = game.stock.length ? 1 : 0;
    const held = others.reduce((s, q) => s + game.hands[q].length + draw, 0);
    this.pHeld = unseen ? Math.min(1.0, held / unseen) : 0.0;
    this.declined = new Uint8Array(52);
    for (const c of game.lastOpen[(seat + 1) % game.n]) this.declined[c] = 1;
    this.urgency = 1.0 + (Math.min(...others.map((q) => game.hands[q].length)) <= 2 ? 2.0 : 0.0);
    this.demons = game.variant === 'demons';
    this.rivalCards = others.reduce((s, q) => s + game.hands[q].length, 0) / others.length;
    this.budget = this.nodes;
    this.memo = new Map();
    const [, path] = this._best(hand, piles);
    return [...path, END];
  }

  _best(hand, piles) {
    const key = `${hand.join(',')}|${piles.map((p) => (p ? `${p[0]}.${p[1]}` : '-')).join(',')}`;
    const seen = this.memo.get(key);
    if (seen) return seen;
    let best = [this._score(hand, piles), []];
    if (hand.length && this.budget > 0) {
      this.budget -= 1;
      for (const [a, h2, p2] of this._moves(hand, piles)) {
        // A demon's power: the search can't see past it, so it ends the plan here.
        const power = this.demons && a < MOVE && a % 8 >= 4 && isKing(Math.floor(a / 8)) && h2.length;
        const [score, path] = power ? [this._demon(Math.floor(a / 8), h2, p2), []] : this._best(h2, p2);
        if (score > best[0]) {
          best = [score, [a, ...path]];
          if (!h2.length) break;
        }
      }
    }
    this.memo.set(key, best);
    return best;
  }

  * _moves(hand, piles) {
    const emptySide = SIDES.find((s) => piles[s] === null) ?? null;
    const emptyCorner = CORNERS.find((s) => piles[s] === null) ?? null;
    for (const c of hand) {
      const rest = hand.filter((x) => x !== c);
      for (let s = 0; s < 8; s++) {
        const p = piles[s];
        let ok;
        let next;
        if (p === null) {
          ok = s === emptySide || (s === emptyCorner && isKing(c));
          next = [c, c];
        } else {
          ok = fits(c, p[1]);
          next = [p[0], c];
        }
        if (ok) yield [c * 8 + s, rest, piles.map((q, j) => (j === s ? next : q))];
      }
    }
    for (const side of SIDES) {
      const p = piles[side];
      if (p === null) continue;
      for (let s = 0; s < 8; s++) {
        if (s === side) continue;
        const q = piles[s];
        let next;
        if (q === null) {
          if (s !== emptyCorner || !isKing(p[0])) continue;
          next = p;
        } else if (fits(p[0], q[1])) next = [q[0], p[1]];
        else continue;
        yield [MOVE + side * 8 + s, hand, piles.map((r, j) => (j === s ? next : j === side ? null : r))];
      }
    }
  }

  _demon(demon, hand, piles) {
    if (!isRed(demon)) return this._score(hand, piles);
    return hand.length - 2 * this.rivalCards;   // trading hands: she gets the rival's count, they get hers
  }

  _score(hand, piles) {
    const cards = hand.length;
    if (cards === 0) return 1000.0;
    const inHand = new Uint8Array(52);
    for (const c of hand) inHand[c] = 1;
    const emptySides = SIDES.filter((s) => piles[s] === null).length;
    const score = -cards - this.emptySide * emptySides * this.urgency;
    if (emptySides) return score;
    const open = new Uint8Array(52);
    for (const p of piles) if (p !== null) for (const c of FITTERS[p[1]]) open[c] = 1;
    if (CORNERS.some((s) => piles[s] === null)) for (const k of KINGS) open[k] = 1;
    let likely = 0;
    let declined = 0;
    for (let c = 0; c < 52; c++) {
      // On the table: there from the start, or played from the hand during this search.
      const table = this.startTable[c] || (this.startHand[c] && !inHand[c]);
      if (!open[c] || inHand[c] || table) continue;
      if (this.declined[c]) declined++;
      else likely++;
    }
    return score - this.threat * this.pHeld * (likely + 0.25 * declined) * this.urgency;
  }
}

export const BOTS = { pip: RandomBot, ray: GreedyBot, june: HeuristicBot };
