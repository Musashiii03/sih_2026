"""
Tests for Frame Extractor with Severity Classification Integration

Tests the integration of fire severity classification with frame extraction.
"""

import pytest
import numpy as np
import time
from .extractor import FrameExtractor
from .severity_classifier import FireSeverity, FireSeverityClassifier


class TestFrameExtractorWithSeverity:
    """Tests for FrameExtractor with severity classification."""
    
    def test_extractor_initializes_with_default_classifier(self):
        """Test that extractor creates default classifier if none provided."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        assert extractor.severity_classifier is not None
        assert isinstance(extractor.severity_classifier, FireSeverityClassifier)
        assert extractor.current_severity is None
        assert extractor.current_metrics is None
    
    def test_extractor_accepts_custom_classifier(self):
        """Test that extractor accepts custom severity classifier."""
        custom_classifier = FireSeverityClassifier(
            safe_threshold_coverage=3.0,
            moderate_threshold_coverage=20.0
        )
        extractor = FrameExtractor(
            sample_rate=3.0,
            window_duration=30,
            severity_classifier=custom_classifier
        )
        
        assert extractor.severity_classifier is custom_classifier
        assert extractor.severity_classifier.safe_coverage == 3.0
    
    def test_safe_fire_does_not_trigger_extraction(self):
        """Test that SAFE severity fire does not start extraction."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # Small fire with low confidence (should be SAFE)
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        timestamp = time.time()
        bboxes = [{'x': 100, 'y': 100, 'width': 30, 'height': 20, 'confidence': 0.35}]
        
        extraction_started, severity = extractor.on_fire_detected(
            timestamp, frame, 0.35, bboxes
        )
        
        assert extraction_started is False
        assert severity == FireSeverity.SAFE
        assert extractor.extraction_active is False
        assert extractor.current_severity == FireSeverity.SAFE
    
    def test_moderate_fire_triggers_extraction(self):
        """Test that MODERATE severity fire starts extraction."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # Medium confidence fire (should be MODERATE)
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        timestamp = time.time()
        bboxes = [{'x': 100, 'y': 100, 'width': 50, 'height': 40, 'confidence': 0.62}]
        
        extraction_started, severity = extractor.on_fire_detected(
            timestamp, frame, 0.62, bboxes
        )
        
        assert extraction_started is True
        assert severity == FireSeverity.MODERATE
        assert extractor.extraction_active is True
        assert extractor.current_severity == FireSeverity.MODERATE
    
    def test_critical_fire_triggers_extraction(self):
        """Test that CRITICAL severity fire starts extraction."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # High confidence fire (should be CRITICAL)
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        timestamp = time.time()
        bboxes = [{'x': 100, 'y': 100, 'width': 100, 'height': 80, 'confidence': 0.88}]
        
        extraction_started, severity = extractor.on_fire_detected(
            timestamp, frame, 0.88, bboxes
        )
        
        assert extraction_started is True
        assert severity == FireSeverity.CRITICAL
        assert extractor.extraction_active is True
        assert extractor.current_severity == FireSeverity.CRITICAL
    
    def test_get_current_severity(self):
        """Test retrieving current fire severity."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # Initially no severity
        assert extractor.get_current_severity() is None
        
        # After fire detection
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        bboxes = [{'x': 100, 'y': 100, 'width': 100, 'height': 80, 'confidence': 0.82}]
        extractor.on_fire_detected(time.time(), frame, 0.82, bboxes)
        
        severity = extractor.get_current_severity()
        assert severity == FireSeverity.CRITICAL
    
    def test_get_current_metrics(self):
        """Test retrieving current severity metrics."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # Initially no metrics
        assert extractor.get_current_metrics() is None
        
        # After fire detection
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        bboxes = [{'x': 100, 'y': 100, 'width': 100, 'height': 80, 'confidence': 0.70}]
        extractor.on_fire_detected(time.time(), frame, 0.70, bboxes)
        
        metrics = extractor.get_current_metrics()
        assert metrics is not None
        assert metrics.fire_count == 1
        assert metrics.max_confidence == 0.70
        assert metrics.total_fire_area == 8000.0
    
    def test_severity_resets_after_get_extracted_frames(self):
        """Test that severity and metrics reset when frames are retrieved."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        # Trigger extraction with critical fire
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        bboxes = [{'x': 100, 'y': 100, 'width': 100, 'height': 80, 'confidence': 0.85}]
        extractor.on_fire_detected(time.time(), frame, 0.85, bboxes)
        
        assert extractor.current_severity == FireSeverity.CRITICAL
        assert extractor.current_metrics is not None
        
        # Get frames (resets state)
        frames = extractor.get_extracted_frames()
        
        assert extractor.current_severity is None
        assert extractor.current_metrics is None
    
    def test_multiple_safe_fires_do_not_accumulate(self):
        """Test that multiple SAFE fires don't trigger extraction."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        small_bbox = [{'x': 100, 'y': 100, 'width': 20, 'height': 15, 'confidence': 0.30}]
        
        # Detect safe fire multiple times
        for i in range(5):
            extraction_started, severity = extractor.on_fire_detected(
                time.time() + i, frame, 0.30, small_bbox
            )
            assert extraction_started is False
            assert severity == FireSeverity.SAFE
            assert extractor.extraction_active is False


