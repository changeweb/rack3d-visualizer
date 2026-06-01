// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any // temporary — replaced by full interface when Rack3DVisualizer.ts is created

import { tempColor } from '../constants'

export class SidebarController {
  constructor(private readonly viz: IVisualizer) {}

  refresh(): void {
    const self = this.viz;
    const r   = self._rack;
    const sb  = self._opts.sidebar;
    const $   = (id: string) => document.getElementById(self._id + '-' + id);
    const set = (id: string, v: string) => { const el = $(id); if (el) el.textContent = v; };
    const val = (id: string, v: unknown) => { const el = $(id) as HTMLInputElement | null; if (el) el.value = String(v); };
    const css = (id: string, p: string, v: string) => { const el = $(id) as HTMLElement | null; if (el) el.style[p as never] = v; };

    this.buildRoomPanel();

    const rnEl = document.getElementById(self._id + '-room-name') as HTMLInputElement | null;
    if (rnEl) rnEl.value = self._room?.name ?? '';

    if (!r) {
      ['bn','bu','bt','bw'].forEach((id: string) => set(id, '—'));
      const dl = $('dl');
      if (dl) dl.innerHTML = '<div class="r3-no-rack">← Click a rack in 3D to view devices</div>';
      const sw = $('sw'); if (sw) sw.innerHTML = '—';
      const st = $('st'); if (st) st.innerHTML = '—';
      css('sfW','width','0%'); css('sfT','width','0%');
      this.buildLegendOverlay();
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
    const rg = self._rackGroups?.[r.id];
    val('rposX', +(rg?.position.x ?? r.position?.x ?? 0).toFixed(2));
    val('rposY', +(rg?.position.y ?? r.position?.y ?? 0).toFixed(2));
    val('rposZ', +(rg?.position.z ?? r.position?.z ?? 0).toFixed(2));
    val('rangle', +(((r.facingAngle ?? 0) * 180 / Math.PI)).toFixed(0));
    const rnpshape = $('rnpshape') as HTMLSelectElement | null;
    if (rnpshape) rnpshape.value = r.nameplateShape ?? 'rounded';
    const rnpbg = $('rnpbg') as HTMLInputElement | null;
    if (rnpbg) rnpbg.value = r.nameplateColor ?? '#081020';
    const rnptxt = $('rnptxt') as HTMLInputElement | null;
    if (rnptxt) rnptxt.value = r.nameplateTextColor ?? '#88bbdd';
    const rsl = $('rshowlabels') as HTMLInputElement | null;
    if (rsl) rsl.checked = r.showLabels !== false;

    const sw = $('sw'); if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad||0}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity||0}W (${pct}%)</span>`;
    const st = $('st'); if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp||0}</span><span style="font-size:10px;opacity:.6">°C</span>`;
    css('sfW','width',Math.min(100,pct)+'%'); css('sfW','background',pwc);
    css('sfT','width',Math.min(100,(r.rackTemp||0)*1.8)+'%'); css('sfT','background',tc2);

