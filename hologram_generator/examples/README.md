# Example Detection Data Files

This directory contains example JSON files demonstrating different fire detection scenarios for hologram generation.

## Files

### 1. detection_data_minimal.json
**Scenario:** Small room with minimal fire, one person, one furniture item

- Room: 4m × 3m × 2.8m
- Fire: Single source with no spread
- Smoke: Low density (0.45)
- Persons: 1 stationary person
- Furniture: 1 desk
- Use case: Quick testing and validation

**Generate hologram:**
```bash
python -m hologram_generator -i examples/detection_data_minimal.json -o minimal_hologram.glb
```

---

### 2. detection_data_full.json
**Scenario:** Medium room with active fire, multiple persons and furniture

- Room: 5m × 4m × 3m
- Fire: Source with 3 spread points
- Smoke: Medium density (0.65)
- Persons: 2 persons (1 stationary, 1 moving with trail)
- Furniture: 3 items (bed, cabinet, table)
- Ventilation: 1 door, 2 windows
- Use case: Standard fire incident visualization

**Generate hologram:**
```bash
python -m hologram_generator -i examples/detection_data_full.json -o full_hologram.glb --stats
```

---

### 3. detection_data_complex.json
**Scenario:** Large commercial space with spreading fire, multiple persons

- Room: 8m × 6m × 3.5m (large commercial room)
- Fire: Source with 5 spread points (spreading severity)
- Smoke: High density (0.78), large extent (2.5m radius)
- Persons: 3 persons (2 moving with trails, 1 stationary)
- Furniture: 5 items (sofa, table, bookshelf, cabinet, chair)
- Ventilation: 2 doors (1 open, 1 closed), 2 windows
- Use case: Complex emergency response planning

**Generate hologram:**
```bash
python -m hologram_generator -i examples/detection_data_complex.json -o complex_hologram.glb -v --stats
```

---

## Data Structure

Each JSON file follows this structure:

```json
{
  "incident_id": "Unique identifier",
  "timestamp": "ISO 8601 timestamp",
  "building": { "name", "floor", "room_id", "gps" },
  "room_geometry": { "width_m", "depth_m", "height_m" },
  "fire": { "source", "spread[]", "estimated_area_m2" },
  "smoke": { "plume_center", "extent_radius_m", "density_0_to_1" },
  "persons": [ { "person_id", "x", "y", "z", "state", "motion_trail" } ],
  "furniture": [ { "object_id", "type", "dimensions" } ],
  "ventilation": { "doors[]", "windows[]" },
  "metadata": { "source_camera", "detection_model", "processing_time_ms" }
}
```

## Coordinate System

- **Origin:** Room bottom-left corner (looking north)
- **X-axis:** Left → Right (0 = west wall)
- **Y-axis:** Front → Back (0 = south wall)
- **Z-axis:** Floor → Ceiling (0 = floor)
- **Units:** Meters

## Testing All Examples

```bash
# Test minimal example
python -m hologram_generator -i examples/detection_data_minimal.json -o output/minimal.glb

# Test full example
python -m hologram_generator -i examples/detection_data_full.json -o output/full.glb

# Test complex example
python -m hologram_generator -i examples/detection_data_complex.json -o output/complex.glb -v --stats
```

## Python API Usage

```python
from hologram_generator import HologramGenerator

# Generate from file
generator = HologramGenerator(verbose=True)
glb_path = generator.generate_from_json(
    "examples/detection_data_full.json",
    output_path="hologram.glb"
)

# Print statistics
stats = generator.get_scene_stats()
print(f"Generated {stats['mesh_count']} meshes")
print(f"Total vertices: {stats['total_vertices']:,}")
```

## Viewing Generated Holograms

Generated GLB files can be viewed in:

1. **Online Viewers:**
   - https://gltf-viewer.donmccurdy.com/
   - https://sandbox.babylonjs.com/
   - https://threejs.org/editor/

2. **Desktop Tools:**
   - Blender (Free, open-source)
   - 3D Viewer (Windows built-in)
   - Microsoft 3D Viewer

3. **Web Frameworks:**
   - Three.js GLTFLoader
   - Babylon.js SceneLoader
   - A-Frame

## Customization

To create your own detection data:

1. Copy one of the example files
2. Modify coordinates to match your scenario
3. Ensure all coordinates are within room bounds
4. Validate confidence scores are between 0.0 and 1.0
5. Test with validation:

```bash
python -m hologram_generator -i your_data.json --stats
```

## Notes

- All coordinates must be within room bounds (0 to width/depth/height)
- Confidence and density values must be in range [0.0, 1.0]
- Timestamps should be ISO 8601 format
- Person z-coordinate represents head position (typically 1.7m for standing)
- Fire z-coordinate represents flame base position
