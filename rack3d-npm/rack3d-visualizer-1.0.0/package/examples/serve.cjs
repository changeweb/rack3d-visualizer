#!/usr/bin/env node
// Simple static dev server — no dependencies needed
// Usage: node examples/serve.cjs [port]
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.argv[2] || 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.mjs':  'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.map': 'application/json',
  '.ts':   'application/typescript', '.jsx': 'application/javascript',
  '.svg':  'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let url = req.url === '/' ? '/examples/basic/index.html' : req.url;
  const filePath = path.join(ROOT, url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${url}`);
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  rack3d-visualizer dev server\n`);
  console.log(`  Basic example:   http://localhost:${PORT}/examples/basic/`);
  console.log(`  Vanilla example: http://localhost:${PORT}/examples/vanilla/`);
  console.log(`  Documentation:   http://localhost:${PORT}/docs/\n`);
});
