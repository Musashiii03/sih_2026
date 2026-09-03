# Detection to Hologram Workflow

Complete workflow for converting fire detection data to 3D holograms.

## 🎯 Overview

Your fire detection system produces **2D bounding boxes in pixel coordinates**. The hologram generator needs **3D spatial coordinates in meters**. This workflow bridges that gap.

## 📊 Pipeline

```
Fire Detection Images
        ↓
    YOLOv8 Model
        ↓
  summary.json (2D bounding boxes)
        ↓
convert_detection_to_hologram.py  ← Conversion script
        ↓
hologram_data_*.json (3D coordinates)
        ↓
hologram_generator
        ↓
    hologram.glb (3D visualization)
```

## ✅ Successfully Generated!

### Your Incident

**Location:** `S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\`

**Files Created:**
1. `hologram_data_INC-20260830-152430.json` - 3D detection data
2. `incident_hologram.glb` - 3D hologram (46.71 KB)

**Detection Summary:**
- **Incident ID:** INC-20260830-152430
- **Timestamp:** 2026-08-30 15:23:54
- **Fire Confidence:** 47.32%
- **Fire Location:** (2.17m, 5.30m, 0.34m) from origin
- **Estimated Fire Area:** 0.06 m²
- **Room Size:** 8m × 6m × 3m
- **Smoke Density:** 58.93%

## 🎨 View Your Hologram

### Online (Easiest)

1. Open https://gltf-viewer.donmccurdy.com/
2. Drag and drop: `incident_hologram.glb`
3. You'll see:
   - 8m × 6m × 3m room (blue wireframe)
   - Red fire sphere at detected location
   - Gray smoke plume above fire
   - Reference grid on floor

### Desktop

**Windows:**
```powershell
explorer "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\incident_hologram.glb"
```
Right-click → Open with → 3D Viewer

**Blender:**
1. Open Blender
2. File → Import → glTF 2.0
3. Navigate to `incident_hologram.glb`

## 🔄 Process Any Fire Incident

### Step 1: Convert Detection Data

```powershell
cd s:\Programming\sih_2026

# Basic conversion (uses default 8m × 6m × 3m room)
python convert_detection_to_hologram.py path\to\summary.json

# With custom room dimensions
python convert_detection_to_hologram.py path\to\summary.json 10.0 8.0 3.5
```

### Step 2: Generate Hologram

```powershell
cd s:\Programming\sih_2026

# Generate hologram
python -m hologram_generator -i path\to\hologram_data_*.json -o output.glb --stats
```

### Complete Example

```powershell
cd s:\Programming\sih_2026

# Find incident
$incident = "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430"

# Convert to 3D
python convert_detection_to_hologram.py "$incident\summary.json"

# Generate hologram
python -m hologram_generator `
  -i "$incident\hologram_data_INC-20260830-152430.json" `
  -o "$incident\incident_hologram.glb" `
  --stats
```

## 🔧 Conversion Script Details

### What It Does

The `convert_detection_to_hologram.py` script:

1. **Reads** fire detection bounding boxes (pixels)
2. **Estimates** 3D position based on:
   - Horizontal position (X-axis)
   - Vertical position → Depth (Y-axis)
   - Bounding box size → Height (Z-axis)
3. **Creates** primary fire source (highest confidence)
4. **Generates** fire spread points (other detections)
5. **Estimates** smoke plume (above fire)
6. **Calculates** fire area (m²)
7. **Outputs** hologram-compatible JSON

### Coordinate Mapping

```
Image Coordinates (pixels)     Room Coordinates (meters)
┌─────────────────┐           ┌─────────────────┐
│ (0,0)           │           │      (0,6,3)    │  ↑ Z (height)
│                 │           │                 │  |
│    [Fire]       │    →      │     [Fire]      │  |
│                 │           │                 │  |
│           (w,h) │           │ (8,0,0)         │  └──→ Y (depth)
└─────────────────┘           └─────────────────┘     X (width) →

Assumptions:
- Camera at (4, 0, 1.5) looking toward (4, 6, 1.5)
- Objects lower in image are closer to floor
- Horizontal position maps to room width
- Vertical position estimates depth
```

### Room Dimension Recommendations

| Space Type | Width | Depth | Height | Command |
|------------|-------|-------|--------|---------|
| Small room | 4m | 3m | 2.8m | `python convert... summary.json 4 3 2.8` |
| Standard room | 6m | 5m | 3.0m | `python convert... summary.json 6 5 3` |
| Large room | 8m | 6m | 3.0m | `python convert... summary.json` (default) |
| Commercial space | 12m | 10m | 3.5m | `python convert... summary.json 12 10 3.5` |
| Warehouse | 20m | 15m | 5.0m | `python convert... summary.json 20 15 5` |

## 📁 Output Files

### hologram_data_*.json

3D detection data in hologram format:

