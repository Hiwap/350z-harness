function updateSelectedTop(connIds){
  removeSelectedTop();
  const root = document.getElementById('fichas');
  if(!root) return;
  const ids = [...new Set((connIds||[]).filter(id => id && CONN[id] && id !== 'ix_f102_m72' && !SKIP_SEL_CONN.has(id)))];
  if(ids.length < 1) return;

  /* One rail toggle ON → subgroup by line (bobinas, iny, heaters…). Else by subcategory. */
  if(typeof railLineGroupsEnabled === 'function' && railLineGroupsEnabled()){
    const byLine = new Map(); /* lineId → [connIds] */
    ids.forEach(id=>{
      let lines = primaryLinesForConn(id);
      if(!lines.length) lines = ['_other'];
      lines.forEach(line=>{
        if(!byLine.has(line)) byLine.set(line, []);
        byLine.get(line).push(id);
      });
    });
    const lineKeys = RAIL_LINE_ORDER.filter(k => byLine.has(k));
    if(byLine.has('_other')) lineKeys.push('_other');
    /* Need 2+ lines for line-nests. One line (e.g. Arnès motor + 5V hides APP) → fall through to subcategory groups. */
    if(lineKeys.length >= 2){
    const names = lineKeys.map(k => k === '_other' ? t('hlLegRelData') : railLineLabel(k));
    const top = document.createElement('details');
    top.id = 'selTop';
    top.className = 'ficha-sec sel-top';
    top.open = true;
    const sum = document.createElement('summary');
    sum.innerHTML = `${esc(String(lineKeys.length) + ' ' + t('selTopLines'))}<span>${esc(names.join(', '))}</span>`;
    top.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'fichas-body';

    lineKeys.forEach(line=>{
      const lineIds = byLine.get(line) || [];
      const nest = document.createElement('details');
      nest.className = 'ficha-nest sel-line';
      nest.open = true;
      const color = (line !== '_other' && RAIL_LINE[line]) ? RAIL_LINE[line].color : '#888';
      const nsum = document.createElement('summary');
      const lab = line === '_other' ? (lang==='en'?'Other':lang==='ja'?'その他':'Otros') : railLineLabel(line);
      nsum.innerHTML = `<span class="opts-hl-swatch" style="background:${color};vertical-align:middle;margin-right:6px"></span><span class="sub-label">${esc(lab)}</span>`;
      nsum.style.borderLeft = '3px solid ' + color;
      nest.appendChild(nsum);
      const ngrid = document.createElement('div');
      ngrid.className = 'fichas-grid';
      const ordered = lineIds.slice().sort((a,b)=> String(CONN[a].name).localeCompare(String(CONN[b].name)));
      ordered.forEach(id=>{
        const el = makeFichaEl(id, CONN[id], {ipdmIcon:true});
        el.classList.add('hl');
        el.classList.remove('dim');
        ngrid.appendChild(el);
      });
      nest.appendChild(ngrid);
      body.appendChild(nest);
    });

    top.appendChild(body);
    root.insertBefore(top, root.firstChild);
    return;
    } /* end lineKeys.length >= 2 */
  }

  // Distinct subcategory buckets in SUB_ORDER
  const bucketKeys = [];
  const seen = new Set();
  const orderedIds = ids.slice().sort((a,b)=>{
    const sa = SUB_ORDER.indexOf(CONN[a].sub||'other');
    const sb = SUB_ORDER.indexOf(CONN[b].sub||'other');
    return (sa<0?999:sa) - (sb<0?999:sb);
  });
  orderedIds.forEach(id=>{
    const s = CONN[id].sub || 'other';
    if(seen.has(s)) return;
    seen.add(s);
    bucketKeys.push(s);
  });
  const names = bucketKeys.map(s => selectedBucketLabel(s));
  const nBuckets = bucketKeys.length;
  /* Seleccionados when 2+ distinct groups OR 2+ fichas in the same sub (e.g. VTC + F18). */
  if(nBuckets < 2 && ids.length < 2) return;

  const top = document.createElement('details');
  top.id = 'selTop';
  top.className = 'ficha-sec sel-top';
  top.open = true;
  const sum = document.createElement('summary');
  if(nBuckets >= 2){
    sum.innerHTML = `${esc(String(nBuckets) + ' ' + t('selTopGroups'))}<span>${esc(names.join(', '))}</span>`;
  } else {
    const subLab = names[0] || '';
    sum.innerHTML = `${esc(String(ids.length) + ' ' + t('selTopFichas'))}<span>${esc(subLab)}</span>`;
  }
  top.appendChild(sum);
  const body = document.createElement('div');
  body.className = 'fichas-body';

  function appendFicha(grid, id){
    const el = makeFichaEl(id, CONN[id], {ipdmIcon:true});
    el.classList.add('hl');
    el.classList.remove('dim');
    grid.appendChild(el);
  }

  const grid = document.createElement('div');
  grid.className = 'fichas-grid';
  const ordered = ids.slice().sort((a,b)=>{
    const sa = SUB_ORDER.indexOf(CONN[a].sub||'other');
    const sb = SUB_ORDER.indexOf(CONN[b].sub||'other');
    const ia = sa<0?999:sa, ib = sb<0?999:sb;
    if(ia!==ib) return ia-ib;
    return String(CONN[a].name).localeCompare(String(CONN[b].name));
  });
  ordered.forEach(id => appendFicha(grid, id));
  body.appendChild(grid);
  top.appendChild(body);
  root.insertBefore(top, root.firstChild);
}

function clearSelectionClasses(){
  clearHlGroupColor();
  document.querySelectorAll('.pin,.ficha,.ficha-wrap,.cav-hit,.f102-panel').forEach(el=>{
    el.classList.remove('hl','hl-end','hl-group','dim','hl-rail','hl-rail-rel','hl-rail-rel-gnd','hl-rail-rel-data','hl-rail-rel-power','rail-5v','rail-12v','rail-gnd');
    stripRailLineClasses(el);
    clearHlGroupElColor(el);
  });
  /* Explicit ECM/F102 pass — dim must never stick after deselect */
  document.querySelectorAll('#blocks .pin, #f102Blocks .pin').forEach(el=>{
    el.classList.remove('hl','hl-end','hl-group','dim','hl-rail','hl-rail-rel','hl-rail-rel-gnd','hl-rail-rel-data','hl-rail-rel-power','rail-5v','rail-12v','rail-gnd');
    stripRailLineClasses(el);
    clearHlGroupElColor(el);
  });
}

