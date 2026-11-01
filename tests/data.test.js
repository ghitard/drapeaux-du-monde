// Contrôles de cohérence des données (node --test). Aucun accès réseau, aucune dépendance.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ZONES, FLAGS, GROUPS, NAME_PAIRS } = require('../src/data.js');

const ASSETS = path.join(__dirname, '..', 'assets');
const meta = JSON.parse(fs.readFileSync(path.join(ASSETS, 'flags-meta.json'), 'utf8'));
const nb = JSON.parse(fs.readFileSync(path.join(ASSETS, 'neighbors.json'), 'utf8'));
const BY = Object.fromEntries(FLAGS.map(f => [f.c, f]));

// Copie de norm() de src/app.js : la garder identique si on la modifie là-bas.
function norm(s) {
  s = String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/&/g, ' et ').replace(/[’'`´.\-–—_,()]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(les|la|le|l|the) /, '');
  s = s.replace(/^(iles?|isle) /, '');
  s = s.replace(/^(de|du|des|d|of) /, '');
  s = s.replace(/\bst\b/g, 'saint').replace(/\bste\b/g, 'sainte');
  return s;
}

test('231 entrées : 194 pays, 3 à reconnaissance limitée, 34 territoires', () => {
  assert.strictEqual(FLAGS.length, 231);
  assert.strictEqual(FLAGS.filter(f => !f.t).length, 194);
  assert.strictEqual(FLAGS.filter(f => f.t === 'lim').length, 3);
  assert.strictEqual(FLAGS.filter(f => f.t === 'terr').length, 34);
});

test('codes uniques et champs obligatoires présents', () => {
  const seen = new Set();
  for (const f of FLAGS) {
    assert.ok(!seen.has(f.c), 'code en double : ' + f.c); seen.add(f.c);
    assert.match(f.c, /^[A-Z]{2}(-[A-Z]{3})?$/, 'code invalide : ' + f.c);
    for (const k of ['n', 'cap', 'ct', 'i']) assert.ok(typeof f[k] === 'string' && f[k].trim(), `${f.c} : champ ${k} manquant`);
    assert.ok(ZONES[f.ct], `${f.c} : zone inconnue ${f.ct}`);
    assert.ok([1, 2, 3, 4].includes(f.f), `${f.c} : notoriété f doit valoir 1 à 4`);
    if (f.t) {
      assert.ok(['terr', 'lim'].includes(f.t), `${f.c} : t doit être 'terr' ou 'lim'`);
      assert.ok(typeof f.s === 'string' && f.s.trim(), `${f.c} : statut s obligatoire pour un territoire ou un État à reconnaissance limitée`);
    }
    if (f.a) assert.ok(Array.isArray(f.a), `${f.c} : a doit être une liste`);
  }
});

test('chaque drapeau a son fichier SVG, son ratio et ses voisins', () => {
  for (const f of FLAGS) {
    const file = path.join(ASSETS, 'flags', f.c + '.svg');
    assert.ok(fs.existsSync(file), 'fichier manquant : ' + file);
    const svg = fs.readFileSync(file, 'utf8');
    assert.ok(/viewBox=/.test(svg.slice(0, 600)), `${f.c}.svg : viewBox manquant`);
    assert.ok(!/<script|javascript:|foreignObject/i.test(svg), `${f.c}.svg : contenu actif interdit`);
    assert.ok(meta[f.c] && meta[f.c].ratio > 0.5 && meta[f.c].ratio < 5, `${f.c} : ratio absent ou aberrant`);
    assert.ok(Array.isArray(nb[f.c]) && nb[f.c].length >= 6, `${f.c} : voisins visuels manquants`);
    for (const x of nb[f.c]) assert.ok(BY[x] && x !== f.c, `${f.c} : voisin invalide ${x}`);
  }
});

test('noms et alias acceptés à la saisie : pas de collision entre deux entrées', () => {
  const owner = {};
  for (const f of FLAGS) for (const nm of [f.n, ...(f.a || [])]) {
    const k = norm(nm);
    assert.ok(k, `${f.c} : nom vide après normalisation (${nm})`);
    assert.ok(!owner[k] || owner[k] === f.c, `« ${nm} » (${f.c}) entre en collision avec ${owner[k]}`);
    owner[k] = f.c;
  }
});

test('groupes de sosies et paires de noms valides', () => {
  for (const g of GROUPS) {
    assert.ok(g.m.length >= 2, 'groupe trop petit : ' + g.m.join(','));
    assert.ok(typeof g.tip === 'string' && g.tip.length > 20, 'astuce manquante : ' + g.m.join(','));
    for (const c of g.m) assert.ok(BY[c], 'code inconnu dans GROUPS : ' + c);
  }
  for (const p of NAME_PAIRS) for (const c of p) assert.ok(BY[c], 'code inconnu dans NAME_PAIRS : ' + c);
});

test('faits récents déjà vérifiés (ne pas régresser sans source)', () => {
  assert.strictEqual(BY.GQ.cap, 'Ciudad de la Paz');      // transfert officiel de la capitale, janvier 2026
  assert.ok(/2025/.test(BY.SY.i));                          // drapeau syrien vert-blanc-noir officiel depuis 2025
  assert.ok(/2023/.test(BY.KG.i));                          // Kirghizistan : rayons droits depuis 2023
  assert.strictEqual(BY['GB-ENG'].t, 'terr');
  assert.strictEqual(BY.XK.t, 'lim');
});
