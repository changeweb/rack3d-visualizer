# rack3d-visualizer

> A fully featured **3D / 2D server rack visualizer** — JSON-driven, themeable, zero-framework.  
> Mount into any DOM element, feed it rack JSON, get an interactive datacenter scene.

![Version](https://img.shields.io/badge/version-1.0.0-00d4ff?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-00ff88?style=flat-square)
![Three.js](https://img.shields.io/badge/three.js-r128%2B-ffaa00?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-d2a8ff?style=flat-square)

---

## Features

| Feature | Detail |
|---|---|
| **3D rack frame** | Hollow Oracle/Cisco-style — 4 corner posts, crossbars, per-unit rails, no solid walls |
| **Devices** | 11 built-in types, custom types, colored panels, LEDs, drive bays, port grids |
| **Datacenter room** | Walls, raised floor tiles, drop ceiling, fluorescent strips, cable trays, baseboard LEDs |
| **Lighting** | 6-bank overhead, key/fill/rim directionals, rack glow, ACES tone mapping |
| **Labels** | Floating 3D-projected CSS labels, alternating left/right, connector lines |
| **Themes** | 5 built-ins (`dark`, `light`, `oled`, `warm`, `matrix`) + full custom support |
| **2D mode** | Flat schematic diagram, switchable at runtime |
| **Drag & drop** | Reorder devices via unit map strip |
| **Camera** | Mouse orbit, scroll zoom, touch, auto-rotate, programmatic angles |
| **JSON driven** | All rack data in/out as plain JSON — no proprietary schema |
| **Zero framework** | Works in vanilla JS, React, Vue, Angular, Svelte — anything |
| **TypeScript** | Full `.d.ts` declarations included |

---

## Screenshots

```
┌─────────────────────────────────────────────────────────────────┐
│  DARK THEME (default)           LIGHT THEME                     │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │ ▣ Core Router    │           │ ▣ Core Router    │            │
│  │ ⬡ Firewall FW-1  │           │ ⬡ Firewall       │            │
│  │ ⊞ Patch Panel    │           │ ⬢ Switch         │            │
│  │ ⬢ Switch 48p     │           │ ▣ DB Server      │            │
│  │ ▣ Web Server     │           │ ▤ Storage        │            │
│  │ ▣ DB Server      │           └──────────────────┘            │
│  │ ▤ NAS Storage    │                                           │
│  └──────────────────┘                                           │
│                                                                 │
│  MATRIX THEME                   2D SCHEMATIC MODE               │
│  ┌──────────────────┐           ┌─────────────────────────────┐ │
│  │ ▣ Core Router    │  ←labels  │  DC-RACK-01 · 24U           │ │
│  │ ⬡ Firewall   →   │           │  ▣ Core Router  U1-2  450W  │ │
│  │ ▤ Storage        │           │  ⬡ Firewall     U3-4  320W  │ │
│  └──────────────────┘           │  ⬢ Switch       U5    180W  │ │
│                                 └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

> Live interactive docs with rendered screenshots: **[docs/index.html](./docs/index.html)**

---

## Installation

```bash
# npm
npm install rack3d-visualizer three

# yarn
yarn add rack3d-visualizer three

# pnpm
pnpm add rack3d-visualizer three
```

> **Three.js is a peer dependency.** Install it alongside the package.  
> Minimum supported version: `three@0.128.0`

### CDN (no build step)

```html
<!-- Three.js must load first -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- Rack3D UMD bundle (exposes window.Rack3D) -->
<script src="https://cdn.jsdelivr.net/npm/rack3d-visualizer/dist/rack3d-visualizer.umd.js"></script>
```

---

## Quickstart

### Vanilla JS (ESM)

```js
import { Rack3DVisualizer } from 'rack3d-visualizer';

const viz = new Rack3DVisualizer('#my-rack', {
  theme: 'dark',
  camera: { azimuth: Math.PI, elevation: 0.15 },
  onSelect: (device) => console.log('Selected:', device.name),
  onChange: (data)   => console.log('Changed:', data.rack.name),
});

viz.setData({
  name: 'PROD-RACK-01',
  units: 24,
  rackTemp: 38,        // °C  — rack-level sensor
  pduCapacity: 6400,   // W   — PDU rated capacity
  pduLoad: 3215,       // W   — current draw reading
  devices: [
    { id: 'd1', name: 'Core Router',   type: 'router',   startUnit: 1,  heightUnits: 2, watts: 450 },
    { id: 'd2', name: 'Firewall FW-1', type: 'firewall', startUnit: 3,  heightUnits: 2, watts: 320 },
    { id: 'd3', name: 'Patch Panel A', type: 'patch',    startUnit: 5,  heightUnits: 1, watts: 0   },
    { id: 'd4', name: 'Switch 48p',    type: 'switch',   startUnit: 6,  heightUnits: 1, watts: 180 },
    { id: 'd5', name: 'Web Server 01', type: 'server',   startUnit: 7,  heightUnits: 2, watts: 620 },
    { id: 'd6', name: 'DB Server',     type: 'server',   startUnit: 9,  heightUnits: 4, watts: 850 },
    { id: 'd7', name: 'NAS Storage',   type: 'storage',  startUnit: 14, heightUnits: 3, watts: 290 },
    { id: 'd8', name: 'IDS Sensor',    type: 'security', startUnit: 18, heightUnits: 1, watts: 95  },
    { id: 'd9', name: 'Backup Server', type: 'server',   startUnit: 20, heightUnits: 2, watts: 410 },
    { id: 'd10',name: 'PDU-A',         type: 'pdu',      startUnit: 23, heightUnits: 1, watts: 30  },
  ]
});
```

### CDN / UMD

```html
<div id="my-rack" style="width:100%;height:100vh"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/rack3d-visualizer/dist/rack3d-visualizer.umd.js"></script>
<script>
  const { Rack3DVisualizer } = Rack3D;
  const viz = new Rack3DVisualizer('#my-rack', { theme: 'dark' });
  viz.setData({ /* rack JSON */ });
</script>
```

---

## JSON Schema

```jsonc
{
  "rack": {
    "name":         "DC-RACK-01",  // Display name
    "units":        24,            // Total rack units (4–48)

    // Rack-level sensors — NOT per-device
    "rackTemp":     38,            // °C  — intake air temperature
    "pduCapacity":  6400,          // W   — PDU rated capacity
    "pduLoad":      3215,          // W   — current PDU load

    "devices": [
      {
        "id":          "d1",         // Unique string ID
        "name":        "Core Router", // Label in 3D, sidebar, unit map
        "type":        "router",      // Device type key (see types below)
        "startUnit":   1,             // First unit (1-indexed from bottom)
        "heightUnits": 2,             // Height in units (1–12)
        "watts":       450            // Power draw (W)
        // Any extra fields are preserved through getData() / onChange()
      }
    ]
  }
}
```

> **Important:** `rackTemp` and `pduLoad` / `pduCapacity` are rack-level properties.  
> Real datacenter racks have one temperature sensor and one PDU — not one per device.

---

## Device Types

| Key | Label | Color | Icon | Auto-renders |
|---|---|---|---|---|
| `server` | Server | `#2288ff` | ▣ | Drive bays, vent slots |
| `firewall` | Firewall | `#ff3344` | ⬡ | Port grid (6 ports) |
| `router` | Router | `#00cc77` | ◈ | Port grid (6 ports) |
| `switch` | Switch | `#ffaa00` | ⬢ | Port grid (12 ports) |
| `security` | Security | `#ff55cc` | ◆ | Standard panel |
| `storage` | Storage | `#9966ff` | ▤ | Drive bays, vent slots |
| `pdu` | PDU | `#00ddcc` | ⚡ | Standard panel |
| `patch` | Patch Panel | `#888888` | ⊞ | Port grid (24 ports) |
| `ups` | UPS | `#ff8800` | 🔋 | Standard panel |
| `kvm` | KVM | `#44aaff` | ⌨ | Standard panel |
| `loadbal` | Load Balancer | `#cc44ff` | ⚖ | Port grid (6 ports) |

### Custom types

```js
const viz = new Rack3DVisualizer('#rack', {
  deviceTypes: {
    gpu_node: { color: '#22ff88', hex: 0x22ff88, label: 'GPU Node', icon: '◉' },
    tape_lib: { color: '#cc6600', hex: 0xcc6600, label: 'Tape Library', icon: '⏭' },
  }
});
```

---

## Themes

| Name | Description |
|---|---|
| `'dark'` | Default — deep blue datacenter palette |
| `'light'` | Bright clean room — inverted, high contrast |
| `'oled'` | Pure black, maximum contrast for AMOLED |
| `'warm'` | Amber / industrial data-hall aesthetic |
| `'matrix'` | All-green terminal / CRT monitor look |

```js
// By name
viz.setTheme('matrix');

// Custom theme — partial object merged with 'dark' base
viz.setTheme({
  css:   { bg: '#0d0018', accent: '#cc44ff', panel: '#110020' },
  scene: { clearColor: 0x0a0015, ambientColor: 0xcc88ff, stripEmissive: 18 },
  rack:  { frameColor: 0x1a0030, postColor: 0x2a0050 },
});
```

---

## Full Options Reference

All options are optional and deeply merged over defaults.

```js
new Rack3DVisualizer(container, {

  theme: 'dark',   // 'dark'|'light'|'oled'|'warm'|'matrix' or partial theme object

  // ── View / render ─────────────────────────────────────────────
  view: {
    mode:            '3d',     // '3d' | '2d'
    wireframe:       false,    // Start in wireframe
    showLabels:      true,     // Floating device labels
    autoRotate:      false,    // Slow orbit
    autoRotateSpeed: 0.003,    // Radians/frame
    showToolbar:     true,     // Top header bar
    allowDragDrop:   true,     // Drag to reorder in unit map
    allowEdit:       true,     // Click-to-edit device
    allowAddRemove:  true,     // Add/remove via UI
    allowJsonEdit:   true,     // JSON editor panel
  },

  // ── Camera ────────────────────────────────────────────────────
  camera: {
    fov:         44,           // Perspective FOV (degrees)
    azimuth:     Math.PI,      // Horizontal angle — PI = front face
    elevation:   0.15,         // Vertical angle — 0 = level
    distance:    'auto',       // 'auto' = rackHeight × 2.2, or number
    minDistance: 4,
    maxDistance: 80,
    orbitSpeed:  0.0045,
    zoomSpeed:   0.035,
  },

  // ── Lighting ──────────────────────────────────────────────────
  lighting: {
    ambientIntensity:   6.0,   // Scene ambient (higher = no shadows)
    ambientColor:       0xd0e8ff,
    overheadIntensity:  9.0,   // Per overhead-bank intensity
    overheadCount:      6,     // Overhead light fixtures (2–12)
    frontIntensity:     10.0,  // Key light on device faces
    fillIntensity:      6.0,   // Left/right fills
    rackGlowIntensity:  6.0,   // Internal rack PointLight
    floorGlowIntensity: 3.0,   // Floor bounce PointLights
    exposure:           2.8,   // ACES tone-mapping multiplier
    shadows:            true,  // PCF soft shadow maps
  },

  // ── Server room environment ───────────────────────────────────
  room: {
    enabled:         true,
    width:           26,       // metres
    depth:           20,
    height:          14,
    floorTiles:      true,     // Raised floor 0.6 m tile grid
    ceilingGrid:     true,     // T-bar drop ceiling grid
    stripLights:     true,     // Emissive fluorescent strips
    baseboardLights: true,     // Blue LED floor accent
    exitSign:        true,     // Green exit sign on rear wall
    cableTrays:      true,     // Wall-mounted cable management
    fogNear:         22,       // Fog start distance
    fogFar:          55,       // Fog full-density distance
  },

  // ── Rack geometry ─────────────────────────────────────────────
  rack: {
    unitHeight:     0.445,     // metres per rack unit
    width:          5.6,
    depth:          4.0,
    postSize:       0.16,      // Corner post square size
    showSidePanels: true,
    showRearPanel:  true,
    showNameplate:  true,
  },

  // ── Floating labels ───────────────────────────────────────────
  labels: {
    enabled:         true,
    side:            'auto',   // 'auto' alternates L/R | 'left' | 'right'
    connectorLength: 38,       // Horizontal line px
    showWatts:       true,
    showUnits:       true,
    showType:        true,
    showIcon:        true,
  },

  // ── Sidebar ───────────────────────────────────────────────────
  sidebar: {
    enabled:        true,
    position:       'left',    // 'left' | 'right'
    width:          248,
    showRackConfig: true,
    showStats:      true,
    showDeviceList: true,
    showAddButtons: true,
    showEditPanel:  true,
    showUnitMap:    true,
    showLegend:     true,
  },

  // ── Custom device types ───────────────────────────────────────
  deviceTypes: {},

  // ── Callbacks ─────────────────────────────────────────────────
  onSelect: (device) => {},    // RackDevice object
  onChange: (data)   => {},    // { rack: RackData }
  onReady:  (viz)    => {},    // Rack3DVisualizer instance
});
```

---

## Public API

All mutating methods return `this` for chaining.

```js
// Data
viz.setData(rackData)         // Load / replace all rack data
viz.getData()                 // → deep copy of current rack JSON

// Theme & options
viz.setTheme('matrix')        // Switch theme by name or partial object
viz.setOptions({ view: { autoRotate: true } })  // Deep-merge options

// View mode
viz.setMode('2d')             // '3d' | '2d'
viz.setWireframe(true)        // Toggle wireframe
viz.setLabels(false)          // Toggle floating labels

// Camera
viz.setCameraAngle(Math.PI, 0.2, 28)  // azimuth, elevation, distance
viz.resetCamera()             // Return to configured defaults

// Toolbar toggles (also bound to toolbar buttons)
viz.toggleLabels()
viz.toggleWire()
viz.toggleMode()
viz.toggleJson()
viz.exportJson()              // Write current state to JSON editor
viz.applyJson()               // Parse + apply JSON editor content

// Cleanup
viz.destroy()                 // Dispose renderer, DOM, events
```

### Method chaining

```js
viz
  .setData(myRack)
  .setTheme('oled')
  .setCameraAngle(Math.PI, 0.2, 32)
  .setOptions({ view: { autoRotate: true, autoRotateSpeed: 0.002 } });
```

---

## Bundler setup (Vite / Webpack / Rollup)

**Required one-time step** when using any module bundler. Call `Rack3DVisualizer.useThree()` once in your entry file — before any component mounts — to register the host app's Three.js instance. Without this, the library tries to load Three.js from a CDN `<script>` tag, resulting in two copies of Three.js and a crash:

```
WARNING: Multiple instances of Three.js being imported.
TypeError: Cannot assign to read only property 'position'
```

**Fix — add to `main.jsx` / `main.tsx`:**

```jsx
// main.jsx — add these lines once, at the very top
import * as THREE from 'three';
import { Rack3DVisualizer } from 'rack3d-visualizer';

Rack3DVisualizer.useThree(THREE); // ← register before any component renders

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

> This is only needed for bundler environments. Plain `<script>` CDN usage does not need it.

---

## React Integration

### Step 1 — register Three.js in `main.jsx` (required for Vite/Webpack)

See [Bundler setup](#bundler-setup-vite--webpack--rollup) above. Do this once before anything else.

### Step 2 — define rack data outside the component

Defining `rackData` inside a component body creates a new object reference on every render, which triggers an infinite `setData` loop. Always define it at module scope or inside `useRef`/`useMemo`:

```jsx
// ✅ module scope — reference is stable forever
const RACK_DATA = {
  name: 'PROD-RACK-01', units: 24,
  rackTemp: 38, pduCapacity: 6400, pduLoad: 3215,
  devices: [
    { id: 'd1', name: 'Core Router',  type: 'router',   startUnit: 1, heightUnits: 2, watts: 450 },
    { id: 'd2', name: 'Firewall',     type: 'firewall', startUnit: 3, heightUnits: 2, watts: 320 },
    { id: 'd3', name: 'Switch 48p',   type: 'switch',   startUnit: 5, heightUnits: 1, watts: 180 },
    { id: 'd4', name: 'Web Server',   type: 'server',   startUnit: 6, heightUnits: 2, watts: 620 },
    { id: 'd5', name: 'DB Server',    type: 'server',   startUnit: 8, heightUnits: 4, watts: 850 },
    { id: 'd6', name: 'NAS Storage',  type: 'storage',  startUnit: 13, heightUnits: 3, watts: 290 },
  ],
};
```

### Step 3 — mount the visualizer

```jsx
import { useEffect, useRef } from 'react';
import { Rack3DVisualizer } from 'rack3d-visualizer';

// ✅ RACK_DATA defined at module scope (see Step 2)

export default function App() {
  const containerRef = useRef(null);
  const vizRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    vizRef.current = new Rack3DVisualizer(containerRef.current, {
      theme:    'dark',
      camera:   { azimuth: Math.PI, elevation: 0.15 },
      onSelect: (device) => console.log('Selected:', device.name),
      onChange: (data)   => console.log('Changed:',  data.rack.name),
    });

    vizRef.current.setData(RACK_DATA);

    return () => {
      vizRef.current?.destroy(); // ← always clean up on unmount
      vizRef.current = null;
    };
  }, []); // runs once

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

> **Always call `viz.destroy()` in the useEffect cleanup** to prevent Three.js memory leaks on unmount.

---

## Multiple instances

Each instance is fully isolated — scoped CSS, separate Three.js renderer, separate DOM tree.

```js
const rack1 = new Rack3DVisualizer('#rack-a', { theme: 'dark'   });
const rack2 = new Rack3DVisualizer('#rack-b', { theme: 'light'  });
const rack3 = new Rack3DVisualizer('#rack-c', { theme: 'matrix' });

rack1.setData(dataA);
rack2.setData(dataB);
rack3.setData(dataC);
```

---

## Local development

```bash
git clone https://github.com/your-org/rack3d-visualizer
cd rack3d-visualizer
npm install

# Build ESM + CJS + UMD
npm run build

# Watch mode
npm run dev

# Serve examples locally (no extra deps)
npm run serve
# → http://localhost:3000/examples/basic/
# → http://localhost:3000/examples/vanilla/
# → http://localhost:3000/docs/
```

---

## Browser support

| Browser | Version |
|---|---|
| Chrome / Edge | 80+ |
| Firefox | 74+ |
| Safari | 14+ |
| iOS Safari | 14+ |
| Android Chrome | 80+ |

Requires WebGL 1.0. Three.js r128 handles the feature detection.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

## Contributing

1. Fork → branch → commit → PR
2. Run `npm run build` before committing
3. Keep `src/` files modular — one concern per file
4. New device types: add to `src/constants.js` → rebuild → update docs

---

*Built on [Three.js](https://threejs.org/) r128+*
