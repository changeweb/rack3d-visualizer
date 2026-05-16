import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { SelectionManager } from '../../services/SelectionManager.js';

const THREE = {
  Raycaster: class Raycaster {
    setFromCamera() {}
    intersectObjects() { return []; }
  },
  Vector2: class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  }
};

const mockScene = { children: [] };
const mockCamera = {};

describe('SelectionManager', () => {
  let selectionManager;
  let observer;

  beforeEach(() => {
    selectionManager = new SelectionManager(mockScene, mockCamera, THREE);
    observer = jest.fn();
  });

  test('should subscribe and notify observers on device select', () => {
    selectionManager.subscribe(observer);
    selectionManager.selectDevice('dev1', 'rack1');
    expect(observer).toHaveBeenCalledWith({ type: 'deviceSelected', deviceId: 'dev1', rackId: 'rack1' });
  });

  test('should unsubscribe observers', () => {
    selectionManager.subscribe(observer);
    selectionManager.unsubscribe(observer);
    selectionManager.selectDevice('dev1', 'rack1');
    expect(observer).not.toHaveBeenCalled();
  });

  test('should store selected device and rack after selectDevice', () => {
    selectionManager.selectDevice('dev1', 'rack1');
    expect(selectionManager.getSelectedDevice()).toBe('dev1');
    expect(selectionManager.getSelectedRack()).toBe('rack1');
  });

  test('should store selected rack after selectRack', () => {
    selectionManager.selectRack('rack1');
    expect(selectionManager.getSelectedRack()).toBe('rack1');
  });

  test('should clear all selection state', () => {
    selectionManager.selectDevice('dev1', 'rack1');
    selectionManager.clearSelection();
    expect(selectionManager.getSelectedDevice()).toBeNull();
    expect(selectionManager.getSelectedRack()).toBeNull();
  });

  test('should notify observers with selectionCleared event', () => {
    selectionManager.subscribe(observer);
    selectionManager.clearSelection();
    expect(observer).toHaveBeenCalledWith({ type: 'selectionCleared' });
  });

  test('should notify observers with rackSelected event', () => {
    selectionManager.subscribe(observer);
    selectionManager.selectRack('rack1');
    expect(observer).toHaveBeenCalledWith({ type: 'rackSelected', rackId: 'rack1' });
  });

  test('should notify multiple observers', () => {
    const obs2 = jest.fn();
    selectionManager.subscribe(observer);
    selectionManager.subscribe(obs2);
    selectionManager.selectDevice('dev1', 'rack1');
    expect(observer).toHaveBeenCalledTimes(1);
    expect(obs2).toHaveBeenCalledTimes(1);
  });
});
