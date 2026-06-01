export interface IThemeCss {
  bg: string
  panel: string
  border: string
  accent: string
  text: string
  dim: string
  green: string
  amber: string
  red: string
  font: string
}

export interface IThemeScene {
  clearColor: number
  fogColor: number
  fogNear?: number
  fogFar?: number
  exposure: number
  ambientColor: number
  ambientIntensity: number
  frontLightIntensity: number
  overheadIntensity: number
  floorColor: number
  tileColor?: number
  gridColor?: number
  tileRoughness?: number
  tileMetalness?: number
  wallColor: number
  ceilColor: number
  ceilGridColor?: number
  baseboardColor: number
  baseboardEmissive?: number
  stripEmissive: number
  skipSkybox?: boolean
}

export interface IThemeRack {
  frameColor: number
  postColor: number
  railColor: number
  cavityColor: number
}

export interface ITheme {
  name: string
  css: IThemeCss
  scene: IThemeScene
  rack: IThemeRack
}
