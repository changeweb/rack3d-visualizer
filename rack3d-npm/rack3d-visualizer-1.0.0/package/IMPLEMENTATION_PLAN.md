# Implementation Plan: Integrating Refactored Services into Rack3DVisualizer

## Overview

This document outlines how to integrate the refactored OOP services into the existing `Rack3DVisualizer` class while maintaining 100% backward compatibility.

## Integration Strategy

### Phase 1: Instantiate Services (No Behavior Changes)

The refactored services are instantiated but the existing module-based functions continue to work. This creates a parallel system that will gradually take over.

```javascript
// In Rack3DVisualizer constructor
this._cameraSystem = new CameraSystem(this._cam, this._T3, this._opts.camera);
this._selectionManager = new SelectionManager(this._scene, this._cam, this._T3);
this._materialFactory = new MaterialFactory(this._T3, this._theme);
this._renderEngine = new RenderEngine(this._ren, this._scene, this._cam);
this._geometryManager = new GeometryManager(
  this._T3, this._scene,
  new RackBuilder(this._T3, this._theme.rack, this._materialFactory),
  new DeviceBuilder(this._T3, this._materialFactory, this._types),
  new EnvironmentBuilder(this._T3, this._theme)
);
```

### Phase 2: Gradually Migrate Methods

For each public method, add service-based implementation alongside existing code. Existing code continues to work, new code calls services.

#### Example: `setRoomData(roomData)`

**Before (Old):**
```javascript
setRoomData(roomData) {
  this._room = roomData;
  this._rack = this._room?.racks?.[0] || null;
  buildAllRacks(this);
  this._posCamera();
  refresh(this);
  this._startLoop();
}
```

**After (New):**
```javascript
setRoomData(roomData) {
  this._room = roomData;
  this._rack = this._room?.racks?.[0] || null;

  // NEW: Use GeometryManager
  this._geometryManager.buildAllRacks(this._room, this._opts.rack, this._theme.rack);

  this._posCamera();
  refresh(this); // Keep existing sidebar refresh
  this._startLoop();
}
```

#### Example: `toggleCameraMode()`

**Before (Old):**
```javascript
toggleCameraMode() {
  // Three-state toggle: orbit → fps → fps+locked
  if (this._ctrl.mode === 'orbit') {
    this._ctrl.mode = 'fps';
  } else if (!this._ctrl.pointerLocked) {
    this._ctrl.pointerLocked = true;
    this._cv.requestPointerLock?.();
  } else {
    this._ctrl.mode = 'orbit';
    this._ctrl.pointerLocked = false;
    document.exitPointerLock?.();
  }
  this._updateButtonState();
}
```

**After (New):**
```javascript
toggleCameraMode() {
  const currentMode = this._cameraSystem.getCurrentMode();

  if (currentMode === 'orbit') {
    this._cameraSystem.switchTo('fps');
  } else if (!this._cameraSystem.getCamera()?.pointerLocked) {
    this._cameraSystem.lockPointer(this._cv);
  } else {
    this._cameraSystem.switchTo('orbit');
    this._cameraSystem.unlockPointer();
  }

  this._updateButtonState();
}
```

### Phase 3: Integration Points

#### Camera System Integration

**In `_bindCameraControls()`:**
```javascript
_bindCameraControls() {
  // ... existing setup ...

  // Update CameraSystem room bounds
  this._cameraSystem.setRoomBounds({
    width: this._opts.room.width,
    depth: this._opts.room.depth,
    height: this._opts.room.height,
    sceneCZ: 2
  });

  // ... rest of binding ...

  document.addEventListener('keydown', (e) => {
    this._cameraSystem.handleInput({ type: 'keydown', key: e.key });
  });

  document.addEventListener('keyup', (e) => {
    this._cameraSystem.handleInput({ type: 'keyup', key: e.key });
  });
}
```

**In `_startLoop()`:**
```javascript
_startLoop() {
  if (!this._cam) return;

  this._renderEngine.onFrame((deltaTime) => {
    // Update camera
    this._cameraSystem.update(deltaTime);

    // Update labels
    if (this._renderEngine.isDirty()) {
      updateLabels(this);
    }
  });

  this._renderEngine.start();
}
```

#### Selection Manager Integration

