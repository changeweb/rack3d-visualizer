// ── ENVIRONMENT BUILDER ── Builds room environment (floor, walls, ceiling, lights)

export class EnvironmentBuilder {
  constructor(THREE, theme) {
    this.THREE = THREE;
    this.theme = theme;
  }

  buildLightsOnly(scene, lightingOptions, sceneTheme) {
    this._buildLights(scene, lightingOptions, sceneTheme);
  }

  build(scene, roomOptions, lightingOptions, sceneTheme) {
    const ro = roomOptions;
    const lo = lightingOptions;
    const ts = sceneTheme;
    const W = ro.width;
    const D = ro.depth;
    const H = ro.height;
    const ts2 = ro.tileSize;
    const cx = 0;
    const cz = 2;

    this._buildFloor(scene, W, D, cx, cz, ts2, ts, ro);
    this._buildCeiling(scene, W, D, H, cx, cz, ts);
    this._buildWalls(scene, W, D, H, cx, cz, ts);
    this._buildStripLights(scene, W, D, H, cx, cz, ts, ro);
    this._buildBaseboardLights(scene, W, D, cx, cz, ts, ro);
    this._buildExitSign(scene, W, D, H, cx, cz, ro);
    this._buildCableTrays(scene, W, D, H, cx, cz, ro);
    this._buildLights(scene, lo, ts);
  }

  _buildFloor(scene, W, D, cx, cz, ts2, ts, ro) {
    const floorMat = new this.THREE.MeshStandardMaterial({
      color: ts.floorColor,
      roughness: 0.65,
      metalness: 0.25
    });
    const floor = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, -0.01, cz);
    floor.receiveShadow = true;
    scene.add(floor);