    if (sb.showDeviceList) {
      const dl = $('dl');
      if (dl) {
        dl.innerHTML = '';
        (r.devices||[]).slice().sort((a: Record<string, number>, b: Record<string, number>) => a.startUnit - b.startUnit).forEach((dev: Record<string, unknown>) => {
          const col   = self._types[dev.type as string]?.color||'#2288ff';
          const isSel = self._selId === dev.id;
          const d = document.createElement('div');
          d.className = 'r3-dc'+(isSel?' sel':'');
          d.style.setProperty('--r3-selcol', col);
          const sCol = ({up:'#00ff88',down:'#ff3344',warn:'#ffaa00'} as Record<string, string>)[dev.status as string]||'#888';
          const sIco = ({up:'▲',down:'▼',warn:'⚠'} as Record<string, string>)[dev.status as string]||'';
          d.innerHTML = `<div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
          <div style="flex:1;min-width:0">
            <div class="r3-dn">${self._types[dev.type as string]?.icon||'▣'} ${dev.name}</div>
            <div class="r3-dm">${self._types[dev.type as string]?.label} · U${dev.startUnit}–${(dev.startUnit as number)+(dev.heightUnits as number)-1} · ${dev.watts}W${dev.ip?' · '+dev.ip:''}${dev.status?` <span style="color:${sCol}">${sIco}</span>`:''}</div>
          </div>
          <button class="r3-xb" data-id="${dev.id}">×</button>`;
          d.querySelector('.r3-xb')!.addEventListener('click', (e: Event) => { e.stopPropagation(); self._rmDev(dev.id); });
          d.addEventListener('click', () => {
            self._selId = isSel ? null : dev.id;
            isSel ? self._closeEdit() : self._openEdit(dev);
            self._buildRack(); self._refresh();
          });
          if (self._opts.view.allowDragDrop) {
            d.draggable = true;
            d.addEventListener('dragstart', (e: DragEvent) => { self._dragId = dev.id; e.dataTransfer!.effectAllowed = 'move'; });
            d.addEventListener('dragend', () => { self._dragId = null; });
          }
          dl.appendChild(d);
        });
      }
    }

