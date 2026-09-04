"""
Tests for Fire Severity Classifier Module

Tests the classification logic for safe, moderate, and critical fire severities.
"""

import pytest
import numpy as np
from .severity_classifier import (
    FireSeverity, 
    SeverityMetrics, 
    FireSeverityClassifier
)


class TestSeverityMetrics:
    """Tests for SeverityMetrics data class."""
    
    def test_metrics_initialization(self):
        """Test that metrics can be initialized with valid values."""
        metrics = SeverityMetrics(
            fire_count=2,
            max_confidence=0.85,
            avg_confidence=0.70,
            total_fire_area=5000.0,
            frame_coverage=5.5,
            max_box_area=3000.0
        )
        
        assert metrics.fire_count == 2
        assert metrics.max_confidence == 0.85
        assert metrics.avg_confidence == 0.70
        assert metrics.total_fire_area == 5000.0
        assert metrics.frame_coverage == 5.5
        assert metrics.max_box_area == 3000.0
    
    def test_metrics_to_dict(self):
        """Test conversion of metrics to dictionary."""
        metrics = SeverityMetrics(1, 0.6, 0.6, 1000.0, 1.5, 1000.0)
        result = metrics.to_dict()
        
        assert isinstance(result, dict)
        assert result['fire_count'] == 1
        assert result['max_confidence'] == 0.6
        assert result['frame_coverage'] == 1.5


class TestFireSeverityClassifier:
    """Tests for FireSeverityClassifier."""
    
    def test_classifier_initialization_default(self):
        """Test classifier initialization with default parameters."""
        classifier = FireSeverityClassifier()
        
        assert classifier.safe_coverage == 2.0
        assert classifier.moderate_coverage == 15.0
        assert classifier.safe_confidence == 0.5
        assert classifier.moderate_confidence == 0.75
        assert classifier.multiple_fires_threshold == 3
    
    def test_classifier_initialization_custom(self):
        """Test classifier initialization with custom parameters."""
        classifier = FireSeverityClassifier(
            safe_threshold_coverage=3.0,
            moderate_threshold_coverage=20.0,
            safe_threshold_confidence=0.4,
            moderate_threshold_confidence=0.8,
            multiple_fires_threshold=4
        )
        
        assert classifier.safe_coverage == 3.0
        assert classifier.moderate_coverage == 20.0
        assert classifier.safe_confidence == 0.4
        assert classifier.moderate_confidence == 0.8
        assert classifier.multiple_fires_threshold == 4
    
    def test_invalid_coverage_threshold(self):
        """Test that invalid coverage thresholds raise ValueError."""
        with pytest.raises(ValueError):
            FireSeverityClassifier(safe_threshold_coverage=-1.0)
        
        with pytest.raises(ValueError):
            FireSeverityClassifier(safe_threshold_coverage=150.0)
        
        with pytest.raises(ValueError):
            FireSeverityClassifier(
                safe_threshold_coverage=20.0,
                moderate_threshold_coverage=10.0  # moderate < safe
            )
    
    def test_invalid_confidence_threshold(self):
        """Test that invalid confidence thresholds raise ValueError."""
        with pytest.raises(ValueError):
            FireSeverityClassifier(safe_threshold_confidence=-0.1)
        
        with pytest.raises(ValueError):
            FireSeverityClassifier(safe_threshold_confidence=1.5)
        
        with pytest.raises(ValueError):
            FireSeverityClassifier(
                safe_threshold_confidence=0.8,
                moderate_threshold_confidence=0.6  # moderate < safe
            )
    
    def test_invalid_multiple_fires_threshold(self):
        """Test that invalid multiple fires threshold raises ValueError."""
        with pytest.raises(ValueError):
            FireSeverityClassifier(multiple_fires_threshold=1)
        
        with pytest.raises(ValueError):
            FireSeverityClassifier(multiple_fires_threshold=0)


