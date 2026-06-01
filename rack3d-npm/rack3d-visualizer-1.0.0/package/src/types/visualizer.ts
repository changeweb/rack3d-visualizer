import type { RoomData, Rack, Device, LabelPosition } from './room'
import type { ResolvedOptions } from './options'
import type { ITheme } from './theme'
import type { IDeviceType } from './options'

export interface ICameraCtrl {
  mode: 'fps' | 'orbit'
  drag: boolean
  lx: number
  ly: number
  az: number
  el: number
  r: number
  pos: { x: number; y: number; z: number }
  yaw: number
  pitch: number
  keys: Record<string, boolean>
  moveSpeed: number
  pointerLocked: boolean
}

export interface IVisualizer {
  _id: string
  _room: RoomData | null
  _rack: Rack | null
  _selRackId: string | null
  _selId: string | null
  _selItemId: string | null
  _opts: ResolvedOptions
  _theme: ITheme
  _types: Record<string, IDeviceType>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _T3: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _scene: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _cam: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _ren: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rackGroups: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _devMeshes: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _labelDivs: Record<string, any>
  _labelPositions: Record<string, LabelPosition>
  _devRackMap: Record<string, Rack>
  _showWire: boolean
  _showLabels: boolean
  _mode: '2d' | '3d'
  _el: HTMLElement
  _shadowMapDirty: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _materialFactory: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _selectionManager: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _geometryManager: any
  _ctrl: ICameraCtrl
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _onResize: (() => void) | null
  _unbindKeys: (() => void) | null
  _selGroupId: string | null
  _multiSel: Set<string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _groupHighlightRings: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transformMode: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rackDragState: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _itemDragState: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rotateDragState: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _html: any
  _midY(): number
  _buildRack(): void
  _refresh(): void
  _renderWalls(): void
  _renderPillars(): void
  _renderCatalog(): void
  _closeEdit(): void
  _openEdit(dev: Device): void
  _rmDev(id: string): void
  _addDev(type: string, hw?: string, name?: string, h?: number, w?: number): string | null
  _dropUnit(devId: string, unit: number, side?: string): void
  _buildRoomItems(): void
  _renderRoomItems(): void
  _posCamera(): void
  _buildEnvironment(): void
  _renderCustomLights(): void
  _restorePanelState(): void
  _savePanelState(): void
  _toggleSidebarLeft(): void
  _toggleSidebarRight(): void
  _showContextMenu(e: MouseEvent, targetId: string | null): void
  _hideContextMenu(): void
  _toggleMultiSel(id: string): void
  _groupMembersFlat(groupId: string): string[]
  _itemGroupIds(id: string): string[]
  _snapshotGroupPositions(groupId: string): Record<string, unknown>
  _snapshotGroupAngles(groupId: string): Record<string, unknown>
  _applyGroupDeltaFromSnapshot(posSnap: Record<string, unknown>, dx: number, dz: number): void
  _applyGroupRotationFromSnapshot(angleSnap: Record<string, unknown>, dDeg: number): void
  _raycastFloor(clientX: number, clientY: number, cv: HTMLCanvasElement): unknown
  _snapRackPos(x: number, z: number): { x: number; z: number }
  _doRaycast(e: MouseEvent, cv: HTMLCanvasElement): void
  _onThemeChange(name: string): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData(data: any): IVisualizer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setRoomData(data: any): IVisualizer
  getData(): RoomData | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _updateLabels?(): void
  _render2D?(): void
  _groupsArr?(): { id: string; name: string; members: string[] }[]
}
