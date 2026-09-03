# Frame Rate Configuration Guide

## Overview
This document explains how to configure the frame extraction rate (frames per second) for the fire detection system.

## Current Configuration

**Frame Rate: 5.0 FPS** (Maximum allowed rate)

This means the system will extract **5 frames every second** during a fire incident detection window.

## Configuration Options

### Frame Rate Range
- **Minimum**: 2.0 FPS (2 frames per second)
- **Maximum**: 5.0 FPS (5 frames per second)
- **Default**: 5.0 FPS (updated from 3.0 FPS)

### What This Means
- **At 5.0 FPS**: Extracts 5 frames every second = 150 frames in 30 seconds
- **At 3.0 FPS**: Extracts 3 frames every second = 90 frames in 30 seconds
- **At 2.0 FPS**: Extracts 2 frames every second = 60 frames in 30 seconds

## How to Change Frame Rate

### Method 1: Environment Variable (Recommended)

Edit the `.env` file in the `backend` directory:

```env
FRAME_SAMPLE_RATE=5.0  # Change this value (2.0 - 5.0)
```

### Method 2: Direct Code Configuration

Edit the detection scripts:

**File: `backend/models/run_fire_human_only.py`**
```python
frame_extractor = FrameExtractor(sample_rate=5.0, window_duration=30)
```

**File: `backend/models/run_fire_human_objects_hologram.py`**
```python
frame_extractor = FrameExtractor(sample_rate=5.0, window_duration=30)
```

### Method 3: Default Configuration

Edit the default in the config file:

**File: `backend/frame_extraction/config.py`**
```python
SAMPLE_RATE = float(os.getenv('FRAME_SAMPLE_RATE', '5.0'))
```

## Configuration Files Updated

The following files have been updated to use **5.0 FPS**:

1. ✅ `backend/.env` - Set to 5.0
2. ✅ `backend/.env.example` - Updated default to 5.0
3. ✅ `backend/frame_extraction/config.py` - Default changed to 5.0
4. ✅ `backend/models/run_fire_human_only.py` - Hardcoded to 5.0
5. ✅ `backend/models/run_fire_human_objects_hologram.py` - Hardcoded to 5.0

## Related Configuration

### Window Duration
The extraction window duration controls how long the system captures frames after fire detection:

```env
FRAME_WINDOW_DURATION=30  # 30-60 seconds allowed
```

### Frame Selection
After extraction, the system selects the best frames:

```env
FRAME_MIN_SELECTION=6   # Minimum frames to keep
FRAME_MAX_SELECTION=15  # Maximum frames to keep
```

## Calculations

### Total Frames Extracted
```
Total Frames = SAMPLE_RATE × WINDOW_DURATION
```

**Examples:**
- 5.0 FPS × 30 seconds = **150 frames** extracted
- 5.0 FPS × 60 seconds = **300 frames** extracted
- 3.0 FPS × 30 seconds = **90 frames** extracted

### Frame Interval
```
Interval = 1 / SAMPLE_RATE seconds
```

**Examples:**
- 5.0 FPS = Extract every **0.2 seconds**
- 3.0 FPS = Extract every **0.33 seconds**
- 2.0 FPS = Extract every **0.5 seconds**

## Performance Considerations

### Higher Frame Rate (5.0 FPS)
**Advantages:**
- ✅ More detailed temporal analysis
- ✅ Better fire progression tracking
- ✅ Less likely to miss critical moments
- ✅ Smoother evidence footage

**Disadvantages:**
- ⚠️ More storage space required
- ⚠️ Slightly higher CPU usage
- ⚠️ More frames to process during selection

### Lower Frame Rate (2.0-3.0 FPS)
**Advantages:**
- ✅ Less storage space
- ✅ Lower CPU usage
- ✅ Faster processing

**Disadvantages:**
- ⚠️ Might miss rapid fire development
- ⚠️ Less temporal detail

## Recommended Settings

### High Accuracy Mode (Current)
```env
FRAME_SAMPLE_RATE=5.0
FRAME_WINDOW_DURATION=30
```
- Best for critical applications
- Maximum detail capture
- Recommended for production use

### Balanced Mode
```env
FRAME_SAMPLE_RATE=3.0
FRAME_WINDOW_DURATION=30
```
- Good balance of quality and performance
- Suitable for most scenarios

### Low Resource Mode
```env
FRAME_SAMPLE_RATE=2.0
FRAME_WINDOW_DURATION=30
```
- Minimal storage and CPU usage
- Still captures sufficient evidence

## Testing the Changes

After modifying the frame rate:

1. **Restart the detection system**:
   ```bash
   # Stop the current process (Ctrl+C)
   # Then restart:
   cd backend/models
   python run_fire_human_objects_hologram.py
   ```

2. **Verify the configuration**:
   - Check the console output on startup
   - Look for: "FrameExtractor initialized: sample_rate=5.0 FPS"

3. **Test with a fire video**:
   - Run detection on a test video
   - Check the `data/fire_incidents` folder
   - Count the frames extracted (should be ~150 for 30 seconds at 5.0 FPS)

## Storage Impact

### Frame Storage Calculation
```
Storage per Incident = Frames × Average File Size
```

**Example with JPEG Quality 90%:**
- Average frame size: ~100-300 KB
- At 5.0 FPS × 30s = 150 frames
- Storage: **15-45 MB per incident**

After selection (6-15 frames kept):
- Storage: **0.6-4.5 MB per incident**

## Troubleshooting

### Issue: Too Many Frames
**Solution**: Reduce `FRAME_SAMPLE_RATE` or `FRAME_WINDOW_DURATION`

### Issue: Missing Important Moments
**Solution**: Increase `FRAME_SAMPLE_RATE` to maximum (5.0)

### Issue: Configuration Not Applied
**Solution**: 
1. Check `.env` file is in the correct location (`backend/.env`)
2. Restart the detection process completely
3. Verify with console output logs

## Technical Details

### Implementation
The frame rate is enforced in `backend/frame_extraction/extractor.py`:

```python
def _should_extract_frame(self, timestamp: float) -> bool:
    """Check if enough time has elapsed since last extraction."""
    if self.last_extraction_time is None:
        return True
    
    frame_interval = 1.0 / self.sample_rate  # e.g., 0.2s at 5.0 FPS
    elapsed = timestamp - self.last_extraction_time
    return elapsed >= frame_interval
```

### Validation
All frame rate values are validated on startup:

```python
assert 2.0 <= sample_rate <= 5.0, "Sample rate must be between 2.0 and 5.0 FPS"
```

Invalid values will cause the system to fail immediately with a clear error message.

## Summary

✅ **Frame rate increased from 3.0 FPS to 5.0 FPS**
✅ **Configuration updated in all relevant files**
✅ **System now captures maximum temporal detail**
✅ **150 frames per 30-second incident window**

The system is now configured for maximum frame capture rate, providing the most detailed temporal analysis possible while staying within the designed performance constraints.
