// ── MATERIAL FACTORY TESTS ── Unit tests for material creation

import { MaterialFactory } from '../services/MaterialFactory.js';

// Mock THREE
const THREE = {
  Color: class Color {
    constructor(hex) {
      this.hex = hex;
    }
  },
  MeshStandardMaterial: class MeshStandardMaterial {
    constructor(props) {
      Object.assign(this, props);
    }
    dispose() {}
  }
};

describe('MaterialFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new MaterialFactory(THREE, {});
  });

  test('should create and cache materials', () => {
    const mat1 = factory.createBodyMaterial('server', 0xff0000);
    const mat2 = factory.createBodyMaterial('server', 0xff0000);

    expect(mat1).toBe(mat2);
  });

  test('should create different materials for different types', () => {
    const mat1 = factory.createBodyMaterial('server', 0xff0000);
    const mat2 = factory.createBodyMaterial('router', 0xff0000);

    expect(mat1).not.toBe(mat2);
  });

  test('should set wireframe mode on all materials', () => {
    const mat1 = factory.createBodyMaterial('server', 0xff0000);
    const mat2 = factory.createFaceMaterial('router', 0x00ff00);

    factory.setWireframeMode(true);

    expect(mat1.wireframe).toBe(true);
    expect(mat2.wireframe).toBe(true);
  });

  test('should clear cache when theme changes', () => {
    const mat1 = factory.createBodyMaterial('server', 0xff0000);
    factory.setTheme({});
    const mat2 = factory.createBodyMaterial('server', 0xff0000);

    expect(mat1).not.toBe(mat2);
  });

  test('should create panel materials with emissive properties', () => {
    const mat = factory.createPanelMaterial('server', 0xff0000, 0x0000ff, false);

    expect(mat.emissiveIntensity).toBe(0.55);
  });

  test('should create panel materials with higher emissive when selected', () => {
    const mat = factory.createPanelMaterial('server', 0xff0000, 0x0000ff, true);

    expect(mat.emissiveIntensity).toBe(1.0);
  });

  test('should dispose all materials', () => {
    const disposeSpies = [];
    factory.THREE.MeshStandardMaterial = class {
      constructor(props) {
        Object.assign(this, props);
      }
      dispose() {
        disposeSpies.push(this);
      }
    };

    factory.createBodyMaterial('server', 0xff0000);
    factory.createFaceMaterial('router', 0x00ff00);

    factory.dispose();

    expect(factory.cache.size).toBe(0);
  });
});
