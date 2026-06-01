import type { RoomData, RoomItem, Rack, LabelPosition, IRoomOptions, ILightingOptions, IThemeScene, IThemeRack, Layout } from '../types'
import { RoomItemBuilder } from '../builders/RoomItemBuilder'
import type { RackBuilder } from '../builders/RackBuilder'
import type { DeviceBuilder } from '../builders/DeviceBuilder'
import type { EnvironmentBuilder } from '../builders/EnvironmentBuilder'
import type { MaterialFactory } from './MaterialFactory'

interface RoomOptionsWithWalls extends IRoomOptions {
  walls?: RoomData['room_walls']
  pillars?: RoomData['room_pillars']
}

export class GeometryManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scene: any
  rackBuilder: RackBuilder
  deviceBuilder: DeviceBuilder
  environmentBuilder: EnvironmentBuilder
  materialFactory: MaterialFactory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any
  rackGroups: Record<string, unknown>
  deviceMeshes: Record<string, unknown>
  labelPositions: Record<string, LabelPosition>
  labelSide: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _envGroup: any
  itemGroups: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemLabelMeshes: any[]
  roomItemBuilder: RoomItemBuilder

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene: any,
    rackBuilder: RackBuilder,
    deviceBuilder: DeviceBuilder,
    environmentBuilder: EnvironmentBuilder,
    materialFactory: MaterialFactory,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme?: any
  ) {
    this.THREE = THREE
    this.scene = scene
    this.rackBuilder = rackBuilder
    this.deviceBuilder = deviceBuilder
    this.environmentBuilder = environmentBuilder
    this.materialFactory = materialFactory
    this.theme = theme ?? null
    this.rackGroups = {}
    this.deviceMeshes = {}
    this.labelPositions = {}
    this.labelSide = 'auto'
    this._envGroup = null
    this.itemGroups = {}
    this.itemLabelMeshes = []
    this.roomItemBuilder = new RoomItemBuilder(THREE, theme)
  }

  buildEnvironment(room: RoomData | null, roomOptions: IRoomOptions, lightingOptions: ILightingOptions, sceneTheme: IThemeScene): void {
    if (this._envGroup) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._envGroup.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose())
          else obj.material.dispose()
        }
      })
      this.scene.remove(this._envGroup)
      this._envGroup = null
    }

    this._envGroup = new this.THREE.Group()
    this.scene.add(this._envGroup)
    const mergedRO: RoomOptionsWithWalls = { ...roomOptions, walls: room?.room_walls, pillars: room?.room_pillars }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.environmentBuilder.build(this._envGroup as any, mergedRO as any, lightingOptions, sceneTheme)
  }

  buildRoomItems(items: RoomItem[] | undefined): void {
    this.clearRoomItems()
    ;(items ?? []).forEach(item => {
      if (!item.id) return
      const group = this.roomItemBuilder.build(item)
      this.scene.add(group)
      this.itemGroups[item.id] = group

      const labelMesh = this.roomItemBuilder.buildLabel(item)
      if (labelMesh) {
        if (item.type === 'battery') {
          const D = item.depth ?? 2.0
          const H = item.height ?? 2.5
          labelMesh.position.set(0, H * 0.45, -(D / 2) - 0.02)
        } else {
          const itemH = item.height ?? this.roomItemBuilder._defaultHeight(item.type)
          const planeH = 2.8 * (128 / 512)
          labelMesh.position.set(0, itemH + planeH * 0.5 + 0.4, 0)
        }
        group.add(labelMesh)
        this.itemLabelMeshes.push(labelMesh)
      }
    })
  }

  clearRoomItems(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(this.itemGroups).forEach((group: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose())
          else obj.material.dispose()
        }
      })
      this.scene.remove(group)
    })
    this.itemLabelMeshes = []
    this.itemGroups = {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildAllRacks(room: RoomData, rackOptions: any, rackTheme: IThemeRack, selRackId: string | null): void {
    this.clearAllRacks()

    if (!room?.racks?.length) return

    const layout: Partial<Layout> = room.layout ?? {}
    const colSpacing = layout.colSpacing ?? 8
    const rowSpacing = layout.rowSpacing ?? 10
    const cols = layout.cols ?? 1
    const rows = layout.rows ?? 1
    const totalW = (cols - 1) * colSpacing
    const totalD = (rows - 1) * rowSpacing

    room.racks.forEach(entry => {
      const gridX = (entry.col ?? 0) * colSpacing - totalW / 2
      const gridZ = (entry.row ?? 0) * rowSpacing - totalD / 2
      const ox = entry.position?.x ?? gridX
      const oy = entry.position?.y ?? 0
      const oz = entry.position?.z ?? gridZ

      this._buildSingleRack(entry, ox, oy, oz, rackOptions, rackTheme, selRackId)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _buildSingleRack(rack: Rack, ox: number, oy: number, oz: number, rackOptions: any, rackTheme: IThemeRack, selRackId: string | null): void {
    const group = new this.THREE.Group()
    group.position.set(ox, oy, oz)
    group.rotation.y = rack.facingAngle ?? 0
    group.userData.rk = 'rackgroup'
    group.userData.rackId = rack.id

    this.scene.add(group)
    this.rackGroups[rack.id] = group

    this.rackBuilder.build(rack, rackOptions, rackTheme, group, selRackId)

    const hw = rackOptions.width / 2
    const hd = rackOptions.depth / 2

    if (rack.devices?.length) {
      const sorted = rack.devices.slice().sort((a, b) => a.startUnit - b.startUnit)
      sorted.forEach((device, idx) => {
        this.deviceBuilder.build(device, idx, this.labelSide, rackOptions, group, rack, hw, hd, this.labelPositions, this.deviceMeshes as Record<string, unknown>)
      })
    }
  }

  clearAllRacks(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.values(this.rackGroups).forEach((group: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      group.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            obj.material.forEach((m: any) => {
              m.map?.dispose()
              m.dispose()
            })
          } else {
            obj.material?.map?.dispose()
            obj.material?.dispose()
          }
        }
      })
      this.scene.remove(group)
    })

    this.materialFactory?.cache.clear()

    this.rackGroups = {}
    this.deviceMeshes = {}
    this.labelPositions = {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getGroupForRack(rackId: string): any {
    return this.rackGroups[rackId]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDeviceMesh(deviceId: string): any {
    return this.deviceMeshes[deviceId]
  }

  getLabelPositions(): Record<string, LabelPosition> {
    return this.labelPositions
  }
}
