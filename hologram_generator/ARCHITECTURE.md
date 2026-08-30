# Hologram Generator - Architecture Documentation

Technical architecture and design documentation for developers.

## System Overview

The 3D Fire Detection Hologram Generator is a Python-based system that converts structured fire detection data (JSON) into interactive 3D visualizations (GLB format) for emergency response teams.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Input Layer                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │ JSON File    │   OR   │ Python Dict  │                  │
│  └──────┬───────┘        └──────┬───────┘                  │
└─────────┼──────────────────────┼──────────────────────────┘
          │                      │
          └──────────┬───────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Validation Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pydantic Models (models.py)                          │  │
│  │ • Schema validation                                   │  │
│  │ • Coordinate bounds checking                         │  │
│  │ • Type coercion                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 Generation Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ HologramGenerator (hologram_generator.py)            │  │
│  │                                                       │  │
│  │  1. Initialize Scene                                 │  │
│  │  2. Generate Room Geometry                           │  │
│  │  3. Generate Fire Geometry                           │  │
│  │  4. Generate Smoke Volume                            │  │
│  │  5. Generate Person Capsules + Trails               │  │
│  │  6. Generate Furniture Boxes                         │  │
│  │  7. Generate Ventilation Elements                    │  │
│  │  8. Generate Reference Grid                          │  │
│  │  9. Validate & Optimize                              │  │
│  │ 10. Export to GLB                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Mesh Layer                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MeshGenerators (mesh_generators.py)                  │  │
│  │ • create_room_wireframe()                            │  │
│  │ • create_fire_source()                               │  │
│  │ • create_smoke_plume()                               │  │
│  │ • create_person_capsule()                            │  │
│  │ • create_furniture_box()                             │  │
│  │ • create_motion_trail()                              │  │
│  │ • create_door/window()                               │  │
│  │ • create_reference_grid()                            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Material Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MaterialLibrary (materials.py)                       │  │
│  │ • PBR material definitions                           │  │
│  │ • Dynamic material generation                        │  │
│  │ • Color management                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Export Layer                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Trimesh Scene Export                                 │  │
│  │ • GLB (Binary glTF 2.0) format                       │  │
│  │ • PBR materials                                      │  │
│  │ • Optimized mesh data                                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
                    ┌──────────────┐
                    │  hologram.glb │
                    └──────────────┘
```

---

## Module Structure

### Core Modules

#### 1. `models.py` - Data Models

**Purpose:** Pydantic data models for input validation

**Key Classes:**
- `DetectionData` - Root model
- `RoomGeometry` - Room dimensions
- `Fire`, `FireSource`, `FireSpread` - Fire data
- `SmokePlume` - Smoke data
- `Person` - Person detection with motion trails
- `Furniture` - Object detection
- `Ventilation`, `Door`, `Window` - Ventilation elements

**Validation:**
- Type checking
- Range validation (confidence 0-1, GPS bounds)
- Coordinate bounds checking (within room)
- Required field enforcement

**Example:**
```python
class DetectionData(BaseModel):
    incident_id: str
    timestamp: datetime
    room_geometry: RoomGeometry
    fire: Fire
    # ... validators ensure data integrity