class TestComputeMetrics:
    """Tests for compute_metrics method."""
    
    def test_no_fires(self):
        """Test metrics computation with no fires."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        bounding_boxes = []
        
        metrics = classifier.compute_metrics(frame_shape, bounding_boxes)
        
        assert metrics.fire_count == 0
        assert metrics.max_confidence == 0.0
        assert metrics.avg_confidence == 0.0
        assert metrics.total_fire_area == 0.0
        assert metrics.frame_coverage == 0.0
        assert metrics.max_box_area == 0.0
    
    def test_single_fire(self):
        """Test metrics computation with single fire detection."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)  # 720p frame = 921,600 pixels
        
        # Single fire: 200x100 pixels = 20,000 pixels
        # Coverage: (20,000 / 921,600) * 100 = ~2.17%
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 200,
            'height': 100,
            'confidence': 0.65
        }]
        
        metrics = classifier.compute_metrics(frame_shape, bounding_boxes)
        
        assert metrics.fire_count == 1
        assert metrics.max_confidence == 0.65
        assert metrics.avg_confidence == 0.65
        assert metrics.total_fire_area == 20000.0
        assert abs(metrics.frame_coverage - 2.17) < 0.01
        assert metrics.max_box_area == 20000.0
    
    def test_multiple_fires(self):
        """Test metrics computation with multiple fire detections."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)  # 921,600 pixels
        
        # Two fires: 150x100 = 15,000 and 100x80 = 8,000
        # Total: 23,000 pixels = ~2.50% coverage
        bounding_boxes = [
            {'x': 100, 'y': 100, 'width': 150, 'height': 100, 'confidence': 0.70},
            {'x': 500, 'y': 200, 'width': 100, 'height': 80, 'confidence': 0.55}
        ]
        
        metrics = classifier.compute_metrics(frame_shape, bounding_boxes)
        
        assert metrics.fire_count == 2
        assert metrics.max_confidence == 0.70
        assert abs(metrics.avg_confidence - 0.625) < 0.001  # (0.70 + 0.55) / 2
        assert metrics.total_fire_area == 23000.0
        assert abs(metrics.frame_coverage - 2.50) < 0.01
        assert metrics.max_box_area == 15000.0


class TestClassifySeverity:
    """Tests for classify method - core classification logic."""
    
    def test_classify_no_fire_is_safe(self):
        """Test that no fire detection results in SAFE classification."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        bounding_boxes = []
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.SAFE
        assert metrics.fire_count == 0
    
    def test_classify_small_low_confidence_is_safe(self):
        """Test that small fire with low confidence is SAFE."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Very small fire: 50x30 = 1,500 pixels = ~0.16% coverage, confidence 0.35
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 50,
            'height': 30,
            'confidence': 0.35
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.SAFE
        assert metrics.frame_coverage < 2.0  # Below safe threshold
        assert metrics.max_confidence < 0.5   # Below safe threshold
    
    def test_classify_medium_confidence_is_moderate(self):
        """Test that medium confidence fire is MODERATE."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Small fire but medium confidence: 0.6
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 50,
            'height': 30,
            'confidence': 0.60
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.MODERATE
        assert 0.5 <= metrics.max_confidence < 0.75
    
    def test_classify_medium_coverage_is_moderate(self):
        """Test that medium coverage fire is MODERATE."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Medium fire: 300x200 = 60,000 pixels = ~6.5% coverage
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 300,
            'height': 200,
            'confidence': 0.45  # Low confidence but large area
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.MODERATE
        assert 2.0 <= metrics.frame_coverage < 15.0
    
    def test_classify_high_confidence_is_critical(self):
        """Test that high confidence fire is CRITICAL."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Small fire but very high confidence: 0.85
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 50,
            'height': 30,
            'confidence': 0.85
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.CRITICAL
        assert metrics.max_confidence >= 0.75
    
    def test_classify_large_coverage_is_critical(self):
        """Test that large coverage fire is CRITICAL."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Large fire: 600x300 = 180,000 pixels = ~19.5% coverage
        bounding_boxes = [{
            'x': 100,
            'y': 100,
            'width': 600,
            'height': 300,
            'confidence': 0.55  # Medium confidence but large area
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.CRITICAL
        assert metrics.frame_coverage >= 15.0
    
    def test_classify_multiple_fires_is_critical(self):
        """Test that multiple fires trigger CRITICAL classification."""
        classifier = FireSeverityClassifier()
        frame_shape = (720, 1280, 3)
        
        # Three small fires with low confidence and coverage
        bounding_boxes = [
            {'x': 100, 'y': 100, 'width': 40, 'height': 30, 'confidence': 0.40},
            {'x': 300, 'y': 200, 'width': 35, 'height': 25, 'confidence': 0.38},
            {'x': 500, 'y': 300, 'width': 45, 'height': 35, 'confidence': 0.42}
        ]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        assert severity == FireSeverity.CRITICAL
        assert metrics.fire_count >= 3
    
    def test_classify_edge_case_at_safe_boundary(self):
        """Test classification at exact safe threshold boundary."""
        classifier = FireSeverityClassifier()
        frame_shape = (1000, 1000, 3)  # 1,000,000 pixels for easy calculation
        
        # Exactly 2% coverage (20,000 pixels)
        bounding_boxes = [{
            'x': 0,
            'y': 0,
            'width': 200,
            'height': 100,  # 20,000 pixels
            'confidence': 0.45
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        # At exactly 2.0%, should be MODERATE (>= threshold)
        assert severity == FireSeverity.MODERATE
        assert abs(metrics.frame_coverage - 2.0) < 0.01
    
    def test_classify_edge_case_at_moderate_boundary(self):
        """Test classification at exact moderate threshold boundary."""
        classifier = FireSeverityClassifier()
        frame_shape = (1000, 1000, 3)  # 1,000,000 pixels
        
        # Exactly 15% coverage (150,000 pixels)
        bounding_boxes = [{
            'x': 0,
            'y': 0,
            'width': 500,
            'height': 300,  # 150,000 pixels
            'confidence': 0.60
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        
        # At exactly 15.0%, should be CRITICAL (>= threshold)
        assert severity == FireSeverity.CRITICAL
        assert abs(metrics.frame_coverage - 15.0) < 0.01


class TestShouldExtractFrames:
    """Tests for should_extract_frames method."""
    
    def test_safe_no_extraction(self):
        """Test that SAFE severity does not trigger extraction."""
        classifier = FireSeverityClassifier()
        
        should_extract = classifier.should_extract_frames(FireSeverity.SAFE)
        
        assert should_extract is False
    
    def test_moderate_triggers_extraction(self):
        """Test that MODERATE severity triggers extraction."""
        classifier = FireSeverityClassifier()
        
        should_extract = classifier.should_extract_frames(FireSeverity.MODERATE)
        
        assert should_extract is True
    
    def test_critical_triggers_extraction(self):
        """Test that CRITICAL severity triggers extraction."""
        classifier = FireSeverityClassifier()
        
        should_extract = classifier.should_extract_frames(FireSeverity.CRITICAL)
        
        assert should_extract is True


class TestIntegrationScenarios:
    """Integration tests for realistic fire scenarios."""
    
    def test_scenario_candle_flame(self):
        """Test classification of small candle-like flame (should be SAFE)."""
        classifier = FireSeverityClassifier()
        frame_shape = (1080, 1920, 3)  # Full HD
        
        # Tiny flame: 30x40 pixels, low confidence
        bounding_boxes = [{
            'x': 500,
            'y': 400,
            'width': 30,
            'height': 40,
            'confidence': 0.42
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        should_extract = classifier.should_extract_frames(severity)
        
        assert severity == FireSeverity.SAFE
        assert should_extract is False
    
    def test_scenario_small_contained_fire(self):
        """Test classification of small contained fire (should be MODERATE)."""
        classifier = FireSeverityClassifier()
        frame_shape = (1080, 1920, 3)
        
        # Small fire: 150x100 pixels, medium confidence
        bounding_boxes = [{
            'x': 300,
            'y': 400,
            'width': 150,
            'height': 100,
            'confidence': 0.62
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        should_extract = classifier.should_extract_frames(severity)
        
        assert severity == FireSeverity.MODERATE
        assert should_extract is True
    
    def test_scenario_building_fire(self):
        """Test classification of large building fire (should be CRITICAL)."""
        classifier = FireSeverityClassifier()
        frame_shape = (1080, 1920, 3)
        
        # Large fire: 800x500 pixels, high confidence
        bounding_boxes = [{
            'x': 200,
            'y': 100,
            'width': 800,
            'height': 500,
            'confidence': 0.88
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        should_extract = classifier.should_extract_frames(severity)
        
        assert severity == FireSeverity.CRITICAL
        assert should_extract is True
    
    def test_scenario_spreading_fire_multiple_sources(self):
        """Test classification of fire spreading to multiple areas (should be CRITICAL)."""
        classifier = FireSeverityClassifier()
        frame_shape = (1080, 1920, 3)
        
        # Multiple fire sources indicating spread
        bounding_boxes = [
            {'x': 100, 'y': 200, 'width': 120, 'height': 80, 'confidence': 0.55},
            {'x': 400, 'y': 250, 'width': 110, 'height': 90, 'confidence': 0.58},
            {'x': 700, 'y': 300, 'width': 130, 'height': 75, 'confidence': 0.62}
        ]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        should_extract = classifier.should_extract_frames(severity)
        
        assert severity == FireSeverity.CRITICAL
        assert metrics.fire_count >= 3
        assert should_extract is True
    
    def test_scenario_distant_small_fire_high_confidence(self):
        """Test distant fire with high model confidence (should be CRITICAL)."""
        classifier = FireSeverityClassifier()
        frame_shape = (1080, 1920, 3)
        
        # Small but detected with very high confidence (model is certain)
        bounding_boxes = [{
            'x': 1500,
            'y': 800,
            'width': 80,
            'height': 60,
            'confidence': 0.92
        }]
        
        severity, metrics = classifier.classify(frame_shape, bounding_boxes)
        should_extract = classifier.should_extract_frames(severity)
        
        assert severity == FireSeverity.CRITICAL
        assert metrics.max_confidence >= 0.75
        assert should_extract is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
