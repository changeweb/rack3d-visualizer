// ── GEOMETRY ── rack frame + device meshes

import { hexToRgb } from './constants.js';

export function clearAllRacks(self) {
  if (!self._scene) return;
  const groups = self._rackGroups || {};
  Object.values(groups).forEach(g => {
    g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => { m.map?.dispose(); m.dispose(); });
        else { o.material?.map?.dispose(); o.material?.dispose(); }
      }
    });
    self._scene.remove(g);
  });
  self._rackGroups = {};
  self._devMeshes = {}; self._labelPositions = {};
  Object.values(self._labelDivs || {}).forEach(d => d.remove());
  self._labelDivs = {};
}

export function mk(self, geo, mat, tag) {
  const m = new self._T3.Mesh(geo, mat);
  m.userData.rk = tag || 1;
  m.castShadow = true; m.receiveShadow = true;
  self._scene.add(m); return m;
}

export function buildAllRacks(self) {
  if (!self._scene) return;
  clearAllRacks(self);
  if (!self._room?.racks?.length) return;

  const layout     = self._room.layout || {};
  const colSpacing = layout.colSpacing || 8;
  const rowSpacing = layout.rowSpacing || 10;
  const cols       = layout.cols || 1;
  const rows       = layout.rows || 1;
  const totalW     = (cols - 1) * colSpacing;
  const totalD     = (rows - 1) * rowSpacing;

  self._room.racks.forEach(entry => {
    const gridX = (entry.col || 0) * colSpacing - totalW / 2;
    const gridZ = (entry.row || 0) * rowSpacing - totalD / 2;
    const ox = entry.position?.x ?? gridX;
    const oz = entry.position?.z ?? gridZ;
    const oy = entry.position?.y ?? 0;
    _buildSingleRack(self, entry, ox, oy, oz);
  });

  if (self._opts.camera.distance === 'auto' && self._ctrl.mode !== 'fps') {
    self._ctrl.r = Math.max(22, self._rackH() * 2.2);
  }
  self._posCamera();
}

function mkG(T, geo, mat, tag, group, rackId) {
  const m = new T.Mesh(geo, mat);
  m.userData.rk = tag || 1;
  m.userData.rackId = rackId;
  m.castShadow = true; m.receiveShadow = true;
  group.add(m);
  return m;
}

