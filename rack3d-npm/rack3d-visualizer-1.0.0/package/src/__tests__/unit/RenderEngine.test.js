// ── RENDER ENGINE TESTS ── Unit tests for render engine

import { RenderEngine } from '../services/RenderEngine.js';

const mockRenderer = {
  render: jest.fn()
};

const mockScene = {};
const mockCamera = {};

describe('RenderEngine', () => {
  let renderEngine;

  beforeEach(() => {
    jest.useFakeTimers();
    renderEngine = new RenderEngine(mockRenderer, mockScene, mockCamera);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should initialize with dirty flag', () => {
    expect(renderEngine.isDirty()).toBe(true);
  });

  test('should initialize with idle mode disabled', () => {
    expect(renderEngine.isIdleMode()).toBe(false);
  });

  test('should register frame callbacks', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    renderEngine.onFrame(callback1);
    renderEngine.onFrame(callback2);

    expect(renderEngine.frameCallbacks.length).toBe(2);
  });

  test('should mark dirty when setDirty() called', () => {
    renderEngine.dirty = false;
    renderEngine.setDirty();

    expect(renderEngine.isDirty()).toBe(true);
    expect(renderEngine.isIdleMode()).toBe(false);
  });

  test('should transition to idle mode after inactivity', () => {
    renderEngine.setDirty();
    expect(renderEngine.isIdleMode()).toBe(false);

    // Advance time beyond idle threshold
    renderEngine.idleTimer = 4000;

    expect(renderEngine.isIdleMode()).toBe(true);
  });

  test('should reset idle timer when set dirty', () => {
    renderEngine.idleTimer = 5000;
    renderEngine.setDirty();

    expect(renderEngine.idleTimer).toBe(0);
  });

  test('should execute frame callbacks', (done) => {
    const callback = jest.fn();
    renderEngine.onFrame(callback);
    renderEngine.start();

    setTimeout(() => {
      renderEngine.stop();
      expect(callback).toHaveBeenCalled();
      done();
    }, 50);
  });

  test('should respect active frame rate', () => {
    renderEngine.MS_ACTIVE = 50;
    renderEngine.onFrame(jest.fn());
    renderEngine.start();

    jest.advanceTimersByTime(100);
    renderEngine.stop();

    // Render should be called approximately 2 times in 100ms at 50ms intervals
    expect(mockRenderer.render).toHaveBeenCalled();
  });
});
