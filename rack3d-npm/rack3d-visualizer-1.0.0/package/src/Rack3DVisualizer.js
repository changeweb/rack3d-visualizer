// ─────────────────────────────────────────────────────────────
//  Rack3DVisualizer — main class
// ─────────────────────────────────────────────────────────────
import { DEFAULT_OPTIONS, mergeOptions } from './options.js';
import { resolveTheme } from './themes.js';
import { DEVICE_TYPES, tempColor, hexToRgb } from './constants.js';
import { buildCSS } from './css.js';

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
    this._rack   = null;
    this._selId  = null;
    this._dragId = null;
    this._showWire   = this._opts.view.wireframe;
    this._showLabels = this._opts.view.showLabels;
    this._mode   = this._opts.view.mode; // '3d' | '2d'

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
  //  HTML scaffold
  // ─────────────────────────────────────────────────────────
  _buildHTML() {
    const o = this._opts;
    const sb = o.sidebar;
    const v  = o.view;

    const toolbar = !v.showToolbar ? '' : `
    <div class="r3-hdr">
      <span class="r3-logo">RACK<span>3D</span></span>
      <div class="r3-sep"></div>
      <span class="r3-badge" id="${this._id}-bn" style="color:#79c0ff;border-color:#378ADD55;background:#378ADD11">—</span>
      <span class="r3-badge" id="${this._id}-bu" style="color:#3fb950;border-color:#1D9E7555;background:#1D9E7511">—</span>
      <span class="r3-badge" id="${this._id}-bt" style="color:#e3b341;border-color:#ffaa0055;background:#ffaa0011">—</span>
      <span class="r3-badge" id="${this._id}-bw" style="color:#cc88ff;border-color:#cc88ff55;background:#cc88ff11">—</span>
      <div class="r3-spacer"></div>
      ${this._mode!=='2d'?`<button class="r3-btn on"  id="${this._id}-btnL"  onclick="window._r3[\'${this._id}\'].toggleLabels()">◈ LABELS</button>`:''}
      <button class="r3-btn" id="${this._id}-btnW" onclick="window._r3['${this._id}'].toggleWire()">◻ WIRE</button>
      <button class="r3-btn" id="${this._id}-btn2d" onclick="window._r3['${this._id}'].toggleMode()">⊞ ${this._mode==='2d'?'3D':'2D'}</button>
      ${v.allowJsonEdit?`<button class="r3-btn" id="${this._id}-btnJ" onclick="window._r3['${this._id}'].toggleJson()">{ } JSON</button>`:''}
    </div>`;

    const sidebarHtml = !sb.enabled ? '' : `
    <div class="r3-sb" id="${this._id}-sb">
      ${sb.showRackConfig ? `
      <div class="r3-pnl">
        <div class="r3-pl">Rack Config</div>
        <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${this._id}-rn" oninput="window._r3['${this._id}']._onRackName(this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">Units</span><input class="r3-inp" type="number" id="${this._id}-ru" min="4" max="48" style="width:55px" oninput="window._r3['${this._id}']._onRackUnits(+this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">Temp°C</span><input class="r3-inp" type="number" id="${this._id}-rtemp" oninput="window._r3['${this._id}']._onRackProp('rackTemp',+this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">PDU Cap</span><input class="r3-inp" type="number" id="${this._id}-rpduCap" oninput="window._r3['${this._id}']._onRackProp('pduCapacity',+this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">PDU Load</span><input class="r3-inp" type="number" id="${this._id}-rpduLoad" oninput="window._r3['${this._id}']._onRackProp('pduLoad',+this.value)"></div>
      </div>` : ''}
      ${sb.showStats ? `
      <div class="r3-pnl">
        <div class="r3-pl">Statistics</div>
        <div class="r3-stat">
          <div class="r3-sv" id="${this._id}-sw">—</div>
          <div class="r3-sl">PDU Load / Capacity</div>
          <div class="r3-sbar"><div class="r3-sfill" id="${this._id}-sfW"></div></div>
        </div>
        <div class="r3-stat">
          <div class="r3-sv" id="${this._id}-st">—</div>
          <div class="r3-sl">Rack Intake Temperature</div>
          <div class="r3-sbar"><div class="r3-sfill" id="${this._id}-sfT"></div></div>
        </div>
      </div>` : ''}
      ${sb.showDeviceList ? `
      <div class="r3-pnl">
        <div class="r3-pl">Devices</div>
        <div id="${this._id}-dl"></div>
        ${sb.showAddButtons && v.allowAddRemove ? `<div style="display:flex;flex-wrap:wrap;margin-top:5px" id="${this._id}-ab"></div>` : ''}
      </div>` : ''}
      ${sb.showEditPanel && v.allowEdit ? `
      <div class="r3-ep" id="${this._id}-ep" style="display:none">
        <div class="r3-pl" id="${this._id}-elbl" style="margin-bottom:5px">Edit</div>
        <div class="r3-rw"><span class="r3-lbl">Name</span><input class="r3-inp" id="${this._id}-en" oninput="window._r3['${this._id}']._ed('name',this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">Type</span>
          <select class="r3-inp" id="${this._id}-et" onchange="window._r3['${this._id}']._ed('type',this.value)">
            ${Object.entries(this._types).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="r3-rw"><span class="r3-lbl">Watts</span><input class="r3-inp" type="number" id="${this._id}-ew" oninput="window._r3['${this._id}']._ed('watts',+this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">Height U</span><input class="r3-inp" type="number" min="1" max="12" id="${this._id}-eh" oninput="window._r3['${this._id}']._ed('heightUnits',+this.value)"></div>
        <div class="r3-rw"><span class="r3-lbl">Start U</span><input class="r3-inp" type="number" min="1" id="${this._id}-es" oninput="window._r3['${this._id}']._ed('startUnit',+this.value)"></div>
      </div>` : ''}
      ${sb.showUnitMap ? `
      <div class="r3-pnl">
        <div class="r3-pl">Unit Map</div>
        <div class="r3-um" id="${this._id}-um"></div>
      </div>` : ''}
      ${sb.showLegend ? `
      <div class="r3-pnl">
        <div class="r3-pl">Legend</div>
        <div class="r3-legend" id="${this._id}-legend"></div>
      </div>` : ''}
    </div>`;

    const canvasHtml = `
    <div class="r3-cv" id="${this._id}-cvcont">
      <canvas id="${this._id}-cv3" class="r3-canvas"></canvas>
      <div class="r3-scan"></div>
      <div class="r3-labels" id="${this._id}-labels"></div>
      <div class="r3-tip">🖱 Drag to orbit &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Click device to select</div>
      ${v.allowJsonEdit ? `
      <div class="r3-jp" id="${this._id}-jp" style="display:none">
        <div class="r3-jh">// JSON CONFIG <button class="r3-btn" onclick="window._r3['${this._id}'].toggleJson()" style="padding:2px 6px">✕</button></div>
        <textarea class="r3-jta" id="${this._id}-jta" spellcheck="false"></textarea>
        <div class="r3-je" id="${this._id}-je"></div>
        <div class="r3-jf">
          <button class="r3-btn on" onclick="window._r3['${this._id}'].applyJson()">✓ APPLY</button>
          <button class="r3-btn" onclick="window._r3['${this._id}'].exportJson()">↺ EXPORT</button>
        </div>
      </div>` : ''}
    </div>`;

    // 2D view container (shown only in 2d mode)
    const view2dHtml = `
    <div class="r3-cv" id="${this._id}-2dcont" style="display:none">
      <div class="r3-2d-wrap" id="${this._id}-2d"></div>
    </div>`;

    return `${toolbar}<div class="r3-body">${sidebarHtml}${this._mode==='2d'?view2dHtml:canvasHtml}${this._mode==='2d'?canvasHtml:view2dHtml}</div>`;
  }

  // ─────────────────────────────────────────────────────────
  //  Three.js loader + boot
  // ─────────────────────────────────────────────────────────
  _loadThree(cb) {
    // Priority 1: injected via setThree() before construction
    if (this._T3) { cb(); return; }
    // Priority 2: bundler-provided import stored on class
    if (Rack3DVisualizer._THREE) { this._T3 = Rack3DVisualizer._THREE; cb(); return; }
    // Priority 3: legacy global (CDN usage) - avoid injecting a second copy
    if (window.THREE) { this._T3 = window.THREE; cb(); return; }
    // Priority 4: last resort — load from CDN (pure CDN usage, no bundler)
    if (document.querySelector('script[data-rack3d-three]')) {
      // Already injecting, wait
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
    // _T3 already set by _loadThree(); do NOT re-read window.THREE (may be a different instance)
    const cv   = document.getElementById(this._id + '-cv3');
    const cont = document.getElementById(this._id + '-cvcont');
    if (!cv || !cont) return;
    const W = cont.clientWidth, H = cont.clientHeight;
    if (W < 1 || H < 1) { requestAnimationFrame(() => this._bootThree()); return; }

    const T = this._T3;
    this._ren = new T.WebGLRenderer({
      canvas:                  cv,
      antialias:               true,
      logarithmicDepthBuffer:  false,  // expensive; not needed for rack scale
      powerPreference:         'default', // change to 'low-power' to force iGPU
    });
    // Cap pixel ratio at 1.5 — the jump from 1.5→2 is barely visible but
    // doubles the number of pixels rendered (and GPU fill rate required).
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
  //  Lights
  // ─────────────────────────────────────────────────────────
  _buildLights() {
    const T  = this._T3;
    const sc = this._scene;
    const lo = this._opts.lighting;
    const ts = this._theme.scene;

    sc.add(new T.AmbientLight(lo.ambientColor ?? ts.ambientColor, lo.ambientIntensity ?? ts.ambientIntensity));

    const cnt = Math.max(2, Math.min(12, lo.overheadCount));
    const positions = [];
    const cols = Math.ceil(Math.sqrt(cnt)), rows = Math.ceil(cnt / cols);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (positions.length >= cnt) break;
      positions.push([(c - (cols-1)/2) * 7, (r - (rows-1)/2) * 6]);
    }
    positions.forEach(([x, z], idx) => {
      const fl = new T.DirectionalLight(0xf8fbff, lo.overheadIntensity ?? ts.overheadIntensity);
      fl.position.set(x, 22, z);
      // Only the first 2 overhead lights cast shadows — shadows are expensive.
      // Extra banks are fill-only (no shadow map allocated).
      if (lo.shadows && idx < 2) {
        fl.castShadow = true;
        fl.shadow.mapSize.set(512, 512);   // 512 is plenty for soft shadows
        fl.shadow.camera.near = 1; fl.shadow.camera.far = 80;
        fl.shadow.camera.left = -18; fl.shadow.camera.right = 18;
        fl.shadow.camera.top = 32; fl.shadow.camera.bottom = -5;
        fl.shadow.bias = -0.0005;
      }
      sc.add(fl);
    });

    const front = new T.DirectionalLight(0xffffff, lo.frontIntensity ?? ts.frontLightIntensity);
    front.position.set(0, 10, 18); sc.add(front);

    const fi = lo.fillIntensity ?? 6.0;
    [[-20, 8, 4], [20, 8, 4], [0, 30, 0], [0, 10, -16]].forEach(([x, y, z], i) => {
      const l = new T.DirectionalLight(i < 2 ? 0xe8f4ff : 0xffffff, i === 2 ? fi + 1 : fi);
      l.position.set(x, y, z); sc.add(l);
    });
    [[-18, 6, 0], [18, 6, 0], [0, 6, -16], [0, 6, 14]].forEach(([x, y, z]) => {
      const l = new T.DirectionalLight(0xd8eaff, 3.5); l.position.set(x, y, z); sc.add(l);
    });
    [[-5, 0.2, 2], [5, 0.2, 2], [0, 0.2, 8]].forEach(([x, y, z]) => {
      const pl = new T.PointLight(0x5588ee, lo.floorGlowIntensity ?? 3.0, 22);
      pl.position.set(x, y, z); sc.add(pl);
    });
    const glow = new T.PointLight(0x3377ff, lo.rackGlowIntensity ?? 6.0, 14);
    glow.position.set(0, this._midY(), 0); sc.add(glow);
  }

  // ─────────────────────────────────────────────────────────
  //  Environment
  // ─────────────────────────────────────────────────────────
  _buildEnvironment() {
    const T  = this._T3;
    const sc = this._scene;
    const ro = this._opts.room;
    const ts = this._theme.scene;
    const W = ro.width, D = ro.depth, H = ro.height, ts2 = ro.tileSize;
    const cx = 0, cz = 2;

    const mat = c => new T.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.05 });
    const floorMat = new T.MeshStandardMaterial({ color: ts.floorColor, roughness: 0.65, metalness: 0.25 });
    const wallMat  = new T.MeshStandardMaterial({ color: ts.wallColor,  roughness: 0.8,  metalness: 0.05 });
    const ceilMat  = new T.MeshStandardMaterial({ color: ts.ceilColor,  roughness: 0.85, metalness: 0.02 });

    const floor = new T.Mesh(new T.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, -0.01, cz);
    floor.receiveShadow = true; sc.add(floor);

    if (ro.floorTiles) {
      const gm = new T.LineBasicMaterial({ color: 0x3a5070 });
      const hw = W / 2, hd = D / 2;
      for (let i = 0; i <= Math.ceil(W / ts2); i++) {
        const x = -hw + i * ts2 + cx;
        const g = new T.BufferGeometry().setFromPoints([new T.Vector3(x, 0.001, -hd + cz), new T.Vector3(x, 0.001, hd + cz)]);
        sc.add(new T.Line(g, gm));
      }
      for (let j = 0; j <= Math.ceil(D / ts2); j++) {
        const z = -hd + j * ts2 + cz;
        const g = new T.BufferGeometry().setFromPoints([new T.Vector3(-hw + cx, 0.001, z), new T.Vector3(hw + cx, 0.001, z)]);
        sc.add(new T.Line(g, gm));
      }
      const pm = new T.MeshStandardMaterial({ color: 0x243040, roughness: 0.6, metalness: 0.35 });
      for (let pi = -Math.floor(W / 2 / ts2); pi <= Math.floor(W / 2 / ts2); pi++)
        for (let pj = -Math.floor(D / 2 / ts2); pj <= Math.floor(D / 2 / ts2); pj++) {
          const p = new T.Mesh(new T.BoxGeometry(ts2 - 0.03, 0.04, ts2 - 0.03), pm);
          p.position.set(pi * ts2 + cx, 0.02, pj * ts2 + cz); sc.add(p);
        }
    }

    const ceil = new T.Mesh(new T.PlaneGeometry(W, D), ceilMat);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); sc.add(ceil);

    if (ro.ceilingGrid) {
      const tgm = new T.LineBasicMaterial({ color: 0x4a6080 });
      const tw = 1.2, hw = W / 2, hd = D / 2;
      for (let i = 0; i <= Math.ceil(W / tw); i++) {
        const x = -hw + i * tw + cx;
        const g = new T.BufferGeometry().setFromPoints([new T.Vector3(x, H - 0.01, -hd + cz), new T.Vector3(x, H - 0.01, hd + cz)]);
        sc.add(new T.Line(g, tgm));
      }
    }

    // Walls
    const bw = new T.Mesh(new T.PlaneGeometry(W, H), wallMat);
    bw.position.set(cx, H / 2, cz + D / 2); sc.add(bw);
    const fm = new T.MeshStandardMaterial({ color: 0x1e2d40, transparent: true, opacity: 0.2, side: T.BackSide });
    const fw = new T.Mesh(new T.PlaneGeometry(W, H), fm);
    fw.position.set(cx, H / 2, cz - D / 2); sc.add(fw);
    const lw = new T.Mesh(new T.PlaneGeometry(D, H), wallMat);
    lw.rotation.y = Math.PI / 2; lw.position.set(cx - W / 2, H / 2, cz); sc.add(lw);
    const rw = new T.Mesh(new T.PlaneGeometry(D, H), wallMat);
    rw.rotation.y = -Math.PI / 2; rw.position.set(cx + W / 2, H / 2, cz); sc.add(rw);

    if (ro.stripLights) {
      const sm = new T.MeshStandardMaterial({ color: 0xffffff, emissive: new T.Color(0xf0f8ff), emissiveIntensity: ts.stripEmissive ?? 20 });
      const dm = new T.MeshStandardMaterial({ color: 0xe8f4ff, emissive: new T.Color(0xd0eaff), emissiveIntensity: 8, transparent: true, opacity: 0.85 });
      [-7, -2, 3, 8].forEach(z => [-5.5, 0, 5.5].forEach(x => {
        const s = new T.Mesh(new T.BoxGeometry(0.1, 0.03, 2.2), sm);
        s.position.set(cx + x, H - 0.02, cz + z); sc.add(s);
        const d = new T.Mesh(new T.BoxGeometry(0.35, 0.02, 2.4), dm);
        d.position.set(cx + x, H - 0.05, cz + z); sc.add(d);
      }));
    }

    if (ro.baseboardLights) {
      const bm = new T.MeshStandardMaterial({ color: ts.baseboardColor ?? 0x0044cc, emissive: new T.Color(ts.baseboardColor ?? 0x0044cc), emissiveIntensity: 2.0 });
      [-W / 2 + cx, W / 2 + cx].forEach(x => {
        const b = new T.Mesh(new T.BoxGeometry(0.04, 0.07, D), bm); b.position.set(x, 0.035, cz); sc.add(b);
      });
      const bb = new T.Mesh(new T.BoxGeometry(W, 0.07, 0.04), bm);
      bb.position.set(cx, 0.035, cz + D / 2 - 0.05); sc.add(bb);
    }

    if (ro.exitSign) {
      const em = new T.MeshStandardMaterial({ color: 0x00cc44, emissive: new T.Color(0x00cc44), emissiveIntensity: 3 });
      const ex = new T.Mesh(new T.BoxGeometry(0.4, 0.2, 0.05), em);
      ex.position.set(cx + W / 2 - 1, H - 0.5, cz + D / 2 - 0.1); sc.add(ex);
    }

    if (ro.cableTrays) {
      const tm = new T.MeshStandardMaterial({ color: 0x2a3a50, roughness: 0.7, metalness: 0.6 });
      [-1, W - 1].forEach((x, i) => {
        const t = new T.Mesh(new T.BoxGeometry(0.06, 0.4, D - 0.5), tm);
        t.position.set(cx - W / 2 + x + 0.3 * (i ? -1 : 1), H - 1, cz); sc.add(t);
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Rack geometry
  // ─────────────────────────────────────────────────────────
  _clearRack() {
    if (!this._scene) return;
    const rem = [];
    this._scene.traverse(o => { if (o.isMesh && o.userData.rk) rem.push(o); });
    rem.forEach(o => {
      this._scene.remove(o);
      o.geometry?.dispose();
      if (Array.isArray(o.material)) {
        o.material.forEach(m => { m.map?.dispose(); m.dispose(); });
      } else {
        o.material?.map?.dispose(); // dispose canvas textures (unit labels, device images)
        o.material?.dispose();
      }
    });
    this._devMeshes = {}; this._labelPositions = {};
    Object.values(this._labelDivs).forEach(d => d.remove());
    this._labelDivs = {};
  }

  _mk(geo, mat, tag) {
    const m = new this._T3.Mesh(geo, mat);
    m.userData.rk = tag || 1;
    m.castShadow = true; m.receiveShadow = true;
    this._scene.add(m); return m;
  }

  _buildRack() {
    if (!this._rack || !this._scene) return;
    this._clearRack();
    const T  = this._T3;
    const r  = this._rack;
    const ro = this._opts.rack;
    const tr = this._theme.rack;
    const UH = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;
    const H  = this._rackH(), my = this._midY();
    const hw = RW / 2, hd = RD / 2;

    const steel = c => new T.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.85, wireframe: this._showWire });

    // Corner posts
    [[1,-1],[-1,-1],[1,1],[-1,1]].forEach(([sx,sz]) => {
      const p = this._mk(new T.BoxGeometry(POST, H, POST), steel(tr.frameColor), 'frame');
      p.position.set(sx * (hw - POST / 2), my, sz * (hd - POST / 2));
    });

    // Top / bottom crossbars
    [0.04, H - 0.04].forEach(y => {
      [[new T.BoxGeometry(RW, 0.08, 0.12), [0, y, -hd + 0.06]],
       [new T.BoxGeometry(RW, 0.08, 0.12), [0, y,  hd - 0.06]],
       [new T.BoxGeometry(0.12, 0.08, RD), [-hw + 0.06, y, 0]],
       [new T.BoxGeometry(0.12, 0.08, RD), [ hw - 0.06, y, 0]]
      ].forEach(([g, pos]) => {
        const m = this._mk(g, steel(tr.frameColor), 'frame');
        m.position.set(...pos);
      });
    });

    // Mid crossbars every 8U
    for (let i = 1; i < r.units; i += 8) {
      const y = 0.6 + i * UH;
      const dm = steel(tr.postColor);
      [[-hd + 0.06, hd - 0.06]].flat().forEach(z => {
        const b = this._mk(new T.BoxGeometry(RW, 0.05, 0.1), dm, 'frame'); b.position.set(0, y, z);
      });
      [[-hw + 0.06, hw - 0.06]].flat().forEach(x => {
        const b = this._mk(new T.BoxGeometry(0.1, 0.05, RD), dm, 'frame'); b.position.set(x, y, 0);
      });
    }

    // Rails + screws + unit-number labels
    const railMat = steel(tr.railColor);
    const nutMat  = new T.MeshStandardMaterial({ color: 0x3a4f68, roughness: 0.3, metalness: 1.0, wireframe: this._showWire });
    for (let i = 0; i <= r.units; i++) {
      const y = 0.6 + i * UH;
      [-hw + POST, hw - POST].forEach(x => {
        const rf = this._mk(new T.BoxGeometry(0.04, 0.022, 0.14), railMat, 'rail'); rf.position.set(x, y, -hd + 0.2);
        const rr = this._mk(new T.BoxGeometry(0.04, 0.022, 0.14), railMat, 'rail'); rr.position.set(x, y,  hd - 0.2);
      });
      if (i < r.units) {
        // Nut screws
        [-hw + 0.22, hw - 0.22].forEach(x => {
          const n = this._mk(new T.CylinderGeometry(0.025, 0.025, 0.04, 6), nutMat, 'nut');
          n.rotation.x = Math.PI / 2; n.position.set(x, y + UH * 0.5, -hd + 0.06);
        });
        // Unit number — painted on the left post, visible from front
        const unitNum = i + 1;
        this._makeUnitLabel(unitNum, y, hw, hd, UH, POST);
      }
    }

    // Side panels
    if (ro.showSidePanels) {
      const sp = new T.MeshStandardMaterial({ color: 0x0f1622, roughness: 0.7, metalness: 0.5, transparent: true, opacity: 0.92, wireframe: this._showWire });
      [-1, 1].forEach(s => {
        const m = this._mk(new T.BoxGeometry(0.02, H - 0.2, RD - POST * 2), sp, 'panel');
        m.position.set(s * (hw - POST), my, 0);
      });
    }
    if (ro.showRearPanel) {
      const rp = new T.MeshStandardMaterial({ color: 0x0c1420, roughness: 0.8, metalness: 0.4, wireframe: this._showWire });
      this._mk(new T.BoxGeometry(RW - POST * 2, H - 0.2, 0.02), rp, 'panel').position.set(0, my, hd - POST);
    }
    if (ro.showNameplate) {
      const nm = new T.MeshStandardMaterial({ color: 0x1a2a3f, roughness: 0.5, metalness: 0.7, emissive: new T.Color(0x003355), emissiveIntensity: 0.4, wireframe: this._showWire });
      this._mk(new T.BoxGeometry(RW - POST * 3, 0.22, 0.04), nm, 'nameplate').position.set(0, H - 0.2, -hd + 0.03);
    }

    // Devices
    const sorted = r.devices.slice().sort((a, b) => a.startUnit - b.startUnit);
    sorted.forEach((dev, idx) => this._buildDevice(dev, idx));

    // Camera auto-distance
    if (this._opts.camera.distance === 'auto') {
      this._ctrl.r = Math.max(22, H * 2.2);
    }
    this._posCamera();
  }


  // ─────────────────────────────────────────────────────────
  //  Unit-number label sprites (canvas texture → plane mesh)
  // ─────────────────────────────────────────────────────────
  _makeUnitLabel(unitNum, y, hw, hd, UH, POST) {
    const T    = this._T3;
    const size = 128;  // higher resolution canvas for crisp text

    const canvas  = document.createElement('canvas');
    canvas.width  = size * 2;   // wider to fit 2-digit numbers without clipping
    canvas.height = size;
    const ctx     = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle dark pill background so number reads over any rack geometry
    ctx.fillStyle = 'rgba(10,20,35,0.72)';
    const rx = 12;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, rx);
    ctx.fill();

    // Number text
    ctx.fillStyle    = '#a8c8e8';
    ctx.font         = `bold ${size * 0.56}px "Share Tech Mono", "Courier New", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(unitNum), canvas.width / 2, canvas.height / 2);

    const tex       = new T.CanvasTexture(canvas);
    tex.needsUpdate = true;

    const mat = new T.MeshBasicMaterial({
      map:         tex,
      transparent: true,
      depthWrite:  false,
      side:        T.DoubleSide,  // visible from both front and rear camera angles
    });

    // Size: slightly less than one unit height, 2:1 aspect to match canvas
    const planeH = UH * 0.7;
    const planeW = planeH * 2;
    const mesh   = new T.Mesh(new T.PlaneGeometry(planeW, planeH), mat);
    mesh.userData.rk = 'unitlabel';

    // Position: on the LEFT post, at the vertical midpoint of this unit row,
    // sitting just in front of the post face so it's not clipped by the post geometry.
    const unitMidY = y + UH * 0.5;
    // Place on RIGHT post outer face, z pushed beyond front face of rack
    // Place on left post inner face, flush with front opening, facing forward (-Z)
    mesh.position.set(-hw + 0.10, unitMidY, -hd - 0.05);
    // Rotate 180 degrees so the "front" faces the camera
    mesh.rotation.y = Math.PI;
    
    this._scene.add(mesh);
    return mesh;
  }

  _buildDevice(dev, idx) {
    const T  = this._T3;
    const ro = this._opts.rack;
    const lo = this._opts.labels;
    const UH = ro.unitHeight, RW = ro.width, RD = ro.depth, POST = ro.postSize;
    const hd = RD / 2;

    const dh = dev.heightUnits * UH - 0.07;
    const dw = RW - POST * 2 - 0.06;
    const dd = RD - POST * 2 - 0.1;
    const y  = 0.6 + (dev.startUnit - 1) * UH + dh / 2 + 0.035;
    const isSel = this._selId === dev.id;

    const typeInfo = this._types[dev.type] || this._types.server;
    const rawCol = typeInfo.color;
    const rawHex = typeInfo.hex;
    const rgb    = hexToRgb(rawCol);

    const bodyCol = new T.Color(...rgb.map(c => c * 0.12 + 0.02));
    const body = this._mk(new T.BoxGeometry(dw, dh, dd),
      new T.MeshStandardMaterial({ color: bodyCol, roughness: 0.45, metalness: 0.65, wireframe: this._showWire }),
      'dev');
    body.position.set(0, y, 0); body.userData.deviceId = dev.id;

    // Front bezel
    const bezelCol = new T.Color(...rgb.map(c => c * 0.28 + 0.04));
    const bezel = this._mk(new T.BoxGeometry(dw, dh, 0.04),
      new T.MeshStandardMaterial({ color: bezelCol, roughness: 0.3, metalness: 0.75, wireframe: this._showWire }),
      'face');
    bezel.position.set(0, y, -hd + POST + 0.07); bezel.userData.deviceId = dev.id;

    // Front panel (bright, emissive) — with optional image texture
    const faceW = dw - 0.08, faceH = dh - 0.08;
    const panelCol = new T.Color(...rgb.map(c => Math.min(1, c * 0.65 + 0.06)));

    const panMat = new T.MeshStandardMaterial({
      color:             panelCol,
      roughness:         0.18,
      metalness:         0.25,
      wireframe:         this._showWire,
      emissive:          new T.Color(rawHex),
      emissiveIntensity: isSel ? 1.0 : 0.55,
    });

    const panel = this._mk(new T.BoxGeometry(faceW, faceH, 0.02), panMat, 'face');
    panel.position.set(0, y, -hd + POST + 0.09); panel.userData.deviceId = dev.id;
    this._devMeshes[dev.id] = panel;

    if (dev.imageUrl) {
      // Image plane sits in FRONT of everything else on the device face.
      // Use a PlaneGeometry (not Box) so the texture fills edge-to-edge
      // with correct UV mapping and no Z-fighting with the panel box.
      const imgMat = new T.MeshBasicMaterial({
        transparent: true,
        depthWrite:  false,
        side:        T.BackSide,
      });
      const imgPlane = new T.Mesh(new T.PlaneGeometry(faceW, faceH), imgMat);
      // Place slightly in front of the topmost port/bay layer (+0.12) to ensure
      // the image is never occluded by drive-bay or port geometry.
      imgPlane.position.set(0, y, -hd + 0.04);
      imgPlane.userData.rk = 'devimage';
      imgPlane.userData.deviceId = dev.id;
      imgPlane.renderOrder = 999;
      imgPlane.material.depthTest = false;
      imgPlane.scale.x = -1;
      this._scene.add(imgPlane);

      const loader = new T.TextureLoader();
      loader.load(
        dev.imageUrl,
        (tex) => {
          tex.encoding    = 3001;  // THREE.sRGBEncoding = 3001 in r128
          tex.anisotropy  = Math.min(4, this._ren?.capabilities?.getMaxAnisotropy?.() || 1);
          imgMat.map      = tex;
          imgMat.needsUpdate = true;
        },
        undefined,
        (err) => console.warn('[Rack3D] Could not load device image:', dev.imageUrl, err)
      );
    }
    // Status strip
    const stripMat = new T.MeshStandardMaterial({
      color: new T.Color(rawHex), roughness: 0.1, emissive: new T.Color(rawHex), emissiveIntensity: 1.2,
    });
    this._mk(new T.BoxGeometry(faceW, Math.min(0.06, faceH * 0.18), 0.015), stripMat, 'strip')
      .position.set(0, y + faceH / 2 - 0.04, -hd + POST + 0.1);


    
    // LEDs
    const ledCols = [0x00ff88, 0xff4400, 0x00aaff];
    const ln = Math.min(dev.heightUnits * 4, 10);
    for (let l = 0; l < ln; l++) {
      const lc = ledCols[l % 3];
      const lm = new T.MeshStandardMaterial({ color: lc, emissive: new T.Color(lc), emissiveIntensity: 3 });
      const led = this._mk(new T.SphereGeometry(0.028, 8, 8), lm, 'led');
      led.position.set(-faceW / 2 + 0.1 + l * (faceW / (ln + 1)), y, -hd + POST + 0.11);
    }

    // Drive bays
    if ((dev.type === 'server' || dev.type === 'storage') && dev.heightUnits >= 2) {
      const bm = new T.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.85, metalness: 0.5, wireframe: this._showWire });
      const hm = new T.MeshStandardMaterial({ color: 0x1e2e44, roughness: 0.4, metalness: 0.9, wireframe: this._showWire });
      const cols = 4, rows = Math.min(dev.heightUnits, 3);
      const bW = (faceW - 0.15) / cols, bH = Math.min((faceH - 0.25) / rows, 0.18);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const bx = -faceW / 2 + 0.08 + c * bW + bW / 2;
        const by = y + faceH / 2 - 0.15 - r * (bH + 0.03);
        const bz = -hd + POST + 0.105;
        const bay = this._mk(new T.BoxGeometry(bW - 0.03, bH, 0.022), bm, 'bay');
        bay.position.set(bx, by, bz);
        const hand = this._mk(new T.BoxGeometry(bW - 0.06, 0.02, 0.015), hm, 'bay');
        hand.position.set(bx, by + bH / 2 - 0.02, bz - 0.013);
      }
    }

    // Port grids
    if (['switch', 'router', 'firewall', 'patch'].includes(dev.type)) {
      const pm  = new T.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.9, wireframe: this._showWire });
      const pam = new T.MeshStandardMaterial({ color: 0x002a44, roughness: 0.5, emissive: new T.Color(0x0044aa), emissiveIntensity: 0.5, wireframe: this._showWire });
      const nP  = dev.type === 'patch' ? 24 : dev.type === 'switch' ? 12 : 6;
      const pW  = Math.min((faceW - 0.2) / nP, 0.15), pH = Math.min(faceH * 0.4, 0.08);
      for (let p = 0; p < nP; p++) {
        const px = -faceW / 2 + 0.1 + p * (pW + 0.01) + pW / 2;
        const port = this._mk(new T.BoxGeometry(pW, pH, 0.02), Math.random() > 0.3 ? pam : pm, 'port');
        port.position.set(px, y - faceH * 0.05, -hd + POST + 0.11);
      }
    }

    // Vent slots
    if (dev.heightUnits >= 2) {
      const vm = new T.MeshStandardMaterial({ color: 0x060a10, roughness: 0.95, wireframe: this._showWire });
      const nv = Math.min(dev.heightUnits * 2, 8);
      for (let v = 0; v < nv; v++) {
        const vent = this._mk(new T.BoxGeometry(dw * 0.55, 0.02, dd * 0.35), vm, 'vent');
        vent.position.set(dw * 0.08, y - dh / 2 + 0.06 + v * 0.15, 0.1);
      }
    }

    // Label
    const side = lo.side === 'auto' ? (idx % 2 === 0 ? 'left' : 'right') : lo.side;
    // Anchor the dot at the post outer edge so the card fans outward.
    // We push the 3D point just outside the post; updateLabels() then
    // positions the label div so the dot sits at that screen point and
    // the card extends away from the rack (outward).
    const lx = side === 'left' ? -(RW / 2) : (RW / 2);
    this._labelPositions[dev.id] = { pos: new T.Vector3(lx, y, -hd + 0.2), side };
    this._createLabel(dev, rawCol, side);
  }

  // ─────────────────────────────────────────────────────────
  //  Labels
  // ─────────────────────────────────────────────────────────
  _createLabel(dev, col, side) {
    const lo   = this._opts.labels;
    const icon = this._types[dev.type]?.icon || '▣';
    const type = this._types[dev.type]?.label || dev.type;

    // Status indicator
    const statusMap = { up: ['#00ff88','▲'], down: ['#ff3344','▼'], warn: ['#ffaa00','⚠'] };
    const [sc, si]  = (dev.status && statusMap[dev.status]) || [];
    const statusHtml = sc
      ? `<span style="color:${sc};font-size:11px;margin-left:3px" title="${dev.status}">${si}</span>`
      : '';

    // Build a single unified detail block (one bordered card below the name tag)
    // so all rows read as one connected annotation, not separate floating cards.
    const detailLines = [];

    if (lo.showWatts && dev.watts != null)
      detailLines.push(`<span>⚡ ${dev.watts}W</span>`);
    if (lo.showUnits)
      detailLines.push(`<span>📌 U${dev.startUnit}–${dev.startUnit + dev.heightUnits - 1}</span>`);
    if (dev.ip)
      detailLines.push(`<span>🔌 ${dev.ip}</span>`);

    // Custom fields — each on its own line inside the same card
    if (Array.isArray(dev.fields)) {
      dev.fields.forEach(f => {
        const parts = [f.icon || '', f.label ? `<span style="opacity:.65">${f.label}:</span>` : '', `<b>${f.value ?? ''}</b>`].filter(Boolean);
        detailLines.push(parts.join(' '));
      });
    }

    const detailBlock = detailLines.length
      ? `<div class="r3-ldetail" style="border-color:${col}44;color:${col}cc">
           ${detailLines.map(l => `<div class="r3-ldetail-row" style="font-size:${lo.fontSize ? lo.fontSize - 1 : 10}px">${l}</div>`).join('')}
         </div>`
      : '';

    const d = document.createElement('div');
    d.className = `r3-label side-${side}`;
    d.id = this._id + '-lbl-' + dev.id;
    d.innerHTML = `
      <div class="r3-ldot" style="color:${col}"></div>
      <div class="r3-lhline" style="color:${col};width:${lo.connectorLength}px"></div>
      <div class="r3-lcard">
        <div class="r3-ltag" style="border-color:${col}66;color:${col}">
          ${lo.showIcon ? `<span style="font-size:${lo.iconSize||13}px">${icon}</span>` : ''}
          <span class="r3-lname" style="font-size:${lo.fontSize||11}px">${dev.name}</span>
          ${statusHtml}
          ${lo.showType ? `<span class="r3-ltype" style="color:${col}88">${type}</span>` : ''}
        </div>
        ${detailBlock}
      </div>`;

    const labelsEl = document.getElementById(this._id + '-labels');
    if (labelsEl) labelsEl.appendChild(d);
    this._labelDivs[dev.id] = d;
  }

  _updateLabels() {
    if (!this._cam || !this._ren) return;
    const W = this._ren.domElement.clientWidth;
    const H = this._ren.domElement.clientHeight;
    const vp = new this._T3.Vector3();
    Object.entries(this._labelPositions).forEach(([id, entry]) => {
      const d = this._labelDivs[id]; if (!d) return;
      vp.copy(entry.pos); vp.project(this._cam);
      const sx = (vp.x * 0.5 + 0.5) * W;
      const sy = (-0.5 * vp.y + 0.5) * H;
      const visible = this._showLabels && vp.z > 0 && vp.z < 1;

      // Outward layout:
      //   side-left:  dot is the RIGHTMOST element of the flex row.
      //               Anchor the div's RIGHT edge to sx so dot sits at the rack
      //               and the card extends LEFT (outward / away from rack).
      //   side-right: dot is the LEFTMOST element.
      //               Anchor the div's LEFT edge to sx so dot sits at the rack
      //               and the card extends RIGHT (outward).
      d.style.top    = sy + 'px';
      d.style.transform = 'translateY(-50%)';
      if (entry.side === 'left') {
        d.style.left  = sx + 'px';
        d.style.right = 'auto';   // right edge of div = sx (dot position)
      } else {
        d.style.left  = 'auto';          // left edge of div = sx (dot position)
        d.style.right = (W - sx) + 'px';
      }
      d.style.opacity = visible ? 1 : 0;
      d.style.zIndex  = id === this._selId ? '10' : '5';
    });
  }

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

    // ── Performance settings ─────────────────────────────────
    // Target 30fps when idle (no interaction, no animation).
    // Jump to 60fps during orbit/zoom/selection. The render is
    // skipped entirely when nothing has changed (dirty flag).
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

      // Detect whether anything is actually moving this frame
      const orbiting  = this._ctrl.drag;
      const autoRot   = this._opts.view.autoRotate;
      const selChange = this._selId !== lastSelId;
      const camChange = this._ctrl.az !== lastAz || this._ctrl.el !== lastEl || this._ctrl.r !== lastR;
      const dirty     = orbiting || autoRot || selChange || camChange;

      // Frame-rate cap: skip render if not enough time has elapsed
      const interval = dirty ? MS_ACTIVE : MS_IDLE;
      if (now - lastTime < interval) return;
      lastTime  = now;
      lastSelId = this._selId;
      lastAz    = this._ctrl.az;
      lastEl    = this._ctrl.el;
      lastR     = this._ctrl.r;

      this._tick++;

      // Auto-rotate
      if (autoRot) {
        this._ctrl.az += this._opts.view.autoRotateSpeed;
        this._posCamera();
      }

      // Pulse selected device — only update when selected or on slow tick
      if (selChange || (this._selId && this._tick % 2 === 0)) {
        Object.entries(this._devMeshes).forEach(([id, m]) => {
          if (!m.material) return;
          const target = id === this._selId
            ? 1.0 + 0.3 * Math.sin(this._tick * 0.08)
            : 0.55;
          // Only write if value actually changed (avoids GPU material upload)
          if (Math.abs(m.material.emissiveIntensity - target) > 0.005) {
            m.material.emissiveIntensity = target;
          }
        });
      }

      this._ren.render(this._scene, this._cam);
      this._updateLabels();  // always update labels — they must track camera every frame
    };
    requestAnimationFrame(loop);
  }

  /** Mark scene as needing a re-render (call after any external data change) */
  invalidate() {
    this._tick++;
  }

  // ─────────────────────────────────────────────────────────
  //  2D render
  // ─────────────────────────────────────────────────────────
  _render2D() {
    if (!this._rack) return;
    const cont = document.getElementById(this._id + '-2d');
    if (!cont) return;
    const r  = this._rack;
    const UH = 22; // px per rack unit in 2D view
    let html = `<div class="r3-2d-rack" style="min-width:320px;width:420px">`;
    const occupied = new Map();
    r.devices.forEach(dev => {
      for (let u = dev.startUnit; u < dev.startUnit + dev.heightUnits; u++) occupied.set(u, dev);
    });
    for (let u = r.units; u >= 1; u--) {
      const dev     = occupied.get(u);
      const col     = dev ? (this._types[dev.type]?.color || '#2288ff') : null;
      const isFirst = dev && u === dev.startUnit;
      const h       = UH * (dev && isFirst ? dev.heightUnits : 1);
      if (dev && !isFirst) continue;

      // ── Image: proportionally fills the label area when provided ──────────
      const imgH  = h - 4;           // leave 2px padding top+bottom
      const imgSection = dev?.imageUrl
        ? `<img src="${dev.imageUrl}"
               style="height:${imgH}px;width:auto;max-width:90px;
                      object-fit:contain;border-radius:2px;margin-right:6px;
                      border:1px solid ${col}33;flex-shrink:0"
               alt="${dev.name}" loading="lazy">`
        : '';

      html += `<div class="r3-2d-unit" style="
          height:${h}px;
          background:${dev ? col + '22' : 'transparent'};
          border-left:${dev ? `3px solid ${col}` : '1px solid var(--r3-border)'};
          display:flex;align-items:center;padding:2px 4px;overflow:hidden">
        <span class="r3-2d-num" style="flex-shrink:0">${u}</span>
        ${imgSection}
        <div class="r3-2d-bar" style="color:${dev ? col : 'var(--r3-dim)'};flex:1;min-width:0;overflow:hidden">
          ${dev ? (() => {
            const stMap = { up:['#00ff88','▲'], down:['#ff3344','▼'], warn:['#ffaa00','⚠'] };
            const [sc,si] = (dev.status && stMap[dev.status]) || [];
            const statusHtml = sc
              ? `<span style="color:${sc};margin-left:3px;font-size:9px" title="${dev.status}">${si}</span>`
              : '';
            const ipHtml = dev.ip
              ? `<span style="opacity:.5;font-size:8px;margin-left:5px">🔌 ${dev.ip}</span>`
              : '';
            const customHtml = Array.isArray(dev.fields) && dev.fields.length
              ? dev.fields.map(f =>
                  `<span style="opacity:.55;font-size:8px;margin-left:5px">
                     ${f.icon||''} ${f.label ? f.label+':' : ''} ${f.value ?? ''}
                   </span>`
                ).join('')
              : '';
            return `<span style="font-weight:600">${this._types[dev.type]?.icon||''} ${dev.name}</span>
                    ${statusHtml}
                    <span style="opacity:.5;font-size:8px;margin-left:6px">${this._types[dev.type]?.label} · ${dev.watts}W</span>
                    ${ipHtml}${customHtml}`;
          })() : ''}
        </div>
      </div>`;
    }
    html += '</div>';
    cont.innerHTML = html;
  }

  // ─────────────────────────────────────────────────────────
  //  UI refresh
  // ─────────────────────────────────────────────────────────
  _refresh() {
    if (!this._rack) return;
    const r   = this._rack;
    const sb  = this._opts.sidebar;
    const pct = r.pduCapacity > 0 ? Math.round(r.pduLoad / r.pduCapacity * 100) : 0;
    const tc2 = tempColor(r.rackTemp);
    const pwc = pct > 90 ? '#ff3344' : pct > 70 ? '#ffaa00' : '#00ff88';
    const $ = id => document.getElementById(this._id + '-' + id);

    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    const val = (id, v)   => { const el = $(id); if (el) el.value = v; };
    const css = (id, prop, v) => { const el = $(id); if (el) el.style[prop] = v; };

    set('bn', r.name); set('bu', r.units + 'U');
    set('bt', r.rackTemp + '°C'); set('bw', r.pduLoad + 'W');
    val('rn', r.name); val('ru', r.units);
    val('rtemp', r.rackTemp); val('rpduCap', r.pduCapacity); val('rpduLoad', r.pduLoad);

    const sw = $('sw'); if (sw) sw.innerHTML = `<span style="font-family:'Orbitron',monospace">${r.pduLoad}</span><span style="font-size:10px;opacity:.6"> / ${r.pduCapacity}W (${pct}%)</span>`;
    const st = $('st'); if (st) st.innerHTML = `<span style="font-family:'Orbitron',monospace;color:${tc2}">${r.rackTemp}</span><span style="font-size:10px;opacity:.6">°C</span>`;
    css('sfW', 'width', Math.min(100, pct) + '%'); css('sfW', 'background', pwc);
    css('sfT', 'width', Math.min(100, r.rackTemp * 1.8) + '%'); css('sfT', 'background', tc2);

    // Device list
    if (sb.showDeviceList) {
      const dl = $('dl'); if (dl) {
        dl.innerHTML = '';
        r.devices.slice().sort((a, b) => a.startUnit - b.startUnit).forEach(dev => {
          const col   = this._types[dev.type]?.color || '#2288ff';
          const isSel = this._selId === dev.id;
          const d     = document.createElement('div');
          d.className = 'r3-dc' + (isSel ? ' sel' : '');
          d.style.setProperty('--r3-selcol', col);
          d.innerHTML = `<div class="r3-dot" style="background:${col};box-shadow:0 0 4px ${col}66"></div>
            <div style="flex:1;min-width:0">
              <div class="r3-dn">${this._types[dev.type]?.icon || '▣'} ${dev.name}</div>
              <div class="r3-dm">${this._types[dev.type]?.label} · U${dev.startUnit}–${dev.startUnit + dev.heightUnits - 1} · ${dev.watts}W${dev.ip ? ' · ' + dev.ip : ''}${dev.status ? ' <span style="color:' + ({up:'#00ff88',down:'#ff3344',warn:'#ffaa00'}[dev.status]||'#888') + '">' + ({up:'▲',down:'▼',warn:'⚠'}[dev.status]||'') + '</span>' : ''}</div>
            </div>
            <button class="r3-xb" data-id="${dev.id}">×</button>`;
          d.querySelector('.r3-xb').addEventListener('click', e => { e.stopPropagation(); this._rmDev(dev.id); });
          d.addEventListener('click', () => {
            this._selId = isSel ? null : dev.id;
            isSel ? this._closeEdit() : this._openEdit(dev);
            this._buildRack(); this._refresh();
          });
          if (this._opts.view.allowDragDrop) {
            d.draggable = true;
            d.addEventListener('dragstart', e => { this._dragId = dev.id; e.dataTransfer.effectAllowed = 'move'; });
            d.addEventListener('dragend',   () => { this._dragId = null; });
          }
          dl.appendChild(d);
        });
      }
    }

    // Add buttons
    if (sb.showAddButtons && this._opts.view.allowAddRemove) {
      const ab = $('ab'); if (ab) {
        ab.innerHTML = '';
        Object.entries(this._types).forEach(([type, info]) => {
          const b = document.createElement('button'); b.className = 'r3-ab';
          b.textContent = info.icon + ' ' + info.label;
          b.style.cssText = `background:${info.color}18;color:${info.color};border:1px solid ${info.color}44`;
          b.addEventListener('click', () => this._addDev(type));
          ab.appendChild(b);
        });
      }
    }

    // Unit map
    if (sb.showUnitMap) this._buildUnitMap();
    // Legend
    if (sb.showLegend)  this._buildLegend();

    if (this._opts.onChange && this._rack) this._opts.onChange(this.getData());
  }

  _buildUnitMap() {
    const um = document.getElementById(this._id + '-um'); if (!um) return;
    um.innerHTML = '';
    const r = this._rack;
    for (let i = r.units; i >= 1; i--) {
      const dev = r.devices.find(d => i >= d.startUnit && i < d.startUnit + d.heightUnits);
      const col = dev ? (this._types[dev.type]?.color || '#2288ff') : null;
      const isFirst = dev && i === dev.startUnit;
      const isLast  = dev && i === dev.startUnit + dev.heightUnits - 1;
      const row = document.createElement('div'); row.className = 'r3-ur';
      if (dev) {
        row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
          <div style="flex:1;background:${col}28;border-left:3px solid ${col};padding:0 5px;height:100%;display:flex;align-items:center;${isFirst?`border-top:1px solid ${col}88;`:''}${isLast?`border-bottom:1px solid ${col}88;`:''}">
            <span style="color:${col};font-size:8px;font-family:'Share Tech Mono',monospace;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:130px;font-weight:600">
              ${isFirst ? (this._types[dev.type]?.icon + ' ' + dev.name) : ''}
            </span>
          </div>`;
      } else {
        row.innerHTML = `<span style="color:var(--r3-dim);font-size:9px;min-width:16px;text-align:right;font-family:'Share Tech Mono',monospace">${i}</span>
          <div style="flex:1;height:1px;border-top:1px dashed var(--r3-border);margin:0 4px"></div>`;
      }
      if (this._opts.view.allowDragDrop) {
        row.addEventListener('dragover',  e => { e.preventDefault(); row.style.background = '#1f6feb22'; });
        row.addEventListener('dragleave', () => { row.style.background = ''; });
        row.addEventListener('drop',      e => { e.preventDefault(); row.style.background = ''; this._dropUnit(this._dragId, i); });
      }
      um.appendChild(row);
    }
  }

  _buildLegend() {
    const el = document.getElementById(this._id + '-legend'); if (!el) return;
    el.innerHTML = Object.entries(this._types).map(([, i]) =>
      `<div class="r3-lrow"><div class="r3-lswatch" style="background:${i.color};box-shadow:0 0 4px ${i.color}66"></div><span>${i.icon}</span><span>${i.label}</span></div>`
    ).join('');
  }

  // ─────────────────────────────────────────────────────────
  //  Edit panel
  // ─────────────────────────────────────────────────────────
  _openEdit(dev) {
    const ep = document.getElementById(this._id + '-ep'); if (!ep) return;
    ep.style.display = 'block';
    const el = document.getElementById(this._id + '-elbl'); if (el) el.textContent = '▸ ' + dev.name;
    const set = (id, v) => { const e = document.getElementById(this._id + '-' + id); if (e) e.value = v; };
    set('en', dev.name); set('et', dev.type); set('ew', dev.watts);
    set('eh', dev.heightUnits); set('es', dev.startUnit);
  }
  _closeEdit() {
    const ep = document.getElementById(this._id + '-ep'); if (ep) ep.style.display = 'none';
  }
  _ed(field, value) {
    const dev = this._rack?.devices.find(d => d.id === this._selId); if (!dev) return;
    dev[field] = value;
    if (field === 'name') { const el = document.getElementById(this._id + '-elbl'); if (el) el.textContent = '▸ ' + value; }
    this._buildRack(); this._refresh();
  }

  _addDev(type) {
    const occ = new Set();
    this._rack.devices.forEach(d => { for (let u = d.startUnit; u < d.startUnit + d.heightUnits; u++) occ.add(u); });
    const h = type === 'storage' ? 3 : type === 'server' ? 2 : 1;
    let st = 1;
    for (let u = 1; u <= this._rack.units; u++) {
      let ok = true;
      for (let j = u; j < u + h; j++) { if (occ.has(j) || j > this._rack.units) { ok = false; break; } }
      if (ok) { st = u; break; }
    }
    const nd = { id: 'd' + Date.now(), name: 'New ' + (this._types[type]?.label || type), type, startUnit: st, heightUnits: h, watts: 200 };
    this._rack.devices.push(nd);
    this._selId = nd.id; this._openEdit(nd);
    this._buildRack(); this._refresh();
  }

  _rmDev(id) {
    this._rack.devices = this._rack.devices.filter(d => d.id !== id);
    if (this._selId === id) { this._selId = null; this._closeEdit(); }
    this._buildRack(); this._refresh();
  }

  _dropUnit(devId, unit) {
    const dev = this._rack.devices.find(d => d.id === devId); if (!dev) return;
    const occ = new Set();
    this._rack.devices.forEach(d => { if (d.id !== devId) for (let u = d.startUnit; u < d.startUnit + d.heightUnits; u++) occ.add(u); });
    let ok = true;
    for (let u = unit; u < unit + dev.heightUnits; u++) { if (u < 1 || u > this._rack.units || occ.has(u)) { ok = false; break; } }
    if (ok) { dev.startUnit = unit; this._buildRack(); this._refresh(); }
  }

  // ─────────────────────────────────────────────────────────
  //  Rack prop helpers
  // ─────────────────────────────────────────────────────────
  _onRackName(v) { this._rack.name = v; this._refresh(); }
  _onRackUnits(v) {
    this._rack.units = Math.max(4, v || this._rack.units);
    this._buildRack(); this._refresh();
  }
  _onRackProp(p, v) { this._rack[p] = v; this._refresh(); }

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

  // ─────────────────────────────────────────────────────────
  //  Sidebar events (initial bind)
  // ─────────────────────────────────────────────────────────
  _bindSidebarEvents() {
    // Register instance globally so inline onclick can reach it
    if (!window._r3) window._r3 = {};
    window._r3[this._id] = this;
  }

  // ─────────────────────────────────────────────────────────
  //  Geometry helpers
  // ─────────────────────────────────────────────────────────
  _rackH() { return (this._rack?.units || 24) * this._opts.rack.unitHeight + 1.3; }
  _midY()  { return this._rackH() / 2; }
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
