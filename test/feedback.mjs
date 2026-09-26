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

// ---- selection in the payload + preview (mocked Turnstile and fetch; nothing leaves the browser) ----
{
  const mp = await browser.newPage();
  await mp.setViewport({ width: 1280, height: 900 });
  await mp.setRequestInterception(true);
  mp.on('request', (req) => { const u = req.url(); if (/workers\.dev|challenges\.cloudflare\.com|github\.com/.test(u)) { blocked.push(u); req.abort(); } else req.continue(); });
  await mp.evaluateOnNewDocument(() => {
    // mock Turnstile: every render/reset issues a fresh single-use token (the real widget re-solves after reset)
    let opts = null; let n = 0;
    window.turnstile = { render: (el, o) => { opts = o; setTimeout(() => o.callback('mock-token-' + (++n)), 0); return 'mock'; },
      reset: () => { if (opts) setTimeout(() => opts.callback('mock-token-' + (++n)), 0); } };
    window.__fbCalls = [];
    const realFetch = window.fetch.bind(window);
    window.fetch = (url, init) => {
      if (/workers\.dev/.test(String(url))) {
        window.__fbCalls.push({ url: String(url), body: JSON.parse(init.body) });
        return Promise.resolve(new Response(JSON.stringify({ ok: true, url: 'https://github.com/Hiwap/350z-harness/issues/999999' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return realFetch(url, init);
    };
  });
  await mp.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
  await mp.waitForSelector('#blocks .pin[data-pin="24"]');
  await mp.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await mp.reload({ waitUntil: 'domcontentloaded' });
  await mp.waitForSelector('#blocks .pin[data-pin="24"]');
  const sendOnce = async (text) => {
    await mp.click('#feedbackBtn');
    await mp.waitForFunction(() => document.getElementById('feedbackDialog').open, { timeout: 3000 });
    const incl = await mp.evaluate(() => document.getElementById('fbIncl').textContent);
    const ctx = await mp.evaluate(() => document.getElementById('fbCtx').textContent);
    await mp.evaluate(() => { document.getElementById('fbMsg').value = ''; });
    await mp.type('#fbMsg', text);
    await mp.waitForFunction(() => !document.getElementById('fbSend').disabled, { timeout: 3000 }).catch(() => {});
    const n0 = await mp.evaluate(() => window.__fbCalls.length);
    await mp.click('#fbSend');
    await mp.waitForFunction((n) => window.__fbCalls.length > n, { timeout: 3000 }, n0).catch(() => {});
    await mp.waitForFunction(() => /issues\/999999/.test(document.getElementById('fbStatus').textContent), { timeout: 3000 }).catch(() => {});
    const calls = await mp.evaluate(() => window.__fbCalls);
    const call = calls.length > n0 ? calls[calls.length - 1] : null;
    const status = await mp.evaluate(() => document.getElementById('fbStatus').textContent);
    await mp.evaluate(() => document.getElementById('feedbackDialog').close());
    return { incl, ctx, call, status };
  };
  const I = await mp.evaluate(() => ({ es: I18N.es, en: I18N.en, ja: I18N.ja }));
  // nothing selected → "none"
  await mp.evaluate(() => clearSelection());
  let r = await sendOnce('nothing selected test');
  ok('no selection: preview says none', r.incl === I.es.fbIncl + ' ' + I.es.fbInclNone, r.incl);
  ok('no selection: payload selPin/selConn/rails = "none" (mock fetch, Worker URL)', !!r.call && r.call.url === WORKER
    && r.call.body.context.selPin === 'none' && r.call.body.context.selConn === 'none' && r.call.body.context.rails === 'none', JSON.stringify(r.call && r.call.body.context));
  ok('mocked success shows the issue link', /issues\/999999/.test(r.status), r.status);
  // ECM pin 24 selected
  await mp.evaluate(() => clearSelection());
  await mp.click('#blocks .pin[data-pin="24"]');
  r = await sendOnce('pin 24 selected test');
  ok('pin 24: preview "Incluye: pin ECM 24"', r.incl.startsWith(I.es.fbIncl + ' ' + I.es.fbInclPin.replace('{n}', '24')), r.incl);
  ok('pin 24: payload selPin = ECM 24 · name · GY', !!r.call && /^ECM 24 · .+ · GY$/.test(r.call.body.context.selPin), JSON.stringify(r.call && r.call.body.context));
  ok('pin 24: context box lists "Selected pin: ECM 24"', /Selected pin: ECM 24/.test(r.ctx), r.ctx);
  // cavity F34·4 selected (ficha click) + GND rail
  await mp.evaluate(() => { clearSelection(); document.querySelector('.cav-hit[data-conn="af_b2"][data-cav="4"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  r = await sendOnce('cavity F34 4 test');
  ok('cavity af_b2·4: preview shows pin ECM 24 · F34·4', r.incl.includes(I.es.fbInclPin.replace('{n}', '24')) && r.incl.includes('F34·4'), r.incl);
  ok('cavity af_b2·4: payload selConn names the ficha + cavity', !!r.call && /af_b2/.test(r.call.body.context.selConn) && / · 4/.test(r.call.body.context.selConn), JSON.stringify(r.call && r.call.body.context));
  await mp.evaluate(() => { clearSelection(); toggleRail('gnd'); });
  r = await sendOnce('gnd rail test');
  ok('GND rail on: payload rails = GND, preview mentions it', !!r.call && r.call.body.context.rails === 'GND' && r.incl.includes(I.es.fbInclRails.replace('{r}', 'GND')), JSON.stringify([r.incl, r.call && r.call.body.context.rails]));
  await mp.evaluate(() => { toggleRail('gnd'); clearSelection(); });
  // preview localizes
  await mp.click('#blocks .pin[data-pin="24"]');
  for (const lg of ['en', 'ja', 'es']) {
    await mp.select('#lang', lg);
    await mp.evaluate(() => { clearSelection(); document.querySelector('#blocks .pin[data-pin="24"]').click(); });
    await mp.click('#feedbackBtn');
    const t = await mp.evaluate(() => document.getElementById('fbIncl').textContent);
    await mp.evaluate(() => document.getElementById('feedbackDialog').close());
    ok(`[${lg}] preview localized: "${I[lg].fbIncl} ${I[lg].fbInclPin.replace('{n}', '24')}"`, t.startsWith(I[lg].fbIncl + ' ' + I[lg].fbInclPin.replace('{n}', '24')), t);
  }
  ok('mock page: no real Worker / GitHub request left the browser', !blocked.some((u) => /workers\.dev/.test(u)), blocked.join(', '));
  await mp.close();
}

await browser.close();
console.log(`---\nfeedback: ${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('FEEDBACK OK');
