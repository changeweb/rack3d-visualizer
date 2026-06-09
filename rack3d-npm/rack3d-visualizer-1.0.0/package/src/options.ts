import type { IOptions, ResolvedOptions } from './types'

export const DEFAULT_OPTIONS: ResolvedOptions = {
  theme: 'dark',
  view: { mode: '3d', wireframe: false, showLabels: true, autoRotate: false, autoRotateSpeed: 0.003, showToolbar: true, allowDragDrop: true, allowEdit: true, allowAddRemove: true, allowJsonEdit: true },
  camera: { fov: 44, mode: 'orbit', azimuth: Math.PI, elevation: 0.15, distance: 'auto', minDistance: 4, maxDistance: 80, orbitSpeed: 0.0045, zoomSpeed: 0.035, initialPos: { x: 0, y: 16, z: -26 }, initialYaw: 0, initialPitch: -0.08, fpsSpeed: 0.12 },
  lighting: { ambientIntensity: 6.0, ambientColor: 0xd0e8ff, overheadIntensity: 9.0, overheadCount: 6, exposure: 2.8, shadows: true, shadowMapSize: 512, powerPreference: 'default', customLights: [], frontIntensity: 10, fillIntensity: 6, floorGlowIntensity: 3, rackGlowIntensity: 6 },
  room: { enabled: true, width: 26, depth: 20, height: 14, floorTiles: true, tileSize: 2.0, ceilingGrid: true, stripLights: true, baseboardLights: true, fogNear: 22, fogFar: 55, wallColor: null, showNorthCompass: true, exitSign: false, cableTrays: false },
  rack: { unitHeight: 0.445, width: 5.6, depth: 4.0, postSize: 0.16, showSidePanels: true, showRearPanel: false, showNameplate: true, nameplateScale: 1.0, nameplateYOffset: 0.2, nameplateOpacity: 1.0 },
  labels: { enabled: true, side: 'auto', connectorLength: 38, showWatts: true, showUnits: true, showType: true, showIcon: true, fontSize: 11, iconSize: 13 },
  sidebar: { enabled: true, position: 'left', width: 248, showRackConfig: true, showStats: true, showDeviceList: true, showAddButtons: true, showEditPanel: true, showUnitMap: true, showLegend: true, showLeft: true, showRight: true, leftWidth: 248, rightWidth: 260, panelLayout: null, roomFields: null, lightingFields: null },
  deviceTypes: {},
  onSelect: null,
  onChange: null,
  onReady: null,
}

export function mergeOptions(defaults: ResolvedOptions, user: IOptions = {}): ResolvedOptions {
  const result = JSON.parse(JSON.stringify(defaults)) as ResolvedOptions
  for (const key of Object.keys(user) as Array<keyof IOptions>) {
    const uv = user[key]
    if (uv !== null && typeof uv === 'object' && !Array.isArray(uv) && typeof result[key as keyof ResolvedOptions] === 'object' && result[key as keyof ResolvedOptions] !== null) {
      (result as Record<string, unknown>)[key] = mergeOptions((result as Record<string, unknown>)[key] as ResolvedOptions, uv as IOptions)
    } else if (uv !== undefined) {
      (result as Record<string, unknown>)[key] = uv
    }
  }
  for (const fn of ['onSelect', 'onChange', 'onReady'] as const) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (user[fn]) (result as any)[fn] = user[fn]
  }
  return result
}
