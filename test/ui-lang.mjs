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
  ];
  for (const dir of candidates) {
    try { return require(dir); } catch { /* next */ }
  }
  throw new Error('puppeteer-core not found (npm install puppeteer-core)');
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
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
    railRelPower: 'Power',
    railRelGnd: 'Tierras',
    railRelData: 'Data',
    loomAll: 'Completo',
    loomMotor: 'Arnès motor',
    lblLang: 'Idioma',
    fichasTitle: 'Fichas',
    htmlLang: 'es',
  },
  en: {
    railRelPower: 'Power',
    railRelGnd: 'Grounds',
    railRelData: 'Data',
    loomAll: 'Full',
    loomMotor: 'Engine harness',
    lblLang: 'Language',
    fichasTitle: 'Connectors',
    htmlLang: 'en',
  },
  ja: {
    railRelPower: '電源',
    railRelGnd: 'アース',
    railRelData: 'データ',
    loomAll: '全体',
    loomMotor: 'エンジンハーネス',
    lblLang: '言語',
    fichasTitle: 'コネクタ',
    htmlLang: 'ja',
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
      railRelPower: document.getElementById('lblRailRelPowerTxt')?.textContent,
      railRelGnd: document.getElementById('lblRailRelGndTxt')?.textContent,
      railRelData: document.getElementById('lblRailRelDataTxt')?.textContent,
      loomAll: document.querySelector('#loomView option[value="all"]')?.textContent,
      loomMotor: document.querySelector('#loomView option[value="motor"]')?.textContent,
      lblLang: textAfter(document.getElementById('lblLang')),
      fichasTitle: document.getElementById('fichasTitle')?.textContent,
      powerExists: !!document.getElementById('railRelPower'),
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

await browser.close();
if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall ui language checks passed');
