# Phase 5. Four face drawers become rows

[Overview](overview.md)

## Goal

Pin order for F33, F18, HO2S2, and A/F lives on the card. `svgFaceRows` draws them. The four special functions go away, so the next connector does not get a fifth copy.

Read **how** on `svgFaceRows`, `svgF33`, `svgF18`, `svgHo2s4`, and `svgAf6` before editing. Run **interrogate** before the diff lands.

## Changes

Files are `data/conn.js`, `index.html`, and `test/harness_page_tests.mjs`.

On these cards, add `faceRows` and keep the existing `shape` so the print pack still finds `af6` until phase 6.

- `af_b1` and `af_b2`. Rows `5,3,1` and `6,4,2`. Matches `view.ord` and `264bec4`.
- `ho2s_b1` and `ho2s_b2`. Rows `3,1` and `4,2`. Set `faceRound`. Matches `d433534`.
- `ix_f18_f201`. Rows `1,2,3` and `4,5,6`. The shell fill is `#212121` today. `svgFaceRows` has no fill field. Add one field that `svgFaceRows` reads, and set it on this card. Matches `57d9f9d`.
- `ix_f221_f33`. Rows `1,2,3,4` and `5,6,7,8`. Matches the female face in `57d9f9d`. The photo stays the male half. Do not mirror the drawing to match the photo. That mirror was `742951a` and it was the mistake.

In `renderConnSvg`, the four shape cases call `svgFaceRows`. Delete `svgF33`, `svgF18`, `svgHo2s4`, and `svgAf6`.

Leave `svgRect6`, `svgIpdmPlug`, and the IPDM grid alone.

The test fails if those four function names exist, and it fails if the `faceRows` on those six cards differ from the orders above. Assert the loaded card, not a regex of the function body.

## Data structures

`faceRows` is an array of rows. Each row is an array of cavity id strings. `null` means a gap, which these six cards do not need. Optional shell fill is one string on the card, read only by `svgFaceRows`.

## Verification

Static. `node test/harness_page_tests.mjs` with `HARNESS_SKIP_BROWSER=1` exits 0. The new assertions fail if `function svgF33` is pasted back.

Runtime. Open the page as a file. For each of the six cards, the cavity order on screen matches `view.ord`. F18's shell is still dark. HO2S is still round. Screenshot those four shapes. A unit test of the row array does not prove the drawer was the one that painted.
