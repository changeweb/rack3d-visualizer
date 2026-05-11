// ── HTML ── DOM scaffold builder

export function buildHTML(self) {
  const o = self._opts;
  const sb = o.sidebar;
  const v  = o.view;

  const toolbar = !v.showToolbar ? '' : `
  <div class="r3-hdr">
    <span class="r3-logo">RACK<span>3D</span></span>
    <div class="r3-sep"></div>
    <span class="r3-badge" id="${self._id}-bn" style="color:#79c0ff;border-color:#378ADD55;background:#378ADD11">—</span>
    <span class="r3-badge" id="${self._id}-bu" style="color:#3fb950;border-color:#1D9E7555;background:#1D9E7511">—</span>
    <span class="r3-badge" id="${self._id}-bt" style="color:#e3b341;border-color:#ffaa0055;background:#ffaa0011">—</span>
    <span class="r3-badge" id="${self._id}-bw" style="color:#cc88ff;border-color:#cc88ff55;background:#cc88ff11">—</span>
    <div class="r3-spacer"></div>
    ${self._mode!=='2d'?`<button class="r3-btn on"  id="${self._id}-btnL"  onclick="window._r3['${self._id}'].toggleLabels()">◈ LABELS</button>`:''}
    <button class="r3-btn" id="${self._id}-btnW" onclick="window._r3['${self._id}'].toggleWire()">◻ WIRE</button>
    <button class="r3-btn" id="${self._id}-btn2d" onclick="window._r3['${self._id}'].toggleMode()">⊞ ${self._mode==='2d'?'3D':'2D'}</button>
    ${v.allowJsonEdit?`<button class="r3-btn" id="${self._id}-btnJ" onclick="window._r3['${self._id}'].toggleJson()">{ } JSON</button>`:''}
  </div>`;

  const sidebarHtml = !sb.enabled ? '' : `
  <div class="r3-sb" id="${self._id}-sb">
    ${sb.showRackConfig ? `
    <div class="r3-pnl">
      <div class="r3-pl">Rack Config</div>
      <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${self._id}-rn" oninput="window._r3['${self._id}']._onRackName(this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Units</span><input class="r3-inp" type="number" id="${self._id}-ru" min="4" max="48" style="width:55px" oninput="window._r3['${self._id}']._onRackUnits(+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Width(m)</span><input class="r3-inp" type="number" id="${self._id}-rwidth" min="2" max="12" step="0.1" style="width:65px" oninput="window._r3['${self._id}']._onRackWidth(+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Temp°C</span><input class="r3-inp" type="number" id="${self._id}-rtemp" oninput="window._r3['${self._id}']._onRackProp('rackTemp',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">PDU Cap</span><input class="r3-inp" type="number" id="${self._id}-rpduCap" oninput="window._r3['${self._id}']._onRackProp('pduCapacity',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">PDU Load</span><input class="r3-inp" type="number" id="${self._id}-rpduLoad" oninput="window._r3['${self._id}']._onRackProp('pduLoad',+this.value)"></div>
    </div>` : ''}
    ${sb.showStats ? `
    <div class="r3-pnl">
      <div class="r3-pl">Statistics</div>
      <div class="r3-stat">
        <div class="r3-sv" id="${self._id}-sw">—</div>
        <div class="r3-sl">PDU Load / Capacity</div>
        <div class="r3-sbar"><div class="r3-sfill" id="${self._id}-sfW"></div></div>
      </div>
      <div class="r3-stat">
        <div class="r3-sv" id="${self._id}-st">—</div>
        <div class="r3-sl">Rack Intake Temperature</div>
        <div class="r3-sbar"><div class="r3-sfill" id="${self._id}-sfT"></div></div>
      </div>
    </div>` : ''}
    ${sb.showDeviceList ? `
    <div class="r3-pnl">
      <div class="r3-pl">Devices</div>
      <div id="${self._id}-dl"></div>
      ${sb.showAddButtons && v.allowAddRemove ? `
      <div style="display:flex;flex-wrap:wrap;margin-top:5px" id="${self._id}-ab"></div>
      <div style="display:flex;gap:4px;margin-top:6px;border-top:1px solid var(--r3-border);padding-top:6px">
        <button class="r3-btn" style="flex:1" onclick="window._r3['${self._id}'].resetRack()" title="Reset rack to empty">↺ Reset</button>
        <button class="r3-btn" id="${self._id}-btnCopy" style="flex:1" onclick="window._r3['${self._id}'].copyJson()" title="Copy JSON to clipboard">⎘ Copy JSON</button>
      </div>` : ''}
    </div>` : ''}
    <div class="r3-pnl">
      <div class="r3-pl" style="display:flex;justify-content:space-between;align-items:center">
        <span>Device Catalog</span>
        <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${self._id}']._addCatalogItem()">+ New</button>
      </div>
      <div id="${self._id}-cat" class="r3-cat-list"></div>
    </div>
    ${sb.showUnitMap ? `
    <div class="r3-pnl">
      <div class="r3-pl">Unit Map</div>
      <div class="r3-um" id="${self._id}-um"></div>
    </div>` : ''}
    ${sb.showLegend ? `
    <div class="r3-pnl">
      <div class="r3-pl">Legend</div>
      <div class="r3-legend" id="${self._id}-legend"></div>
    </div>` : ''}
  </div>`;

  const canvasHtml = `
  <div class="r3-cv" id="${self._id}-cvcont">
    <canvas id="${self._id}-cv3" class="r3-canvas"></canvas>
    <div class="r3-scan"></div>
    <div class="r3-labels" id="${self._id}-labels"></div>
    <div class="r3-zoom-btns">
      <button class="r3-zoom-btn" onclick="window._r3['${self._id}'].zoomIn()" title="Zoom in">＋</button>
      <button class="r3-zoom-btn" onclick="window._r3['${self._id}'].zoomOut()" title="Zoom out">－</button>
    </div>
    <div class="r3-tip">🖱 Drag to orbit &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Click device to select</div>
    ${v.allowJsonEdit ? `
    <div class="r3-jp" id="${self._id}-jp" style="display:none">
      <div class="r3-jh">// JSON CONFIG <button class="r3-btn" onclick="window._r3['${self._id}'].toggleJson()" style="padding:2px 6px">✕</button></div>
      <textarea class="r3-jta" id="${self._id}-jta" spellcheck="false"></textarea>
      <div class="r3-je" id="${self._id}-je"></div>
      <div class="r3-jf">
        <button class="r3-btn on" onclick="window._r3['${self._id}'].applyJson()">✓ APPLY</button>
        <button class="r3-btn" onclick="window._r3['${self._id}'].exportJson()">↺ EXPORT</button>
      </div>
    </div>` : ''}
  </div>`;

  const view2dHtml = `
  <div class="r3-cv" id="${self._id}-2dcont" style="display:none;flex-direction:column">
    <div class="r3-2d-tb">
      <span style="font-family:'Share Tech Mono',monospace;font-size:10px;opacity:.5;letter-spacing:1px">EXPORT</span>
      <button class="r3-btn" onclick="window._r3['${self._id}']._exportImage('png')">⬇ PNG</button>
      <button class="r3-btn" onclick="window._r3['${self._id}']._exportImage('jpg')">⬇ JPG</button>
      <button class="r3-btn" onclick="window._r3['${self._id}']._exportImage('svg')">⬇ SVG</button>
    </div>
    <div class="r3-2d-wrap" id="${self._id}-2d"></div>
  </div>`;

  const editPanelHtml = sb.showEditPanel && v.allowEdit ? `
  <div class="r3-ep r3-pnl" id="${self._id}-ep" style="display:none">
    <div class="r3-pl" id="${self._id}-elbl" style="margin-bottom:5px">Edit Device</div>
    <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${self._id}-en" oninput="window._r3['${self._id}']._ed('name',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Type</span>
      <select class="r3-inp" id="${self._id}-et" onchange="window._r3['${self._id}']._ed('type',this.value)">
        ${Object.entries(self._types).map(([k,tv])=>`<option value="${k}">${tv.label}</option>`).join('')}
      </select>
    </div>
    <div class="r3-rw"><span class="r3-lbl">Watts</span><input class="r3-inp" type="number" id="${self._id}-ew" oninput="window._r3['${self._id}']._ed('watts',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Height U</span><input class="r3-inp" type="number" min="1" max="12" id="${self._id}-eh" oninput="window._r3['${self._id}']._ed('heightUnits',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Start U</span><input class="r3-inp" type="number" min="1" id="${self._id}-es" oninput="window._r3['${self._id}']._ed('startUnit',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Width</span>
      <select class="r3-inp" id="${self._id}-ehw" onchange="window._r3['${self._id}']._ed('halfWidth',this.value||undefined)">
        <option value="">Full Width</option>
        <option value="left">Half — Left</option>
        <option value="right">Half — Right</option>
      </select>
    </div>
    <div class="r3-rw"><span class="r3-lbl">Color</span><input class="r3-inp" type="color" id="${self._id}-ecolor" style="padding:2px;height:28px" oninput="window._r3['${self._id}']._ed('color',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Front Img</span><input class="r3-inp" id="${self._id}-eimg" placeholder="URL" oninput="window._r3['${self._id}']._ed('imageUrl',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Rear Img</span><input class="r3-inp" id="${self._id}-eimgr" placeholder="URL" oninput="window._r3['${self._id}']._ed('imageUrlRear',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">IP</span><input class="r3-inp" id="${self._id}-eip" oninput="window._r3['${self._id}']._ed('ip',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Status</span><select class="r3-inp" id="${self._id}-estat" onchange="window._r3['${self._id}']._ed('status',this.value||undefined)"><option value="">-</option><option value="up">Up ▲</option><option value="down">Down ▼</option><option value="warn">Warn ⚠</option></select></div>
    <div class="r3-rw" style="flex-direction:column;align-items:stretch;gap:4px">
      <div style="display:flex;align-items:center;justify-content:space-between"><span class="r3-lbl">Custom Fields</span><button class="r3-btn" style="padding:1px 6px;font-size:10px" onclick="window._r3['${self._id}']._addCustomField()">+ Add</button></div>
      <div id="${self._id}-efields"></div>
    </div>
  </div>` : '';

  const rightSidebarHtml = `
  <div class="r3-sb r3-sb-right" id="${self._id}-sbr">
    ${editPanelHtml}
    <div id="${self._id}-cat-edit-wrap"></div>
  </div>`;

  return `${toolbar}<div class="r3-body">${sidebarHtml}${self._mode==='2d'?view2dHtml:canvasHtml}${self._mode==='2d'?canvasHtml:view2dHtml}${rightSidebarHtml}</div>`;
}
