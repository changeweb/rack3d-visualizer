// ── SIDEBAR ── device list, unit map, legend, edit panel

import { tempColor } from './constants.js';

export function refresh(self) {
  if (!self._rack) return;
  const r   = self._rack;
  const sb  = self._opts.sidebar;
  const pct = r.pduCapacity > 0 ? Math.round(r.pduLoad / r.pduCapacity * 100) : 0;
  const tc2 = tempColor(r.rackTemp);
  const pwc = pct > 90 ? '#ff3344' : pct > 70 ? '#ffaa00' : '#00ff88';
  const $ = id => document.getElementById(self._id + '-' + id);

  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  const val = (id, v)   => { const el = $(id); if (el) el.value = v; };
  const css = (id, prop, v) => { const el = $(id); if (el) el.style[prop] = v; };

  set('bn', r.name); set('bu', r.units + 'U');
  set('bt', r.rackTemp + '°C'); set('bw', r.pduLoad + 'W');
  val('rn', r.name); val('ru', r.units);
  val('rwidth', self._opts.rack.width);
  val('rtemp', r.rackTemp); val('rpduCap', r.pduCapacity); val('rpduLoad', r.pduLoad);

  const sw = $('sw'); if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity}W (${pct}%)</span>`;
  const st = $('st'); if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp}</span><span style="font-size:10px;opacity:.6">°C</span>`;
  css('sfW', 'width', Math.min(100, pct) + '%'); css('sfW', 'background', pwc);
  css('sfT', 'width', Math.min(100, r.rackTemp * 1.8) + '%'); css('sfT', 'background', tc2);

  // Device list
  if (sb.showDeviceList) {
    const dl = $('dl'); if (dl) {
      dl.innerHTML = '';
      r.devices.slice().sort((a, b) => a.startUnit - b.startUnit).forEach(dev => {
        const col   = self._types[dev.type]?.color || '#2288ff';
        const isSel = self._selId === dev.id;
        const d     = document.createElement('div');
        d.className = 'r3-dc' + (isSel ? ' sel' : '');
        d.style.setProperty('--r3-selcol', col);
        d.innerHTML = `<div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
          <div style="flex:1;min-width:0">
            <div class="r3-dn">${self._types[dev.type]?.icon || '▣'} ${dev.name}</div>
            <div class="r3-dm">${self._types[dev.type]?.label} · U${dev.startUnit}–${dev.startUnit + dev.heightUnits - 1} · ${dev.watts}W${dev.ip ? ' · ' + dev.ip : ''}${dev.status ? ' <span style="color:' + ({up:'#00ff88',down:'#ff3344',warn:'#ffaa00'}[dev.status]||'#888') + '">' + ({up:'▲',down:'▼',warn:'⚠'}[dev.status]||'') + '</span>' : ''}</div>
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
          d.addEventListener('dragend',   () => { self._dragId = null; });
        }
        dl.appendChild(d);
      });
    }
  }

  // Add buttons
  if (sb.showAddButtons && self._opts.view.allowAddRemove) {
    const ab = $('ab'); if (ab) {
      ab.innerHTML = '';
      Object.entries(self._types).forEach(([type, info]) => {
        const b = document.createElement('button'); b.className = 'r3-ab';
        b.textContent = info.icon + ' ' + info.label;
        b.style.cssText = `background:${info.color}18;color:${info.color};border:1px solid ${info.color}44`;
        b.addEventListener('click', () => self._addDev(type));
        ab.appendChild(b);
      });
    }
  }

  // Unit map
  if (sb.showUnitMap) buildUnitMap(self);
  // Legend
  if (sb.showLegend)  buildLegend(self);
  // Catalog
  self._renderCatalog();

  if (self._opts.onChange && self._rack) self._opts.onChange(self.getData());
}

export function buildUnitMap(self) {
  const um = document.getElementById(self._id + '-um'); if (!um) return;
  um.innerHTML = '';
  const r = self._rack;
  for (let i = r.units; i >= 1; i--) {
    const dev = r.devices.find(d => i >= d.startUnit && i < d.startUnit + d.heightUnits);
    const col = dev ? (self._types[dev.type]?.color || '#2288ff') : null;
    const isFirst = dev && i === dev.startUnit;
    const isLast  = dev && i === dev.startUnit + dev.heightUnits - 1;
    const row = document.createElement('div'); row.className = 'r3-ur';
    if (dev) {
      row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
        <div style="flex:1;background:${col}28;border-left:3px solid ${col};padding:0 5px;height:100%;display:flex;align-items:center;${isFirst?`border-top:1px solid ${col}88;`:''}${isLast?`border-bottom:1px solid ${col}88;`:''}">
          <span style="color:${col};font-size:8px;font-family:'Share Tech Mono',monospace;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:130px;font-weight:600">
            ${isFirst ? (self._types[dev.type]?.icon + ' ' + dev.name) : ''}
          </span>
        </div>`;
    } else {
      row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
        <div style="flex:1;height:1px;border-top:1px dashed var(--r3-border);margin:0 4px"></div>`;
    }
    if (self._opts.view.allowDragDrop) {
      row.addEventListener('dragover',  e => { e.preventDefault(); row.style.background = '#1f6feb22'; });
      row.addEventListener('dragleave', () => { row.style.background = ''; });
      row.addEventListener('drop',      e => { e.preventDefault(); row.style.background = ''; self._dropUnit(self._dragId, i); });
    }
    um.appendChild(row);
  }
}

export function buildLegend(self) {
  const el = document.getElementById(self._id + '-legend'); if (!el) return;
  el.innerHTML = Object.entries(self._types).map(([, i]) =>
    `<div class="r3-lrow"><div class="r3-lswatch" style="background:${i.color};box-shadow:0 0 4px ${i.color}66"></div><span>${i.icon}</span><span>${i.label}</span></div>`
  ).join('');
}

export function openEdit(self, dev) {
  const ep = document.getElementById(self._id + '-ep'); if (!ep) return;
  ep.style.display = 'block';
  const sbr = document.getElementById(self._id + '-sbr');
  if (sbr) sbr.classList.add('r3-sbr-open');
  const el = document.getElementById(self._id + '-elbl'); if (el) el.textContent = '▸ ' + dev.name;
  const set = (id, v) => { const e = document.getElementById(self._id + '-' + id); if (e) e.value = v; };
  set('en', dev.name); set('et', dev.type); set('ew', dev.watts);
  set('eh', dev.heightUnits); set('es', dev.startUnit);
  set('ehw', dev.halfWidth || '');
  set('ecolor', dev.color || (self._types[dev.type]?.color || '#2288ff'));
  set('eimg', dev.imageUrl || '');
  set('eimgr', dev.imageUrlRear || '');
  set('eip', dev.ip || '');
  set('estat', dev.status || '');
  renderCustomFieldsEditor(self, dev);
}

export function closeEdit(self) {
  const ep = document.getElementById(self._id + '-ep'); if (ep) ep.style.display = 'none';
  const catWrap = document.getElementById(self._id + '-cat-edit-wrap');
  if (!catWrap?.hasChildNodes()) {
    const sbr = document.getElementById(self._id + '-sbr');
    if (sbr) sbr.classList.remove('r3-sbr-open');
  }
}

export function ed(self, field, value) {
  const dev = self._rack?.devices.find(d => d.id === self._selId); if (!dev) return;
  if (field === 'halfWidth') {
    if (!value || value === 'undefined') delete dev.halfWidth;
    else dev.halfWidth = value;
  } else if (field === 'color') {
    dev.color = value || undefined;
  } else {
    dev[field] = value;
  }
  if (field === 'name') { const el = document.getElementById(self._id + '-elbl'); if (el) el.textContent = '▸ ' + value; }
  self._buildRack(); self._refresh();
  if (self._mode === '2d') self._render2D();
}

export function addDev(self, type, halfWidth = null, nameOverride = null, hOverride = null, wattsOverride = null) {
  const h = hOverride ?? (type === 'storage' ? 3 : type === 'server' ? 2 : 1);
  const findFreeUnit = (hw) => {
    for (let u = 1; u <= self._rack.units; u++) {
      let ok = true;
      for (let j = u; j < u + h; j++) {
        if (j > self._rack.units) { ok = false; break; }
        const blockers = self._rack.devices.filter(d => j >= d.startUnit && j < d.startUnit + d.heightUnits);
        for (const d of blockers) {
          if (d.halfWidth === undefined || d.halfWidth === null || d.halfWidth === '') {
            ok = false; break;
          }
          if (!hw) { ok = false; break; }
          if (d.halfWidth === hw) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (ok) return u;
    }
    return 1;
  };
  const st = findFreeUnit(halfWidth);
  const nd = {
    id: 'd' + Date.now(),
    name: nameOverride || ('New ' + (self._types[type]?.label || type)),
    type,
    startUnit: st,
    heightUnits: h,
    watts: wattsOverride ?? 200,
  };
  if (halfWidth) nd.halfWidth = halfWidth;
  self._rack.devices.push(nd);
  self._selId = nd.id; self._openEdit(nd);
  self._buildRack(); self._refresh();
  if (self._mode === '2d') self._render2D();
  return nd;
}

export function rmDev(self, id) {
  self._rack.devices = self._rack.devices.filter(d => d.id !== id);
  if (self._selId === id) { self._selId = null; self._closeEdit(); }
  self._buildRack(); self._refresh();
}

export function onRackName(self, v) { self._rack.name = v; self._refresh(); }

export function onRackUnits(self, v) {
  self._rack.units = Math.max(4, v || self._rack.units);
  self._buildRack(); self._refresh();
}

export function onRackProp(self, p, v) { self._rack[p] = v; self._refresh(); }

export function onRackWidth(self, v) {
  if (v >= 2 && v <= 12) { self._opts.rack.width = v; self._buildRack(); self._refresh(); }
}

export function renderCustomFieldsEditor(self, dev) {
  const container = document.getElementById(self._id + '-efields');
  if (!container) return;
  container.innerHTML = '';
  (dev.fields || []).forEach((f, i) => {
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
  const dev = self._rack?.devices.find(d => d.id === self._selId); if (!dev) return;
  if (!dev.fields) dev.fields = [];
  dev.fields.push({ icon: '', label: '', value: '' });
  renderCustomFieldsEditor(self, dev);
  self._refresh();
}

export function editField(self, idx, key, value) {
  const dev = self._rack?.devices.find(d => d.id === self._selId); if (!dev?.fields) return;
  dev.fields[idx][key] = value;
  self._refresh();
}

export function removeField(self, idx) {
  const dev = self._rack?.devices.find(d => d.id === self._selId); if (!dev?.fields) return;
  dev.fields.splice(idx, 1);
  renderCustomFieldsEditor(self, dev);
  self._refresh();
}
