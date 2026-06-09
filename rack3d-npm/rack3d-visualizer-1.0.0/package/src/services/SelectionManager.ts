interface SelectionResult {
  type: 'device' | 'rack' | 'item' | 'connection'
  id: string
  rackId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  object: any
}

interface SelectionEvent {
  type: 'deviceSelected' | 'rackSelected' | 'selectionCleared'
  deviceId?: string | null
  rackId?: string | null
}

type SelectionObserver = (event: SelectionEvent) => void

export class SelectionManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  camera: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raycaster: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mouse: any
  selectedDeviceId: string | null
  selectedRackId: string | null
  observers: SelectionObserver[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(scene: any, camera: any, THREE: any) {
    this.scene = scene
    this.camera = camera
    this.THREE = THREE
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Line = { threshold: 0.4 }
    this.mouse = new THREE.Vector2()
    this.selectedDeviceId = null
    this.selectedRackId = null
    this.observers = []
  }

  subscribe(observer: SelectionObserver): void {
    this.observers.push(observer)
  }

  unsubscribe(observer: SelectionObserver): void {
    const idx = this.observers.indexOf(observer)
    if (idx > -1) this.observers.splice(idx, 1)
  }

  notify(event: SelectionEvent): void {
    this.observers.forEach(obs => obs(event))
  }

  raycast(clientX: number, clientY: number, canvasWidth: number, canvasHeight: number): SelectionResult | null {
    this.mouse.x = (clientX / canvasWidth) * 2 - 1
    this.mouse.y = -(clientY / canvasHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intersects: any[] = this.raycaster.intersectObjects(this.scene.children, true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devHit  = intersects.find((h: any) => h.object.userData?.deviceId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rackHit = !devHit && intersects.find((h: any) => h.object.userData?.rackId && !h.object.userData?.deviceId)

    if (devHit) {
      return {
        type: 'device',
        id: devHit.object.userData.deviceId,
        rackId: devHit.object.userData.rackId,
        object: devHit.object
      }
    }
    if (rackHit) {
      return {
        type: 'rack',
        id: rackHit.object.userData.rackId,
        object: rackHit.object
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemHit = intersects.find((h: any) => {
      if (h.object.userData?.itemLabel) return false
      let o = h.object
      while (o) { if (o.userData?.itemId) return true; o = o.parent }
      return false
    })
    if (itemHit) {
      let o = itemHit.object
      while (o && !o.userData?.itemId) o = o.parent
      return { type: 'item', id: o.userData.itemId, object: itemHit.object }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connHit = intersects.find((h: any) => h.object.userData?.connId)
    if (connHit) {
      return { type: 'connection', id: connHit.object.userData.connId, object: connHit.object }
    }

    return null
  }

  selectDevice(deviceId: string, rackId: string): void {
    this.selectedDeviceId = deviceId
    this.selectedRackId = rackId
    this.notify({ type: 'deviceSelected', deviceId, rackId })
  }

  selectRack(rackId: string): void {
    this.selectedRackId = rackId
    this.notify({ type: 'rackSelected', rackId })
  }

  clearSelection(): void {
    this.selectedDeviceId = null
    this.selectedRackId = null
    this.notify({ type: 'selectionCleared' })
  }

  getSelectedDevice(): string | null {
    return this.selectedDeviceId
  }

  getSelectedRack(): string | null {
    return this.selectedRackId
  }
}
