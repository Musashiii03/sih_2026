# OBJ Viewer Reliability Test

## Objective
Verify that rapid HOLOGRAM→CCTV→HOLOGRAM switching does NOT reproduce the "Cannot read properties of null (reading 'add')" error.

## Root Cause Fixed
The error occurred due to async OBJ/MTL loading race condition:
- Component mounts → Creates viewer instance
- User switches view → Component unmounts → viewer.dispose() sets this.scene = null
- Network loader callbacks fire **after** unmount → Tries scene.add(group) on null ❌

## Fixes Applied

### 1. Lifecycle Guards (OBJViewerCore.jsx)
```javascript
// CRITICAL: Lifecycle tracking flags
this._isDisposed = false;
this._pendingLoads = new Set();
this._animationFrameId = null;
```

### 2. Guard Check in _loadOBJWithLoader
```javascript
// Before scene.add(group), verify:
if (this._isDisposed || !this.scene || !this.container) {
  console.warn('[OBJViewerCore] Load completed but viewer was disposed. Ignoring.');
  this._pendingLoads.delete(loadId);
  reject(new Error('Viewer disposed during load'));
  return;
}

// CRITICAL: THIS IS WHERE THE BUG WAS - add group to scene
// But only if scene is still valid
this.scene.add(group);
```

### 3. Proper Dispose Order
```javascript
dispose() {
  // CRITICAL: Set disposed flag FIRST
  this._isDisposed = true;
  
  // Cancel animation frame
  if (this._animationFrameId) {
    cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = null;
  }

  // Clear pending loads
  this._pendingLoads.clear();
  
  // ... cleanup ...
  
  // Clear scene reference LAST
  this.scene = null;
}
```

### 4. Animation Loop Guard
```javascript
_animate() {
  if (this._isDisposed) {
    return; // Stop loop if disposed
  }
  
  this._animationFrameId = requestAnimationFrame(() => this._animate());
  this.renderer?.render(this.scene, this.camera);
}
```

## Test Procedure

### Manual Test (Browser Console)
1. Navigate to Dispatch Dashboard
2. Click HOLOGRAM button → Hologram viewer opens
3. Open browser DevTools Console (F12)
4. Run the following JavaScript:

```javascript
// Rapid switching test
async function testRapidSwitching() {
  const iterations = 10;
  const delayMs = 500; // Half second between switches
  
  for (let i = 0; i < iterations; i++) {
    console.log(`[TEST] Iteration ${i + 1}/${iterations}`);
    
    // Simulate clicking CCTV button
    const cctvBtn = document.querySelector('[data-viewer="cctv"]');
    if (cctvBtn) cctvBtn.click();
    
    await new Promise(r => setTimeout(r, delayMs));
    
    // Simulate clicking HOLOGRAM button
    const hologramBtn = document.querySelector('[data-viewer="hologram"]');
    if (hologramBtn) hologramBtn.click();
    
    await new Promise(r => setTimeout(r, delayMs));
  }
  
  console.log('[TEST] Complete! Check console for errors.');
}

testRapidSwitching();
```

### Expected Results ✅
- No console errors containing "Cannot read properties of null"
- No "reading 'add'" errors
- Smooth transitions between viewers
- Model loads correctly each time
- No memory leak warnings

### What We're Testing
1. ✅ Dispose is called before unmount
2. ✅ _isDisposed flag prevents async callbacks on disposed viewers
3. ✅ Scene reference is properly nullified
4. ✅ Guard checks prevent scene.add() on null
5. ✅ No dangling references or memory leaks

## Architectural Changes Summary

### Before (Broken)
```
User switches view
  ↓
Component unmounts
  ↓
dispose() clears scene immediately
  ↓
Network callback fires
  ↓
scene.add(group) ❌ CRASH: null.add
```

### After (Fixed)
```
User switches view
  ↓
Component unmounts
  ↓
dispose() sets _isDisposed = true
  ↓
dispose() clears scene reference
  ↓
Network callback fires
  ↓
Guard check: if (this._isDisposed || !this.scene) return ✅ SAFE
```

## Files Modified
- `frontend/src/viewers/OBJ/OBJViewerCore.jsx`
  - Added lifecycle tracking: _isDisposed, _pendingLoads, _animationFrameId
  - Guard checks before scene operations
  - Proper dispose order

## Verification Checklist
- [x] _isDisposed flag set FIRST in dispose()
- [x] Guard check before scene.add(group)
- [x] Guard check before animation frame callback
- [x] _pendingLoads cleared on dispose
- [x] No dangling network requests
- [x] Scene reference cleared LAST
- [x] Comprehensive error logging

## Notes
- The viewer is now safe to mount/unmount rapidly
- Multiple instances can coexist without interference
- Async operations are properly cancelled/ignored on disposal
- No null reference errors should occur
