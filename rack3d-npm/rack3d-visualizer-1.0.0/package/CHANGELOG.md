# Changelog

All notable changes to **rack3d-visualizer** are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2024-01-01

### Added

#### Core
- `Rack3DVisualizer` class — zero-framework, mount into any DOM element
- ESM, CJS and minified UMD builds (Three.js peer dep, not bundled in ESM/CJS)
- Full TypeScript declarations (`dist/index.d.ts`)
- Deep-merge option system with `mergeOptions()` helper

#### 3D Rendering
- Hollow Oracle/Cisco-style rack frame — four corner posts, front/rear crossbars, mid-height bracing every 8U
- Per-unit rack rails with mounting nut geometry
- Perforated side panels and rear cable-management panel
- Front nameplate bar with emissive glow
- Fully lit datacenter server room environment (walls, ceiling, floor, fog)
- Raised floor tile grid (0.6 m standard datacenter tiles)
- Drop ceiling T-bar grid with fluorescent strip light geometry
- Wall-mounted cable trays and baseboard LED accent strips
- Exit sign on rear wall

#### Devices
- 11 built-in device types: `server`, `firewall`, `router`, `switch`, `security`, `storage`, `pdu`, `patch`, `ups`, `kvm`, `loadbal`
- Custom device type registration via `options.deviceTypes`
- Device body + front bezel + emissive colored panel for each device
- Drive bay grids with handles (server / storage ≥ 2U)
- Port grids with active-port glow (switch / router / firewall / patch)
- Ventilation slot geometry (devices ≥ 2U)
- LED row per device (green/orange/blue, flicker animation)
- Top status strip in device type color
- Selected device pulse animation

#### Labels
- Floating CSS labels projected from 3D world positions
- Alternating left/right layout with horizontal connector line + dot
- Per-label toggle: icon, name, type, watts, unit range
- Full visibility as camera orbits

#### Lighting
- 6-bank overhead fluorescent directional lights with shadow maps
- Front key light, left/right fill lights, top fill, rear rim
- Floor point lights (raised-floor blue glow)
- Internal rack PointLight (device glow)
- ACES filmic tone mapping

#### Themes
- 5 built-in themes: `dark`, `light`, `oled`, `warm`, `matrix`
- Custom theme support — partial object merged with `dark` base
- CSS custom properties scoped per instance (multiple racks on one page)
- Live theme switching via `viz.setTheme()`

#### 2D Mode
- Flat schematic diagram — colored left-border bars, device name, watts
- Toggle between 3D ↔ 2D with `viz.setMode()` or toolbar button

#### Controls
- Mouse drag to orbit, scroll to zoom, click to select
- Touch controls: single-finger orbit, pinch-to-zoom
- Configurable orbit speed, zoom speed, min/max distance
- Auto-rotate mode with configurable speed
- `viz.setCameraAngle(az, el, dist)` for programmatic framing

#### Sidebar
- Rack config panel (name, units, rackTemp, pduCapacity, pduLoad)
- PDU load bar with % and color threshold
- Rack intake temperature bar
- Sortable device list with per-device select / remove
- Add-device buttons for all registered types
- Inline device editor (name, type, watts, height, startUnit)
- Unit-by-unit map strip with drag-and-drop reordering
- Device type color legend
- Configurable sidebar position (left / right)

#### Interactivity
- Click device in 3D → select + open editor
- Drag device card → drop on unit map row to reposition
- JSON editor panel — live parse and apply
- Wireframe toggle

#### API
- `setData(rack)` / `getData()` — load or export rack JSON
- `setTheme(name|obj)` — live theme switch
- `setOptions(partial)` — deep-merge any options at runtime
- `setMode('3d'|'2d')` — switch render mode
- `setWireframe(bool)` / `setLabels(bool)` — toggle rendering features
- `setCameraAngle(az, el, dist)` / `resetCamera()` — camera control
- `destroy()` — full cleanup (renderer, DOM, events)
- `onSelect`, `onChange`, `onReady` callbacks

#### Documentation
- Full options reference with type/default/description table
- JSON schema documentation
- React integration guide (wrapper component + useEffect pattern)
- Five screenshot previews rendered as inline HTML
- Theme swatches with color palettes
- Device type grid
- Method chaining example

#### Examples
- `examples/vanilla/` — plain HTML + UMD script tag
- `examples/basic/`   — theme switcher, camera presets, mode toggle
- `examples/react/`   — React wrapper component + demo app
- `examples/serve.cjs` — zero-dependency static dev server
