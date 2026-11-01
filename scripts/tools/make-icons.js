// Régénère les icônes (optionnel) : npm i -D @resvg/resvg-js && node scripts/tools/make-icons.js [dossier=assets/icons]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const out = process.argv[2] || path.join(__dirname, '..', '..', 'assets', 'icons');
fs.mkdirSync(out, { recursive: true });

const NAVY = '#14305c', YELLOW = '#f2b705', BLUE = '#86b6ef', WHITE = '#ffffff';
// logo drawn in a 24-unit box: pole + swallow-tailed flag (blue hoist, yellow fly)
function logo(scale, cx, cy) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(-11.5 -12)">
    <path d="M5 2.5v19" stroke="${WHITE}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M6 4h13l-3.2 4.5L19 13H6z" fill="${YELLOW}"/>
    <path d="M6 4h6.5v9H6z" fill="${BLUE}"/>
  </g>`;
}
function svg({ size = 512, radius = 0, logoFrac = 0.62 }) {
  const scale = size * logoFrac / 19;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY}"/>
  ${logo(scale, size / 2, size / 2)}
</svg>`;
}
function png(svgText, px, file) {
  const r = new Resvg(svgText, { fitTo: { mode: 'width', value: px }, background: 'rgba(0,0,0,0)' });
  fs.writeFileSync(path.join(out, file), r.render().asPng());
}
const any = svg({ size: 512, radius: 0, logoFrac: 0.62 });
const maskable = svg({ size: 512, radius: 0, logoFrac: 0.5 });   // logo inside the 80 % safe zone
const fav = svg({ size: 512, radius: 112, logoFrac: 0.7 });
png(any, 192, 'icon-192.png');
png(any, 512, 'icon-512.png');
png(maskable, 512, 'icon-maskable-512.png');
png(any, 180, 'apple-touch-icon.png');
png(fav, 32, 'favicon-32.png');
fs.writeFileSync(path.join(out, 'favicon.svg'), fav.replace(/\n\s*/g, ''));
console.log('icons written to', out, fs.readdirSync(out).join(' '));
