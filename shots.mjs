// Captures the entry's screenshots from the app itself: a static server over app/, then headless Chromium at the
// viewports the gate allows (long side at most 1280, short side at least 480), each scene a fixed `?shot=` URL.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/browser-sandbox/vcp-browser/loom/node_modules/playwright/index.mjs';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, path === '/' ? '/index.html' : path);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(8137, '127.0.0.1', r));

const SHOTS = [
  { name: '1-cover.jpg', query: '?shot=cover&size=tall&grade=sunset&caption=Vice%20City%20Nights&photos=pier,boulevard,skyline', w: 1024, h: 1280 },
  { name: '2-editor.jpg', query: '?shot=editor&size=tall&grade=sunset&caption=Vice%20City%20Nights&photos=pier,boulevard,skyline', w: 1280, h: 800 },
  { name: '3-cover-wide.jpg', query: '?shot=cover&size=wide&grade=neon&caption=Neon%20Runners&photos=skyline,pier,boulevard', w: 1280, h: 720 },
  { name: '4-cover-square.jpg', query: '?shot=cover&size=square&grade=noir&caption=After%20Midnight&photos=boulevard,skyline,pier', w: 1024, h: 1024 },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: '/root/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
for (const shot of SHOTS) {
  const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:8137/${shot.query}`);
  await page.waitForFunction('window.__shotReady === true', null, { timeout: 20000 });
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(root, '..', 'screenshots', shot.name), type: 'jpeg', quality: 90 });
  console.log('shot', shot.name, shot.w + 'x' + shot.h);
  await page.close();
}
await browser.close();
server.close();
