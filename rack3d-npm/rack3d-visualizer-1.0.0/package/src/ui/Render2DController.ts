// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any // temporary — replaced by full interface when Rack3DVisualizer.ts is created

export class Render2DController {
  constructor(private readonly viz: IVisualizer) {}

  render2D(): void {
    const self = this.viz;
    const cont = document.getElementById(self._id + '-2d');
    if (!cont) return;
    if (!self._rack) {
      cont.innerHTML = '<div style="color:var(--r3-dim);font-family:\'Share Tech Mono\',monospace;font-size:11px;padding:30px;text-align:center;opacity:.5">Click a rack in 3D view to see its 2D representation</div>';
      return;
    }
    const r  = self._rack;
    const UH = 26;
    const allowDrag = self._opts.view.allowDragDrop;
    const id = self._id;

    const unitOcc = new Map<number, Record<string, unknown>>();
    r.devices.forEach((dev: Record<string, unknown>) => {
      for (let u = dev.startUnit as number; u < (dev.startUnit as number) + (dev.heightUnits as number); u++) {
        if (!unitOcc.has(u)) unitOcc.set(u, {});
        const slot = unitOcc.get(u)!;
        if (dev.halfWidth === 'left')       slot.left  = dev;
        else if (dev.halfWidth === 'right') slot.right = dev;
        else                               slot.full  = dev;
      }
    });

    const stMap: Record<string, [string, string]> = { up:['#00ff88','▲'], down:['#ff3344','▼'], warn:['#ffaa00','⚠'] };

    const devLabel = (dev: Record<string, unknown>, col: string, isStart: boolean) => {
      if (!isStart) return '';
      const stPair: [string, string] | undefined = dev.status ? stMap[dev.status as string] : undefined;
      const sc = stPair?.[0];
      const si = stPair?.[1];
      const statusSpan = sc ? `<span style="color:${sc};font-size:9px">${si}</span>` : '';
      const ipSpan = dev.ip ? `<span style="opacity:.5;font-size:8px"> 🔌${dev.ip}</span>` : '';
      return `<span style="font-weight:700;color:${col};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${self._types[dev.type as string]?.icon || ''} ${dev.name}</span>${statusSpan}${ipSpan}<span style="opacity:.45;font-size:8px;margin-left:4px">${dev.watts}W</span>`;
    };

    const dragAttrs = (dev: Record<string, unknown>) => allowDrag
      ? `draggable="true" ondragstart="window._r3['${id}']._on2DDragStart(event,'${dev.id}')" ondragend="window._r3['${id}']._on2DDragEnd(event)"`
      : '';

    const dropAttrs = (unit: number, side = '') => allowDrag
      ? `ondragover="event.preventDefault();this.classList.add('r3-dh')" ondragleave="this.classList.remove('r3-dh')" ondrop="event.preventDefault();this.classList.remove('r3-dh');window._r3['${id}']._on2DDrop(event,${unit},'${side}')"`
      : '';

    let html = `<div class="r3-2d-rack" id="${id}-2dr" style="min-width:320px;width:480px">`;

    for (let u = r.units; u >= 1; u--) {
      const slot    = unitOcc.get(u) || {};
      const { full, left, right } = slot as { full?: Record<string, unknown>; left?: Record<string, unknown>; right?: Record<string, unknown> };

      if (full && u !== full.startUnit) continue;

      if (full) {
        const col     = self._types[full.type as string]?.color || '#2288ff';
        const h       = UH * (full.heightUnits as number);
        const isStart = true;
        const imgH    = h - 4;
        const imgSection = full.imageUrl
          ? `<img src="${full.imageUrl}" style="height:${imgH}px;width:auto;max-width:80px;object-fit:contain;border-radius:2px;margin-right:5px;border:1px solid ${col}33;flex-shrink:0" loading="lazy">`
          : '';
        html += `<div class="r3-2d-unit" data-unit="${u}" style="height:${h}px;background:${col}22;border-left:3px solid ${col};display:flex;align-items:center;padding:2px 4px;overflow:hidden;cursor:${allowDrag?'grab':'default'}" ${dragAttrs(full)} ${dropAttrs(u)}>
        <span class="r3-2d-num">${u}</span>
        ${imgSection}
        <div class="r3-2d-bar" style="color:${col};flex:1;min-width:0;overflow:hidden">${devLabel(full, col, isStart)}</div>
      </div>`;
      } else {
        const leftIsStart  = left  && u === left.startUnit;
        const rightIsStart = right && u === right.startUnit;

        if (left && !leftIsStart && right && !rightIsStart) continue;
        if (left && !leftIsStart && !right) continue;
        if (right && !rightIsStart && !left) continue;

        const rowH = UH;
        html += `<div class="r3-2d-unit r3-2d-half-row" data-unit="${u}" style="height:${rowH}px;display:flex;align-items:stretch;padding:0" ${dropAttrs(u)}>
        <span class="r3-2d-num" style="display:flex;align-items:center">${u}</span>
        <div style="flex:1;display:flex;min-width:0">`;

        if (left) {
          const col   = self._types[left.type as string]?.color || '#2288ff';
          html += `<div class="r3-2d-half" data-devid="${left.id}" style="flex:1;background:${col}22;border-left:3px solid ${col};padding:2px 4px;overflow:hidden;display:flex;align-items:center;cursor:${allowDrag?'grab':'default'};min-width:0" ${dragAttrs(left)} ${dropAttrs(u, 'left')}>
          <div style="color:${col};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10px">${devLabel(left, col, !!leftIsStart)}</div>
        </div>`;
        } else {
          html += `<div class="r3-2d-half r3-2d-empty" style="flex:1;border-left:1px dashed var(--r3-border);opacity:.4" ${dropAttrs(u, 'left')}></div>`;
        }

        if (right) {
          const col   = self._types[right.type as string]?.color || '#2288ff';
          html += `<div class="r3-2d-half" data-devid="${right.id}" style="flex:1;background:${col}22;border-left:3px solid ${col};padding:2px 4px;overflow:hidden;display:flex;align-items:center;cursor:${allowDrag?'grab':'default'};min-width:0" ${dragAttrs(right)} ${dropAttrs(u, 'right')}>
          <div style="color:${col};overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10px">${devLabel(right, col, !!rightIsStart)}</div>
        </div>`;
        } else {
          html += `<div class="r3-2d-half r3-2d-empty" style="flex:1;border-left:1px dashed var(--r3-border);opacity:.4" ${dropAttrs(u, 'right')}></div>`;
        }

        html += `</div></div>`;
      }
    }

    html += '</div>';
    cont.innerHTML = html;
  }

