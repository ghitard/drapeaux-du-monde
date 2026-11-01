// Rend assets/flags/*.svg en PNG (pour le calcul des sosies) : npm i -D @resvg/resvg-js && node scripts/tools/render-flags.js <dossierPNG> [hauteur=96]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const SRC = path.join(__dirname, '..', '..', 'assets', 'flags');
const out = process.argv[2];
const height = parseInt(process.argv[3] || '96', 10);
if (!out) { console.error('Indique un dossier de sortie.'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(SRC).filter(x => x.endsWith('.svg'))) {
  const r = new Resvg(fs.readFileSync(path.join(SRC, f)), { fitTo: { mode: 'height', value: height } });
  fs.writeFileSync(path.join(out, f.replace(/\.svg$/, '.png')), r.render().asPng());
  n++;
}
console.log(n, 'PNG écrits dans', out);
