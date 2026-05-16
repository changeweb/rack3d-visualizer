// ─────────────────────────────────────────────────────────────
//  Rack3DVisualizer — main class
// ─────────────────────────────────────────────────────────────
import { DEFAULT_OPTIONS, mergeOptions } from './options.js';
import { resolveTheme } from './themes.js';
import { DEVICE_TYPES } from './constants.js';
import { buildCSS } from './css.js';
import { buildHTML } from './html.js';
import { makeUnitLabel } from './geometry.js';
import { createLabel, updateLabels } from './labels.js';
import { render2D, on2DDragStart, on2DDragEnd, on2DDrop, dropUnit, exportImage, dlBlob, gen2DCanvas, gen2DSVG } from './render2d.js';
import { renderCatalog, addFromCatalog, addCatalogItem, removeCatalogItem, openCatalogEdit } from './catalog.js';
import { refresh, buildRoomPanel, buildUnitMap, buildLegendOverlay, openEdit, closeEdit, ed, addDev, rmDev, onRackName, onRackUnits, onRackProp, onRackWidth, onRackPos, onRackAngle, renderCustomFieldsEditor, addCustomField, editField, removeField } from './sidebar.js';
import { MaterialFactory } from './services/MaterialFactory.js';
import { SelectionManager } from './services/SelectionManager.js';
import { GeometryManager } from './services/GeometryManager.js';
import { RackBuilder } from './builders/RackBuilder.js';
import { DeviceBuilder } from './builders/DeviceBuilder.js';
import { EnvironmentBuilder } from './builders/EnvironmentBuilder.js';

let _instanceCount = 0;

const DEFAULT_CATALOG = [
  { id:'cat-sv1',  name:'Server 1U',    type:'server',   heightUnits:1, watts:300 },
  { id:'cat-sv2',  name:'Server 2U',    type:'server',   heightUnits:2, watts:620 },
  { id:'cat-sw',   name:'Switch 48p',   type:'switch',   heightUnits:1, watts:180 },
  { id:'cat-rt',   name:'Router',       type:'router',   heightUnits:2, watts:450 },
  { id:'cat-fw',   name:'Firewall',     type:'firewall', heightUnits:2, watts:320 },
  { id:'cat-st',   name:'NAS Storage',  type:'storage',  heightUnits:3, watts:290 },
  { id:'cat-pdu',  name:'PDU',          type:'pdu',      heightUnits:1, watts:30  },
  { id:'cat-pat',  name:'Patch Panel',  type:'patch',    heightUnits:1, watts:0   },
  { id:'cat-ups',  name:'UPS Unit',     type:'ups',      heightUnits:3, watts:180 },
  { id:'cat-kvm',  name:'KVM Switch',   type:'kvm',      heightUnits:1, watts:45  },
  { id:'cat-lb',   name:'Load Balancer',type:'loadbal',  heightUnits:1, watts:200 },
  { id:'cat-sec',  name:'IDS Sensor',   type:'security', heightUnits:1, watts:95  },
];

export class Rack3DVisualizer {
  constructor(container, userOptions = {}) {
    this._el = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!this._el) throw new Error('[Rack3D] Container not found: ' + container);

    this._opts   = mergeOptions(DEFAULT_OPTIONS, userOptions);
    this._theme  = resolveTheme(this._opts.theme);
    this._types  = { ...DEVICE_TYPES, ...this._opts.deviceTypes };
    this._id     = 'r3d-' + (++_instanceCount);

    // State
    this._room      = null;
    this._rack      = null;  // selected rack (pointer into _room.racks[i])
    this._selRackId = null;
    this._selId     = null;
    this._dragId    = null;
    this._dragCatId = null;
    this._selCatId  = null;
    this._catCollapsed = {};
    this._showWire   = this._opts.view.wireframe;
    this._showLabels = this._opts.view.showLabels;
    this._mode       = this._opts.view.mode;

    // Three.js handles
    this._T3    = null;
    this._scene = null;
    this._cam   = null;
    this._ren   = null;
    this._raf   = null;
    this._tick  = 0;

    const camMode = this._opts.camera.mode || 'fps';
    this._ctrl = {
      mode: camMode,
      // Orbit
      drag: false, lx: 0, ly: 0,
      az:  this._opts.camera.azimuth,
      el:  this._opts.camera.elevation,
      r:   this._opts.camera.distance === 'auto' ? 22 : this._opts.camera.distance,
      // FPS
      pos:    { x: 0, y: 16, z: -18 },
      yaw:    0,
      pitch:  -0.08,
      keys:   {},
      moveSpeed: this._opts.camera.fpsSpeed || 0.12,
    };

    this._rackGroups     = {};
    this._devMeshes      = {};
    this._labelDivs      = {};
    this._labelPositions = {};

    // OOP service instances (initialised after Three.js boots)
    this._materialFactory  = null;
    this._selectionManager = null;
    this._geometryManager  = null;

    // Rack drag state
    this._rackDragState = null;

    this._injectStyles();
    this._el.id = this._id;
    this._el.innerHTML = this._buildHTML();
    this._bindSidebarEvents();
    this._restorePanelState();