  on2DDragStart(event: DragEvent, devId: string): void {
    const self = this.viz;
    self._dragId = devId;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', devId);
    (event.currentTarget as HTMLElement).style.opacity = '0.5';
  }

  on2DDragEnd(event: DragEvent): void {
    const self = this.viz;
    self._dragId = null;
    if (event.currentTarget) (event.currentTarget as HTMLElement).style.opacity = '';
    document.querySelectorAll(`#${self._id} .r3-dh`).forEach(el => el.classList.remove('r3-dh'));
  }

  on2DDrop(event: DragEvent, unit: number, side = ''): void {
    const self = this.viz;
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll(`#${self._id} .r3-dh`).forEach(el => el.classList.remove('r3-dh'));

    const data = event.dataTransfer!.getData('text/plain');
    const isCatalog = data.startsWith('cat:') || self._dragCatId;
    const catId = isCatalog ? (self._dragCatId || data.replace('cat:', '')) : null;

    if (isCatalog && catId) {
      const item = self._rack?.catalog?.find((c: Record<string, unknown>) => c.id === catId);
      if (!item) return;
      const nd: Record<string, unknown> = {
        id: 'd' + Date.now(),
        name: item.name,
        type: item.type,
        startUnit: unit,
        heightUnits: item.heightUnits,
        watts: item.watts,
      };
      if (item.halfWidth) nd.halfWidth = item.halfWidth;

      const tempId = nd.id;
      self._rack.devices.push(nd);
      self._dragCatId = null;
      const occ = new Map<number, { left: boolean; right: boolean; full: boolean }>();
      self._rack.devices.forEach((d: Record<string, unknown>) => {
        if (d.id === tempId) return;
        for (let u = d.startUnit as number; u < (d.startUnit as number) + (d.heightUnits as number); u++) {
          if (!occ.has(u)) occ.set(u, { left: false, right: false, full: false });
          const slot = occ.get(u)!;
          if (d.halfWidth === 'left') slot.left = true;
          else if (d.halfWidth === 'right') slot.right = true;
          else slot.full = true;
        }
      });
      let ok = true;
      for (let u = unit; u < unit + (nd.heightUnits as number); u++) {
        if (u < 1 || u > self._rack.units) { ok = false; break; }
        const slot = occ.get(u);
        if (!slot) continue;
        if (slot.full) { ok = false; break; }
        if (!nd.halfWidth) { if (slot.left || slot.right) { ok = false; break; } }
        else {
          if (nd.halfWidth === 'left'  && slot.left)  { ok = false; break; }
          if (nd.halfWidth === 'right' && slot.right) { ok = false; break; }
        }
      }
      if (!ok) { self._rack.devices = self._rack.devices.filter((d: Record<string, unknown>) => d.id !== tempId); return; }
      self._buildRack(); self._refresh(); self._render2D();
    } else if (self._dragId) {
      const sideHint = side || null;
      self._dropUnit(self._dragId, unit, sideHint);
      self._dragId = null;
    }
  }

