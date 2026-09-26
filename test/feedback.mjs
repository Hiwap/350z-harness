#!/usr/bin/env node
/**
 * "Send feedback" button + dialog (browser, offline). Never touches the live Worker or Turnstile:
 * every request to *.workers.dev / challenges.cloudflare.com / github.com is aborted and counted.
 *  - button sits right after <footer id="pageFooter"> (outside it), relabels es/en/ja from I18N
 *  - dialog opens (focus in textarea) and closes via Cancel and Esc
 *  - GitHub fallback link targets Hiwap/350z-harness/issues/new and is prefilled with the message
 *  - Worker URL / Turnstile site key are configured (no REPLACE_ME), print CSS hides the button
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const HTML = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const GH_NEW = 'https://github.com/Hiwap/350z-harness/issues/new';
const WORKER = 'https://z33-harness-feedback.hiwap.workers.dev/feedback';

function loadPuppeteer() {
  for (const dir of [path.join(root, 'node_modules/puppeteer-core'), path.join(process.env.TEMP || '/tmp', 'z33-verify/node_modules/puppeteer-core'), '/tmp/z33-verify/node_modules/puppeteer-core']) {
    try { return require(dir); } catch (e) { /* next */ }
  }
  return require('puppeteer-core');
}
function findChrome() {
  for (const p of [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean)) if (fs.existsSync(p)) return p;
  throw new Error('Chrome/Edge not found');
}

let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) pass++; else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };

// static
ok('WORKER_URL is the deployed Worker /feedback', HTML.includes(`const WORKER_URL = '${WORKER}';`));
ok('TURNSTILE_SITEKEY set (no placeholder)', /const TURNSTILE_SITEKEY = '0x[0-9A-Za-z_-]{10,}';/.test(HTML) && !/const (WORKER_URL|TURNSTILE_SITEKEY) = '[^']*REPLACE_ME/.test(HTML));
ok('GitHub fallback constant targets Hiwap/350z-harness/issues/new', HTML.includes(`const GH_NEW_ISSUE = '${GH_NEW}';`));
ok('print CSS hides the feedback row and dialog', /@media print \{ \.fb-row, #feedbackDialog \{ display: none !important; \} \}/.test(HTML));
ok('button markup comes right after </footer>', /<\/footer>\n<div class="fb-row" id="feedbackRow">/.test(HTML));

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
const blocked = [];
await page.setRequestInterception(true);
page.on('request', (req) => {
  const u = req.url();
  if (/workers\.dev|challenges\.cloudflare\.com|github\.com/.test(u)) { blocked.push(u); req.abort(); }
  else req.continue();
});
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#feedbackBtn');
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#feedbackBtn');

const pos = await page.evaluate(() => {
  const f = document.getElementById('pageFooter'), row = document.getElementById('feedbackRow'), b = document.getElementById('feedbackBtn');
  return { inside: f.contains(b), after: !!(f.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING), adjacent: f.nextElementSibling === row,
    below: row.getBoundingClientRect().top >= f.getBoundingClientRect().top, visible: b.offsetWidth > 0 && b.offsetHeight > 0 };
});
ok('button is outside the footer, immediately after it, visible', !pos.inside && pos.after && pos.adjacent && pos.below && pos.visible, JSON.stringify(pos));

const expect = { es: 'Enviar feedback', en: 'Send feedback', ja: 'フィードバックを送る' };
for (const lg of ['en', 'ja', 'es']) {
  await page.select('#lang', lg);
  const st = await page.evaluate((lg) => ({ btn: document.getElementById('feedbackBtn').textContent.trim(), i18n: I18N[lg].fbBtn,
    title: document.getElementById('fbTitle').textContent.trim(), cancel: document.getElementById('fbCancel').textContent.trim(), cancelI18n: I18N[lg].fbCancel,
    footer: document.getElementById('pageFooter').textContent.trim(), footerI18n: I18N[lg].footer }), lg);
  ok(`[${lg}] button relabels to "${expect[lg]}" (I18N.fbBtn)`, st.btn === expect[lg] && st.btn === st.i18n, JSON.stringify(st));
  ok(`[${lg}] dialog title / Cancel relabel`, st.title === st.i18n && st.cancel === st.cancelI18n, JSON.stringify(st));
  ok(`[${lg}] footer disclaimer intact`, st.footer === st.footerI18n);
}

// open / close
const isOpen = () => page.evaluate(() => document.getElementById('feedbackDialog').open);
await page.click('#feedbackBtn');
await page.waitForFunction(() => document.getElementById('feedbackDialog').open, { timeout: 3000 }).catch(() => {});
ok('dialog opens on click', await isOpen());
ok('focus moves to the message box', await page.evaluate(() => document.activeElement && document.activeElement.id === 'fbMsg'));
await page.type('#fbMsg', 'gate test message ECM 54');
const href = await page.evaluate(() => document.getElementById('fbGithubAltLink').href);
ok('fallback link → Hiwap/350z-harness/issues/new, prefilled', href.startsWith(GH_NEW + '?') && /labels=feedback/.test(href) && /gate(\+|%20)test(\+|%20)message/.test(href), href.slice(0, 200));
ok('Send disabled without a Turnstile token (offline)', await page.evaluate(() => document.getElementById('fbSend').disabled));
await page.click('#fbCancel');
await page.waitForFunction(() => !document.getElementById('feedbackDialog').open, { timeout: 3000 }).catch(() => {});
ok('Cancel closes the dialog', !(await isOpen()));
ok('focus returns to the button', await page.evaluate(() => document.activeElement && document.activeElement.id === 'feedbackBtn'));
await page.click('#feedbackBtn');
await page.waitForFunction(() => document.getElementById('feedbackDialog').open, { timeout: 3000 }).catch(() => {});
ok('dialog reopens', await isOpen());
await page.keyboard.press('Escape');
await page.waitForFunction(() => !document.getElementById('feedbackDialog').open, { timeout: 3000 }).catch(() => {});
ok('Esc closes the dialog', !(await isOpen()));
ok('gate never reached the Worker (no POST)', !blocked.some((u) => /workers\.dev/.test(u)), blocked.join(', '));

await browser.close();
console.log(`---\nfeedback: ${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('FEEDBACK OK');
