# Installation Guide

Complete installation instructions for the 3D Fire Detection Hologram Generator.

## System Requirements

### Minimum Requirements
- **OS:** Windows 10/11, Linux (Ubuntu 20.04+), macOS 10.15+
- **Python:** 3.9 or higher
- **RAM:** 4 GB
- **Storage:** 500 MB free space
- **CPU:** Any modern dual-core processor

### Recommended Requirements
- **RAM:** 8 GB or more
- **CPU:** Quad-core processor
- **Storage:** 1 GB free space for outputs

## Installation Steps

### 1. Install Python

#### Windows
Download from [python.org](https://www.python.org/downloads/) and install.

Verify installation:
```powershell
python --version
```

#### Linux/Ubuntu
```bash
sudo apt update
sudo apt install python3.9 python3-pip python3-venv
python3 --version
```

#### macOS
```bash
brew install python@3.9
python3 --version
```

### 2. Clone or Download Project

```bash
cd s:\Programming\sih_2026
# Project is already in hologram_generator/
cd hologram_generator
```

### 3. Create Virtual Environment

#### Windows PowerShell
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### Linux/Mac
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- trimesh (3D mesh processing)
- numpy (numerical operations)
- pydantic (data validation)
- pyvista (mesh visualization)
- loguru (logging)
- pytest (testing framework)
- And other dependencies

Installation time: ~2-5 minutes depending on internet speed.

### 5. Verify Installation

```bash
python -m hologram_generator --version
```

Expected output:
```
Hologram Generator v1.0.0
```

### 6. Run Tests (Optional)

```bash
pytest tests/ -v
```

All tests should pass (may take 30-60 seconds).

### 7. Generate Test Hologram

```bash
python -m hologram_generator \
  -i examples/detection_data_minimal.json \
  -o test_hologram.glb \
  --verbose --stats
```

Expected output:
```
INFO     | Validating input file...
INFO     | Input file: examples\detection_data_minimal.json
INFO     | Initializing hologram generator...
INFO     | Starting hologram generation...
INFO     | Hologram generation completed in 2.34s
INFO     | Output: test_hologram.glb

============================================================
SCENE STATISTICS
============================================================
Incident ID:      INC_2025_08_30_MIN
Timestamp:        2025-08-30T10:15:30+00:00
Mesh Count:       8
Total Vertices:   4,523
Total Faces:      2,891
============================================================

✓ Hologram generated successfully: test_hologram.glb
INFO     | File size: 1.23 MB
```

## Troubleshooting Installation

### Issue: "pip: command not found"

**Solution:**
```bash
# Windows
python -m pip install --upgrade pip

# Linux/Mac
python3 -m pip install --upgrade pip
```

### Issue: "Permission denied" errors

**Solution:**
```bash
# Use user installation
pip install --user -r requirements.txt
```

### Issue: "Microsoft Visual C++ 14.0 required" (Windows)

**Solution:**
Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Issue: NumPy installation fails

**Solution:**
```bash
# Install precompiled wheels
pip install --upgrade pip setuptools wheel
pip install numpy --only-binary :all:
pip install -r requirements.txt
```

### Issue: trimesh installation fails

**Solution:**
```bash
# Install core trimesh first
pip install trimesh
# Then install extras
pip install trimesh[easy]
```

### Issue: Pydantic v2 compatibility

**Solution:**
Ensure Pydantic >= 2.0.0:
```bash
pip install "pydantic>=2.0.0"
```

## Platform-Specific Notes

### Windows
- PowerShell execution policy may need adjustment:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Linux
- May need to install development headers:
  ```bash
  sudo apt install python3-dev build-essential
  ```

### macOS
- Xcode Command Line Tools required:
  ```bash
  xcode-select --install
  ```

## Docker Installation (Alternative)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENTRYPOINT ["python", "-m", "hologram_generator"]
```

Build and run:
```bash
docker build -t hologram-generator .
docker run -v $(pwd)/data:/data hologram-generator \
  -i /data/detection.json -o /data/hologram.glb
```

## Upgrading

To upgrade to a new version:

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Pull latest changes (if using git)
git pull

# Upgrade dependencies
pip install --upgrade -r requirements.txt

# Verify
python -m hologram_generator --version
```

## Uninstallation

```bash
# Deactivate virtual environment
deactivate

# Remove virtual environment
rm -rf venv  # or rmdir /s venv on Windows

# Remove package (if installed globally)
pip uninstall hologram-generator
```

## Next Steps

1. Read [USAGE.md](USAGE.md) for usage instructions
2. Try the example files in `examples/`
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
4. Integrate with your fire detection system

## Support

If you encounter issues not covered here:
1. Check [USAGE.md](USAGE.md#troubleshooting) troubleshooting section
2. Run with `--verbose` flag for detailed logs
3. Run tests to identify issues: `pytest tests/ -v`
4. Check dependency versions: `pip list`

## Dependency List

| Package | Version | Purpose |
|---------|---------|---------|
| trimesh | ≥4.0.0 | 3D mesh generation and manipulation |
| numpy | ≥1.21.0 | Numerical computations |
| pydantic | ≥2.0.0 | Data validation and parsing |
| pydantic-settings | ≥2.0.0 | Settings management |
| pyvista | ≥0.43.0 | Advanced mesh operations |
| meshio | ≥5.3.0 | Multi-format mesh I/O |
| shapely | ≥2.0.0 | Geometric operations |
| transforms3d | ≥0.4.1 | 3D transformations |
| scipy | ≥1.7.0 | Scientific computing |
| Pillow | ≥9.0.0 | Image processing (optional) |
| loguru | ≥0.6.0 | Logging framework |
| pytest | ≥7.0.0 | Testing framework |
| pytest-cov | ≥4.0.0 | Test coverage |
| pygltflib | ≥1.16.0 | GLB export utilities |