  dropUnit(devId: string, unit: number, side: string | null = null): void {
    const self = this.viz;
    const dev = self._rack.devices.find((d: Record<string, unknown>) => d.id === devId); if (!dev) return;

    const occ = new Map<number, { left: boolean; right: boolean; full: boolean }>();
    self._rack.devices.forEach((d: Record<string, unknown>) => {
      if (d.id === devId) return;
      for (let u = d.startUnit as number; u < (d.startUnit as number) + (d.heightUnits as number); u++) {
        if (!occ.has(u)) occ.set(u, { left: false, right: false, full: false });
        const slot = occ.get(u)!;
        if (d.halfWidth === 'left')       slot.left  = true;
        else if (d.halfWidth === 'right') slot.right = true;
        else                              slot.full  = true;
      }
    });

    const newHW = dev.halfWidth || null;

    let ok = true;
    for (let u = unit; u < unit + (dev.heightUnits as number); u++) {
      if (u < 1 || u > self._rack.units) { ok = false; break; }
      const slot = occ.get(u);
      if (!slot) continue;
      if (slot.full) { ok = false; break; }
      if (!newHW) {
        if (slot.left || slot.right) { ok = false; break; }
      } else {
        if (newHW === 'left'  && slot.left)  { ok = false; break; }
        if (newHW === 'right' && slot.right) { ok = false; break; }
      }
    }

    if (ok) {
      dev.startUnit = unit;
      self._buildRack();
      self._refresh();
      if (self._mode === '2d') self._render2D();
    }
  }

  exportImage(format: string): void {
    const self = this.viz;
    if (!self._rack) return;
    if (format === 'svg') {
      const svg = this.gen2DSVG();
      this.dlBlob(new Blob([svg], { type: 'image/svg+xml' }), (self._rack.name || 'rack') + '.svg');
    } else {
      const canvas = this.gen2DCanvas();
      canvas.toBlob(
        (blob: Blob | null) => { if (blob) this.dlBlob(blob, (self._rack.name || 'rack') + '.' + format); },
        format === 'jpg' ? 'image/jpeg' : 'image/png',
        0.95
      );
    }
  }

  dlBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  gen2DCanvas(): HTMLCanvasElement {
    const self = this.viz;
    const r     = self._rack;
    const tc    = self._theme.css;
    const UH    = 26, W = 460, NUM_W = 32;
    const SCALE = 2;

    const unitOcc = new Map<number, Record<string, unknown>>();
    r.devices.forEach((dev: Record<string, unknown>) => {
      for (let u = dev.startUnit as number; u < (dev.startUnit as number) + (dev.heightUnits as number); u++) {
        if (!unitOcc.has(u)) unitOcc.set(u, {});
        const slot = unitOcc.get(u)!;
        if (dev.halfWidth === 'left')       slot.left  = dev;
        else if (dev.halfWidth === 'right') slot.right = dev;
        else                               slot.full  = dev;
      }
    });

    let rowCount = 0;
    for (let u = r.units; u >= 1; u--) {
      const slot = unitOcc.get(u) || {};
      const { full, left, right } = slot as { full?: Record<string, unknown>; left?: Record<string, unknown>; right?: Record<string, unknown> };
      if (full && u !== full.startUnit) continue;
      if (!full) {
        if (left && !right && u !== left.startUnit) continue;
        if (!left && right && u !== right.startUnit) continue;
        if (left && right && u !== left.startUnit && u !== right.startUnit) continue;
      }
      rowCount++;
    }

    const totalH = rowCount * UH + 4;
    const cv = document.createElement('canvas');
    cv.width  = W * SCALE;
    cv.height = totalH * SCALE;
    const ctx = cv.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = tc.bg;
    ctx.fillRect(0, 0, W, totalH);

    ctx.strokeStyle = tc.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, W - 2, totalH - 2);

