import type { IVisualizer } from '../types/visualizer'

export class GroupManager {
  private viz: IVisualizer
  selGroupId: string | null = null
  multiSel: Set<string> = new Set()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupHighlightRings: any[] = []

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  groupsArr(): { id: string; name: string; members: string[] }[] {
    return this.viz._room?.groups || []
  }

  groupMembersFlat(groupId: string): string[] {
    const grp = this.groupsArr().find((g) => g.id === groupId)
    if (!grp) return []
    const result: string[] = []
    for (const mid of grp.members) {
      if (this.groupsArr().find((g) => g.id === mid)) result.push(...this.groupMembersFlat(mid))
      else result.push(mid)
    }
    return result
  }

  itemGroupIds(id: string): string[] {
    return this.groupsArr().filter((g) => g.members.includes(id)).map((g) => g.id)
  }

  autoUngroup(id: string): void {
    const self = this.viz
    if (!self._room?.groups) return
    self._room.groups.forEach((g: { members: string[] }) => {
      g.members = g.members.filter((m: string) => m !== id)
    })
    self._room.groups = self._room.groups.filter((g: { members: string[] }) => g.members.length > 0)
    this.refreshGroupPanel()
  }

  createGroup(name?: string): void {
    const self = this.viz
    if (this.multiSel.size < 2) { alert('Select at least 2 items first'); return }
    const id = 'grp-' + Date.now().toString(36)
    if (!self._room!.groups) self._room!.groups = []
    self._room!.groups.push({ id, name: name || 'Group ' + this.groupsArr().length, members: [...this.multiSel] })
    this.multiSel.clear()
    this.selGroupId = id
    this.refreshGroupPanel()
    self._buildRack()
  }

  disbandGroup(groupId: string): void {
    const self = this.viz
    if (self._room!.groups) self._room!.groups = self._room!.groups.filter((g: { id: string }) => g.id !== groupId)
    if (this.selGroupId === groupId) this.selGroupId = null
    this.refreshGroupPanel()
    self._buildRack()
  }

  addMemberToGroup(groupId: string, memberId: string): void {
    const grp = this.groupsArr().find((g) => g.id === groupId)
    if (!grp) return
    if (!grp.members.includes(memberId)) grp.members.push(memberId)
    this.refreshGroupPanel()
  }

  removeMemberFromGroup(groupId: string, memberId: string): void {
    const grp = this.groupsArr().find((g) => g.id === groupId)
    if (!grp) return
    grp.members = grp.members.filter((m: string) => m !== memberId)
    if (grp.members.length === 0) this.disbandGroup(groupId)
    else this.refreshGroupPanel()
  }

  renameGroup(groupId: string, name: string): void {
    const grp = this.groupsArr().find((g) => g.id === groupId)
    if (grp) grp.name = name
    this.refreshGroupPanel()
  }

  toggleMultiSel(id: string): void {
    const self = this.viz
    if (this.multiSel.has(id)) this.multiSel.delete(id)
    else this.multiSel.add(id)
    this.refreshGroupPanel()
    self._buildRack()
  }

  selectGroup(groupId: string): void {
    const self = this.viz
    this.selGroupId = groupId
    this.multiSel.clear()
    this.refreshGroupPanel()
    self._buildRack()
  }

  groupCentroid(groupId: string): { x: number; z: number } {
    const self = this.viz
    const ids = this.groupMembersFlat(groupId)
    let x = 0, z = 0, count = 0
    for (const id of ids) {
      const item = (self._room!.room_items || []).find((i: { id: string }) => i.id === id)
      if (item) { x += item.x ?? 0; z += item.z ?? 0; count++; continue }
      const rack = (self._room!.racks || []).find((r: { id: string }) => r.id === id)
      if (rack) {
        const rg = self._geometryManager?.rackGroups[id]
        if (rg) { x += rg.position.x; z += rg.position.z; count++ }
      }
    }
    return count > 0 ? { x: x / count, z: z / count } : { x: 0, z: 0 }
  }

  moveGroupDelta(groupId: string, dx: number, dz: number): void {
    const self = this.viz
    const ids = this.groupMembersFlat(groupId)
    for (const id of ids) {
      const item = (self._room!.room_items || []).find((i: { id: string }) => i.id === id)
      if (item) { item.x = (item.x ?? 0) + dx; item.z = (item.z ?? 0) + dz; continue }
      const rack = (self._room!.racks || []).find((r: { id: string }) => r.id === id)
      if (rack) {
        const rg = self._geometryManager?.rackGroups[id]
        if (rg) {
          rack.position = { x: rg.position.x + dx, y: rg.position.y, z: rg.position.z + dz }
        }
      }
    }
    self._buildRack()
  }

