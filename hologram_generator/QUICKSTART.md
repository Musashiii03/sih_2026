# Quick Start Guide

## ⚡ Fast Setup

### 1. Install Dependencies

```powershell
cd s:\Programming\sih_2026
pip install -r hologram_generator/requirements.txt
```

### 2. Run First Example

**IMPORTANT:** Run from the parent directory (`sih_2026`), not from inside `hologram_generator`

```powershell
# From s:\Programming\sih_2026 directory
python -m hologram_generator -i hologram_generator/examples/detection_data_minimal.json -o test.glb --stats
```

### Alternative: Use run.py script

```powershell
# Can run from any directory
cd hologram_generator
python run.py -i examples/detection_data_minimal.json -o test.glb --stats
```

## 📋 Common Commands

### Generate from minimal example
```powershell
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/detection_data_minimal.json -o minimal.glb
```

### Generate from full example with statistics
```powershell
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/detection_data_full.json -o full.glb --stats
```

### Generate with verbose logging
```powershell
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/detection_data_complex.json -o complex.glb -v --stats
```

### Generate all examples
```powershell
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/detection_data_minimal.json -o minimal.glb
python -m hologram_generator -i hologram_generator/examples/detection_data_full.json -o full.glb
python -m hologram_generator -i hologram_generator/examples/detection_data_complex.json -o complex.glb
```

## 🎯 Output

Generated files will be GLB (binary glTF 2.0) format.

**View online:**
- Upload to https://gltf-viewer.donmccurdy.com/
- Upload to https://sandbox.babylonjs.com/

**View locally:**
- Windows 3D Viewer (built-in)
- Blender: File > Import > glTF 2.0
- Three.js/Babylon.js web viewers

## 🐛 Troubleshooting

### "ImportError: attempted relative import"

**Solution:** Run from parent directory (`sih_2026`), not from inside `hologram_generator`

```powershell
# ✗ Wrong - will fail
cd s:\Programming\sih_2026\hologram_generator
python -m hologram_generator -i examples/...

# ✓ Correct - works
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/...
```

### "Module not found"

**Solution:** Install dependencies

```powershell
pip install -r hologram_generator/requirements.txt
```

### "File not found"

**Solution:** Use correct relative path from `sih_2026` directory

```powershell
# Correct path structure
cd s:\Programming\sih_2026
python -m hologram_generator -i hologram_generator/examples/detection_data_minimal.json -o output.glb
```

## 🔧 Python API Usage

```python
import sys
sys.path.append('s:/Programming/sih_2026')

from hologram_generator import HologramGenerator

# Generate from JSON file
generator = HologramGenerator(verbose=True)
glb_path = generator.generate_from_json(
    "hologram_generator/examples/detection_data_full.json",
    output_path="hologram.glb"
)

# Get statistics
stats = generator.get_scene_stats()
print(f"Meshes: {stats['mesh_count']}")
print(f"Vertices: {stats['total_vertices']:,}")
```

## 📊 Expected Results

### Minimal Example
- **Input:** 4m × 3m room, 1 person, 1 fire, basic smoke
- **Output:** ~0.05 MB, ~1,300 vertices, 8 meshes
- **Time:** < 1 second

### Full Example
- **Input:** 5m × 4m room, 2 persons, 3 furniture, fire with spread
- **Output:** ~0.1 MB, ~3,000 vertices, 12 meshes
- **Time:** < 2 seconds

### Complex Example
- **Input:** 8m × 6m commercial space, 3 persons, 5 furniture, spreading fire
- **Output:** ~0.2 MB, ~6,000 vertices, 18 meshes
- **Time:** < 3 seconds

## 📚 Next Steps

1. ✅ Generate test holograms (see commands above)
2. 📖 Read [USAGE.md](USAGE.md) for detailed documentation
3. 🏗️ Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
4. 🧪 Run tests: `pytest hologram_generator/tests/ -v`
5. 🔗 Integrate with your fire detection pipeline

## ✨ Features

- ✅ < 5 second processing time
- ✅ Coordinate validation
- ✅ PBR materials with emissive effects
- ✅ Fire sources and spread visualization
- ✅ Smoke plumes with density
- ✅ Person detection with motion trails
- ✅ Furniture and obstacles
- ✅ Reference grid
- ✅ GLB export compatible with all major viewers

## 🆘 Need Help?

- **Documentation:** [USAGE.md](USAGE.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- **Examples:** `hologram_generator/examples/`
- **Tests:** `pytest hologram_generator/tests/ -v`
- **Logs:** Run with `--verbose` flag for detailed output