    let row = 0;
    for (let u = r.units; u >= 1; u--) {
      const slot = unitOcc.get(u) || {};
      const { full, left, right } = slot as { full?: Record<string, unknown>; left?: Record<string, unknown>; right?: Record<string, unknown> };

      if (full && u !== full.startUnit) continue;
      if (!full) {
        if (left && !right && u !== left.startUnit) continue;
        if (!left && right && u !== right.startUnit) continue;
        if (left && right && u !== left.startUnit && u !== right.startUnit) continue;
      }

      const y = row * UH + 2;

      ctx.font = `${9 * SCALE / SCALE}px monospace`;
      ctx.fillStyle = tc.dim;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(u), NUM_W - 4, y + UH / 2);

      if (full) {
        const col  = self._types[full.type as string]?.color || '#2288ff';
        const devH = (full.heightUnits as number) * UH;
        ctx.fillStyle = col + '22'; ctx.fillRect(NUM_W, y, W - NUM_W - 2, devH);
        ctx.fillStyle = col;        ctx.fillRect(NUM_W, y, 3, devH);
        ctx.font      = `bold 11px monospace`;
        ctx.fillStyle = col; ctx.textAlign = 'left';
        ctx.fillText(`${self._types[full.type as string]?.icon || ''} ${full.name}`, NUM_W + 8, y + devH / 2);
        ctx.font      = '9px monospace'; ctx.fillStyle = col + '99'; ctx.textAlign = 'right';
        ctx.fillText(`${full.watts}W`, W - 6, y + devH / 2);
      } else {
        const halfW = (W - NUM_W - 2) / 2;
        if (left) {
          const col  = self._types[left.type as string]?.color || '#2288ff';
          const devH = (left.heightUnits as number) * UH;
          ctx.fillStyle = col + '22'; ctx.fillRect(NUM_W, y, halfW, devH);
          ctx.fillStyle = col;        ctx.fillRect(NUM_W, y, 3, devH);
          ctx.font      = `bold 10px monospace`;
          ctx.fillStyle = col; ctx.textAlign = 'left';
          ctx.fillText(left.name as string, NUM_W + 6, y + UH / 2);
        }
        if (right) {
          const col  = self._types[right.type as string]?.color || '#2288ff';
          const devH = (right.heightUnits as number) * UH;
          ctx.fillStyle = col + '22'; ctx.fillRect(NUM_W + halfW, y, halfW, devH);
          ctx.fillStyle = col;        ctx.fillRect(NUM_W + halfW, y, 3, devH);
          ctx.font      = `bold 10px monospace`;
          ctx.fillStyle = col; ctx.textAlign = 'left';
          ctx.fillText(right.name as string, NUM_W + halfW + 6, y + UH / 2);
        }
        if (!left && !right) {
          ctx.strokeStyle = tc.border + '55';
          ctx.lineWidth   = 0.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(NUM_W, y + UH / 2); ctx.lineTo(W - 2, y + UH / 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.strokeStyle = tc.border + '33';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(NUM_W, y + UH); ctx.lineTo(W - 2, y + UH); ctx.stroke();

      row++;
    }

    return cv;
  }

  gen2DSVG(): string {
    const self = this.viz;
    const r  = self._rack;
    const tc = self._theme.css;
    const UH = 26, W = 460, NUM_W = 32;

    const unitOcc = new Map<number, Record<string, unknown>>();
    r.devices.forEach((dev: Record<string, unknown>) => {
      for (let u = dev.startUnit as number; u < (dev.startUnit as number) + (dev.heightUnits as number); u++) {
        if (!unitOcc.has(u)) unitOcc.set(u, {});
        const slot = unitOcc.get(u)!;
        if (dev.halfWidth === 'left')       slot.left  = dev;
        else if (dev.halfWidth === 'right') slot.right = dev;
        else                               slot.full  = dev;
      }
    });

    const escXML = (s: unknown) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const rows: Array<{ u: number; full?: Record<string, unknown>; left?: Record<string, unknown>; right?: Record<string, unknown> }> = [];
    for (let u = r.units; u >= 1; u--) {
      const slot = unitOcc.get(u) || {};
      const { full, left, right } = slot as { full?: Record<string, unknown>; left?: Record<string, unknown>; right?: Record<string, unknown> };
      if (full && u !== full.startUnit) continue;
      if (!full) {
        if (left && !right && u !== left.startUnit) continue;
        if (!left && right && u !== right.startUnit) continue;
        if (left && right && u !== left.startUnit && u !== right.startUnit) continue;
      }
      rows.push({ u, full, left, right });
    }

    const totalH = rows.length * UH + 4;
    let body = '';

    rows.forEach(({ u, full, left, right }, rowIdx) => {
      const y = rowIdx * UH + 2;

      body += `<text x="${NUM_W - 4}" y="${y + UH / 2 + 3.5}" text-anchor="end" font-size="9" fill="${tc.dim}" font-family="monospace">${u}</text>`;

      if (full) {
        const col  = self._types[full.type as string]?.color || '#2288ff';
        const devH = (full.heightUnits as number) * UH;
        body += `<rect x="${NUM_W}" y="${y}" width="${W - NUM_W - 2}" height="${devH}" fill="${col}22"/>`;
        body += `<rect x="${NUM_W}" y="${y}" width="3" height="${devH}" fill="${col}"/>`;
        body += `<text x="${NUM_W + 8}" y="${y + devH / 2 + 4}" font-size="11" font-weight="bold" fill="${col}" font-family="monospace">${escXML(self._types[full.type as string]?.icon || '')} ${escXML(full.name)}</text>`;
        body += `<text x="${W - 6}" y="${y + devH / 2 + 4}" text-anchor="end" font-size="9" fill="${col}99" font-family="monospace">${full.watts}W</text>`;
      } else {
        const halfW = (W - NUM_W - 2) / 2;
        if (left) {
          const col  = self._types[left.type as string]?.color || '#2288ff';
          const devH = (left.heightUnits as number) * UH;
          body += `<rect x="${NUM_W}" y="${y}" width="${halfW}" height="${devH}" fill="${col}22"/>`;
          body += `<rect x="${NUM_W}" y="${y}" width="3" height="${devH}" fill="${col}"/>`;
          body += `<text x="${NUM_W + 6}" y="${y + UH / 2 + 4}" font-size="10" font-weight="bold" fill="${col}" font-family="monospace">${escXML(left.name)}</text>`;
        }
        if (right) {
          const col  = self._types[right.type as string]?.color || '#2288ff';
          const devH = (right.heightUnits as number) * UH;
          body += `<rect x="${NUM_W + halfW}" y="${y}" width="${halfW}" height="${devH}" fill="${col}22"/>`;
          body += `<rect x="${NUM_W + halfW}" y="${y}" width="3" height="${devH}" fill="${col}"/>`;
          body += `<text x="${NUM_W + halfW + 6}" y="${y + UH / 2 + 4}" font-size="10" font-weight="bold" fill="${col}" font-family="monospace">${escXML(right.name)}</text>`;
        }
        if (!left && !right) {
          body += `<line x1="${NUM_W}" y1="${y + UH / 2}" x2="${W - 2}" y2="${y + UH / 2}" stroke="${tc.border}" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.5"/>`;
        }
      }

      body += `<line x1="${NUM_W}" y1="${y + UH}" x2="${W - 2}" y2="${y + UH}" stroke="${tc.border}" stroke-width="0.5" opacity="0.3"/>`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}">
  <rect width="${W}" height="${totalH}" fill="${tc.bg}"/>
  <rect x="1" y="1" width="${W - 2}" height="${totalH - 2}" fill="none" stroke="${tc.border}" stroke-width="1.5" rx="2"/>
  ${body}
</svg>`;
  }
}
