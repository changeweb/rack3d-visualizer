// ── GEOMETRY ── rack frame + device meshes

import { hexToRgb } from './constants.js';

export function clearRack(self) {
  if (!self._scene) return;
  const rem = [];
  self._scene.traverse(o => { if (o.isMesh && o.userData.rk) rem.push(o); });
  rem.forEach(o => {
    self._scene.remove(o);
    o.geometry?.dispose();
    if (Array.isArray(o.material)) {
      o.material.forEach(m => { m.map?.dispose(); m.dispose(); });
    } else {
      o.material?.map?.dispose();
      o.material?.dispose();
    }
  });
  self._devMeshes = {}; self._labelPositions = {};
  Object.values(self._labelDivs).forEach(d => d.remove());
  self._labelDivs = {};
}

export function mk(self, geo, mat, tag) {
  const m = new self._T3.Mesh(geo, mat);
  m.userData.rk = tag || 1;
  m.castShadow = true; m.receiveShadow = true;
  self._scene.add(m); return m;
}

export function buildRack(self) {
  if (!self._rack || !self._scene) return;
  clearRack(self);
  const T  = self._T3;
  const r  = self._rack;
  const ro = self._opts.rack;
  const tr = self._theme.rack;
  const UH = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;
  const H  = self._rackH(), my = self._midY();
  const hw = RW / 2, hd = RD / 2;

  const steel = c => new T.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.85, wireframe: self._showWire });

  // Corner posts
  [[1,-1],[-1,-1],[1,1],[-1,1]].forEach(([sx,sz]) => {
    const p = mk(self, new T.BoxGeometry(POST, H, POST), steel(tr.frameColor), 'frame');
    p.position.set(sx * (hw - POST / 2), my, sz * (hd - POST / 2));
  });

  // Top / bottom crossbars
  [0.04, H - 0.04].forEach(y => {
    [[new T.BoxGeometry(RW, 0.08, 0.12), [0, y, -hd + 0.06]],
     [new T.BoxGeometry(RW, 0.08, 0.12), [0, y,  hd - 0.06]],
     [new T.BoxGeometry(0.12, 0.08, RD), [-hw + 0.06, y, 0]],
     [new T.BoxGeometry(0.12, 0.08, RD), [ hw - 0.06, y, 0]]
    ].forEach(([g, pos]) => {
      const m = mk(self, g, steel(tr.frameColor), 'frame');
      m.position.set(...pos);
    });
  });

  // Mid crossbars every 8U
  for (let i = 1; i < r.units; i += 8) {
    const y = 0.6 + i * UH;
    const dm = steel(tr.postColor);
    [[-hd + 0.06, hd - 0.06]].flat().forEach(z => {
      const b = mk(self, new T.BoxGeometry(RW, 0.05, 0.1), dm, 'frame'); b.position.set(0, y, z);
    });
    [[-hw + 0.06, hw - 0.06]].flat().forEach(x => {
      const b = mk(self, new T.BoxGeometry(0.1, 0.05, RD), dm, 'frame'); b.position.set(x, y, 0);
    });
  }

  // Rails + screws + unit-number labels
  const railMat = steel(tr.railColor);
  const nutMat  = new T.MeshStandardMaterial({ color: 0x3a4f68, roughness: 0.3, metalness: 1.0, wireframe: self._showWire });
  for (let i = 0; i <= r.units; i++) {
    const y = 0.6 + i * UH;
    [-hw + POST, hw - POST].forEach(x => {
      const rf = mk(self, new T.BoxGeometry(0.04, 0.022, 0.14), railMat, 'rail'); rf.position.set(x, y, -hd + 0.2);
      const rr = mk(self, new T.BoxGeometry(0.04, 0.022, 0.14), railMat, 'rail'); rr.position.set(x, y,  hd - 0.2);
    });
    if (i < r.units) {
      [-hw + 0.22, hw - 0.22].forEach(x => {
        const n = mk(self, new T.CylinderGeometry(0.025, 0.025, 0.04, 6), nutMat, 'nut');
        n.rotation.x = Math.PI / 2; n.position.set(x, y + UH * 0.5, -hd + 0.06);
      });
      const unitNum = i + 1;
      makeUnitLabel(self, unitNum, y, hw, hd, UH, POST);
    }
  }

  // Side panels
  if (ro.showSidePanels) {
    const sp = new T.MeshStandardMaterial({ color: 0x0f1622, roughness: 0.7, metalness: 0.5, transparent: true, opacity: 0.92, wireframe: self._showWire });
    [-1, 1].forEach(s => {
      const m = mk(self, new T.BoxGeometry(0.02, H - 0.2, RD - POST * 2), sp, 'panel');
      m.position.set(s * (hw - POST), my, 0);
    });
  }
  if (ro.showRearPanel) {
    const rp = new T.MeshStandardMaterial({ color: 0x0c1420, roughness: 0.8, metalness: 0.4, wireframe: self._showWire });
    mk(self, new T.BoxGeometry(RW - POST * 2, H - 0.2, 0.02), rp, 'panel').position.set(0, my, hd - POST);
  }
  if (ro.showNameplate) {
    const nm = new T.MeshStandardMaterial({ color: 0x1a2a3f, roughness: 0.5, metalness: 0.7, emissive: new T.Color(0x003355), emissiveIntensity: 0.4, wireframe: self._showWire });
    mk(self, new T.BoxGeometry(RW - POST * 3, 0.22, 0.04), nm, 'nameplate').position.set(0, H - 0.2, -hd + 0.03);
  }

  // Devices
  const sorted = r.devices.slice().sort((a, b) => a.startUnit - b.startUnit);
  sorted.forEach((dev, idx) => buildDevice(self, dev, idx));

  // Camera auto-distance
  if (self._opts.camera.distance === 'auto') {
    self._ctrl.r = Math.max(22, H * 2.2);
  }
  self._posCamera();
}

