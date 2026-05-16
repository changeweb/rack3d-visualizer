// ── RACK BUILDER ── Builds individual rack geometry

export class RackBuilder {
  constructor(THREE, theme, materialFactory) {
    this.THREE = THREE;
    this.theme = theme;
    this.materialFactory = materialFactory;
  }

  build(rack, rackOptions, rackTheme, group, selRackId) {
    const UH = rackOptions.unitHeight;
    const RW = rackOptions.width;
    const RD = rackOptions.depth;
    const POST = rackOptions.postSize;
    const H = (rack.units || 24) * UH + 1.3;
    const my = H / 2;
    const hw = RW / 2;
    const hd = RD / 2;

    const isSelected = rack.id === selRackId;
    const selMix = isSelected ? 0.65 : 0;
    const frameColor = isSelected
      ? new this.THREE.Color(rackTheme.frameColor).lerp(new this.THREE.Color(0x1155cc), selMix).getHex()
      : rackTheme.frameColor;

    const steelMat = this.materialFactory.createFrameMaterial(frameColor);

    // Corner posts
    [[1, -1], [-1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
      const geo = new this.THREE.BoxGeometry(POST, H, POST);
      const mesh = new this.THREE.Mesh(geo, steelMat);
      mesh.userData.rk = 'frame';
      mesh.userData.rackId = rack.id;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(sx * (hw - POST / 2), my, sz * (hd - POST / 2));
      group.add(mesh);
    });

    // Top/bottom crossbars
    [0.04, H - 0.04].forEach(y => {
      const positions = [
        [[new this.THREE.BoxGeometry(RW, 0.08, 0.12), [0, y, -hd + 0.06]]],
        [[new this.THREE.BoxGeometry(RW, 0.08, 0.12), [0, y, hd - 0.06]]],
        [[new this.THREE.BoxGeometry(0.12, 0.08, RD), [-hw + 0.06, y, 0]]],
        [[new this.THREE.BoxGeometry(0.12, 0.08, RD), [hw - 0.06, y, 0]]]
      ];
      positions.forEach(([[geo, [x, yPos, z]]]) => {
        const mesh = new this.THREE.Mesh(geo, steelMat);
        mesh.userData.rk = 'frame';
        mesh.userData.rackId = rack.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(x, yPos, z);
        group.add(mesh);
      });
    });

    // Mid crossbars every 8U
    for (let i = 1; i < rack.units; i += 8) {
      const y = 0.6 + i * UH;
      const postMat = this.materialFactory.createFrameMaterial(rackTheme.postColor);
      [-hd + 0.06, hd - 0.06].forEach(z => {
        const geo = new this.THREE.BoxGeometry(RW, 0.05, 0.1);
        const mesh = new this.THREE.Mesh(geo, postMat);
        mesh.userData.rk = 'frame';
        mesh.userData.rackId = rack.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(0, y, z);
        group.add(mesh);
      });
      [-hw + 0.06, hw - 0.06].forEach(x => {
        const geo = new this.THREE.BoxGeometry(0.1, 0.05, RD);
        const mesh = new this.THREE.Mesh(geo, postMat);
        mesh.userData.rk = 'frame';
        mesh.userData.rackId = rack.id;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(x, y, 0);
        group.add(mesh);
      });
    }

    // Rails and unit labels
    const railMat = this.materialFactory.createFrameMaterial(rackTheme.railColor);
    const nutMat = new this.THREE.MeshStandardMaterial({
      color: 0x3a4f68,
      roughness: 0.3,
      metalness: 1.0
    });

    for (let i = 0; i <= rack.units; i++) {
      const y = 0.6 + i * UH;
      [-hw + POST, hw - POST].forEach(x => {
        const rail = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, 0.022, 0.14), railMat);
        rail.userData.rk = 'rail';
        rail.userData.rackId = rack.id;
        rail.castShadow = true;
        rail.receiveShadow = true;
        rail.position.set(x, y, -hd + 0.2);
        group.add(rail);

        const rail2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, 0.022, 0.14), railMat);
        rail2.userData.rk = 'rail';
        rail2.userData.rackId = rack.id;
        rail2.castShadow = true;
        rail2.receiveShadow = true;
        rail2.position.set(x, y, hd - 0.2);
        group.add(rail2);
      });

      if (i < rack.units) {
        [-hw + 0.22, hw - 0.22].forEach(x => {
          const nut = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.025, 0.025, 0.04, 6), nutMat);
          nut.userData.rk = 'nut';
          nut.userData.rackId = rack.id;
          nut.castShadow = true;
          nut.receiveShadow = true;
          nut.rotation.x = Math.PI / 2;
          nut.position.set(x, y + UH * 0.5, -hd + 0.06);
          group.add(nut);
        });
        this._buildUnitLabel(i + 1, y, hw, hd, UH, group, rack.id);
      }
    }

    // Side panels
    if (rackOptions.showSidePanels) {
      const panelMat = new this.THREE.MeshStandardMaterial({
        color: 0x0f1622,
        roughness: 0.7,
        metalness: 0.5,
        transparent: true,
        opacity: 0.92
      });
      [-1, 1].forEach(s => {
        const panel = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.02, H - 0.2, RD - POST * 2), panelMat);
        panel.userData.rk = 'panel';
        panel.userData.rackId = rack.id;
        panel.castShadow = true;
        panel.receiveShadow = true;
        panel.position.set(s * (hw - POST), my, 0);
        group.add(panel);
      });
    }

    // Rear panel
    if (rackOptions.showRearPanel) {
      const rearMat = new this.THREE.MeshStandardMaterial({
        color: 0x0c1420,
        roughness: 0.8,
        metalness: 0.4
      });
      const rearPanel = new this.THREE.Mesh(new this.THREE.BoxGeometry(RW - POST * 2, H - 0.2, 0.02), rearMat);
      rearPanel.userData.rk = 'panel';
      rearPanel.userData.rackId = rack.id;
      rearPanel.castShadow = true;
      rearPanel.receiveShadow = true;
      rearPanel.position.set(0, my, hd - POST);
      group.add(rearPanel);
    }

    // Nameplate
    if (rackOptions.showNameplate) {
      const nameplateMat = new this.THREE.MeshStandardMaterial({
        color: 0x1a2a3f,
        roughness: 0.5,
        metalness: 0.7,
        emissive: new this.THREE.Color(0x003355),
        emissiveIntensity: 0.4
      });
      const nameplate = new this.THREE.Mesh(new this.THREE.BoxGeometry(RW - POST * 3, 0.22, 0.04), nameplateMat);
      nameplate.userData.rk = 'nameplate';
      nameplate.userData.rackId = rack.id;
      nameplate.castShadow = true;
      nameplate.receiveShadow = true;
      nameplate.position.set(0, H - 0.2, -hd + 0.03);
      group.add(nameplate);
    }

    if (isSelected) {
      // Glowing floor indicator
      const indMat = new this.THREE.MeshBasicMaterial({
        color: 0x1a6fff, transparent: true, opacity: 0.5, depthWrite: false
      });
      const ind = new this.THREE.Mesh(new this.THREE.PlaneGeometry(RW + 0.6, RD + 0.6), indMat);
      ind.rotation.x = -Math.PI / 2;
      ind.position.set(0, 0.03, 0);
      ind.userData.rackId = rack.id;
      group.add(ind);

      // Edge outline box
      const edgeGeo = new this.THREE.EdgesGeometry(new this.THREE.BoxGeometry(RW + 0.12, H + 0.04, RD + 0.12));
      const edgeMat = new this.THREE.LineBasicMaterial({ color: 0x00aaff, linewidth: 2 });
      const edges = new this.THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.set(0, my, 0);
      edges.userData.rackId = rack.id;
      group.add(edges);
    }

    this._buildRackLabel(rack, group, H, hw, hd, rackOptions, isSelected);
    return group;
  }

  _buildUnitLabel(unit, y, hw, hd, UH, group, rackId) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(10,20,35,0.72)';
    ctx.beginPath();
    ctx.roundRect(2, 2, 252, 124, 8);
    ctx.fill();

    ctx.fillStyle = '#a8c8e8';
    ctx.font = 'bold 72px "Share Tech Mono",monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit, 128, 64);

    const tex = new this.THREE.CanvasTexture(canvas);
    const mat = new this.THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: this.THREE.FrontSide
    });

    const planeH = UH * 0.7;
    const planeW = planeH * 2;
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(planeW, planeH), mat);
    mesh.userData.rk = 'unitlabel';
    mesh.userData.rackId = rackId;
    mesh.position.set(-hw + 0.10, y + UH * 0.5, -hd - 0.05);
    mesh.rotation.y = Math.PI;
    group.add(mesh);
  }

  _buildRackLabel(rack, group, H, hw, hd, rackOptions, isSelected) {
    const scale   = rackOptions.nameplateScale   ?? 1.0;
    const yOffset = rackOptions.nameplateYOffset ?? 0.2;
    const opacity = rackOptions.nameplateOpacity ?? 1.0;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isSelected ? 'rgba(17,85,200,0.9)' : 'rgba(8,16,32,0.88)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 14);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#4499ff' : '#2a4a6a';
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = isSelected ? '#79c0ff' : '#88bbdd';
    ctx.font = 'bold 64px "Courier New",monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rack.name || rack.id, 256, 64);

    const tex = new this.THREE.CanvasTexture(canvas);
    const mat = new this.THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      depthWrite: false,
      side: this.THREE.FrontSide
    });
    const planeW = rackOptions.width * 0.88 * scale;
    const planeH = planeW * (128 / 512);
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(planeW, planeH), mat);
    mesh.userData.rk = 'racklabel';
    mesh.userData.rackId = rack.id;
    mesh.position.set(0, H + planeH * 0.5 + yOffset, -hd + 0.02);
    mesh.rotation.y = Math.PI;
    group.add(mesh);
  }
}