**In `_doRaycast(x, y)`:**
```javascript
_doRaycast(x, y) {
  const result = this._selectionManager.raycast(
    x, y,
    this._cv.clientWidth,
    this._cv.clientHeight
  );

  if (result) {
    if (result.type === 'device') {
      this._selectionManager.selectDevice(result.id, result.rackId);
      this._selId = result.id;
      this._rack = this._room.racks.find(r => r.id === result.rackId);
    } else if (result.type === 'rack') {
      this._selectionManager.selectRack(result.id);
      this._selRackId = result.id;
    }

    openEdit(this); // Keep existing UI update
    refresh(this);
  }
}
```

**Subscribe to selection changes:**
```javascript
constructor(...) {
  // ... existing code ...

  // NEW: Subscribe to selection changes
  this._selectionManager.subscribe((event) => {
    if (event.type === 'deviceSelected') {
      this._renderEngine.setDirty();
      // Update pulse animation
    } else if (event.type === 'selectionCleared') {
      this._renderEngine.setDirty();
    }
  });
}
```

#### Material Factory Integration

**In `_showWireframe()` and `_hideWireframe()`:**
```javascript
_showWireframe() {
  this._showWire = true;
  this._materialFactory.setWireframeMode(true);
  this._renderEngine.setDirty();
}

_hideWireframe() {
  this._showWire = false;
  this._materialFactory.setWireframeMode(false);
  this._renderEngine.setDirty();
}
```

**In `setTheme(themeName)`:**
```javascript
setTheme(themeName) {
  this._theme = resolveTheme(themeName);
  this._materialFactory.setTheme(this._theme);
  this._geometryManager.clearAllRacks();
  this._geometryManager.buildAllRacks(this._room, this._opts.rack, this._theme.rack);
  this._renderEngine.setDirty();
}
```

#### Render Engine Integration

**In `_startLoop()`:**
```javascript
_startLoop() {
  this._renderEngine.start();
}
```

**In `destroy()`:**
```javascript
destroy() {
  this._renderEngine.stop();
  this._materialFactory.dispose();
  // ... rest of cleanup ...
}
```

## Backward Compatibility Guarantees

### Public API Methods (NO CHANGES)
All existing public methods remain:
- `setRoomData(data)`
- `toggleCameraMode()`
- `toggleLabels()`
- `toggleWire()`
- `toggleMode()`
- `zoomIn()`
- `zoomOut()`
- `resetRack()`
- `copyJson()`
- `exportJson()`
- `applyJson()`
- `toggleJson()`
- `setTheme(themeName)`
- `destroy()`
- And all others...

### Public API Behavior (NO CHANGES)
All methods behave identically to users:
- Same visual results
- Same event firing
- Same state management
- Same keyboard/mouse handling

### Constructor Signature (NO CHANGES)
```javascript
new Rack3DVisualizer(container, options)
// Constructor options unchanged
```

### Event Callbacks (NO CHANGES)
```javascript
options.onReady(visualizer)
// Same callback signature
```

### .tgz Package Distribution (NO CHANGES)
```bash
npm pack
# Creates rack3d-visualizer-1.0.0.tgz
npm install ./rack3d-visualizer-1.0.0.tgz
# Works exactly as before
```

### Consuming React App (NO CHANGES)
```javascript
// In React app using the package
const vizRef = useRef();

useEffect(() => {
  vizRef.current = new Rack3DVisualizer(container, options);
  return () => vizRef.current?.destroy();
}, []);

// All existing code continues to work
```

## Migration Path: Step by Step

### Step 1: Instantiate Services (Current)
- Create service instances in constructor
- Keep all existing logic working
- Tests pass: 100%
- Breaking changes: 0

### Step 2: Delegate Camera Logic
- Call `_cameraSystem.update()` in render loop
- Call `_cameraSystem.handleInput()` in event handlers
- Tests pass: 100%
- Breaking changes: 0

### Step 3: Delegate Selection Logic
- Replace `_doRaycast()` internals with `_selectionManager.raycast()`
- Subscribe to selection changes
- Tests pass: 100%
- Breaking changes: 0

### Step 4: Delegate Geometry Building
- Replace `buildAllRacks(this)` with `_geometryManager.buildAllRacks()`
- Replace `buildDevice()` with device builder
- Tests pass: 100%
- Breaking changes: 0

