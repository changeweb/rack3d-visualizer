// ── SIDEBAR ── device list, unit map, edit panel

import { tempColor } from './constants.js';

export function refresh(self) {
  const r   = self._rack;
  const sb  = self._opts.sidebar;
  const $   = id => document.getElementById(self._id + '-' + id);
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const val = (id, v) => { const el = $(id); if (el) el.value = v; };
  const css = (id, p, v) => { const el = $(id); if (el) el.style[p] = v; };

  buildRoomPanel(self);

  const rnEl = document.getElementById(self._id + '-room-name');
  if (rnEl) rnEl.value = self._room?.name ?? '';

  if (!r) {
    ['bn','bu','bt','bw'].forEach(id => set(id, '—'));
    const dl = $('dl');
    if (dl) dl.innerHTML = '<div class="r3-no-rack">← Click a rack in 3D to view devices</div>';
    const sw = $('sw'); if (sw) sw.innerHTML = '—';
    const st = $('st'); if (st) st.innerHTML = '—';
    css('sfW','width','0%'); css('sfT','width','0%');
    buildLegendOverlay(self);
    self._renderCatalog();
    if (self._opts.onChange && self._room) self._opts.onChange(self.getData());
    return;
  }

  const pct = r.pduCapacity > 0 ? Math.round(r.pduLoad / r.pduCapacity * 100) : 0;
  const tc2 = tempColor(r.rackTemp);
  const pwc = pct>90?'#ff3344':pct>70?'#ffaa00':'#00ff88';

  set('bn',r.name); set('bu',(r.units||0)+'U');
  set('bt',(r.rackTemp||0)+'°C'); set('bw',(r.pduLoad||0)+'W');
  val('rn',r.name); val('ru',r.units);
  val('rwidth',self._opts.rack.width);
  val('rtemp',r.rackTemp); val('rpduCap',r.pduCapacity); val('rpduLoad',r.pduLoad);
  // Rack position fields
  const rg = self._rackGroups?.[r.id];
  val('rposX', +(rg?.position.x ?? r.position?.x ?? 0).toFixed(2));
  val('rposY', +(rg?.position.y ?? r.position?.y ?? 0).toFixed(2));
  val('rposZ', +(rg?.position.z ?? r.position?.z ?? 0).toFixed(2));
  val('rangle', +(((r.facingAngle ?? 0) * 180 / Math.PI)).toFixed(0));
  // Rack nameplate per-rack fields
  const rnpshape = $('rnpshape');
  if (rnpshape) rnpshape.value = r.nameplateShape ?? 'rounded';
  const rnpbg = $('rnpbg');
  if (rnpbg) rnpbg.value = r.nameplateColor ?? '#081020';
  const rnptxt = $('rnptxt');
  if (rnptxt) rnptxt.value = r.nameplateTextColor ?? '#88bbdd';
  const rsl = $('rshowlabels');
  if (rsl) rsl.checked = r.showLabels !== false;

  const sw = $('sw'); if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad||0}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity||0}W (${pct}%)</span>`;
  const st = $('st'); if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp||0}</span><span style="font-size:10px;opacity:.6">°C</span>`;
  css('sfW','width',Math.min(100,pct)+'%'); css('sfW','background',pwc);
  css('sfT','width',Math.min(100,(r.rackTemp||0)*1.8)+'%'); css('sfT','background',tc2);

  if (sb.showDeviceList) {
    const dl = $('dl');
    if (dl) {
      dl.innerHTML = '';
      (r.devices||[]).slice().sort((a,b)=>a.startUnit-b.startUnit).forEach(dev => {
        const col   = self._types[dev.type]?.color||'#2288ff';
        const isSel = self._selId === dev.id;
        const d = document.createElement('div');
        d.className = 'r3-dc'+(isSel?' sel':'');
        d.style.setProperty('--r3-selcol', col);
        const sCol = {up:'#00ff88',down:'#ff3344',warn:'#ffaa00'}[dev.status]||'#888';
        const sIco = {up:'▲',down:'▼',warn:'⚠'}[dev.status]||'';
        d.innerHTML = `<div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
          <div style="flex:1;min-width:0">
            <div class="r3-dn">${self._types[dev.type]?.icon||'▣'} ${dev.name}</div>
            <div class="r3-dm">${self._types[dev.type]?.label} · U${dev.startUnit}–${dev.startUnit+dev.heightUnits-1} · ${dev.watts}W${dev.ip?' · '+dev.ip:''}${dev.status?` <span style="color:${sCol}">${sIco}</span>`:''}</div>
          </div>
          <button class="r3-xb" data-id="${dev.id}">×</button>`;
        d.querySelector('.r3-xb').addEventListener('click', e => { e.stopPropagation(); self._rmDev(dev.id); });
        d.addEventListener('click', () => {
          self._selId = isSel ? null : dev.id;
          isSel ? self._closeEdit() : self._openEdit(dev);
          self._buildRack(); self._refresh();
        });
        if (self._opts.view.allowDragDrop) {
          d.draggable = true;
          d.addEventListener('dragstart', e => { self._dragId = dev.id; e.dataTransfer.effectAllowed = 'move'; });
          d.addEventListener('dragend', () => { self._dragId = null; });
        }
        dl.appendChild(d);
      });
    }
  }

  if (sb.showUnitMap) buildUnitMap(self);
  buildLegendOverlay(self);
  self._renderCatalog();
  if (self._opts.onChange && self._room) self._opts.onChange(self.getData());
}

