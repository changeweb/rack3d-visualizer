// ── FULL INTEGRATION TEST ── Tests complete refactored workflow

import { CameraSystem } from '../../services/CameraSystem.js';
import { SelectionManager } from '../../services/SelectionManager.js';
import { MaterialFactory } from '../../services/MaterialFactory.js';
import { RenderEngine } from '../../services/RenderEngine.js';
import { FpsCamera } from '../../abstractions/FpsCamera.js';
import { OrbitCamera } from '../../abstractions/OrbitCamera.js';

const THREE = {
  Vector3: class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    clone() {
      return new THREE.Vector3(this.x, this.y, this.z);
    }
  },
  Color: class Color {
    constructor(hex) {
      this.hex = hex;
    }
  },
  MeshStandardMaterial: class {
    constructor(props) {
      Object.assign(this, props);
    }
    dispose() {}
  },
  Raycaster: class {
    setFromCamera() {}
    intersectObjects() {
      return [];
    }
  },
  Vector2: class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  },
  Euler: class Euler {
    constructor(x, y, z, order) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.order = order;
    }
  },
  Quaternion: class {
    setFromEuler() {
      return this;
    }
  }
};

const mockScene = { children: [] };
let mockRenderer;
let mockCamera;

beforeEach(() => {
  mockRenderer = { render: jest.fn() };
  mockCamera = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion()
  };
});

describe('Full Integration: OOP Refactored Architecture', () => {
  test('should initialize all services', () => {
    const cameraSystem = new CameraSystem(mockCamera, THREE);
    const selectionManager = new SelectionManager(mockScene, mockCamera, THREE);
    const materialFactory = new MaterialFactory(THREE);
    const renderEngine = new RenderEngine(mockRenderer, mockScene, mockCamera);

    expect(cameraSystem).toBeDefined();
    expect(selectionManager).toBeDefined();
    expect(materialFactory).toBeDefined();
    expect(renderEngine).toBeDefined();
  });

  test('should register and switch between camera modes', () => {
    const cameraSystem = new CameraSystem(mockCamera, THREE);
    const fpsCamera = new FpsCamera(mockCamera, { THREE, fpsSpeed: 0.12 });
    const orbitCamera = new OrbitCamera(mockCamera, { THREE });

    cameraSystem.registerCamera('fps', fpsCamera);
    cameraSystem.registerCamera('orbit', orbitCamera);

    expect(cameraSystem.cameras.size).toBe(2);

    cameraSystem.switchTo('fps');
    expect(cameraSystem.getCurrentMode()).toBe('fps');

    cameraSystem.switchTo('orbit');
    expect(cameraSystem.getCurrentMode()).toBe('orbit');
  });

  test('should handle keyboard input across camera modes', () => {
    const cameraSystem = new CameraSystem(mockCamera, THREE);
    const fpsCamera = new FpsCamera(mockCamera, { THREE });

    cameraSystem.registerCamera('fps', fpsCamera);
    cameraSystem.switchTo('fps');

    cameraSystem.handleInput({ type: 'keydown', key: 'w' });
    cameraSystem.handleInput({ type: 'keydown', key: 'a' });

    expect(cameraSystem.keysPressed['w']).toBe(true);
    expect(cameraSystem.keysPressed['a']).toBe(true);
  });

  test('should apply room bounds to camera movement', () => {
    const cameraSystem = new CameraSystem(mockCamera, THREE);
    const bounds = { width: 80, depth: 80, height: 24, sceneCZ: 2 };

    cameraSystem.setRoomBounds(bounds);
    expect(cameraSystem.roomBounds).toEqual(bounds);
  });

  test('should manage selection state and notify observers', () => {
    const selectionManager = new SelectionManager(mockScene, mockCamera, THREE);
    const observer1 = jest.fn();
    const observer2 = jest.fn();

    selectionManager.subscribe(observer1);
    selectionManager.subscribe(observer2);

    selectionManager.selectDevice('device-1', 'rack-1');

    expect(observer1).toHaveBeenCalledWith({
      type: 'deviceSelected',
      deviceId: 'device-1',
      rackId: 'rack-1'
    });

    expect(observer2).toHaveBeenCalledWith({
      type: 'deviceSelected',
      deviceId: 'device-1',
      rackId: 'rack-1'
    });
  });

  test('should create and cache materials', () => {
    const materialFactory = new MaterialFactory(THREE);

    const mat1 = materialFactory.createBodyMaterial('server', 0xff0000);
    const mat2 = materialFactory.createBodyMaterial('server', 0xff0000);

    expect(mat1).toBe(mat2);

    const mat3 = materialFactory.createPanelMaterial('server', 0x00ff00, 0x0000ff, false);
    const mat4 = materialFactory.createPanelMaterial('server', 0x00ff00, 0x0000ff, false);

    expect(mat3).toBe(mat4);
  });

  test('should apply theme across all materials', () => {
    const materialFactory = new MaterialFactory(THREE);

    const mat1 = materialFactory.createBodyMaterial('server', 0xff0000);
    materialFactory.setTheme({ primaryColor: 0xffff00 });
    const mat2 = materialFactory.createBodyMaterial('server', 0xff0000);

    expect(mat1).not.toBe(mat2);
  });

  test('should toggle wireframe mode on all cached materials', () => {
    const materialFactory = new MaterialFactory(THREE);

    const mat1 = materialFactory.createBodyMaterial('server', 0xff0000);
    const mat2 = materialFactory.createFaceMaterial('router', 0x00ff00);

    expect(mat1.wireframe).toBe(false);
    expect(mat2.wireframe).toBe(false);

    materialFactory.setWireframeMode(true);

    expect(mat1.wireframe).toBe(true);
    expect(mat2.wireframe).toBe(true);
  });

  test('should register render frame callbacks', () => {
    const renderEngine = new RenderEngine(mockRenderer, mockScene, mockCamera);
    const callback = jest.fn();

    renderEngine.onFrame(callback);

    expect(renderEngine.frameCallbacks.length).toBe(1);
  });

  test('should detect idle mode transitions', () => {
    const renderEngine = new RenderEngine(mockRenderer, mockScene, mockCamera);

    expect(renderEngine.isIdleMode()).toBe(false);
    renderEngine.dirty = false;
    renderEngine.idleTimer = 4000;

    expect(renderEngine.isIdleMode()).toBe(true);
  });

  test('should support unsubscribing observers', () => {
    const selectionManager = new SelectionManager(mockScene, mockCamera, THREE);
    const observer = jest.fn();

    selectionManager.subscribe(observer);
    selectionManager.unsubscribe(observer);
    selectionManager.selectDevice('dev1', 'rack1');

    expect(observer).not.toHaveBeenCalled();
  });

  test('should handle multiple independent services', () => {
    const cameraSystem = new CameraSystem(mockCamera, THREE);
    const selectionManager = new SelectionManager(mockScene, mockCamera, THREE);
    const materialFactory = new MaterialFactory(THREE);
    const renderEngine = new RenderEngine(mockRenderer, mockScene, mockCamera);

    const fpsCam = new FpsCamera(mockCamera, { THREE });
    cameraSystem.registerCamera('fps', fpsCam);
    cameraSystem.switchTo('fps');

    selectionManager.selectDevice('dev1', 'rack1');
    materialFactory.setWireframeMode(true);
    renderEngine.setDirty();

    expect(cameraSystem.getCurrentMode()).toBe('fps');
    expect(selectionManager.getSelectedDevice()).toBe('dev1');
    expect(renderEngine.isDirty()).toBe(true);
  });
});
