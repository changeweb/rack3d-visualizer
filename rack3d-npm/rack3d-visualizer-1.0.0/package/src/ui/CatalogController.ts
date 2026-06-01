// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any // temporary — replaced by full interface when Rack3DVisualizer.ts is created

export class CatalogController {
  constructor(private readonly viz: IVisualizer) {}

  private syncCatalogToDevices(item: Record<string, unknown>): void {
    const self = this.viz;
    (self._room?.racks || []).forEach((rack: Record<string, unknown>) => {
      ((rack.devices as Record<string, unknown>[]) || []).forEach((dev: Record<string, unknown>) => {
        const matches = dev.catalogId ? dev.catalogId === item.id : dev.type === item.type;
        if (!matches) return;
        dev.type         = item.type;
        dev.heightUnits  = item.heightUnits;
        dev.watts        = item.watts;
        dev.imageUrl     = item.imageUrl     || '';
        dev.imageUrlRear = item.imageUrlRear || '';
        if (item.halfWidth) dev.halfWidth = item.halfWidth; else delete dev.halfWidth;
      });
    });
  }

  renderCatalog(): void {
    const self = this.viz;
    const el = document.getElementById(self._id + '-cat');
    if (!el) return;
    const catalog = self._room?.catalog || [];
    const allowDrag = self._opts.view.allowDragDrop;
    const query = (self._catQuery || '').toLowerCase().trim();

    el.innerHTML = '';

    if (catalog.length === 0) {
      el.innerHTML = '<div style="font-size:10px;opacity:.4;padding:4px 0;font-family:\'Share Tech Mono\',monospace">No devices in catalog</div>';
      return;
    }

    if (!self._catCollapsed) self._catCollapsed = {};

    const groups: Record<string, Record<string, unknown>[]> = {};
    catalog.forEach((item: Record<string, unknown>) => {
      const t = (item.type as string) || 'server';
      if (!groups[t]) groups[t] = [];
      groups[t].push(item);
    });

    Object.entries(groups).forEach(([type, items]) => {
      const typeInfo = self._types[type] || {};
      const col   = typeInfo.color || '#2288ff';
      const icon  = typeInfo.icon  || '▣';
      const label = typeInfo.label || type;
      const hasQuery = query.length > 0;
      const isOpen = hasQuery || self._catCollapsed[type] === true;

      const filtered = query
        ? items.filter((i: Record<string, unknown>) => (i.name as string).toLowerCase().includes(query) || (i.type as string).toLowerCase().includes(query))
        : items;
      if (filtered.length === 0) return;

      const group = document.createElement('div');
      group.className = 'r3-cat-group';

      const hdr = document.createElement('div');
      hdr.className = 'r3-cat-group-hdr';
      hdr.innerHTML = `<span class="r3-cat-group-arrow" style="${isOpen?'':'transform:rotate(-90deg)'}">▾</span>
      <span style="display:inline-block;width:9px;height:9px;border-radius:1px;background:${col};flex-shrink:0"></span>
      <span style="color:${col}">${icon}</span>
      <span style="flex:1">${label}</span>
      <span style="opacity:.4;font-size:9px">${filtered.length}</span>`;
      hdr.addEventListener('click', () => {
        self._catCollapsed[type] = !isOpen;
        self._renderCatalog();
      });
      group.appendChild(hdr);

      const body = document.createElement('div');
      body.className = 'r3-cat-group-body';
      body.style.display = isOpen ? 'block' : 'none';

      filtered.forEach((item: Record<string, unknown>) => {
        const isSel = self._selCatId === item.id;
        const d = document.createElement('div');
        d.className = 'r3-dc r3-cat-item' + (isSel ? ' sel' : '');
        d.style.setProperty('--r3-selcol', col);
        if (allowDrag) {
          d.draggable = true;
          d.addEventListener('dragstart', (e: DragEvent) => {
            self._dragCatId = item.id;
            e.dataTransfer!.effectAllowed = 'copy';
            e.dataTransfer!.setData('text/plain', 'cat:' + item.id);
          });
          d.addEventListener('dragend', () => { self._dragCatId = null; });
        }
        d.innerHTML = `
        <div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
        <div style="flex:1;min-width:0">
          <div class="r3-dn">${item.name}</div>
          <div class="r3-dm">${item.heightUnits}U · ${item.watts}W${item.halfWidth?' · ½'+item.halfWidth:''}</div>
        </div>
        <button class="r3-cat-add-btn" title="Add to selected rack">+</button>
        <button class="r3-xb" title="Delete">×</button>`;

        d.querySelector('.r3-cat-add-btn')!.addEventListener('click', (e: Event) => { e.stopPropagation(); this.addFromCatalog(item.id as string); });
        d.querySelector('.r3-xb')!.addEventListener('click', (e: Event) => { e.stopPropagation(); self._removeCatalogItem(item.id); });
        d.addEventListener('click', () => {
          self._selCatId = isSel ? null : item.id;
          self._renderCatalog();
          if (self._selCatId) self._openCatalogEdit(item);
          else this.closeSbrIfEmpty();
        });
        body.appendChild(d);
      });

      group.appendChild(body);
      el.appendChild(group);
    });
  }

  addFromCatalog(catId: string): Record<string, unknown> | null {
    const self = this.viz;
    if (!self._rack) {
      this.flashMsg('⚠ Select a rack first');
      return null;
    }
    const item = (self._room?.catalog || []).find((c: Record<string, unknown>) => c.id === catId);
    if (!item) return null;
    const dev = self._addDev(item.type, item.halfWidth || null, item.name, item.heightUnits, item.watts);
    if (dev) {
      dev.imageUrl     = item.imageUrl     || '';
      dev.imageUrlRear = item.imageUrlRear || '';
      dev.catalogId    = catId;
    }
    return dev;
  }