function clearSelection(){
  selKey = null;
  selFocusPin = null;
  lastCircIds = [];
  activeRails.clear(); updateRailButtons();
  clearHL();
  clearSelDesc();
  const info = document.getElementById('info');
  if(info){
    delete info.dataset.locked;
    delete info.dataset.railMode;
    info.textContent = t('infoEmpty');
  }
}

function applyRailFilter(opts){
  updateRailButtons();
  if(!activeRails.size){
    clearHL();
    const info = document.getElementById('info');
    if(info && info.dataset.railMode){
      delete info.dataset.locked;
      delete info.dataset.railMode;
      info.textContent = t('infoEmpty');
    }
    return;
  }

  /* Do not mix circuit-selection retarget with rail mode */
  lastCircIds = [];
  if(!opts || !opts.focusing){
    selKey = null;
    selFocusPin = null;
  }

  const railEcm = new Set();
  Object.entries(PIN_RAIL).forEach(([pin, r])=>{
    if(activeRails.has(r)) railEcm.add(Number(pin));
  });

  function railOfEcm(ecm){
    if(ecm == null || ecm === '') return null;
    const r = PIN_RAIL[Number(ecm)];
    return (r && activeRails.has(r)) ? r : null;
  }

  /* Primary = ECM pins on PIN_RAIL (+ bare 12V/5V feed cavities without ECM).
     GND cavities that only have pin.rail (not PIN_RAIL ecm) stay for Tierras relacionadas. */
  const matchedConns = new Set();
  const litLines = new Set();
  function isRailPrimaryPin(pin){
    if(!pin) return false;
    if(railOfEcm(pin.ecm)) return true;
    /* Bare power feeds (no ECM): show as primary for 5V/12V line colors — not GND */
    if((pin.ecm==null || pin.ecm==='') && pin.rail && activeRails.has(pin.rail) && pin.rail !== 'gnd') return true;
    return false;
  }
  function primaryRailAndLine(cid, pin){
    if(!isRailPrimaryPin(pin)) return null;
    const r = railOfEcm(pin.ecm) || pin.rail;
    if(!r || !activeRails.has(r)) return null;
    const line = railLineOfCav(cid, pin) || railLineOfEcm(pin.ecm);
    if(line) litLines.add(line);
    return { rail:r, line };
  }
  Object.entries(CONN).forEach(([cid, conf])=>{
    (conf.pins||[]).forEach(pin=>{
      if(primaryRailAndLine(cid, pin)) matchedConns.add(cid);
    });
  });

  const relCirc = new Set();
  const relEcm = new Set();
  const wantRelated = railRelGndEnabled() || railRelDataEnabled() || railRelPowerEnabled();
  if(wantRelated){
    railEcm.forEach(p=>{
      (pinToCirc[p] || pinToCirc[String(p)] || []).forEach(id => relCirc.add(id));
    });
    const REL_CONN_MAX = 4;
    relCirc.forEach(id=>{
      const cir = CIRCUITS.find(x => x.id === id);
      if(!cir) return;
      (cir.ecm || []).forEach(p => relEcm.add(Number(p)));
      const conns = cir.conn || [];
      if(conns.length <= REL_CONN_MAX){
        conns.forEach(c => {
          if(typeof connVisibleInLoom === 'function' && !connVisibleInLoom(c)) return;
          matchedConns.add(c);
        });
      }
    });
  }

  /* Sensor ground returns (circuits with gndRel: F35·2, F38·1, F42·1 → F103·3 → F152).
     Signal-pin clicks show only the signal path; these appear with Masa (+ Tierras relacionadas)
     or when the ground cavity itself is clicked. Only their path cavities are painted. */
  const gndRelCavs = {};
  const gndRelOnlyConns = new Set();
  if(activeRails.has('gnd') && railRelGndEnabled()){
    CIRCUITS.forEach(cir=>{
      if(!cir.gndRel) return;
      Object.entries(cir.path || {}).forEach(([cid, cavs])=>{
        if(!CONN[cid]) return;
        if(typeof connVisibleInLoom === 'function' && !connVisibleInLoom(cid)) return;
        (gndRelCavs[cid] = gndRelCavs[cid] || new Set());
        (cavs || []).forEach(c => gndRelCavs[cid].add(String(c)));
        if(!matchedConns.has(cid)) gndRelOnlyConns.add(cid);
      });
    });
    gndRelOnlyConns.forEach(cid => matchedConns.add(cid));
  }

  clearHL();
  /* Open / clone fichas first (selTop may rebuild DOM), then paint cavities on the final nodes. */
  matchedConns.forEach(cid => markFichaHL(cid, true));
  revealConns([...matchedConns]);
  matchedConns.forEach(cid => markFichaHL(cid, true));

  dimAll();
  document.querySelectorAll('.cav-hit').forEach(el => el.classList.add('dim'));
  matchedConns.forEach(cid => markFichaHL(cid, true));

  /* Primary ECM */
  document.querySelectorAll('#blocks .pin[data-pin]').forEach(el=>{
    const r = railOfEcm(el.dataset.pin);
    if(!r) return;
    const line = railLineOfEcm(el.dataset.pin);
    if(line) litLines.add(line);
    markRailPrimaryEl(el, r, line);
  });
  /* Primary F102 */
  document.querySelectorAll('#f102Blocks .pin').forEach(el=>{
    const r = railOfEcm(el.dataset.ecm);
    if(!r) return;
    const line = railLineOfEcm(el.dataset.ecm);
    if(line) litLines.add(line);
    markRailPrimaryEl(el, r, line);
    const panel = document.getElementById('f102Panel');
    if(panel) panel.classList.add('hl');
  });
  /* Primary ficha cavities */
  Object.entries(CONN).forEach(([cid, conf])=>{
    (conf.pins||[]).forEach(pin=>{
      const hit = primaryRailAndLine(cid, pin);
      if(!hit) return;
      document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(pin.id))}"]`).forEach(cav=>{
        markRailPrimaryEl(cav, hit.rail, hit.line);
      });
      if(cid === 'ix_f102_m72'){
        const fp = f102PinEl(pin.id);
        if(fp) markRailPrimaryEl(fp, hit.rail, hit.line);
      }
    });
  });

  if(wantRelated){
    const f102Allow = f102AllowForCircuits([...relCirc]);
    relEcm.forEach(p=>{
      if(railEcm.has(p)) return;
      const el = document.querySelector(`#blocks .pin[data-pin="${p}"]`);
      markRailRelEl(el, railRelKindForEcm(p));
    });
    matchedConns.forEach(cid=>{
      const conf = CONN[cid] || CONN_BASE[cid];
      (conf && conf.pins || []).forEach(pin=>{
        if(!cavHasWire(pin)) return; /* empty / nc / ? stay dim */
        if(gndRelOnlyConns.has(cid) && !(gndRelCavs[cid] && gndRelCavs[cid].has(String(pin.id)))) return;
        if(isRailPrimaryPin(pin)) return; /* primary already (ECM rail or bare 5V/12V feed) */
        if(cid === 'ix_f102_m72'){
          const e = pin.ecm != null ? Number(pin.ecm) : null;
          const ok = (f102Allow && f102Allow.has(String(pin.id)))
            || (e != null && (relEcm.has(e) || railEcm.has(e)));
          if(!ok) return;
        }
        const kind = railRelKindForCav(pin);
        document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(pin.id))}"]`).forEach(cav=>{
          markRailRelEl(cav, kind);
        });
        if(cid === 'ix_f102_m72'){
          markRailRelEl(f102PinEl(pin.id), kind);
        }
        if(pin.ecm != null){
          const e = Number(pin.ecm);
          if(!railEcm.has(e)){
            const el = document.querySelector(`#blocks .pin[data-pin="${e}"]`);
            markRailRelEl(el, railRelKindForEcm(e));
          }
        }
      });
    });
  }

  updateEcmSelCount();
  updateF102SelPins();

  const labels = {gnd: t('railGnd'), '12v':'12V', '5v':'5V'};
  const colors = {gnd:'#2E7D32', '12v':'#C62828', '5v':'#F9A825'};
  const pills = [...activeRails].map(r =>
    `<span class="pill" style="border-color:${colors[r]};color:${colors[r]}">${labels[r]}</span>`
  ).join(' ');
  const lineOrder = ['5v_app','5v_sns','12v_coil','12v_inj','12v_ht','12v_vb','12v_batt','12v_vmot','12v_other','gnd_pwr','gnd_sns','gnd_app'];
  const linePills = lineOrder.filter(id => litLines.has(id)).map(id => {
    const meta = RAIL_LINE[id];
    return `<span class="pill" style="border-color:${meta.color};color:${meta.color}">${esc(railLineLabel(id))}</span>`;
  }).join(' ');
  const info = document.getElementById('info');
  info.dataset.locked = '1';
  info.dataset.railMode = '1';
  info.innerHTML = `<div>${pills}<b>${esc(t('railActive'))}</b> — ${esc(t('railActiveHint'))}</div>` +
    (linePills ? `<div style="margin-top:4px;color:var(--muted)">${linePills}</div>` : '');
}

