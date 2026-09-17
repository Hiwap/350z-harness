# Nissan 350Z · OEM harness / ficha viewer

Interactive ECM pin ↔ connector reference for VQ35DE (2003–2006), based on FSM / NicoClub diagrams.

Open the GitHub Pages site from this repo, or open `index.html` locally.

Not a substitute for the official service manual.

## Tests (no CI / no Actions)

```bash
npm install          # once — puppeteer-core for browser suites
npm test             # full pre-ship gate
npm run test:static  # skip f102/ui-lang (no Chrome)
npm run test:i18n
npm run test:ui
npm run test:f102
```

| Script | What |
|--------|------|
| `test/harness_page_tests.mjs` | syntax + structural + unit labels + nests the rest |
| `test/verify_harness_bugs.mjs` | regression asserts (F102 K-line, loom, collapse, …) |
| `test/i18n.mjs` | I18N key parity es/en/ja (no browser) |
| `test/ui-lang.mjs` | live language chrome via Puppeteer |
| `test/f102.mjs` | live F102 / selection / Alim. behavior via Puppeteer |

Chrome/Edge required for `ui-lang` and `f102`. Set `HARNESS_SKIP_BROWSER=1` to skip them.

