import type { IVisualizer } from '../types/visualizer'

export class CameraController {
  private viz: IVisualizer

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  posCamera(): void {
    const self = this.viz
    if (!self._cam) return
    if (self._ctrl.mode === 'fps') {
      const { pos, yaw, pitch } = self._ctrl
      const cp = Math.cos(pitch)
      self._cam.position.set(pos.x, pos.y, pos.z)
      self._cam.lookAt(pos.x + cp * Math.sin(yaw), pos.y + Math.sin(pitch), pos.z + cp * Math.cos(yaw))
    } else {
      const my = this.midY()
      const { az, el, r } = self._ctrl
      self._cam.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el) + my, r * Math.cos(el) * Math.cos(az))
      self._cam.lookAt(0, my, 0)
    }
  }

  rackH(): number {
    const self = this.viz
    if (!self._room?.racks?.length) return 12
    const maxUnits = Math.max(...self._room.racks.map((r: { units?: number }) => r.units || 24))
    return maxUnits * self._opts.rack.unitHeight + 1.3
  }

  midY(): number {
    return this.rackH() / 2
  }

  setCameraAngle(az?: number, el?: number, dist?: number): void {
    const self = this.viz
    self._ctrl.az = az ?? self._ctrl.az
    self._ctrl.el = el ?? self._ctrl.el
    if (dist != null) self._ctrl.r = dist
    this.posCamera()
  }

  resetCamera(): void {
    const self = this.viz
    const o = self._opts.camera
    if (self._ctrl.mode === 'fps') {
      const ip = o.initialPos || { x: 0, y: 16, z: -26 }
      self._ctrl.pos = { ...ip }
      self._ctrl.yaw = o.initialYaw ?? 0
      self._ctrl.pitch = o.initialPitch ?? -0.08
    } else {
      self._ctrl.az = o.azimuth
      self._ctrl.el = o.elevation
      self._ctrl.r = o.distance === 'auto' ? Math.max(22, this.rackH() * 2.2) : (o.distance ?? 22)
    }
    this.posCamera()
  }

  zoomIn(): void {
    const self = this.viz
    if (self._ctrl.mode === 'fps') {
      const { yaw, pitch } = self._ctrl
      const cp = Math.cos(pitch)
      self._ctrl.pos.x += cp * Math.sin(yaw) * 2
      self._ctrl.pos.y += Math.sin(pitch) * 2
      self._ctrl.pos.z += cp * Math.cos(yaw) * 2
    } else {
      self._ctrl.r = Math.max(self._opts.camera.minDistance, self._ctrl.r * 0.85)
    }
    this.posCamera()
  }

  zoomOut(): void {
    const self = this.viz
    if (self._ctrl.mode === 'fps') {
      const { yaw, pitch } = self._ctrl
      const cp = Math.cos(pitch)
      self._ctrl.pos.x -= cp * Math.sin(yaw) * 2
      self._ctrl.pos.y -= Math.sin(pitch) * 2
      self._ctrl.pos.z -= cp * Math.cos(yaw) * 2
    } else {
      self._ctrl.r = Math.min(self._opts.camera.maxDistance, self._ctrl.r * 1.18)
    }
    this.posCamera()
  }

  flyToRack(rackId: string): boolean {
    const self = this.viz
    if (self._ctrl.mode !== 'fps') return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = self._rackGroups[rackId] as any
    if (!group) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rack = (self._room?.racks || []).find((r: any) => r.id === rackId) as any
    if (!rack) return false

    const fa: number = rack.facingAngle ?? 0
    const standoff = self._opts.rack.depth / 2 + 3.5
    const rx: number = group.position.x
    const rz: number = group.position.z
    const toPos = {
      x: rx - Math.sin(fa) * standoff,
      y: this.midY(),
      z: rz - Math.cos(fa) * standoff,
    }

    // Normalize delta to shortest rotation path
    let toYaw = fa
    const fromYaw = self._ctrl.yaw
    let diff = toYaw - fromYaw
    while (diff > Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI
    toYaw = fromYaw + diff

    self._flyTween = {
      active: true,
      startTime: -1,
      duration: 900,
      fromPos: { ...self._ctrl.pos },
      fromYaw: self._ctrl.yaw,
      fromPitch: self._ctrl.pitch,
      toPos,
      toYaw,
      toPitch: -0.05,
      savedPos: { ...self._ctrl.pos },
      savedYaw: self._ctrl.yaw,
      savedPitch: self._ctrl.pitch,
    }
    return true
  }

  flyBack(): void {
    const self = this.viz
    const tw = self._flyTween
    if (!tw?.savedPos) return

    let toYaw = tw.savedYaw
    const fromYaw = self._ctrl.yaw
    let diff = toYaw - fromYaw
    while (diff > Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI
    toYaw = fromYaw + diff

    self._flyTween = {
      active: true,
      startTime: -1,
      duration: 800,
      fromPos: { ...self._ctrl.pos },
      fromYaw: self._ctrl.yaw,
      fromPitch: self._ctrl.pitch,
      toPos: { ...tw.savedPos },
      toYaw,
      toPitch: tw.savedPitch,
      savedPos: null,
      savedYaw: 0,
      savedPitch: 0,
    }
  }

  stepFlyTween(now: number): void {
    const self = this.viz
    const tw = self._flyTween
    if (!tw?.active) return
    if (tw.startTime < 0) tw.startTime = now
    const raw = Math.min(1, (now - tw.startTime) / tw.duration)
    const t = raw * raw * (3 - 2 * raw) // smoothstep
    self._ctrl.pos.x = tw.fromPos.x + (tw.toPos.x - tw.fromPos.x) * t
    self._ctrl.pos.y = tw.fromPos.y + (tw.toPos.y - tw.fromPos.y) * t
    self._ctrl.pos.z = tw.fromPos.z + (tw.toPos.z - tw.fromPos.z) * t
    self._ctrl.yaw   = tw.fromYaw + (tw.toYaw - tw.fromYaw) * t
    self._ctrl.pitch = tw.fromPitch + (tw.toPitch - tw.fromPitch) * t
    if (raw >= 1) tw.active = false
  }

  toggleCameraMode(): void {
    const self = this.viz
    const cv = document.getElementById(self._id + '-cv3')
    const b = document.getElementById(self._id + '-btnCam')
    const tip = document.getElementById(self._id + '-tip')
    if (self._ctrl.pointerLocked) { document.exitPointerLock?.(); return }
    if (self._ctrl.mode === 'fps') {
      if (cv) (cv as HTMLElement & { requestPointerLock(): void }).requestPointerLock()
      return
    }
    self._ctrl.mode = 'fps'
    if (self._cam) {
      self._ctrl.pos = { x: self._cam.position.x, y: self._cam.position.y, z: self._cam.position.z }
      self._ctrl.yaw = Math.atan2(-self._cam.position.x, -self._cam.position.z)
      self._ctrl.pitch = -0.08
    }
    if (b) b.textContent = '⊹ FPS'
    if (tip) tip.textContent = '🖱 Drag to rotate · WS walk · A/D or ← → rotate · Click ⊹FPS again to lock mouse'
    this.posCamera()
  }
}
