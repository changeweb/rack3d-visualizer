// ── MATERIAL FACTORY ── Creates and caches materials by device type

export class MaterialFactory {
  constructor(THREE, theme = {}) {
    this.THREE = THREE;
    this.theme = theme;
    this.cache = new Map();
    this.wireframeMode = false;
  }

  setTheme(theme) {
    this.theme = theme;
    this.cache.clear();
  }

  setWireframeMode(enabled) {
    this.wireframeMode = enabled;
    // Update all cached materials
    this.cache.forEach(material => {
      material.wireframe = enabled;
    });
  }

  createBodyMaterial(deviceType, color) {
    const key = `body_${deviceType}_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.65,
      wireframe: this.wireframeMode
    });

    this.cache.set(key, material);
    return material;
  }

  createFaceMaterial(deviceType, color, isSelected = false) {
    const key = `face_${deviceType}_${color}_${isSelected}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.75,
      wireframe: this.wireframeMode
    });

    this.cache.set(key, material);
    return material;
  }

  createPanelMaterial(deviceType, panelColor, emissiveColor, isSelected = false) {
    const key = `panel_${deviceType}_${panelColor}_${isSelected}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color: panelColor,
      roughness: 0.18,
      metalness: 0.25,
      wireframe: this.wireframeMode,
      emissive: new this.THREE.Color(emissiveColor),
      emissiveIntensity: isSelected ? 1.0 : 0.55
    });

    this.cache.set(key, material);
    return material;
  }

  createFrameMaterial(color) {
    const key = `frame_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.85,
      wireframe: this.wireframeMode
    });

    this.cache.set(key, material);
    return material;
  }

  createStripMaterial(color) {
    const key = `strip_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color: new this.THREE.Color(color),
      roughness: 0.1,
      emissive: new this.THREE.Color(color),
      emissiveIntensity: 1.2
    });

    this.cache.set(key, material);
    return material;
  }

  createLedMaterial(color) {
    const key = `led_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const material = new this.THREE.MeshStandardMaterial({
      color,
      emissive: new this.THREE.Color(color),
      emissiveIntensity: 3
    });

    this.cache.set(key, material);
    return material;
  }

  dispose() {
    this.cache.forEach(material => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
    this.cache.clear();
  }
}
