// ── TEXTURE MANAGER ── Async texture loading with caching

export class TextureManager {
  constructor(THREE) {
    this.THREE = THREE;
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();
    this.pendingLoads = new Map();
  }

  async load(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.pendingLoads.has(url)) {
      return this.pendingLoads.get(url);
    }

    const loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          texture.encoding = 3001;
          texture.anisotropy = Math.min(4, this.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
          this.cache.set(url, texture);
          this.pendingLoads.delete(url);
          resolve(texture);
        },
        undefined,
        (err) => {
          console.warn('[Rack3D] Could not load texture:', url, err);
          this.pendingLoads.delete(url);
          reject(err);
        }
      );
    });

    this.pendingLoads.set(url, loadPromise);
    return loadPromise;
  }

  get(url) {
    return this.cache.get(url);
  }

  dispose() {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
    this.pendingLoads.clear();
  }
}
