// How the table draws things: classic card faces and backs, piles, the seats around the felt, and
// the whole game screen, as HTML strings. The game (app.js) and the design boards
// (design/boards.html) both draw with these, so the boards show the real components.
//
// A card is written as rank + suit: 'Ah', 'Ts' (ten of spades), 'Qd', 'Kc'. In Devils in the
// Corner (the variant 'demons') every king is a devil and wears the devil's eye; classic kings don't.

import { cards, lang, t } from './i18n.js';

// The faces keep the international indices (A, J, Q, K) in every language; names are translated.
const RANK_LABEL = { A: 'A', T: '10', J: 'J', Q: 'Q', K: 'K' };
const RANK_NAME = { A: t('Ace'), T: '10', J: t('Jack'), Q: t('Queen'), K: t('King') };
const SUIT_NAME = { s: t('spades'), h: t('hearts'), d: t('diamonds'), c: t('clubs') };
const SUIT_CHAR = { s: '♠', h: '♥', d: '♦', c: '♣' };

export const isRed = (code) => code[1] === 'h' || code[1] === 'd';
export const rankLabel = (code) => RANK_LABEL[code[0]] ?? code[0];
// "Queen of hearts" / "Herz-Dame"
export function cardName(code, demon = false) {
  const rank = code[0] === 'K' && demon ? t('Devil') : RANK_NAME[code[0]] ?? code[0];
  return lang === 'de' ? `${SUIT_NAME[code[1]]}-${rank}` : `${rank} of ${SUIT_NAME[code[1]]}`;
}
export const cardShort = (code) => `${rankLabel(code)}${SUIT_CHAR[code[1]]}`;

const use = (id, attrs = '') => `<use href="#${id}" ${attrs}/>`;

// Large card corners (a setting): a bigger rank and suit, with the pips drawn a little further in.
const style = { bigIndex: false };
export const setCardStyle = (next) => Object.assign(style, next);

// Where the pips go on a 100 x 140 face: [x, y]; those below the middle are drawn upside down.
const L = 31, C = 50, R = 69;
const ROWS4 = [24, 54.7, 85.3, 116];
const PIPS = {
  2: [[C, 24], [C, 116]],
  3: [[C, 24], [C, 70], [C, 116]],
  4: [[L, 24], [R, 24], [L, 116], [R, 116]],
  5: [[L, 24], [R, 24], [C, 70], [L, 116], [R, 116]],
  6: [[L, 24], [R, 24], [L, 70], [R, 70], [L, 116], [R, 116]],
  7: [[L, 24], [R, 24], [C, 47], [L, 70], [R, 70], [L, 116], [R, 116]],
  8: [[L, 24], [R, 24], [C, 47], [L, 70], [R, 70], [C, 93], [L, 116], [R, 116]],
  9: [...ROWS4.flatMap((y) => [[L, y], [R, y]]), [C, 70]],
  T: [...ROWS4.flatMap((y) => [[L, y], [R, y]]), [C, 39.3], [C, 100.7]],
};

function pipsSVG(code) {
  const s = code[1];
  const inset = style.bigIndex ? 3 : 0;
  if (code[0] === 'A') {
    const size = s === 's' ? 56 : 44;
    return use(`suit-${s}`, `x="${50 - size / 2}" y="${70 - size / 2}" width="${size}" height="${size}"`);
  }
  return PIPS[code[0]].map(([x0, y]) => {
    const x = x0 === L ? x0 + inset : x0 === R ? x0 - inset : x0;
    const flip = y > 70 ? ` transform="rotate(180 ${x} ${y})"` : '';
    return use(`suit-${s}`, `x="${x - 10}" y="${y - 10}" width="20" height="20"${flip}`);
  }).join('');
}

// Court cards: a framed, double-headed figure, as on a classic deck.
function courtSVG(code, demon) {
  const palette = isRed(code) ? 'a' : 'b';
  const figure = `court-${code[0].toLowerCase()}-${palette}`;
  const eye = demon && code[0] === 'K' ? use('demon-eye', 'x="20" y="16" width="60" height="54"') : '';
  const half = `${use(figure, 'x="20" y="16" width="60" height="54"')}${eye}`;
  return `<rect x="20" y="16" width="60" height="108" class="frame-fill"/>${half}`
    + `<g transform="rotate(180 50 70)">${half}</g>`
    + '<line x1="20" y1="70" x2="80" y2="70" class="frame-line"/>'
    + '<rect x="20" y="16" width="60" height="108" class="frame"/><rect x="21.6" y="17.6" width="56.8" height="104.8" class="frame inner"/>'
    + use(`suit-${code[1]}`, 'x="23" y="19" width="10" height="10"')
    + use(`suit-${code[1]}`, 'x="67" y="111" width="10" height="10" transform="rotate(180 72 116)"');
}

function indexSVG(code, demon) {
  const label = rankLabel(code);
  const eye = demon && code[0] === 'K' ? use('demon-eye-mark', 'x="3" y="43" width="15" height="9"') : '';
  const big = style.bigIndex;
  const one = `<text x="${big ? 11.5 : 10.5}" y="${big ? 28 : 24.5}" class="rank${label.length > 1 ? ' ten' : ''}${big ? ' big' : ''}">${label}</text>`
    + use(`suit-${code[1]}`, big ? 'x="3.5" y="32" width="16" height="16"' : 'x="4" y="28.5" width="13" height="13"') + eye;
  return one + `<g transform="rotate(180 50 70)">${one}</g>`;
}

// `tag` is 'button' for the cards in your hand, which you tap. `demon`: this deck's kings are devils.
export function cardHTML(code, cls = '', tag = 'div', demon = false) {
  const court = 'JQK'.includes(code[0]);
  const isDemon = demon && code[0] === 'K';
  const role = tag === 'div' ? ' role="img"' : '';
  const face = court ? courtSVG(code, demon) : pipsSVG(code);
  return `<${tag} class="card ${isRed(code) ? 'red' : 'black'} s-${code[1]}${court ? ' court' : ''}${isDemon ? ' demon' : ''} ${cls}"`
    + ` data-card="${code}"${role} aria-label="${cardName(code, demon)}">`
    + `<svg class="face" viewBox="0 0 100 140" aria-hidden="true">${indexSVG(code, demon)}${face}</svg></${tag}>`;
}

export const chipHTML = (code) => `<span class="chip${isRed(code) ? ' red' : ''} s-${code[1]}">${cardShort(code)}</span>`;
export const chipsHTML = (codes) => `<span class="chips">${codes.map(chipHTML).join('')}</span>`;

export const backHTML = (cls = '') =>
  `<div class="card back ${cls}" aria-hidden="true"><svg class="face" viewBox="0 0 100 140">${use('card-back')}</svg></div>`;

// A pile is squared up the way people lay one out: the card it starts with peeks out (on a side, the
// card that moves the pile; in a corner, its king), the edges of the cards in between show as fine
// lines (up to five), and the card on top lies in full, since that's what you play onto. The count
// says how many there are.
const LINES = 5;
export function pileHTML(pile, cls = '', { showBase = true, demon = false } = {}) {
  if (!pile.length) return '';
  const top = pile[pile.length - 1];
  const base = showBase && pile.length > 1 ? cardHTML(pile[0], 'base', 'div', demon) : '';
  const between = base ? Math.min(pile.length - 2, LINES) : 0;
  const edges = '<i class="edge" aria-hidden="true"></i>'.repeat(between);
  // The count, on any pile with more cards than it shows in full; tap it to see them all.
  const depth = pile.length > (base ? 2 : 1) ? `<span class="depth" aria-label="${cards(pile.length)}">${pile.length}</span>` : '';
  return `<div class="pile ${cls}" data-size="${pile.length}"${base ? ` data-base style="--lines:${between}"` : ''}>`
    + `${base}${edges}${cardHTML(top, 'top', 'div', demon)}${depth}</div>`;
}

