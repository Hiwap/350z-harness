# Phase 1. Shared loader

[Overview](overview.md)

## Goal

One function loads `CONN_BASE`, `PIN_COL`, `PIN_RAIL`, and `buildCircuits` from `index.html`. `test/fsm_routes.mjs` and `test/variants.mjs` call it. The page does not change.

This is the lever. Later phases change where the bytes live. Callers stay on this function.

## Changes

- Add `test/load_map.mjs`. It reads `index.html`, finds the same anchors `test/fsm_routes.mjs` uses today, and returns the evaluated objects.
- Switch `test/fsm_routes.mjs` `loadMap` to that function. Delete the inline slice.
- Switch the `CONN_BASE` slice in `test/variants.mjs` to the same function.

Do not point `make_print_pack.py` here yet. Its end anchor is `const LS_LOOM`, not `const CONN_FACE`. Phase 2 proves the returned `CONN_BASE` matches before that caller moves.

## Data structures

`loadMap(htmlPath)` returns `{ CONN_BASE, PIN_COL, PIN_RAIL, early, rev }`. `early` is `buildCircuits("de_early")`. `rev` is `buildCircuits("de_revup")`. Same object `test/fsm_routes.mjs` builds now.

## Verification

Static. `node test/fsm_routes.mjs` and `node test/variants.mjs` exit 0. The route file `test/fsm_ecm_routes.json` is unchanged.

Runtime. There is no page change, so Chrome is the wrong check. The runtime of this phase is the route comparison inside `test/fsm_routes.mjs`. It evaluates `buildCircuits` and compares the result to the FSM table.

Prove the anchor still matters. A one-off copy of the html with `const CONN_FACE = {` renamed must throw `anchor missing`. Do not commit that copy.