function selectCircuits(circIds, focusPin=null, focusConn=null, focusCav=null){
  circIds = [...new Set((circIds||[]).filter(Boolean))];
  lastCircIds = circIds.slice();
  activeRails.clear(); updateRailButtons();
  clearHL();
  if(!circIds.length){ const info=document.getElementById('info'); info.dataset.locked='1'; info.textContent=t('noCirc'); clearHlGroupColor(); return; }
  dimAll();
  setHlGroupColor(hlGroupColorForCircuits(circIds, focusPin));
  const ecmSet=new Set(); const connSet=new Set();
  const lines=[];
  const seenCircLine = new Set();
  const pathCavByConn = new Map(); /* cid -> Set(cavId) — feeds sin pin ECM (F3-5, E7-17, rail…) */
  const sigFocusNoRail = focusPin!=null && focusPin!=='' && !PIN_RAIL[Number(focusPin)] && !railRelPowerEnabled();
  /* rail -> { seen:Set(cid·cav), chains:[[label…] per circuit] } for the route tag lines */
  const pathStepsByRail = new Map();
  const addPathSteps = (cir) => {
    if(!cir || !cir.path) return;
    const r = circuitPathRail(cir);
    if(!pathStepsByRail.has(r)) pathStepsByRail.set(r, { seen:new Set(), chains:[] });
    const g = pathStepsByRail.get(r);
    const chain = [];
    Object.entries(cir.path).forEach(([cid, cavs]) => {
      const conf = CONN[cid] || CONN_BASE[cid];
      (cavs || []).forEach(cav => {
        const k = cid + '·' + cav;
        if(g.seen.has(k)) return;
        g.seen.add(k);
        const pin = (conf && conf.pins || []).find(x => String(x.id)===String(cav));
        chain.push({cid, cav:String(cav), pin, html:esc(pathStepLabel(cid, cav, pin))});
      });
    });
    /* Display order runs out from the ECM: the sensor or the far connector is last. */
    if(typeof orientPathSteps === 'function') orientPathSteps(chain);
    if(chain.length) g.chains.push(chain.map(s => s.html));
  };
  circIds.forEach(id=>{
    const cir=CIRCUITS.find(x=>x.id===id);
    if(!cir) return;
    cir.ecm.forEach(p=>ecmSet.add(p));
    cir.conn.forEach(cid=>connSet.add(cid));
    if(cir.path){
      Object.entries(cir.path).forEach(([cid, cavs])=>{
        /* path = Alim. 12V cavity HL — fichas join Selección only if Alim. is on.
           SIG-pin click: rail-only (12V / GND) path cavities stay dark unless Alim. relacionada is on
           (route tag text still lists them). Exception: cir.shieldPath (knock shield, EC-317). */
        if(!pathCavByConn.has(cid)) pathCavByConn.set(cid, new Set());
        (cavs||[]).forEach(c => {
          if(sigFocusNoRail && !cir.shieldPath && pathStepRailOnly(cid, c)) return;
          pathCavByConn.get(cid).add(String(c));
        });
      });
      addPathSteps(cir);
    }
    if(seenCircLine.has(cir.id)) return;
    seenCircLine.add(cir.id);
    lines.push(`<div><b style="color:${cir.color}">${circuitTitle(cir)}</b> — ${circuitNotes(cir)}</div>`);
  });
  attachPowerPathFichas(circIds, connSet, pathCavByConn, addPathSteps);
  attachGroundPathFichas(circIds, connSet, pathCavByConn, addPathSteps);
  attachAlimPathFichas(pathCavByConn, connSet, focusConn);
  if(focusConn && FUSE_BOX_CONNS.has(focusConn)) connSet.add(focusConn);
  attachDataRelatedEcm(circIds, ecmSet);
  /* Loom filter: drop body/rear fichas when viewing pulled engine harness */
  [...connSet].forEach(cid => { if(!connVisibleInLoom(cid)) connSet.delete(cid); });
  /* Feed card focus: keep related fichas, but ECM label/highlight = control pins only */
  if(focusConn && FEED_ECM_FOCUS[focusConn]){
    ecmSet.clear();
    FEED_ECM_FOCUS[focusConn].forEach(p=>ecmSet.add(p));
    connSet.add(focusConn);
  }
  /* sns_gnd (and any circuit with empty conn): open fichas that actually carry the focused ECM pin
     (e.g. 78 → HO2S B1/B2 GND). Avoids a dead selection without fan-out to every sensor. */
  {
    const circObjs = circIds.map(id => CIRCUITS.find(x=>x.id===id)).filter(Boolean);
    const allEmptyConn = circObjs.length > 0 && circObjs.every(c => !(c.conn && c.conn.length));
    if(allEmptyConn && focusPin!=null){
      const n = Number(focusPin);
      Object.entries(CONN).forEach(([cid, conf])=>{
        if(SKIP_SEL_CONN.has(cid)) return;
        if((conf.pins||[]).some(p => p.ecm!=null && Number(p.ecm)===n)) connSet.add(cid);
      });
    }
  }
  /* Auto-attach F102 only if the focused ECM pin (or declared SMJ cavities) actually sit on F102.
     Shared SNS 67 on 20H must not open the panel for 66 / 70 / PSP / etc. */
  const f102Allow = f102AllowForCircuits(circIds, focusConn==='ix_f102_m72' ? focusCav : null);
  const f102Hits = f102HitsForEcm(ecmSet, focusPin, f102Allow);
  /* Explicit cir.f102 only (e.g. backup 22H). Path.ix_f102_m72 stays Alim-gated (inj 17H). */
  const f102Declared = new Set();
  (circIds||[]).forEach(id=>{
    const cir = CIRCUITS.find(x=>x.id===id);
    if(cir && Array.isArray(cir.f102)) cir.f102.forEach(c=>f102Declared.add(String(c)));
  });
  const alimF102 = railRelPowerEnabled() && pathCavByConn.has('ix_f102_m72') && connSet.has('ix_f102_m72');
  const keepF102 = focusConn==='ix_f102_m72' || f102Hits.length > 0 || alimF102 || f102Declared.size > 0;
  const collapseF102 = !keepF102;
  if(!keepF102) connSet.delete('ix_f102_m72');
  if(keepF102){
    connSet.add('ix_f102_m72');
    const bits = [];
    if(f102Hits.length){
      f102Hits.forEach(p=>{
        const lab = p.lab ? ` ${esc(p.lab)}` : '';
        const focus = (focusPin!=null && Number(p.ecm)===Number(focusPin)) || (focusConn==='ix_f102_m72' && String(focusCav)===String(p.id));
        const tag = focus ? '<b>' : '';
        const tagE = focus ? '</b>' : '';
        bits.push(`${tag}<code>F102·${esc(String(p.id))}</code>${lab} · ${esc(p.code||'')} → ECM ${esc(String(p.ecm))}${tagE}`);
      });
    } else if(f102Declared.size){
      [...f102Declared].forEach(cav=>{
        const conf = f102Conf();
        const p = (conf && conf.pins || []).find(x => String(x.id)===String(cav));
        const lab = p && p.lab ? ` ${esc(p.lab)}` : '';
        const code = p && p.code ? ` · ${esc(p.code)}` : '';
        const focus = focusConn==='ix_f102_m72' && String(focusCav)===String(cav);
        const tag = focus ? '<b>' : '';
        const tagE = focus ? '</b>' : '';
        bits.push(`${tag}<code>F102·${esc(String(cav))}</code>${lab}${code}${tagE}`);
      });
    }
    if(bits.length){
      lines.push(`<div style="color:var(--muted);margin-top:4px"><span class="pill" style="border-color:#90a4ae;color:#90a4ae">F102</span>${bits.join(' · ')}</div>`);
    }
  }
  SKIP_SEL_CONN.forEach(id => connSet.delete(id));
  /* The clicked card always stays in the selection (lit, its group open), even when the circuit's
     conn list does not name it (e.g. IPDM E7·18 → ECM 119, E8·42 → ECM 3, E7·26 / E10·2 → backup_lamp).
     Otherwise its group collapses and the 2nd click that should deselect cannot be made. */
  if(focusConn && CONN[focusConn] && !SKIP_SEL_CONN.has(focusConn)) connSet.add(focusConn);
  ecmSet.forEach(p=>{
    const el=document.querySelector(`#blocks .pin[data-pin="${p}"]`);
    if(!el) return;
    el.classList.remove('dim');
    if(focusPin!=null && Number(p)===Number(focusPin)){ el.classList.add('hl'); clearHlGroupElColor(el); }
    else {
      const kind = circuitSiblingKindEcm(p);
      if(!circuitSiblingAllowed(kind)){ el.classList.add('dim'); clearHlGroupElColor(el); return; }
      applyHlGroupEl(el, accentForEcmPin(p) || hlGroupColorForCircuits(circIds, focusPin));
    }
  });
  /* Label = DOM-highlighted pins (yellow focus + Relacionados group / rail-rel). */
  updateEcmSelCount();
  connSet.forEach(cid=>{
    markFichaHL(cid, true);
    if(cid === 'ix_f102_m72' && !collapseF102){
      const panel = document.getElementById('f102Panel');
      if(panel) panel.classList.add('hl');
    }
    const conf=CONN[cid];
    if(!conf) return;
    (conf.pins || []).forEach(p=>{
      const isFocusCav = focusConn===cid && String(focusCav)===String(p.id);
      const onFocusEcm = focusPin!=null && p.ecm!=null && Number(p.ecm)===Number(focusPin);
      const onPathEcm = p.ecm!=null && ecmSet.has(Number(p.ecm));
      const onPathFeed = pathCavByConn.has(cid) && pathCavByConn.get(cid).has(String(p.id));
      /* Only path cavities stay lit (E9/OBD have many off-path pins). */
      if(!(isFocusCav || onFocusEcm || onPathEcm || onPathFeed)) return;
      /* exact pin = yellow hl; siblings only if Tierras/Data allow that kind */
      const isFocus = (isFocusCav || onFocusEcm);
      const gCol = accentForCav(cid, p) || hlGroupColorForCircuits(circIds, focusPin);
      const sibKind = circuitSiblingKindCav(p);
      const sibOk = isFocus || onPathFeed || circuitSiblingAllowed(sibKind);
      document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(p.id))}"]`).forEach(cav=>{
        cav.classList.remove('dim','hl','hl-end','hl-group');
        if(isFocus){ cav.classList.add('hl'); clearHlGroupElColor(cav); }
        else if(sibOk) applyHlGroupEl(cav, gCol);
        else { cav.classList.add('dim'); clearHlGroupElColor(cav); }
      });
      if(cid === 'ix_f102_m72'){
        const fp = f102PinEl(p.id);
        if(!fp) return;
        if(f102Allow && !f102Allow.has(String(p.id)) && !isFocusCav) return;
        fp.classList.remove('dim','hl','hl-end','hl-group');
        if(isFocus){ fp.classList.add('hl'); clearHlGroupElColor(fp); }
        else if(sibOk) applyHlGroupEl(fp, gCol);
        else { fp.classList.add('dim'); clearHlGroupElColor(fp); }
      }
    });
  });
  if(focusPin!=null){
    document.querySelectorAll('.cav-hit').forEach(cav=>{
      const cid=cav.dataset.conn; const pid=cav.dataset.cav;
      const p=(CONN[cid]&&CONN[cid].pins||[]).find(x=>String(x.id)===String(pid));
      if(p && p.ecm!=null && Number(p.ecm)===Number(focusPin)){
        cav.classList.remove('dim','hl-group','hl-end');
        cav.classList.add('hl');
      }
    });
    document.querySelectorAll('#f102Blocks .pin[data-cav]').forEach(fp=>{
      const p=(CONN['ix_f102_m72']&&CONN['ix_f102_m72'].pins||[]).find(x=>String(x.id)===String(fp.dataset.cav));
      if(p && p.ecm!=null && Number(p.ecm)===Number(focusPin)){
        fp.classList.remove('dim','hl-group','hl-end');
        fp.classList.add('hl');
      }
    });
  }
  if(pathStepsByRail.size){
    ['12v', '5v', 'gnd', 'sig'].forEach(r => {
      const g = pathStepsByRail.get(r);
      if(!g || !g.chains.length) return;
      const col = PATH_TAG_COLOR[r] || '#90a4ae';
      const body = g.chains.map(ch => ch.join(' → ')).join(' · ');
      lines.push(`<div class="path-route" data-rail="${r}" style="color:var(--muted);margin-top:4px"><span class="pill path-tag" style="border-color:${col};color:${col}">${esc(pathTagLabel(r))}</span> ${body}</div>`);
    });
  }
  const pinInfo = focusPin!=null
    ? `<div class="info-pin" style="margin-bottom:6px"><b>${esc(t('pinEcm'))} ${focusPin}</b> · ${pinName(focusPin)||''} · <code>${PIN_COL[focusPin]||'—'}</code></div>`
    : '';
  const infoEl=document.getElementById('info'); infoEl.dataset.locked='1'; infoEl.innerHTML = pinInfo + lines.join('');
  revealConns([...connSet], { collapseF102 });
  if(collapseF102) setF102PanelOpen(false);
  /* Clones in #selTop are fresh — re-mark fichas + dim off-path cavities, then light path. */
  connSet.forEach(cid => markFichaHL(cid, true));
  /* path (Alim. 12V): cavity HL only via paintFichaCavHL — never markFichaHL / open groups
     (that left IPDM+feeds “selected” in capa grupo and undid collapseIdle). */
  const gndCavByConn = new Map();
  circIds.forEach(id => { const cir = CIRCUITS.find(x => x.id === id); Object.entries((cir && cir.gndCav) || {}).forEach(([cid, cavs]) => {
    if(!gndCavByConn.has(cid)) gndCavByConn.set(cid, new Set()); cavs.forEach(c => gndCavByConn.get(cid).add(String(c))); }); });
  paintFichaCavHL(ecmSet, focusPin, focusConn, focusCav, pathCavByConn, connSet, gndCavByConn.size ? gndCavByConn : null);
  applyCollapseIdleSubs([...connSet]);
}

