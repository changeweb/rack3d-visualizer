import { BaseCamera } from './BaseCamera'

interface FpsCameraOptions {
  azimuth?: number
  elevation?: number
  fpsSpeed?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  [key: string]: unknown
}

interface RoomBounds {
  width: number
  height: number
  depth: number
  sceneCZ?: number
}

interface MouseMoveInput {
  type: 'mousemove'
  dx?: number
  dy?: number
}

type CameraInput = MouseMoveInput | { type: string; [key: string]: unknown }

export class FpsCamera extends BaseCamera {
  declare options: FpsCameraOptions
  yaw: number
  pitch: number
  pointerLocked: boolean
  mouseX: number
  mouseY: number
  dxSmooth: number
  dySmooth: number

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    camera: any,
    options: FpsCameraOptions
  ) {
    super(camera, options)
    this.mode = 'fps'
    this.yaw = options.azimuth ?? Math.PI
    this.pitch = options.elevation ?? 0.15
    this.pointerLocked = false
    this.mouseX = 0
    this.mouseY = 0
    this.dxSmooth = 0
    this.dySmooth = 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(deltaTime: number, keysPressed: Record<string, boolean>, roomBounds: RoomBounds, ..._rest: any[]): void {
    const speed = (this.options.fpsSpeed ?? 0.12) * deltaTime
    const T = this.options.THREE
    const pos = this.camera.position.clone()

    const forward = new T.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw))
    const right = new T.Vector3(Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2))

    if (keysPressed['w'] || keysPressed['W']) pos.addScaledVector(forward, speed)
    if (keysPressed['s'] || keysPressed['S']) pos.addScaledVector(forward, -speed)
    if (keysPressed['d'] || keysPressed['D']) pos.addScaledVector(right, speed)
    if (keysPressed['a'] || keysPressed['A']) pos.addScaledVector(right, -speed)
    if (keysPressed['q'] || keysPressed['Q']) pos.y -= speed
    if (keysPressed['e'] || keysPressed['E']) pos.y += speed

    const sceneZ = roomBounds.sceneCZ ?? 2
    const margin = 1.0
    pos.x = Math.max(-roomBounds.width / 2 + margin, Math.min(roomBounds.width / 2 - margin, pos.x))
    pos.y = Math.max(1.0, Math.min(roomBounds.height - 1.5, pos.y))
    pos.z = Math.max(sceneZ - roomBounds.depth / 2 + margin, Math.min(sceneZ + roomBounds.depth / 2 - margin, pos.z))

    this.camera.position.copy(pos)

    this.dxSmooth += (this.mouseX - this.dxSmooth) * 0.2
    this.dySmooth += (this.mouseY - this.dySmooth) * 0.2

    this.yaw += this.dxSmooth * 0.003
    this.pitch -= this.dySmooth * 0.003
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch))

    this.camera.quaternion.setFromEuler(new T.Euler(this.pitch, this.yaw, 0, 'YXZ'))

    this.mouseX = 0
    this.mouseY = 0
  }

  handleInput(input: CameraInput): void {
    if (input.type === 'mousemove') {
      const mi = input as MouseMoveInput
      this.mouseX += mi.dx ?? 0
      this.mouseY += mi.dy ?? 0
    }
  }

  lockPointer(element: HTMLElement): void {
    this.pointerLocked = true
    element.requestPointerLock?.()
  }

  unlockPointer(): void {
    this.pointerLocked = false
    document.exitPointerLock?.()
  }

  setYaw(value: number): void {
    this.yaw = value
  }

  setElevation(value: number): void {
    this.pitch = value
  }
}
