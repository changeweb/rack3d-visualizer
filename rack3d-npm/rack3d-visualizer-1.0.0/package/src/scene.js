// ── SCENE ── lights + environment

export function buildLights(self) {
  const T  = self._T3;
  const sc = self._scene;
  const lo = self._opts.lighting;
  const ts = self._theme.scene;

  sc.add(new T.AmbientLight(lo.ambientColor ?? ts.ambientColor, lo.ambientIntensity ?? ts.ambientIntensity));

  const cnt = Math.max(2, Math.min(12, lo.overheadCount));
  const positions = [];
  const cols = Math.ceil(Math.sqrt(cnt)), rows = Math.ceil(cnt / cols);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (positions.length >= cnt) break;
    positions.push([(c - (cols-1)/2) * 7, (r - (rows-1)/2) * 6]);
  }
  positions.forEach(([x, z], idx) => {
    const fl = new T.DirectionalLight(0xf8fbff, lo.overheadIntensity ?? ts.overheadIntensity);
    fl.position.set(x, 22, z);
    if (lo.shadows && idx < 2) {
      fl.castShadow = true;
      fl.shadow.mapSize.set(512, 512);
      fl.shadow.camera.near = 1; fl.shadow.camera.far = 80;
      fl.shadow.camera.left = -18; fl.shadow.camera.right = 18;
      fl.shadow.camera.top = 32; fl.shadow.camera.bottom = -5;
      fl.shadow.bias = -0.0005;
    }
    sc.add(fl);
  });

  const front = new T.DirectionalLight(0xffffff, lo.frontIntensity ?? ts.frontLightIntensity);
  front.position.set(0, 10, 18); sc.add(front);

  const fi = lo.fillIntensity ?? 6.0;
  [[-20, 8, 4], [20, 8, 4], [0, 30, 0], [0, 10, -16]].forEach(([x, y, z], i) => {
    const l = new T.DirectionalLight(i < 2 ? 0xe8f4ff : 0xffffff, i === 2 ? fi + 1 : fi);
    l.position.set(x, y, z); sc.add(l);
  });
  [[-18, 6, 0], [18, 6, 0], [0, 6, -16], [0, 6, 14]].forEach(([x, y, z]) => {
    const l = new T.DirectionalLight(0xd8eaff, 3.5); l.position.set(x, y, z); sc.add(l);
  });
  [[-5, 0.2, 2], [5, 0.2, 2], [0, 0.2, 8]].forEach(([x, y, z]) => {
    const pl = new T.PointLight(0x5588ee, lo.floorGlowIntensity ?? 3.0, 22);
    pl.position.set(x, y, z); sc.add(pl);
  });
  const glow = new T.PointLight(0x3377ff, lo.rackGlowIntensity ?? 6.0, 14);
  glow.position.set(0, self._midY(), 0); sc.add(glow);
}

