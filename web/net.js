// Tables on the same Wi-Fi. The phone shells do the networking: one phone hosts (a TCP listener
// advertised over Bonjour / DNS-SD as _kitc._tcp) and the others find it and connect. Messages are
// JSON, one per line. In a browser opened with ?loopback, tabs on this computer stand in for phones
// over a BroadcastChannel, so two tabs can play each other (for development and tests).
//
// net.on(handler) receives:
//   {e: 'tables', tables: [{id, name}]}   while browsing: the tables found so far
//   {e: 'peer', peer}                     hosting: a phone connected
//   {e: 'gone', peer}                     hosting: it left
//   {e: 'joined'}                         joining: connected to the host
//   {e: 'message', peer, data}            a message (peer is the sender; 'host' when joined)
//   {e: 'closed'}                         joining: the host went away
//   {e: 'error', text}

const shell = globalThis.window?.kitc ?? {};
const nativeShell = Boolean(shell.platform);
const loopback = !nativeShell && /[?&]loopback\b/.test(globalThis.location?.search ?? '') && 'BroadcastChannel' in globalThis;

let handler = () => {};
const emit = (event) => handler(event);

function post(message) {
  if (window.webkit?.messageHandlers?.native) window.webkit.messageHandlers.native.postMessage(message);
  else if (window.KitcAndroid) window.KitcAndroid.post(JSON.stringify(message));
}

// The shells call this with what happened, messages still as JSON text.
window.kitcNet = (event) => {
  if (event.e === 'message') {
    try { event.data = JSON.parse(event.text); } catch { return; }
  }
  emit(event);
};

const viaShell = {
  host: (name) => post({ type: 'net', op: 'host', name }),
  browse: () => post({ type: 'net', op: 'browse' }),
  join: (id) => post({ type: 'net', op: 'join', id }),
  send: (peer, data) => post({ type: 'net', op: 'send', peer, text: JSON.stringify(data) }),
  close: () => post({ type: 'net', op: 'close' }),
};

// Tabs on one computer, for development: the same events, over a BroadcastChannel.
function viaTabs() {
  const me = Math.random().toString(36).slice(2, 10);
  const channel = new BroadcastChannel('kitc-loopback');
  let hosting = null;
  let joined = null;
  let browsing = null;
  const peers = new Set();
  const say = (m) => channel.postMessage({ ...m, from: me });
  channel.onmessage = ({ data: m }) => {
    if (m.to && m.to !== me) return;
    if (m.k === 'browse' && hosting) say({ k: 'table', to: m.from, name: hosting });
    else if (m.k === 'table' && browsing) {
      browsing.set(m.from, m.name);
      emit({ e: 'tables', tables: [...browsing].map(([id, name]) => ({ id, name })) });
    } else if (m.k === 'join' && hosting) {
      peers.add(m.from);
      say({ k: 'welcome', to: m.from });
      emit({ e: 'peer', peer: m.from });
    } else if (m.k === 'welcome' && joined === m.from) emit({ e: 'joined' });
    else if (m.k === 'msg') emit({ e: 'message', peer: hosting ? m.from : 'host', data: m.data });
    else if (m.k === 'bye') {
      if (hosting && peers.delete(m.from)) emit({ e: 'gone', peer: m.from });
      else if (joined === m.from) { joined = null; emit({ e: 'closed' }); }
    }
  };
  addEventListener('pagehide', () => say({ k: 'bye' }));
  return {
    host: (name) => { hosting = name; },
    browse: () => { browsing = new Map(); say({ k: 'browse' }); },
    join: (id) => { browsing = null; joined = id; say({ k: 'join', to: id }); },
    send: (peer, data) => say({ k: 'msg', to: peer === 'host' ? joined : peer, data }),
    close: () => { say({ k: 'bye' }); hosting = null; joined = null; browsing = null; peers.clear(); },
  };
}

const transport = nativeShell ? viaShell : loopback ? viaTabs() : null;

export const net = {
  available: Boolean(transport),
  on: (fn) => { handler = fn; },
  host: (name) => transport?.host(name),
  browse: () => transport?.browse(),
  join: (id) => transport?.join(id),
  send: (peer, data) => transport?.send(peer, data),
  close: () => transport?.close(),
};
