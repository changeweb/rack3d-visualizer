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
