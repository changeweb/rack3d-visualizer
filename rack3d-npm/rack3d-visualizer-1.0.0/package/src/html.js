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

// ── Room item row helper ──────────────────────────────────────
function roomItemRow(sid, item, i) {
  const types = ['ups','battery','shelf','pdu','aircon','sensor'];
  const typeIcons = { ups:'⚡', battery:'🔋', shelf:'📦', pdu:'🔌', aircon:'❄', sensor:'📡' };
  const defSize = { ups:[3.0,8.0,1.8], battery:[3.6,2.5,2.0], shelf:[5.0,5.0,1.2], pdu:[0.5,10.0,0.4], aircon:[4.0,10.0,2.0], sensor:[0.4,2.2,0.4] };
  const [dW,dH,dD] = defSize[item.type] ?? [2,4,1.5];
  return `<div style="border:1px solid var(--r3-border,#1a2a3f);border-radius:4px;padding:5px;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px">
      <select class="r3-inp r3-inp-xs" style="width:80px" onchange="window._r3['${sid}']._editRoomItem(${i},'type',this.value)">
        ${types.map(t=>`<option value="${t}"${item.type===t?' selected':''}>${typeIcons[t]??''} ${t}</option>`).join('')}
      </select>
      <input class="r3-inp r3-inp-xs" value="${item.name??''}" placeholder="Name" style="flex:1;min-width:60px" oninput="window._r3['${sid}']._editRoomItem(${i},'name',this.value)">
      <input type="color" value="${item.color??'#2a3a50'}" class="r3-color-pick" title="Color" oninput="window._r3['${sid}']._editRoomItem(${i},'color',this.value)">
      <button class="r3-ph-btn" style="font-size:13px;margin-left:auto" onclick="window._r3['${sid}']._removeRoomItem(${i})">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px">
      <input class="r3-inp r3-inp-xs" value="${item.label??''}" placeholder="Label" style="flex:1;min-width:80px" oninput="window._r3['${sid}']._editRoomItem(${i},'label',this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Pos</span>
      <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${item.x??0}" title="X pos" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'x',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${item.y??0}" title="Y pos" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'y',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="0.5" value="${item.z??0}" title="Z pos" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'z',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="5" value="${item.angle??0}" title="Angle°" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'angle',+this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-top:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Size</span>
      <input class="r3-inp r3-inp-xs" type="number" step="0.1" value="${item.width??dW}" title="Width" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'width',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="0.1" value="${item.height??dH}" title="Height" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'height',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="0.1" value="${item.depth??dD}" title="Depth" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'depth',+this.value)">
      ${item.type==='shelf' ? `<input class="r3-inp r3-inp-xs" type="number" min="1" max="10" value="${item.layers??3}" title="Layers" style="width:40px" oninput="window._r3['${sid}']._editRoomItem(${i},'layers',+this.value)">` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-top:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:40px">Plate</span>
      <select class="r3-inp r3-inp-xs" style="width:70px" onchange="window._r3['${sid}']._editRoomItem(${i},'nameplateShape',this.value)">
        <option value="rounded"${(item.nameplateShape??'rounded')==='rounded'?' selected':''}>Rounded</option>
        <option value="rect"${item.nameplateShape==='rect'?' selected':''}>Rect</option>
        <option value="pill"${item.nameplateShape==='pill'?' selected':''}>Pill</option>
      </select>
      <input type="color" value="${item.nameplateColor??'#081020'}" class="r3-color-pick" title="Nameplate BG" oninput="window._r3['${sid}']._editRoomItem(${i},'nameplateColor',this.value)">
      <input type="color" value="${item.nameplateTextColor??'#88ccff'}" class="r3-color-pick" title="Nameplate Text" oninput="window._r3['${sid}']._editRoomItem(${i},'nameplateTextColor',this.value)">
    </div>
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

  const roomFields = ['width','depth','height','fogNear','fogFar','floorTiles','ceilingGrid','stripLights','baseboardLights','wallColor'];
  const lightFields = ['ambientIntensity','overheadCount','overheadIntensity','fillIntensity','rackGlowIntensity','floorGlowIntensity','exposure','shadows'];
  const hasRF = roomFields.some(f => showR(f));
  const hasLF = lightFields.some(f => showL(f));
  const showCL = !lf || lf.includes('customLights');

  const toggleRows = [
    togR('floorTiles','Floor Tiles',ro.floorTiles),
    togR('ceilingGrid','Ceil Grid',ro.ceilingGrid),
    togR('stripLights','Strip Lights',ro.stripLights),
    togR('baseboardLights','Baseboard',ro.baseboardLights),
  ].filter(Boolean).join('');

  return `
  ${hasRF ? '<div class="r3-env-sec">Room</div>' : ''}
  ${numR('width','Width',ro.width,10,60,1,'m')}
  ${numR('depth','Depth',ro.depth,10,60,1,'m')}
  ${rngR('height','Height',ro.height,6,20,1,'m')}
  ${rngR('fogNear','Fog Near',ro.fogNear,5,40,1,'')}
  ${rngR('fogFar','Fog Far',ro.fogFar,20,120,5,'')}
  ${toggleRows ? `<div class="r3-env-toggles">${toggleRows}</div>` : ''}
  ${showR('wallColor') ? `<div class="r3-env-row">
    <span class="r3-lbl">Wall Color</span>
    <input type="color" class="r3-color-pick" value="${ro.wallColor ? (typeof ro.wallColor==='string' ? ro.wallColor : '#'+ro.wallColor.toString(16).padStart(6,'0')) : '#1a2a3f'}"
           oninput="window._r3['${sid}']._setRoom('wallColor',this.value)">
  </div>` : ''}
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
  <div id="${sid}-custom-lights">${(lo.customLights||[]).map((cl,i) => customLightRow(sid,cl,i)).join('')}</div>` : ''}`;
}