// The pictures people at a Wi-Fi table pick from: their initial ('mono'), or one of these, each
// struck like a medal (a colour, a cream glyph lit from above, a ring of beads round the rim).
const CREAM = '#f4efe1';
const SHEEN = 'url(#cream-sheen)';
const shine = (d) => `<path d="${d}" stroke="#fff" stroke-width="1.7" stroke-linecap="round" fill="none" opacity=".75"/>`;
const around = (n, draw) => Array.from({ length: n }, (_, k) => draw(k * 360 / n)).join('');
const PICTURES = {
  spade: ['#2b3a67', `<use href="#suit-s" x="15" y="13.6" width="34" height="34" fill="${SHEEN}"/>${shine('M22.8 31q.4-5 6.6-10')}`],
  heart: ['#b3132b', `<use href="#suit-h" x="15" y="15.6" width="34" height="34" fill="${SHEEN}"/>${shine('M20.8 25.8q.2-4.2 4.6-5')}`],
  diamond: ['#cf5a1f', `<use href="#suit-d" x="15" y="15" width="34" height="34" fill="${SHEEN}"/>${shine('M25.4 27.4l5-7.4')}`],
  club: ['#1d6b45', `<use href="#suit-c" x="15" y="13.6" width="34" height="34" fill="${SHEEN}"/>${shine('M28.4 18.6q1.4-2.4 4.2-2.6')}`],
  crown: ['#a97c21', `<path d="M15 44.6 12.4 22.4l10.2 9.4L32 15.4l9.4 16.4 10.2-9.4L49 44.6z" fill="${SHEEN}"/>
    <rect x="14.4" y="43.6" width="35.2" height="6.6" rx="1.8" fill="${SHEEN}"/>
    <g fill="${CREAM}" stroke="#8a6416" stroke-width=".6"><circle cx="12.4" cy="21.4" r="2.6"/><circle cx="32" cy="14.4" r="2.8"/><circle cx="51.6" cy="21.4" r="2.6"/></g>
    <path d="M32 28.6l3.2 4.6-3.2 4.6-3.2-4.6z" fill="#1d6b45"/><circle cx="21.4" cy="38" r="1.6" fill="#1f4e9c"/><circle cx="42.6" cy="38" r="1.6" fill="#1f4e9c"/>
    <g fill="#c8102e"><circle cx="22.4" cy="46.9" r="1.8"/><circle cx="41.6" cy="46.9" r="1.8"/></g><circle cx="32" cy="46.9" r="2.2" fill="#1f4e9c"/>
    <path d="M16.4 41.4q15.6-3.6 31.2 0" stroke="#a97c21" stroke-width="1.1" stroke-dasharray=".1 2.4" stroke-linecap="round" fill="none"/>`],
  eye: ['#5a1219', `<path d="M7.6 32q24.4-25 48.8 0-24.4 25-48.8 0z" fill="#26080b"/>
    <path d="M10.6 32q21.4-19.6 42.8 0-21.4 19.6-42.8 0z" fill="url(#eye-white)"/>
    <circle cx="32" cy="32" r="10" fill="url(#eye-iris)"/>
    <ellipse cx="32" cy="32" rx="2.6" ry="8.6" fill="#120607"/>
    <circle cx="35.6" cy="28.2" r="2" fill="#fff" opacity=".85"/>
    <path d="M13.4 26.4l-3-4M19.6 22l-1.8-4.4M26.2 19.4l-.8-4.6M33.2 18.8l.4-4.6M40.2 20.4l1.6-4.4M46.6 24l2.8-3.8" stroke="#ffb47d" stroke-width="1.5" stroke-linecap="round"/>`],
  star: ['#3d4f9a', `<path d="M32 10.6l6.4 13.6 14.8 1.8-10.9 10.2 2.8 14.7L32 43.7l-13.1 7.2 2.8-14.7L10.8 26l14.8-1.8z" fill="${SHEEN}"/>
    <path d="M32 10.6V32l6.4-7.8zM53.2 26 32 32l10.3 4.2zM45.1 50.9 32 32v11.7zM18.9 50.9 32 32l-10.3 4.2zM10.8 26 32 32l-6.4-7.8z" fill="#3d4f9a" opacity=".2"/>`],
  cat: ['#2f7f73', `<path d="M15.4 25.6 17.6 11l10 7.6h8.8l10-7.6 2.2 14.6c1.6 3 2.4 6.4 2.4 10 0 9.4-8 16-19 16s-19-6.6-19-16c0-3.6.8-7 2.4-10z" fill="${SHEEN}"/>
    <path d="M19.4 15.6l1.2 7.8 5.2-3.8zM44.6 15.6l-1.2 7.8-5.2-3.8z" fill="#e7a3a0"/>
    <path d="M32 19.6v4.4M28.2 20l.9 3.6M35.8 20l-.9 3.6" stroke="#c7b48e" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="25.2" cy="33" rx="3.5" ry="3.9" fill="#8fd16a" stroke="#5b8a3c" stroke-width=".6"/><ellipse cx="38.8" cy="33" rx="3.5" ry="3.9" fill="#8fd16a" stroke="#5b8a3c" stroke-width=".6"/>
    <ellipse cx="25.2" cy="33" rx="1" ry="3.2" fill="#16181b"/><ellipse cx="38.8" cy="33" rx="1" ry="3.2" fill="#16181b"/>
    <circle cx="26.4" cy="31.6" r=".9" fill="#fff"/><circle cx="40" cy="31.6" r=".9" fill="#fff"/>
    <path d="M29.6 39.2h4.8L32 42z" fill="#d9707a"/>
    <path d="M32 42q-1.4 2.6-4 2M32 42q1.4 2.6 4 2" stroke="#7a6a55" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M24.4 40.6l-9-1.4M24.4 42.6l-8.6 1.6M39.6 40.6l9-1.4M39.6 42.6l8.6 1.6" stroke="#9a8a70" stroke-width=".8" stroke-linecap="round"/>`],
  moon: ['#5d3f87', `<path d="M40 13a20 20 0 1 0 11 30A16 16 0 0 1 40 13z" fill="${SHEEN}"/>
    <g fill="#5d3f87" opacity=".2"><circle cx="23.8" cy="38.4" r="2.8"/><circle cx="21.6" cy="28.6" r="1.5"/><circle cx="30" cy="45.4" r="1.7"/></g>
    <g fill="${CREAM}"><path d="M46 21l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z"/><path d="M50.6 32.4l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/><circle cx="41" cy="17.4" r=".9"/></g>`],
  sun: ['#c9831a', `<g fill="${SHEEN}">${around(8, (a) => `<path d="M32 6.4l3.2 10h-6.4z" transform="rotate(${a} 32 32)"/>`)}${around(8, (a) => `<path d="M32 11.6l2 6h-4z" transform="rotate(${a + 22.5} 32 32)"/>`)}</g>
    <circle cx="32" cy="32" r="12" fill="${SHEEN}"/><circle cx="32" cy="32" r="9.6" fill="none" stroke="#c9831a" stroke-opacity=".45" stroke-width="1"/>
    <path d="M27 31q1.6-1.6 3.2 0M33.8 31q1.6-1.6 3.2 0M28.4 35.2q3.6 2.8 7.2 0" stroke="#a8641a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`],
};
export const PICTURE_IDS = ['mono', ...Object.keys(PICTURES)];

// The family have portraits. People at a Wi-Fi table are '@Name|picture': the picture they chose,
// or their initial on a colour of their own.
export function avatarHTML(who, cls = '') {
  if (who.startsWith('@')) {
    const [name, picture] = who.slice(1).split('|');
    const pic = PICTURES[picture];
    if (pic) {
      return `<span class="avatar pic ${cls}" style="background:${pic[0]}" aria-hidden="true"><svg viewBox="0 0 64 64">`
        + `<circle cx="32" cy="32" r="32" fill="url(#medal)"/>`
        + `<circle cx="32" cy="32" r="29.4" fill="none" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray=".1 2.7" stroke-linecap="round"/>`
        + `<circle cx="32" cy="32" r="27.2" fill="none" stroke="${CREAM}" stroke-opacity=".3" stroke-width=".8"/>`
        + `<g filter="url(#raised)">${pic[1]}</g></svg></span>`;
    }
    const hue = [...name].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) % 360, 17);
    return `<span class="avatar monogram ${cls}" style="--hue:${hue}" aria-hidden="true"><b>${[...name][0]?.toUpperCase() ?? '?'}</b></span>`;
  }
  return `<span class="avatar ${who} ${cls}" aria-hidden="true"><svg viewBox="0 0 64 64">${use(`face-of-${who}`)}</svg></span>`;
}

export const eyeHTML = (cls = '') => `<svg class="eye ${cls}" viewBox="0 0 24 14" aria-hidden="true">${use('demon-eye-mark')}</svg>`;

// ---------------------------------------------------------------------- the table

export const CROSS = ['nw', 'n', 'ne', 'w', 'stock', 'e', 'sw', 's', 'se'];
export const CORNERS = ['ne', 'se', 'sw', 'nw'];
const SPOT_NAME = { n: t('North pile'), e: t('East pile'), s: t('South pile'), w: t('West pile'),
  ne: t('Northeast corner'), se: t('Southeast corner'), sw: t('Southwest corner'), nw: t('Northwest corner') };

export const spotName = (id) => SPOT_NAME[id];

