import type { Rack } from '../types'
import type { IThemeRack } from '../types'
import type { MaterialFactory } from '../services/MaterialFactory'

interface RackOptions {
  unitHeight: number
  width: number
  depth: number
  postSize: number
  showSidePanels?: boolean
  showRearPanel?: boolean
  showNameplate?: boolean
  nameplateScale?: number
  nameplateYOffset?: number
  nameplateOpacity?: number
}

export class RackBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  theme: unknown
  materialFactory: MaterialFactory

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(THREE: any, theme: unknown, materialFactory: MaterialFactory) {
    this.THREE = THREE
    this.theme = theme
    this.materialFactory = materialFactory
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(rack: Rack, rackOptions: RackOptions, rackTheme: IThemeRack, group: any, selRackId: string | null): any {
    const UH = rackOptions.unitHeight
    const RW = rackOptions.width
    const RD = rackOptions.depth
    const POST = rackOptions.postSize
    const H = (rack.units || 24) * UH + 1.3
    const my = H / 2
    const hw = RW / 2
    const hd = RD / 2

    const isSelected = rack.id === selRackId
    const selMix = isSelected ? 0.65 : 0
    const frameColor = isSelected
      ? new this.THREE.Color(rackTheme.frameColor).lerp(new this.THREE.Color(0x1155cc), selMix).getHex()
      : rackTheme.frameColor

    const steelMat = this.materialFactory.createFrameMaterial(frameColor)

    ;[[1, -1], [-1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
      const geo = new this.THREE.BoxGeometry(POST, H, POST)
      const mesh = new this.THREE.Mesh(geo, steelMat)
      mesh.userData.rk = 'frame'
      mesh.userData.rackId = rack.id
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(sx * (hw - POST / 2), my, sz * (hd - POST / 2))
      group.add(mesh)
    })

    ;[0.04, H - 0.04].forEach((y: number) => {
      const positions = [
        [[new this.THREE.BoxGeometry(RW, 0.08, 0.12), [0, y, -hd + 0.06]]],
        [[new this.THREE.BoxGeometry(RW, 0.08, 0.12), [0, y, hd - 0.06]]],
        [[new this.THREE.BoxGeometry(0.12, 0.08, RD), [-hw + 0.06, y, 0]]],
        [[new this.THREE.BoxGeometry(0.12, 0.08, RD), [hw - 0.06, y, 0]]]
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      positions.forEach(([[geo, [x, yPos, z]]]: any) => {
        const mesh = new this.THREE.Mesh(geo, steelMat)
        mesh.userData.rk = 'frame'
        mesh.userData.rackId = rack.id
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(x, yPos, z)
        group.add(mesh)
      })
    })

    for (let i = 1; i < rack.units; i += 8) {
      const y = 0.6 + i * UH
      const postMat = this.materialFactory.createFrameMaterial(rackTheme.postColor)
      ;[-hd + 0.06, hd - 0.06].forEach((z: number) => {
        const geo = new this.THREE.BoxGeometry(RW, 0.05, 0.1)
        const mesh = new this.THREE.Mesh(geo, postMat)
        mesh.userData.rk = 'frame'
        mesh.userData.rackId = rack.id
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(0, y, z)
        group.add(mesh)
      })
      ;[-hw + 0.06, hw - 0.06].forEach((x: number) => {
        const geo = new this.THREE.BoxGeometry(0.1, 0.05, RD)
        const mesh = new this.THREE.Mesh(geo, postMat)
        mesh.userData.rk = 'frame'
        mesh.userData.rackId = rack.id
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(x, y, 0)
        group.add(mesh)
      })
    }

    const railMat = this.materialFactory.createFrameMaterial(rackTheme.railColor)
    const nutMat = new this.THREE.MeshStandardMaterial({
      color: 0x3a4f68,
      roughness: 0.3,
      metalness: 1.0
    })

    for (let i = 0; i <= rack.units; i++) {
      const y = 0.6 + i * UH
      ;[-hw + POST, hw - POST].forEach((x: number) => {
        const rail = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, 0.022, 0.14), railMat)
        rail.userData.rk = 'rail'
        rail.userData.rackId = rack.id
        rail.castShadow = true
        rail.receiveShadow = true
        rail.position.set(x, y, -hd + 0.2)
        group.add(rail)

        const rail2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.04, 0.022, 0.14), railMat)
        rail2.userData.rk = 'rail'
        rail2.userData.rackId = rack.id
        rail2.castShadow = true
        rail2.receiveShadow = true
        rail2.position.set(x, y, hd - 0.2)
        group.add(rail2)
      })

      if (i < rack.units) {
        ;[-hw + 0.22, hw - 0.22].forEach((x: number) => {
          const nut = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.025, 0.025, 0.04, 6), nutMat)
          nut.userData.rk = 'nut'
          nut.userData.rackId = rack.id
          nut.castShadow = true
          nut.receiveShadow = true
          nut.rotation.x = Math.PI / 2
          nut.position.set(x, y + UH * 0.5, -hd + 0.06)
          group.add(nut)
        })
        this._buildUnitLabel(i + 1, y, hw, hd, UH, group, rack.id)
      }
    }

    if (rackOptions.showSidePanels) {
      const panelMat = new this.THREE.MeshStandardMaterial({
        color: 0x0f1622,
        roughness: 0.7,
        metalness: 0.5,
        transparent: true,
        opacity: 0.92
      })
      ;[-1, 1].forEach((s: number) => {
        const panel = new this.THREE.Mesh(new this.THREE.BoxGeometry(0.02, H - 0.2, RD - POST * 2), panelMat)
        panel.userData.rk = 'panel'
        panel.userData.rackId = rack.id
        panel.castShadow = true
        panel.receiveShadow = true
        panel.position.set(s * (hw - POST), my, 0)
        group.add(panel)
      })
    }

    if (rackOptions.showRearPanel) {
      const rearMat = new this.THREE.MeshStandardMaterial({
        color: 0x0c1420,
        roughness: 0.8,
        metalness: 0.4
      })
      const rearPanel = new this.THREE.Mesh(new this.THREE.BoxGeometry(RW - POST * 2, H - 0.2, 0.02), rearMat)
      rearPanel.userData.rk = 'panel'
      rearPanel.userData.rackId = rack.id
      rearPanel.castShadow = true
      rearPanel.receiveShadow = true
      rearPanel.position.set(0, my, hd - POST)
      group.add(rearPanel)
    }

    // Front semi-transparent mesh door (visible front-side indicator)
    {
      const frontDoorMat = new this.THREE.MeshStandardMaterial({
        color: (rackTheme as any).frameColor,
        roughness: 0.9,
        metalness: 0.45,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      })
      const frontDoor = new this.THREE.Mesh(
        new this.THREE.BoxGeometry(RW - POST * 2, H - 0.2, 0.04),
        frontDoorMat
      )
      frontDoor.userData.rk = 'door'
      frontDoor.userData.rackId = rack.id
      frontDoor.position.set(0, my, -hd + POST * 0.55)
      group.add(frontDoor)
    }

    // Rear cable management horizontal bars (distinctive rear indicator)
    {
      const cableMgmtMat = new this.THREE.MeshStandardMaterial({
        color: 0x111d2e,
        roughness: 0.95,
        metalness: 0.55,
      })
      const barInterval = Math.max(3, Math.floor(rack.units / 6))
      for (let i = barInterval; i < rack.units; i += barInterval) {
        const y = 0.6 + i * UH
        const bar = new this.THREE.Mesh(
          new this.THREE.BoxGeometry(RW - POST * 2, 0.10, 0.24),
          cableMgmtMat
        )
        bar.userData.rk = 'frame'
        bar.userData.rackId = rack.id
        bar.castShadow = true
        bar.receiveShadow = true
        bar.position.set(0, y, hd - POST * 0.55)
        group.add(bar)
      }
    }

    if (rackOptions.showNameplate) {
      const nameplateMat = new this.THREE.MeshStandardMaterial({
        color: 0x1a2a3f,
        roughness: 0.5,
        metalness: 0.7,
        emissive: new this.THREE.Color(0x003355),
        emissiveIntensity: 0.4
      })
      const nameplate = new this.THREE.Mesh(new this.THREE.BoxGeometry(RW - POST * 3, 0.22, 0.04), nameplateMat)
      nameplate.userData.rk = 'nameplate'
      nameplate.userData.rackId = rack.id
      nameplate.castShadow = true
      nameplate.receiveShadow = true
      nameplate.position.set(0, H - 0.2, -hd + 0.03)
      group.add(nameplate)
    }

    if (isSelected) {
      const indMat = new this.THREE.MeshBasicMaterial({
        color: 0x1a6fff, transparent: true, opacity: 0.5, depthWrite: false
      })
      const ind = new this.THREE.Mesh(new this.THREE.PlaneGeometry(RW + 0.6, RD + 0.6), indMat)
      ind.rotation.x = -Math.PI / 2
      ind.position.set(0, 0.03, 0)
      ind.userData.rackId = rack.id
      group.add(ind)

      const edgeGeo = new this.THREE.EdgesGeometry(new this.THREE.BoxGeometry(RW + 0.12, H + 0.04, RD + 0.12))
      const edgeMat = new this.THREE.LineBasicMaterial({ color: 0x00aaff, linewidth: 2 })
      const edges = new this.THREE.LineSegments(edgeGeo, edgeMat)
      edges.position.set(0, my, 0)
      edges.userData.rackId = rack.id
      group.add(edges)
    }

    this._buildRackLabel(rack, group, H, hw, hd, rackOptions, isSelected)
    return group
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildUnitLabel(unit: number, y: number, hw: number, hd: number, UH: number, group: any, rackId: string): void {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = 'rgba(10,20,35,0.72)'
    ctx.beginPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ctx as any).roundRect(2, 2, 252, 124, 8)
    ctx.fill()

    ctx.fillStyle = '#a8c8e8'
    ctx.font = 'bold 72px "Share Tech Mono",monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(unit), 128, 64)

    const tex = new this.THREE.CanvasTexture(canvas)
    const mat = new this.THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: this.THREE.FrontSide
    })

    const planeH = UH * 0.7
    const planeW = planeH * 2
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(planeW, planeH), mat)
    mesh.userData.rk = 'unitlabel'
    mesh.userData.rackId = rackId
    mesh.position.set(-hw + 0.10, y + UH * 0.5, -hd - 0.05)
    mesh.rotation.y = Math.PI
    group.add(mesh)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildRackLabel(rack: Rack, group: any, H: number, hw: number, hd: number, rackOptions: RackOptions, isSelected: boolean): void {
    const scale   = rackOptions.nameplateScale   ?? 1.0
    const yOffset = rackOptions.nameplateYOffset ?? 0.2
    const opacity = rackOptions.nameplateOpacity ?? 1.0

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    const bgFill = isSelected ? 'rgba(14,60,160,0.93)' : (rack.nameplateColor || 'rgba(8,14,24,0.92)')
    const accentColor = isSelected ? '#4488ff' : '#2e6090'
    const borderColor = isSelected ? '#4499ff' : 'rgba(60,100,150,0.55)'
    const textColor   = isSelected ? '#c8e8ff' : (rack.nameplateTextColor || '#cce4f8')

    const shape = rack.nameplateShape ?? 'rounded'
    ctx.fillStyle = bgFill
    ctx.beginPath()
    if (shape === 'rect') {
      ctx.rect(4, 4, 504, 120)
    } else if (shape === 'pill') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(ctx as any).roundRect(4, 4, 504, 120, 60)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(ctx as any).roundRect(4, 4, 504, 120, 12)
    }
    ctx.fill()

    ctx.strokeStyle = borderColor
    ctx.lineWidth = isSelected ? 3 : 1.5
    ctx.stroke()

    ctx.fillStyle = accentColor
    ctx.fillRect(4, 4, 16, 120)

    ctx.fillStyle = '#aad4f8'
    ctx.font = 'bold 38px "Courier New",monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('▣', 40, 64)

    ctx.fillStyle = textColor
    ctx.font = 'bold 58px "Courier New",monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(rack.name || rack.id, 62, 64)

    const tex = new this.THREE.CanvasTexture(canvas)
    const mat = new this.THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      depthWrite: false,
      side: this.THREE.FrontSide
    })
    const planeW = rackOptions.width * 0.88 * scale
    const planeH = planeW * (128 / 512)
    const mesh = new this.THREE.Mesh(new this.THREE.PlaneGeometry(planeW, planeH), mat)
    mesh.userData.rk = 'racklabel'
    mesh.userData.rackId = rack.id
    mesh.position.set(0, H + planeH * 0.5 + yOffset, -hd + 0.02)
    mesh.rotation.y = Math.PI
    group.add(mesh)
  }
}
