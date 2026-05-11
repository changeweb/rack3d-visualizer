// ── CATALOG ── device template library

export function renderCatalog(self) {
  const el = document.getElementById(self._id + '-cat');
  if (!el || !self._rack) return;
  const catalog = self._rack.catalog || [];
  const allowDrag = self._opts.view.allowDragDrop;

  el.innerHTML = '';
  if (catalog.length === 0) {
    el.innerHTML = '<div style="font-size:10px;opacity:.4;padding:4px 0;font-family:\'Share Tech Mono\',monospace">No devices in catalog</div>';
    return;
  }

  catalog.forEach(item => {
    const col  = self._types[item.type]?.color || '#2288ff';
    const icon = self._types[item.type]?.icon  || '▣';
    const isSel = self._selCatId === item.id;

    const d = document.createElement('div');
    d.className = 'r3-dc r3-cat-item' + (isSel ? ' sel' : '');
    d.style.setProperty('--r3-selcol', col);
    if (allowDrag) {
      d.draggable = true;
      d.addEventListener('dragstart', e => {
        self._dragCatId = item.id;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'cat:' + item.id);
      });
      d.addEventListener('dragend', () => { self._dragCatId = null; });
    }
    d.innerHTML = `
      <div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
      <div style="flex:1;min-width:0">
        <div class="r3-dn">${icon} ${item.name}</div>
        <div class="r3-dm">${self._types[item.type]?.label || item.type} · ${item.heightUnits}U · ${item.watts}W${item.halfWidth ? ' · ½ '+item.halfWidth : ''}</div>
      </div>
      <button class="r3-xb" data-id="${item.id}" title="Delete">×</button>`;
    d.querySelector('.r3-xb').addEventListener('click', e => { e.stopPropagation(); self._removeCatalogItem(item.id); });
    d.addEventListener('click', () => {
      self._selCatId = isSel ? null : item.id;
      self._renderCatalog();
      if (self._selCatId) self._openCatalogEdit(item);
      else _closeSbrIfEmpty(self);
    });
    el.appendChild(d);
  });
}

export function addCatalogItem(self) {
  if (!self._rack) return;
  const newItem = {
    id: 'cat-' + Date.now(),
    name: 'New Device',
    type: 'server',
    heightUnits: 1,
    watts: 200,
  };
  if (!Array.isArray(self._rack.catalog)) self._rack.catalog = [];
  self._rack.catalog.push(newItem);
  self._selCatId = newItem.id;
  self._renderCatalog();
  self._openCatalogEdit(newItem);
}

export function removeCatalogItem(self, id) {
  if (!self._rack?.catalog) return;
  self._rack.catalog = self._rack.catalog.filter(c => c.id !== id);
  if (self._selCatId === id) {
    self._selCatId = null;
    const wrap = document.getElementById(self._id + '-cat-edit-wrap');
    if (wrap) wrap.innerHTML = '';
    _closeSbrIfEmpty(self);
  }
  self._renderCatalog();
}

export function openCatalogEdit(self, item) {
  const wrap = document.getElementById(self._id + '-cat-edit-wrap');
  if (!wrap) return;

  wrap.innerHTML = '';

  const sbr = document.getElementById(self._id + '-sbr');
  if (sbr) sbr.classList.add('r3-sbr-open');

  const typeOptions = Object.entries(self._types)
    .map(([k, v]) => `<option value="${k}" ${k === item.type ? 'selected' : ''}>${v.label}</option>`)
    .join('');

  const form = document.createElement('div');
  form.id = self._id + '-cat-edit';
  form.className = 'r3-pnl';
  form.innerHTML = `
    <div class="r3-pl" style="margin-bottom:5px">Catalog Item</div>
    <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${self._id}-cen" value="${item.name}"></div>
    <div class="r3-rw"><span class="r3-lbl">Type</span>
      <select class="r3-inp" id="${self._id}-cet">${typeOptions}</select>
    </div>
    <div class="r3-rw"><span class="r3-lbl">Height U</span><input class="r3-inp" type="number" min="1" max="12" id="${self._id}-ceh" value="${item.heightUnits}"></div>
    <div class="r3-rw"><span class="r3-lbl">Watts</span><input class="r3-inp" type="number" id="${self._id}-cew" value="${item.watts}"></div>
    <div class="r3-rw"><span class="r3-lbl">Width</span>
      <select class="r3-inp" id="${self._id}-cehw">
        <option value="" ${!item.halfWidth ? 'selected' : ''}>Full Width</option>
        <option value="left" ${item.halfWidth === 'left' ? 'selected' : ''}>Half — Left</option>
        <option value="right" ${item.halfWidth === 'right' ? 'selected' : ''}>Half — Right</option>
      </select>
    </div>
    <div style="display:flex;gap:5px;margin-top:8px">
      <button class="r3-btn on" id="${self._id}-cat-save" style="flex:1">✓ Save</button>
      <button class="r3-btn" id="${self._id}-cat-cancel" style="flex:1">✕ Cancel</button>
    </div>`;

  wrap.appendChild(form);

  document.getElementById(self._id + '-cat-save').addEventListener('click', () => {
    const get = sfx => document.getElementById(self._id + '-c' + sfx)?.value;
    item.name        = get('en')  || item.name;
    item.type        = get('et')  || item.type;
    item.heightUnits = parseInt(get('eh'), 10) || item.heightUnits;
    item.watts       = parseInt(get('ew'), 10) || 0;
    const hw = get('ehw');
    if (hw) item.halfWidth = hw; else delete item.halfWidth;
    wrap.innerHTML = '';
    self._selCatId = null;
    _closeSbrIfEmpty(self);
    self._renderCatalog();
  });

  document.getElementById(self._id + '-cat-cancel').addEventListener('click', () => {
    wrap.innerHTML = '';
    self._selCatId = null;
    _closeSbrIfEmpty(self);
    self._renderCatalog();
  });
}

function _closeSbrIfEmpty(self) {
  const ep = document.getElementById(self._id + '-ep');
  if (!ep || ep.style.display === 'none') {
    const sbr = document.getElementById(self._id + '-sbr');
    if (sbr) sbr.classList.remove('r3-sbr-open');
  }
}