  rotateGroupDelta(groupId: string, dDeg: number): void {
    const self = this.viz
    const c = this.groupCentroid(groupId)
    const rad = dDeg * Math.PI / 180
    const cos = Math.cos(rad), sin = Math.sin(rad)
    const ids = this.groupMembersFlat(groupId)
    for (const id of ids) {
      const item = (self._room!.room_items || []).find((i: { id: string }) => i.id === id)
      if (item) {
        const dx = (item.x ?? 0) - c.x, dz = (item.z ?? 0) - c.z
        item.x = c.x + dx * cos - dz * sin
        item.z = c.z + dx * sin + dz * cos
        item.angle = ((item.angle ?? 0) + dDeg + 360) % 360
        continue
      }
      const rack = (self._room!.racks || []).find((r: { id: string }) => r.id === id)
      if (rack) {
        const rg = self._geometryManager?.rackGroups[id]
        if (!rg) continue
        const dx = rg.position.x - c.x, dz = rg.position.z - c.z
        const nx = c.x + dx * cos - dz * sin, nz = c.z + dx * sin + dz * cos
        rack.position = { x: nx, y: rg.position.y, z: nz }
        rack.facingAngle = (rack.facingAngle || 0) + rad
      }
    }
    self._buildRack()
  }

  snapshotGroupPositions(groupId: string): Record<string, { x: number; y?: number; z: number; isItem?: boolean; isRack?: boolean }> {
    const self = this.viz
    const snap: Record<string, { x: number; y?: number; z: number; isItem?: boolean; isRack?: boolean }> = {}
    this.groupMembersFlat(groupId).forEach((id: string) => {
      const item = (self._room?.room_items || []).find((i: { id: string }) => i.id === id)
      if (item) { snap[id] = { x: item.x ?? 0, z: item.z ?? 0, isItem: true }; return }
      const rg = self._geometryManager?.rackGroups[id]
      if (rg) snap[id] = { x: rg.position.x, y: rg.position.y, z: rg.position.z, isRack: true }
    })
    return snap
  }

  snapshotGroupAngles(groupId: string): Record<string, { angle: number; isItem?: boolean; isRack?: boolean }> {
    const self = this.viz
    const snap: Record<string, { angle: number; isItem?: boolean; isRack?: boolean }> = {}
    this.groupMembersFlat(groupId).forEach((id: string) => {
      const item = (self._room?.room_items || []).find((i: { id: string }) => i.id === id)
      if (item) { snap[id] = { angle: item.angle ?? 0, isItem: true }; return }
      const rack = (self._room?.racks || []).find((r: { id: string }) => r.id === id)
      if (rack) snap[id] = { angle: rack.facingAngle ?? 0, isRack: true }
    })
    return snap
  }

  applyGroupDeltaFromSnapshot(posSnap: Record<string, { x: number; y?: number; z: number; isItem?: boolean; isRack?: boolean }>, dx: number, dz: number): void {
    const self = this.viz
    for (const [id, pos] of Object.entries(posSnap)) {
      if (pos.isItem) {
        const item = (self._room?.room_items || []).find((i: { id: string }) => i.id === id)
        if (item) {
          item.x = pos.x + dx; item.z = pos.z + dz
          const ig = self._geometryManager?.itemGroups?.[id]
          if (ig) { ig.position.x = item.x; ig.position.z = item.z }
        }
      } else if (pos.isRack) {
        const rack = (self._room?.racks || []).find((r: { id: string }) => r.id === id)
        if (rack) {
          rack.position = { x: pos.x + dx, y: pos.y ?? 0, z: pos.z + dz }
          const rg = self._rackGroups?.[id]
          if (rg) { rg.position.x = rack.position.x; rg.position.z = rack.position.z }
        }
      }
    }
  }

  applyGroupRotationFromSnapshot(angleSnap: Record<string, { angle: number; isItem?: boolean; isRack?: boolean }>, dDeg: number): void {
    const self = this.viz
    const rad = dDeg * Math.PI / 180
    for (const [id, snap] of Object.entries(angleSnap)) {
      const startAngle = snap.angle ?? 0
      if (snap.isItem) {
        const item = (self._room?.room_items || []).find((i: { id: string }) => i.id === id)
        if (item) {
          item.angle = startAngle + dDeg
          const ig = self._geometryManager?.itemGroups?.[id]
          if (ig) ig.rotation.y = item.angle * Math.PI / 180
        }
      } else if (snap.isRack) {
        const rack = (self._room?.racks || []).find((r: { id: string }) => r.id === id)
        if (rack) {
          rack.facingAngle = startAngle + rad
          const rg = self._rackGroups?.[id]
          if (rg) rg.rotation.y = rack.facingAngle
        }
      }
    }
  }

