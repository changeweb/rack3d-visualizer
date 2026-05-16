/**
 * @typedef {Object} LightingOptions
 * @property {number} [ambientIntensity=6.0]      - Ambient light intensity
 * @property {number} [ambientColor=0xd0e8ff]     - Ambient light colour (hex)
 * @property {number} [overheadIntensity=9.0]     - Overhead directional lights intensity
 * @property {number} [overheadCount=6]           - Number of overhead light banks (2–12)
 * @property {number} [frontIntensity=10.0]       - Front-facing key light intensity
 * @property {number} [fillIntensity=6.0]         - Side fill light intensity
 * @property {number} [rimIntensity=4.0]          - Rear rim light intensity
 * @property {number} [rackGlowIntensity=6.0]     - Internal rack LED glow
 * @property {number} [floorGlowIntensity=3.0]    - Floor point-light glow
 * @property {number} [exposure=2.8]              - ACES tone-mapping exposure
 * @property {boolean} [shadows=true]             - Enable shadow maps
 */

/**
 * @typedef {Object} CameraOptions
 * @property {number} [fov=44]               - Field of view in degrees
 * @property {number} [azimuth=Math.PI]      - Initial horizontal angle (radians). PI = front face
 * @property {number} [elevation=0.15]       - Initial vertical angle (radians, 0 = level)
 * @property {number} [distance='auto']      - Initial distance. 'auto' = rack-height × 2.2
 * @property {number} [minDistance=4]        - Minimum zoom-in distance
 * @property {number} [maxDistance=80]       - Maximum zoom-out distance
 * @property {number} [orbitSpeed=0.0045]    - Mouse drag orbit speed
 * @property {number} [zoomSpeed=0.035]      - Scroll wheel zoom speed
 */

/**
 * @typedef {Object} RoomOptions
 * @property {boolean} [enabled=true]        - Render the server room environment
 * @property {number}  [width=26]            - Room width in metres
 * @property {number}  [depth=20]            - Room depth in metres
 * @property {number}  [height=14]           - Room ceiling height in metres
 * @property {boolean} [floorTiles=true]     - Show raised floor tile grid
 * @property {number}  [tileSize=0.6]        - Raised floor tile size (m)
 * @property {boolean} [ceilingGrid=true]    - Show drop-ceiling T-bar grid
 * @property {boolean} [stripLights=true]    - Show ceiling fluorescent strip fixtures
 * @property {boolean} [baseboardLights=true]- Show floor baseboard accent LEDs
 * @property {boolean} [exitSign=true]       - Show exit sign on rear wall
 * @property {boolean} [cableTrays=true]     - Show wall-mounted cable trays
 * @property {number}  [fogNear=22]          - Fog start distance
 * @property {number}  [fogFar=55]           - Fog full-opacity distance
 */

/**
 * @typedef {Object} RackOptions
 * @property {number}  [unitHeight=0.445]     - Height per rack unit in metres (scale)
 * @property {number}  [width=5.6]            - Rack frame width (metres)
 * @property {number}  [depth=4.0]            - Rack frame depth (metres)
 * @property {number}  [postSize=0.16]        - Corner post square size (metres)
 * @property {boolean} [showSidePanels=true]  - Thin perforated side panels
 * @property {boolean} [showRearPanel=true]   - Rear cable-management panel
 * @property {boolean} [showNameplate=true]   - Front-top nameplate bar
 */

/**
 * @typedef {Object} LabelOptions
 * @property {boolean} [enabled=true]         - Show floating 3D device labels
 * @property {'auto'|'left'|'right'} [side='auto'] - 'auto' alternates L/R, or force one side
 * @property {number}  [connectorLength=38]   - Horizontal connector line length (px)
 * @property {boolean} [showWatts=true]       - Show watts in label meta
 * @property {boolean} [showUnits=true]       - Show unit range in label meta
 * @property {boolean} [showType=true]        - Show device type in label
 * @property {boolean} [showIcon=true]        - Show device icon in label
 */

/**
 * @typedef {Object} SidebarOptions
 * @property {boolean} [enabled=true]         - Show the control sidebar
 * @property {'left'|'right'} [position='left']  - Sidebar side
 * @property {number}  [width=248]            - Sidebar width in px
 * @property {boolean} [showRackConfig=true]  - Rack name / unit count editor
 * @property {boolean} [showStats=true]       - PDU and temperature stat cards
 * @property {boolean} [showDeviceList=true]  - Scrollable device list
 * @property {boolean} [showAddButtons=true]  - Add-device type buttons
 * @property {boolean} [showEditPanel=true]   - Per-device inline editor
 * @property {boolean} [showUnitMap=true]     - Unit-by-unit map strip
 * @property {boolean} [showLegend=true]      - Device-type colour legend
 */

