// ── CAMERA SYSTEM ── Manages camera modes and switching

export class CameraSystem {
  constructor(camera, THREE, options = {}) {
    this.camera = camera;
    this.THREE = THREE;
    this.options = options;
    this.cameras = new Map();
    this.currentCamera = null;
    this.currentMode = null;
    this.keysPressed = {};
    this.roomBounds = {};
  }

  registerCamera(name, cameraInstance) {
    this.cameras.set(name, cameraInstance);
  }

  switchTo(mode) {
    if (this.currentCamera?.unlockPointer) {
      this.currentCamera.unlockPointer();
    }
    this.currentCamera = this.cameras.get(mode);
    this.currentMode = mode;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  update(deltaTime) {
    if (this.currentCamera && this.currentCamera.update) {
      this.currentCamera.update(deltaTime, this.keysPressed, this.roomBounds);
    }
  }

  handleInput(input) {
    if (input.type === 'keydown') {
      this.keysPressed[input.key] = true;
    } else if (input.type === 'keyup') {
      this.keysPressed[input.key] = false;
    } else if (this.currentCamera && this.currentCamera.handleInput) {
      this.currentCamera.handleInput(input);
    }
  }

  setRoomBounds(bounds) {
    this.roomBounds = bounds;
  }

  getCamera() {
    return this.currentCamera;
  }

  lockPointer(element) {
    if (this.currentCamera?.lockPointer) {
      this.currentCamera.lockPointer(element);
    }
  }

  unlockPointer() {
    if (this.currentCamera?.unlockPointer) {
      this.currentCamera.unlockPointer();
    }
  }
}
