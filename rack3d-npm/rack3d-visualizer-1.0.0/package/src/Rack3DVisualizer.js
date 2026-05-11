// ─────────────────────────────────────────────────────────────
//  Rack3DVisualizer — main class
// ─────────────────────────────────────────────────────────────
import { DEFAULT_OPTIONS, mergeOptions } from './options.js';
import { resolveTheme } from './themes.js';
import { DEVICE_TYPES } from './constants.js';
import { buildCSS } from './css.js';
import { buildHTML } from './html.js';
import { buildLights, buildEnvironment } from './scene.js';
import { clearRack, mk, buildRack, makeUnitLabel, buildDevice } from './geometry.js';
import { createLabel, updateLabels } from './labels.js';
import { render2D, on2DDragStart, on2DDragEnd, on2DDrop, dropUnit, exportImage, dlBlob, gen2DCanvas, gen2DSVG } from './render2d.js';
import { renderCatalog, addCatalogItem, removeCatalogItem, openCatalogEdit } from './catalog.js';
import { refresh, buildUnitMap, buildLegend, openEdit, closeEdit, ed, addDev, rmDev, onRackName, onRackUnits, onRackProp, onRackWidth, renderCustomFieldsEditor, addCustomField, editField, removeField } from './sidebar.js';

let _instanceCount = 0;

export class Rack3DVisualizer {
  /**
   * Create a new Rack3D instance.
   * @param {string|HTMLElement} container - CSS selector or DOM element
   * @param {import('./options.js').Rack3DOptions} [userOptions={}]
   */
  constructor(container, userOptions = {}) {
    // ── Resolve container ──────────────────────────────────
    this._el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!this._el) throw new Error('[Rack3D] Container not found: ' + container);

    // ── Merge options + theme ──────────────────────────────
    this._opts   = mergeOptions(DEFAULT_OPTIONS, userOptions);
    this._theme  = resolveTheme(this._opts.theme);
    this._types  = { ...DEVICE_TYPES, ...this._opts.deviceTypes };
    this._id     = 'r3d-' + (++_instanceCount);

    // ── State ──────────────────────────────────────────────
    this._rack      = null;
    this._selId     = null;
    this._dragId    = null;
    this._dragCatId = null;
    this._selCatId  = null;
    this._showWire   = this._opts.view.wireframe;
    this._showLabels = this._opts.view.showLabels;
    this._mode   = this._opts.view.mode;

    // Three.js handles
    this._T3     = null;
    this._scene  = null;
    this._cam    = null;
    this._ren    = null;
    this._raf    = null;
    this._tick   = 0;
    this._ctrl   = {
      drag: false, lx: 0, ly: 0,
      az:   this._opts.camera.azimuth,
      el:   this._opts.camera.elevation,
      r:    this._opts.camera.distance === 'auto' ? 22 : this._opts.camera.distance,
    };
    this._devMeshes      = {};
    this._labelDivs      = {};
    this._labelPositions = {};

    // ── Inject styles ──────────────────────────────────────
    this._injectStyles();

    // ── Build DOM ──────────────────────────────────────────
    this._el.id = this._id;
    this._el.innerHTML = this._buildHTML();
    this._bindSidebarEvents();

