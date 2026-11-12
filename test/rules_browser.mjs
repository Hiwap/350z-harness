#!/usr/bin/env node
/**
 * Maintainer corrections that only show on the rendered page (browser). AGENTS.md points here.
 * Run: node test/rules_browser.mjs   (needs Chrome + puppeteer-core, like f102.mjs)
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
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
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`);
  else { failed++; console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
};

const browser = await loadPuppeteer().launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
const fresh = async () => {
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#blocks .pin[data-pin="66"]');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* file: */ } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#blocks .pin[data-pin="66"]');
};
await fresh();

/* Rule optional-hidden: a pin whose equipment / transmission is not on the selected car is drawn
   as an empty cavity (no FSM colour, no label, no ECM number), with a tooltip naming the option.
   It is not clickable and has no dimmed wire. Default car + all options on, every card. */
{
  const sweep = () => page.evaluate(() => {
    const out = { n: 0, missing: [], bad: [] };
    const emptyCode = (g) => ((g.querySelector('.cav-code') || {}).textContent || '').replace(/\s/g, '');
    const top = (g) => (g.querySelector('.cav-ecm') || {}).textContent;
    const targets = [];
    for (const el of document.querySelectorAll('#fichas details.ficha-sec:not(.sel-top) .ficha[data-conn]')) {
      const cid = el.dataset.conn;
      const c = CONN[cid];
      if (!c || cid === 'ix_f102_m72') continue;
      const rows = faceRowsOf(c);
      const drawn = rows ? new Set(rows.flat().filter(Boolean).map(String)) : null;
      for (const p of c.pins || []) {
        if (!(p.vifOff || p.transOff)) continue;
        if (drawn && !drawn.has(String(p.id))) continue; /* other connector of a per-transmission face (stop lamp E111/E112) */
        out.n++;
        const g = el.querySelector(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(p.id))}"]`);
        if (!g) { out.missing.push(`${cid}·${p.id}`); continue; }
        const why = [];
        if (g.classList.contains('cav-opt-off')) why.push('dimmed class');
        if (g.getAttribute('opacity') != null) why.push('opacity ' + g.getAttribute('opacity'));
        if (!((g.querySelector('title') || {}).textContent || '').trim()) why.push('no tooltip');
        if (!g.getAttribute('data-opt-off')) why.push('no data-opt-off');
        if (top(g) !== '—') why.push(`first line "${top(g)}", want "—"`);
        const code = emptyCode(g);
        if (code && code !== '—' && code !== '·' && code !== '-') why.push(`wire colour "${code}"`);
        if (!g.classList.contains('cav-noclick')) why.push('still clickable');
        if (why.length) out.bad.push(`${cid}·${p.id}: ${why.join(', ')}`);
      }
    }
    /* F102 panel pins gated by transmission / equipment */
    for (const p of (CONN.ix_f102_m72.pins || []).filter((q) => q.vifOff || q.transOff)) {
      out.n++;
      const el = f102PinEl(p.id);
      if (!el) { out.missing.push('F102·' + p.id); continue; }
      const why = [];
      if (el.classList.contains('opt-off') || (el.style.opacity && el.style.opacity !== '1')) why.push('dimmed');
      if (!el.dataset.optOff) why.push('no data-opt-off');
      if (!el.classList.contains('empty')) why.push('not empty');
      const mid = ((el.querySelector('.pw') || {}).textContent || '').replace(/\s/g, '');
      const topEl = (el.querySelector('.pn') || {}).textContent;
      if (mid && mid !== '—') why.push(`wire "${mid}"`);
      if (topEl !== '—') why.push(`top "${topEl}"`);
      if (why.length) out.bad.push(`F102·${p.id}: ${why.join(', ')}`);
    }
    return out;
  });
  const def = await sweep();
  ok('optional pins (default car): every gated cavity drawn empty, tooltip, no colour, not clickable', def.n >= 20 && def.missing.length === 0 && def.bad.length === 0,
    `${def.n} gated · missing ${def.missing.join(',')} · ${def.bad.slice(0, 12).join('; ')}`);
  /* the other side of every selector: A/T, Roadster, VDC, Bose, nav, power seat, heated seats */
  await page.evaluate(() => {
    const set = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
    set('transView', 'at'); set('bodyView', 'roadster'); set('brakeView', 'vdc'); set('audioView', 'bose');
    set('navView', 'yes'); set('pseatView', 'yes'); set('hseatView', 'yes');
  });
  const alt = await sweep();
  ok('optional pins (A/T, Roadster, VDC, Bose, nav, seats): every gated cavity drawn empty, tooltip, no colour, not clickable', alt.missing.length === 0 && alt.bad.length === 0,
    `${alt.n} gated · missing ${alt.missing.join(',')} · ${alt.bad.slice(0, 12).join('; ')}`);
  await fresh();
}

