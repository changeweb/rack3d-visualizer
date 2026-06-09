// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any // temporary — replaced by full interface when Rack3DVisualizer.ts is created

export class HtmlBuilder {
  constructor(private readonly viz: IVisualizer) {}

  panelHtml(id: string, title: string, body: string, opts: { hidden?: boolean } = {}): string {
    const self = this.viz;
    const sid = self._id;
    return `<div class="r3-panel${opts.hidden ? ' r3-panel-hidden' : ''}" data-panel-id="${id}" id="${sid}-panel-wrap-${id}">
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
    <div class="r3-pb-resize" onmousedown="window._r3['${sid}']._onPanelResizeStart(event,'${id}')"></div>
  </div>`;
  }

  roomItemRow(item: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
    const types = ['ups','battery','shelf','pdu','aircon','sensor'];
    const typeIcons: Record<string, string> = { ups:'⚡', battery:'🔋', shelf:'📦', pdu:'🔌', aircon:'❄', sensor:'📡' };
    const defSize: Record<string, [number, number, number]> = { ups:[3.0,8.0,1.8], battery:[3.6,2.5,2.0], shelf:[5.0,5.0,1.2], pdu:[0.5,10.0,0.4], aircon:[4.0,10.0,2.0], sensor:[0.4,2.2,0.4] };
    const [dW,dH,dD] = defSize[item.type as string] ?? [2,4,1.5];
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

  wallRow(wall: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
    const colorHex = wall.color ? (typeof wall.color === 'string' ? wall.color : '#' + (wall.color as number).toString(16).padStart(6,'0')) : '#1a2a3f';
    return `<div style="border:1px solid var(--r3-border,#1a2a3f);border-radius:4px;padding:5px;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px">
      <input class="r3-inp r3-inp-xs" value="${wall.name??'Wall'}" placeholder="Name" style="flex:1;min-width:60px" oninput="window._r3['${sid}']._editWall(${i},'name',this.value)">
      <input type="color" value="${colorHex}" class="r3-color-pick" title="Color" oninput="window._r3['${sid}']._editWall(${i},'color',this.value)">
      <label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer">
        <input type="checkbox"${wall.visible!==false?' checked':''} onchange="window._r3['${sid}']._editWall(${i},'visible',this.checked)" title="Visible">Vis
      </label>
      <button class="r3-ph-btn" style="font-size:13px;margin-left:auto" onclick="window._r3['${sid}']._removeWall(${i})">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Pos</span>
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${wall.x??0}" title="X" style="width:42px" oninput="window._r3['${sid}']._editWall(${i},'x',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${wall.z??0}" title="Z" style="width:42px" oninput="window._r3['${sid}']._editWall(${i},'z',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${Math.round(((wall.angle??0) as number)*180/Math.PI)}" title="Angle°" style="width:42px" oninput="window._r3['${sid}']._editWall(${i},'angle',+this.value*Math.PI/180)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Size</span>
      <input class="r3-inp r3-inp-xs" type="number" step="1" min="1" value="${wall.length??20}" title="Length" style="width:42px" oninput="window._r3['${sid}']._editWall(${i},'length',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" min="1" value="${wall.height??14}" title="Height" style="width:42px" oninput="window._r3['${sid}']._editWall(${i},'height',+this.value)">
      <span style="font-size:9px;color:var(--r3-dim)">L×H</span>
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
      <span style="font-size:9px;color:var(--r3-dim);min-width:40px">Opacity</span>
      <input class="r3-range" type="range" min="0" max="1" step="0.05" value="${wall.opacity??1}" style="flex:1" oninput="window._r3['${sid}']._editWall(${i},'opacity',+this.value)">
    </div>
  </div>`;
  }

  pillarRow(pillar: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
    const colorHex = pillar.color ? (typeof pillar.color === 'string' ? pillar.color : '#' + (pillar.color as number).toString(16).padStart(6,'0')) : '#2a3a4a';
    return `<div style="border:1px solid var(--r3-border,#1a2a3f);border-radius:4px;padding:5px;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px">
      <select class="r3-inp r3-inp-xs" style="width:80px" onchange="window._r3['${sid}']._editPillar(${i},'shape',this.value)">
        <option value="cylinder"${(pillar.shape??'cylinder')==='cylinder'?' selected':''}>Cylinder</option>
        <option value="square"${pillar.shape==='square'?' selected':''}>Square</option>
      </select>
      <input type="color" value="${colorHex}" class="r3-color-pick" title="Color" oninput="window._r3['${sid}']._editPillar(${i},'color',this.value)">
      <button class="r3-ph-btn" style="font-size:13px;margin-left:auto" onclick="window._r3['${sid}']._removePillar(${i})">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Pos</span>
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${pillar.x??0}" title="X" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'x',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${pillar.z??0}" title="Z" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'z',+this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Size</span>
      ${(pillar.shape??'cylinder')==='cylinder'
        ? `<input class="r3-inp r3-inp-xs" type="number" step="0.1" min="0.1" value="${pillar.radius??0.4}" title="Radius" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'radius',+this.value)"><span style="font-size:9px;color:var(--r3-dim)">r</span>`
        : `<input class="r3-inp r3-inp-xs" type="number" step="0.1" min="0.1" value="${pillar.width??0.8}" title="Width" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'width',+this.value)"><input class="r3-inp r3-inp-xs" type="number" step="0.1" min="0.1" value="${pillar.depth??0.8}" title="Depth" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'depth',+this.value)"><span style="font-size:9px;color:var(--r3-dim)">w×d</span>`
      }
      <input class="r3-inp r3-inp-xs" type="number" step="1" min="1" value="${pillar.height??14}" title="Height" style="width:42px" oninput="window._r3['${sid}']._editPillar(${i},'height',+this.value)"><span style="font-size:9px;color:var(--r3-dim)">h</span>
    </div>
  </div>`;
  }

  connectionRow(conn: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
    const colHex = typeof conn.color === 'string' ? conn.color : '#4499ff';
    const u = typeof conn.utilization === 'number' ? conn.utilization : 0.3;
    return `<div style="border:1px solid var(--r3-border,#1a2a3f);border-radius:4px;padding:5px;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:3px;margin-bottom:3px">
      <input class="r3-inp r3-inp-xs" value="${conn.from??''}" placeholder="From ID" style="flex:1;min-width:50px" title="Device or rack ID" oninput="window._r3['${sid}']._editConnection(${i},'from',this.value)">
      <span style="font-size:9px;color:var(--r3-dim)">→</span>
      <input class="r3-inp r3-inp-xs" value="${conn.to??''}" placeholder="To ID" style="flex:1;min-width:50px" title="Device or rack ID" oninput="window._r3['${sid}']._editConnection(${i},'to',this.value)">
      <button class="r3-ph-btn" style="font-size:13px;margin-left:2px" onclick="window._r3['${sid}']._removeConnection(${i})">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:3px;margin-bottom:3px">
      <input class="r3-inp r3-inp-xs" value="${conn.label??''}" placeholder="Label" style="flex:1" oninput="window._r3['${sid}']._editConnection(${i},'label',this.value)">
      <input class="r3-inp r3-inp-xs" value="${conn.bandwidth??'1G'}" placeholder="BW" style="width:38px" title="Bandwidth e.g. 10G" oninput="window._r3['${sid}']._editConnection(${i},'bandwidth',this.value)">
      <input type="color" value="${colHex}" class="r3-color-pick" title="Color override" oninput="window._r3['${sid}']._editConnection(${i},'color',this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:28px">Load</span>
      <input class="r3-range" type="range" min="0" max="1" step="0.05" value="${u}" style="flex:1" oninput="window._r3['${sid}']._editConnection(${i},'utilization',+this.value)" title="Utilization 0–1">
      <span style="font-size:9px;color:var(--r3-dim);min-width:26px">${Math.round(u*100)}%</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer">
        <input type="checkbox"${conn.animated!==false?' checked':''} onchange="window._r3['${sid}']._editConnection(${i},'animated',this.checked)">Animate
      </label>
      <label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer">
        <input type="checkbox"${conn.visible!==false?' checked':''} onchange="window._r3['${sid}']._editConnection(${i},'visible',this.checked)">Vis
      </label>
    </div>
  </div>`;
  }

  networkPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conns = (self._room as any)?.connections || [];
    return `<div style="margin-bottom:6px;font-size:9px;color:var(--r3-dim);line-height:1.5">
    Connect racks or devices by ID. Use the JSON view to copy IDs, or reference from the device list above.
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addConnection()">+ Connection</button>
  </div>
  <div id="${sid}-conn-list">${conns.map((c: Record<string, unknown>, i: number) => this.connectionRow(c, i)).join('')}</div>`;
  }

  zoneRow(zone: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
    const colorHex = typeof zone.color === 'string' ? zone.color : '#4488ff';
    return `<div style="border:1px solid var(--r3-border,#1a2a3f);border-radius:4px;padding:5px;margin-bottom:4px">
    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px">
      <input class="r3-inp r3-inp-xs" value="${zone.name??'Zone'}" placeholder="Name" style="flex:1;min-width:60px" oninput="window._r3['${sid}']._editZone(${i},'name',this.value)">
      <input type="color" value="${colorHex}" class="r3-color-pick" title="Color" oninput="window._r3['${sid}']._editZone(${i},'color',this.value)">
      <label style="display:flex;align-items:center;gap:2px;font-size:9px;cursor:pointer">
        <input type="checkbox"${zone.visible!==false?' checked':''} onchange="window._r3['${sid}']._editZone(${i},'visible',this.checked)" title="Visible">Vis
      </label>
      <button class="r3-ph-btn" style="font-size:13px;margin-left:auto" onclick="window._r3['${sid}']._removeZone(${i})">×</button>
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Pos</span>
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${zone.x??0}" title="X" style="width:42px" oninput="window._r3['${sid}']._editZone(${i},'x',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" value="${zone.z??0}" title="Z" style="width:42px" oninput="window._r3['${sid}']._editZone(${i},'z',+this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:20px">Size</span>
      <input class="r3-inp r3-inp-xs" type="number" step="1" min="1" value="${zone.width??10}" title="Width" style="width:42px" oninput="window._r3['${sid}']._editZone(${i},'width',+this.value)">
      <input class="r3-inp r3-inp-xs" type="number" step="1" min="1" value="${zone.depth??10}" title="Depth" style="width:42px" oninput="window._r3['${sid}']._editZone(${i},'depth',+this.value)">
      <span style="font-size:9px;color:var(--r3-dim)">W×D</span>
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px">
      <span style="font-size:9px;color:var(--r3-dim);min-width:40px">Fill</span>
      <input class="r3-range" type="range" min="0" max="0.6" step="0.02" value="${zone.opacity??0.18}" style="flex:1" oninput="window._r3['${sid}']._editZone(${i},'opacity',+this.value)">
    </div>
    <div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap">
      <span style="font-size:9px;color:var(--r3-dim);min-width:40px">WallH</span>
      <input class="r3-inp r3-inp-xs" type="number" step="0.5" min="0" value="${zone.wallHeight??0}" title="Wall height (0=none)" style="width:48px" oninput="window._r3['${sid}']._editZone(${i},'wallHeight',+this.value)">
      <span style="font-size:9px;color:var(--r3-dim)">m</span>
    </div>
  </div>`;
  }

  roomPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const ro  = self._opts.room;
    const walls   = self._room?.room_walls   || [];
    const pillars = self._room?.room_pillars || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zones   = (self._room as any)?.zones || [];
    return `<div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-rtab-racks"   onclick="window._r3['${sid}']._switchRoomTab('racks')">Racks</button>
    <button class="r3-tab"        id="${sid}-rtab-layout"  onclick="window._r3['${sid}']._switchRoomTab('layout')">Layout</button>
    <button class="r3-tab"        id="${sid}-rtab-walls"   onclick="window._r3['${sid}']._switchRoomTab('walls')">Walls</button>
    <button class="r3-tab"        id="${sid}-rtab-pillars" onclick="window._r3['${sid}']._switchRoomTab('pillars')">Pillars</button>
    <button class="r3-tab"        id="${sid}-rtab-zones"   onclick="window._r3['${sid}']._switchRoomTab('zones')">Zones</button>
  </div>

  <div id="${sid}-rtab-body-racks">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);letter-spacing:1px;text-transform:uppercase">Racks</span>
      <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addRack()">+ Rack</button>
    </div>
    <div id="${sid}-rack-list"></div>
  </div>

  <div id="${sid}-rtab-body-layout" style="display:none">
    <div class="r3-env-sec">Room Name</div>
    <div class="r3-env-row">
      <input class="r3-inp" id="${sid}-room-name-inp" value="${self._room?.name ?? ''}" placeholder="Room name…"
             style="width:100%;box-sizing:border-box"
             oninput="window._r3['${sid}']._setRoomName(this.value)">
    </div>
    <div class="r3-env-sec">Grid</div>
    <div class="r3-env-row">
      <span class="r3-lbl">Rows</span>
      <input class="r3-inp r3-env-num" type="number" min="1" max="10" step="1" value="${self._room?.layout?.rows??1}"
             oninput="window._r3['${sid}']._setLayout('rows',Math.max(1,Math.min(10,+this.value)))">
    </div>
    <div class="r3-env-row">
      <span class="r3-lbl">Cols</span>
      <input class="r3-inp r3-env-num" type="number" min="1" max="10" step="1" value="${self._room?.layout?.cols??1}"
             oninput="window._r3['${sid}']._setLayout('cols',Math.max(1,Math.min(10,+this.value)))">
    </div>
    <div class="r3-env-row">
      <span class="r3-lbl">Side Gap</span>
      <input class="r3-inp r3-env-num" type="number" min="0" max="20" step="0.5"
             value="${Math.max(0,((self._room?.layout?.colSpacing??8)-self._opts.rack.width)).toFixed(1)}"
             oninput="window._r3['${sid}']._setLayout('colSpacing',Math.max(${self._opts.rack.width},+this.value+${self._opts.rack.width}))">
      <span class="r3-val">m</span>
    </div>
    <div class="r3-env-row">
      <span class="r3-lbl">Row Gap</span>
      <input class="r3-inp r3-env-num" type="number" min="0.1" max="30" step="0.5" value="${self._room?.layout?.rowSpacing??10}"
             oninput="window._r3['${sid}']._setLayout('rowSpacing',Math.max(0.1,+this.value))">
      <span class="r3-val">m</span>
    </div>
    <div class="r3-env-sec">Room</div>
    <div class="r3-env-row">
      <span class="r3-lbl">Width</span>
      <input class="r3-inp r3-env-num" type="number" min="10" max="200" step="1" value="${ro.width}"
             oninput="window._r3['${sid}']._setRoom('width',Math.max(10,Math.min(200,+this.value)))">
      <span class="r3-val">m</span>
    </div>
    <div class="r3-env-row">
      <span class="r3-lbl">Depth</span>
      <input class="r3-inp r3-env-num" type="number" min="10" max="200" step="1" value="${ro.depth}"
             oninput="window._r3['${sid}']._setRoom('depth',Math.max(10,Math.min(200,+this.value)))">
      <span class="r3-val">m</span>
    </div>
    <div class="r3-env-row"><span class="r3-lbl">Height</span>
      <input class="r3-range" type="range" min="6" max="50" step="1" value="${ro.height}"
             oninput="window._r3['${sid}']._setRoom('height',+this.value);document.getElementById('${sid}-ev-r-height').textContent=this.value+'m'">
      <span class="r3-val" id="${sid}-ev-r-height">${ro.height}m</span>
    </div>
    <div class="r3-env-sec">Tiles &amp; Appearance</div>
    <div class="r3-env-row">
      <span class="r3-lbl">Tile Size</span>
      <input class="r3-inp r3-env-num" type="number" min="0.5" max="10" step="0.5" value="${ro.tileSize??2}"
             oninput="window._r3['${sid}']._setRoom('tileSize',Math.max(0.5,+this.value))">
      <span class="r3-val">m</span>
    </div>
    <div class="r3-env-row">
      <span class="r3-lbl">Wall Color</span>
      <input type="color" class="r3-color-pick" value="${ro.wallColor ? (typeof ro.wallColor==='string' ? ro.wallColor : '#'+ro.wallColor.toString(16).padStart(6,'0')) : '#1a2a3f'}"
             oninput="window._r3['${sid}']._setRoom('wallColor',this.value)">
    </div>
    <div class="r3-env-toggles">
      <label class="r3-sw-label"><span class="r3-lbl">Floor Tiles</span>
        <label class="r3-sw"><input type="checkbox"${ro.floorTiles?' checked':''} onchange="window._r3['${sid}']._setRoom('floorTiles',this.checked)">
          <span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label></label>
    </div>
  </div>

  <div id="${sid}-rtab-body-walls" style="display:none">
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);flex:1">Walls</span>
      <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._autoGenWalls()">⟳ Auto</button>
      <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addWall()">+ Wall</button>
    </div>
    <div id="${sid}-walls-list">${walls.map((w: Record<string, unknown>, i: number) => this.wallRow(w, i)).join('')}</div>
  </div>

