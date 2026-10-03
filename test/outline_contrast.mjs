#!/usr/bin/env node
/**
 * Outline mode (default display: dark cavity face + wire-coloured border). Every label must read on the dark
 * face and where it crosses the border, for every wire colour (light Y / LG / W / OR / P and dark B / BR / GY).
 *  - synthetic: cavGroup for every base × tracer wire colour (13 × 13) × every top-line ink (ECM, src per
 *    group accent, no src) × every bottom-line kind (12V / 5V / GND / CAN / plain); each text/tspan fill has
 *    ≥ 4.5:1 contrast on the face and a dark halo (stroke CAV_HALO ≥ 1.5px, painted under the fill)
 *  - real page: the same check over every drawn ficha label; dark borders (B, BR) get a grey keyline
 *  - HTML pins (ECM grid, F102): label colours ≥ 4.5:1 on the pin face, hard dark text-shadow, dark-wire keyline
 * OUTLINE_SWATCH=<png> also saves the 13 × 13 colour grid screenshot.
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
let pass = 0; const fails = [];
const ok = (name, cond, detail = '') => { if (cond) { pass++; console.log('  ok  ' + name); } else { fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); } };
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

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: process.env.OUTLINE_SWATCH ? 2 : 1 });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.reload({ waitUntil: 'networkidle0' });
ok('default display mode is outlines', await page.evaluate(() => document.body.dataset.mode) === 'outlines');

/* shared in-page helpers */
await page.evaluate(() => {
  const rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b] = m[1].split(',').map(Number); return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  window.__textIssues = (root, bg) => {
    const out = []; let n = 0;
    for (const t of root.querySelectorAll('text.cav-ecm, text.cav-label, text.cav-code')) {
      const els = t.querySelectorAll('tspan').length ? [...t.querySelectorAll('tspan')] : [t];
      for (const el of els) {
        if (!el.textContent.trim()) continue;
        n++;
        const cs = getComputedStyle(el); const fill = rgb(cs.fill); const stroke = rgb(cs.stroke);
        const cr = fill ? contrastRatio(fill, bg) : 0;
        const sw = parseFloat(cs.strokeWidth) || 0;
        const haloOk = stroke && hexLum(stroke) < 0.01 && sw >= 1.5 && /^stroke/.test(cs.paintOrder);
        if (cr < 4.5 || !haloOk) {
          const g = t.closest('.cav-hit');
          out.push(`${g ? g.dataset.conn + '·' + g.dataset.cav : '?'} "${el.textContent}" fill ${fill} ${cr.toFixed(2)}:1 halo ${stroke}/${sw}/${cs.paintOrder}`);
        }
      }
    }
    return { n, out };
  };
});

/* ---------- synthetic: every wire colour × every label ink ---------- */
const syn = await page.evaluate(() => {
  const toks = Object.keys(OC).filter((k) => k !== '12V' && k !== '?');
  const codes = []; for (const b of toks) { codes.push(b); for (const t of toks) if (t !== b) codes.push(b + '/' + t); }
  const tops = [{ ecm: 94 }, { src: 'M40·6' }].concat(Object.keys(SUB_ACCENT).map((s) => ({ src: 'X1·1', srcSub: s })));
  const bots = [{ rail: '12v' }, { rail: '5v' }, { rail: 'gnd' }, { lab: 'CAN-H' }, { lab: 'SIG' }];
  const holder = document.createElement('div'); holder.id = 'outlineSwatch';
  holder.style.cssText = 'position:absolute;left:0;top:0;z-index:99999;background:#0f1319;padding:8px';
  document.body.appendChild(holder);
  const cw = 46, ch = 40, gap = 6;
  /* the grid shown in the swatch: base rows × tracer cols, top line = carroceria src, bottom = 12V / id */
  let svg = '';
  toks.forEach((b, ri) => ['', ...toks].forEach((t, ci) => {
    if (t === b) return;
    const pin = { id: 'S' + ri + ci, code: t ? b + '/' + t : b, src: 'M40·6', srcSub: 'carroceria', lab: ci % 2 ? 'LAB' : '', rail: ci % 3 === 0 ? '12v' : null };
    svg += cavGroup('zz_swatch', pin, 4 + ci * (cw + gap), 4 + ri * (ch + gap), cw, ch, 3);
  }));
  holder.innerHTML = `<svg class="conn-svg" xmlns="http://www.w3.org/2000/svg" width="${(toks.length + 1) * (cw + gap) * 1.6}" viewBox="0 0 ${(toks.length + 1) * (cw + gap) + 8} ${toks.length * (ch + gap) + 8}">${svg}</svg>`;
  /* full matrix (not shown): every code × top × bottom */
  let all = ''; let k = 0;
  for (const code of codes) for (const tp of tops) for (const bt of bots) { all += cavGroup('zz_all', Object.assign({ id: 'A' + (k++), code }, tp, bt), 0, 0, 46, 40, 3); }
  const big = document.createElement('div'); big.style.cssText = 'position:absolute;left:-5000px;top:0';
  big.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">${all}</svg>`;
  document.body.appendChild(big);
  const r1 = __textIssues(big, CAV_OUTLINE_BG);
  big.remove();
  return { codes: codes.length, combos: k, n: r1.n, issues: r1.out.slice(0, 12), nIssues: r1.out.length };
});
ok(`synthetic: ${syn.codes} wire colours × top / bottom inks (${syn.combos} cavities, ${syn.n} labels): every label ≥ 4.5:1 on the face with a dark halo`, syn.nIssues === 0 && syn.n > 10000, `${syn.nIssues}: ${syn.issues.join(' | ')}`);
if (process.env.OUTLINE_SWATCH) { const el = await page.$('#outlineSwatch'); await el.screenshot({ path: process.env.OUTLINE_SWATCH }); }
const key = await page.evaluate(() => {
  const bad = [];
  for (const g of document.querySelectorAll('#outlineSwatch .cav-hit')) {
    const code = (g.querySelector('.cav-code') || {}).textContent || '';
    const base = code.split('/')[0]; const dark = contrastRatio(OC[base], CAV_OUTLINE_BG) < 2;
    const kl = g.previousElementSibling; if (dark !== !!(kl && kl.classList.contains('cav-keyline'))) bad.push(code);
  }
  document.getElementById('outlineSwatch').remove();
  return bad;
});
ok('synthetic: keyline exactly on dark borders (B, BR, …) so the cavity edge shows on the dark shell', key.length === 0, key.join(','));

