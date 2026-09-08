# OBJ Viewer Improvements - Testing Guide

## Quick Test Procedure

### Setup
1. Load the Dispatch Dashboard
2. Click HOLOGRAM button in an incident detail view
3. The 3D architectural model loads in the central viewing area

---

## Test #1: Wall Opacity

### Procedure
1. **Rotate the view** to see walls from an angle
2. **Look for see-through areas** - walls should be opaque
3. **Position camera** to look at a wall with another wall visible behind it
4. **Verify** the back wall is COMPLETELY hidden by the front wall

### Expected Results
✓ Walls appear as solid architectural material  
✓ No translucency or transparency visible  
✓ Walls completely block the view of geometry behind them  
✓ Walls receive consistent lighting (not dark at edges)  
✓ Window panes still appear slightly transparent (as designed)  

### Visual Check
- Front wall at 45° angle
- Geometry behind the wall should be completely hidden
- Wall surface should be matte white (matching MTL definition)

---

## Test #2: Floor-Level Camera Constraint

### Procedure #1: Orbit Downward
1. **Start** with isometric camera view
2. **Click-drag** the mouse downward to orbit the camera down
3. **Continue** dragging downward to attempt going below the model
4. **Observe** where the camera stops

### Expected Results
- Camera rotates downward smoothly
- Camera reaches approximately floor-level perspective
- Camera STOPS rotating further downward
- User can still see the building from a low angle (~10-20° elevation)
- Cannot reach a view where you see the floor from underneath

### Procedure #2: Pan Downward
1. **Middle-click and drag** to pan the view downward
2. **Try to move** the orbit target below the floor
3. **Attempt extreme panning** to bypass the restriction

### Expected Results
- Panning is responsive and smooth
- Orbit target can move freely in X/Z plane
- Orbit target panning respects polar angle constraints
- Cannot achieve a below-floor viewing angle through panning

### Procedure #3: Try All Camera Presets
1. Click **Front** preset
2. Click **Back** preset
3. Click **Left** preset
4. Click **Right** preset
5. Click **Top** preset (should be top-down)
6. Click **Bottom** preset (should be LOW floor-level, not underneath)
7. Click **Isometric** preset

### Expected Results
- All presets work smoothly
- Top preset shows top-down view
- **Bottom preset NOW shows a low floor-level perspective (not underneath)**
- Can freely orbit within the allowed range from each preset
- Cannot rotate underneath the floor from any preset

### Procedure #4: Extreme Zoom at Floor-Level
1. Orbit to a **low floor-level view**
2. **Zoom in** very close to the model (scroll wheel)
3. **Try to rotate** downward while zoomed in
4. **Verify** camera cannot go below floor even at extreme zoom

### Expected Results
- Zoom works smoothly
- Extreme zoom doesn't bypass floor constraint
- Camera stays at or above floor level
- No jittering or visual artifacts at extreme zoom

---

## Test #3: Overall Rendering Quality

### Procedure
1. Rotate model to view **walls, floor, and windows**
2. **Look at lighting** on all surfaces
3. **Verify shadows** (if visible)
4. **Check for artifacts** like flickering or depth-test issues

### Expected Results
✓ Walls: Matte white, well-lit, opaque  
✓ Floor: Gray matte surface, opaque  
✓ Windows: Slightly blue, semi-transparent (as designed)  
✓ Doors: White, opaque  
✓ Lighting: Consistent studio-like illumination  
✓ No z-fighting or depth issues  
✓ No flickering or rendering artifacts

---

## Test #4: User Experience

### Procedure
1. **Freely rotate** horizontally (left-right) - should be unrestricted
2. **Orbit** downward gradually
3. **Feel the constraint** as you approach floor level
4. **Try to force** the camera below floor
5. **Verify it feels responsive** and smooth

### Expected Results
- Horizontal rotation: Smooth, unrestricted, 360° full circle
- Downward orbit: Smooth, then stops at floor level
- No abrupt "hitting a wall" feeling
- Controls feel responsive and natural
- Can achieve low architectural perspectives easily

---

## Detailed Visual Inspection

