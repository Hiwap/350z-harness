import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { loadMap } from "../test/load_map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = path.join(root, "index.html");
const m = loadMap(html);
const ctx = { CONN_BASE: m.CONN_BASE, CONN: m.CONN_BASE, lang: "es" };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data/sm_values.js"), "utf8"), ctx);

const langs = ["es", "en", "ja"];
const cards = {};
for (const [cid, f] of Object.entries(m.CONN_BASE)) {
  const pins = {};
  for (const p of (f.pins || [])) {
    const rec = {};
    let any = false;
    for (const L of langs) {
      const lines = ctx.smPinLines(cid, p, L).map((x) => ({ text: x.text, src: x.src, pins: x.pins }));
      rec[L] = lines;
      if (lines.length) any = true;
    }
    if (any) pins[String(p.id)] = rec;
  }
  const rowsRaw = ctx.smRowsForCard(cid);
  let rows = null;
  if (rowsRaw && rowsRaw.none) rows = { none: true };
  else if (Array.isArray(rowsRaw) && rowsRaw.length) {
    rows = rowsRaw.map((e) => {
      const o = { pins: e.pins || "", src: e.src || "" };
      for (const L of langs) {
        const loc = ctx.smLoc(e, L);
        o[L] = { value: ctx.smCompactText(loc.value || ""), cond: loc.cond || "" };
      }
      return o;
    });
  }
  if (Object.keys(pins).length || rows) cards[cid] = { pins, rows };
}
const ecm = {};
for (let n = 1; n <= 121; n++) {
  const rec = {};
  let any = false;
  for (const L of langs) {
    const lines = ctx.smEcmLines(n, L).map((x) => ({ text: x.text, src: x.src, pins: x.pins }));
    rec[L] = lines;
    if (lines.length) any = true;
  }
  if (any) ecm[String(n)] = rec;
}
process.stdout.write(JSON.stringify({ cards, ecm }));
