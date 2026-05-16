import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { CameraSystem } from '../../services/CameraSystem.js';

const THREE = {
  Vector3: class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x; this.y = y; this.z = z;
    }
    clone() { return new THREE.Vector3(this.x, this.y, this.z); }
  },
  Euler: class Euler {
    constructor(x, y, z, order) { this.x = x; this.y = y; this.z = z; this.order = order; }
  }
};

class MockCamera {
  constructor() { this.position = new THREE.Vector3(); }
}

describe('CameraSystem', () => {
  let cameraSystem;

  beforeEach(() => {
    cameraSystem = new CameraSystem(new MockCamera(), THREE);
  });

  test('should initialize with no current camera', () => {
    expect(cameraSystem.getCurrentMode()).toBeNull();
  });

  test('should register and switch cameras', () => {
    const mockCameraInstance = { update: jest.fn(), mode: 'test' };
    cameraSystem.registerCamera('test', mockCameraInstance);
    cameraSystem.switchTo('test');
    expect(cameraSystem.getCurrentMode()).toBe('test');
  });

  test('should track key presses on keydown', () => {
    cameraSystem.handleInput({ type: 'keydown', key: 'w' });
    expect(cameraSystem.keysPressed['w']).toBe(true);
  });

  test('should track key releases on keyup', () => {
    cameraSystem.handleInput({ type: 'keydown', key: 'w' });
    cameraSystem.handleInput({ type: 'keyup', key: 'w' });
    expect(cameraSystem.keysPressed['w']).toBe(false);
  });

  test('should set room bounds', () => {
    const bounds = { width: 80, height: 24, depth: 80, sceneCZ: 2 };
    cameraSystem.setRoomBounds(bounds);
    expect(cameraSystem.roomBounds).toEqual(bounds);
  });

  test('should delegate non-key input to current camera', () => {
    const mockCameraInstance = { handleInput: jest.fn(), mode: 'test' };
    cameraSystem.registerCamera('test', mockCameraInstance);
    cameraSystem.switchTo('test');
    const input = { type: 'mousemove', dx: 10, dy: 5 };
    cameraSystem.handleInput(input);
    expect(mockCameraInstance.handleInput).toHaveBeenCalledWith(input);
  });

  test('should return null camera before any registration', () => {
    expect(cameraSystem.getCamera()).toBeNull();
  });

  test('should return current camera after switch', () => {
    const mockCameraInstance = { update: jest.fn(), mode: 'test' };
    cameraSystem.registerCamera('test', mockCameraInstance);
    cameraSystem.switchTo('test');
    expect(cameraSystem.getCamera()).toBe(mockCameraInstance);
  });
});