### Wall Material Check
**What to look for:**
- Walls appear solid and uniform in color
- No gradient transparency (darker edges = transparency)
- Walls don't have a "glass" appearance
- Walls are matte (not shiny/reflective)
- Behind-wall geometry is fully occluded

**What NOT to expect:**
- ❌ Semi-transparent walls
- ❌ Can see through walls
- ❌ Wall edges are darker (transparency gradient)
- ❌ Glossy/reflective wall surface

### Camera Constraint Check
**What to look for:**
- Can rotate freely in horizontal plane
- Can orbit up to see model from above
- Can orbit down to see model from low angle
- Cannot orbit to see model from below
- Cannot see floor underside

**Edge cases:**
- Test with Fit Model (auto-zoom)
- Test with Reset (back to default)
- Test rapid clicking between presets
- Test using keyboard shortcuts if available

---

## Known Good States

### Wall Opacity - CORRECT
```
Looking at a wall:
- Wall color: Matte white (#ffffff)
- Transparency: false
- Opacity: 1.0
- Behind wall: Completely hidden
- Lighting: Uniform across surface
```

### Camera Constraint - CORRECT
```
Orbit downward:
- Can go from 90° (top) down to ~82° (floor-level)
- Stops rotating further down
- Cannot reach angles > 82° (which would be below floor)
- Smooth motion with no jumps or artifacts
```

---

## Acceptance Criteria (Must Pass All)

### Walls
- [ ] Walls are completely opaque
- [ ] Walls are NOT translucent or see-through
- [ ] Walls block geometry behind them
- [ ] Walls correctly receive lighting
- [ ] Wall material has proper depthWrite/depthTest
- [ ] Windows CAN remain transparent (as intended)
- [ ] Doors remain opaque
- [ ] Floor remains opaque

### Camera
- [ ] User CAN orbit freely horizontally (360°)
- [ ] User CAN orbit vertically within allowed range
- [ ] User CAN reach low floor-level perspectives
- [ ] User CANNOT orbit underneath floor
- [ ] User CANNOT see model underside from below
- [ ] Panning CANNOT bypass floor restriction
- [ ] Zoom CANNOT bypass floor restriction
- [ ] All camera presets work correctly
- [ ] Bottom preset does NOT place camera underneath
- [ ] Reset button works correctly
- [ ] Fit Model button works correctly

### Performance
- [ ] No frame rate drops
- [ ] No visual artifacts (flickering, z-fighting)
- [ ] Smooth, responsive controls
- [ ] No lag in camera movement

---

## Troubleshooting

### If walls still appear transparent:
1. Check browser DevTools console for material optimization logs
2. Look for `[OBJViewerCore] Optimizing material: wall` messages
3. Verify all walls show `transparent=false` in logs
4. Rebuild frontend: `npm run build`
5. Hard refresh browser: `Ctrl+Shift+R`

### If camera can still go below floor:
1. Check browser DevTools console for OrbitControls logs
2. Look for `minPolarAngle` and `maxPolarAngle` constraints being set
3. In browser DevTools: `console.log(viewer.controls.maxPolarAngle)`
4. Value should be approximately 1.428 (= π/2.2)
5. Rebuild frontend if not showing

### If controls feel unresponsive:
1. Check for JavaScript errors in DevTools console
2. Ensure OrbitControls library is properly loaded
3. Verify no other scripts are interfering with mouse events
4. Test in incognito mode (no browser extensions)

---

## Session Report Template

When testing, note:

**Date:** ____________
**Tester:** ____________
**Build Version:** ____________

**Wall Opacity:**
- Walls opaque? YES / NO / PARTIAL
- Windows transparent? YES / NO / N/A
- Notes: ________________________

**Camera Constraint:**
- Can orbit horizontally freely? YES / NO
- Camera stops at floor level? YES / NO
- Cannot go below floor? YES / NO
- Bottom preset is low view? YES / NO
- Notes: ________________________

**Overall Quality:**
- No visual artifacts? YES / NO
- Performance 60 FPS? YES / NO / UNKNOWN
- Controls responsive? YES / NO
- Notes: ________________________

**Issues Found:**
1. ________________________
2. ________________________
3. ________________________

**Conclusion:** PASS / FAIL / NEEDS_REVISION
