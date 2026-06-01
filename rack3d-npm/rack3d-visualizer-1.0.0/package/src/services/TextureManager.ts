export class TextureManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THREE: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Map<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendingLoads: Map<string, Promise<any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderer?: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(THREE: any) {
    this.THREE = THREE
    this.loader = new THREE.TextureLoader()
    this.cache = new Map()
    this.pendingLoads = new Map()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async load(url: string): Promise<any> {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    if (this.pendingLoads.has(url)) {
      return this.pendingLoads.get(url)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadPromise = new Promise<any>((resolve, reject) => {
      this.loader.load(
        url,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (texture: any) => {
          texture.encoding = 3001
          texture.anisotropy = Math.min(4, this.renderer?.capabilities?.getMaxAnisotropy?.() ?? 1)
          this.cache.set(url, texture)
          this.pendingLoads.delete(url)
          resolve(texture)
        },
        undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any) => {
          console.warn('[Rack3D] Could not load texture:', url, err)
          this.pendingLoads.delete(url)
          reject(err)
        }
      )
    })

    this.pendingLoads.set(url, loadPromise)
    return loadPromise
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(url: string): any {
    return this.cache.get(url)
  }

  dispose(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cache.forEach((texture: any) => texture.dispose())
    this.cache.clear()
    this.pendingLoads.clear()
  }
}
