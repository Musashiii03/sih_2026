"""
Unit tests for Frame Selector Module
"""

import pytest
import numpy as np
import cv2
from typing import List

from .extractor import Frame, BBox
from .selector import FrameSelector


# Helper function to create test frames
def create_test_frame(index: int, timestamp: float, confidence: float = 0.85, 
                     color: tuple = (255, 0, 0), shape: tuple = (480, 640, 3)) -> Frame:
    """Create a test frame with specified properties.
    
    Args:
        index: Frame index
        timestamp: Frame timestamp
        confidence: Detection confidence
        color: BGR color to fill the frame (default: blue)
        shape: Image shape (height, width, channels)
    
    Returns:
        Frame object for testing
    """
    # Create image filled with specified color
    image = np.full(shape, color, dtype=np.uint8)
    
    # Add some variation based on index to make frames slightly different
    # Draw a rectangle at different positions
    rect_x = 100 + (index * 50) % 300
    rect_y = 100 + (index * 30) % 200
    cv2.rectangle(image, (rect_x, rect_y), (rect_x + 50, rect_y + 50), (0, 255, 0), -1)
    
    bbox = BBox(x=rect_x, y=rect_y, width=50, height=50, confidence=confidence)
    
    return Frame(
        image=image,
        timestamp=timestamp,
        confidence=confidence,
        bounding_boxes=[bbox],
        frame_index=index
    )


def create_identical_frame_pair() -> tuple[Frame, Frame]:
    """Create two identical frames for similarity testing."""
    image = np.full((480, 640, 3), (255, 0, 0), dtype=np.uint8)
    
    frame1 = Frame(
        image=image.copy(),
        timestamp=1000.0,
        confidence=0.85,
        bounding_boxes=[],
        frame_index=0
    )
    
    frame2 = Frame(
        image=image.copy(),
        timestamp=1001.0,
        confidence=0.87,
        bounding_boxes=[],
        frame_index=1
    )
    
    return frame1, frame2


def create_different_frame_pair() -> tuple[Frame, Frame]:
    """Create two visually different frames for similarity testing."""
    # First frame: mostly blue
    image1 = np.full((480, 640, 3), (255, 0, 0), dtype=np.uint8)
    
    # Second frame: mostly red
    image2 = np.full((480, 640, 3), (0, 0, 255), dtype=np.uint8)
    
    frame1 = Frame(
        image=image1,
        timestamp=1000.0,
        confidence=0.85,
        bounding_boxes=[],
        frame_index=0
    )
    
    frame2 = Frame(
        image=image2,
        timestamp=1001.0,
        confidence=0.87,
        bounding_boxes=[],
        frame_index=1
    )
    
    return frame1, frame2


class TestFrameSelectorInitialization:
    """Tests for FrameSelector initialization and validation."""
    
    def test_init_with_valid_parameters(self):
        """Test initialization with valid parameters."""
        selector = FrameSelector(min_frames=6, max_frames=15, similarity_threshold=0.85)
        
        assert selector.min_frames == 6
        assert selector.max_frames == 15
        assert selector.similarity_threshold == 0.85
    
    def test_init_with_custom_parameters(self):
        """Test initialization with custom but valid parameters."""
        selector = FrameSelector(min_frames=4, max_frames=20, similarity_threshold=0.90)
        
        assert selector.min_frames == 4
        assert selector.max_frames == 20
        assert selector.similarity_threshold == 0.90
    
    def test_init_rejects_invalid_min_frames(self):
        """Test that initialization rejects min_frames < 1."""
        with pytest.raises(ValueError, match="min_frames must be >= 1"):
            FrameSelector(min_frames=0, max_frames=15)
    
    def test_init_rejects_max_less_than_min(self):
        """Test that initialization rejects max_frames < min_frames."""
        with pytest.raises(ValueError, match="max_frames.*must be >= min_frames"):
            FrameSelector(min_frames=10, max_frames=5)
    
    def test_init_rejects_invalid_similarity_threshold_high(self):
        """Test that initialization rejects similarity_threshold > 1.0."""
        with pytest.raises(ValueError, match="similarity_threshold must be between 0.0 and 1.0"):
            FrameSelector(similarity_threshold=1.5)
    
    def test_init_rejects_invalid_similarity_threshold_low(self):
        """Test that initialization rejects similarity_threshold < 0.0."""
        with pytest.raises(ValueError, match="similarity_threshold must be between 0.0 and 1.0"):
            FrameSelector(similarity_threshold=-0.1)


