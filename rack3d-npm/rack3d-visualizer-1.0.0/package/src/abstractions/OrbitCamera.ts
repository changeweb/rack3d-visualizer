import { BaseCamera } from './BaseCamera'

interface OrbitCameraOptions {
  azimuth?: number
  elevation?: number
  distance?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  [key: string]: unknown
}

interface OrbitInput {
  type: string
  x?: number
  y?: number
  deltaY?: number
}

export class OrbitCamera extends BaseCamera {
  declare options: OrbitCameraOptions
  azimuth: number
  elevation: number
  distance: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any
  isDragging: boolean
  lastMouseX: number
  lastMouseY: number

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    camera: any,
    options: OrbitCameraOptions
  ) {
    super(camera, options)
    this.mode = 'orbit'
    this.azimuth = options.azimuth ?? Math.PI
    this.elevation = options.elevation ?? 0.15
    this.distance = options.distance ?? 22
    this.target = new options.THREE.Vector3(0, 10, 2)
    this.isDragging = false
    this.lastMouseX = 0
    this.lastMouseY = 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(_deltaTime: number, ..._rest: any[]): void {
    const cos_el = Math.cos(this.elevation)
    this.camera.position.set(
      this.target.x + this.distance * cos_el * Math.sin(this.azimuth),
      this.target.y + this.distance * Math.sin(this.elevation),
      this.target.z + this.distance * cos_el * Math.cos(this.azimuth)
    )
    this.camera.lookAt(this.target)
  }

  handleInput(input: OrbitInput): void {
    if (input.type === 'mousedown') {
      this.isDragging = true
      this.lastMouseX = input.x ?? 0
      this.lastMouseY = input.y ?? 0
    } else if (input.type === 'mouseup') {
      this.isDragging = false
    } else if (input.type === 'mousemove' && this.isDragging) {
      const dx = (input.x ?? 0) - this.lastMouseX
      const dy = (input.y ?? 0) - this.lastMouseY
      this.azimuth -= dx * 0.005
      this.elevation += dy * 0.005
      this.elevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.elevation))
      this.lastMouseX = input.x ?? 0
      this.lastMouseY = input.y ?? 0
    } else if (input.type === 'wheel') {
      this.distance += (input.deltaY ?? 0) * 0.01
      this.distance = Math.max(5, Math.min(100, this.distance))
    }
  }

  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z)
  }

  setDistance(distance: number): void {
    this.distance = Math.max(5, Math.min(100, distance))
  }

  setAzimuth(angle: number): void {
    this.azimuth = angle
  }

  setElevation(angle: number): void {
    this.elevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle))
  }
}
