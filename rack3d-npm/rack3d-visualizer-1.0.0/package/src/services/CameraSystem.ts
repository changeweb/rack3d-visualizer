import type { BaseCamera } from '../abstractions/BaseCamera'

interface RoomBounds {
  width?: number
  height?: number
  depth?: number
  sceneCZ?: number
  [key: string]: unknown
}

interface CameraInput {
  type: string
  key?: string
  [key: string]: unknown
}

export class CameraSystem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  camera: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any>
  cameras: Map<string, BaseCamera>
  currentCamera: BaseCamera | null
  currentMode: string | null
  keysPressed: Record<string, boolean>
  roomBounds: RoomBounds

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(camera: any, THREE: any, options: Record<string, unknown> = {}) {
    this.camera = camera
    this.THREE = THREE
    this.options = options
    this.cameras = new Map()
    this.currentCamera = null
    this.currentMode = null
    this.keysPressed = {}
    this.roomBounds = {}
  }

  registerCamera(name: string, cameraInstance: BaseCamera): void {
    this.cameras.set(name, cameraInstance)
  }

  switchTo(mode: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = this.currentCamera as any
    if (cur && typeof cur.unlockPointer === 'function') {
      cur.unlockPointer()
    }
    this.currentCamera = this.cameras.get(mode) ?? null
    this.currentMode = mode
  }

  getCurrentMode(): string | null {
    return this.currentMode
  }

  update(deltaTime: number): void {
    if (this.currentCamera) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this.currentCamera as any).update(deltaTime, this.keysPressed, this.roomBounds)
    }
  }

  handleInput(input: CameraInput): void {
    if (input.type === 'keydown') {
      this.keysPressed[input.key as string] = true
    } else if (input.type === 'keyup') {
      this.keysPressed[input.key as string] = false
    } else if (this.currentCamera) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this.currentCamera as any).handleInput(input)
    }
  }

  setRoomBounds(bounds: RoomBounds): void {
    this.roomBounds = bounds
  }

  getCamera(): BaseCamera | null {
    return this.currentCamera
  }

  lockPointer(element: HTMLElement): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = this.currentCamera as any
    if (cur && typeof cur.lockPointer === 'function') {
      cur.lockPointer(element)
    }
  }

  unlockPointer(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cur = this.currentCamera as any
    if (cur && typeof cur.unlockPointer === 'function') {
      cur.unlockPointer()
    }
  }
}
