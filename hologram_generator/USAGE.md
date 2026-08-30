# Hologram Generator - Usage Guide

Complete guide for using the 3D Fire Detection Hologram Generator.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Command-Line Interface](#command-line-interface)
4. [Python API](#python-api)
5. [Data Format](#data-format)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Requirements

- Python 3.9 or higher
- 4 GB RAM minimum (8 GB recommended)
- 500 MB disk space for dependencies

### Install Dependencies

```bash
cd hologram_generator
pip install -r requirements.txt
```

### Verify Installation

```bash
python -m hologram_generator --version
```

---

## Quick Start

### Generate Your First Hologram

```bash
# Using the minimal example
python -m hologram_generator \
  --input examples/detection_data_minimal.json \
  --output my_first_hologram.glb \
  --verbose
```

### View the Output

Open `my_first_hologram.glb` in:
- **Online:** https://gltf-viewer.donmccurdy.com/
- **Blender:** Import > glTF 2.0
- **Windows:** 3D Viewer app

---

## Command-Line Interface

### Basic Usage

```bash
python -m hologram_generator -i <input.json> -o <output.glb>
```

### Options

| Option | Short | Description | Required |
|--------|-------|-------------|----------|
| `--input` | `-i` | Input JSON detection data file | Yes |
| `--output` | `-o` | Output GLB file path | No (auto-generated) |
| `--verbose` | `-v` | Enable verbose logging | No |
| `--stats` | | Print scene statistics | No |
| `--version` | | Show version | No |
| `--help` | `-h` | Show help message | No |

### Examples

#### 1. Basic Generation

```bash
python -m hologram_generator -i data.json -o hologram.glb
```

#### 2. With Verbose Output

```bash
python -m hologram_generator -i data.json -o hologram.glb --verbose
```

#### 3. Show Statistics

```bash
python -m hologram_generator -i data.json --stats
```

Output:
```
============================================================
SCENE STATISTICS
============================================================
Incident ID:      INC_2025_08_29_001
Timestamp:        2025-08-29T14:23:45+00:00
Mesh Count:       12
Total Vertices:   15,234
Total Faces:      8,456
============================================================
```

#### 4. Auto-Generated Filename

```bash
python -m hologram_generator -i detection.json
# Outputs: hologram_INC_2025_08_29_001_20250830_143045.glb
```

#### 5. Batch Processing

```bash
# Windows PowerShell
Get-ChildItem examples/*.json | ForEach-Object {
    python -m hologram_generator -i $_.FullName -o "output/$($_.BaseName).glb"
}

# Linux/Mac
for file in examples/*.json; do
    python -m hologram_generator -i "$file" -o "output/$(basename "$file" .json).glb"
done
```

---

## Python API

### Basic Usage

```python
from hologram_generator import HologramGenerator

# Create generator
generator = HologramGenerator(verbose=True)

# Generate from JSON file
glb_path = generator.generate_from_json(
    "detection_data.json",
    output_path="hologram.glb"
)

print(f"Generated: {glb_path}")
```

### Advanced Usage

#### 1. Generate from Dictionary

```python
import json
from hologram_generator import HologramGenerator

# Load data
with open("detection_data.json") as f:
    data = json.load(f)

# Generate hologram
generator = HologramGenerator(verbose=False)
output_path = generator.generate_from_dict(data, output_path="output.glb")
```

#### 2. Access Scene Statistics

```python
from hologram_generator import HologramGenerator

generator = HologramGenerator()
generator.generate_from_json("data.json", "output.glb")

# Get statistics
stats = generator.get_scene_stats()
print(f"Generated {stats['mesh_count']} meshes")
print(f"Total vertices: {stats['total_vertices']:,}")
print(f"Total faces: {stats['total_faces']:,}")
```

#### 3. Error Handling

```python
from hologram_generator import HologramGenerator
from hologram_generator.exceptions import (
    HologramGenerationError,
    InvalidDetectionDataError,
    CoordinateOutOfBoundsError
)

try:
    generator = HologramGenerator(verbose=True)
    result = generator.generate_from_json("data.json", "output.glb")
    print(f"Success: {result}")
    
except InvalidDetectionDataError as e:
    print(f"Invalid data: {e}")
    
except CoordinateOutOfBoundsError as e:
    print(f"Coordinate error: {e}")
    
except HologramGenerationError as e:
    print(f"Generation failed: {e}")
```

#### 4. Validate Data Before Generation

```python
from hologram_generator.models import DetectionData
from pydantic import ValidationError
import json

# Load and validate
with open("detection_data.json") as f:
    data = json.load(f)

try:
    validated = DetectionData(**data)
    print("✓ Data is valid")
    print(f"  Incident: {validated.incident_id}")
    print(f"  Room: {validated.room_geometry.width_m}m × {validated.room_geometry.depth_m}m")
    print(f"  Persons: {len(validated.persons)}")
    print(f"  Furniture: {len(validated.furniture)}")
    
except ValidationError as e:
    print("✗ Validation failed:")
    for error in e.errors():
        print(f"  - {error['loc']}: {error['msg']}")
```

#### 5. Programmatic Data Creation

```python
from hologram_generator import HologramGenerator, DetectionData
from hologram_generator.models import *
from datetime import datetime

# Create detection data programmatically
data = DetectionData(
    incident_id="PROG_001",
    timestamp=datetime.now(),
    building=Building(
        name="My Building",
        floor=1,
        room_id="101",
        gps=GPSCoordinates(latitude=28.5355, longitude=77.3910)
    ),
    room_geometry=RoomGeometry(
        width_m=5.0,
        depth_m=4.0,
        height_m=3.0
    ),
    fire=Fire(
        source=FireSource(
            x=2.5, y=2.0, z=0.3,
            confidence=0.95,
            severity="active"
        ),
        spread=[],
        estimated_area_m2=0.5
    ),
    smoke=SmokePlume(
        plume_center=Point3D(x=2.5, y=2.0, z=1.5),
        extent_radius_m=1.5,
        density_0_to_1=0.65,
        spread_direction=Point3D(x=0.1, y=0.1, z=0.5),
        coverage_region=[]
    ),
    persons=[],
    furniture=[],
    metadata=Metadata(
        source_camera="CAM_001",
        detection_model="YOLOv8",
        processing_time_ms=200
    )
)

# Generate
generator = HologramGenerator()
glb_path = generator.generate_from_dict(
    data.model_dump(),
    output_path="programmatic_hologram.glb"
)
```

---

## Data Format

### Coordinate System

```
      Z (height)
      ↑
      |
      |___→ Y (depth)
     /
    /
   ↙ 
  X (width)

Origin: (0, 0, 0) = bottom-left-front corner
X-axis: 0 (west wall) to width_m (east wall)
Y-axis: 0 (south wall) to depth_m (north wall)
Z-axis: 0 (floor) to height_m (ceiling)
```

### Minimal Required Fields

```json
{
  "incident_id": "UNIQUE_ID",
  "timestamp": "2025-08-30T10:00:00Z",
  "building": {
    "name": "Building Name",
    "floor": 1,
    "room_id": "101",
    "gps": {"latitude": 28.5355, "longitude": 77.3910}
  },
  "room_geometry": {
    "width_m": 5.0,
    "depth_m": 4.0,
    "height_m": 3.0
  },
  "fire": {
    "source": {
      "x": 2.5, "y": 2.0, "z": 0.3,
      "confidence": 0.95,
      "severity": "active"
    },
    "spread": [],
    "estimated_area_m2": 0.5
  },
  "smoke": {
    "plume_center": {"x": 2.5, "y": 2.0, "z": 1.5},
    "extent_radius_m": 1.5,
    "density_0_to_1": 0.65,
    "spread_direction": {"x": 0.1, "y": 0.1, "z": 0.5},
    "coverage_region": []
  },
  "persons": [],
  "furniture": [],
  "metadata": {
    "source_camera": "CAMERA_ID",
    "detection_model": "MODEL_NAME",
    "processing_time_ms": 200
  }
}
```

### Field Constraints

| Field | Type | Range | Required |
|-------|------|-------|----------|
| `confidence` | float | 0.0 - 1.0 | Yes |
| `intensity` | float | 0.0 - 1.0 | Yes |
| `density_0_to_1` | float | 0.0 - 1.0 | Yes |
| `latitude` | float | -90 to 90 | Yes |
| `longitude` | float | -180 to 180 | Yes |
| `x, y, z` | float | Within room bounds | Yes |
| All `_m` fields | float | > 0 | Yes |

---

## Advanced Usage

### Custom Material Colors

Materials are predefined but can be customized by modifying `materials.py`:

```python
from hologram_generator.materials import MaterialLibrary, GLBMaterial

# Create custom fire material
custom_fire = GLBMaterial(
    name="custom_fire",
    base_color_rgb=(255, 50, 0),  # More orange
    alpha=1.0,
    emissive_rgb=(255, 80, 0),
    emissive_strength=2.5,  # Brighter
    metallic=0.0,
    roughness=0.1
)
```

### Performance Optimization

For large scenes:

```python
generator = HologramGenerator(verbose=False)  # Disable verbose logging

# Process in batch
import glob
for json_file in glob.glob("data/*.json"):
    generator.generate_from_json(json_file)
```

### Integration with Web Viewers

#### Three.js Example

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
    <script>
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const loader = new THREE.GLTFLoader();
        loader.load('hologram.glb', function(gltf) {
            scene.add(gltf.scene);
            camera.position.z = 10;
            animate();
        });

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
    </script>
</body>
</html>
```

---

## Troubleshooting

### Common Issues

#### 1. Coordinate Out of Bounds Error

**Error:**
```
CoordinateOutOfBoundsError: Person P_001 x=6.0 outside room bounds [0, 5.0]
```

**Solution:**
- Verify all coordinates are within room dimensions
- Check that x ≤ width_m, y ≤ depth_m, z ≤ height_m

#### 2. Invalid JSON Format

**Error:**
```
InvalidDetectionDataError: Invalid JSON: Expecting property name enclosed in double quotes
```

**Solution:**
- Validate JSON syntax using: https://jsonlint.com/
- Ensure all keys use double quotes, not single quotes
- Check for trailing commas

#### 3. File Size Too Large

**Warning:**
```
File size (12.5 MB) exceeds target (10 MB)
```

**Solutions:**
- Reduce fire spread points
- Simplify motion trails
- Remove low-confidence detections
- Use lower grid resolution

#### 4. Missing Dependencies

**Error:**
```
ModuleNotFoundError: No module named 'trimesh'
```

**Solution:**
```bash
pip install -r requirements.txt
```

#### 5. GLB File Won't Open

**Solutions:**
- Verify file is complete (check file size > 0)
- Try different viewer (online, Blender, Three.js)
- Check GLB magic bytes: first 4 bytes should be `67 6C 54 46` (glTF)

### Performance Issues

If generation takes > 5 seconds:

1. **Reduce mesh complexity:**
   - Fewer furniture items
   - Simpler motion trails
   - Lower grid resolution

2. **Disable verbose logging:**
   ```python
   generator = HologramGenerator(verbose=False)
   ```

3. **Check system resources:**
   - Ensure 4+ GB RAM available
   - Close other applications

### Getting Help

1. **Check logs:**
   ```bash
   python -m hologram_generator -i data.json -v 2>&1 | tee debug.log
   ```

2. **Validate your data:**
   ```python
   from hologram_generator.models import DetectionData
   DetectionData(**your_data)  # Will raise ValidationError with details
   ```

3. **Run tests:**
   ```bash
   cd hologram_generator
   pytest tests/ -v
   ```

---

## Best Practices

### 1. Data Quality

- Use confidence thresholds (≥ 0.7 recommended)
- Filter out duplicate detections
- Validate coordinates before sending

### 2. File Organization

```
project/
├── data/
│   ├── incident_001.json
│   ├── incident_002.json
│   └── ...
├── output/
│   ├── hologram_001.glb
│   ├── hologram_002.glb
│   └── ...
└── scripts/
    └── batch_generate.py
```

### 3. Automation

```python
# batch_generate.py
from pathlib import Path
from hologram_generator import HologramGenerator

generator = HologramGenerator(verbose=False)

input_dir = Path("data")
output_dir = Path("output")
output_dir.mkdir(exist_ok=True)

for json_file in input_dir.glob("*.json"):
    try:
        output_file = output_dir / f"{json_file.stem}.glb"
        generator.generate_from_json(json_file, output_path=str(output_file))
        print(f"✓ {json_file.name} → {output_file.name}")
    except Exception as e:
        print(f"✗ {json_file.name}: {e}")
```

### 4. Version Control

Include in `.gitignore`:
```
*.glb
*.log
__pycache__/
*.pyc
.pytest_cache/
output/
```

---

## Next Steps

- Explore example files in `examples/`
- Run unit tests: `pytest tests/`
- Integrate with your detection pipeline
- Customize materials and colors
- Deploy to production

For more information, see [README.md](README.md)