/* Rule fuse-cells (render): J/B, holder and E18/E21 fuse cells are the IPDM cover cell: same box, same three
   lines (number / what it feeds / amps) at the same sizes. The middle line is never a wire colour. */
{
  const r = await page.evaluate(() => {
    const COL = /^(?:B|W|R|G|L|Y|BR|OR|P|PU|SB|LG|GY|V|CH|DG)(?:\/(?:B|W|R|G|L|Y|BR|OR|P|PU|SB|LG|GY|V|CH|DG))?$/;
    const cells = (id) => {
      const el = makeFichaEl(id, CONN[id]);
      return [...el.querySelectorAll(`.cav-hit[data-conn="${id}"]`)].map((g) => {
        const rect = g.querySelector('rect');
        const tx = [...g.querySelectorAll(':scope > text')];
        return { cav: g.dataset.cav, empty: g.classList.contains('fuse-empty'), w: rect && rect.getAttribute('width'), h: rect && rect.getAttribute('height'),
          lines: tx.map((t) => t.textContent), sizes: tx.map((t) => t.getAttribute('font-size')).join(',') };
      });
    };
    const ref = cells('ipdm_cover');
    const want = ref[0];
    const bad = [];
    for (const id of ['ipdm_cover', 'jb_fuse_block', 'fuse_link_holder', 'fuse_link_box']) {
      const cs = cells(id);
      if (!cs.length) bad.push(`${id}: no cells`);
      for (const c of cs) {
        const why = [];
        if (c.lines.length !== 3) why.push(`${c.lines.length} lines`);
        if (c.w !== want.w || c.h !== want.h) why.push(`box ${c.w}x${c.h} vs IPDM ${want.w}x${want.h}`);
        if (c.sizes !== want.sizes) why.push(`font sizes ${c.sizes} vs IPDM ${want.sizes}`);
        if (c.lines[0] !== c.cav) why.push(`line 1 "${c.lines[0]}"`);
        if (!c.empty && (!c.lines[1] || COL.test(c.lines[1]))) why.push(`line 2 "${c.lines[1]}"`);
        if (!(c.empty ? c.lines[2] === 'X' : /^\d+A$/.test(c.lines[2] || ''))) why.push(`line 3 "${c.lines[2]}"`);
        if (why.length) bad.push(`${id}·${c.cav}: ${why.join(', ')}`);
      }
    }
    return { n: ref.length, bad };
  });
  ok('fuse cells: J/B, holder and E18/E21 cells = the IPDM cover cell (number / fed system / amps, same box and sizes)', r.bad.length === 0, r.bad.slice(0, 10).join('; '));
}

/* Rule ipdm-icons: each IPDM plug E3–E9 keeps its own PG-26 photo icon (the Seleccionados card, marked on
   that plug); the location icon lives only on the IPDM group header (PG-50, one box per plug), never on a plug. */
{
  const r = await page.evaluate(() => {
    const IDS = ['ipdm_e3', 'ipdm_e4', 'ipdm_e5', 'ipdm_e6', 'ipdm_e7', 'ipdm_e8', 'ipdm_e9'];
    const bad = [];
    for (const id of IDS) {
      if (!IPDM_FSM_MARK[id]) bad.push(`${id}: no PG-26 mark`);
      const sel = makeFichaEl(id, CONN[id], { ipdmIcon: true });
      const cams = sel.querySelectorAll('.ipdm-fsm-btn');
      if (cams.length !== 1 || cams[0].dataset.ipdmConn !== id) bad.push(`${id}: ${cams.length} photo icons on its card`);
      if (sel.querySelector('.ficha-loc-btn')) bad.push(`${id}: location icon on the selected card`);
      const main = makeFichaEl(id, CONN[id]);
      if (main.querySelector('.ficha-loc-btn')) bad.push(`${id}: location icon on the group card`);
      if (locOf(id)) bad.push(`${id}: has its own CONN_LOC`);
      openIpdmFsm(id);
      const lb = document.getElementById('faceLightbox');
      const src = lb.querySelector('.face-lb-img').getAttribute('src');
      const marks = lb.querySelectorAll('.ipdm-mark:not([hidden])').length;
      closeFaceLightbox();
      if (src !== IPDM_FSM_SRC || marks !== 1) bad.push(`${id}: photo ${src}, ${marks} marks`);
    }
    const host = document.querySelector('#fichas details.ficha-sec[data-sub="ipdm"]');
    const tools = host && host.parentElement.querySelector(':scope > .sum-tools');
    const loc = tools && tools.querySelector('.ficha-loc-btn[data-loc-conn="ipdm_group"]');
    const boxes = (locOf('ipdm_group') || {}).m || [];
    if (!loc) bad.push('IPDM group header has no location icon');
    if (boxes.length < IDS.length) bad.push(`IPDM group location marks ${boxes.length} < ${IDS.length}`);
    return bad;
  });
  ok('IPDM: E3–E9 each keep their own PG-26 photo icon; location only on the IPDM group header', r.length === 0, r.join('; '));
}

