// ── BASE CAMERA ── Abstract camera interface

export class BaseCamera {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.options = options;
    this.mode = 'base';
  }

  update(deltaTime) {
    throw new Error('update() must be implemented');
  }

  handleInput(input) {
    throw new Error('handleInput() must be implemented');
  }

  getPosition() {
    return this.camera.position.clone();
  }

  setPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  lookAt(target) {
    this.camera.lookAt(target);
  }

  getDirection() {
    const direction = new this.camera.constructor.THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return direction;
  }
}
