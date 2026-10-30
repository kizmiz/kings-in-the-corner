// Kings in the Corner: the game, move for move the same as kitc/engine.py (tests/test_js_port.py
// replays Python games here and checks every legal move list and result).
//
// Cards are 0..51: suit * 13 + rank - 1 (rank 1 = ace .. 13 = king; suits spades, hearts, diamonds,
// clubs). Spots: the sides N E S W (0-3) and the corners NE SE SW NW (4-7).
// Moves are action ids:  card * 8 + spot (play)   MOVE + side * 8 + spot (move a pile)   END
//
// Devils in the Corner (variant 'demons'): a king played from the hand straight into a corner is a
// devil and unleashes its power. A red one trades its player's hand with a rival's; a black one
// deals the side piles into new random legal piles. The powers draw from mulberry32, the same
// generator as Python's Rng32, so a replay gives the same table.
//
// Kamikaze (match play, `kamikaze: true`): a player whose hand is exactly thirteen cards, ace to
// king, one of each rank, wins outright, the moment it comes together (a draw, a play, a trade).

export const SUITS = 'shdc';
export const RANKS = 'A23456789TJQK';
export const SPOTS = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
export const SIDES = [0, 1, 2, 3];
export const CORNERS = [4, 5, 6, 7];
export const HAND_SIZE = 7;
export const MOVE = 52 * 8;
export const END = MOVE + 4 * 8;
export const NUM_ACTIONS = END + 1;
const MAX_TURNS = 1000;

export const rank = (c) => (c % 13) + 1;
export const isRed = (c) => c >= 13 && c < 39;
export const isKing = (c) => c % 13 === 12;
export const cardCode = (c) => RANKS[c % 13] + SUITS[Math.floor(c / 13)];
export const parseCard = (code) => SUITS.indexOf(code[1]) * 13 + RANKS.indexOf(code[0]);
export const fits = (card, top) => rank(card) === rank(top) - 1 && isRed(card) !== isRed(top);
export const kamikazeHand = (hand) => hand.length === 13 && new Set(hand.map(rank)).size === 13;
export const FITTERS = Array.from({ length: 52 }, (_, t) => [...Array(52).keys()].filter((c) => fits(c, t)));

export function mulberry32(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => a;
  next.below = (n) => Math.floor(next() * n);
  return next;
}