  private flashMsg(text: string): void {
    const self = this.viz;
    const el = document.getElementById(self._id + '-cat');
    if (!el) return;
    const m = document.createElement('div');
    m.style.cssText = 'font-size:10px;color:#ff8844;padding:3px 6px;font-family:\'Share Tech Mono\',monospace;animation:none';
    m.textContent = text;
    el.prepend(m);
    setTimeout(() => m.remove(), 1800);
  }

  addCatalogItem(): void {
    const self = this.viz;
    if (!self._room) return;
    const newItem = { id:'cat-'+Date.now(), name:'New Device', type:'server', heightUnits:1, watts:200, imageUrl:'', imageUrlRear:'' };
    if (!Array.isArray(self._room.catalog)) self._room.catalog = [];
    self._room.catalog.push(newItem);
    self._selCatId = newItem.id;
    self._renderCatalog();
    self._openCatalogEdit(newItem);
  }

  removeCatalogItem(id: string): void {
    const self = this.viz;
    if (!self._room?.catalog) return;
    self._room.catalog = self._room.catalog.filter((c: Record<string, unknown>) => c.id !== id);
    if (self._selCatId === id) {
      self._selCatId = null;
      const wrap = document.getElementById(self._id + '-cat-edit-wrap');
      if (wrap) wrap.innerHTML = '';
      const panel = document.getElementById(self._id + '-panel-wrap-catalogEdit');
      if (panel) panel.classList.add('r3-panel-hidden');
    }
    self._renderCatalog();
  }

  openCatalogEdit(item: Record<string, unknown>): void {
    const self = this.viz;
    const wrap = document.getElementById(self._id + '-cat-edit-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    const panel = document.getElementById(self._id + '-panel-wrap-catalogEdit');
    if (panel) {
      panel.classList.remove('r3-panel-hidden');
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }

    const typeOptions = (Object.entries(self._types) as [string, Record<string, string>][])
      .map(([k, v]) => `<option value="${k}" ${k===item.type?'selected':''}>${v.label}</option>`)
      .join('');

    const form = document.createElement('div');
    form.id = self._id + '-cat-edit';
    form.className = 'r3-pnl';
    form.innerHTML = `
    <div class="r3-pl" style="margin-bottom:5px">Catalog Item</div>
    <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${self._id}-cen" value="${item.name}"></div>
    <div class="r3-rw"><span class="r3-lbl">Type</span><select class="r3-inp" id="${self._id}-cet">${typeOptions}</select></div>
    <div class="r3-rw"><span class="r3-lbl">Height U</span><input class="r3-inp" type="number" min="1" max="12" id="${self._id}-ceh" value="${item.heightUnits}"></div>
    <div class="r3-rw"><span class="r3-lbl">Watts</span><input class="r3-inp" type="number" id="${self._id}-cew" value="${item.watts}"></div>
    <div class="r3-rw"><span class="r3-lbl">Width</span>
      <select class="r3-inp" id="${self._id}-cehw">
        <option value="" ${!item.halfWidth?'selected':''}>Full Width</option>
        <option value="left" ${item.halfWidth==='left'?'selected':''}>Half — Left</option>
        <option value="right" ${item.halfWidth==='right'?'selected':''}>Half — Right</option>
      </select>
    </div>
    <div class="r3-rw"><span class="r3-lbl">Front Img</span><input class="r3-inp" id="${self._id}-ceimg"  placeholder="URL" value="${item.imageUrl||''}"></div>
    <div class="r3-rw"><span class="r3-lbl">Rear Img</span><input class="r3-inp" id="${self._id}-ceimgr" placeholder="URL" value="${item.imageUrlRear||''}"></div>
    <div style="display:flex;gap:5px;margin-top:8px">
      <button class="r3-btn on" id="${self._id}-cat-save" style="flex:1">✓ Save</button>
      <button class="r3-btn" id="${self._id}-cat-cancel" style="flex:1">✕ Cancel</button>
    </div>`;

    wrap.appendChild(form);

    document.getElementById(self._id + '-cat-save')!.addEventListener('click', () => {
      const get = (sfx: string) => (document.getElementById(self._id + '-c' + sfx) as HTMLInputElement | null)?.value;
      item.name = get('en') || item.name;
      item.type = get('et') || item.type;
      item.heightUnits = parseInt(get('eh') ?? '', 10) || item.heightUnits;
      item.watts = parseInt(get('ew') ?? '', 10) || 0;
      const hw = get('ehw');
      if (hw) item.halfWidth = hw; else delete item.halfWidth;
      item.imageUrl     = get('eimg')  ?? item.imageUrl     ?? '';
      item.imageUrlRear = get('eimgr') ?? item.imageUrlRear ?? '';

      this.syncCatalogToDevices(item);

      wrap.innerHTML = '';
      self._selCatId = null;
      const savePanel = document.getElementById(self._id + '-panel-wrap-catalogEdit');
      if (savePanel) savePanel.classList.add('r3-panel-hidden');
      self._renderCatalog();
      self._buildRack?.();
      self._refresh?.();
      if (self._opts?.onChange) self._opts.onChange(self.getData());
    });

    document.getElementById(self._id + '-cat-cancel')!.addEventListener('click', () => {
      wrap.innerHTML = '';
      self._selCatId = null;
      const cancelPanel = document.getElementById(self._id + '-panel-wrap-catalogEdit');
      if (cancelPanel) cancelPanel.classList.add('r3-panel-hidden');
      self._renderCatalog();
    });
  }

  private closeSbrIfEmpty(): void {
    // Right sidebar is always visible; nothing to close
  }
}