function spotHTML(id, pile, view) {
  const corner = CORNERS.includes(id);
  const demon = view.variant === 'demons';
  const cls = ['spot', corner ? 'corner' : 'side', id];
  if (view.targets?.has(id)) cls.push('target');
  if (view.lifted === id) cls.push('lifted');
  if (view.fresh === id) cls.push('fresh');
  const fresh = view.fresh === id && view.freshBy ? avatarHTML(view.freshBy, 'fresh-by') : '';
  const inside = pile.length ? pileHTML(pile, '', { demon }) + fresh
    : corner ? `<div class="slot">${demon ? eyeHTML() : '<span>K</span>'}</div>`
    : '<div class="slot"></div>';
  const label = pile.length ? t('{spot}, {cards}, {card} on top', { spot: SPOT_NAME[id], cards: cards(pile.length), card: cardName(pile.at(-1), demon) })
    : corner ? (demon ? t('{spot}, empty, devils only', { spot: SPOT_NAME[id] }) : t('{spot}, empty, kings only', { spot: SPOT_NAME[id] }))
    : t('{spot}, empty, any card', { spot: SPOT_NAME[id] });
  return `<button class="${cls.join(' ')}" data-spot="${id}" aria-label="${label}">${inside}</button>`;
}

function stockHTML(view) {
  if (view.stock > 0) {
    const layers = Math.min(3, view.stock);
    return `<div class="stock" aria-label="${t('Stock, {cards}', { cards: cards(view.stock) })}">${backHTML().repeat(layers)}<span class="count">${view.stock}</span></div>`;
  }
  const passes = view.passes ? `<span class="count">${t('{n} of {m} passed', { n: view.passes, m: view.players })}</span>` : '';
  return `<div class="stock out" aria-label="${t('The stock is out')}"><div class="slot">${t('Stock<br>is out')}</div>${passes}</div>`;
}

// A rival's seat: their backs fanned at the table's edge, then their portrait with how many cards
// they hold on a badge, and their name. Only the seat across the table has room for a word on what
// they're doing ("Playing…", "Away"); at the sides that shows on the plate itself.
export function seatHTML(r) {
  const held = cards(r.count);
  const fan = backHTML().repeat(Math.min(r.count, 9));
  // A timed turn: a ring round the portrait drains with the clock.
  const clock = r.clock ? ` timed" style="--n:${Math.min(r.count, 9)};${clockStyle(r.clock)}` : `" style="--n:${Math.min(r.count, 9)}`;
  const ring = r.clock ? '<i class="ring" aria-hidden="true"></i>' : '';
  const away = r.away ? '<i class="paused" aria-hidden="true"></i>' : '';
  const pts = r.score === undefined ? '' : `<i class="pts">${t('{n} pts', { n: r.score })}</i>`;
  const said = [r.name, held, r.score === undefined ? '' : t('{n} points', { n: r.score }), r.note].filter(Boolean).join(', ');
  return `<div class="seat ${r.pos}${r.turn ? ' turn' : ''}${r.away ? ' away' : ''}${clock}" data-seat="${r.seat ?? ''}">`
    + `<div class="fan" aria-hidden="true">${fan}</div>`
    + `<div class="plate"><span class="face">${avatarHTML(r.who)}${ring}${away}<span class="held" aria-hidden="true">${r.count}</span></span>`
    + `<span class="who" aria-hidden="true"><b>${r.name}</b>${pts}${r.note ? `<span>${r.note}</span>` : ''}</span>`
    + `<span class="said">${said}</span></div></div>`;
}

const clockStyle = (c) => `--total:${c.total}ms;--elapsed:${c.elapsed}ms`;