export function updateRackStatsDom(self, r) {
  const $ = id => document.getElementById(self._id + '-' + id);
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  const css = (id, p, v) => { const el = $(id); if (el) el.style[p] = v; };

  const pct = r.pduCapacity > 0 ? Math.round(r.pduLoad / r.pduCapacity * 100) : 0;
  const tc2 = tempColor(r.rackTemp);
  const pwc = pct > 90 ? '#ff3344' : pct > 70 ? '#ffaa00' : '#00ff88';

  set('bt', (r.rackTemp || 0) + '°C');
  set('bw', (r.pduLoad || 0) + 'W');

  const sw = $('sw');
  if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad || 0}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity || 0}W (${pct}%)</span>`;
  const st = $('st');
  if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp || 0}</span><span style="font-size:10px;opacity:.6">°C</span>`;
  css('sfW', 'width', Math.min(100, pct) + '%'); css('sfW', 'background', pwc);
  css('sfT', 'width', Math.min(100, (r.rackTemp || 0) * 1.8) + '%'); css('sfT', 'background', tc2);
}

export function buildRoomPanel(self) {
  const el = document.getElementById(self._id + '-rack-list');
  if (!el || !self._room) return;
  el.innerHTML = '';
  (self._room.racks||[]).forEach(entry => {
    const isSel = entry.id === self._selRackId;
    const d = document.createElement('div');
    d.className = 'r3-rack-item'+(isSel?' sel':'');
    d.innerHTML = `<span style="flex:1;font-weight:${isSel?700:400}">${entry.name||entry.id}</span>
      <span class="r3-rack-badge" style="color:${isSel?'var(--r3-accent)':'var(--r3-dim)'};border-color:currentColor">${entry.units||24}U</span>
      <span class="r3-rack-badge" style="color:var(--r3-dim);border-color:var(--r3-border)">${(entry.devices||[]).length}d</span>`;
    d.addEventListener('click', () => {
      self._selRackId = entry.id;
      self._rack = entry;
      self._selId = null;
      self._closeEdit();
      self._buildRack();
      self._refresh();
      if (self._mode === '2d') self._render2D();
    });
    el.appendChild(d);
  });
  if (self._renderWalls)   self._renderWalls();
  if (self._renderPillars) self._renderPillars();
}