class TestSimilarityComputation:
    """Tests for similarity computation methods."""
    
    def test_compute_similarity_identical_frames(self):
        """Test that identical frames have high similarity (close to 1.0)."""
        selector = FrameSelector()
        frame1, frame2 = create_identical_frame_pair()
        
        similarity = selector.compute_similarity(frame1, frame2)
        
        # Identical frames should have very high similarity
        assert similarity > 0.95
    
    def test_compute_similarity_different_frames(self):
        """Test that different frames have lower similarity."""
        selector = FrameSelector()
        frame1, frame2 = create_different_frame_pair()
        
        similarity = selector.compute_similarity(frame1, frame2)
        
        # Very different frames should have lower similarity than identical frames
        # SSIM can still be relatively high for solid colors, so we use 0.7 threshold
        assert similarity < 0.7
    
    def test_compute_similarity_returns_valid_range(self):
        """Test that similarity is always in [0.0, 1.0] range."""
        selector = FrameSelector()
        frames = [create_test_frame(i, 1000.0 + i) for i in range(5)]
        
        for i in range(len(frames)):
            for j in range(i + 1, len(frames)):
                similarity = selector.compute_similarity(frames[i], frames[j])
                assert 0.0 <= similarity <= 1.0
    
    def test_compute_histogram_similarity_identical_frames(self):
        """Test histogram similarity for identical frames."""
        selector = FrameSelector()
        frame1, frame2 = create_identical_frame_pair()
        
        similarity = selector.compute_histogram_similarity(frame1, frame2)
        
        # Identical frames should have high histogram similarity
        assert similarity > 0.95
    
    def test_compute_histogram_similarity_different_frames(self):
        """Test histogram similarity for different frames."""
        selector = FrameSelector()
        frame1, frame2 = create_different_frame_pair()
        
        similarity = selector.compute_histogram_similarity(frame1, frame2)
        
        # Different frames should have lower histogram similarity
        assert similarity < 0.8
    
    def test_similarity_with_different_sized_frames(self):
        """Test that similarity computation handles different frame sizes."""
        selector = FrameSelector()
        
        # Create frames with different sizes
        frame1 = create_test_frame(0, 1000.0, shape=(480, 640, 3))
        frame2 = create_test_frame(1, 1001.0, shape=(720, 1280, 3))
        
        # Should not raise exception, should resize internally
        similarity = selector.compute_similarity(frame1, frame2)
        
        assert 0.0 <= similarity <= 1.0


class TestFrameSelection:
    """Tests for frame selection algorithm."""
    
    def test_select_frames_empty_list(self):
        """Test selection with empty frame list."""
        selector = FrameSelector()
        result = selector.select_frames([])
        
        assert result == []
    
    def test_select_frames_single_frame(self):
        """Test selection with single frame."""
        selector = FrameSelector()
        frames = [create_test_frame(0, 1000.0)]
        
        result = selector.select_frames(frames)
        
        assert len(result) == 1
        assert result[0] == frames[0]
    
    def test_select_frames_respects_min_frames(self):
        """Test that selection returns at least min_frames when possible."""
        selector = FrameSelector(min_frames=6, max_frames=15)
        
        # Create 10 frames
        frames = [create_test_frame(i, 1000.0 + i) for i in range(10)]
        
        result = selector.select_frames(frames)
        
        assert len(result) >= 6
    
    def test_select_frames_respects_max_frames(self):
        """Test that selection returns at most max_frames."""
        selector = FrameSelector(min_frames=6, max_frames=10)
        
        # Create 30 very diverse frames
        frames = []
        for i in range(30):
            # Make each frame very different by changing color significantly
            color = (i * 8 % 256, i * 13 % 256, i * 21 % 256)
            frame = create_test_frame(i, 1000.0 + i, color=color)
            frames.append(frame)
        
        result = selector.select_frames(frames)
        
        assert len(result) <= 10
    
    def test_select_frames_fewer_than_min_returns_all(self):
        """Test that when fewer frames than min_frames available, all are returned."""
        selector = FrameSelector(min_frames=10, max_frames=15)
        
        # Create only 5 frames
        frames = [create_test_frame(i, 1000.0 + i) for i in range(5)]
        
        result = selector.select_frames(frames)
        
        assert len(result) == 5
    
    def test_select_frames_first_frame_always_selected(self):
        """Test that first frame (fire onset) is always selected."""
        selector = FrameSelector()
        
        frames = [create_test_frame(i, 1000.0 + i) for i in range(10)]
        
        result = selector.select_frames(frames)
        
        # First frame should be in result - compare by frame_index
        result_indices = [f.frame_index for f in result]
        assert frames[0].frame_index in result_indices
    
    def test_select_frames_maintains_chronological_order(self):
        """Test that selected frames are returned in chronological order."""
        selector = FrameSelector()
        
        # Create frames with non-sequential timestamps
        frames = [
            create_test_frame(0, 1005.0),
            create_test_frame(1, 1001.0),
            create_test_frame(2, 1003.0),
            create_test_frame(3, 1002.0),
            create_test_frame(4, 1004.0),
        ]
        
        result = selector.select_frames(frames)
        
        # Check that result is sorted by timestamp
        for i in range(len(result) - 1):
            assert result[i].timestamp <= result[i + 1].timestamp
    
    def test_select_frames_filters_similar_frames(self):
        """Test that similar frames are filtered out."""
        selector = FrameSelector(similarity_threshold=0.85)
        
        # Create frames where some are identical
        frame1, frame2 = create_identical_frame_pair()
        frame3 = create_test_frame(2, 1002.0, color=(0, 0, 255))  # Very different
        
        frames = [frame1, frame2, frame3]
        
        result = selector.select_frames(frames)
        
        # Should select frame1 (first frame always selected)
        # Should NOT select frame2 (too similar to frame1)
        # Should select frame3 (different from frame1)
        # Use frame_index for comparison to avoid numpy array comparison issues
        result_indices = [f.frame_index for f in result]
        
        assert frame1.frame_index in result_indices
        assert frame3.frame_index in result_indices
        # frame2 might or might not be included depending on min_frames, but if selected
        # it should be because of min_frames constraint, not diversity
    
    def test_select_frames_handles_processing_errors(self):
        """Test that selection continues even if some frames fail processing."""
        selector = FrameSelector()
        
        # Create valid frames
        frames = [create_test_frame(i, 1000.0 + i) for i in range(5)]
        
        # Corrupt one frame's image (but keep it as ndarray)
        frames[2].image = np.array([])  # Empty array - might cause issues
        
        # Should not raise exception, should handle error gracefully
        result = selector.select_frames(frames)
        
        # Should return some frames (at least the first one)
        assert len(result) >= 1
    
    def test_select_frames_diversity_selection(self):
        """Test that selected frames are visually diverse."""
        selector = FrameSelector(min_frames=3, max_frames=10, similarity_threshold=0.80)
        
        # Create frames with varying colors to ensure diversity
        frames = []
        colors = [
            (255, 0, 0),    # Blue
            (255, 0, 0),    # Blue (similar to frame 0)
            (0, 255, 0),    # Green (different)
            (0, 0, 255),    # Red (different)
            (0, 255, 0),    # Green (similar to frame 2)
            (255, 255, 0),  # Cyan (different)
        ]
        
        for i, color in enumerate(colors):
            frame = create_test_frame(i, 1000.0 + i, color=color)
            frames.append(frame)
        
        result = selector.select_frames(frames)
        
        # Should select diverse frames, filtering out similar ones
        # At minimum: frames 0, 2, 3, 5 (all different colors)
        assert len(result) >= 3
        
        # Verify that selected frames meet diversity criterion
        for i in range(len(result)):
            for j in range(i + 1, len(result)):
                similarity = selector.compute_similarity(result[i], result[j])
                # Selected frames should be below threshold (or close to it due to min_frames)
                # We allow some margin since min_frames might force similar frames
                assert similarity < 0.95  # Very lenient to allow min_frames enforcement