/* ---------- real page: every ficha label ---------- */
await page.evaluate(() => document.querySelectorAll('#fichas details').forEach((d) => { d.open = true; }));
const real = await page.evaluate(() => {
  const r = __textIssues(document.getElementById('fichas'), CAV_OUTLINE_BG);
  const noKey = [];
  for (const g of document.querySelectorAll('#fichas .cav-hit')) {
    const rc = g.querySelector('rect.cavity'); if (!rc) continue;
    const code = ((g.querySelector('.cav-code') || {}).textContent || '').trim();
    if (!code || code === '·' || code === '?') continue;
    const st = rc.style.stroke; const m = st.match(/\d+/g); if (!m) continue;
    const hex = '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
    const kl = g.previousElementSibling; if (contrastRatio(hex, CAV_OUTLINE_BG) < 2 && !(kl && kl.classList.contains('cav-keyline'))) noKey.push(g.dataset.conn + '·' + g.dataset.cav);
  }
  return { n: r.n, out: r.out, noKey };
});
ok(`real page: all ${real.n} ficha labels ≥ 4.5:1 on the face with a dark halo`, real.out.length === 0 && real.n > 1000, `${real.out.length}: ${real.out.slice(0, 10).join(' | ')}`);
ok('real page: every dark-bordered cavity (B / BR …) has the grey keyline', real.noKey.length === 0, real.noKey.slice(0, 10).join(','));

/* ---------- HTML pins: ECM grid + F102 ---------- */
const pins = await page.evaluate(() => {
  const rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b] = m[1].split(',').map(Number); return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  const bad = []; const noKey = []; let n = 0;
  for (const p of document.querySelectorAll('#blocks .pin:not(.empty), #f102Blocks .pin[data-wired="1"]')) {
    const face = rgb(getComputedStyle(p).backgroundColor) || '#12161d';
    for (const el of p.querySelectorAll('.pn, .dest, .pw .pw-plain')) {
      if (!el.textContent.trim()) continue; n++;
      const cs = getComputedStyle(el); const c = rgb(cs.color);
      if (contrastRatio(c, face) < 4.5 || !/rgb\(5, 7, 10\)/.test(cs.textShadow)) bad.push(`${p.dataset.pin || p.dataset.cav} "${el.textContent}" ${c} ${contrastRatio(c, face).toFixed(2)}`);
    }
    const bc = rgb(p.style.borderColor);
    if (bc && contrastRatio(bc, CAV_OUTLINE_BG) < 2 && !(p.classList.contains('dark-wire') && /rgb\(120, 144, 156\)/.test(getComputedStyle(p).boxShadow))) noKey.push(p.dataset.pin || p.dataset.cav);
  }
  return { n, bad, noKey };
});
ok(`ECM grid + F102 pins: all ${pins.n} labels ≥ 4.5:1 with a hard dark text-shadow`, pins.bad.length === 0 && pins.n > 100, pins.bad.slice(0, 10).join(' | '));
ok('ECM grid + F102 pins: black / brown borders get the grey keyline', pins.noKey.length === 0, pins.noKey.join(','));

await browser.close();
console.log(`---\noutline_contrast: ${pass} passed, ${fails.length} failed`);
if (fails.length) { console.log('FAILED:\n' + fails.join('\n')); process.exit(1); }
console.log('OUTLINE CONTRAST OK');
