/* DTC search: parse P0183 / p0183 / 0183 (and U-codes) against data/dtc.js. */
(function (root) {
  function foldDtc(s) {
    if (typeof foldQ === 'function') return foldQ(s);
    return String(s || '').normalize('NFKC').toLowerCase();
  }

  function parseDtcQuery(raw) {
    const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    const m = s.match(/^([PU])(\d{4})$/);
    if (m) return [m[1] + m[2]];
    const n = s.match(/^(\d{4})$/);
    if (!n) return [];
    const out = [];
    const table = root.DTC_BY_CODE || {};
    if (table['P' + n[1]]) out.push('P' + n[1]);
    if (table['U' + n[1]]) out.push('U' + n[1]);
    return out;
  }

  function dtcLocalizedName(d, lang) {
    if (!d) return '';
    const L = lang || (typeof root.lang === 'string' ? root.lang : 'es');
    return (d.name && (d.name[L] || d.name.en)) || d.consult || '';
    }

  function dtcSearchLabel(d, lang) {
    const name = dtcLocalizedName(d, lang);
    if (name && name !== d.consult) return d.code + ' · ' + d.consult + ' — ' + name;
    return d.code + ' · ' + (d.consult || name);
  }

  function dtcNoteText(d, tFn) {
    const translate = tFn || (typeof t === 'function' ? t : function (k) { return k; });
    if (!d) return '';
    if (d.note === 'sinCircuito') return translate('dtcNoCirc');
    if (d.note === 'index') return translate('dtcSinDtc');
    if (d.note === 'atSection') return translate('dtcAtSection');
    if (d.note === 'atInternal') return translate('dtcAtInternal');
    if (d.note === 'natsBl') return translate('dtcNatsBl');
    if (d.note === 'natsAmp') return translate('dtcNatsAmp');
    if (d.note === 'natsInit') return translate('dtcNatsInit');
    if (d.note === 'natsMissing') return translate('dtcNatsMissing');
    if (d.note === 'meterCan') return translate('dtcMeterCan');
    if (d.note === 'fuelMeter') return translate('dtcFuelMeter');
    if (d.note === 'canVss') return translate('dtcCanVss');
    if (d.note === 'canLine') return translate('dtcCanLine');
    if (d.kind === 'unmapped' && !(d.ecm && d.ecm.length) && !(d.circ && d.circ.length)) return translate('dtcUnmapped');
    if (d.kind === 'logic' && !(d.related && d.related.length) && !(d.ecm && d.ecm.length)) return translate('dtcNoCirc');
    return '';
  }

  function collectDtcSearch(raw, opts) {
    opts = opts || {};
    const lang = opts.lang || root.lang || 'es';
    const table = root.DTC_LIST || [];
    if (!table.length) return [];
    const exact = parseDtcQuery(raw);
    const q = foldDtc(String(raw || '').trim());
    const rows = [];
    const seen = new Set();
    const push = function (d, rank) {
      if (!d || seen.has(d.code)) return;
      seen.add(d.code);
      rows.push({
        tier: 'dtc',
        kind: 'dtc',
        id: d.code,
        label: dtcSearchLabel(d, lang),
        rank: rank,
        src: d.src,
        consult: d.consult,
      });
    };
    exact.forEach(function (code) {
      push(root.DTC_BY_CODE[code], 0);
    });
    if (q.length >= 3 && !/^\d{1,3}$/.test(q)) {
      table.forEach(function (d) {
        if (seen.has(d.code)) return;
        const blob = foldDtc([d.code, d.consult, d.name && d.name.es, d.name && d.name.en, d.name && d.name.ja].join(' '));
        if (blob.indexOf(q) !== -1) push(d, d.consult && foldDtc(d.consult).indexOf(q) === 0 ? 1 : 2);
      });
    }
    rows.sort(function (a, b) { return a.rank - b.rank || a.id.localeCompare(b.id); });
    return rows;
  }

  function dtcSelectPins(d) {
    const pins = [];
    const seen = new Set();
    function add(list) {
      (list || []).forEach(function (p) {
        const n = +p;
        if (!n || seen.has(n)) return;
        seen.add(n);
        pins.push(n);
      });
    }
    add(d && d.ecm);
    add(d && d.related);
    return pins;
  }

  function dtcCircuitIds(d, pinToCircMap, circuits) {
    const ids = [];
    const seen = new Set();
    function addId(id) {
      if (!id || seen.has(id)) return;
      if (circuits && !circuits.some(function (c) { return c.id === id; })) return;
      seen.add(id);
      ids.push(id);
    }
    (d && d.circ || []).forEach(addId);
    const map = pinToCircMap || root.pinToCirc || {};
    dtcSelectPins(d).forEach(function (p) {
      (map[p] || map[String(p)] || []).forEach(addId);
    });
    return ids;
  }

  root.parseDtcQuery = parseDtcQuery;
  root.dtcLocalizedName = dtcLocalizedName;
  root.dtcSearchLabel = dtcSearchLabel;
  root.dtcNoteText = dtcNoteText;
  root.collectDtcSearch = collectDtcSearch;
  root.dtcSelectPins = dtcSelectPins;
  root.dtcCircuitIds = dtcCircuitIds;
})(typeof window !== 'undefined' ? window : globalThis);