export function buildEnvironment(self) {
  const T  = self._T3;
  const sc = self._scene;
  const ro = self._opts.room;
  const ts = self._theme.scene;
  const W = ro.width, D = ro.depth, H = ro.height, ts2 = ro.tileSize;
  const cx = 0, cz = 2;

  const floorMat = new T.MeshStandardMaterial({ color: ts.floorColor, roughness: 0.65, metalness: 0.25 });
  const wallMat  = new T.MeshStandardMaterial({ color: ts.wallColor,  roughness: 0.8,  metalness: 0.05 });
  const ceilMat  = new T.MeshStandardMaterial({ color: ts.ceilColor,  roughness: 0.85, metalness: 0.02 });

  const floor = new T.Mesh(new T.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(cx, -0.01, cz);
  floor.receiveShadow = true; sc.add(floor);

  if (ro.floorTiles) {
    const gm = new T.LineBasicMaterial({ color: 0x3a5070 });
    const hw = W / 2, hd = D / 2;
    for (let i = 0; i <= Math.ceil(W / ts2); i++) {
      const x = -hw + i * ts2 + cx;
      const g = new T.BufferGeometry().setFromPoints([new T.Vector3(x, 0.001, -hd + cz), new T.Vector3(x, 0.001, hd + cz)]);
      sc.add(new T.Line(g, gm));
    }
    for (let j = 0; j <= Math.ceil(D / ts2); j++) {
      const z = -hd + j * ts2 + cz;
      const g = new T.BufferGeometry().setFromPoints([new T.Vector3(-hw + cx, 0.001, z), new T.Vector3(hw + cx, 0.001, z)]);
      sc.add(new T.Line(g, gm));
    }
    const pm = new T.MeshStandardMaterial({ color: 0x243040, roughness: 0.6, metalness: 0.35 });
    for (let pi = -Math.floor(W / 2 / ts2); pi <= Math.floor(W / 2 / ts2); pi++)
      for (let pj = -Math.floor(D / 2 / ts2); pj <= Math.floor(D / 2 / ts2); pj++) {
        const p = new T.Mesh(new T.BoxGeometry(ts2 - 0.03, 0.04, ts2 - 0.03), pm);
        p.position.set(pi * ts2 + cx, 0.02, pj * ts2 + cz); sc.add(p);
      }
  }

  const ceil = new T.Mesh(new T.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); sc.add(ceil);

  if (ro.ceilingGrid) {
    const tgm = new T.LineBasicMaterial({ color: 0x4a6080 });
    const tw = 1.2, hw = W / 2, hd = D / 2;
    for (let i = 0; i <= Math.ceil(W / tw); i++) {
      const x = -hw + i * tw + cx;
      const g = new T.BufferGeometry().setFromPoints([new T.Vector3(x, H - 0.01, -hd + cz), new T.Vector3(x, H - 0.01, hd + cz)]);
      sc.add(new T.Line(g, tgm));
    }
  }

  // Walls
  const bw = new T.Mesh(new T.PlaneGeometry(W, H), wallMat);
  bw.position.set(cx, H / 2, cz + D / 2); sc.add(bw);
  const fm = new T.MeshStandardMaterial({ color: 0x1e2d40, transparent: true, opacity: 0.2, side: T.BackSide });
  const fw = new T.Mesh(new T.PlaneGeometry(W, H), fm);
  fw.position.set(cx, H / 2, cz - D / 2); sc.add(fw);
  const lw = new T.Mesh(new T.PlaneGeometry(D, H), wallMat);
  lw.rotation.y = Math.PI / 2; lw.position.set(cx - W / 2, H / 2, cz); sc.add(lw);
  const rw = new T.Mesh(new T.PlaneGeometry(D, H), wallMat);
  rw.rotation.y = -Math.PI / 2; rw.position.set(cx + W / 2, H / 2, cz); sc.add(rw);

  if (ro.stripLights) {
    const sm = new T.MeshStandardMaterial({ color: 0xffffff, emissive: new T.Color(0xf0f8ff), emissiveIntensity: ts.stripEmissive ?? 20 });
    const dm = new T.MeshStandardMaterial({ color: 0xe8f4ff, emissive: new T.Color(0xd0eaff), emissiveIntensity: 8, transparent: true, opacity: 0.85 });
    [-7, -2, 3, 8].forEach(z => [-5.5, 0, 5.5].forEach(x => {
      const s = new T.Mesh(new T.BoxGeometry(0.1, 0.03, 2.2), sm);
      s.position.set(cx + x, H - 0.02, cz + z); sc.add(s);
      const d = new T.Mesh(new T.BoxGeometry(0.35, 0.02, 2.4), dm);
      d.position.set(cx + x, H - 0.05, cz + z); sc.add(d);
    }));
  }

  if (ro.baseboardLights) {
    const bm = new T.MeshStandardMaterial({ color: ts.baseboardColor ?? 0x0044cc, emissive: new T.Color(ts.baseboardColor ?? 0x0044cc), emissiveIntensity: 2.0 });
    [-W / 2 + cx, W / 2 + cx].forEach(x => {
      const b = new T.Mesh(new T.BoxGeometry(0.04, 0.07, D), bm); b.position.set(x, 0.035, cz); sc.add(b);
    });
    const bb = new T.Mesh(new T.BoxGeometry(W, 0.07, 0.04), bm);
    bb.position.set(cx, 0.035, cz + D / 2 - 0.05); sc.add(bb);
  }

  if (ro.exitSign) {
    const em = new T.MeshStandardMaterial({ color: 0x00cc44, emissive: new T.Color(0x00cc44), emissiveIntensity: 3 });
    const ex = new T.Mesh(new T.BoxGeometry(0.4, 0.2, 0.05), em);
    ex.position.set(cx + W / 2 - 1, H - 0.5, cz + D / 2 - 0.1); sc.add(ex);
  }

  if (ro.cableTrays) {
    const tm = new T.MeshStandardMaterial({ color: 0x2a3a50, roughness: 0.7, metalness: 0.6 });
    [-1, W - 1].forEach((x, i) => {
      const t = new T.Mesh(new T.BoxGeometry(0.06, 0.4, D - 0.5), tm);
      t.position.set(cx - W / 2 + x + 0.3 * (i ? -1 : 1), H - 1, cz); sc.add(t);
    });
  }
}
