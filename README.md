# Nissan 350Z · OEM harness / ficha viewer

Interactive ECM pin ↔ connector reference for VQ35DE (2003–2006), based on FSM / NicoClub diagrams.

Open the [GitHub Pages](https://hiwap.github.io/350z-harness/) site from this repo, or open `index.html` locally.

Not a substitute for the official service manual.

## Print pack (Arnès motor)

2-page landscape PDF (English UI) — page 1 cover + EC-123 + ECM rails + F102, page 2 motor fichas. Regenerate:

```bash
python3 make_print_pack.py
```

Needs `pin_colors.json` beside the script and `reportlab` (`pip install reportlab`).

**Español:** PDF de 2 páginas (landscape) — pág. 1 portada + EC-123, pág. 2 fichas del arnés de motor. Regenerar con `python3 make_print_pack.py`.

**日本語:** 2ページの横向きPDF — 1ページ目カバー+EC-123、2ページ目モーター側フィチャ。`python3 make_print_pack.py` で再生成。

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

No sustituye el manual de servicio oficial.

## 日本語

VQ35DE（2003–2006）向けの、ECMピン ↔ コネクタのインタラクティブ参照です。FSM / NicoClub の配線図に基づきます。

このリポジトリの [GitHub Pages](https://hiwap.github.io/350z-harness/) を開くか、ローカルで `index.html` を開いてください。

公式サービスマニュアルの代用ではありません。