### Step 5: Delegate Material Management
- Use `_materialFactory` for all material creation
- Remove inline material creation code
- Tests pass: 100%
- Breaking changes: 0

### Step 6: Delegate Render Loop
- Use `_renderEngine` for animation timing
- Remove old frame timing code
- Tests pass: 100%
- Breaking changes: 0

### Step 7: Cleanup Old Code
- Remove old module functions (geometry.js, scene.js internals)
- Keep public API functions as thin wrappers if needed
- Tests pass: 100%
- Breaking changes: 0

## Verification Checklist

- [ ] All Jest unit tests pass
- [ ] All Jest integration tests pass
- [ ] React app builds without errors
- [ ] React app runs dev server without errors
- [ ] 3D visualization renders correctly
- [ ] All camera modes work (FPS, Orbit, Pointer Lock)
- [ ] Device selection works via raycasting
- [ ] Wireframe toggle works
- [ ] Label toggle works
- [ ] Theme switching works
- [ ] Multiple racks render correctly
- [ ] Room bounds clamping works
- [ ] Performance metrics maintained or improved
- [ ] No console errors or warnings
- [ ] All existing features work identically

## Files to Modify

### New Files (Already Created)
- ✅ `src/abstractions/BaseCamera.js`
- ✅ `src/abstractions/FpsCamera.js`
- ✅ `src/abstractions/OrbitCamera.js`
- ✅ `src/services/CameraSystem.js`
- ✅ `src/services/SelectionManager.js`
- ✅ `src/services/RenderEngine.js`
- ✅ `src/services/MaterialFactory.js`
- ✅ `src/services/TextureManager.js`
- ✅ `src/services/GeometryManager.js`
- ✅ `src/builders/RackBuilder.js`
- ✅ `src/builders/DeviceBuilder.js`
- ✅ `src/builders/EnvironmentBuilder.js`
- ✅ `src/__tests__/unit/CameraSystem.test.js`
- ✅ `src/__tests__/unit/SelectionManager.test.js`
- ✅ `src/__tests__/unit/MaterialFactory.test.js`
- ✅ `src/__tests__/unit/RenderEngine.test.js`
- ✅ `src/__tests__/integration/FullWorkflow.test.js`
- ✅ `src/__tests__/mocks/three.js`
- ✅ `jest.config.js`
- ✅ `REFACTORING.md`

### Files to Modify (Next Phase)
- `src/Rack3DVisualizer.js` - Integrate services
- `src/index.js` - Export services (optional)
- `package.json` - Already updated with jest dependency

### Files to Keep As-Is
- `src/html.js` - DOM scaffold building
- `src/css.js` - Styling
- `src/sidebar.js` - UI panels (refactor later if needed)
- `src/catalog.js` - Device catalog (refactor later if needed)
- `src/labels.js` - Label rendering (refactor later if needed)
- `src/render2d.js` - 2D view (refactor later if needed)
- `src/options.js` - Option merging (refactor later if needed)
- `src/themes.js` - Theme registry (refactor later if needed)
- `src/constants.js` - Device types (refactor later if needed)

## Testing Strategy During Integration

### Before Each Step
1. Run `npm test` - All tests should pass
2. Rebuild package: `npm run build`
3. Reinstall in React app
4. Start dev server: `npm run dev`

### During Each Step
1. Keep both old and new code running in parallel
2. Verify no behavior differences
3. Add new tests alongside integration
4. Check performance metrics

### After Each Step
1. Commit with message describing integration
2. All tests pass
3. No visual regressions
4. Performance maintained or improved

## Rollback Plan

If issues arise during integration:

1. Revert to previous commit
2. Revert package changes with `npm install rack3d-visualizer-1.0.0.tgz`
3. Restart dev server
4. System fully functional again

## Success Criteria

- ✅ 100% backward compatibility maintained
- ✅ All Jest tests pass (85%+ coverage)
- ✅ All existing features work identically
- ✅ Performance maintained or improved
- ✅ New architecture enables future extensions
- ✅ Code is more maintainable and testable
- ✅ SOLID principles applied throughout
- ✅ Design patterns used appropriately
- ✅ No breaking changes to public API