    if (sb.showUnitMap) this.buildUnitMap();
    this.buildLegendOverlay();
    self._renderCatalog();
    if (self._opts.onChange && self._room) self._opts.onChange(self.getData());
  }

  updateRackStatsDom(r: Record<string, unknown>): void {
    const self = this.viz;
    const $ = (id: string) => document.getElementById(self._id + '-' + id);
    const set = (id: string, v: string) => { const el = $(id); if (el) el.textContent = v; };
    const css = (id: string, p: string, v: string) => { const el = $(id) as HTMLElement | null; if (el) el.style[p as never] = v; };

    const pct = (r.pduCapacity as number) > 0 ? Math.round((r.pduLoad as number) / (r.pduCapacity as number) * 100) : 0;
    const tc2 = tempColor(r.rackTemp as number);
    const pwc = pct > 90 ? '#ff3344' : pct > 70 ? '#ffaa00' : '#00ff88';

    set('bt', (r.rackTemp || 0) + '°C');
    set('bw', (r.pduLoad || 0) + 'W');

    const sw = $('sw');
    if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad || 0}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity || 0}W (${pct}%)</span>`;
    const st = $('st');
    if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp || 0}</span><span style="font-size:10px;opacity:.6">°C</span>`;
    css('sfW', 'width', Math.min(100, pct) + '%'); css('sfW', 'background', pwc);
    css('sfT', 'width', Math.min(100, ((r.rackTemp as number) || 0) * 1.8) + '%'); css('sfT', 'background', tc2);
  }

  buildRoomPanel(): void {
    const self = this.viz;
    const el = document.getElementById(self._id + '-rack-list');
    if (!el || !self._room) return;
    el.innerHTML = '';
    (self._room.racks||[]).forEach((entry: Record<string, unknown>) => {
      const isSel = entry.id === self._selRackId;
      const d = document.createElement('div');
      d.className = 'r3-rack-item'+(isSel?' sel':'');
      d.innerHTML = `<span style="flex:1;font-weight:${isSel?700:400}">${entry.name||entry.id}</span>
      <span class="r3-rack-badge" style="color:${isSel?'var(--r3-accent)':'var(--r3-dim)'};border-color:currentColor">${entry.units||24}U</span>
      <span class="r3-rack-badge" style="color:var(--r3-dim);border-color:var(--r3-border)">${((entry.devices as unknown[]) ||[]).length}d</span>`;
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

  buildUnitMap(): void {
    const self = this.viz;
    const um = document.getElementById(self._id + '-um'); if (!um) return;
    um.innerHTML = '';
    const r = self._rack; if (!r) return;
    for (let i = r.units; i >= 1; i--) {
      const dev = (r.devices||[]).find((d: Record<string, number>) => i>=d.startUnit && i<d.startUnit+d.heightUnits);
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
        row.addEventListener('dragover',  (e: DragEvent) => { e.preventDefault(); row.style.background='#1f6feb22'; });
        row.addEventListener('dragleave', () => { row.style.background=''; });
        row.addEventListener('drop', (e: DragEvent) => { e.preventDefault(); row.style.background=''; self._dropUnit(self._dragId, i); });
      }
      um.appendChild(row);
    }
  }

  buildLegendOverlay(): void {
    const self = this.viz;
    const el = document.getElementById(self._id + '-legend');
    if (!el) return;
    el.innerHTML = (Object.entries(self._types) as [string, Record<string, string>][]).map(([, i]) =>
      `<div class="r3-lrow"><div class="r3-lswatch" style="background:${i.color};box-shadow:0 0 4px ${i.color}66"></div><span>${i.icon}</span><span>${i.label}</span></div>`
    ).join('');
  }

  openEdit(dev: Record<string, unknown>): void {
    const self = this.viz;
    const editPanel = document.querySelector(`#${self._id} [data-panel-id="editDevice"]`);
    if (editPanel) editPanel.classList.remove('r3-panel-hidden');
    const el = document.getElementById(self._id + '-elbl'); if (el) el.textContent = '▸ '+(dev.name as string);
    const set = (id: string, v: unknown) => { const e = document.getElementById(self._id+'-'+id) as HTMLInputElement | null; if (e) e.value = String(v ?? ''); };
    set('en', dev.name);
    set('es', dev.startUnit);
    set('ecolor', dev.color || (self._types[dev.type as string]?.color || '#2288ff'));
    set('eip', dev.ip || '');
    set('estat', dev.status || '');
    const infoEl = document.getElementById(self._id + '-einfo');
    if (infoEl) {
      const typeLabel = self._types[dev.type as string]?.label || dev.type;
      const wLabel    = dev.halfWidth === 'left' ? 'Half-Left' : dev.halfWidth === 'right' ? 'Half-Right' : 'Full';
      infoEl.textContent = `${typeLabel} · ${dev.heightUnits}U · ${dev.watts}W · ${wLabel}`;
    }
    this.renderCustomFieldsEditor(dev);
  }

  closeEdit(): void {
    const self = this.viz;
    const editPanel = document.querySelector(`#${self._id} [data-panel-id="editDevice"]`);
    if (editPanel) editPanel.classList.add('r3-panel-hidden');
  }

  ed(field: string, value: unknown): void {
    const self = this.viz;
    const dev = self._rack?.devices?.find((d: Record<string, unknown>) => d.id === self._selId); if (!dev) return;
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

  addDev(type: string, halfWidth: string | null = null, nameOverride: string | null = null, hOverride: number | null = null, wattsOverride: number | null = null): Record<string, unknown> | null {
    const self = this.viz;
    if (!self._rack) return null;
    const h = hOverride ?? (type==='storage'?3:type==='server'?2:1);
    const findFreeUnit = (hw: string | null) => {
      for (let u=1; u<=self._rack.units; u++) {
        let ok = true;
        for (let j=u; j<u+h; j++) {
          if (j>self._rack.units) { ok=false; break; }
          const blockers = (self._rack.devices||[]).filter((d: Record<string, unknown>) => j>=(d.startUnit as number) && j<(d.startUnit as number)+(d.heightUnits as number));
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
    const nd: Record<string, unknown> = { id:'d'+Date.now(), name:nameOverride||('New '+(self._types[type]?.label||type)), type, startUnit:st, heightUnits:h, watts:wattsOverride??200 };
    if (halfWidth) nd.halfWidth = halfWidth;
    if (!Array.isArray(self._rack.devices)) self._rack.devices = [];
    self._rack.devices.push(nd);
    self._selId = nd.id; self._openEdit(nd);
    self._buildRack(); self._refresh();
    if (self._mode === '2d') self._render2D();
    return nd;
  }

  rmDev(id: string): void {
    const self = this.viz;
    if (!self._rack) return;
    self._rack.devices = (self._rack.devices||[]).filter((d: Record<string, unknown>) => d.id !== id);
    if (self._selId === id) { self._selId = null; self._closeEdit(); }
    self._buildRack(); self._refresh();
  }

  onRackName(v: string): void {
    const self = this.viz;
    if (self._rack) { self._rack.name = v; self._refresh(); }
  }

  onRackUnits(v: number): void {
    const self = this.viz;
    if (!self._rack) return;
    self._rack.units = Math.max(4, v||self._rack.units);
    self._buildRack(); self._refresh();
  }

  onRackProp(p: string, v: unknown): void {
    const self = this.viz;
    if (!self._rack) return;
    self._rack[p] = v;
    if (p === 'nameplateShape' || p === 'nameplateColor' || p === 'nameplateTextColor' || p === 'nameplateBorderColor') {
      self._buildRack();
    }
    if (p === 'showLabels') self._updateLabels?.();
    self._refresh();
  }

  onRackWidth(v: number): void {
    const self = this.viz;
    if (v>=2&&v<=12) { self._opts.rack.width=v; self._buildRack(); self._refresh(); }
  }

  onRackPos(axis: string, v: number): void {
    const self = this.viz;
    if (!self._rack) return;
    if (!self._rack.position) {
      const g = self._rackGroups?.[self._rack.id];
      self._rack.position = { x: g?.position.x ?? 0, y: 0, z: g?.position.z ?? 0 };
    }
    self._rack.position[axis] = v;
    self._buildRack(); self._refresh();
  }

  onRackAngle(deg: number): void {
    const self = this.viz;
    if (!self._rack) return;
    self._rack.facingAngle = deg * Math.PI / 180;
    self._buildRack(); self._refresh();
  }

  renderCustomFieldsEditor(dev: Record<string, unknown>): void {
    const self = this.viz;
    const container = document.getElementById(self._id + '-efields');
    if (!container) return;
    container.innerHTML = '';
    ((dev.fields as Record<string, unknown>[])||[]).forEach((f, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:3px;margin-bottom:3px;align-items:center';
      row.innerHTML = `<input class="r3-inp" placeholder="icon" style="width:36px" value="${f.icon||''}" oninput="window._r3['${self._id}']._editField(${i},'icon',this.value)">
      <input class="r3-inp" placeholder="label" style="flex:1" value="${f.label||''}" oninput="window._r3['${self._id}']._editField(${i},'label',this.value)">
      <input class="r3-inp" placeholder="value" style="flex:1" value="${f.value||''}" oninput="window._r3['${self._id}']._editField(${i},'value',this.value)">
      <button class="r3-btn" style="padding:1px 5px" onclick="window._r3['${self._id}']._removeField(${i})">×</button>`;
      container.appendChild(row);
    });
  }

  addCustomField(): void {
    const self = this.viz;
    const dev = self._rack?.devices?.find((d: Record<string, unknown>) => d.id === self._selId); if (!dev) return;
    if (!dev.fields) dev.fields = [];
    (dev.fields as Record<string, unknown>[]).push({icon:'',label:'',value:''});
    this.renderCustomFieldsEditor(dev);
    self._refresh();
  }

  editField(idx: number, key: string, value: unknown): void {
    const self = this.viz;
    const dev = self._rack?.devices?.find((d: Record<string, unknown>) => d.id === self._selId); if (!dev?.fields) return;
    (dev.fields as Record<string, unknown>[])[idx][key] = value;
    self._refresh();
  }

  removeField(idx: number): void {
    const self = this.viz;
    const dev = self._rack?.devices?.find((d: Record<string, unknown>) => d.id === self._selId); if (!dev?.fields) return;
    (dev.fields as unknown[]).splice(idx, 1);
    this.renderCustomFieldsEditor(dev);
    self._refresh();
  }
}
