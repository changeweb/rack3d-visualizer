// ─────────────────────────────────────────────────────────────
//  Rack3DVisualizer — main class
// ─────────────────────────────────────────────────────────────
import { DEFAULT_OPTIONS, mergeOptions } from './options.js';
import { resolveTheme } from './themes.js';
import { DEVICE_TYPES } from './constants.js';
import { buildCSS } from './css.js';
import { buildHTML, customLightRow, roomItemRow, roomItemsPanelBody, groupsPanelBody, vmPanelBody, vmCard, vmPortRow, wallRow, pillarRow } from './html.js';
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
    this._selItemId = null;
    this._dragId    = null;
    this._dragCatId = null;
    this._selCatId  = null;
    this._catCollapsed = {};
    this._showWire   = this._opts.view.wireframe;
    this._showLabels = this._opts.view.showLabels;
    this._mode       = this._opts.view.mode;
    this._selGroupId = null;
    this._multiSel   = new Set();
    this._groupHighlightRings = [];

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
      pos:    this._opts.camera.initialPos ? { ...this._opts.camera.initialPos } : { x: 0, y: 16, z: -26 },
      yaw:    this._opts.camera.initialYaw   ?? 0,
      pitch:  this._opts.camera.initialPitch ?? -0.08,
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

    // Drag / rotate states
    this._rackDragState  = null;
    this._itemDragState  = null;
    this._rotateDragState = null;
    // Transform mode: null | 'move' | 'rotate'
    this._transformMode  = null;

    this._injectStyles();
    this._el.id = this._id;
    this._el.innerHTML = this._buildHTML();
    const themeSel = document.getElementById(this._id + '-theme-sel');
    if (themeSel && typeof this._opts.theme === 'string') themeSel.value = this._opts.theme;
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
    if (!Array.isArray(this._room.catalog))     this._room.catalog    = [...DEFAULT_CATALOG];
    if (!Array.isArray(this._room.racks))       this._room.racks      = [];
    if (!Array.isArray(this._room.room_items))  this._room.room_items = [];
    if (!Array.isArray(this._room.groups))      this._room.groups     = [];
    this._room.room_items.forEach(item => {
      if (!item.id) item.id = 'item-' + Date.now() + Math.random().toString(36).slice(2,6);
    });
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
    this._selItemId = null;
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
      const ip = o.initialPos || { x: 0, y: 16, z: -26 };
      this._ctrl.pos = { ...ip };
      this._ctrl.yaw   = o.initialYaw   ?? 0;
      this._ctrl.pitch = o.initialPitch ?? -0.08;
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
    const json = JSON.stringify({ room: this._room, config: this.getConfig() }, null, 2);
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

    this._geometryManager = new GeometryManager(T, this._scene, rackBuilder, deviceBuilder, envBuilder, this._materialFactory, this._theme);
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
    this._geometryManager?.clearRoomItems();
    this._geometryManager?.clearAllRacks();
    this._rackGroups = {};
    this._devMeshes  = {};
    this._labelPositions = {};
    // Remove group highlight rings
    (this._groupHighlightRings || []).forEach(r => {
      if (r.geometry) r.geometry.dispose();
      if (r.material) r.material.dispose();
      this._scene?.remove(r);
    });
    this._groupHighlightRings = [];
  }

  _buildRack() {
    this._clearRack();
    this._geometryManager.buildAllRacks(this._room, this._opts.rack, this._theme.rack, this._selRackId);

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
    this._buildRoomItems();
    this._renderRoomItems();
    this._buildGroupHighlights();
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
  _openEdit(dev)                { openEdit(this, dev); this._renderVMPanel(dev); }
  _closeEdit()                  { closeEdit(this); this._hideVMPanel(); }
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

      // Transform mode: MOVE or ROTATE — explicit activation required
      if (this._transformMode && !this._ctrl.pointerLocked && this._room) {
        const rect = cv.getBoundingClientRect();
        const hit = this._selectionManager?.raycast(
          e.clientX - rect.left, e.clientY - rect.top, cv.clientWidth, cv.clientHeight
        );
        if (hit) {
          const isRack = hit.type === 'rack' || (hit.rackId && hit.type !== 'item');
          const isItem = hit.type === 'item';

          if (this._transformMode === 'move') {
            const floorHit = this._raycastFloor(e.clientX, e.clientY, cv);
            if (floorHit) {
              if (isRack) {
                const rackId = hit.rackId || hit.id;
                const rack = this._room.racks.find(r => r.id === rackId);
                if (rack) {
                  this._selRackId = rack.id; this._rack = rack;
                  const rg = this._rackGroups[rack.id];
                  const gid = this._selGroupId && this._itemGroupIds(rackId).includes(this._selGroupId) ? this._selGroupId : null;
                  this._rackDragState = { active: true, rackId: rack.id,
                    offsetX: floorHit.x - (rg?.position.x ?? 0),
                    offsetZ: floorHit.z - (rg?.position.z ?? 0),
                    groupId: gid,
                    anchorStartX: rg?.position.x ?? 0, anchorStartZ: rg?.position.z ?? 0,
                    groupStartPos: gid ? this._snapshotGroupPositions(gid) : null,
                    lastRebuild: 0 };
                  cv.style.cursor = 'move'; return;
                }
              } else if (isItem) {
                const item = this._room.room_items?.find(it => it.id === hit.id);
                if (item) {
                  this._selItemId = hit.id;
                  const gid = this._selGroupId && this._itemGroupIds(hit.id).includes(this._selGroupId) ? this._selGroupId : null;
                  this._itemDragState = { active: true, itemId: hit.id,
                    offsetX: floorHit.x - (item.x || 0), offsetZ: floorHit.z - (item.z || 0),
                    groupId: gid,
                    anchorStartX: item.x ?? 0, anchorStartZ: item.z ?? 0,
                    groupStartPos: gid ? this._snapshotGroupPositions(gid) : null,
                    lastRebuild: 0 };
                  cv.style.cursor = 'move'; return;
                }
              }
            }
          } else if (this._transformMode === 'rotate') {
            if (isRack) {
              const rackId = hit.rackId || hit.id;
              const rack = this._room.racks.find(r => r.id === rackId);
              if (rack) {
                this._selRackId = rack.id; this._rack = rack;
                const gid = this._selGroupId && this._itemGroupIds(rackId).includes(this._selGroupId) ? this._selGroupId : null;
                this._rotateDragState = { active: true, type: 'rack', id: rackId,
                  startX: e.clientX, startAngle: rack.facingAngle || 0, lastRebuild: 0,
                  groupId: gid,
                  centroid: gid ? this._groupCentroid(gid) : null,
                  groupStartPos: gid ? this._snapshotGroupPositions(gid) : null,
                  groupStartAngles: gid ? this._snapshotGroupAngles(gid) : null };
                cv.style.cursor = 'ew-resize'; return;
              }
            } else if (isItem) {
              const item = this._room.room_items?.find(it => it.id === hit.id);
              if (item) {
                this._selItemId = hit.id;
                const gid = this._selGroupId && this._itemGroupIds(hit.id).includes(this._selGroupId) ? this._selGroupId : null;
                this._rotateDragState = { active: true, type: 'item', id: hit.id,
                  startX: e.clientX, startAngle: item.angle || 0, lastRebuild: 0,
                  groupId: gid,
                  centroid: gid ? this._groupCentroid(gid) : null,
                  groupStartPos: gid ? this._snapshotGroupPositions(gid) : null,
                  groupStartAngles: gid ? this._snapshotGroupAngles(gid) : null };
                cv.style.cursor = 'ew-resize'; return;
              }
            }
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
      // Rotate drag mode
      if (this._rotateDragState?.active) {
        const deltaX = e.clientX - this._rotateDragState.startX;
        const now = Date.now();
        const ds = this._rotateDragState;
        if (ds.groupId && ds.groupStartPos) {
          const dDeg = deltaX * 0.45;
          this._applyGroupRotationFromSnapshot(ds.groupStartPos, ds.groupStartAngles, ds.centroid, dDeg);
          if (now - ds.lastRebuild > 50) { ds.lastRebuild = now; this._buildRack(); }
        } else if (ds.type === 'rack') {
          const rack = this._room?.racks.find(r => r.id === ds.id);
          if (rack) {
            rack.facingAngle = ds.startAngle + deltaX * 0.008;
            if (now - ds.lastRebuild > 50) { ds.lastRebuild = now; this._buildRack(); }
          }
        } else {
          const item = this._room?.room_items?.find(it => it.id === ds.id);
          if (item) {
            item.angle = ds.startAngle + deltaX * 0.45;
            if (now - ds.lastRebuild > 50) {
              ds.lastRebuild = now;
              this._geometryManager?.clearRoomItems();
              this._geometryManager?.buildRoomItems(this._room?.room_items || []);
            }
          }
        }
        return;
      }

      // Item drag mode
      if (this._itemDragState?.active) {
        const floorHit = this._raycastFloor(e.clientX, e.clientY, cv);
        if (floorHit) {
          const ds = this._itemDragState;
          const newX = floorHit.x - ds.offsetX;
          const newZ = floorHit.z - ds.offsetZ;
          const now = Date.now();
          if (ds.groupId && ds.groupStartPos) {
            this._applyGroupDeltaFromSnapshot(ds.groupStartPos, newX - ds.anchorStartX, newZ - ds.anchorStartZ);
            if (now - ds.lastRebuild > 50) { ds.lastRebuild = now; this._buildRack(); }
          } else {
            const item = this._room?.room_items?.find(it => it.id === ds.itemId);
            if (item) {
              item.x = newX; item.z = newZ;
              if (now - ds.lastRebuild > 50) {
                ds.lastRebuild = now;
                this._geometryManager?.clearRoomItems();
                this._geometryManager?.buildRoomItems(this._room?.room_items || []);
              }
            }
          }
        }
        return;
      }

      // Rack drag mode
      if (this._rackDragState?.active) {
        const floorHit = this._raycastFloor(e.clientX, e.clientY, cv);
        if (floorHit) {
          const ds = this._rackDragState;
          const now = Date.now();
          if (ds.groupId && ds.groupStartPos) {
            const newX = floorHit.x - ds.offsetX;
            const newZ = floorHit.z - ds.offsetZ;
            this._applyGroupDeltaFromSnapshot(ds.groupStartPos, newX - ds.anchorStartX, newZ - ds.anchorStartZ);
            if (now - ds.lastRebuild > 50) { ds.lastRebuild = now; this._buildRack(); }
          } else {
            const rack = this._room?.racks.find(r => r.id === ds.rackId);
            if (rack) {
              let nx = floorHit.x - ds.offsetX;
              let nz = floorHit.z - ds.offsetZ;
              const snapped = this._snapRackPos(nx, nz);
              nx = snapped.x; nz = snapped.z;
              const ro = this._opts.room;
              const rHW = this._opts.rack.width / 2, rHD = this._opts.rack.depth / 2;
              nx = Math.max(-ro.width/2 + rHW, Math.min(ro.width/2 - rHW, nx));
              nz = Math.max(2 - ro.depth/2 + rHD, Math.min(2 + ro.depth/2 - rHD, nz));
              rack.position = { x: nx, y: rack.position?.y ?? 0, z: nz };
              if (now - ds.lastRebuild > 50) { ds.lastRebuild = now; this._buildRack(); }
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
      // Finalize rotate drag
      if (this._rotateDragState?.active) {
        const wasRack = this._rotateDragState.type === 'rack';
        this._rotateDragState = null;
        cv.style.cursor = 'crosshair';
        if (wasRack) { this._buildRack(); this._refresh(); }
        else { this._buildRoomItems(); this._renderRoomItems(); }
        return;
      }

      // Finalize item drag
      if (this._itemDragState?.active) {
        this._itemDragState = null;
        cv.style.cursor = 'crosshair';
        this._buildRoomItems();
        this._renderRoomItems();
        return;
      }

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

    // Right-click context menu for grouping
    cv.addEventListener('contextmenu', e => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect();
      const result = this._selectionManager?.raycast(
        e.clientX - rect.left, e.clientY - rect.top, cv.clientWidth, cv.clientHeight
      );
      let targetId = null;
      if (result) {
        if (result.type === 'rack') targetId = result.id;
        else if (result.type === 'item') targetId = result.id;
        else if (result.rackId) targetId = result.rackId;
      }
      this._showContextMenu(e, targetId);
    });
    document.addEventListener('mousedown', e => {
      const menu = document.getElementById(this._id + '-ctx-menu');
      if (menu && !menu.contains(e.target)) this._hideContextMenu();
    }, true);

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

    const ctrlKey = e.ctrlKey || e.metaKey;

    if (result?.type === 'device') {
      if (ctrlKey) {
        // Ctrl+click on device does nothing for multi-sel (devices aren't group members directly)
      } else {
        const rack = this._room?.racks.find(r => r.id === result.rackId);
        if (rack) {
          this._selRackId = result.rackId; this._rack = rack;
          this._selId = result.id; this._selItemId = null;
          const dev = rack.devices?.find(d => d.id === this._selId);
          if (dev) { this._openEdit(dev); if (this._opts.onSelect) this._opts.onSelect(dev, rack); }
        }
      }
    } else if (result?.type === 'rack') {
      if (ctrlKey) {
        this._toggleMultiSel(result.id);
        return;
      }
      const rack = this._room?.racks.find(r => r.id === result.id);
      if (rack) { this._selRackId = result.id; this._rack = rack; }
      this._selId = null; this._selItemId = null; this._closeEdit();
    } else if (result?.type === 'item') {
      if (ctrlKey) {
        this._toggleMultiSel(result.id);
        return;
      }
      this._selItemId = result.id;
      this._selId = null; this._closeEdit();
    } else {
      this._selItemId = null;
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
    let lastSelId = null, lastSelRackId = null, lastSelItemId = null;
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

      const selChange  = this._selId !== lastSelId || this._selRackId !== lastSelRackId || this._selItemId !== lastSelItemId;
      const camChange  = this._ctrl.az !== lastAz || this._ctrl.el !== lastEl || this._ctrl.r !== lastR
                      || this._ctrl.pos.x !== lastPosX || this._ctrl.pos.y !== lastPosY || this._ctrl.pos.z !== lastPosZ
                      || this._ctrl.yaw !== lastYaw || this._ctrl.pitch !== lastPitch;
      const fpsMoving  = this._ctrl.mode === 'fps' && Object.values(this._ctrl.keys).some(Boolean);
      const dirty      = this._ctrl.drag || fpsMoving || this._opts.view.autoRotate || selChange || camChange;

      if (camChange || fpsMoving) this._posCamera();

      const interval = dirty ? MS_ACTIVE : MS_IDLE;
      if (now - lastTime < interval) return;
      lastTime = now;
      lastSelId = this._selId; lastSelRackId = this._selRackId; lastSelItemId = this._selItemId;
      lastAz = this._ctrl.az; lastEl = this._ctrl.el; lastR = this._ctrl.r;
      lastPosX = this._ctrl.pos.x; lastPosY = this._ctrl.pos.y; lastPosZ = this._ctrl.pos.z;
      lastYaw  = this._ctrl.yaw;   lastPitch = this._ctrl.pitch;

      this._tick++;

      // Pulse only on change — not every frame — so idle renders stay truly idle
      if (selChange) {
        Object.entries(this._devMeshes).forEach(([id, m]) => {
          if (m?.material) m.material.emissiveIntensity = id === this._selId ? 3.0 : 0.55;
        });
        // Highlight selected room item
        if (this._geometryManager?.itemGroups) {
          Object.entries(this._geometryManager.itemGroups).forEach(([id, group]) => {
            const sel = id === this._selItemId;
            group.traverse(obj => {
              if (obj.isMesh && obj.material && !obj.userData.itemLabel && obj.material.emissive) {
                obj.material.emissiveIntensity = sel ? 1.8 : (obj.material._baseEmissive ?? obj.material.emissiveIntensity);
              }
            });
          });
        }
      } else if (dirty && this._selId) {
        const m = this._devMeshes[this._selId];
        if (m?.material) m.material.emissiveIntensity = 3.0 + 0.8 * Math.sin(this._tick * 0.15);
      } else if (dirty && this._selItemId) {
        const group = this._geometryManager?.itemGroups?.[this._selItemId];
        if (group) {
          group.traverse(obj => {
            if (obj.isMesh && obj.material?.emissive && !obj.userData.itemLabel) {
              obj.material.emissiveIntensity = 1.5 + 0.5 * Math.sin(this._tick * 0.15);
            }
          });
        }
      }

      this._ren.render(this._scene, this._cam);

      // Labels are CSS divs projected from 3D — only update when camera or selection moves
      if (camChange || selChange || fpsMoving) this._updateLabels();
      this._updateCompass();
      if (camChange || fpsMoving) this._updateAxisGizmo();
    };
    requestAnimationFrame(loop);
  }

  invalidate() { this._tick++; }

  _bindSidebarEvents() {
    if (!window._r3) window._r3 = {};
    window._r3[this._id] = this;
    this._bindSidebarResize();
  }

  _bindSidebarResize() {
    const bindHandle = (handleId, sbId, isLeft) => {
      const handle = document.getElementById(handleId);
      if (!handle) return;
      handle.addEventListener('mousedown', startE => {
        startE.preventDefault();
        const sb = document.getElementById(sbId);
        if (!sb) return;
        const startX = startE.clientX;
        const startW = sb.clientWidth;
        handle.classList.add('r3-resizing');
        const onMove = e => {
          const delta = isLeft ? (e.clientX - startX) : (startX - e.clientX);
          const newW  = Math.max(160, Math.min(520, startW + delta));
          sb.style.width    = newW + 'px';
          sb.style.minWidth = newW + 'px';
          if (isLeft) this._opts.sidebar.leftWidth  = newW;
          else        this._opts.sidebar.rightWidth = newW;
        };
        const onUp = () => {
          handle.classList.remove('r3-resizing');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup',   onUp);
          this._savePanelState();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
      });
    };
    bindHandle(this._id + '-sb-handle',  this._id + '-sb',  true);
    bindHandle(this._id + '-sbr-handle', this._id + '-sbr', false);
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
  getConfig() {
    const sb = this._opts.sidebar;
    return {
      theme: typeof this._opts.theme === 'string' ? this._opts.theme : 'dark',
      sidebar: {
        showLeft:     sb.showLeft,
        showRight:    sb.showRight,
        leftWidth:    sb.leftWidth,
        rightWidth:   sb.rightWidth,
        panelLayout:  sb.panelLayout,
        roomFields:   sb.roomFields,
        lightingFields: sb.lightingFields,
      },
      lighting: {
        customLights: this._opts.lighting.customLights || [],
      },
    };
  }

  exportJson() {
    const ta = document.getElementById(this._id + '-jta');
    if (ta) ta.value = JSON.stringify({ room: this._room, config: this.getConfig() }, null, 2);
  }

  applyJson() {
    const ta = document.getElementById(this._id + '-jta');
    const je = document.getElementById(this._id + '-je');
    if (!ta) return;
    try {
      const p = JSON.parse(ta.value);
      if (je) je.textContent = '';

      // New format: { room: {...}, config: {...} }
      if (p.room && Array.isArray(p.room.racks)) {
        this.setRoomData(p.room);
        if (p.config) this._applyConfig(p.config);
      } else if (Array.isArray(p.racks)) {
        this.setRoomData(p);
      } else if (Array.isArray(p.rack?.devices)) {
        this.setData(p.rack);
      } else if (Array.isArray(p.devices)) {
        this.setData(p);
      } else {
        throw new Error("Missing 'racks' or 'devices' key");
      }
    } catch (e) {
      if (je) je.textContent = '⚠ ' + e.message;
    }
  }

  _applyConfig(cfg) {
    if (!cfg) return;
    const { sidebar, lighting } = cfg;
    if (cfg.theme) this._onThemeChange(cfg.theme);
    if (sidebar) {
      if (sidebar.leftWidth  !== undefined) {
        this._opts.sidebar.leftWidth = sidebar.leftWidth;
        const el = document.getElementById(this._id + '-sb');
        if (el) { el.style.width = sidebar.leftWidth + 'px'; el.style.minWidth = sidebar.leftWidth + 'px'; }
      }
      if (sidebar.rightWidth !== undefined) {
        this._opts.sidebar.rightWidth = sidebar.rightWidth;
        const el = document.getElementById(this._id + '-sbr');
        if (el) { el.style.width = sidebar.rightWidth + 'px'; el.style.minWidth = sidebar.rightWidth + 'px'; }
      }
      if (sidebar.showLeft !== undefined && sidebar.showLeft !== this._opts.sidebar.showLeft) this._toggleSidebarLeft();
      if (sidebar.showRight !== undefined && sidebar.showRight !== this._opts.sidebar.showRight) this._toggleSidebarRight();
      if (sidebar.panelLayout) { this._opts.sidebar.panelLayout = sidebar.panelLayout; this._restorePanelState(); }
    }
    if (lighting?.customLights) {
      this._opts.lighting.customLights = lighting.customLights;
      this._buildEnvironment();
      this._renderCustomLights();
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

  // ─── Sidebar toggle & visibility ─────────────────────────
  _toggleSidebarLeft() {
    this._opts.sidebar.showLeft = !this._opts.sidebar.showLeft;
    const on     = this._opts.sidebar.showLeft;
    const sb     = document.getElementById(this._id + '-sb');
    const handle = document.getElementById(this._id + '-sb-handle');
    const btn    = document.getElementById(this._id + '-btnSbL');
    if (sb)     sb.style.display     = on ? 'flex' : 'none';
    if (handle) handle.style.display = on ? 'flex' : 'none';
    if (btn)    btn.className        = 'r3-sb-toggle' + (on ? ' on' : '');
    this._savePanelState();
    setTimeout(() => this._onResize?.(), 50);
  }

  _toggleSidebarRight() {
    this._opts.sidebar.showRight = !this._opts.sidebar.showRight;
    const on     = this._opts.sidebar.showRight;
    const sb     = document.getElementById(this._id + '-sbr');
    const handle = document.getElementById(this._id + '-sbr-handle');
    const btn    = document.getElementById(this._id + '-btnSbR');
    if (sb)     sb.style.display     = on ? 'flex' : 'none';
    if (handle) handle.style.display = on ? 'flex' : 'none';
    if (btn)    btn.className        = 'r3-sb-toggle' + (on ? ' on' : '');
    this._savePanelState();
    setTimeout(() => this._onResize?.(), 50);
  }

  // ─── Custom lights ────────────────────────────────────────
  _addCustomLight() {
    if (!this._opts.lighting.customLights) this._opts.lighting.customLights = [];
    this._opts.lighting.customLights.push({ type: 'point', x: 0, y: 10, z: 0, intensity: 5, color: '#ffffff' });
    this._buildEnvironment();
    this._renderCustomLights();
  }

  _editCustomLight(idx, field, value) {
    const cl = this._opts.lighting.customLights?.[idx];
    if (!cl) return;
    cl[field] = value;
    this._buildEnvironment();
  }

  _removeCustomLight(idx) {
    this._opts.lighting.customLights?.splice(idx, 1);
    this._buildEnvironment();
    this._renderCustomLights();
  }

  _renderCustomLights() {
    const el = document.getElementById(this._id + '-custom-lights');
    if (!el) return;
    const sid = this._id;
    el.innerHTML = (this._opts.lighting.customLights || [])
      .map((cl, i) => customLightRow(sid, cl, i)).join('');
  }

  _setRackOpt(field, value) {
    this._opts.rack[field] = value;
    this._buildRack();
  }

  // ─── Compass ──────────────────────────────────────────────
  _updateCompass() {
    const needle = document.getElementById(this._id + '-needle');
    const nLabel = document.getElementById(this._id + '-compass-n');
    if (!needle) return;
    // In FPS mode use yaw (yaw=0 = +Z = North); in orbit use az-π (az=π = North)
    const heading = this._ctrl.mode === 'fps'
      ? this._ctrl.yaw
      : (this._ctrl.az ?? 0) - Math.PI;
    needle.style.transform = `rotate(${heading}rad)`;
    if (nLabel) {
      const norm = ((heading % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const facingNorth = norm < 0.35 || norm > (2 * Math.PI - 0.35);
      nLabel.style.color = facingNorth ? '#00ff88' : '';
      nLabel.style.textShadow = facingNorth ? '0 0 8px #00ff8888' : '';
    }
  }

  // ─── Axis gizmo ───────────────────────────────────────────
  _updateAxisGizmo() {
    const canvas = document.getElementById(this._id + '-axis-gizmo');
    if (!canvas || !this._cam) return;
    const ctx = canvas.getContext('2d');
    const W = 64, H = 64, cx = 32, cy = 36, r = 22;
    ctx.clearRect(0, 0, W, H);
    this._cam.updateMatrixWorld();
    const me = this._cam.matrixWorldInverse.elements;
    const axes = [
      { label: 'X', color: '#ff4444', vx: 1, vy: 0, vz: 0 },
      { label: 'Y', color: '#44dd66', vx: 0, vy: 1, vz: 0 },
      { label: 'Z', color: '#4488ff', vx: 0, vy: 0, vz: 1 },
    ];
    const projected = axes.map(a => {
      const x = me[0]*a.vx + me[4]*a.vy + me[8]*a.vz;
      const y = me[1]*a.vx + me[5]*a.vy + me[9]*a.vz;
      const z = me[2]*a.vx + me[6]*a.vy + me[10]*a.vz;
      return { ...a, x2d: cx + x*r, y2d: cy - y*r, depth: z };
    });
    projected.sort((a, b) => b.depth - a.depth);
    projected.forEach(a => {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(a.x2d, a.y2d);
      ctx.strokeStyle = a.color; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.x2d, a.y2d, 3, 0, Math.PI * 2);
      ctx.fillStyle = a.color; ctx.fill();
      ctx.fillStyle = a.color; ctx.font = 'bold 9px monospace';
      ctx.fillText(a.label, a.x2d + (a.x2d - cx) * 0.28, a.y2d + (a.y2d - cy) * 0.28 + 3);
    });
  }

  // ─── Room panel tabs ──────────────────────────────────────
  _switchRoomTab(tabId) {
    ['racks','layout','walls','pillars'].forEach(t => {
      const btn  = document.getElementById(this._id + '-rtab-' + t);
      const body = document.getElementById(this._id + '-rtab-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
  }

  // ─── Transform mode ───────────────────────────────────────
  _setTransformMode(mode) {
    this._transformMode = this._transformMode === mode ? null : mode;
    const btnM = document.getElementById(this._id + '-btnMove');
    const btnR = document.getElementById(this._id + '-btnRotate');
    if (btnM) btnM.className = 'r3-btn' + (this._transformMode === 'move'   ? ' on' : '');
    if (btnR) btnR.className = 'r3-btn' + (this._transformMode === 'rotate' ? ' on' : '');
  }

  // ─── Rack properties tabs ─────────────────────────────────
  _switchRackPropTab(tabId) {
    ['config','position','nameplate'].forEach(t => {
      const btn  = document.getElementById(this._id + '-rpt-' + t);
      const body = document.getElementById(this._id + '-rpt-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
  }

  // ─── Edit device tabs ─────────────────────────────────────
  _switchEditDevTab(tabId) {
    ['properties','style','network'].forEach(t => {
      const btn  = document.getElementById(this._id + '-edt-' + t);
      const body = document.getElementById(this._id + '-edt-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
  }

  _switchLightTab(tabId) {
    ['scene','overhead','custom'].forEach(t => {
      const btn  = document.getElementById(this._id + '-lt-' + t);
      const body = document.getElementById(this._id + '-lt-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
  }

  _onThemeChange(name) {
    this._opts.theme = name;
    this.setTheme(name);
    const sel = document.getElementById(this._id + '-theme-sel');
    if (sel) sel.value = name;
  }

  toggleHelp() {
    const el = document.getElementById(this._id + '-help-modal');
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  _switchHelpTab(tabId) {
    ['controls','help','about'].forEach(t => {
      const btn  = document.getElementById(this._id + '-ht-' + t);
      const body = document.getElementById(this._id + '-ht-body-' + t);
      const on = t === tabId;
      if (btn)  btn.className  = 'r3-tab' + (on ? ' active' : '');
      if (body) body.style.display = on ? '' : 'none';
    });
  }

  // ─── Layout control ───────────────────────────────────────
  _setLayout(field, value) {
    if (!this._room) return;
    if (!this._room.layout) this._room.layout = {};
    this._room.layout[field] = value;
    this._buildRack();
  }

  // ─── Room name ────────────────────────────────────────────
  _setRoomName(name) {
    if (this._room) this._room.name = name;
    const span = document.getElementById(this._id + '-room-name');
    if (span) span.textContent = name;
    const inp = document.getElementById(this._id + '-room-name-inp');
    if (inp && inp !== document.activeElement) inp.value = name;
  }

  // ─── Groups ───────────────────────────────────────────────
  _groupsArr() { return this._room?.groups || []; }

  _groupMembersFlat(groupId) {
    const grp = this._groupsArr().find(g => g.id === groupId);
    if (!grp) return [];
    const result = [];
    for (const mid of grp.members) {
      if (this._groupsArr().find(g => g.id === mid)) result.push(...this._groupMembersFlat(mid));
      else result.push(mid);
    }
    return result;
  }

  _itemGroupIds(id) {
    return this._groupsArr().filter(g => g.members.includes(id)).map(g => g.id);
  }

  _autoUngroup(id) {
    if (!this._room?.groups) return;
    this._room.groups.forEach(g => {
      g.members = g.members.filter(m => m !== id);
    });
    this._room.groups = this._room.groups.filter(g => g.members.length > 0);
    this._refreshGroupPanel();
  }

  _createGroup(name) {
    if (this._multiSel.size < 2) { alert('Select at least 2 items first'); return; }
    const id = 'grp-' + Date.now().toString(36);
    this._room.groups.push({ id, name: name || 'Group ' + (this._groupsArr().length), members: [...this._multiSel] });
    this._multiSel.clear();
    this._selGroupId = id;
    this._refreshGroupPanel();
    this._buildRack();
  }

  _disbandGroup(groupId) {
    this._room.groups = this._room.groups.filter(g => g.id !== groupId);
    if (this._selGroupId === groupId) this._selGroupId = null;
    this._refreshGroupPanel();
    this._buildRack();
  }

  _addMemberToGroup(groupId, memberId) {
    const grp = this._groupsArr().find(g => g.id === groupId);
    if (!grp) return;
    if (!grp.members.includes(memberId)) grp.members.push(memberId);
    this._refreshGroupPanel();
  }

  _removeMemberFromGroup(groupId, memberId) {
    const grp = this._groupsArr().find(g => g.id === groupId);
    if (!grp) return;
    grp.members = grp.members.filter(m => m !== memberId);
    if (grp.members.length === 0) this._disbandGroup(groupId);
    else this._refreshGroupPanel();
  }

  _renameGroup(groupId, name) {
    const grp = this._groupsArr().find(g => g.id === groupId);
    if (grp) grp.name = name;
    this._refreshGroupPanel();
  }

  _toggleMultiSel(id) {
    if (this._multiSel.has(id)) this._multiSel.delete(id);
    else this._multiSel.add(id);
    this._refreshGroupPanel();
    this._buildRack();
  }

  _selectGroup(groupId) {
    this._selGroupId = groupId;
    this._multiSel.clear();
    this._refreshGroupPanel();
    this._buildRack();
  }

  _groupCentroid(groupId) {
    const ids = this._groupMembersFlat(groupId);
    let x = 0, z = 0, count = 0;
    for (const id of ids) {
      const item = (this._room.room_items || []).find(i => i.id === id);
      if (item) { x += item.x ?? 0; z += item.z ?? 0; count++; continue; }
      const rack = (this._room.racks || []).find(r => r.id === id);
      if (rack) {
        const rg = this._geometryManager?.rackGroups[id];
        if (rg) { x += rg.position.x; z += rg.position.z; count++; }
      }
    }
    return count > 0 ? { x: x / count, z: z / count } : { x: 0, z: 0 };
  }

  _moveGroupDelta(groupId, dx, dz) {
    const ids = this._groupMembersFlat(groupId);
    for (const id of ids) {
      const item = (this._room.room_items || []).find(i => i.id === id);
      if (item) { item.x = (item.x ?? 0) + dx; item.z = (item.z ?? 0) + dz; continue; }
      const rack = (this._room.racks || []).find(r => r.id === id);
      if (rack) {
        const rg = this._geometryManager?.rackGroups[id];
        if (rg) {
          rack.position = { x: rg.position.x + dx, y: rg.position.y, z: rg.position.z + dz };
        }
      }
    }
    this._buildRack();
  }

  _rotateGroupDelta(groupId, dDeg) {
    const c = this._groupCentroid(groupId);
    const rad = dDeg * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const ids = this._groupMembersFlat(groupId);
    for (const id of ids) {
      const item = (this._room.room_items || []).find(i => i.id === id);
      if (item) {
        const dx = (item.x ?? 0) - c.x, dz = (item.z ?? 0) - c.z;
        item.x = c.x + dx * cos - dz * sin;
        item.z = c.z + dx * sin + dz * cos;
        item.angle = ((item.angle ?? 0) + dDeg + 360) % 360;
        continue;
      }
      const rack = (this._room.racks || []).find(r => r.id === id);
      if (rack) {
        const rg = this._geometryManager?.rackGroups[id];
        if (!rg) continue;
        const dx = rg.position.x - c.x, dz = rg.position.z - c.z;
        const nx = c.x + dx * cos - dz * sin, nz = c.z + dx * sin + dz * cos;
        rack.position = { x: nx, y: rg.position.y, z: nz };
        rack.facingAngle = (rack.facingAngle || 0) + rad;
      }
    }
    this._buildRack();
  }

  _snapshotGroupPositions(groupId) {
    const snap = {};
    this._groupMembersFlat(groupId).forEach(id => {
      const item = (this._room?.room_items || []).find(i => i.id === id);
      if (item) { snap[id] = { x: item.x ?? 0, z: item.z ?? 0, isItem: true }; return; }
      const rg = this._geometryManager?.rackGroups[id];
      if (rg) snap[id] = { x: rg.position.x, y: rg.position.y, z: rg.position.z, isRack: true };
    });
    return snap;
  }

  _snapshotGroupAngles(groupId) {
    const snap = {};
    this._groupMembersFlat(groupId).forEach(id => {
      const item = (this._room?.room_items || []).find(i => i.id === id);
      if (item) { snap[id] = { angle: item.angle ?? 0, isItem: true }; return; }
      const rack = (this._room?.racks || []).find(r => r.id === id);
      if (rack) snap[id] = { angle: rack.facingAngle ?? 0, isRack: true };
    });
    return snap;
  }

  _applyGroupDeltaFromSnapshot(posSnap, dx, dz) {
    for (const [id, pos] of Object.entries(posSnap)) {
      if (pos.isItem) {
        const item = (this._room?.room_items || []).find(i => i.id === id);
        if (item) { item.x = pos.x + dx; item.z = pos.z + dz; }
      } else if (pos.isRack) {
        const rack = (this._room?.racks || []).find(r => r.id === id);
        if (rack) rack.position = { x: pos.x + dx, y: pos.y ?? 0, z: pos.z + dz };
      }
    }
  }

  _applyGroupRotationFromSnapshot(posSnap, angleSnap, centroid, dDeg) {
    const rad = dDeg * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    for (const [id, pos] of Object.entries(posSnap)) {
      const dx = pos.x - centroid.x, dz = pos.z - centroid.z;
      const nx = centroid.x + dx * cos - dz * sin;
      const nz = centroid.z + dx * sin + dz * cos;
      const startAngle = angleSnap[id]?.angle ?? 0;
      if (pos.isItem) {
        const item = (this._room?.room_items || []).find(i => i.id === id);
        if (item) { item.x = nx; item.z = nz; item.angle = startAngle + dDeg; }
      } else if (pos.isRack) {
        const rack = (this._room?.racks || []).find(r => r.id === id);
        if (rack) { rack.position = { x: nx, y: pos.y ?? 0, z: nz }; rack.facingAngle = startAngle + rad; }
      }
    }
  }

  // ─── Context menu ─────────────────────────────────────────
  _showContextMenu(e, targetId) {
    const menu = document.getElementById(this._id + '-ctx-menu');
    if (!menu) return;
    menu.innerHTML = '';

    const addItem = (label, cb) => {
      const d = document.createElement('div');
      d.className = 'r3-ctx-item';
      d.textContent = label;
      d.onclick = () => { menu.style.display = 'none'; cb(); };
      menu.appendChild(d);
    };
    const addSep = () => {
      const d = document.createElement('div');
      d.className = 'r3-ctx-sep';
      menu.appendChild(d);
    };

    const groups = this._groupsArr();
    const hasMultiSel = this._multiSel.size >= 2;
    const itemGroupIds = targetId ? this._itemGroupIds(targetId) : [];

    if (hasMultiSel) {
      if (targetId && !this._multiSel.has(targetId)) {
        addItem(`⊞ Group with ${this._multiSel.size} selected`, () => {
          this._multiSel.add(targetId);
          this._createGroup();
        });
      } else {
        addItem(`⊞ Group ${this._multiSel.size} selected`, () => this._createGroup());
      }
      addItem('✕ Clear selection', () => { this._multiSel.clear(); this._refreshGroupPanel(); this._buildRack(); });
      if (targetId) addSep();
    }

    if (targetId) {
      const inGroups = groups.filter(g => g.members.includes(targetId));
      const notInGroups = groups.filter(g => !g.members.includes(targetId));

      if (!hasMultiSel) {
        addItem('⊞ Create group with this', () => {
          const id = 'grp-' + Date.now().toString(36);
          if (!this._room.groups) this._room.groups = [];
          this._room.groups.push({ id, name: 'Group ' + (this._groupsArr().length), members: [targetId] });
          this._selGroupId = id;
          this._refreshGroupPanel();
          this._buildRack();
        });
      }

      notInGroups.forEach(grp => {
        addItem(`Add to "${grp.name}"`, () => this._addMemberToGroup(grp.id, targetId));
      });

      if (itemGroupIds.length > 0) {
        addSep();
        inGroups.forEach(grp => {
          addItem(`Remove from "${grp.name}"`, () => this._removeMemberFromGroup(grp.id, targetId));
          addItem(`Disband "${grp.name}"`, () => this._disbandGroup(grp.id));
        });
      }
    }

    if (menu.children.length === 0) return;
    const vW = window.innerWidth, vH = window.innerHeight;
    const mW = 180, mH = menu.children.length * 28;
    menu.style.left = Math.min(e.clientX, vW - mW - 8) + 'px';
    menu.style.top  = Math.min(e.clientY, vH - mH - 8) + 'px';
    menu.style.display = 'block';
  }

  _hideContextMenu() {
    const menu = document.getElementById(this._id + '-ctx-menu');
    if (menu) menu.style.display = 'none';
  }

  _refreshGroupPanel() {
    const el = document.getElementById(this._id + '-panel-groups');
    if (el) el.innerHTML = groupsPanelBody(this);
    const el2 = document.getElementById(this._id + '-panel-roomItems');
    if (el2) el2.innerHTML = roomItemsPanelBody(this);
  }

  _buildGroupHighlights() {
    if (!this._scene || !this._T3) return;
    const T = this._T3;
    const highlightIds = new Set();
    if (this._selGroupId) {
      this._groupMembersFlat(this._selGroupId).forEach(id => highlightIds.add(id));
    }
    this._multiSel.forEach(id => highlightIds.add(id));
    if (highlightIds.size === 0) return;

    for (const id of highlightIds) {
      const isMultiSel = this._multiSel.has(id) && !this._selGroupId;
      const color = isMultiSel ? 0xffaa00 : 0x00aaff;
      const item = (this._room?.room_items || []).find(i => i.id === id);
      let px = 0, pz = 0;
      if (item) { px = item.x ?? 0; pz = item.z ?? 0; }
      else {
        const rg = this._geometryManager?.rackGroups[id];
        if (rg) { px = rg.position.x; pz = rg.position.z; }
        else continue;
      }
      const mat = new T.MeshStandardMaterial({ color, emissive: new T.Color(color), emissiveIntensity: 1.5, transparent: true, opacity: 0.7 });
      const geo = new T.TorusGeometry(1.2, 0.05, 8, 32);
      const ring = new T.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 0.05, pz);
      ring.userData.r3GroupRing = true;
      this._scene.add(ring);
      this._groupHighlightRings.push(ring);
    }
  }

  _removeRack(rackId) {
    if (!this._room) return;
    this._autoUngroup(rackId);
    this._room.racks = this._room.racks.filter(r => r.id !== rackId);
    if (this._selRackId === rackId) { this._selRackId = null; this._rack = null; }
    this._buildRack();
    this._refresh();
  }

  // ─── Wall CRUD ────────────────────────────────────────────
  _addWall() {
    if (!this._room) return;
    if (!Array.isArray(this._room.room_walls)) this._room.room_walls = [];
    const ro = this._opts.room;
    this._room.room_walls.push({
      id: 'wall-' + Date.now(),
      name: 'Wall ' + (this._room.room_walls.length + 1),
      length: ro.width || 20, height: ro.height || 14,
      x: 0, z: 0, angle: 0, color: null, opacity: 1.0, visible: true
    });
    this._buildEnvironment();
    this._renderWalls();
  }

  _editWall(idx, field, value) {
    const wall = this._room?.room_walls?.[idx];
    if (!wall) return;
    wall[field] = value;
    this._buildEnvironment();
  }

  _removeWall(idx) {
    this._room?.room_walls?.splice(idx, 1);
    this._buildEnvironment();
    this._renderWalls();
  }

  _autoGenWalls() {
    if (!this._room) return;
    const ro = this._opts.room;
    const W = ro.width, D = ro.depth, H = ro.height;
    this._room.room_walls = [
      { id: 'w-back',  name: 'Back',  length: W, height: H, x: 0,      z: D/2,  angle: 0,            color: null, opacity: 1.0, visible: true },
      { id: 'w-front', name: 'Front', length: W, height: H, x: 0,      z: -D/2+2, angle: 0,           color: null, opacity: 0.6, visible: true },
      { id: 'w-left',  name: 'Left',  length: D, height: H, x: -W/2,   z: 2,    angle: Math.PI/2,    color: null, opacity: 1.0, visible: true },
      { id: 'w-right', name: 'Right', length: D, height: H, x: W/2,    z: 2,    angle: -Math.PI/2,   color: null, opacity: 1.0, visible: true },
    ];
    this._buildEnvironment();
    this._renderWalls();
  }

  _renderWalls() {
    const el = document.getElementById(this._id + '-walls-list');
    if (!el) return;
    const sid = this._id;
    el.innerHTML = (this._room?.room_walls || []).map((w, i) => wallRow(sid, w, i)).join('');
  }

  // ─── Pillar CRUD ──────────────────────────────────────────
  _addPillar() {
    if (!this._room) return;
    if (!Array.isArray(this._room.room_pillars)) this._room.room_pillars = [];
    this._room.room_pillars.push({
      id: 'pil-' + Date.now(),
      x: 0, z: 0, shape: 'cylinder', radius: 0.4,
      width: 0.8, depth: 0.8, height: this._opts.room.height || 14, color: '#2a3a4a'
    });
    this._buildEnvironment();
    this._renderPillars();
  }

  _editPillar(idx, field, value) {
    const pillar = this._room?.room_pillars?.[idx];
    if (!pillar) return;
    pillar[field] = value;
    this._buildEnvironment();
    if (field === 'shape') this._renderPillars();
  }

  _removePillar(idx) {
    this._room?.room_pillars?.splice(idx, 1);
    this._buildEnvironment();
    this._renderPillars();
  }

  _renderPillars() {
    const el = document.getElementById(this._id + '-pillars-list');
    if (!el) return;
    const sid = this._id;
    el.innerHTML = (this._room?.room_pillars || []).map((p, i) => pillarRow(sid, p, i)).join('');
  }

  // ─── Room items ───────────────────────────────────────────
  _buildRoomItems() {
    this._geometryManager?.buildRoomItems(this._room?.room_items || []);
  }

  _addRoomItem(type) {
    if (!this._room) return;
    if (!Array.isArray(this._room.room_items)) this._room.room_items = [];
    const id = 'item-' + Date.now();
    this._room.room_items.push({ id, type, name: type.toUpperCase() + '-' + (this._room.room_items.length + 1), x: 0, y: 0, z: 0, angle: 0 });
    this._buildRoomItems();
    this._renderRoomItems();
  }

  _editRoomItem(idx, field, value) {
    const item = this._room?.room_items?.[idx];
    if (!item) return;
    item[field] = value;
    this._buildRoomItems();
  }

  _removeRoomItem(idx) {
    const item = this._room?.room_items?.[idx];
    if (item?.id) this._autoUngroup(item.id);
    this._room?.room_items?.splice(idx, 1);
    this._buildRoomItems();
    this._renderRoomItems();
  }

  _renderRoomItems() {
    const el = document.getElementById(this._id + '-room-items');
    if (!el) return;
    const sid = this._id;
    el.innerHTML = (this._room?.room_items || []).map((item, i) => roomItemRow(sid, item, i)).join('');
  }

  // ─── VM Management ────────────────────────────────────────
  _renderVMPanel(dev) {
    const panel = document.querySelector(`#${this._id} [data-panel-id="vms"]`);
    if (!panel) return;
    if (dev && dev.type === 'server') {
      panel.classList.remove('r3-panel-hidden');
      const body = panel.querySelector('.r3-pb');
      if (body) body.innerHTML = vmPanelBody(this);
    } else {
      panel.classList.add('r3-panel-hidden');
    }
  }

  _hideVMPanel() {
    const panel = document.querySelector(`#${this._id} [data-panel-id="vms"]`);
    if (panel) panel.classList.add('r3-panel-hidden');
  }

  _getDevByIdx(di) {
    return this._rack?.devices?.[di] ?? null;
  }

  _addVM(di) {
    const dev = this._getDevByIdx(di);
    if (!dev) return;
    if (!Array.isArray(dev.vms)) dev.vms = [];
    dev.vms.push({
      id: 'vm-' + Date.now(),
      name: 'VM-' + (dev.vms.length + 1),
      label: '',
      technology: 'KVM/QEMU',
      os: 'Ubuntu 22.04 LTS',
      status: 'stopped',
      ips: { local: '', public: '' },
      ports: [],
      resources: { vcpu: 2, memory: 2048, disk: 50 },
    });
    this._refreshVMList(di);
  }

  _editVM(di, vi, field, value) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm) return;
    vm[field] = value;
    this._refreshVMCard(di, vi);
  }

  _editVMNested(di, vi, obj, field, value) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm) return;
    if (!vm[obj]) vm[obj] = {};
    vm[obj][field] = value;
    this._refreshVMCard(di, vi);
  }

  _removeVM(di, vi) {
    const dev = this._getDevByIdx(di);
    if (!dev?.vms) return;
    dev.vms.splice(vi, 1);
    this._refreshVMList(di);
  }

  _addVMPort(di, vi) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm) return;
    if (!Array.isArray(vm.ports)) vm.ports = [];
    vm.ports.push({ port: 80, protocol: 'TCP', status: 'open', service: 'HTTP' });
    this._refreshVMCard(di, vi);
  }

  _editVMPort(di, vi, pi, field, value) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm?.ports?.[pi]) return;
    vm.ports[pi][field] = value;
    this._refreshVMCard(di, vi);
  }

  _removeVMPort(di, vi, pi) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm?.ports) return;
    vm.ports.splice(pi, 1);
    this._refreshVMCard(di, vi);
  }

  _toggleVMEdit(di, vi) {
    const el = document.getElementById(this._id + `-vmef-${di}-${vi}`);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  }

  _refreshVMList(di) {
    const dev = this._getDevByIdx(di);
    if (!dev) return;
    const sid = this._id;
    const listEl = document.getElementById(sid + '-vm-list');
    if (listEl) listEl.innerHTML = (dev.vms || []).map((vm, vi) => vmCard(sid, vm, di, vi)).join('');
    // Update header count
    const hdr = listEl?.previousElementSibling;
    if (hdr) {
      const vms = dev.vms || [];
      hdr.querySelector('span').textContent = `${dev.name} — ${vms.length} VM${vms.length !== 1 ? 's' : ''}`;
    }
    if (this._opts.onChange) this._opts.onChange(this.getData());
  }

  _refreshVMCard(di, vi) {
    const dev = this._getDevByIdx(di);
    const vm = dev?.vms?.[vi];
    if (!vm) return;
    const sid = this._id;
    const cardEl = document.getElementById(sid + `-vm-${di}-${vi}`);
    if (cardEl) {
      const wasOpen = document.getElementById(sid + `-vmef-${di}-${vi}`)?.style.display !== 'none';
      cardEl.outerHTML = vmCard(sid, vm, di, vi);
      if (wasOpen) {
        const newForm = document.getElementById(sid + `-vmef-${di}-${vi}`);
        if (newForm) newForm.style.display = '';
      }
    }
    if (this._opts.onChange) this._opts.onChange(this.getData());
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
      const leftPanels  = leftSb  ? Array.from(leftSb.querySelectorAll(':scope > .r3-panel')).map(p => p.dataset.panelId).filter(Boolean)  : [];
      const rightPanels = rightSb ? Array.from(rightSb.querySelectorAll(':scope > .r3-panel')).map(p => p.dataset.panelId).filter(Boolean) : [];
      const collapsed = {};
      document.querySelectorAll(`#${this._id} .r3-panel.r3-collapsed`).forEach(p => {
        if (p.dataset.panelId) collapsed[p.dataset.panelId] = true;
      });
      const state = { left: leftPanels, right: rightPanels, collapsed };
      // Persist to opts so getConfig() / exportJson() includes it
      this._opts.sidebar.panelLayout = state;
      this._opts.sidebar.leftWidth   = leftSb?.clientWidth  || this._opts.sidebar.leftWidth;
      this._opts.sidebar.rightWidth  = rightSb?.clientWidth || this._opts.sidebar.rightWidth;
      localStorage.setItem('r3d-panels-' + this._id, JSON.stringify(state));
    } catch { /* localStorage may be unavailable */ }
  }

  _restorePanelState() {
    // Priority: opts.sidebar.panelLayout (from constructor/setOptions) → localStorage
    let saved = this._opts.sidebar.panelLayout;
    if (!saved) {
      try { saved = JSON.parse(localStorage.getItem('r3d-panels-' + this._id)); } catch { /* ignore */ }
    }
    if (!saved) return;
    const leftSb  = document.getElementById(this._id + '-sb');
    const rightSb = document.getElementById(this._id + '-sbr');
    const allPanels = [...(saved.left || []), ...(saved.right || [])];
    allPanels.forEach(panelId => {
      const panel = document.querySelector(`#${this._id} [data-panel-id="${panelId}"]`);
      if (!panel) return;
      const inRight  = (saved.right || []).includes(panelId);
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
  }
}

Rack3DVisualizer._THREE = null;
Rack3DVisualizer.useThree = function(THREE) { Rack3DVisualizer._THREE = THREE; };