    // ── Load Three.js then boot ───────────────────────────
    this._loadThree(() => {
      if (this._mode === '2d') {
        this._boot2D();
      } else {
        this._bootThree();
      }
      if (this._opts.onReady) this._opts.onReady(this);
    });
  }

  // ─────────────────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────────────────

  /** Load rack data from a plain JS object */
  setData(rackData) {
    if (!rackData || typeof rackData !== 'object') {
      console.warn('[Rack3D] setData() called with invalid data:', rackData);
      return this;
    }
    try {
      this._rack = JSON.parse(JSON.stringify(rackData));
    } catch (e) {
      console.error('[Rack3D] setData() failed to clone data:', e);
      return this;
    }
    if (!Array.isArray(this._rack.catalog)) {
      this._rack.catalog = [
        { id: 'cat-sv1',  name: 'Server 1U',      type: 'server',   heightUnits: 1, watts: 300 },
        { id: 'cat-sv2',  name: 'Server 2U',      type: 'server',   heightUnits: 2, watts: 620 },
        { id: 'cat-sw',   name: 'Switch 48p',     type: 'switch',   heightUnits: 1, watts: 180 },
        { id: 'cat-rt',   name: 'Router',          type: 'router',   heightUnits: 2, watts: 450 },
        { id: 'cat-fw',   name: 'Firewall',        type: 'firewall', heightUnits: 2, watts: 320 },
        { id: 'cat-st',   name: 'NAS Storage',     type: 'storage',  heightUnits: 3, watts: 290 },
        { id: 'cat-pdu',  name: 'PDU',             type: 'pdu',      heightUnits: 1, watts: 30  },
        { id: 'cat-pat',  name: 'Patch Panel',     type: 'patch',    heightUnits: 1, watts: 0   },
        { id: 'cat-ups',  name: 'UPS Unit',        type: 'ups',      heightUnits: 3, watts: 180 },
        { id: 'cat-kvm',  name: 'KVM Switch',      type: 'kvm',      heightUnits: 1, watts: 45  },
        { id: 'cat-lb',   name: 'Load Balancer',   type: 'loadbal',  heightUnits: 1, watts: 200 },
        { id: 'cat-sec',  name: 'IDS Sensor',      type: 'security', heightUnits: 1, watts: 95  },
      ];
    }
    this._selId = null;
    this._refresh();
    if (this._scene) this._buildRack();
    if (this._mode === '2d') this._render2D();
    return this;
  }

  /** Return current rack data as a plain object */
  getData() {
    if (!this._rack) return null;
    return JSON.parse(JSON.stringify(this._rack));
  }

  /** Apply a theme by name or object */
  setTheme(themeInput) {
    this._theme = resolveTheme(themeInput);
    this._injectStyles();
    this._refresh();
    if (this._scene) this._buildRack();
    return this;
  }

  /** Update any options at runtime */
  setOptions(partialOpts) {
    this._opts = mergeOptions(this._opts, partialOpts);
    if (partialOpts.theme) this.setTheme(partialOpts.theme);
    if (partialOpts.view?.mode && partialOpts.view.mode !== this._mode) {
      this._mode = partialOpts.view.mode;
      if (this._mode === '2d') this._boot2D();
      else this._bootThree();
    }
    this._refresh();
    return this;
  }

  /** Switch between '3d' and '2d' render modes */
  setMode(mode) {
    this.setOptions({ view: { mode } });
    return this;
  }

  /** Toggle wireframe */
  setWireframe(enabled) {
    this._showWire = enabled;
    if (this._scene) this._buildRack();
    return this;
  }

  /** Toggle floating labels */
  setLabels(enabled) {
    this._showLabels = enabled;
    return this;
  }

  /** Point camera at a specific azimuth / elevation */
  setCameraAngle(azimuth, elevation, distance) {
    this._ctrl.az = azimuth  ?? this._ctrl.az;
    this._ctrl.el = elevation ?? this._ctrl.el;
    if (distance != null) this._ctrl.r = distance;
    this._posCamera();
    return this;
  }

  /** Reset camera to default front view */
  resetCamera() {
    const o = this._opts.camera;
    this._ctrl.az = o.azimuth;
    this._ctrl.el = o.elevation;
    this._ctrl.r  = o.distance === 'auto'
      ? Math.max(22, this._rackH() * 2.2)
      : o.distance;
    this._posCamera();
    return this;
  }

  /** Zoom camera in */
  zoomIn() {
    const o = this._opts.camera;
    this._ctrl.r = Math.max(o.minDistance, this._ctrl.r * 0.85);
    this._posCamera();
    return this;
  }

  /** Zoom camera out */
  zoomOut() {
    const o = this._opts.camera;
    this._ctrl.r = Math.min(o.maxDistance, this._ctrl.r * 1.18);
    this._posCamera();
    return this;
  }

  /** Reset rack to empty */
  resetRack() {
    if (!confirm('Reset rack? All devices will be removed.')) return;
    this._rack.devices = [];
    this._selId = null;
    this._closeEdit();
    this._buildRack();
    this._refresh();
  }

  /** Copy rack JSON to clipboard */
  copyJson() {
    const json = JSON.stringify({ rack: this._rack }, null, 2);
    navigator.clipboard?.writeText(json).then(() => {
      const b = document.getElementById(this._id + '-btnCopy');
      const orig = b?.textContent;
      if (b) { b.textContent = '✓ Copied!'; setTimeout(() => { if (b) b.textContent = orig; }, 1500); }
    }).catch(() => {
      const ta = document.getElementById(this._id + '-jta');
      if (ta) { ta.value = json; const jp = document.getElementById(this._id + '-jp'); if (jp) jp.style.display = 'flex'; }
    });
  }

  /** Destroy the instance and clean up */
  destroy() {
    cancelAnimationFrame(this._raf);
    if (this._ren) { this._ren.dispose(); this._ren = null; }
    const style = document.getElementById(this._id + '-styles');
    if (style) style.remove();
    this._el.innerHTML = '';
    window.removeEventListener('resize', this._onResize);
    return this;
  }

  // ─────────────────────────────────────────────────────────
  //  Style injection
  // ─────────────────────────────────────────────────────────
  _injectStyles() {
    let tag = document.getElementById(this._id + '-styles');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = this._id + '-styles';
      document.head.appendChild(tag);
    }
    tag.textContent = buildCSS(this._id, this._theme, this._opts);
  }

  // ─────────────────────────────────────────────────────────
  //  HTML scaffold — delegate to html.js
  // ─────────────────────────────────────────────────────────
  _buildHTML() { return buildHTML(this); }

  // ─────────────────────────────────────────────────────────
  //  Three.js loader + boot
  // ─────────────────────────────────────────────────────────
  _loadThree(cb) {
    if (this._T3) { cb(); return; }
    if (Rack3DVisualizer._THREE) { this._T3 = Rack3DVisualizer._THREE; cb(); return; }
    if (window.THREE) { this._T3 = window.THREE; cb(); return; }
    if (document.querySelector('script[data-rack3d-three]')) {
      const wait = () => { if (window.THREE) { this._T3 = window.THREE; cb(); } else setTimeout(wait, 50); };
      wait(); return;
    }
    const s = document.createElement('script');
    s.setAttribute('data-rack3d-three', '1');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => { this._T3 = window.THREE; cb(); };
    document.head.appendChild(s);
  }

  _bootThree() {
    const cv   = document.getElementById(this._id + '-cv3');
    const cont = document.getElementById(this._id + '-cvcont');
    if (!cv || !cont) return;
    const W = cont.clientWidth, H = cont.clientHeight;
    if (W < 1 || H < 1) { requestAnimationFrame(() => this._bootThree()); return; }

    const T = this._T3;
    this._ren = new T.WebGLRenderer({
      canvas:                  cv,
      antialias:               true,
      logarithmicDepthBuffer:  false,
      powerPreference:         'default',
    });
    this._ren.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this._ren.setSize(W, H);
    this._ren.shadowMap.enabled = this._opts.lighting.shadows;
    this._ren.shadowMap.type    = T.PCFSoftShadowMap;
    this._ren.setClearColor(this._theme.scene.clearColor, 1);
    this._ren.physicallyCorrectLights = true;
    this._ren.toneMapping = T.ACESFilmicToneMapping;
    this._ren.toneMappingExposure = this._opts.lighting.exposure ?? this._theme.scene.exposure;

    this._scene = new T.Scene();
    this._scene.fog = new T.Fog(
      this._theme.scene.fogColor,
      this._opts.room.fogNear,
      this._opts.room.fogFar
    );

    this._cam = new T.PerspectiveCamera(this._opts.camera.fov, W / H, 0.05, 200);
    this._posCamera();

    this._buildLights();
    if (this._opts.room.enabled) this._buildEnvironment();
    if (this._rack) this._buildRack();

    this._onResize = () => {
      const c = document.getElementById(this._id + '-cvcont');
      if (!c || !this._ren || !this._cam) return;
      const nw = c.clientWidth, nh = c.clientHeight;
      if (nw < 1 || nh < 1) return;
      this._ren.setSize(nw, nh);
      this._cam.aspect = nw / nh;
      this._cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
    this._bindCameraControls(cv);
    this._startLoop();
  }

  _boot2D() {
    const c2d  = document.getElementById(this._id + '-2dcont');
    const c3d  = document.getElementById(this._id + '-cvcont');
    if (c2d) c2d.style.display = 'flex';
    if (c3d) c3d.style.display = 'none';
    this._render2D();
  }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — scene.js
  // ─────────────────────────────────────────────────────────
  _buildLights()      { buildLights(this); }
  _buildEnvironment() { buildEnvironment(this); }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — geometry.js
  // ─────────────────────────────────────────────────────────
  _clearRack()        { clearRack(this); }
  _mk(g, m, t)        { return mk(this, g, m, t); }
  _buildRack()        { buildRack(this); }
  _makeUnitLabel(u, y, hw, hd, UH, POST) { return makeUnitLabel(this, u, y, hw, hd, UH, POST); }
  _buildDevice(dev, idx) { buildDevice(this, dev, idx); }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — labels.js
  // ─────────────────────────────────────────────────────────
  _createLabel(dev, col, side) { createLabel(this, dev, col, side); }
  _updateLabels()              { updateLabels(this); }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — render2d.js
  // ─────────────────────────────────────────────────────────
  _render2D()                       { render2D(this); }
  _on2DDragStart(event, devId)      { on2DDragStart(this, event, devId); }
  _on2DDragEnd(event)               { on2DDragEnd(this, event); }
  _on2DDrop(event, unit, side)      { on2DDrop(this, event, unit, side); }
  _dropUnit(devId, unit, side)      { dropUnit(this, devId, unit, side); }
  _exportImage(format)              { exportImage(this, format); }
  _dlBlob(blob, filename)           { dlBlob(this, blob, filename); }
  _gen2DCanvas()                    { return gen2DCanvas(this); }
  _gen2DSVG()                       { return gen2DSVG(this); }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — catalog.js
  // ─────────────────────────────────────────────────────────
  _renderCatalog()              { renderCatalog(this); }
  _addCatalogItem()             { addCatalogItem(this); }
  _removeCatalogItem(id)        { removeCatalogItem(this, id); }
  _openCatalogEdit(item)        { openCatalogEdit(this, item); }

  // ─────────────────────────────────────────────────────────
  //  Module delegates — sidebar.js
  // ─────────────────────────────────────────────────────────
  _refresh()                        { refresh(this); }
  _buildUnitMap()                   { buildUnitMap(this); }
  _buildLegend()                    { buildLegend(this); }
  _openEdit(dev)                    { openEdit(this, dev); }
  _closeEdit()                      { closeEdit(this); }
  _ed(field, value)                 { ed(this, field, value); }
  _addDev(type, hw, name, h, w)     { return addDev(this, type, hw, name, h, w); }
  _rmDev(id)                        { rmDev(this, id); }
  _onRackName(v)                    { onRackName(this, v); }
  _onRackUnits(v)                   { onRackUnits(this, v); }
  _onRackProp(p, v)                 { onRackProp(this, p, v); }
  _onRackWidth(v)                   { onRackWidth(this, v); }
  _renderCustomFieldsEditor(dev)    { renderCustomFieldsEditor(this, dev); }
  _addCustomField()                 { addCustomField(this); }
  _editField(idx, key, value)       { editField(this, idx, key, value); }
  _removeField(idx)                 { removeField(this, idx); }

  // ─────────────────────────────────────────────────────────
  //  Camera
  // ─────────────────────────────────────────────────────────
  _posCamera() {
    if (!this._cam) return;
    const my = this._midY();
    const { az, el, r } = this._ctrl;
    this._cam.position.set(
      r * Math.cos(el) * Math.sin(az),
      r * Math.sin(el) + my,
      r * Math.cos(el) * Math.cos(az)
    );
    this._cam.lookAt(0, my, 0);
  }

  _bindCameraControls(cv) {
    const o = this._opts.camera;
    cv.addEventListener('mousedown', e => { this._ctrl.drag = true; this._ctrl.lx = e.clientX; this._ctrl.ly = e.clientY; });
    window.addEventListener('mousemove', e => {
      if (!this._ctrl.drag) return;
      this._ctrl.az -= (e.clientX - this._ctrl.lx) * o.orbitSpeed;
      this._ctrl.el  = Math.max(-0.1, Math.min(1.45, this._ctrl.el + (e.clientY - this._ctrl.ly) * o.orbitSpeed));
      this._ctrl.lx = e.clientX; this._ctrl.ly = e.clientY;
      this._posCamera();
    });
    window.addEventListener('mouseup', e => {
      if (this._ctrl.drag && Math.abs(e.clientX - this._ctrl.lx) < 5 && Math.abs(e.clientY - this._ctrl.ly) < 5)
        this._doRaycast(e, cv);
      this._ctrl.drag = false;
    });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this._ctrl.r = Math.max(o.minDistance, Math.min(o.maxDistance, this._ctrl.r + e.deltaY * o.zoomSpeed));
      this._posCamera();
    }, { passive: false });
  }

  _doRaycast(e, cv) {
    const T   = this._T3;
    const rect = cv.getBoundingClientRect();
    const ray  = new T.Raycaster();
    ray.setFromCamera(
      new T.Vector2(((e.clientX - rect.left) / cv.clientWidth) * 2 - 1, -((e.clientY - rect.top) / cv.clientHeight) * 2 + 1),
      this._cam
    );
    const hits = ray.intersectObjects(this._scene.children);
    const hit  = hits.find(h => h.object.userData?.deviceId);
    if (hit) {
      this._selId = hit.object.userData.deviceId;
      const dev = this._rack.devices.find(d => d.id === this._selId);
      if (dev) { this._openEdit(dev); if (this._opts.onSelect) this._opts.onSelect(dev); }
    } else {
      this._selId = null; this._closeEdit();
    }
    this._buildRack(); this._refresh();
  }

  // ─────────────────────────────────────────────────────────
  //  Animation loop
  // ─────────────────────────────────────────────────────────
  _startLoop() {
    cancelAnimationFrame(this._raf);

    const TARGET_FPS_IDLE   = 30;
    const TARGET_FPS_ACTIVE = 60;
    const MS_IDLE   = 1000 / TARGET_FPS_IDLE;
    const MS_ACTIVE = 1000 / TARGET_FPS_ACTIVE;

    let lastTime  = 0;
    let lastSelId = null;
    let lastAz    = this._ctrl.az;
    let lastEl    = this._ctrl.el;
    let lastR     = this._ctrl.r;

    const loop = (now) => {
      this._raf = requestAnimationFrame(loop);

      const orbiting  = this._ctrl.drag;
      const autoRot   = this._opts.view.autoRotate;
      const selChange = this._selId !== lastSelId;
      const camChange = this._ctrl.az !== lastAz || this._ctrl.el !== lastEl || this._ctrl.r !== lastR;
      const dirty     = orbiting || autoRot || selChange || camChange;

      const interval = dirty ? MS_ACTIVE : MS_IDLE;
      if (now - lastTime < interval) return;
      lastTime  = now;
      lastSelId = this._selId;
      lastAz    = this._ctrl.az;
      lastEl    = this._ctrl.el;
      lastR     = this._ctrl.r;

      this._tick++;

      if (autoRot) {
        this._ctrl.az += this._opts.view.autoRotateSpeed;
        this._posCamera();
      }

      if (selChange || (this._selId && this._tick % 2 === 0)) {
        Object.entries(this._devMeshes).forEach(([id, m]) => {
          if (!m.material) return;
          const target = id === this._selId
            ? 1.0 + 0.3 * Math.sin(this._tick * 0.08)
            : 0.55;
          if (Math.abs(m.material.emissiveIntensity - target) > 0.005) {
            m.material.emissiveIntensity = target;
          }
        });
      }

      this._ren.render(this._scene, this._cam);
      this._updateLabels();
    };
    requestAnimationFrame(loop);
  }

  /** Mark scene as needing a re-render */
  invalidate() {
    this._tick++;
  }

  // ─────────────────────────────────────────────────────────
  //  Sidebar events (initial bind)
  // ─────────────────────────────────────────────────────────
  _bindSidebarEvents() {
    if (!window._r3) window._r3 = {};
    window._r3[this._id] = this;
  }

  // ─────────────────────────────────────────────────────────
  //  Geometry helpers
  // ─────────────────────────────────────────────────────────
  _rackH() { return (this._rack?.units || 24) * this._opts.rack.unitHeight + 1.3; }
  _midY()  { return this._rackH() / 2; }

  // ─────────────────────────────────────────────────────────
  //  Toolbar toggles (called from inline onclick)
  // ─────────────────────────────────────────────────────────
  toggleLabels() {
    this._showLabels = !this._showLabels;
    const b = document.getElementById(this._id + '-btnL');
    if (b) b.className = 'r3-btn' + (this._showLabels ? ' on' : '');
  }
  toggleWire() {
    this._showWire = !this._showWire;
    const b = document.getElementById(this._id + '-btnW');
    if (b) b.className = 'r3-btn' + (this._showWire ? ' on' : '');
    this._buildRack();
  }
  toggleMode() {
    this._mode = this._mode === '3d' ? '2d' : '3d';
    const b = document.getElementById(this._id + '-btn2d');
    if (b) b.textContent = '⊞ ' + (this._mode === '2d' ? '3D' : '2D');
    const c3d = document.getElementById(this._id + '-cvcont');
    const c2d = document.getElementById(this._id + '-2dcont');
    const lbl = document.getElementById(this._id + '-btnL');
    if (this._mode === '2d') {
      if (c3d) c3d.style.display = 'none';
      if (c2d) c2d.style.display = 'flex';
      if (lbl) lbl.style.display = 'none';
      this._render2D();
    } else {
      if (c3d) c3d.style.display = '';
      if (c2d) c2d.style.display = 'none';
      if (lbl) lbl.style.display = '';
      if (!this._ren) this._bootThree();
      else this._buildRack();
    }
  }
  toggleJson() {
    const jp = document.getElementById(this._id + '-jp'); if (!jp) return;
    const on = jp.style.display === 'none';
    jp.style.display = on ? 'flex' : 'none';
    const b = document.getElementById(this._id + '-btnJ');
    if (b) b.className = 'r3-btn' + (on ? ' on' : '');
    if (on) this.exportJson();
  }
  exportJson() {
    const ta = document.getElementById(this._id + '-jta');
    if (ta) ta.value = JSON.stringify({ rack: this._rack }, null, 2);
  }
  applyJson() {
    const ta = document.getElementById(this._id + '-jta');
    const je = document.getElementById(this._id + '-je');
    if (!ta) return;
    try {
      const p = JSON.parse(ta.value);
      if (!p.rack) throw new Error("Missing 'rack' key");
      this._rack = p.rack; this._selId = null; this._closeEdit();
      if (je) je.textContent = '';
      this._buildRack(); this._refresh();
      if (this._mode === '2d') this._render2D();
    } catch (e) {
      if (je) je.textContent = '⚠ ' + e.message;
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  Static helper — call BEFORE creating any instance when using
//  a bundler (Vite, Webpack, etc.) that already imports Three.js.
//  This prevents the "multiple instances of Three.js" warning.
//
//  Usage (in main.jsx or before any Rack3DVisualizer construction):
//    import * as THREE from 'three';
//    import { Rack3DVisualizer } from 'rack3d-visualizer';
//    Rack3DVisualizer.useThree(THREE);
// ─────────────────────────────────────────────────────────────
Rack3DVisualizer._THREE = null;

/**
 * Register the host application's Three.js instance.
 * Must be called before constructing any Rack3DVisualizer when using
 * a module bundler (Vite, webpack, Rollup, etc.).
 * @param {Object} THREE - The Three.js namespace imported by the host app
 */
Rack3DVisualizer.useThree = function(THREE) {
  Rack3DVisualizer._THREE = THREE;
};
