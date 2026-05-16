// ── THREE.JS MOCK ── Mock Three.js objects for testing

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  copy(other) {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
    return this;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
  }

  addScaledVector(other, scale) {
    this.x += other.x * scale;
    this.y += other.y * scale;
    this.z += other.z * scale;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }
}

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}

export class Color {
  constructor(hex = 0x000000) {
    this.hex = hex;
  }

  lerp(other, t) {
    return new Color(this.hex);
  }

  getHex() {
    return this.hex;
  }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }
}

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  setFromEuler(euler) {
    return this;
  }
}

export class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
  }
}

export class Object3D {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.children = [];
  }

  updateMatrix() {
    // Mock update
  }

  add(obj) {
    this.children.push(obj);
    return this;
  }

  remove(obj) {
    const idx = this.children.indexOf(obj);
    if (idx > -1) this.children.splice(idx, 1);
    return this;
  }

  traverse(callback) {
    callback(this);
    this.children.forEach(child => child.traverse?.(callback));
  }
}

export class Group extends Object3D {
  constructor() {
    super();
    this.userData = {};
  }
}

export class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
    this.userData = {};
    this.castShadow = false;
    this.receiveShadow = false;
  }
}

export class BoxGeometry {
  constructor(w, h, d) {
    this.width = w;
    this.height = h;
    this.depth = d;
  }

  dispose() {}
}

export class PlaneGeometry {
  constructor(w, h) {
    this.width = w;
    this.height = h;
  }

  dispose() {}
}

export class CylinderGeometry {
  constructor(r1, r2, h, segs) {
    this.radiusTop = r1;
    this.radiusBottom = r2;
    this.height = h;
  }

  dispose() {}
}

export class SphereGeometry {
  constructor(r, w, h) {
    this.radius = r;
  }

  dispose() {}
}

export class BufferGeometry {
  setFromPoints(points) {
    this.points = points;
    return this;
  }

  dispose() {}
}

export class Material {
  dispose() {}
}

export class MeshStandardMaterial extends Material {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
    this.wireframe = props.wireframe || false;
  }
}

export class MeshBasicMaterial extends Material {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
  }
}

export class LineBasicMaterial extends Material {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
  }
}

export class Line extends Object3D {
  constructor(geometry, material) {
    super();
    this.geometry = geometry;
    this.material = material;
  }
}

export class CanvasTexture {
  constructor(canvas) {
    this.image = canvas;
    this.needsUpdate = false;
  }

  dispose() {}
}

export class TextureLoader {
  load(url, onLoad, onProgress, onError) {
    return new CanvasTexture(null);
  }
}

export class Raycaster {
  constructor() {
    this.ray = { direction: new Vector3() };
  }

  setFromCamera(coords, camera) {}

  intersectObjects(objects, recursive) {
    return [];
  }
}

export class Scene extends Group {
  constructor() {
    super();
  }

  add(obj) {
    this.children.push(obj);
    return this;
  }
}

export class PerspectiveCamera extends Object3D {
  constructor(fov, aspect, near, far) {
    super();
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.quaternion = new Quaternion();
  }

  getWorldDirection(target) {
    return target;
  }

  lookAt(target) {}
}

export class WebGLRenderer {
  constructor(props = {}) {
    this.domElement = {
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    this.capabilities = {
      getMaxAnisotropy: () => 16
    };
  }

  render(scene, camera) {}

  setSize(w, h) {}

  setPixelRatio(ratio) {}

  dispose() {}
}

export class InstancedMesh extends Mesh {
  constructor(geometry, material, count) {
    super(geometry, material);
    this.count = count;
    this.instanceMatrix = { needsUpdate: false };
  }

  setMatrixAt(index, matrix) {}
}

export class Light {
  constructor(color, intensity) {
    this.color = new Color(color);
    this.intensity = intensity;
    this.castShadow = false;
    this.shadow = { mapSize: { set: () => {} } };
  }
}

export class AmbientLight extends Light {}

export class DirectionalLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.position = new Vector3();
    this.shadow = {
      mapSize: { set: () => {} },
      camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 },
      bias: 0
    };
  }
}

export class PointLight extends Light {
  constructor(color, intensity, distance) {
    super(color, intensity);
    this.position = new Vector3();
    this.distance = distance;
  }
}

// Constants
export const DoubleSide = 2;
export const FrontSide = 0;
export const BackSide = 1;
