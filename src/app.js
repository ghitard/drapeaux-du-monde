// ═══════════════ Drapeaux en tête — application ═══════════════
(() => {
'use strict';

// cible de compilation : 'web' (site autonome installable) ou 'claude' (artefact)
const WEB = typeof BUILD !== 'undefined' && BUILD.target === 'web';

// ─────────── données ───────────
const ZONES = DATA.zones;
const ZONE_KEYS = Object.keys(ZONES);
const FLAGS = DATA.flags;
const BY = Object.fromEntries(FLAGS.map(f => [f.c, f]));
const GROUPS = DATA.groups;
const NAME_PAIRS = DATA.namePairs;
const GROUPS_OF = {};
GROUPS.forEach((g, i) => g.m.forEach(c => (GROUPS_OF[c] = GROUPS_OF[c] || []).push(i)));
const LEVEL_LABEL = ['Nouveau', 'En cours', 'Familier', 'Maîtrisé'];
const DIRS = ['f', 'r'];
const flagUrl = c => 'flags/' + c + '.svg';

// ─────────── utilitaires ───────────
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const NB = ' '; // espace insécable avant les unités
const pct = v => Math.round(v * 100) + NB + '%';
function shuffle(a, rnd = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mulberry32(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const today = () => dayIndex(now());
const dayDate = d => new Date(d * DAY_MS + 12 * 3600000); // lire en UTC
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtDay = d => { const x = dayDate(d); return DAY_NAMES[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + MONTHS[x.getUTCMonth()]; };
const fmtShort = d => { const x = dayDate(d); return x.getUTCDate() + ' ' + MONTHS_S[x.getUTCMonth()]; };
const weekday = d => (dayDate(d).getUTCDay() + 6) % 7; // lundi = 0
const fmtNow = () => { const x = new Date(); return DAY_NAMES[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; };
function inDays(n) {
  if (n <= 0) return "aujourd’hui";
  if (n === 1) return 'demain';
  if (n < 30) return 'dans ' + n + NB + 'j';
  if (n < 365) return 'dans ' + Math.round(n / 30) + NB + 'mois';
  return 'dans ' + (n / 365).toFixed(1).replace('.', ',') + NB + 'ans';
}
function durDays(s) { if (s < 1) return Math.max(1, Math.round(s * 24)) + NB + 'h'; if (s < 60) return Math.round(s) + NB + 'j'; if (s < 730) return Math.round(s / 30) + NB + 'mois'; return (s / 365).toFixed(1).replace('.', ',') + NB + 'ans'; }

function norm(s) {
  s = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/&/g, ' et ').replace(/[’'`´.\-–—_,()]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(les|la|le|l|the) /, '');
  s = s.replace(/^(iles?|isle) /, '');
  s = s.replace(/^(de|du|des|d|of) /, '');
  s = s.replace(/\bst\b/g, 'saint').replace(/\bste\b/g, 'sainte');
  return s;
}
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
const NAME_INDEX = [];   // [normalisé, code]
const NAME_EXACT = {};
for (const f of FLAGS) for (const nm of [f.n, ...(f.a || [])]) { const k = norm(nm); NAME_INDEX.push([k, f.c]); NAME_EXACT[k] = f.c; }

// ─────────── ordre d'introduction ───────────
function buildOrder(mode) {
  const rnd = mulberry32(20261025);
  let out = [];
  if (mode === 'zone') {
    for (const z of ZONE_KEYS) {
      const inZone = FLAGS.filter(f => f.ct === z);
      for (let t = 1; t <= 4; t++) out.push(...shuffle(inZone.filter(f => f.f === t), rnd).map(f => f.c));
    }
  } else {
    for (let t = 1; t <= 4; t++) {
      const lists = ZONE_KEYS.map(z => shuffle(FLAGS.filter(f => f.f === t && f.ct === z && !f.t), rnd))
        .concat([shuffle(FLAGS.filter(f => f.f === t && f.t), rnd)]);
      let k = 0;
      while (lists.some(l => l.length)) { const l = lists[k % lists.length]; if (l.length) out.push(l.shift().c); k++; }
    }
  }
  // écarte les sosies : deux membres d'un même groupe à au moins 9 rangs d'écart
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < out.length; i++) {
      const gi = GROUPS_OF[out[i]] || [];
      for (let j = Math.max(0, i - 8); j < i; j++) {
        if ((GROUPS_OF[out[j]] || []).some(g => gi.includes(g))) {
          const [x] = out.splice(i, 1);
          out.splice(Math.min(out.length, i + 9), 0, x);
          break;
        }
      }
    }
  }
  return out;
}
const ORDERS = { fame: buildOrder('fame'), zone: buildOrder('zone') };

// ─────────── état & sauvegarde ───────────
const LS_KEY = 'drapeaux-en-tete:v1';
const DEFAULT_SETTINGS = { newPerDay: 8, goal: 25, retention: 0.9, terr: true, rev: true, mode: 'adaptive', order: 'fame', zones: Object.fromEntries(ZONE_KEYS.map(z => [z, 1])) };
function freshState() {
  return { v: 1, epoch: rid(), epochAt: now(), settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), settingsAt: 0, cards: {}, days: {}, conf: {}, updatedAt: now() };
}
function sanitize(st) {
  if (!st || typeof st !== 'object' || !st.cards) return null;
  st.settings = Object.assign(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), st.settings || {});
  st.settings.zones = Object.assign(Object.fromEntries(ZONE_KEYS.map(z => [z, 1])), st.settings.zones || {});
  st.days = st.days || {}; st.conf = st.conf || {};
  return st;
}
function readLocal() { try { const raw = localStorage.getItem(LS_KEY); return raw ? sanitize(JSON.parse(raw)) : null; } catch (e) { return null; } }
let lsTimer = null;
function writeLocal() { clearTimeout(lsTimer); lsTimer = setTimeout(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ } }, 300); }
function mergeStates(a, b) {
  if (!a) return b; if (!b) return a;
  if (a.epoch !== b.epoch) return (a.epochAt || 0) > (b.epochAt || 0) ? a : b; // une réinitialisation l'emporte
  const out = Object.assign({}, b);
  out.cards = Object.assign({}, b.cards);
  for (const [k, c] of Object.entries(a.cards || {})) if (!out.cards[k] || (c.lr || 0) > (out.cards[k].lr || 0)) out.cards[k] = c;
  out.days = Object.assign({}, b.days);
  for (const [k, d] of Object.entries(a.days || {})) if (!out.days[k] || d.n > out.days[k].n) out.days[k] = d;
  out.conf = Object.assign({}, b.conf);
  for (const [k, v] of Object.entries(a.conf || {})) out.conf[k] = Math.max(v, out.conf[k] || 0);
  if ((a.settingsAt || 0) > (b.settingsAt || 0)) { out.settings = a.settings; out.settingsAt = a.settingsAt; }
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return out;
}
function sameJSON(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } }
// Import volontaire depuis un autre appareil : fusion carte par carte (la révision la plus récente gagne).
function importMerge(local, inc) {
  const out = JSON.parse(JSON.stringify(local));
  let updated = 0;
  for (const [k, c] of Object.entries(inc.cards || {})) {
    const mine = out.cards[k];
    if (!c || !c.st) continue;
    if (!mine || !mine.st || (c.lr || 0) > (mine.lr || 0)) { out.cards[k] = c; updated++; }
  }
  for (const [k, d] of Object.entries(inc.days || {})) {
    const mine = out.days[k];
    if (!mine) out.days[k] = d;
    else { const keep = Object.assign({}, (d.n || 0) > (mine.n || 0) ? d : mine); if (d.g || mine.g) keep.g = 1; out.days[k] = keep; }
  }
  for (const [k, v] of Object.entries(inc.conf || {})) out.conf[k] = Math.max(v, out.conf[k] || 0);
  if ((inc.settingsAt || 0) > (out.settingsAt || 0)) { out.settings = inc.settings; out.settingsAt = inc.settingsAt; }
  out.updatedAt = now();
  return { state: out, updated };
}
// Lit un fichier ou un texte exporté (format enveloppé ou état brut de l'artefact)
function parseExport(raw) {
  try {
    const j = JSON.parse(String(raw).trim());
    return sanitize(j && j.app === 'drapeaux-en-tete' && j.state ? j.state : j);
  } catch (e) { return null; }
}

let state = readLocal() || freshState();
const S_ = () => state.settings;

const Store = {
  mode: 'local', ref: null, remoteExists: false, error: null,
  dirty: { cards: new Set(), days: new Set(), conf: new Set(), settings: false, full: false },
  timer: null, flushing: false, again: false,
  async connect() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const [user, db] = await Promise.all([window.claude.use('user'), window.claude.use('db')]);
      if (!user || !db) return;
      const uid = await user.id();
      if (!uid) return;
      this.ref = db.collection('data/users/' + uid).doc('progress');
      let snap;
      try { snap = await this.ref.get(); }
      catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 800 + Math.random() * 700)); snap = await this.ref.get(); } else throw e; }
      if (snap.exists) {
        const remote = sanitize(JSON.parse(JSON.stringify(snap.data())));
        this.remoteExists = true;
        const merged = mergeStates(state, remote);
        if (!sameJSON(merged, remote)) this.dirty.full = true;
        state = merged;
      } else {
        this.dirty.full = true;
      }
      this.mode = 'remote';
      writeLocal();
      this.schedule(400);
      onDataChanged();
    } catch (e) {
      this.error = (e && e.code) || 'unavailable';
      onDataChanged();
    }
  },
  touch(kind, key) {
    state.updatedAt = now();
    if (kind === 'card') this.dirty.cards.add(key);
    else if (kind === 'day') this.dirty.days.add(key);
    else if (kind === 'conf') this.dirty.conf.add(key);
    else if (kind === 'settings') this.dirty.settings = true;
    else if (kind === 'full') this.dirty.full = true;
    writeLocal();
    this.schedule(2500);
  },
  schedule(ms) { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), ms); },
  async flush() {
    if (!this.ref) return;
    if (this.flushing) { this.again = true; return; }
    const d = this.dirty;
    if (!d.full && !d.cards.size && !d.days.size && !d.conf.size && !d.settings) return;
    this.flushing = true;
    const taken = { cards: [...d.cards], days: [...d.days], conf: [...d.conf], settings: d.settings, full: d.full || !this.remoteExists };
    this.dirty = { cards: new Set(), days: new Set(), conf: new Set(), settings: false, full: false };
    try {
      if (taken.full) {
        await this.ref.set(JSON.parse(JSON.stringify(state)));
        this.remoteExists = true;
      } else {
        const patch = { updatedAt: state.updatedAt };
        if (taken.cards.length) patch.cards = Object.fromEntries(taken.cards.filter(k => state.cards[k]).map(k => [k, state.cards[k]]));
        if (taken.days.length) patch.days = Object.fromEntries(taken.days.filter(k => state.days[k]).map(k => [k, state.days[k]]));
        if (taken.conf.length) patch.conf = Object.fromEntries(taken.conf.filter(k => state.conf[k] != null).map(k => [k, state.conf[k]]));
        if (taken.settings) { patch.settings = state.settings; patch.settingsAt = state.settingsAt; }
        await this.ref.update(patch);
      }
      this.error = null; this.refusals = 0;
    } catch (e) {
      const code = (e && e.code) || 'unavailable';
      this.error = code;
      // on remet tout à écrire ; si le document a disparu, réécriture complète
      taken.cards.forEach(k => this.dirty.cards.add(k)); taken.days.forEach(k => this.dirty.days.add(k)); taken.conf.forEach(k => this.dirty.conf.add(k));
      if (taken.settings) this.dirty.settings = true;
      if (taken.full || code === 'invalid_argument') this.dirty.full = true;
      // écritures refusées à répétition (lecture seule, quota) : on reste en local sur cet appareil
      if (code === 'invalid_argument' || code === 'quota_exceeded') this.refusals = (this.refusals || 0) + 1;
      if (code === 'revoked' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed' || this.refusals >= 3) { this.ref = null; this.mode = 'local'; }
      else this.schedule(code === 'resource_exhausted' ? 20000 : 8000);
    }
    this.flushing = false;
    if (this.again) { this.again = false; this.schedule(300); }
  },
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { Store.flush(); try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} } });
window.addEventListener('pagehide', () => { Store.flush(); });

// ─────────── modèle ───────────
const cardId = (code, dir) => code + '_' + dir;
const splitId = id => { const i = id.lastIndexOf('_'); return [id.slice(0, i), id.slice(i + 1)]; };
const getCard = id => state.cards[id] || { st: ST.NEW };
const isIntro = code => (getCard(cardId(code, 'f')).st || 0) > 0;
function pool() {
  const st = S_();
  return FLAGS.filter(f => st.zones[f.ct] && (st.terr || f.t !== 'terr')).map(f => f.c);
}
function retrNow(c, t = now()) { if (!c || !c.st || c.s == null) return 0; return FSRS.retr(Math.max(0, (t - c.lr) / DAY_MS), c.s); }
function level(c) { if (!c || !c.st) return 0; if (c.st !== ST.REVIEW) return 1; if (c.s >= 21) return 3; if (c.s >= 7) return 2; return 1; }
function introducedOn(dir, d) { let n = 0; for (const [id, c] of Object.entries(state.cards)) if (c.fs && id.endsWith('_' + dir) && dayIndex(c.fs) === d) n++; return n; }
const REV_PER_DAY = 6;