// The whole game screen for one moment of play (see app.js for where `view` comes from).
export function tableHTML(view) {
  const demon = view.variant === 'demons';
  const cells = CROSS.map((id) => (id === 'stock' ? stockHTML(view) : spotHTML(id, view.spots[id] ?? [], view))).join('');
  const handCard = (code, i) => {
    const playable = view.playable?.has(code);
    let html = cardHTML(code, [view.picked === code ? 'picked' : '', playable && view.picked !== code ? 'playable' : ''].filter(Boolean).join(' '), 'button', demon)
      .replace('<button ', `<button style="--i:${i}" `);
    if (playable) html = html.replace(`aria-label="${cardName(code, demon)}"`, `aria-label="${t('{card}, can be played', { card: cardName(code, demon) })}"`);
    return html;
  };
  // More than ten cards don't leave a thumb's width of each in one row: they go in two, the first
  // half behind and above (their corners still show), the rest in front.
  const two = view.hand.length > 10;
  const split = Math.ceil(view.hand.length / 2);
  const rows = two
    ? `<div class="hand-row back" style="--n:${split}">${view.hand.slice(0, split).map(handCard).join('')}</div>`
      + `<div class="hand-row front" style="--n:${view.hand.length - split}">${view.hand.slice(split).map(handCard).join('')}</div>`
    : view.hand.map(handCard).join('');
  const aidClass = view.playable?.size ? ' aid' : '';
  const a = view.actions ?? {};
  const banner = view.banner
    ? `<div class="banner ${view.banner.kind}" role="status">${demon ? eyeHTML() : ''}<b>${view.banner.title}</b><span>${view.banner.text}</span></div>` : '';
  const top = view.seats.filter((s) => s.pos === 'top').map(seatHTML).join('');
  const sides = view.seats.filter((s) => s.pos !== 'top').map(seatHTML).join('');
  return `<div class="table game ${demon ? 'demons' : 'classic'} seats-${view.seats.length}">
    <div class="top-seat">${top}</div>
    <div class="board">${sides}<div class="felt-line"></div><div class="cross">${cells}</div>${banner}</div>
    <p class="status" role="status">${view.status ?? ''}</p>
    <div class="hand${two ? ' two' : ''}${aidClass}" style="--n:${view.hand.length}" aria-label="${t('Your hand')}">${rows}</div>
    ${view.clock ? `<div class="turn-clock" style="${clockStyle(view.clock)}" role="timer"><i></i><span data-clock class="clock"></span>${view.clock.more ? `<button class="more" data-act="more">${view.clock.more}</button>` : ''}</div>` : ''}
    <div class="actions">
      <button class="btn plain" data-act="undo"${a.undo ? '' : ' disabled'}>${t('Undo')}</button>
      <button class="btn${a.ready ? ' ready' : ''}" data-act="end"${a.end === false ? ' disabled' : ''}>${a.endLabel ?? t('End turn')}</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------- the glyphs, once per page

export function installSprites(doc = document) {
  if (doc.getElementById('kitc-sprites')) return;
  const holder = doc.createElement('div');
  holder.innerHTML = SPRITES;
  holder.firstElementChild.id = 'kitc-sprites';
  doc.body.prepend(holder.firstElementChild);
}

const INK = '#16181b';
const SKIN = '#f6dcb6';
const GOLD = '#f0c23b';
const RED = '#c8102e';
const BLUE = '#1f4e9c';
const LEAF = 'url(#gold-leaf)';
// Each figure's robes are brocade: red with gold lozenges, blue with a fine twill.
const PALETTES = { a: { main: RED, trim: BLUE, robe: 'url(#robe-red)', robe2: 'url(#robe-blue)' },
  b: { main: BLUE, trim: RED, robe: 'url(#robe-blue)', robe2: 'url(#robe-red)' } };
const stroke = `stroke="${INK}" stroke-linejoin="round"`;

// One half of each court figure, in a 60 x 54 box: the head near the top, the frame's middle at
// the bottom edge.
function king({ main, trim, robe }) {
  return `<line x1="7" y1="54" x2="14" y2="6" stroke="${INK}" stroke-width="2.4"/><line x1="7" y1="54" x2="14" y2="6" stroke="${GOLD}" stroke-width="1.2"/>
  <circle cx="14" cy="5.6" r="2" fill="${GOLD}" ${stroke} stroke-width=".7"/>
  <path d="M0 54V34q8-7 18-8h24q10 1 18 8v20z" fill="${robe}" ${stroke} stroke-width=".9"/>
  <path d="M24 26h12l2.4 28H21.6z" fill="${LEAF}" ${stroke} stroke-width=".7"/>
  <g fill="${trim}"><circle cx="30" cy="33" r="1.3"/><circle cx="30" cy="40" r="1.3"/><circle cx="30" cy="47" r="1.3"/></g>
  <g fill="${GOLD}" ${stroke} stroke-width=".5"><path d="M9 41l3 3.6-3 3.6-3-3.6z"/><path d="M51 41l3 3.6-3 3.6-3-3.6z"/></g>
  <path d="M4 32q26 9 52 0v4.6q-26 9-52 0z" fill="#fff" ${stroke} stroke-width=".8"/>
  <g fill="${INK}"><path d="M11 36.4l.8 2.4.8-2.4z"/><path d="M19 38.4l.8 2.4.8-2.4z"/><path d="M29.2 39.4l.8 2.4.8-2.4z"/><path d="M39.4 38.4l.8 2.4.8-2.4z"/><path d="M47.4 36.4l.8 2.4.8-2.4z"/></g>
  <circle cx="13" cy="30" r="3" fill="${SKIN}" ${stroke} stroke-width=".7"/>
  <path d="M20.6 11q-2.4 9 .4 16h18q2.8-7 .4-16z" fill="${LEAF}" ${stroke} stroke-width=".8"/>
  <ellipse cx="30" cy="15.6" rx="7.4" ry="8.4" fill="${SKIN}" ${stroke} stroke-width=".9"/>
  <path d="M25.6 13.8q1.4-1.2 2.8 0M31.6 13.8q1.4-1.2 2.8 0" fill="none" ${stroke} stroke-width=".8"/>
  <g fill="${INK}"><circle cx="27" cy="14.7" r=".75"/><circle cx="33" cy="14.7" r=".75"/></g>
  <path d="M30 15l-.9 3.2h1.8" fill="none" ${stroke} stroke-width=".6"/>
  <path d="M23 19q1 9 7 10.4 6-1.4 7-10.4-3 5-7 5t-7-5z" fill="${LEAF}" ${stroke} stroke-width=".8"/>
  <path d="M25.4 19.6q4.6-2.4 9.2 0-4.6 1.8-9.2 0z" fill="${GOLD}" ${stroke} stroke-width=".6"/>
  <path d="M27 24.4l1 3M33 24.4l-1 3M30 25v3.6" stroke="${INK}" stroke-width=".4"/>
  <path d="M21.6 9.4l1-8 3.6 4.2L30 .2l3.8 5.4 3.6-4.2 1 8z" fill="${LEAF}" ${stroke} stroke-width=".9"/>
  <rect x="21.6" y="8.2" width="16.8" height="3.4" fill="${main}" ${stroke} stroke-width=".7"/>
  <g fill="#fff"><circle cx="25.4" cy="9.9" r=".9"/><circle cx="30" cy="9.9" r=".9"/><circle cx="34.6" cy="9.9" r=".9"/></g>`;
}

function queen({ main, trim, robe }) {
  return `<line x1="50" y1="54" x2="49" y2="22" stroke="${INK}" stroke-width="1"/>
  <g ${stroke} stroke-width=".6"><circle cx="46.6" cy="20" r="2.4" fill="${trim}"/><circle cx="51.4" cy="20" r="2.4" fill="${trim}"/><circle cx="49" cy="17.4" r="2.4" fill="${trim}"/><circle cx="49" cy="22.4" r="2.4" fill="${trim}"/><circle cx="49" cy="20" r="1.6" fill="${GOLD}"/></g>
  <path d="M0 54V35q8-7 18-8h24q10 1 18 8v19z" fill="${robe}" ${stroke} stroke-width=".9"/>
  <path d="M18 27h24l-4 10H22z" fill="#fff" ${stroke} stroke-width=".7"/>
  <path d="M21 54l3-17h12l3 17z" fill="${LEAF}" ${stroke} stroke-width=".7"/>
  <g fill="${trim}"><path d="M30 40l2 3-2 3-2-3z"/><path d="M30 47l2 3-2 3-2-3z"/></g>
  <path d="M20.4 10q-4 12-1.4 21h4.6V15zM39.6 10q4 12 1.4 21h-4.6V15z" fill="${LEAF}" ${stroke} stroke-width=".7"/>
  <ellipse cx="30" cy="16" rx="7" ry="8.2" fill="${SKIN}" ${stroke} stroke-width=".9"/>
  <path d="M25.8 14.6q1.3-1.1 2.6 0M31.6 14.6q1.3-1.1 2.6 0" fill="none" ${stroke} stroke-width=".8"/>
  <g fill="${INK}"><circle cx="27.1" cy="15.5" r=".7"/><circle cx="32.9" cy="15.5" r=".7"/></g>
  <path d="M30 15.6l-.8 3h1.6" fill="none" ${stroke} stroke-width=".6"/>
  <path d="M28 21.2q2 1.2 4 0-2 1.6-4 0z" fill="${RED}" stroke="${RED}" stroke-width=".8"/>
  <path d="M22.6 29q7.4 4 14.8 0" fill="none" stroke="${INK}" stroke-width=".5" stroke-dasharray=".1 1.6" stroke-linecap="round"/>
  <path d="M22 10q0-6 4-4 2-5.6 4-2.4 2-3.2 4 2.4 4-2 4 4z" fill="${LEAF}" ${stroke} stroke-width=".8"/>
  <circle cx="30" cy="1.6" r="1.3" fill="${GOLD}" ${stroke} stroke-width=".6"/>
  <rect x="22" y="9" width="16" height="2.6" rx="1" fill="${main}" ${stroke} stroke-width=".6"/>`;
}

function jack({ main, trim, robe, robe2 }) {
  return `<line x1="52" y1="54" x2="53" y2="8" stroke="${INK}" stroke-width="1.6"/>
  <path d="M53 6l4 4-4 5-1.4-4.6z" fill="${GOLD}" ${stroke} stroke-width=".6"/>
  <path d="M0 54V35q8-7 18-8h24q10 1 18 8v19z" fill="${robe2}" ${stroke} stroke-width=".9"/>
  <path d="M30 27h12q10 1 18 8v19H30z" fill="${robe}" ${stroke} stroke-width=".9"/>
  <path d="M6 33q24 8 48 0v4q-24 8-48 0z" fill="${LEAF}" ${stroke} stroke-width=".7"/>
  <g fill="${INK}"><circle cx="15" cy="37.6" r=".8"/><circle cx="30" cy="40" r=".8"/><circle cx="45" cy="37.6" r=".8"/></g>
  <path d="M21 11q-3 9 0 17h18q3-8 0-17z" fill="${LEAF}" ${stroke} stroke-width=".8"/>
  <path d="M21.4 20q-1.6 3 .4 6M38.6 20q1.6 3-.4 6" fill="none" stroke="${INK}" stroke-width=".5"/>
  <ellipse cx="30" cy="16.4" rx="6.8" ry="8" fill="${SKIN}" ${stroke} stroke-width=".9"/>
  <path d="M26 15q1.3-1.1 2.6 0M31.4 15q1.3-1.1 2.6 0" fill="none" ${stroke} stroke-width=".8"/>
  <g fill="${INK}"><circle cx="27.3" cy="15.9" r=".7"/><circle cx="32.7" cy="15.9" r=".7"/></g>
  <path d="M30 16l-.8 3h1.6" fill="none" ${stroke} stroke-width=".6"/>
  <path d="M27.4 21.6q2.6 1.2 5.2 0" fill="none" ${stroke} stroke-width=".6"/>
  <path d="M19.4 10.4q1.6-8.6 11-8.6 9.6 0 11.4 8.6z" fill="${robe}" ${stroke} stroke-width=".9"/>
  <rect x="19.4" y="9" width="22" height="3" rx="1.2" fill="${GOLD}" ${stroke} stroke-width=".6"/>
  <path d="M39 7q6-7 14-6.4-4 6.6-12.6 9z" fill="${trim}" ${stroke} stroke-width=".6"/>`;
}

const FIGURES = { k: king, q: queen, j: jack };

// Small helpers for the portraits: rays from a point, beads along a curve.
const rays = (cx, cy, n) => around(n, (a) => `<path d="M${cx} ${cy}L${cx - 3.4} -8h6.8z" transform="rotate(${a} ${cx} ${cy})"/>`);
function beads([x0, y0], [cx, cy], [x1, y1], n, r) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r}"/>`;
  }).join('');
}
const radial = (id, stops, at = 'cx="50%" cy="35%" r="75%"') =>
  `<radialGradient id="${id}" ${at}>${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const skin = (id, light, base, shade) => radial(id, [[0, light], [0.62, base], [1, shade]], 'cx="42%" cy="36%" r="72%"');
const fleuron = (x, y) => `<g fill="#f6e9e3"><circle cx="${x}" cy="${y - 2}" r="1.5"/><circle cx="${x + 2}" cy="${y}" r="1.5"/><circle cx="${x}" cy="${y + 2}" r="1.5"/><circle cx="${x - 2}" cy="${y}" r="1.5"/></g><circle cx="${x}" cy="${y}" r=".9" fill="#a5182b"/>`;

const SPRITES = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
  <clipPath id="round"><circle cx="32" cy="32" r="32"/></clipPath>
  <!-- the card back: interlaced rings on red -->
  <pattern id="lattice" width="8" height="8" patternUnits="userSpaceOnUse">
    <rect width="8" height="8" fill="#a5182b"/>
    <g fill="none" stroke="#f6e9e3" stroke-width=".5" opacity=".78"><circle r="4"/><circle cx="8" r="4"/><circle cy="8" r="4"/><circle cx="8" cy="8" r="4"/><circle cx="4" cy="4" r="4"/></g>
    <circle cx="4" cy="4" r=".7" fill="#f6e9e3" opacity=".8"/>
  </pattern>
  <linearGradient id="back-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
  <!-- court robes and gold leaf -->
  <pattern id="robe-red" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="${RED}"/><path d="M2 .5l1 1.5-1 1.5-1-1.5z" fill="${GOLD}" opacity=".5"/></pattern>
  <pattern id="robe-blue" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="2.6" fill="${BLUE}"/><rect width="2.6" height=".7" fill="#fff" opacity=".2"/></pattern>
  <linearGradient id="gold-leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe38f"/><stop offset=".55" stop-color="${GOLD}"/><stop offset="1" stop-color="#c38f17"/></linearGradient>
  <radialGradient id="eye-glow"><stop offset="0" stop-color="#ff5a1f" stop-opacity=".75"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></radialGradient>
  <!-- the pictures: struck like medals -->
  ${radial('medal', [[0, '#fff', 0.3], [0.42, '#fff', 0], [0.78, '#000', 0.1], [1, '#000', 0.4]], 'cx="36%" cy="26%" r="82%"')}
  <linearGradient id="cream-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbf2"/><stop offset="1" stop-color="#e6d9bb"/></linearGradient>
  <filter id="raised" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.4" stdDeviation=".9" flood-color="#000" flood-opacity=".38"/></filter>
  ${radial('eye-white', [[0, '#fff4b0'], [1, '#f0ac2c']], 'cx="50%" cy="50%" r="55%"')}
  ${radial('eye-iris', [[0, '#ff8a3d'], [0.6, '#d4261a'], [1, '#5a0b08']], 'cx="50%" cy="50%" r="50%"')}
  <!-- the family's portraits -->
  ${radial('portrait-light', [[0, '#fff', 0.14], [0.5, '#fff', 0], [0.84, '#000', 0.1], [1, '#000', 0.34]], 'cx="50%" cy="30%" r="74%"')}
  ${radial('bg-pip', [[0, '#fbe08c'], [0.6, '#e9b949'], [1, '#c48a20']])}
  ${radial('bg-ray', [[0, '#e0614f'], [0.6, '#b8322a'], [1, '#741a15']])}
  ${radial('bg-june', [[0, '#4db3a4'], [0.6, '#2f7f73'], [1, '#184c45']])}
  ${radial('bg-nana', [[0, '#525a88'], [0.6, '#2b2f45'], [1, '#151827']])}
  ${radial('bg-leo', [[0, '#66b2ea'], [0.6, '#3a86c8'], [1, '#1d4f80']])}
  ${skin('skin-pip', '#fdd5b0', '#f2b98e', '#d6905f')}
  ${skin('skin-ray', '#dfa77a', '#c98a5c', '#a3673e')}
  ${skin('skin-june', '#fde0c6', '#f2c9a6', '#d99d77')}
  ${skin('skin-nana', '#d3a385', '#b98668', '#916147')}
  ${skin('skin-leo', '#a8714e', '#8d5a3b', '#6a4027')}
  ${radial('pearl', [[0, '#fff'], [0.6, '#ebe5ee'], [1, '#aea4b9']], 'cx="35%" cy="30%" r="70%"')}
  <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset="1" stop-color="#c2c8cd"/></linearGradient>
  <linearGradient id="gold-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#b8861f"/></linearGradient>
  <pattern id="stripes-pip" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#2c6e9e"/><rect y="3" width="6" height="1.6" fill="#f4efe1"/></pattern>
  <pattern id="tie-ray" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="3" height="3" fill="#b3221b"/><rect width="3" height=".9" fill="#e9c46a"/></pattern>
  <pattern id="pinstripe" width="4" height="4" patternUnits="userSpaceOnUse"><rect width=".5" height="4" fill="#fff" opacity=".07"/></pattern>
  <pattern id="dots-june" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#c8102e"/><circle cx="1.5" cy="1.5" r=".55" fill="#fff"/></pattern>
  <pattern id="damask" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M4 1.4l1.4 2.6L4 6.6 2.6 4z" fill="#fff" opacity=".07"/></pattern>
  <pattern id="knit" width="2.4" height="3" patternUnits="userSpaceOnUse"><path d="M0 0l1.2 1.5L2.4 0M0 1.5l1.2 1.5 1.2-1.5" stroke="#000" stroke-opacity=".16" stroke-width=".5" fill="none"/></pattern>
</defs>

<symbol id="suit-h" viewBox="0 0 32 32"><path d="M16 29.5S2.5 21 2.5 11.6C2.5 7 6 3.4 10.4 3.4c2.6 0 4.6 1.4 5.6 3.5 1-2.1 3-3.5 5.6-3.5 4.4 0 7.9 3.6 7.9 8.2C29.5 21 16 29.5 16 29.5z"/></symbol>
<symbol id="suit-d" viewBox="0 0 32 32"><path d="M16 1.8c2.6 5 6.4 9.6 11.2 14.2C22.4 20.6 18.6 25.2 16 30.2 13.4 25.2 9.6 20.6 4.8 16 9.6 11.4 13.4 6.8 16 1.8z"/></symbol>
<symbol id="suit-s" viewBox="0 0 32 32"><path d="M16 2.5S2.8 11.6 2.8 19.4c0 4 3 6.7 6.6 6.7 2.5 0 4.5-1.2 5.6-3-.4 3.2-1.6 5.3-3.8 6.8h9.6c-2.2-1.5-3.4-3.6-3.8-6.8 1.1 1.8 3.1 3 5.6 3 3.6 0 6.6-2.7 6.6-6.7C29.2 11.6 16 2.5 16 2.5z"/></symbol>
<symbol id="suit-c" viewBox="0 0 32 32"><circle cx="16" cy="9.2" r="6.4"/><circle cx="8.8" cy="18.6" r="6.4"/><circle cx="23.2" cy="18.6" r="6.4"/><path d="M14.6 15h2.8c0 6.2 1.4 10.4 4.4 14.2H10.2c3-3.8 4.4-8 4.4-14.2z"/></symbol>

${Object.entries(FIGURES).map(([r, draw]) => Object.entries(PALETTES).map(([p, colors]) =>
    `<symbol id="court-${r}-${p}" viewBox="0 0 60 54">${draw(colors)}</symbol>`).join('')).join('')}

<symbol id="demon-eye" viewBox="0 0 60 54">
  <circle cx="30" cy="9.8" r="10" fill="url(#eye-glow)"/>
  <path d="M20.6 9.8q9.4-8.8 18.8 0-9.4 8.8-18.8 0z" fill="#ffe27a" ${stroke} stroke-width=".9"/>
  <circle cx="30" cy="9.8" r="3.6" fill="#e2341d"/>
  <ellipse cx="30" cy="9.8" rx="1" ry="3.3" fill="${INK}"/>
</symbol>
<symbol id="demon-eye-mark" viewBox="0 0 24 14">
  <path d="M1.5 7q10.5-10 21 0-10.5 10-21 0z" fill="#ffe27a" ${stroke} stroke-width="1.4"/>
  <circle cx="12" cy="7" r="3.6" fill="#e2341d"/><ellipse cx="12" cy="7" rx="1" ry="3.2" fill="${INK}"/>
</symbol>

<symbol id="card-back" viewBox="0 0 100 140">
  <rect x="5" y="5" width="90" height="130" rx="4" fill="url(#lattice)"/>
  <rect x="5" y="5" width="90" height="130" rx="4" fill="url(#back-sheen)"/>
  <rect x="8.5" y="8.5" width="83" height="123" rx="2.6" fill="none" stroke="#f6e9e3" stroke-width="1.1"/>
  <rect x="10.8" y="10.8" width="78.4" height="118.4" rx="1.6" fill="none" stroke="#f6e9e3" stroke-width=".45"/>
  ${fleuron(15.4, 15.4)}${fleuron(84.6, 15.4)}${fleuron(15.4, 124.6)}${fleuron(84.6, 124.6)}
  <ellipse cx="50" cy="70" rx="25.8" ry="32.2" fill="none" stroke="#f6e9e3" stroke-width="1" stroke-dasharray=".1 2.6" stroke-linecap="round"/>
  <ellipse cx="50" cy="70" rx="23" ry="29.4" fill="#8f1324" stroke="#f6e9e3" stroke-width="1.4"/>
  <ellipse cx="50" cy="70" rx="19" ry="25.2" fill="none" stroke="#f6e9e3" stroke-width=".55"/>
  <path d="M50 58.4l2.6 8.8 8.8 2.8-8.8 2.8-2.6 8.8-2.6-8.8-8.8-2.8 8.8-2.8z" fill="#f6e9e3" opacity=".55" transform="rotate(45 50 70)"/>
  <path d="M50 49.6l3.4 13.4L65 70l-11.6 7L50 90.4 46.6 77 35 70l11.6-7z" fill="#f6e9e3"/>
  <circle cx="50" cy="70" r="4.2" fill="#a5182b" stroke="#f6e9e3" stroke-width=".9"/>
  <circle cx="50" cy="70" r="1.5" fill="#f6e9e3"/>
</symbol>

<symbol id="face-of-pip" viewBox="0 0 64 64"><g clip-path="url(#round)">
  <rect width="64" height="64" fill="url(#bg-pip)"/>
  <g fill="#fff" opacity=".16">${rays(32, 30, 12)}</g>
  <path d="M5 64c1.6-10.6 10.4-16.2 27-16.2S57.4 53.4 59 64z" fill="url(#stripes-pip)"/>
  <path d="M24.4 48.4q7.6 5.4 15.2 0l-1.8-1.2q-5.8 3.6-11.6 0z" fill="#1d4f75"/>
  <path d="M27 37.6h10v9.4q-5 3.4-10 0z" fill="#e6a77d"/>
  <path d="M27 39.4q5 3.4 10 0v2.8q-5 3.2-10 0z" fill="#c9845c" opacity=".55"/>
  <ellipse cx="19.4" cy="31.6" rx="2.7" ry="3.7" fill="#eda983"/><ellipse cx="44.6" cy="31.6" rx="2.7" ry="3.7" fill="#eda983"/>
  <path d="M19.8 29.8q-1.2 1.8 0 3.6M44.2 29.8q1.2 1.8 0 3.6" stroke="#c9845c" stroke-width=".8" fill="none" stroke-linecap="round"/>
  <ellipse cx="32" cy="30.4" rx="12.8" ry="13.6" fill="url(#skin-pip)"/>
  <path d="M19.2 28.6c-1.4-10 4.6-16.4 12.8-16.4 8.6 0 14.4 6 13 15.4-1.4-3.4-3.4-5.6-6-6.8l.6 3.4c-2.6-2.4-6-3.6-9.6-3.8l1.2 2.6c-3.6-.8-7.2.2-9.4 2.8l.2-2.8c-1.4 1.6-2.4 3.4-2.8 5.6z" fill="#7a4220"/>
  <path d="M30.6 13c-.8-3.2 1.2-5.8 4.6-6-1.8 1.4-2.6 3.4-2.2 5.6z" fill="#7a4220"/>
  <path d="M23.4 18.4q4-3.4 9.4-3.6M36.6 15.6q4 1.2 6 4.6M21.2 23.6q.6-2 1.8-3.4" stroke="#b0703a" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <path d="M24.2 26.6q2.3-1.5 4.8-.4M35 26.2q2.5-1.1 4.8.4" stroke="#6a3a1c" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <ellipse cx="26.8" cy="30.8" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="37.2" cy="30.8" rx="2.5" ry="2.8" fill="#fff"/>
  <circle cx="27.1" cy="31.1" r="1.8" fill="#5a3a22"/><circle cx="37.5" cy="31.1" r="1.8" fill="#5a3a22"/>
  <circle cx="27.1" cy="31.1" r=".9" fill="#1b1410"/><circle cx="37.5" cy="31.1" r=".9" fill="#1b1410"/>
  <circle cx="27.8" cy="30.3" r=".6" fill="#fff"/><circle cx="38.2" cy="30.3" r=".6" fill="#fff"/>
  <path d="M24.2 29.9q2.6-2.6 5.2 0M34.6 29.9q2.6-2.6 5.2 0" stroke="#3a2414" stroke-width=".8" fill="none"/>
  <circle cx="22.6" cy="36" r="2.8" fill="#ff7f6e" opacity=".32"/><circle cx="41.4" cy="36" r="2.8" fill="#ff7f6e" opacity=".32"/>
  <g fill="#b5653c" opacity=".8"><circle cx="23.6" cy="34" r=".55"/><circle cx="25.4" cy="35.2" r=".55"/><circle cx="23.2" cy="36.2" r=".5"/><circle cx="40.4" cy="34" r=".55"/><circle cx="38.6" cy="35.2" r=".55"/><circle cx="40.8" cy="36.2" r=".5"/></g>
  <path d="M30.8 33.6q1.2 1.4 2.4 0" stroke="#c97c55" stroke-width="1" stroke-linecap="round" fill="none"/>
  <path d="M26.6 37.4q5.4 1.6 10.8 0-1 5.4-5.4 5.4t-5.4-5.4z" fill="#6b1f1a"/>
  <path d="M27.2 37.8q4.8 1.2 9.6 0l-.3 1.3q-4.5 1-9 0z" fill="#fff"/>
  <path d="M29.2 41.6q2.8-1.8 5.6 0-1.2 1.1-2.8 1.1t-2.8-1.1z" fill="#e0636a"/>
  <rect width="64" height="64" fill="url(#portrait-light)"/>
</g></symbol>

<symbol id="face-of-ray" viewBox="0 0 64 64"><g clip-path="url(#round)">
  <rect width="64" height="64" fill="url(#bg-ray)"/>
  <rect width="64" height="64" fill="url(#pinstripe)"/>
  <path d="M4 64c2-11.4 12-17.4 28-17.4S58 52.6 60 64z" fill="#2a2f36"/>
  <path d="M8.4 64c1.4-7.6 5.4-12.2 11-14.6" stroke="#4a525c" stroke-width="1" fill="none"/>
  <path d="M24.6 47.2 32 60.4l7.4-13.2q-7.4 2.8-14.8 0z" fill="#f6f4ee"/>
  <path d="M30.2 48.6h3.6l-.6 2.4h-2.4z" fill="#7d1712"/>
  <path d="M30.6 51h2.8l1.2 8.4L32 62l-2.6-2.6z" fill="url(#tie-ray)"/>
  <path d="M24.6 47.2 19.4 50.6l4.6 4.6-2.2 2.8L32 61.4zM39.4 47.2l5.2 3.4-4.6 4.6 2.2 2.8L32 61.4z" fill="#3a414b" stroke="#1c2026" stroke-width=".5"/>
  <path d="M45.2 55l4.2-1.4.8 2.6-4.6.8z" fill="#e9c46a"/>
  <path d="M27 38.4h10v8.8q-5 3.2-10 0z" fill="#b0704a"/>
  <path d="M27 40.2q5 3.2 10 0v2.6q-5 3-10 0z" fill="#8a5233" opacity=".55"/>
  <ellipse cx="19.6" cy="30.6" rx="2.6" ry="3.8" fill="#bf7f55"/><ellipse cx="44.4" cy="30.6" rx="2.6" ry="3.8" fill="#bf7f55"/>
  <ellipse cx="32" cy="29.6" rx="12.6" ry="14" fill="url(#skin-ray)"/>
  <path d="M20.6 33.4q1.8 10.4 11.4 10.4t11.4-10.4q-2.2 6.2-11.4 6.6-9.2-.4-11.4-6.6z" fill="#2a1d16" opacity=".14"/>
  <path d="M19.2 27.6c-1.6-9.8 4.2-15.2 13.4-15.2 8.8 0 14 4.8 12.6 15-1-3.6-2.6-6-5-7.2-5.2 1.2-11 .8-15.6-1.6-2.6 2-4.4 5.4-5.4 9z" fill="#23180f"/>
  <path d="M26 18.4q3.4-4.4 10-4.6M37.6 15.4q4 1.4 5.6 5.4" stroke="#4a3626" stroke-width="1" fill="none" stroke-linecap="round"/>
  <path d="M19.8 26.4q.3-3 1.7-5M44.2 26.4q-.3-3-1.7-5" stroke="#a39d96" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M23.4 25.6q2.8-2 5.8-.6M34.8 25q3-1.4 5.8.6" stroke="#23180f" stroke-width="1.9" stroke-linecap="round" fill="none"/>
  <ellipse cx="27.2" cy="29.8" rx="2.3" ry="2.1" fill="#fff"/><ellipse cx="36.8" cy="29.8" rx="2.3" ry="2.1" fill="#fff"/>
  <circle cx="27.4" cy="30" r="1.5" fill="#3b2716"/><circle cx="37" cy="30" r="1.5" fill="#3b2716"/>
  <circle cx="27.4" cy="30" r=".75" fill="#120c08"/><circle cx="37" cy="30" r=".75" fill="#120c08"/>
  <circle cx="28" cy="29.3" r=".5" fill="#fff"/><circle cx="37.6" cy="29.3" r=".5" fill="#fff"/>
  <path d="M24.8 28.8q2.4-1.8 4.8 0M34.4 28.8q2.4-1.8 4.8 0" stroke="#2a1a10" stroke-width=".9" fill="none"/>
  <path d="M25 32.2q2.2 1 4.4 0M34.6 32.2q2.2 1 4.4 0" stroke="#8f5534" stroke-width=".6" fill="none" opacity=".8"/>
  <path d="M32.4 28.4q-.4 4.2-2 6.2 1.8 1.2 3.8.2" stroke="#8f5534" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23.4 38.8q2.6-3.8 6.2-3.2 1.2.2 2.4 1 1.2-.8 2.4-1 3.6-.6 6.2 3.2-1.8-.8-3.4-.6-2.6.4-5.2 1.4-2.6-1-5.2-1.4-1.6-.2-3.4.6z" fill="#23180f"/>
  <path d="M23.4 38.8q-1.4.4-1.6-1.2M40.6 38.8q1.4.4 1.6-1.2" stroke="#23180f" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path d="M28.4 40.6q3.6 2.2 7.2 0" stroke="#6b2a1c" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <rect width="64" height="64" fill="url(#portrait-light)"/>
</g></symbol>

<symbol id="face-of-june" viewBox="0 0 64 64"><g clip-path="url(#round)">
  <rect width="64" height="64" fill="url(#bg-june)"/>
  <path d="M15.6 34C13.8 14 21.4 6.4 32 6.4S50.2 14 48.4 34c-.4 4.4-2 7.8-4.6 9.6L42 28H22l-1.8 15.6c-2.6-1.8-4.2-5.2-4.6-9.6z" fill="#8a3420"/>
  <path d="M7 64c2-11 11-16.4 25-16.4S55 53 57 64z" fill="#e2ab3c"/>
  <path d="M7 64c2-11 11-16.4 25-16.4S55 53 57 64z" fill="url(#knit)"/>
  <path d="M27.4 39.4h9.2v8.6q-4.6 3.2-9.2 0z" fill="#e5ae88"/>
  <path d="M27.4 41.2q4.6 3 9.2 0v2.4q-4.6 3-9.2 0z" fill="#c98a63" opacity=".55"/>
  <path d="M23.6 47.2q8.4 6 16.8 0l1.6 3.4q-10 6.4-20 0z" fill="url(#dots-june)"/>
  <path d="M33 52.4l3.6 8.4-3.2.6-1.8-8z" fill="url(#dots-june)"/>
  <ellipse cx="32" cy="31.6" rx="12" ry="13.4" fill="url(#skin-june)"/>
  <path d="M19.8 29.4c.2-9 5.4-14.8 12.2-14.8 7.2 0 12.6 5.6 12.2 14.4-2.2-4.6-5.4-7.8-9.6-9-1.2 2.4-4 4-7.6 4.6 1.2-1.2 1.8-2.4 1.8-3.8-3.8 1.4-6.6 4.4-9 8.6z" fill="#9c3d26"/>
  <path d="M24.4 17.6q3.6-2.4 8-2.4M39 18.2q3 2.2 4.4 6M17.6 30q-.6-8 3.4-13" stroke="#c45a3a" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <circle cx="20" cy="39" r="1.9" fill="none" stroke="#f0c23b" stroke-width="1"/><circle cx="44" cy="39" r="1.9" fill="none" stroke="#f0c23b" stroke-width="1"/>
  <path d="M22.6 26.8q2.6-1.4 5.6-.6M35.8 26.2q3-.8 5.6.6" stroke="#7a2c18" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <ellipse cx="26.2" cy="31" rx="2.3" ry="2.4" fill="#fff"/><ellipse cx="37.8" cy="31" rx="2.3" ry="2.4" fill="#fff"/>
  <circle cx="26.4" cy="31.2" r="1.6" fill="#3e7d4a"/><circle cx="38" cy="31.2" r="1.6" fill="#3e7d4a"/>
  <circle cx="26.4" cy="31.2" r=".8" fill="#12160f"/><circle cx="38" cy="31.2" r=".8" fill="#12160f"/>
  <circle cx="27" cy="30.5" r=".5" fill="#fff"/><circle cx="38.6" cy="30.5" r=".5" fill="#fff"/>
  <path d="M23.8 30.2q2.4-2.2 4.8 0M40.2 30.2q-2.4-2.2-4.8 0" stroke="#2a1a12" stroke-width=".9" fill="none" stroke-linecap="round"/>
  <path d="M20.4 29.4c1.8-1.6 5.6-2.2 9.8-1.2.6 3-.6 5.6-4.2 5.8-3.4.2-5.4-1.6-5.6-4.6zM43.6 29.4c-1.8-1.6-5.6-2.2-9.8-1.2-.6 3 .6 5.6 4.2 5.8 3.4.2 5.4-1.6 5.6-4.6z" fill="#fff" fill-opacity=".2" stroke="#5a2414" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M20.4 29.4l-2.4-2.2M43.6 29.4l2.4-2.2" stroke="#5a2414" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M30.2 29q1.8-1 3.6 0" stroke="#5a2414" stroke-width="1.2" fill="none"/>
  <path d="M22.4 30.2l2.2-1.2M35.8 30.2l2.2-1.2" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".75"/>
  <path d="M32 31.6q-.4 3.4-1.6 4.8 1.4.8 3 .2" stroke="#c98563" stroke-width=".9" fill="none" stroke-linecap="round"/>
  <circle cx="23" cy="37" r="2.6" fill="#ff7f6e" opacity=".28"/><circle cx="41" cy="37" r="2.6" fill="#ff7f6e" opacity=".28"/>
  <path d="M27.8 39.2q2.1-1 4.2-.2 2.1-.8 4.2.2-1.6 2.8-4.2 2.8t-4.2-2.8z" fill="#c8102e"/>
  <path d="M29.6 40.8q2.4.6 4.8 0" stroke="#ff8f94" stroke-width=".6" fill="none" opacity=".8"/>
  <circle cx="38.6" cy="36.6" r=".55" fill="#6b3a26"/>
  <rect width="64" height="64" fill="url(#portrait-light)"/>
</g></symbol>

<symbol id="face-of-nana" viewBox="0 0 64 64"><g clip-path="url(#round)">
  <rect width="64" height="64" fill="url(#bg-nana)"/>
  <rect width="64" height="64" fill="url(#damask)"/>
  <path d="M6 64c2-11.4 11.8-16.6 26-16.6S56 52.6 58 64z" fill="#7b5ba3"/>
  <path d="M6 64c2-11.4 11.8-16.6 26-16.6S56 52.6 58 64z" fill="url(#knit)"/>
  <path d="M32 51v13" stroke="#5f437f" stroke-width="1.2"/>
  <g fill="url(#gold-rim)"><circle cx="34.6" cy="56.6" r="1.2"/><circle cx="34.6" cy="61" r="1.2"/></g>
  <path d="M27.4 39.6h9.2v8.6q-4.6 3.2-9.2 0z" fill="#a8775a"/>
  <path d="M27.4 41.4q4.6 3 9.2 0v2.4q-4.6 3-9.2 0z" fill="#80553c" opacity=".55"/>
  <path d="M23.4 47.6q-1 4.8 3.4 5.6 3.4.4 5.2-2.4 1.8 2.8 5.2 2.4 4.4-.8 3.4-5.6-4.2 2-8.6 2.2-4.4-.2-8.6-2.2z" fill="#f7f3ea" stroke="#d9d1c2" stroke-width=".5"/>
  <g fill="url(#pearl)" stroke="#8e8399" stroke-width=".2">${beads([25.2, 49.2], [32, 55.6], [38.8, 49.2], 9, 1.15)}</g>
  <circle cx="32" cy="12.6" r="7.4" fill="url(#silver)"/>
  <path d="M26.6 13.4q1.4-4.6 5.8-4.4 4.2.4 4.6 4.6M28.4 15.8q2.6 2 6.6-.4" stroke="#aab1b7" stroke-width=".9" fill="none" stroke-linecap="round"/>
  <path d="M37.4 9.4l3.8-2.6" stroke="#e9c46a" stroke-width="1.1" stroke-linecap="round"/><circle cx="41.4" cy="6.6" r="1.2" fill="url(#pearl)"/>
  <ellipse cx="19.8" cy="32.4" rx="2.5" ry="3.6" fill="#a8775a"/><ellipse cx="44.2" cy="32.4" rx="2.5" ry="3.6" fill="#a8775a"/>
  <circle cx="19.8" cy="36.4" r="1.2" fill="url(#pearl)"/><circle cx="44.2" cy="36.4" r="1.2" fill="url(#pearl)"/>
  <ellipse cx="32" cy="31.4" rx="12.4" ry="13.6" fill="url(#skin-nana)"/>
  <path d="M19.4 30.4c-1.8-9.4 3.6-14.8 12.6-14.8s14.4 5.4 12.6 14.8c-1-3.8-3-6.6-6-8.2-1.6 1.6-4.2 2.4-6.6 2.2-2.4.2-5-.6-6.6-2.2-3 1.6-5 4.4-6 8.2z" fill="url(#silver)"/>
  <path d="M21.4 26q2.4-5.6 7.6-6.6M42.6 26q-2.4-5.6-7.6-6.6M24.8 19.4q3.6-2 7.2-1.6" stroke="#aab1b7" stroke-width=".9" fill="none" stroke-linecap="round"/>
  <path d="M23.4 26.8q2.4-1 4.8-.2M35.8 26.6q2.4-.8 4.8.2" stroke="#d6dadd" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <ellipse cx="26.6" cy="31.2" rx="2" ry="1.9" fill="#fff"/><ellipse cx="37.4" cy="31.2" rx="2" ry="1.9" fill="#fff"/>
  <circle cx="26.8" cy="31.4" r="1.3" fill="#4a2c1e"/><circle cx="37.6" cy="31.4" r="1.3" fill="#4a2c1e"/>
  <circle cx="26.8" cy="31.4" r=".65" fill="#140c08"/><circle cx="37.6" cy="31.4" r=".65" fill="#140c08"/>
  <circle cx="27.3" cy="30.8" r=".45" fill="#fff"/><circle cx="38.1" cy="30.8" r=".45" fill="#fff"/>
  <path d="M24.4 30.6q2.2-1.8 4.4 0M35.2 30.6q2.2-1.8 4.4 0" stroke="#3a2418" stroke-width=".9" fill="none"/>
  <path d="M21.4 30.6l-1.4-.6M21.4 32l-1.4.4M42.6 30.6l1.4-.6M42.6 32l1.4.4" stroke="#7e5440" stroke-width=".6" stroke-linecap="round"/>
  <g fill="#fff" fill-opacity=".16" stroke="url(#gold-rim)" stroke-width="1.5"><circle cx="26.6" cy="31.2" r="4.4"/><circle cx="37.4" cy="31.2" r="4.4"/></g>
  <path d="M31 30.6q1-.8 2 0" stroke="#e9c46a" stroke-width="1.3" fill="none"/>
  <path d="M22.2 31.6q-3.4 8-1.4 16.4M41.8 31.6q3.4 8 1.4 16.4" stroke="#e9c46a" stroke-width=".7" stroke-dasharray="1.1 .8" fill="none"/>
  <path d="M24 29.6l1.6-1M34.8 29.6l1.6-1" stroke="#fff" stroke-width=".8" opacity=".7" stroke-linecap="round"/>
  <path d="M32 31.6q-.2 3.6-1.8 5 1.8 1 3.8.1" stroke="#7e5440" stroke-width="1" fill="none" stroke-linecap="round"/>
  <circle cx="23.4" cy="37.2" r="2.8" fill="#e8737a" opacity=".3"/><circle cx="40.6" cy="37.2" r="2.8" fill="#e8737a" opacity=".3"/>
  <path d="M25 37q-.8 2.8 1 4.8M39 37q.8 2.8-1 4.8" stroke="#7e5440" stroke-width=".6" fill="none" opacity=".7"/>
  <path d="M27.6 39.4q4.4 3.6 8.8 0-1.4 3-4.4 3t-4.4-3z" fill="#8e3f33"/>
  <rect width="64" height="64" fill="url(#portrait-light)"/>
</g></symbol>
<symbol id="face-of-leo" viewBox="0 0 64 64"><g clip-path="url(#round)">
  <rect width="64" height="64" fill="url(#bg-leo)"/>
  <g fill="#fff" opacity=".14"><circle cx="11" cy="14" r="2.2"/><circle cx="53" cy="11" r="1.6"/><circle cx="56" cy="28" r="2.6"/><circle cx="8" cy="33" r="1.4"/><circle cx="47" cy="4" r="1.2"/></g>
  <path d="M5 64c2-11.4 11.6-16.8 27-16.8S57 52.6 59 64z" fill="#e8684a"/>
  <path d="M5 64c2-11.4 11.6-16.8 27-16.8S57 52.6 59 64z" fill="url(#knit)" opacity=".5"/>
  <path d="M19.6 51.4q-1.2-7 5-8.6 7.4 3.8 14.8 0 6.2 1.6 5 8.6-12.4 5.8-24.8 0z" fill="#c9502f"/>
  <path d="M27.4 39h9.2v8.4q-4.6 3.2-9.2 0z" fill="#7d4c30"/>
  <path d="M27.4 40.8q4.6 3 9.2 0v2.4q-4.6 3-9.2 0z" fill="#5c3520" opacity=".6"/>
  <path d="M29.4 49.6l-.6 8.6M34.6 49.6l.6 8.6" stroke="#f4efe1" stroke-width="1" stroke-linecap="round"/>
  <g fill="#c9c4b8"><rect x="27.9" y="57.8" width="1.8" height="2.6" rx=".6"/><rect x="34.3" y="57.8" width="1.8" height="2.6" rx=".6"/></g>
  <path d="M20.6 47.6q11.4 6.2 22.8 0" stroke="#2a2f36" stroke-width="2.2" fill="none"/>
  <g fill="#2a2f36"><ellipse cx="20.4" cy="46.4" rx="3.6" ry="4.4"/><ellipse cx="43.6" cy="46.4" rx="3.6" ry="4.4"/></g>
  <g fill="#454d59"><ellipse cx="20.8" cy="46" rx="2" ry="2.8"/><ellipse cx="43.2" cy="46" rx="2" ry="2.8"/></g>
  <ellipse cx="19.8" cy="31" rx="2.6" ry="3.7" fill="#8f5a3c"/><ellipse cx="44.2" cy="31" rx="2.6" ry="3.7" fill="#8f5a3c"/>
  <circle cx="19.2" cy="33.8" r=".8" fill="#dfe4e6"/>
  <ellipse cx="32" cy="30.4" rx="12.4" ry="13.6" fill="url(#skin-leo)"/>
  <path d="M19.6 27.6c-.8-6.6 2.4-11.4 7.6-13l10.4-.2c5.6 1.4 8.4 6.6 7.4 13.2-1.6-3.6-4-5.8-7-6.6-4 1.4-9 1.4-13.4 0-2.6.8-4.2 3.2-5 6.6z" fill="#1a1410"/>
  <g fill="#1a1410">${around(9, (a) => `<circle cx="32" cy="9.8" r="4.2" transform="rotate(${(a / 360) * 140 - 70} 32 26)"/>`)}<circle cx="32" cy="13.4" r="5"/></g>
  <g fill="none" stroke="#3b2d24" stroke-width=".8" stroke-linecap="round"><path d="M24.4 13.6q1.6-1.8 3.6-1.2M31 10.2q1.8-1.4 3.8-.4M37.8 13.2q1.8-.6 3 .8M21 18.4q1-1.6 2.6-1.6M42.6 18q1.4.2 2 1.6"/></g>
  <path d="M23.4 26.4q2.6-1.6 5.8-.6M34.8 24.6q3-1.8 5.8.2" stroke="#1a1410" stroke-width="1.6" stroke-linecap="round" fill="none"/>
  <ellipse cx="26.8" cy="30.4" rx="2.4" ry="2.4" fill="#fff"/><ellipse cx="37.2" cy="30.2" rx="2.4" ry="2.5" fill="#fff"/>
  <circle cx="27.2" cy="30.6" r="1.7" fill="#2a1a10"/><circle cx="37.6" cy="30.4" r="1.7" fill="#2a1a10"/>
  <circle cx="27.2" cy="30.6" r=".8" fill="#0c0806"/><circle cx="37.6" cy="30.4" r=".8" fill="#0c0806"/>
  <circle cx="27.8" cy="29.8" r=".55" fill="#fff"/><circle cx="38.2" cy="29.6" r=".55" fill="#fff"/>
  <path d="M24.2 29.6q2.6-2.4 5.2 0M34.6 29.4q2.6-2.6 5.2 0" stroke="#140c08" stroke-width=".9" fill="none"/>
  <path d="M32.2 30.4q-.2 2.8-1.2 4.2M29.8 35q2.2 1.4 4.6 0" stroke="#5c3520" stroke-width="1" fill="none" stroke-linecap="round"/>
  <path d="M27.4 39.4q4.2 2.4 8.6-.8" stroke="#4a2416" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <path d="M36.4 38.2q.8.4.8 1.4" stroke="#5c3520" stroke-width=".7" stroke-linecap="round" fill="none"/>
  <rect width="64" height="64" fill="url(#portrait-light)"/>
</g></symbol>
</svg>`;
