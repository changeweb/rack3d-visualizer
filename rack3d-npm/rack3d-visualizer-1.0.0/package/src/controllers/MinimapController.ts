// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IVisualizer = any

export class MinimapController {
  constructor(private readonly viz: IVisualizer) {}

  update(): void {
    const self = this.viz
    const canvas = document.getElementById(self._id + '-minimap') as HTMLCanvasElement | null
    if (!canvas || !self._room) return
    const ctx = canvas.getContext('2d')!
    const CW = 180, CH = 140, pad = 4
    const W: number = (self._opts.room as any).width || 26
    const D: number = (self._opts.room as any).depth || 20
    const sceneZ = 2

    const wx2c = (wx: number) => (CW - pad) - (wx + W / 2) / W * (CW - 2 * pad)
    const wz2c = (wz: number) => (CH - pad) - (wz - (sceneZ - D / 2)) / D * (CH - 2 * pad)

    ctx.clearRect(0, 0, CW, CH)
    ctx.fillStyle = 'rgba(20,30,40,0.9)'
    ctx.fillRect(pad, pad, CW - 2 * pad, CH - 2 * pad)

    // Grid
    const tileSize: number = (self._opts.room as any).tileSize || 2
    ctx.strokeStyle = 'rgba(80,120,160,0.15)'
    ctx.lineWidth = 0.5
    for (let gx = -W / 2; gx <= W / 2; gx += tileSize) {
      const cx = wx2c(gx)
      ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, CH - pad); ctx.stroke()
    }
    for (let gz = sceneZ - D / 2; gz <= sceneZ + D / 2; gz += tileSize) {
      const cy = wz2c(gz)
      ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(CW - pad, cy); ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(80,130,180,0.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(pad, pad, CW - 2 * pad, CH - 2 * pad)

    // Cardinal labels
    ctx.font = 'bold 7px monospace'
    ctx.fillStyle = 'rgba(100,180,255,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('N', CW / 2, pad + 8)
    ctx.fillText('S', CW / 2, CH - pad - 1)
    ctx.textAlign = 'left'
    ctx.fillText('E', pad + 1, CH / 2 + 3)
    ctx.textAlign = 'right'
    ctx.fillText('W', CW - pad - 1, CH / 2 + 3)

    // Zones (drawn below racks)
    ;((self._room as any)?.zones || []).forEach((zone: any) => {
      if (zone.visible === false) return
      const col = typeof zone.color === 'string' ? zone.color : '#4488ff'
      const opacity: number = zone.opacity ?? 0.18
      const zx = wx2c(zone.x)
      const zy = wz2c(zone.z)
      const zw = zone.width / W * (CW - 2 * pad)
      const zh = zone.depth / D * (CH - 2 * pad)
      ctx.fillStyle = col + Math.round(opacity * 255).toString(16).padStart(2, '0')
      ctx.fillRect(zx - zw / 2, zy - zh / 2, zw, zh)
      ctx.strokeStyle = col + 'bb'
      ctx.lineWidth = 1
      ctx.strokeRect(zx - zw / 2, zy - zh / 2, zw, zh)
      ctx.font = '8px monospace'
      ctx.fillStyle = col
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, zx, zy - zh / 2 - 2)
    })

    // Racks
    const rackW = self._opts.rack.width
    const rackD = self._opts.rack.depth
    const rw2 = rackW / W * (CW - 2 * pad) / 2
    const rd2 = rackD / D * (CH - 2 * pad) / 2
    ;(self._room.racks || []).forEach((rack: any) => {
      const rg = self._rackGroups[rack.id] as any
      if (!rg) return
      const rx: number = rg.position.x
      const rz: number = rg.position.z
      const fa: number = rack.facingAngle ?? 0
      const sel = rack.id === self._selRackId
      ctx.save()
      ctx.translate(wx2c(rx), wz2c(rz))
      ctx.rotate(fa)
      ctx.fillStyle = sel ? 'rgba(0,200,140,0.5)' : 'rgba(50,110,155,0.55)'
      ctx.fillRect(-rw2, -rd2, rw2 * 2, rd2 * 2)
      ctx.strokeStyle = sel ? '#00ff88' : 'rgba(90,170,240,0.7)'
      ctx.lineWidth = sel ? 1.5 : 0.7
      ctx.strokeRect(-rw2, -rd2, rw2 * 2, rd2 * 2)
      // Front face indicator
      ctx.beginPath(); ctx.moveTo(-rw2, -rd2); ctx.lineTo(rw2, -rd2)
      ctx.strokeStyle = sel ? '#00ffcc' : '#0099ff'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.restore()
    })

    // Room items
    ;((self._room as any).room_items || []).forEach((item: any) => {
      const icx = wx2c(item.x ?? item.position?.x ?? 0)
      const icy = wz2c(item.z ?? item.position?.z ?? 0)
      ctx.beginPath(); ctx.arc(icx, icy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,200,80,0.75)'; ctx.fill()
    })

    // Camera marker
    if (self._ctrl.mode === 'fps') {
      const cpx = wx2c(self._ctrl.pos.x)
      const cpy = wz2c(self._ctrl.pos.z)
      const yaw = self._ctrl.yaw
      const sz = 5
      ctx.save()
      ctx.translate(cpx, cpy)
      ctx.rotate(yaw + Math.PI)
      ctx.beginPath()
      ctx.moveTo(0, sz + 2); ctx.lineTo(-sz / 2 - 1, -sz / 2); ctx.lineTo(sz / 2 + 1, -sz / 2)
      ctx.closePath()
      ctx.fillStyle = '#00ff88'; ctx.fill()
      ctx.restore()
    }

    // Position readout in header
    const posEl = document.getElementById(self._id + '-minimap-pos')
    if (posEl) {
      const posStr = self._ctrl.mode === 'fps' ? `${Math.round(self._ctrl.pos.x)}, ${Math.round(self._ctrl.pos.z)}` : ''
      if (posEl.textContent !== posStr) posEl.textContent = posStr
    }
  }

  toggle(): void {
    const self = this.viz
    self._showMinimap = !self._showMinimap
    const wrap = document.getElementById(self._id + '-minimap-wrap')
    const btn = document.getElementById(self._id + '-btnMinimap')
    if (wrap) wrap.style.display = self._showMinimap ? 'flex' : 'none'
    if (btn) btn.className = 'r3-btn' + (self._showMinimap ? ' on' : '')
    if (self._showMinimap) this.update()
  }

  onCanvasClick(e: MouseEvent): void {
    const self = this.viz
    if (self._ctrl.mode !== 'fps') return
    const canvas = e.currentTarget as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const CW = 160, CH = 120, pad = 4
    const W: number = (self._opts.room as any).width || 26
    const D: number = (self._opts.room as any).depth || 20
    self._ctrl.pos.x = W / 2 - (cx - pad) / (CW - 2 * pad) * W
    self._ctrl.pos.z = (CH - pad - cy) / (CH - 2 * pad) * D + (2 - D / 2)
  }
}