    if (ro.floorTiles) {
      this._buildFloorTiles(scene, W, D, cx, cz, ts2);
    }
  }

  _buildFloorTiles(scene, W, D, cx, cz, ts2) {
    const gm = new this.THREE.LineBasicMaterial({ color: 0x3a5070 });
    const hw = W / 2;
    const hd = D / 2;

    for (let i = 0; i <= Math.ceil(W / ts2); i++) {
      const x = -hw + i * ts2 + cx;
      const g = new this.THREE.BufferGeometry().setFromPoints([
        new this.THREE.Vector3(x, 0.001, -hd + cz),
        new this.THREE.Vector3(x, 0.001, hd + cz)
      ]);
      scene.add(new this.THREE.Line(g, gm));
    }

    for (let j = 0; j <= Math.ceil(D / ts2); j++) {
      const z = -hd + j * ts2 + cz;
      const g = new this.THREE.BufferGeometry().setFromPoints([
        new this.THREE.Vector3(-hw + cx, 0.001, z),
        new this.THREE.Vector3(hw + cx, 0.001, z)
      ]);
      scene.add(new this.THREE.Line(g, gm));
    }

    const pm = new this.THREE.MeshStandardMaterial({ color: 0x243040, roughness: 0.6, metalness: 0.35 });
    const tileGeo = new this.THREE.BoxGeometry(ts2 - 0.03, 0.04, ts2 - 0.03);
    const minX = -Math.floor(W / 2 / ts2);
    const maxX = Math.floor(W / 2 / ts2);
    const minZ = -Math.floor(D / 2 / ts2);
    const maxZ = Math.floor(D / 2 / ts2);
    const count = (maxX - minX + 1) * (maxZ - minZ + 1);
    const inst = new this.THREE.InstancedMesh(tileGeo, pm, count);
    inst.receiveShadow = true;

    const dummy = new this.THREE.Object3D();
    let idx = 0;
    for (let pi = minX; pi <= maxX; pi++) {
      for (let pj = minZ; pj <= maxZ; pj++) {
        dummy.position.set(pi * ts2 + cx, 0.02, pj * ts2 + cz);
        dummy.updateMatrix();
        inst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    scene.add(inst);
  }

  _buildCeiling(scene, W, D, H, cx, cz, ts) {
    const ceilMat = new this.THREE.MeshStandardMaterial({
      color: ts.ceilColor,
      roughness: 0.85,
      metalness: 0.02
    });
    const ceil = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, D), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, H, cz);
    scene.add(ceil);

    // Ceiling grid
    const tgm = new this.THREE.LineBasicMaterial({ color: 0x4a6080 });
    const tw = 1.2;
    const hw = W / 2;
    const hd = D / 2;
    for (let i = 0; i <= Math.ceil(W / tw); i++) {
      const x = -hw + i * tw + cx;
      const g = new this.THREE.BufferGeometry().setFromPoints([
        new this.THREE.Vector3(x, H - 0.01, -hd + cz),
        new this.THREE.Vector3(x, H - 0.01, hd + cz)
      ]);
      scene.add(new this.THREE.Line(g, tgm));
    }
  }

  _buildWalls(scene, W, D, H, cx, cz, ts) {
    const wallMat = new this.THREE.MeshStandardMaterial({
      color: ts.wallColor,
      roughness: 0.8,
      metalness: 0.05,
      side: this.THREE.DoubleSide
    });

    const bw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, H), wallMat);
    bw.position.set(cx, H / 2, cz + D / 2);
    scene.add(bw);

    const fm = new this.THREE.MeshStandardMaterial({
      color: 0x1e2d40,
      transparent: true,
      opacity: 0.65,
      side: this.THREE.DoubleSide
    });
    const fw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, H), fm);
    fw.position.set(cx, H / 2, cz - D / 2);
    scene.add(fw);

    const lw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(D, H), wallMat);
    lw.rotation.y = Math.PI / 2;
    lw.position.set(cx - W / 2, H / 2, cz);
    scene.add(lw);

    const rw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(D, H), wallMat);
    rw.rotation.y = -Math.PI / 2;
    rw.position.set(cx + W / 2, H / 2, cz);
    scene.add(rw);
  }

  _buildStripLights(scene, W, D, H, cx, cz, ts, ro) {
    if (!ro.stripLights) return;

    const sm = new this.THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new this.THREE.Color(0xf0f8ff),
      emissiveIntensity: ts.stripEmissive ?? 20
    });
    const dm = new this.THREE.MeshStandardMaterial({
      color: 0xe8f4ff,
      emissive: new this.THREE.Color(0xd0eaff),
      emissiveIntensity: 8,
      transparent: true,
      opacity: 0.85
    });

    [-7, -2, 3, 8].forEach(z => {
      [-5.5, 0, 5.5].forEach(x => {
        const s = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.1, 0.03, 2.2), sm);
        s.position.set(cx + x, H - 0.02, cz + z);
        scene.add(s);

        const d = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.35, 0.02, 2.4), dm);
        d.position.set(cx + x, H - 0.05, cz + z);
        scene.add(d);
      });
    });
  }

  _buildBaseboardLights(scene, W, D, cx, cz, ts, ro) {
    if (!ro.baseboardLights) return;

    const bm = new this.THREE.MeshStandardMaterial({
      color: ts.baseboardColor ?? 0x0044cc,
      emissive: new this.THREE.Color(ts.baseboardColor ?? 0x0044cc),
      emissiveIntensity: 2.0
    });

    [-W / 2 + cx, W / 2 + cx].forEach(x => {
      const b = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, 0.07, D), bm);
      b.position.set(x, 0.035, cz);
      scene.add(b);
    });

    const bb = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, 0.07, 0.04), bm);
    bb.position.set(cx, 0.035, cz + D / 2 - 0.05);
    scene.add(bb);
  }

  _buildExitSign(scene, W, D, H, cx, cz, ro) {
    if (!ro.exitSign) return;

    const em = new this.THREE.MeshStandardMaterial({
      color: 0x00cc44,
      emissive: new this.THREE.Color(0x00cc44),
      emissiveIntensity: 3
    });
    const ex = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.4, 0.2, 0.05), em);
    ex.position.set(cx + W / 2 - 1, H - 0.5, cz + D / 2 - 0.1);
    scene.add(ex);
  }

  _buildCableTrays(scene, W, D, H, cx, cz, ro) {
    if (!ro.cableTrays) return;

    const tm = new this.THREE.MeshStandardMaterial({
      color: 0x2a3a50,
      roughness: 0.7,
      metalness: 0.6
    });

    [-1, W - 1].forEach((x, i) => {
      const t = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.06, 0.4, D - 0.5), tm);
      t.position.set(cx - W / 2 + x + 0.3 * (i ? -1 : 1), H - 1, cz);
      scene.add(t);
    });
  }

  _buildLights(scene, lo, ts) {
    scene.add(new this.THREE.AmbientLight(lo.ambientColor ?? ts.ambientColor, lo.ambientIntensity ?? ts.ambientIntensity));

    const cnt = Math.max(2, Math.min(12, lo.overheadCount));
    const positions = [];
    const cols = Math.ceil(Math.sqrt(cnt));
    const rows = Math.ceil(cnt / cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (positions.length >= cnt) break;
        positions.push([(c - (cols - 1) / 2) * 7, (r - (rows - 1) / 2) * 6]);
      }
    }

    positions.forEach(([x, z], idx) => {
      const fl = new this.THREE.DirectionalLight(0xf8fbff, lo.overheadIntensity ?? ts.overheadIntensity);
      fl.position.set(x, 22, z);
      if (lo.shadows && idx < 2) {
        fl.castShadow = true;
        fl.shadow.mapSize.set(512, 512);
        fl.shadow.camera.near = 1;
        fl.shadow.camera.far = 80;
        fl.shadow.camera.left = -18;
        fl.shadow.camera.right = 18;
        fl.shadow.camera.top = 32;
        fl.shadow.camera.bottom = -5;
        fl.shadow.bias = -0.0005;
      }
      scene.add(fl);
    });

    const front = new this.THREE.DirectionalLight(0xffffff, lo.frontIntensity ?? ts.frontLightIntensity);
    front.position.set(0, 10, 18);
    scene.add(front);

    const fi = lo.fillIntensity ?? 6.0;
    [[-20, 8, 4], [20, 8, 4], [0, 30, 0], [0, 10, -16]].forEach(([x, y, z], i) => {
      const l = new this.THREE.DirectionalLight(i < 2 ? 0xe8f4ff : 0xffffff, i === 2 ? fi + 1 : fi);
      l.position.set(x, y, z);
      scene.add(l);
    });

    [[-18, 6, 0], [18, 6, 0], [0, 6, -16], [0, 6, 14]].forEach(([x, y, z]) => {
      const l = new this.THREE.DirectionalLight(0xd8eaff, 3.5);
      l.position.set(x, y, z);
      scene.add(l);
    });

    [[-5, 0.2, 2], [5, 0.2, 2], [0, 0.2, 8]].forEach(([x, y, z]) => {
      const pl = new this.THREE.PointLight(0x5588ee, lo.floorGlowIntensity ?? 3.0, 22);
      pl.position.set(x, y, z);
      scene.add(pl);
    });

    const glow = new this.THREE.PointLight(0x3377ff, lo.rackGlowIntensity ?? 6.0, 14);
    glow.position.set(0, 12, 2);
    scene.add(glow);
  }
}
