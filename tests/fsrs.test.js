// src/engine.js doit rester identique à l'implémentation de référence py-fsrs 6.3.2 (node --test).
// Les valeurs de référence sont dans tests/fixtures/fsrs-ref.json (générées par tests/fixtures/gen_fsrs_ref.py).
const test = require('node:test');
const assert = require('node:assert');
const { FSRS, ST, memoryUpdate, scheduleCard, dayIndex, DAY_MS } = require('../src/engine.js');
const ref = require('./fixtures/fsrs-ref.json');

test('stabilité et difficulté identiques à py-fsrs sur 2 563 révisions', () => {
  let n = 0;
  for (const steps of ref.cases) {
    let card = { st: ST.NEW };
    for (const s of steps) {
      card = memoryUpdate(card, s.g, s.ms);
      card.st = ST.REVIEW;
      assert.ok(Math.abs(card.s - s.s) / s.s < 1e-9, `stabilité ${card.s} ≠ ${s.s}`);
      assert.ok(Math.abs(card.d - s.d) < 1e-9, `difficulté ${card.d} ≠ ${s.d}`);
      n++;
    }
  }
  assert.strictEqual(n, 2563);
});

test('probabilité de rappel et intervalles identiques à py-fsrs', () => {
  for (const [t, s, r] of ref.extra.retr) assert.ok(Math.abs(FSRS.retr(t, s) - r) < 1e-12);
  for (const [ret, rows] of Object.entries(ref.extra.ivl)) for (const [s, ivl] of rows) assert.strictEqual(FSRS.interval(s, +ret, 36500), ivl, `intervalle S=${s} R=${ret}`);
});

test('le « fuzz » reste dans les bornes de py-fsrs', () => {
  for (let i = 0; i < 5000; i++) {
    const ivl = 3 + Math.floor(Math.random() * 300);
    let delta = 1;
    for (const [a, b, f] of [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]]) delta += f * Math.max(Math.min(ivl, b) - a, 0);
    const v = FSRS.fuzz(ivl);
    assert.ok(v >= Math.max(2, Math.round(ivl - delta)) && v <= Math.round(ivl + delta), `fuzz(${ivl}) = ${v}`);
  }
});

test('étapes en séance : erreur → revient vite, bonne réponse → planifiée en jours', () => {
  const t0 = Date.UTC(2026, 9, 26, 10);
  let r = scheduleCard({ st: ST.NEW }, 1, t0, 0.9, () => 0.5);
  assert.strictEqual(r.card.st, ST.LEARN); assert.strictEqual(r.requeue, 3);
  r = scheduleCard(r.card, 3, t0 + 60000, 0.9, () => 0.5);
  assert.strictEqual(r.card.st, ST.LEARN); assert.strictEqual(r.requeue, 6);
  r = scheduleCard(r.card, 3, t0 + 120000, 0.9, () => 0.5);
  assert.strictEqual(r.card.st, ST.REVIEW); assert.strictEqual(r.requeue, null);
  assert.ok(r.card.due > dayIndex(t0));
  // oubli d'une carte en révision → réapprentissage et compteur d'oublis
  const later = t0 + 10 * DAY_MS;
  const f = scheduleCard(r.card, 1, later, 0.9, () => 0.5);
  assert.strictEqual(f.card.st, ST.RELEARN); assert.strictEqual(f.card.l, 1); assert.strictEqual(f.requeue, 4);
});
