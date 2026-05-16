// ── RENDER ENGINE ── Manages animation loop, timing, and dirty state

export class RenderEngine {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.running = false;
    this.dirty = true;
    this.frameCallbacks = [];
    this.MS_ACTIVE = 1000 / 20; // 20fps
    this.MS_IDLE = 800;
    this.lastFrameTime = 0;
    this.idleTimer = 0;
    this.isIdle = false;
  }

  onFrame(callback) {
    this.frameCallbacks.push(callback);
  }

  setDirty() {
    this.dirty = true;
    this.idleTimer = 0;
    this.isIdle = false;
  }

  isDirty() {
    return this.dirty;
  }

  isIdleMode() {
    return this.isIdle;
  }

  start() {
    this.running = true;
    this.animate();
  }

  stop() {
    this.running = false;
  }

  animate = () => {
    if (!this.running) return;
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    const targetDelta = this.isIdle ? this.MS_IDLE : this.MS_ACTIVE;

    if (now - this.lastFrameTime < targetDelta && !this.dirty) {
      return;
    }

    this.lastFrameTime = now;

    // Check if should idle
    this.idleTimer += deltaTime * 1000;
    if (!this.dirty && this.idleTimer > 3000) {
      this.isIdle = true;
    } else if (this.dirty) {
      this.isIdle = false;
    }

    // Execute frame callbacks
    this.frameCallbacks.forEach(cb => cb(deltaTime));

    // Render
    this.renderer.render(this.scene, this.camera);

    // Clear dirty flag after frame
    this.dirty = false;
  };
}
