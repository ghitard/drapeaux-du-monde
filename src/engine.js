// ═══════════════ Moteur d'apprentissage ═══════════════
// FSRS-6 (Free Spaced Repetition Scheduler), paramètres par défaut d'open-spaced-repetition/py-fsrs 6.x.
const FSRS = (() => {
  const W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796,
    1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
  const DECAY = -W[20];
  const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
  const S_MIN = 0.001;
  const clampD = d => Math.min(Math.max(d, 1), 10);
  const clampS = s => Math.max(s, S_MIN);
  // probabilité de rappel après t jours pour une stabilité S
  const retr = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
  const initS = g => clampS(W[g - 1]);
  const initD = (g, clamp = true) => { const d = W[4] - Math.exp(W[5] * (g - 1)) + 1; return clamp ? clampD(d) : d; };
  const nextD = (d, g) => {
    const delta = -(W[6] * (g - 3));
    const damped = d + (10 - d) * delta / 9;
    return clampD(W[7] * initD(4, false) + (1 - W[7]) * damped);
  };
  const shortS = (s, g) => {
    let inc = Math.exp(W[17] * (g - 3 + W[18])) * Math.pow(s, -W[19]);
    if (g >= 2) inc = Math.max(inc, 1);
    return clampS(s * inc);
  };
  const forgetS = (d, s, r) => Math.min(
    W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]),
    s / Math.exp(W[17] * W[18]));
  const recallS = (d, s, r, g) => s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
    (Math.exp((1 - r) * W[10]) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
  const nextS = (d, s, r, g) => clampS(g === 1 ? forgetS(d, s, r) : recallS(d, s, r, g));
  // intervalle (jours entiers) pour atteindre la rétention visée
  const interval = (s, retention, maxIvl = 3650) =>
    Math.min(Math.max(Math.round(s / FACTOR * (Math.pow(retention, 1 / DECAY) - 1)), 1), maxIvl);
  // « fuzz » : étale les révisions pour éviter les embouteillages (mêmes plages que py-fsrs)
  const FUZZ = [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]];
  const fuzz = (ivl, rnd = Math.random, maxIvl = 3650) => {
    if (ivl < 2.5) return ivl;
    let delta = 1;
    for (const [a, b, f] of FUZZ) delta += f * Math.max(Math.min(ivl, b) - a, 0);
    let lo = Math.max(2, Math.round(ivl - delta));
    const hi = Math.min(Math.round(ivl + delta), maxIvl);
    lo = Math.min(lo, hi);
    return Math.min(Math.floor(rnd() * (hi - lo + 1) + lo), maxIvl);
  };
  return { W, DECAY, FACTOR, retr, initS, initD, nextD, shortS, forgetS, recallS, nextS, interval, fuzz };
})();

const DAY_MS = 86400000;
const ROLLOVER_H = 4; // la « journée » d'apprentissage commence à 4 h du matin
const ST = { NEW: 0, LEARN: 1, REVIEW: 2, RELEARN: 3 };
const dayIndex = ts => Math.floor((ts - new Date(ts).getTimezoneOffset() * 60000 - ROLLOVER_H * 3600000) / DAY_MS);

// Mise à jour de l'état mémoire (stabilité S, difficulté D) — identique à py-fsrs.
function memoryUpdate(card, g, now) {
  const c = Object.assign({}, card);
  if (c.st === ST.NEW || c.s == null) {
    c.s = FSRS.initS(g); c.d = FSRS.initD(g);
  } else {
    const days = Math.floor((now - c.lr) / DAY_MS);
    if (days < 1) { c.s = FSRS.shortS(c.s, g); c.d = FSRS.nextD(c.d, g); }
    else { const r = FSRS.retr(days, c.s); c.s = FSRS.nextS(c.d, c.s, r, g); c.d = FSRS.nextD(c.d, g); }
  }
  c.lr = now;
  return c;
}

// Étapes en séance + planification. Renvoie {card, requeue} : requeue = nb de cartes avant de revoir celle-ci.
function scheduleCard(card, g, now, retention, rnd = Math.random) {
  const prev = card.st || ST.NEW;
  const c = memoryUpdate(card, g, now);
  c.n = (c.n || 0) + 1;
  if (g > 1) c.k = (c.k || 0) + 1;
  c.lt = g;
  if (!c.fs) c.fs = now;
  const graduate = () => {
    c.st = ST.REVIEW; c.stp = 0;
    c.due = dayIndex(now) + FSRS.fuzz(FSRS.interval(c.s, retention), rnd);
    return { card: c, requeue: null };
  };
  if (prev === ST.NEW || prev === ST.LEARN) {
    const step = c.stp || 0;
    if (g === 1) { c.st = ST.LEARN; c.stp = 1; return { card: c, requeue: 3 }; }
    if (g === 4 && step !== 1) return graduate();
    if (step >= 2) return graduate();
    c.st = ST.LEARN; c.stp = 2;
    return { card: c, requeue: 6 };
  }
  if (prev === ST.REVIEW) {
    c.r = (c.r || 0) + 1;
    if (g === 1) { c.st = ST.RELEARN; c.stp = 1; c.l = (c.l || 0) + 1; return { card: c, requeue: 4 }; }
    return graduate();
  }
  // RELEARN
  if (g === 1) return { card: c, requeue: 4 };
  return graduate();
}

if (typeof module !== 'undefined') module.exports = { FSRS, ST, DAY_MS, dayIndex, memoryUpdate, scheduleCard };