```json
{
  "incident_id": "INC-20260830-152430",
  "timestamp": "2026-08-30T15:23:54.309508Z",
  "room_geometry": {
    "width_m": 8.0,
    "depth_m": 6.0,
    "height_m": 3.0
  },
  "fire": {
    "source": {
      "x": 2.17,
      "y": 5.3,
      "z": 0.34,
      "confidence": 0.473
    }
  },
  "smoke": {
    "plume_center": {"x": 2.17, "y": 5.3, "z": 1.34},
    "extent_radius_m": 1.5,
    "density_0_to_1": 0.589
  }
}
```

### incident_hologram.glb

Binary 3D model containing:
- Room geometry (wireframe)
- Fire visualization (emissive sphere)
- Smoke plume (semi-transparent)
- Reference grid
- All PBR materials

## 🔄 Batch Processing

Process multiple incidents:

```powershell
# Get all incidents from today
$date = Get-Date -Format "yyyy-MM-dd"
$incidents = Get-ChildItem "S:\Programming\sih_2026\data\fire_incidents\$date" -Directory

foreach ($inc in $incidents) {
    $summary = "$($inc.FullName)\summary.json"
    $hologram = "$($inc.FullName)\hologram_data_$($inc.Name).json"
    $output = "$($inc.FullName)\incident_hologram.glb"
    
    if (Test-Path $summary) {
        Write-Host "Processing $($inc.Name)..." -ForegroundColor Green
        
        # Convert
        python convert_detection_to_hologram.py $summary
        
        # Generate
        python -m hologram_generator -i $hologram -o $output
        
        Write-Host "  Generated: $output" -ForegroundColor Cyan
    }
}

Write-Host "`nAll incidents processed!" -ForegroundColor Green
```

## 🎯 What You'll See

### In the Hologram

1. **Room Boundaries**
   - Blue wireframe box showing room dimensions
   - X, Y, Z axes visible

2. **Fire Location**
   - Red glowing sphere at detected position
   - Size indicates detection confidence
   - Position shows where fire was detected

3. **Smoke Plume**
   - Gray semi-transparent cloud above fire
   - Size based on fire extent
   - Density based on detection confidence

4. **Reference Grid**
   - 1-meter grid on floor
   - Helps estimate distances
   - Shows room scale

### Interactive Features (in viewer)

- **Rotate:** Drag to view from any angle
- **Zoom:** Scroll to zoom in/out
- **Pan:** Right-drag to move
- **Reset:** Double-click to reset view

## 📊 Accuracy Notes

### What's Accurate

- ✅ Relative positions within frame
- ✅ Fire detection confidence
- ✅ Number of fire regions
- ✅ Approximate fire location

### What's Estimated

- ⚠️ Exact 3D coordinates (derived from 2D)
- ⚠️ Room dimensions (user-specified)
- ⚠️ Smoke properties (algorithmically generated)
- ⚠️ Fire height (estimated from bbox size)

### Improving Accuracy

For better 3D accuracy:
1. **Use stereo cameras** for depth perception
2. **Add depth sensors** (LiDAR, structured light)
3. **Calibrate camera** with known room dimensions
4. **Use AR markers** for reference points
5. **Integrate building floor plans** for exact geometry

## 🚀 Advanced Usage

### Add Person Detection

If you detect persons:

```python
# In convert_detection_to_hologram.py, add:
"persons": [
    {
        "person_id": "P_001",
        "x": person_x,
        "y": person_y,
        "z": 1.7,  # Standing height
        "state": "stationary",
        "motion_trail": [],
        "confidence": person_confidence
    }
]
```

### Add Furniture Detection

If you detect furniture/obstacles:

```python
"furniture": [
    {
        "object_id": "OBJ_001",
        "type": "detected_object",
        "x": obj_x,
        "y": obj_y,
        "z": obj_height / 2,
        "width_m": obj_width,
        "depth_m": obj_depth,
        "height_m": obj_height,
        "confidence": obj_confidence,
        "material": "generic"
    }
]
```

## 📖 Next Steps

1. ✅ **View your hologram** in online viewer
2. 🔄 **Process other incidents** using batch script
3. 📊 **Integrate with dashboard** for real-time visualization
4. 🎯 **Calibrate room dimensions** for your specific locations
5. 🔧 **Customize conversion** for your specific needs

## 🆘 Troubleshooting

### "No fire detections found"

**Cause:** summary.json has no bounding boxes

**Solution:** Check detection confidence threshold

### "Coordinates outside room bounds"

**Cause:** Room dimensions too small for estimated positions

**Solution:** Increase room dimensions:
```powershell
python convert_detection_to_hologram.py summary.json 12 10 3.5
```

### Fire appears in wrong location

**Cause:** Room dimensions don't match actual space

**Solution:** Measure actual room and use those dimensions

## 📞 Support

- **Conversion script:** `convert_detection_to_hologram.py`
- **Hologram generator:** `hologram_generator/`
- **Examples:** `hologram_generator/examples/`
- **Documentation:** `hologram_generator/USAGE.md`

---

**Status:** ✅ Working and tested with your incident data  
**Your Hologram:** `S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\incident_hologram.glb`  
**View Online:** https://gltf-viewer.donmccurdy.com/
