// Match play: hands are dealt until someone's score passes 50, and that player loses; the lowest
// score at that moment wins.
//
// Whoever goes out scores nothing for the hand. Everyone else scores the cards they still hold:
// jacks, queens and kings 10, every other card its number (an ace 1). A hand that ends with the
// stock out and everyone passing has nobody out, so everyone scores what they hold. A score that
// lands on exactly 50 drops back to 25. Kamikaze (engine/game.js): ace to king, one of each, in a
// hand wins the match outright.

import { rank } from './game.js';

export const TARGET = 50;
export const LANDED = 25;

export const points = (c) => Math.min(rank(c), 10);
export const handPoints = (hand) => hand.reduce((sum, c) => sum + points(c), 0);

// `first`: who starts the first hand. Each hand after starts with the next player.
export function newMatch(n, first) {
  return { n, scores: Array(n).fill(0), hands: [], first, over: false, winners: [], losers: [] };
}

// A finished hand into the match. Returns what it added: `got` (each player's points), how it
// ended and by whom, and who landed on 50.
export function scoreHand(match, g) {
  const kamikaze = g.reason === 'kamikaze';
  const hand = { got: kamikaze ? Array(match.n).fill(0) : g.hands.map(handPoints), reason: g.reason,
    by: g.reason === 'stuck' ? null : g.winners[0], landed: [] };
  if (kamikaze) {
    match.over = true;
    match.winners = [hand.by];
    match.losers = [...Array(match.n).keys()].filter((q) => q !== hand.by);
  } else {
    match.scores = match.scores.map((s, q) => {
      const total = s + hand.got[q];
      if (total !== TARGET) return total;
      hand.landed.push(q);
      return LANDED;
    });
    const crossed = [...Array(match.n).keys()].filter((q) => match.scores[q] > TARGET);
    if (crossed.length) {
      const low = Math.min(...match.scores);
      match.over = true;
      match.winners = [...Array(match.n).keys()].filter((q) => match.scores[q] === low);
      match.losers = crossed.filter((q) => !match.winners.includes(q));
    }
  }
  match.hands.push(hand);
  match.first = (match.first + 1) % match.n;
  return hand;
}

// +1 won the match, 0 shared the lowest score, -1 lost.
export function matchResult(match, seat) {
  if (!match.winners.includes(seat)) return -1;
  return match.winners.length === 1 ? 1 : 0;
}

// The match as `seat` sees it, turned so that seat sits at 0 (as a Wi-Fi table sends it).
export function turnMatch(match, seat) {
  const n = match.n;
  const from = (i) => (i + seat) % n;
  const to = (q) => (q - seat + n) % n;
  const turned = (xs) => xs.map((_, i) => xs[from(i)]);
  return {
    n, scores: turned(match.scores), first: to(match.first), over: match.over,
    winners: match.winners.map(to), losers: match.losers.map(to),
    hands: match.hands.map((h) => ({ ...h, got: turned(h.got), by: h.by === null ? null : to(h.by), landed: h.landed.map(to) })),
  };
}
