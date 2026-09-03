# Comprehensive Hologram Generation Workflow
## Fire + Human + Object Detection → 3D Hologram

Complete guide for detecting and visualizing fire, humans, and objects in 3D holograms.

---

## 🎯 System Overview

```
Video Input
    ↓
┌─────────────────────────────────────────────────────────┐
│ Enhanced Detection (run_fire_human_objects_hologram.py) │
│  • YOLOv8 Fire Model                                    │
│  • YOLOv8 Human Model                                   │
│  • YOLOv8n COCO Model (objects)                         │
└─────────────────────────────────────────────────────────┘
    ↓
Metadata JSON files (fire + humans + objects)
    ↓
┌─────────────────────────────────────────────────────────┐
│ Enhanced Converter (convert_all_detections_to_hologram.py)│
│  • Estimates 3D positions                               │
│  • Maps object types                                    │
│  • Calculates dimensions                                │
└─────────────────────────────────────────────────────────┘
    ↓
hologram_data_*.json (3D coordinates for all objects)
    ↓
┌─────────────────────────────────────────────────────────┐
│ Hologram Generator                                       │
│  • Generates 3D meshes                                  │
│  • Applies materials                                    │
│  • Exports to GLB                                       │
└─────────────────────────────────────────────────────────┘
    ↓
hologram.glb (3D visualization)
```

---

## 📝 Step-by-Step Guide

### Step 1: Run Enhanced Detection

```powershell
cd s:\Programming\sih_2026\backend\models
python run_fire_human_objects_hologram.py
```

**What it does:**
- Detects **fire** (red bounding boxes)
- Detects **humans** (cyan bounding boxes)  
- Detects **objects** (yellow bounding boxes) - furniture, appliances, etc.
- Saves metadata with ALL detections

**Output:**
- `data/fire_incidents/YYYY-MM-DD/INC-YYYYMMDD-HHMMSS/`
  - `frames/` - Extracted frame images
  - `metadata/` - JSON files with fire/human/object coordinates
  - `summary.json` - Incident summary

### Step 2: Convert to Hologram Format

```powershell
cd s:\Programming\sih_2026

python convert_all_detections_to_hologram.py "path\to\metadata\"
```

**Example:**
```powershell
python convert_all_detections_to_hologram.py "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\metadata"
```

**With custom room size:**
```powershell
python convert_all_detections_to_hologram.py "path\to\metadata\" 10.0 8.0 3.5
```

**What it does:**
- Converts 2D pixel coordinates → 3D spatial coordinates
- Estimates object dimensions (width, depth, height)
- Determines person state (moving/stationary)
- Maps object types (chair, table, bed, etc.)
- Generates smoke plume based on fire data

**Output:**
- `hologram_data_INC-YYYYMMDD-HHMMSS.json` - Complete 3D scene data

### Step 3: Generate Hologram

```powershell
cd s:\Programming\sih_2026

python -m hologram_generator -i "path\to\hologram_data_*.json" -o output.glb --stats
```

**Example:**
```powershell
python -m hologram_generator `
  -i "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\hologram_data_INC-20260830-152430.json" `
  -o "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\comprehensive_hologram.glb" `
  --stats
```

**What it does:**
- Generates 3D meshes for all detected objects
- Applies PBR materials with proper colors
- Creates room boundaries and reference grid
- Exports to GLB format

**Output:**
- `comprehensive_hologram.glb` - Final 3D visualization

### Step 4: View Hologram

**Online (easiest):**
1. Go to: https://gltf-viewer.donmccurdy.com/
2. Drag & drop your `.glb` file
3. Explore!

**Windows 3D Viewer:**
```powershell
explorer path\to\hologram.glb
```

---

## 🎨 What You'll See in the Hologram

### 🔥 Fire Elements
- **Fire Source:** Red glowing sphere
- **Fire Spread:** Orange spheres (if multiple detections)
- **Smoke Plume:** Gray semi-transparent cloud above fire

### 👤 Humans
- **Stationary Person:** Yellow capsule (1.7m tall)
- **Moving Person:** Cyan capsule with motion trail
- Position based on detection in video frame

### 📦 Objects/Furniture
- **Steel blue semi-transparent boxes**
- Sized based on detection bounding boxes
- Types detected:
  - Chairs, couches, beds
  - Tables, desks
  - TVs, appliances
  - Cabinets, shelves
  - And many more COCO objects

### 🏠 Scene Elements
- **Room:** Blue wireframe box
- **Reference Grid:** 1m spacing on floor
- **Ground Plane:** Dark surface at z=0

---

## 🔧 Supported Object Types

The system can detect and visualize these objects (from COCO dataset):

| Category | Objects |
|----------|---------|
| **Furniture** | chair, couch, bed, dining table, desk |
| **Electronics** | tv, laptop, mouse, keyboard, remote, cell phone |
| **Kitchen** | microwave, oven, toaster, sink, refrigerator |
| **Bathroom** | toilet, sink |
| **Decor** | potted plant, vase, clock, book |
| **Storage** | cabinet, bookshelf |

---

## 📊 Coordinate System & Estimation

### 2D to 3D Mapping

```
Image (pixels)          →    Room (meters)
─────────────────            ─────────────────
X: 0 to 1920                 X: 0 to room_width
Y: 0 to 1080                 Y: 0 to room_depth  
Bbox size                    Z: estimated height
```

### Height Estimation Logic

**Fire:**
- Near floor level (0.2m - 1.0m)
- Based on bbox height ratio

**Person:**
- Standing height: 1.7m (head position)
- Capsule representation

**Objects:**
- Height estimated from:
  - Typical object dimensions
  - Bbox size in image
  - Position in frame

### Dimension Estimation

Objects get realistic dimensions based on:
1. **Default sizes** (e.g., chair = 0.5m × 0.5m × 1.0m)
2. **Bbox size scaling** (larger bbox = larger object)
3. **Clamping** (prevents unrealistic sizes)

---

## 💡 Usage Examples

### Example 1: Process Recent Incident

```powershell
# Get today's incidents
$date = Get-Date -Format "yyyy-MM-dd"
$incidents = Get-ChildItem "S:\Programming\sih_2026\data\fire_incidents\$date" -Directory