function plan() {
  const t = today(), P = pool(), st = S_();
  const inPool = new Set(P);
  const learning = [], due = [];
  // « frère enterré » : si l'autre sens du même drapeau a été travaillé aujourd'hui, celui-ci attend demain
  const doneToday = id => { const c = state.cards[id]; return !!(c && c.lr && dayIndex(c.lr) === t); };
  for (const code of P) for (const dir of DIRS) {
    if (dir === 'r' && !st.rev) continue;
    const c = state.cards[cardId(code, dir)];
    if (!c || !c.st) continue;
    if (c.st === ST.LEARN || c.st === ST.RELEARN) learning.push(cardId(code, dir));
    else if (c.due <= t && !doneToday(cardId(code, dir === 'f' ? 'r' : 'f'))) due.push(cardId(code, dir));
  }
  const nowT = now();
  due.sort((a, b) => retrNow(getCard(a), nowT) - retrNow(getCard(b), nowT));
  const quota = Math.max(0, st.newPerDay - introducedOn('f', t));
  const newF = [];
  for (const code of ORDERS[st.order] || ORDERS.fame) { if (newF.length >= quota) break; if (inPool.has(code) && !isIntro(code)) newF.push(cardId(code, 'f')); }
  const newR = [];
  if (st.rev) {
    const rq = Math.max(0, REV_PER_DAY - introducedOn('r', t));
    for (const code of ORDERS[st.order] || ORDERS.fame) {
      if (newR.length >= rq) break;
      if (!inPool.has(code)) continue;
      const f = state.cards[cardId(code, 'f')], r = state.cards[cardId(code, 'r')];
      // le sens inverse s'ouvre une fois le drapeau réussi lors d'une révision un autre jour
      if (f && f.st === ST.REVIEW && f.s >= 5 && (f.r || 0) >= 1 && (!r || !r.st) && !doneToday(cardId(code, 'f'))) newR.push(cardId(code, 'r'));
    }
  }
  const leftNew = P.filter(c => !isIntro(c)).length;
  return { learning, due, newF, newR, quota, leftNew, t };
}
function estimateMinutes(p) { const n = p.learning.length + Math.min(p.due.length, 60) + p.newF.length * 2.2 + p.newR.length * 1.3; return Math.max(1, Math.round(n * 7 / 60)); }

function streakInfo() {
  const t = today();
  const done = d => !!(state.days[d] && state.days[d].g);
  let cur = 0, d = done(t) ? t : t - 1;
  while (done(d)) { cur++; d--; }
  const keys = Object.keys(state.days).map(Number).filter(done).sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const k of keys) { run = prev !== null && k === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; }
  return { cur, best: Math.max(best, cur), todayDone: done(t) };
}
function dayStats(d) { return state.days[d] || { n: 0, k: 0, nw: 0, t: 0 }; }

// ─────────── pièges des QCM ───────────
function distractors(code, n, dir, mode, preferred = []) {
  const P = new Set(pool());
  const picked = [];
  const add = c => { if (c && c !== code && P.has(c) && !picked.includes(c) && picked.length < n) picked.push(c); };
  preferred.forEach(add);
  const c = getCard(cardId(code, dir));
  const isNew = !c.st;
  // confusions personnelles (dans les deux sens)
  const conf = Object.entries(state.conf).filter(([k]) => k.startsWith(code + '~') || k.endsWith('~' + code))
    .sort((a, b) => b[1] - a[1]).map(([k]) => { const [x, y] = k.split('~'); return x === code ? y : x; });
  if (conf.length && Math.random() < 0.8) add(conf[0]);
  const similar = [];
  for (const gi of GROUPS_OF[code] || []) similar.push(...GROUPS[gi].m);
  similar.push(...(BY[code].nb || []).slice(0, 6));
  const hard = isNew ? 2 : 3;
  for (const s of shuffle([...new Set(similar)])) { if (picked.length >= Math.min(n, hard + (conf.length ? 1 : 0))) break; add(s); }
  if (dir === 'f' && Math.random() < 0.5) { const pair = NAME_PAIRS.find(p => p.includes(code)); if (pair) add(shuffle(pair.filter(x => x !== code))[0]); }
  const sameZone = shuffle(FLAGS.filter(f => f.ct === BY[code].ct).map(f => f.c));
  sameZone.forEach(add);
  shuffle([...P]).forEach(add);
  return picked.slice(0, n);
}

// ─────────── vérification d'une saisie ───────────
function checkTyped(input, code) {
  const t = norm(input);
  if (!t) return { ok: false, empty: true };
  const own = [BY[code].n, ...(BY[code].a || [])].map(norm);
  if (own.includes(t)) return { ok: true, exact: true };
  const other = NAME_EXACT[t];
  if (other && other !== code) return { ok: false, other };
  let best = Infinity; for (const nm of own) best = Math.min(best, lev(t, nm));
  const maxD = t.length <= 4 ? 0 : t.length <= 8 ? 1 : 2;
  if (best <= maxD) {
    let bo = Infinity, oc = null;
    for (const [nm, c] of NAME_INDEX) if (c !== code) { const d = lev(t, nm); if (d < bo) { bo = d; oc = c; } }
    if (bo < best) return { ok: false, other: oc, near: true };
    return { ok: true, exact: false };
  }
  return { ok: false };
}

// ─────────── séance ───────────
let S = null;   // séance en cours
let view = 'home';
let sheet = null; // contenu de la feuille ouverte

