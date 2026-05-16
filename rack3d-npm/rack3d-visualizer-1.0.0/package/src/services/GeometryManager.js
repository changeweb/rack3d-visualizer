// ── GEOMETRY MANAGER ── Orchestrates all geometry builders

export class GeometryManager {
  constructor(THREE, scene, rackBuilder, deviceBuilder, environmentBuilder, materialFactory) {
    this.THREE = THREE;
    this.scene = scene;
    this.rackBuilder = rackBuilder;
    this.deviceBuilder = deviceBuilder;
    this.environmentBuilder = environmentBuilder;
    this.materialFactory = materialFactory;
    this.rackGroups = {};
    this.deviceMeshes = {};
    this.labelPositions = {};
    this.labelSide = 'auto';
  }

  buildEnvironment(room, roomOptions, lightingOptions, sceneTheme) {
    this.environmentBuilder.build(this.scene, roomOptions, lightingOptions, sceneTheme);
  }

  buildAllRacks(room, rackOptions, rackTheme) {
    this.clearAllRacks();

    if (!room?.racks?.length) return;

    const layout = room.layout || {};
    const colSpacing = layout.colSpacing || 8;
    const rowSpacing = layout.rowSpacing || 10;
    const cols = layout.cols || 1;
    const rows = layout.rows || 1;
    const totalW = (cols - 1) * colSpacing;
    const totalD = (rows - 1) * rowSpacing;

    room.racks.forEach(entry => {
      const gridX = (entry.col || 0) * colSpacing - totalW / 2;
      const gridZ = (entry.row || 0) * rowSpacing - totalD / 2;
      const ox = entry.position?.x ?? gridX;
      const oy = entry.position?.y ?? 0;
      const oz = entry.position?.z ?? gridZ;

      this._buildSingleRack(entry, ox, oy, oz, rackOptions, rackTheme);
    });
  }

  _buildSingleRack(rack, ox, oy, oz, rackOptions, rackTheme) {
    const group = new this.THREE.Group();
    group.position.set(ox, oy, oz);
    group.rotation.y = rack.facingAngle || 0;
    group.userData.rk = 'rackgroup';
    group.userData.rackId = rack.id;

    this.scene.add(group);
    this.rackGroups[rack.id] = group;

    this.rackBuilder.build(rack, rackOptions, rackTheme, group);

    const hw = rackOptions.width / 2;
    const hd = rackOptions.depth / 2;

    if (rack.devices?.length) {
      const sorted = rack.devices.slice().sort((a, b) => a.startUnit - b.startUnit);
      sorted.forEach((device, idx) => {
        this.deviceBuilder.build(device, idx, this.labelSide, rackOptions, group, rack, hw, hd, this.labelPositions, this.deviceMeshes);
      });
    }
  }

  clearAllRacks() {
    Object.values(this.rackGroups).forEach(group => {
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              m.map?.dispose();
              m.dispose();
            });
          } else {
            obj.material?.map?.dispose();
            obj.material?.dispose();
          }
        }
      });
      this.scene.remove(group);
    });

    // Clear the material factory cache — all cached materials were disposed above
    this.materialFactory?.cache.clear();

    this.rackGroups = {};
    this.deviceMeshes = {};
    this.labelPositions = {};
  }

  getGroupForRack(rackId) {
    return this.rackGroups[rackId];
  }

  getDeviceMesh(deviceId) {
    return this.deviceMeshes[deviceId];
  }

  getLabelPositions() {
    return this.labelPositions;
  }
}
