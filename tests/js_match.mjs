// Match play in the app (web/engine/match.js) and Kamikaze in its engine. Exits non-zero on a
// failed check; run by tests/test_match.py.

import assert from 'node:assert/strict';
import { END, Game, parseCard } from '../web/engine/game.js';
import { handPoints, matchResult, newMatch, points, scoreHand, turnMatch } from '../web/engine/match.js';

const C = (codes) => codes.split(' ').map(parseCard);
const hand = (reason, winners, hands) => ({ reason, winners, hands: hands.map((h) => (h ? C(h) : [])) });

// Face cards 10, the rest their number.
assert.deepEqual(['As', '7h', 'Td', 'Jc', 'Qs', 'Kh'].map((c) => points(parseCard(c))), [1, 7, 10, 10, 10, 10]);
assert.equal(handPoints(C('As Kh 5d')), 16);

// Going out scores nothing; the others score what they hold; the next hand starts with the next player.
let m = newMatch(3, 2);
let h = scoreHand(m, hand('out', [1], ['Kh 5d', '', 'As']));
assert.deepEqual(h.got, [15, 0, 1]);
assert.deepEqual(m.scores, [15, 0, 1]);
assert.equal(m.first, 0);
assert.equal(m.over, false);

// Stuck: nobody went out, so everyone scores.
h = scoreHand(m, hand('stuck', [0, 2], ['2s', '9c 9d', '2h']));
assert.deepEqual(m.scores, [17, 18, 3]);
assert.equal(h.by, null);

// Exactly 50 drops to 25.
m = newMatch(2, 0);
m.scores = [40, 30];
h = scoreHand(m, hand('out', [1], ['Ks', '']));
assert.deepEqual(m.scores, [25, 30]);
assert.deepEqual(h.landed, [0]);
assert.equal(m.over, false);

// Over 50 loses, and the lowest score wins (a shared lowest is a tie).
m = newMatch(3, 0);
m.scores = [45, 20, 20];
scoreHand(m, hand('out', [2], ['Qs', '3h', '']));
assert.deepEqual(m.scores, [55, 23, 20]);
assert.equal(m.over, true);
assert.deepEqual(m.winners, [2]);
assert.deepEqual(m.losers, [0]);
assert.equal(matchResult(m, 2), 1);
assert.equal(matchResult(m, 0), -1);
m = newMatch(3, 0);
m.scores = [45, 20, 23];
scoreHand(m, hand('out', [1], ['Qs', '', 'Ah']));
assert.deepEqual(m.winners, [1]);
m = newMatch(2, 0);
m.scores = [45, 45];
scoreHand(m, hand('stuck', [0, 1], ['Qs', 'Qh']));
assert.deepEqual(m.winners, [0, 1]);
assert.equal(matchResult(m, 0), 0);

// Kamikaze wins the match outright, whatever the scores.
m = newMatch(2, 0);
m.scores = [10, 49];
scoreHand(m, hand('kamikaze', [1], ['2s', 'As 2h 3d 4c 5s 6h 7d 8c 9s Th Jd Qc Ks']));
assert.equal(m.over, true);
assert.deepEqual(m.winners, [1]);
assert.deepEqual(m.scores, [10, 49]);

// A Wi-Fi seat sees the match turned so that it sits at 0.
m = newMatch(3, 1);
scoreHand(m, hand('out', [2], ['Kh', 'As', '']));
const seen = turnMatch(m, 1);
assert.deepEqual(seen.scores, [1, 0, 10]);
assert.equal(seen.hands[0].by, 1);
assert.equal(seen.first, 1);

// The engine: ace to king, one of each, ends the hand, in match play only, and survives a save.
const ACE_TO_KING = C('As 2h 3d 4c 5s 6h 7d 8c 9s Th Jd Qc Ks');
for (const kamikaze of [true, false]) {
  const g = new Game(2, { kamikaze });
  g.piles = Array.from({ length: 8 }, () => []);
  g.hands = [[...ACE_TO_KING, parseCard('8h')], C('2c')];
  g.current = 0;
  g.step(parseCard('8h') * 8 + 0);
  assert.equal(g.over, kamikaze);
  if (kamikaze) assert.deepEqual([g.winners, g.reason], [[0], 'kamikaze']);
}
const g = new Game(2, { kamikaze: true });
g.hands = [C('5c'), ACE_TO_KING.slice(0, 12)];
g.stock = [parseCard('Kd')];
g.current = 0;
g.drew = null;
const saved = Game.fromJSON(JSON.parse(JSON.stringify(g)));
saved.step(END);
assert.deepEqual([saved.over, saved.winners, saved.reason], [true, [1], 'kamikaze']);

console.log('ok');
