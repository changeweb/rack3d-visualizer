// ── SELECTION MANAGER ── Handles raycasting and selection state

export class SelectionManager {
  constructor(scene, camera, THREE) {
    this.scene = scene;
    this.camera = camera;
    this.THREE = THREE;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedDeviceId = null;
    this.selectedRackId = null;
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    const idx = this.observers.indexOf(observer);
    if (idx > -1) this.observers.splice(idx, 1);
  }

  notify(event) {
    this.observers.forEach(obs => obs(event));
  }

  raycast(clientX, clientY, canvasWidth, canvasHeight) {
    this.mouse.x = (clientX / canvasWidth) * 2 - 1;
    this.mouse.y = -(clientY / canvasHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    const devHit  = intersects.find(h => h.object.userData?.deviceId);
    const rackHit = !devHit && intersects.find(h => h.object.userData?.rackId && !h.object.userData?.deviceId);

    if (devHit) {
      return {
        type: 'device',
        id: devHit.object.userData.deviceId,
        rackId: devHit.object.userData.rackId,
        object: devHit.object
      };
    }
    if (rackHit) {
      return {
        type: 'rack',
        id: rackHit.object.userData.rackId,
        object: rackHit.object
      };
    }

    // Check for room item hit — walk up parent chain to find itemId
    const itemHit = intersects.find(h => {
      if (h.object.userData?.itemLabel) return false;
      let o = h.object;
      while (o) { if (o.userData?.itemId) return true; o = o.parent; }
      return false;
    });
    if (itemHit) {
      let o = itemHit.object;
      while (o && !o.userData?.itemId) o = o.parent;
      return { type: 'item', id: o.userData.itemId, object: itemHit.object };
    }

    return null;
  }

  selectDevice(deviceId, rackId) {
    this.selectedDeviceId = deviceId;
    this.selectedRackId = rackId;
    this.notify({
      type: 'deviceSelected',
      deviceId,
      rackId
    });
  }

  selectRack(rackId) {
    this.selectedRackId = rackId;
    this.notify({
      type: 'rackSelected',
      rackId
    });
  }

  clearSelection() {
    this.selectedDeviceId = null;
    this.selectedRackId = null;
    this.notify({
      type: 'selectionCleared'
    });
  }

  getSelectedDevice() {
    return this.selectedDeviceId;
  }

  getSelectedRack() {
    return this.selectedRackId;
  }
}