/** Yellow hl = focused ECM/cavity; purple hl-group = other path pins only (not the focused ECM). */
function paintFichaCavHL(ecmSet, focusPin, focusConn, focusCav, pathCavByConn=null, selConns=null, gndCavByConn=null){
  /* selTop clones are fresh DOM without .dim — opacar todas las cavidades primero. */
  document.querySelectorAll('.cav-hit').forEach(cav=>{
    cav.classList.remove('hl','hl-end','hl-group','hl-rail','hl-rail-rel-gnd','hl-rail-rel-data','hl-rail-rel-power');
    cav.classList.add('dim');
  });
  document.querySelectorAll('#fichas .ficha.hl .cav-empty, #fichas .ficha-wrap.hl .cav-empty').forEach(g=>{
    g.style.opacity = '0.2';
  });
  /* Relacionados on: only the clicked thing is yellow (the clicked cavity; on an ECM pin click, the device cavity that
     carries that pin). Route cavities, intermediates carrying the same wire and partner circuits use the related style. */
  const relOn = ['railRelGnd','railRelPower','railRelData'].some(id => { const el = document.getElementById(id); return !!(el && el.checked); });
  const pathOk = (p, cid, pid)=>{
    if(!p) return false;
    const isFocusCav = focusConn===cid && String(focusCav)===String(pid);
    if(isFocusCav) return {cls:'hl'};
    /* Exact ECM match = yellow hl first (path list must not force purple hl-group). */
    if(p.ecm!=null && p.ecm!=='' && focusPin!=null && Number(p.ecm)===Number(focusPin)){
      /* ECM pin click: every cavity carrying that same wire (device end, F102, intermediates) stays yellow */
      /* Shared sensor ground cavity click (ect·2 on ECM 67): no fan-out to the other sensors on the net */
      if(focusConn && selConns && PIN_RAIL[Number(p.ecm)] === 'gnd' && !selConns.has(cid)) return false;
      if(relOn && focusConn) return {cls:'hl-group', path:true};
      return {cls:'hl'};
    }
    const onPathFeed = pathCavByConn && pathCavByConn.has(cid) && pathCavByConn.get(cid).has(String(pid));
    /* Explicit circuit.path cavities (E17 ring, F3·5, …) — always lit, not Tierras-gated (yellow only with Relacionados off) */
    if(onPathFeed) return relOn ? {cls:'hl-group', path:true} : {cls:'hl'};
    if(p.ecm==null || p.ecm==='') return false;
    const e = Number(p.ecm);
    const onPath = ecmSet && (ecmSet.has(e) || ecmSet.has(String(e)) || ecmSet.has(Number(e)));
    if(!onPath) return false;
    /* Shared sensor ground (ECM 66/67/78/82/83…): a sibling ground lights only on the clicked component's fichas
       (ECM 74 → F11·4, not F12·4). The whole net lights only when the ground pin itself is clicked. */
    if(selConns && PIN_RAIL[e] === 'gnd' && !selConns.has(cid)) return false;
    /* Two sensors in one housing (MAF·3 / IAT·6 on ECM 67), Sensor grouping: circuit.gndCav names the clicked sensor's own ground cavity */
    if(gndCavByConn && relGroupMode() === 'sensor' && PIN_RAIL[e] === 'gnd' && gndCavByConn.has(cid) && !gndCavByConn.get(cid).has(String(pid))) return false;
    return {cls:'hl-group'};
  };
  document.querySelectorAll('.cav-hit').forEach(cav=>{
    const cid = cav.dataset.conn;
    const pid = cav.dataset.cav;
    const conf = CONN[cid] || CONN_BASE[cid];
    const p = (conf && conf.pins || []).find(x => String(x.id) === String(pid));
    const hit = pathOk(p, cid, pid);
    if(!hit) return;
    cav.classList.remove('dim','hl','hl-end','hl-group');
    if(hit.cls === 'hl-group'){
      const kind = circuitSiblingKindCav(p);
      if(hit.path || circuitSiblingAllowed(kind)) applyHlGroupEl(cav, accentForCav(cid, p));
      else { cav.classList.add('dim'); clearHlGroupElColor(cav); }
    } else { cav.classList.add(hit.cls); clearHlGroupElColor(cav); }
  });
  document.querySelectorAll('#f102Blocks .pin[data-cav]').forEach(fp=>{
    const p = (CONN['ix_f102_m72']&&CONN['ix_f102_m72'].pins||[]).find(x=>String(x.id)===String(fp.dataset.cav));
    const hit = pathOk(p, 'ix_f102_m72', fp.dataset.cav);
    if(!hit) return;
    fp.classList.remove('dim','hl','hl-end','hl-group');
    if(hit.cls === 'hl-group'){
      const kind = circuitSiblingKindCav(p);
      if(hit.path || circuitSiblingAllowed(kind)) applyHlGroupEl(fp, accentForCav('ix_f102_m72', p));
      else { fp.classList.add('dim'); clearHlGroupElColor(fp); }
    } else { fp.classList.add(hit.cls); clearHlGroupElColor(fp); }
  });
  updateF102SelPins();
}