export function buildUnitMap(self) {
  const um = document.getElementById(self._id + '-um'); if (!um) return;
  um.innerHTML = '';
  const r = self._rack; if (!r) return;
  for (let i = r.units; i >= 1; i--) {
    const dev = (r.devices||[]).find(d => i>=d.startUnit && i<d.startUnit+d.heightUnits);
    const col = dev ? (self._types[dev.type]?.color||'#2288ff') : null;
    const isFirst = dev && i===dev.startUnit;
    const isLast  = dev && i===dev.startUnit+dev.heightUnits-1;
    const row = document.createElement('div'); row.className = 'r3-ur';
    if (dev) {
      row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
        <div style="flex:1;background:${col}28;border-left:3px solid ${col};padding:0 5px;height:100%;display:flex;align-items:center;${isFirst?`border-top:1px solid ${col}88;`:''}${isLast?`border-bottom:1px solid ${col}88;`:''}">
          <span style="color:${col};font-size:8px;font-family:'Share Tech Mono',monospace;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:130px;font-weight:600">
            ${isFirst?(self._types[dev.type]?.icon+' '+dev.name):''}
          </span>
        </div>`;
    } else {
      row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
        <div style="flex:1;height:1px;border-top:1px dashed var(--r3-border);margin:0 4px"></div>`;
    }
    if (self._opts.view.allowDragDrop) {
      row.addEventListener('dragover',  e => { e.preventDefault(); row.style.background='#1f6feb22'; });
      row.addEventListener('dragleave', () => { row.style.background=''; });
      row.addEventListener('drop', e => { e.preventDefault(); row.style.background=''; self._dropUnit(self._dragId, i); });
    }
    um.appendChild(row);
  }
}

export function buildLegendOverlay(self) {
  const el = document.getElementById(self._id + '-legend');
  if (!el) return;
  el.innerHTML = Object.entries(self._types).map(([,i]) =>
    `<div class="r3-lrow"><div class="r3-lswatch" style="background:${i.color};box-shadow:0 0 4px ${i.color}66"></div><span>${i.icon}</span><span>${i.label}</span></div>`
  ).join('');
}

export function openEdit(self, dev) {
  // Show the editDevice panel (was hidden until a device is selected)
  const editPanel = document.querySelector(`#${self._id} [data-panel-id="editDevice"]`);
  if (editPanel) editPanel.classList.remove('r3-panel-hidden');
  const el = document.getElementById(self._id + '-elbl'); if (el) el.textContent = '▸ '+dev.name;
  const set = (id, v) => { const e = document.getElementById(self._id+'-'+id); if (e) e.value = v; };
  set('en', dev.name);
  set('es', dev.startUnit);
  set('ecolor', dev.color || (self._types[dev.type]?.color || '#2288ff'));
  set('eip', dev.ip || '');
  set('estat', dev.status || '');
  const infoEl = document.getElementById(self._id + '-einfo');
  if (infoEl) {
    const typeLabel = self._types[dev.type]?.label || dev.type;
    const wLabel    = dev.halfWidth === 'left' ? 'Half-Left' : dev.halfWidth === 'right' ? 'Half-Right' : 'Full';
    infoEl.textContent = `${typeLabel} · ${dev.heightUnits}U · ${dev.watts}W · ${wLabel}`;
  }
  renderCustomFieldsEditor(self, dev);
}

export function closeEdit(self) {
  const editPanel = document.querySelector(`#${self._id} [data-panel-id="editDevice"]`);
  if (editPanel) editPanel.classList.add('r3-panel-hidden');
}

export function ed(self, field, value) {
  const dev = self._rack?.devices?.find(d => d.id === self._selId); if (!dev) return;
  if (field === 'halfWidth') {
    if (!value||value==='undefined') delete dev.halfWidth;
    else dev.halfWidth = value;
  } else if (field === 'color') {
    dev.color = value||undefined;
  } else {
    dev[field] = value;
  }
  if (field === 'name') { const el = document.getElementById(self._id+'-elbl'); if (el) el.textContent='▸ '+value; }
  self._buildRack(); self._refresh();
  if (self._mode === '2d') self._render2D();
}

