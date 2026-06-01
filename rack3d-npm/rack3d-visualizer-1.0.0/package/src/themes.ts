import type { ITheme } from './types'

export const THEMES: Record<string, ITheme> = {
  dark: {
    name: 'dark',
    css: { bg: '#070c14', panel: '#0b1120', border: '#1e2d45', accent: '#00d4ff', text: '#c8d8e8', dim: '#4a6278', green: '#00ff88', amber: '#ffaa00', red: '#ff3344', font: "'IBM Plex Mono', monospace" },
    scene: { clearColor: 0x06090f, fogColor: 0x070c14, fogNear: 22, fogFar: 55, exposure: 2.8, ambientColor: 0xd0e8ff, ambientIntensity: 6.0, frontLightIntensity: 10.0, overheadIntensity: 9.0, floorColor: 0x1e2d40, wallColor: 0x2e3d52, ceilColor: 0x232e3f, baseboardColor: 0x0044cc, stripEmissive: 20 },
    rack: { frameColor: 0x1c2535, postColor: 0x2a3550, railColor: 0x202d40, cavityColor: 0x070a10 },
  },
  light: {
    name: 'light',
    css: { bg: '#f0f4f8', panel: '#ffffff', border: '#d0dae6', accent: '#0066cc', text: '#1a2a3a', dim: '#6a7a8a', green: '#00aa55', amber: '#cc8800', red: '#cc2233', font: "'IBM Plex Mono', monospace" },
    scene: { clearColor: 0xdce4ec, fogColor: 0xd8e0e8, fogNear: 60, fogFar: 120, exposure: 1.4, ambientColor: 0xfff8f0, ambientIntensity: 0.2, frontLightIntensity: 1.5, overheadIntensity: 8.0, floorColor: 0xc8cdd5, tileColor: 0xbfc4cc, gridColor: 0xadb4bc, tileRoughness: 0.35, tileMetalness: 0.08, wallColor: 0xd8dfe6, ceilColor: 0xeff2f5, ceilGridColor: 0xd0d8e0, baseboardColor: 0xb8c2cc, baseboardEmissive: 0, stripEmissive: 22, skipSkybox: true },
    rack: { frameColor: 0xb8c8d4, postColor: 0xc0ced8, railColor: 0xccd8e0, cavityColor: 0x1a2430 },
  },
  oled: {
    name: 'oled',
    css: { bg: '#000000', panel: '#0a0a0a', border: '#222222', accent: '#00ffcc', text: '#e0e0e0', dim: '#555555', green: '#00ffaa', amber: '#ffcc00', red: '#ff2244', font: "'Share Tech Mono', monospace" },
    scene: { clearColor: 0x000000, fogColor: 0x000000, fogNear: 18, fogFar: 45, exposure: 3.2, ambientColor: 0x112233, ambientIntensity: 3.0, frontLightIntensity: 12.0, overheadIntensity: 11.0, floorColor: 0x0a0a0a, wallColor: 0x111111, ceilColor: 0x0a0a0a, baseboardColor: 0x00ffcc, stripEmissive: 30 },
    rack: { frameColor: 0x111111, postColor: 0x1a1a1a, railColor: 0x222222, cavityColor: 0x000000 },
  },
  warm: {
    name: 'warm',
    css: { bg: '#140d08', panel: '#1e1208', border: '#3a2a18', accent: '#ff9933', text: '#e8d8c0', dim: '#6a5040', green: '#88cc44', amber: '#ffaa22', red: '#ff4422', font: "'IBM Plex Mono', monospace" },
    scene: { clearColor: 0x140d08, fogColor: 0x100a05, fogNear: 20, fogFar: 50, exposure: 2.4, ambientColor: 0xffd0a0, ambientIntensity: 5.0, frontLightIntensity: 9.0, overheadIntensity: 7.0, floorColor: 0x2a1e10, wallColor: 0x2e2015, ceilColor: 0x1e160c, baseboardColor: 0xff6600, stripEmissive: 15 },
    rack: { frameColor: 0x2a1e12, postColor: 0x3a2a18, railColor: 0x2e2218, cavityColor: 0x0e0905 },
  },
  matrix: {
    name: 'matrix',
    css: { bg: '#000d00', panel: '#001400', border: '#004400', accent: '#00ff44', text: '#88ff88', dim: '#226622', green: '#00ff88', amber: '#88ff00', red: '#ff4400', font: "'Share Tech Mono', monospace" },
    scene: { clearColor: 0x000800, fogColor: 0x000500, fogNear: 18, fogFar: 42, exposure: 3.0, ambientColor: 0x002200, ambientIntensity: 4.0, frontLightIntensity: 11.0, overheadIntensity: 8.0, floorColor: 0x001200, wallColor: 0x001a00, ceilColor: 0x000e00, baseboardColor: 0x00ff44, stripEmissive: 25 },
    rack: { frameColor: 0x001200, postColor: 0x002000, railColor: 0x003300, cavityColor: 0x000400 },
  },
}

export function resolveTheme(themeInput: string | Partial<ITheme> | undefined): ITheme {
  if (!themeInput) return THEMES.dark
  if (typeof themeInput === 'string') return THEMES[themeInput] ?? THEMES.dark
  return deepMerge(JSON.parse(JSON.stringify(THEMES.dark)) as ITheme, themeInput)
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source) as Array<keyof T>) {
    const sv = source[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && typeof target[key] === 'object') {
      target[key] = deepMerge(target[key] as object, sv as object) as T[typeof key]
    } else if (sv !== undefined) {
      target[key] = sv as T[typeof key]
    }
  }
  return target
}
