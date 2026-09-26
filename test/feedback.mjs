#!/usr/bin/env node
/**
 * "Send feedback" button + dialog (browser, offline). Never touches the live Worker or Turnstile:
 * every request to *.workers.dev / challenges.cloudflare.com / github.com is aborted and counted.
 *  - button sits inline at the end of the footer disclaimer: sibling of the #pageFooter text span that applyLang()
 *    rewrites (never inside it), on the same line at 1280 px; relabels es/en/ja; the disclaimer survives language switches
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
ok('print CSS hides the feedback button and dialog', /@media print \{ #feedbackBtn, \.fb-open, #feedbackDialog \{ display: none !important; \} \}/.test(HTML));
ok('button markup: inside <footer>, right after the #pageFooter text span', /<span id="pageFooter">[^<]*<\/span>\s*<button type="button" class="fb-open" id="feedbackBtn"[^>]*>[^<]*<\/button>\s*<\/footer>/.test(HTML));

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
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

const inlineState = () => page.evaluate(() => {
  const txt = document.getElementById('pageFooter'), b = document.getElementById('feedbackBtn'), foot = txt.parentElement;
  const rects = [...txt.getClientRects()]; const last = rects[rects.length - 1]; const br = b.getBoundingClientRect();
  return { inText: txt.contains(b), sameFooter: foot.tagName === 'FOOTER' && foot.contains(b), next: txt.nextElementSibling === b,
    textLines: rects.length, lastTop: Math.round(last.top), lastBottom: Math.round(last.bottom), lastRight: Math.round(last.right),
    btnTop: Math.round(br.top), btnBottom: Math.round(br.bottom), btnLeft: Math.round(br.left), visible: br.width > 0 && br.height > 0,
    fontPx: [getComputedStyle(b).fontSize, getComputedStyle(foot).fontSize] };
});
const sameLine = (st) => st.visible && !st.inText && st.sameFooter && st.next
  && st.btnTop < st.lastBottom && st.btnBottom > st.lastTop && Math.abs((st.btnTop + st.btnBottom) / 2 - (st.lastTop + st.lastBottom) / 2) <= 4 && st.btnLeft >= st.lastRight;
{
  const st = await inlineState();
  ok('1280 px: button is on the same line as the disclaimer, at its end (sibling of the text span, not inside it)', sameLine(st), JSON.stringify(st));
  ok('button font size matches the footer', st.fontPx[0] === st.fontPx[1], JSON.stringify(st.fontPx));
}

const expect = { es: 'Enviar feedback', en: 'Send feedback', ja: 'フィードバックを送る' };
for (const lg of ['en', 'ja', 'es']) {
  await page.select('#lang', lg);
  const st = await page.evaluate((lg) => ({ btn: document.getElementById('feedbackBtn').textContent.trim(), i18n: I18N[lg].fbBtn,
    title: document.getElementById('fbTitle').textContent.trim(), cancel: document.getElementById('fbCancel').textContent.trim(), cancelI18n: I18N[lg].fbCancel,
    footer: document.getElementById('pageFooter').textContent.trim(), footerI18n: I18N[lg].footer }), lg);
  ok(`[${lg}] button relabels to "${expect[lg]}" (I18N.fbBtn)`, st.btn === expect[lg] && st.btn === st.i18n, JSON.stringify(st));
  ok(`[${lg}] dialog title / Cancel relabel`, st.title === st.i18n && st.cancel === st.cancelI18n, JSON.stringify(st));
  ok(`[${lg}] footer disclaimer survives the language switch`, st.footer === st.footerI18n && st.footer.length > 20, st.footer.slice(0, 60));
  const il = await inlineState();
  ok(`[${lg}] button still inline after the disclaimer at 1280 px`, sameLine(il), JSON.stringify(il));
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
