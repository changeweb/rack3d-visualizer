// ── GEOMETRY MANAGER ── Orchestrates all geometry builders
import { RoomItemBuilder } from '../builders/RoomItemBuilder.js';

export class GeometryManager {
  constructor(THREE, scene, rackBuilder, deviceBuilder, environmentBuilder, materialFactory, theme) {
    this.THREE = THREE;
    this.scene = scene;
    this.rackBuilder = rackBuilder;
    this.deviceBuilder = deviceBuilder;
    this.environmentBuilder = environmentBuilder;
    this.materialFactory = materialFactory;
    this.theme = theme || null;
    this.rackGroups = {};
    this.deviceMeshes = {};
    this.labelPositions = {};
    this.labelSide = 'auto';
    this._envGroup = null;
    this.itemGroups = {};
    this.itemLabelMeshes = [];
    this.roomItemBuilder = new RoomItemBuilder(THREE, theme);
  }

  buildEnvironment(room, roomOptions, lightingOptions, sceneTheme) {
    // Clear old environment geometry
    if (this._envGroup) {
      this._envGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.scene.remove(this._envGroup);
      this._envGroup = null;
    }
    // Build into a group so it can be cleared on rebuild
    this._envGroup = new this.THREE.Group();
    this.scene.add(this._envGroup);
    const mergedRO = { ...roomOptions, walls: room?.room_walls, pillars: room?.room_pillars };
    this.environmentBuilder.build(this._envGroup, mergedRO, lightingOptions, sceneTheme);
  }

  buildRoomItems(items) {
    this.clearRoomItems();
    (items || []).forEach(item => {
      if (!item.id) return;
      const group = this.roomItemBuilder.build(item);
      this.scene.add(group);
      this.itemGroups[item.id] = group;

      const labelMesh = this.roomItemBuilder.buildLabel(item);
      if (labelMesh) {
        if (item.type === 'battery') {
          const D = item.depth ?? 2.0;
          const H = item.height ?? 2.5;
          labelMesh.position.set(0, H * 0.45, -(D / 2) - 0.02);
        } else {
          const itemH = item.height ?? this.roomItemBuilder._defaultHeight(item.type);
          const planeH = 2.8 * (128 / 512);
          labelMesh.position.set(0, itemH + planeH * 0.5 + 0.4, 0);
        }
        group.add(labelMesh);
        this.itemLabelMeshes.push(labelMesh);
      }
    });
  }

  clearRoomItems() {
    Object.values(this.itemGroups).forEach(group => {
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.scene.remove(group);
    });
    this.itemLabelMeshes = [];
    this.itemGroups = {};
  }

  buildAllRacks(room, rackOptions, rackTheme, selRackId) {
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

      this._buildSingleRack(entry, ox, oy, oz, rackOptions, rackTheme, selRackId);
    });
  }

  _buildSingleRack(rack, ox, oy, oz, rackOptions, rackTheme, selRackId) {
    const group = new this.THREE.Group();
    group.position.set(ox, oy, oz);
    group.rotation.y = rack.facingAngle || 0;
    group.userData.rk = 'rackgroup';
    group.userData.rackId = rack.id;

    this.scene.add(group);
    this.rackGroups[rack.id] = group;

    this.rackBuilder.build(rack, rackOptions, rackTheme, group, selRackId);

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
