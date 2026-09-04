"""
Unit tests for Frame and BBox data classes
"""

import numpy as np
import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from frame_extraction.extractor import Frame, BBox


def test_bbox_creation():
    """Test BBox data class initialization."""
    bbox = BBox(x=100, y=50, width=200, height=150, confidence=0.87)
    
    assert bbox.x == 100
    assert bbox.y == 50
    assert bbox.width == 200
    assert bbox.height == 150
    assert bbox.confidence == 0.87


def test_bbox_to_dict():
    """Test BBox conversion to dictionary."""
    bbox = BBox(x=100, y=50, width=200, height=150, confidence=0.87)
    bbox_dict = bbox.to_dict()
    
    assert bbox_dict == {
        'x': 100,
        'y': 50,
        'width': 200,
        'height': 150,
        'confidence': 0.87
    }


def test_frame_creation():
    """Test Frame data class initialization."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    bbox = BBox(x=100, y=50, width=200, height=150, confidence=0.87)
    
    frame = Frame(
        image=image,
        timestamp=1705330822.543,
        confidence=0.87,
        bounding_boxes=[bbox],
        frame_index=0
    )
    
    assert frame.timestamp == 1705330822.543
    assert frame.confidence == 0.87
    assert len(frame.bounding_boxes) == 1
    assert frame.frame_index == 0
    assert frame.image.shape == (480, 640, 3)


def test_frame_metadata_dict():
    """Test Frame metadata dictionary generation."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    bbox = BBox(x=100, y=50, width=200, height=150, confidence=0.87)
    
    frame = Frame(
        image=image,
        timestamp=1705330822.543,
        confidence=0.87,
        bounding_boxes=[bbox],
        frame_index=0
    )
    
    metadata = frame.get_metadata_dict()
    
    assert metadata['frame_index'] == 0
    assert metadata['timestamp'] == 1705330822.543
    assert metadata['confidence'] == 0.87
    assert len(metadata['bounding_boxes']) == 1
    assert metadata['bounding_boxes'][0]['x'] == 100


def test_frame_validation_invalid_confidence():
    """Test Frame validation rejects invalid confidence values."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    with pytest.raises(ValueError, match="Confidence must be between 0.0 and 1.0"):
        Frame(
            image=image,
            timestamp=1705330822.543,
            confidence=1.5,  # Invalid: > 1.0
            bounding_boxes=[],
            frame_index=0
        )


def test_frame_validation_negative_timestamp():
    """Test Frame validation rejects negative timestamps."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    with pytest.raises(ValueError, match="Timestamp must be non-negative"):
        Frame(
            image=image,
            timestamp=-100.0,  # Invalid: negative
            confidence=0.87,
            bounding_boxes=[],
            frame_index=0
        )