function roomItemsPanelBody(self) {
  const sid = self._id;
  return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
    <select class="r3-inp r3-inp-xs" id="${sid}-add-item-type" style="width:80px">
      <option value="ups">⚡ UPS</option>
      <option value="battery">🔋 Battery</option>
      <option value="shelf">📦 Shelf</option>
      <option value="pdu">🔌 PDU</option>
      <option value="aircon">❄ Aircon</option>
      <option value="sensor">📡 Sensor</option>
    </select>
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addRoomItem(document.getElementById('${sid}-add-item-type').value)">+ Add</button>
  </div>
  <div id="${sid}-room-items">${(self._room?.room_items||[]).map((item,i)=>roomItemRow(sid,item,i)).join('')}</div>`;
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
  <div class="r3-rw"><span class="r3-lbl">Opacity</span><input class="r3-range" type="range" min="0" max="1" step="0.05" value="${ro.nameplateOpacity??1}" style="flex:1" oninput="window._r3['${sid}']._setRackOpt('nameplateOpacity',+this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Shape</span>
    <select class="r3-inp" id="${sid}-rnpshape" style="width:85px" onchange="window._r3['${sid}']._onRackProp('nameplateShape',this.value)">
      <option value="rounded">Rounded</option><option value="rect">Rect</option><option value="pill">Pill</option>
    </select>
  </div>
  <div class="r3-rw"><span class="r3-lbl">BG Color</span><input type="color" id="${sid}-rnpbg" class="r3-color-pick" oninput="window._r3['${sid}']._onRackProp('nameplateColor',this.value)"></div>
  <div class="r3-rw"><span class="r3-lbl">Text Color</span><input type="color" id="${sid}-rnptxt" class="r3-color-pick" oninput="window._r3['${sid}']._onRackProp('nameplateTextColor',this.value)"></div>`;
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

// ── VM helpers ────────────────────────────────────────────────
function vmStatusClass(s) { return s === 'running' ? 'running' : s === 'paused' ? 'paused' : 'stopped'; }
function vmStatusLabel(s) { return s === 'running' ? '▶ Running' : s === 'paused' ? '⏸ Paused' : '■ Stopped'; }

function vmCard(sid, vm, di, vi) {
  const sc = vmStatusClass(vm.status ?? 'stopped');
  const ips = [vm.ips?.local, vm.ips?.public].filter(Boolean).join(' / ') || '—';
  const ports = (vm.ports || []);
  const openPorts = ports.filter(p => p.status !== 'closed');
  const closedPorts = ports.filter(p => p.status === 'closed');
  const mem = vm.resources?.memory ? (vm.resources.memory >= 1024 ? (vm.resources.memory/1024).toFixed(1)+'G' : vm.resources.memory+'M') : '—';
  return `<div class="r3-vm-card r3-vm-${sc}" id="${sid}-vm-${di}-${vi}">
    <div class="r3-vm-hdr">
      <span class="r3-vm-status ${sc}"></span>
      <span class="r3-vm-name">${vm.name || 'VM-'+vi}</span>
      ${vm.technology ? `<span class="r3-vm-tech">${vm.technology}</span>` : ''}
      <button class="r3-ph-btn r3-vm-expand" title="Edit" onclick="window._r3['${sid}']._toggleVMEdit(${di},${vi})">✎</button>
      <button class="r3-ph-btn" title="Remove" onclick="window._r3['${sid}']._removeVM(${di},${vi})">×</button>
    </div>
    ${vm.label ? `<div style="font-size:9px;color:var(--r3-dim);margin-bottom:4px;font-family:'Share Tech Mono',monospace">${vm.label}</div>` : ''}
    <div class="r3-vm-res">
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${vm.resources?.vcpu ?? '—'}</span><span class="r3-vm-res-lbl">vCPU</span></div>
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${mem}</span><span class="r3-vm-res-lbl">RAM</span></div>
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${vm.resources?.disk ? vm.resources.disk+'G' : '—'}</span><span class="r3-vm-res-lbl">Disk</span></div>
    </div>
    <div class="r3-vm-body" style="margin-top:5px">
      <div class="r3-vm-row"><span class="r3-vm-key">OS</span><span class="r3-vm-val">${vm.os || '—'}</span></div>
      <div class="r3-vm-row"><span class="r3-vm-key">IPs</span><span class="r3-vm-val">${ips}</span></div>
      ${ports.length ? `<div class="r3-vm-row"><span class="r3-vm-key">Ports</span><div class="r3-vm-chips">
        ${openPorts.map(p=>`<span class="r3-vm-chip open" title="${p.service||''} ${p.protocol||''}">${p.port}</span>`).join('')}
        ${closedPorts.map(p=>`<span class="r3-vm-chip close" title="${p.service||''} ${p.protocol||''}">${p.port}</span>`).join('')}
      </div></div>` : ''}
    </div>
    <div class="r3-vm-edit-form" id="${sid}-vmef-${di}-${vi}" style="display:none">
      <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" value="${vm.name??''}" oninput="window._r3['${sid}']._editVM(${di},${vi},'name',this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Label</span><input class="r3-inp" value="${vm.label??''}" oninput="window._r3['${sid}']._editVM(${di},${vi},'label',this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Tech</span>
        <select class="r3-inp" onchange="window._r3['${sid}']._editVM(${di},${vi},'technology',this.value)">
          ${['VMware ESXi','KVM/QEMU','Hyper-V','Proxmox','Docker','LXC','Xen','VirtualBox','Other'].map(t=>`<option${vm.technology===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="r3-rw"><span class="r3-lbl">OS</span><input class="r3-inp" value="${vm.os??''}" oninput="window._r3['${sid}']._editVM(${di},${vi},'os',this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Status</span>
        <select class="r3-inp" onchange="window._r3['${sid}']._editVM(${di},${vi},'status',this.value)">
          ${['running','stopped','paused'].map(s=>`<option${(vm.status??'stopped')===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="r3-env-sec">IPs</div>
      <div class="r3-rw"><span class="r3-lbl">Local</span><input class="r3-inp" value="${vm.ips?.local??''}" placeholder="192.168.x.x" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'ips','local',this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Public</span><input class="r3-inp" value="${vm.ips?.public??''}" placeholder="0.0.0.0" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'ips','public',this.value)"></div>
      <div class="r3-env-sec">Resources</div>
      <div class="r3-rw"><span class="r3-lbl">vCPU</span><input class="r3-inp" type="number" min="1" max="128" value="${vm.resources?.vcpu??1}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','vcpu',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">RAM(MB)</span><input class="r3-inp" type="number" min="256" step="256" value="${vm.resources?.memory??1024}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','memory',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Disk(GB)</span><input class="r3-inp" type="number" min="1" value="${vm.resources?.disk??50}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','disk',+this.value)"></div>
      <div class="r3-env-sec" style="display:flex;align-items:center;justify-content:space-between">
        <span>Ports</span>
        <button class="r3-btn" style="padding:1px 5px;font-size:9px" onclick="window._r3['${sid}']._addVMPort(${di},${vi})">+ Port</button>
      </div>
      <div id="${sid}-vmports-${di}-${vi}">${(vm.ports||[]).map((p,pi)=>vmPortRow(sid,di,vi,p,pi)).join('')}</div>
    </div>
  </div>`;
}

function vmPortRow(sid, di, vi, p, pi) {
  return `<div class="r3-vm-port-row" id="${sid}-vmp-${di}-${vi}-${pi}">
    <input class="r3-inp r3-inp-xs" type="number" min="1" max="65535" value="${p.port??80}" style="width:46px" title="Port" oninput="window._r3['${sid}']._editVMPort(${di},${vi},${pi},'port',+this.value)">
    <select class="r3-inp r3-inp-xs" style="width:52px" onchange="window._r3['${sid}']._editVMPort(${di},${vi},${pi},'protocol',this.value)">
      <option${p.protocol==='TCP'?' selected':''}>TCP</option>
      <option${p.protocol==='UDP'?' selected':''}>UDP</option>
    </select>
    <select class="r3-inp r3-inp-xs" style="width:58px" onchange="window._r3['${sid}']._editVMPort(${di},${vi},${pi},'status',this.value)">
      <option value="open"${p.status!=='closed'?' selected':''}>Open</option>
      <option value="closed"${p.status==='closed'?' selected':''}>Closed</option>
    </select>
    <input class="r3-inp r3-inp-xs" value="${p.service??''}" placeholder="svc" style="flex:1;min-width:40px" oninput="window._r3['${sid}']._editVMPort(${di},${vi},${pi},'service',this.value)">
    <button class="r3-ph-btn" style="font-size:12px" onclick="window._r3['${sid}']._removeVMPort(${di},${vi},${pi})">×</button>
  </div>`;
}

function vmPanelBody(self) {
  const sid = self._id;
  const dev = self._rack?.devices?.find(d => d.id === self._selId);
  if (!dev || dev.type !== 'server') {
    return `<div style="font-size:10px;color:var(--r3-dim);font-family:'Share Tech Mono',monospace;padding:8px 0">Select a server device to manage VMs.</div>`;
  }
  const di = self._rack.devices.indexOf(dev);
  const vms = dev.vms || [];
  return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
    <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);flex:1">${dev.name} — ${vms.length} VM${vms.length!==1?'s':''}</span>
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addVM(${di})">+ VM</button>
  </div>
  <div id="${sid}-vm-list">${vms.map((vm,vi) => vmCard(sid,vm,di,vi)).join('')}</div>`;
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
    <div class="r3-compass" id="${sid}-compass">
      <div class="r3-compass-ring">
        <span class="r3-compass-n" id="${sid}-compass-n">N</span>
        <span class="r3-compass-e">E</span>
        <span class="r3-compass-s">S</span>
        <span class="r3-compass-w">W</span>
        <svg class="r3-compass-svg" id="${sid}-needle" viewBox="-8 -26 16 52" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,-22 4,0 0,-6 -4,0" fill="#ff4433"/>
          <polygon points="0,22 4,0 0,6 -4,0" fill="#607080"/>
          <circle cx="0" cy="0" r="2.5" fill="#ccd8e8"/>
        </svg>
      </div>
    </div>
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
    ${panelHtml(self,'roomItems','Room Items',roomItemsPanelBody(self))}
    ${panelHtml(self,'rackProps','Rack Properties',rackPropsPanelBody(self))}
    ${panelHtml(self,'stats','Statistics',statsPanelBody(self))}
    ${panelHtml(self,'devices','Devices',devicesPanelBody(self))}
    ${sb.showEditPanel && v.allowEdit ? panelHtml(self,'editDevice','Edit Device',editDevicePanelBody(self),{hidden:true}) : ''}
    ${panelHtml(self,'vms','Virtual Machines',vmPanelBody(self),{hidden:true})}
    <div id="${sid}-cat-edit-wrap"></div>
  </div>`;

  const leftHandleHtml  = !sb.enabled ? '' : `<div class="r3-sb-handle"  id="${sid}-sb-handle"  style="display:${showL?'flex':'none'}"></div>`;
  const rightHandleHtml = !sb.enabled ? '' : `<div class="r3-sb-handle r3-sbr-handle" id="${sid}-sbr-handle" style="display:${showR?'flex':'none'}"></div>`;

  return `${toolbar}<div class="r3-body">${sidebarHtml}${leftHandleHtml}${self._mode==='2d'?view2dHtml:canvasHtml}${self._mode==='2d'?canvasHtml:view2dHtml}${rightHandleHtml}${rightSidebarHtml}</div>`;
}

// Exported for dynamic re-render
export { customLightRow, roomItemRow, roomItemsPanelBody, vmPanelBody, vmCard, vmPortRow };