/**
 * @typedef {Object} ViewOptions
 * @property {'3d'|'2d'} [mode='3d']          - Render mode: full 3D or flat 2D schematic
 * @property {boolean} [wireframe=false]       - Start in wireframe mode
 * @property {boolean} [showLabels=true]       - Labels visible on start
 * @property {boolean} [autoRotate=false]      - Auto-orbit the rack slowly
 * @property {number}  [autoRotateSpeed=0.003] - Radians per frame when autoRotate=true
 * @property {boolean} [showToolbar=true]      - Top header toolbar
 * @property {boolean} [allowDragDrop=true]    - Drag-and-drop device reordering
 * @property {boolean} [allowEdit=true]        - Click-to-edit device properties
 * @property {boolean} [allowAddRemove=true]   - Add / remove devices via UI
 * @property {boolean} [allowJsonEdit=true]    - JSON editor panel in toolbar
 */

/**
 * @typedef {Object} Rack3DOptions
 * @property {string|Object}   [theme='dark']     - Theme name or custom theme object
 * @property {ViewOptions}     [view]             - Top-level view/render options
 * @property {CameraOptions}   [camera]           - Camera position and controls
 * @property {LightingOptions} [lighting]         - Scene lighting parameters
 * @property {RoomOptions}     [room]             - Server room environment
 * @property {RackOptions}     [rack]             - Physical rack geometry
 * @property {LabelOptions}    [labels]           - Floating device labels
 * @property {SidebarOptions}  [sidebar]          - Control panel sidebar
 * @property {Object}          [deviceTypes]      - Merge custom device types into registry
 * @property {Function}        [onSelect]         - Called with device object on click
 * @property {Function}        [onChange]         - Called with full rack JSON on any change
 * @property {Function}        [onReady]          - Called when 3D scene is fully initialised
 */

export const DEFAULT_OPTIONS = {
  theme: 'dark',

  view: {
    mode:            '3d',
    wireframe:       false,
    showLabels:      true,
    autoRotate:      false,
    autoRotateSpeed: 0.003,
    showToolbar:     true,
    allowDragDrop:   true,
    allowEdit:       true,
    allowAddRemove:  true,
    allowJsonEdit:   true,
  },

  camera: {
    fov:         44,
    azimuth:     Math.PI,
    elevation:   0.15,
    distance:    'auto',
    minDistance: 4,
    maxDistance: 80,
    orbitSpeed:  0.0045,
    zoomSpeed:   0.035,
  },

  lighting: {
    ambientIntensity:  6.0,
    ambientColor:      0xd0e8ff,
    overheadIntensity: 9.0,
    overheadCount:     6,
    frontIntensity:    10.0,
    fillIntensity:     6.0,
    rimIntensity:      4.0,
    rackGlowIntensity: 6.0,
    floorGlowIntensity:3.0,
    exposure:          2.8,
    shadows:           true,
    shadowMapSize:     512,
    powerPreference:   'default',
    customLights:      [],  // [{ type:'point'|'directional'|'spot'|'ceiling', x,y,z, intensity, color, distance }]
  },

  room: {
    enabled:        true,
    width:          26,
    depth:          20,
    height:         14,
    floorTiles:     true,
    tileSize:       0.6,
    ceilingGrid:    true,
    stripLights:    true,
    baseboardLights:true,
    exitSign:       true,
    cableTrays:     true,
    fogNear:        22,
    fogFar:         55,
    windows:        [],  // [{wall:'front'|'back'|'left'|'right', x, y, width, height}]
    doors:          [],  // [{wall:'front'|'back'|'left'|'right', x, width, height}]
  },

  rack: {
    unitHeight:      0.445,
    width:           5.6,
    depth:           4.0,
    postSize:        0.16,
    showSidePanels:  true,
    showRearPanel:   true,
    showNameplate:   true,
    nameplateScale:  1.0,
    nameplateYOffset:0.2,
    nameplateOpacity:1.0,
  },

  labels: {
    enabled:         true,
    side:            'auto',
    connectorLength: 38,
    showWatts:       true,
    showUnits:       true,
    showType:        true,
    showIcon:        true,
    fontSize:        11,
    iconSize:        13,
  },

  sidebar: {
    enabled:        true,
    position:       'left',
    width:          248,
    showRackConfig: true,
    showStats:      true,
    showDeviceList: true,
    showAddButtons: true,
    showEditPanel:  true,
    showUnitMap:    true,
    showLegend:     true,
    // Visibility & layout
    showLeft:       true,
    showRight:      true,
    leftWidth:      248,
    rightWidth:     260,
    panelLayout:    null,   // { left: [...], right: [...], collapsed: {} } — restored on init
    // Which env fields to show (null = all)
    roomFields:     null,
    lightingFields: null,
  },

  deviceTypes: {},   // merged into DEVICE_TYPES
  onSelect:  null,
  onChange:  null,
  onReady:   null,
};

// Deep-merge user options over defaults
export function mergeOptions(defaults, user = {}) {
  const result = JSON.parse(JSON.stringify(defaults));
  for (const key of Object.keys(user)) {
    if (
      user[key] !== null &&
      typeof user[key] === 'object' &&
      !Array.isArray(user[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = mergeOptions(result[key], user[key]);
    } else {
      result[key] = user[key];
    }
  }
  // Restore functions (JSON.parse strips them)
  for (const fn of ['onSelect', 'onChange', 'onReady']) {
    if (user[fn]) result[fn] = user[fn];
  }
  return result;
}
