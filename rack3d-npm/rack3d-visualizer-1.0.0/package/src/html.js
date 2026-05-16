// ── HTML ── DOM scaffold builder

// ── Panel wrapper ────────────────────────────────────────────
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

// ── Window / door row helpers ─────────────────────────────────
function windowRow(sid, w, i) {
  const walls = ['front','back','left','right'];
  return `<div class="r3-cl-row">
    <select class="r3-inp r3-inp-xs" style="width:62px" onchange="window._r3['${sid}']._editWindow(${i},'wall',this.value)">
      ${walls.map(t=>`<option value="${t}"${w.wall===t?' selected':''}>${t}</option>`).join('')}
    </select>
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${w.x??0}" title="X pos" style="width:38px" oninput="window._r3['${sid}']._editWindow(${i},'x',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${w.y??1.5}" title="Y pos" style="width:38px" oninput="window._r3['${sid}']._editWindow(${i},'y',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${w.width??2}" title="Width" style="width:38px" oninput="window._r3['${sid}']._editWindow(${i},'width',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${w.height??1.5}" title="Height" style="width:38px" oninput="window._r3['${sid}']._editWindow(${i},'height',+this.value)">
    <button class="r3-ph-btn" style="font-size:13px" onclick="window._r3['${sid}']._removeWindow(${i})">×</button>
  </div>`;
}

function doorRow(sid, d, i) {
  const walls = ['front','back','left','right'];
  return `<div class="r3-cl-row">
    <select class="r3-inp r3-inp-xs" style="width:62px" onchange="window._r3['${sid}']._editDoor(${i},'wall',this.value)">
      ${walls.map(t=>`<option value="${t}"${d.wall===t?' selected':''}>${t}</option>`).join('')}
    </select>
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${d.x??0}" title="X pos" style="width:38px" oninput="window._r3['${sid}']._editDoor(${i},'x',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${d.width??1.2}" title="Width" style="width:38px" oninput="window._r3['${sid}']._editDoor(${i},'width',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${d.height??2.5}" title="Height" style="width:38px" oninput="window._r3['${sid}']._editDoor(${i},'height',+this.value)">
    <button class="r3-ph-btn" style="font-size:13px" onclick="window._r3['${sid}']._removeDoor(${i})">×</button>
  </div>`;
}

