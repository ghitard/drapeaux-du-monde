// Test de bout en bout dans un vrai navigateur (Chromium headless), site servi sous /drapeaux/ comme sur GitHub Pages.
//   Prérequis (une fois) : npm i -D playwright && npx playwright install chromium
//   Lancer : npm run test:e2e        (reconstruit dist-test/ puis teste)
// Vérifie : chargement sans erreur, séance complète, correction de saisie, hors ligne, transfert entre deux appareils,
// installation, rendu sans débordement à 390 px en clair et en sombre. Captures dans tests/screenshots/.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const { createStaticServer } = require('../scripts/static-server');

let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) { console.error('Playwright manque. Installe-le une fois : npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
execFileSync('node', [path.join(ROOT, 'scripts', 'build.js'), '--test'], { stdio: 'inherit' });

const failures = [];
const check = (cond, msg) => { if (cond) console.log('  ✓ ' + msg); else { console.log('  ✗ ' + msg); failures.push(msg); } };
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

// Réponses saisies : [saisie, code attendu, accepté ?, code « autre » attendu]
const TYPED = [
  ['pays bas', 'NL', true], ['hollande', 'NL', true], ['Niger', 'NG', false, 'NE'], ['RDC', 'CD', true], ['congo', 'CD', false, 'CG'],
  ["Côte d'Ivoire", 'CI', true], ['usa', 'US', true], ['angleterre', 'GB', false, 'GB-ENG'], ['Irak', 'IR', false, 'IQ'],
  ['slovenie', 'SK', false, 'SI'], ['australie', 'AT', false, 'AU'], ['mexiqe', 'MX', true], ['Malaisi', 'MY', true],
  ['Mali', 'MW', false, 'ML'], ['Dominique', 'DO', false, 'DM'], ['Turkiye', 'TR', true], ['iles salomon', 'SB', true],
];

async function answerAll(page, max = 120) {
  for (let k = 0; k < max; k++) {
    const q = await page.evaluate(() => { const S = __det.session(); return S && S.q && !S.done ? { code: S.q.code, mode: S.q.mode, hint: S.q.hint } : null; });
    if (!q) return k;
    if (q.mode === 'type' && !q.hint) {
      await page.fill('#type-input', await page.evaluate(c => __det.BY[c].n, q.code));
      await page.click('#type-form button[type=submit]');
    } else {
      await page.click(`[data-answer="${q.code}"]`);
    }
    await page.click('[data-action="continue"]');
  }
  return max;
}
// La page ne doit jamais défiler ni être coupée à droite. Les rangées qui défilent exprès (filtres, sosies)
// sont ignorées : leurs éléments ont un ancêtre en overflow-x auto/scroll.
async function noHorizontalOverflow(page) {
  return page.evaluate(() => {
    if (document.documentElement.scrollWidth > window.innerWidth + 1) return false;
    const view = document.querySelector('#view');
    if (view.scrollWidth > view.clientWidth + 1) return false;
    const inScroller = el => { for (let a = el.parentElement; a && a !== view; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox === 'auto' || ox === 'scroll') return true; } return false; };
    return [...view.querySelectorAll('*')].every(el => el.getBoundingClientRect().right <= window.innerWidth + 1 || inScroller(el));
  });
}

(async () => {
  const server = createStaticServer(path.join(ROOT, 'dist-test'), '/drapeaux/');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const URL = `http://127.0.0.1:${server.address().port}/drapeaux/`;
  const browser = await chromium.launch();
  const pageErrors = [];
  try {
    // ── Téléphone ──
    console.log('Téléphone');
    const A = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
    const pa = await A.newPage();
    pa.on('pageerror', e => pageErrors.push('téléphone : ' + e.message));
    pa.on('console', m => { if (m.type() === 'error') pageErrors.push('téléphone (console) : ' + m.text()); });
    await pa.goto(URL); await pa.waitForTimeout(500);
    check(await pa.title() === 'Drapeaux en tête', 'la page se charge');
    check(!!(await pa.$('.install')), 'le bandeau d’installation s’affiche dans Safari');
    await pa.screenshot({ path: path.join(SHOTS, 'accueil-telephone.png') });
    const sw = await pa.evaluate(async () => { await navigator.serviceWorker.ready; await new Promise(r => setTimeout(r, 2500)); let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return { n, controlled: !!navigator.serviceWorker.controller }; });
    check(sw.n >= 240 && sw.controlled, `service worker actif, ${sw.n} fichiers en cache`);
    const typed = await pa.evaluate(cases => cases.map(([inp, code, ok, other]) => { const r = __det.checkTyped(inp, code); return (r.ok === ok && (!other || r.other === other)) ? null : `${inp}→${code} : ${JSON.stringify(r)}`; }).filter(Boolean), TYPED);
    check(typed.length === 0, 'correction des réponses saisies (accents, alias, fautes, pays voisins)' + (typed.length ? ' : ' + typed.join(' | ') : ''));
    await pa.click('[data-action="start-daily"]'); await pa.waitForTimeout(300);
    await pa.screenshot({ path: path.join(SHOTS, 'question.png') });
    const steps = await answerAll(pa);
    check(steps > 0 && await pa.$('[data-action="home"]'), `séance du jour terminée (${steps} réponses)`);
    await pa.click('[data-action="home"]');
    const cardsPhone = await pa.evaluate(() => Object.keys(__det.state().cards).length);
    check(cardsPhone >= 8, `progression enregistrée (${cardsPhone} cartes)`);
    // Défi chrono : partie complète, record, aucune trace dans la progression de révision
    const before = await pa.evaluate(() => JSON.stringify(__det.state().cards));
    await pa.click('[data-action="defi"]'); await pa.waitForTimeout(200);
    await pa.screenshot({ path: path.join(SHOTS, 'defi-niveaux.png') });
    await pa.click('[data-defi-lvl="3"]'); await pa.click('[data-defi-len="10"]'); await pa.click('[data-action="defi-start"]'); await pa.waitForTimeout(300);
    const nOpts = await pa.evaluate(() => document.querySelectorAll('[data-defi-answer]').length);
    check(nOpts === 6, `défi Explorateur : 6 choix (${nOpts})`);
    for (let k = 0; k < 10; k++) {
      const c = await pa.evaluate(() => __det.defi().q.code);
      const wrong = await pa.evaluate(() => __det.defi().q.options.find(x => x !== __det.defi().q.code));
      await pa.click(`[data-defi-answer="${k === 0 ? wrong : c}"]`);
      if (k === 0) await pa.screenshot({ path: path.join(SHOTS, 'defi-question.png') });
      await pa.click('[data-action="defi-continue"]');
    }
    await pa.waitForTimeout(200);
    const end = await pa.evaluate(() => ({ done: !!(__det.defi() && __det.defi().done), score: __det.defi().score, ok: __det.defi().ok, best: __det.defiPrefs().best['f-3'] }));
    check(end.done && end.ok === 9 && end.score > 0 && end.best === end.score, `défi terminé : 9/10, ${end.score} points, record enregistré`);
    await pa.screenshot({ path: path.join(SHOTS, 'defi-resultats.png') });
    await pa.click('[data-action="defi"]'); await pa.click('[data-defi-lvl="4"]'); await pa.click('[data-action="defi-start"]'); await pa.waitForTimeout(300);
    const name = await pa.evaluate(() => __det.BY[__det.defi().q.code].n);
    await pa.fill('#defi-input', name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    await pa.click('#defi-form button[type=submit]'); await pa.waitForTimeout(100);
    check(await pa.evaluate(() => __det.defi().p && __det.defi().p.ok), `défi Vexillologue : saisie sans accents acceptée (${name})`);
    await pa.click('[data-action="defi-quit"]'); await pa.click('[data-action="home"]');
    check(await pa.evaluate(() => JSON.stringify(__det.state().cards)) === before, 'le défi ne modifie pas la progression de révision');
    await pa.reload(); await pa.waitForTimeout(400);
    check(await pa.evaluate(() => __det.defiPrefs().best['f-3']) === end.score, 'record du défi conservé après rechargement');
    await A.setOffline(true);
    await pa.reload(); await pa.waitForTimeout(800);
    check(await pa.evaluate(() => !!document.querySelector('.today')) && await pa.evaluate(() => Object.keys(__det.state().cards).length) === cardsPhone, 'hors ligne : l’app se recharge avec la progression');
    await pa.click('[data-tab="collection"]'); await pa.waitForTimeout(800);
    const imgs = await pa.evaluate(() => { const ims = [...document.querySelectorAll('.cell img')].slice(0, 30); return ims.filter(i => i.complete && i.naturalWidth > 0).length; });
    check(imgs === 30, `hors ligne : drapeaux affichés (${imgs}/30)`);
    await A.setOffline(false);
    await pa.click('[data-tab="settings"]'); await pa.waitForTimeout(200);
    const dl = pa.waitForEvent('download');
    await pa.click('[data-action="send-progress"]');
    const file = path.join(os.tmpdir(), 'drapeaux-export-test.json');
    await (await dl).saveAs(file);
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    check(exported.app === 'drapeaux-en-tete' && Object.keys(exported.state.cards).length === cardsPhone, 'export de la progression en fichier');

    // ── Ordinateur ──
    console.log('Ordinateur');
    const B = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const pb = await B.newPage();
    pb.on('pageerror', e => pageErrors.push('ordinateur : ' + e.message));
    await pb.goto(URL); await pb.waitForTimeout(500);
    await pb.click('[data-action="start-daily"]'); await pb.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { const c = await pb.evaluate(() => __det.session().q.code); await pb.click(`[data-answer="${c}"]`); await pb.click('[data-action="continue"]'); }
    await pb.click('[data-action="quit"]'); await pb.waitForTimeout(200); await pb.click('[data-action="home"]');
    const own = await pb.evaluate(() => Object.keys(__det.state().cards));
    await pb.click('[data-tab="settings"]'); await pb.waitForTimeout(200);
    for (let round = 0; round < 2; round++) {
      const chooser = pb.waitForEvent('filechooser');
      await pb.click('[data-action="pick-import"]');
      await (await chooser).setFiles(file);
      await pb.waitForTimeout(300);
      await pb.click('#confirm-ok'); await pb.waitForTimeout(300);
      if (round === 0) await pb.click('[data-tab="settings"]');
    }
    const merged = await pb.evaluate(() => Object.keys(__det.state().cards));
    const union = new Set([...own, ...Object.keys(exported.state.cards)]);
    check(merged.length === union.size, `import fusionné et idempotent (${merged.length} cartes)`);
    await pb.reload(); await pb.waitForTimeout(400);
    check(await pb.evaluate(() => Object.keys(__det.state().cards).length) === union.size, 'progression conservée après rechargement');
    await pb.screenshot({ path: path.join(SHOTS, 'accueil-ordinateur.png') });

    // ── Rendu clair / sombre, pas de débordement ──
    console.log('Rendu');
    for (const scheme of ['light', 'dark']) {
      const C = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme });
      const pc = await C.newPage();
      pc.on('pageerror', e => pageErrors.push(scheme + ' : ' + e.message));
      await pc.goto(URL); await pc.waitForTimeout(400);
      let ok = true;
      for (const tab of ['home', 'collection', 'stats', 'settings']) {
        await pc.click(`[data-tab="${tab}"]`); await pc.waitForTimeout(400);
        ok = ok && await noHorizontalOverflow(pc);
        await pc.screenshot({ path: path.join(SHOTS, `${tab}-${scheme}.png`) });
      }
      await pc.click('[data-tab="home"]'); await pc.click('[data-action="defi"]'); await pc.waitForTimeout(300);
      ok = ok && await noHorizontalOverflow(pc);
      await pc.screenshot({ path: path.join(SHOTS, `defi-${scheme}.png`) });
      await pc.click('[data-defi-lvl="4"]'); await pc.click('[data-defi-dir="r"]'); await pc.click('[data-action="defi-start"]'); await pc.waitForTimeout(400);
      await pc.click('[data-defi-answer] >> nth=0'); await pc.waitForTimeout(200);
      ok = ok && await noHorizontalOverflow(pc);
      await pc.screenshot({ path: path.join(SHOTS, `defi-jeu-${scheme}.png`) });
      await pc.click('[data-action="defi-quit"]');
      check(ok, `thème ${scheme === 'light' ? 'clair' : 'sombre'} : aucun débordement horizontal à 390 px`);
      await C.close();
    }
    check(pageErrors.length === 0, 'aucune erreur JavaScript' + (pageErrors.length ? ' : ' + pageErrors.join(' | ') : ''));
  } catch (e) {
    failures.push('exception : ' + (e && e.stack || e));
    console.error(e);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(failures.length ? `\nÉCHEC : ${failures.length} vérification(s) en erreur.` : `\nOK : tout passe. Captures dans ${path.relative(ROOT, SHOTS)}/`);
  process.exit(failures.length ? 1 : 0);
})();
