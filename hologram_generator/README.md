# 3D Fire Detection Hologram Generator

Procedural GLB Model Generation from Real-Time Detection Data

## Overview

This system generates interactive 3D hologram scenes (GLB format) from fire detection AI outputs. It takes structured detection data (coordinates, object types, states) and produces operator-ready visualizations for emergency response decision-making.

**Target Users:** Fire department commanders, building emergency coordinators  
**Use Case:** Real-time situational awareness during active fire incidents  
**Deployment:** Edge server or workstation (latency < 5 seconds)

## Features

- ✅ Real-time GLB generation from JSON detection data
- ✅ Support for fire sources, smoke plumes, persons, and furniture
- ✅ PBR (Physically-Based Rendering) materials with emissive effects
- ✅ Motion trails for moving persons
- ✅ Room geometry with reference grid
- ✅ Coordinate validation and bounds checking
- ✅ < 5 second processing time
- ✅ < 10 MB output file size
- ✅ Comprehensive test suite with >80% coverage

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -m hologram_generator --version
```

## Quick Start

### CLI Usage

```bash
# Basic generation
python -m hologram_generator -i examples/detection_data_minimal.json -o hologram.glb

# With verbose output and statistics
python -m hologram_generator -i examples/detection_data_full.json -o hologram.glb --verbose --stats
```

### Python API

```python
from hologram_generator import HologramGenerator

# Generate from JSON file
generator = HologramGenerator(verbose=True)
glb_path = generator.generate_from_json(
    "examples/detection_data_full.json",
    output_path="hologram.glb"
)

# Access statistics
stats = generator.get_scene_stats()
print(f"Generated {stats['mesh_count']} meshes")
print(f"Total vertices: {stats['total_vertices']:,}")
```

## Example Output

Input: `detection_data_full.json` (fire incident with 2 persons, 3 furniture items)

Output: `hologram.glb` (~3.2 MB, 125k vertices)
- Room: Blue wireframe (5m × 4m × 3m)
- Fire: Red emissive sphere at source + 3 orange spread points
- Smoke: Semi-transparent gray volume (1.8m radius, 65% density)
- Persons: Yellow capsule (stationary) + Cyan capsule (moving with trail)
- Furniture: Steel blue boxes (bed, cabinet, table)
- Ventilation: 1 door, 2 windows
- Reference grid: 1m spacing at floor level

View online: https://gltf-viewer.donmccurdy.com/

## Project Structure

```
hologram_generator/
├── __init__.py              # Package exports
├── models.py                # Pydantic data models
├── materials.py             # PBR material library
├── mesh_generators.py       # 3D geometry generation
├── hologram_generator.py    # Main generator class
├── cli.py                   # Command-line interface
├── exceptions.py            # Custom exceptions
├── utils.py                 # Helper functions
├── requirements.txt         # Dependencies
├── pytest.ini              # Test configuration
├── examples/               # Example detection data
│   ├── detection_data_minimal.json
│   ├── detection_data_full.json
│   ├── detection_data_complex.json
│   └── README.md
├── tests/                  # Unit & integration tests
│   ├── test_models.py
│   ├── test_materials.py
│   ├── test_mesh_generators.py
│   └── test_integration.py
├── README.md               # This file
├── USAGE.md               # Detailed usage guide
└── ARCHITECTURE.md        # Technical architecture

Generated output:
hologram_{incident_id}_{timestamp}.glb
```

## Documentation

- **[USAGE.md](USAGE.md)** - Complete usage guide with examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture for developers
- **[examples/README.md](examples/README.md)** - Example data files guide

## Requirements

- **Python:** 3.9 or higher
- **Memory:** 4 GB RAM minimum (8 GB recommended)
- **Disk:** 500 MB for dependencies
- **GPU:** Not required (CPU sufficient)

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=hologram_generator --cov-report=html

# Run specific test suite
pytest tests/test_integration.py -v
```

## Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Processing Time | < 5s | 2-3s |
| File Size | < 10 MB | 2-5 MB |
| Vertex Count | < 500k | 50-200k |
| Mesh Count | - | 8-15 |

Tested on: Intel i5, 8GB RAM, Python 3.11

## Viewing Generated Files

**Online Viewers:**
- https://gltf-viewer.donmccurdy.com/
- https://sandbox.babylonjs.com/
- https://threejs.org/editor/

**Desktop Applications:**
- Blender (Import > glTF 2.0)
- Windows 3D Viewer
- Microsoft Mixed Reality Viewer

**Web Frameworks:**
- Three.js GLTFLoader
- Babylon.js SceneLoader
- A-Frame glTF model

## Troubleshooting

### Common Issues

1. **"CoordinateOutOfBoundsError"**
   - Ensure all coordinates are within room dimensions
   - Check x ≤ width_m, y ≤ depth_m, z ≤ height_m

2. **"InvalidDetectionDataError"**
   - Validate JSON syntax at jsonlint.com
   - Ensure all required fields are present
   - Check confidence/density values are 0-1

3. **Large file size**
   - Reduce fire spread points
   - Simplify motion trails
   - Lower grid resolution

See [USAGE.md](USAGE.md#troubleshooting) for detailed troubleshooting.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass: `pytest tests/`
5. Update documentation
6. Submit a pull request

See [ARCHITECTURE.md](ARCHITECTURE.md) for technical details.

## License

MIT License

Copyright (c) 2025 AtmaRakshak Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- Built with [trimesh](https://trimesh.org/) for 3D mesh processing
- Data validation with [Pydantic](https://docs.pydantic.dev/)
- glTF 2.0 specification by [Khronos Group](https://www.khronos.org/gltf/)

## Support

- **Issues:** Report bugs or request features via GitHub Issues
- **Documentation:** See USAGE.md and ARCHITECTURE.md
- **Examples:** Check examples/ directory for sample data
