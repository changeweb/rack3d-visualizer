# Rack3D Visualizer — Technical Documentation

**Version:** 1.0.0  
**Package:** `rack3d-visualizer`  
**Engine:** Three.js r128 (loaded from CDN or pre-bundled)  
**Formats:** ESM · CJS · UMD

---

## Table of Contents

1. [Installation](#1-installation)
2. [Quick Start](#2-quick-start)
3. [Data Model](#3-data-model)
4. [Core Features](#4-core-features)
   - [3D Scene Rendering](#41-3d-scene-rendering)
   - [Room Environment](#42-room-environment)
   - [Racks & Devices](#43-racks--devices)
   - [Room Items](#44-room-items)
   - [Camera System](#45-camera-system)
   - [Transform Mode (Move & Rotate)](#46-transform-mode-move--rotate)
   - [Device Labels](#47-device-labels)
   - [Themes](#48-themes)
   - [Lighting](#49-lighting)
   - [Sidebar Panels](#410-sidebar-panels)
   - [Catalog](#411-catalog)
   - [Virtual Machines](#412-virtual-machines)
   - [Walls & Pillars](#413-walls--pillars)
   - [2D Schematic Mode](#414-2d-schematic-mode)
   - [JSON Export / Import](#415-json-export--import)
   - [Panel Drag-and-Drop Layout](#416-panel-drag-and-drop-layout)
   - [Axis Gizmo & Compass](#417-axis-gizmo--compass)
5. [Public API Reference](#5-public-api-reference)
6. [Options Reference](#6-options-reference)
7. [Device Types](#7-device-types)
8. [Callbacks](#8-callbacks)
9. [Module Architecture](#9-module-architecture)

---

## 1. Installation

```bash
# From npm registry
npm install rack3d-visualizer

# From local tarball
npm install ./rack3d-visualizer-1.0.0.tgz
```

Three.js is a **peer dependency**. The library loads it from CDN (`cdnjs r128`) if `window.THREE` is not already present. In a Vite/webpack project, install it explicitly:

```bash
npm install three@0.128.0
```

---

## 2. Quick Start

### Vanilla JS

```html
<div id="rack-view" style="width:100%;height:600px"></div>
<script type="module">
  import { Rack3DVisualizer } from 'rack3d-visualizer';

  const viz = new Rack3DVisualizer('#rack-view', {
    theme: 'dark',
    camera: { mode: 'fps' },
  });

  viz.setRoomData({
    layout: { rows: 1, cols: 2, colSpacing: 8 },
    racks: [
      {
        id: 'rack-a', row: 0, col: 0, name: 'RACK-A', units: 42,
        devices: [
          { id: 'd1', name: 'Core Router', type: 'router', startUnit: 1, heightUnits: 2, watts: 450 },
          { id: 'd2', name: 'Web Server',  type: 'server', startUnit: 3, heightUnits: 2, watts: 620 },
        ],
      },
    ],
  });
</script>
```

### React

```jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

function RackView({ data, theme = 'dark' }) {
  const ref = useRef(null);
  const viz = useRef(null);

  useEffect(() => {
    viz.current = new Rack3DVisualizer(ref.current, { theme });
    viz.current.setRoomData(data);
    return () => viz.current?.destroy();
  }, []);

  useEffect(() => { viz.current?.setRoomData(data); }, [data]);
  useEffect(() => { viz.current?.setTheme(theme); },   [theme]);

  return <div ref={ref} style={{ width: '100%', height: '100vh' }} />;
}
```

---

## 3. Data Model

The top-level object passed to `setRoomData()`:

```js
{
  catalog: [...],           // reusable device templates (optional)
  layout: {
    rows: 1,
    cols: 3,
    colSpacing: 8,          // metres between columns
    rowSpacing: 12,         // metres between rows
  },
  room_items: [...],        // free-standing equipment (UPS, aircon, shelf, etc.)
  room_walls: [...],        // optional: overrides auto-generated 4 walls
  room_pillars: [...],      // optional: structural pillars
  racks: [...]
}
```

### Rack Object

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name shown on nameplate |
| `units` | `number` | Rack height in U (e.g. 42) |
| `row` / `col` | `number` | Grid placement (used when no `position`) |
| `position` | `{x,y,z}` | Explicit world position — overrides `row`/`col` |
| `facingAngle` | `number` | Y-axis rotation in radians |
| `rackTemp` | `number` | Intake temperature in °C |
| `pduCapacity` | `number` | Total PDU capacity in watts |
| `pduLoad` | `number` | Current PDU load in watts |
| `devices` | `Device[]` | Array of mounted devices |

### Device Object

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name |
| `type` | `string` | One of the built-in or custom device types |
| `startUnit` | `number` | Bottom rack unit (1-based) |
| `heightUnits` | `number` | Number of Us occupied |
| `watts` | `number` | Power draw in watts |
| `halfWidth` | `'left'`\|`'right'` | Mount in left or right half of a 1U slot |
| `imageUrl` | `string` | Front faceplate image URL |
| `imageUrlRear` | `string` | Rear image URL |
| `color` | `string` | CSS hex color override |
| `ip` | `string` | IP address shown in label |
| `status` | `'up'`\|`'down'`\|`'warn'` | Status indicator |
| `fields` | `{icon,label,value}[]` | Custom info fields in sidebar |
| `vms` | `VM[]` | Virtual machine instances (servers only) |

### Room Item Object

```js
{
  id: 'ri-1',
  type: 'ups',           // ups | battery | aircon | pdu | shelf | sensor
  name: 'UPS-Main',
  label: 'Primary UPS',
  x: -20, y: 0, z: -8,  // world-space position
  angle: 0,              // Y-axis rotation in degrees
  color: '#2a3a50',
  width: 3.0,            // override default dimensions
  height: 8.0,
  depth: 1.8,
}
```

---

## 4. Core Features

### 4.1 3D Scene Rendering

**Module:** `Rack3DVisualizer.js` · **Engine:** Three.js r128

The scene is bootstrapped by `_bootThree()`. Key Three.js objects:

| Object | Role |
|---|---|
| `THREE.WebGLRenderer` | Main renderer, ACES tone-mapping, optional shadow maps |
| `THREE.PerspectiveCamera` | 44° FoV, positioned by `_posCamera()` |
| `THREE.Scene` | Root scene graph, holds all geometry groups |
| `THREE.Fog` | Exponential distance fog (configured via `room.fogNear` / `room.fogFar`) |

The render loop runs via `requestAnimationFrame` in `_animate()`. Materials are managed by `MaterialFactory` which caches and reuses `THREE.MeshStandardMaterial` instances per theme.

```js
const viz = new Rack3DVisualizer('#container', {
  lighting: {
    shadows: true,
    exposure: 2.3,
    ambientIntensity: 6.0,
  },
});
```

---

### 4.2 Room Environment

**Module:** `src/builders/EnvironmentBuilder.js` · called from `GeometryManager.buildEnvironment()`

Builds the physical room shell: floor, ceiling, walls, strip lights, baseboard LEDs, and fog.

| Option | Default | Description |
|---|---|---|
| `room.enabled` | `true` | Render the room shell |
| `room.width` | `26` | Room width in metres |
| `room.depth` | `20` | Room depth in metres |
| `room.height` | `14` | Ceiling height in metres |
| `room.floorTiles` | `true` | Raised floor tile grid |
| `room.tileSize` | `2.0` | Tile size in metres |
| `room.ceilingGrid` | `true` | Drop-ceiling T-bar grid |
| `room.stripLights` | `true` | Fluorescent ceiling strips |
| `room.baseboardLights` | `true` | Floor accent LEDs |
| `room.fogNear` / `fogFar` | `22` / `55` | Fog range in metres |

```js
new Rack3DVisualizer('#container', {
  room: {
    width: 60, depth: 60, height: 35,
    floorTiles: true, tileSize: 2,
    fogNear: 35, fogFar: 110,
  },
});
```

---

### 4.3 Racks & Devices

**Modules:** `src/builders/RackBuilder.js` · `src/builders/DeviceBuilder.js`  
**Orchestrated by:** `GeometryManager.buildAllRacks()` → `_buildSingleRack()`

Each rack is a `THREE.Group` positioned in world space. Devices are child meshes inside that group built by `DeviceBuilder.build()`.

**Grid layout** is computed automatically from `layout.rows/cols/colSpacing/rowSpacing`. Individual racks can override with `position: {x,y,z}`.

```js
// Automatic grid placement
{ id: 'rack-a', row: 0, col: 0, name: 'RACK-A', units: 42, devices: [...] }

// Explicit world position
{ id: 'rack-c', position: { x: 8, z: 2 }, name: 'RACK-C', units: 12, devices: [...] }
```

**Scale reference:** `unitHeight = 0.445` scene units per U. 1 scene unit ≈ 10 cm.

| U count | Scene height |
|---|---|
| 12U | ~6.6 units (~66 cm) |
| 24U | ~11.9 units (~1.2 m) |
| 42U | ~19.9 units (~2.0 m) |

**Half-width devices** can be co-mounted in one slot:

```js
{ id: 'b6', name: 'Patch-L', type: 'patch', startUnit: 10, halfWidth: 'left' },
{ id: 'b7', name: 'Patch-R', type: 'patch', startUnit: 10, halfWidth: 'right' },
```

---

### 4.4 Room Items

**Module:** `src/builders/RoomItemBuilder.js`  
**Manager:** `GeometryManager.buildRoomItems()` / `clearRoomItems()`

Free-standing floor equipment rendered as 3D meshes with billboard labels.

Supported types:

| Type | Icon | Default Size (W×H×D) |
|---|---|---|
| `ups` | ⚡ | 3.0 × 8.0 × 1.8 |
| `battery` | 🔋 | 3.6 × 2.5 × 2.0 |
| `shelf` | 📦 | 5.0 × 5.0 × 1.2 |
| `pdu` | 🔌 | 0.5 × 10.0 × 0.4 |
| `aircon` | ❄ | 4.0 × 10.0 × 2.0 |
| `sensor` | 📡 | 0.4 × 2.2 × 0.4 |

```js
room_items: [
  { id: 'ri-1', type: 'ups',    name: 'UPS-Main', x: -20, y: 0, z: -8, angle: 0 },
  { id: 'ri-3', type: 'aircon', name: 'CRAC-01',  x: 18,  y: 0, z: -5, angle: 180,
    width: 4, height: 12, depth: 2 },
]
```

---

### 4.5 Camera System

**Module:** `Rack3DVisualizer.js` — `_bindCameraControls()` / `_posCamera()`

Two modes, toggled with the **⊹ FPS** / **⊕ ORBIT** toolbar button or `toggleCameraMode()`:

#### FPS Mode (default)

| Action | Effect |
|---|---|
| Click-drag | Look around (yaw/pitch) |
| Click `⊹ FPS` button | Lock pointer for mouse-look |
| `W`/`S` | Walk forward/back |
| `A`/`D` | Strafe left/right |
| `Q`/`E` | Move up/down |
| `ESC` | Release pointer lock |

#### Orbit Mode

| Action | Effect |
|---|---|
| Click-drag | Orbit around scene center |
| Scroll wheel | Zoom in/out |

```js
new Rack3DVisualizer('#container', {
  camera: {
    mode: 'fps',
    fpsSpeed: 0.12,
    azimuth: Math.PI,
    elevation: 0.15,
    initialPos: { x: 0, y: 16, z: -26 },
  },
});
```

**API methods:**

```js
viz.setCameraAngle(azimuth, elevation, distance);
viz.resetCamera();
viz.zoomIn();
viz.zoomOut();
viz.toggleCameraMode();   // fps ↔ orbit
```

---

### 4.6 Transform Mode (Move & Rotate)

**Module:** `Rack3DVisualizer.js` — `_setTransformMode()` / `_bindCameraControls()`  
**Hit-testing:** `SelectionManager.raycast()`

Two exclusive toolbar modes for repositioning racks and room items:

| Mode | Button | Gesture | Effect |
|---|---|---|---|
| **Move** | `✥ MOVE` | Click-drag on rack or room item | Moves the object on the floor plane |
| **Rotate** | `↻ ROTATE` | Horizontal drag on rack or room item | Rotates around Y axis |

Click the active button again to deactivate. When neither mode is active, click-drag always orbits/looks.

**Programmatic control:**

```js
viz._setTransformMode('move');    // activate move mode
viz._setTransformMode('rotate');  // activate rotate mode
viz._setTransformMode('move');    // toggle off (if already 'move')
```

**Position is stored in the data** and survives `setRoomData()`:

```js
// After dragging rack-a, its data will contain:
{ id: 'rack-a', position: { x: 3.5, y: 0, z: -2 }, ... }

// After rotating a room item:
{ id: 'ri-1', angle: 45, ... }

// After rotating a rack:
{ id: 'rack-a', facingAngle: 0.785, ... }  // radians
```

---

### 4.7 Device Labels

**Module:** `src/labels.js`  
**Rendering:** CSS `position:absolute` divs projected to screen coordinates each frame

Floating labels attach to the front face of each device and update every animation frame. They show device name, type icon, unit range, and watts.

| Option | Default | Description |
|---|---|---|
| `labels.enabled` | `true` | Show labels |
| `labels.side` | `'auto'` | `'auto'` alternates L/R, or force `'left'`/`'right'` |
| `labels.connectorLength` | `38` | Horizontal line length in px |
| `labels.showWatts` | `true` | Show watts value |
| `labels.showUnits` | `true` | Show unit range (e.g. `U3–U4`) |
| `labels.showType` | `true` | Show device type name |
| `labels.showIcon` | `true` | Show device type icon |

```js
new Rack3DVisualizer('#container', {
  labels: { enabled: true, side: 'right', showWatts: false },
});

viz.toggleLabels();   // toggle labels on/off
viz.setLabels(true);  // set programmatically
```

---

### 4.8 Themes

**Module:** `src/themes.js` — `resolveTheme()` / `THEMES`  
**Applied by:** `Rack3DVisualizer.setTheme()` → `_injectStyles()` + `MaterialFactory.setTheme()`

Five built-in themes:

| Name | Description |
|---|---|
| `dark` | Dark datacenter (default) — deep navy tones, cyan accent |
| `light` | Clean room — light grey, blue accent |
| `oled` | Pure black, high contrast |
| `warm` | Warm amber tones |
| `matrix` | Green-on-black terminal aesthetic |

```js
// Set on init
new Rack3DVisualizer('#container', { theme: 'light' });

// Change at runtime — full scene rebuild
viz.setTheme('matrix');
viz._onThemeChange('warm');  // also updates toolbar dropdown

// Custom theme — merges with 'dark' as base
viz.setTheme({
  css: { accent: '#ff6600', bg: '#0a0a0a' },
  scene: { clearColor: 0x0a0a0a },
  rack: { frameColor: 0x1a1a1a },
});
```

Theme selection in the toolbar saves to `getConfig()` and is restored when importing JSON.

---

### 4.9 Lighting

**Module:** `src/builders/EnvironmentBuilder.js` — `buildLightsOnly()`  
**UI:** Lighting panel with 3 tabs — Scene | Overhead | Custom

#### Scene Tab

| Option | Default | Description |
|---|---|---|
| `lighting.ambientIntensity` | `6.0` | `THREE.AmbientLight` intensity |
| `lighting.exposure` | `2.8` | `THREE.WebGLRenderer.toneMappingExposure` |
| `lighting.shadows` | `true` | Shadow maps on `THREE.DirectionalLight` |

#### Overhead Tab

| Option | Default | Description |
|---|---|---|
| `lighting.overheadCount` | `6` | Number of overhead light banks (2–12) |
| `lighting.overheadIntensity` | `9.0` | Intensity per overhead bank |

#### Custom Lights Tab

Add arbitrary lights to the scene:

```js
new Rack3DVisualizer('#container', {
  lighting: {
    customLights: [
      { type: 'point',       x: 0, y: 10, z: 0,  intensity: 5, color: '#ffffff', distance: 20 },
      { type: 'directional', x: 5, y: 8,  z: -3, intensity: 3, color: '#ffeedd' },
      { type: 'spot',        x: 0, y: 12, z: 5,  intensity: 8, color: '#ffffff', distance: 30 },
      { type: 'ceiling',     x: 2, y: 0,  z: 2,  intensity: 4, color: '#d0e8ff' },
    ],
  },
});
```

---

### 4.10 Sidebar Panels

**Module:** `src/sidebar.js` · `src/html.js`

The UI is split into two resizable sidebars:

**Left sidebar** (Room, Lighting, Catalog):

| Panel | Content |
|---|---|
| **Room** | 4 tabs: Racks · Layout · Walls · Pillars |
| **Lighting** | 3 tabs: Scene · Overhead · Custom |
| **Catalog** | Device template library with search |

**Right sidebar** (Rack Properties, Stats, Devices, etc.):

| Panel | Content |
|---|---|
| **Room Items** | Add/edit free-standing floor equipment |
| **Rack Properties** | 3 tabs: Config · Position · Nameplate |
| **Statistics** | PDU load bar + temperature bar |
| **Devices** | Scrollable device list for selected rack |
| **Edit Device** | 3 tabs: Properties · Style · Network |
| **Virtual Machines** | VM cards for selected server device |

**Toggle sidebars:**

```js
viz._toggleSidebarLeft();    // ◧ button
viz._toggleSidebarRight();   // ◨ button
```

**Control visibility via options:**

```js
new Rack3DVisualizer('#container', {
  sidebar: {
    showLeft:  true,
    showRight: true,
    leftWidth: 248,
    rightWidth: 260,
    lightingFields: ['ambientIntensity', 'exposure'],  // limit visible fields
  },
});
```

---

### 4.11 Catalog

**Module:** `src/catalog.js` — `renderCatalog()`, `addFromCatalog()`, `addCatalogItem()`, `removeCatalogItem()`

A library of reusable device templates that can be dragged or added to any selected rack.

```js
// Define catalog items alongside rack data
viz.setRoomData({
  catalog: [
    { id: 'cat-1', name: '1U Server',     type: 'server',  heightUnits: 1, watts: 300 },
    { id: 'cat-2', name: '2U GPU Server', type: 'server',  heightUnits: 2, watts: 800 },
    { id: 'cat-3', name: '48-port Switch',type: 'switch',  heightUnits: 1, watts: 180 },
    { id: 'cat-4', name: 'Half-U Patch',  type: 'patch',   heightUnits: 1, watts: 0, halfWidth: 'left' },
  ],
  racks: [...],
});
```

The **search input** at the top of the catalog panel filters items in real-time by name or type. Groups with no matching items are hidden automatically.

Items can be:
- **Clicked** to select and open an edit form
- **`+` button** to add directly to the currently selected rack
- **Dragged** onto a rack in the 3D view (requires `view.allowDragDrop: true`)

---

### 4.12 Virtual Machines

**Module:** `src/sidebar.js` — `_addVM()`, `_removeVM()`, `_editVM()`  
**HTML:** `src/html.js` — `vmCard()`, `vmPortRow()`

VM management is available on devices with `type: 'server'`. Each VM supports:

```js
{
  id: 'vm-1',
  name: 'nginx-prod',
  label: 'Production Web',
  technology: 'KVM/QEMU',    // VMware ESXi | KVM/QEMU | Hyper-V | Proxmox | Docker | LXC | Xen
  os: 'Ubuntu 22.04 LTS',
  status: 'running',         // running | stopped | paused
  ips: {
    local:  '192.168.1.10',
    public: '203.0.113.10',
  },
  ports: [
    { port: 80,  protocol: 'TCP', status: 'open',   service: 'HTTP'  },
    { port: 443, protocol: 'TCP', status: 'open',   service: 'HTTPS' },
    { port: 22,  protocol: 'TCP', status: 'closed', service: 'SSH'   },
  ],
  resources: { vcpu: 4, memory: 8192, disk: 100 },  // memory in MB, disk in GB
}
```

The VM panel is shown in the right sidebar when a server device is selected. Status is color-coded: green (running), amber (paused), red (stopped).

---

### 4.13 Walls & Pillars

**Module:** `src/builders/EnvironmentBuilder.js` — `_buildWalls()`, `_buildPillars()`  
**Data:** `room.room_walls` · `room.room_pillars`  
**UI:** Room panel → Walls tab / Pillars tab

#### Custom Walls

When `room_walls` is present, it overrides the auto-generated 4-wall box. Each wall is an independent mesh:

```js
room_walls: [
  { id: 'w1', name: 'North Wall', length: 60, height: 14, x: 0,  z: -30, angle: 0,    opacity: 1.0, visible: true },
  { id: 'w2', name: 'East Wall',  length: 60, height: 14, x: 30, z: 0,   angle: 1.571, opacity: 0.5, visible: true },
]
```

| Field | Type | Description |
|---|---|---|
| `length` | `number` | Wall length in metres |
| `height` | `number` | Wall height in metres |
| `x` / `z` | `number` | World position |
| `angle` | `number` | Y-axis rotation in radians |
| `color` | `string` | CSS hex color (overrides theme) |
| `opacity` | `number` | 0–1 transparency |
| `visible` | `boolean` | Show/hide wall |

Use **⟳ Auto** in the Walls tab to regenerate from room dimensions.

#### Pillars

```js
room_pillars: [
  { id: 'p1', x: -15, z: -10, shape: 'cylinder', radius: 0.4,  height: 14 },
  { id: 'p2', x: 15,  z: -10, shape: 'square',   width:  0.8, depth: 0.8, height: 14 },
]
```

| Shape | Required Fields |
|---|---|
| `cylinder` | `radius`, `height` |
| `square` | `width`, `depth`, `height` |

---

### 4.14 2D Schematic Mode

**Module:** `src/render2d.js`  
**Toggle:** `viz.toggleMode()` or `viz.setMode('2d')`

Switches to a flat top-down schematic view of all racks. Supports PNG / JPG / SVG export via toolbar buttons in the 2D view.

```js
viz.setMode('2d');   // switch to flat schematic
viz.setMode('3d');   // switch back to 3D
viz.toggleMode();    // toggle between modes
```

---

### 4.15 JSON Export / Import

**Methods:** `viz.getConfig()` · `viz.exportJson()` · `viz.applyJson()` · `viz.copyJson()`

The JSON format bundles the full room data and UI config:

```json
{
  "room": {
    "catalog": [...],
    "layout": { "rows": 1, "cols": 3, "colSpacing": 8 },
    "room_items": [...],
    "racks": [...]
  },
  "config": {
    "theme": "dark",
    "sidebar": {
      "showLeft": true,
      "showRight": true,
      "leftWidth": 248,
      "rightWidth": 260,
      "panelLayout": { "left": [...], "right": [...], "collapsed": {} }
    },
    "lighting": {
      "customLights": [...]
    }
  }
}
```

```js
// Programmatic export
const snapshot = {
  room:   viz.getData(),
  config: viz.getConfig(),
};

// Programmatic import
viz.setRoomData(snapshot.room);
viz._applyConfig(snapshot.config);

// Copy to clipboard
viz.copyJson();
```

---

### 4.16 Panel Drag-and-Drop Layout

**Module:** `Rack3DVisualizer.js` — `_onPanelDragStart()`, `_onPanelDropPanel()`, `_onPanelDropSidebar()`

Every sidebar panel has a drag handle (`⠿`). Panels can be:

- **Reordered** within a sidebar by dragging to a new position
- **Moved** between left and right sidebars by dragging across
- **Collapsed** by clicking `▾` in the panel header

Layout state is saved in `sidebar.panelLayout` and restored via `_restorePanelState()`. The layout persists through JSON export/import.

---

### 4.17 Axis Gizmo & Compass

**Module:** `Rack3DVisualizer.js` — `_updateAxisGizmo()`, `_updateCompass()`

Two orientation indicators updated every frame:

**Axis Gizmo** (top-left of canvas): 64×64 canvas showing X (red), Y (green), Z (blue) axes projected from the camera's world matrix. Axes are sorted back-to-front for correct overdraw.

**Compass** (top-right of canvas): Cardinal direction ring (N/E/S/W) with a rotating SVG needle. The needle tracks the camera's horizontal yaw so N always points scene-north.

---

## 5. Public API Reference

```js
const viz = new Rack3DVisualizer(container, options);
```

| Method | Returns | Description |
|---|---|---|
| `setRoomData(room)` | `this` | Load full room object (deep-cloned) |
| `setData(rack)` | `this` | Load single rack (backward-compat wrapper) |
| `getData()` | `Object` | Deep-cloned snapshot of current room state |
| `getSelectedRack()` | `Object\|null` | Deep-cloned currently selected rack |
| `getConfig()` | `Object` | UI config snapshot (theme, sidebar, custom lights) |
| `setTheme(name\|obj)` | `this` | Apply a named or custom theme |
| `setOptions(partial)` | `this` | Merge partial options and re-render |
| `setMode('2d'\|'3d')` | `this` | Switch render mode |
| `setWireframe(bool)` | `this` | Toggle wireframe overlay |
| `setLabels(bool)` | `this` | Toggle device labels |
| `toggleLabels()` | — | Toggle labels on/off |
| `toggleWire()` | — | Toggle wireframe on/off |
| `toggleMode()` | — | Toggle 2D/3D |
| `toggleCameraMode()` | — | Toggle FPS/orbit |
| `setCameraAngle(az,el,dist)` | `this` | Set orbit camera angles |
| `resetCamera()` | `this` | Reset camera to initial position |
| `zoomIn()` | `this` | Zoom in one step |
| `zoomOut()` | `this` | Zoom out one step |
| `resetRack()` | — | Clear all devices from selected rack (prompts) |
| `copyJson()` | — | Copy room JSON to clipboard |
| `exportJson()` | — | Populate JSON editor with current data |
| `applyJson()` | — | Parse and load JSON from editor textarea |
| `toggleJson()` | — | Show/hide JSON editor panel |
| `toggleHelp()` | — | Show/hide Help/About modal |
| `destroy()` | `this` | Dispose all Three.js resources and remove DOM |

---

## 6. Options Reference

```js
new Rack3DVisualizer(container, {
  theme:   'dark',
  view:    { ... },
  camera:  { ... },
  lighting:{ ... },
  room:    { ... },
  rack:    { ... },
  labels:  { ... },
  sidebar: { ... },
  deviceTypes: { ... },
  onSelect: (device) => {},
  onChange: (room) => {},
  onReady:  (viz) => {},
});
```

### `view`

| Option | Default | Description |
|---|---|---|
| `mode` | `'3d'` | `'3d'` or `'2d'` |
| `wireframe` | `false` | Start in wireframe mode |
| `showLabels` | `true` | Device labels visible on start |
| `autoRotate` | `false` | Auto-orbit the scene |
| `autoRotateSpeed` | `0.003` | Radians per frame |
| `showToolbar` | `true` | Top header toolbar |
| `allowDragDrop` | `true` | Drag catalog items onto racks |
| `allowEdit` | `true` | Click-to-edit devices |
| `allowAddRemove` | `true` | Add / remove devices via UI |
| `allowJsonEdit` | `true` | JSON editor panel |

### `camera`

| Option | Default | Description |
|---|---|---|
| `mode` | `'fps'` | `'fps'` or `'orbit'` |
| `fov` | `44` | Field of view in degrees |
| `azimuth` | `Math.PI` | Initial orbit horizontal angle |
| `elevation` | `0.15` | Initial orbit vertical angle |
| `distance` | `'auto'` | Orbit distance (`'auto'` = rack height × 2.2) |
| `fpsSpeed` | `0.12` | FPS walk speed |
| `initialPos` | `{x:0,y:16,z:-26}` | FPS starting world position |
| `orbitSpeed` | `0.0045` | Mouse drag speed |
| `zoomSpeed` | `0.035` | Scroll zoom speed |

### `lighting`

| Option | Default | Description |
|---|---|---|
| `ambientIntensity` | `6.0` | Ambient light intensity |
| `ambientColor` | `0xd0e8ff` | Ambient light color |
| `overheadCount` | `6` | Number of overhead light banks |
| `overheadIntensity` | `9.0` | Overhead light intensity |
| `exposure` | `2.8` | Tone-mapping exposure |
| `shadows` | `true` | Shadow maps |
| `customLights` | `[]` | Array of custom light descriptors |

### `rack`

| Option | Default | Description |
|---|---|---|
| `unitHeight` | `0.445` | Metres per rack unit |
| `width` | `5.6` | Rack frame width in metres |
| `depth` | `4.0` | Rack frame depth in metres |
| `showSidePanels` | `true` | Perforated side panels |
| `showRearPanel` | `true` | Rear cable-management panel |
| `showNameplate` | `true` | Front nameplate bar |
| `nameplateScale` | `1.0` | Nameplate size multiplier |
| `nameplateOpacity` | `1.0` | Nameplate opacity 0–1 |

---

## 7. Device Types

Built-in types from `src/constants.js`:

| Key | Label | Color | Icon |
|---|---|---|---|
| `server` | Server | `#2288ff` | ▣ |
| `firewall` | Firewall | `#ff3344` | ⬡ |
| `router` | Router | `#00cc77` | ◈ |
| `switch` | Switch | `#ffaa00` | ⬢ |
| `security` | Security | `#ff55cc` | ◆ |
| `storage` | Storage | `#9966ff` | ▤ |
| `pdu` | PDU | `#00ddcc` | ⚡ |
| `patch` | Patch Panel | `#888888` | ⊞ |
| `ups` | UPS | `#ff8800` | 🔋 |
| `kvm` | KVM | `#44aaff` | ⌨ |
| `loadbal` | Load Balancer | `#cc44ff` | ⚖ |

**Register custom types:**

```js
new Rack3DVisualizer('#container', {
  deviceTypes: {
    gpu:    { color: '#22ee66', hex: 0x22ee66, label: 'GPU Server',   icon: '⬛' },
    camera: { color: '#ff9900', hex: 0xff9900, label: 'IP Camera',    icon: '📷' },
  },
});
```

---

## 8. Callbacks

```js
new Rack3DVisualizer('#container', {
  onReady(viz) {
    // Called once Three.js scene is fully initialized
    console.log('Scene ready');
    viz.setRoomData(myData);
  },

  onSelect(device) {
    // Called when user clicks a device
    // device is the raw device object from room.racks[i].devices
    console.log('Selected:', device.name, device.type);
  },

  onChange(room) {
    // Called after any user edit (name change, device add/remove, drag, etc.)
    // room is the full current room data object
    saveToServer(room);
  },
});
```

---

## 9. Module Architecture

All source files live in `rack3d-npm/rack3d-visualizer-1.0.0/package/src/`.

| File | Role |
|---|---|
| `Rack3DVisualizer.js` | Main exported class. Constructor, public API, camera controls, event binding, animation loop. All state lives here. |
| `options.js` | `DEFAULT_OPTIONS` constant and `mergeOptions()` deep-merge function |
| `themes.js` | `THEMES` map (5 built-in themes) and `resolveTheme()` |
| `constants.js` | `DEVICE_TYPES` registry, `tempColor()`, `hexToRgb()` |
| `html.js` | Builds the full DOM scaffold as an HTML string (`buildHTML()`) and panel body builders |
| `css.js` | Generates scoped CSS string from theme + opts (`buildCSS()`) |
| `sidebar.js` | Left/right sidebar DOM updates — rack list, device list, unit map, stat cards, edit form |
| `catalog.js` | Catalog panel — grouped/collapsible/searchable list, add-to-rack logic |
| `labels.js` | Floating 3D CSS device labels — DOM divs projected to screen coordinates each frame |
| `render2d.js` | 2D flat schematic renderer and PNG/JPG/SVG export |
| `builders/RackBuilder.js` | Three.js mesh for the rack frame (posts, panels, unit markers, nameplate) |
| `builders/DeviceBuilder.js` | Three.js mesh for each device (faceplate, image texture, status LED) |
| `builders/EnvironmentBuilder.js` | Room shell — floor, walls, ceiling, lights, pillars |
| `builders/RoomItemBuilder.js` | 3D models for free-standing room items (UPS, aircon, etc.) |
| `services/GeometryManager.js` | Orchestrates all builders — build/clear racks, devices, environment, room items |
| `services/MaterialFactory.js` | Creates and caches `THREE.MeshStandardMaterial` instances per theme |
| `services/SelectionManager.js` | Raycasting for mouse hit-testing — returns `{type,id,rackId}` |

### Class Interaction Diagram

```
Rack3DVisualizer (main class)
  ├── GeometryManager
  │     ├── RackBuilder        → THREE.Group per rack
  │     ├── DeviceBuilder      → child meshes in rack group
  │     ├── EnvironmentBuilder → floor / walls / ceiling / lights
  │     └── RoomItemBuilder    → free-standing equipment meshes
  ├── MaterialFactory          → cached MeshStandardMaterial
  ├── SelectionManager         → Raycaster hit testing
  ├── sidebar.js               → DOM refresh on selection/edit
  ├── catalog.js               → catalog panel DOM
  ├── labels.js                → per-frame CSS label projection
  └── render2d.js              → 2D schematic renderer
```

### DOM Scoping

Every instance gets a unique ID (`r3d-1`, `r3d-2`, …). All CSS is scoped to `#r3d-N` and all element IDs are prefixed with `self._id + '-'`. The global `window._r3[instanceId]` registry allows inline `onclick` handlers in generated HTML to call instance methods. Multiple instances on one page are fully isolated.
