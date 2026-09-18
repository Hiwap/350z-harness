# Nissan 350Z · OEM harness viewer

Interactive ECM pin ↔ connector reference for VQ35DE (2003–2006), based on FSM / NicoClub diagrams.

Open the [GitHub Pages](https://hiwap.github.io/350z-harness/) site from this repo, or open `index.html` locally.

Not a substitute for the official service manual.

Interim vendor faces under `faces/` are for connector ID only; replace with loom photos when available.

Privacy-friendly visit counts via [GoatCounter](https://350z-harness.goatcounter.com).

## Print pack
2-page landscape PDF. Language comes from the map `I18N` in `index.html` (`--lang` only selects the pack).

```bash
python3 make_print_pack.py              # English (default)
python3 make_print_pack.py --lang es
python3 make_print_pack.py --lang ja
```

Needs `index.html` (I18N + pin data) beside the script and `reportlab` (`pip install reportlab`). Node is used once at startup to load map I18N.


## Tests

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

## Credits

Built with [Grok](https://grok.com/) — Grok Bot and Grok Build.

---

## Español

Referencia interactiva pin ECM ↔ conector para VQ35DE (2003–2006), basada en diagramas FSM / NicoClub.

Abrí el sitio de [GitHub Pages](https://hiwap.github.io/350z-harness/) de este repo, o abrí `index.html` en local.

PDF de 2 páginas (landscape). Idioma = `I18N` del mapa (`--lang` solo elige el pack).

```bash
python3 make_print_pack.py --lang es
```

No sustituye el manual de servicio oficial.

## 日本語

VQ35DE（2003–2006）向けの、ECMピン ↔ コネクタのインタラクティブ参照です。FSM / NicoClub の配線図に基づきます。

このリポジトリの [GitHub Pages](https://hiwap.github.io/350z-harness/) を開くか、ローカルで `index.html` を開いてください。

**日本語:** 2ページの横向きPDF。文言は地図の `I18N`（`--lang` はパック選択のみ）。

```bash
python3 make_print_pack.py --lang ja
```

公式サービスマニュアルの代用ではありません。



