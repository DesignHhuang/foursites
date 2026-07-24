import { createReadStream, existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = ['air-condition', 'oled-tv', 'wn5-console', 'domino-pitch'];
const requestedSite = process.argv[2];
const requestedPort = Number(process.argv[3]);

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.ico', 'image/x-icon'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function getMime(filePath) {
  return MIME.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'cross-origin-embedder-policy': 'credentialless',
    'cross-origin-opener-policy': 'same-origin'
  });
  res.end(body);
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.resolve(base, normalized.replace(/^[/\\]+/, ''));
  return resolved.startsWith(base) ? resolved : null;
}

function serveOne(site, port) {
  const base = path.join(rootDir, site);
  if (!existsSync(path.join(base, 'index.html'))) {
    throw new Error(`Missing ${site}/index.html. Run "npm.cmd run download" first.`);
  }

  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let target = safeJoin(base, url.pathname);
    if (!target) {
      send(res, 403, 'Forbidden');
      return;
    }

    if (!existsSync(target) || (existsSync(target) && statSync(target).isDirectory())) {
      const withIndex = path.join(target, 'index.html');
      target = existsSync(withIndex) ? withIndex : path.join(base, 'index.html');
    }

    if (!existsSync(target)) {
      send(res, 404, 'Not found');
      return;
    }

    res.writeHead(200, {
      'content-type': getMime(target),
      'cache-control': 'no-store',
      'cross-origin-embedder-policy': 'credentialless',
      'cross-origin-opener-policy': 'same-origin'
    });
    createReadStream(target).pipe(res);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`${site}: http://127.0.0.1:${port}/`);
  });

  return server;
}

if (requestedSite) {
  if (!sites.includes(requestedSite)) {
    console.error(`Unknown site "${requestedSite}". Use one of: ${sites.join(', ')}`);
    process.exit(1);
  }
  serveOne(requestedSite, requestedPort || 4173);
} else {
  const dirs = await readdir(rootDir, { withFileTypes: true });
  const missing = sites.filter((site) => !dirs.some((dir) => dir.isDirectory() && dir.name === site));
  if (missing.length) {
    console.error(`Missing site folders: ${missing.join(', ')}. Run "npm.cmd run download" first.`);
    process.exit(1);
  }

  sites.forEach((site, index) => serveOne(site, 4173 + index));
}