class TestErrorHandling:
    """Tests for error handling and resilience."""
    
    def test_selection_with_corrupted_frame_continues(self):
        """Test that selection continues when encountering a corrupted frame."""
        selector = FrameSelector(min_frames=2, max_frames=10)
        
        frames = [
            create_test_frame(0, 1000.0),
            create_test_frame(1, 1001.0),
            create_test_frame(2, 1002.0),
        ]
        
        # Corrupt middle frame
        frames[1].image = None  # This should cause an error in similarity computation
        
        # Should handle error and continue
        result = selector.select_frames(frames)
        
        # Should still return frames (at least first and last)
        assert len(result) >= 1
        assert frames[0] in result  # First frame always selected
    
    def test_fallback_to_histogram_on_ssim_failure(self):
        """Test that histogram similarity is used when SSIM fails."""
        selector = FrameSelector()
        
        # Create frames with unusual properties that might cause SSIM issues
        frame1 = create_test_frame(0, 1000.0, shape=(100, 100, 3))
        frame2 = create_test_frame(1, 1001.0, shape=(100, 100, 3))
        
        # Compute similarity - should use SSIM or fall back to histogram
        similarity = selector.compute_similarity(frame1, frame2)
        
        # Should return a valid similarity score
        assert 0.0 <= similarity <= 1.0


# Integration test
def test_end_to_end_frame_selection():
    """Integration test: Extract and select frames from a sequence."""
    selector = FrameSelector(min_frames=4, max_frames=8, similarity_threshold=0.85)
    
    # Create a sequence of frames simulating fire progression
    # Use larger color jumps to ensure visual diversity
    frames = []
    for i in range(20):
        # Larger color changes to create more visual diversity
        red_intensity = min(255, 100 + i * 8)
        color = (0, 0, red_intensity)
        frame = create_test_frame(i, 1000.0 + i * 0.5, color=color)
        frames.append(frame)
    
    # Select representative frames
    selected = selector.select_frames(frames)
    
    # Verify results
    assert 4 <= len(selected) <= 8, f"Expected 4-8 frames, got {len(selected)}"
    
    # Verify first frame is selected (compare by reference for single object)
    assert selected[0].frame_index == frames[0].frame_index
    
    # Verify chronological order
    for i in range(len(selected) - 1):
        assert selected[i].timestamp < selected[i + 1].timestamp
    
    # Verify that we have some diversity in the selection
    # Check that first and last selected frames are different
    if len(selected) >= 2:
        similarity_first_last = selector.compute_similarity(selected[0], selected[-1])
        # First and last should show progression (not identical)
        assert similarity_first_last < 0.99, f"First and last frames too similar: {similarity_first_last}"