function selectPin(p, opts){
  const n = Number(p);
  const key = 'pin:' + String(n);
  /* Re-click yellow focus → clear. Click another pin already in the set → only move yellow. */
  if(!opts || !opts.keep){
    if(selKey === key || (selFocusPin != null && Number(selFocusPin) === n && String(selKey||'').startsWith('cav:'))){
      clearSelection();
      return;
    }
    if(activeRails.size && ecmPinOnActiveRail(n)){
      focusRailSelection(n);
      return;
    }
    if(selKey && lastCircIds.length && ecmPinIsMarked(n)){
      retargetSelection(n);
      return;
    }
  }
  let circs = pinToCirc[p] || pinToCirc[Number(p)] || pinToCirc[String(p)] || [];
  /* sns_gnd.conn stays empty so 78 does not fan out as a signal sibling —
     66 is ETC only; 67 is listed on each sensor circuit (A/C, PSP, EVAP, ASCD). */
  if(!circs.length){
    const found=[];
    Object.entries(CONN).forEach(([cid,f])=>{
      if(SKIP_SEL_CONN.has(cid)) return;
      if(f.pins.some(x=>x.ecm===p || Number(x.ecm)===n)) found.push(cid);
    });
    activeRails.clear(); updateRailButtons();
    clearHL(); dimAll();
    const el=document.querySelector(`#blocks .pin[data-pin="${p}"]`);
    if(el){ el.classList.remove('dim'); el.classList.add('hl'); }
    found.forEach(cid=>{
      markFichaHL(cid, true);
      if(cid === 'ix_f102_m72'){
        const panel = document.getElementById('f102Panel');
        if(panel) panel.classList.add('hl');
      }
      (CONN[cid].pins||[]).forEach(pin=>{
        if(pin.ecm==null || Number(pin.ecm)!==n) return;
        document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(pin.id))}"]`).forEach(cav=>{
          cav.classList.remove('dim'); cav.classList.add('hl');
        });
        if(cid === 'ix_f102_m72'){
          const fp = f102PinEl(pin.id);
          if(fp){ fp.classList.remove('dim'); fp.classList.add('hl'); }
        }
      });
    });
    const infoEl=document.getElementById('info'); infoEl.dataset.locked='1'; infoEl.innerHTML = `<b>${esc(t('pinEcm'))} ${p}</b> · ${pinName(p)||''} · <code>${PIN_COL[p]||'—'}</code><div style="color:var(--muted)">${t('noWide')}</div>`;
    revealConns(found);
    paintFichaCavHL(new Set([n]), n, null, null);
    updateEcmSelCount(1);
    updateF102SelPins();
    selKey = key;
    selFocusPin = n;
    return;
  }
  selectCircuits(circs, n);
  selKey = key;
  selFocusPin = n;
}

