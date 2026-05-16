// ── ORBIT CAMERA ── Orbit-style camera (mouse drag to rotate)

import { BaseCamera } from './BaseCamera.js';

export class OrbitCamera extends BaseCamera {
  constructor(camera, options = {}) {
    super(camera, options);
    this.mode = 'orbit';
    this.azimuth = options.azimuth || Math.PI;
    this.elevation = options.elevation || 0.15;
    this.distance = options.distance || 22;
    this.target = new options.THREE.Vector3(0, 10, 2);
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
  }

  update(deltaTime) {
    const cos_el = Math.cos(this.elevation);
    this.camera.position.set(
      this.target.x + this.distance * cos_el * Math.sin(this.azimuth),
      this.target.y + this.distance * Math.sin(this.elevation),
      this.target.z + this.distance * cos_el * Math.cos(this.azimuth)
    );
    this.camera.lookAt(this.target);
  }

  handleInput(input) {
    if (input.type === 'mousedown') {
      this.isDragging = true;
      this.lastMouseX = input.x;
      this.lastMouseY = input.y;
    } else if (input.type === 'mouseup') {
      this.isDragging = false;
    } else if (input.type === 'mousemove' && this.isDragging) {
      const dx = input.x - this.lastMouseX;
      const dy = input.y - this.lastMouseY;
      this.azimuth -= dx * 0.005;
      this.elevation += dy * 0.005;
      this.elevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.elevation));
      this.lastMouseX = input.x;
      this.lastMouseY = input.y;
    } else if (input.type === 'wheel') {
      this.distance += input.deltaY * 0.01;
      this.distance = Math.max(5, Math.min(100, this.distance));
    }
  }

  setTarget(x, y, z) {
    this.target.set(x, y, z);
  }

  setDistance(distance) {
    this.distance = Math.max(5, Math.min(100, distance));
  }

  setAzimuth(angle) {
    this.azimuth = angle;
  }

  setElevation(angle) {
    this.elevation = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle));
  }
}