  <div id="${sid}-rtab-body-pillars" style="display:none">
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);flex:1">Pillars</span>
      <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addPillar()">+ Pillar</button>
    </div>
    <div id="${sid}-pillars-list">${pillars.map((p: Record<string, unknown>, i: number) => this.pillarRow(p, i)).join('')}</div>
  </div>

  <div id="${sid}-rtab-body-zones" style="display:none">
    <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);flex:1">Zones</span>
      <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addZone()">+ Zone</button>
    </div>
    <div id="${sid}-zones-list">${zones.map((z: Record<string, unknown>, i: number) => this.zoneRow(z, i)).join('')}</div>
  </div>`;
  }

  customLightRow(cl: Record<string, unknown>, i: number): string {
    const self = this.viz;
    const sid = self._id;
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

  envPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const lo  = self._opts.lighting;
    const lf  = self._opts.sidebar.lightingFields;

    const showL = (f: string) => !lf || lf.includes(f);
    const showCL = !lf || lf.includes('customLights');

    const rngL = (f: string, label: string, val: unknown, min: number, max: number, step: number, unit: string) => !showL(f) ? '' :
      `<div class="r3-env-row"><span class="r3-lbl">${label}</span>
      <input class="r3-range" type="range" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="window._r3['${sid}']._setLight('${f}',+this.value);document.getElementById('${sid}-ev-l-${f}').textContent=this.value+'${unit}'">
      <span class="r3-val" id="${sid}-ev-l-${f}">${val}${unit}</span>
    </div>`;

    const togL = (f: string, label: string, val: boolean) => !showL(f) ? '' :
      `<label class="r3-sw-label"><span class="r3-lbl">${label}</span>
      <label class="r3-sw"><input type="checkbox"${val?' checked':''} onchange="window._r3['${sid}']._setLight('${f}',this.checked)">
        <span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label></label>`;

    return `<div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-lt-scene"    onclick="window._r3['${sid}']._switchLightTab('scene')">Scene</button>
    <button class="r3-tab"        id="${sid}-lt-overhead" onclick="window._r3['${sid}']._switchLightTab('overhead')">Overhead</button>
    <button class="r3-tab"        id="${sid}-lt-custom"   onclick="window._r3['${sid}']._switchLightTab('custom')">Custom</button>
  </div>

  <div id="${sid}-lt-body-scene">
    ${rngL('ambientIntensity','Ambient',lo.ambientIntensity,0,20,0.5,'')}
    ${rngL('exposure','Exposure',lo.exposure,0.5,5,0.1,'')}
    ${togL('shadows','Shadows',lo.shadows)}
  </div>

  <div id="${sid}-lt-body-overhead" style="display:none">
    ${rngL('overheadCount','Count',lo.overheadCount,2,12,1,'')}
    ${rngL('overheadIntensity','Intensity',lo.overheadIntensity,0,20,0.5,'')}
  </div>

  <div id="${sid}-lt-body-custom" style="display:none">
    ${showCL ? `
    <div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:4px">
      <button class="r3-btn" style="padding:1px 6px;font-size:9px" onclick="window._r3['${sid}']._addCustomLight()">+ Add</button>
    </div>
    <div class="r3-cl-labels"><span>Type</span><span>X</span><span>Y</span><span>Z</span><span>Int</span><span>Dst</span><span>Col</span></div>
    <div id="${sid}-custom-lights">${(lo.customLights||[]).map((cl: Record<string, unknown>, i: number) => this.customLightRow(cl, i)).join('')}</div>` : ''}
  </div>`;
  }

  roomItemsPanelBody(): string {
    const self = this.viz;
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
  <div id="${sid}-room-items">${(self._room?.room_items||[]).map((item: Record<string, unknown>, i: number) => this.roomItemRow(item, i)).join('')}</div>`;
  }

  rackPropsPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const ro  = self._opts.rack;
    return `<div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-rpt-config"    onclick="window._r3['${sid}']._switchRackPropTab('config')">Config</button>
    <button class="r3-tab"        id="${sid}-rpt-position"  onclick="window._r3['${sid}']._switchRackPropTab('position')">Position</button>
    <button class="r3-tab"        id="${sid}-rpt-nameplate" onclick="window._r3['${sid}']._switchRackPropTab('nameplate')">Nameplate</button>
  </div>

  <div id="${sid}-rpt-body-config">
    <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${sid}-rn" oninput="window._r3['${sid}']._onRackName(this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Units</span><input class="r3-inp" type="number" id="${sid}-ru" min="4" max="48" style="width:55px" oninput="window._r3['${sid}']._onRackUnits(+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Width(m)</span><input class="r3-inp" type="number" id="${sid}-rwidth" min="2" max="12" step="0.1" style="width:65px" oninput="window._r3['${sid}']._onRackWidth(+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Temp°C</span><input class="r3-inp" type="number" id="${sid}-rtemp" oninput="window._r3['${sid}']._onRackProp('rackTemp',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">PDU Cap</span><input class="r3-inp" type="number" id="${sid}-rpduCap" oninput="window._r3['${sid}']._onRackProp('pduCapacity',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">PDU Load</span><input class="r3-inp" type="number" id="${sid}-rpduLoad" oninput="window._r3['${sid}']._onRackProp('pduLoad',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Labels</span>
      <label class="r3-sw"><input type="checkbox" id="${sid}-rshowlabels" onchange="window._r3['${sid}']._onRackProp('showLabels',this.checked)">
        <span class="r3-sw-track"><span class="r3-sw-thumb"></span></span></label></div>
  </div>

  <div id="${sid}-rpt-body-position" style="display:none">
    <div class="r3-rw"><span class="r3-lbl">Pos X</span><input class="r3-inp" type="number" id="${sid}-rposX" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('x',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Pos Y</span><input class="r3-inp" type="number" id="${sid}-rposY" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('y',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Pos Z</span><input class="r3-inp" type="number" id="${sid}-rposZ" step="0.5" style="width:65px" oninput="window._r3['${sid}']._onRackPos('z',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Angle°</span><input class="r3-inp" type="number" id="${sid}-rangle" min="-180" max="180" step="5" style="width:65px" oninput="window._r3['${sid}']._onRackAngle(+this.value)"></div>
    <div style="margin-top:6px;font-size:10px;color:var(--r3-dim);font-family:'Share Tech Mono',monospace">✥ MOVE mode to drag · ↻ ROTATE mode to spin</div>
  </div>

  <div id="${sid}-rpt-body-nameplate" style="display:none">
    <div class="r3-rw"><span class="r3-lbl">Scale</span><input class="r3-inp" type="number" min="0.1" max="5" step="0.1" value="${ro.nameplateScale??1}" style="width:65px" oninput="window._r3['${sid}']._setRackOpt('nameplateScale',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Y Offset</span><input class="r3-inp" type="number" step="0.1" value="${ro.nameplateYOffset??0.2}" style="width:65px" oninput="window._r3['${sid}']._setRackOpt('nameplateYOffset',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Opacity</span><input class="r3-range" type="range" min="0" max="1" step="0.05" value="${ro.nameplateOpacity??1}" style="flex:1" oninput="window._r3['${sid}']._setRackOpt('nameplateOpacity',+this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Shape</span>
      <select class="r3-inp" id="${sid}-rnpshape" style="width:85px" onchange="window._r3['${sid}']._onRackProp('nameplateShape',this.value)">
        <option value="rounded">Rounded</option><option value="rect">Rect</option><option value="pill">Pill</option>
      </select>
    </div>
    <div class="r3-rw"><span class="r3-lbl">BG Color</span><input type="color" id="${sid}-rnpbg" class="r3-color-pick" oninput="window._r3['${sid}']._onRackProp('nameplateColor',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Text Color</span><input type="color" id="${sid}-rnptxt" class="r3-color-pick" oninput="window._r3['${sid}']._onRackProp('nameplateTextColor',this.value)"></div>
  </div>`;
  }

  statsPanelBody(): string {
    const self = this.viz;
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

  devicesPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    return `<div id="${sid}-dl"></div>
  <div style="display:flex;gap:4px;margin-top:6px;border-top:1px solid var(--r3-border);padding-top:6px">
    <button class="r3-btn" style="flex:1" onclick="window._r3['${sid}'].resetRack()">↺ Reset</button>
    <button class="r3-btn" id="${sid}-btnCopy" style="flex:1" onclick="window._r3['${sid}'].copyJson()">⎘ Copy</button>
  </div>`;
  }

  editDevicePanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    return `<div class="r3-pl" id="${sid}-elbl" style="margin-bottom:5px">Edit Device</div>
  <div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-edt-properties" onclick="window._r3['${sid}']._switchEditDevTab('properties')">Properties</button>
    <button class="r3-tab"        id="${sid}-edt-style"      onclick="window._r3['${sid}']._switchEditDevTab('style')">Style</button>
    <button class="r3-tab"        id="${sid}-edt-network"    onclick="window._r3['${sid}']._switchEditDevTab('network')">Network</button>
  </div>

  <div id="${sid}-edt-body-properties">
    <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${sid}-en" oninput="window._r3['${sid}']._ed('name',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Start U</span><input class="r3-inp" type="number" min="1" id="${sid}-es" oninput="window._r3['${sid}']._ed('startUnit',+this.value)"></div>
    <div class="r3-rw" id="${sid}-emodel-row" style="display:none"><span class="r3-lbl">Model</span><span id="${sid}-emodel" style="font-family:'Share Tech Mono',monospace;font-size:10px;opacity:.75;padding:4px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px"></span></div>
    <div id="${sid}-einfo" style="margin-top:6px;padding:5px 7px;border:1px solid var(--r3-border);border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:10px;opacity:.7;line-height:1.6"></div>
  </div>

  <div id="${sid}-edt-body-style" style="display:none">
    <div class="r3-rw"><span class="r3-lbl">Color</span><input class="r3-inp" type="color" id="${sid}-ecolor" style="padding:2px;height:28px" oninput="window._r3['${sid}']._ed('color',this.value)"></div>
  </div>

  <div id="${sid}-edt-body-network" style="display:none">
    <div class="r3-rw"><span class="r3-lbl">IP</span><input class="r3-inp" id="${sid}-eip" oninput="window._r3['${sid}']._ed('ip',this.value)"></div>
    <div class="r3-rw"><span class="r3-lbl">Status</span><select class="r3-inp" id="${sid}-estat" onchange="window._r3['${sid}']._ed('status',this.value||undefined)"><option value="">-</option><option value="up">Up ▲</option><option value="down">Down ▼</option><option value="warn">Warn ⚠</option></select></div>
    <div class="r3-rw" style="flex-direction:column;align-items:stretch;gap:4px">
      <div style="display:flex;align-items:center;justify-content:space-between"><span class="r3-lbl">Custom Fields</span><button class="r3-btn" style="padding:1px 6px;font-size:10px" onclick="window._r3['${sid}']._addCustomField()">+ Add</button></div>
      <div id="${sid}-efields"></div>
    </div>
  </div>`;
  }

  private vmStatusClass(s: string): string {
    return s === 'running' ? 'running' : s === 'paused' ? 'paused' : 'stopped';
  }

  private vmStatusLabel(s: string): string {
    return s === 'running' ? '▶ Running' : s === 'paused' ? '⏸ Paused' : '■ Stopped';
  }

  vmCard(vm: Record<string, unknown>, di: number, vi: number): string {
    const self = this.viz;
    const sid = self._id;
    const sc = this.vmStatusClass((vm.status as string) ?? 'stopped');
    const ips_ = vm.ips as Record<string, string> | undefined;
    const ips = [ips_?.local, ips_?.public].filter(Boolean).join(' / ') || '—';
    const ports = (vm.ports as unknown[]) || [];
    const openPorts = (ports as Record<string, unknown>[]).filter(p => p.status !== 'closed');
    const closedPorts = (ports as Record<string, unknown>[]).filter(p => p.status === 'closed');
    const resources = vm.resources as Record<string, number> | undefined;
    const mem = resources?.memory ? (resources.memory >= 1024 ? (resources.memory/1024).toFixed(1)+'G' : resources.memory+'M') : '—';
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
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${resources?.vcpu ?? '—'}</span><span class="r3-vm-res-lbl">vCPU</span></div>
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${mem}</span><span class="r3-vm-res-lbl">RAM</span></div>
      <div class="r3-vm-res-item"><span class="r3-vm-res-val">${resources?.disk ? resources.disk+'G' : '—'}</span><span class="r3-vm-res-lbl">Disk</span></div>
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
          ${['running','stopped','paused'].map(s=>`<option${((vm.status??'stopped')===s)?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="r3-env-sec">IPs</div>
      <div class="r3-rw"><span class="r3-lbl">Local</span><input class="r3-inp" value="${ips_?.local??''}" placeholder="192.168.x.x" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'ips','local',this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Public</span><input class="r3-inp" value="${ips_?.public??''}" placeholder="0.0.0.0" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'ips','public',this.value)"></div>
      <div class="r3-env-sec">Resources</div>
      <div class="r3-rw"><span class="r3-lbl">vCPU</span><input class="r3-inp" type="number" min="1" max="128" value="${resources?.vcpu??1}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','vcpu',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">RAM(MB)</span><input class="r3-inp" type="number" min="256" step="256" value="${resources?.memory??1024}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','memory',+this.value)"></div>
      <div class="r3-rw"><span class="r3-lbl">Disk(GB)</span><input class="r3-inp" type="number" min="1" value="${resources?.disk??50}" oninput="window._r3['${sid}']._editVMNested(${di},${vi},'resources','disk',+this.value)"></div>
      <div class="r3-env-sec" style="display:flex;align-items:center;justify-content:space-between">
        <span>Ports</span>
        <button class="r3-btn" style="padding:1px 5px;font-size:9px" onclick="window._r3['${sid}']._addVMPort(${di},${vi})">+ Port</button>
      </div>
      <div id="${sid}-vmports-${di}-${vi}">${((vm.ports as Record<string, unknown>[])||[]).map((p, pi) => this.vmPortRow(di, vi, p, pi)).join('')}</div>
    </div>
  </div>`;
  }

  vmPortRow(di: number, vi: number, p: Record<string, unknown>, pi: number): string {
    const self = this.viz;
    const sid = self._id;
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

  vmPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const dev = self._rack?.devices?.find((d: Record<string, unknown>) => d.id === self._selId);
    if (!dev || dev.type !== 'server') {
      return `<div style="font-size:10px;color:var(--r3-dim);font-family:'Share Tech Mono',monospace;padding:8px 0">Select a server device to manage VMs.</div>`;
    }
    const di = self._rack.devices.indexOf(dev);
    const vms = dev.vms || [];
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
    <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--r3-dim);flex:1">${dev.name} — ${vms.length} VM${vms.length!==1?'s':''}</span>
    <button class="r3-btn" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addVM(${di})">+ VM</button>
  </div>
  <div id="${sid}-vm-list">${(vms as Record<string, unknown>[]).map((vm, vi) => this.vmCard(vm, di, vi)).join('')}</div>`;
  }

  catalogPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const sb = self._opts.sidebar;
    return `<div class="r3-tab-bar">
    <button class="r3-tab active" id="${sid}-tab-cat" onclick="window._r3['${sid}']._switchTab('cat')">Catalog</button>
    ${sb.showUnitMap ? `<button class="r3-tab" id="${sid}-tab-um" onclick="window._r3['${sid}']._switchTab('um')">Unit Map</button>` : ''}
    <div style="flex:1"></div>
    <button class="r3-btn" id="${sid}-tab-cat-add" style="padding:1px 7px;font-size:9px" onclick="window._r3['${sid}']._addCatalogItem()">+ New</button>
  </div>
  <div id="${sid}-tab-body-cat">
    <input class="r3-inp" id="${sid}-cat-search" placeholder="Search catalog…" style="width:100%;box-sizing:border-box;margin-bottom:5px"
           oninput="window._r3['${sid}']._catQuery=this.value;window._r3['${sid}']._renderCatalog()">
    <div id="${sid}-cat" class="r3-cat-list"></div>
  </div>
  ${sb.showUnitMap ? `<div id="${sid}-tab-body-um" style="display:none"><div class="r3-um" id="${sid}-um"></div></div>` : ''}`;
  }

  groupsPanelBody(): string {
    const self = this.viz;
    const sid = self._id;
    const groups = self._groupsArr ? self._groupsArr() : (self._room?.groups || []);

    let html = `<div style="font-size:9px;color:var(--r3-dim);margin-bottom:6px">Right-click items in 3D to group/ungroup. Select a group then use ✥MOVE or ↻ROTATE.</div>`;

    if (groups.length === 0) {
      html += `<div style="font-size:9px;color:var(--r3-dim);padding:4px 0">No groups yet.</div>`;
    } else {
      groups.forEach((grp: Record<string, unknown>) => {
        const isSel = self._selGroupId === grp.id;
        html += `<div style="border:1px solid ${isSel ? 'var(--r3-accent)' : 'var(--r3-border)'};border-radius:4px;padding:5px;margin-bottom:4px;cursor:pointer"
                      onclick="window._r3['${sid}']._selectGroup('${grp.id}')">`;
        html += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">`;
        html += `<span style="font-size:9px;color:var(--r3-accent);margin-right:2px">⊞</span>`;
        html += `<input class="r3-inp r3-inp-xs" value="${grp.name}" placeholder="Group name" style="flex:1"
                        onclick="event.stopPropagation()"
                        oninput="window._r3['${sid}']._renameGroup('${grp.id}',this.value)">`;
        html += `<button class="r3-ph-btn" style="font-size:11px" onclick="event.stopPropagation();window._r3['${sid}']._disbandGroup('${grp.id}')" title="Disband group">⊗</button>`;
        html += `</div>`;
        (grp.members as string[]).forEach(mid => {
          const item = (self._room?.room_items || []).find((i: Record<string, unknown>) => i.id === mid);
          const rack = (self._room?.racks || []).find((r: Record<string, unknown>) => r.id === mid);
          const nestedGrp = (self._room?.groups || []).find((g: Record<string, unknown>) => g.id === mid);
          const label = item ? (item.name || item.type) : rack ? rack.name : nestedGrp ? ('⊞ ' + nestedGrp.name) : mid;
          html += `<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px;padding-left:4px">`;
          html += `<span style="font-size:9px;flex:1;color:var(--r3-text)">${label}</span>`;
          html += `<button class="r3-ph-btn" style="font-size:10px" onclick="event.stopPropagation();window._r3['${sid}']._removeMemberFromGroup('${grp.id}','${mid}')" title="Remove from group">×</button>`;
          html += `</div>`;
        });
        if (isSel) {
          html += `<div style="font-size:9px;color:var(--r3-accent);margin-top:4px;padding-top:3px;border-top:1px solid var(--r3-border)">Active — drag any member with ✥MOVE / ↻ROTATE</div>`;
        }
        html += `</div>`;
      });
    }
    return html;
  }

  buildHTML(): string {
    const self = this.viz;
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
    <span class="r3-sep"></span>
    <span id="${sid}-room-name" style="font-size:10px;font-family:'Share Tech Mono',monospace;letter-spacing:1px;color:var(--r3-text);opacity:0.75;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px">${self._room?.name ?? ''}</span>
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
    <button class="r3-btn" id="${sid}-btnCam" onclick="window._r3['${sid}'].toggleCameraMode()">${self._ctrl?.mode==='fps'?'⊹ FPS':'⊕ ORBIT'}</button>
    <button class="r3-btn" id="${sid}-btn2d" onclick="window._r3['${sid}'].toggleMode()">⊞ ${self._mode==='2d'?'3D':'2D'}</button>
    <div class="r3-sep"></div>
    <button class="r3-btn" id="${sid}-btnMove"   onclick="window._r3['${sid}']._setTransformMode('move')"   title="Move items in 3D (drag to reposition)">✥ MOVE</button>
    <button class="r3-btn" id="${sid}-btnRotate" onclick="window._r3['${sid}']._setTransformMode('rotate')" title="Rotate items in 3D (drag left/right)">↻ ROTATE</button>
    <button class="r3-btn on" id="${sid}-btnAisle"    onclick="window._r3['${sid}'].toggleAisles()"   title="Toggle hot/cold aisle overlay">❄ AISLE</button>
    <button class="r3-btn on" id="${sid}-btnMinimap" onclick="window._r3['${sid}'].toggleMinimap()"  title="Toggle 2D minimap overlay">⊞ MAP</button>
    <button class="r3-btn on" id="${sid}-btnTopo"    onclick="window._r3['${sid}'].toggleTopology()" title="Toggle network topology lines">⬡ TOPO</button>
    <div class="r3-sep"></div>
    <select class="r3-inp" id="${sid}-theme-sel" title="Theme"
            onchange="window._r3['${sid}']._onThemeChange(this.value)"
            style="height:22px;font-size:10px;padding:0 4px;cursor:pointer;min-width:90px;width:auto">
      <option value="dark">Dark</option>
      <option value="light">Light</option>
      <option value="oled">OLED</option>
      <option value="warm">Warm</option>
      <option value="matrix">Matrix</option>
    </select>
    ${v.allowJsonEdit?`<button class="r3-btn" id="${sid}-btnJ" onclick="window._r3['${sid}'].toggleJson()">{ } JSON</button>`:''}
    <button class="r3-btn" id="${sid}-btnHelp" onclick="window._r3['${sid}'].toggleHelp()" title="Help &amp; About">? HELP</button>
  </div>`;

    const sidebarHtml = !sb.enabled ? '' : `
  <div class="r3-sb" id="${sid}-sb" style="width:${lW}px;min-width:${lW}px;display:${showL?'flex':'none'}"
       ondragover="event.preventDefault()"
       ondrop="window._r3['${sid}']._onPanelDropSidebar(event,'left')">
    ${this.panelHtml('room','Room',this.roomPanelBody())}
    ${this.panelHtml('env','Lighting',this.envPanelBody())}
    ${this.panelHtml('catalog','Catalog',this.catalogPanelBody())}
    ${this.panelHtml('catalogEdit','Catalog Item',`<div id="${sid}-cat-edit-wrap"></div>`,{hidden:true})}
    ${this.panelHtml('network','Network',this.networkPanelBody())}
  </div>`;

    const canvasHtml = `
  <div class="r3-cv" id="${sid}-cvcont">
    <canvas id="${sid}-cv3" class="r3-canvas"></canvas>
    <canvas class="r3-axis-gizmo" id="${sid}-axis-gizmo" width="64" height="64"></canvas>
    <div class="r3-scan"></div>
    <div class="r3-labels" id="${sid}-labels"></div>
    <div class="r3-zoom-btns">
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomIn()">＋</button>
      <button class="r3-zoom-btn" onclick="window._r3['${sid}'].zoomOut()">－</button>
    </div>
    <div class="r3-minimap-wrap" id="${sid}-minimap-wrap" style="display:flex">
      <div class="r3-minimap-hdr">
        <span>⊞ MAP</span>
        <span class="r3-minimap-pos" id="${sid}-minimap-pos"></span>
      </div>
      <canvas class="r3-minimap" id="${sid}-minimap" width="180" height="140"
        title="Click to teleport camera to location"
        onclick="window._r3['${sid}']._onMinimapClick(event)"></canvas>
      <div class="r3-minimap-hint">Click to teleport</div>
    </div>
    <div class="r3-legend-overlay">
      <button class="r3-legend-toggle-btn" onclick="window._r3['${sid}']._toggleLegend()">⬡ Types</button>
      <div class="r3-legend-body" id="${sid}-legend" style="display:none"></div>
    </div>
    <div id="${sid}-ctx-menu" class="r3-ctx-menu" style="display:none"></div>
    <div class="r3-tip" id="${sid}-tip">${self._ctrl?.mode==='fps'?'🖱 Drag to rotate · WS walk · A/D or ← → rotate · Click ⊹FPS button to lock mouse':'🖱 Drag to orbit · Scroll to zoom · Click to select · Drag selected rack to move'}</div>
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
    ${this.panelHtml('groups','Groups',this.groupsPanelBody())}
    ${this.panelHtml('roomItems','Room Items',this.roomItemsPanelBody())}
    ${this.panelHtml('rackProps','Rack Properties',this.rackPropsPanelBody())}
    ${this.panelHtml('stats','Statistics',this.statsPanelBody())}
    ${this.panelHtml('devices','Devices',this.devicesPanelBody())}
    ${sb.showEditPanel && v.allowEdit ? this.panelHtml('editDevice','Edit Device',this.editDevicePanelBody(),{hidden:true}) : ''}
    ${this.panelHtml('vms','Virtual Machines',this.vmPanelBody(),{hidden:true})}
  </div>`;

    const leftHandleHtml  = !sb.enabled ? '' : `<div class="r3-sb-handle"  id="${sid}-sb-handle"  style="display:${showL?'flex':'none'}"></div>`;
    const rightHandleHtml = !sb.enabled ? '' : `<div class="r3-sb-handle r3-sbr-handle" id="${sid}-sbr-handle" style="display:${showR?'flex':'none'}"></div>`;

    const helpModal = `
  <div class="r3-help-modal" id="${sid}-help-modal" style="display:none">
    <div class="r3-help-box">
      <div class="r3-help-hdr">
        <span style="font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px">RACK3D HELP</span>
        <button class="r3-ph-btn" style="font-size:16px;margin-left:auto" onclick="window._r3['${sid}'].toggleHelp()">×</button>
      </div>
      <div class="r3-tab-bar" style="margin-bottom:0;border-bottom:1px solid var(--r3-border)">
        <button class="r3-tab active" id="${sid}-ht-controls" onclick="window._r3['${sid}']._switchHelpTab('controls')">Controls</button>
        <button class="r3-tab"        id="${sid}-ht-help"     onclick="window._r3['${sid}']._switchHelpTab('help')">Help</button>
        <button class="r3-tab"        id="${sid}-ht-about"    onclick="window._r3['${sid}']._switchHelpTab('about')">About</button>
      </div>
      <div class="r3-help-body">
        <div id="${sid}-ht-body-controls">
          <div class="r3-help-sec">Camera</div>
          <div class="r3-help-row"><span class="r3-help-key">Drag</span><span>Orbit / look around</span></div>
          <div class="r3-help-row"><span class="r3-help-key">Scroll</span><span>Zoom in/out</span></div>
          <div class="r3-help-row"><span class="r3-help-key">⊹ FPS</span><span>Switch to FPS walk mode</span></div>
          <div class="r3-help-row"><span class="r3-help-key">W/S</span><span>Walk forward / back in FPS mode</span></div>
          <div class="r3-help-row"><span class="r3-help-key">A/D or ← →</span><span>Rotate camera left / right</span></div>
          <div class="r3-help-row"><span class="r3-help-key">Q / E</span><span>Move up / down in FPS mode</span></div>
          <div class="r3-help-row"><span class="r3-help-key">ESC</span><span>Release mouse lock</span></div>
          <div class="r3-help-sec">Selection &amp; Transform</div>
          <div class="r3-help-row"><span class="r3-help-key">Click</span><span>Select rack or device</span></div>
          <div class="r3-help-row"><span class="r3-help-key">✥ MOVE</span><span>Activate move mode — drag racks / items</span></div>
          <div class="r3-help-row"><span class="r3-help-key">↻ ROTATE</span><span>Activate rotate mode — drag left/right to spin</span></div>
          <div class="r3-help-row"><span class="r3-help-key">Click mode btn</span><span>Toggle off move/rotate mode</span></div>
          <div class="r3-help-sec">Panels</div>
          <div class="r3-help-row"><span class="r3-help-key">◧ / ◨</span><span>Toggle left / right sidebar</span></div>
          <div class="r3-help-row"><span class="r3-help-key">◈ LABELS</span><span>Show/hide device labels</span></div>
          <div class="r3-help-row"><span class="r3-help-key">◻ WIRE</span><span>Wireframe overlay</span></div>
          <div class="r3-help-row"><span class="r3-help-key">⊞ 2D</span><span>Switch to 2D flat view</span></div>
        </div>
        <div id="${sid}-ht-body-help" style="display:none">
          <div class="r3-help-sec">Getting Started</div>
          <div class="r3-help-row" style="flex-direction:column;align-items:flex-start;gap:3px">
            <span>1. Use the <b>Room</b> panel (left) to manage racks, layout, walls, and pillars.</span>
            <span>2. Click a rack in the scene or the rack list to select it.</span>
            <span>3. Use <b>Rack Properties</b> (right) to configure the selected rack.</span>
            <span>4. Use the <b>Devices</b> panel to add/edit devices in the rack.</span>
            <span>5. Use <b>Catalog</b> to maintain reusable device templates.</span>
          </div>
          <div class="r3-help-sec">Moving Items</div>
          <div class="r3-help-row" style="flex-direction:column;align-items:flex-start;gap:3px">
            <span>Enable <b>✥ MOVE</b> in the toolbar, then click-drag any rack or room item to reposition it on the floor.</span>
            <span>Enable <b>↻ ROTATE</b> then drag left/right to rotate the selected item around the Y axis.</span>
            <span>Click the active button again to deactivate transform mode.</span>
          </div>
          <div class="r3-help-sec">JSON Export / Import</div>
          <div class="r3-help-row" style="flex-direction:column;align-items:flex-start;gap:3px">
            <span>Use <b>{ } JSON</b> to open the JSON editor. Click <b>↺ EXPORT</b> to populate it with current data, edit as needed, then <b>✓ APPLY</b> to load it.</span>
          </div>
        </div>
        <div id="${sid}-ht-body-about" style="display:none">
          <div style="display:flex;flex-direction:column;gap:8px;padding-top:4px">
            <div style="font-size:20px;font-family:'Share Tech Mono',monospace;letter-spacing:3px">RACK<span style="color:var(--r3-accent)">3D</span></div>
            <div style="font-size:11px;color:var(--r3-dim)">Version 1.0.0</div>
            <div style="font-size:11px;line-height:1.6">Interactive 3D data center rack visualization library. Build, arrange, and inspect rack infrastructure in real time.</div>
            <div class="r3-help-sec" style="margin-top:4px">Details</div>
            <div class="r3-help-row"><span class="r3-help-key">Author</span><span>Rack3D Contributors</span></div>
            <div class="r3-help-row"><span class="r3-help-key">License</span><span>MIT</span></div>
            <div class="r3-help-row"><span class="r3-help-key">Engine</span><span>Three.js r128</span></div>
            <div class="r3-help-row"><span class="r3-help-key">Build</span><span>Rollup · ESM / CJS / UMD</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

    return `${toolbar}${helpModal}<div class="r3-body">${sidebarHtml}${leftHandleHtml}${self._mode==='2d'?view2dHtml:canvasHtml}${self._mode==='2d'?canvasHtml:view2dHtml}${rightHandleHtml}${rightSidebarHtml}</div>`;
  }
}
