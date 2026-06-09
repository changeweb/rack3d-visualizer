import { DEFAULT_OPTIONS, mergeOptions } from '../options'
import { resolveTheme } from '../themes'
import { DEVICE_TYPES } from '../constants'
import type { RoomData, Rack, Device, CatalogItem, LabelPosition, RackStats, DeviceUpdates } from '../types/room'
import type { IOptions, ResolvedOptions, IDeviceType } from '../types/options'
import type { ITheme } from '../types/theme'
import type { ICameraCtrl } from '../types/visualizer'

import { CameraController } from '../controllers/CameraController'
import { InputHandler } from '../controllers/InputHandler'
import { PanelManager } from '../controllers/PanelManager'
import { ExportManager } from '../controllers/ExportManager'
import { GroupManager } from '../controllers/GroupManager'
import { VMManager } from '../controllers/VMManager'
import { TransformController } from '../controllers/TransformController'

import { SidebarController } from '../ui/SidebarController'
import { HtmlBuilder } from '../ui/HtmlBuilder'
import { CssBuilder } from '../ui/CssBuilder'
import { CatalogController } from '../ui/CatalogController'
import { LabelRenderer } from '../ui/LabelRenderer'
import { Render2DController } from '../ui/Render2DController'
import { SceneBuilder } from '../scene/SceneBuilder'

import { MaterialFactory } from '../services/MaterialFactory'
import { SelectionManager } from '../services/SelectionManager'
import { GeometryManager } from '../services/GeometryManager'
import { RackBuilder } from '../builders/RackBuilder'
import { DeviceBuilder } from '../builders/DeviceBuilder'
import { EnvironmentBuilder } from '../builders/EnvironmentBuilder'

declare global {
  interface Window {
    _r3: Record<string, Rack3DVisualizer>
    THREE?: unknown
  }
}

let _instanceCount = 0

const DEFAULT_CATALOG: CatalogItem[] = [
  { id: 'cat-sv1', name: 'Server 1U',      type: 'server',   heightUnits: 1, watts: 300, model: 'Dell PowerEdge R650',       imageUrl: '/image/front/server-1u.svg',      imageUrlRear: '' },
  { id: 'cat-sv2', name: 'Server 2U',      type: 'server',   heightUnits: 2, watts: 620, model: 'HPE ProLiant DL380 Gen10',   imageUrl: '/image/front/server-2u.svg',      imageUrlRear: '' },
  { id: 'cat-sw',  name: 'Switch 48p',     type: 'switch',   heightUnits: 1, watts: 180, model: 'Cisco Catalyst 2960-X-48',   imageUrl: '/image/front/switch.svg',         imageUrlRear: '' },
  { id: 'cat-rt',  name: 'Router',         type: 'router',   heightUnits: 2, watts: 450, model: 'Cisco ASR 1001-X',           imageUrl: '/image/front/router.svg',         imageUrlRear: '' },
  { id: 'cat-fw',  name: 'Firewall',       type: 'firewall', heightUnits: 2, watts: 320, model: 'Palo Alto PA-3220',           imageUrl: '/image/front/firewall.svg',       imageUrlRear: '' },
  { id: 'cat-st',  name: 'NAS Storage',    type: 'storage',  heightUnits: 3, watts: 290, model: 'Synology RS3617xs+',          imageUrl: '/image/front/storage.svg',        imageUrlRear: '' },
  { id: 'cat-pdu', name: 'PDU',            type: 'pdu',      heightUnits: 1, watts: 30,  model: 'APC AP8853',                  imageUrl: '/image/front/pdu.svg',            imageUrlRear: '' },
  { id: 'cat-pat', name: 'Patch Panel',    type: 'patch',    heightUnits: 1, watts: 0,   model: 'Leviton 5G702-24B',           imageUrl: '/image/front/patch-panel.svg',    imageUrlRear: '' },
  { id: 'cat-ups', name: 'UPS Unit',       type: 'ups',      heightUnits: 3, watts: 180, model: 'APC Smart-UPS 3000VA',        imageUrl: '/image/front/ups.svg',            imageUrlRear: '' },
  { id: 'cat-kvm', name: 'KVM Switch',     type: 'kvm',      heightUnits: 1, watts: 45,  model: 'ATEN KM1116VA',               imageUrl: '/image/front/kvm.svg',            imageUrlRear: '' },
  { id: 'cat-lb',  name: 'Load Balancer',  type: 'loadbal',  heightUnits: 1, watts: 200, model: 'F5 BIG-IP 2000s',             imageUrl: '/image/front/load-balancer.svg',  imageUrlRear: '' },
  { id: 'cat-sec', name: 'IDS Sensor',     type: 'security', heightUnits: 1, watts: 95,  model: 'Snort IDS 3.0',               imageUrl: '/image/front/security.svg',       imageUrlRear: '' },
]

export class Rack3DVisualizer {
  _el: HTMLElement
  _opts: ResolvedOptions
  _theme: ITheme
  _types: Record<string, IDeviceType>
  _id: string
  _room: RoomData | null = null
  _rack: Rack | null = null
  _selRackId: string | null = null
  _selId: string | null = null
  _selItemId: string | null = null
  _dragId: string | null = null
  _dragCatId: string | null = null
  _selCatId: string | null = null
  _catCollapsed: Record<string, boolean> = {}
  _showWire: boolean
  _showLabels: boolean
  _mode: '2d' | '3d'
  _selGroupId: string | null = null
  _multiSel: Set<string> = new Set()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _groupHighlightRings: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _T3: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _scene: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _cam: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _ren: any = null
  _raf: number = 0
  _tick: number = 0
  _ctrl: ICameraCtrl
  _rackGroups: Record<string, unknown> = {}
  _devMeshes: Record<string, unknown> = {}
  _labelDivs: Record<string, HTMLElement> = {}
  _labelPositions: Record<string, LabelPosition> = {}
  _devRackMap: Record<string, Rack> = {}
  _shadowMapDirty: boolean = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _materialFactory: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _selectionManager: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _geometryManager: any = null
  _onResize: (() => void) | null = null
  _unbindKeys: (() => void) | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rackDragState: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _itemDragState: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rotateDragState: any = null
  _transformMode: string | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _flyTween: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _aisleGroup: any = null
  _zoneGroup: any = null
  _netGroup: any = null
  _netParticles: any[] = []
  _netLabels: any[] = []
  _netMaterials: any[] = []
  _selConnId: string | null = null
  _showAisles: boolean = false
  _showMinimap: boolean = true
  _showTopology: boolean = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _catQuery: string = ''

  _camera: CameraController
  _input: InputHandler
  _panels: PanelManager
  _exporter: ExportManager
  _groups: GroupManager
  _vms: VMManager
  _transforms: TransformController
  _sidebar: SidebarController
  _html: HtmlBuilder
  _css: CssBuilder
  _catalog: CatalogController
  _labels: LabelRenderer
  _render2d: Render2DController
  _sceneBuilder: SceneBuilder

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _THREE: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static useThree(THREE: any): void { Rack3DVisualizer._THREE = THREE }

