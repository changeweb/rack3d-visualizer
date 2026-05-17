# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Guideline

- **No need to provide explanation** of your thinking, reasoning, and of the output and do not need to tell what issues have been solved.
- Always stop the running node server after I give my prompt.

## Two-Project Structure

This repo contains two distinct projects:

1. **React app** (`/home/hasib/my-app/`) — Vite + React consumer that demos the visualizer
2. **npm package** (`rack3d-npm/rack3d-visualizer-1.0.0/package/`) — the `rack3d-visualizer` library itself

The React app consumes the library as a **local `.tgz` file**, not from a registry. The packed tarball lives at `rack3d-visualizer-1.0.0.tgz` in the repo root.

## Commands

### React app (run from `/home/hasib/my-app/`)
```bash
npm run dev          # start Vite dev server (defaults to :5173)
npm run build        # production build
npm run lint         # ESLint
```

### Library package (run from `rack3d-npm/rack3d-visualizer-1.0.0/package/`)
```bash
npm run build        # Rollup → dist/ (CJS + ESM + UMD)
npm run dev          # Rollup watch mode
```

## Critical: Edit → Rebuild → Reinstall Workflow

Editing source files in `rack3d-npm/.../src/` has **no effect** until the package is rebuilt and reinstalled into the React app. The full cycle every time:

```bash
cd rack3d-npm/rack3d-visualizer-1.0.0/package
npm run build

npm pack --quiet
mv rack3d-visualizer-1.0.0.tgz /home/hasib/my-app/

cd /home/hasib/my-app
npm uninstall rack3d-visualizer --silent
npm install ./rack3d-visualizer-1.0.0.tgz --silent
```

Then restart the Vite dev server with `--force` to bust the dependency cache:
```bash
npm run dev -- --port 5173 --force
```

Vite log is written to `/tmp/vite.log` during dev sessions.

## Library Architecture (`rack3d-npm/.../src/`)

`Rack3DVisualizer.js` is the single exported class. Every other source file is a **module of standalone functions** that accept `self` (the class instance) as their first argument. The class holds all state and delegates work to these modules.

| File | Responsibility |
|---|---|
| `Rack3DVisualizer.js` | Main class: constructor, public API, camera controls, animation loop, event binding |
| `geometry.js` | Three.js mesh building — rack frame, devices, rack-name labels, unit labels; all geometry is inside a `T.Group` per rack |
| `scene.js` | Environment — floor/walls/ceiling, lights, strip lights, cable trays. **Hardcodes `cx=0, cz=2`** as the room center offset |
| `sidebar.js` | Left sidebar DOM: rack list panel, device list, unit map, stat cards, edit form |
| `catalog.js` | Device catalog panel — grouped/collapsible by type, add-to-rack logic |
| `html.js` | Builds the full DOM scaffold as an HTML string |
| `css.js` | Generates scoped CSS string (scoped to `#instanceId`) |
| `labels.js` | Floating 3D-projected CSS device labels — created as DOM divs, projected to screen coords each frame |
| `render2d.js` | 2D flat schematic mode |
| `options.js` | `DEFAULT_OPTIONS` + `mergeOptions()` deep-merge |
| `themes.js` | Five built-in themes (`dark`, `light`, `oled`, `warm`, `matrix`) |
| `constants.js` | `DEVICE_TYPES` registry, `tempColor()`, `hexToRgb()` |

## Data Model

```
room {
  catalog: [...],          // shared device catalog across all racks
  layout: { rows, cols, colSpacing, rowSpacing },
  racks: [
    {
      id, name, units,
      row, col,            // grid placement (used if no position)
      position: {x, y, z}, // optional: overrides row/col with explicit world coords
      facingAngle,         // optional: Y-axis rotation in radians
      rackTemp, pduCapacity, pduLoad,
      devices: [ { id, name, type, startUnit, heightUnits, watts, ... } ]
    }
  ]
}
```

Key instance state in `Rack3DVisualizer`:
- `_room` — full room data
- `_rack` — pointer to currently selected rack (one of `_room.racks[i]`)
- `_selRackId` / `_selId` — selected rack ID and device ID
- `_rackGroups` — `{ [rackId]: THREE.Group }` — one group per rack in the scene

## Scale

`unitHeight = 0.445` scene units per rack unit. One scene unit ≈ **10 cm** (since 1U = 44.5 mm real-world). Key reference heights:
- 42U rack: `42 × 0.445 + 1.3 ≈ 20` units tall (~2 m)
- Average human eye level: **y ≈ 16** units (~1.6 m)
- Room `height: 24` in App.jsx = ~2.4 m ceiling

## Camera System

Two modes toggled by `toggleCameraMode()`:

**FPS mode** (default): Pointer lock — click canvas to lock mouse, `movementX/Y` drives yaw/pitch, WASD/QE for movement. Position is clamped to room bounds every frame using `self._opts.room.{width,depth,height}` with the `cz=2` scene offset.

**Orbit mode**: Mouse drag for azimuth/elevation, scroll to zoom.

Both use `_posCamera()` to apply the transform to `this._cam`.

## Three.js Loading

Three.js is a **peer dependency**. The library loads it at runtime via CDN (`cdnjs r128`) if `window.THREE` is not already present. In the Vite app it is provided as a regular npm dependency.

## DOM Scoping

Every Rack3DVisualizer instance gets a unique id (`r3d-1`, `r3d-2`, …). All CSS is scoped to `#r3d-N` and all element IDs are prefixed with `self._id + '-'`. The global `window._r3[instanceId]` registry allows inline `onclick` handlers in the generated HTML to call instance methods.