```

#### 2. `materials.py` - Material Library

**Purpose:** PBR material definitions for 3D rendering

**Key Classes:**
- `GLBMaterial` - Material data structure
- `MaterialLibrary` - Predefined materials

**Material Properties:**
- Base color (RGB)
- Alpha (transparency)
- Emissive color & strength
- Metallic factor
- Roughness factor
- Double-sided rendering

**Dynamic Materials:**
- `get_fire_spread_material(intensity)` - Intensity-based fire color
- `get_smoke_material(density)` - Density-based smoke transparency

#### 3. `mesh_generators.py` - Geometry Generation

**Purpose:** Create 3D meshes for scene elements

**Key Functions:**

| Function | Output | Primitives Used |
|----------|--------|-----------------|
| `create_room_wireframe()` | Room boundaries | Cylinders (edges) |
| `create_fire_source()` | Fire sphere | Icosphere |
| `create_fire_spread()` | Spread points | Icospheres |
| `create_smoke_plume()` | Smoke volume | Icosphere |
| `create_person_capsule()` | Person figure | Cylinder + Hemisphere |
| `create_motion_trail()` | Path lines | Cylinders |
| `create_furniture_box()` | Furniture AABB | Box |
| `create_door/window()` | Planes | Rectangular mesh |
| `create_reference_grid()` | Floor grid | Cylinder grid |

**Mesh Validation:**
- Vertex/face count
- Bounds checking
- Watertight validation
- Volume calculation

#### 4. `hologram_generator.py` - Main Generator

**Purpose:** Orchestrate scene assembly and export

**Pipeline:**
1. **Load Data** → Parse JSON or dict
2. **Validate** → Pydantic validation
3. **Initialize Scene** → Create trimesh.Scene
4. **Generate Geometry** → Call mesh generators
5. **Apply Materials** → Assign PBR materials
6. **Optimize** → Combine meshes, validate
7. **Export** → Write GLB file

**Key Methods:**
- `generate_from_dict(data)` - From dictionary
- `generate_from_json(path)` - From JSON file
- `get_scene_stats()` - Scene statistics

**Performance Targets:**
- Processing time: < 5 seconds
- File size: < 10 MB
- Vertex count: < 500k

#### 5. `cli.py` - Command-Line Interface

**Purpose:** User-facing CLI for hologram generation

**Features:**
- Argument parsing (argparse)
- Input/output validation
- Progress logging (loguru)
- Statistics display
- Error handling

**Usage:**
```bash
python -m hologram_generator -i data.json -o output.glb --verbose --stats
```

#### 6. `utils.py` - Utilities

**Purpose:** Helper functions

**Functions:**
- `normalize_rgb()` - RGB 0-255 → 0-1
- `calculate_distance_3d()` - Euclidean distance
- `interpolate_points()` - Linear interpolation
- `validate_json_file()` - JSON syntax check
- `format_file_size()` - Human-readable sizes

#### 7. `exceptions.py` - Custom Exceptions

**Exception Hierarchy:**
```
Exception
└── HologramGenerationError (base)
    ├── InvalidDetectionDataError
    ├── CoordinateOutOfBoundsError
    ├── MeshGenerationError
    └── GLBExportError
```

---

## Data Flow

### 1. Input Processing

```
JSON File
    ↓
json.load()
    ↓
Python Dict
    ↓
Pydantic Validation (DetectionData(**data))
    ↓
Validated DetectionData Object
```

### 2. Scene Generation

```
DetectionData
    ↓
┌─────────────────────────────────┐
│ For each scene element:         │
│   1. Extract data (fire, smoke) │
│   2. Select material            │
│   3. Generate mesh              │
│   4. Add to scene               │
└─────────────────────────────────┘
    ↓
trimesh.Scene (collection of meshes)
```

### 3. Export

```
trimesh.Scene
    ↓
scene.export(file_type='glb')
    ↓
Binary glTF 2.0 (GLB)
    ↓
Write to disk
```

---

## Design Patterns

### 1. Factory Pattern

**MeshGenerators** acts as a factory for creating different mesh types:

```python
class MeshGenerators:
    @staticmethod
    def create_fire_source(...) -> trimesh.Trimesh:
        # Factory method for fire meshes
        
    @staticmethod
    def create_person_capsule(...) -> trimesh.Trimesh:
        # Factory method for person meshes
```

### 2. Builder Pattern

**HologramGenerator** builds scenes incrementally:

```python
def generate(self):
    self._initialize_scene()
    self._generate_room_geometry()
    self._generate_fire_geometry()
    # ... build step by step
    return self._export_glb()
```

### 3. Validation Pattern

**Pydantic models** enforce validation at the data boundary:

```python
@field_validator('persons')
def validate_person_coordinates(cls, persons, info):
    # Validate before processing
    pass
