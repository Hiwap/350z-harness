/* Color-query parser for the harness search box. Classic script (no exports).
   Understands FSM codes (W/L, l\w, L.W, LW) and colour names in es / en / ja. */
(function (global) {
  'use strict';

  const COLOR_CANON = {
    B: 'B', W: 'W', R: 'R', G: 'G', L: 'L', Y: 'Y',
    LG: 'LG', BR: 'BR', OR: 'OR', O: 'OR', P: 'P', PU: 'PU', V: 'PU',
    GY: 'GY', SB: 'SB', CH: 'CH', DG: 'DG'
  };
  const COLOR_CODE_KEYS = Object.keys(COLOR_CANON).sort(function (a, b) { return b.length - a.length; });

  /* Folded name → one or more FSM codes. Multi-code slots are aliases (celeste ≈ L and SB). */
  const COLOR_NAME_ALIASES = {
    /* official cname + common names, Spanish */
    negro: ['B'], blanco: ['W'], rojo: ['R'], verde: ['G'], azul: ['L'],
    amarillo: ['Y'], naranja: ['OR'], anaranjado: ['OR'], rosa: ['P'], rosado: ['P'],
    violeta: ['PU'], purpura: ['PU'], lila: ['PU'], morado: ['PU'],
    gris: ['GY'], marron: ['BR'], cafe: ['BR'], castano: ['BR'],
    'v.claro': ['LG'], 'verde claro': ['LG'], 'verde lima': ['LG'], lima: ['LG'],
    celeste: ['L', 'SB'], 'azul claro': ['L', 'SB'], 'azul cielo': ['L', 'SB'],
    'marron oscuro': ['CH'], 'cafe oscuro': ['CH'], 'verde oscuro': ['DG'],
    /* English */
    black: ['B'], white: ['W'], red: ['R'], green: ['G'], blue: ['L'],
    yellow: ['Y'], orange: ['OR'], pink: ['P'], purple: ['PU'], violet: ['PU'],
    gray: ['GY'], grey: ['GY'], brown: ['BR'],
    'lt.green': ['LG'], 'lt green': ['LG'], 'light green': ['LG'],
    sky: ['L', 'SB'], 'sky blue': ['L', 'SB'], 'light blue': ['L', 'SB'],
    'dark brown': ['CH'], 'dark green': ['DG'],
    /* Japanese (hiragana is folded to katakana) */
    '黒': ['B'], 'クロ': ['B'], 'ブラック': ['B'],
    '白': ['W'], 'シロ': ['W'], 'ホワイト': ['W'],
    '赤': ['R'], 'アカ': ['R'], 'レッド': ['R'],
    '緑': ['G'], 'ミドリ': ['G'], 'グリーン': ['G'],
    '青': ['L'], 'アオ': ['L'], 'ブルー': ['L'],
    '黄': ['Y'], '黄色': ['Y'], 'キイロ': ['Y'], 'イエロー': ['Y'],
    '橙': ['OR'], '橙色': ['OR'], 'オレンジ': ['OR'], 'ダイダイ': ['OR'],
    '桃': ['P'], '桃色': ['P'], 'ピンク': ['P'], 'モモイロ': ['P'],
    '紫': ['PU'], 'ムラサキ': ['PU'], 'パープル': ['PU'],
    '灰': ['GY'], '灰色': ['GY'], 'グレー': ['GY'], 'グレイ': ['GY'], 'ハイイロ': ['GY'],
    '茶': ['BR'], '茶色': ['BR'], 'チャ': ['BR'], 'ブラウン': ['BR'],
    '黄緑': ['LG'], '薄緑': ['LG'], 'ウスミドリ': ['LG'], 'ライトグリーン': ['LG'],
    '水色': ['L', 'SB'], 'ミズイロ': ['L', 'SB'], 'スカイブルー': ['L', 'SB'], 'ライトブルー': ['L', 'SB'],
    '濃い茶': ['CH'], 'コイチャ': ['CH'], 'ダークブラウン': ['CH'],
    '濃い緑': ['DG'], 'コイミドリ': ['DG'], 'ダークグリーン': ['DG']
  };

  function foldColor(s) {
    return String(s || '').normalize('NFKC').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u3041-\u3096]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) + 0x60); });
  }

  function colorNameMap() {
    const map = {};
    Object.keys(COLOR_NAME_ALIASES).forEach(function (k) { map[foldColor(k)] = COLOR_NAME_ALIASES[k]; });
    if (typeof I18N !== 'undefined') {
      Object.keys(I18N).forEach(function (lang) {
        const cn = I18N[lang] && I18N[lang].cname;
        if (!cn) return;
        Object.keys(cn).forEach(function (code) {
          const folded = foldColor(cn[code]);
          if (!folded || map[folded]) return;
          const canon = COLOR_CANON[String(code).toUpperCase()] || String(code).toUpperCase();
          map[folded] = [canon];
        });
      });
    }
    return map;
  }

  function parseCodeLetters(s) {
    const src = String(s || '').toUpperCase();
    if (!src) return null;
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      let hit = null;
      for (let k = 0; k < COLOR_CODE_KEYS.length; k++) {
        const key = COLOR_CODE_KEYS[k];
        if (src.startsWith(key, i)) { hit = key; break; }
      }
      if (!hit) return null;
      tokens.push(COLOR_CANON[hit]);
      i += hit.length;
    }
    return tokens.length ? tokens : null;
  }

  const SEP_TOKEN = /^(?:con|and|with|y)(?![a-z])\s*|^(?:と|ト)\s*|^[\/\\．.・·\-_,、／＼]+\s*/;

  function parseColorQuery(raw) {
    const q = foldColor(String(raw || '').trim());
    if (!q) return null;
    const names = colorNameMap();
    const nameKeys = Object.keys(names).sort(function (a, b) { return b.length - a.length; });
    const slots = [];
    let i = 0;
    while (i < q.length) {
      while (i < q.length && /\s/.test(q[i])) i++;
      if (i >= q.length) break;
      const rest = q.slice(i);
      const sep = rest.match(SEP_TOKEN);
      if (sep) {
        if (!slots.length) return null;
        i += sep[0].length;
        continue;
      }
      let found = null;
      let foundLen = 0;
      for (let n = 0; n < nameKeys.length; n++) {
        const nk = nameKeys[n];
        if (!nk || !rest.startsWith(nk)) continue;
        const after = rest.slice(nk.length);
        if (after.length && /[a-z]/.test(after[0]) && !SEP_TOKEN.test(after) && !/^\s/.test(after)) continue;
        found = names[nk];
        foundLen = nk.length;
        break;
      }
      if (found) {
        slots.push(found.slice());
        i += foundLen;
        continue;
      }
      const codeRun = rest.match(/^[a-z]+/);
      if (codeRun) {
        const toks = parseCodeLetters(codeRun[0]);
        if (!toks) return null;
        for (let t = 0; t < toks.length; t++) slots.push([toks[t]]);
        i += codeRun[0].length;
        continue;
      }
      return null;
    }
    if (!slots.length || slots.length > 2) return null;
    return { slots: slots };
  }

  function wireColorTokens(code) {
    if (code == null) return null;
    const s = String(code).trim();
    if (!s || s === '—' || s === '-' || s === '·' || s === 'nc' || s === '?' || s === '12V' || /^\d+A$/i.test(s)) return null;
    const parts = s.split('/');
    const toks = [];
    for (let i = 0; i < parts.length; i++) {
      const raw = parts[i].trim().toUpperCase();
      if (!raw) return null;
      const canon = COLOR_CANON[raw];
      if (!canon) return null;
      toks.push(canon);
    }
    return toks.length ? toks : null;
  }

  function normalizeWireCode(code) {
    const toks = wireColorTokens(code);
    return toks ? toks.join('/') : '';
  }

  /* 0 = exact order, 1 = swapped / partial (single-colour hits a striped wire), -1 = no match.
     'P' matches P and P/B but never PU. Two-colour queries match only two-token codes. */
  function colorMatchRank(code, query) {
    if (!query || !query.slots) return -1;
    const toks = wireColorTokens(code);
    if (!toks) return -1;
    const slots = query.slots;
    if (slots.length === 1) {
      const want = slots[0];
      return toks.some(function (t) { return want.indexOf(t) !== -1; }) ? 0 : -1;
    }
    if (slots.length === 2) {
      if (toks.length !== 2) return -1;
      const a = toks[0], b = toks[1];
      const s0 = slots[0], s1 = slots[1];
      const exact = s0.indexOf(a) !== -1 && s1.indexOf(b) !== -1;
      const swap = s0.indexOf(b) !== -1 && s1.indexOf(a) !== -1;
      if (exact) return 0;
      if (swap) return 1;
      return -1;
    }
    return -1;
  }

  function formatColorQuery(query) {
    if (!query || !query.slots) return '';
    return query.slots.map(function (s) { return s[0]; }).join('/');
  }

  global.parseColorQuery = parseColorQuery;
  global.wireColorTokens = wireColorTokens;
  global.normalizeWireCode = normalizeWireCode;
  global.colorMatchRank = colorMatchRank;
  global.formatColorQuery = formatColorQuery;
  global.foldColor = foldColor;
})(typeof window !== 'undefined' ? window : globalThis);
