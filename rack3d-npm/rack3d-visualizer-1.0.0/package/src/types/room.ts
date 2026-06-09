export interface Vec3 { x: number; y: number; z: number }

export type DeviceStatus = 'up' | 'down' | 'warn'
export type HalfWidth = 'left' | 'right' | false

export interface DeviceField {
  icon?: string
  label?: string
  value: string | number
}

export interface VMPort {
  port: number
  protocol: string
  status: string
  service?: string
}

export interface VMResources {
  vcpu?: number
  memory?: number
  disk?: number
}

export interface VM {
  id: string
  name: string
  label?: string
  technology?: string
  os?: string
  status: 'running' | 'stopped' | 'paused'
  ips?: { local?: string; public?: string }
  ports?: VMPort[]
  resources?: VMResources
}

export interface Device {
  id: string
  name: string
  type: string
  startUnit: number
  heightUnits: number
  watts?: number
  color?: string
  ip?: string
  status?: DeviceStatus
  halfWidth?: HalfWidth
  imageUrl?: string
  imageUrlRear?: string
  textureUrl?: string
  normalMapUrl?: string
  roughnessMapUrl?: string
  catalogId?: string
  model?: string
  fields?: DeviceField[]
  vms?: VM[]
}

export interface Rack {
  id: string
  name: string
  units: number
  devices: Device[]
  row?: number
  col?: number
  position?: Partial<Vec3>
  facingAngle?: number
  rackTemp?: number
  pduCapacity?: number
  pduLoad?: number
  showLabels?: boolean
  nameplateShape?: string
  nameplateColor?: string
  nameplateTextColor?: string
}

export interface CatalogItem {
  id: string
  name: string
  type: string
  heightUnits: number
  watts: number
  imageUrl?: string
  imageUrlRear?: string
  textureUrl?: string
  normalMapUrl?: string
  roughnessMapUrl?: string
  halfWidth?: HalfWidth
  model?: string
}

export interface RoomItem {
  id: string
  type: string
  name: string
  label?: string
  x: number
  y: number
  z: number
  angle?: number
  color?: string
  width?: number
  height?: number
  depth?: number
  layers?: number
}

export interface Wall {
  id: string
  name?: string
  x: number
  z: number
  angle: number
  length: number
  height: number
  color?: string
  opacity?: number
  visible?: boolean
}

export interface Pillar {
  id: string
  x: number
  z: number
  shape: 'cylinder' | 'square'
  radius?: number
  width?: number
  depth?: number
  height: number
  color?: string
}

export interface Group {
  id: string
  name: string
  members: string[]
}

export interface Layout {
  rows: number
  cols: number
  colSpacing: number
  rowSpacing: number
}

export interface Zone {
  id: string
  name: string
  color: string
  x: number
  z: number
  width: number
  depth: number
  opacity?: number
  wallHeight?: number
  visible?: boolean
}

export interface Connection {
  id: string
  from: string
  to: string
  label?: string
  bandwidth?: string
  utilization?: number
  color?: string
  animated?: boolean
  visible?: boolean
}

export interface RoomData {
  name?: string
  layout?: Layout
  catalog?: CatalogItem[]
  racks?: Rack[]
  room_items?: RoomItem[]
  room_walls?: Wall[]
  room_pillars?: Pillar[]
  zones?: Zone[]
  connections?: Connection[]
  groups?: Group[]
}

export interface LabelPosition {
  pos: { x: number; y: number; z: number } | { copy(v: unknown): void; project(cam: unknown): void }
  side: 'left' | 'right'
}

export interface RackStats {
  rackTemp?: number
  pduCapacity?: number
  pduLoad?: number
}

export interface DeviceUpdates {
  status?: DeviceStatus
  watts?: number
  ip?: string
  fields?: DeviceField[]
}
