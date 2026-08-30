# Frame Extraction Configuration

## Overview

The `config.py` module provides centralized configuration management for the fire frame extraction feature. It loads settings from environment variables with sensible defaults and validates all values on import to fail fast if misconfigured.

## Configuration Parameters

### Extraction Settings

| Parameter | Environment Variable | Default | Valid Range | Description |
|-----------|---------------------|---------|-------------|-------------|
| `SAMPLE_RATE` | `FRAME_SAMPLE_RATE` | `3.0` | `2.0 - 5.0` | Frames per second to extract during fire detection |
| `WINDOW_DURATION` | `FRAME_WINDOW_DURATION` | `30` | `30 - 60` | Extraction window duration in seconds |

### Selection Settings

| Parameter | Environment Variable | Default | Valid Range | Description |
|-----------|---------------------|---------|-------------|-------------|
| `MIN_FRAMES` | `FRAME_MIN_SELECTION` | `6` | `6+` | Minimum number of frames to select per incident |
| `MAX_FRAMES` | `FRAME_MAX_SELECTION` | `15` | `≤ 15` | Maximum number of frames to select per incident |
| `SIMILARITY_THRESHOLD` | `FRAME_SIMILARITY_THRESHOLD` | `0.85` | `0.0 - 1.0` | SSIM threshold for considering frames similar |

### Storage Settings

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `STORAGE_PATH` | `FRAME_STORAGE_PATH` | `data/fire_incidents` | Root directory for storing fire incident frames |
| `IMAGE_QUALITY` | `FRAME_IMAGE_QUALITY` | `90` | JPEG image quality percentage (1-100) |

## Usage

### Using Default Configuration

```python
from frame_extraction.config import FrameExtractionConfig

# Access configuration values
sample_rate = FrameExtractionConfig.SAMPLE_RATE  # 3.0 FPS
window_duration = FrameExtractionConfig.WINDOW_DURATION  # 30 seconds

# Print configuration summary
print(FrameExtractionConfig.get_summary())
```

### Using Custom Configuration

Set environment variables before importing the module:

```bash
# Linux/Mac
export FRAME_SAMPLE_RATE=4.5
export FRAME_WINDOW_DURATION=45
export FRAME_MIN_SELECTION=8
export FRAME_MAX_SELECTION=12

# Windows PowerShell
$env:FRAME_SAMPLE_RATE = "4.5"
$env:FRAME_WINDOW_DURATION = "45"
$env:FRAME_MIN_SELECTION = "8"
$env:FRAME_MAX_SELECTION = "12"
```

Then import the module:

```python
from frame_extraction.config import FrameExtractionConfig

# Configuration will use your custom values
print(FrameExtractionConfig.get_summary())
```

### Using `.env` File

Create a `.env` file in your backend directory:

```env
FRAME_SAMPLE_RATE=4.5
FRAME_WINDOW_DURATION=45
FRAME_MIN_SELECTION=8
FRAME_MAX_SELECTION=12
FRAME_SIMILARITY_THRESHOLD=0.90
FRAME_STORAGE_PATH=data/fire_incidents
FRAME_IMAGE_QUALITY=85
```

Load environment variables with `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()

from frame_extraction.config import FrameExtractionConfig
print(FrameExtractionConfig.get_summary())
```

## Validation

The configuration module automatically validates all parameters on import. If any value is outside its valid range, an `AssertionError` is raised with a descriptive error message.

### Example: Invalid Configuration

```python
import os
os.environ['FRAME_SAMPLE_RATE'] = '10.0'  # Invalid: > 5.0

from frame_extraction.config import FrameExtractionConfig
# AssertionError: SAMPLE_RATE must be between 2.0 and 5.0 FPS, got 10.0
```

## Requirements Coverage

This configuration module satisfies the following requirements from the design document:

- **Requirement 1.2**: Sample rate configuration (2-5 FPS)
- **Requirement 1.5**: Window duration configuration (30-60 seconds)
- **Requirement 2.5**: Frame selection bounds (6-15 frames)

## Testing

A comprehensive test suite is provided in `test_config.py`. Run it to verify configuration functionality:

```bash
cd backend/frame_extraction
python test_config.py
```

The test suite covers:
1. Default configuration loading
2. Invalid sample rate rejection
3. Invalid window duration rejection
4. Invalid frame selection bounds rejection
5. Custom configuration loading
6. Edge case validation (minimum and maximum valid values)

## API Reference

### `FrameExtractionConfig`

Configuration class for frame extraction system.

#### Class Attributes

- `SAMPLE_RATE: float` - Frames per second to extract (2.0 - 5.0 FPS)
- `WINDOW_DURATION: int` - Extraction window in seconds (30 - 60)
- `MIN_FRAMES: int` - Minimum frames to select per incident (6+)
- `MAX_FRAMES: int` - Maximum frames to select per incident (≤ 15)
- `SIMILARITY_THRESHOLD: float` - SSIM threshold for similarity (0.0 - 1.0)
- `STORAGE_PATH: Path` - Root directory for frame storage
- `IMAGE_QUALITY: int` - JPEG quality percentage (1 - 100)

#### Class Methods

##### `validate()`

Validates all configuration values against their constraints. Called automatically on module import.

**Raises:**
- `AssertionError` - If any configuration value is outside valid range

##### `get_summary()`

Returns a human-readable summary of current configuration.

**Returns:**
- `str` - Formatted configuration summary

## Examples

### Example 1: Production Configuration

```bash
# High-quality extraction with longer window
export FRAME_SAMPLE_RATE=5.0
export FRAME_WINDOW_DURATION=60
export FRAME_MAX_SELECTION=15
export FRAME_IMAGE_QUALITY=95
```

### Example 2: Low-Resource Configuration

```bash
# Fewer frames, shorter window for limited resources
export FRAME_SAMPLE_RATE=2.0
export FRAME_WINDOW_DURATION=30
export FRAME_MIN_SELECTION=6
export FRAME_MAX_SELECTION=8
export FRAME_IMAGE_QUALITY=80
```

### Example 3: Testing Configuration

```bash
# Fast extraction for testing
export FRAME_SAMPLE_RATE=3.0
export FRAME_WINDOW_DURATION=30
export FRAME_MIN_SELECTION=6
export FRAME_MAX_SELECTION=10
```

## Troubleshooting

### Issue: Configuration not loading custom values

**Solution**: Ensure environment variables are set **before** importing the module. If the module is already imported, you need to reload it or restart your Python interpreter.

### Issue: AssertionError on import

**Solution**: Check that all environment variables are within valid ranges. Read the error message for the specific parameter that failed validation.

### Issue: Path object instead of string

**Solution**: `STORAGE_PATH` is a `pathlib.Path` object. Convert to string if needed:

```python
storage_path_str = str(FrameExtractionConfig.STORAGE_PATH)
```

## Best Practices

1. **Use `.env` files** for development to keep configuration separate from code
2. **Validate early** - Let the module validation catch errors at startup rather than during runtime
3. **Document custom values** - If you override defaults, document why in your deployment notes
4. **Test configuration changes** - Run `test_config.py` after modifying environment variables
5. **Use defaults for production** - The defaults are tuned for typical fire detection scenarios

## Version History

- **v1.0.0** - Initial implementation with environment variable support and validation
