export class RenderEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  camera: any
  running: boolean
  dirty: boolean
  frameCallbacks: Array<(deltaTime: number) => void>
  MS_ACTIVE: number
  MS_IDLE: number
  lastFrameTime: number
  idleTimer: number
  isIdle: boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(renderer: any, scene: any, camera: any) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    this.running = false
    this.dirty = true
    this.frameCallbacks = []
    this.MS_ACTIVE = 1000 / 20
    this.MS_IDLE = 800
    this.lastFrameTime = 0
    this.idleTimer = 0
    this.isIdle = false
  }

  onFrame(callback: (deltaTime: number) => void): void {
    this.frameCallbacks.push(callback)
  }

  setDirty(): void {
    this.dirty = true
    this.idleTimer = 0
    this.isIdle = false
  }

  isDirty(): boolean {
    return this.dirty
  }

  isIdleMode(): boolean {
    return this.isIdle
  }

  start(): void {
    this.running = true
    this.animate()
  }

  stop(): void {
    this.running = false
  }

  animate = (): void => {
    if (!this.running) return
    requestAnimationFrame(this.animate)

    const now = performance.now()
    const deltaTime = (now - this.lastFrameTime) / 1000
    const targetDelta = this.isIdle ? this.MS_IDLE : this.MS_ACTIVE

    if (now - this.lastFrameTime < targetDelta && !this.dirty) {
      return
    }

    this.lastFrameTime = now

    this.idleTimer += deltaTime * 1000
    if (!this.dirty && this.idleTimer > 3000) {
      this.isIdle = true
    } else if (this.dirty) {
      this.isIdle = false
    }

    this.frameCallbacks.forEach(cb => cb(deltaTime))

    this.renderer.render(this.scene, this.camera)

    this.dirty = false
  }
}
