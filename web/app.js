// The app: home, choosing the table, the game, playing on the same Wi-Fi, how to play and settings.
// Everything runs on the phones: the rules (engine/game.js), the family's bots (engine/bots.js) and
// Nana (engine/policy.js). Screens are drawn with render.js, the same code the design boards use.
//
// A table is played one of three ways (game.mode):
//   solo    you and the family, on this phone
//   host    this phone runs the game for a table on the Wi-Fi: other phones play some seats
//   guest   another phone runs it; this one shows the table from its seat and sends its moves
// Seat 0 is always this phone's player; a guest's view arrives turned so that it sits at 0 too.

import { PICTURE_IDS, avatarHTML, cardHTML, cardShort, chipsHTML, eyeHTML, installSprites, setCardStyle, spotName, tableHTML } from './render.js';
import { END, Game, MOVE, SPOTS, cardCode, decode, isKing, isRed, rank } from './engine/game.js';
import { TARGET, matchResult, newMatch, scoreHand, turnMatch } from './engine/match.js';
import { GreedyBot, HeuristicBot, RandomBot } from './engine/bots.js';
import { Policy, PolicyBot } from './engine/policy.js';
import { cards, list, possessive, t } from './i18n.js';
import { net } from './net.js';

const root = document.getElementById('app');
installSprites();

// ---------------------------------------------------------------------- the phone

// The iOS and Android shells hand over what they saved (window.kitc.saved) and take haptics and
// saves through their bridge; in a browser, localStorage does.
const shell = window.kitc ?? {};
if (shell.platform) document.documentElement.classList.add('in-app', `on-${shell.platform}`);

function native(message) {
  try {
    if (window.webkit?.messageHandlers?.native) window.webkit.messageHandlers.native.postMessage(message);
    else if (window.KitcAndroid) window.KitcAndroid.post(JSON.stringify(message));
  } catch { /* no shell */ }
}

