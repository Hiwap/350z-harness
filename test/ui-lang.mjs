import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFile = path.join(root, 'index.html');
const require = createRequire(import.meta.url);

function loadPuppeteer() {
  const candidates = [
    path.join(root, 'node_modules/puppeteer-core'),
    path.join(process.env.TEMP || '/tmp', 'z33-verify/node_modules/puppeteer-core'),
    '/tmp/z33-verify/node_modules/puppeteer-core',
  ];
  const errs = [];
  for (const dir of candidates) {
    try { return require(dir); } catch (e) { errs.push(dir + ': ' + e.message); }
  }
  try { return require('puppeteer-core'); } catch (e) { errs.push('resolve: ' + e.message); }
  throw new Error('puppeteer-core not found\n' + errs.join('\n'));
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome/Edge not found');
}

const puppeteer = loadPuppeteer();
const chrome = findChrome();
let failed = 0;
function ok(cond, msg) {
  if (cond) console.log('  ok  ' + msg);
  else { console.log('  FAIL ' + msg); failed++; }
}

const expect = {
  es: {
    railRelTitle: 'Relacionados',
    railRelPower: 'Alim.',
    railRelGnd: 'Tierras',
    railRelData: 'Datos',
    loomAll: 'Completo',
    loomMotor: 'Arnès motor',
    lblTrans: 'Transmisión',
    transMt: 'Manual',
    transAt: 'Automático',
    lblLang: 'Idioma',
    fichasTitle: 'Fichas',
    hdrTitle: 'Nissan 350Z · Harness / Fichas OEM',
    pageTitle: 'Nissan 350Z · Harness / Fichas OEM (FSM)',
    railLabel: 'Rieles',
    htmlLang: 'es',
    noHlLegend: true,
  },
  en: {
    railRelTitle: 'Related',
    railRelPower: 'Power',
    railRelGnd: 'Grounds',
    railRelData: 'Data',
    loomAll: 'Full',
    loomMotor: 'Engine harness',
    lblTrans: 'Transmission',
    transMt: 'Manual',
    transAt: 'Automatic',
    lblLang: 'Language',
    fichasTitle: 'Connectors',
    hdrTitle: 'Nissan 350Z · OEM harness / connectors',
    pageTitle: 'Nissan 350Z · OEM harness / connectors (FSM)',
    railLabel: 'Rails',
    htmlLang: 'en',
    noHlLegend: true,
  },
  ja: {
    railRelTitle: '関連',
    railRelPower: '電源',
    railRelGnd: 'アース',
    railRelData: 'データ',
    loomAll: '全体',
    loomMotor: 'エンジンハーネス',
    lblTrans: 'トランスミッション',
    transMt: 'マニュアル',
    transAt: 'オートマチック',
    lblLang: '言語',
    fichasTitle: 'コネクタ',
    hdrTitle: 'Nissan 350Z · OEMハーネス / コネクタ',
    pageTitle: 'Nissan 350Z · OEMハーネス / コネクタ (FSM)',
    railLabel: 'レール',
    htmlLang: 'ja',
    noHlLegend: true,
  },
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#lang');
await page.evaluate(() => {
  const box = document.getElementById('optsBox');
  if (box) box.open = true;
});

async function readChrome() {
  return page.evaluate(() => {
    const textAfter = (el) => {
      if (!el) return null;
      const sel = el.querySelector('select');
      if (!sel) return (el.textContent || '').trim();
      const bits = [];
      el.childNodes.forEach((n) => {
        if (n.nodeType === 3) bits.push(n.textContent.trim());
      });
      return bits.join(' ').trim();
    };
    return {
      htmlLang: document.documentElement.lang,
      railRelTitle: document.getElementById('railRelTitle')?.textContent,
      railRelPower: document.getElementById('lblRailRelPowerTxt')?.textContent,
      railRelGnd: document.getElementById('lblRailRelGndTxt')?.textContent,
      railRelData: document.getElementById('lblRailRelDataTxt')?.textContent,
      loomAll: document.querySelector('#loomView option[value="all"]')?.textContent,
      loomMotor: document.querySelector('#loomView option[value="motor"]')?.textContent,
      lblTrans: textAfter(document.getElementById('lblTrans')),
      transMt: document.querySelector('#transView option[value="mt"]')?.textContent,
      transAt: document.querySelector('#transView option[value="at"]')?.textContent,
      lblLang: textAfter(document.getElementById('lblLang')),
      fichasTitle: document.getElementById('fichasTitle')?.textContent,
      hdrTitle: document.getElementById('pageH1')?.textContent,
      pageTitle: document.title,
      railLabel: document.getElementById('railLabel')?.textContent,
      powerExists: !!document.getElementById('railRelPower'),
      noHlLegend: !document.getElementById('optsHlLegend') && !document.getElementById('hlLegendTitle'),
    };
  });
}

for (const lang of ['es', 'en', 'ja']) {
  console.log(`\nlang ${lang}`);
  await page.select('#lang', lang);
  await page.evaluate(() => {
    if (typeof applyLang === 'function') applyLang();
  });
  const got = await readChrome();
  const exp = expect[lang];
  ok(got.powerExists, `${lang} Power checkbox present`);
  for (const [k, v] of Object.entries(exp)) {
    ok(got[k] === v, `${lang}.${k} = ${JSON.stringify(v)}` + (got[k] !== v ? ` (got ${JSON.stringify(got[k])})` : ''));
  }
}

console.log('\nlang en content');
await page.select('#lang', 'en');
await page.evaluate(() => { if (typeof applyLang === 'function') applyLang(); });
const enCards = await page.evaluate(() => {
  const name = (id) => document.querySelector(`.ficha-wrap[data-conn="${id}"] h3`)?.textContent || null;
  return { coil1: name('coil1'), gnd4: name('gnd4'), inj1: name('inj1') };
});
ok(enCards.coil1 === 'Coil 1', `en coil1 card = "Coil 1"` + (enCards.coil1 !== 'Coil 1' ? ` (got ${JSON.stringify(enCards.coil1)})` : ''));
ok(enCards.inj1 === 'Injector 1', `en inj1 card = "Injector 1"` + (enCards.inj1 !== 'Injector 1' ? ` (got ${JSON.stringify(enCards.inj1)})` : ''));
ok(enCards.gnd4 && !/Tierra|tierras/i.test(enCards.gnd4), `en gnd4 card has no Tierra` + (enCards.gnd4 ? ` (got ${JSON.stringify(enCards.gnd4)})` : ' (missing)'));

await page.click('#blocks .pin[data-pin="1"]');
const info1 = await page.$eval('#info', (el) => el.textContent || '');
ok(!/Tierra|Ruta:|Masa carrocería|Alim\./.test(info1), 'en pin 1 info has no leftover Spanish' + ( /Tierra|Ruta:|Masa carrocería|Alim\./.test(info1) ? ` (got ${JSON.stringify(info1.slice(0, 180))})` : ''));
ok(/ground/i.test(info1), 'en pin 1 info mentions ground');

await page.evaluate(() => {
  const el = document.getElementById('railRelPower');
  if (el && !el.checked) {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await page.click('#blocks .pin[data-pin="3"]');
const info3 = await page.$eval('#info', (el) => el.textContent || '');
ok(!/Alim\./.test(info3), 'en pin 3 + Power pill is not Alim.' + (/Alim\./.test(info3) ? ` (got ${JSON.stringify(info3.slice(0, 220))})` : ''));
ok(/Power 12V/.test(info3), 'en pin 3 + Power shows Power 12V' + (!/Power 12V/.test(info3) ? ` (got ${JSON.stringify(info3.slice(0, 220))})` : ''));

console.log('\nlang ja content');
await page.select('#lang', 'ja');
await page.evaluate(() => { if (typeof applyLang === 'function') applyLang(); });
const jaCards = await page.evaluate(() => {
  const name = (id) => document.querySelector(`.ficha-wrap[data-conn="${id}"] h3`)?.textContent || null;
  return { coil1: name('coil1'), gnd4: name('gnd4'), inj1: name('inj1') };
});
ok(jaCards.coil1 === 'コイル1', `ja coil1 card = "コイル1"` + (jaCards.coil1 !== 'コイル1' ? ` (got ${JSON.stringify(jaCards.coil1)})` : ''));
ok(jaCards.inj1 === 'インジェクタ1', `ja inj1 card = "インジェクタ1"` + (jaCards.inj1 !== 'インジェクタ1' ? ` (got ${JSON.stringify(jaCards.inj1)})` : ''));
ok(jaCards.gnd4 && /アース/.test(jaCards.gnd4) && !/Tierra/i.test(jaCards.gnd4), `ja gnd4 card uses アース` + (jaCards.gnd4 ? ` (got ${JSON.stringify(jaCards.gnd4)})` : ' (missing)'));

await page.click('#blocks .pin[data-pin="1"]');
const info1ja = await page.$eval('#info', (el) => el.textContent || '');
ok(!/Tierra|Ruta:|Masa carrocería|Alim\./.test(info1ja), 'ja pin 1 info has no leftover Spanish' + (/Tierra|Ruta:|Masa carrocería|Alim\./.test(info1ja) ? ` (got ${JSON.stringify(info1ja.slice(0, 180))})` : ''));
ok(/アース|GND/.test(info1ja), 'ja pin 1 info mentions ground');

await page.evaluate(() => {
  const el = document.getElementById('railRelPower');
  if (el && !el.checked) {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
await page.click('#blocks .pin[data-pin="3"]');
const info3ja = await page.$eval('#info', (el) => el.textContent || '');
ok(!/Alim\./.test(info3ja), 'ja pin 3 + Power pill is not Alim.' + (/Alim\./.test(info3ja) ? ` (got ${JSON.stringify(info3ja.slice(0, 220))})` : ''));
ok(/電源 12V/.test(info3ja), 'ja pin 3 + Power shows 電源 12V' + (!/電源 12V/.test(info3ja) ? ` (got ${JSON.stringify(info3ja.slice(0, 220))})` : ''));

console.log('\nF102 face camera');
await page.select('#lang', 'en');
await page.evaluate(() => { if (typeof applyLang === 'function') applyLang(); });
const f102Face = await page.evaluate(() => {
  const btn = document.querySelector('#f102Title .ficha-face-btn');
  if (btn) btn.click();
  const img = document.querySelector('#faceLightbox img');
  const srcEl = document.querySelector('#faceLightbox .face-lb-src');
  return {
    btn: !!btn,
    open: !!document.querySelector('#faceLightbox.open'),
    src: img ? img.getAttribute('src') : null,
    credit: srcEl ? srcEl.textContent : null,
    panelOpen: !!document.querySelector('#f102Panel[open]'),
  };
});
ok(f102Face.btn, 'F102 summary has camera button');
ok(f102Face.open, 'F102 camera opens lightbox');
ok(f102Face.src && f102Face.src.includes('f102.webp'), 'F102 lightbox src is f102.webp' + (f102Face.src ? ` (got ${f102Face.src})` : ''));
ok(f102Face.credit && /Wiring Specialties/.test(f102Face.credit), 'F102 credit Wiring Specialties' + (f102Face.credit ? ` (got ${JSON.stringify(f102Face.credit)})` : ''));

console.log('\nA/F face caption (localized similar-part note)');
for (const [lg, re] of [['es', /^Foto: Connector Experts \(Air Fuel Ratio Sensor, i-26377349\) · similar, el seguro puede diferir$/],
  ['en', /^Photo: Connector Experts \(Air Fuel Ratio Sensor, i-26377349\) · similar, lock may differ$/],
  ['ja', /^写真: Connector Experts \(Air Fuel Ratio Sensor, i-26377349\) · 類似品・ロック形状が異なる場合あり$/]]) {
  await page.select('#lang', lg);
  await page.evaluate(() => { if (typeof applyLang === 'function') applyLang(); if (typeof closeFaceLightbox === 'function') closeFaceLightbox(); });
  const r = await page.evaluate(() => {
    openFaceLightbox('af_b1');
    const out = { src: document.querySelector('#faceLightbox img')?.getAttribute('src'), cap: document.querySelector('#faceLightbox .face-lb-src')?.textContent };
    closeFaceLightbox();
    return out;
  });
  ok(r.src === 'faces/af.webp' && re.test(r.cap || ''), `${lg} A/F lightbox = af.webp + caption (${JSON.stringify(r)})`);
}

console.log('\nF33/F221 face caption');
for (const [lg, lab] of [['es', 'Foto:'], ['en', 'Photo:'], ['ja', '写真:']]) {
  await page.select('#lang', lg);
  await page.evaluate(() => { if (typeof applyLang === 'function') applyLang(); });
  const r = await page.evaluate(() => {
    openFaceLightbox('ix_f221_f33');
    const out = { src: document.querySelector('#faceLightbox img')?.getAttribute('src'), cap: document.querySelector('#faceLightbox .face-lb-src')?.textContent };
    closeFaceLightbox();
    return out;
  });
  ok(r.src === 'faces/f33.webp' && r.cap === `${lab} EFI Hardware (Nissan 8 Pin Injector Loom Male Pin Connector, Grey)`,
    `${lg} F33 lightbox = f33.webp + EFI caption (${JSON.stringify(r)})`);
}

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall ui language checks passed');
