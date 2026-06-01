import type { IVisualizer } from '../types/visualizer'

export class TransformController {
  private viz: IVisualizer
  transformMode: 'move' | 'rotate' | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rackDragState: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemDragState: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rotateDragState: any = null

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  setTransformMode(mode: 'move' | 'rotate'): void {
    const self = this.viz
    this.transformMode = this.transformMode === mode ? null : mode
    self._transformMode = this.transformMode
    const btnM = document.getElementById(self._id + '-btnMove')
    const btnR = document.getElementById(self._id + '-btnRotate')
    if (btnM) btnM.className = 'r3-btn' + (this.transformMode === 'move' ? ' on' : '')
    if (btnR) btnR.className = 'r3-btn' + (this.transformMode === 'rotate' ? ' on' : '')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raycastFloor(clientX: number, clientY: number, cv: HTMLCanvasElement): any {
    const self = this.viz
    const T = self._T3
    if (!T || !self._cam) return null
    const rect = cv.getBoundingClientRect()
    const mx = ((clientX - rect.left) / cv.clientWidth) * 2 - 1
    const my = -((clientY - rect.top) / cv.clientHeight) * 2 + 1
    const raycaster = new T.Raycaster()
    raycaster.setFromCamera(new T.Vector2(mx, my), self._cam)
    const floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0)
    const hit = new T.Vector3()
    const ok = raycaster.ray.intersectPlane(floorPlane, hit)
    return ok ? hit : null
  }

  snapRackPos(x: number, z: number): { x: number; z: number } {
    const self = this.viz
    const ro = self._opts.room
    const wallHW = ro.width / 2
    const wallHD = ro.depth / 2
    const sceneCZ = 2
    const rackHW = self._opts.rack.width / 2
    const rackHD = self._opts.rack.depth / 2
    const snapDist = 1.2
    let sx = x, sz = z
    if (Math.abs(x - (-wallHW + rackHW)) < snapDist) sx = -wallHW + rackHW
    else if (Math.abs(x - (wallHW - rackHW)) < snapDist) sx = wallHW - rackHW
    if (Math.abs(z - (sceneCZ - wallHD + rackHD)) < snapDist) sz = sceneCZ - wallHD + rackHD
    else if (Math.abs(z - (sceneCZ + wallHD - rackHD)) < snapDist) sz = sceneCZ + wallHD - rackHD
    return { x: sx, z: sz }
  }
}
