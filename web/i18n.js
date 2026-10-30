// The words on screen, in English or German. English is written in the code; lang/de.js gives the
// German for each English text. Placeholders like {name} in a text are filled in from t's second
// argument. tests/test_i18n.py checks that every text has its German, with the same placeholders.
//
// The phone's language comes from the iOS or Android shell (window.kitc.lang), in a browser from
// its languages; anything but German is English.

import DE from './lang/de.js';

function pick() {
  const shell = globalThis.window?.kitc;
  const browser = globalThis.navigator?.languages?.length ? globalThis.navigator.languages : [globalThis.navigator?.language || 'en'];
  const wanted = shell?.lang ? [shell.lang] : browser;
  const found = wanted.find((l) => /^(de|en)\b/i.test(l)) || 'en';
  return found.slice(0, 2).toLowerCase();
}

export const lang = pick();
if (globalThis.document) document.documentElement.lang = lang;
const words = lang === 'de' ? DE : {};

export function t(text, params) {
  const s = words[text] ?? text;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m)) : s;
}

// "June's" / "Junes", "Max’"
export const possessive = (name) => (lang === 'de' ? (/[sßxz]$/i.test(name) ? `${name}’` : `${name}s`) : `${name}’s`);

// "You and Nana" / "Du und Nana"
export function list(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${lang === 'de' ? 'und' : 'and'} ${items[items.length - 1]}`;
}

// "1 card" / "3 cards"
export const cards = (n) => (n === 1 ? t('1 card') : t('{n} cards', { n }));
