// ── LABELS ── floating 3D device annotation overlays

export function createLabel(self, dev, col, side) {
  const lo   = self._opts.labels;
  const icon = self._types[dev.type]?.icon || '▣';
  const type = self._types[dev.type]?.label || dev.type;

  const statusMap = { up: ['#00ff88','▲'], down: ['#ff3344','▼'], warn: ['#ffaa00','⚠'] };
  const [sc, si]  = (dev.status && statusMap[dev.status]) || [];
  const statusHtml = sc
    ? `<span class="r3-lstatus" style="color:${sc};font-size:11px;margin-left:3px" title="${dev.status}">${si}</span>`
    : '';

  const detailLines = [];

  if (lo.showWatts && dev.watts != null)
    detailLines.push(`<span>⚡ ${dev.watts}W</span>`);
  if (lo.showUnits)
    detailLines.push(`<span>📌 U${dev.startUnit}–${dev.startUnit + dev.heightUnits - 1}</span>`);
  if (dev.ip)
    detailLines.push(`<span>🔌 ${dev.ip}</span>`);

  if (Array.isArray(dev.fields)) {
    dev.fields.forEach(f => {
      const parts = [f.icon || '', f.label ? `<span style="opacity:.65">${f.label}:</span>` : '', `<b>${f.value ?? ''}</b>`].filter(Boolean);
      detailLines.push(parts.join(' '));
    });
  }

  const detailId = self._id + '-det-' + dev.id;
  const hasDetail = detailLines.length > 0;

  const d = document.createElement('div');
  d.className = `r3-label side-${side}`;
  d.id = self._id + '-lbl-' + dev.id;
  d.innerHTML = `
    <div class="r3-ldot" style="color:${col}"></div>
    <div class="r3-lhline" style="color:${col};width:${lo.connectorLength}px"></div>
    <div class="r3-lcard">
      <div class="r3-ltag" style="border-color:${col}66;color:${col}">
        ${lo.showIcon ? `<span style="font-size:${lo.iconSize||13}px">${icon}</span>` : ''}
        <span class="r3-lname" style="font-size:${lo.fontSize||11}px">${dev.name}</span>
        ${statusHtml}
        ${lo.showType ? `<span class="r3-ltype" style="color:${col}88">${type}</span>` : ''}
        ${hasDetail ? `<span class="r3-ltoggle" onclick="(function(b){var el=document.getElementById('${detailId}');if(el){el.style.display=el.style.display==='none'?'flex':'none';b.textContent=el.style.display==='none'?'⊞':'⊟'}})(this)" style="cursor:pointer;margin-left:4px;opacity:.7;font-size:10px;user-select:none">⊞</span>` : ''}
      </div>
      ${hasDetail ? `<div id="${detailId}" class="r3-ldetail" style="border-color:${col}44;color:${col}cc;display:none">
         ${detailLines.map(l => `<div class="r3-ldetail-row" style="font-size:${lo.fontSize ? lo.fontSize - 1 : 10}px">${l}</div>`).join('')}
       </div>` : ''}
    </div>`;

  const labelsEl = document.getElementById(self._id + '-labels');
  if (labelsEl) labelsEl.appendChild(d);
  self._labelDivs[dev.id] = d;
}

export function refreshLabel(self, dev) {
  const d = self._labelDivs[dev.id];
  if (!d) return;

  const lo = self._opts.labels;
  const statusMap = { up: ['#00ff88','▲'], down: ['#ff3344','▼'], warn: ['#ffaa00','⚠'] };
  const [sc, si] = (dev.status && statusMap[dev.status]) || [];

  const ltag = d.querySelector('.r3-ltag');
  if (ltag) {
    const existing = ltag.querySelector('.r3-lstatus');
    if (existing) existing.remove();
    if (sc) {
      const span = document.createElement('span');
      span.className = 'r3-lstatus';
      span.style.cssText = `color:${sc};font-size:11px;margin-left:3px`;
      span.title = dev.status;
      span.textContent = si;
      const lname = ltag.querySelector('.r3-lname');
      if (lname?.nextSibling) ltag.insertBefore(span, lname.nextSibling);
      else ltag.appendChild(span);
    }
  }

  const detailId = self._id + '-det-' + dev.id;
  const detailLines = [];
  if (lo.showWatts && dev.watts != null) detailLines.push(`<span>⚡ ${dev.watts}W</span>`);
  if (lo.showUnits) detailLines.push(`<span>📌 U${dev.startUnit}–${dev.startUnit + dev.heightUnits - 1}</span>`);
  if (dev.ip) detailLines.push(`<span>🔌 ${dev.ip}</span>`);
  if (Array.isArray(dev.fields)) {
    dev.fields.forEach(f => {
      const parts = [f.icon || '', f.label ? `<span style="opacity:.65">${f.label}:</span>` : '', `<b>${f.value ?? ''}</b>`].filter(Boolean);
      detailLines.push(parts.join(' '));
    });
  }

  const lcard = d.querySelector('.r3-lcard');
  let detailEl = document.getElementById(detailId);
  const col = d.querySelector('.r3-ldot')?.style.color || '#2288ff';
  const fontSize = lo.fontSize ? lo.fontSize - 1 : 10;

  if (detailLines.length > 0) {
    const rows = detailLines.map(l => `<div class="r3-ldetail-row" style="font-size:${fontSize}px">${l}</div>`).join('');
    if (detailEl) {
      detailEl.innerHTML = rows;
    } else if (lcard) {
      detailEl = document.createElement('div');
      detailEl.id = detailId;
      detailEl.className = 'r3-ldetail';
      detailEl.style.cssText = `border-color:${col}44;color:${col}cc;display:none`;
      detailEl.innerHTML = rows;
      lcard.appendChild(detailEl);
      if (ltag && !ltag.querySelector('.r3-ltoggle')) {
        const tog = document.createElement('span');
        tog.className = 'r3-ltoggle';
        tog.style.cssText = 'cursor:pointer;margin-left:4px;opacity:.7;font-size:10px;user-select:none';
        tog.textContent = '⊞';
        tog.onclick = function() {
          const el = document.getElementById(detailId);
          if (el) { el.style.display = el.style.display === 'none' ? 'flex' : 'none'; tog.textContent = el.style.display === 'none' ? '⊞' : '⊟'; }
        };
        ltag.appendChild(tog);
      }
    }
  } else if (detailEl) {
    detailEl.remove();
    ltag?.querySelector('.r3-ltoggle')?.remove();
  }
}

export function updateLabels(self) {
  if (!self._cam || !self._ren) return;
  const W = self._ren.domElement.clientWidth;
  const H = self._ren.domElement.clientHeight;
  const vp = new self._T3.Vector3();
  Object.entries(self._labelPositions).forEach(([id, entry]) => {
    const d = self._labelDivs[id]; if (!d) return;
    vp.copy(entry.pos); vp.project(self._cam);
    const sx = (vp.x * 0.5 + 0.5) * W;
    const sy = (-0.5 * vp.y + 0.5) * H;
    const rack = self._devRackMap?.[id];
    const isSelected = rack && rack.id === self._selRackId;
    const visible = isSelected && rack.showLabels !== false && vp.z > 0 && vp.z < 1;

    d.style.top    = sy + 'px';
    d.style.transform = 'translateY(-50%)';
    if (entry.side === 'left') {
      d.style.left  = sx + 'px';
      d.style.right = 'auto';
    } else {
      d.style.left  = 'auto';
      d.style.right = (W - sx) + 'px';
    }
    d.style.opacity = visible ? 1 : 0;
    d.style.zIndex  = id === self._selId ? '10' : '5';
  });
}