function _buildSingleRack(self, entry, ox, oy, oz) {
  if (!entry) return;
  const T    = self._T3;
  const r    = entry;
  const ro   = self._opts.rack;
  const tr   = self._theme.rack;
  const UH   = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;
  const H    = (r.units || 24) * UH + 1.3;
  const my   = H / 2;
  const hw   = RW / 2, hd = RD / 2;
  const isSel = entry.id === self._selRackId;

  if (!self._rackGroups) self._rackGroups = {};
  const group = new T.Group();
  group.position.set(ox, oy || 0, oz);
  group.rotation.y = entry.facingAngle || 0;
  group.userData.rk = 'rackgroup';
  group.userData.rackId = entry.id;
  self._scene.add(group);
  self._rackGroups[entry.id] = group;

  const selMix = isSel ? 0.35 : 0;
  const fCol = isSel
    ? new T.Color(tr.frameColor).lerp(new T.Color(0x1155cc), selMix).getHex()
    : tr.frameColor;
  const steel = c => new T.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.85, wireframe: self._showWire });

  const mkR = (geo, mat, tag) => mkG(T, geo, mat, tag, group, entry.id);
  const P = (m, x, y, z) => { m.position.set(x, y, z); return m; };

  // Corner posts
  [[1,-1],[-1,-1],[1,1],[-1,1]].forEach(([sx,sz]) => {
    P(mkR(new T.BoxGeometry(POST, H, POST), steel(fCol), 'frame'), sx*(hw-POST/2), my, sz*(hd-POST/2));
  });

  // Top / bottom crossbars
  [0.04, H - 0.04].forEach(y => {
    [[new T.BoxGeometry(RW,0.08,0.12),[0,y,-hd+0.06]],[new T.BoxGeometry(RW,0.08,0.12),[0,y,hd-0.06]],
     [new T.BoxGeometry(0.12,0.08,RD),[-hw+0.06,y,0]],[new T.BoxGeometry(0.12,0.08,RD),[hw-0.06,y,0]]
    ].forEach(([g,pos]) => P(mkR(g, steel(fCol), 'frame'), ...pos));
  });

  // Mid crossbars every 8U
  for (let i = 1; i < r.units; i += 8) {
    const y = 0.6 + i * UH;
    const dm = steel(tr.postColor);
    [-hd+0.06, hd-0.06].forEach(z => P(mkR(new T.BoxGeometry(RW,0.05,0.1), dm, 'frame'), 0, y, z));
    [-hw+0.06, hw-0.06].forEach(x => P(mkR(new T.BoxGeometry(0.1,0.05,RD), dm, 'frame'), x, y, 0));
  }

  // Rails + screws + unit labels
  const railMat = steel(tr.railColor);
  const nutMat  = new T.MeshStandardMaterial({ color:0x3a4f68, roughness:0.3, metalness:1.0, wireframe:self._showWire });
  for (let i = 0; i <= r.units; i++) {
    const y = 0.6 + i * UH;
    [-hw+POST, hw-POST].forEach(x => {
      P(mkR(new T.BoxGeometry(0.04,0.022,0.14), railMat, 'rail'), x, y, -hd+0.2);
      P(mkR(new T.BoxGeometry(0.04,0.022,0.14), railMat, 'rail'), x, y,  hd-0.2);
    });
    if (i < r.units) {
      [-hw+0.22, hw-0.22].forEach(x => {
        const n = mkR(new T.CylinderGeometry(0.025,0.025,0.04,6), nutMat, 'nut');
        n.rotation.x = Math.PI/2; P(n, x, y+UH*0.5, -hd+0.06);
      });
      _makeUnitLabelInGroup(self, T, i+1, y, hw, hd, UH, group, entry.id);
    }
  }

  // Side panels
  if (ro.showSidePanels) {
    const sp = new T.MeshStandardMaterial({color:0x0f1622,roughness:0.7,metalness:0.5,transparent:true,opacity:0.92,wireframe:self._showWire});
    [-1,1].forEach(s => P(mkR(new T.BoxGeometry(0.02,H-0.2,RD-POST*2), sp, 'panel'), s*(hw-POST), my, 0));
  }
  if (ro.showRearPanel) {
    const rp = new T.MeshStandardMaterial({color:0x0c1420,roughness:0.8,metalness:0.4,wireframe:self._showWire});
    P(mkR(new T.BoxGeometry(RW-POST*2,H-0.2,0.02), rp, 'panel'), 0, my, hd-POST);
  }
  if (ro.showNameplate) {
    const nm = new T.MeshStandardMaterial({color:0x1a2a3f,roughness:0.5,metalness:0.7,emissive:new T.Color(0x003355),emissiveIntensity:0.4,wireframe:self._showWire});
    P(mkR(new T.BoxGeometry(RW-POST*3,0.22,0.04), nm, 'nameplate'), 0, H-0.2, -hd+0.03);
  }

  // Rack name label above rack
  _buildRackNameLabel(self, T, entry, H, hw, hd, ro, isSel, group);

  // Devices
  const sorted = (r.devices || []).slice().sort((a,b) => a.startUnit - b.startUnit);
  sorted.forEach((dev, idx) => _buildDeviceInGroup(self, T, dev, idx, hw, hd, group, entry));
}

function _buildRackNameLabel(self, T, entry, H, hw, hd, ro, isSel, group) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isSel ? 'rgba(17,85,200,0.9)' : 'rgba(8,16,32,0.88)';
  ctx.beginPath(); ctx.roundRect(4, 4, 504, 120, 14); ctx.fill();
  ctx.strokeStyle = isSel ? '#4499ff' : '#2a4a6a';
  ctx.lineWidth = isSel ? 4 : 2; ctx.stroke();

  ctx.fillStyle = isSel ? '#79c0ff' : '#88bbdd';
  ctx.font = 'bold 64px "Courier New",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(entry.name || entry.id, 256, 64);

  const tex = new T.CanvasTexture(canvas);
  const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.FrontSide });
  const planeW = ro.width * 0.88;
  const planeH = planeW * (128 / 512);
  const mesh = new T.Mesh(new T.PlaneGeometry(planeW, planeH), mat);
  mesh.userData.rk = 'racklabel';
  mesh.userData.rackId = entry.id;
  mesh.position.set(0, H + planeH * 0.5 + 0.2, -hd + 0.02);
  mesh.rotation.y = Math.PI; // face toward front (-Z), matching camera's default view
  group.add(mesh);
}