  constructor(container: string | HTMLElement, userOptions: IOptions = {}) {
    this._el = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container
    if (!this._el) throw new Error('[Rack3D] Container not found: ' + container)

    this._opts = mergeOptions(DEFAULT_OPTIONS, userOptions) as ResolvedOptions
    this._theme = resolveTheme(this._opts.theme)
    this._types = { ...DEVICE_TYPES, ...(this._opts.deviceTypes ?? {}) } as Record<string, IDeviceType>
    this._id = 'r3d-' + (++_instanceCount)

    this._showWire = this._opts.view.wireframe
    this._showLabels = this._opts.view.showLabels
    this._mode = this._opts.view.mode

    const camMode = this._opts.camera.mode || 'fps'
    this._ctrl = {
      mode: camMode,
      drag: false, lx: 0, ly: 0,
      az: this._opts.camera.azimuth!,
      el: this._opts.camera.elevation!,
      r: this._opts.camera.distance === 'auto' ? 22 : (this._opts.camera.distance ?? 22),
      pos: this._opts.camera.initialPos ? { ...this._opts.camera.initialPos } : { x: 0, y: 16, z: -26 },
      yaw: this._opts.camera.initialYaw ?? 0,
      pitch: this._opts.camera.initialPitch ?? -0.08,
      keys: {} as Record<string, boolean>,
      moveSpeed: this._opts.camera.fpsSpeed || 0.12,
      pointerLocked: false,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selfAsViz: any = this
    this._camera = new CameraController(selfAsViz)
    this._input = new InputHandler(selfAsViz)
    this._panels = new PanelManager(selfAsViz)
    this._exporter = new ExportManager(selfAsViz)
    this._groups = new GroupManager(selfAsViz)
    this._vms = new VMManager(selfAsViz)
    this._transforms = new TransformController(selfAsViz)
    this._sidebar = new SidebarController(this)
    this._html = new HtmlBuilder(this)
    this._css = new CssBuilder(this)
    this._catalog = new CatalogController(this)
    this._labels = new LabelRenderer(this)
    this._render2d = new Render2DController(this)
    this._sceneBuilder = new SceneBuilder(this)

    this._injectStyles()
    this._el.id = this._id
    this._el.innerHTML = this._html.buildHTML()
    const themeSel = document.getElementById(this._id + '-theme-sel')
    if (themeSel && typeof this._opts.theme === 'string') (themeSel as HTMLSelectElement).value = this._opts.theme
    this._input.bindSidebarEvents()
    this._panels.restorePanelState()

    this._loadThree(() => {
      if (this._mode === '2d') this._boot2D()
      else this._bootThree()
      if (this._opts.onReady) this._opts.onReady(this)
    })
  }

  // ─── Public API ───────────────────────────────────────────

  setData(rackData: RoomData | Rack): this {
    if (!rackData || typeof rackData !== 'object') return this
    if (Array.isArray((rackData as RoomData).racks)) return this.setRoomData(rackData as RoomData)
    try {
      const clone = JSON.parse(JSON.stringify(rackData)) as Record<string, unknown>
      const catalog = (clone.catalog as CatalogItem[]) || []
      delete clone.catalog
      return this.setRoomData({
        catalog,
        layout: { rows: 1, cols: 1, colSpacing: 8, rowSpacing: 10 },
        racks: [{ id: 'rack-main', row: 0, col: 0, ...clone } as Rack],
      })
    } catch (e) {
      console.error('[Rack3D] setData() failed:', e)
      return this
    }
  }

  setRoomData(roomData: RoomData): this {
    if (!roomData || typeof roomData !== 'object') return this
    try {
      this._room = JSON.parse(JSON.stringify(roomData)) as RoomData
    } catch (e) {
      console.error('[Rack3D] setRoomData() failed:', e)
      return this
    }
    if (!Array.isArray(this._room.catalog)) this._room.catalog = [...DEFAULT_CATALOG]
    if (!Array.isArray(this._room.racks)) this._room.racks = []
    if (!Array.isArray(this._room.room_items)) this._room.room_items = []
    if (!Array.isArray(this._room.groups)) this._room.groups = []
    this._room.room_items!.forEach((item) => {
      if (!item.id) item.id = 'item-' + Date.now() + Math.random().toString(36).slice(2, 6)
    })
    this._room.racks!.forEach((r) => {
      if (!r.id) r.id = 'rack-' + Date.now() + Math.random().toString(36).slice(2, 6)
      if (!Array.isArray(r.devices)) r.devices = []
      if (!r.units) r.units = 24
    })
    const catMap = Object.fromEntries((this._room.catalog || []).map((c) => [c.id, c]))
    const catByType: Record<string, CatalogItem> = {}
    ;(this._room.catalog || []).forEach((c) => { catByType[c.type] = c })
    this._room.racks!.forEach((r) => {
      ;(r.devices || []).forEach((dev) => {
        const cat = dev.catalogId ? catMap[dev.catalogId] : catByType[dev.type]
        if (!cat) return
        dev.type = cat.type; dev.heightUnits = cat.heightUnits; dev.watts = cat.watts
        dev.imageUrl = cat.imageUrl || ''; dev.imageUrlRear = cat.imageUrlRear || ''
        if (cat.halfWidth) dev.halfWidth = cat.halfWidth; else delete dev.halfWidth
      })
    })
    if (this._room.racks!.length > 0) {
      this._selRackId = this._room.racks![0].id
      this._rack = this._room.racks![0]
    } else {
      this._selRackId = null; this._rack = null
    }
    this._selId = null
    this._selItemId = null
    this._closeEdit()
    this._refresh()
    this._renderWalls()
    this._renderPillars()
    this._renderZones()
    this._renderConnections()
    if (this._scene) this._buildRack()
    if (this._mode === '2d') this._render2D()
    return this
  }

  getData(): RoomData | null {
    if (!this._room) return null
    return JSON.parse(JSON.stringify(this._room)) as RoomData
  }

  getSelectedRack(): Rack | null {
    if (!this._rack) return null
    return JSON.parse(JSON.stringify(this._rack)) as Rack
  }

  setTheme(themeInput: string | Partial<ITheme>): this {
    this._theme = resolveTheme(themeInput)
    this._materialFactory?.setTheme(this._theme)
    this._injectStyles()
    this._refresh()
    if (this._scene) this._buildRack()
    return this
  }

  setOptions(partialOpts: IOptions): this {
    this._opts = mergeOptions(this._opts, partialOpts) as ResolvedOptions
    if (partialOpts.theme) this.setTheme(partialOpts.theme)
    if (partialOpts.view?.mode && partialOpts.view.mode !== this._mode) {
      this._mode = partialOpts.view.mode
      if (this._mode === '2d') this._boot2D(); else this._bootThree()
    }
    this._refresh()
    return this
  }

  setMode(mode: '2d' | '3d'): this { return this.setOptions({ view: { mode } }) }
  setWireframe(on: boolean): this { this._showWire = on; if (this._scene) this._buildRack(); return this }
  setLabels(on: boolean): this { this._showLabels = on; return this }

  updateRackStats(rackId: string, stats: Partial<RackStats>): this {
    if (!this._room) return this
    const rack = this._room.racks!.find((r) => r.id === rackId)
    if (!rack) return this
    if (stats.rackTemp != null) rack.rackTemp = stats.rackTemp
    if (stats.pduCapacity != null) rack.pduCapacity = stats.pduCapacity
    if (stats.pduLoad != null) rack.pduLoad = stats.pduLoad
    if (rackId === this._selRackId) this._sidebar.updateRackStatsDom(rack as unknown as Record<string, unknown>)
    return this
  }

  updateDeviceFields(rackId: string, deviceId: string, updates: Partial<DeviceUpdates>): this {
    if (!this._room) return this
    const rack = this._room.racks!.find((r) => r.id === rackId)
    if (!rack) return this
    const dev = rack.devices?.find((d) => d.id === deviceId)
    if (!dev) return this
    if (updates.status != null) dev.status = updates.status
    if (updates.watts != null) dev.watts = updates.watts
    if (updates.ip != null) dev.ip = updates.ip
    if (updates.fields != null) dev.fields = updates.fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._labels.refreshLabel(dev as any)
    return this
  }

  setCameraAngle(az?: number, el?: number, dist?: number): this {
    this._camera.setCameraAngle(az, el, dist)
    return this
  }

  resetCamera(): this {
    this._camera.resetCamera()
    return this
  }

  zoomIn(): this {
    this._camera.zoomIn()
    return this
  }

  zoomOut(): this {
    this._camera.zoomOut()
    return this
  }

  toggleCameraMode(): void {
    this._camera.toggleCameraMode()
  }

  flyToRack(rackId: string): this {
    this._camera.flyToRack(rackId)
    return this
  }

  flyBack(): this {
    this._camera.flyBack()
    return this
  }

  copyJson(): void {
    this._exporter.copyJson()
  }

  exportJson(): void {
    this._exporter.exportJson()
  }

  applyJson(): void {
    this._exporter.applyJson()
  }

  getConfig(): object {
    return this._exporter.getConfig()
  }

  invalidate(): void { this._tick++ }

  destroy(): void {
    cancelAnimationFrame(this._raf)
    this._materialFactory?.dispose()
    this._geometryManager?.clearAllRacks()
    if (this._ren) { this._ren.dispose(); this._ren = null }
    const style = document.getElementById(this._id + '-styles')
    if (style) style.remove()
    this._el.innerHTML = ''
    window.removeEventListener('resize', this._onResize!)
    if (this._unbindKeys) this._unbindKeys()
  }

  // ─── Toolbar toggles ──────────────────────────────────────
  toggleLabels(): void {
    this._showLabels = !this._showLabels
    const b = document.getElementById(this._id + '-btnL')
    if (b) b.className = 'r3-btn' + (this._showLabels ? ' on' : '')
  }

  toggleWire(): void {
    this._showWire = !this._showWire
    const b = document.getElementById(this._id + '-btnW')
    if (b) b.className = 'r3-btn' + (this._showWire ? ' on' : '')
    this._materialFactory?.setWireframeMode(this._showWire)
    this._buildRack()
  }

  toggleMode(): void {
    this._mode = this._mode === '3d' ? '2d' : '3d'
    const b = document.getElementById(this._id + '-btn2d')
    if (b) b.textContent = '⊞ ' + (this._mode === '2d' ? '3D' : '2D')
    const c3d = document.getElementById(this._id + '-cvcont')
    const c2d = document.getElementById(this._id + '-2dcont')
    const lbl = document.getElementById(this._id + '-btnL')
    if (this._mode === '2d') {
      if (c3d) c3d.style.display = 'none'
      if (c2d) c2d.style.display = 'flex'
      if (lbl) lbl.style.display = 'none'
      this._render2D()
    } else {
      if (c3d) c3d.style.display = ''
      if (c2d) c2d.style.display = 'none'
      if (lbl) lbl.style.display = ''
      if (!this._ren) this._bootThree(); else this._buildRack()
    }
  }

  toggleHelp(): void {
    const el = document.getElementById(this._id + '-help-modal')
    if (!el) return
    el.style.display = el.style.display === 'none' ? 'flex' : 'none'
  }

  toggleJson(): void {
    this._exporter.toggleJson()
  }

  // ─── Panel delegates ──────────────────────────────────────
  _togglePanel(panelId: string): void { this._panels.togglePanel(panelId) }
  _savePanelState(): void { this._panels.savePanelState() }
  _restorePanelState(): void { this._panels.restorePanelState() }
  _onPanelDragStart(event: DragEvent, panelId: string): void { this._panels.onPanelDragStart(event, panelId) }
  _onPanelDragEnd(): void { this._panels.onPanelDragEnd() }
  _onPanelDragOverPanel(event: DragEvent, panelId: string): void { this._panels.onPanelDragOverPanel(event, panelId) }
  _onPanelDropPanel(event: DragEvent, targetPanelId: string): void { this._panels.onPanelDropPanel(event, targetPanelId) }
  _onPanelDropSidebar(event: DragEvent, sidebar: string): void { this._panels.onPanelDropSidebar(event, sidebar) }
  _onPanelResizeStart(e: MouseEvent, panelId: string): void { this._panels.onPanelResizeStart(e, panelId) }
  _toggleSidebarLeft(): void { this._panels.toggleSidebarLeft() }
  _toggleSidebarRight(): void { this._panels.toggleSidebarRight() }
  _switchTab(tabId: string): void { this._panels.switchTab(tabId) }
  _switchRoomTab(tabId: string): void { this._panels.switchRoomTab(tabId) }
  _switchRackPropTab(tabId: string): void { this._panels.switchRackPropTab(tabId) }
  _switchEditDevTab(tabId: string): void { this._panels.switchEditDevTab(tabId) }
  _switchLightTab(tabId: string): void { this._panels.switchLightTab(tabId) }
  _switchHelpTab(tabId: string): void { this._panels.switchHelpTab(tabId) }

  // ─── Camera delegates ─────────────────────────────────────
  _posCamera(): void { this._camera.posCamera() }
  _rackH(): number { return this._camera.rackH() }
  _midY(): number { return this._camera.midY() }

  // ─── Input delegates ──────────────────────────────────────
  _doRaycast(e: MouseEvent, cv: HTMLCanvasElement): void { this._input.doRaycast(e, cv) }
  _bindSidebarResize(): void { this._input.bindSidebarResize() }

  // ─── Export delegates ─────────────────────────────────────
  _applyConfig(cfg: Record<string, unknown>): void { this._exporter.applyConfig(cfg) }

  // ─── Group delegates ──────────────────────────────────────
  _groupsArr(): { id: string; name: string; members: string[] }[] { return this._groups.groupsArr() }
  _groupMembersFlat(groupId: string): string[] { return this._groups.groupMembersFlat(groupId) }
  _itemGroupIds(id: string): string[] { return this._groups.itemGroupIds(id) }
  _autoUngroup(id: string): void { this._groups.autoUngroup(id) }
  _createGroup(name?: string): void { this._groups.createGroup(name) }
  _disbandGroup(groupId: string): void { this._groups.disbandGroup(groupId) }
  _addMemberToGroup(groupId: string, memberId: string): void { this._groups.addMemberToGroup(groupId, memberId) }
  _removeMemberFromGroup(groupId: string, memberId: string): void { this._groups.removeMemberFromGroup(groupId, memberId) }
  _renameGroup(groupId: string, name: string): void { this._groups.renameGroup(groupId, name) }
  _toggleMultiSel(id: string): void { this._groups.toggleMultiSel(id) }
  _selectGroup(groupId: string): void { this._groups.selectGroup(groupId) }
  _groupCentroid(groupId: string): { x: number; z: number } { return this._groups.groupCentroid(groupId) }
  _moveGroupDelta(groupId: string, dx: number, dz: number): void { this._groups.moveGroupDelta(groupId, dx, dz) }
  _rotateGroupDelta(groupId: string, dDeg: number): void { this._groups.rotateGroupDelta(groupId, dDeg) }
  _snapshotGroupPositions(groupId: string): Record<string, unknown> { return this._groups.snapshotGroupPositions(groupId) }
  _snapshotGroupAngles(groupId: string): Record<string, unknown> { return this._groups.snapshotGroupAngles(groupId) }
  _applyGroupDeltaFromSnapshot(posSnap: Record<string, unknown>, dx: number, dz: number): void { this._groups.applyGroupDeltaFromSnapshot(posSnap as Parameters<GroupManager['applyGroupDeltaFromSnapshot']>[0], dx, dz) }
  _applyGroupRotationFromSnapshot(angleSnap: Record<string, unknown>, dDeg: number): void { this._groups.applyGroupRotationFromSnapshot(angleSnap as Parameters<GroupManager['applyGroupRotationFromSnapshot']>[0], dDeg) }
  _showContextMenu(e: MouseEvent, targetId: string | null): void { this._groups.showContextMenu(e, targetId) }
  _hideContextMenu(): void { this._groups.hideContextMenu() }
  _refreshGroupPanel(): void { this._groups.refreshGroupPanel() }
  _buildGroupHighlights(): void { this._groups.buildGroupHighlights() }

  // ─── VM delegates ──────────────────────────────────────────
  _renderVMPanel(dev: Record<string, unknown>): void { this._vms.renderVMPanel(dev) }
  _hideVMPanel(): void { this._vms.hideVMPanel() }
  _getDevByIdx(di: number): Record<string, unknown> | null { return this._vms.getDevByIdx(di) }
  _addVM(di: number): void { this._vms.addVM(di) }
  _editVM(di: number, vi: number, field: string, value: unknown): void { this._vms.editVM(di, vi, field, value) }
  _editVMNested(di: number, vi: number, obj: string, field: string, value: unknown): void { this._vms.editVMNested(di, vi, obj, field, value) }
  _removeVM(di: number, vi: number): void { this._vms.removeVM(di, vi) }
  _addVMPort(di: number, vi: number): void { this._vms.addVMPort(di, vi) }
  _editVMPort(di: number, vi: number, pi: number, field: string, value: unknown): void { this._vms.editVMPort(di, vi, pi, field, value) }
  _removeVMPort(di: number, vi: number, pi: number): void { this._vms.removeVMPort(di, vi, pi) }
  _toggleVMEdit(di: number, vi: number): void { this._vms.toggleVMEdit(di, vi) }
  _refreshVMList(di: number): void { this._vms.refreshVMList(di) }
  _refreshVMCard(di: number, vi: number): void { this._vms.refreshVMCard(di, vi) }

  // ─── Transform delegates ──────────────────────────────────
  _setTransformMode(mode: 'move' | 'rotate'): void {
    this._transforms.setTransformMode(mode)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _raycastFloor(clientX: number, clientY: number, cv: HTMLCanvasElement): any {
    return this._transforms.raycastFloor(clientX, clientY, cv)
  }
  _snapRackPos(x: number, z: number): { x: number; z: number } {
    return this._transforms.snapRackPos(x, z)
  }

  // ─── Sidebar delegates ────────────────────────────────────
  _refresh(): void { this._sidebar.refresh() }
  _buildRoomPanel(): void { this._sidebar.buildRoomPanel() }
  _buildUnitMap(): void { this._sidebar.buildUnitMap() }
  _buildLegendOverlay(): void { this._sidebar.buildLegendOverlay() }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _openEdit(dev: Device): void { this._sidebar.openEdit(dev as any); this._renderVMPanel(dev as any) }
  _closeEdit(): void { this._sidebar.closeEdit(); this._hideVMPanel() }
  _ed(field: string, value: unknown): void { this._sidebar.ed(field, value) }
  _addDev(type: string, hw?: string, name?: string, h?: number, w?: number): string | null {
    const nd = this._sidebar.addDev(type, hw ?? null, name ?? null, h ?? null, w ?? null)
    return nd ? (nd as Record<string, unknown>).id as string : null
  }
  _rmDev(id: string): void { this._sidebar.rmDev(id) }
  _onRackName(v: string): void { this._sidebar.onRackName(v) }
  _onRackUnits(v: number): void { this._sidebar.onRackUnits(v) }
  _onRackProp(p: string, v: unknown): void { this._sidebar.onRackProp(p, v) }
  _onRackWidth(v: number): void { this._sidebar.onRackWidth(v) }
  _onRackPos(axis: string, v: number): void { this._sidebar.onRackPos(axis, v) }
  _onRackAngle(deg: number): void { this._sidebar.onRackAngle(deg) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _renderCustomFieldsEditor(dev: Device): void { this._sidebar.renderCustomFieldsEditor(dev as any) }
  _addCustomField(): void { this._sidebar.addCustomField() }
  _editField(idx: number, key: string, value: unknown): void { this._sidebar.editField(idx, key, value) }
  _removeField(idx: number): void { this._sidebar.removeField(idx) }

  // ─── Catalog delegates ────────────────────────────────────
  _renderCatalog(): void { this._catalog.renderCatalog() }
  _addFromCatalog(catId: string): unknown { return this._catalog.addFromCatalog(catId) }
  _addCatalogItem(): void { this._catalog.addCatalogItem() }
  _removeCatalogItem(id: string): void { this._catalog.removeCatalogItem(id) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _openCatalogEdit(item: CatalogItem): void { this._catalog.openCatalogEdit(item as any) }

  // ─── Label delegates ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _createLabel(dev: Device, col: string, side: 'left' | 'right'): void { this._labels.createLabel(dev as any, col, side) }
  _updateLabels(): void { this._labels.updateLabels() }

  // ─── 2D delegates ─────────────────────────────────────────
  _render2D(): void { this._render2d.render2D() }
  _on2DDragStart(event: DragEvent, devId: string): void { this._render2d.on2DDragStart(event, devId) }
  _on2DDragEnd(event: DragEvent): void { this._render2d.on2DDragEnd(event) }
  _on2DDrop(event: DragEvent, unit: number, side?: string): void { this._render2d.on2DDrop(event, unit, side) }
  _dropUnit(devId: string, unit: number, side?: string): void { this._render2d.dropUnit(devId, unit, side) }
  _exportImage(format: string): void { this._render2d.exportImage(format) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _dlBlob(blob: Blob, filename: string): void { this._render2d.dlBlob(blob, filename) }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _gen2DCanvas(): any { return this._render2d.gen2DCanvas() }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _gen2DSVG(): any { return this._render2d.gen2DSVG() }

  // ─── Style ────────────────────────────────────────────────
  _injectStyles(): void {
    let tag = document.getElementById(this._id + '-styles')
    if (!tag) { tag = document.createElement('style'); tag.id = this._id + '-styles'; document.head.appendChild(tag) }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tag.textContent = this._css.buildCSS(this._id, this._theme as any, this._opts as any)
  }

  _bindSidebarEvents(): void {
    this._input.bindSidebarEvents()
  }

  // ─── Three.js loader + boot ───────────────────────────────
  _loadThree(cb: () => void): void {
    if (this._T3) { cb(); return }
    if (Rack3DVisualizer._THREE) { this._T3 = Rack3DVisualizer._THREE; cb(); return }
    if (window.THREE) { this._T3 = window.THREE; cb(); return }
    if (document.querySelector('script[data-rack3d-three]')) {
      const wait = () => { if (window.THREE) { this._T3 = window.THREE; cb() } else setTimeout(wait, 50) }
      wait(); return
    }
    const s = document.createElement('script')
    s.setAttribute('data-rack3d-three', '1')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    s.onload = () => { this._T3 = window.THREE; cb() }
    document.head.appendChild(s)
  }

  _bootThree(): void {
    const cv = document.getElementById(this._id + '-cv3') as HTMLCanvasElement | null
    const cont = document.getElementById(this._id + '-cvcont')
    if (!cv || !cont) return
    const W = cont.clientWidth, H = cont.clientHeight
    if (W < 1 || H < 1) { requestAnimationFrame(() => this._bootThree()); return }

    const T = this._T3
    this._ren = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'default' })
    this._ren.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this._ren.setSize(W, H)
    this._ren.shadowMap.enabled = this._opts.lighting.shadows
    this._ren.shadowMap.type = T.PCFSoftShadowMap
    this._ren.shadowMap.autoUpdate = false
    this._shadowMapDirty = true
    this._ren.setClearColor(this._theme.scene.clearColor, 1)
    this._ren.physicallyCorrectLights = true
    this._ren.toneMapping = T.ACESFilmicToneMapping
    this._ren.toneMappingExposure = this._opts.lighting.exposure ?? this._theme.scene.exposure

    this._scene = new T.Scene()
    this._scene.fog = new T.Fog(this._theme.scene.fogColor, this._opts.room.fogNear, this._opts.room.fogFar)

    this._cam = new T.PerspectiveCamera(this._opts.camera.fov, W / H, 0.05, 200)
    this._posCamera()

    this._initServices()
    if (this._opts.room.enabled) {
      this._buildEnvironment()
    } else {
      this._buildLights()
    }
    if (this._room) this._buildRack()

    this._onResize = () => {
      const c = document.getElementById(this._id + '-cvcont')
      if (!c || !this._ren || !this._cam) return
      const nw = c.clientWidth, nh = c.clientHeight
      if (nw < 1 || nh < 1) return
      this._ren.setSize(nw, nh)
      this._cam.aspect = nw / nh; this._cam.updateProjectionMatrix()
    }
    window.addEventListener('resize', this._onResize)
    this._input.bindCameraControls(cv)
    this._startLoop()
    if (this._showMinimap) requestAnimationFrame(() => this._updateMinimap())
  }

  _boot2D(): void {
    const c2d = document.getElementById(this._id + '-2dcont')
    const c3d = document.getElementById(this._id + '-cvcont')
    if (c2d) c2d.style.display = 'flex'
    if (c3d) c3d.style.display = 'none'
    this._render2D()
  }

  _initServices(): void {
    const T = this._T3
    this._materialFactory = new MaterialFactory(T, this._theme)
    this._selectionManager = new SelectionManager(this._scene, this._cam, T)

    const rackBuilder = new RackBuilder(T, this._theme, this._materialFactory)
    const deviceBuilder = new DeviceBuilder(T, this._materialFactory, this._types)
    const envBuilder = new EnvironmentBuilder(T, this._theme)

    this._geometryManager = new GeometryManager(T, this._scene, rackBuilder, deviceBuilder, envBuilder, this._materialFactory, this._theme)
    this._geometryManager.labelSide = this._opts.labels?.side || 'auto'
  }

  _buildLights(): void {
    this._geometryManager?.environmentBuilder.buildLightsOnly(this._scene, this._opts.lighting, this._theme.scene)
  }

  _buildEnvironment(): void {
    this._geometryManager.buildEnvironment(this._room, this._opts.room, this._opts.lighting, this._theme.scene)
  }

  _clearRack(): void {
    Object.values(this._labelDivs || {}).forEach((d) => d.remove())
    this._labelDivs = {}
    this._geometryManager?.clearRoomItems()
    this._geometryManager?.clearAllRacks()
    this._rackGroups = {}
    this._devMeshes = {}
    this._labelPositions = {}
    ;(this._groupHighlightRings || []).forEach((r) => {
      if (r.geometry) r.geometry.dispose()
      if (r.material) r.material.dispose()
      this._scene?.remove(r)
    })
    this._groupHighlightRings = []
    this._groups.groupHighlightRings = []
    if (this._aisleGroup) {
      this._scene?.remove(this._aisleGroup)
      this._aisleGroup = null
    }
  }

  _buildRack(): void {
    this._shadowMapDirty = true
    this._clearRack()
    this._geometryManager.buildAllRacks(this._room, this._opts.rack, this._theme.rack, this._selRackId)

    this._rackGroups = this._geometryManager.rackGroups
    this._devMeshes = this._geometryManager.deviceMeshes
    this._labelPositions = this._geometryManager.labelPositions

    this._devRackMap = {}
    if (this._room?.racks) {
      this._room.racks.forEach((rack) => {
        ;(rack.devices || []).forEach((dev) => {
          this._devRackMap[dev.id] = rack
          const lp = this._labelPositions[dev.id]
          if (!lp) return
          const typeInfo = this._types[dev.type] || this._types['server']
          this._createLabel(dev, dev.color || typeInfo.color, lp.side)
        })
      })
    }

    if (this._opts.camera.distance === 'auto' && this._ctrl.mode !== 'fps') {
      this._ctrl.r = Math.max(22, this._rackH() * 2.2)
    }
    this._posCamera()
    this._buildRoomItems()
    this._renderRoomItems()
    this._buildGroupHighlights()
    this._buildAisles()
    this._buildZones()
    this._buildTopology()
  }

  _buildAisles(): void {
    if (this._aisleGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._aisleGroup.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })
      this._scene?.remove(this._aisleGroup)
      this._aisleGroup = null
    }
    if (!this._scene || !this._room?.racks?.length) return

    const T = this._T3
    const rw = this._opts.rack.width
    const hd = this._opts.rack.depth / 2
    const aisleDepth = 5.0
    const aisleOffset = hd + aisleDepth / 2
    const planeW = rw + 2.0

    const coldMat = new T.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide })
    const hotMat  = new T.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide })
    const coldGeo = new T.PlaneGeometry(planeW, aisleDepth)
    const hotGeo  = new T.PlaneGeometry(planeW, aisleDepth)

    const group = new T.Group()
    group.visible = this._showAisles

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._room.racks!.forEach((rack: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rg = this._rackGroups[rack.id] as any
      if (!rg) return
      const rx: number = rg.position.x
      const rz: number = rg.position.z
      const fa: number = rack.facingAngle ?? 0

      const cold = new T.Mesh(coldGeo, coldMat)
      cold.rotation.x = -Math.PI / 2
      cold.rotation.y = fa
      cold.position.set(rx - Math.sin(fa) * aisleOffset, 0.02, rz - Math.cos(fa) * aisleOffset)
      group.add(cold)

      const hot = new T.Mesh(hotGeo, hotMat)
      hot.rotation.x = -Math.PI / 2
      hot.rotation.y = fa
      hot.position.set(rx + Math.sin(fa) * aisleOffset, 0.02, rz + Math.cos(fa) * aisleOffset)
      group.add(hot)
    })

    this._scene.add(group)
    this._aisleGroup = group
  }

  toggleAisles(): void {
    this._showAisles = !this._showAisles
    if (this._aisleGroup) this._aisleGroup.visible = this._showAisles
    const btn = document.getElementById(this._id + '-btnAisle')
    if (btn) btn.className = 'r3-btn' + (this._showAisles ? ' on' : '')
    this._shadowMapDirty = true
  }

  _buildZones(): void {
    if (this._zoneGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._zoneGroup.traverse((obj: any) => {
        if (obj.isMesh || obj.isLine || obj.isSprite) {
          obj.geometry?.dispose()
          if (obj.material?.map) obj.material.map.dispose()
          obj.material?.dispose()
        }
      })
      this._scene?.remove(this._zoneGroup)
      this._zoneGroup = null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zones: any[] = (this._room as any)?.zones
    if (!zones?.length) return

    const T = this._T3
    const group = new T.Group()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zones.forEach((zone: any) => {
      if (zone.visible === false) return
      const col = typeof zone.color === 'string' ? zone.color : '#4488ff'
      const colNum = parseInt(col.replace('#', ''), 16)
      const opacity: number = zone.opacity ?? 0.18
      const wallH: number = zone.wallHeight ?? 0

      // Floor overlay
      const floorGeo = new T.PlaneGeometry(zone.width, zone.depth)
      const floorMat = new T.MeshBasicMaterial({
        color: colNum, transparent: true, opacity, depthWrite: false, side: T.DoubleSide
      })
      const floor = new T.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      floor.position.set(zone.x, 0.015, zone.z)
      group.add(floor)

      // Perimeter border line
      const hw = zone.width / 2, hd = zone.depth / 2
      const pts = [
        new T.Vector3(-hw, 0, -hd), new T.Vector3(hw, 0, -hd),
        new T.Vector3(hw, 0, hd), new T.Vector3(-hw, 0, hd),
        new T.Vector3(-hw, 0, -hd),
      ]
      const lineGeo = new T.BufferGeometry().setFromPoints(pts)
      const lineMat = new T.LineBasicMaterial({ color: colNum, transparent: true, opacity: 0.65 })
      const line = new T.Line(lineGeo, lineMat)
      line.position.set(zone.x, 0.025, zone.z)
      group.add(line)

      // Perimeter walls (when wallHeight > 0)
      if (wallH > 0) {
        const wallMat = new T.MeshBasicMaterial({
          color: colNum, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide
        })
        const addWall = (w: number, h: number, d: number, ox: number, oz: number) => {
          const wg = new T.BoxGeometry(w, h, d)
          const wm = wallMat.clone()
          const mesh = new T.Mesh(wg, wm)
          mesh.position.set(zone.x + ox, h / 2, zone.z + oz)
          group.add(mesh)
        }
        addWall(zone.width, wallH, 0.08, 0, -zone.depth / 2)
        addWall(zone.width, wallH, 0.08, 0,  zone.depth / 2)
        addWall(0.08, wallH, zone.depth, -zone.width / 2, 0)
        addWall(0.08, wallH, zone.depth,  zone.width / 2, 0)
      }

      // Name label (Sprite with canvas texture)
      const labelY = wallH > 0 ? wallH + 0.5 : 1.5
      const lc = document.createElement('canvas')
      lc.width = 256; lc.height = 48
      const ctx = lc.getContext('2d')!
      const textW = (() => { ctx.font = 'bold 18px monospace'; return ctx.measureText(zone.name).width })()
      const bw = Math.min(textW + 20, 250)
      const bx = (256 - bw) / 2
      ctx.fillStyle = col + '44'
      ctx.fillRect(bx, 6, bw, 36)
      ctx.strokeStyle = col + 'aa'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, 6, bw, 36)
      ctx.font = 'bold 18px monospace'
      ctx.fillStyle = col
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(zone.name, 128, 24)
      const tex = new T.CanvasTexture(lc)
      const smat = new T.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false })
      const sprite = new T.Sprite(smat)
      sprite.position.set(zone.x, labelY, zone.z)
      sprite.scale.set(5.33, 1.0, 1)
      group.add(sprite)
    })

    this._scene.add(group)
    this._zoneGroup = group
  }

  _renderZones(): void {
    const el = document.getElementById(this._id + '-zones-list')
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el.innerHTML = ((this._room as any)?.zones || []).map((z: any, i: number) => this._html.zoneRow(z as Record<string, unknown>, i)).join('')
  }

  _addZone(): void {
    if (!this._room) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!Array.isArray((this._room as any).zones)) (this._room as any).zones = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room as any).zones.push({
      id: 'zone-' + Date.now(),
      name: 'Zone ' + ((this._room as any).zones.length + 1),
      color: '#4488ff',
      x: 0, z: 2,
      width: 10, depth: 8,
      opacity: 0.18, wallHeight: 0, visible: true
    })
    this._buildZones()
    this._renderZones()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _editZone(idx: number, field: string, value: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zone = (this._room as any)?.zones?.[idx]
    if (!zone) return
    zone[field] = value
    this._buildZones()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _removeZone(idx: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room as any)?.zones?.splice(idx, 1)
    this._buildZones()
    this._renderZones()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _utilColor(u: number, override?: string): number {
    if (override) return parseInt(override.replace('#', ''), 16)
    const c = Math.max(0, Math.min(1, u))
    let r, g
    if (c < 0.5) { r = Math.round(c * 2 * 255); g = 200 }
    else { r = 255; g = Math.round((1 - (c - 0.5) * 2) * 200) }
    return (r << 16) | (g << 8)
  }

  updateConnectionUtil(connId: string, newUtil: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = this._netMaterials.find((m: any) => m.id === connId)
    if (!entry) return
    entry.util = newUtil
    entry.mat.color.setHex(this._utilColor(newUtil))
  }

  _buildTopology(): void {
    if (this._netGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._netGroup.traverse((obj: any) => {
        if (obj.isLine) { obj.geometry?.dispose(); obj.material?.dispose() }
        if (obj.isSprite) { obj.material?.map?.dispose(); obj.material?.dispose() }
      })
      this._scene?.remove(this._netGroup)
    }
    this._netGroup = null
    this._netParticles = []
    this._netLabels = []
    this._netMaterials = []
    this._selConnId = null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conns: any[] = (this._room as any)?.connections
    if (!conns?.length) return

    const T = this._T3
    const group = new T.Group()
    group.visible = this._showTopology

    const floorY = 0.05
    const hd = this._opts.rack.depth / 2
    const cableBack = 3.5

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolveEndpoint = (id: string): { pos: any, fa: number, rackId: string | null, isDevice: boolean } | null => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dm = (this._devMeshes as any)?.[id]
      if (dm) {
        const v = new T.Vector3()
        dm.getWorldPosition(v)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rack = (this._room.racks || []).find((r: any) => (r.devices || []).some((d: any) => d.id === id))
        const fa: number = (rack as any)?.facingAngle ?? 0
        v.x += Math.sin(fa) * hd
        v.z += Math.cos(fa) * hd
        return { pos: v, fa, rackId: (rack as any)?.id ?? null, isDevice: true }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rg = (this._rackGroups as any)?.[id]
      if (rg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rack = (this._room.racks || []).find((r: any) => r.id === id)
        const fa: number = (rack as any)?.facingAngle ?? 0
        const v = rg.position.clone()
        v.x += Math.sin(fa) * hd
        v.z += Math.cos(fa) * hd
        v.y = floorY
        return { pos: v, fa, rackId: id, isDevice: false }
      }
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const makeLabel = (conn: any, midPt: any): any => {
      const canvas = document.createElement('canvas')
      canvas.width = 256; canvas.height = 72
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(8,16,32,0.92)'
      ctx.fillRect(2, 2, 252, 68)
      ctx.strokeStyle = '#4488ffaa'
      ctx.lineWidth = 1.5
      ctx.strokeRect(2, 2, 252, 68)
      ctx.fillStyle = '#88ccff'
      ctx.font = 'bold 20px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(conn.label || conn.id, 128, 22)
      ctx.fillStyle = '#99ddcc'
      ctx.font = '15px monospace'
      const pct = Math.round((conn.utilization ?? 0) * 100)
      ctx.fillText(`${conn.bandwidth || ''} · ${pct}%`, 128, 50)
      const tex = new T.CanvasTexture(canvas)
      const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
      const sprite = new T.Sprite(mat)
      sprite.scale.set(3.0, 0.85, 1)
      sprite.position.copy(midPt)
      sprite.position.y += 1.5
      sprite.visible = true
      sprite.userData.isConnLabel = true
      group.add(sprite)
      return sprite
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conns.forEach((conn: any) => {
      if (conn.visible === false) return
      const ra = resolveEndpoint(conn.from)
      const rb = resolveEndpoint(conn.to)
      if (!ra || !rb) return

      const a = ra.pos, b = rb.pos
      const u: number = conn.utilization ?? 0.5
      const colNum = this._utilColor(u, conn.color)

      const sameRack = ra.rackId !== null && ra.rackId === rb.rackId

      // Floor-level exit points behind each rack's rear face
      const exitAFloor = new T.Vector3(
        a.x + Math.sin(ra.fa) * cableBack,
        floorY,
        a.z + Math.cos(ra.fa) * cableBack
      )
      const exitBFloor = new T.Vector3(
        b.x + Math.sin(rb.fa) * cableBack,
        floorY,
        b.z + Math.cos(rb.fa) * cableBack
      )

      // Device cables exit horizontally from rear at device height, then drop; rack cables go straight to floor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const startPts: any[] = ra.isDevice
        ? [a, new T.Vector3(exitAFloor.x, a.y, exitAFloor.z), exitAFloor]
        : [a, exitAFloor]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const endPts: any[] = rb.isDevice
        ? [exitBFloor, new T.Vector3(exitBFloor.x, b.y, exitBFloor.z), b]
        : [exitBFloor, b]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pts: any[]
      if (sameRack) {
        pts = [...startPts, ...endPts]
      } else {
        const corner = new T.Vector3(exitBFloor.x, floorY, exitAFloor.z)
        pts = [...startPts, corner, ...endPts]
      }

      const geo = new T.BufferGeometry().setFromPoints(pts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mat = new T.LineBasicMaterial({ color: colNum, linewidth: 2, transparent: true, opacity: 0.9, depthWrite: false })
      const line = new T.Line(geo, mat)
      line.userData.connId = conn.id
      group.add(line)

      this._netMaterials.push({ id: conn.id, mat, util: u })

      const midPt = pts[Math.floor(pts.length / 2)]
      const sprite = makeLabel(conn, midPt)
      this._netLabels.push({ sprite, id: conn.id })
    })

    this._scene.add(group)
    this._netGroup = group
  }

  _selectConnection(connId: string): void {
    this._selConnId = this._selConnId === connId ? null : connId
  }

  _stepTopologyParticles(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._netParticles.forEach((p: any) => {
      p.t = (p.t + p.speed) % 1
      p.mesh.position.copy(p.curve.getPoint(p.t))
    })
  }

  toggleTopology(): void {
    this._showTopology = !this._showTopology
    if (this._netGroup) this._netGroup.visible = this._showTopology
    const btn = document.getElementById(this._id + '-btnTopo')
    if (btn) btn.className = 'r3-btn' + (this._showTopology ? ' on' : '')
  }

  _renderConnections(): void {
    const el = document.getElementById(this._id + '-conn-list')
    if (!el) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el.innerHTML = ((this._room as any)?.connections || []).map((c: any, i: number) => this._html.connectionRow(c as Record<string, unknown>, i)).join('')
  }

  _addConnection(): void {
    if (!this._room) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!Array.isArray((this._room as any).connections)) (this._room as any).connections = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room as any).connections.push({
      id: 'conn-' + Date.now(),
      from: '', to: '',
      label: '', bandwidth: '1G',
      utilization: 0.3, animated: true, visible: true
    })
    this._buildTopology()
    this._renderConnections()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _editConnection(idx: number, field: string, value: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (this._room as any)?.connections?.[idx]
    if (!conn) return
    conn[field] = value
    this._buildTopology()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _removeConnection(idx: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room as any)?.connections?.splice(idx, 1)
    this._buildTopology()
    this._renderConnections()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _buildRoomItems(): void {
    this._shadowMapDirty = true
    this._geometryManager?.buildRoomItems(this._room?.room_items || [])
  }

  _renderRoomItems(): void {
    const el = document.getElementById(this._id + '-room-items')
    if (!el) return
    el.innerHTML = (this._room?.room_items || []).map((item, i) => this._html.roomItemRow(item as unknown as Record<string, unknown>, i)).join('')
  }

  _renderWalls(): void {
    const el = document.getElementById(this._id + '-walls-list')
    if (!el) return
    el.innerHTML = (this._room?.room_walls || []).map((w, i) => this._html.wallRow(w as unknown as Record<string, unknown>, i)).join('')
  }

  _renderPillars(): void {
    const el = document.getElementById(this._id + '-pillars-list')
    if (!el) return
    el.innerHTML = (this._room?.room_pillars || []).map((p, i) => this._html.pillarRow(p as unknown as Record<string, unknown>, i)).join('')
  }

  // ─── Misc methods ─────────────────────────────────────────
  _startLoop(): void {
    cancelAnimationFrame(this._raf)

    const MS_IDLE = 800
    let lastTime = 0
    let lastMoveTime = 0
    let lastSelId: string | null = null, lastSelRackId: string | null = null, lastSelItemId: string | null = null
    let lastAz = this._ctrl.az, lastEl = this._ctrl.el, lastR = this._ctrl.r
    let lastPosX = this._ctrl.pos.x, lastPosY = this._ctrl.pos.y, lastPosZ = this._ctrl.pos.z
    let lastYaw = this._ctrl.yaw, lastPitch = this._ctrl.pitch

    const loop = (now: number) => {
      this._raf = requestAnimationFrame(loop)

      const dt = Math.min((now - lastMoveTime) / (1000 / 60), 4)
      lastMoveTime = now

      if (this._ctrl.mode === 'fps') {
        const { keys, pos } = this._ctrl
        const yaw = this._ctrl.yaw
        const fast = keys['ShiftLeft'] || keys['ShiftRight']
        const spd = this._ctrl.moveSpeed * (fast ? 2.5 : 1)
        const rotSpd = 0.04
        const fwdX = Math.sin(yaw), fwdZ = Math.cos(yaw)
        const anyMove = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] || keys['KeyQ'] || keys['KeyE'] || keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']
        if (anyMove && this._flyTween?.active) this._flyTween.active = false
        if (keys['KeyW'] || keys['ArrowUp']) { pos.x += fwdX * spd * dt; pos.z += fwdZ * spd * dt }
        if (keys['KeyS'] || keys['ArrowDown']) { pos.x -= fwdX * spd * dt; pos.z -= fwdZ * spd * dt }
        if (keys['KeyA'] || keys['ArrowLeft']) { this._ctrl.yaw -= rotSpd * dt }
        if (keys['KeyD'] || keys['ArrowRight']) { this._ctrl.yaw += rotSpd * dt }
        if (keys['KeyQ'] || keys['PageUp']) { pos.y += spd * dt }
        if (keys['KeyE'] || keys['PageDown']) { pos.y -= spd * dt }
        const ro = this._opts.room
        const margin = 0.8
        const sceneCZ = 2
        pos.x = Math.max(-ro.width / 2 + margin, Math.min(ro.width / 2 - margin, pos.x))
        pos.z = Math.max(sceneCZ - ro.depth / 2 + margin, Math.min(sceneCZ + ro.depth / 2 - margin, pos.z))
        pos.y = Math.max(1.0, Math.min(ro.height - 1.5, pos.y))
      }
      if (this._opts.view.autoRotate) {
        this._ctrl.az += this._opts.view.autoRotateSpeed
      }

      if (this._flyTween?.active) {
        this._camera.stepFlyTween(now)
      }

      const selChange = this._selId !== lastSelId || this._selRackId !== lastSelRackId || this._selItemId !== lastSelItemId
      const camChange = this._ctrl.az !== lastAz || this._ctrl.el !== lastEl || this._ctrl.r !== lastR
        || this._ctrl.pos.x !== lastPosX || this._ctrl.pos.y !== lastPosY || this._ctrl.pos.z !== lastPosZ
        || this._ctrl.yaw !== lastYaw || this._ctrl.pitch !== lastPitch
      const fpsMoving = this._ctrl.mode === 'fps' && Object.values(this._ctrl.keys).some(Boolean)
      const transformDrag = !!(this._rackDragState?.active || this._itemDragState?.active || this._rotateDragState?.active)
      const topoAnimating = this._showTopology && this._netParticles.length > 0
      const dirty = this._ctrl.drag || fpsMoving || this._opts.view.autoRotate || selChange || camChange || transformDrag || !!(this._flyTween?.active) || topoAnimating

      if (camChange || fpsMoving) this._posCamera()

      const MS_ACTIVE = fpsMoving ? 1000 / 30 : 1000 / 20
      const interval = dirty ? MS_ACTIVE : MS_IDLE
      if (now - lastTime < interval) return
      lastTime = now
      lastSelId = this._selId; lastSelRackId = this._selRackId; lastSelItemId = this._selItemId
      lastAz = this._ctrl.az; lastEl = this._ctrl.el; lastR = this._ctrl.r
      lastPosX = this._ctrl.pos.x; lastPosY = this._ctrl.pos.y; lastPosZ = this._ctrl.pos.z
      lastYaw = this._ctrl.yaw; lastPitch = this._ctrl.pitch

      this._tick++

      if (selChange) {
        Object.entries(this._devMeshes).forEach(([id, m]) => {
          if ((m as { material?: { emissiveIntensity: number } })?.material) (m as { material: { emissiveIntensity: number } }).material.emissiveIntensity = id === this._selId ? 3.0 : 0.55
        })
        if (this._geometryManager?.itemGroups) {
          Object.entries(this._geometryManager.itemGroups).forEach(([id, group]) => {
            const sel = id === this._selItemId;
            (group as { traverse(cb: (obj: { isMesh: boolean; userData: Record<string, unknown>; material: { emissive: unknown; emissiveIntensity: number; _baseEmissive?: number } }) => void): void }).traverse((obj) => {
              if (obj.isMesh && obj.material && !obj.userData.itemLabel && obj.material.emissive) {
                obj.material.emissiveIntensity = sel ? 1.8 : (obj.material._baseEmissive ?? obj.material.emissiveIntensity)
              }
            })
          })
        }
      } else if (dirty && this._selId) {
        const m = this._devMeshes[this._selId] as { material?: { emissiveIntensity: number } } | undefined
        if (m?.material) m.material.emissiveIntensity = 3.0 + 0.8 * Math.sin(this._tick * 0.15)
      } else if (dirty && this._selItemId) {
        const group = this._geometryManager?.itemGroups?.[this._selItemId]
        if (group) {
          (group as { traverse(cb: (obj: { isMesh: boolean; userData: Record<string, unknown>; material?: { emissive?: unknown; emissiveIntensity: number } }) => void): void }).traverse((obj) => {
            if (obj.isMesh && obj.material?.emissive && !obj.userData.itemLabel) {
              obj.material.emissiveIntensity = 1.5 + 0.5 * Math.sin(this._tick * 0.15)
            }
          })
        }
      }

      if (this._shadowMapDirty && !fpsMoving) {
        this._ren.shadowMap.needsUpdate = true
        this._shadowMapDirty = false
      }
      this._ren.render(this._scene, this._cam)

      if (camChange || selChange || fpsMoving || transformDrag) this._updateLabels()
      this._updateCompass()
      if (camChange || fpsMoving) this._updateAxisGizmo()
      if (this._showMinimap && (camChange || fpsMoving || selChange)) this._updateMinimap()
      if (topoAnimating) this._stepTopologyParticles()
    }
    requestAnimationFrame(loop)
  }

  _updateCompass(): void {
    const needle = document.getElementById(this._id + '-needle')
    const nLabel = document.getElementById(this._id + '-compass-n')
    if (!needle) return
    const heading = this._ctrl.mode === 'fps'
      ? this._ctrl.yaw
      : (this._ctrl.az ?? 0) - Math.PI
    needle.style.transform = `rotate(${heading}rad)`
    if (nLabel) {
      const norm = ((heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const facingNorth = norm < 0.35 || norm > (2 * Math.PI - 0.35)
      nLabel.style.color = facingNorth ? '#00ff88' : ''
      nLabel.style.textShadow = facingNorth ? '0 0 8px #00ff8888' : ''
    }
  }

  _updateAxisGizmo(): void {
    const canvas = document.getElementById(this._id + '-axis-gizmo') as HTMLCanvasElement | null
    if (!canvas || !this._cam) return
    const ctx = canvas.getContext('2d')!
    const W = 64, H = 64, cx = 32, cy = 36, r = 22
    ctx.clearRect(0, 0, W, H)
    this._cam.updateMatrixWorld()
    const me = this._cam.matrixWorldInverse.elements
    const axes = [
      { label: 'X', color: '#ff4444', vx: 1, vy: 0, vz: 0 },
      { label: 'Y', color: '#44dd66', vx: 0, vy: 1, vz: 0 },
      { label: 'Z', color: '#4488ff', vx: 0, vy: 0, vz: 1 },
    ]
    const projected = axes.map((a) => {
      const x = me[0] * a.vx + me[4] * a.vy + me[8] * a.vz
      const y = me[1] * a.vx + me[5] * a.vy + me[9] * a.vz
      const z = me[2] * a.vx + me[6] * a.vy + me[10] * a.vz
      return { ...a, x2d: cx + x * r, y2d: cy - y * r, depth: z }
    })
    projected.sort((a, b) => b.depth - a.depth)
    projected.forEach((a) => {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(a.x2d, a.y2d)
      ctx.strokeStyle = a.color; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(a.x2d, a.y2d, 3, 0, Math.PI * 2)
      ctx.fillStyle = a.color; ctx.fill()
      ctx.fillStyle = a.color; ctx.font = 'bold 9px monospace'
      ctx.fillText(a.label, a.x2d + (a.x2d - cx) * 0.28, a.y2d + (a.y2d - cy) * 0.28 + 3)
    })
  }

  _updateMinimap(): void {
    const canvas = document.getElementById(this._id + '-minimap') as HTMLCanvasElement | null
    if (!canvas || !this._room) return
    const ctx = canvas.getContext('2d')!
    const CW = 180, CH = 140, pad = 4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W: number = (this._opts.room as any).width || 26
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const D: number = (this._opts.room as any).depth || 20
    const sceneZ = 2

    const wx2c = (wx: number) => pad + (wx + W / 2) / W * (CW - 2 * pad)
    const wz2c = (wz: number) => pad + (wz - (sceneZ - D / 2)) / D * (CH - 2 * pad)

    ctx.clearRect(0, 0, CW, CH)
    ctx.fillStyle = 'rgba(20,30,40,0.9)'
    ctx.fillRect(pad, pad, CW - 2 * pad, CH - 2 * pad)

    // Grid
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tileSize: number = (this._opts.room as any).tileSize || 2
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
    ctx.fillText('W', pad + 1, CH / 2 + 3)
    ctx.textAlign = 'right'
    ctx.fillText('E', CW - pad - 1, CH / 2 + 3)

    // Zones (drawn below racks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((this._room as any)?.zones || []).forEach((zone: any) => {
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
    const rackW = this._opts.rack.width
    const rackD = this._opts.rack.depth
    const rw2 = rackW / W * (CW - 2 * pad) / 2
    const rd2 = rackD / D * (CH - 2 * pad) / 2
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room.racks || []).forEach((rack: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rg = this._rackGroups[rack.id] as any
      if (!rg) return
      const rx: number = rg.position.x
      const rz: number = rg.position.z
      const fa: number = rack.facingAngle ?? 0
      const sel = rack.id === this._selRackId
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((this._room as any).room_items || []).forEach((item: any) => {
      const icx = wx2c(item.x ?? item.position?.x ?? 0)
      const icy = wz2c(item.z ?? item.position?.z ?? 0)
      ctx.beginPath(); ctx.arc(icx, icy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,200,80,0.75)'; ctx.fill()
    })

    // Camera marker
    if (this._ctrl.mode === 'fps') {
      const cpx = wx2c(this._ctrl.pos.x)
      const cpy = wz2c(this._ctrl.pos.z)
      const yaw = this._ctrl.yaw
      const sz = 5
      ctx.save()
      ctx.translate(cpx, cpy)
      ctx.rotate(yaw)
      ctx.beginPath()
      ctx.moveTo(0, sz + 2); ctx.lineTo(-sz / 2 - 1, -sz / 2); ctx.lineTo(sz / 2 + 1, -sz / 2)
      ctx.closePath()
      ctx.fillStyle = '#00ff88'; ctx.fill()
      ctx.restore()
    }

    // Position readout in header
    const posEl = document.getElementById(this._id + '-minimap-pos')
    if (posEl) posEl.textContent = this._ctrl.mode === 'fps'
      ? `${Math.round(this._ctrl.pos.x)}, ${Math.round(this._ctrl.pos.z)}`
      : ''
  }

  toggleMinimap(): void {
    this._showMinimap = !this._showMinimap
    const wrap = document.getElementById(this._id + '-minimap-wrap')
    const btn = document.getElementById(this._id + '-btnMinimap')
    if (wrap) wrap.style.display = this._showMinimap ? 'flex' : 'none'
    if (btn) btn.className = 'r3-btn' + (this._showMinimap ? ' on' : '')
    if (this._showMinimap) this._updateMinimap()
  }

  _onMinimapClick(e: MouseEvent): void {
    if (this._ctrl.mode !== 'fps') return
    const canvas = e.currentTarget as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const CW = 160, CH = 120, pad = 4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W: number = (this._opts.room as any).width || 26
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const D: number = (this._opts.room as any).depth || 20
    this._ctrl.pos.x = (cx - pad) / (CW - 2 * pad) * W - W / 2
    this._ctrl.pos.z = (cy - pad) / (CH - 2 * pad) * D + (2 - D / 2)
  }

  _onThemeChange(name: string): void {
    this._opts.theme = name
    this.setTheme(name)
    const sel = document.getElementById(this._id + '-theme-sel') as HTMLSelectElement | null
    if (sel) sel.value = name
  }

  _toggleLegend(): void {
    const lb = document.getElementById(this._id + '-legend')
    if (lb) lb.style.display = lb.style.display === 'none' ? 'block' : 'none'
  }

  _setLayout(field: string, value: number): void {
    if (!this._room) return
    if (!this._room.layout) this._room.layout = { rows: 1, cols: 1, colSpacing: 8, rowSpacing: 10 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this._room.layout as any)[field] = value
    this._buildRack()
  }

  _setRoomName(name: string): void {
    if (this._room) this._room.name = name
    const span = document.getElementById(this._id + '-room-name')
    if (span) span.textContent = name
    const inp = document.getElementById(this._id + '-room-name-inp') as HTMLInputElement | null
    if (inp && inp !== document.activeElement) inp.value = name
  }

  _setRoom(field: string, value: unknown): void {
    ;(this._opts.room as Record<string, unknown>)[field] = value
    if (field === 'fogNear' || field === 'fogFar') {
      if (this._scene?.fog) {
        this._scene.fog.near = this._opts.room.fogNear
        this._scene.fog.far = this._opts.room.fogFar
      }
    } else if (this._scene && this._geometryManager) {
      this._buildEnvironment()
    }
  }

  _setLight(field: string, value: unknown): void {
    ;(this._opts.lighting as Record<string, unknown>)[field] = value
    if (field === 'exposure' && this._ren) {
      this._ren.toneMappingExposure = value
    } else if (this._scene && this._geometryManager) {
      this._buildEnvironment()
    }
  }

  _setRackOpt(field: string, value: unknown): void {
    ;(this._opts.rack as Record<string, unknown>)[field] = value
    this._buildRack()
  }

  _addRack(): void {
    if (!this._room) return
    const layout = this._room.layout || ({} as { cols?: number })
    const cols = layout.cols || 1
    const existing = this._room.racks || []
    const newCol = existing.length % cols
    const newRow = Math.floor(existing.length / cols)
    const nr: Rack = {
      id: 'rack-' + Date.now(),
      row: newRow, col: newCol,
      name: 'RACK-' + String.fromCharCode(65 + existing.length),
      units: 24,
      devices: [],
      rackTemp: 25, pduCapacity: 4000, pduLoad: 0,
    }
    this._room.racks!.push(nr)
    this._selRackId = nr.id; this._rack = nr
    this._buildRack(); this._refresh()
  }

  _removeRack(rackId: string): void {
    if (!this._room) return
    this._autoUngroup(rackId)
    this._room.racks = this._room.racks!.filter((r) => r.id !== rackId)
    if (this._selRackId === rackId) { this._selRackId = null; this._rack = null }
    this._buildRack()
    this._refresh()
  }

  resetRack(): void {
    if (!this._rack) return
    if (!confirm('Reset rack? All devices will be removed.')) return
    this._rack.devices = []; this._selId = null; this._closeEdit()
    this._buildRack(); this._refresh()
  }

  _addWall(): void {
    if (!this._room) return
    if (!Array.isArray(this._room.room_walls)) this._room.room_walls = []
    const ro = this._opts.room
    this._room.room_walls.push({
      id: 'wall-' + Date.now(),
      name: 'Wall ' + (this._room.room_walls.length + 1),
      length: ro.width || 20, height: ro.height || 14,
      x: 0, z: 0, angle: 0, color: undefined, opacity: 1.0, visible: true
    })
    this._buildEnvironment()
    this._renderWalls()
  }

  _editWall(idx: number, field: string, value: unknown): void {
    const wall = this._room?.room_walls?.[idx]
    if (!wall) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(wall as any)[field] = value
    this._buildEnvironment()
  }

  _removeWall(idx: number): void {
    this._room?.room_walls?.splice(idx, 1)
    this._buildEnvironment()
    this._renderWalls()
  }

  _autoGenWalls(): void {
    if (!this._room) return
    const ro = this._opts.room
    const W = ro.width, D = ro.depth, H = ro.height
    this._room.room_walls = [
      { id: 'w-back', name: 'Back', length: W, height: H, x: 0, z: D / 2, angle: 0, color: undefined, opacity: 1.0, visible: true },
      { id: 'w-front', name: 'Front', length: W, height: H, x: 0, z: -D / 2 + 2, angle: 0, color: undefined, opacity: 0.6, visible: true },
      { id: 'w-left', name: 'Left', length: D, height: H, x: -W / 2, z: 2, angle: Math.PI / 2, color: undefined, opacity: 1.0, visible: true },
      { id: 'w-right', name: 'Right', length: D, height: H, x: W / 2, z: 2, angle: -Math.PI / 2, color: undefined, opacity: 1.0, visible: true },
    ]
    this._buildEnvironment()
    this._renderWalls()
  }

  _addPillar(): void {
    if (!this._room) return
    if (!Array.isArray(this._room.room_pillars)) this._room.room_pillars = []
    this._room.room_pillars.push({
      id: 'pil-' + Date.now(),
      x: 0, z: 0, shape: 'cylinder', radius: 0.4,
      width: 0.8, depth: 0.8, height: this._opts.room.height || 14, color: '#2a3a4a'
    })
    this._buildEnvironment()
    this._renderPillars()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _editPillar(idx: number, field: string, value: unknown): void {
    const pillar = this._room?.room_pillars?.[idx]
    if (!pillar) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(pillar as any)[field] = typeof value === 'string' && !isNaN(value as unknown as number) && field !== 'shape' && field !== 'color' ? parseFloat(value) : value
    this._buildEnvironment()
    if (field === 'shape') this._renderPillars()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _removePillar(idx: number): void {
    this._room?.room_pillars?.splice(idx, 1)
    this._buildEnvironment()
    this._renderPillars()
    if (this._opts.onChange) this._opts.onChange(this.getData()!)
  }

  _addRoomItem(type: string): void {
    if (!this._room) return
    if (!Array.isArray(this._room.room_items)) this._room.room_items = []
    const id = 'item-' + Date.now()
    this._room.room_items.push({ id, type, name: type.toUpperCase() + '-' + (this._room.room_items.length + 1), x: 0, y: 0, z: 0, angle: 0 })
    this._buildRoomItems()
    this._renderRoomItems()
  }

  _editRoomItem(idx: number, field: string, value: unknown): void {
    const item = this._room?.room_items?.[idx]
    if (!item) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(item as any)[field] = value
    this._buildRoomItems()
  }

  _removeRoomItem(idx: number): void {
    const item = this._room?.room_items?.[idx]
    if (item?.id) this._autoUngroup(item.id)
    this._room?.room_items?.splice(idx, 1)
    this._buildRoomItems()
    this._renderRoomItems()
  }

  _addCustomLight(): void {
    if (!this._opts.lighting.customLights) this._opts.lighting.customLights = []
    this._opts.lighting.customLights.push({ type: 'point', x: 0, y: 10, z: 0, intensity: 5, color: '#ffffff' as unknown as number })
    this._buildEnvironment()
    this._renderCustomLights()
  }

  _editCustomLight(idx: number, field: string, value: unknown): void {
    const cl = this._opts.lighting.customLights?.[idx]
    if (!cl) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(cl as any)[field] = value
    this._buildEnvironment()
  }

  _removeCustomLight(idx: number): void {
    this._opts.lighting.customLights?.splice(idx, 1)
    this._buildEnvironment()
    this._renderCustomLights()
  }

  _renderCustomLights(): void {
    const el = document.getElementById(this._id + '-custom-lights')
    if (!el) return
    el.innerHTML = (this._opts.lighting.customLights || [])
      .map((cl, i) => this._html.customLightRow(cl as unknown as Record<string, unknown>, i)).join('')
  }
}