// ── Panel body builders ───────────────────────────────────────
function roomPanelBody(self) {
  const sid = self._id;
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
    <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);letter-spacing:1px;text-transform:uppercase">Racks</span>
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addRack()">+ Rack</button>
  </div>
  <div id="${sid}-rack-list"></div>`;
}

function customLightRow(sid, cl, i) {
  const types = ['point','directional','spot','ceiling'];
  return `<div class="r3-cl-row" id="${sid}-cl-${i}">
    <select class="r3-inp r3-inp-xs" style="width:72px" onchange="window._r3['${sid}']._editCustomLight(${i},'type',this.value)">
      ${types.map(t => `<option value="${t}"${cl.type===t?' selected':''}>${t}</option>`).join('')}
    </select>
    <input class="r3-inp r3-inp-xs" type="number" step="1" value="${cl.x??0}" title="X" style="width:34px" oninput="window._r3['${sid}']._editCustomLight(${i},'x',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="1" value="${cl.y??8}" title="Y" style="width:34px" oninput="window._r3['${sid}']._editCustomLight(${i},'y',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" step="1" value="${cl.z??0}" title="Z" style="width:34px" oninput="window._r3['${sid}']._editCustomLight(${i},'z',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" min="0" max="30" step="0.5" value="${cl.intensity??5}" title="Intensity" style="width:34px" oninput="window._r3['${sid}']._editCustomLight(${i},'intensity',+this.value)">
    <input class="r3-inp r3-inp-xs" type="number" min="0" step="1" value="${cl.distance??0}" title="Distance (0=∞)" style="width:34px" oninput="window._r3['${sid}']._editCustomLight(${i},'distance',+this.value)">
    <input type="color" value="${typeof cl.color==='string'?cl.color:'#ffffff'}" title="Color" class="r3-color-pick" oninput="window._r3['${sid}']._editCustomLight(${i},'color',this.value)">
    <button class="r3-ph-btn" style="font-size:13px" onclick="window._r3['${sid}']._removeCustomLight(${i})">×</button>
  </div>`;
}

function envPanelBody(self) {
  const sid = self._id;
  const ro  = self._opts.room;
  const lo  = self._opts.lighting;
  const rf  = self._opts.sidebar.roomFields;    // null = all
  const lf  = self._opts.sidebar.lightingFields; // null = all

  const showR = f => !rf || rf.includes(f);
  const showL = f => !lf || lf.includes(f);

  const numR = (f, label, val, min, max, step, unit) => !showR(f) ? '' :
    `<div class="r3-env-row">
      <span class="r3-lbl">${label}</span>
      <input class="r3-inp r3-env-num" type="number" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="window._r3['${sid}']._setRoom('${f}',Math.max(${min},Math.min(${max},+this.value)))">
      <span class="r3-val">${unit}</span>
    </div>`;

  const rngR = (f, label, val, min, max, step, unit) => !showR(f) ? '' :
    `<div class="r3-env-row"><span class="r3-lbl">${label}</span>
      <input class="r3-range" type="range" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="window._r3['${sid}']._setRoom('${f}',+this.value);document.getElementById('${sid}-ev-r-${f}').textContent=this.value+'${unit}'">
      <span class="r3-val" id="${sid}-ev-r-${f}">${val}${unit}</span>
    </div>`;

  const rngL = (f, label, val, min, max, step, unit) => !showL(f) ? '' :
    `<div class="r3-env-row"><span class="r3-lbl">${label}</span>
      <input class="r3-range" type="range" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="window._r3['${sid}']._setLight('${f}',+this.value);document.getElementById('${sid}-ev-l-${f}').textContent=this.value+'${unit}'">
      <span class="r3-val" id="${sid}-ev-l-${f}">${val}${unit}</span>
    </div>`;

  const togR = (f, label, val) => !showR(f) ? '' :
    `<label class="r3-sw-label"><span class="r3-lbl">${label}</span>
      <label class="r3-sw"><input type="checkbox"${val?' checked':''} onchange="window._r3['${sid}']._setRoom('${f}',this.checked)">
        <span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label></label>`;

  const togL = (f, label, val) => !showL(f) ? '' :
    `<label class="r3-sw-label"><span class="r3-lbl">${label}</span>
      <label class="r3-sw"><input type="checkbox"${val?' checked':''} onchange="window._r3['${sid}']._setLight('${f}',this.checked)">
        <span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label></label>`;

  const roomFields = ['width','depth','height','fogNear','fogFar','floorTiles','ceilingGrid','stripLights','baseboardLights','exitSign','cableTrays'];
  const lightFields = ['ambientIntensity','overheadCount','overheadIntensity','fillIntensity','rackGlowIntensity','floorGlowIntensity','exposure','shadows'];
  const hasRF = roomFields.some(f => showR(f));
  const hasLF = lightFields.some(f => showL(f));
  const showCL = !lf || lf.includes('customLights');

  const toggleRows = [
    togR('floorTiles','Floor Tiles',ro.floorTiles),
    togR('ceilingGrid','Ceil Grid',ro.ceilingGrid),
    togR('stripLights','Strip Lights',ro.stripLights),
    togR('baseboardLights','Baseboard',ro.baseboardLights),
    togR('exitSign','Exit Sign',ro.exitSign),
    togR('cableTrays','Cable Trays',ro.cableTrays),
  ].filter(Boolean).join('');

  return `
  ${hasRF ? '<div class="r3-env-sec">Room</div>' : ''}
  ${numR('width','Width',ro.width,10,60,1,'m')}
  ${numR('depth','Depth',ro.depth,10,60,1,'m')}
  ${rngR('height','Height',ro.height,6,20,1,'m')}
  ${rngR('fogNear','Fog Near',ro.fogNear,5,40,1,'')}
  ${rngR('fogFar','Fog Far',ro.fogFar,20,120,5,'')}
  ${toggleRows ? `<div class="r3-env-toggles">${toggleRows}</div>` : ''}
  ${hasLF || showCL ? '<div class="r3-env-sec">Lighting</div>' : ''}
  ${rngL('ambientIntensity','Ambient',lo.ambientIntensity,0,20,0.5,'')}
  ${rngL('overheadCount','Overheads',lo.overheadCount,2,12,1,'')}
  ${rngL('overheadIntensity','OH Intens.',lo.overheadIntensity,0,20,0.5,'')}
  ${rngL('fillIntensity','Fill',lo.fillIntensity,0,12,0.5,'')}
  ${rngL('rackGlowIntensity','Rack Glow',lo.rackGlowIntensity,0,12,0.5,'')}
  ${rngL('floorGlowIntensity','Floor Glow',lo.floorGlowIntensity,0,10,0.5,'')}
  ${rngL('exposure','Exposure',lo.exposure,0.5,5,0.1,'')}
  ${togL('shadows','Shadows',lo.shadows)}
  ${showCL ? `
  <div class="r3-env-sec" style="display:flex;align-items:center;justify-content:space-between">
    <span>Custom Lights</span>
    <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addCustomLight()">+ Add</button>
  </div>
  <div class="r3-cl-labels"><span>Type</span><span>X</span><span>Y</span><span>Z</span><span>Int</span><span>Dst</span><span>Col</span></div>
  <div id="${sid}-custom-lights">${(lo.customLights||[]).map((cl,i) => customLightRow(sid,cl,i)).join('')}</div>` : ''}
  <div class="r3-env-sec" style="display:flex;align-items:center;justify-content:space-between">
    <span>Windows</span>
    <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addWindow()">+ Add</button>
  </div>
  <div class="r3-cl-labels"><span>Wall</span><span>X</span><span>Y</span><span>W</span><span>H</span></div>
  <div id="${sid}-windows">${(ro.windows||[]).map((w,i) => windowRow(sid,w,i)).join('')}</div>
  <div class="r3-env-sec" style="display:flex;align-items:center;justify-content:space-between">
    <span>Doors</span>
    <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addDoor()">+ Add</button>
  </div>
  <div class="r3-cl-labels"><span>Wall</span><span>X</span><span>W</span><span>H</span></div>
  <div id="${sid}-doors">${(ro.doors||[]).map((d,i) => doorRow(sid,d,i)).join('')}</div>`;
}

function rackPropsPanelBody(self) {
  const sid = self._id;
  const ro  = self._opts.rack;
  return `<div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${sid}-rn" oninput="window._r3['${sid}']._onRackName(this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Units</span><input class="r3-inp" type="number" id="${sid}-ru" min="4" max="48" style="width:55px" oninput="window._r3['${sid}']._onRackUnits(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Width(m)</span><input class="r3-inp" type="number" id="${sid}-rwidth" min="2" max="12" step="0.1" style="width:65px" oninput="window._r3['${sid}']._onRackWidth(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Pos X</span><input class="r3-inp" type="number" id="${sid}-rposX" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('x',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Pos Y</span><input class="r3-inp" type="number" id="${sid}-rposY" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('y',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Pos Z</span><input class="r3-inp" type="number" id="${sid}-rposZ" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('z',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Angle°</span><input class="r3-inp" type="number" id="${sid}-rangle" min="-180" max="180" step="5" style="width:65px" oninput="window._r3['${sid}']._onRackAngle(+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Temp°C</span><input class="r3-inp" type="number" id="${sid}-rtemp" oninput="window._r3['${sid}']._onRackProp('rackTemp',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">PDU Cap</span><input class="r3-inp" type="number" id="${sid}-rpduCap" oninput="window._r3['${sid}']._onRackProp('pduCapacity',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">PDU Load</span><input class="r3-inp" type="number" id="${sid}-rpduLoad" oninput="window._r3['${sid}']._onRackProp('pduLoad',+this.value)"></div>
  <div style="margin-top:6px;font-size:10px;color:var(--r3-dim);font-family:'Share Tech Mono',monospace">⟳ Drag rack in 3D to reposition</div>
  <div class="r3-env-sec">Nameplate</div>
  <div class="r3-rw"><span class="r3-lbl">Scale</span><input class="r3-inp" type="number" min="0.1" max="5" step="0.1" value="${ro.nameplateScale??1}" style="width:65px" oninput="window._r3['${sid}']._setRackOpt('nameplateScale',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Y Offset</span><input class="r3-inp" type="number" step="0.1" value="${ro.nameplateYOffset??0.2}" style="width:65px" oninput="window._r3['${sid}']._setRackOpt('nameplateYOffset',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Opacity</span><input class="r3-range" type="range" min="0" max="1" step="0.05" value="${ro.nameplateOpacity??1}" style="flex:1" oninput="window._r3['${sid}']._setRackOpt('nameplateOpacity',+this.value)"></div>`;
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
    <button class="r3-btn" style="flex:1" onclick="window._r3['${sid}'].resetRack()">↺ Reset</button>
    <button class="r3-btn" id="${sid}-btnCopy" style="flex:1" onclick="window._r3['${sid}'].copyJson()">⎘ Copy</button>
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
      <option value="">Full Width</option><option value="left">Half — Left</option><option value="right">Half — Right</option>
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
  <div id="${sid}-tab-body-cat"><div id="${sid}-cat" class="r3-cat-list"></div></div>
  ${sb.showUnitMap ? `<div id="${sid}-tab-body-um" style="display:none"><div class="r3-um" id="${sid}-um"></div></div>` : ''}`;
}

// ── Main HTML builder ─────────────────────────────────────────
export function buildHTML(self) {
  const o   = self._opts;
  const sb  = o.sidebar;
  const v   = o.view;
  const sid = self._id;
  const lW  = sb.leftWidth  || 248;
  const rW  = sb.rightWidth || 260;
  const showL = sb.showLeft  !== false;
  const showR = sb.showRight !== false;

  const toolbar = !v.showToolbar ? '' : `
  <div class="r3-hdr">
    <span class="r3-logo">RACK<span>3D</span></span>
    <div class="r3-sep"></div>
    ${sb.enabled ? `
    <button class="r3-sb-toggle${showL?' on':''}" id="${sid}-btnSbL" onclick="window._r3['${sid}']._toggleSidebarLeft()" title="Toggle left panel">◧</button>
    <button class="r3-sb-toggle${showR?' on':''}" id="${sid}-btnSbR" onclick="window._r3['${sid}']._toggleSidebarRight()" title="Toggle right panel">◨</button>
    <div class="r3-sep"></div>` : ''}
    <span class="r3-badge" id="${sid}-bn" style="color:#79c0ff;border-color:#378ADD55;background:#378ADD11">—</span>
    <span class="r3-badge" id="${sid}-bu" style="color:#3fb950;border-color:#1D9E7555;background:#1D9E7511">—</span>
    <span class="r3-badge" id="${sid}-bt" style="color:#e3b341;border-color:#ffaa0055;background:#ffaa0011">—</span>
    <span class="r3-badge" id="${sid}-bw" style="color:#cc88ff;border-color:#cc88ff55;background:#cc88ff11">—</span>
    <div class="r3-spacer"></div>
    ${self._mode!=='2d'?`<button class="r3-btn on" id="${sid}-btnL" onclick="window._r3['${sid}'].toggleLabels()">◈ LABELS</button>`:''}
    <button class="r3-btn" id="${sid}-btnW" onclick="window._r3['${sid}'].toggleWire()">◻ WIRE</button>
    <button class="r3-btn" id="${sid}-btnCam" onclick="window._r3['${sid}'].toggleCameraMode()">${self._ctrl?.mode==='fps'?'⊹ FPS':'⊕ ORBIT'}</button>
    <button class="r3-btn" id="${sid}-btn2d" onclick="window._r3['${sid}'].toggleMode()">⊞ ${self._mode==='2d'?'3D':'2D'}</button>
    ${v.allowJsonEdit?`<button class="r3-btn" id="${sid}-btnJ" onclick="window._r3['${sid}'].toggleJson()">{ } JSON</button>`:''}
  </div>`;

  const sidebarHtml = !sb.enabled ? '' : `
  <div class="r3-sb" id="${sid}-sb" style="width:${lW}px;min-width:${lW}px;display:${showL?'flex':'none'}"
       ondragover="event.preventDefault()"
       ondrop="window._r3['${sid}']._onPanelDropSidebar(event,'left')">
    ${panelHtml(self,'room','Room',roomPanelBody(self))}
    ${panelHtml(self,'env','Environment',envPanelBody(self))}
    ${panelHtml(self,'catalog','Catalog',catalogPanelBody(self))}
  </div>`;

  const canvasHtml = `
  <div class="r3-cv" id="${sid}-cvcont">
    <canvas id="${sid}-cv3" class="r3-canvas"></canvas>
    <div class="r3-scan"></div>
    <div class="r3-labels" id="${sid}-labels"></div>
    <div class="r3-zoom-btns">
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomIn()">＋</button>
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomOut()">－</button>
    </div>
    <div class="r3-legend-overlay">
      <button class="r3-legend-toggle-btn" onclick="window._r3['${sid}']._toggleLegend()">⬡ Types</button>
      <div class="r3-legend-body" id="${sid}-legend" style="display:none"></div>
    </div>
    <div class="r3-tip" id="${sid}-tip">${self._ctrl?.mode==='fps'?'🖱 Drag to look · WASD walk · Click ⊹FPS button to lock mouse':'🖱 Drag to orbit · Scroll to zoom · Click to select · Drag selected rack to move'}</div>
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
  <div class="r3-sb r3-sb-right" id="${sid}-sbr" style="width:${rW}px;min-width:${rW}px;display:${showR?'flex':'none'}"
       ondragover="event.preventDefault()"
       ondrop="window._r3['${sid}']._onPanelDropSidebar(event,'right')">
    ${panelHtml(self,'rackProps','Rack Properties',rackPropsPanelBody(self))}
    ${panelHtml(self,'stats','Statistics',statsPanelBody(self))}
    ${panelHtml(self,'devices','Devices',devicesPanelBody(self))}
    ${sb.showEditPanel && v.allowEdit ? panelHtml(self,'editDevice','Edit Device',editDevicePanelBody(self),{hidden:true}) : ''}
    <div id="${sid}-cat-edit-wrap"></div>
  </div>`;

  const leftHandleHtml  = !sb.enabled ? '' : `<div class="r3-sb-handle"  id="${sid}-sb-handle"  style="display:${showL?'flex':'none'}"></div>`;
  const rightHandleHtml = !sb.enabled ? '' : `<div class="r3-sb-handle r3-sbr-handle" id="${sid}-sbr-handle" style="display:${showR?'flex':'none'}"></div>`;

  return `${toolbar}<div class="r3-body">${sidebarHtml}${leftHandleHtml}${self._mode==='2d'?view2dHtml:canvasHtml}${self._mode==='2d'?canvasHtml:view2dHtml}${rightHandleHtml}${rightSidebarHtml}</div>`;
}

// Exported for dynamic re-render
export { customLightRow, windowRow, doorRow };