```

---

## Performance Considerations

### Optimization Strategies

1. **Mesh Simplification**
   - Use icospheres with minimal subdivisions
   - Combine same-material meshes
   - Remove duplicate vertices

2. **Memory Management**
   - Process one mesh at a time
   - Clear intermediate data structures
   - Use numpy arrays (efficient)

3. **File Size Reduction**
   - Quantize vertex positions
   - Compress material data
   - Share materials across meshes

### Bottlenecks

| Operation | Time | Optimization |
|-----------|------|--------------|
| Mesh generation | 40% | Use primitive shapes |
| Material assignment | 10% | Reuse materials |
| GLB export | 30% | Optimize scene graph |
| Validation | 20% | Cache validation results |

---

## Extension Points

### Adding New Mesh Types

1. **Create generator function:**
```python
# In mesh_generators.py
@staticmethod
def create_new_element(data, material):
    # Generate mesh
    return mesh
```

2. **Add to pipeline:**
```python
# In hologram_generator.py
def _generate_new_elements(self):
    for elem in self.detection_data.new_elements:
        mesh = MeshGenerators.create_new_element(elem, material)
        self.scene.add_geometry(mesh, node_name=f"new_{elem.id}")
```

3. **Define material:**
```python
# In materials.py
NEW_ELEMENT = GLBMaterial(
    name="new_element",
    base_color_rgb=(R, G, B),
    # ...
)
```

### Adding New Materials

```python
# In materials.py
class MaterialLibrary:
    NEW_MATERIAL = GLBMaterial(
        name="new_mat",
        base_color_rgb=(255, 128, 0),
        alpha=0.8,
        emissive_rgb=(200, 100, 0),
        emissive_strength=1.0,
        metallic=0.5,
        roughness=0.3
    )
```

### Custom Validation Rules

```python
# In models.py
@field_validator('custom_field')
def validate_custom(cls, value):
    if not meets_criteria(value):
        raise ValueError("Validation failed")
    return value
```

---

## Testing Strategy

### Unit Tests

**test_models.py:**
- Data validation
- Boundary conditions
- Error cases

**test_materials.py:**
- Material creation
- Color conversion
- Dynamic materials

**test_mesh_generators.py:**
- Mesh generation
- Dimensions validation
- Position verification

### Integration Tests

**test_integration.py:**
- End-to-end pipeline
- File I/O
- GLB format validation

### Test Execution

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=hologram_generator --cov-report=html

# Run specific test file
pytest tests/test_models.py -v
```

---

## Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| trimesh | ≥4.0.0 | 3D mesh manipulation |
| numpy | ≥1.21.0 | Numerical operations |
| pydantic | ≥2.0.0 | Data validation |
| loguru | ≥0.6.0 | Logging |

### Optional Dependencies

| Package | Purpose |
|---------|---------|
| pyvista | Advanced visualization |
| meshio | Additional mesh formats |
| scipy | Scientific computing |

---

## Security Considerations

### Input Validation

1. **File Size Limits:** Reject JSON > 10 MB
2. **Coordinate Bounds:** Enforce room boundaries
3. **Confidence Ranges:** Validate 0-1 range
4. **String Sanitization:** Validate incident IDs

### Error Handling

- Never expose internal paths in errors
- Log sensitive operations
- Validate file permissions
- Handle malformed JSON safely

---

## Future Enhancements

### Planned Features

1. **Real-time Updates:** Incremental GLB updates
2. **Animation:** Time-based fire spread animation
3. **LOD (Level of Detail):** Multiple quality levels
4. **Texture Mapping:** Custom textures for materials
5. **Lighting:** Dynamic light sources from fire
6. **Camera Paths:** Predefined camera animations

### API Evolution

- RESTful API endpoint
- WebSocket streaming
- Cloud deployment (AWS Lambda)
- Docker containerization

---

## Contributing Guidelines

### Code Style

- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions < 50 lines

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Run full test suite
5. Submit PR with description

---

## License

MIT License - See LICENSE file for details.

## Contact

For architecture questions or contributions:
- GitHub Issues: [Project Issues]
- Documentation: [README.md](README.md)
- Usage Guide: [USAGE.md](USAGE.md)