export function addDev(self, type, halfWidth=null, nameOverride=null, hOverride=null, wattsOverride=null) {
  if (!self._rack) return null;
  const h = hOverride ?? (type==='storage'?3:type==='server'?2:1);
  const findFreeUnit = (hw) => {
    for (let u=1; u<=self._rack.units; u++) {
      let ok = true;
      for (let j=u; j<u+h; j++) {
        if (j>self._rack.units) { ok=false; break; }
        const blockers = (self._rack.devices||[]).filter(d => j>=d.startUnit && j<d.startUnit+d.heightUnits);
        for (const b of blockers) {
          if (!b.halfWidth) { ok=false; break; }
          if (!hw||b.halfWidth===hw) { ok=false; break; }
        }
        if (!ok) break;
      }
      if (ok) return u;
    }
    return 1;
  };
  const st = findFreeUnit(halfWidth);
  const nd = { id:'d'+Date.now(), name:nameOverride||('New '+(self._types[type]?.label||type)), type, startUnit:st, heightUnits:h, watts:wattsOverride??200 };
  if (halfWidth) nd.halfWidth = halfWidth;
  if (!Array.isArray(self._rack.devices)) self._rack.devices = [];
  self._rack.devices.push(nd);
  self._selId = nd.id; self._openEdit(nd);
  self._buildRack(); self._refresh();
  if (self._mode === '2d') self._render2D();
  return nd;
}

export function rmDev(self, id) {
  if (!self._rack) return;
  self._rack.devices = (self._rack.devices||[]).filter(d => d.id !== id);
  if (self._selId === id) { self._selId = null; self._closeEdit(); }
  self._buildRack(); self._refresh();
}

export function onRackName(self, v) { if (self._rack) { self._rack.name = v; self._refresh(); } }
export function onRackUnits(self, v) {
  if (!self._rack) return;
  self._rack.units = Math.max(4, v||self._rack.units);
  self._buildRack(); self._refresh();
}
export function onRackProp(self, p, v) {
  if (!self._rack) return;
  self._rack[p] = v;
  if (p === 'nameplateShape' || p === 'nameplateColor' || p === 'nameplateTextColor' || p === 'nameplateBorderColor') {
    self._buildRack();
  }
  if (p === 'showLabels') self._updateLabels?.();
  self._refresh();
}
export function onRackWidth(self, v) {
  if (v>=2&&v<=12) { self._opts.rack.width=v; self._buildRack(); self._refresh(); }
}
export function onRackPos(self, axis, v) {
  if (!self._rack) return;
  if (!self._rack.position) {
    const g = self._rackGroups?.[self._rack.id];
    self._rack.position = { x: g?.position.x ?? 0, y: 0, z: g?.position.z ?? 0 };
  }
  self._rack.position[axis] = v;
  self._buildRack(); self._refresh();
}
export function onRackAngle(self, deg) {
  if (!self._rack) return;
  self._rack.facingAngle = deg * Math.PI / 180;
  self._buildRack(); self._refresh();
}

export function renderCustomFieldsEditor(self, dev) {
  const container = document.getElementById(self._id + '-efields');
  if (!container) return;
  container.innerHTML = '';
  (dev.fields||[]).forEach((f, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:3px;margin-bottom:3px;align-items:center';
    row.innerHTML = `<input class="r3-inp" placeholder="icon" style="width:36px" value="${f.icon||''}" oninput="window._r3['${self._id}']._editField(${i},'icon',this.value)">
      <input class="r3-inp" placeholder="label" style="flex:1" value="${f.label||''}" oninput="window._r3['${self._id}']._editField(${i},'label',this.value)">
      <input class="r3-inp" placeholder="value" style="flex:1" value="${f.value||''}" oninput="window._r3['${self._id}']._editField(${i},'value',this.value)">
      <button class="r3-btn" style="padding:1px 5px" onclick="window._r3['${self._id}']._removeField(${i})">×</button>`;
    container.appendChild(row);
  });
}

export function addCustomField(self) {
  const dev = self._rack?.devices?.find(d => d.id === self._selId); if (!dev) return;
  if (!dev.fields) dev.fields = [];
  dev.fields.push({icon:'',label:'',value:''});
  renderCustomFieldsEditor(self, dev);
  self._refresh();
}

export function editField(self, idx, key, value) {
  const dev = self._rack?.devices?.find(d => d.id === self._selId); if (!dev?.fields) return;
  dev.fields[idx][key] = value;
  self._refresh();
}

export function removeField(self, idx) {
  const dev = self._rack?.devices?.find(d => d.id === self._selId); if (!dev?.fields) return;
  dev.fields.splice(idx, 1);
  renderCustomFieldsEditor(self, dev);
  self._refresh();
}
