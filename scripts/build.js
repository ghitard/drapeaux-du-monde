// Construit le site publiable (PWA installable, hors ligne) sans aucune dépendance.
//   node scripts/build.js          → dist/       (production : hooks de test retirés)
//   node scripts/build.js --test   → dist-test/  (garde window.__det pour les tests)
// Chemins relatifs partout : le site marche à la racine d'un domaine comme sous /drapeaux/ (GitHub Pages).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ASSETS = path.join(ROOT, 'assets');
const TEST = process.argv.includes('--test');
const OUT = path.join(ROOT, TEST ? 'dist-test' : 'dist');

const { ZONES, FLAGS, GROUPS, NAME_PAIRS } = require(path.join(SRC, 'data.js'));
const meta = JSON.parse(fs.readFileSync(path.join(ASSETS, 'flags-meta.json'), 'utf8'));
const nb = JSON.parse(fs.readFileSync(path.join(ASSETS, 'neighbors.json'), 'utf8'));

// ── contrôles avant build ──
const problems = [];
for (const f of FLAGS) {
  if (!fs.existsSync(path.join(ASSETS, 'flags', f.c + '.svg'))) problems.push(`drapeau manquant : assets/flags/${f.c}.svg`);
  if (!meta[f.c] || !(meta[f.c].ratio > 0)) problems.push(`ratio manquant dans assets/flags-meta.json : ${f.c}`);
  if (!Array.isArray(nb[f.c])) problems.push(`voisins manquants dans assets/neighbors.json : ${f.c}`);
}
if (problems.length) { console.error('Build impossible :\n- ' + problems.join('\n- ')); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['flags', 'icons', 'fonts']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

// ── fichiers statiques ──
const codes = new Set(FLAGS.map(f => f.c));
for (const c of codes) fs.copyFileSync(path.join(ASSETS, 'flags', c + '.svg'), path.join(OUT, 'flags', c + '.svg'));
for (const f of fs.readdirSync(path.join(ASSETS, 'icons'))) fs.copyFileSync(path.join(ASSETS, 'icons', f), path.join(OUT, 'icons', f));
for (const f of fs.readdirSync(path.join(ASSETS, 'fonts'))) fs.copyFileSync(path.join(ASSETS, 'fonts', f), path.join(OUT, 'fonts', f));

// ── polices auto-hébergées (Lexend, Lexend Exa ; sous-ensembles latin et latin-ext) ──
const RANGES = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};
let fontCss = '';
for (const [pkg, family] of [['lexend', 'Lexend'], ['lexend-exa', 'Lexend Exa']]) {
  for (const sub of ['latin', 'latin-ext']) {
    const file = `${pkg}-${sub}-wght-normal.woff2`;
    fontCss += `@font-face{font-family:"${family}";font-style:normal;font-display:swap;font-weight:100 900;src:url(fonts/${file}) format("woff2");unicode-range:${RANGES[sub]}}\n`;
  }
}

// ── page ──
const flags = FLAGS.map(f => Object.assign({}, f, { r: meta[f.c].ratio, nb: nb[f.c].filter(x => codes.has(x)).slice(0, 8) }));
const DATA = { zones: ZONES, flags, groups: GROUPS, namePairs: NAME_PAIRS };
const css = fs.readFileSync(path.join(SRC, 'app.css'), 'utf8');
const engine = fs.readFileSync(path.join(SRC, 'engine.js'), 'utf8').replace(/\nif \(typeof module[^\n]*\n?/, '\n');
let app = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
if (!TEST) {
  const stripped = app.replace(/\n\/\/ tests \(hors production\)\n[^\n]*\n/, '\n');
  if (stripped === app) { console.error('Build impossible : le bloc « // tests (hors production) » est introuvable dans src/app.js.'); process.exit(1); }
  app = stripped;
}
const webCss = `
/* version web autonome : coque plein écran et zones sûres du téléphone */
html, body { height: 100%; }
body { margin: 0; overflow: hidden; overscroll-behavior: none; }
img { max-width: 100%; }
[hidden] { display: none !important; }
#app { box-sizing: border-box; height: 100%; height: 100dvh; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
textarea.backup, .search { box-sizing: border-box; }
`;
const version = crypto.createHash('sha256').update(css + engine + app + JSON.stringify(DATA)).digest('hex').slice(0, 10);
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Drapeaux en tête</title>
<meta name="description" content="Apprends les drapeaux du monde avec la répétition espacée : 231 pays et territoires, rappel actif et duels de sosies.">
<meta name="theme-color" content="#edf1f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a101a" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Drapeaux">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" href="fonts/lexend-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>
${fontCss}${css}
${webCss}
</style>
</head>
<body>
<div id="app">
  <header class="topbar"><div class="wordmark">Drapeaux en tête</div><span class="chip-streak" id="streak" role="status"></span></header>
  <main id="view" tabindex="-1"></main>
  <nav class="tabbar" aria-label="Navigation principale"></nav>
</div>
<noscript><p style="padding:24px">Active JavaScript pour utiliser Drapeaux en tête.</p></noscript>
<script>
const BUILD = ${JSON.stringify({ target: 'web', version })};
const DATA = ${JSON.stringify(DATA)};
</script>
<script>
${engine}
</script>
<script>
${app}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// ── manifest (installation sur l'écran d'accueil) ──
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  id: './',
  name: 'Drapeaux en tête',
  short_name: 'Drapeaux',
  description: 'Apprends les drapeaux du monde avec la répétition espacée.',
  lang: 'fr',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#edf1f5',
  theme_color: '#edf1f5',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// ── service worker : page « réseau d'abord » (mises à jour), le reste « cache d'abord » ; 231 drapeaux précachés ──
const core = ['./', './index.html', './manifest.webmanifest',
  ...fs.readdirSync(path.join(OUT, 'icons')).map(f => './icons/' + f),
  ...fs.readdirSync(path.join(OUT, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => './fonts/' + f)];
const flagUrls = [...codes].map(c => './flags/' + c + '.svg');
const sw = `// Drapeaux en tête : fonctionnement hors ligne (généré par scripts/build.js, ne pas modifier à la main)
const CACHE = 'drapeaux-${version}';
const CORE = ${JSON.stringify(core)};
const FLAGS = ${JSON.stringify(flagUrls)};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map((u) => new Request(u, { cache: 'reload' })));
    await Promise.all(FLAGS.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('drapeaux-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isShell = req.mode === 'navigate' || /\\/(index\\.html)?$/.test(url.pathname);
  if (isShell) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const network = fetch(req).then(async (res) => {
        if (res && res.ok) await cache.put('./index.html', res.clone());
        return res;
      });
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3500));
      try {
        const res = await Promise.race([network, timeout]);
        if (res) return res;
      } catch (e) { /* hors ligne */ }
      const cached = (await cache.match('./index.html')) || (await cache.match('./'));
      if (cached) return cached;
      return network;
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  })());
});
`;
fs.writeFileSync(path.join(OUT, 'sw.js'), sw);

// ── aides d'hébergement ──
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, '_headers'), `/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
/manifest.webmanifest
  Content-Type: application/manifest+json
`);
fs.copyFileSync(path.join(ROOT, 'CREDITS.md'), path.join(OUT, 'CREDITS.md'));

let total = 0, files = 0;
const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else { total += s.size; files++; } } };
walk(OUT);
console.log(`${path.relative(ROOT, OUT)}/ prêt : version ${version}, ${files} fichiers, ${Math.round(total / 1024)} Ko (page ${Math.round(html.length / 1024)} Ko, ${flagUrls.length} drapeaux).`);
