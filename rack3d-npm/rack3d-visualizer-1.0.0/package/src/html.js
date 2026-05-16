// ── HTML ── DOM scaffold builder

function panelHtml(self, id, title, body, opts = {}) {
  const sid = self._id;
  return `<div class="r3-panel${opts.hidden ? ' r3-panel-hidden' : ''}" data-panel-id="${id}">
    <div class="r3-ph" draggable="true"
         ondragstart="window._r3['${sid}']._onPanelDragStart(event,'${id}')"
         ondragend="window._r3['${sid}']._onPanelDragEnd(event)"
         ondragover="window._r3['${sid}']._onPanelDragOverPanel(event,'${id}')"
         ondrop="window._r3['${sid}']._onPanelDropPanel(event,'${id}')">
      <span class="r3-ph-drag">⠿</span>
      <span class="r3-ph-title">${title}</span>
      <button class="r3-ph-btn" title="Collapse" onclick="window._r3['${sid}']._togglePanel('${id}')">▾</button>
    </div>
    <div class="r3-pb" id="${sid}-panel-${id}">${body}</div>
  </div>`;
}

function roomPanelBody(self) {
  const sid = self._id;
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);letter-spacing:1px;text-transform:uppercase">Racks</span>
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addRack()">+ Rack</button>
  </div>
  <div id="${sid}-rack-list"></div>`;
}

function envPanelBody(self) {
  const sid = self._id;
  const ro = self._opts.room;
  const lo = self._opts.lighting;
  const rng = (field, label, val, min, max, step, ns, unit) => {
    const fn = ns === 'l' ? '_setLight' : '_setRoom';
    const vid = `${sid}-env-v-${ns}-${field}`;
    return `<div class="r3-env-row">
      <span class="r3-lbl">${label}</span>
      <input class="r3-range" type="range" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="window._r3['${sid}'].${fn}('${field}',+this.value);document.getElementById('${vid}').textContent=this.value+'${unit||''}'">
      <span class="r3-val" id="${vid}">${val}${unit || ''}</span>
    </div>`;
  };

  return `
  <div class="r3-env-sec">Room</div>
  ${rng('width','Width',ro.width,10,60,1,'r','m')}
  ${rng('depth','Depth',ro.depth,10,60,1,'r','m')}
  ${rng('height','Height',ro.height,6,20,1,'r','m')}
  ${rng('fogNear','Fog Near',ro.fogNear,5,40,1,'r','')}
  ${rng('fogFar','Fog Far',ro.fogFar,20,120,5,'r','')}
  <div class="r3-env-toggles">
    <label class="r3-sw-label"><span class="r3-lbl">Floor Tiles</span>
      <label class="r3-sw"><input type="checkbox" ${ro.floorTiles?'checked':''} onchange="window._r3['${sid}']._setRoom('floorTiles',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
    <label class="r3-sw-label"><span class="r3-lbl">Ceil Grid</span>
      <label class="r3-sw"><input type="checkbox" ${ro.ceilingGrid?'checked':''} onchange="window._r3['${sid}']._setRoom('ceilingGrid',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
    <label class="r3-sw-label"><span class="r3-lbl">Strip Lights</span>
      <label class="r3-sw"><input type="checkbox" ${ro.stripLights?'checked':''} onchange="window._r3['${sid}']._setRoom('stripLights',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
    <label class="r3-sw-label"><span class="r3-lbl">Baseboard</span>
      <label class="r3-sw"><input type="checkbox" ${ro.baseboardLights?'checked':''} onchange="window._r3['${sid}']._setRoom('baseboardLights',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
    <label class="r3-sw-label"><span class="r3-lbl">Exit Sign</span>
      <label class="r3-sw"><input type="checkbox" ${ro.exitSign?'checked':''} onchange="window._r3['${sid}']._setRoom('exitSign',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
    <label class="r3-sw-label"><span class="r3-lbl">Cable Trays</span>
      <label class="r3-sw"><input type="checkbox" ${ro.cableTrays?'checked':''} onchange="window._r3['${sid}']._setRoom('cableTrays',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
    </label>
  </div>
  <div class="r3-env-sec">Lighting</div>
  ${rng('ambientIntensity','Ambient',lo.ambientIntensity,0,20,0.5,'l','')}
  ${rng('overheadCount','Overheads',lo.overheadCount,2,12,1,'l','')}
  ${rng('overheadIntensity','OH Intens.',lo.overheadIntensity,0,20,0.5,'l','')}
  ${rng('fillIntensity','Fill',lo.fillIntensity,0,12,0.5,'l','')}
  ${rng('rackGlowIntensity','Rack Glow',lo.rackGlowIntensity,0,12,0.5,'l','')}
  ${rng('floorGlowIntensity','Floor Glow',lo.floorGlowIntensity,0,10,0.5,'l','')}
  ${rng('exposure','Exposure',lo.exposure,0.5,5,0.1,'l','')}
  <label class="r3-sw-label" style="margin-top:4px"><span class="r3-lbl">Shadows</span>
    <label class="r3-sw"><input type="checkbox" ${lo.shadows?'checked':''} onchange="window._r3['${sid}']._setLight('shadows',this.checked)"><span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label>
  </label>`;
}

function rackPropsPanelBody(self) {
  const sid = self._id;
  return `<div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${sid}-rn" oninput="window._r3['${sid}']._onRackName(this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Units</span><input class="r3-inp" type="number" id="${sid}-ru" min="4" max="48" style="width:55px" oninput="window._r3['${sid}']._onRackUnits(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Width(m)</span><input class="r3-inp" type="number" id="${sid}-rwidth" min="2" max="12" step="0.1" style="width:65px" oninput="window._r3['${sid}']._onRackWidth(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Pos X</span><input class="r3-inp" type="number" id="${sid}-rposX" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('x',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Pos Z</span><input class="r3-inp" type="number" id="${sid}-rposZ" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('z',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Angle°</span><input class="r3-inp" type="number" id="${sid}-rangle" min="-180" max="180" step="5" style="width:65px" oninput="window._r3['${sid}']._onRackAngle(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Temp°C</span><input class="r3-inp" type="number" id="${sid}-rtemp" oninput="window._r3['${sid}']._onRackProp('rackTemp',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">PDU Cap</span><input class="r3-inp" type="number" id="${sid}-rpduCap" oninput="window._r3['${sid}']._onRackProp('pduCapacity',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">PDU Load</span><input class="r3-inp" type="number" id="${sid}-rpduLoad" oninput="window._r3['${sid}']._onRackProp('pduLoad',+this.value)"></div>
  <div style="margin-top:6px;font-size:10px;color:var(--r3-dim);font-family:'Share Tech Mono',monospace">
    ⟳ Drag rack in 3D view to reposition
  </div>`;
}

function statsPanelBody(self) {
  const sid = self._id;
  return `<div class="r3-stat">
    <div class="r3-sv" id="${sid}-sw">—</div>
    <div class="r3-sl">PDU Load / Capacity</div>
    <div class="r3-sbar"><div class="r3-sfill" id="${sid}-sfW"></div></div>
  </div>
  <div class="r3-stat">
    <div class="r3-sv" id="${sid}-st">—</div>
    <div class="r3-sl">Rack Intake Temperature</div>
    <div class="r3-sbar"><div class="r3-sfill" id="${sid}-sfT"></div></div>
  </div>`;
}

function devicesPanelBody(self) {
  const sid = self._id;
  return `<div id="${sid}-dl"></div>
  <div style="display:flex;gap:4px;margin-top:6px;border-top:1px solid var(--r3-border);padding-top:6px">
    <button class="r3-btn" style="flex:1" onclick="window._r3['${sid}'].resetRack()" title="Reset rack to empty">↺ Reset</button>
    <button class="r3-btn" id="${sid}-btnCopy" style="flex:1" onclick="window._r3['${sid}'].copyJson()" title="Copy JSON to clipboard">⎘ Copy</button>
  </div>`;
}

function editDevicePanelBody(self) {
  const sid = self._id;
  return `<div class="r3-pl" id="${sid}-elbl" style="margin-bottom:5px">Edit Device</div>
  <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${sid}-en" oninput="window._r3['${sid}']._ed('name',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Type</span>
    <select class="r3-inp" id="${sid}-et" onchange="window._r3['${sid}']._ed('type',this.value)">
      ${Object.entries(self._types).map(([k,tv])=>`<option value="${k}">${tv.label}</option>`).join('')}
    </select>
  </div>
  <div class="r3-rw"><span class="r3-lbl">Watts</span><input class="r3-inp" type="number" id="${sid}-ew" oninput="window._r3['${sid}']._ed('watts',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Height U</span><input class="r3-inp" type="number" min="1" max="12" id="${sid}-eh" oninput="window._r3['${sid}']._ed('heightUnits',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Start U</span><input class="r3-inp" type="number" min="1" id="${sid}-es" oninput="window._r3['${sid}']._ed('startUnit',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Width</span>
    <select class="r3-inp" id="${sid}-ehw" onchange="window._r3['${sid}']._ed('halfWidth',this.value||undefined)">
      <option value="">Full Width</option>
      <option value="left">Half — Left</option>
      <option value="right">Half — Right</option>
    </select>
  </div>
  <div class="r3-rw"><span class="r3-lbl">Color</span><input class="r3-inp" type="color" id="${sid}-ecolor" style="padding:2px;height:28px" oninput="window._r3['${sid}']._ed('color',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Front Img</span><input class="r3-inp" id="${sid}-eimg" placeholder="URL" oninput="window._r3['${sid}']._ed('imageUrl',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Rear Img</span><input class="r3-inp" id="${sid}-eimgr" placeholder="URL" oninput="window._r3['${sid}']._ed('imageUrlRear',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">IP</span><input class="r3-inp" id="${sid}-eip" oninput="window._r3['${sid}']._ed('ip',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Status</span><select class="r3-inp" id="${sid}-estat" onchange="window._r3['${sid}']._ed('status',this.value||undefined)"><option value="">-</option><option value="up">Up ▲</option><option value="down">Down ▼</option><option value="warn">Warn ⚠</option></select></div>
  <div class="r3-rw" style="flex-direction:column;align-items:stretch;gap:4px">
    <div style="display:flex;align-items:center;justify-content:space-between"><span class="r3-lbl">Custom Fields</span><button class="r3-btn" style="padding:1px 6px;font-size:10px" onclick="window._r3['${sid}']._addCustomField()">+ Add</button></div>
    <div id="${sid}-efields"></div>
  </div>`;
}

function catalogPanelBody(self) {
  const sid = self._id;
  const sb = self._opts.sidebar;
  return `<div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-tab-cat" onclick="window._r3['${sid}']._switchTab('cat')">Catalog</button>
    ${sb.showUnitMap ? `<button class="r3-tab" id="${sid}-tab-um" onclick="window._r3['${sid}']._switchTab('um')">Unit Map</button>` : ''}
    <div style="flex:1"></div>
    <button class="r3-btn" id="${sid}-tab-cat-add" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addCatalogItem()">+ New</button>
  </div>
  <div id="${sid}-tab-body-cat">
    <div id="${sid}-cat" class="r3-cat-list"></div>
  </div>
  ${sb.showUnitMap ? `<div id="${sid}-tab-body-um" style="display:none"><div class="r3-um" id="${sid}-um"></div></div>` : ''}`;
}

export function buildHTML(self) {
  const o  = self._opts;
  const sb = o.sidebar;
  const v  = o.view;
  const sid = self._id;

  const toolbar = !v.showToolbar ? '' : `
  <div class="r3-hdr">
    <span class="r3-logo">RACK<span>3D</span></span>
    <div class="r3-sep"></div>
    <span class="r3-badge" id="${sid}-bn" style="color:#79c0ff;border-color:#378ADD55;background:#378ADD11">—</span>
    <span class="r3-badge" id="${sid}-bu" style="color:#3fb950;border-color:#1D9E7555;background:#1D9E7511">—</span>
    <span class="r3-badge" id="${sid}-bt" style="color:#e3b341;border-color:#ffaa0055;background:#ffaa0011">—</span>
    <span class="r3-badge" id="${sid}-bw" style="color:#cc88ff;border-color:#cc88ff55;background:#cc88ff11">—</span>
    <div class="r3-spacer"></div>
    ${self._mode!=='2d'?`<button class="r3-btn on" id="${sid}-btnL" onclick="window._r3['${sid}'].toggleLabels()">◈ LABELS</button>`:''}
    <button class="r3-btn" id="${sid}-btnW" onclick="window._r3['${sid}'].toggleWire()">◻ WIRE</button>
    <button class="r3-btn" id="${sid}-btnCam" onclick="window._r3['${sid}'].toggleCameraMode()" title="Toggle FPS / Orbit camera">${self._ctrl?.mode==='fps'?'⊹ FPS':'⊕ ORBIT'}</button>
    <button class="r3-btn" id="${sid}-btn2d" onclick="window._r3['${sid}'].toggleMode()">⊞ ${self._mode==='2d'?'3D':'2D'}</button>
    ${v.allowJsonEdit?`<button class="r3-btn" id="${sid}-btnJ" onclick="window._r3['${sid}'].toggleJson()">{ } JSON</button>`:''}
  </div>`;

  const sidebarHtml = !sb.enabled ? '' : `
  <div class="r3-sb" id="${sid}-sb"
       ondragover="event.preventDefault()"
       ondrop="window._r3['${sid}']._onPanelDropSidebar(event,'left')">
    ${panelHtml(self, 'room', 'Room', roomPanelBody(self))}
    ${panelHtml(self, 'env', 'Environment', envPanelBody(self))}
    ${panelHtml(self, 'catalog', 'Catalog', catalogPanelBody(self))}
  </div>`;

  const canvasHtml = `
  <div class="r3-cv" id="${sid}-cvcont">
    <canvas id="${sid}-cv3" class="r3-canvas"></canvas>
    <div class="r3-scan"></div>
    <div class="r3-labels" id="${sid}-labels"></div>
    <div class="r3-zoom-btns">
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomIn()" title="Zoom in">＋</button>
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomOut()" title="Zoom out">－</button>
    </div>
    <div class="r3-legend-overlay">
      <button class="r3-legend-toggle-btn" onclick="window._r3['${sid}']._toggleLegend()">⬡ Types</button>
      <div class="r3-legend-body" id="${sid}-legend" style="display:none"></div>
    </div>
    <div class="r3-tip" id="${sid}-tip">${self._ctrl?.mode==='fps' ? '🖱 Drag to look · WASD walk · Click ⊹FPS button to lock mouse' : '🖱 Drag to orbit · Scroll to zoom · Click to select · Drag selected rack to move'}</div>
    ${v.allowJsonEdit ? `
    <div class="r3-jp" id="${sid}-jp" style="display:none">
      <div class="r3-jh">// JSON CONFIG <button class="r3-btn" onclick="window._r3['${sid}'].toggleJson()" style="padding:2px 6px">✕</button></div>
      <textarea class="r3-jta" id="${sid}-jta" spellcheck="false"></textarea>
      <div class="r3-je" id="${sid}-je"></div>
      <div class="r3-jf">
        <button class="r3-btn on" onclick="window._r3['${sid}'].applyJson()">✓ APPLY</button>
        <button class="r3-btn" onclick="window._r3['${sid}'].exportJson()">↺ EXPORT</button>
      </div>
    </div>` : ''}
  </div>`;

  const view2dHtml = `
  <div class="r3-cv" id="${sid}-2dcont" style="display:none;flex-direction:column">
    <div class="r3-2d-tb">
      <span style="font-family:'Share Tech Mono',monospace;font-size:10px;opacity:.5;letter-spacing:1px">EXPORT</span>
      <button class="r3-btn" onclick="window._r3['${sid}']._exportImage('png')">⬇ PNG</button>
      <button class="r3-btn" onclick="window._r3['${sid}']._exportImage('jpg')">⬇ JPG</button>
      <button class="r3-btn" onclick="window._r3['${sid}']._exportImage('svg')">⬇ SVG</button>
    </div>
    <div class="r3-2d-wrap" id="${sid}-2d"></div>
  </div>`;

  const rightSidebarHtml = !sb.enabled ? '' : `
  <div class="r3-sb r3-sb-right" id="${sid}-sbr"
       ondragover="event.preventDefault()"
       ondrop="window._r3['${sid}']._onPanelDropSidebar(event,'right')">
    ${panelHtml(self, 'rackProps', 'Rack Properties', rackPropsPanelBody(self))}
    ${panelHtml(self, 'stats', 'Statistics', statsPanelBody(self))}
    ${panelHtml(self, 'devices', 'Devices', devicesPanelBody(self))}
    ${sb.showEditPanel && v.allowEdit ? panelHtml(self, 'editDevice', 'Edit Device', editDevicePanelBody(self), { hidden: true }) : ''}
    <div id="${sid}-cat-edit-wrap"></div>
  </div>`;

  return `${toolbar}<div class="r3-body">${sidebarHtml}${self._mode==='2d'?view2dHtml:canvasHtml}${self._mode==='2d'?canvasHtml:view2dHtml}${rightSidebarHtml}</div>`;
}
