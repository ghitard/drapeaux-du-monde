// Régénère assets/flags/*.svg et assets/flags-meta.json depuis les sources (optionnel, rarement utile).
//   npm i -D svgo
//   git clone --depth 1 --filter=blob:none --sparse https://github.com/googlefonts/noto-emoji.git /tmp/noto && (cd /tmp/noto && git sparse-checkout set third_party/region-flags)
//   npm i --no-save flag-icons   (pour le Kirghizistan 2023)
//   node scripts/tools/prep-flags.mjs --noto /tmp/noto/third_party/region-flags/svg --flag-icons node_modules/flag-icons/flags/4x3 [CODE ...]
// Sans liste de codes : tous les drapeaux de src/data.js. Après coup : relancer render-flags + similarity si les visuels changent, puis npm test.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
const NOTO = opt('--noto');
const FI = opt('--flag-icons');
if (!NOTO) { console.error('Indique --noto <dossier region-flags/svg>'); process.exit(1); }
const { FLAGS } = require(path.join(ROOT, 'src', 'data.js'));
const codes = args.length ? args : FLAGS.map(f => f.c);
const OUT = path.join(ROOT, 'assets', 'flags');
const META = path.join(ROOT, 'assets', 'flags-meta.json');
const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};

const rootTag = svg => { const m = svg.match(/<svg\b[^>]*>/s); if (!m) throw new Error('pas de balise <svg>'); return m[0]; };
const attr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*"([^"]*)"')); return m ? m[1] : null; };
const setAttr = (tag, name, value) => attr(tag, name) !== null
  ? tag.replace(new RegExp('(\\s' + name + '\\s*=\\s*")([^"]*)(")'), `$1${value}$3`)
  : tag.replace(/^<svg\b/, `<svg ${name}="${value}"`);

function kyrgyzstan2023() {
  // flag-icons a le dessin de décembre 2023 (rayons droits) en 4:3 : recadrage aux proportions officielles 3:5.
  if (!FI) throw new Error('KG : indique --flag-icons <dossier flags/4x3>');
  let svg = fs.readFileSync(path.join(FI, 'kg.svg'), 'utf8');
  svg = svg.replace('viewBox="0 0 640 480"', 'viewBox="-80 0 800 480" width="800" height="480"');
  svg = svg.replace('<path fill="red" d="M0 0h640v480H0Z"/>', '<path fill="#e8112d" d="M-80 0h800v480H-80Z"/>');
  return svg.replace(/fill="red"/g, 'fill="#e8112d"').replace(/fill="#ff0"/g, 'fill="#ffef00"');
}
function pakistanStar(svg) {
  // étoile définie avec des coordonnées géantes et une échelle 1e-5 : on « cuit » la transformation.
  const pts = [[0, -513674], [301930, 415571], [-488533, -158734], [488533, -158734], [-301930, 415571]];
  const k = 0.00001557408;
  const rot = (p, deg) => { const a = deg * Math.PI / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; };
  const out = pts.map(p => { let q = rot([p[0] * k, p[1] * k], 18); q = rot([q[0] + 16, q[1]], -41.63354); return q.map(v => v.toFixed(3)).join(','); });
  return svg.replace(/<polygon points="0,-513674[^>]*\/>/, `<polygon points="${out.join(' ')}" fill="#fff"/>`);
}

for (const code of codes) {
  let svg = code === 'KG' ? kyrgyzstan2023() : fs.readFileSync(fs.realpathSync(path.join(NOTO, code + '.svg')), 'utf8');
  if (code === 'PK') svg = pakistanStar(svg);
  let tag = rootTag(svg);
  let vb = attr(tag, 'viewBox');
  const w = parseFloat(attr(tag, 'width')), h = parseFloat(attr(tag, 'height'));
  if (!vb) { if (!(w > 0 && h > 0)) throw new Error(code + ' : ni viewBox ni taille'); vb = `0 0 ${w} ${h}`; tag = setAttr(tag, 'viewBox', vb); }
  const [, , vw, vh] = vb.trim().split(/[\s,]+/).map(Number);
  const stretched = attr(tag, 'preserveAspectRatio') === 'none' && w > 0 && h > 0;   // Qatar
  const ratio = stretched ? w / h : vw / vh;
  tag = setAttr(tag, 'width', String(Math.round(300 * ratio)));
  tag = setAttr(tag, 'height', '300');
  svg = svg.replace(/<svg\b[^>]*>/s, tag);
  svg = svg.replace(/<foreignObject\b[^>]*\/>/g, '').replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/g, '');  // restes d'Illustrator
  const run = p => optimize(svg, { multipass: true, floatPrecision: p, plugins: ['preset-default'] }).data;
  let out = run(3);
  if (out.length > 40000) out = run(2);
  if (!/viewBox=/.test(rootTag(out))) throw new Error(code + ' : viewBox perdu');
  fs.writeFileSync(path.join(OUT, code + '.svg'), out);
  meta[code] = { ratio: +ratio.toFixed(4), bytes: out.length };
}
fs.writeFileSync(META, JSON.stringify(meta));
console.log(`${codes.length} drapeau(x) écrit(s) dans assets/flags, ratios mis à jour.`);
