import type { RoomItem } from '../types'

const ITEM_ICONS: Record<string, string> = { ups: '⚡', battery: '🔋', shelf: '⊞', pdu: '⚡', aircon: '❄', sensor: '◉' }

export class RoomItemBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  theme: unknown

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(THREE: any, theme?: unknown) {
    this.THREE = THREE
    this.theme = theme ?? null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(item: RoomItem): any {
    const group = new this.THREE.Group()
    group.position.set(item.x ?? 0, item.y ?? 0, item.z ?? 0)
    group.rotation.y = ((item.angle ?? 0) * Math.PI) / 180
    group.userData.itemId = item.id
    group.userData.itemType = item.type

    switch (item.type) {
      case 'ups':     this._buildUPS(group, item);     break
      case 'battery': this._buildBattery(group, item); break
      case 'shelf':   this._buildShelf(group, item);   break
      case 'pdu':     this._buildPDU(group, item);     break
      case 'aircon':  this._buildAircon(group, item);  break
      case 'sensor':  this._buildSensor(group, item);  break
      default:        this._buildGenericBox(group, item); break
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    group.traverse((obj: any) => {
      if (obj.isMesh && !obj.userData.itemLabel) {
        obj.userData.itemId = item.id
      }
    })

    return group
  }

  _color(item: RoomItem, fallback: number): number {
    const c = item.color
    if (!c) return fallback
    if (typeof c === 'string') return parseInt(c.replace('#', ''), 16)
    return c as unknown as number
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _mat(color: number, opts: Record<string, any> = {}): any {
    return new this.THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4, ...opts })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildUPS(group: any, item: RoomItem): void {
    const W = item.width ?? 3.0, H = item.height ?? 8.0, D = item.depth ?? 1.8
    const col = this._color(item, 0x2a3a50)
    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H, D), this._mat(col))
    body.position.set(0, H / 2, 0)
    body.castShadow = true; body.receiveShadow = true
    group.add(body)

    const panelMat = this._mat(0x1a2a3f, { emissive: new this.THREE.Color(0x003366), emissiveIntensity: 0.4 })
    const panel = new this.THREE.Mesh(new this.THREE.BoxGeometry(W - 0.1, H * 0.35, 0.05), panelMat)
    panel.position.set(0, H * 0.65, -D / 2 - 0.02)
    group.add(panel)

    for (let i = 0; i < 5; i++) {
      const slot = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.7, 0.04, 0.04), this._mat(0x0a1020))
      slot.position.set(0, H * 0.25 + i * 0.15, -D / 2 - 0.02)
      group.add(slot)
    }

    const ledMat = new this.THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: new this.THREE.Color(0x00ff88), emissiveIntensity: 2.0 })
    const led = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.06, 8, 8), ledMat)
    led.position.set(W / 2 - 0.2, H * 0.6, -D / 2 - 0.04)
    group.add(led)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildBattery(group: any, item: RoomItem): void {
    const W = item.width ?? 3.6, H = item.height ?? 2.5, D = item.depth ?? 2.0
    const col = this._color(item, 0x111a11)

    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H * 0.85, D), this._mat(col, { roughness: 0.7, metalness: 0.1 }))
    body.position.set(0, H * 0.85 / 2, 0)
    body.castShadow = true; body.receiveShadow = true
    group.add(body)

    const lid = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H * 0.15, D * 0.9), this._mat(0x1a2a1a, { roughness: 0.6 }))
    lid.position.set(0, H * 0.85 + H * 0.075, 0)
    lid.castShadow = true
    group.add(lid)

    const handleMat = this._mat(0x222222, { roughness: 0.8, metalness: 0.1 })
    const handleBar = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.55, 0.1, 0.14), handleMat)
    handleBar.position.set(0, H + 0.22, 0)
    group.add(handleBar)
    ;[-W * 0.275, W * 0.275].forEach((x: number) => {
      const leg = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.14, 0.28, 0.14), handleMat)
      leg.position.set(x, H + 0.08, 0)
      group.add(leg)
    })

    const posMat = this._mat(0xdd2222, { roughness: 0.3, metalness: 0.8 })
    const posBase = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), posMat)
    posBase.position.set(-W * 0.28, H + 0.05, 0)
    group.add(posBase)
    const posPost = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), posMat)
    posPost.position.set(-W * 0.28, H + 0.16, 0)
    group.add(posPost)

    const negMat = this._mat(0x222222, { roughness: 0.3, metalness: 0.8 })
    const negBase = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), negMat)
    negBase.position.set(W * 0.28, H + 0.05, 0)
    group.add(negBase)
    const negPost = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.1, 0.1, 0.22, 12), negMat)
    negPost.position.set(W * 0.28, H + 0.16, 0)
    group.add(negPost)

    for (let i = 0; i < 6; i++) {
      const ridge = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, H * 0.4, 0.12), this._mat(0x1a2a1a))
      ridge.position.set(-W / 2 - 0.02, H * 0.4, -D * 0.25 + i * (D * 0.45 / 5))
      group.add(ridge)
    }

    const labelMat = this._mat(0xddcc00, { roughness: 0.4, metalness: 0.0 })
    const label = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.7, H * 0.15, 0.03), labelMat)
    label.position.set(0, H * 0.5, -D / 2 - 0.015)
    group.add(label)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildShelf(group: any, item: RoomItem): void {
    const W = item.width ?? 5.0, H = item.height ?? 5.0, D = item.depth ?? 1.2
    const layers = item.layers ?? 3
    const col = this._color(item, 0x3a4a5a)
    const frameMat = this._mat(col, { roughness: 0.4, metalness: 0.6 })
    const shelfMat = this._mat(0x2a3545, { roughness: 0.6, metalness: 0.3 })

    const postH = H + 0.5
    ;[[W / 2 - 0.05, D / 2 - 0.05], [-W / 2 + 0.05, D / 2 - 0.05],
      [W / 2 - 0.05, -D / 2 + 0.05], [-W / 2 + 0.05, -D / 2 + 0.05]].forEach(([px, pz]) => {
      const post = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.08, postH, 0.08), frameMat)
      post.position.set(px, postH / 2, pz)
      group.add(post)
    })

    for (let l = 0; l <= layers; l++) {
      const y = (l / layers) * H
      const shelf = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, 0.06, D), shelfMat)
      shelf.position.set(0, y, 0)
      shelf.castShadow = true; shelf.receiveShadow = true
      group.add(shelf)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildPDU(group: any, item: RoomItem): void {
    const W = item.width ?? 0.5, H = item.height ?? 10.0, D = item.depth ?? 0.4
    const col = this._color(item, 0x1a2535)
    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H, D), this._mat(col))
    body.position.set(0, H / 2, 0)
    body.castShadow = true; body.receiveShadow = true
    group.add(body)

    const outlets = 8
    for (let i = 0; i < outlets; i++) {
      const sock = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.12, 0.1, 0.04), this._mat(0x0a1420))
      sock.position.set(0, H * 0.1 + i * (H * 0.8 / outlets), -D / 2 - 0.02)
      group.add(sock)
    }

    const ledMat = new this.THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: new this.THREE.Color(0x0066cc), emissiveIntensity: 1.5 })
    const led = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, H * 0.7, 0.03), ledMat)
    led.position.set(W / 2 - 0.04, H / 2, 0)
    group.add(led)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildAircon(group: any, item: RoomItem): void {
    const W = item.width ?? 4.0, H = item.height ?? 10.0, D = item.depth ?? 2.0
    const col = this._color(item, 0x2d4055)
    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H, D), this._mat(col))
    body.position.set(0, H / 2, 0)
    body.castShadow = true; body.receiveShadow = true
    group.add(body)

    const finCount = 14
    for (let i = 0; i < finCount; i++) {
      const fin = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.85, 0.06, 0.15), this._mat(0x1a2d40, { roughness: 0.7 }))
      fin.position.set(0, H * 0.15 + i * (H * 0.6 / finCount), -D / 2 - 0.04)
      fin.rotation.x = 0.2
      group.add(fin)
    }

    const dispMat = this._mat(0x001122, { emissive: new this.THREE.Color(0x0088cc), emissiveIntensity: 0.6 })
    const disp = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.4, 0.6, 0.04), dispMat)
    disp.position.set(0, H * 0.88, -D / 2 - 0.03)
    group.add(disp)

    const intakeMat = this._mat(0x1a2535, { roughness: 0.9 })
    const intake = new this.THREE.Mesh(new this.THREE.BoxGeometry(W * 0.85, H * 0.5, 0.04), intakeMat)
    intake.position.set(0, H * 0.5, D / 2 + 0.02)
    group.add(intake)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildSensor(group: any, item: RoomItem): void {
    const col = this._color(item, 0x2a4060)
    const base = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.4, 0.15, 0.4), this._mat(col))
    base.position.set(0, 0.075, 0)
    group.add(base)

    const domeMat = new this.THREE.MeshStandardMaterial({ color: 0x88bbdd, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.7 })
    const dome = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeMat)
    dome.position.set(0, 0.15, 0)
    group.add(dome)

    const ledMat = new this.THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: new this.THREE.Color(0xffaa00), emissiveIntensity: 2.5 })
    const led = new this.THREE.Mesh(new this.THREE.SphereGeometry(0.03, 8, 8), ledMat)
    led.position.set(0.12, 0.14, 0.12)
    group.add(led)

    if ((item.y ?? 0) === 0) {
      const pole = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.025, 0.025, 2.0, 8), this._mat(0x3a4a5a, { metalness: 0.7 }))
      pole.position.set(0, -1.0, 0)
      group.add(pole)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildGenericBox(group: any, item: RoomItem): void {
    const W = item.width ?? 2, H = item.height ?? 4, D = item.depth ?? 1.5
    const col = this._color(item, 0x2a3a50)
    const body = new this.THREE.Mesh(new this.THREE.BoxGeometry(W, H, D), this._mat(col))
    body.position.set(0, H / 2, 0)
    body.castShadow = true; body.receiveShadow = true
    group.add(body)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildLabel(item: RoomItem): any {
    const isBattery = item.type === 'battery'
    const text = item.label || item.name || item.type
    const icon = ITEM_ICONS[item.type] || '▣'

    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 128
    const ctx = canvas.getContext('2d')!

    let accentColor = '#2e6090'
    if (item.color && typeof item.color === 'string' && item.color.startsWith('#')) {
      accentColor = item.color
    }

    ctx.fillStyle = isBattery ? 'rgba(8,20,8,0.88)' : 'rgba(8,14,24,0.92)'
    ctx.beginPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ctx as any).roundRect(4, 4, 504, 120, isBattery ? 6 : 12)
    ctx.fill()

    ctx.strokeStyle = isBattery ? 'rgba(40,100,40,0.6)' : 'rgba(60,100,150,0.55)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = isBattery ? '#2a8a2a' : accentColor
    ctx.fillRect(4, 4, 12, 120)

    if (!isBattery) {
      ctx.fillStyle = '#aad4f8'
      ctx.font = '40px "Share Tech Mono",monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(icon, 40, 64)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textColor = (item as any).nameplateTextColor ?? (isBattery ? '#88dd88' : '#cce4f8')
    ctx.fillStyle = textColor
    ctx.font = isBattery ? 'bold 44px "Share Tech Mono",monospace' : 'bold 50px "Share Tech Mono",monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, isBattery ? 24 : 62, 64)

    const tex = new this.THREE.CanvasTexture(canvas)
    const mat = new this.THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, side: this.THREE.FrontSide
    })

    const planeW = isBattery ? 1.0 : 2.8
    const planeH = planeW * (128 / 512)
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(planeW, planeH), mat)
    mesh.rotation.y = isBattery ? 0 : Math.PI
    mesh.userData.itemLabel = true
    return mesh
  }

  _defaultHeight(type: string): number {
    const defaults: Record<string, number> = { ups: 8, battery: 2.5, shelf: 5, pdu: 10, aircon: 10, sensor: 2.2 }
    return defaults[type] ?? 4
  }
}
