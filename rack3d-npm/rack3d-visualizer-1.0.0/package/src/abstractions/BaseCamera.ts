// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCamera = any

export class BaseCamera {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  camera: AnyCamera
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any>
  mode: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(camera: AnyCamera, options: Record<string, any> = {}) {
    this.camera = camera
    this.options = options
    this.mode = 'base'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(_deltaTime: number, ..._args: any[]): void {
    throw new Error('update() must be implemented')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleInput(_input: Record<string, any>): void {
    throw new Error('handleInput() must be implemented')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPosition(): any {
    return this.camera.position.clone()
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lookAt(target: any): void {
    this.camera.lookAt(target)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDirection(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const direction = new (this.camera.constructor as any).THREE.Vector3()
    this.camera.getWorldDirection(direction)
    return direction
  }
}