function newSession(kind, queue, extra = {}) {
  return Object.assign({ kind, queue, total0: queue.length, answered: 0, results: [], missed: [], introduced: 0, startedAt: now(), q: null, p: null, done: false }, extra);
}
function buildDaily() {
  const p = plan();
  const seen = new Set();
  const take = id => { const [code] = splitId(id); if (seen.has(code)) return false; seen.add(code); return true; };
  const learning = p.learning.filter(take);
  const due = p.due.slice(0, 60).filter(take);
  const fresh = [];
  const nf = p.newF.slice(), nr = p.newR.slice();
  while (nf.length || nr.length) { if (nf.length) fresh.push(nf.shift()); if (nr.length) fresh.push(nr.shift()); }
  const freshOk = fresh.filter(take);
  // entrelace : deux révisions puis une nouvelle
  const q = learning.slice();
  let i = 0, j = 0;
  while (i < due.length || j < freshOk.length) {
    if (i < due.length) q.push(due[i++]);
    if (i < due.length) q.push(due[i++]);
    if (j < freshOk.length) q.push(freshOk[j++]);
  }
  return newSession('daily', q);
}
function buildExtraNew(n = 5) {
  const P = new Set(pool());
  const q = [];
  for (const code of ORDERS[S_().order] || ORDERS.fame) { if (q.length >= n) break; if (P.has(code) && !isIntro(code)) q.push(cardId(code, 'f')); }
  return newSession('extra', q);
}
function buildWeak(n = 15) {
  const P = pool();
  const ids = [];
  for (const code of P) for (const dir of DIRS) { if (dir === 'r' && !S_().rev) continue; const c = state.cards[cardId(code, dir)]; if (c && c.st) ids.push(cardId(code, dir)); }
  const t = now();
  const scored = ids.map(id => { const c = getCard(id); return [id, retrNow(c, t) - (c.l || 0) * 0.04 - (c.d || 5) * 0.01]; }).sort((a, b) => a[1] - b[1]);
  const seen = new Set(), q = [];
  for (const [id] of scored) { const [code] = splitId(id); if (seen.has(code)) continue; seen.add(code); q.push(id); if (q.length >= n) break; }
  return newSession('weak', shuffle(q));
}
function duelGroups() {
  const P = new Set(pool());
  return GROUPS.map((g, gi) => ({ gi, members: g.m.filter(c => P.has(c)), intro: g.m.filter(c => P.has(c) && isIntro(c)) })).filter(x => x.intro.length >= 2);
}
function buildDuel(onlyCodes) {
  const qs = [], groupOf = {};
  if (onlyCodes) {
    const gi = GROUPS.findIndex(g => onlyCodes.every(c => g.m.includes(c)));
    const members = gi >= 0 ? GROUPS[gi].m.filter(c => pool().includes(c) && isIntro(c)) : [];
    const set = [...new Set([...onlyCodes, ...members])].slice(0, 5);
    for (let r = 0; r < 2; r++) shuffle(set).forEach(c => { qs.push(cardId(c, 'f')); });
    set.forEach(c => (groupOf[c] = { gi, members: gi >= 0 ? GROUPS[gi].m : onlyCodes }));
  } else {
    const t = now();
    const gs = duelGroups().map(g => {
      let score = Math.random() * 0.6;
      for (const a of g.intro) { score += 1 - retrNow(getCard(cardId(a, 'f')), t); for (const b of g.members) score += (state.conf[a + '~' + b] || 0) * 0.5; }
      return Object.assign(g, { score });
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    for (const g of gs) {
      shuffle(g.intro).slice(0, 5).forEach(c => { qs.push(cardId(c, 'f')); groupOf[c] = { gi: g.gi, members: g.members }; });
    }
  }
  return newSession('duel', qs, { groupOf });
}

function answerMode(id) {
  const [, dir] = splitId(id);
  const c = getCard(id);
  if (dir === 'r') return 'flags';
  const m = S_().mode;
  if (m === 'mc') return 'mc';
  if (m === 'type') return c.st ? 'type' : 'mc';
  return c.st === ST.REVIEW && c.s >= 4 ? 'type' : 'mc';
}

function nextQuestion() {
  S.p = null;
  if (!S.queue.length) return finishSession();
  const id = S.queue.shift();
  const [code, dir] = splitId(id);
  if (!BY[code]) return nextQuestion();
  const c = getCard(id);
  const mode = answerMode(id);
  const q = { id, code, dir, mode, isNew: !c.st, shownAt: 0, firstKey: 0, hint: false };
  if (S.kind === 'duel' && S.groupOf && S.groupOf[code]) {
    const mem = S.groupOf[code].members.filter(x => x !== code);
    q.mode = 'mc';
    q.options = shuffle([code, ...distractors(code, 3, 'f', 'mc', shuffle(mem))]);
  } else if (mode === 'mc') {
    q.options = shuffle([code, ...distractors(code, 3, dir, mode)]);
  } else if (mode === 'flags') {
    const n = c.st === ST.REVIEW && c.s >= 10 ? 5 : 3;
    q.options = shuffle([code, ...distractors(code, n, dir, mode)]);
  }
  S.q = q;
  renderSession();
  q.shownAt = now();
  // précharge les drapeaux suivants
  S.queue.slice(0, 3).forEach(n => { const [c2] = splitId(n); const im = new Image(); im.src = flagUrl(c2); });
}

function rate(q, correct) {
  if (!correct) return 1;
  const lat = (q.firstKey || now()) - q.shownAt;
  if (q.mode === 'type') {
    if (q.hint) return 2;
    if (lat <= 3000) return 4;
    if (lat <= 9000) return 3;
    return 2;
  }
  if (q.isNew && lat <= 2500) return 4;
  if (lat > 8000) return 2;
  return 3;
}

function answer(choice) {
  const q = S.q;
  if (!q || S.p) return;
  if (!q.firstKey) q.firstKey = now();
  let correct, chosen = null, typed = null, check = null;
  if (q.mode === 'type' && !q.hint) {
    typed = choice;
    check = checkTyped(choice, q.code);
    if (check.empty) return;
    correct = check.ok; chosen = check.other || null;
  } else if (choice === null) {
    correct = false;
  } else {
    chosen = choice; correct = choice === q.code;
  }
  const g = rate(q, correct);
  S.p = { id: q.id, code: q.code, dir: q.dir, g, correct, chosen, typed, check, mode: q.mode, hint: q.hint, shownAt: q.shownAt, isNew: q.isNew };
  if (!correct) { try { navigator.vibrate && navigator.vibrate(30); } catch (e) {} }
  renderSession();
}

function commit(gOverride, countAsCorrect) {
  const p = S.p;
  if (!p) return;
  const g = gOverride || p.g;
  const t = now();
  const prev = getCard(p.id);
  const wasNew = !prev.st;
  const { card, requeue } = scheduleCard(prev, g, t, S_().retention);
  card.s = +card.s.toFixed(4); card.d = +card.d.toFixed(4);
  state.cards[p.id] = card;
  Store.touch('card', p.id);
  const dk = String(dayIndex(t));
  const day = Object.assign({ n: 0, k: 0, nw: 0, t: 0 }, state.days[dk]);
  day.n++; if (g > 1) day.k++; if (wasNew && p.dir === 'f') { day.nw++; S.introduced++; }
  day.t += Math.min(t - p.shownAt, 60000);
  if (day.n >= S_().goal) day.g = 1;
  state.days[dk] = day;
  Store.touch('day', dk);
  if (g === 1 && p.chosen && p.chosen !== p.code) { const ck = p.code + '~' + p.chosen; state.conf[ck] = (state.conf[ck] || 0) + 1; Store.touch('conf', ck); }
  S.answered++;
  S.results.push(g > 1 ? 1 : 0);
  if (g === 1 && !S.missed.includes(p.code)) S.missed.push(p.code);
  if (requeue != null) S.queue.splice(Math.min(requeue, S.queue.length), 0, p.id);
  nextQuestion();
}

function finishSession() {
  S.done = true;
  S.endedAt = now();
  if (S.kind === 'daily') {
    const p = plan();
    if (!p.learning.length && !p.due.length && !p.newF.length && !p.newR.length) {
      const dk = String(today());
      const day = Object.assign({ n: 0, k: 0, nw: 0, t: 0 }, state.days[dk]);
      if (!day.g && day.n > 0) { day.g = 1; state.days[dk] = day; Store.touch('day', dk); }
    }
  }
  Store.schedule(300);
  askPersist();
  setView('summary');
}
function startSession(sess) {
  if (!sess.queue.length) { toast('Rien à travailler ici pour le moment.'); return; }
  S = sess;
  setView('session');
  nextQuestion();
}
function quitSession() {
  if (S && S.answered > 0) { S.done = true; S.endedAt = now(); Store.schedule(300); setView('summary'); }
  else { S = null; setView('home'); }
}

// ─────────── défi : jeu chronométré à niveaux ───────────
// Indépendant de la répétition espacée : le défi ne lit ni n'écrit `state`.
// Ses réglages et records ont leur propre clé de stockage.
const DEFI_KEY = 'drapeaux-en-tete:defi';
const DEFI_LEVELS = [
  { id: 1, name: 'Découverte', maxF: 1, terr: false, opts: 4, time: 15, mult: 1, traps: 'none', d: 'Les drapeaux les plus connus, 4 choix.' },
  { id: 2, name: 'Voyageur', maxF: 2, terr: false, opts: 4, time: 12, mult: 1.5, traps: 'zone', d: 'Des pièges de la même région, 4 choix.' },
  { id: 3, name: 'Explorateur', maxF: 4, terr: false, opts: 6, time: 10, mult: 2, traps: 'look', d: 'Tous les pays, 6 choix parmi les sosies.' },
  { id: 4, name: 'Vexillologue', maxF: 4, terr: true, opts: 6, time: 15, mult: 3, traps: 'look', type: true, d: 'Pays et territoires : tu écris le nom.', dR: 'Pays et territoires, 6 sosies, moins de temps.' },
];
const DEFI_LENGTHS = [10, 20, 50];
function readDefi() {
  const base = { dir: 'f', lvl: 1, zone: 'all', len: 10, best: {} };
  try { const raw = JSON.parse(localStorage.getItem(DEFI_KEY)); if (raw && typeof raw === 'object') return Object.assign(base, raw, { best: Object.assign({}, raw.best) }); } catch (e) {}
  return base;
}
const defi = readDefi();
function writeDefi() { try { localStorage.setItem(DEFI_KEY, JSON.stringify(defi)); } catch (e) { /* stockage indisponible */ } }
let D = null;          // partie en cours
let defiRAF = 0, defiAuto = 0;

const defiLevel = () => DEFI_LEVELS[clamp(defi.lvl, 1, 4) - 1];
const defiTyping = lv => !!lv.type && D && D.dir === 'f';
const defiBestKey = (dir, id) => dir + '-' + id;
function defiPool(lv, zone = 'all') {
  return FLAGS.filter(f => f.f <= lv.maxF && (lv.terr || f.t !== 'terr') && (zone === 'all' || f.ct === zone)).map(f => f.c);
}
// Pièges : sosies (groupes puis voisins visuels) aux niveaux 3 et 4, même région au niveau 2, hasard au niveau 1.
function defiOptions(code, lv) {
  const base = new Set(defiPool(lv));
  const sameZone = shuffle(FLAGS.filter(f => f.ct === BY[code].ct).map(f => f.c));
  let order = [];
  if (lv.traps === 'look') {
    const groups = shuffle([...new Set((GROUPS_OF[code] || []).flatMap(g => GROUPS[g].m))]);
    order = [...groups, ...(BY[code].nb || []), ...sameZone];
  } else if (lv.traps === 'zone') order = sameZone;
  order.push(...shuffle([...base]));
  const out = [];
  for (const c of order) { if (c !== code && base.has(c) && !out.includes(c)) out.push(c); if (out.length === lv.opts - 1) break; }
  return shuffle([code, ...out]);
}
function defiHintText(code, step) {
  const f = BY[code], n = f.n;
  const reveal = step === 1 ? 1 : Math.ceil(n.length / 3);
  let seen = 0;
  const pattern = [...n].map(ch => /[\s\-’']/.test(ch) ? ch : (seen++ < reveal ? ch : '_')).join('');
  return ZONES[f.ct] + ' · ' + pattern;
}

function startDefi() {
  const lv = defiLevel();
  const pool = defiPool(lv, defi.zone);
  if (!pool.length) { toast('Aucun drapeau pour ce choix. Change de région ou de niveau.'); return; }
  closeSheet();
  D = { lv, dir: defi.dir, zone: defi.zone, qs: shuffle(pool).slice(0, Math.min(defi.len, pool.length)), i: 0, score: 0, streak: 0, bestStreak: 0, ok: 0, res: [], missed: [], q: null, p: null };
  defiNext();
}
function defiNext() {
  const code = D.qs[D.i];
  D.q = { code, options: defiTyping(D.lv) ? null : defiOptions(code, D.lv), hint: 0, shownAt: now() };
  D.p = null;
  D.timeTotal = D.lv.time * 1000 * (D.lv.type && D.dir === 'r' ? 0.6 : 1);
  setView('defi-play');
  defiTimer();
}
function defiTimer() {
  cancelAnimationFrame(defiRAF);
  const tick = () => {
    const bar = $('#defi-timer');
    if (!D || D.p || view !== 'defi-play' || !bar) return;
    const left = Math.max(0, 1 - (now() - D.q.shownAt) / D.timeTotal);
    bar.style.transform = `scaleX(${left})`;
    if (left > 0) defiRAF = requestAnimationFrame(tick);
  };
  defiRAF = requestAnimationFrame(tick);
}
function defiAnswer(chosen, typed = null) {
  if (!D || !D.q || D.p) return;
  cancelAnimationFrame(defiRAF);
  const code = D.q.code;
  let ok, check = null;
  if (typed !== null) {
    check = checkTyped(typed, code);
    if (check.empty) return;
    ok = check.ok;
    chosen = ok ? code : (check.other || null);
  } else ok = chosen === code;
  let gained = 0;
  if (ok) {
    D.ok++; D.streak++; D.bestStreak = Math.max(D.bestStreak, D.streak);
    const speed = Math.max(0, 1 - (now() - D.q.shownAt) / D.timeTotal);
    gained = Math.round((100 + 50 * speed) * D.lv.mult * Math.min(2, 1 + (D.streak - 1) * 0.1) * (D.q.hint ? 0.5 : 1));
    D.score += gained;
  } else { D.streak = 0; D.missed.push(code); }
  D.res.push(ok ? 1 : 0);
  D.p = { ok, chosen, typed, check, gained };
  render();
  const b = $('#defi-continue'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
  clearTimeout(defiAuto);
  if (ok) defiAuto = setTimeout(defiContinue, 1200);
}
function defiContinue() {
  clearTimeout(defiAuto);
  if (!D || !D.p) return;
  D.i++;
  if (D.i < D.qs.length) defiNext(); else defiEnd();
}
function defiEnd() {
  const k = defiBestKey(D.dir, D.lv.id);
  const prev = defi.best[k] || 0;
  D.record = D.score > prev && D.score > 0;
  D.prevBest = prev;
  if (D.record) { defi.best[k] = D.score; writeDefi(); }
  D.done = true;
  setView('defi-end');
}
function defiQuit() { cancelAnimationFrame(defiRAF); clearTimeout(defiAuto); D = null; setView('defi'); }

// ── écrans du défi ──
function defiSetupHTML() {
  const dir = defi.dir;
  const levels = DEFI_LEVELS.map(lv => {
    const n = defiPool(lv, defi.zone).length;
    const best = defi.best[defiBestKey(dir, lv.id)];
    return `<button class="lvl" data-defi-lvl="${lv.id}" aria-pressed="${defi.lvl === lv.id}">
      <span class="lvl-head"><strong>${lv.name}</strong><span class="pips" aria-label="Difficulté ${lv.id} sur 4">${[1, 2, 3, 4].map(i => `<i class="${i <= lv.id ? 'on' : ''}"></i>`).join('')}</span></span>
      <span class="lvl-d">${esc(dir === 'r' && lv.dR ? lv.dR : lv.d)}</span>
      <span class="lvl-meta"><span>${n} drapeau${n > 1 ? 'x' : ''}</span><span>${best ? 'Record ' + best : ''}</span></span>
    </button>`;
  }).join('');
  const zones = [['all', 'Toutes'], ...ZONE_KEYS.map(z => [z, ZONES[z]])];
  const n = Math.min(defi.len, defiPool(defiLevel(), defi.zone).length);
  return `<div class="stack defi-setup">
    <div class="row" style="margin-top:6px"><button class="icon-btn" data-action="home" aria-label="Retour à l’accueil">${I.back}</button>
      <div style="flex:1;min-width:0"><div class="eyebrow">Défi chrono</div><h1 class="h1">Choisis ton niveau</h1></div></div>
    <div class="set-row"><div class="lbl"><strong>Question</strong><span>${dir === 'f' ? 'Un drapeau s’affiche, trouve le pays.' : 'Un pays s’affiche, trouve son drapeau.'}</span></div>
      <div class="seg" role="group" aria-label="Sens">${[['f', 'Drapeau'], ['r', 'Nom']].map(([v, l]) => `<button data-defi-dir="${v}" aria-pressed="${dir === v}">${l}</button>`).join('')}</div></div>
    <div class="defi-levels" role="group" aria-label="Niveau">${levels}</div>
    <div class="stack" style="gap:8px"><span class="eyebrow">Région</span>
      <div class="filters" role="group" aria-label="Région">${zones.map(([z, l]) => `<button class="filter" data-defi-zone="${z}" aria-pressed="${defi.zone === z}">${esc(l)}</button>`).join('')}</div></div>
    <div class="set-row"><div class="lbl"><strong>Nombre de questions</strong><span>Plus tu réponds vite, plus tu marques.</span></div>
      <div class="seg" role="group" aria-label="Nombre de questions">${DEFI_LENGTHS.map(v => `<button data-defi-len="${v}" aria-pressed="${defi.len === v}">${v}</button>`).join('')}</div></div>
    <button class="btn primary big block" data-action="defi-start" ${n ? '' : 'disabled'}>${n ? `Lancer le défi · ${n} question${n > 1 ? 's' : ''}` : 'Aucun drapeau pour ce choix'} ${n ? I.arrow : ''}</button>
    <p class="small muted">Le défi ne touche pas à tes révisions : jouer ici ne change pas ton planning.</p>
  </div>`;
}
function defiPlayHTML() {
  const q = D.q, p = D.p, f = BY[q.code], lv = D.lv;
  const total = D.qs.length;
  const states = total <= 24
    ? Array.from({ length: total }, (_, i) => (i < D.res.length ? (D.res[i] ? 'ok' : 'ko') : 'empty'))
    : Array.from({ length: 24 }, (_, i) => (i < Math.round(D.res.length / total * 24) ? 'fill' : 'empty'));
  const typing = defiTyping(lv);
  const stage = D.dir === 'f'
    ? `<div class="stage">${flagImg(q.code, '', p ? 'Drapeau : ' + f.n : 'Drapeau à identifier')}</div>`
    : `<div class="name-stage atlas">${esc(f.n)}</div>`;
  let answers = '';
  if (typing) {
    const cls = p ? (p.ok ? 'ok' : 'ko') : '';
    answers = `<form class="stack" id="defi-form" autocomplete="off">
      <div class="hint-line" aria-live="polite">${q.hint ? esc(defiHintText(q.code, q.hint)) : ''}</div>
      <div class="type-row">
        <input id="defi-input" class="${cls}" type="text" inputmode="text" enterkeyhint="done" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Nom du pays ou du territoire" aria-label="Ta réponse" value="${p ? esc(p.typed || '') : ''}" ${p ? 'readonly' : ''}>
        <button class="btn primary" type="submit" ${p ? 'disabled' : ''}>OK</button>
      </div>
      <div class="type-tools">
        <button class="btn ghost" type="button" data-action="defi-hint" ${p || q.hint >= 2 ? 'disabled' : ''}>Indice (points ÷ 2)</button>
        <button class="btn ghost" type="button" data-action="defi-dunno" ${p ? 'disabled' : ''}>Je ne sais pas</button>
      </div>
    </form>`;
  } else if (D.dir === 'f') {
    answers = `<div class="answers ${q.options.length > 4 ? 'two-col' : ''}" role="group" aria-label="Choix de réponse">` + q.options.map((c, i) => {
      const cls = p ? (c === q.code ? 'is-correct' : c === p.chosen ? 'is-wrong' : 'is-dim') : '';
      return `<button class="opt ${cls}" data-defi-answer="${c}" ${p ? 'disabled' : ''}><span class="key">${i + 1}</span><span>${esc(BY[c].n)}</span></button>`;
    }).join('') + '</div>';
  } else {
    answers = `<div class="flag-grid ${q.options.length > 4 ? 'six' : ''}" role="group" aria-label="Choix de drapeaux">` + q.options.map((c, i) => {
      const cls = p ? (c === q.code ? 'is-correct' : c === p.chosen ? 'is-wrong' : 'is-dim') : '';
      return `<button class="flag-opt ${cls}" data-defi-answer="${c}" ${p ? 'disabled' : ''} aria-label="${p ? esc(BY[c].n) : 'Drapeau ' + (i + 1)}">${flagImg(c, '', '')}${p ? `<span class="cap">${esc(BY[c].n)}</span>` : ''}</button>`;
    }).join('') + '</div>';
  }
  let fb = '';
  if (p) {
    const other = p.chosen && p.chosen !== q.code ? BY[p.chosen] : null;
    const head = p.ok ? `Bravo, +${p.gained}` : other ? `Non, ça, c’est ${other.n}` : p.typed ? 'Ce n’est pas ça' : 'À retenir';
    const gi = other ? (GROUPS_OF[q.code] || []).find(g => GROUPS[g].m.includes(other.c)) : undefined;
    fb = `<section class="dfb ${p.ok ? 'ok' : 'ko'}" aria-live="polite">
      <div class="dfb-main">${flagImg(q.code, '', '')}
        <div class="dfb-text"><strong>${esc(head)}</strong><span><b>${esc(f.n)}</b> · ${esc(f.cap)}</span></div>
        <button class="btn primary" id="defi-continue" data-action="defi-continue">${D.i + 1 < total ? 'Suivant' : 'Résultats'}</button>
      </div>
      ${gi !== undefined ? `<div class="tip">${I.bulb}<div>${esc(GROUPS[gi].tip)}</div></div>` : ''}
    </section>`;
  }
  return `<div class="sess defi ${typing ? 'typing' : ''}">
    <div class="sess-top">
      <button class="icon-btn" data-action="defi-quit" aria-label="Quitter le défi">${I.close}</button>
      ${pennantsSVG(states, `Question ${Math.min(D.i + 1, total)} sur ${total}`)}
      <span class="sess-count">${Math.min(D.i + 1, total)}/${total}</span>
    </div>
    <div class="hud">
      <span class="hud-lvl">${esc(lv.name)}</span>
      <span class="hud-streak">${D.streak >= 2 ? `Série ×${D.streak}` : ''}</span>
      <span class="hud-score"><b>${D.score}</b> pts</span>
    </div>
    <div class="timer" aria-hidden="true"><i id="defi-timer" style="transform:scaleX(${p ? 0 : 1})"></i></div>
    <div class="q-card">
      <div class="q-head"><span class="eyebrow">${D.dir === 'f' ? 'À qui est ce drapeau ?' : 'Trouve son drapeau'}</span></div>
      ${stage}
    </div>
    ${answers}
    ${fb}
    <div class="sess-spacer"></div>
  </div>`;
}
function defiEndHTML() {
  const total = D.qs.length, acc = Math.round(D.ok / total * 100);
  const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
  const title = acc === 100 ? 'Sans faute !' : ['Continue, ça va venir', 'Pas mal du tout', 'Très bien joué', 'Excellent'][stars];
  const STAR = '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/>';
  const missed = [...new Set(D.missed)];
  return `<div class="stack" style="padding-top:18px;gap:16px">
    <div class="eyebrow">Défi ${esc(D.lv.name)}${D.zone !== 'all' ? ' · ' + esc(ZONES[D.zone]) : ''}</div>
    <div class="stars" role="img" aria-label="${stars} étoile${stars > 1 ? 's' : ''} sur 3">${[0, 1, 2].map(i => `<svg viewBox="0 0 24 24" class="${i < stars ? 'on' : ''}" style="animation-delay:${i * 0.15}s">${STAR}</svg>`).join('')}</div>
    <h1 class="h1">${esc(title)}</h1>
    ${D.record ? `<p class="record">${D.prevBest ? `Nouveau record ! L’ancien était de ${D.prevBest} points.` : 'Premier record sur ce niveau.'}</p>` : ''}
    <div class="sum-grid">
      <div class="stat"><span class="v">${D.score}</span><span class="l">points</span></div>
      <div class="stat"><span class="v">${acc}${NB}%</span><span class="l">bonnes réponses (${D.ok}/${total})</span></div>
      <div class="stat"><span class="v">${D.bestStreak}</span><span class="l">meilleure série</span></div>
      <div class="stat"><span class="v">${defi.best[defiBestKey(D.dir, D.lv.id)] || 0}</span><span class="l">record du niveau</span></div>
    </div>
    ${missed.length ? `<div><div class="section-title" style="margin-top:4px"><h2 class="h2">À revoir</h2><span class="small muted">Touche un drapeau pour sa fiche</span></div><div class="missed">${missed.map(c => `<button data-detail="${c}">${flagImg(c, '', '', false)}<span>${esc(BY[c].n)}</span></button>`).join('')}</div></div>` : ''}
    <div class="stack">
      <button class="btn primary big block" data-action="defi-start">Rejouer ${I.arrow}</button>
      <div class="tiles"><button class="btn secondary" data-action="defi">Changer de niveau</button><button class="btn secondary" data-action="home">Accueil</button></div>
    </div>
  </div>`;
}
function defiHomeHTML() {
  const best = Math.max(0, ...Object.values(defi.best));
  return `<div class="section-title"><h2 class="h2">Jouer</h2></div>
  <button class="defi-cta" data-action="defi">
    <span class="mini-flags">${['BR', 'JP', 'CA', 'KE'].map(c => `<img src="${flagUrl(c)}" alt="">`).join('')}</span>
    <strong>Défi chrono</strong>
    <span>4 niveaux, de Découverte à Vexillologue. Score, séries et records.${best ? ` Ton meilleur score : ${best}.` : ''}</span>
  </button>`;
}

// ─────────── icônes ───────────
const I = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V4m0 1.5c4-2.6 8 2.6 12 0 1.5-1 2.5-1.2 4-1v9c-1.5-.2-2.5 0-4 1-4 2.6-8-2.6-12 0"/></svg>',
  grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7.5" height="5.5" rx="1"/><rect x="13.5" y="4" width="7.5" height="5.5" rx="1"/><rect x="3" y="14.5" width="7.5" height="5.5" rx="1"/><rect x="13.5" y="14.5" width="7.5" height="5.5" rx="1"/></svg>',
  chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 20h16M7 16v-4m5 4V7m5 9v-6"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  cross: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  pennant: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4l13 5-13 5z" fill="var(--signal)"/></svg>',
  bulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
  arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m5-5-5 5 5 5"/></svg>',
  logo: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5v19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4h13l-3.2 4.5L19 13H6z" fill="var(--signal)"/><path d="M6 4h6.5v9H6z" fill="var(--seq-2)"/></svg>',
};

// ─────────── composants ───────────
function flagImg(code, cls = '', alt = null, lazy = false) {
  const f = BY[code];
  const h = 300, w = Math.round(300 * f.r);
  const a = alt === null ? 'Drapeau : ' + f.n : alt;
  return `<img class="flag ${cls}" src="${flagUrl(code)}" width="${w}" height="${h}" alt="${esc(a)}" ${lazy ? 'loading="lazy" decoding="async"' : ''} style="aspect-ratio:${f.r}">`;
}
function statusChip(f) {
  if (f.t === 'terr') return `<span class="chip terr">Territoire, pas un pays</span>`;
  if (f.t === 'lim') return `<span class="chip lim">Reconnaissance limitée</span>`;
  return '';
}
// guirlande de fanions : states = tableau de 'ok' | 'ko' | 'fill' | 'empty'
function pennantsSVG(states, label) {
  const K = states.length;
  const W = 320, H = 46;
  const P0 = [6, 6], P1 = [W / 2, 20], P2 = [W - 6, 6];
  const pt = t => [(1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
  const tan = t => [2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
  const w = Math.min(20, (W - 20) / Math.max(K, 1) * 0.78), h = w * 1.3;
  let tri = '';
  states.forEach((s, i) => {
    const t = (i + 0.5) / K, [x, y] = pt(t), [dx, dy] = tan(t), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const fill = s === 'ok' || s === 'fill' ? 'var(--signal)' : s === 'ko' ? 'var(--bad)' : 'var(--card)';
    const stroke = s === 'empty' ? 'var(--ink-3)' : 'none';
    tri += `<path d="M${-w / 2} 0H${w / 2}L0 ${h}Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round" opacity="${s === 'empty' ? 0.7 : 1}"/>`;
  });
  return `<svg class="pennants" viewBox="0 -2 ${W} ${H}" role="img" aria-label="${esc(label)}"><path d="M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}" fill="none" stroke="var(--ink-3)" stroke-width="1.3"/>${tri}</svg>`;
}
function goalPennants() {
  const goal = S_().goal, n = dayStats(today()).n;
  const K = Math.min(goal, 25);
  const filled = Math.min(K, Math.round(n / goal * K));
  return pennantsSVG(Array.from({ length: K }, (_, i) => (i < filled ? 'fill' : 'empty')), `Objectif du jour : ${Math.min(n, goal)} cartes sur ${goal}`);
}
function sessionPennants() {
  const total = S.answered + S.queue.length + (S.q && !S.p ? 1 : 0) + (S.p ? 1 : 0);
  const done = S.answered + (S.p ? 1 : 0);
  const results = S.results.slice();
  if (S.p) results.push(S.p.correct ? 1 : 0);
  let states;
  if (total <= 24) states = Array.from({ length: total }, (_, i) => (i < results.length ? (results[i] ? 'ok' : 'ko') : 'empty'));
  else { const K = 24, f = Math.round(done / total * K); states = Array.from({ length: K }, (_, i) => (i < f ? 'fill' : 'empty')); }
  return { svg: pennantsSVG(states, `Progression : ${done} sur ${total}`), done, total };
}

// ─────────── rendu ───────────
const root = $('#view');
function setView(v, opts = {}) {
  view = v;
  $('#app').classList.toggle('in-session', v === 'session' || v === 'summary' || v === 'defi-play' || v === 'defi-end');
  document.querySelectorAll('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === v ? 'page' : 'false'));
  render();
  if (!opts.keepScroll) root.scrollTop = 0;
}
function render() {
  renderTop();
  if (view === 'home') root.innerHTML = homeHTML();
  else if (view === 'collection') renderCollection();
  else if (view === 'stats') root.innerHTML = statsHTML(), bindCharts();
  else if (view === 'settings') root.innerHTML = settingsHTML();
  else if (view === 'science') root.innerHTML = scienceHTML();
  else if (view === 'summary') root.innerHTML = summaryHTML();
  else if (view === 'session') renderSession();
  else if (view === 'defi') root.innerHTML = defiSetupHTML();
  else if ((view === 'defi-play' || view === 'defi-end') && !D) { view = 'defi'; root.innerHTML = defiSetupHTML(); }
  else if (view === 'defi-play') renderDefiPlay();
  else if (view === 'defi-end') root.innerHTML = defiEndHTML();
}
function renderDefiPlay() {
  root.innerHTML = defiPlayHTML();
  if (defiTyping(D.lv) && !D.p) { const inp = $('#defi-input'); try { inp.focus({ preventScroll: true }); } catch (e) {} }
}
function renderTop() {
  const s = streakInfo();
  $('#streak').innerHTML = `${I.pennant}<span>${s.cur}</span><span class="sr-only" style="position:absolute;left:-9999px">jours de suite</span>`;
  $('#streak').classList.toggle('on', s.todayDone);
  $('#streak').setAttribute('aria-label', `Série : ${s.cur} jour${s.cur > 1 ? 's' : ''} de suite`);
}
function onDataChanged() {
  if (view === 'session') { renderTop(); return; }
  render();
}

// ── accueil ──
function homeHTML() {
  const p = plan();
  const t = p.t, ds = dayStats(t), st = S_();
  const nDue = p.learning.length + p.due.length, nNew = p.newF.length + p.newR.length;
  const P = pool();
  let title, sub, btn;
  if (nDue + nNew > 0) {
    const parts = [];
    if (nDue) parts.push(`${nDue} à revoir`);
    if (p.newF.length) parts.push(`${p.newF.length} nouveau${p.newF.length > 1 ? 'x' : ''}`);
    if (p.newR.length) parts.push(`${p.newR.length} en sens inverse`);
    title = parts.join(', ');
    sub = `Environ ${estimateMinutes(p)} min.`;
    btn = `<button class="btn primary big block" data-action="start-daily">${ds.n ? 'Continuer la séance' : 'Commencer la séance'} ${I.arrow}</button>`;
  } else if (!p.leftNew && P.length) {
    title = 'Tout est à jour'; sub = 'Tu as déjà vu tous les drapeaux de ta sélection. Reviens demain pour les révisions prévues.';
    btn = '';
  } else {
    title = 'Tout est à jour'; sub = 'Les révisions du jour sont faites et le quota de nouveaux drapeaux est atteint. Mieux vaut s’arrêter là : la nuit consolide.';
    btn = '';
  }
  const groups = duelGroups();
  const weakCount = Object.values(state.cards).filter(c => c.st).length;
  const s = streakInfo();
  const lv = [0, 0, 0, 0];
  for (const c of P) lv[level(getCard(cardId(c, 'f')))]++;
  const learned = lv[1] + lv[2] + lv[3];
  // 7 derniers jours
  let week = '';
  for (let d = t - 6; d <= t; d++) {
    const x = state.days[d];
    const cls = x && x.g ? 'done' : x && x.n ? 'part' : '';
    week += `<div>${DAY_NAMES[dayDate(d).getUTCDay()].slice(0, 1).toUpperCase()}<i class="${cls} ${d === t ? 'today' : ''}" title="${fmtDay(d)} : ${x ? x.n : 0} cartes"></i></div>`;
  }
  const duelFlags = groups.length ? GROUPS[groups[0].gi].m.slice(0, 3) : ['TD', 'RO'];
  return `${installHTML()}
  <section class="today" aria-labelledby="t-today">
    <div class="eyebrow">${esc(fmtNow())}</div>
    <h1 class="h1" id="t-today">${esc(title)}</h1>
    <p class="muted">${esc(sub)}</p>
    <div>${goalPennants()}
      <div class="goal-line"><span>Objectif du jour : ${Math.min(ds.n, st.goal)} / ${st.goal} cartes</span><span>${ds.n >= st.goal ? 'Atteint' : ''}</span></div>
    </div>
    ${btn}
  </section>
  ${defiHomeHTML()}
  <div class="section-title"><h2 class="h2">Entraînement libre</h2></div>
  <div class="tiles">
    <button class="tile" data-action="start-duel" ${groups.length ? '' : 'disabled'}>
      <div class="mini-flags">${duelFlags.map(c => `<img src="${flagUrl(c)}" alt="">`).join('')}</div>
      <strong>Duel des sosies</strong>
      <span>${groups.length ? `${groups.length} groupe${groups.length > 1 ? 's' : ''} de drapeaux qui se ressemblent` : 'Se débloque quand tu connais deux sosies'}</span>
    </button>
    <button class="tile" data-action="start-weak" ${weakCount >= 4 ? '' : 'disabled'}>
      <strong>Points faibles</strong>
      <span>${weakCount >= 4 ? 'Les 15 drapeaux que tu risques le plus d’oublier' : 'Disponible après quelques drapeaux'}</span>
    </button>
    <button class="tile" data-action="start-extra" ${p.leftNew && !nNew ? '' : 'disabled'}>
      <strong>5 nouveaux de plus</strong>
      <span>${p.leftNew ? (nNew ? 'Termine d’abord la séance du jour' : 'Au-delà du quota quotidien') : 'Tous les drapeaux sont déjà vus'}</span>
    </button>
    <button class="tile" data-tab-go="collection">
      <strong>Parcourir</strong>
      <span>Les ${P.length} drapeaux, leurs sosies et leur histoire</span>
    </button>
  </div>
  <div class="section-title"><h2 class="h2">Ta progression</h2><span class="small muted">${learned} / ${P.length} vus</span></div>
  <div class="panel stack">
    <div class="meter" role="img" aria-label="${lv[3]} maîtrisés, ${lv[2]} familiers, ${lv[1]} en cours, ${lv[0]} nouveaux">
      ${[3, 2, 1, 0].map(i => lv[i] ? `<i class="lv${i}" style="flex:${lv[i]}"></i>` : '').join('')}
    </div>
    <div class="legend">${[3, 2, 1, 0].map(i => `<span><b class="lv${i}"></b>${LEVEL_LABEL[i]} ${lv[i]}</span>`).join('')}</div>
    <div class="week" aria-label="Les 7 derniers jours">${week}</div>
    <p class="small muted">Série : <strong style="color:var(--ink)">${s.cur} jour${s.cur > 1 ? 's' : ''}</strong>${s.best > s.cur ? ` · record ${s.best}` : ''}. ${s.todayDone ? 'Objectif du jour atteint.' : 'Atteins l’objectif du jour pour la prolonger.'}</p>
  </div>
  <div class="science-link">${I.bulb}<p class="small muted">Répétition espacée, rappel actif, contraste entre sosies : <button class="link" data-action="science">pourquoi cette méthode fonctionne</button>.</p></div>`;
}

// ── séance ──
function renderSession() {
  if (!S || !S.q) return;
  const q = S.q, f = BY[q.code], p = S.p;
  const pen = sessionPennants();
  const typing = q.mode === 'type' && !q.hint;
  let stage, prompt;
  if (q.dir === 'f') {
    stage = `<div class="stage">${flagImg(q.code, '', p ? 'Drapeau : ' + f.n : 'Drapeau à identifier')}</div>`;
    prompt = 'À qui est ce drapeau ?';
  } else {
    stage = `<div class="name-stage atlas">${esc(f.n)}</div>${f.t ? `<div class="chips" style="justify-content:center;margin-top:-8px">${statusChip(f)}</div>` : ''}`;
    prompt = 'Trouve son drapeau';
  }
  const tag = q.isNew ? '<span class="chip new">Nouveau</span>' : S.kind === 'duel' ? '<span class="chip">Duel</span>' : '';
  let answers = '';
  if (q.mode === 'mc' || (q.mode === 'type' && q.hint)) {
    const opts = q.options || [];
    answers = `<div class="answers" role="group" aria-label="Choix de réponse">` + opts.map((c, i) => {
      let cls = '';
      if (p) cls = c === q.code ? 'is-correct' : c === p.chosen ? 'is-wrong' : 'is-dim';
      return `<button class="opt ${cls}" data-answer="${c}" ${p ? 'disabled' : ''}><span class="key">${i + 1}</span><span>${esc(BY[c].n)}</span></button>`;
    }).join('') + `</div>`;
  } else if (q.mode === 'flags') {
    answers = `<div class="flag-grid ${q.options.length > 4 ? 'six' : ''}" role="group" aria-label="Choix de drapeaux">` + q.options.map((c, i) => {
      let cls = '';
      if (p) cls = c === q.code ? 'is-correct' : c === p.chosen ? 'is-wrong' : 'is-dim';
      return `<button class="flag-opt ${cls}" data-answer="${c}" ${p ? 'disabled' : ''} aria-label="${p ? esc(BY[c].n) : 'Drapeau ' + (i + 1)}">${flagImg(c, '', '')}${p ? `<span class="cap">${esc(BY[c].n)}</span>` : ''}</button>`;
    }).join('') + `</div>`;
  } else if (typing) {
    const cls = p ? (p.correct ? 'ok' : 'ko') : '';
    answers = `<form class="stack" id="type-form" autocomplete="off">
      <div class="type-row">
        <input id="type-input" class="${cls}" type="text" inputmode="text" enterkeyhint="done" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Nom du pays ou du territoire" aria-label="Ta réponse" value="${p ? esc(p.typed) : ''}" ${p ? 'readonly' : ''}>
        <button class="btn primary" type="submit" ${p ? 'disabled' : ''}>OK</button>
      </div>
      <div class="type-tools">
        <button class="btn ghost" type="button" data-action="hint" ${p ? 'disabled' : ''}>Voir 4 choix</button>
        <button class="btn ghost" type="button" data-action="dunno" ${p ? 'disabled' : ''}>Je ne sais pas</button>
      </div>
    </form>`;
  }
  if ((q.mode !== 'type' || q.hint) && !p) answers += `<div class="type-tools" style="justify-content:flex-end"><button class="btn ghost" data-action="dunno">Je ne sais pas</button></div>`;
  root.innerHTML = `
  <div class="sess ${typing ? 'typing' : ''}">
    <div class="sess-top">
      <button class="icon-btn" data-action="quit" aria-label="Quitter la séance">${I.close}</button>
      ${pen.svg}
      <span class="sess-count">${pen.done}/${pen.total}</span>
    </div>
    <div class="q-card">
      <div class="q-head"><span class="eyebrow">${prompt}</span>${tag}</div>
      ${stage}
    </div>
    ${answers}
    <div class="sess-spacer"></div>
    ${p ? '<div style="height:46vh" aria-hidden="true"></div>' : ''}
  </div>
  ${p ? feedbackHTML() : ''}`;
  if (!p) {
    // le chronomètre démarre quand les drapeaux sont affichés
    const pending = [...root.querySelectorAll('.q-card img, .flag-grid img')].filter(im => !im.complete);
    let left = pending.length;
    pending.forEach(im => {
      const done = () => { if (--left === 0 && !q.firstKey) q.shownAt = now(); };
      im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true });
    });
  }
  if (typing && !p) {
    const inp = $('#type-input');
    inp.addEventListener('input', () => { if (!q.firstKey && inp.value) q.firstKey = now(); }, { once: false });
    try { inp.focus({ preventScroll: true }); } catch (e) {}
  }
  if (p) { const b = $('#fb-continue'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
}

function previewWhen(p, g) {
  const res = scheduleCard(getCard(p.id), g, now(), S_().retention, () => 0.5);
  if (res.requeue != null) return 'À revoir dans quelques cartes';
  return 'Prochaine révision ' + inDays(res.card.due - today());
}
function feedbackHTML() {
  const p = S.p, f = BY[p.code];
  const ok = p.correct;
  let head;
  if (ok) head = p.check && !p.check.exact ? 'Juste, à une faute près' : p.g === 4 ? 'Excellent' : p.g === 2 ? 'Juste, mais hésitant' : 'Bien vu';
  else head = p.chosen ? 'Pas tout à fait' : p.typed ? 'Ce n’est pas ça' : 'À retenir';
  const when = previewWhen(p, p.g);
  let compare = '';
  if (!ok && p.chosen && BY[p.chosen]) {
    const c = BY[p.chosen];
    compare = `<div class="compare">
      <figure class="mine">${flagImg(c.c, '', 'Drapeau : ' + c.n)}<figcaption><small>${p.dir === 'f' ? 'Ta réponse' : 'Tu as choisi'}</small>${esc(c.n)}</figcaption></figure>
      <figure class="good">${flagImg(f.c, '', 'Drapeau : ' + f.n)}<figcaption><small>Bonne réponse</small>${esc(f.n)}</figcaption></figure>
    </div>`;
  }
  // astuce : groupe commun avec le choix, ou sosie déjà connu pour une carte nouvelle
  let tip = '';
  const gs = GROUPS_OF[p.code] || [];
  let gi = p.chosen && p.chosen !== p.code ? gs.find(g => GROUPS[g].m.includes(p.chosen)) : undefined;
  if (gi === undefined && (p.isNew || !ok || S.kind === 'duel')) gi = gs.find(g => GROUPS[g].m.some(c => c !== p.code && isIntro(c)));
  if (gi === undefined && S.kind === 'duel') gi = gs[0];
  if (gi !== undefined) tip = `<div class="tip">${I.bulb}<div>${esc(GROUPS[gi].tip)}</div></div>`;
  let typedNote = '';
  if (p.typed && p.check && p.check.near && p.check.other) typedNote = `<p class="small muted">Ta saisie « ${esc(p.typed)} » ressemble plutôt à ${esc(BY[p.check.other].n)}.</p>`;
  else if (p.typed && ok && !p.check.exact) typedNote = `<p class="small muted">Orthographe : ${esc(f.n)}.</p>`;
  const secondary = ok && (p.mode !== 'type' || p.hint)
    ? `<button class="btn secondary" data-action="guessed">J’ai deviné</button>`
    : (!ok && p.typed ? `<button class="btn secondary" data-action="was-right">J’avais bon</button>` : '');
  return `
  <div class="fb-wrap"><section class="fb ${ok ? 'ok' : 'ko'}" role="dialog" aria-live="polite" aria-label="Correction">
    <div class="fb-head"><span class="badge">${ok ? I.check : I.cross}</span><strong>${esc(head)}</strong><span class="when">${esc(when)}</span></div>
    <div class="fb-country">${p.dir === 'r' && !compare ? flagImg(f.c, '', 'Drapeau : ' + f.n) : ''}<div class="stack" style="gap:6px;min-width:0"><div class="fb-name atlas">${esc(f.n)}</div><div class="chips">${statusChip(f)}<span class="chip">${esc(ZONES[f.ct])}</span></div></div></div>
    ${f.s ? `<p class="small muted">${esc(f.s)}.</p>` : ''}
    ${typedNote}
    ${compare}
    ${tip}
    <dl class="fb-facts"><dt>Capitale</dt><dd>${esc(f.cap)}</dd></dl>
    <p class="fb-info">${esc(f.i)}</p>
    <div class="fb-actions">${secondary}<button class="btn primary" id="fb-continue" data-action="continue">Continuer ${I.arrow}</button></div>
  </section></div>`;
}

// ── bilan ──
function summaryHTML() {
  if (!S) return '';
  const n = S.answered, ok = S.results.reduce((a, b) => a + b, 0);
  const mins = Math.max(1, Math.round(((S.endedAt || now()) - S.startedAt) / 60000));
  const p = plan();
  const t = today();
  let tomorrow = 0;
  for (const [id, c] of Object.entries(state.cards)) if (c.st === ST.REVIEW && c.due === t + 1) tomorrow++;
  const s = streakInfo();
  const res = S.results.length <= 24 ? S.results.map(r => (r ? 'ok' : 'ko')) : Array.from({ length: 24 }, () => 'fill');
  const left = p.learning.length + p.due.length + p.newF.length + p.newR.length;
  const titles = { daily: 'Séance terminée', duel: 'Duel terminé', weak: 'Révision terminée', extra: 'Nouveaux drapeaux vus' };
  const missed = S.missed.slice(0, 12);
  return `<div class="stack" style="padding-top:18px;gap:16px">
    <div class="eyebrow">${S.queue.length ? 'Séance interrompue' : 'Bilan'}</div>
    <h1 class="h1">${esc(S.queue.length ? 'Pause' : titles[S.kind] || 'Terminé')}</h1>
    ${pennantsSVG(res.length ? res : ['empty'], `${ok} bonnes réponses sur ${n}`)}
    <div class="sum-grid">
      <div class="stat"><span class="v">${n}</span><span class="l">cartes</span></div>
      <div class="stat"><span class="v">${n ? Math.round(ok / n * 100) : 0}${NB}%</span><span class="l">réussite</span></div>
      <div class="stat"><span class="v">${S.introduced}</span><span class="l">nouveaux drapeaux</span></div>
      <div class="stat"><span class="v">${mins}${NB}min</span><span class="l">durée</span></div>
    </div>
    <div class="panel stack">
      <p><strong>Série : ${s.cur} jour${s.cur > 1 ? 's' : ''}.</strong> ${s.todayDone ? 'Objectif du jour atteint.' : `Encore ${Math.max(0, S_().goal - dayStats(t).n)} cartes pour l’objectif du jour.`}</p>
      <p class="small muted">${left ? `Il reste ${left} carte${left > 1 ? 's' : ''} prévue${left > 1 ? 's' : ''} aujourd’hui.` : `Demain : ${tomorrow} révision${tomorrow > 1 ? 's' : ''} prévue${tomorrow > 1 ? 's' : ''}.`} La mémoire se consolide pendant le sommeil : une séance courte chaque jour vaut mieux qu’une longue de temps en temps.</p>
    </div>
    ${missed.length ? `<div><div class="section-title" style="margin-top:4px"><h2 class="h2">À retravailler</h2></div><div class="missed">${missed.map(c => `<button data-detail="${c}">${flagImg(c, '', '', false)}<span>${esc(BY[c].n)}</span></button>`).join('')}</div></div>` : ''}
    <div class="stack">
      ${left && S.kind === 'daily' ? `<button class="btn primary big block" data-action="start-daily">Continuer (${left})</button>` : ''}
      <button class="btn ${left && S.kind === 'daily' ? 'secondary' : 'primary'} big block" data-action="home">Retour à l’accueil</button>
    </div>
  </div>`;
}

// ── collection ──
const coll = { q: '', filter: 'all' };
function renderCollection() {
  const P = new Set(pool());
  const filters = [['all', 'Tous'], ['country', 'Pays'], ['terr', 'Territoires'], ['seen', 'Déjà vus'], ['weak', 'À revoir'], ['mastered', 'Maîtrisés'], ['new', 'Pas encore vus']];
  root.innerHTML = `
    <div class="stack" style="gap:0">
      <h1 class="h1" style="margin:6px 2px 12px">Collection</h1>
      <input id="coll-search" class="search" type="search" placeholder="Chercher un pays, une capitale…" value="${esc(coll.q)}" aria-label="Chercher">
      <div class="filters" role="group" aria-label="Filtres">${filters.map(([k, l]) => `<button class="filter" data-filter="${k}" aria-pressed="${coll.filter === k}">${l}</button>`).join('')}</div>
      <div id="coll-list"></div>
    </div>`;
  $('#coll-search').addEventListener('input', e => { coll.q = e.target.value; renderCollectionList(); });
  renderCollectionList();
}
function renderCollectionList() {
  const P = new Set(pool());
  const q = norm(coll.q);
  const t = now();
  const list = FLAGS.filter(f => {
    if (q && !(norm(f.n).includes(q) || (f.a || []).some(a => norm(a).includes(q)) || norm(f.cap).includes(q))) return false;
    const c = getCard(cardId(f.c, 'f')), lv = level(c);
    switch (coll.filter) {
      case 'country': return f.t !== 'terr';
      case 'terr': return f.t === 'terr';
      case 'seen': return lv > 0;
      case 'weak': return lv > 0 && (retrNow(c, t) < 0.85 || c.st !== ST.REVIEW);
      case 'mastered': return lv === 3;
      case 'new': return lv === 0;
      default: return true;
    }
  });
  let html = '';
  for (const z of ZONE_KEYS) {
    const items = list.filter(f => f.ct === z).sort((a, b) => a.n.localeCompare(b.n, 'fr'));
    if (!items.length) continue;
    const off = !S_().zones[z];
    html += `<div class="zone-head"><h2 class="h2">${esc(ZONES[z])}</h2><span class="small muted">${items.length}${off ? ' · hors sélection' : ''}</span></div><div class="grid">` +
      items.map(f => {
        const lv = level(getCard(cardId(f.c, 'f')));
        const outOfPool = !P.has(f.c);
        return `<button class="cell" data-detail="${f.c}" style="${outOfPool ? 'opacity:.55' : ''}" aria-label="${esc(f.n)}, ${LEVEL_LABEL[lv]}"><div class="fb-box">${flagImg(f.c, '', '', true)}</div><div class="nm">${esc(f.n)}</div><div class="lvl l${lv}"><i></i><i></i><i></i></div></button>`;
      }).join('') + '</div>';
  }
  $('#coll-list').innerHTML = html || `<p class="empty">Aucun drapeau ne correspond.</p>`;
}

// ── fiche détaillée ──
function openDetail(code) {
  const f = BY[code];
  if (!f) return;
  const t = now();
  const look = [...new Set([...(GROUPS_OF[code] || []).flatMap(g => GROUPS[g].m), ...(f.nb || []).slice(0, 5)])].filter(c => c !== code).slice(0, 8);
  const tips = (GROUPS_OF[code] || []).map(g => GROUPS[g].tip);
  const memBlock = DIRS.map(dir => {
    const c = getCard(cardId(code, dir));
    const label = dir === 'f' ? 'Drapeau → nom' : 'Nom → drapeau';
    if (!c.st) return `<div class="stat"><span class="l">${label}</span><span class="v">—</span><span class="l">${dir === 'r' && !S_().rev ? 'Sens inverse désactivé' : 'Pas encore étudié'}</span></div>`;
    const r = retrNow(c, t);
    const whenTxt = c.st === ST.REVIEW ? 'révision ' + inDays(c.due - today()) : 'en apprentissage';
    return `<div class="stat"><span class="l">${label}</span><span class="v">${pct(r)}</span><span class="l">de chances de t’en souvenir · stabilité ${durDays(c.s)} · ${whenTxt}</span></div>`;
  }).join('');
  const ratio = ratioText(f.r);
  openSheet(`
    <div class="sheet-top"><button class="icon-btn" data-action="close-sheet" aria-label="Fermer">${I.close}</button></div>
    <div class="stack" style="gap:14px">
      <div class="detail-flag">${flagImg(code)}</div>
      <div class="stack" style="gap:8px">
        <h2 class="atlas" style="font-size:24px">${esc(f.n)}</h2>
        <div class="chips">${statusChip(f)}<span class="chip">${esc(ZONES[f.ct])}</span></div>
        ${f.s ? `<p class="small muted">${esc(f.s)}.</p>` : ''}
      </div>
      <dl class="facts"><dt>Capitale</dt><dd>${esc(f.cap)}</dd><dt>Proportions</dt><dd>${ratio}</dd>${f.a && f.a.length ? `<dt>Aussi appelé</dt><dd>${esc(f.a.filter(a => !/^[A-Z]{2,4}$/.test(a)).slice(0, 3).join(', ') || f.a[0])}</dd>` : ''}</dl>
      <p>${esc(f.i)}</p>
      ${tips.map(tp => `<div class="tip">${I.bulb}<div>${esc(tp)}</div></div>`).join('')}
      <div><div class="eyebrow" style="margin:4px 2px 8px">Sosies</div><div class="lookalikes">${look.map(c => `<button data-detail="${c}">${flagImg(c, '', '', true)}<span>${esc(BY[c].n)}</span></button>`).join('')}</div></div>
      <div><div class="eyebrow" style="margin:4px 2px 8px">Ta mémoire</div><div class="mem">${memBlock}</div></div>
    </div>`);
}
function ratioText(r) {
  const known = [[1, '1:1 (carré)'], [2, '1:2'], [1.5, '2:3'], [5 / 3, '3:5'], [1.6, '5:8'], [1.9, '10:19'], [1.75, '4:7'], [4 / 3, '3:4'], [1.25, '4:5'], [7 / 6, '6:7'], [28 / 11, '11:28'], [1.4, '5:7'], [10 / 7, '7:10'], [11 / 6, '6:11'], [20 / 11, '11:20'], [1.375, '8:11'], [11 / 8, '8:11'], [37 / 28, '28:37'], [18 / 11, '11:18'], [25 / 18, '18:25'], [15 / 13, '13:15'], [22 / 15, '15:22'], [1.7, '10:17'], [8 / 5, '5:8'], [1.618, '1:φ (nombre d’or)'], [41 / 22, '22:41'], [26 / 17, '17:26'], [11 / 7, '7:11'], [25 / 16, '16:25'], [1.7733, '≈ 189:335']];
  if (r < 1) return 'plus haut que large, forme unique';
  let best = null, bd = Infinity;
  for (const [v, l] of known) { const d = Math.abs(v - r); if (d < bd) { bd = d; best = l; } }
  return bd < 0.01 ? best : '≈ 1:' + r.toFixed(2).replace('.', ',');
}
function openSheet(html) {
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  ov.addEventListener('click', e => { if (e.target === ov) closeSheet(); });
  document.body.appendChild(ov);
  sheet = ov;
  const b = ov.querySelector('[data-action="close-sheet"]'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
}
function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
function confirmSheet(title, text, okLabel, onOk) {
  openSheet(`<div class="confirm"><h2 class="h2">${esc(title)}</h2><p class="muted">${esc(text)}</p>
    <div class="fb-actions"><button class="btn secondary" data-action="close-sheet">Annuler</button><button class="btn primary" id="confirm-ok">${esc(okLabel)}</button></div></div>`);
  $('#confirm-ok').addEventListener('click', () => { closeSheet(); onOk(); });
}

// ── statistiques ──
function statsHTML() {
  const P = pool(), t = today(), T = now();
  const lv = [0, 0, 0, 0];
  for (const c of P) lv[level(getCard(cardId(c, 'f')))]++;
  const seen = lv[1] + lv[2] + lv[3];
  let rs = 0, rn = 0;
  for (const [id, c] of Object.entries(state.cards)) if (c.st) { rs += retrNow(c, T); rn++; }
  const s = streakInfo();
  let totalT = 0, totalN = 0, totalK = 0;
  for (const d of Object.values(state.days)) { totalT += d.t || 0; totalN += d.n || 0; totalK += d.k || 0; }
  if (!rn) {
    return `<h1 class="h1" style="margin:6px 2px 12px">Statistiques</h1>
      <div class="panel stack"><p class="h2">Pas encore de données</p><p class="muted">Fais ta première séance : tu verras ici ta rétention estimée, ta série, l’activité des derniers jours, les révisions à venir et les drapeaux que tu confonds le plus.</p>
      <button class="btn primary block" data-tab-go="home">Aller à l’accueil</button></div>`;
  }
  // confusions
  const pairs = {};
  for (const [k, v] of Object.entries(state.conf)) { const [a, b] = k.split('~'); if (!BY[a] || !BY[b]) continue; const key = [a, b].sort().join('~'); pairs[key] = (pairs[key] || 0) + v; }
  const topPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hard = P.map(c => [c, getCard(cardId(c, 'f'))]).filter(([, c]) => c.st && ((c.l || 0) > 0 || c.d > 6)).sort((a, b) => ((b[1].l || 0) - (a[1].l || 0)) || (b[1].d - a[1].d)).slice(0, 6);
  // par zone
  const zoneRows = ZONE_KEYS.filter(z => S_().zones[z]).map(z => {
    const cs = P.filter(c => BY[c].ct === z), l = [0, 0, 0, 0];
    cs.forEach(c => l[level(getCard(cardId(c, 'f')))]++);
    return { z, l, n: cs.length };
  }).filter(r => r.n);
  return `
  <h1 class="h1" style="margin:6px 2px 14px">Statistiques</h1>
  <section class="panel hero">
    <span class="eyebrow">Drapeaux vus</span>
    <span class="big">${seen} <small>sur ${P.length}</small></span>
    <div class="meter" role="img" aria-label="${lv[3]} maîtrisés, ${lv[2]} familiers, ${lv[1]} en cours, ${lv[0]} pas encore vus">${[3, 2, 1, 0].map(i => lv[i] ? `<i class="lv${i}" style="flex:${lv[i]}"></i>` : '').join('')}</div>
    <div class="legend">${[3, 2, 1, 0].map(i => `<span><b class="lv${i}"></b>${LEVEL_LABEL[i]} ${lv[i]}</span>`).join('')}</div>
    <p class="small muted">Maîtrisé : stabilité d’au moins 21 jours (le temps au bout duquel ta probabilité de t’en souvenir passe sous 90 %).</p>
  </section>
  <div class="sum-grid" style="margin-top:12px">
    <div class="stat"><span class="v">${pct(rs / rn)}</span><span class="l">rétention estimée aujourd’hui</span></div>
    <div class="stat"><span class="v">${totalN ? Math.round(totalK / totalN * 100) : 0}${NB}%</span><span class="l">bonnes réponses au total</span></div>
    <div class="stat"><span class="v">${s.cur}${NB}j</span><span class="l">série actuelle · record ${s.best}${NB}j</span></div>
    <div class="stat"><span class="v">${Math.round(totalT / 60000)}${NB}min</span><span class="l">${totalN} cartes au total</span></div>
  </div>
  ${heatmapCard(t)}
  ${barsCard('Cartes par jour', '30 derniers jours', Array.from({ length: 30 }, (_, i) => { const d = t - 29 + i, x = state.days[d]; return { d, v: x ? x.n : 0, k: x ? x.k : 0 }; }), 'hist')}
  ${barsCard('Révisions à venir', 'Aujourd’hui et les 7 prochains jours', forecast(t), 'fc')}
  <section class="chart-card" style="margin-top:12px"><h3>Par zone</h3><p class="sub">Niveau de maîtrise, drapeau → nom</p>
    <div class="zone-bars">${zoneRows.map(r => `<div><div class="zl"><span>${esc(ZONES[r.z])}</span><span>${r.l[1] + r.l[2] + r.l[3]} / ${r.n}</span></div><div class="meter" role="img" aria-label="${esc(ZONES[r.z])} : ${r.l[3]} maîtrisés, ${r.l[2]} familiers, ${r.l[1]} en cours, ${r.l[0]} nouveaux">${[3, 2, 1, 0].map(i => r.l[i] ? `<i class="lv${i}" style="flex:${r.l[i]}"></i>` : '').join('')}</div></div>`).join('')}</div>
    <div class="legend" style="margin-top:12px">${[3, 2, 1, 0].map(i => `<span><b class="lv${i}"></b>${LEVEL_LABEL[i]}</span>`).join('')}</div>
  </section>
  <section class="chart-card" style="margin-top:12px"><h3>Tes confusions fréquentes</h3><p class="sub">Les paires que tu mélanges le plus, à travailler en duel</p>
    ${topPairs.length ? `<div class="pairs">${topPairs.map(([k, v]) => { const [a, b] = k.split('~'); return `<div class="pair"><div class="flags">${flagImg(a, '', '')}${flagImg(b, '', '')}</div><div class="txt">${esc(BY[a].n)} / ${esc(BY[b].n)}<small>${v} confusion${v > 1 ? 's' : ''}</small></div><button class="btn secondary" data-duel="${a},${b}">Duel</button></div>`; }).join('')}</div>` : `<p class="small muted" style="margin-top:8px">Aucune confusion enregistrée pour l’instant.</p>`}
  </section>
  ${hard.length ? `<section class="chart-card" style="margin-top:12px"><h3>Les plus coriaces</h3><p class="sub">Oubliés le plus souvent ou jugés difficiles par l’algorithme</p><div class="missed" style="margin-top:10px">${hard.map(([c, cd]) => `<button data-detail="${c}">${flagImg(c, '', '')}<span>${esc(BY[c].n)}<br><small class="muted">${cd.l || 0} oubli${(cd.l || 0) > 1 ? 's' : ''}</small></span></button>`).join('')}</div></section>` : ''}`;
}
function forecast(t) {
  const out = [];
  for (let k = 0; k <= 7; k++) out.push({ d: t + k, v: 0, fc: true });
  const P = new Set(pool());
  for (const [id, c] of Object.entries(state.cards)) {
    const [code, dir] = splitId(id);
    if (!P.has(code) || (dir === 'r' && !S_().rev)) continue;
    if (c.st === ST.LEARN || c.st === ST.RELEARN) out[0].v++;
    else if (c.st === ST.REVIEW) { const k = Math.max(0, c.due - t); if (k <= 7) out[k].v++; }
  }
  return out;
}
function niceMax(v) { if (v <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function barsCard(title, sub, data, kind) {
  const W = 340, H = 150, padL = 28, padB = 20, padT = 10;
  const max = niceMax(Math.max(1, ...data.map(x => x.v)));
  const n = data.length, band = (W - padL) / n, bw = Math.min(24, band * 0.62);
  const y = v => padT + (H - padT - padB) * (1 - v / max);
  let g = '';
  for (const tv of (Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max])) g +=`<line class="grid-line" x1="${padL}" x2="${W}" y1="${y(tv)}" y2="${y(tv)}"/><text x="${padL - 6}" y="${y(tv) + 3}" text-anchor="end">${Math.round(tv)}</text>`;
  data.forEach((x, i) => {
    const cx = padL + band * i + band / 2;
    const h = Math.max(0, y(0) - y(x.v));
    const r = Math.min(4, h, bw / 2);
    if (x.v > 0) g += `<path class="bar ${i === (kind === 'fc' ? 0 : n - 1) ? 'today' : ''}" d="M${cx - bw / 2} ${y(0)}V${y(0) - h + r}Q${cx - bw / 2} ${y(0) - h} ${cx - bw / 2 + r} ${y(0) - h}H${cx + bw / 2 - r}Q${cx + bw / 2} ${y(0) - h} ${cx + bw / 2} ${y(0) - h + r}V${y(0)}Z"/>`;
    const label = kind === 'fc' ? (i === 0 ? 'Auj.' : DAY_NAMES[dayDate(x.d).getUTCDay()].slice(0, 3) + '.') : (i % 7 === 2 || i === n - 1 ? fmtShort(x.d) : '');
    if (label) g += `<text x="${cx}" y="${H - 5}" text-anchor="middle">${label}</text>`;
    const tipTxt = kind === 'fc' ? `${x.v} carte${x.v > 1 ? 's' : ''}|${i === 0 ? "Aujourd’hui (en retard compris)" : fmtDay(x.d)}` : `${x.v} carte${x.v > 1 ? 's' : ''}|${fmtDay(x.d)}${x.v ? ' · ' + Math.round(x.k / x.v * 100) + NB + '% justes' : ''}`;
    g += `<rect class="hit" x="${padL + band * i}" y="${padT}" width="${band}" height="${H - padT}" data-tip="${esc(tipTxt)}" tabindex="0"/>`;
  });
  const rows = data.map(x => `<tr><td>${esc(kind === 'fc' ? fmtDay(x.d) : fmtDay(x.d))}</td><td>${x.v}</td>${kind === 'hist' ? `<td>${x.v ? Math.round(x.k / x.v * 100) + NB + '%' : '—'}</td>` : ''}</tr>`).join('');
  return `<section class="chart-card" style="margin-top:12px"><h3>${esc(title)}</h3><p class="sub">${esc(sub)}</p>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}</svg>
    <details class="table"><summary>Voir les chiffres</summary><table><thead><tr><th>Jour</th><th>Cartes</th>${kind === 'hist' ? '<th>Justes</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></details></section>`;
}
function heatmapCard(t) {
  const weeks = 16, cell = 17, gap = 3, padL = 18, padT = 14;
  const end = t + (6 - weekday(t));       // dimanche de la semaine en cours
  const start = end - weeks * 7 + 1;
  const W = padL + weeks * (cell + gap), H = padT + 7 * (cell + gap);
  const color = n => n === 0 ? 'var(--wash)' : n < 10 ? 'var(--seq-1)' : n < 30 ? 'var(--seq-2)' : 'var(--seq-3)';
  let g = '';
  ['L', '', 'M', '', 'V', '', 'D'].forEach((l, i) => { if (l) g += `<text x="0" y="${padT + i * (cell + gap) + 12}">${l}</text>`; });
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const d0 = start + w * 7, m = dayDate(d0).getUTCMonth();
    if (m !== lastMonth) { g += `<text x="${padL + w * (cell + gap)}" y="9">${MONTHS_S[m]}</text>`; lastMonth = m; }
    for (let k = 0; k < 7; k++) {
      const d = d0 + k;
      if (d > t) continue;
      const x = state.days[d], n = x ? x.n : 0;
      g += `<rect x="${padL + w * (cell + gap)}" y="${padT + k * (cell + gap)}" width="${cell}" height="${cell}" rx="4" fill="${color(n)}" ${d === t ? 'stroke="var(--ink)" stroke-width="1.5"' : ''}/>`;
      g += `<rect class="hit" x="${padL + w * (cell + gap) - 1}" y="${padT + k * (cell + gap) - 1}" width="${cell + 2}" height="${cell + 2}" data-tip="${esc(`${n} carte${n > 1 ? 's' : ''}|${fmtDay(d)}${x && x.g ? ' · objectif atteint' : ''}`)}" tabindex="0"/>`;
    }
  }
  return `<section class="chart-card" style="margin-top:12px"><h3>Activité</h3><p class="sub">Cartes par jour, 16 dernières semaines</p>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calendrier d’activité">${g}</svg>
    <div class="legend" style="margin-top:8px"><span><b style="background:var(--wash)"></b>0</span><span><b class="lv1"></b>1–9</span><span><b class="lv2"></b>10–29</span><span><b class="lv3"></b>30 et plus</span></div></section>`;
}
function bindCharts() {
  root.querySelectorAll('.chart-card').forEach(card => {
    let tip = null;
    const show = el => {
      const [a, b] = el.dataset.tip.split('|');
      if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; card.appendChild(tip); }
      tip.innerHTML = ''; const bb = document.createElement('b'); bb.textContent = a; tip.appendChild(bb); tip.appendChild(document.createTextNode(b || ''));
      const r = el.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const x = clamp(r.left + r.width / 2 - cr.left, 70, cr.width - 70);
      tip.style.left = x + 'px'; tip.style.top = (r.top - cr.top - 4) + 'px';
      card.querySelectorAll('.hit').forEach(h => h.style.fill = 'transparent');
      el.style.fill = 'rgba(127,140,160,.14)';
    };
    const hide = () => { if (tip) { tip.remove(); tip = null; } card.querySelectorAll('.hit').forEach(h => h.style.fill = 'transparent'); };
    card.querySelectorAll('.hit').forEach(h => {
      h.addEventListener('pointerenter', () => show(h));
      h.addEventListener('pointerdown', () => show(h));
      h.addEventListener('focus', () => show(h));
      h.addEventListener('blur', hide);
    });
    card.addEventListener('pointerleave', hide);
  });
}

// ── réglages ──
function seg(name, values, current) {
  return `<div class="seg" role="group">${values.map(([v, l]) => `<button data-set="${name}" data-value="${v}" aria-pressed="${String(current) === String(v)}">${l}</button>`).join('')}</div>`;
}
function settingsHTML() {
  const st = S_();
  const syncTxt = Store.mode === 'remote'
    ? (Store.error ? 'Synchronisation en pause, nouvel essai automatique. Rien n’est perdu : tout est aussi gardé sur cet appareil.' : 'Ta progression est enregistrée sur ton compte et te suit sur tes autres appareils.')
    : 'Ta progression est gardée sur cet appareil. Ouvre l’app depuis Claude, connecté à ton compte, pour la retrouver partout.';
  return `
  <h1 class="h1" style="margin:6px 2px 14px">Réglages</h1>
  <div class="section-title" style="margin-top:4px"><h2 class="h2">Rythme</h2></div>
  <div class="set-group">
    <div class="set-row"><div class="lbl"><strong>Nouveaux drapeaux par jour</strong><span>8 par jour ≈ tous vus en un mois</span></div>${seg('newPerDay', [[4, '4'], [8, '8'], [12, '12'], [16, '16']], st.newPerDay)}</div>
    <div class="set-row"><div class="lbl"><strong>Objectif quotidien</strong><span>Cartes à faire pour prolonger ta série</span></div>${seg('goal', [[15, '15'], [25, '25'], [40, '40']], st.goal)}</div>
    <div class="set-row"><div class="lbl"><strong>Rétention visée</strong><span>Plus haut = plus de révisions</span></div>${seg('retention', [[0.85, '85' + NB + '%'], [0.9, '90' + NB + '%'], [0.95, '95' + NB + '%']], st.retention)}</div>
  </div>
  <div class="section-title"><h2 class="h2">Contenu</h2></div>
  <div class="set-group">
    <div class="set-row"><div class="lbl"><strong>Inclure les territoires</strong><span>Groenland, Hong Kong, Porto Rico… (34)</span></div><button class="switch" role="switch" data-toggle="terr" aria-checked="${st.terr}" aria-label="Inclure les territoires"></button></div>
    <div class="set-row"><div class="lbl"><strong>Sens inverse</strong><span>Retrouver le drapeau à partir du nom, une fois le drapeau connu</span></div><button class="switch" role="switch" data-toggle="rev" aria-checked="${st.rev}" aria-label="Sens inverse"></button></div>
    <div class="set-col"><div class="lbl"><strong>Zones étudiées</strong></div><div class="chips">${ZONE_KEYS.map(z => `<button class="filter" data-zone="${z}" aria-pressed="${!!st.zones[z]}">${esc(ZONES[z])}</button>`).join('')}</div></div>
    <div class="set-row"><div class="lbl"><strong>Ordre des nouveaux</strong><span>Les plus connus d’abord, ou zone par zone</span></div>${seg('order', [['fame', 'Connus'], ['zone', 'Zones']], st.order)}</div>
  </div>
  <div class="section-title"><h2 class="h2">Réponses</h2></div>
  <div class="set-group">
    <div class="set-col"><div class="lbl"><strong>Mode de réponse</strong><span class="small muted">Adaptatif : QCM avec pièges ressemblants tant qu’un drapeau est récent, puis saisie du nom une fois acquis.</span></div>${seg('mode', [['adaptive', 'Adaptatif'], ['mc', 'QCM'], ['type', 'Saisie']], st.mode)}</div>
  </div>
  ${WEB ? webBackupHTML() : `<div class="section-title"><h2 class="h2">Sauvegarde</h2></div>
  <div class="set-group">
    <div class="set-row"><div class="lbl"><strong><span class="sync-dot ${Store.mode === 'remote' && !Store.error ? 'remote' : ''}" style="display:inline-block;margin-right:7px"></span>${Store.mode === 'remote' ? 'Synchronisée' : 'Sur cet appareil'}</strong><span>${esc(syncTxt)}</span></div></div>
    <div class="set-col"><div class="lbl"><strong>Copie de secours</strong><span class="small muted">Copie ta progression pour la coller ailleurs, par exemple dans la version web de l’app, ou colle une copie pour la fusionner avec celle-ci.</span></div>
      <div class="row"><button class="btn secondary" data-action="copy-backup">Copier</button><button class="btn secondary" data-action="show-import">Coller une copie</button></div>
      <div id="import-box" hidden><textarea class="backup" id="import-text" placeholder="Colle ici une copie de secours"></textarea><div class="row" style="margin-top:8px"><button class="btn primary" data-action="do-import">Fusionner cette copie</button></div></div>
    </div>
    <div class="set-row"><div class="lbl"><strong>Tout recommencer</strong><span>Efface la progression, garde les réglages</span></div><button class="btn secondary" data-action="reset" style="color:var(--bad)">Effacer</button></div>
  </div>`}
  <div class="science-link">${I.bulb}<p class="small muted"><button class="link" data-action="science">La méthode et les études derrière l’app</button></p></div>`;
}
function setSetting(k, v) {
  const st = S_();
  if (k === 'newPerDay' || k === 'goal') v = parseInt(v, 10);
  if (k === 'retention') v = parseFloat(v);
  st[k] = v;
  state.settingsAt = now();
  Store.touch('settings');
  render();
}

// ── science ──
function scienceHTML() {
  const items = [
    ['Le rappel actif', 'Chercher la réponse dans sa mémoire la renforce bien plus que relire ou regarder. C’est l’effet de test, l’une des techniques les plus solides de la psychologie cognitive.', 'Chaque carte te fait répondre avant de montrer la solution.', 'Roediger & Karpicke (2006), Psychological Science · Rowland (2014), Psychological Bulletin · Dunlosky et al. (2013), Psychological Science in the Public Interest'],
    ['La répétition espacée', 'On oublie vite, puis de plus en plus lentement. Revoir une information juste avant de l’oublier, à intervalles croissants, la rend durable avec le moins de révisions possible.', 'L’algorithme FSRS-6 (celui d’Anki) estime pour chaque drapeau ta probabilité de t’en souvenir et le reprogramme quand elle passe sous la rétention visée (90 % par défaut).', 'Cepeda et al. (2006), Psychological Bulletin · Cepeda et al. (2008), Psychological Science · Latimier, Peyre & Ramus (2021), Educational Psychology Review · Ye, Su & Cao (2022), KDD'],
    ['Le contraste entre sosies', 'Mélanger des éléments proches oblige le cerveau à repérer ce qui les distingue. L’effet est le plus fort pour des images qui se ressemblent, comme des drapeaux.', 'Les QCM utilisent des drapeaux visuellement proches (calculés pixel par pixel) et tes propres confusions ; le Duel des sosies les met face à face.', 'Kornell & Bjork (2008), Psychological Science · Kang & Pashler (2012), Applied Cognitive Psychology · Brunmair & Richter (2019), Psychological Bulletin'],
    ['La correction immédiate', 'Voir tout de suite la bonne réponse, et ce qui la distingue de la tienne, évite d’ancrer l’erreur. Les erreurs commises avec assurance sont même les mieux corrigées.', 'Après une erreur, ton choix et la bonne réponse apparaissent côte à côte, avec une astuce pour les différencier.', 'Pashler et al. (2005), JEP : Learning, Memory & Cognition · Butler & Roediger (2008), Memory & Cognition · Butterfield & Metcalfe (2001), JEP : LMC'],
    ['Produire plutôt que reconnaître', 'Retrouver un nom sans aide demande plus d’effort que le reconnaître dans une liste, et cet effort, s’il aboutit, laisse une trace plus durable.', 'En mode adaptatif, un drapeau passe du QCM à la saisie du nom dès qu’il est acquis. Le bouton « Voir 4 choix » reste là en cas de blocage.', 'Bjork (1994), Metacognition · Pyc & Rawson (2009), Journal of Memory and Language'],
    ['Une note objective', 'On surestime souvent ce qu’on sait, et l’auto-évaluation pousse à arrêter trop tôt. Les flashcards classiques souffrent de ce biais.', 'La note de chaque carte vient de ta réponse et de ton temps de réaction. « J’ai deviné » permet de signaler un coup de chance.', 'Dunlosky & Rawson (2012), Learning and Instruction · Kornell & Bjork (2008), Memory'],
    ['Petits lots et réapprentissage', 'Apprendre peu à la fois, jusqu’à la bonne réponse, puis réapprendre au fil des jours est plus efficace que de longues séances.', 'Huit nouveaux drapeaux par jour par défaut, chacun revu dans la séance jusqu’à deux bonnes réponses, puis aux dates prévues.', 'Rawson & Dunlosky (2011), JEP : General · Kornell (2009), Applied Cognitive Psychology'],
    ['Le sommeil et la régularité', 'Le sommeil consolide ce qu’on a appris dans la journée. Réapprendre après une nuit est plus rapide et le souvenir tient plus longtemps.', 'Des séances courtes chaque jour, et une série quotidienne pour garder le rythme.', 'Diekelmann & Born (2010), Nature Reviews Neuroscience · Mazza et al. (2016), Psychological Science'],
    ['Donner du sens', 'Relier une image à une signification (pourquoi ce soleil, ce cèdre, ces étoiles) crée des prises supplémentaires pour la mémoire.', 'Chaque correction rappelle la capitale et le sens des symboles.', 'Paivio (1986), Mental Representations · Dunlosky et al. (2013)'],
  ];
  return `
  <div class="row" style="margin:6px 0 14px"><button class="icon-btn" data-action="back" aria-label="Retour">${I.back}</button><h1 class="h1" style="flex:1">Pourquoi ça marche</h1></div>
  <p class="muted" style="margin:0 2px 14px">L’app applique les techniques d’apprentissage les mieux établies par la recherche. Voici lesquelles, et où tu les retrouves.</p>
  <div class="sci">${items.map(([h, why, how, refs]) => `<article><h3>${esc(h)}</h3><p>${esc(why)}</p><p class="how">${esc(how)}</p><p class="refs">${esc(refs)}</p></article>`).join('')}</div>`;
}

// ─────────── sauvegarde, transfert ───────────
function exportText() { return JSON.stringify({ app: 'drapeaux-en-tete', v: 1, exportedAt: new Date().toISOString(), state }); }
async function copyBackup() {
  const txt = exportText();
  try { await navigator.clipboard.writeText(txt); toast('Progression copiée. Colle-la sur ton autre appareil.'); }
  catch (e) {
    $('#import-box').hidden = false;
    const ta = $('#import-text'); ta.value = txt; ta.focus(); ta.select();
    toast('Sélectionne le texte et copie-le.');
  }
}
function studiedCount(st) { return Object.entries(st.cards || {}).filter(([k, c]) => k.endsWith('_f') && c && c.st).length; }
function confirmImport(parsed) {
  if (!parsed) { toast('Je n’arrive pas à lire cette progression. Vérifie que le fichier ou le texte est complet.'); return; }
  const n = studiedCount(parsed);
  let last = 0; for (const c of Object.values(parsed.cards)) last = Math.max(last, c.lr || 0);
  const when = last ? ' Dernière révision : ' + fmtDay(dayIndex(last)) + '.' : '';
  confirmSheet('Fusionner cette progression ?', `Elle contient ${n} drapeau${n > 1 ? 'x' : ''} étudié${n > 1 ? 's' : ''}.${when} Pour chaque drapeau, la révision la plus récente est gardée : tu ne perds rien de ce qui est sur cet appareil.`, 'Fusionner', () => {
    const res = importMerge(state, parsed);
    state = res.state;
    Store.touch('full');
    toast(res.updated ? `Progression fusionnée : ${res.updated} carte${res.updated > 1 ? 's' : ''} mise${res.updated > 1 ? 's' : ''} à jour.` : 'Rien de nouveau : cet appareil était déjà à jour.');
    setView('home');
  });
}
function doImport() { confirmImport(parseExport($('#import-text').value)); }
const isTouch = () => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
async function sendProgress() {
  const d = new Date();
  const name = `drapeaux-progression-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  const file = new File([exportText()], name, { type: 'application/json' });
  if (isTouch() && navigator.canShare && navigator.share) {
    try { if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Ma progression – Drapeaux en tête' }); return; } }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Fichier enregistré dans tes téléchargements.');
  } catch (e) { copyBackup(); }
}
function pickImportFile() {
  let inp = $('#import-file');
  if (!inp) {
    inp = document.createElement('input'); inp.type = 'file'; inp.id = 'import-file'; inp.accept = '.json,application/json,text/plain'; inp.hidden = true;
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { inp.value = ''; confirmImport(parseExport(rd.result)); };
      rd.onerror = () => toast('Je n’arrive pas à ouvrir ce fichier.');
      rd.readAsText(f);
    });
    document.body.appendChild(inp);
  }
  inp.click();
}
function webBackupHTML() {
  return `<div class="section-title"><h2 class="h2">Sauvegarde et transfert</h2></div>
  <div class="set-group">
    <div class="set-row"><div class="lbl"><strong><span class="sync-dot remote" style="display:inline-block;margin-right:7px"></span>Enregistrée sur cet appareil</strong><span>Automatiquement, à chaque réponse. ${isStandalone() ? '' : 'Installe l’app sur ton écran d’accueil pour la protéger.'}</span></div></div>
    <div class="set-col"><div class="lbl"><strong>Passer d’un appareil à l’autre</strong><span class="small muted">Envoie ta progression depuis l’appareil où tu as révisé, puis importe-la sur l’autre. Les deux sont fusionnées : pour chaque drapeau, la révision la plus récente est gardée.</span></div>
      <div class="row" style="flex-wrap:wrap"><button class="btn primary" data-action="send-progress">Envoyer ma progression</button><button class="btn secondary" data-action="pick-import">Importer un fichier</button></div>
      <div class="row" style="flex-wrap:wrap"><button class="btn ghost" data-action="copy-backup">Copier en texte</button><button class="btn ghost" data-action="show-import">Coller un texte</button></div>
      <div id="import-box" hidden><textarea class="backup" id="import-text" placeholder="Colle ici la progression copiée sur l’autre appareil"></textarea><div class="row" style="margin-top:8px"><button class="btn primary" data-action="do-import">Fusionner</button></div></div>
    </div>
    <div class="set-row"><div class="lbl"><strong>Tout recommencer</strong><span>Efface la progression de cet appareil, garde les réglages</span></div><button class="btn secondary" data-action="reset" style="color:var(--bad)">Effacer</button></div>
  </div>`;
}

// ─────────── installation (version web) ───────────
let installEvt = null;
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function installHidden() { try { return +localStorage.getItem('drapeaux-en-tete:install-later') > now(); } catch (e) { return false; } }
function installHTML() {
  if (!WEB || isStandalone() || installHidden()) return '';
  let how;
  if (installEvt) how = `<button class="btn primary" data-action="install">Installer l’app</button>`;
  else if (isIOS()) how = `<p class="small">Dans Safari, touche <strong>Partager</strong> (le carré avec une flèche), puis <strong>« Sur l’écran d’accueil »</strong>. Ensuite, ouvre toujours l’app depuis son icône : sur iPhone, elle garde sa propre mémoire, séparée de Safari.</p>`;
  else if (isTouch()) how = `<p class="small">Dans le menu du navigateur (⋮), choisis <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong>.</p>`;
  else how = `<p class="small">Dans la barre d’adresse de Chrome ou Edge, clique sur l’icône d’installation, ou ajoute simplement cette page à tes favoris.</p>`;
  return `<section class="install panel stack" aria-label="Installer l’app">
    <div class="row" style="align-items:flex-start"><div style="flex:1;min-width:0"><strong>Installe l’app sur ${isTouch() ? 'ton téléphone' : 'ton ordinateur'}</strong><p class="small muted" style="margin-top:2px">Une icône pour l’ouvrir en un geste, même hors ligne.</p></div>
    <button class="btn ghost" data-action="install-later" style="min-height:36px;padding:4px 8px">Plus tard</button></div>
    ${how}
  </section>`;
}
if (WEB) {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (view === 'home') render(); });
  window.addEventListener('appinstalled', () => { installEvt = null; if (view === 'home') render(); });
}
let persistAsked = false;
function askPersist() {
  if (!WEB || persistAsked) return; persistAsked = true;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }).catch(() => {}); } catch (e) {}
}
function resetAll() {
  confirmSheet('Tout recommencer ?', WEB ? 'Toute ta progression sur cet appareil sera effacée. Tes réglages sont conservés.' : 'Toute ta progression sera effacée, sur tous tes appareils. Tes réglages sont conservés.', 'Effacer', () => {
    const keep = state.settings;
    state = freshState(); state.settings = keep; state.settingsAt = now();
    Store.touch('full');
    toast('Progression effacée.');
    setView('home');
  });
}

let toastTimer = null;
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

// ─────────── événements ───────────
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-detail], [data-tab-go]');
  if (!t) return;
  if (t.dataset.tab) { closeSheet(); setView(t.dataset.tab); return; }
  if (t.dataset.tabGo) { closeSheet(); setView(t.dataset.tabGo); return; }
  if (t.dataset.detail) { openDetail(t.dataset.detail); return; }
  if (t.dataset.defiAnswer) { if (view === 'defi-play') defiAnswer(t.dataset.defiAnswer); return; }
  if (t.dataset.defiDir) { defi.dir = t.dataset.defiDir; writeDefi(); render(); return; }
  if (t.dataset.defiLvl) { defi.lvl = +t.dataset.defiLvl; writeDefi(); render(); return; }
  if (t.dataset.defiZone) { defi.zone = t.dataset.defiZone; writeDefi(); setView('defi', { keepScroll: true }); return; }
  if (t.dataset.defiLen) { defi.len = +t.dataset.defiLen; writeDefi(); setView('defi', { keepScroll: true }); return; }
  if (t.dataset.answer && S && S.q && !S.p) { answer(t.dataset.answer); return; }
  if (t.dataset.filter) { coll.filter = t.dataset.filter; document.querySelectorAll('.filter[data-filter]').forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === coll.filter)); renderCollectionList(); return; }
  if (t.dataset.set) { setSetting(t.dataset.set, t.dataset.value); return; }
  if (t.dataset.toggle) { setSetting(t.dataset.toggle, !S_()[t.dataset.toggle]); return; }
  if (t.dataset.zone) {
    const z = S_().zones; const on = Object.values(z).filter(Boolean).length;
    if (z[t.dataset.zone] && on <= 1) { toast('Garde au moins une zone.'); return; }
    z[t.dataset.zone] = z[t.dataset.zone] ? 0 : 1; state.settingsAt = now(); Store.touch('settings'); render(); return;
  }
  if (t.dataset.duel) { closeSheet(); startSession(buildDuel(t.dataset.duel.split(','))); return; }
  switch (t.dataset.action) {
    case 'start-daily': closeSheet(); startSession(buildDaily()); break;
    case 'start-duel': startSession(buildDuel()); break;
    case 'start-weak': startSession(buildWeak()); break;
    case 'start-extra': startSession(buildExtraNew(5)); break;
    case 'continue': commit(); break;
    case 'guessed': commit(1); break;
    case 'was-right': commit(2, true); break;
    case 'dunno': if (S && S.q && !S.p) answer(null); break;
    case 'hint':
      if (S && S.q && !S.p) { S.q.hint = true; S.q.options = shuffle([S.q.code, ...distractors(S.q.code, 3, 'f', 'mc')]); if (!S.q.firstKey) S.q.firstKey = now(); renderSession(); }
      break;
    case 'quit': quitSession(); break;
    case 'defi': closeSheet(); D = null; setView('defi'); break;
    case 'defi-start': startDefi(); break;
    case 'defi-continue': defiContinue(); break;
    case 'defi-quit': defiQuit(); break;
    case 'defi-dunno': defiAnswer(null); break;
    case 'defi-hint': if (D && D.q && !D.p && D.q.hint < 2) { D.q.hint++; const v = $('#defi-input').value; renderDefiPlay(); $('#defi-input').value = v; } break;
    case 'home': S = null; D = null; cancelAnimationFrame(defiRAF); clearTimeout(defiAuto); setView('home'); break;
    case 'science': closeSheet(); prevView = view === 'science' ? prevView : view; setView('science'); break;
    case 'back': setView(prevView || 'home'); break;
    case 'close-sheet': closeSheet(); break;
    case 'copy-backup': copyBackup(); break;
    case 'show-import': $('#import-box').hidden = !$('#import-box').hidden; if (!$('#import-box').hidden) $('#import-text').focus(); break;
    case 'do-import': doImport(); break;
    case 'reset': resetAll(); break;
    case 'send-progress': sendProgress(); break;
    case 'pick-import': pickImportFile(); break;
    case 'install': if (installEvt) { const ev = installEvt; installEvt = null; ev.prompt(); ev.userChoice.finally(() => render()); } break;
    case 'install-later': try { localStorage.setItem('drapeaux-en-tete:install-later', String(now() + 5 * DAY_MS)); } catch (e) {} render(); break;
  }
});
let prevView = 'home';
document.addEventListener('submit', e => {
  if (e.target.id === 'type-form') { e.preventDefault(); if (S && S.q && !S.p) answer($('#type-input').value); }
  if (e.target.id === 'defi-form') { e.preventDefault(); if (D && D.p) defiContinue(); else defiAnswer(null, $('#defi-input').value); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheet) { closeSheet(); return; }
  if (view === 'defi-play' && D && D.q) {
    if (e.key === 'Escape') { defiQuit(); return; }
    if (D.p) { if (e.key === 'Enter' && !e.target.closest('button') && e.target.id !== 'defi-input') { e.preventDefault(); defiContinue(); } return; }
    if (e.target.tagName === 'INPUT') return;
    const k = parseInt(e.key, 10);
    if (k >= 1 && D.q.options && k <= D.q.options.length) defiAnswer(D.q.options[k - 1]);
    return;
  }
  if (view !== 'session' || !S || !S.q) return;
  if (S.p) { if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); commit(); } return; }
  if (e.target.tagName === 'INPUT') return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && S.q.options && n <= S.q.options.length && (S.q.mode !== 'type' || S.q.hint)) answer(S.q.options[n - 1]);
});

// ─────────── démarrage ───────────
function renderShell() {
  $('.wordmark').innerHTML = `${I.logo}<span>Drapeaux en tête</span>`;
  $('.tabbar').innerHTML = [['home', I.home, 'Accueil'], ['collection', I.grid, 'Collection'], ['stats', I.chart, 'Stats'], ['settings', I.gear, 'Réglages']]
    .map(([k, ic, l]) => `<button data-tab="${k}" aria-current="false">${ic}<span>${l}</span></button>`).join('');
}
function start(hotData) {
  renderShell();
  if (hotData && hotData.session && hotData.session.q) {
    S = hotData.session; S.p = null; view = 'session';
    $('#app').classList.add('in-session');
    S.queue.unshift(S.q.id); nextQuestion();
  } else {
    setView(hotData && hotData.view && !/^(session|summary|defi-play|defi-end)$/.test(hotData.view) ? hotData.view : 'home');
  }
  if (WEB) {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
  } else {
    Store.connect();
  }
}
if (window.claude && window.claude.hot && typeof window.claude.hot.snapshot === 'function') {
  window.claude.hot.snapshot(() => ({ view, session: S && !S.done ? S : null }));
}
if (window.claude && window.claude.hot && typeof window.claude.hot.ready === 'function') window.claude.hot.ready(start);
else start((window.claude && window.claude.hot && window.claude.hot.data) || {});

// tests (hors production)
if (typeof window !== 'undefined') window.__det = { defi: () => D, defiPrefs: () => defi, checkTyped, norm, plan, buildDaily, distractors, state: () => state, session: () => S, BY, ORDERS, setState: s => { state = sanitize(s); render(); } };
})();