function selectConn(cid){
  const conf=CONN[cid] || CONN_BASE[cid];
  const circs = connToCirc[cid] || [];
  if(selKey && lastCircIds.length && connIsSelected(cid)){
    const pin = (conf && conf.pins || []).find(p => p.ecm != null && ecmPinIsMarked(Number(p.ecm)));
    if(pin){ retargetSelection(pin.ecm, cid, pin.id); return; }
    return;
  }
  /* F102 is a shared SMJ — clicking the card must not open every circuit that crosses it */
  if(cid === 'ix_f102_m72'){
    activeRails.clear(); updateRailButtons();
    clearHL(); dimAll();
    markFichaHL(cid, true);
    const panel = document.getElementById('f102Panel');
    if(panel) panel.classList.add('hl');
    const infoEl=document.getElementById('info'); infoEl.dataset.locked='1';
    delete infoEl.dataset.railMode;
    infoEl.innerHTML = `<b>${esc(connField(cid, conf, 'name'))}</b><div style="color:var(--muted)">Tocá una cavidad (ej. 22H) para ver su circuito.</div>`;
    revealConns([cid]);
    setF102PanelOpen(true);
    updateEcmSelCount(0);
    updateF102SelPins();
    selKey = 'conn:' + cid;
    selFocusPin = null;
    return;
  }
  if(circs.length){
    selectCircuits(circs, null, cid, null);
    selKey = 'conn:' + cid;
    selFocusPin = null;
  } else {
    activeRails.clear(); updateRailButtons();
    clearHL(); dimAll();
    markFichaHL(cid, true);
    if(cid === 'ix_f102_m72'){
      const panel = document.getElementById('f102Panel');
      if(panel) panel.classList.add('hl');
    }
    (conf&&conf.pins||[]).forEach(p=>{
      const gCol = accentForCav(cid, p);
      document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(p.id))}"]`).forEach(cav=>applyHlGroupEl(cav, gCol));
      if(cid === 'ix_f102_m72'){
        const fp = f102PinEl(p.id);
        if(fp && p.code && p.code !== '—') applyHlGroupEl(fp, gCol);
      }
      if(p.ecm!=null){
        const el=document.querySelector(`#blocks .pin[data-pin="${p.ecm}"]`);
        if(el) applyHlGroupEl(el, accentForEcmPin(p.ecm) || gCol);
      }
    });
    const infoEl=document.getElementById('info'); infoEl.dataset.locked='1';
    delete infoEl.dataset.railMode;
    const noteTxt = conf ? connField(cid, conf, 'note') : '';
    const note = noteTxt ? `<div style="color:var(--muted);margin-top:4px">${esc(noteTxt)}</div>` : '';
    infoEl.innerHTML = `<b>${esc(conf ? connField(cid, conf, 'name') : cid)}</b> — ${esc(conf ? connField(cid, conf, 'meta') : '')}${note}`;
    const collapseF102 = shouldCollapseF102ForBackup([], cid);
    revealConns([cid], { collapseF102 });
    if(collapseF102) setF102PanelOpen(false);
    updateEcmSelCount();
    updateF102SelPins();
    selKey = 'conn:' + cid;
    selFocusPin = null;
  }
}

