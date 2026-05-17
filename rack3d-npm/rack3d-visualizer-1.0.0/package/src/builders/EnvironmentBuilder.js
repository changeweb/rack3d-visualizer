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

    this._buildSkyboxAndSun(scene);
    this._buildFloor(scene, W, D, cx, cz, ts2, ts, ro);
    this._buildCeiling(scene, W, D, H, cx, cz, ts);
    this._buildWalls(scene, W, D, H, cx, cz, ts, ro);
    this._buildStripLights(scene, W, D, H, cx, cz, ts, ro);
    this._buildBaseboardLights(scene, W, D, cx, cz, ts, ro);
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

  _buildWalls(scene, W, D, H, cx, cz, ts, ro) {
    const baseColor = ro.wallColor
      ? (typeof ro.wallColor === 'string' ? parseInt(ro.wallColor.replace('#',''), 16) : ro.wallColor)
      : ts.wallColor;
    const wallMat = new this.THREE.MeshStandardMaterial({
      color: baseColor, roughness: 0.8, metalness: 0.05, side: this.THREE.DoubleSide
    });
    const frontMat = new this.THREE.MeshStandardMaterial({
      color: 0x1e2d40, transparent: true, opacity: 0.65, side: this.THREE.DoubleSide
    });
    const bw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, H), wallMat);
    bw.position.set(cx, H / 2, cz + D / 2);
    scene.add(bw);
    const fw = new this.THREE.Mesh(new this.THREE.PlaneGeometry(W, H), frontMat);
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

  _buildSkyboxAndSun(scene) {
    // Sky gradient texture
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return;
    canvas.width = 2; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0,    '#0d2255');
    grad.addColorStop(0.25, '#1a4fa0');
    grad.addColorStop(0.55, '#4a90d9');
    grad.addColorStop(0.78, '#87ceeb');
    grad.addColorStop(0.92, '#c8e8f8');
    grad.addColorStop(1,    '#f0d8a0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    const skyTex = new this.THREE.CanvasTexture(canvas);
    const skyMat = new this.THREE.MeshBasicMaterial({
      map: skyTex, side: this.THREE.BackSide, fog: false, depthWrite: false
    });
    const sky = new this.THREE.Mesh(new this.THREE.SphereGeometry(800, 32, 20), skyMat);
    scene.add(sky);

    // Clouds (flat ellipsoids)
    const cloudMat = new this.THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, fog: false });
    [[180, 220, -320], [-240, 200, -280], [60, 250, -400], [-150, 180, -350]].forEach(([x, y, z]) => {
      const cloud = new this.THREE.Mesh(new this.THREE.SphereGeometry(1, 12, 6), cloudMat);
      cloud.scale.set(30 + Math.abs(x) % 20, 8, 14 + Math.abs(z) % 12);
      cloud.position.set(x, y, z);
      scene.add(cloud);
    });

    // Sun disc
    const sunMat = new this.THREE.MeshBasicMaterial({ color: 0xfffde7, fog: false });
    const sun = new this.THREE.Mesh(new this.THREE.SphereGeometry(18, 20, 12), sunMat);
    sun.position.set(180, 280, -450);
    scene.add(sun);

    // Sun corona
    const coronaMat = new this.THREE.MeshBasicMaterial({ color: 0xfff9c4, transparent: true, opacity: 0.25, fog: false });
    const corona = new this.THREE.Mesh(new this.THREE.SphereGeometry(32, 20, 12), coronaMat);
    corona.position.copy(sun.position);
    scene.add(corona);

    // Sunlight directional — kept very dim so it doesn't compete with shadow light
    const sunLight = new this.THREE.DirectionalLight(0xfff8e1, 0.4);
    sunLight.position.set(180, 280, -450);
    scene.add(sunLight);
  }

  _buildLights(scene, lo, ts) {
    // Low ambient so nothing is pitch black
    scene.add(new this.THREE.AmbientLight(
      lo.ambientColor ?? ts.ambientColor,
      lo.ambientIntensity ?? ts.ambientIntensity
    ));

    const mainIntensity = (lo.overheadIntensity ?? ts.overheadIntensity ?? 5) * 1.2;

    if (lo.shadows) {
      // Single shadow-casting key light from front-right-above angle
      const sl = new this.THREE.DirectionalLight(0xfff8f0, mainIntensity);
      sl.position.set(20, 40, -15);
      sl.castShadow = true;
      sl.shadow.mapSize.set(2048, 2048);
      sl.shadow.camera.near = 1;
      sl.shadow.camera.far = 150;
      sl.shadow.camera.left  = -45;
      sl.shadow.camera.right =  45;
      sl.shadow.camera.top   =  55;
      sl.shadow.camera.bottom = -20;
      sl.shadow.bias = -0.002;
      sl.shadow.camera.updateProjectionMatrix();
      sl.target.position.set(0, 0, 2);
      scene.add(sl);
      scene.add(sl.target);
    } else {
      const ml = new this.THREE.DirectionalLight(0xfff8f0, mainIntensity);
      ml.position.set(10, 30, -10);
      scene.add(ml);
    }

    // Soft fill lights (much dimmer than key light so shadows remain visible)
    const fl1 = new this.THREE.DirectionalLight(0xd0e8ff, 0.7);
    fl1.position.set(-15, 12, 15);
    scene.add(fl1);

    const fl2 = new this.THREE.DirectionalLight(0xe8f4ff, 0.5);
    fl2.position.set(15, 8, 15);
    scene.add(fl2);

    // Floor accent glow
    const floorGlow = new this.THREE.PointLight(0x5588ee, lo.floorGlowIntensity ?? 2.0, 22);
    floorGlow.position.set(0, 0.2, 2);
    scene.add(floorGlow);

    // User-defined custom lights
    (lo.customLights || []).forEach(cl => {
      const color = typeof cl.color === 'string'
        ? parseInt(cl.color.replace('#', ''), 16)
        : (cl.color || 0xffffff);
      const intensity = cl.intensity ?? 5;
      const x = cl.x ?? 0, z = cl.z ?? 0;
      const y = cl.type === 'ceiling' ? ((lo.roomHeight ?? 13) - 0.5) : (cl.y ?? 8);

      if (cl.type === 'point' || cl.type === 'ceiling') {
        const pl = new this.THREE.PointLight(color, intensity, cl.distance ?? 0);
        pl.position.set(x, y, z);
        scene.add(pl);
      } else if (cl.type === 'spot') {
        const sl = new this.THREE.SpotLight(color, intensity);
        sl.position.set(x, y, z);
        sl.angle = cl.angle ?? Math.PI / 6;
        sl.penumbra = 0.2;
        sl.target.position.set(x, 0, z);
        scene.add(sl); scene.add(sl.target);
      } else {
        const dl = new this.THREE.DirectionalLight(color, intensity);
        dl.position.set(x, y, z);
        scene.add(dl);
      }
    });
  }
}