function _makeUnitLabelInGroup(self, T, unitNum, y, hw, hd, UH, group, rackId) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size * 2; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(10,20,35,0.72)';
  ctx.beginPath(); ctx.roundRect(4,4,canvas.width-8,canvas.height-8,12); ctx.fill();
  ctx.fillStyle = '#a8c8e8';
  ctx.font = `bold ${size*0.56}px "Share Tech Mono","Courier New",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(unitNum), canvas.width/2, canvas.height/2);
  const tex = new T.CanvasTexture(canvas); tex.needsUpdate = true;
  const mat = new T.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false, side:T.DoubleSide });
  const planeH = UH*0.7, planeW = planeH*2;
  const mesh = new T.Mesh(new T.PlaneGeometry(planeW, planeH), mat);
  mesh.userData.rk = 'unitlabel';
  mesh.userData.rackId = rackId;
  mesh.position.set(-hw+0.10, y+UH*0.5, -hd-0.05);
  mesh.rotation.y = Math.PI;
  group.add(mesh);
}

function _buildDeviceInGroup(self, T, dev, idx, hw, hd, group, entry) {
  const rackId = entry.id;
  const ro = self._opts.rack;
  const lo = self._opts.labels;
  const UH = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;

  const isHalfLeft  = dev.halfWidth === 'left';
  const isHalfRight = dev.halfWidth === 'right';
  const isHalf      = isHalfLeft || isHalfRight;
  const fullW       = RW - POST*2 - 0.06;
  const dw  = isHalf ? (fullW/2 - 0.04) : fullW;
  const xOff = isHalf ? (isHalfLeft ? -(fullW/4+0.02) : (fullW/4+0.02)) : 0;

  const dh = dev.heightUnits*UH - 0.07;
  const dd = RD - POST*2 - 0.1;
  const y  = 0.6 + (dev.startUnit-1)*UH + dh/2 + 0.035;
  const isSel = self._selId === dev.id;

  const typeInfo = self._types[dev.type] || self._types.server;
  const rawCol = dev.color || typeInfo.color;
  const rawHex = typeInfo.hex;
  const rgb = hexToRgb(rawCol);

  const P = (m, x, yv, z) => { m.position.set(x, yv, z); return m; };
  const mkD = (geo, mat, tag) => {
    const m = new T.Mesh(geo, mat);
    m.userData.rk = tag || 'dev';
    m.userData.deviceId = dev.id;
    m.userData.rackId = rackId;
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const bodyCol = new T.Color(...rgb.map(c => c*0.12+0.02));
  P(mkD(new T.BoxGeometry(dw,dh,dd),
    new T.MeshStandardMaterial({color:bodyCol,roughness:0.45,metalness:0.65,wireframe:self._showWire}), 'dev'),
    xOff, y, 0);

  const bezelCol = new T.Color(...rgb.map(c => c*0.28+0.04));
  P(mkD(new T.BoxGeometry(dw,dh,0.04),
    new T.MeshStandardMaterial({color:bezelCol,roughness:0.3,metalness:0.75,wireframe:self._showWire}), 'face'),
    xOff, y, -hd+POST+0.07);

  const faceW = dw-0.08, faceH = dh-0.08;
  const panelCol = new T.Color(...rgb.map(c => Math.min(1, c*0.65+0.06)));
  const panMat = new T.MeshStandardMaterial({
    color:panelCol, roughness:0.18, metalness:0.25, wireframe:self._showWire,
    emissive:new T.Color(rawHex), emissiveIntensity: isSel ? 1.0 : 0.55,
  });
  const panel = mkD(new T.BoxGeometry(faceW,faceH,0.02), panMat, 'face');
  P(panel, xOff, y, -hd+POST+0.09);
  self._devMeshes[dev.id] = panel;

  if (dev.imageUrl) {
    const imgMat = new T.MeshBasicMaterial({ transparent:true, depthWrite:false, side:T.BackSide });
    const imgPlane = new T.Mesh(new T.PlaneGeometry(faceW, faceH), imgMat);
    imgPlane.position.set(xOff, y, -hd+0.04);
    imgPlane.userData.rk = 'devimage'; imgPlane.userData.deviceId = dev.id; imgPlane.userData.rackId = rackId;
    imgPlane.renderOrder = 999; imgPlane.material.depthTest = false; imgPlane.scale.x = -1;
    group.add(imgPlane);
    new T.TextureLoader().load(dev.imageUrl, tex => {
      tex.encoding = 3001; tex.anisotropy = Math.min(4, self._ren?.capabilities?.getMaxAnisotropy?.() || 1);
      imgMat.map = tex; imgMat.needsUpdate = true;
    }, undefined, err => console.warn('[Rack3D] Could not load device image:', dev.imageUrl, err));
  }

  if (dev.imageUrlRear) {
    const rearMat = new T.MeshBasicMaterial({ transparent:true, depthWrite:false, side:T.FrontSide });
    const rearPlane = new T.Mesh(new T.PlaneGeometry(faceW, faceH), rearMat);
    rearPlane.position.set(xOff, y, hd-0.04);
    rearPlane.userData.rk = 'devimage'; rearPlane.userData.deviceId = dev.id; rearPlane.userData.rackId = rackId;
    rearPlane.renderOrder = 999; rearPlane.material.depthTest = false;
    group.add(rearPlane);
    new T.TextureLoader().load(dev.imageUrlRear, tex => {
      tex.encoding = 3001; tex.anisotropy = Math.min(4, self._ren?.capabilities?.getMaxAnisotropy?.() || 1);
      rearMat.map = tex; rearMat.needsUpdate = true;
    });
  }

  const stripMat = new T.MeshStandardMaterial({
    color:new T.Color(rawHex), roughness:0.1, emissive:new T.Color(rawHex), emissiveIntensity:1.2
  });
  P(mkD(new T.BoxGeometry(faceW, Math.min(0.06,faceH*0.18), 0.015), stripMat, 'strip'),
    xOff, y+faceH/2-0.04, -hd+POST+0.1);

  const ledCols = [0x00ff88, 0xff4400, 0x00aaff];
  const ln = Math.min(dev.heightUnits*4, 10);
  for (let l = 0; l < ln; l++) {
    const lc = ledCols[l%3];
    const lm = new T.MeshStandardMaterial({color:lc, emissive:new T.Color(lc), emissiveIntensity:3});
    const led = mkD(new T.SphereGeometry(0.028,8,8), lm, 'led');
    P(led, xOff-faceW/2+0.1+l*(faceW/(ln+1)), y, -hd+POST+0.11);
  }

  if ((dev.type==='server'||dev.type==='storage') && dev.heightUnits>=2) {
    const bm = new T.MeshStandardMaterial({color:0x0c1220,roughness:0.85,metalness:0.5,wireframe:self._showWire});
    const hm = new T.MeshStandardMaterial({color:0x1e2e44,roughness:0.4,metalness:0.9,wireframe:self._showWire});
    const bayCount = isHalf?2:4, rows2 = Math.min(dev.heightUnits,3);
    const bW = (faceW-0.15)/bayCount, bH = Math.min((faceH-0.25)/rows2, 0.18);
    for (let ri=0;ri<rows2;ri++) for (let c=0;c<bayCount;c++) {
      const bx = xOff-faceW/2+0.08+c*bW+bW/2;
      const by = y+faceH/2-0.15-ri*(bH+0.03);
      const bz = -hd+POST+0.105;
      P(mkD(new T.BoxGeometry(bW-0.03,bH,0.022), bm, 'bay'), bx, by, bz);
      P(mkD(new T.BoxGeometry(bW-0.06,0.02,0.015), hm, 'bay'), bx, by+bH/2-0.02, bz-0.013);
    }
  }

  if (['switch','router','firewall','patch'].includes(dev.type)) {
    const pm  = new T.MeshStandardMaterial({color:0x0a1018,roughness:0.9,wireframe:self._showWire});
    const pam = new T.MeshStandardMaterial({color:0x002a44,roughness:0.5,emissive:new T.Color(0x0044aa),emissiveIntensity:0.5,wireframe:self._showWire});
    const nP  = dev.type==='patch'?(isHalf?12:24):dev.type==='switch'?(isHalf?6:12):(isHalf?3:6);
    const pW  = Math.min((faceW-0.2)/nP,0.15), pH = Math.min(faceH*0.4,0.08);
    for (let p=0;p<nP;p++) {
      const px = xOff-faceW/2+0.1+p*(pW+0.01)+pW/2;
      P(mkD(new T.BoxGeometry(pW,pH,0.02), Math.random()>0.3?pam:pm, 'port'), px, y-faceH*0.05, -hd+POST+0.11);
    }
  }

  if (dev.heightUnits>=2) {
    const vm = new T.MeshStandardMaterial({color:0x060a10,roughness:0.95,wireframe:self._showWire});
    const nv = Math.min(dev.heightUnits*2,8);
    for (let v=0;v<nv;v++) {
      P(mkD(new T.BoxGeometry(dw*0.55,0.02,dd*0.35), vm, 'vent'), xOff+dw*0.08, y-dh/2+0.06+v*0.15, 0.1);
    }
  }

  const side = isHalf
    ? (isHalfLeft?'left':'right')
    : (lo.side==='auto'?(idx%2===0?'left':'right'):lo.side);
  const lx = side==='left' ? -hw : hw;

  // Compute world position accounting for facingAngle
  const angle = entry.facingAngle || 0;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const lz = -hd + 0.2;
  const worldX = lx*cosA + lz*sinA + group.position.x;
  const worldZ = -lx*sinA + lz*cosA + group.position.z;
  self._labelPositions[dev.id] = { pos: new T.Vector3(worldX, y, worldZ), side };
  self._createLabel(dev, rawCol, side);
}

// Keep exported wrappers for backward compat / public API
export function makeUnitLabel(self, unitNum, y, hw, hd, UH, POST, ox, oz, rackId) {
  const T = self._T3;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size * 2; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(10,20,35,0.72)';
  ctx.beginPath(); ctx.roundRect(4,4,canvas.width-8,canvas.height-8,12); ctx.fill();
  ctx.fillStyle = '#a8c8e8';
  ctx.font = `bold ${size*0.56}px "Share Tech Mono","Courier New",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(unitNum), canvas.width/2, canvas.height/2);
  const tex = new T.CanvasTexture(canvas); tex.needsUpdate = true;
  const mat = new T.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false, side:T.DoubleSide });
  const planeH = UH*0.7, planeW = planeH*2;
  const mesh = new T.Mesh(new T.PlaneGeometry(planeW, planeH), mat);
  mesh.userData.rk = 'unitlabel';
  if (rackId) mesh.userData.rackId = rackId;
  mesh.position.set(-hw+0.10+ox, y+UH*0.5, -hd-0.05+oz);
  mesh.rotation.y = Math.PI;
  self._scene.add(mesh);
  return mesh;
}

