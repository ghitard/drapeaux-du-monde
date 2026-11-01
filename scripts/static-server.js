// Petit serveur statique sans dépendance, utilisé par `npm run serve` et par le test de bout en bout.
// createStaticServer(dir, basePath) sert `dir` sous `basePath` (ex. '/drapeaux/' pour imiter GitHub Pages).
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function createStaticServer(dir, basePath = '/') {
  const root = path.resolve(dir);
  return http.createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!urlPath.startsWith(basePath)) {
      if (urlPath + '/' === basePath) { res.writeHead(301, { Location: basePath }); return res.end(); }
      res.writeHead(404); return res.end('Not found');
    }
    let rel = urlPath.slice(basePath.length);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  });
}

module.exports = { createStaticServer };
