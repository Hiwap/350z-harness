# Phase 6. Print pack reads those rows

[Overview](overview.md)

## Goal

The print pack stops owning a second A/F pin order. It reads `faceRows` from the card the page already loads.

`make_print_pack.py` around line 504 hardcodes top `5-3-1` and bottom `6-4-2` when `face == "af6"`. That is the same fact `264bec4` had to fix in two places.

## Changes

One file, `make_print_pack.py`.

When a card has `faceRows`, the A/F drawer uses those rows. Delete the hardcoded `5-3-1` / `6-4-2` lists. If the loaded card has no `faceRows`, the pack fails with the connector id. A silent fallback would put the old list back.

Do not redraw F33, F18, or HO2S in the pack unless **how** shows the pack already draws them with a second hardcoded order. This session the only special order found was `af6`.

## Data structures

The pack reads `faceRows` off `CONN_BASE`. No new field.

## Verification

Static. The loader returns `af_b1.faceRows` as `[['5','3','1'],['6','4','2']]`. The python source no longer contains a private copy of that order. Prefer deleting the lists over a test that matches their text.

Runtime. Build `en`, `es`, and `ja` packs to `PRINT_PACK_OUT` in the temp directory. Each command exits 0. Open the English pdf and confirm the A/F card cavity order is 5-3-1 over 6-4-2. Use the pdf skill if a visual check is needed. Do not replace the committed pdfs unless the maintainer asks.