def test_frame_validation_negative_frame_index():
    """Test Frame validation rejects negative frame index."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    with pytest.raises(ValueError, match="Frame index must be non-negative"):
        Frame(
            image=image,
            timestamp=1705330822.543,
            confidence=0.87,
            bounding_boxes=[],
            frame_index=-1  # Invalid: negative
        )


def test_frame_validation_invalid_image_type():
    """Test Frame validation rejects non-numpy array images."""
    with pytest.raises(TypeError, match="Image must be numpy ndarray"):
        Frame(
            image=[1, 2, 3],  # Invalid: list instead of ndarray
            timestamp=1705330822.543,
            confidence=0.87,
            bounding_boxes=[],
            frame_index=0
        )


def test_frame_with_multiple_bboxes():
    """Test Frame with multiple bounding boxes."""
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    bbox1 = BBox(x=100, y=50, width=200, height=150, confidence=0.87)
    bbox2 = BBox(x=300, y=200, width=150, height=100, confidence=0.92)
    
    frame = Frame(
        image=image,
        timestamp=1705330822.543,
        confidence=0.87,
        bounding_boxes=[bbox1, bbox2],
        frame_index=0
    )
    
    assert len(frame.bounding_boxes) == 2
    metadata = frame.get_metadata_dict()
    assert len(metadata['bounding_boxes']) == 2
    assert metadata['bounding_boxes'][0]['x'] == 100
    assert metadata['bounding_boxes'][1]['x'] == 300


if __name__ == '__main__':
    pytest.main([__file__, '-v'])


# ===== Tests for FrameExtractor class methods =====

from frame_extraction.extractor import FrameExtractor
import time


def test_extract_frame_basic():
    """Test basic frame extraction functionality."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    # Start extraction window
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Create test frame
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    timestamp = time.time()
    confidence = 0.87
    bboxes = [{'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.87}]
    
    # Extract frame
    extractor.extract_frame(test_frame, timestamp, confidence, bboxes)
    
    # Verify frame was extracted
    assert len(extractor.extracted_frames) == 1
    assert extractor.extracted_frames[0].confidence == 0.87
    assert extractor.extracted_frames[0].timestamp == timestamp
    assert extractor.current_frame_index == 1
    assert extractor.last_extract_time == timestamp


def test_extract_frame_multiple():
    """Test extracting multiple frames."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Extract 3 frames
    for i in range(3):
        test_frame = np.ones((480, 640, 3), dtype=np.uint8) * i
        timestamp = time.time() + i
        confidence = 0.8 + (i * 0.05)
        bboxes = [{'x': 100 + i*10, 'y': 50, 'width': 200, 'height': 150, 'confidence': confidence}]
        
        extractor.extract_frame(test_frame, timestamp, confidence, bboxes)
    
    # Verify all frames extracted
    assert len(extractor.extracted_frames) == 3
    assert extractor.current_frame_index == 3
    assert abs(extractor.extracted_frames[0].confidence - 0.8) < 0.001
    assert abs(extractor.extracted_frames[1].confidence - 0.85) < 0.001
    assert abs(extractor.extracted_frames[2].confidence - 0.9) < 0.001


def test_extract_frame_invalid_confidence():
    """Test extract_frame handles invalid confidence values."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    timestamp = time.time()
    
    # Test confidence > 1.0 (should be clamped to 1.0)
    extractor.extract_frame(test_frame, timestamp, 1.5, [])
    assert len(extractor.extracted_frames) == 1
    assert extractor.extracted_frames[0].confidence == 1.0
    
    # Test confidence < 0.0 (should be clamped to 0.0)
    extractor.extract_frame(test_frame, timestamp + 1, -0.5, [])
    assert len(extractor.extracted_frames) == 2
    assert extractor.extracted_frames[1].confidence == 0.0


def test_extract_frame_invalid_frame_type():
    """Test extract_frame handles invalid frame type gracefully."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Pass invalid frame type (list instead of ndarray)
    extractor.extract_frame([1, 2, 3], time.time(), 0.87, [])
    
    # Should not crash, but should not extract frame
    assert len(extractor.extracted_frames) == 0


def test_extract_frame_invalid_timestamp():
    """Test extract_frame handles negative timestamps."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Pass negative timestamp (should use current time)
    extractor.extract_frame(test_frame, -100.0, 0.87, [])
    
    # Frame should be extracted with corrected timestamp
    assert len(extractor.extracted_frames) == 1
    assert extractor.extracted_frames[0].timestamp > 0


def test_extract_frame_malformed_bboxes():
    """Test extract_frame handles malformed bounding boxes."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    timestamp = time.time()
    
    # Mix of valid and invalid bboxes
    bboxes = [
        {'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.87},  # Valid
        {'x': 'invalid', 'y': 50, 'width': 200, 'height': 150},  # Invalid x - will be skipped
        {'x': 200, 'y': 100, 'width': 100, 'height': 80, 'confidence': 0.75}  # Valid
    ]
    
    extractor.extract_frame(test_frame, timestamp, 0.87, bboxes)
    
    # Frame should be extracted, but only valid bboxes parsed
    assert len(extractor.extracted_frames) == 1
    # Should have 2 valid bboxes (invalid x bbox skipped)
    # Note: empty dict {} would create bbox with default 0 values, which is valid
    assert len(extractor.extracted_frames[0].bounding_boxes) == 2


def test_check_window_complete_not_started():
    """Test check_window_complete returns False when extraction not active."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    # Extraction not started
    assert extractor.check_window_complete(time.time()) == False


def test_check_window_complete_in_progress():
    """Test check_window_complete returns False during window."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    # Start extraction
    start_time = time.time()
    extractor.extraction_active = True
    extractor.extraction_start_time = start_time
    
    # Check immediately (should not be complete)
    assert extractor.check_window_complete(start_time + 1) == False
    
    # Check halfway through (should not be complete)
    assert extractor.check_window_complete(start_time + 15) == False


def test_check_window_complete_finished():
    """Test check_window_complete returns True when window duration exceeded."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    # Start extraction
    start_time = time.time()
    extractor.extraction_active = True
    extractor.extraction_start_time = start_time
    
    # Check after window duration (should be complete)
    assert extractor.check_window_complete(start_time + 30) == True
    
    # Check well after window duration (should still be complete)
    assert extractor.check_window_complete(start_time + 45) == True


def test_check_window_complete_edge_case():
    """Test check_window_complete at exact window boundary."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    start_time = 1000.0
    extractor.extraction_active = True
    extractor.extraction_start_time = start_time
    
    # Exactly at window duration boundary
    assert extractor.check_window_complete(start_time + 30.0) == True
    
    # Just before boundary
    assert extractor.check_window_complete(start_time + 29.9) == False


def test_get_extracted_frames_empty():
    """Test get_extracted_frames with no frames extracted."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    
    frames = extractor.get_extracted_frames()
    
    assert len(frames) == 0
    assert extractor.extraction_active == False
    assert extractor.extraction_start_time is None
    assert len(extractor.extracted_frames) == 0


def test_get_extracted_frames_with_data():
    """Test get_extracted_frames returns frames and resets state."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Extract some frames
    for i in range(5):
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        timestamp = time.time() + i
        confidence = 0.8
        bboxes = [{'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.8}]
        extractor.extract_frame(test_frame, timestamp, confidence, bboxes)
    
    # Get frames
    frames = extractor.get_extracted_frames()
    
    # Verify frames returned
    assert len(frames) == 5
    
    # Verify state reset
    assert extractor.extraction_active == False
    assert extractor.extraction_start_time is None
    assert len(extractor.extracted_frames) == 0
    assert extractor.last_extract_time == 0
    assert extractor.current_frame_index == 0


def test_get_extracted_frames_returns_copy():
    """Test get_extracted_frames returns a copy, not reference."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Extract a frame
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    extractor.extract_frame(test_frame, time.time(), 0.8, [])
    
    # Get frames
    frames = extractor.get_extracted_frames()
    
    # Modify returned list
    frames.append(None)
    
    # Verify original internal list is empty (reset)
    assert len(extractor.extracted_frames) == 0


def test_get_extracted_frames_frame_order():
    """Test get_extracted_frames preserves frame order."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Extract frames with different confidences
    confidences = [0.5, 0.6, 0.7, 0.8, 0.9]
    for conf in confidences:
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        extractor.extract_frame(test_frame, time.time(), conf, [])
    
    frames = extractor.get_extracted_frames()
    
    # Verify order preserved
    assert len(frames) == 5
    for i, frame in enumerate(frames):
        assert frame.confidence == confidences[i]
        assert frame.frame_index == i


def test_extract_frame_updates_frame_index():
    """Test extract_frame correctly increments frame index."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    # Extract 3 frames
    for i in range(3):
        test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        extractor.extract_frame(test_frame, time.time() + i, 0.8, [])
    
    # Verify frame indices
    assert extractor.extracted_frames[0].frame_index == 0
    assert extractor.extracted_frames[1].frame_index == 1
    assert extractor.extracted_frames[2].frame_index == 2
    assert extractor.current_frame_index == 3


def test_extract_frame_updates_last_extract_time():
    """Test extract_frame updates last_extract_time."""
    extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    extractor.extraction_active = True
    extractor.extraction_start_time = time.time()
    
    timestamp1 = 1000.0
    timestamp2 = 1001.0
    
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # First extraction
    extractor.extract_frame(test_frame, timestamp1, 0.8, [])
    assert extractor.last_extract_time == timestamp1
    
    # Second extraction
    extractor.extract_frame(test_frame, timestamp2, 0.8, [])
    assert extractor.last_extract_time == timestamp2