class TestExtractionWorkflowWithSeverity:
    """Integration tests for complete extraction workflow with severity."""
    
    def test_complete_moderate_fire_workflow(self):
        """Test complete workflow: moderate fire -> extract frames."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        start_time = time.time()
        
        # Fire detected with medium coverage (MODERATE)
        bboxes = [{'x': 100, 'y': 100, 'width': 250, 'height': 180, 'confidence': 0.58}]
        extraction_started, severity = extractor.on_fire_detected(
            start_time, frame, 0.58, bboxes
        )
        
        assert extraction_started is True
        assert severity == FireSeverity.MODERATE
        
        # Extract some frames
        for i in range(5):
            current_time = start_time + (i * 0.4)  # ~2.5 FPS
            if extractor.should_extract_frame(current_time):
                extractor.extract_frame(frame, current_time, 0.58, bboxes)
        
        # Verify frames were extracted
        assert len(extractor.extracted_frames) > 0
        
        # Complete window
        frames = extractor.get_extracted_frames()
        assert len(frames) > 0
        assert extractor.current_severity is None  # Reset after retrieval
    
    def test_safe_to_moderate_escalation(self):
        """Test fire escalating from SAFE to MODERATE triggers extraction."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        start_time = time.time()
        
        # Initially SAFE fire
        small_bbox = [{'x': 100, 'y': 100, 'width': 30, 'height': 20, 'confidence': 0.40}]
        extraction_started, severity = extractor.on_fire_detected(
            start_time, frame, 0.40, small_bbox
        )
        
        assert extraction_started is False
        assert severity == FireSeverity.SAFE
        assert not extractor.extraction_active
        
        # Fire grows to MODERATE
        time.sleep(0.1)
        medium_bbox = [{'x': 100, 'y': 100, 'width': 200, 'height': 150, 'confidence': 0.65}]
        extraction_started, severity = extractor.on_fire_detected(
            start_time + 1.0, frame, 0.65, medium_bbox
        )
        
        assert extraction_started is True
        assert severity == FireSeverity.MODERATE
        assert extractor.extraction_active
    
    def test_safe_fire_never_extracts_frames(self):
        """Test that SAFE fire throughout entire duration never extracts."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        start_time = time.time()
        
        # SAFE fire detected
        small_bbox = [{'x': 100, 'y': 100, 'width': 25, 'height': 20, 'confidence': 0.35}]
        extractor.on_fire_detected(start_time, frame, 0.35, small_bbox)
        
        # Try to extract frames at various intervals
        extracted_count = 0
        for i in range(10):
            current_time = start_time + (i * 0.5)
            if extractor.should_extract_frame(current_time):
                extractor.extract_frame(frame, current_time, 0.35, small_bbox)
                extracted_count += 1
        
        # Should not have extracted any frames
        assert extracted_count == 0
        assert len(extractor.extracted_frames) == 0
        assert not extractor.extraction_active


class TestSeverityClassificationScenarios:
    """Tests for realistic severity classification scenarios."""
    
    def test_candle_flame_scenario(self):
        """Test tiny candle flame is classified as SAFE."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)  # Full HD
        tiny_bbox = [{'x': 500, 'y': 400, 'width': 25, 'height': 35, 'confidence': 0.38}]
        
        extraction_started, severity = extractor.on_fire_detected(
            time.time(), frame, 0.38, tiny_bbox
        )
        
        assert severity == FireSeverity.SAFE
        assert not extraction_started
    
    def test_room_fire_scenario(self):
        """Test room fire is classified as MODERATE or CRITICAL."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        room_fire_bbox = [{'x': 300, 'y': 200, 'width': 400, 'height': 300, 'confidence': 0.75}]
        
        extraction_started, severity = extractor.on_fire_detected(
            time.time(), frame, 0.75, room_fire_bbox
        )
        
        assert severity in (FireSeverity.MODERATE, FireSeverity.CRITICAL)
        assert extraction_started is True
    
    def test_multiple_fire_sources_scenario(self):
        """Test multiple fire sources trigger CRITICAL."""
        extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
        
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        multiple_bboxes = [
            {'x': 100, 'y': 200, 'width': 120, 'height': 90, 'confidence': 0.55},
            {'x': 500, 'y': 300, 'width': 110, 'height': 85, 'confidence': 0.60},
            {'x': 900, 'y': 400, 'width': 130, 'height': 95, 'confidence': 0.58}
        ]
        
        extraction_started, severity = extractor.on_fire_detected(
            time.time(), frame, 0.60, multiple_bboxes
        )
        
        assert severity == FireSeverity.CRITICAL
        assert extraction_started is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