    this._loadThree(() => {
      if (this._mode === '2d') this._boot2D();
      else this._bootThree();
      if (this._opts.onReady) this._opts.onReady(this);
    });
  }

  // ─── Public API ───────────────────────────────────────────

  /** Load a single rack (backward-compat wrapper) */
  setData(rackData) {
    if (!rackData || typeof rackData !== 'object') return this;
    // If already a room structure
    if (Array.isArray(rackData.racks)) return this.setRoomData(rackData);
    // Single rack — wrap into room
    try {
      const clone = JSON.parse(JSON.stringify(rackData));
      const catalog = clone.catalog || [];
      delete clone.catalog;
      return this.setRoomData({
        catalog,
        layout: { rows:1, cols:1, colSpacing:8, rowSpacing:10 },
        racks: [{ id:'rack-main', row:0, col:0, ...clone }],
      });
    } catch (e) {
      console.error('[Rack3D] setData() failed:', e);
      return this;
    }
  }

  /** Load a full room with multiple racks */
  setRoomData(roomData) {
    if (!roomData || typeof roomData !== 'object') return this;
    try {
      this._room = JSON.parse(JSON.stringify(roomData));
    } catch (e) {
      console.error('[Rack3D] setRoomData() failed:', e);
      return this;
    }
    if (!Array.isArray(this._room.catalog))  this._room.catalog = [...DEFAULT_CATALOG];
    if (!Array.isArray(this._room.racks))    this._room.racks   = [];
    this._room.racks.forEach(r => {
      if (!r.id) r.id = 'rack-' + Date.now() + Math.random().toString(36).slice(2,6);
      if (!Array.isArray(r.devices)) r.devices = [];
      if (!r.units) r.units = 24;
    });
    // Auto-select first rack
    if (this._room.racks.length > 0) {
      this._selRackId = this._room.racks[0].id;
      this._rack = this._room.racks[0];
    } else {
      this._selRackId = null; this._rack = null;
    }
    this._selId = null;
    this._closeEdit();
    this._refresh();
    if (this._scene) this._buildRack();
    if (this._mode === '2d') this._render2D();
    return this;
  }

  getData() {
    if (!this._room) return null;
    return JSON.parse(JSON.stringify(this._room));
  }

  getSelectedRack() {
    if (!this._rack) return null;
    return JSON.parse(JSON.stringify(this._rack));
  }

  setTheme(themeInput) {
    this._theme = resolveTheme(themeInput);
    this._materialFactory?.setTheme(this._theme);
    this._injectStyles();
    this._refresh();
    if (this._scene) this._buildRack();
    return this;
  }

  setOptions(partialOpts) {
    this._opts = mergeOptions(this._opts, partialOpts);
    if (partialOpts.theme) this.setTheme(partialOpts.theme);
    if (partialOpts.view?.mode && partialOpts.view.mode !== this._mode) {
      this._mode = partialOpts.view.mode;
      if (this._mode === '2d') this._boot2D(); else this._bootThree();
    }
    this._refresh();
    return this;
  }

  setMode(mode) { return this.setOptions({ view: { mode } }); }
  setWireframe(e) { this._showWire = e; if (this._scene) this._buildRack(); return this; }
  setLabels(e) { this._showLabels = e; return this; }

  setCameraAngle(az, el, dist) {
    this._ctrl.az = az ?? this._ctrl.az;
    this._ctrl.el = el ?? this._ctrl.el;
    if (dist != null) this._ctrl.r = dist;
    this._posCamera(); return this;
  }

  resetCamera() {
    const o = this._opts.camera;
    if (this._ctrl.mode === 'fps') {
      this._ctrl.pos = { x:0, y:16, z:-18 };
      this._ctrl.yaw = 0; this._ctrl.pitch = -0.08;
    } else {
      this._ctrl.az = o.azimuth; this._ctrl.el = o.elevation;
      this._ctrl.r = o.distance === 'auto' ? Math.max(22, this._rackH()*2.2) : o.distance;
    }
    this._posCamera(); return this;
  }

  zoomIn() {
    if (this._ctrl.mode === 'fps') {
      const { yaw, pitch } = this._ctrl;
      const cp = Math.cos(pitch);
      this._ctrl.pos.x += cp*Math.sin(yaw)*2; this._ctrl.pos.y += Math.sin(pitch)*2; this._ctrl.pos.z += cp*Math.cos(yaw)*2;
    } else {
      this._ctrl.r = Math.max(this._opts.camera.minDistance, this._ctrl.r*0.85);
    }
    this._posCamera(); return this;
  }

  zoomOut() {
    if (this._ctrl.mode === 'fps') {
      const { yaw, pitch } = this._ctrl;
      const cp = Math.cos(pitch);
      this._ctrl.pos.x -= cp*Math.sin(yaw)*2; this._ctrl.pos.y -= Math.sin(pitch)*2; this._ctrl.pos.z -= cp*Math.cos(yaw)*2;
    } else {
      this._ctrl.r = Math.min(this._opts.camera.maxDistance, this._ctrl.r*1.18);
    }
    this._posCamera(); return this;
  }

  resetRack() {
    if (!this._rack) return;
    if (!confirm('Reset rack? All devices will be removed.')) return;
    this._rack.devices = []; this._selId = null; this._closeEdit();
    this._buildRack(); this._refresh();
  }

  copyJson() {
    const json = JSON.stringify(this._room, null, 2);
    navigator.clipboard?.writeText(json).then(() => {
      const b = document.getElementById(this._id + '-btnCopy');
      const orig = b?.textContent;
      if (b) { b.textContent = '✓ Copied!'; setTimeout(() => { if (b) b.textContent = orig; }, 1500); }
    }).catch(() => {
      const ta = document.getElementById(this._id + '-jta');
      if (ta) { ta.value = json; const jp = document.getElementById(this._id + '-jp'); if (jp) jp.style.display = 'flex'; }
    });
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._materialFactory?.dispose();
    this._geometryManager?.clearAllRacks();
    if (this._ren) { this._ren.dispose(); this._ren = null; }
    const style = document.getElementById(this._id + '-styles');
    if (style) style.remove();
    this._el.innerHTML = '';
    window.removeEventListener('resize', this._onResize);
    if (this._unbindKeys) this._unbindKeys();
    return this;
  }

  // ─── Style ────────────────────────────────────────────────
  _injectStyles() {
    let tag = document.getElementById(this._id + '-styles');
    if (!tag) { tag = document.createElement('style'); tag.id = this._id+'-styles'; document.head.appendChild(tag); }
    tag.textContent = buildCSS(this._id, this._theme, this._opts);
  }

  _buildHTML() { return buildHTML(this); }

  // ─── Three.js loader + boot ───────────────────────────────
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
    this._ren = new T.WebGLRenderer({ canvas:cv, antialias:true, powerPreference:'default' });
    this._ren.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this._ren.setSize(W, H);
    this._ren.shadowMap.enabled = this._opts.lighting.shadows;
    this._ren.shadowMap.type = T.PCFSoftShadowMap;
    this._ren.setClearColor(this._theme.scene.clearColor, 1);
    this._ren.physicallyCorrectLights = true;
    this._ren.toneMapping = T.ACESFilmicToneMapping;
    this._ren.toneMappingExposure = this._opts.lighting.exposure ?? this._theme.scene.exposure;

    this._scene = new T.Scene();
    this._scene.fog = new T.Fog(this._theme.scene.fogColor, this._opts.room.fogNear, this._opts.room.fogFar);

    this._cam = new T.PerspectiveCamera(this._opts.camera.fov, W/H, 0.05, 200);
    this._posCamera();

    this._initServices();
    if (this._opts.room.enabled) {
      this._buildEnvironment();
    } else {
      this._buildLights();
    }
    if (this._room) this._buildRack();

    this._onResize = () => {
      const c = document.getElementById(this._id + '-cvcont');
      if (!c || !this._ren || !this._cam) return;
      const nw = c.clientWidth, nh = c.clientHeight;
      if (nw < 1 || nh < 1) return;
      this._ren.setSize(nw, nh);
      this._cam.aspect = nw/nh; this._cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
    this._bindCameraControls(cv);
    this._startLoop();
  }

  _boot2D() {
    const c2d = document.getElementById(this._id + '-2dcont');
    const c3d = document.getElementById(this._id + '-cvcont');
    if (c2d) c2d.style.display = 'flex';
    if (c3d) c3d.style.display = 'none';
    this._render2D();
  }

  // ─── Service initialisation ───────────────────────────────
  _initServices() {
    const T = this._T3;
    this._materialFactory  = new MaterialFactory(T, this._theme);
    this._selectionManager = new SelectionManager(this._scene, this._cam, T);

    const rackBuilder = new RackBuilder(T, this._theme, this._materialFactory);
    const deviceBuilder = new DeviceBuilder(T, this._materialFactory, this._types);
    const envBuilder = new EnvironmentBuilder(T, this._theme);

    this._geometryManager = new GeometryManager(T, this._scene, rackBuilder, deviceBuilder, envBuilder, this._materialFactory);
    this._geometryManager.labelSide = this._opts.labels?.side || 'auto';
  }

  // ─── Module delegates ─────────────────────────────────────
  _buildLights() {
    this._geometryManager?.environmentBuilder.buildLightsOnly(this._scene, this._opts.lighting, this._theme.scene);
  }
  _buildEnvironment() {
    this._geometryManager.buildEnvironment(this._room, this._opts.room, this._opts.lighting, this._theme.scene);
  }

  _clearRack() {
    Object.values(this._labelDivs || {}).forEach(d => d.remove());
    this._labelDivs = {};
    this._geometryManager?.clearAllRacks();
    this._rackGroups = {};
    this._devMeshes  = {};
    this._labelPositions = {};
  }

  _buildRack() {
    this._clearRack();
    this._geometryManager.buildAllRacks(this._room, this._opts.rack, this._theme.rack);

    // Sync geometry manager state back to instance so labels.js / sidebar.js can read them
    this._rackGroups     = this._geometryManager.rackGroups;
    this._devMeshes      = this._geometryManager.deviceMeshes;
    this._labelPositions = this._geometryManager.labelPositions;

    // Create CSS labels for every device
    if (this._room?.racks) {
      this._room.racks.forEach(rack => {
        (rack.devices || []).forEach(dev => {
          const lp = this._labelPositions[dev.id];
          if (!lp) return;
          const typeInfo = this._types[dev.type] || this._types.server;
          this._createLabel(dev, dev.color || typeInfo.color, lp.side);
        });
      });
    }

    if (this._opts.camera.distance === 'auto' && this._ctrl.mode !== 'fps') {
      this._ctrl.r = Math.max(22, this._rackH() * 2.2);
    }
    this._posCamera();
  }

  _makeUnitLabel(u, y, hw, hd, UH, POST, ox, oz, rackId) { return makeUnitLabel(this, u, y, hw, hd, UH, POST, ox, oz, rackId); }

  _buildDevice(dev, idx, ox, oz, rackId) {
    const group = this._rackGroups?.[rackId];
    if (group && this._geometryManager) {
      const ro    = this._opts.rack;
      const entry = this._room?.racks?.find(r => r.id === rackId) || { id: rackId };
      this._geometryManager.deviceBuilder.build(
        dev, idx, this._opts.labels?.side || 'auto', ro, group, entry,
        ro.width / 2, ro.depth / 2, this._labelPositions, this._devMeshes
      );
      const lp = this._labelPositions[dev.id];
      if (lp) {
        const ti = this._types[dev.type] || this._types.server;
        this._createLabel(dev, dev.color || ti.color, lp.side);
      }
    }
  }

  _createLabel(dev, col, side)  { createLabel(this, dev, col, side); }
  _updateLabels()               { updateLabels(this); }

  _render2D()                   { render2D(this); }
  _on2DDragStart(event, devId)  { on2DDragStart(this, event, devId); }
  _on2DDragEnd(event)           { on2DDragEnd(this, event); }
  _on2DDrop(event, unit, side)  { on2DDrop(this, event, unit, side); }
  _dropUnit(devId, unit, side)  { dropUnit(this, devId, unit, side); }
  _exportImage(format)          { exportImage(this, format); }
  _dlBlob(blob, filename)       { dlBlob(this, blob, filename); }
  _gen2DCanvas()                { return gen2DCanvas(this); }
  _gen2DSVG()                   { return gen2DSVG(this); }

  _renderCatalog()              { renderCatalog(this); }
  _addFromCatalog(catId)        { return addFromCatalog(this, catId); }
  _addCatalogItem()             { addCatalogItem(this); }
  _removeCatalogItem(id)        { removeCatalogItem(this, id); }
  _openCatalogEdit(item)        { openCatalogEdit(this, item); }

  _refresh()                    { refresh(this); }
  _buildRoomPanel()             { buildRoomPanel(this); }
  _buildUnitMap()               { buildUnitMap(this); }
  _buildLegendOverlay()         { buildLegendOverlay(this); }
  _openEdit(dev)                { openEdit(this, dev); }
  _closeEdit()                  { closeEdit(this); }
  _ed(field, value)             { ed(this, field, value); }
  _addDev(type, hw, name, h, w) { return addDev(this, type, hw, name, h, w); }
  _rmDev(id)                    { rmDev(this, id); }
  _onRackName(v)                { onRackName(this, v); }
  _onRackUnits(v)               { onRackUnits(this, v); }
  _onRackProp(p, v)             { onRackProp(this, p, v); }
  _onRackWidth(v)               { onRackWidth(this, v); }
  _onRackPos(axis, v)           { onRackPos(this, axis, v); }
  _onRackAngle(deg)             { onRackAngle(this, deg); }
  _renderCustomFieldsEditor(dev){ renderCustomFieldsEditor(this, dev); }
  _addCustomField()             { addCustomField(this); }
  _editField(idx, key, value)   { editField(this, idx, key, value); }
  _removeField(idx)             { removeField(this, idx); }

  _addRack() {
    if (!this._room) return;
    const layout = this._room.layout || {};
    const cols   = layout.cols || 1;
    const existing = this._room.racks || [];
    const newCol = existing.length % cols;
    const newRow = Math.floor(existing.length / cols);
    const nr = {
      id: 'rack-' + Date.now(),
      row: newRow, col: newCol,
      name: 'RACK-' + String.fromCharCode(65 + existing.length),
      units: 24,
      devices: [],
      rackTemp: 25, pduCapacity: 4000, pduLoad: 0,
    };
    this._room.racks.push(nr);
    this._selRackId = nr.id; this._rack = nr;
    this._buildRack(); this._refresh();
  }

  // ─── Camera ───────────────────────────────────────────────
  _posCamera() {
    if (!this._cam) return;
    if (this._ctrl.mode === 'fps') {
      const { pos, yaw, pitch } = this._ctrl;
      const cp = Math.cos(pitch);
      this._cam.position.set(pos.x, pos.y, pos.z);
      this._cam.lookAt(pos.x + cp*Math.sin(yaw), pos.y + Math.sin(pitch), pos.z + cp*Math.cos(yaw));
    } else {
      const my = this._midY();
      const { az, el, r } = this._ctrl;
      this._cam.position.set(r*Math.cos(el)*Math.sin(az), r*Math.sin(el)+my, r*Math.cos(el)*Math.cos(az));
      this._cam.lookAt(0, my, 0);
    }
  }

  _bindCameraControls(cv) {
    const o = this._opts.camera;
    let dragStartX = 0, dragStartY = 0;
    let lockedMoveAccum = 0;
    this._ctrl.pointerLocked = false;

    // Pointer lock only via toolbar button — canvas click always selects
    cv.addEventListener('mousedown', e => {
      if (e.button !== 0) return;

      // In orbit mode: check if mousedown hits the selected rack → start rack drag
      if (this._ctrl.mode !== 'fps' && !this._ctrl.pointerLocked && this._selRackId && this._room) {
        const rect = cv.getBoundingClientRect();
        const hit = this._selectionManager?.raycast(
          e.clientX - rect.left, e.clientY - rect.top, cv.clientWidth, cv.clientHeight
        );
        if (hit && (hit.rackId === this._selRackId || hit.id === this._selRackId)) {
          const floorHit = this._raycastFloor(e.clientX, e.clientY, cv);
          if (floorHit) {
            const rackGroup = this._rackGroups[this._selRackId];
            const curX = rackGroup?.position.x ?? 0;
            const curZ = rackGroup?.position.z ?? 0;
            this._rackDragState = { active: true, rackId: this._selRackId,
              offsetX: floorHit.x - curX, offsetZ: floorHit.z - curZ, lastRebuild: 0 };
            cv.style.cursor = 'move';
            return;
          }
        }
      }

      this._ctrl.drag = true;
      this._ctrl.lx = dragStartX = e.clientX;
      this._ctrl.ly = dragStartY = e.clientY;
      lockedMoveAccum = 0;
      if (this._ctrl.mode === 'fps' && !this._ctrl.pointerLocked) cv.style.cursor = 'grabbing';
    });

    const onPointerLockChange = () => {
      this._ctrl.pointerLocked = document.pointerLockElement === cv;
      lockedMoveAccum = 0;
      const b   = document.getElementById(this._id + '-btnCam');
      const tip = document.getElementById(this._id + '-tip');
      if (this._ctrl.pointerLocked) {
        cv.style.cursor = 'none';
        if (b)   b.textContent = '🔓 UNLOCK';
        if (tip) tip.textContent = 'Mouse locked · WASD walk · Q/E up/down · Click to select · ESC to release';
      } else {
        cv.style.cursor = 'crosshair';
        if (b)   b.textContent = this._ctrl.mode === 'fps' ? '⊹ FPS' : '⊕ ORBIT';
        if (tip) tip.textContent = this._ctrl.mode === 'fps'
          ? '🖱 Drag to look · WASD walk · Click ⊹FPS button to lock mouse'
          : '🖱 Drag to orbit · Scroll to zoom · Click to select';
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onMouseMove = e => {
      // Rack drag mode
      if (this._rackDragState?.active) {
        const floorHit = this._raycastFloor(e.clientX, e.clientY, cv);
        if (floorHit) {
          const rack = this._room?.racks.find(r => r.id === this._rackDragState.rackId);
          if (rack) {
            let nx = floorHit.x - this._rackDragState.offsetX;
            let nz = floorHit.z - this._rackDragState.offsetZ;
            // Wall snap
            const snapped = this._snapRackPos(nx, nz);
            nx = snapped.x; nz = snapped.z;
            // Clamp to room bounds
            const ro = this._opts.room;
            const rHW = this._opts.rack.width / 2, rHD = this._opts.rack.depth / 2;
            nx = Math.max(-ro.width/2 + rHW, Math.min(ro.width/2 - rHW, nx));
            nz = Math.max(2 - ro.depth/2 + rHD, Math.min(2 + ro.depth/2 - rHD, nz));
            rack.position = { x: nx, y: rack.position?.y ?? 0, z: nz };
            // Throttled rebuild (50ms)
            const now = Date.now();
            if (now - this._rackDragState.lastRebuild > 50) {
              this._rackDragState.lastRebuild = now;
              this._buildRack();
            }
          }
        }
        return;
      }

      if (this._ctrl.pointerLocked) {
        lockedMoveAccum += Math.abs(e.movementX) + Math.abs(e.movementY);
        this._ctrl.yaw   += e.movementX * 0.003;
        this._ctrl.pitch  = Math.max(-1.3, Math.min(1.3, this._ctrl.pitch - e.movementY * 0.003));
        this._posCamera();
        return;
      }
      if (!this._ctrl.drag) return;
      const dx = e.clientX - this._ctrl.lx;
      const dy = e.clientY - this._ctrl.ly;
      if (this._ctrl.mode === 'fps') {
        this._ctrl.yaw   += dx * (o.orbitSpeed * 1.8);
        this._ctrl.pitch  = Math.max(-1.3, Math.min(1.3, this._ctrl.pitch - dy * (o.orbitSpeed * 1.8)));
      } else {
        this._ctrl.az -= dx * o.orbitSpeed;
        this._ctrl.el  = Math.max(-0.1, Math.min(1.45, this._ctrl.el + dy * o.orbitSpeed));
      }
      this._ctrl.lx = e.clientX; this._ctrl.ly = e.clientY;
      this._posCamera();
    };

    const onMouseUp = e => {
      // Finalize rack drag
      if (this._rackDragState?.active) {
        this._rackDragState = null;
        cv.style.cursor = 'crosshair';
        this._buildRack();
        this._refresh();
        return;
      }

      if (this._ctrl.pointerLocked) {
        if (lockedMoveAccum < 12) {
          const rect = cv.getBoundingClientRect();
          this._doRaycast({ clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2 }, cv);
        }
        lockedMoveAccum = 0;
        return;
      }
      if (this._ctrl.drag) {
        const dx = Math.abs(e.clientX - dragStartX);
        const dy = Math.abs(e.clientY - dragStartY);
        if (dx < 5 && dy < 5) this._doRaycast(e, cv);
      }
      this._ctrl.drag = false;
      if (this._ctrl.mode === 'fps') cv.style.cursor = 'crosshair';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (this._ctrl.mode === 'fps') {
        const { yaw, pitch } = this._ctrl;
        const cp = Math.cos(pitch);
        const dir = e.deltaY < 0 ? 1 : -1;
        const spd = 0.8;
        this._ctrl.pos.x += dir * spd * cp * Math.sin(yaw);
        this._ctrl.pos.y += dir * spd * Math.sin(pitch);
        this._ctrl.pos.z += dir * spd * cp * Math.cos(yaw);
      } else {
        this._ctrl.r = Math.max(o.minDistance, Math.min(o.maxDistance, this._ctrl.r + e.deltaY * o.zoomSpeed));
      }
      this._posCamera();
    }, { passive: false });

    const onKeyDown = e => {
      this._ctrl.keys[e.code] = true;
      if (this._ctrl.pointerLocked && ['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = e => { this._ctrl.keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    this._unbindKeys = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('keydown',   onKeyDown);
      window.removeEventListener('keyup',     onKeyUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }

  _doRaycast(e, cv) {
    const rect   = cv.getBoundingClientRect();
    const result = this._selectionManager.raycast(
      e.clientX - rect.left, e.clientY - rect.top,
      cv.clientWidth, cv.clientHeight
    );

    if (result?.type === 'device') {
      const rack = this._room?.racks.find(r => r.id === result.rackId);
      if (rack) {
        this._selRackId = result.rackId; this._rack = rack;
        this._selId = result.id;
        const dev = rack.devices?.find(d => d.id === this._selId);
        if (dev) { this._openEdit(dev); if (this._opts.onSelect) this._opts.onSelect(dev, rack); }
      }
    } else if (result?.type === 'rack') {
      const rack = this._room?.racks.find(r => r.id === result.id);
      if (rack) { this._selRackId = result.id; this._rack = rack; }
      this._selId = null; this._closeEdit();
    } else {
      this._selId = null; this._closeEdit();
    }
    this._buildRack(); this._refresh();
  }

  // ─── Animation loop ───────────────────────────────────────
  _startLoop() {
    cancelAnimationFrame(this._raf);

    const MS_ACTIVE = 1000 / 20;   // max 20 fps when active (was 60)
    const MS_IDLE   = 800;          // ~1 fps when truly idle — almost no GPU work

    let lastTime = 0;
    let lastSelId = null, lastSelRackId = null;
    let lastAz = this._ctrl.az, lastEl = this._ctrl.el, lastR = this._ctrl.r;
    let lastPosX = this._ctrl.pos.x, lastPosY = this._ctrl.pos.y, lastPosZ = this._ctrl.pos.z;
    let lastYaw  = this._ctrl.yaw,   lastPitch = this._ctrl.pitch;

    const loop = (now) => {
      this._raf = requestAnimationFrame(loop);

      // FPS movement
      if (this._ctrl.mode === 'fps') {
        const { keys, pos, yaw } = this._ctrl;
        const fast  = keys['ShiftLeft'] || keys['ShiftRight'];
        const spd   = this._ctrl.moveSpeed * (fast ? 2.5 : 1);
        const fwdX  = Math.sin(yaw), fwdZ = Math.cos(yaw);
        const rtX   = Math.cos(yaw), rtZ  = -Math.sin(yaw);
        if (keys['KeyW']||keys['ArrowUp'])    { pos.x+=fwdX*spd; pos.z+=fwdZ*spd; }
        if (keys['KeyS']||keys['ArrowDown'])  { pos.x-=fwdX*spd; pos.z-=fwdZ*spd; }
        if (keys['KeyA']||keys['ArrowLeft'])  { pos.x-=rtX*spd;  pos.z-=rtZ*spd;  }
        if (keys['KeyD']||keys['ArrowRight']) { pos.x+=rtX*spd;  pos.z+=rtZ*spd;  }
        if (keys['KeyQ']||keys['PageUp'])     { pos.y+=spd; }
        if (keys['KeyE']||keys['PageDown'])   { pos.y-=spd; }
        // Clamp to room bounds (scene room center offset: cx=0, cz=2)
        const ro = this._opts.room;
        const margin = 0.8;
        const sceneCZ = 2;
        pos.x = Math.max(-ro.width/2 + margin, Math.min(ro.width/2 - margin, pos.x));
        pos.z = Math.max(sceneCZ - ro.depth/2 + margin, Math.min(sceneCZ + ro.depth/2 - margin, pos.z));
        pos.y = Math.max(1.0, Math.min(ro.height - 1.5, pos.y));
      }
      if (this._opts.view.autoRotate) {
        this._ctrl.az += this._opts.view.autoRotateSpeed;
      }

      const selChange  = this._selId !== lastSelId || this._selRackId !== lastSelRackId;
      const camChange  = this._ctrl.az !== lastAz || this._ctrl.el !== lastEl || this._ctrl.r !== lastR
                      || this._ctrl.pos.x !== lastPosX || this._ctrl.pos.y !== lastPosY || this._ctrl.pos.z !== lastPosZ
                      || this._ctrl.yaw !== lastYaw || this._ctrl.pitch !== lastPitch;
      const fpsMoving  = this._ctrl.mode === 'fps' && Object.values(this._ctrl.keys).some(Boolean);
      const dirty      = this._ctrl.drag || fpsMoving || this._opts.view.autoRotate || selChange || camChange;

      if (camChange || fpsMoving) this._posCamera();

      const interval = dirty ? MS_ACTIVE : MS_IDLE;
      if (now - lastTime < interval) return;
      lastTime = now;
      lastSelId = this._selId; lastSelRackId = this._selRackId;
      lastAz = this._ctrl.az; lastEl = this._ctrl.el; lastR = this._ctrl.r;
      lastPosX = this._ctrl.pos.x; lastPosY = this._ctrl.pos.y; lastPosZ = this._ctrl.pos.z;
      lastYaw  = this._ctrl.yaw;   lastPitch = this._ctrl.pitch;

      this._tick++;

      // Pulse only on change — not every frame — so idle renders stay truly idle
      if (selChange) {
        Object.entries(this._devMeshes).forEach(([id, m]) => {
          if (m?.material) m.material.emissiveIntensity = id === this._selId ? 1.0 : 0.55;
        });
      } else if (dirty && this._selId) {
        const m = this._devMeshes[this._selId];
        if (m?.material) m.material.emissiveIntensity = 1.0 + 0.3 * Math.sin(this._tick * 0.15);
      }

      this._ren.render(this._scene, this._cam);
      // Labels are CSS divs projected from 3D — only update when camera or selection moves
      if (camChange || selChange || fpsMoving) this._updateLabels();
    };
    requestAnimationFrame(loop);
  }

  invalidate() { this._tick++; }

  _bindSidebarEvents() {
    if (!window._r3) window._r3 = {};
    window._r3[this._id] = this;
  }

  _rackH() {
    if (!this._room?.racks?.length) return 12;
    const maxUnits = Math.max(...this._room.racks.map(r => r.units || 24));
    return maxUnits * this._opts.rack.unitHeight + 1.3;
  }
  _midY() { return this._rackH() / 2; }

  // ─── Toolbar toggles ──────────────────────────────────────
  toggleLabels() {
    this._showLabels = !this._showLabels;
    const b = document.getElementById(this._id + '-btnL');
    if (b) b.className = 'r3-btn'+(this._showLabels?' on':'');
  }
  toggleWire() {
    this._showWire = !this._showWire;
    const b = document.getElementById(this._id + '-btnW');
    if (b) b.className = 'r3-btn' + (this._showWire ? ' on' : '');
    this._materialFactory?.setWireframeMode(this._showWire);
    this._buildRack();
  }
  toggleMode() {
    this._mode = this._mode === '3d' ? '2d' : '3d';
    const b = document.getElementById(this._id + '-btn2d');
    if (b) b.textContent = '⊞ '+(this._mode==='2d'?'3D':'2D');
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
      if (!this._ren) this._bootThree(); else this._buildRack();
    }
  }
  toggleCameraMode() {
    const cv  = document.getElementById(this._id + '-cv3');
    const b   = document.getElementById(this._id + '-btnCam');
    const tip = document.getElementById(this._id + '-tip');
    // State 3 (locked) → release lock, stay FPS
    if (this._ctrl.pointerLocked) { document.exitPointerLock?.(); return; }
    // State 2 (FPS unlocked) → request pointer lock
    if (this._ctrl.mode === 'fps') {
      if (cv) cv.requestPointerLock();
      return;
    }
    // State 1 (orbit) → switch to FPS
    this._ctrl.mode = 'fps';
    if (this._cam) {
      this._ctrl.pos   = { x:this._cam.position.x, y:this._cam.position.y, z:this._cam.position.z };
      this._ctrl.yaw   = Math.atan2(-this._cam.position.x, -this._cam.position.z);
      this._ctrl.pitch = -0.08;
    }
    if (b)   b.textContent = '⊹ FPS';
    if (tip) tip.textContent = '🖱 Drag to look · WASD walk · Click ⊹FPS again to lock mouse';
    this._posCamera();
  }
  toggleJson() {
    const jp = document.getElementById(this._id + '-jp'); if (!jp) return;
    const on = jp.style.display === 'none';
    jp.style.display = on ? 'flex' : 'none';
    const b = document.getElementById(this._id + '-btnJ');
    if (b) b.className = 'r3-btn'+(on?' on':'');
    if (on) this.exportJson();
  }
  exportJson() {
    const ta = document.getElementById(this._id + '-jta');
    if (ta) ta.value = JSON.stringify(this._room, null, 2);
  }
  applyJson() {
    const ta = document.getElementById(this._id + '-jta');
    const je = document.getElementById(this._id + '-je');
    if (!ta) return;
    try {
      const p = JSON.parse(ta.value);
      if (je) je.textContent = '';
      // Accept either room or rack
      if (Array.isArray(p.racks)) this.setRoomData(p);
      else if (Array.isArray(p.rack?.devices)) this.setData(p.rack);
      else if (Array.isArray(p.devices)) this.setData(p);
      else throw new Error("Missing 'racks' or 'devices' key");
    } catch (e) {
      if (je) je.textContent = '⚠ ' + e.message;
    }
  }
  _toggleLegend() {
    const lb = document.getElementById(this._id + '-legend');
    if (lb) lb.style.display = lb.style.display === 'none' ? 'block' : 'none';
  }

  _switchTab(tabId) {
    ['cat','um'].forEach(t => {
      const btn  = document.getElementById(this._id + '-tab-' + t);
      const body = document.getElementById(this._id + '-tab-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
    const addBtn = document.getElementById(this._id + '-tab-cat-add');
    if (addBtn) addBtn.style.display = tabId === 'cat' ? '' : 'none';
  }

  // ─── Room / Lighting live config ─────────────────────────
  _setRoom(field, value) {
    this._opts.room[field] = value;
    if (field === 'fogNear' || field === 'fogFar') {
      if (this._scene?.fog) {
        this._scene.fog.near = this._opts.room.fogNear;
        this._scene.fog.far  = this._opts.room.fogFar;
      }
    } else if (this._scene && this._geometryManager) {
      this._buildEnvironment();
    }
  }

  _setLight(field, value) {
    this._opts.lighting[field] = value;
    if (field === 'exposure' && this._ren) {
      this._ren.toneMappingExposure = value;
    } else if (this._scene && this._geometryManager) {
      this._buildEnvironment();
    }
  }

  // ─── Rack drag helpers ────────────────────────────────────
  _raycastFloor(clientX, clientY, cv) {
    const T = this._T3;
    if (!T || !this._cam) return null;
    const rect = cv.getBoundingClientRect();
    const mx = ((clientX - rect.left) / cv.clientWidth) * 2 - 1;
    const my = -((clientY - rect.top) / cv.clientHeight) * 2 + 1;
    const raycaster = new T.Raycaster();
    raycaster.setFromCamera(new T.Vector2(mx, my), this._cam);
    const floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    const hit = new T.Vector3();
    const ok = raycaster.ray.intersectPlane(floorPlane, hit);
    return ok ? hit : null;
  }

  _snapRackPos(x, z) {
    const ro = this._opts.room;
    const wallHW  = ro.width / 2;
    const wallHD  = ro.depth / 2;
    const sceneCZ = 2;
    const rackHW  = this._opts.rack.width / 2;
    const rackHD  = this._opts.rack.depth / 2;
    const snapDist = 1.2;
    let sx = x, sz = z;
    if (Math.abs(x - (-wallHW + rackHW)) < snapDist) sx = -wallHW + rackHW;
    else if (Math.abs(x - (wallHW - rackHW)) < snapDist) sx = wallHW - rackHW;
    if (Math.abs(z - (sceneCZ - wallHD + rackHD)) < snapDist) sz = sceneCZ - wallHD + rackHD;
    else if (Math.abs(z - (sceneCZ + wallHD - rackHD)) < snapDist) sz = sceneCZ + wallHD - rackHD;
    return { x: sx, z: sz };
  }

  // ─── Panel system ─────────────────────────────────────────
  _onPanelDragStart(event, panelId) {
    event.dataTransfer.setData('text/plain', panelId);
    event.dataTransfer.effectAllowed = 'move';
    const el = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
    if (el) el.classList.add('r3-panel-dragging');
  }

  _onPanelDragEnd() {
    document.querySelectorAll(`#${this._id} .r3-panel-dragging`).forEach(el => el.classList.remove('r3-panel-dragging'));
    document.querySelectorAll(`#${this._id} .r3-panel-drop-before`).forEach(el => el.classList.remove('r3-panel-drop-before'));
  }

  _onPanelDragOverPanel(event, panelId) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelectorAll(`#${this._id} .r3-panel-drop-before`).forEach(el => el.classList.remove('r3-panel-drop-before'));
    const el = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
    if (el) el.classList.add('r3-panel-drop-before');
  }

  _onPanelDropPanel(event, targetPanelId) {
    event.preventDefault();
    event.stopPropagation();
    const panelId = event.dataTransfer.getData('text/plain');
    if (panelId === targetPanelId) return;
    const movingPanel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
    const targetPanel = document.querySelector(`#${this._id} [data-panel-id="${targetPanelId}"]`);
    if (!movingPanel || !targetPanel) return;
    targetPanel.parentNode.insertBefore(movingPanel, targetPanel);
    document.querySelectorAll(`#${this._id} .r3-panel-drop-before`).forEach(el => el.classList.remove('r3-panel-drop-before'));
    this._savePanelState();
  }

  _onPanelDropSidebar(event, sidebar) {
    event.preventDefault();
    const panelId = event.dataTransfer.getData('text/plain');
    const panel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
    if (!panel) return;
    const targetSb = document.getElementById(sidebar === 'left' ? this._id + '-sb' : this._id + '-sbr');
    if (!targetSb) return;
    // Insert before cat-edit-wrap if present, otherwise append
    const catWrap = targetSb.querySelector(`#${this._id}-cat-edit-wrap`);
    if (catWrap) targetSb.insertBefore(panel, catWrap);
    else targetSb.appendChild(panel);
    document.querySelectorAll(`#${this._id} .r3-panel-drop-before`).forEach(el => el.classList.remove('r3-panel-drop-before'));
    this._savePanelState();
  }

  _togglePanel(panelId) {
    const panel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
    if (panel) { panel.classList.toggle('r3-collapsed'); this._savePanelState(); }
  }

  _savePanelState() {
    try {
      const leftSb  = document.getElementById(this._id + '-sb');
      const rightSb = document.getElementById(this._id + '-sbr');
      const leftPanels  = leftSb  ? Array.from(leftSb.querySelectorAll(':scope > .r3-panel')).map(p => p.dataset.panelId)  : [];
      const rightPanels = rightSb ? Array.from(rightSb.querySelectorAll(':scope > .r3-panel')).map(p => p.dataset.panelId) : [];
      const collapsed = {};
      document.querySelectorAll(`#${this._id} .r3-panel.r3-collapsed`).forEach(p => {
        if (p.dataset.panelId) collapsed[p.dataset.panelId] = true;
      });
      localStorage.setItem('r3d-panels-' + this._id, JSON.stringify({ left: leftPanels, right: rightPanels, collapsed }));
    } catch { /* localStorage may be unavailable */ }
  }

  _restorePanelState() {
    try {
      const saved = JSON.parse(localStorage.getItem('r3d-panels-' + this._id));
      if (!saved) return;
      const leftSb  = document.getElementById(this._id + '-sb');
      const rightSb = document.getElementById(this._id + '-sbr');
      const allPanels = [...(saved.left || []), ...(saved.right || [])];
      allPanels.forEach(panelId => {
        const panel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
        if (!panel) return;
        const inRight = (saved.right || []).includes(panelId);
        const targetSb = inRight ? rightSb : leftSb;
        if (!targetSb) return;
        const catWrap = targetSb.querySelector(`#${this._id}-cat-edit-wrap`);
        if (catWrap) targetSb.insertBefore(panel, catWrap);
        else targetSb.appendChild(panel);
      });
      Object.keys(saved.collapsed || {}).forEach(panelId => {
        const panel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
        if (panel && saved.collapsed[panelId]) panel.classList.add('r3-collapsed');
      });
    } catch { /* ignore */ }
  }
}

Rack3DVisualizer._THREE = null;
Rack3DVisualizer.useThree = function(THREE) { Rack3DVisualizer._THREE = THREE; };
