import type { Device, Rack, LabelPosition } from '../types'
import type { IDeviceType } from '../types'
import type { MaterialFactory } from '../services/MaterialFactory'
import { hexToRgb } from '../constants'

interface RackOptions {
  unitHeight: number
  width: number
  depth: number
  postSize: number
}

export class DeviceBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  materialFactory: MaterialFactory
  deviceTypes: Record<string, IDeviceType>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(THREE: any, materialFactory: MaterialFactory, deviceTypes: Record<string, IDeviceType>) {
    this.THREE = THREE
    this.materialFactory = materialFactory
    this.deviceTypes = deviceTypes
  }

  build(
    device: Device,
    idx: number,
    labelSide: string,
    rackOptions: RackOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    group: any,
    entry: Rack,
    hw: number,
    hd: number,
    labelPositions: Record<string, LabelPosition>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deviceMeshes: Record<string, any>
  ): void {
    const ro = rackOptions
    const UH = ro.unitHeight
    const RW = ro.width
    const RD = ro.depth
    const POST = ro.postSize

    const isHalfLeft = device.halfWidth === 'left'
    const isHalfRight = device.halfWidth === 'right'
    const isHalf = isHalfLeft || isHalfRight
    const fullW = RW - POST * 2 - 0.06
    const dw = isHalf ? fullW / 2 - 0.04 : fullW
    const xOff = isHalf ? (isHalfLeft ? -(fullW / 4 + 0.02) : fullW / 4 + 0.02) : 0

    const dh = device.heightUnits * UH - 0.07
    const dd = RD - POST * 2 - 0.1
    const y = 0.6 + (device.startUnit - 1) * UH + dh / 2 + 0.035

    const typeInfo = this.deviceTypes[device.type] || this.deviceTypes['server']
    const rawCol = device.color || typeInfo.color
    const rawHex = typeInfo.hex
    const rgb = hexToRgb(rawCol)

    const bodyCol = new this.THREE.Color(...rgb.map((c: number) => c * 0.12 + 0.02) as [number, number, number])
    const bodyMat = this.materialFactory.createBodyMaterial(device.type, bodyCol)
    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(dw, dh, dd), bodyMat)
    body.userData.rk = 'dev'
    body.userData.deviceId = device.id
    body.userData.rackId = entry.id
    body.castShadow = true
    body.receiveShadow = true
    body.position.set(xOff, y, 0)
    group.add(body)

    const bezelCol = new this.THREE.Color(...rgb.map((c: number) => c * 0.28 + 0.04) as [number, number, number])
    const bezelMat = this.materialFactory.createFaceMaterial(device.type, bezelCol)
    const bezel = new this.THREE.Mesh(new this.THREE.BoxGeometry(dw, dh, 0.04), bezelMat)
    bezel.userData.rk = 'face'
    bezel.userData.deviceId = device.id
    bezel.userData.rackId = entry.id
    bezel.castShadow = true
    bezel.receiveShadow = true
    bezel.position.set(xOff, y, -hd + POST + 0.07)
    group.add(bezel)

    const faceW = dw - 0.08
    const faceH = dh - 0.08
    const panelCol = new this.THREE.Color(...rgb.map((c: number) => Math.min(1, c * 0.65 + 0.06)) as [number, number, number])
    const panelMat = this.materialFactory.createPanelMaterial(device.type, panelCol, rawHex, false).clone()
    const panel = new this.THREE.Mesh(new this.THREE.BoxGeometry(faceW, faceH, 0.02), panelMat)
    panel.userData.rk = 'face'
    panel.userData.deviceId = device.id
    panel.userData.rackId = entry.id
    panel.castShadow = true
    panel.receiveShadow = true
    panel.position.set(xOff, y, -hd + POST + 0.09)
    group.add(panel)
    deviceMeshes[device.id] = panel

    if (device.imageUrl) {
      const imgMat = new this.THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        side: this.THREE.BackSide
      })
      const imgPlane = new this.THREE.Mesh(new this.THREE.PlaneGeometry(faceW, faceH), imgMat)
      imgPlane.position.set(xOff, y, -hd + 0.04)
      imgPlane.userData.rk = 'devimage'
      imgPlane.userData.deviceId = device.id
      imgPlane.userData.rackId = entry.id
      imgPlane.renderOrder = 999
      imgPlane.material.depthTest = false
      imgPlane.scale.x = -1
      group.add(imgPlane)
      this._loadTextureAsync(device.imageUrl, imgMat)
    }

    if (device.imageUrlRear) {
      const rearMat = new this.THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        side: this.THREE.FrontSide
      })
      const rearPlane = new this.THREE.Mesh(new this.THREE.PlaneGeometry(faceW, faceH), rearMat)
      rearPlane.position.set(xOff, y, hd - 0.04)
      rearPlane.userData.rk = 'devimage'
      rearPlane.userData.deviceId = device.id
      rearPlane.userData.rackId = entry.id
      rearPlane.renderOrder = 999
      rearPlane.material.depthTest = false
      group.add(rearPlane)
      this._loadTextureAsync(device.imageUrlRear, rearMat)
    }

    const stripMat = this.materialFactory.createStripMaterial(rawHex)
    const strip = new this.THREE.Mesh(new this.THREE.BoxGeometry(faceW, Math.min(0.06, faceH * 0.18), 0.015), stripMat)
    strip.userData.rk = 'strip'
    strip.userData.deviceId = device.id
    strip.userData.rackId = entry.id
    strip.castShadow = true
    strip.receiveShadow = true
    strip.position.set(xOff, y + faceH / 2 - 0.04, -hd + POST + 0.1)
    group.add(strip)

    const ledCols = [0x00ff88, 0xff4400, 0x00aaff]
    const ln = Math.min(device.heightUnits * 4, 10)
    for (let l = 0; l < ln; l++) {
      const lc = ledCols[l % 3]
      const ledMat = this.materialFactory.createLedMaterial(lc)
      const led = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.028, 8, 8), ledMat)
      led.userData.rk = 'led'
      led.userData.deviceId = device.id
      led.userData.rackId = entry.id
      led.castShadow = true
      led.receiveShadow = true
      led.position.set(xOff - faceW / 2 + 0.1 + l * (faceW / (ln + 1)), y, -hd + POST + 0.11)
      group.add(led)
    }

    if ((device.type === 'server' || device.type === 'storage') && device.heightUnits >= 2) {
      this._buildDriveBays(device, xOff, y, faceW, faceH, dw, hd, POST, group, entry.id)
    }

    if (['switch', 'router', 'firewall', 'patch'].includes(device.type)) {
      this._buildPorts(device, xOff, y, faceW, faceH, hd, POST, group, entry.id)
    }

    if (device.heightUnits >= 2) {
      this._buildVents(device, xOff, y, dw, dh, dd, group, entry.id)
    }

    const angle = entry.facingAngle ?? 0
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const lz = -hd + 0.2
    const side = isHalf
      ? (isHalfLeft ? 'left' : 'right')
      : (labelSide === 'auto' ? (idx % 2 === 0 ? 'left' : 'right') : labelSide)
    const lx = side === 'left' ? -hw : hw
    const worldX = lx * cosA + lz * sinA + group.position.x
    const worldZ = -lx * sinA + lz * cosA + group.position.z
    labelPositions[device.id] = { pos: new this.THREE.Vector3(worldX, y, worldZ), side: side as 'left' | 'right' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildDriveBays(device: Device, xOff: number, y: number, faceW: number, faceH: number, _dw: number, hd: number, POST: number, group: any, rackId: string): void {
    const isHalf = device.halfWidth === 'left' || device.halfWidth === 'right'
    const bm = new this.THREE.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.85, metalness: 0.5 })
    const hm = new this.THREE.MeshStandardMaterial({ color: 0x1e2e44, roughness: 0.4, metalness: 0.9 })
    const bayCount = isHalf ? 2 : 4
    const rows2 = Math.min(device.heightUnits, 3)
    const bW = (faceW - 0.15) / bayCount
    const bH = Math.min((faceH - 0.25) / rows2, 0.18)

    for (let ri = 0; ri < rows2; ri++) {
      for (let c = 0; c < bayCount; c++) {
        const bx = xOff - faceW / 2 + 0.08 + c * bW + bW / 2
        const by = y + faceH / 2 - 0.15 - ri * (bH + 0.03)
        const bz = -hd + POST + 0.105

        const bay = new this.THREE.Mesh(new this.THREE.BoxGeometry(bW - 0.03, bH, 0.022), bm)
        bay.userData.rk = 'bay'
        bay.userData.rackId = rackId
        bay.castShadow = true
        bay.receiveShadow = true
        bay.position.set(bx, by, bz)
        group.add(bay)

        const handle = new this.THREE.Mesh(new this.THREE.BoxGeometry(bW - 0.06, 0.02, 0.015), hm)
        handle.userData.rk = 'bay'
        handle.userData.rackId = rackId
        handle.castShadow = true
        handle.receiveShadow = true
        handle.position.set(bx, by + bH / 2 - 0.02, bz - 0.013)
        group.add(handle)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildPorts(device: Device, xOff: number, y: number, faceW: number, faceH: number, hd: number, POST: number, group: any, rackId: string): void {
    const pm = new this.THREE.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.9 })
    const pam = new this.THREE.MeshStandardMaterial({
      color: 0x002a44,
      roughness: 0.5,
      emissive: new this.THREE.Color(0x0044aa),
      emissiveIntensity: 0.5
    })

    const isHalf = device.halfWidth === 'left' || device.halfWidth === 'right'
    const nP = device.type === 'patch'
      ? isHalf ? 12 : 24
      : device.type === 'switch'
      ? isHalf ? 6 : 12
      : isHalf ? 3 : 6

    const pW = Math.min((faceW - 0.2) / nP, 0.15)
    const pH = Math.min(faceH * 0.4, 0.08)

    for (let p = 0; p < nP; p++) {
      const px = xOff - faceW / 2 + 0.1 + p * (pW + 0.01) + pW / 2
      const portMat = Math.random() > 0.3 ? pam : pm
      const port = new this.THREE.Mesh(new this.THREE.BoxGeometry(pW, pH, 0.02), portMat)
      port.userData.rk = 'port'
      port.userData.rackId = rackId
      port.castShadow = true
      port.receiveShadow = true
      port.position.set(px, y - faceH * 0.05, -hd + POST + 0.11)
      group.add(port)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildVents(device: Device, xOff: number, y: number, dw: number, dh: number, dd: number, group: any, rackId: string): void {
    const vm = new this.THREE.MeshStandardMaterial({ color: 0x060a10, roughness: 0.95 })
    const nv = Math.min(device.heightUnits * 2, 8)
    for (let v = 0; v < nv; v++) {
      const vent = new this.THREE.Mesh(new this.THREE.BoxGeometry(dw * 0.55, 0.02, dd * 0.35), vm)
      vent.userData.rk = 'vent'
      vent.userData.rackId = rackId
      vent.castShadow = true
      vent.receiveShadow = true
      vent.position.set(xOff + dw * 0.08, y - dh / 2 + 0.06 + v * 0.15, 0.1)
      group.add(vent)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _loadTextureAsync(url: string, material: any): void {
    const loader = new this.THREE.TextureLoader()
    loader.load(
      url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tex: any) => {
        tex.encoding = 3001
        material.map = tex
        material.needsUpdate = true
      },
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => console.warn('[Rack3D] Could not load device image:', url, err)
    )
  }
}
