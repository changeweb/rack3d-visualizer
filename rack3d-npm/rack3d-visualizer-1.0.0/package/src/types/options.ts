import type { ITheme } from './theme'
import type { RoomData, Device } from './room'

export interface IViewOptions {
  mode?: '3d' | '2d'
  wireframe?: boolean
  showLabels?: boolean
  autoRotate?: boolean
  autoRotateSpeed?: number
  showToolbar?: boolean
  allowDragDrop?: boolean
  allowEdit?: boolean
  allowAddRemove?: boolean
  allowJsonEdit?: boolean
}

export interface ICameraOptions {
  fov?: number
  mode?: 'fps' | 'orbit'
  azimuth?: number
  elevation?: number
  distance?: number | 'auto'
  minDistance?: number
  maxDistance?: number
  orbitSpeed?: number
  zoomSpeed?: number
  initialPos?: { x: number; y: number; z: number }
  initialYaw?: number
  initialPitch?: number
  fpsSpeed?: number
}

export interface ICustomLight {
  type: 'point' | 'directional' | 'spot' | 'ceiling'
  x: number
  y: number
  z: number
  intensity: number
  color?: number
  distance?: number
}

export interface ILightingOptions {
  ambientIntensity?: number
  ambientColor?: number
  overheadIntensity?: number
  overheadCount?: number
  exposure?: number
  shadows?: boolean
  shadowMapSize?: number
  powerPreference?: string
  customLights?: ICustomLight[]
  frontIntensity?: number
  fillIntensity?: number
  floorGlowIntensity?: number
  rackGlowIntensity?: number
}

export interface IRoomOptions {
  enabled?: boolean
  width?: number
  depth?: number
  height?: number
  floorTiles?: boolean
  tileSize?: number
  ceilingGrid?: boolean
  stripLights?: boolean
  baseboardLights?: boolean
  fogNear?: number
  fogFar?: number
  wallColor?: number | null
  showNorthCompass?: boolean
  exitSign?: boolean
  cableTrays?: boolean
}

export interface IRackOptions {
  unitHeight?: number
  width?: number
  depth?: number
  postSize?: number
  showSidePanels?: boolean
  showRearPanel?: boolean
  showNameplate?: boolean
  nameplateScale?: number
  nameplateYOffset?: number
  nameplateOpacity?: number
}

export interface ILabelsOptions {
  enabled?: boolean
  side?: 'auto' | 'left' | 'right'
  connectorLength?: number
  showWatts?: boolean
  showUnits?: boolean
  showType?: boolean
  showIcon?: boolean
  fontSize?: number
  iconSize?: number
}

export interface ISidebarOptions {
  enabled?: boolean
  position?: 'left' | 'right'
  width?: number
  showRackConfig?: boolean
  showStats?: boolean
  showDeviceList?: boolean
  showAddButtons?: boolean
  showEditPanel?: boolean
  showUnitMap?: boolean
  showLegend?: boolean
  showLeft?: boolean
  showRight?: boolean
  leftWidth?: number
  rightWidth?: number
  panelLayout?: { left: string[]; right: string[]; collapsed: Record<string, boolean> } | null
  roomFields?: string[] | null
  lightingFields?: string[] | null
}

export interface IDeviceType {
  color: string
  hex: number
  label: string
  icon: string
}

export interface SelectEvent {
  type: 'device' | 'rack'
  id: string
  rackId?: string
}

export interface IOptions {
  theme?: string | Partial<ITheme>
  view?: IViewOptions
  camera?: ICameraOptions
  lighting?: ILightingOptions
  room?: IRoomOptions
  rack?: IRackOptions
  labels?: ILabelsOptions
  sidebar?: ISidebarOptions
  deviceTypes?: Record<string, Partial<IDeviceType>>
  onSelect?: ((e: SelectEvent) => void) | null
  onChange?: ((data: RoomData) => void) | null
  onReady?: ((viz: unknown) => void) | null
}

export type ResolvedOptions = {
  theme: string | Partial<ITheme>
  view: Required<IViewOptions>
  camera: Required<ICameraOptions>
  lighting: Required<ILightingOptions>
  room: Required<IRoomOptions>
  rack: Required<IRackOptions>
  labels: Required<ILabelsOptions>
  sidebar: Required<ISidebarOptions>
  deviceTypes: Record<string, Partial<IDeviceType>>
  onSelect: ((e: SelectEvent) => void) | null
  onChange: ((data: RoomData) => void) | null
  onReady: ((viz: unknown) => void) | null
}