foreach ($inc in $incidents) {
    Write-Host "Processing $($inc.Name)..." -ForegroundColor Green
    
    # Convert to hologram data
    python convert_all_detections_to_hologram.py "$($inc.FullName)\metadata"
    
    # Generate hologram
    $hologramJson = "$($inc.FullName)\hologram_data_$($inc.Name).json"
    $hologramGlb = "$($inc.FullName)\comprehensive_hologram.glb"
    
    python -m hologram_generator -i $hologramJson -o $hologramGlb --stats
}
```

### Example 2: Process with Custom Room Size

```powershell
# For a large commercial space
python convert_all_detections_to_hologram.py `
  "S:\Programming\sih_2026\data\fire_incidents\2026-08-30\INC-20260830-152430\metadata" `
  12.0 10.0 4.0

# Then generate
python -m hologram_generator -i hologram_data_*.json -o large_room_hologram.glb
```

### Example 3: Analyze Detection Statistics

```powershell
# View hologram data
$json = Get-Content "hologram_data_*.json" | ConvertFrom-Json

Write-Host "Fire detections: $($json.fire.spread.Count + 1)"
Write-Host "Persons: $($json.persons.Count)"
Write-Host "Objects: $($json.furniture.Count)"

# List detected objects
$json.furniture | ForEach-Object {
    Write-Host "  - $($_.type) at ($($_.x), $($_.y), $($_.z))"
}
```

---

## 🎯 Accuracy & Limitations

### ✅ What's Accurate
- Relative positions of detected objects
- Detection confidence scores
- Object counts
- Approximate spatial relationships

### ⚠️ What's Estimated
- Exact 3D coordinates (from 2D images)
- Object dimensions (scaled estimates)
- Room dimensions (user-specified)
- Depth/distance (no stereo vision)

### 🔧 Improving Accuracy

1. **Calibrate Room Dimensions:**
   - Measure actual room size
   - Use correct dimensions in converter

2. **Use Better Camera Setup:**
   - Stereo cameras for depth
   - Depth sensors (LiDAR, RealSense)
   - Multiple camera angles

3. **Improve Detection Models:**
   - Train on your specific environment
   - Use higher resolution models
   - Add custom object classes

---

## 🆘 Troubleshooting

### "No fire detections found"

**Solution:**
- Check detection confidence is > 30%
- Verify fire model is working
- Check `summary.json` for detections

### "Object dimensions seem wrong"

**Solution:**
- Adjust room dimensions to match reality
- Check bbox quality in original detections
- Modify dimension estimation logic if needed

### "Persons not showing up"

**Solution:**
- Check if human detection model ran
- Verify `metadata/*.json` files have `humans` section
- Lower confidence threshold in detection

### "Objects not detected"

**Solution:**
- Ensure YOLOv8n model is installed (`yolov8n.pt`)
- Check if objects are in COCO dataset
- Adjust confidence threshold (currently 0.5)

---

## 📂 Complete File Structure

```
s:\Programming\sih_2026\
│
├── backend\
│   └── models\
│       ├── run_fire_human_objects_hologram.py  ← NEW: Enhanced detection
│       ├── run_fire_human_only.py              ← Original fire+human
│       ├── universal_fire_master_100pct.pt
│       ├── universal_human_master.pt
│       └── yolov8n.pt                          ← COCO objects model
│
├── data\
│   └── fire_incidents\
│       └── 2026-08-30\
│           └── INC-20260830-152430\
│               ├── frames\                     ← Frame images
│               ├── metadata\                   ← JSON with all detections
│               ├── summary.json                ← Incident summary
│               ├── hologram_data_*.json        ← 3D coordinates
│               └── comprehensive_hologram.glb  ← Final hologram
│
├── hologram_generator\                         ← Hologram generation system
│
├── convert_all_detections_to_hologram.py      ← NEW: Enhanced converter
├── convert_detection_to_hologram.py           ← Original fire-only converter
└── COMPREHENSIVE_HOLOGRAM_WORKFLOW.md         ← This guide
```

---

## 🚀 Next Steps

1. **Run enhanced detection** on your videos
2. **Convert to holograms** with all object data
3. **View and analyze** in 3D viewer
4. **Integrate with dashboard** for real-time visualization
5. **Calibrate room dimensions** for your locations
6. **Train custom models** for better object detection

---

## 📖 Related Documentation

- **DETECTION_TO_HOLOGRAM_WORKFLOW.md** - Original fire-only workflow
- **HOW_TO_RUN.md** - Basic hologram generator usage
- **hologram_generator/USAGE.md** - Detailed generator documentation
- **hologram_generator/ARCHITECTURE.md** - Technical architecture

---

**Status:** ✅ System ready for comprehensive fire/human/object detection and hologram generation  
**Last Updated:** 2026-08-30  
**Version:** 2.0 (Enhanced with full object detection)