/* Rule ecm-power-card (browser): the "ECM · Alimentación y tierras" card is drawn first in the open power group,
   shows one table row per pin, and a row click (or a cell click) selects the existing circuit of that ECM pin:
   115 → gnd_ecm_115 lights F103·2 + F152, 119 → ign_vb_119 lights E12/F3·7, 121 → batt_ecm, 111 → ecm_relay_ss.
   A grid click on ECM 115 lights the card's own 115 cell. en / ja table headings are not Spanish. */
{
  await fresh();
  const r = await page.evaluate(async () => {
    const bad = [];
    const sec = document.querySelector('#fichas details.ficha-sec[data-sub="power"]:not(.sel-top)');
    const first = sec && sec.querySelector('.ficha-wrap[data-conn]');
    if (!sec || !sec.open) bad.push('power group not open');
    if (!first || first.dataset.conn !== 'ecm_power') bad.push(`first power card ${first && first.dataset.conn}`);
    const card = () => document.querySelector('#fichas details.ficha-sec:not(.sel-top) .ficha[data-conn="ecm_power"]');
    const rows = card() ? [...card().querySelectorAll('.pin-table-row')] : [];
    if (rows.length !== CONN.ecm_power.pins.length) bad.push(`${rows.length} table rows`);
    const lit = () => new Set([...document.querySelectorAll('.cav-hit.hl, .cav-hit.hl-group')].map((e) => e.dataset.conn + '·' + e.dataset.cav));
    const want = { '115': ['gnd_ecm_115', ['gnd4·2', 'f152·ring', 'ecm_power·115']], '119': ['ign_vb_119', ['ix_e12_f3·7', 'ecm_power·119']],
      '121': ['batt_ecm', ['ix_e108_m15·68G', 'ecm_power·121']], '111': ['ecm_relay_ss', ['ipdm_e9·46', 'ecm_power·111']] };
    for (const [cav, [circ, cells]] of Object.entries(want)) {
      clearSelection();
      const row = card() && card().querySelector(`.pin-table-row[data-cav="${cav}"]`);
      if (!row) { bad.push(`no row ${cav}`); continue; }
      row.click();
      const ids = [...lastCircIds];
      const L = lit();
      if (ids.join(',') !== circ) bad.push(`row ${cav}: circuits ${ids}`);
      const miss = cells.filter((c) => !L.has(c));
      if (miss.length) bad.push(`row ${cav}: not lit ${miss}`);
      if (!(document.querySelector(`#blocks .pin[data-pin="${cav}"]`) || {}).classList?.contains('hl')) bad.push(`row ${cav}: ECM grid pin not lit`);
    }
    clearSelection();
    selectPin(115);
    if (!lit().has('ecm_power·115')) bad.push('grid 115 does not light the card cell');
    clearSelection();
    const heads = {};
    for (const lg of ['en', 'ja']) {
      { const sel = document.getElementById('lang'); sel.value = lg; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      await new Promise((res) => setTimeout(res, 50));
      const c = card();
      heads[lg] = c ? [...c.querySelectorAll('.pin-table-h th')].map((e) => e.textContent) : [];
      const fn = c ? c.querySelector('.pin-table-row[data-cav="121"] .pt-fn').textContent : '';
      if (heads[lg].length !== 4 || heads[lg].some((h) => h === I18N.es[CONN.ecm_power.pinTable[heads[lg].indexOf(h)].h])) bad.push(`${lg} headings ${heads[lg]}`);
      if (!fn || fn === CONN.ecm_power.pins.find((p) => p.id === '121').fn) bad.push(`${lg} fn 121 "${fn}"`);
    }
    { const sel = document.getElementById('lang'); sel.value = 'es'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    return bad;
  });
  ok('ECM power card: first in power, one row per pin, row click selects the existing ECM circuit, en/ja table', r.length === 0, r.join('; '));
}

if (failed) { console.error(`rules_browser.mjs: ${failed} failed`); await browser.close(); process.exit(1); }
console.log('rules_browser.mjs: all passed');
await browser.close();
