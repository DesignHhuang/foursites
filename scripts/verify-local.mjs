import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = [
  { slug: 'air-condition', port: 4173, title: '北极风' },
  { slug: 'oled-tv', port: 4174, title: '极夜' },
  { slug: 'wn5-console', port: 4175, title: '白夜五号' },
  { slug: 'domino-pitch', port: 4176, title: '多米诺球场' }
];

function requireFromCandidates(name) {
  try {
    return createRequire(import.meta.url)(name);
  } catch {
    const dir = 'C:/Users/huangxiaomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
    const pnpmPkg = path.join(dir, '.pnpm', 'node_modules', name, 'package.json');
    if (existsSync(pnpmPkg)) return createRequire(pnpmPkg)(name);

    const pkg = path.join(dir, name, 'package.json');
    if (existsSync(pkg)) return createRequire(pkg)(name);
  }
  throw new Error(`Cannot load ${name}. Install it with "npm.cmd i -D ${name}" or run inside Codex runtime.`);
}

function waitForServer(port) {
  const url = `http://127.0.0.1:${port}/`;
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // keep polling
      }
      if (Date.now() - started > 15000) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  cwd: rootDir,
  stdio: ['ignore', 'pipe', 'pipe']
});

const logs = [];
server.stdout.on('data', (chunk) => logs.push(chunk.toString()));
server.stderr.on('data', (chunk) => logs.push(chunk.toString()));

try {
  await Promise.all(sites.map((site) => waitForServer(site.port)));

  const { chromium } = requireFromCandidates('playwright-core');
  const chromeCandidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ];
  const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    for (const site of sites) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(`http://127.0.0.1:${site.port}/`, { waitUntil: 'networkidle', timeout: 45000 });
      const title = await page.title();
      const canvasCount = await page.locator('canvas').count();
      const body = await page.locator('body').innerText({ timeout: 5000 });
      const ok = title.includes(site.title) && canvasCount > 0 && body.length > 100 && errors.length === 0;
      console.log(`${ok ? 'OK' : 'FAIL'} ${site.slug}: title="${title}", canvas=${canvasCount}, errors=${errors.length}`);
      if (!ok) {
        if (!title.includes(site.title)) console.log(`  title did not contain ${site.title}`);
        if (canvasCount === 0) console.log('  no canvas found');
        if (body.length <= 100) console.log('  body text looked empty');
        for (const error of errors.slice(0, 5)) console.log(`  ${error}`);
        process.exitCode = 1;
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}

if (process.exitCode) {
  console.log(logs.join('').trim());
}
