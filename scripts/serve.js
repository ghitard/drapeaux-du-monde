// Sert un dossier en local : node scripts/serve.js [dossier=dist] [port=8080]
const path = require('path');
const { createStaticServer } = require('./static-server');

const dir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const port = Number(process.argv[3] || 8080);
createStaticServer(dir, '/').listen(port, () => {
  console.log(`Drapeaux en tête : http://localhost:${port}/  (dossier ${dir})`);
  console.log('Ctrl+C pour arrêter.');
});
