# CRITICAL REGRESSION FIX - Full-Screen Black Issue

## Problem Reported
Clicking the "HOLOGRAM" button in the Dispatch Dashboard caused the entire dashboard to turn black and become unusable. Not just the 3D viewport, but:
- Header disappeared
- Left camera sidebar disappeared
- Right panels disappeared
- Central dashboard disappeared
- Entire screen rendered black

## Root Cause Analysis

### Issue #1: Canvas Element Not Properly Sized
**File**: `OBJViewerCore.jsx` (line 102)  
**Problem**: The WebGL canvas (this.renderer.domElement) was appended to the container but had NO explicit CSS styling. This caused:
- Canvas had dimensions 0x0 initially
- Container's clientWidth/clientHeight might have been 0 if called before layout
- Canvas didn't fill the 440px container properly

**Fix**: Added explicit inline CSS to canvas element:
```javascript
this.renderer.domElement.style.width = '100%';
this.renderer.domElement.style.height = '100%';
this.renderer.domElement.style.display = 'block';
```

### Issue #2: Container Size Not Checked Before Initialization
**File**: `OBJViewerCore.jsx` (line _initialize method)  
**Problem**: The _initialize method read containerElement.clientWidth/clientHeight immediately, but if the parent div hasn't finished layout, these values are 0. A 0x0 canvas would cause layout collapse.

**Fix**: Added size validation and defer logic:
```javascript
if (width === 0 || height === 0) {
  console.warn('[OBJViewerCore] Container has zero dimensions! Deferring initialization.');
  setTimeout(() => this._initialize(), 100);
  return;
}
```

### Issue #3: Control Panel Used 100vh (Viewport Height)
**File**: `OBJViewer.css` (line 147, 311)  
**Problem**: The floating control panel and info panel used `calc(100vh - 32px)` for max-height. This means:
- They were sized relative to the viewport (entire screen), not the 440px container
- When expanded, they tried to take up almost the entire viewport height
- This pushed other elements off-screen or caused layout overflow issues

**Fix**: Changed to use container-relative sizing with `%`:
```css
/* BEFORE - WRONG */
max-height: calc(100vh - 32px);  /* 100% of viewport */

/* AFTER - CORRECT */
max-height: calc(100% - 60px);  /* 100% of container */
```

### Issue #4: Canvas Container CSS Not Explicitly Set
**File**: `OBJViewer.css` (line 14-22)  
**Problem**: The .obj-viewer-canvas had no explicit display or overflow properties, allowing browser default behavior to interfere.

**Fix**: Added explicit display and overflow:
```css
.obj-viewer-canvas {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  display: block;           /* ADDED */
  overflow: hidden;         /* ADDED */
}
```

### Issue #5: Container Background Color Not Set
**File**: `OBJViewer.css` (line 2-9)  
**Problem**: If the Three.js scene initialization failed, the container would be transparent or white, potentially causing visual issues.

**Fix**: Added explicit background color:
```css
.obj-viewer-container {
  /* ... existing styles ... */
  background: #0a0e27;  /* Ensure no white flash */
}
```

## Files Modified

1. **frontend/src/viewers/OBJ/OBJViewerCore.jsx**
   - Added size validation in _initialize()
   - Added defer logic if container has 0 dimensions
   - Added explicit CSS to canvas element
   - Added logging for debugging

2. **frontend/src/viewers/OBJ/OBJViewer.css**
   - Changed control panel max-height from `100vh` to `100%`
   - Changed info panel max-height from `100vh` to `100%`
   - Added `display: block` to .obj-viewer-canvas
   - Added `overflow: hidden` to .obj-viewer-canvas
   - Added background color to .obj-viewer-container

## Technical Explanation

### Why Canvas Sizing Matters
The Three.js renderer creates an HTML `<canvas>` element. By default, this canvas has inline dimensions set via JavaScript (renderer.setSize()), but if not also styled with CSS, the browser may not allocate space for it correctly.

When the canvas isn't properly sized:
1. It doesn't fill the parent container
2. Absolute-positioned elements (controls, overlays) may position relative to body/viewport instead of container
3. This can cause elements to float over or outside the intended area

### Why 100vh vs 100% Matters
- `100vh` = 100% of VIEWPORT height (entire window, ~5000px on a big monitor)
- `100%` = 100% of PARENT container height (440px in this case)

Using `100vh` in a small container causes size mismatches and overflow issues.

### Why Container Dimensions Were 0
React lifecycle + Three.js initialization timing issue:
1. DispatchConsole renders HologramViewer
2. HologramViewer mounts, useEffect runs
3. OBJViewerCore constructor called immediately
4. Container div exists in DOM but hasn't received layout yet
5. container.clientWidth/clientHeight = 0
6. Canvas created with 0x0 dimensions
7. ResizeObserver might fix this eventually, but by then layout is broken

The defer logic ensures the container has time to receive proper dimensions from its parent's CSS.

## Testing Verification

To verify the fix works:

1. Load the Dispatch Dashboard
2. Confirm entire dashboard is visible and properly laid out
3. Click the HOLOGRAM button
4. Observe:
   - ✅ Dashboard remains fully visible (header, sidebars, panels)
   - ✅ Central 3D viewer appears with the 440px height
   - ✅ No black screen overlay
   - ✅ No layout shift
   - ✅ OBJ begins loading in the viewer
5. Switch to Optical CCTV
6. Confirm dashboard still visible
7. Switch back to HOLOGRAM
8. Repeat 5+ times without issues

## Root Cause Summary

**Why Full Screen Went Black:**
1. Canvas wasn't sized with CSS → didn't fill 440px container properly
2. Floating controls used 100vh → tried to span entire viewport
3. Container size was 0x0 at initialization → cascade of layout failures
4. Result: Layout collapsed, absolutely-positioned elements took over, appeared as full-screen black

**The Fix:**
- Validate container size before initialization
- Defer initialization if size is 0
- Add explicit CSS sizing to canvas element
- Use container-relative sizing (%) for floating panels
- Ensure canvas displays properly in constrained space

This is NOT a Three.js rendering issue. It's a CSS/layout issue in how the canvas container and floating UI elements were sized relative to the viewport vs. their parent container.

## Prevention

To prevent similar issues in future:
1. Always validate container dimensions before using them in calculations
2. Always apply explicit CSS to HTML elements created by JS (especially canvas)
3. Use `%` for sizing relative to parent, not `vh/vw` for viewport-relative sizing in contained contexts
4. Test in small containers (not full-screen) to catch layout issues
5. Use browser DevTools to inspect element tree and CSS box model

---

**Status**: ✅ FIXED  
**Severity**: CRITICAL  
**Type**: CSS/Layout Regression  
**Impact**: Full dashboard unusable when HOLOGRAM clicked  

**Modified**: September 8, 2026