// `cards` dealt into exactly `k` random piles that each build down in alternating colors, or null:
// the same procedure as Python's rebuild_piles, step for step.
export function rebuildPiles(cards, k, rng, tries = 60) {
  for (let attempt = 0; attempt < tries; attempt++) {
    const order = [...cards];
    for (let i = order.length - 1; i > 0; i--) {
      const j = rng.below(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.sort((a, b) => rank(b) - rank(a));   // stable: the shuffle breaks ties
    const piles = [];
    let ok = true;
    for (const c of order) {
      const options = [];
      piles.forEach((p, i) => { if (fits(c, p[p.length - 1])) options.push(i); });
      const n = options.length + (piles.length < k ? 1 : 0);
      if (n === 0) { ok = false; break; }
      const j = rng.below(n);
      if (j < options.length) piles[options[j]].push(c);
      else piles.push([c]);
    }
    if (ok && piles.length === k) return piles;
  }
  return null;
}

export function shuffled(rng = Math.random) {
  const deck = [...Array(52).keys()];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function decode(a) {
  if (a === END) return { kind: 'end' };
  if (a >= MOVE) return { kind: 'move', side: Math.floor((a - MOVE) / 8), spot: (a - MOVE) % 8 };
  return { kind: 'play', card: Math.floor(a / 8), spot: a % 8 };
}

export class Game {
  // deck: the shuffled order, top of the stock last (as in Python).
  constructor(players = 2, { deck = shuffled(), first = 0, variant = 'classic', powerSeed = null, kamikaze = false } = {}) {
    this.n = players;
    this.variant = variant;
    this.kamikaze = kamikaze;
    this.powerSeed = powerSeed ?? Math.floor(Math.random() * 4294967296);
    this.rng = mulberry32(this.powerSeed);
    this.powers = 0;
    this.lastPower = null;
    this.deck = [...deck];
    const stock = [...deck];
    this.hands = Array.from({ length: players }, () => []);
    for (let k = 0; k < HAND_SIZE; k++) for (let q = 0; q < players; q++) this.hands[q].push(stock.pop());
    this.piles = Array.from({ length: 8 }, () => []);
    for (const side of SIDES) {
      for (;;) {
        const card = stock.pop();
        if (isKing(card)) {
          this.piles[CORNERS.find((s) => !this.piles[s].length)].push(card);
          continue;
        }
        this.piles[side].push(card);
        break;
      }
    }
    this.stock = stock;
    this.current = first;
    this.turns = 0;
    this.passes = 0;
    this.moves = 0;
    this.drew = null;
    this.over = false;
    this.winners = [];
    this.reason = '';
    this.lastOpen = Array.from({ length: players }, () => new Set());
    this._startTurn();
  }

  legal() {
    if (this.over) return [];
    const piles = this.piles;
    const tops = piles.map((p) => (p.length ? p[p.length - 1] : -1));
    const acts = [];
    for (const card of this.hands[this.current]) {
      const king = isKing(card);
      for (let spot = 0; spot < 8; spot++) {
        const t = tops[spot];
        if (t < 0) {
          if (spot < 4 || king) acts.push(card * 8 + spot);
        } else if (fits(card, t)) acts.push(card * 8 + spot);
      }
    }
    for (const side of SIDES) {
      if (!piles[side].length) continue;
      const first = piles[side][0];
      const king = isKing(first);
      for (let spot = 0; spot < 8; spot++) {
        if (spot === side) continue;
        const t = tops[spot];
        if (t < 0) {
          if (spot >= 4 && king) acts.push(MOVE + side * 8 + spot);
        } else if (fits(first, t)) acts.push(MOVE + side * 8 + spot);
      }
    }
    acts.push(END);
    return acts;
  }

  step(action) {
    if (this.over) throw new Error('the game is over');
    if (action === END) return this._endTurn();
    if (action >= MOVE) {
      const side = Math.floor((action - MOVE) / 8);
      const spot = (action - MOVE) % 8;
      this.piles[spot].push(...this.piles[side]);
      this.piles[side] = [];
    } else {
      const card = Math.floor(action / 8);
      const hand = this.hands[this.current];
      hand.splice(hand.indexOf(card), 1);
      this.piles[action % 8].push(card);
      if (!hand.length) {
        this.over = true;
        this.winners = [this.current];
        this.reason = 'out';
      } else if (this.variant === 'demons' && action % 8 >= 4 && isKing(card)) {
        this._unleash(card);
      }
    }
    this.moves += 1;
    this._checkKamikaze();
    return undefined;
  }

  _checkKamikaze() {
    if (!this.kamikaze || this.over) return;
    const q = this.hands.findIndex(kamikazeHand);
    if (q < 0) return;
    this.over = true;
    this.winners = [q];
    this.reason = 'kamikaze';
  }

  _unleash(demon) {
    const q = this.current;
    if (isRed(demon)) {
      const rivals = [...Array(this.n).keys()].filter((p) => p !== q);
      const r = rivals[this.rng.below(rivals.length)];
      [this.hands[q], this.hands[r]] = [this.hands[r], this.hands[q]];
      this.lastPower = { demon, kind: 'swap', by: q, with: r };
    } else {
      const sides = SIDES.filter((s) => this.piles[s].length);
      const cards = sides.flatMap((s) => this.piles[s]);
      const piles = rebuildPiles(cards, sides.length, this.rng);
      if (piles) sides.forEach((s, i) => { this.piles[s] = piles[i]; });
      this.lastPower = { demon, kind: 'rebuild', by: q, changed: piles !== null };
    }
    this.powers += 1;
  }

  openCards() {
    if (SIDES.some((s) => !this.piles[s].length)) return new Set(Array.from({ length: 52 }, (_, c) => c));
    const cards = new Set();
    for (const p of this.piles) if (p.length) for (const c of FITTERS[p[p.length - 1]]) cards.add(c);
    if (CORNERS.some((s) => !this.piles[s].length)) for (const k of [12, 25, 38, 51]) cards.add(k);
    return cards;
  }

  _startTurn() {
    this.moves = 0;
    this.turns += 1;
    if (this.stock.length) {
      this.drew = this.stock.pop();
      this.hands[this.current].push(this.drew);
    } else this.drew = null;
    this._checkKamikaze();
  }

  _endTurn() {
    const q = this.current;
    this.lastOpen[q] = this.openCards();
    this.passes = this.drew === null && this.moves === 0 ? this.passes + 1 : 0;
    if (this.passes >= this.n || this.turns >= MAX_TURNS) {
      const fewest = Math.min(...this.hands.map((h) => h.length));
      this.over = true;
      this.winners = [...this.hands.keys()].filter((p) => this.hands[p].length === fewest);
      this.reason = 'stuck';
      return;
    }
    this.current = (q + 1) % this.n;
    this._startTurn();
  }

  result(seat) {
    if (!this.winners.includes(seat)) return -1;
    return this.winners.length === 1 ? 1 : 0;
  }

  // The game as plain data (JSON) and back, so a game in progress outlives the app being closed.
  toJSON() {
    const { rng, lastOpen, ...rest } = this;
    return { ...rest, rng: rng.state(), lastOpen: lastOpen.map((s) => [...s]) };
  }

  static fromJSON(data) {
    const g = Object.assign(Object.create(Game.prototype), data);
    g.rng = mulberry32(data.rng);
    g.lastOpen = data.lastOpen.map((s) => new Set(s));
    return g;
  }

  copy() {
    const g = Object.create(Game.prototype);
    Object.assign(g, this);
    g.hands = this.hands.map((h) => [...h]);
    g.piles = this.piles.map((p) => [...p]);
    g.stock = [...this.stock];
    g.winners = [...this.winners];
    g.lastOpen = this.lastOpen.map((s) => new Set(s));
    g.rng = mulberry32(this.rng.state());
    return g;
  }
}