export function makeUnitLabel(self, unitNum, y, hw, hd, UH, POST) {
  const T    = self._T3;
  const size = 128;

  const canvas  = document.createElement('canvas');
  canvas.width  = size * 2;
  canvas.height = size;
  const ctx     = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(10,20,35,0.72)';
  const rx = 12;
  ctx.beginPath();
  ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, rx);
  ctx.fill();

  ctx.fillStyle    = '#a8c8e8';
  ctx.font         = `bold ${size * 0.56}px "Share Tech Mono", "Courier New", monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(unitNum), canvas.width / 2, canvas.height / 2);

  const tex       = new T.CanvasTexture(canvas);
  tex.needsUpdate = true;

  const mat = new T.MeshBasicMaterial({
    map:         tex,
    transparent: true,
    depthWrite:  false,
    side:        T.DoubleSide,
  });

  const planeH = UH * 0.7;
  const planeW = planeH * 2;
  const mesh   = new T.Mesh(new T.PlaneGeometry(planeW, planeH), mat);
  mesh.userData.rk = 'unitlabel';

  const unitMidY = y + UH * 0.5;
  mesh.position.set(-hw + 0.10, unitMidY, -hd - 0.05);
  mesh.rotation.y = Math.PI;

  self._scene.add(mesh);
  return mesh;
}

export function buildDevice(self, dev, idx) {
  const T  = self._T3;
  const ro = self._opts.rack;
  const lo = self._opts.labels;
  const UH = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;
  const hd = RD / 2;
  const hw = RW / 2;

  // Half-width support
  const isHalfLeft  = dev.halfWidth === 'left';
  const isHalfRight = dev.halfWidth === 'right';
  const isHalf      = isHalfLeft || isHalfRight;
  const fullW       = RW - POST * 2 - 0.06;
  const dw  = isHalf ? (fullW / 2 - 0.04) : fullW;
  const xOff = isHalf ? (isHalfLeft ? -(fullW / 4 + 0.02) : (fullW / 4 + 0.02)) : 0;

  const dh = dev.heightUnits * UH - 0.07;
  const dd = RD - POST * 2 - 0.1;
  const y  = 0.6 + (dev.startUnit - 1) * UH + dh / 2 + 0.035;
  const isSel = self._selId === dev.id;

  const typeInfo = self._types[dev.type] || self._types.server;
  const rawCol = dev.color || typeInfo.color;
  const rawHex = typeInfo.hex;
  const rgb    = hexToRgb(rawCol);

  const bodyCol = new T.Color(...rgb.map(c => c * 0.12 + 0.02));
  const body = mk(self, new T.BoxGeometry(dw, dh, dd),
    new T.MeshStandardMaterial({ color: bodyCol, roughness: 0.45, metalness: 0.65, wireframe: self._showWire }),
    'dev');
  body.position.set(xOff, y, 0); body.userData.deviceId = dev.id;

  // Front bezel
  const bezelCol = new T.Color(...rgb.map(c => c * 0.28 + 0.04));
  const bezel = mk(self, new T.BoxGeometry(dw, dh, 0.04),
    new T.MeshStandardMaterial({ color: bezelCol, roughness: 0.3, metalness: 0.75, wireframe: self._showWire }),
    'face');
  bezel.position.set(xOff, y, -hd + POST + 0.07); bezel.userData.deviceId = dev.id;

  // Front panel
  const faceW = dw - 0.08, faceH = dh - 0.08;
  const panelCol = new T.Color(...rgb.map(c => Math.min(1, c * 0.65 + 0.06)));

  const panMat = new T.MeshStandardMaterial({
    color:             panelCol,
    roughness:         0.18,
    metalness:         0.25,
    wireframe:         self._showWire,
    emissive:          new T.Color(rawHex),
    emissiveIntensity: isSel ? 1.0 : 0.55,
  });

  const panel = mk(self, new T.BoxGeometry(faceW, faceH, 0.02), panMat, 'face');
  panel.position.set(xOff, y, -hd + POST + 0.09); panel.userData.deviceId = dev.id;
  self._devMeshes[dev.id] = panel;

  if (dev.imageUrl) {
    const imgMat = new T.MeshBasicMaterial({
      transparent: true,
      depthWrite:  false,
      side:        T.BackSide,
    });
    const imgPlane = new T.Mesh(new T.PlaneGeometry(faceW, faceH), imgMat);
    imgPlane.position.set(xOff, y, -hd + 0.04);
    imgPlane.userData.rk = 'devimage';
    imgPlane.userData.deviceId = dev.id;
    imgPlane.renderOrder = 999;
    imgPlane.material.depthTest = false;
    imgPlane.scale.x = -1;
    self._scene.add(imgPlane);

    const loader = new T.TextureLoader();
    loader.load(
      dev.imageUrl,
      (tex) => {
        tex.encoding    = 3001;
        tex.anisotropy  = Math.min(4, self._ren?.capabilities?.getMaxAnisotropy?.() || 1);
        imgMat.map      = tex;
        imgMat.needsUpdate = true;
      },
      undefined,
      (err) => console.warn('[Rack3D] Could not load device image:', dev.imageUrl, err)
    );
  }

  if (dev.imageUrlRear) {
    const rearMat = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.FrontSide });
    const rearPlane = new T.Mesh(new T.PlaneGeometry(faceW, faceH), rearMat);
    rearPlane.position.set(xOff, y, hd - 0.04);
    rearPlane.userData.rk = 'devimage';
    rearPlane.userData.deviceId = dev.id;
    rearPlane.renderOrder = 999;
    rearPlane.material.depthTest = false;
    self._scene.add(rearPlane);
    new T.TextureLoader().load(dev.imageUrlRear, tex => {
      tex.encoding = 3001; tex.anisotropy = Math.min(4, self._ren?.capabilities?.getMaxAnisotropy?.() || 1);
      rearMat.map = tex; rearMat.needsUpdate = true;
    });
  }

  // Status strip
  const stripMat = new T.MeshStandardMaterial({
    color: new T.Color(rawHex), roughness: 0.1, emissive: new T.Color(rawHex), emissiveIntensity: 1.2,
  });
  mk(self, new T.BoxGeometry(faceW, Math.min(0.06, faceH * 0.18), 0.015), stripMat, 'strip')
    .position.set(xOff, y + faceH / 2 - 0.04, -hd + POST + 0.1);

  // LEDs
  const ledCols = [0x00ff88, 0xff4400, 0x00aaff];
  const ln = Math.min(dev.heightUnits * 4, 10);
  for (let l = 0; l < ln; l++) {
    const lc = ledCols[l % 3];
    const lm = new T.MeshStandardMaterial({ color: lc, emissive: new T.Color(lc), emissiveIntensity: 3 });
    const led = mk(self, new T.SphereGeometry(0.028, 8, 8), lm, 'led');
    led.position.set(xOff - faceW / 2 + 0.1 + l * (faceW / (ln + 1)), y, -hd + POST + 0.11);
  }

  // Drive bays
  if ((dev.type === 'server' || dev.type === 'storage') && dev.heightUnits >= 2) {
    const bm = new T.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.85, metalness: 0.5, wireframe: self._showWire });
    const hm = new T.MeshStandardMaterial({ color: 0x1e2e44, roughness: 0.4, metalness: 0.9, wireframe: self._showWire });
    const bayCount = isHalf ? 2 : 4;
    const rows = Math.min(dev.heightUnits, 3);
    const bW = (faceW - 0.15) / bayCount, bH = Math.min((faceH - 0.25) / rows, 0.18);
    for (let r = 0; r < rows; r++) for (let c = 0; c < bayCount; c++) {
      const bx = xOff - faceW / 2 + 0.08 + c * bW + bW / 2;
      const by = y + faceH / 2 - 0.15 - r * (bH + 0.03);
      const bz = -hd + POST + 0.105;
      const bay = mk(self, new T.BoxGeometry(bW - 0.03, bH, 0.022), bm, 'bay');
      bay.position.set(bx, by, bz);
      const hand = mk(self, new T.BoxGeometry(bW - 0.06, 0.02, 0.015), hm, 'bay');
      hand.position.set(bx, by + bH / 2 - 0.02, bz - 0.013);
    }
  }

  // Port grids
  if (['switch', 'router', 'firewall', 'patch'].includes(dev.type)) {
    const pm  = new T.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.9, wireframe: self._showWire });
    const pam = new T.MeshStandardMaterial({ color: 0x002a44, roughness: 0.5, emissive: new T.Color(0x0044aa), emissiveIntensity: 0.5, wireframe: self._showWire });
    const nP  = dev.type === 'patch' ? (isHalf ? 12 : 24) : dev.type === 'switch' ? (isHalf ? 6 : 12) : (isHalf ? 3 : 6);
    const pW  = Math.min((faceW - 0.2) / nP, 0.15), pH = Math.min(faceH * 0.4, 0.08);
    for (let p = 0; p < nP; p++) {
      const px = xOff - faceW / 2 + 0.1 + p * (pW + 0.01) + pW / 2;
      const port = mk(self, new T.BoxGeometry(pW, pH, 0.02), Math.random() > 0.3 ? pam : pm, 'port');
      port.position.set(px, y - faceH * 0.05, -hd + POST + 0.11);
    }
  }

  // Vent slots
  if (dev.heightUnits >= 2) {
    const vm = new T.MeshStandardMaterial({ color: 0x060a10, roughness: 0.95, wireframe: self._showWire });
    const nv = Math.min(dev.heightUnits * 2, 8);
    for (let v = 0; v < nv; v++) {
      const vent = mk(self, new T.BoxGeometry(dw * 0.55, 0.02, dd * 0.35), vm, 'vent');
      vent.position.set(xOff + dw * 0.08, y - dh / 2 + 0.06 + v * 0.15, 0.1);
    }
  }

  // Label
  const side = isHalf
    ? (isHalfLeft ? 'left' : 'right')
    : (lo.side === 'auto' ? (idx % 2 === 0 ? 'left' : 'right') : lo.side);
  const lx = side === 'left' ? -(hw) : (hw);
  self._labelPositions[dev.id] = { pos: new T.Vector3(lx, y, -hd + 0.2), side };
  self._createLabel(dev, rawCol, side);
}
