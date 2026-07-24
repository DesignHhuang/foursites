import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const sites = [
  { slug: 'air-condition', url: 'https://air-condition.pages.dev/' },
  { slug: 'oled-tv', url: 'https://oled-tv.pages.dev/' },
  { slug: 'wn5-console', url: 'https://wn5-console.pages.dev/' },
  { slug: 'domino-pitch', url: 'https://domino-pitch.pages.dev/' }
];

const chromeCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];

const bundledNodeModules = [
  'C:/Users/huangxiaomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
];

function requireFromCandidates(name) {
  try {
    return createRequire(import.meta.url)(name);
  } catch {
    for (const dir of bundledNodeModules) {
      const pnpmPkg = path.join(dir, '.pnpm', 'node_modules', name, 'package.json');
      if (existsSync(pnpmPkg)) return createRequire(pnpmPkg)(name);

      const pkg = path.join(dir, name, 'package.json');
      if (!existsSync(pkg)) continue;
      return createRequire(pkg)(name);
    }
  }
  throw new Error(`Cannot load ${name}. Install it with "npm.cmd i -D ${name}" or run inside Codex runtime.`);
}

function findChrome() {
  const found = chromeCandidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error('Chrome or Edge executable was not found.');
  }
  return found;
}

function localPathFor(siteUrl, assetUrl) {
  const site = new URL(siteUrl);
  const asset = new URL(assetUrl);
  if (asset.origin === site.origin) {
    let pathname = decodeURIComponent(asset.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (pathname === '') pathname = '/index.html';
    if (pathname === '/') pathname = '/index.html';
    return pathname.replace(/^\/+/, '');
  }

  const hash = createHash('sha1').update(asset.href).digest('hex').slice(0, 10);
  const ext = path.extname(asset.pathname) || '.bin';
  const name = path.basename(asset.pathname, ext) || 'asset';
  return path.join('external', asset.hostname, `${name}-${hash}${ext}`);
}

function normalizeIndexHtml(buffer) {
  let html = buffer.toString('utf8');
  html = html.replace(/<script\b[^>]*src=["']https:\/\/static\.cloudflareinsights\.com\/[^"']+["'][^>]*>\s*<\/script>/gi, '');
  return Buffer.from(html);
}

async function saveResponse(site, response, files) {
  const url = response.url();
  const status = response.status();
  if (status < 200 || status >= 400) return;
  if (!/^https?:/.test(url)) return;

  const localPath = localPathFor(site.url, url);
  if (files.has(localPath)) return;

  let body;
  try {
    body = await response.body();
  } catch {
    return;
  }

  if (localPath.replaceAll('\\', '/') === 'index.html') {
    body = normalizeIndexHtml(body);
  }

  files.set(localPath, {
    url,
    status,
    contentType: response.headers()['content-type'] || '',
    bytes: body
  });
}

async function mirrorSite(browser, site) {
  const outDir = path.join(rootDir, site.slug);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const files = new Map();
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'
  });

  page.on('response', (response) => {
    saveResponse(site, response, files).catch(() => {});
  });

  await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const html = await page.content();
  if (!files.has('index.html')) {
    files.set('index.html', {
      url: site.url,
      status: 200,
      contentType: 'text/html; charset=utf-8',
      bytes: Buffer.from(html)
    });
  }

  await page.close();

  const manifest = [];
  for (const [localPath, file] of [...files.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const target = path.join(outDir, localPath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.bytes);
    manifest.push({
      path: localPath.replaceAll('\\', '/'),
      url: file.url,
      contentType: file.contentType,
      bytes: file.bytes.length
    });
  }

  await writeFile(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify({ source: site.url, generatedAt: new Date().toISOString(), files: manifest }, null, 2)}\n`
  );

  return { site: site.slug, files: manifest.length };
}

const { chromium } = requireFromCandidates('playwright-core');
const browser = await chromium.launch({
  headless: true,
  executablePath: findChrome()
});

try {
  for (const site of sites) {
    const result = await mirrorSite(browser, site);
    console.log(`${result.site}: ${result.files} files`);
  }
} finally {
  await browser.close();
}
