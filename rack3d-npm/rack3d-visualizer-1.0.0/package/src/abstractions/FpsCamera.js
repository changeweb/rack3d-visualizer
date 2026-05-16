// ── FPS CAMERA ── First-person shooter style camera

import { BaseCamera } from './BaseCamera.js';

export class FpsCamera extends BaseCamera {
  constructor(camera, options = {}) {
    super(camera, options);
    this.mode = 'fps';
    this.yaw = options.azimuth || Math.PI;
    this.pitch = options.elevation || 0.15;
    this.pointerLocked = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.dxSmooth = 0;
    this.dySmooth = 0;
  }

  update(deltaTime, keysPressed, roomBounds) {
    const speed = (this.options.fpsSpeed || 0.12) * deltaTime;
    let pos = this.camera.position.clone();

    // WASD movement
    const forward = new this.options.THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw)
    );
    const right = new this.options.THREE.Vector3(
      Math.sin(this.yaw + Math.PI / 2),
      0,
      Math.cos(this.yaw + Math.PI / 2)
    );

    if (keysPressed['w'] || keysPressed['W']) pos.addScaledVector(forward, speed);
    if (keysPressed['s'] || keysPressed['S']) pos.addScaledVector(forward, -speed);
    if (keysPressed['d'] || keysPressed['D']) pos.addScaledVector(right, speed);
    if (keysPressed['a'] || keysPressed['A']) pos.addScaledVector(right, -speed);
    if (keysPressed['q'] || keysPressed['Q']) pos.y -= speed;
    if (keysPressed['e'] || keysPressed['E']) pos.y += speed;

    // Apply room bounds
    const sceneZ = roomBounds.sceneCZ || 2;
    const margin = 1.0;
    pos.x = Math.max(-roomBounds.width / 2 + margin, Math.min(roomBounds.width / 2 - margin, pos.x));
    pos.y = Math.max(1.0, Math.min(roomBounds.height - 1.5, pos.y));
    pos.z = Math.max(sceneZ - roomBounds.depth / 2 + margin, Math.min(sceneZ + roomBounds.depth / 2 - margin, pos.z));

    this.camera.position.copy(pos);

    // Apply mouse look with smoothing
    this.dxSmooth += (this.mouseX - this.dxSmooth) * 0.2;
    this.dySmooth += (this.mouseY - this.dySmooth) * 0.2;

    this.yaw += this.dxSmooth * 0.003;
    this.pitch -= this.dySmooth * 0.003;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

    const cx = Math.cos(this.pitch);
    this.camera.quaternion.setFromEuler(
      new this.options.THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    );

    this.mouseX = 0;
    this.mouseY = 0;
  }

  handleInput(input) {
    if (input.type === 'mousemove') {
      this.mouseX += input.dx || 0;
      this.mouseY += input.dy || 0;
    }
  }

  lockPointer(element) {
    this.pointerLocked = true;
    element.requestPointerLock?.();
  }

  unlockPointer() {
    this.pointerLocked = false;
    document.exitPointerLock?.();
  }

  setYaw(value) {
    this.yaw = value;
  }

  setElevation(value) {
    this.pitch = value;
  }
}