function load(key, fallback) {
  try {
    const raw = shell.saved?.[key] ?? localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function save(key, value) {
  const raw = JSON.stringify(value);
  try { localStorage.setItem(key, raw); } catch { /* private mode */ }
  native({ type: 'save', key, value: raw });
}

function forget(key) {
  try { localStorage.removeItem(key); } catch { /* private mode */ }
  native({ type: 'save', key, value: '' });
}

const settings = load('kitc.settings', { hints: true, autoEnd: false, haptics: true, name: '', avatar: 'mono',
  pace: 'normal', fourColor: false, bigIndex: false, leftHanded: false });
const records = load('kitc.records', {});
const choice = load('kitc.table', { variant: 'classic', players: 2, rivals: ['nana'] });
// The Wi-Fi table this phone last sat at, so it can get its seat back even after the app restarts.
const seatKept = load('kitc.seat', {});
const KEEP_SEAT_FOR = 30 * 60 * 1000;

// The look settings live on the page: four-color suits, large card corners, left-handed buttons.
function applyLook() {
  const html = document.documentElement.classList;
  html.toggle('four-color', settings.fourColor);
  html.toggle('left-handed', settings.leftHanded);
  setCardStyle({ bigIndex: settings.bigIndex });
}
applyLook();

function haptic(kind) {
  if (!settings.haptics) return;
  if (shell.platform) native({ type: 'haptic', kind });
  else navigator.vibrate?.(kind === 'place' ? 8 : 18);
}

// Names come from other phones too: they go on screen as plain text, 16 characters at most.
const clean = (s) => String(s ?? '').replace(/[<>&"'`|]/g, '').trim().slice(0, 16);
const cleanPicture = (p) => (PICTURE_IDS.includes(p) ? p : 'mono');
const myName = () => clean(settings.name) || t('Player');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// ---------------------------------------------------------------------- the family

const FAMILY = {
  pip: { name: 'Pip', full: 'Pip', level: 1, line: t('The little cousin. Plays a card or two, then loses interest.'), make: () => new RandomBot() },
  ray: { name: 'Ray', full: t('Uncle Ray'), level: 2, line: t('Lays down everything he can, every turn.'), make: () => new GreedyBot() },
  june: { name: 'June', full: t('Aunt June'), level: 3, line: t('Thinks the whole turn through. Never leaves you a gap.'), make: () => new HeuristicBot() },
  leo: { name: 'Leo', full: t('Cousin Leo'), level: 4, line: t('Learns from every game he plays. Not quite Nana yet.'), make: (variant) => learnerBot('leo', variant), learner: true },
  nana: { name: 'Nana', full: 'Nana', level: 5, line: t('Learned the game from June, then learned to beat her.'), make: (variant) => learnerBot('nana', variant) },
};
const LEVELS = 5;
// Who takes the seats nobody on the Wi-Fi took.
const STAND_INS = ['nana', 'june', 'ray'];

// The trained players, Nana and Leo: their weights load in the background, one file per game; until
// they arrive (or if they can't), June plays their seat.
// The learners whose weights are in web/agents.
const SHIPPED = ['nana', 'leo'];
const learned = {};
const ready = {};             // whose weights came: a learner without them isn't offered
function loadLearner(who, variant) {
  const key = `${who}-${variant}`;
  learned[key] ??= (SHIPPED.includes(who) ? Policy.load(`agents/${key}.bin`).catch(() => null) : Promise.resolve(null)).then((p) => {
    ready[key] = Boolean(p);
    if (FAMILY[who]?.learner && screen === 'setup') render();
    return p;
  });
  return learned[key];
}
const offered = (id, variant) => !FAMILY[id].learner || ready[`${id}-${variant}`] === true;
for (const who of ['nana', 'leo']) for (const variant of ['classic', 'demons']) loadLearner(who, variant);
function learnerBot(who, variant) {
  const bot = { act: (g) => (bot.policy ? bot.policy.act(g) : bot.fallback.act(g)), fallback: new HeuristicBot(), policy: null };
  loadLearner(who, variant).then((p) => { if (p) bot.policy = new PolicyBot(p); });
  return bot;
}

// Seats clockwise from you: the next player sits on your left.
const POSITIONS = { 2: ['top'], 3: ['left', 'right'], 4: ['left', 'top', 'right'] };
const POSITION_NAME = { left: t('Left'), top: t('Across'), right: t('Right') };
const GAME_NAME = { classic: t('Kings in the Corner'), demons: t('Devils in the Corner') };

// People at a Wi-Fi table: '@Name|picture', drawn with the picture they chose (render.js).
const person = (name, picture) => `@${name}|${cleanPicture(picture)}`;
const monogram = (name) => person(name, 'mono');
const meWho = () => person(myName(), settings.avatar);

// Keep the screen on while sitting at a Wi-Fi table, so it doesn't lock in the middle of a game.
const awake = (on) => native({ type: 'awake', on });

// The play aid: raising the cards you can play, lighting up where they go, and saying when you're out
// of plays. Your setting; at a Wi-Fi table, only if the host allows it.
function aidOn() {
  if (!settings.hints) return false;
  if (game?.mode === 'guest') return game.aid !== false;
  if (game?.mode === 'host') return room?.aid !== false;
  return true;
}

// ---------------------------------------------------------------------- screens

let screen = 'home';         // home | setup | rules | game | wifi | lobby | join
let overlay = null;          // settings | result | pile | notice | profile | null
let notice = null;           // {title, text} for the notice sheet
let game = null;             // the table in play (see newGame, hostGame, guestState)
let room = null;             // the Wi-Fi table: {role: 'host' | 'guest', ...}

const icon = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};

const feltClass = (variant) => `felt${variant === 'demons' ? ' demons' : ''}`;

function homeHTML() {
  const demons = choice.variant === 'demons';
  return `<div class="felt home${demons ? ' demons' : ''}">
    ${cardHTML('Kc', 'corner-king nw', 'div', demons)}${cardHTML('Kh', 'corner-king ne', 'div', demons)}
    <h1 class="title"><span class="kings">${demons ? t('Devils') : t('Kings')}</span> <span class="rest">${t('in the Corner')}</span></h1>
    ${modesHTML()}
    <div class="menu">
      <button class="btn" data-go="setup">${t('Play')}</button>
      <button class="btn plain" data-go="wifi">${t('Play on Wi-Fi')}</button>
      <button class="btn plain" data-go="rules">${t('How to play')}</button>
    </div>
    <div class="foot"><button class="icon-btn" data-open="settings" aria-label="${t('Settings')}">${icon.gear}</button></div>
  </div>`;
}

function modesHTML() {
  const demons = choice.variant === 'demons';
  return `<div class="modes" role="group" aria-label="${t('Game')}">
      <button class="mode" data-variant="classic" aria-pressed="${!demons}">${cardHTML('Ks')}<b>${t('Kings')}</b><small>${t('The classic game')}</small></button>
      <button class="mode demons-mode" data-variant="demons" aria-pressed="${demons}">${cardHTML('Ks', '', 'div', true)}<b>${t('Devils')}</b><small>${t('Kings become devils with powers')}</small></button>
    </div>`;
}

function levelHTML(n) {
  const dots = Array.from({ length: LEVELS }, (_, i) => `<i class="${i < n ? '' : 'off'}"></i>`).join('');
  return `<span class="level" aria-label="${t('Level {n} of {m}', { n, m: LEVELS })}">${dots}</span>`;
}

function playersHTML(n, min = 2) {
  return `<div class="segmented" role="group" aria-label="${t('Players')}">${[2, 3, 4].map((k) =>
    `<button data-players="${k}" aria-pressed="${k === n}"${k < min ? ' disabled' : ''}>${t('{n} players', { n: k })}</button>`).join('')}</div>`;
}

// One game, or a match: hand after hand until someone goes over 50.
function formatHTML(match) {
  return `<div class="segmented two" role="radiogroup" aria-label="${t('Game length')}">${[false, true].map((m) =>
    `<button data-format="${m ? 'match' : 'single'}" role="radio" aria-pressed="${m === match}" aria-checked="${m === match}">${m ? t('Match to 50') : t('One game')}</button>`).join('')}</div>`;
}

const matchRules = () => t('Play hand after hand. Going out scores nothing; everyone else scores the cards they hold: face cards 10, the others their number. Whoever goes over 50 loses, and the lowest score wins. Land on exactly 50 and you go back to 25. Hold ace to king, one of each and nothing else, and you win outright.');

// The little table from above: who sits where. `chairs` are [{name, who}] clockwise from your left.
function seatingHTML(label, chairs) {
  const n = chairs.length + 1;
  const seats = POSITIONS[n].map((pos, i) => {
    const c = chairs[i];
    return c ? `<div class="chair ${pos}">${avatarHTML(c.who)}${esc(c.name)}</div>` : `<div class="chair ${pos} empty"><i></i>${t('Empty')}</div>`;
  }).join('');
  return `<div class="seating"><div class="label">${label}</div>${seats}<div class="chair you"><span class="you-dot">${t('You')}</span></div></div>`;
}

function setupHTML() {
  const n = choice.players;
  const positions = POSITIONS[n];
  choice.rivals = choice.rivals.filter((id) => FAMILY[id] && offered(id, choice.variant));
  const rows = Object.entries(FAMILY).filter(([id]) => offered(id, choice.variant)).map(([id, f]) => {
    const at = choice.rivals.indexOf(id);
    return `<button class="rival-row" data-rival="${id}" aria-pressed="${at >= 0}">${avatarHTML(id)}
      <div><h3>${f.full}${levelHTML(f.level)}</h3><p>${f.line}</p></div>
      <span class="seated">${at >= 0 ? POSITION_NAME[positions[at]] : ''}</span></button>`;
  }).join('');
  const ready = choice.rivals.length === n - 1;
  const record = records[tableKey()];
  const recordLine = record ? `<p class="screen-sub" style="margin-top:10px;text-align:center">${t('At this table: {record}', { record: recordText(record) })}</p>` : '';
  const chairs = positions.map((_, i) => choice.rivals[i]).map((id) => (id ? { name: FAMILY[id].name, who: id } : null));
  return `<div class="${feltClass(choice.variant)}" style="display:grid;grid-template-rows:auto auto auto auto auto auto 1fr auto;height:100%">
    <div class="top-row"><button class="icon-btn" data-go="home" aria-label="${t('Back')}">${icon.back}</button></div>
    <h1 class="screen-title">${t('Who’s at the table?')}</h1>
    <p class="screen-sub">${t('Up to three of the family. Seats fill clockwise from your left.')}</p>
    ${playersHTML(n)}
    ${formatHTML(Boolean(choice.match))}
    ${seatingHTML(GAME_NAME[choice.variant], chairs.map((c) => c ?? undefined))}
    <div class="family" style="align-content:start">${rows}${recordLine}</div>
    <div class="pick-foot"><button class="btn" data-act="deal" style="width:100%"${ready ? '' : ' disabled'}>${ready ? t('Deal') : t('Seat {n} more', { n: n - 1 - choice.rivals.length })}</button></div>
  </div>`;
}

function rulesHTML() {
  return `<div class="felt" style="height:100%;overflow-y:auto">
    <div class="top-row"><button class="icon-btn" data-go="back" aria-label="${t('Back')}">${icon.back}</button></div>
    <h1 class="screen-title">${t('How to play')}</h1>
    <div class="rules">
      <section class="rule"><h3>${t('Get rid of your cards')}</h3><p>${t('Everyone gets seven. Start each turn by drawing one, then play as many as you like. The first to play their last card wins.')}</p></section>
      <section class="rule"><h3>${t('Build down, change color')}</h3><p>${t('A card goes on a card one higher of the other color. Any card fills an empty side; only a king starts a corner.')}</p>
        <div class="demo">${cardHTML('9s')}${cardHTML('8h', 'on')}<span class="arrow" style="margin-left:18px"></span>${cardHTML('Ks')}${cardHTML('Qd', 'on')}</div></section>
      <section class="rule"><h3>${t('Move whole piles')}</h3><p>${t('Tap a pile on a side to lift it. It moves onto another pile if its first card fits there, and the side it leaves takes any card.')}</p></section>
      <section class="rule"><h3>${t('See a whole pile')}</h3><p>${t('Tap the number on a pile, hold it down or tap it twice to see every card in it.')}</p></section>
      <section class="rule"><h3>${t('Stock’s out')}</h3><p>${t('If the stock is gone and everyone passes in a row, the fewest cards wins. Same count, it’s a tie.')}</p></section>
      <section class="rule"><h3>${t('Match to 50')}</h3><p>${matchRules()}</p></section>
      <section class="rule demons-rule"><h3>${eyeHTML()}${t('Devils in the Corner')}</h3><p>${t('Kings are devils. Play one from your hand straight into a corner and it acts: a <b>red devil</b> trades your hand with a rival’s, a <b>black devil</b> deals the sides into new piles, still building down in alternate colors. A devil dealt to a corner, played on a side or moved with its pile does nothing.')}</p>
        <div class="demo">${cardHTML('Kh', '', 'div', true)}${cardHTML('Kc', '', 'div', true)}</div></section>
    </div>
  </div>`;
}

function switchRow(key, label, help) {
  return `<div class="toggle-row"><span>${label}${help ? `<small>${help}</small>` : ''}</span><button class="switch" role="switch" data-setting="${key}" aria-checked="${settings[key]}" aria-label="${label}"></button></div>`;
}

function settingsHTML() {
  const inGame = screen === 'game' && game && !game.g.over;
  const leave = !inGame ? '<span></span>'
    : game.mode === 'host' ? `<button class="btn plain" data-act="close-table">${t('Close table')}</button>`
    : game.mode === 'guest' ? `<button class="btn plain" data-act="leave-table">${t('Leave table')}</button>`
    : `<button class="btn plain" data-act="resign">${game.match ? t('Leave match') : t('Leave game')}</button>`;
  return `<h2>${t('Settings')}</h2>
    ${switchRow('hints', t('Play aid'), tableAid() === false ? t('Off at this table: the host chose no play aid') : t('Raises the cards you can play, lights up where they go and says when you’re out of plays'))}
    ${switchRow('autoEnd', t('End my turn when I’m stuck'), t('Skips the button when no play is left. Only with the play aid'))}
    <div class="toggle-row"><span>${t('Rival speed')}<small>${t('How long the others take over each move. Tap the table to hurry a turn along.')}</small></span></div>
    <div class="segmented three in-sheet" role="radiogroup" aria-label="${t('Rival speed')}">${['relaxed', 'normal', 'quick'].map((k) =>
      `<button data-pace="${k}" role="radio" aria-pressed="${settings.pace === k}" aria-checked="${settings.pace === k}">${{ relaxed: t('Relaxed'), normal: t('Normal'), quick: t('Quick') }[k]}</button>`).join('')}</div>
    ${switchRow('fourColor', t('Four-color suits'), t('Diamonds blue and clubs green, so no two suits share a color'))}
    ${switchRow('bigIndex', t('Large card corners'), t('Bigger rank and suit in the corner of every card'))}
    ${switchRow('leftHanded', t('Left-handed'), t('End turn on the left, under your thumb'))}
    ${switchRow('haptics', t('Haptics'))}
    <div class="row" style="margin-top:14px">${leave}<button class="btn" data-close>${t('Done')}</button></div>`;
}

const noticeHTML = () => `<h2>${notice.title}</h2><p>${notice.text}</p><button class="btn" data-act="notice-ok" style="width:100%">${t('OK')}</button>`;

// "3 won, 2 lost, 1 tied"
function recordText(r) {
  const base = t('{w} won, {l} lost', { w: r.w, l: r.l });
  return r.t ? `${base}${t(', {n} tied', { n: r.t })}` : base;
}

// ---------------------------------------------------------------------- Wi-Fi tables

// The host's rule for the play aid at a Wi-Fi table: true, false, or null while not chosen yet.
const tableAid = () => (room?.role === 'host' ? room.aid : room?.role === 'guest' ? (game?.mode === 'guest' ? game.aid : room.lobby?.aid) : undefined);

// Your name and picture, as the others at a Wi-Fi table see them.
function profileHTML() {
  const pics = PICTURE_IDS.map((id) => `<button class="pick" data-pick="${id}" role="radio" aria-checked="${settings.avatar === id}" aria-label="${id === 'mono' ? t('Your initial') : id}">${avatarHTML(person(myName(), id))}</button>`).join('');
  return `<label class="field"><span>${t('Your name')}</span><input id="my-name" maxlength="16" autocomplete="nickname" value="${esc(settings.name)}" placeholder="${t('Player')}"></label>
    <div class="field"><span>${t('Your picture')}</span><div class="pictures" role="radiogroup" aria-label="${t('Your picture')}">${pics}</div></div>`;
}

const profileSheetHTML = () => `<h2>${t('Name and picture')}</h2><div class="profile-sheet">${profileHTML()}</div>
  <button class="btn" data-act="profile-done" style="width:100%">${t('Done')}</button>`;

function wifiHTML() {
  const body = net.available
    ? `${profileHTML()}
      <div class="menu" style="margin:6px 16px 0">
        <button class="btn" data-act="host">${t('Host a table')}<small>${t('Others on the same Wi-Fi join your table')}</small></button>
        <button class="btn plain" data-act="find">${t('Join a table')}<small>${t('Find a table someone opened on this Wi-Fi')}</small></button>
      </div>`
    : `<p class="screen-sub">${t('Playing on Wi-Fi needs the Kings Corner app on iPhone or Android.')}</p>`;
  const back = net.available && seatKept.token && Date.now() - seatKept.at < KEEP_SEAT_FOR
    ? `<div class="menu" style="margin:0 16px 12px"><button class="btn" data-act="rejoin">${t('Back to {name}', { name: esc(seatKept.table) })}<small>${t('Your seat there is kept for you')}</small></button></div>` : '';
  return `<div class="${feltClass(choice.variant)}" style="height:100%">
    <div class="top-row"><button class="icon-btn" data-go="home" aria-label="${t('Back')}">${icon.back}</button></div>
    <h1 class="screen-title">${t('Play on Wi-Fi')}</h1>
    <p class="screen-sub">${t('Family at home on the same Wi-Fi sit at one table, each on their own phone. Empty seats go to the family.')}</p>
    ${back}${body}
  </div>`;
}

// The host's lobby: who has joined, and who will play the open seats.
function hostLobbyHTML() {
  const n = room.players;
  const guests = room.guests;
  const open = STAND_INS.slice(0, n - 1 - guests.length);
  const chairs = [...guests.map((g) => ({ name: g.name, who: person(g.name, g.avatar) })), ...open.map((id) => ({ name: FAMILY[id].name, who: id }))];
  const rows = [
    ...guests.map((g) => `<div class="lobby-row${g.away ? ' away' : ''}">${avatarHTML(person(g.name, g.avatar))}<b>${esc(g.name)}</b>${g.away ? `<span>${t('Away')}</span>` : ''}</div>`),
    ...open.map((id) => `<div class="lobby-row open">${avatarHTML(id)}<span>${t('Open seat: {name} plays until someone joins', { name: FAMILY[id].full })}</span></div>`),
  ].join('');
  const aid = room.aid;
  return `<div class="${feltClass(choice.variant)}" style="height:100%;overflow-y:auto">
    <div class="top-row"><button class="icon-btn" data-act="close-table" aria-label="${t('Close table')}">${icon.back}</button>
      <button class="btn plain small-btn" data-open="profile">${avatarHTML(meWho())}${t('Name and picture')}</button></div>
    <h1 class="screen-title">${esc(room.name)}</h1>
    <p class="screen-sub">${t('Family on the same Wi-Fi can join now: Play on Wi-Fi, then Join a table.')}</p>
    <div style="margin:0 16px 12px">${modesHTML()}</div>
    ${playersHTML(n, guests.length + 1)}
    ${formatHTML(Boolean(choice.match))}
    <div class="aid-choice">
      <h3>${t('Play aid at this table')}</h3>
      <p>${t('The aid raises the cards you can play, lights up where they go and says when you’re out of plays.')}</p>
      <div class="segmented two" role="radiogroup" aria-label="${t('Play aid at this table')}">
        <button data-aid="on" role="radio" aria-pressed="${aid === true}" aria-checked="${aid === true}">${t('Allowed')}</button>
        <button data-aid="off" role="radio" aria-pressed="${aid === false}" aria-checked="${aid === false}">${t('No play aid')}</button>
      </div>
    </div>
    <div class="aid-choice">
      <h3>${t('Turn timer')}</h3>
      <p>${t('Each turn gets this long. When the time runs out, the turn ends.')}</p>
      <div class="segmented four" role="radiogroup" aria-label="${t('Turn timer')}">
        ${TIMERS.map((sec) => `<button data-timer="${sec}" role="radio" aria-pressed="${room.timer === sec}" aria-checked="${room.timer === sec}">${timerLabel(sec)}</button>`).join('')}
      </div>
    </div>
    ${seatingHTML(GAME_NAME[choice.variant], chairs)}
    <div class="family" style="align-content:start">${rows}</div>
    <div class="pick-foot"><button class="btn" data-act="host-deal" style="width:100%"${aid === null ? ' disabled' : ''}>${aid === null ? t('Choose the play aid first') : t('Deal')}</button></div>
  </div>`;
}

function joinHTML() {
  const tables = room?.tables ?? [];
  const list = tables.length
    ? tables.map((tb) => `<button class="rival-row" data-join="${esc(tb.id)}">${avatarHTML(monogram(clean(tb.name)))}<div><h3>${esc(tb.name)}</h3></div><span class="seated">${t('Join')}</span></button>`).join('')
    : `<p class="screen-sub searching">${t('Looking for tables…')}</p><p class="screen-sub">${t('Make sure you’re on the same Wi-Fi as the person who opened the table.')}</p>`;
  return `<div class="${feltClass(choice.variant)}" style="height:100%">
    <div class="top-row"><button class="icon-btn" data-act="leave-table" aria-label="${t('Back')}">${icon.back}</button></div>
    <h1 class="screen-title">${t('Tables on this Wi-Fi')}</h1>
    <div class="family" style="margin-top:8px">${list}</div>
  </div>`;
}

// A guest's lobby: the table as the host has it, until the deal.
function guestLobbyHTML() {
  const lb = room.lobby;
  if (!lb) {
    return `<div class="${feltClass(choice.variant)}" style="height:100%"><div class="top-row"><button class="icon-btn" data-act="leave-table" aria-label="${t('Back')}">${icon.back}</button></div>
      <h1 class="screen-title">${t('Joining {name}…', { name: esc(room.joining ?? '') })}</h1></div>`;
  }
  // The host's seat list, turned so that this phone sits at the bottom.
  const n = lb.players;
  const mine = lb.seats.findIndex((s) => s.you);
  const around = [...Array(n - 1).keys()].map((k) => lb.seats[(mine + 1 + k) % n]).map((s) => s && { name: s.name, who: s.who });
  if (room.reconnecting) return reconnectingHTML(lb.variant);
  const aidLine = (lb.aid === true ? t('Play aid allowed at this table.') : lb.aid === false ? t('No play aid at this table.') : t('The host hasn’t chosen the play aid yet.'))
    + ' ' + (lb.timer ? t('{n} seconds a turn.', { n: lb.timer }) : t('No turn timer.'));
  return `<div class="${feltClass(lb.variant)}" style="display:grid;grid-template-rows:auto auto auto auto 1fr auto;height:100%">
    <div class="top-row"><button class="icon-btn" data-act="leave-table" aria-label="${t('Leave table')}">${icon.back}</button>
      <button class="btn plain small-btn" data-open="profile">${avatarHTML(meWho())}${t('Name and picture')}</button></div>
    <h1 class="screen-title">${esc(lb.name)}</h1>
    <p class="screen-sub">${GAME_NAME[lb.variant]}. ${lb.match ? `${t('Match to 50')}. ` : ''}${t('{n} players', { n })}. ${aidLine}</p>
    ${seatingHTML(GAME_NAME[lb.variant], around)}
    <p class="screen-sub searching" style="text-align:center">${t('Waiting for {name} to deal', { name: esc(lb.host) })}</p>
    <div class="pick-foot"><button class="btn plain" data-act="leave-table" style="width:100%">${t('Leave table')}</button></div>
  </div>`;
}

// Lost the connection: the phone keeps trying to find the table again, for a while.
const reconnectingHTML = (variant) => `<div class="${feltClass(variant)}" style="height:100%">
    <div class="top-row"><button class="icon-btn" data-act="leave-table" aria-label="${t('Leave table')}">${icon.back}</button></div>
    <h1 class="screen-title">${esc(room.tableName ?? '')}</h1>
    <p class="screen-sub searching">${t('Reconnecting to the table…')}</p>
    <p class="screen-sub">${t('Your seat is kept. The game waits for you, unless the host lets Aunt June play your seat.')}</p>
    <div class="pick-foot"><button class="btn plain" data-act="leave-table" style="width:100%">${t('Leave table')}</button></div>
  </div>`;

function hostTable() {
  room = { role: 'host', name: t('{owner} table', { owner: possessive(myName()) }), players: Math.max(2, choice.players), guests: [], aid: null, timer: 0 };
  net.host(room.name);
  awake(true);
  screen = 'lobby';
  render();
}

function findTables() {
  room = { role: 'guest', tables: [], lobby: null };
  awake(true);
  net.browse();
  // The loopback asks again now and then; the phones keep looking on their own and answer at once.
  room.timer = setInterval(() => { if (screen === 'join') net.browse(); }, 1500);
  room.tableName = null;
  screen = 'join';
  render();
}

function keepSeat(value) {
  Object.keys(seatKept).forEach((k) => delete seatKept[k]);
  Object.assign(seatKept, value);
  save('kitc.seat', seatKept);
}

// Back to the table this phone sat at: the same seat, with the token the host gave it.
function rejoin() {
  room = { role: 'guest', tables: [], lobby: null, token: seatKept.token, tableName: seatKept.table };
  awake(true);
  screen = 'lobby';
  reconnect();
}

function leaveRoom() {
  if (room?.role === 'guest') keepSeat({});    // left on purpose: nothing to come back to
  if (room?.timer) clearInterval(room.timer);
  if (room?.retry) clearInterval(room.retry);
  if (room?.role === 'host') for (const g of room.guests) if (g.peer) net.send(g.peer, { t: 'closed' });
  net.close();
  awake(false);
  room = null;
}

const token = () => Math.random().toString(36).slice(2, 12);
const AWAY_FOR = 5 * 60 * 1000;   // a guest away from the lobby this long loses their place

function lobbyMessage() {
  const now = Date.now();
  room.guests = room.guests.filter((g) => !g.away || now - g.awaySince < AWAY_FOR || game?.mode === 'host');
  const seats = [{ name: myName(), who: meWho() }, ...room.guests.map((g) => ({ name: g.name, who: person(g.name, g.avatar), guest: g }))];
  for (const id of STAND_INS.slice(0, room.players - seats.length)) seats.push({ name: FAMILY[id].name, who: id });
  return { t: 'lobby', name: room.name, host: myName(), variant: choice.variant, match: Boolean(choice.match), players: room.players, aid: room.aid, timer: room.timer, seats };
}

// Each guest hears the lobby with their own seat marked, and the token that gets it back after a
// lost connection.
function sendLobby() {
  const msg = lobbyMessage();
  for (const g of room.guests) {
    if (!g.peer) continue;
    net.send(g.peer, { ...msg, seats: msg.seats.map(({ guest, ...s }) => (guest === g ? { ...s, you: true, token: g.token } : s)) });
  }
}

const PROTOCOL = 1;

net.on((ev) => {
  if (!room) return;
  if (room.role === 'host') hostEvent(ev);
  else guestEvent(ev);
});

function hostEvent(ev) {
  if (ev.e === 'peer') return;      // they say hello first
  if (ev.e === 'gone') {
    // A lost connection (a locked screen, a phone out of range): the seat is kept for them. In a
    // game, play stops at their turn until they're back, unless the host lets Aunt June play it.
    const g = room.guests.find((x) => x.peer === ev.peer);
    if (!g) return;
    Object.assign(g, { peer: null, away: true, awaySince: Date.now() });
    const seat = game?.mode === 'host' ? game.seats.findIndex((s) => s.guest === g) : -1;
    if (seat > 0) {
      Object.assign(game.seats[seat], { peer: null, away: true });
      game.say = { away: seat };
      changed();
      if (!game.g.over && game.g.current === seat) setTimeout(advance, 600);
    } else {
      sendLobby();
      if (screen === 'lobby') render();
    }
    return;
  }
  if (ev.e !== 'message') return;
  const m = ev.data;
  if (m.t === 'hello') return hello(ev.peer, m);
  const g = room.guests.find((x) => x.peer === ev.peer);
  if (!g) return;
  if (m.t === 'profile') {
    g.name = clean(m.name) || g.name;
    g.avatar = cleanPicture(m.avatar);
    const seat = game?.mode === 'host' ? game.seats.findIndex((s) => s.guest === g) : -1;
    if (seat > 0) Object.assign(game.seats[seat], { name: g.name, who: person(g.name, g.avatar) });
    sendLobby();
    if (seat > 0) changed();
    else if (screen === 'lobby') render();
    return;
  }
  if (!game || game.mode !== 'host') return;
  const seat = game.seats.findIndex((s) => s.peer === ev.peer);
  if (seat <= 0) return;
  if (m.t === 'act') remoteMove(seat, Number(m.a));
  else if (m.t === 'undo') undo(seat);
  else if (m.t === 'more') moreTime(seat);
}

function hello(peer, m) {
  if (m.v !== PROTOCOL) return net.send(peer, { t: 'refused', why: 'version' });
  // Back after a lost connection: the same seat, at the table or in the game.
  const known = m.token && room.guests.find((x) => x.token === m.token);
  if (known) {
    Object.assign(known, { peer, away: false });
    sendLobby();
    const seat = game?.mode === 'host' ? game.seats.findIndex((s) => s.guest === known) : -1;
    if (seat > 0) {
      Object.assign(game.seats[seat], { peer, away: false, june: false });   // back in their own seat
      game.say = { back: seat };
      changed();
    } else if (screen === 'lobby') render();
    return undefined;
  }
  const started = game?.mode === 'host' && (!game.g.over || (game.match && !game.match.over));   // a match runs between hands too
  if (started || room.guests.length >= 3) return net.send(peer, { t: 'refused', why: 'full' });
  room.guests.push({ peer, name: clean(m.name) || t('Player'), avatar: cleanPicture(m.avatar), token: token(), away: false });
  room.players = Math.max(room.players, room.guests.length + 1);
  haptic('tap');
  sendLobby();
  if (screen === 'lobby') render();
  return undefined;
}

function guestEvent(ev) {
  if (ev.e === 'tables') {
    room.tables = ev.tables;
    // Finding the table again after a lost connection.
    const back = room.reconnecting && ev.tables.find((tb) => tb.name === room.tableName);
    if (back && !room.rejoining) { room.rejoining = true; net.join(back.id); }
    if (screen === 'join') render();
  } else if (ev.e === 'joined') {
    room.rejoining = false;
    net.send('host', { t: 'hello', name: myName(), avatar: settings.avatar, v: PROTOCOL, token: room.token });
  } else if (ev.e === 'closed') {
    reconnect();
  } else if (ev.e === 'error') {
    if (room.reconnecting) { room.rejoining = false; return; }
    endRoom(t('Couldn’t join'), esc(ev.text ?? ''));
  } else if (ev.e === 'message') {
    const m = ev.data;
    if (room.reconnecting && (m.t === 'lobby' || m.t === 'state')) stopReconnecting();
    if (m.t === 'lobby') {
      const mine = m.seats.find((s) => s.you);
      if (mine?.token) room.token = mine.token;
      room.tableName = room.tableName ?? String(m.name).replace(/[<>&"'`]/g, '').slice(0, 40);
      keepSeat({ table: room.tableName, token: room.token, at: Date.now() });
      room.lobby = { ...m, name: String(m.name).replace(/[<>&"'`]/g, '').slice(0, 40), host: clean(m.host), seats: m.seats.map((s) => ({ ...s, name: clean(s.name) })) };
      if (game?.mode === 'guest' && game.g.over) return;     // between games: the result stays up
      if (screen === 'join' || screen === 'lobby') { screen = 'lobby'; render(); }
    } else if (m.t === 'state') guestState(m.s);
    else if (m.t === 'refused') endRoom(t('Couldn’t join'), m.why === 'version' ? t('That table runs another version of the app.') : t('That table is full.'));
    else if (m.t === 'closed') endRoom(t('The table closed'), t('{name} closed the table.', { name: esc(room.lobby?.host ?? '') }));
  }
}

// The connection to the host dropped: keep trying to find the table again for a few minutes
// (the host's phone may have locked, or this one did), then give up.
const RECONNECT_FOR = 3 * 60 * 1000;
function reconnect() {
  if (!room?.token) return endRoom(t('The table closed'), t('The connection to the table was lost.'));
  if (room.reconnecting) return undefined;
  room.reconnecting = Date.now();
  room.rejoining = false;
  room.retry = setInterval(() => {
    if (Date.now() - room.reconnecting > RECONNECT_FOR) return endRoom(t('The table closed'), t('The connection to the table was lost.'));
    if (!room.rejoining) net.browse();
    return undefined;
  }, 2500);
  net.browse();
  if (screen === 'game') screen = 'lobby';
  overlay = null;
  render();
  return undefined;
}

function stopReconnecting() {
  clearInterval(room.retry);
  room.retry = null;
  room.reconnecting = null;
  room.rejoining = false;
}

function endRoom(title, text) {
  leaveRoom();
  game = null;
  screen = 'home';
  notice = { title, text };
  overlay = 'notice';
  render();
}

// ---------------------------------------------------------------------- a game

// Single games and matches keep separate records.
function tableKey() {
  return `${choice.variant}${choice.match ? '+match' : ''}:${choice.rivals.join(',')}`;
}

// A new table, or the next hand of a match: `match` carries the scores, and the hand keeps the
// match's game and record.
function startTable(mode, seats, { match = null, variant = choice.variant, key = mode === 'solo' ? tableKey() : null } = {}) {
  const n = seats.length;
  if (!match && choice.match) match = newMatch(n, Math.floor(Math.random() * n));
  const g = new Game(n, { variant, first: match ? match.first : Math.floor(Math.random() * n), kamikaze: Boolean(match) });
  game = {
    mode, g, seats, match, undos: {}, picked: null, lifted: null, fresh: null, freshBy: null, banner: null, say: null,
    last: null, power: null, powerSeq: 0, busy: false, key,
  };
  screen = 'game';
  overlay = null;
  // You go first: it's your turn already. Someone else does: their turn starts in a moment.
  if (g.current === 0) game.say = { thinking: 0 };
  changed();
  if (g.current !== 0) setTimeout(advance, 450);
}

function newGame() {
  const n = choice.players;
  startTable('solo', [{ who: 'you', name: t('You'), kind: 'you' }, ...choice.rivals.map((id, i) => ({
    who: id, name: FAMILY[id].name, pos: POSITIONS[n][i], kind: 'bot', bot: FAMILY[id].make(choice.variant),
  }))]);
}

// `match`: the next hand of it. Whoever sits in a seat now plays on with that seat's score.
function hostGame(match = null) {
  const lobby = lobbyMessage();
  const n = lobby.players;
  const variant = match ? game.g.variant : choice.variant;
  startTable('host', lobby.seats.map((s, i) => (i === 0 ? { who: 'you', name: t('You'), kind: 'you', label: s.name }
    : s.guest ? { who: s.who, name: s.name, pos: POSITIONS[n][i - 1], kind: 'remote', guest: s.guest, peer: s.guest.peer, away: s.guest.away, june: false, standIn: new HeuristicBot() }
    : { who: s.who, name: s.name, pos: POSITIONS[n][i - 1], kind: 'bot', bot: FAMILY[s.who].make(variant) })),
  { match: match?.n === n ? match : null, variant });
}

function nextHand() {
  overlay = null;
  if (game.mode === 'host') return hostGame(game.match);
  return startTable('solo', game.seats, { match: game.match, variant: game.g.variant, key: game.key });
}

const nameOf = (seat) => game.seats[seat].name;
const short = (c) => cardShort(cardCode(c));
const hand = () => game.g.hands[0];

// Every move goes through here, whoever makes it: you, a bot or a phone on the Wi-Fi. What it
// leaves in `last` (and `power`) is all any phone needs to say and show what happened.
function applyMove(seat, a) {
  const g = game.g;
  const powers = g.powers;
  const s = game.seats[seat];
  if (s.kind !== 'bot' && a !== END) (game.undos[seat] ??= []).push(g.copy());
  const d = decode(a);
  const last = { seat, a, moves: g.moves, drew: g.drew !== null };
  if (d.kind !== 'end') last.onto = g.piles[d.spot].at(-1) ?? -1;
  if (d.kind === 'move') last.first = g.piles[d.side][0];
  g.step(a);
  if (g.over && game.match) scoreHand(game.match, g);     // before anyone is told the hand is over
  game.last = last;
  game.say = { last };        // what the others' phones say happened (this phone's own turn shows its own line)
  if (a === END) {
    game.undos = {};
    game.fresh = null;
  } else {
    game.fresh = SPOTS[d.spot];
    game.freshBy = seat === 0 ? null : s.who;
  }
  if (g.powers !== powers) {
    game.undos = {};                // a power can't be taken back: everyone has seen what it did
    game.power = { ...g.lastPower };
    game.powerSeq += 1;
    showBanner();
  }
}

function showBanner() {
  game.banner = game.power;
  haptic('warn');
  const seq = game.powerSeq;
  setTimeout(() => { if (game?.powerSeq === seq && game.banner) { game.banner = null; render(); } }, 2200);
}

function noteFor(last) {
  const who = nameOf(last.seat);
  if (last.timeout) return last.seat === 0 ? t('Time’s up. Your turn ended.') : t('Time’s up for {name}', { name: who });
  if (last.a === END) {
    return last.moves ? t('{name} ended the turn', { name: who }) : last.drew ? t('{name} drew and passed', { name: who }) : t('{name} passed', { name: who });
  }
  const { kind, card, spot } = decode(last.a);
  if (kind === 'move') {
    return last.onto >= 0 ? t('{who} moved the {card} pile onto {top}', { who, card: short(last.first), top: short(last.onto) })
      : t('{who} moved the {card} pile into a corner', { who, card: short(last.first) });
  }
  if (last.onto >= 0) return t('{who} played {card} on {top}', { who, card: short(card), top: short(last.onto) });
  if (spot >= 4) return t('{who} set {card} in a corner', { who, card: short(card) });
  return t('{who} put {card} on the empty side', { who, card: short(card) });
}

// What the line under the cross says while someone else is playing.
function sayText(say) {
  if (!say) return '';
  if (say.thinking !== undefined) return t('{name} is thinking', { name: nameOf(say.thinking) });
  if (say.away !== undefined) return t('{name} is away', { name: nameOf(say.away) });
  if (say.waiting !== undefined) return t('Waiting for {name} to come back', { name: nameOf(say.waiting) });
  if (say.june !== undefined) return t('Aunt June is playing for {name}', { name: nameOf(say.june) });
  if (say.back !== undefined) return t('{name} is back', { name: nameOf(say.back) });
  return noteFor(say.last);
}

function powerBanner(power) {
  if (!power) return null;
  if (power.kind === 'swap') {
    const n = hand().length;
    const text = power.by === 0 ? t('You traded hands with {name}. Those {cards} are yours now.', { name: nameOf(power.with), cards: cards(n) })
      : power.with === 0 ? t('{name} played the red devil and took your hand. {owner} {cards} are yours now.', { name: nameOf(power.by), owner: possessive(nameOf(power.by)), cards: cards(n) })
      : t('{name} traded hands with {other}.', { name: nameOf(power.by), other: nameOf(power.with) });
    return { kind: 'swap', title: t('Hands traded'), text };
  }
  return { kind: 'rebuild', title: t('The sides are redealt'),
    text: power.changed ? t('New piles, still building down in alternating colors.') : t('The piles could only fall the way they were.') };
}

// Play the bots' turns, one move at a time, until it's a person's turn or the game is over.
async function advance() {
  if (!game || game.busy || game.mode === 'guest') return;
  game.busy = true;
  const g = game.g;
  try {
    while (!g.over && g.current !== 0) {
      const seat = g.current;
      const s = game.seats[seat];
      if (s.kind === 'remote' && !s.away) {     // their phone moves; remoteMove picks it up from there
        if (!(game.say?.last?.seat === seat)) game.say = { thinking: seat };
        changed();
        return;
      }
      if (s.kind === 'remote' && !s.june) {      // away: the game waits for them, or for the host's say-so
        game.say = { waiting: seat };
        changed();
        return;
      }
      // A turn starts with a moment to think; after that, each move stays in view (the card landed,
      // the line under the cross) until the next one leaves the rival's seat.
      if (g.moves === 0) {
        if (!s.away) game.say = { thinking: seat };
        changed();
        await pause(PACE.think);
        if (game?.g !== g) return;
      }
      if (s.kind === 'remote' && (!s.away || !s.june)) continue;   // back in time, or June was called off
      const powers = g.powers;
      const a = (s.away ? s.standIn : s.bot).act(g);
      applyMove(seat, a);
      if (a === END && g.current === 0) break;     // your turn: no waiting on a turn already over
      changed(a === END ? {} : { from: seat, flight: 'rival' });
      await pause(a === END ? PACE.ended : g.powers !== powers ? PACE.power : PACE.move);
      if (game?.g !== g) return;
    }
  } finally {
    if (game?.g === g) game.busy = false;
  }
  if (g.over) return finish();
  // Your turn (the others' phones say you're thinking).
  game.say = { thinking: 0 };
  game.hurry = false;
  haptic('tap');
  changed();
  return maybeAutoEnd();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// How long the rivals take, at Normal speed: a moment to think, then each move in flight and held in
// view long enough to follow. Relaxed and Quick stretch or shrink it; tapping the table while a rival
// plays hurries the rest of that turn.
const PACE = { think: 900, move: 1350, ended: 850, power: 2500 };
const PACE_SPEED = { relaxed: 1.4, normal: 1, quick: 0.55 };
const pace = () => (game?.hurry ? 0.2 : PACE_SPEED[settings.pace] ?? 1);
const pause = (ms) => wait(ms * pace());

function remoteMove(seat, a) {
  const g = game.g;
  if (g.over || g.current !== seat || !g.legal().includes(a)) return changed();   // out of date: resend
  applyMove(seat, a);
  changed(a === END ? {} : { from: seat });
  if (g.over) return finish();
  if (g.current !== seat) return advance();
  return undefined;
}

function undo(seat) {
  const stack = game.undos[seat];
  if (!stack?.length || game.g.current !== seat || game.g.over) return;
  game.g = stack.pop();
  game.picked = null;
  game.lifted = null;
  game.fresh = null;
  game.say = null;
  changed();
}

function humanLegal() {
  if (!game || game.busy || game.pending || game.g.over || game.g.current !== 0) return [];
  return game.g.legal();
}

// You made a move: here, or sent to the phone running the table.
function play(a) {
  game.picked = null;
  game.lifted = null;
  if (game.mode === 'guest') {
    game.pending = true;
    net.send('host', { t: 'act', a });
    haptic('place');
    return render();
  }
  const g = game.g;
  applyMove(0, a);
  if (a !== END) haptic('place');
  changed({ flight: 'mine' });
  if (g.over) return finish();
  if (g.current !== 0) return setTimeout(advance, 300);
  return maybeAutoEnd();
}

function endTurn() {
  if (!game || game.g.current !== 0 || game.busy || game.pending || game.g.over) return undefined;
  game.banner = null;
  return play(END);
}

function maybeAutoEnd() {
  if (!settings.autoEnd || !aidOn() || !game || game.g.over || game.g.current !== 0) return;
  if (humanLegal().every((a) => a === END)) setTimeout(() => { if (game && humanLegal().every((a) => a === END)) endTurn(); }, 900);
}

function finish() {
  const g = game.g;
  const m = game.match;
  // A hand in a match that goes on: a good buzz for going out, a nudge otherwise.
  const r = !m ? g.result(0) : m.over ? matchResult(m, 0) : g.hands[0].length ? 0 : 1;
  if (game.key && (!m || m.over)) {
    const rec = records[game.key] ?? { w: 0, l: 0, t: 0 };
    rec[r > 0 ? 'w' : r < 0 ? 'l' : 't'] += 1;
    records[game.key] = rec;
    save('kitc.records', records);
  }
  haptic(r > 0 ? 'good' : r < 0 ? 'bad' : 'warn');
  game.picked = null;
  game.lifted = null;
  const shown = game;
  setTimeout(() => { if (game === shown) { overlay = 'result'; render(); } }, game.banner ? 1400 : 700);
  changed();
}

// ---------------------------------------------------------------------- a game kept for later

// A game against the family outlives the app being closed: it's saved after every move and opens
// again, where it was, the next time the app starts. Undo starts afresh.
const KEPT_GAME = 'kitc.game';

function keepGame() {
  if (game?.mode !== 'solo') return;
  if (game.g.over && !(game.match && !game.match.over)) return forget(KEPT_GAME);     // between hands, a match is kept
  save(KEPT_GAME, { g: game.g, key: game.key, last: game.last, match: game.match,
    seats: game.seats.map(({ who, name, pos, kind }) => ({ who, name, pos, kind })) });
}

function dropGame() {
  if (game?.mode === 'solo') forget(KEPT_GAME);
  game = null;
}

function resumeGame() {
  const kept = load(KEPT_GAME, {});
  if (!kept.g || (kept.g.over && !(kept.match && !kept.match.over))) return;
  try {
    const g = Game.fromJSON(kept.g);
    const seats = kept.seats.map((s) => (s.kind === 'you' ? { ...s, name: t('You') }
      : { ...s, bot: (FAMILY[s.who] ?? FAMILY.june).make(g.variant) }));
    game = {
      mode: 'solo', g, seats, match: kept.match ?? null, undos: {}, picked: null, lifted: null, fresh: null, freshBy: null, banner: null,
      say: g.current === 0 && !g.over ? { thinking: 0 } : null, last: kept.last ?? null, power: null, powerSeq: 0, busy: false, key: kept.key,
    };
    screen = 'game';
    if (g.over) overlay = 'result';            // between hands of a match: the scores, then Next hand
    else if (g.current !== 0) setTimeout(advance, 700);
  } catch {
    game = null;
    forget(KEPT_GAME);
  }
}

// ---------------------------------------------------------------------- the turn timer

// At a Wi-Fi table the host can give each turn a time limit. The clock runs for whoever is playing
// their own seat (bots and away seats aren't timed: an away seat's turn waits anyway) and covers the
// whole turn: undoing a play doesn't give time back. The host's phone keeps the clock and ends the
// turn at zero; the others are told how much time is left, not when, so their clocks needn't agree.
const TIMERS = [0, 30, 60, 120];
const timerLabel = (sec) => (sec === 0 ? t('No timer') : sec === 120 ? t('2 min') : t('{n}s', { n: sec }));

function keepClock() {
  const g = game.g;
  const s = game.seats[g.current];
  const timed = room?.timer && !g.over && (s.kind === 'you' || (s.kind === 'remote' && !s.away));
  if (!timed) game.clock = null;
  else if (!game.clock || game.clock.turn !== g.turns || game.clock.seat !== g.current) {
    game.clock = { seat: g.current, turn: g.turns, total: room.timer * 1000, deadline: Date.now() + room.timer * 1000, more: false };
  }
}

// The warning starts with ten seconds left, or a quarter of the turn on a long one.
const warnAt = (clock) => Math.max(10, Math.round(clock.total / 4000));
const clockLow = (clock) => Boolean(clock) && Math.ceil((clock.deadline - Date.now()) / 1000) <= warnAt(clock);
const GRACE = 400;   // a move sent in the last instant still counts

// Once a turn, the player on the clock can ask for 30 seconds more.
function moreTime(seat) {
  const c = game?.clock;
  if (!c || c.seat !== seat || c.more) return;
  c.more = true;
  c.deadline += 30_000;
  c.total += 30_000;
  changed();
}

// The host's phone locked or went to the background: the clock stops until it's back, so nobody
// runs out of time while the table can't see them.
document.addEventListener('visibilitychange', () => {
  if (game?.mode !== 'host' || !game.clock) return;
  if (document.visibilityState === 'hidden') game.clock.paused = game.clock.deadline - Date.now();
  else if (game.clock.paused !== undefined) {
    game.clock.deadline = Date.now() + game.clock.paused;
    delete game.clock.paused;
    changed();
  }
});

// Time's up: the turn ends where it stands.
function timeUp(seat) {
  const g = game.g;
  if (g.over || g.current !== seat) return undefined;
  game.picked = null;
  game.lifted = null;
  game.clock = null;
  applyMove(seat, END);
  game.last.timeout = true;
  game.say = { last: game.last };
  if (seat === 0) haptic('bad');
  else if (g.current === 0) flash(noteFor(game.last));   // your turn now: still say why it came early
  changed();
  if (g.over) return finish();
  return setTimeout(advance, 1400);    // long enough to read who ran out of time
}

// Four times a second: the countdowns on screen, the warnings in the last ten seconds, and (on the
// host) the end of a turn whose time is up.
let warned = null;
setInterval(() => {
  const clock = screen === 'game' ? game?.clock : null;
  const table = root.querySelector('.game');
  if (!clock || !table) return;
  const left = clock.deadline - Date.now();
  const secs = Math.max(0, Math.ceil(left / 1000));
  for (const el of root.querySelectorAll('[data-clock]')) el.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const low = secs <= warnAt(clock);
  if (low !== table.classList.contains('clock-low')) {
    if (clock.seat === 0 && !clock.more) render();     // the "+30s" button joins the countdown
    else table.classList.toggle('clock-low', low);
  }
  if (clock.seat === 0 && low) {
    const mark = `${clock.turn}:${secs}`;
    if (warned !== mark && (secs === warnAt(clock) || secs <= 5) && secs > 0) haptic(secs > 5 ? 'warn' : 'tap');
    warned = mark;
  }
  if (game.mode === 'host' && clock.paused === undefined && left <= -GRACE) timeUp(clock.seat);
}, 250);

// After any change: draw it here, and send each phone at the table its view.
function changed(opts = {}) {
  if (game?.mode === 'host') keepClock();
  keepGame();
  render(opts);
  if (game?.mode === 'host') for (let seat = 1; seat < game.seats.length; seat++) {
    const s = game.seats[seat];
    if (s.kind === 'remote') net.send(s.peer, { t: 'state', s: viewFor(seat) });
  }
}

// The table as `seat` sees it, turned so that it sits at 0: its own cards, how many everyone else
// holds, and everything on the table. At the end of a game everyone's cards are shown.
function viewFor(seat) {
  const g = game.g;
  const n = g.n;
  const from = (i) => (i + seat) % n;        // the seat at i in the turned view
  const to = (q) => (q - seat + n) % n;
  const turn = (x) => x && { ...x, ...('seat' in x ? { seat: to(x.seat) } : {}) };
  const power = game.power && { ...game.power, by: to(game.power.by), ...('with' in game.power ? { with: to(game.power.with) } : {}) };
  const say = game.say && (game.say.last ? { last: turn(game.say.last) }
    : Object.fromEntries(Object.entries(game.say).map(([k, q]) => [k, to(q)])));
  return {
    n, variant: g.variant, turns: g.turns, moves: g.moves, passes: g.passes, current: to(g.current),
    drew: g.current === seat ? g.drew : null, stock: g.stock.length, powers: g.powers,
    hands: [...Array(n).keys()].map((i) => (i === 0 || g.over ? g.hands[from(i)] : g.hands[from(i)].length)),
    piles: g.piles, over: g.over, winners: g.winners.map(to), reason: g.reason,
    legal: g.current === seat && !g.over ? g.legal() : [],
    undo: Boolean(game.undos[seat]?.length),
    seats: [...Array(n).keys()].map((i) => {
      const s = game.seats[from(i)];
      return { name: s.kind === 'you' ? s.label : s.name, who: s.kind === 'you' ? meWho() : s.who, away: Boolean(s.away) };
    }),
    aid: room?.aid !== false,
    clock: game.clock && { seat: to(game.clock.seat), turn: game.clock.turn, total: game.clock.total, more: game.clock.more,
      left: (game.clock.paused ?? game.clock.deadline - Date.now()) },
    fresh: game.fresh, freshSeat: game.last && game.last.a !== END ? to(game.last.seat) : null,
    say, power, powerSeq: game.powerSeq, match: game.match && turnMatch(game.match, seat),
  };
}

// A guest: the host's view of the table becomes this phone's game.
function guestState(v) {
  const n = v.n;
  const seats = v.seats.map((s, i) => (i === 0 ? { who: 'you', name: t('You'), kind: 'you' }
    : { who: s.who.startsWith('@') ? person(clean(s.who.slice(1).split('|')[0]), s.who.split('|')[1]) : s.who, name: clean(s.name), pos: POSITIONS[n][i - 1], kind: 'remote', away: Boolean(s.away) }));
  const prev = game?.mode === 'guest' ? game : null;
  const g = {
    n, variant: v.variant, turns: v.turns, moves: v.moves, passes: v.passes, current: v.current, drew: v.drew,
    stock: { length: v.stock }, powers: v.powers, piles: v.piles, over: v.over, winners: v.winners, reason: v.reason,
    hands: v.hands.map((h) => (Array.isArray(h) ? h : Array(h).fill(-1))),
    legal: () => v.legal,
    result: (q) => (!v.winners.includes(q) ? -1 : v.winners.length === 1 ? 1 : 0),
  };
  const newDeal = !prev || (prev.g.over && !v.over) || v.turns < prev.g.turns;
  game = {
    mode: 'guest', g, seats, undoable: v.undo, aid: v.aid, picked: newDeal ? null : prev.picked, lifted: newDeal ? null : prev.lifted,
    fresh: v.fresh, freshBy: v.freshSeat ? seats[v.freshSeat].who : null, say: v.say, banner: newDeal ? null : prev.banner,
    power: v.power, powerSeq: v.powerSeq, busy: false, pending: false, key: null, viewing: prev?.viewing, match: v.match ?? null,
    clock: v.clock && { seat: v.clock.seat, turn: v.clock.turn, total: v.clock.total, more: v.clock.more, deadline: Date.now() + v.clock.left },
  };
  if (game.picked && !hand().includes(SUIT_ORDER.indexOf(game.picked[1]) * 13 + RANK_ORDER.indexOf(game.picked[0]))) game.picked = null;
  const last = v.say?.last;
  if (last?.timeout && last.seat !== 0 && v.current === 0 && prev?.g.current !== 0) flash(noteFor(last));
  if (newDeal) overlay = null;
  screen = 'game';
  if (prev && v.powerSeq > prev.powerSeq) showBanner();
  const myTurnNow = v.current === 0 && !v.over && (!prev || prev.g.current !== 0);
  if (myTurnNow) haptic('tap');
  render(v.freshSeat ? { from: v.freshSeat, flight: 'rival' } : {});
  if (v.over && !(prev?.g.over)) {
    haptic(g.result(0) > 0 ? 'good' : g.result(0) < 0 ? 'bad' : 'warn');
    // Later views of the same finished game replace `game`; the result is for whichever is shown then.
    setTimeout(() => { if (game?.mode === 'guest' && game.g.over && screen === 'game') { overlay = 'result'; render(); } }, game.banner ? 1400 : 700);
  }
  if (myTurnNow) maybeAutoEnd();
}

function resultHTML() {
  if (game.match) return matchResultHTML();
  const g = game.g;
  const r = g.result(0);
  const winner = g.winners[0];
  let title;
  let line;
  if (g.winners.length > 1) {
    // A tie: yours, or between others (then you lost).
    title = r === 0 ? t('It’s a tie') : t('{names} tied', { names: list(g.winners.map(nameOf)) });
    line = t('The stock ran out and nobody could play. {names} held the fewest cards.', { names: list(g.winners.map(nameOf)) });
  } else {
    title = winner === 0 ? t('You won!') : t('{name} won', { name: nameOf(winner) });
    if (g.reason === 'out') {
      line = winner === 0 ? t('You played your last card first, in {n} turns.', { n: Math.ceil(g.turns / g.n) })
        : t('{name} played the last card first.', { name: nameOf(winner) });
    } else {
      line = winner === 0 ? t('The stock ran out and nobody could play: you held the fewest cards.')
        : t('The stock ran out and nobody could play: {name} held the fewest cards.', { name: nameOf(winner) });
    }
  }
  const order = [...Array(g.n).keys()].sort((a, b) => g.hands[a].length - g.hands[b].length);
  const rows = order.map((q) => {
    const won = g.winners.includes(q);
    const who = q === 0 ? t('You') : `${avatarHTML(game.seats[q].who)}${esc(nameOf(q))}`;
    const left = g.hands[q].length ? chipsHTML(g.hands[q].map(cardCode).sort(byRank)) : t('Out');
    return `<tr class="${won ? 'won' : ''}"><td><span class="who">${who}</span></td><td>${left}</td></tr>`;
  }).join('');
  const rec = game.key && records[game.key];
  const face = g.winners.includes(0) ? '' : avatarHTML(game.seats[winner].who, 'big');
  const buttons = game.mode === 'solo'
    ? `<button class="btn plain" data-go="setup">${t('Change table')}</button><button class="btn" data-act="again">${t('Play again')}</button>`
    : game.mode === 'host'
    ? `<button class="btn plain" data-act="close-table">${t('Close table')}</button><button class="btn" data-act="host-again">${t('Play again')}</button>`
    : null;
  const foot = buttons ? `<div class="row">${buttons}</div>`
    : `<p class="waiting searching">${t('Waiting for {name} to deal again', { name: esc(room?.lobby?.host ?? '') })}</p>
      <button class="btn plain" data-act="leave-table" style="width:100%">${t('Leave table')}</button>`;
  return `<div class="result-mark">${face}<div><h2>${title}</h2><p style="margin:0">${line}</p></div></div>
    <table class="tally-table">${rows}${rec ? `<tr><td>${t('At this table')}</td><td><b>${recordText(rec)}</b></td></tr>` : ''}</table>
    ${foot}`;
}

// The end of a hand in a match: what everyone held and scored, the totals, and the end of the
// match if it came.
function matchResultHTML() {
  const g = game.g;
  const m = game.match;
  const hand = m.hands.at(-1);
  if (!hand) return '';
  const kamikaze = hand.reason === 'kamikaze';
  let title;
  let line;
  if (kamikaze) {
    title = t('Kamikaze!');
    line = hand.by === 0 ? t('You held ace to king, one of each. The match is yours.')
      : t('{name} held ace to king, one of each, and wins the match.', { name: nameOf(hand.by) });
  } else {
    if (m.over) {
      const r = matchResult(m, 0);
      title = r > 0 ? t('You won the match!') : r === 0 ? t('You tied the match')
        : m.winners.length > 1 ? t('{names} tied the match', { names: list(m.winners.map(nameOf)) })
        : t('{name} won the match', { name: nameOf(m.winners[0]) });
    } else {
      title = hand.reason === 'stuck' ? t('The stock ran out') : hand.by === 0 ? t('You went out!') : t('{name} went out', { name: nameOf(hand.by) });
    }
    const over = [...Array(g.n).keys()].filter((q) => m.scores[q] > TARGET);
    const others = over.filter((q) => q !== 0);
    line = [
      hand.reason === 'stuck' ? t('Nobody could play, so everyone scores the cards they hold.') : t('Everyone else scores the cards they hold.'),
      over.includes(0) ? t('You went over 50.') : '',
      others.length ? t('{names} went over 50.', { names: list(others.map(nameOf)) }) : '',
      hand.landed.includes(0) ? t('Exactly 50: you go back to 25.') : '',
      hand.landed.some((q) => q !== 0) ? t('Exactly 50 for {names}: back to 25.', { names: list(hand.landed.filter((q) => q !== 0).map(nameOf)) }) : '',
    ].filter(Boolean).join(' ');
  }
  const top = m.over ? m.winners : hand.by === null ? [] : [hand.by];
  const order = [...Array(g.n).keys()].sort((a, b) => m.scores[a] - m.scores[b]);
  const rows = order.map((q) => {
    const who = q === 0 ? t('You') : `${avatarHTML(game.seats[q].who)}${esc(nameOf(q))}`;
    const left = g.hands[q].length ? chipsHTML(g.hands[q].map(cardCode).sort(byRank)) : `<span class="out">${t('Out')}</span>`;
    const got = kamikaze ? '' : `+${hand.got[q]}`;
    return `<tr class="${top.includes(q) ? 'won' : ''}${m.losers.includes(q) ? ' lost' : ''}"><td><span class="who">${who}</span>${left}</td>`
      + `<td class="got">${got}</td><td class="total">${m.scores[q]}</td></tr>`;
  }).join('');
  const rec = m.over && game.key && records[game.key];
  const face = top.length === 1 && top[0] !== 0 ? avatarHTML(game.seats[top[0]].who, 'big') : '';
  const next = !m.over;
  const buttons = game.mode === 'solo'
    ? (next ? `<button class="btn plain" data-act="resign">${t('Leave match')}</button><button class="btn" data-act="next-hand">${t('Next hand')}</button>`
      : `<button class="btn plain" data-go="setup">${t('Change table')}</button><button class="btn" data-act="again">${t('New match')}</button>`)
    : game.mode === 'host'
    ? `<button class="btn plain" data-act="close-table">${t('Close table')}</button>${next ? `<button class="btn" data-act="host-next">${t('Next hand')}</button>`
      : `<button class="btn" data-act="host-again">${t('New match')}</button>`}`
    : null;
  const host = esc(room?.lobby?.host ?? '');
  const foot = buttons ? `<div class="row">${buttons}</div>`
    : `<p class="waiting searching">${next ? t('Waiting for {name} to deal the next hand', { name: host }) : t('Waiting for {name} to deal again', { name: host })}</p>
      <button class="btn plain" data-act="leave-table" style="width:100%">${t('Leave table')}</button>`;
  return `<div class="result-mark">${face}<div><h2>${title}</h2><p style="margin:0">${line}</p></div></div>
    <table class="tally-table match-table"><tr class="head"><td>${t('Hand {n}', { n: m.hands.length })}</td><td>${t('Points')}</td><td>${t('Total')}</td></tr>${rows}
      ${rec ? `<tr><td>${t('At this table')}</td><td colspan="2"><b>${recordText(rec)}</b></td></tr>` : ''}</table>
    ${foot}`;
}

// The match so far, from the score on the table: every hand's points and the totals.
function scoresHTML() {
  const m = game.match;
  const seats = [...Array(game.g.n).keys()];
  const name = (q) => (q === 0 ? t('You') : esc(nameOf(q)));
  const rows = m.hands.map((h, i) => `<tr><td>${i + 1}</td>${seats.map((q) => {
    const p = h.reason === 'kamikaze' ? (h.by === q ? t('Kamikaze!') : '') : h.got[q];
    return `<td class="${h.by === q ? 'out' : ''}">${p}${h.landed.includes(q) ? '<small>→25</small>' : ''}</td>`;
  }).join('')}</tr>`).join('');
  return `<h2>${t('Match to 50')}</h2><p style="margin:0">${matchRules()}</p>
    <table class="score-table"><tr><th>${t('Hand')}</th>${seats.map((q) => `<th>${name(q)}</th>`).join('')}</tr>${rows}
      <tr class="sum"><td>${t('Total')}</td>${seats.map((q) => `<td>${m.scores[q]}</td>`).join('')}</tr></table>
    <button class="btn" data-close style="width:100%">${t('Close')}</button>`;
}

// On the table, across from the menu: your score and the hand. A tap opens the scores.
function matchPillHTML() {
  const m = game.match;
  const n = m.hands.length + (game.g.over ? 0 : 1);
  return `<button class="match-pill" data-open="scores" aria-label="${t('Scores: you have {score} of 50, hand {n}', { score: m.scores[0], n })}">`
    + `<small>${t('Hand {n}', { n })}</small><b>${m.scores[0]}<span>/${TARGET}</span></b></button>`;
}

// A pile opened up: every card in it, from the first to the top.
function pileSheetHTML() {
  const pile = game.g.piles[SPOTS.indexOf(game.viewing)].map(cardCode);
  const demon = game.g.variant === 'demons';
  const label = (i) => (pile.length < 2 ? '' : i === 0 ? t('First card') : i === pile.length - 1 ? t('Top card') : '');
  const items = pile.map((c, i) => `<div class="pv">${cardHTML(c, '', 'div', demon)}<span>${label(i)}</span></div>`).join('');
  return `<h2>${spotName(game.viewing)}</h2><p style="margin:0">${cards(pile.length)}</p>
    <div class="pile-view" style="--n:${pile.length}">${items}</div>
    <button class="btn" data-close style="width:100%">${t('Close')}</button>`;
}

function openPile(id) {
  if (!game || !game.g.piles[SPOTS.indexOf(id)].length) return;
  game.viewing = id;
  game.lifted = null;
  overlay = 'pile';
  haptic('tap');
  render();
}

const RANK_ORDER = 'A23456789TJQK';
const SUIT_ORDER = 'shdc';
function byRank(a, b) {
  return SUIT_ORDER.indexOf(a[1]) - SUIT_ORDER.indexOf(b[1]) || RANK_ORDER.indexOf(a[0]) - RANK_ORDER.indexOf(b[0]);
}

function gameView() {
  const g = game.g;
  const legal = humanLegal();
  const plays = legal.filter((a) => a < MOVE);
  const held = hand().map(cardCode).sort(byRank);
  const aid = aidOn();
  const playable = new Set(aid ? plays.map((a) => cardCode(Math.floor(a / 8))) : []);
  let targets = new Set();
  if (!aid) { /* no lights: you try a place and find out */ } else if (game.picked) {
    const c = SUIT_ORDER.indexOf(game.picked[1]) * 13 + RANK_ORDER.indexOf(game.picked[0]);
    targets = new Set(plays.filter((a) => Math.floor(a / 8) === c).map((a) => SPOTS[a % 8]));
  } else if (game.lifted) {
    const side = SPOTS.indexOf(game.lifted);
    targets = new Set(legal.filter((a) => a >= MOVE && a < END && Math.floor((a - MOVE) / 8) === side).map((a) => SPOTS[(a - MOVE) % 8]));
  }
  const spots = Object.fromEntries(SPOTS.map((id, i) => [id, g.piles[i].map(cardCode)]));
  const mine = g.current === 0 && !g.over && !game.busy;      // buttons only once the rivals are done
  const seats = game.seats.slice(1).map((s, i) => {
    const seat = i + 1;
    const c = game.clock?.seat === seat ? game.clock : null;
    return { seat, pos: s.pos, who: s.who, name: esc(s.name), count: g.hands[seat].length, turn: g.current === seat && !g.over,
      clock: c && { total: c.total, elapsed: Math.max(0, c.total - (c.deadline - Date.now())) },
      away: s.away, note: s.away ? t('Away') : g.current === seat && !g.over ? t('Playing…') : undefined, score: game.match?.scores[seat] };
  });
  const passing = mine && g.moves === 0 && g.drew === null;
  const undoable = game.mode === 'guest' ? game.undoable : Boolean(game.undos[0]?.length);
  return {
    variant: g.variant, seats, spots, stock: g.stock.length, passes: g.passes, players: g.n, hand: held,
    picked: game.picked, playable, targets, lifted: game.lifted, fresh: game.fresh, freshBy: game.freshBy,
    banner: game.banner && powerBanner(game.banner), status: statusLine(legal),
    clock: mine && game.clock?.seat === 0 ? { total: game.clock.total, elapsed: Math.max(0, game.clock.total - (game.clock.deadline - Date.now())),
      more: !game.clock.more && game.clock.deadline - Date.now() <= warnAt(game.clock) * 1000 ? t('+30s') : null } : null,
    actions: mine ? { undo: undoable && !game.pending, endLabel: passing ? t('Pass') : t('End turn'), ready: aid && legal.length > 0 && legal.every((a) => a === END), end: !game.pending }
      : { undo: false, end: false, endLabel: g.over ? t('Game over') : t('{name}’s turn', { name: esc(nameOf(g.current)) }) },
  };
}

const coloured = (c) => `<span class="${isRed(c) ? 'red' : ''} s-${cardCode(c)[1]}">${short(c)}</span>`;

function statusLine(legal) {
  const g = game.g;
  if (g.over) return '';
  if (g.current !== 0) return esc(sayText(game.say));
  const tally = g.moves ? ` <span class="tally">${t('{n} played', { n: g.moves })}</span>` : '';
  if (game.miss) return `<span class="hint">${game.miss}</span>${tally}`;
  if (game.picked) {
    const c = SUIT_ORDER.indexOf(game.picked[1]) * 13 + RANK_ORDER.indexOf(game.picked[0]);
    const demon = g.variant === 'demons' && isKing(c);
    return (demon ? t('Set the devil in a corner to unleash it, or on an empty side to keep it quiet')
      : t('Choose where {card} goes', { card: coloured(c) })) + tally;
  }
  if (game.lifted) {
    const first = g.piles[SPOTS.indexOf(game.lifted)][0];
    const above = RANK_ORDER[rank(first)] === 'T' ? '10' : RANK_ORDER[rank(first)];
    return (rank(first) === 13 ? t('Move the pile from {card} into an empty corner', { card: coloured(first) })
      : t('Move the pile from {card} onto a {color} {rank}', { card: coloured(first), color: isRed(first) ? t('black') : t('red'), rank: above })) + tally;
  }
  if (aidOn() && legal.every((a) => a === END)) {
    if (g.drew === null && g.moves === 0) {
      const passes = g.passes + 1 >= g.n ? t('Passing ends the game: fewest cards wins.') : t('Pass, and if everyone else passes too, the fewest cards wins.');
      return `<span class="hint">${t('No plays left. {next}', { next: passes })}</span>`;
    }
    return t('No plays left. End your turn.') + tally;
  }
  if (g.moves === 0) return g.drew !== null ? t('Your turn. You drew {card}', { card: coloured(g.drew) }) : t('Your turn. The stock is out');
  return t('Your turn') + tally;
}

// ---------------------------------------------------------------------- drawing

// Cards slide from where they were (or from whoever played them) to where they are now.
function rects() {
  const m = new Map();
  for (const el of root.querySelectorAll('.cross .card.top, .hand .card')) m.set(el.dataset.card, el.getBoundingClientRect());
  return m;
}

// The motion, from the research behind this pass: a card in flight lifts a little and glides on a
// decelerating curve (Material's emphasized decelerate), then settles; a rival's card travels slower
// than yours so it can be followed; cards left in your hand close up on the standard curve. With
// Reduce Motion on, cards cross-fade into place instead of travelling.
const GLIDE = 'cubic-bezier(0.05, 0.7, 0.1, 1)';
const STANDARD = 'cubic-bezier(0.2, 0, 0, 1)';
const FLIGHT = { rival: 620, mine: 380 };

function slide(before, from, flight) {
  if (!before) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const origin = from !== undefined ? root.querySelector(`.seat[data-seat="${from}"] .plate`)?.getBoundingClientRect()
    : root.querySelector('.stock')?.getBoundingClientRect();
  const speed = flight === 'rival' ? Math.max(0.6, pace()) : 1;
  for (const el of root.querySelectorAll('.cross .card.top, .hand .card')) {
    const known = before.get(el.dataset.card);
    const r0 = known ?? (el.closest('.cross') && from !== undefined ? origin : el.closest('.hand') ? origin : null);
    if (!r0) continue;
    const r1 = el.getBoundingClientRect();
    const dx = r0.left + r0.width / 2 - (r1.left + r1.width / 2);
    const dy = r0.top + r0.height / 2 - (r1.top + r1.height / 2);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
    if (still) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'linear' });
      continue;
    }
    const inCross = Boolean(el.closest('.cross'));
    if (!inCross) {      // your hand making room, or a drawn card arriving from the stock
      el.animate([{ translate: `${dx}px ${dy}px`, opacity: known ? 1 : 0.4 }, { translate: '0 0', opacity: 1 }],
        { duration: known ? 300 : 460, easing: known ? STANDARD : GLIDE });
      continue;
    }
    const duration = (from !== undefined ? FLIGHT.rival : FLIGHT.mine) * speed;
    el.style.zIndex = 6;
    el.animate([
      { translate: `${dx}px ${dy}px`, scale: 1, boxShadow: '0 2px 4px rgba(0,0,0,.35)' },
      { offset: 0.45, scale: 1.07, boxShadow: '0 14px 26px rgba(0,0,0,.45)' },
      { offset: 0.88, scale: 0.99 },
      { translate: '0 0', scale: 1, boxShadow: '0 1px 2px rgba(0,0,0,.4)' },
    ], { duration, easing: GLIDE }).finished.then(() => { el.style.zIndex = ''; }, () => {});
  }
}

// The host's say over a seat whose phone has gone: wait for them, or let Aunt June play it.
function awayBarHTML() {
  if (game?.mode !== 'host' || game.g.over) return '';
  return game.seats.map((s, seat) => (s.kind === 'remote' && s.away
    ? `<div class="away-bar">${avatarHTML(s.who)}<span>${s.june ? t('Aunt June is playing for {name}', { name: esc(s.name) }) : t('{name} is away', { name: esc(s.name) })}</span>
        <button class="btn${s.june ? ' plain' : ''}" data-june="${seat}">${s.june ? t('Wait for {name}', { name: esc(s.name) }) : t('Let Aunt June play')}</button></div>`
    : '')).join('');
}

function juneFor(seat) {
  const s = game.seats[seat];
  if (!s?.away) return undefined;
  s.june = !s.june;
  game.say = s.june ? { june: seat } : { away: seat };
  haptic('tap');
  changed();
  if (s.june && game.g.current === seat) advance();
  return undefined;
}

// A new name or picture reaches the others at the table.
function profileChanged() {
  if (room?.role === 'guest') net.send('host', { t: 'profile', name: myName(), avatar: settings.avatar });
  if (room?.role === 'host') {
    sendLobby();
    if (game?.mode === 'host') changed();
  }
  return render();
}

const SCREENS = { home: homeHTML, setup: setupHTML, rules: rulesHTML, wifi: wifiHTML, join: joinHTML,
  lobby: () => (room?.role === 'host' ? hostLobbyHTML() : guestLobbyHTML()) };

let shownOverlay = null;

function render(opts = {}) {
  const focused = document.activeElement?.id;
  const before = screen === 'game' && root.querySelector('.game') ? rects() : null;
  let html;
  if (screen === 'game' && game) {
    html = tableHTML(gameView()).replace('<div class="top-seat">', `<button class="icon-btn table-menu" data-open="settings" aria-label="${t('Menu')}">${icon.menu}</button>${game.match ? matchPillHTML() : ''}<div class="top-seat">`)
      .replace('<p class="status"', `${awayBarHTML()}<p class="status"`);
  } else html = (SCREENS[screen] ?? homeHTML)();
  // A pile that was moved away while open has nothing left to show.
  if (overlay === 'pile' && !(game && game.g.piles[SPOTS.indexOf(game.viewing)].length)) overlay = null;
  if (overlay === 'result' && !game) overlay = null;
  if (overlay === 'scores' && !game?.match) overlay = null;
  if (overlay) {
    const inner = overlay === 'settings' ? settingsHTML() : overlay === 'pile' ? pileSheetHTML() : overlay === 'scores' ? scoresHTML()
      : overlay === 'notice' ? noticeHTML() : overlay === 'profile' ? profileSheetHTML() : resultHTML();
    const closable = overlay === 'settings' || overlay === 'pile' || overlay === 'scores';
    const enter = overlay !== shownOverlay ? ' enter' : '';     // eases in when it opens, not on every redraw
    html += `<div class="scrim${enter}"${closable ? ' data-close' : ''}></div><div class="sheet${enter}" role="dialog" aria-modal="true">${inner}</div>`;
  }
  const scrolled = overlay && overlay === shownOverlay ? root.querySelector('.sheet')?.scrollTop : 0;
  shownOverlay = overlay;
  root.innerHTML = html;
  if (scrolled) root.querySelector('.sheet').scrollTop = scrolled;      // a redraw doesn't move the sheet under your finger
  if (screen === 'game' && clockLow(game?.clock)) root.querySelector('.game')?.classList.add('clock-low');
  if (focused) document.getElementById(focused)?.focus();
  if (screen === 'game') slide(before, opts.from, opts.flight);
}

// ---------------------------------------------------------------------- taps

// Hold a pile down (or tap it twice, or tap its count) to see every card in it.
let press = null;
let liftedAt = 0;             // when a hold that opened a pile ended: the click that comes with it does nothing
root.addEventListener('pointerdown', (e) => {
  const spot = e.target.closest('.spot');
  if (!spot || screen !== 'game') return;
  press = { x: e.clientX, y: e.clientY, held: false };
  press.timer = setTimeout(() => { press.held = true; openPile(spot.dataset.spot); }, 450);
});
const release = () => {
  if (press?.held) liftedAt = Date.now();
  if (press) clearTimeout(press.timer);
  press = null;
};
root.addEventListener('pointerup', release);
root.addEventListener('pointercancel', release);
root.addEventListener('pointermove', (e) => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) release(); });
root.addEventListener('contextmenu', (e) => { if (e.target.closest('.spot')) e.preventDefault(); });

root.addEventListener('input', (e) => {
  if (e.target.id === 'my-name') { settings.name = e.target.value.slice(0, 16); save('kitc.settings', settings); }
});

let lastTap = { id: null, at: 0 };

root.addEventListener('click', (e) => {
  if (Date.now() - liftedAt < 250) return undefined;    // the hold already opened the pile
  const el = e.target.closest('button, [data-close]');
  if (!el) return undefined;
  const d = el.dataset;
  if (d.close !== undefined) { overlay = null; return render(); }
  if (d.open) { overlay = d.open; return render(); }
  if (d.go) return go(d.go);
  if (d.variant) {
    choice.variant = d.variant;
    save('kitc.table', choice);
    haptic('tap');
    if (room?.role === 'host') sendLobby();
    return render();
  }
  if (d.format) {
    choice.match = d.format === 'match';
    save('kitc.table', choice);
    haptic('tap');
    if (room?.role === 'host') sendLobby();
    return render();
  }
  if (d.players) {
    const k = Number(d.players);
    if (room?.role === 'host' && screen === 'lobby') {
      room.players = Math.max(k, room.guests.length + 1);
      sendLobby();
      return render();
    }
    choice.players = k;
    choice.rivals = choice.rivals.slice(0, k - 1);
    save('kitc.table', choice);
    return render();
  }
  if (d.rival) {
    const at = choice.rivals.indexOf(d.rival);
    if (at >= 0) choice.rivals.splice(at, 1);
    else if (choice.rivals.length < choice.players - 1) choice.rivals.push(d.rival);
    else choice.rivals[choice.rivals.length - 1] = d.rival;
    save('kitc.table', choice);
    haptic('tap');
    return render();
  }
  if (d.join) {
    const tb = room.tables.find((x) => x.id === d.join);
    clearInterval(room.timer);
    room.joining = tb?.name;
    net.join(d.join);
    screen = 'lobby';
    return render();
  }
  if (d.setting) { settings[d.setting] = !settings[d.setting]; save('kitc.settings', settings); applyLook(); return render(); }
  if (d.pace) { settings.pace = d.pace; save('kitc.settings', settings); haptic('tap'); return render(); }
  if (d.pick) {
    settings.avatar = cleanPicture(d.pick);
    save('kitc.settings', settings);
    haptic('tap');
    return render();
  }
  if (d.june !== undefined && game?.mode === 'host') return juneFor(Number(d.june));
  if (d.timer !== undefined && room?.role === 'host') {
    room.timer = Number(d.timer);
    sendLobby();
    haptic('tap');
    return render();
  }
  if (d.aid && room?.role === 'host') {
    room.aid = d.aid === 'on';
    sendLobby();
    haptic('tap');
    return render();
  }
  switch (d.act) {
    case 'deal': case 'again': return newGame();
    case 'host': return hostTable();
    case 'rejoin': return rejoin();
    case 'find': return findTables();
    case 'host-deal': case 'host-again': overlay = null; return hostGame();
    case 'next-hand': case 'host-next': return nextHand();
    case 'close-table': case 'leave-table': leaveRoom(); game = null; overlay = null; return go('home');
    case 'resign': dropGame(); overlay = null; return go('setup');
    case 'notice-ok': overlay = null; notice = null; return render();
    case 'profile-done': overlay = null; return profileChanged();
    default: break;
  }
  if (screen !== 'game' || !game) return undefined;
  if (d.act === 'undo') {
    if (game.mode === 'guest') { if (game.undoable && !game.pending) { game.pending = true; net.send('host', { t: 'undo' }); } return undefined; }
    return undo(0);
  }
  if (d.act === 'end') return endTurn();
  if (d.act === 'more') {
    if (game.mode === 'guest') net.send('host', { t: 'more' });
    else moreTime(0);
    haptic('tap');
    return undefined;
  }
  if (el.classList.contains('card') && el.closest('.hand')) {
    lastTap = { id: null, at: 0 };
    return tapCard(el.dataset.card);
  }
  if (d.spot && e.target.closest('.depth')) return openPile(d.spot);
  if (d.spot && game.busy && game.g.current !== 0) { game.hurry = true; return undefined; }
  if (d.spot) {
    const now = Date.now();
    const twice = lastTap.id === d.spot && now - lastTap.at < 350;
    lastTap = { id: d.spot, at: twice ? 0 : now };
    if (twice) return openPile(d.spot);
    return tapSpot(d.spot);
  }
  return undefined;
});

function tapCard(code) {
  if (!humanLegal().length) return;
  game.lifted = null;
  game.miss = null;
  game.picked = game.picked === code ? null : code;
  const c = SUIT_ORDER.indexOf(code[1]) * 13 + RANK_ORDER.indexOf(code[0]);
  const plays = humanLegal().filter((a) => a < MOVE && Math.floor(a / 8) === c);
  if (game.picked && !plays.length && aidOn()) {
    game.picked = null;
    haptic('bad');
  } else haptic('tap');
  render();
}

function tapSpot(id) {
  const legal = humanLegal();
  if (!legal.length) return undefined;
  const spot = SPOTS.indexOf(id);
  game.miss = null;
  if (game.picked) {
    const c = SUIT_ORDER.indexOf(game.picked[1]) * 13 + RANK_ORDER.indexOf(game.picked[0]);
    if (legal.includes(c * 8 + spot)) return play(c * 8 + spot);
    if (!aidOn()) return miss(t('{card} doesn’t go there', { card: coloured(c) }));
    game.picked = null;
    return render();
  }
  if (game.lifted) {
    const side = SPOTS.indexOf(game.lifted);
    const a = MOVE + side * 8 + spot;
    if (legal.includes(a)) return play(a);
    const first = game.g.piles[side][0];
    game.lifted = null;
    if (id === SPOTS[side]) return render();
    if (!aidOn()) return miss(t('The pile from {card} doesn’t go there', { card: coloured(first) }));
  }
  // Lift a side pile: with the aid, only one that has somewhere to go.
  const movable = legal.some((a) => a >= MOVE && a < END && Math.floor((a - MOVE) / 8) === spot);
  if (spot < 4 && game.g.piles[spot].length && (movable || !aidOn())) {
    game.lifted = id;
    haptic('tap');
  }
  return render();
}

// A line that shows under the cross for a moment on your turn.
function flash(text) {
  game.miss = text;
  setTimeout(() => { if (game?.miss === text) { game.miss = null; render(); } }, 1800);
}

// Without the aid, a wrong place says so and buzzes; the card stays in your hand.
function miss(text) {
  game.miss = text;
  haptic('bad');
  render();
  const shown = game.miss;
  setTimeout(() => { if (game?.miss === shown) { game.miss = null; render(); } }, 1800);
  return undefined;
}

function go(where) {
  if (where === 'back') where = game && !game.g.over ? 'game' : 'home';
  if (where === 'setup' && game) dropGame();
  if (where === 'home' && room && screen !== 'game') leaveRoom();
  screen = where;
  overlay = null;
  render();
}

// The Android back button (and Escape): close a sheet, then step back.
window.kitcBack = () => {
  if (overlay && overlay !== 'result') { overlay = null; render(); return true; }
  if (screen === 'game') { overlay = 'settings'; render(); return true; }
  if (screen === 'lobby' || screen === 'join') { leaveRoom(); go('home'); return true; }
  if (screen !== 'home') { go('home'); return true; }
  return false;
};
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.activeElement?.tagName !== 'INPUT') window.kitcBack(); });

// Back from a locked screen: a host makes sure the table is still on the Wi-Fi; a guest that lost
// the table looks for it at once.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !room) return;
  if (room.role === 'host') net.host(room.name);
  else if (room.reconnecting && !room.rejoining) net.browse();
});

resumeGame();
render();