function selectConnPin(cid, cavId, opts){
  const conf0 = CONN[cid] || CONN_BASE[cid];
  const pin0 = (conf0 && conf0.pins || []).find(x => String(x.id) === String(cavId));
  if(!cavClickable(cid, pin0)) return;
  const key = 'cav:' + String(cid) + ':' + String(cavId);
  if(pin0 && (pin0.vifOff || pin0.transOff)){ selectOptOffPin(cid, cavId, pin0, key, opts); return; }
  if(!opts || !opts.keep){
    if(selKey === key){ clearSelection(); return; }
    if(activeRails.size && cavIsActiveRailPrimary(cid, pin0)){
      const ecmN = pin0 && pin0.ecm != null ? Number(pin0.ecm) : null;
      focusRailSelection(ecmN, cid, cavId);
      return;
    }
    if(selKey && lastCircIds.length && selMarkOn(cavSelEl(cid, cavId))){
      const conf0 = CONN[cid] || CONN_BASE[cid];
      const pin0 = (conf0 && conf0.pins || []).find(x => String(x.id) === String(cavId));
      retargetSelection(pin0 && pin0.ecm != null ? pin0.ecm : selFocusPin, cid, cavId);
      return;
    }
  }
  const conf=CONN[cid] || CONN_BASE[cid];
  if(!conf) return;
  const pin=(conf.pins||[]).find(x=>String(x.id)===String(cavId));
  if(pin && pin.unknown){
    activeRails.clear(); updateRailButtons();
    clearHL(); dimAll();
    markFichaHL(cid, true);
    document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(cavId))}"]`).forEach(cav=>{
      cav.classList.remove('dim'); cav.classList.add('hl');
    });
    const infoEl=document.getElementById('info'); infoEl.dataset.locked='1';
    delete infoEl.dataset.railMode;
    const ntxt = pinNote(pin);
    infoEl.innerHTML = `<b>${esc(conf ? connField(cid, conf, 'name') : cid)}</b> · cav <code>${esc(String(cavId))}</code> · <b>?</b>`
      + (ntxt && ntxt !== '—' ? `<div style="color:var(--muted);margin-top:6px">${esc(ntxt)}</div>` : '');
    revealConns([cid]);
    selKey = key;
    selFocusPin = null;
    return;
  }
  if(pin && pin.ecm!=null){
    const ecmN = Number(pin.ecm);
    /* Same cavity again already handled above; shared ECM (e.g. 67) must not clear other fichas */
    let circs = pinToCirc[pin.ecm] || pinToCirc[ecmN] || pinToCirc[String(ecmN)] || [];
    /* Prefer circuits that actually list this connector (e.g. F102 18H → evap_press, not app_5v) */
    const viaConn = circs.filter(id=>{
      const cir = CIRCUITS.find(x=>x.id===id);
      return cir && (cir.conn||[]).includes(cid);
    });
    if(viaConn.length) circs = viaConn;
    /* F102 shared ECM pins (e.g. 67 on 1H ASCD vs 20H SNS): pick circuit by cavity */
    if(cid === 'ix_f102_m72'){
      const byCav = circs.filter(id=>{
        const cir = CIRCUITS.find(x=>x.id===id);
        return cir && Array.isArray(cir.f102) && cir.f102.map(String).includes(String(cavId));
      });
      if(byCav.length) circs = byCav;
    }
    /* Shared ground cavity (e.g. F103·2: ECM 115 + DLC M8·5 signal ground via F102·10H, EC-742):
       also light non-ECM ground circuits whose path runs through this exact cavity. */
    if(circs.length && pin.rail === 'gnd'){
      (CIRCUITS || []).forEach(cir => {
        if(circs.includes(cir.id) || (cir.ecm && cir.ecm.length)) return;
        const cavs = cir.path && cir.path[cid];
        if(cavs && cavs.map(String).includes(String(cavId))) circs = [...circs, cir.id];
      });
    }
    if(circs.length){
      selectCircuits(circs, pin.ecm, cid, String(cavId));
    } else {
      /* Orphan ECM link — do not call selectPin (own selKey); paint locally */
      activeRails.clear(); updateRailButtons();
      clearHL(); dimAll();
      const el=document.querySelector(`#blocks .pin[data-pin="${pin.ecm}"]`);
      if(el){ el.classList.remove('dim'); el.classList.add('hl'); }
      markFichaHL(cid, true);
      document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(cavId))}"]`).forEach(cav=>{
        cav.classList.remove('dim'); cav.classList.add('hl');
      });
      if(cid === 'ix_f102_m72'){
        const panel = document.getElementById('f102Panel');
        if(panel) panel.classList.add('hl');
        const fp = f102PinEl(cavId);
        if(fp){ fp.classList.remove('dim'); fp.classList.add('hl'); }
      }
      const infoEl=document.getElementById('info'); infoEl.dataset.locked='1';
      infoEl.innerHTML = `<b>${esc(t('pinEcm'))} ${pin.ecm}</b> · ${pinName(pin.ecm)||''} · <code>${PIN_COL[pin.ecm]||'—'}</code>`;
      revealConns([cid]);
      updateEcmSelCount(1);
      updateF102SelPins();
    }
    const pnote = pinNote(pin);
    if(pnote || pin.lab){
      const infoEl=document.getElementById('info');
      const extra = pnote ? ` — ${esc(pnote)}` : (pin.lab ? ` — ${esc(pin.lab)}` : '');
      infoEl.innerHTML += `<div class="info-cav" data-note="${esc(pnote || '')}" style="color:var(--muted);margin-top:4px"><code>${esc(connShortLabel(cid))}·${esc(String(cavId))}</code> · ${esc(pin.code||'')}${extra} → ECM ${esc(String(pin.ecm))}</div>`;
    }
    selKey = key;
    selFocusPin = ecmN;
  } else {
    if(FUSE_BOX_CONNS.has(cid)){
      /* the fuse's own circuit (pin.circ) wins; otherwise every circuit whose path runs through this fuse */
      const related = (pin && pin.circ && (CIRCUITS || []).some(c => c.id === pin.circ)) ? [pin.circ]
        : (CIRCUITS || []).filter(cir => {
          const cavs = cir.path && cir.path[cid];
          return cavs && cavs.map(String).includes(String(cavId));
        }).map(cir => cir.id);
      if(related.length){
        selectCircuits(related, null, cid, String(cavId));
      } else {
        activeRails.clear(); updateRailButtons();
        clearHL(); dimAll();
        markFichaHL(cid, true);
        document.querySelectorAll(`.cav-hit[data-conn="${cid}"][data-cav="${CSS.escape(String(cavId))}"]`).forEach(cav=>{
          cav.classList.remove('dim'); cav.classList.add('hl');
        });
        const infoEl=document.getElementById('info');
        infoEl.dataset.locked='1';
        delete infoEl.dataset.railMode;
        infoEl.innerHTML = `<b>${esc(connField(cid, conf, 'name'))}</b> · <code>${esc(String(cavId))}</code>`;
        revealConns([cid]);
      }
    } else if(pin && pin.circ){
      selectCircuits([pin.circ], null, cid, String(cavId));
    } else {
    let circs = connToCirc[cid] || [];
    /* A cavity listed only in some circuit's path (feed-note cavities such as CKP+ / AF1-3): those circuits */
    if(!circs.length && cavId != null){
      circs = (CIRCUITS || []).filter(cir => (cir.path && cir.path[cid] || []).map(String).includes(String(cavId))).map(cir => cir.id);
    }
    /* F102 cavity without ECM: only circuits that declare this cav (f102[] or path), not every F102 circuit */
    if(cid === 'ix_f102_m72' && cavId!=null){
      const byCav = circs.filter(id=>{
        const cir = CIRCUITS.find(x=>x.id===id);
        if(!cir) return false;
        if(Array.isArray(cir.f102) && cir.f102.map(String).includes(String(cavId))) return true;
        const pathCavs = cir.path && cir.path['ix_f102_m72'];
        if(pathCavs && pathCavs.map(String).includes(String(cavId))) return true;
        return false;
      });
      if(byCav.length) circs = byCav;
      else circs = []; /* unknown cavity — don't fan out the whole SMJ */
    } else if(cavId != null && circs.length > 1){
      /* Prefer circuits whose path declares this exact cavity (body circuits share B1/M12, E108/M15, DLC…) */
      const byCav = circs.filter(id => {
        const cir = CIRCUITS.find(x => x.id === id);
        const pc = cir && cir.path && cir.path[cid];
        return !!pc && pc.map(String).includes(String(cavId));
      });
      if(byCav.length) circs = byCav;
    }
    if(circs.length) selectCircuits(circs, null, cid, String(cavId));
    else {
      selectConn(cid);
      const fp = f102PinEl(cavId);
      if(fp){ fp.classList.remove('dim'); fp.classList.add('hl-end'); }
    }
    }
    const pnote = pin ? pinNote(pin) : '';
    if(pin && (pnote || pin.code || pin.lab)){
      const infoEl=document.getElementById('info');
      const extra = pnote ? ` — ${esc(pnote)}` : (pin.lab ? ` — ${esc(pin.lab)}` : '');
      infoEl.innerHTML += `<div class="info-cav" data-note="${esc(pnote || '')}" style="color:var(--muted);margin-top:4px"><code>${esc(connShortLabel(cid))}·${esc(String(cavId))}</code> · ${esc(pin.code||'')}${extra}</div>`;
    }
    selKey = key;
    selFocusPin = null;
  }
}
