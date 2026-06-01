import type { IVisualizer } from '../types/visualizer'

export class InputHandler {
  private viz: IVisualizer
  private _unbind: (() => void) | null = null

  constructor(viz: IVisualizer) {
    this.viz = viz
  }

  bindCameraControls(cv: HTMLCanvasElement): void {
    const self = this.viz
    const o = self._opts.camera
    let dragStartX = 0, dragStartY = 0
    let lockedMoveAccum = 0
    self._ctrl.pointerLocked = false

    cv.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button !== 0) return

      if (self._transformMode && !self._ctrl.pointerLocked && self._room) {
        const rect = cv.getBoundingClientRect()
        const hit = self._selectionManager?.raycast(
          e.clientX - rect.left, e.clientY - rect.top, cv.clientWidth, cv.clientHeight
        )
        if (hit) {
          const isRack = hit.type === 'rack' || (hit.rackId && hit.type !== 'item')
          const isItem = hit.type === 'item'

          if (self._transformMode === 'move') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const floorHit = self._raycastFloor(e.clientX, e.clientY, cv) as any
            if (floorHit) {
              if (isRack) {
                const rackId = hit.rackId || hit.id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rack = (self._room!.racks || []).find((r: any) => r.id === rackId)
                if (rack) {
                  self._selRackId = rack.id; self._rack = rack
                  const rg = self._rackGroups[rack.id]
                  const gid = self._selGroupId && self._itemGroupIds(rackId).includes(self._selGroupId) ? self._selGroupId : null
                  self._rackDragState = {
                    active: true, rackId: rack.id,
                    offsetX: floorHit.x - ((rg as { position?: { x: number; z: number } })?.position?.x ?? 0),
                    offsetZ: floorHit.z - ((rg as { position?: { x: number; z: number } })?.position?.z ?? 0),
                    groupId: gid,
                    anchorStartX: (rg as { position?: { x: number } })?.position?.x ?? 0,
                    anchorStartZ: (rg as { position?: { z: number } })?.position?.z ?? 0,
                    groupStartPos: gid ? self._snapshotGroupPositions(gid) : null,
                    lastRebuild: 0
                  }
                  cv.style.cursor = 'move'; return
                }
              } else if (isItem) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const item = (self._room!.room_items || []).find((it: any) => it.id === hit.id)
                if (item) {
                  self._selItemId = hit.id
                  const gid = self._selGroupId && self._itemGroupIds(hit.id).includes(self._selGroupId) ? self._selGroupId : null
                  self._itemDragState = {
                    active: true, itemId: hit.id,
                    offsetX: floorHit.x - (item.x || 0), offsetZ: floorHit.z - (item.z || 0),
                    groupId: gid,
                    anchorStartX: item.x ?? 0, anchorStartZ: item.z ?? 0,
                    groupStartPos: gid ? self._snapshotGroupPositions(gid) : null,
                    lastRebuild: 0
                  }
                  cv.style.cursor = 'move'; return
                }
              }
            }
          } else if (self._transformMode === 'rotate') {
            if (isRack) {
              const rackId = hit.rackId || hit.id
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rack = (self._room!.racks || []).find((r: any) => r.id === rackId)
              if (rack) {
                self._selRackId = rack.id; self._rack = rack
                const gid = self._selGroupId && self._itemGroupIds(rackId).includes(self._selGroupId) ? self._selGroupId : null
                self._rotateDragState = {
                  active: true, type: 'rack', id: rackId,
                  startX: e.clientX, startAngle: rack.facingAngle || 0,
                  groupId: gid,
                  groupStartAngles: gid ? self._snapshotGroupAngles(gid) : null
                }
                cv.style.cursor = 'ew-resize'; return
              }
            } else if (isItem) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const item = (self._room!.room_items || []).find((it: any) => it.id === hit.id)
              if (item) {
                self._selItemId = hit.id
                const gid = self._selGroupId && self._itemGroupIds(hit.id).includes(self._selGroupId) ? self._selGroupId : null
                self._rotateDragState = {
                  active: true, type: 'item', id: hit.id,
                  startX: e.clientX, startAngle: item.angle || 0,
                  groupId: gid,
                  groupStartAngles: gid ? self._snapshotGroupAngles(gid) : null
                }
                cv.style.cursor = 'ew-resize'; return
              }
            }
          }
        }
      }

      self._ctrl.drag = true
      self._ctrl.lx = dragStartX = e.clientX
      self._ctrl.ly = dragStartY = e.clientY
      lockedMoveAccum = 0
      if (self._ctrl.mode === 'fps' && !self._ctrl.pointerLocked) cv.style.cursor = 'grabbing'
    })

    const onPointerLockChange = () => {
      self._ctrl.pointerLocked = document.pointerLockElement === cv
      lockedMoveAccum = 0
      const b = document.getElementById(self._id + '-btnCam')
      const tip = document.getElementById(self._id + '-tip')
      if (self._ctrl.pointerLocked) {
        cv.style.cursor = 'none'
        if (b) b.textContent = '🔓 UNLOCK'
        if (tip) tip.textContent = 'Mouse locked · WS walk · A/D or ← → rotate · Q/E up/down · Click to select · ESC to release'
      } else {
        cv.style.cursor = 'crosshair'
        if (b) b.textContent = self._ctrl.mode === 'fps' ? '⊹ FPS' : '⊕ ORBIT'
        if (tip) tip.textContent = self._ctrl.mode === 'fps'
          ? '🖱 Drag to rotate · WS walk · A/D or ← → rotate · Click ⊹FPS button to lock mouse'
          : '🖱 Drag to orbit · Scroll to zoom · Click to select'
      }
    }
    document.addEventListener('pointerlockchange', onPointerLockChange)

    const onMouseMove = (e: MouseEvent) => {
      if (self._rotateDragState?.active) {
        const deltaX = e.clientX - self._rotateDragState.startX
        const ds = self._rotateDragState
        if (ds.groupId && ds.groupStartAngles) {
          const dDeg = deltaX * 0.45
          self._applyGroupRotationFromSnapshot(ds.groupStartAngles, dDeg)
        } else if (ds.type === 'rack') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rack = (self._room?.racks || []).find((r: any) => r.id === ds.id)
          if (rack) {
            rack.facingAngle = ds.startAngle + deltaX * 0.008
            const rg = self._rackGroups?.[ds.id]
            if (rg) (rg as { rotation: { y: number } }).rotation.y = rack.facingAngle ?? 0
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const item = (self._room?.room_items || []).find((it: any) => it.id === ds.id)
          if (item) {
            item.angle = ds.startAngle + deltaX * 0.45
            const ig = self._geometryManager?.itemGroups?.[ds.id]
            if (ig) (ig as { rotation: { y: number } }).rotation.y = (item.angle ?? 0) * Math.PI / 180
          }
        }
        return
      }

      if (self._itemDragState?.active) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const floorHit = self._raycastFloor(e.clientX, e.clientY, cv) as any
        if (floorHit) {
          const ds = self._itemDragState
          const newX = floorHit.x - ds.offsetX
          const newZ = floorHit.z - ds.offsetZ
          if (ds.groupId && ds.groupStartPos) {
            self._applyGroupDeltaFromSnapshot(ds.groupStartPos, newX - ds.anchorStartX, newZ - ds.anchorStartZ)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const item = (self._room?.room_items || []).find((it: any) => it.id === ds.itemId)
            if (item) {
              item.x = newX; item.z = newZ
              const ig = self._geometryManager?.itemGroups?.[ds.itemId]
              if (ig) { (ig as { position: { x: number; z: number } }).position.x = newX; (ig as { position: { x: number; z: number } }).position.z = newZ }
            }
          }
        }
        return
      }

      if (self._rackDragState?.active) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const floorHit = self._raycastFloor(e.clientX, e.clientY, cv) as any
        if (floorHit) {
          const ds = self._rackDragState
          if (ds.groupId && ds.groupStartPos) {
            const newX = floorHit.x - ds.offsetX
            const newZ = floorHit.z - ds.offsetZ
            self._applyGroupDeltaFromSnapshot(ds.groupStartPos, newX - ds.anchorStartX, newZ - ds.anchorStartZ)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rack = (self._room?.racks || []).find((r: any) => r.id === ds.rackId)
            if (rack) {
              let nx = floorHit.x - ds.offsetX
              let nz = floorHit.z - ds.offsetZ
              const snapped = self._snapRackPos(nx, nz)
              nx = snapped.x; nz = snapped.z
              const ro = self._opts.room
              const rHW = self._opts.rack.width / 2, rHD = self._opts.rack.depth / 2
              nx = Math.max(-ro.width / 2 + rHW, Math.min(ro.width / 2 - rHW, nx))
              nz = Math.max(2 - ro.depth / 2 + rHD, Math.min(2 + ro.depth / 2 - rHD, nz))
              rack.position = { x: nx, y: rack.position?.y ?? 0, z: nz }
              const rg = self._rackGroups?.[ds.rackId]
              if (rg) { (rg as { position: { x: number; z: number } }).position.x = nx; (rg as { position: { x: number; z: number } }).position.z = nz }
            }
          }
        }
        return
      }

      if (self._ctrl.pointerLocked) {
        lockedMoveAccum += Math.abs(e.movementX) + Math.abs(e.movementY)
        self._ctrl.yaw += e.movementX * 0.003
        self._ctrl.pitch = Math.max(-1.3, Math.min(1.3, self._ctrl.pitch - e.movementY * 0.003))
        self._posCamera()
        return
      }
      if (!self._ctrl.drag) return
      const dx = e.clientX - self._ctrl.lx
      const dy = e.clientY - self._ctrl.ly
      if (self._ctrl.mode === 'fps') {
        self._ctrl.yaw += dx * (o.orbitSpeed * 1.8)
        self._ctrl.pitch = Math.max(-1.3, Math.min(1.3, self._ctrl.pitch - dy * (o.orbitSpeed * 1.8)))
      } else {
        self._ctrl.az -= dx * o.orbitSpeed
        self._ctrl.el = Math.max(-0.1, Math.min(1.45, self._ctrl.el + dy * o.orbitSpeed))
      }
      self._ctrl.lx = e.clientX; self._ctrl.ly = e.clientY
      self._posCamera()
    }

    const onMouseUp = (e: MouseEvent) => {
      if (self._rotateDragState?.active) {
        const wasRack = self._rotateDragState.type === 'rack'
        self._rotateDragState = null
        cv.style.cursor = 'crosshair'
        if (wasRack) { self._buildRack(); self._refresh() }
        else { self._buildRoomItems(); self._renderRoomItems() }
        return
      }

      if (self._itemDragState?.active) {
        self._itemDragState = null
        cv.style.cursor = 'crosshair'
        self._buildRoomItems()
        self._renderRoomItems()
        return
      }

      if (self._rackDragState?.active) {
        self._rackDragState = null
        cv.style.cursor = 'crosshair'
        self._buildRack()
        self._refresh()
        return
      }

      if (self._ctrl.pointerLocked) {
        if (lockedMoveAccum < 12) {
          const rect = cv.getBoundingClientRect()
          self._doRaycast({ clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 } as MouseEvent, cv)
        }
        lockedMoveAccum = 0
        return
      }
      if (self._ctrl.drag) {
        const dx = Math.abs(e.clientX - dragStartX)
        const dy = Math.abs(e.clientY - dragStartY)
        if (dx < 5 && dy < 5) self._doRaycast(e, cv)
      }
      self._ctrl.drag = false
      if (self._ctrl.mode === 'fps') cv.style.cursor = 'crosshair'
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    cv.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      if (self._ctrl.mode === 'fps') {
        const { yaw, pitch } = self._ctrl
        const cp = Math.cos(pitch)
        const dir = e.deltaY < 0 ? 1 : -1
        const spd = 0.8
        self._ctrl.pos.x += dir * spd * cp * Math.sin(yaw)
        self._ctrl.pos.y += dir * spd * Math.sin(pitch)
        self._ctrl.pos.z += dir * spd * cp * Math.cos(yaw)
      } else {
        self._ctrl.r = Math.max(o.minDistance, Math.min(o.maxDistance, self._ctrl.r + e.deltaY * o.zoomSpeed))
      }
      self._posCamera()
    }, { passive: false })

    const onKeyDown = (e: KeyboardEvent) => {
      self._ctrl.keys[e.code] = true
      if (self._ctrl.pointerLocked && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => { self._ctrl.keys[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    cv.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
      const rect = cv.getBoundingClientRect()
      const result = self._selectionManager?.raycast(
        e.clientX - rect.left, e.clientY - rect.top, cv.clientWidth, cv.clientHeight
      )
      let targetId: string | null = null
      if (result) {
        if (result.type === 'rack') targetId = result.id
        else if (result.type === 'item') targetId = result.id
        else if (result.rackId) targetId = result.rackId
      }
      self._showContextMenu(e, targetId)
    })
    document.addEventListener('mousedown', (e: MouseEvent) => {
      const menu = document.getElementById(self._id + '-ctx-menu')
      if (menu && !menu.contains(e.target as Node)) self._hideContextMenu()
    }, true)

    self._unbindKeys = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
    this._unbind = self._unbindKeys
  }

  doRaycast(e: MouseEvent, cv: HTMLCanvasElement): void {
    const self = this.viz
    const rect = cv.getBoundingClientRect()
    const result = self._selectionManager.raycast(
      e.clientX - rect.left, e.clientY - rect.top,
      cv.clientWidth, cv.clientHeight
    )

    const ctrlKey = e.ctrlKey || e.metaKey

    if (result?.type === 'device') {
      if (ctrlKey) {
        // Ctrl+click on device does nothing for multi-sel
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rack = (self._room?.racks || []).find((r: any) => r.id === result.rackId)
        if (rack) {
          self._selRackId = result.rackId; self._rack = rack
          self._selId = result.id; self._selItemId = null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dev = (rack.devices || []).find((d: any) => d.id === self._selId)
          if (dev) { self._openEdit(dev); if (self._opts.onSelect) self._opts.onSelect({ type: 'device', id: dev.id, rackId: result.rackId }) }
        }
      }
    } else if (result?.type === 'rack') {
      if (ctrlKey) {
        self._toggleMultiSel(result.id)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rack = (self._room?.racks || []).find((r: any) => r.id === result.id)
      if (rack) { self._selRackId = result.id; self._rack = rack }
      self._selId = null; self._selItemId = null; self._closeEdit()
    } else if (result?.type === 'item') {
      if (ctrlKey) {
        self._toggleMultiSel(result.id)
        return
      }
      self._selItemId = result.id
      self._selId = null; self._closeEdit()
    } else {
      self._selItemId = null
      self._selId = null; self._closeEdit()
    }
    self._buildRack(); self._refresh()
  }

  bindSidebarEvents(): void {
    const self = this.viz
    if (!window._r3) window._r3 = {}
    window._r3[self._id] = self as unknown as Window['_r3'][string]
    this.bindSidebarResize()
  }

  bindSidebarResize(): void {
    const self = this.viz
    const bindHandle = (handleId: string, sbId: string, isLeft: boolean) => {
      const handle = document.getElementById(handleId)
      if (!handle) return
      handle.addEventListener('mousedown', (startE: MouseEvent) => {
        startE.preventDefault()
        const sb = document.getElementById(sbId)
        if (!sb) return
        const startX = startE.clientX
        const startW = sb.clientWidth
        handle.classList.add('r3-resizing')
        const onMove = (e: MouseEvent) => {
          const delta = isLeft ? (e.clientX - startX) : (startX - e.clientX)
          const newW = Math.max(160, Math.min(520, startW + delta))
          sb.style.width = newW + 'px'
          sb.style.minWidth = newW + 'px'
          if (isLeft) self._opts.sidebar.leftWidth = newW
          else self._opts.sidebar.rightWidth = newW
        }
        const onUp = () => {
          handle.classList.remove('r3-resizing')
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
          self._savePanelState()
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
      })
    }
    bindHandle(self._id + '-sb-handle', self._id + '-sb', true)
    bindHandle(self._id + '-sbr-handle', self._id + '-sbr', false)
  }

  destroy(): void {
    if (this._unbind) {
      this._unbind()
      this._unbind = null
    }
  }
}
