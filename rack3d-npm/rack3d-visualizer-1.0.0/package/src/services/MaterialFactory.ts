import type { ITheme } from '../types'

export class MaterialFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  theme: Partial<ITheme>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Map<string, any>
  wireframeMode: boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(THREE: any, theme: Partial<ITheme> = {}) {
    this.THREE = THREE
    this.theme = theme
    this.cache = new Map()
    this.wireframeMode = false
  }

  setTheme(theme: Partial<ITheme>): void {
    this.theme = theme
    this.cache.clear()
  }

  setWireframeMode(enabled: boolean): void {
    this.wireframeMode = enabled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cache.forEach((material: any) => {
      material.wireframe = enabled
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createBodyMaterial(deviceType: string, color: any): any {
    const key = `body_${deviceType}_${color}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.65,
      wireframe: this.wireframeMode
    })

    this.cache.set(key, material)
    return material
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFaceMaterial(deviceType: string, color: any, isSelected = false): any {
    const key = `face_${deviceType}_${color}_${isSelected}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.75,
      wireframe: this.wireframeMode
    })

    this.cache.set(key, material)
    return material
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createPanelMaterial(deviceType: string, panelColor: any, emissiveColor: number, isSelected = false): any {
    const key = `panel_${deviceType}_${panelColor}_${isSelected}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color: panelColor,
      roughness: 0.18,
      metalness: 0.25,
      wireframe: this.wireframeMode,
      emissive: new this.THREE.Color(emissiveColor),
      emissiveIntensity: isSelected ? 1.0 : 0.55
    })

    this.cache.set(key, material)
    return material
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFrameMaterial(color: number): any {
    const key = `frame_${color}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.85,
      wireframe: this.wireframeMode
    })

    this.cache.set(key, material)
    return material
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createStripMaterial(color: number): any {
    const key = `strip_${color}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color: new this.THREE.Color(color),
      roughness: 0.1,
      emissive: new this.THREE.Color(color),
      emissiveIntensity: 1.2
    })

    this.cache.set(key, material)
    return material
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLedMaterial(color: number): any {
    const key = `led_${color}`
    if (this.cache.has(key)) return this.cache.get(key)

    const material = new this.THREE.MeshStandardMaterial({
      color,
      emissive: new this.THREE.Color(color),
      emissiveIntensity: 3
    })

    this.cache.set(key, material)
    return material
  }

  dispose(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cache.forEach((material: any) => {
      if (material.map) material.map.dispose()
      material.dispose()
    })
    this.cache.clear()
  }
}