  showContextMenu(e: MouseEvent, targetId: string | null): void {
    const self = this.viz
    const menu = document.getElementById(self._id + '-ctx-menu')
    if (!menu) return
    menu.innerHTML = ''

    const addItem = (label: string, cb: () => void) => {
      const d = document.createElement('div')
      d.className = 'r3-ctx-item'
      d.textContent = label
      d.onclick = () => { menu.style.display = 'none'; cb() }
      menu.appendChild(d)
    }
    const addSep = () => {
      const d = document.createElement('div')
      d.className = 'r3-ctx-sep'
      menu.appendChild(d)
    }

    const groups = this.groupsArr()
    const hasMultiSel = this.multiSel.size >= 2
    const itemGroupIds = targetId ? this.itemGroupIds(targetId) : []

    if (hasMultiSel) {
      if (targetId && !this.multiSel.has(targetId)) {
        addItem(`⊞ Group with ${this.multiSel.size} selected`, () => {
          this.multiSel.add(targetId!)
          this.createGroup()
        })
      } else {
        addItem(`⊞ Group ${this.multiSel.size} selected`, () => this.createGroup())
      }
      addItem('✕ Clear selection', () => { this.multiSel.clear(); this.refreshGroupPanel(); self._buildRack() })
      if (targetId) addSep()
    }

    if (targetId) {
      const inGroups = groups.filter((g) => g.members.includes(targetId!))
      const notInGroups = groups.filter((g) => !g.members.includes(targetId!))

      if (!hasMultiSel) {
        addItem('⊞ Create group with this', () => {
          const id = 'grp-' + Date.now().toString(36)
          if (!self._room!.groups) self._room!.groups = []
          self._room!.groups.push({ id, name: 'Group ' + this.groupsArr().length, members: [targetId!] })
          this.selGroupId = id
          this.refreshGroupPanel()
          self._buildRack()
        })
      }

      notInGroups.forEach((grp) => {
        addItem(`Add to "${grp.name}"`, () => this.addMemberToGroup(grp.id, targetId!))
      })

      if (itemGroupIds.length > 0) {
        addSep()
        inGroups.forEach((grp) => {
          addItem(`Remove from "${grp.name}"`, () => this.removeMemberFromGroup(grp.id, targetId!))
          addItem(`Disband "${grp.name}"`, () => this.disbandGroup(grp.id))
        })
      }
    }

    if (menu.children.length === 0) return
    const vW = window.innerWidth, vH = window.innerHeight
    const mW = 180, mH = menu.children.length * 28
    menu.style.left = Math.min(e.clientX, vW - mW - 8) + 'px'
    menu.style.top = Math.min(e.clientY, vH - mH - 8) + 'px'
    menu.style.display = 'block'
  }

  hideContextMenu(): void {
    const self = this.viz
    const menu = document.getElementById(self._id + '-ctx-menu')
    if (menu) menu.style.display = 'none'
  }

  refreshGroupPanel(): void {
    const self = this.viz
    const el = document.getElementById(self._id + '-panel-groups')
    if (el) el.innerHTML = self._html.groupsPanelBody()
    const el2 = document.getElementById(self._id + '-room-items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (el2) el2.innerHTML = (self._room?.room_items || []).map((item: any, i: number) => self._html.roomItemRow(item, i)).join('')
  }

  buildGroupHighlights(): void {
    const self = this.viz
    if (!self._scene || !self._T3) return
    const T = self._T3
    const highlightIds = new Set<string>()
    if (this.selGroupId) {
      this.groupMembersFlat(this.selGroupId).forEach((id: string) => highlightIds.add(id))
    }
    this.multiSel.forEach((id: string) => highlightIds.add(id))
    if (highlightIds.size === 0) return

    for (const id of highlightIds) {
      const isMultiSel = this.multiSel.has(id) && !this.selGroupId
      const color = isMultiSel ? 0xffaa00 : 0x00aaff
      const item = (self._room?.room_items || []).find((i: { id: string }) => i.id === id)
      let px = 0, pz = 0
      if (item) { px = item.x ?? 0; pz = item.z ?? 0 }
      else {
        const rg = self._geometryManager?.rackGroups[id]
        if (rg) { px = rg.position.x; pz = rg.position.z }
        else continue
      }
      const mat = new T.MeshStandardMaterial({ color, emissive: new T.Color(color), emissiveIntensity: 1.5, transparent: true, opacity: 0.7 })
      const geo = new T.TorusGeometry(1.2, 0.05, 8, 32)
      const ring = new T.Mesh(geo, mat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(px, 0.05, pz)
      ring.userData.r3GroupRing = true
      self._scene.add(ring)
      this.groupHighlightRings.push(ring)
    }
  }
}