export function buildDevice(self, dev, idx, ox, oz, rackId) {
  const group = self._rackGroups?.[rackId];
  if (group) {
    const ro = self._opts.rack;
    const entry = self._room?.racks?.find(r => r.id === rackId) || { id: rackId };
    _buildDeviceInGroup(self, self._T3, dev, idx, ro.width/2, ro.depth/2, group, entry);
    return;
  }
  // Fallback (no group): add directly to scene with offsets
  ox = ox || 0; oz = oz || 0;
  const T = self._T3;
  const ro = self._opts.rack;
  const hw = ro.width/2, hd = ro.depth/2;
  const mkD2 = (geo, mat, tag) => {
    const m = mk(self, geo, mat, tag);
    m.userData.deviceId = dev.id;
    if (rackId) m.userData.rackId = rackId;
    return m;
  };
  const bodyCol = new T.Color(0x0a1520);
  const mesh = mkD2(new T.BoxGeometry(ro.width-ro.postSize*2-0.06, dev.heightUnits*ro.unitHeight-0.07, ro.depth-ro.postSize*2-0.1),
    new T.MeshStandardMaterial({color:bodyCol,roughness:0.45,metalness:0.65}), 'dev');
  mesh.position.set(ox, 0.6+(dev.startUnit-1)*ro.unitHeight+(dev.heightUnits*ro.unitHeight-0.07)/2+0.035, oz);
  self._devMeshes[dev.id] = mesh;
}
