"""
Fire Severity Classifier Module

Categorizes detected fires into three severity levels: safe, moderate, and critical.
This classification determines whether frame extraction should be triggered.
"""

from typing import List, Dict, Any, Tuple
from enum import Enum
import numpy as np
import logging


# Configure logging for severity classification module
logger = logging.getLogger('frame_extraction.severity_classifier')
logger.setLevel(logging.INFO)


class FireSeverity(Enum):
    """Enumeration of fire severity levels."""
    SAFE = "safe"           # Minor fire, no immediate threat - no extraction
    MODERATE = "moderate"   # Significant fire requiring monitoring - extract frames
    CRITICAL = "critical"   # Severe fire requiring immediate response - extract frames


class SeverityMetrics:
    """Data class holding metrics used for severity classification."""
    
    def __init__(self, fire_count: int, max_confidence: float, avg_confidence: float,
                 total_fire_area: float, frame_coverage: float, max_box_area: float):
        """Initialize severity metrics.
        
        Args:
            fire_count: Number of fire detections in frame
            max_confidence: Highest confidence score among all detections [0.0, 1.0]
            avg_confidence: Average confidence across all detections [0.0, 1.0]
            total_fire_area: Total area covered by fire in pixels
            frame_coverage: Percentage of frame covered by fire [0.0, 100.0]
            max_box_area: Area of largest fire bounding box in pixels
        """
        self.fire_count = fire_count
        self.max_confidence = max_confidence
        self.avg_confidence = avg_confidence
        self.total_fire_area = total_fire_area
        self.frame_coverage = frame_coverage
        self.max_box_area = max_box_area
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary for logging/storage."""
        return {
            'fire_count': self.fire_count,
            'max_confidence': self.max_confidence,
            'avg_confidence': self.avg_confidence,
            'total_fire_area': self.total_fire_area,
            'frame_coverage': self.frame_coverage,
            'max_box_area': self.max_box_area
        }


class FireSeverityClassifier:
    """Classifies fire severity based on detection metrics.
    
    Classification criteria:
    - SAFE: Small, low-confidence fires (< 2% frame coverage, confidence < 0.5)
    - MODERATE: Medium fires requiring monitoring (2-15% coverage OR confidence 0.5-0.75)
    - CRITICAL: Large or high-confidence fires (> 15% coverage OR confidence > 0.75 OR multiple fires)
    
    Frame extraction is triggered only for MODERATE and CRITICAL severity levels.
    """
    
    def __init__(self, 
                 safe_threshold_coverage: float = 2.0,
                 moderate_threshold_coverage: float = 15.0,
                 safe_threshold_confidence: float = 0.5,
                 moderate_threshold_confidence: float = 0.75,
                 multiple_fires_threshold: int = 3):
        """Initialize the FireSeverityClassifier.
        
        Args:
            safe_threshold_coverage: Frame coverage % below which fire is considered safe (default: 2%)
            moderate_threshold_coverage: Frame coverage % above which fire is critical (default: 15%)
            safe_threshold_confidence: Confidence below which fire is safe (default: 0.5)
            moderate_threshold_confidence: Confidence above which fire is critical (default: 0.75)
            multiple_fires_threshold: Number of fires that automatically trigger critical (default: 3)
        
        Raises:
            ValueError: If thresholds are invalid
        """
        # Validate parameters
        if not (0.0 <= safe_threshold_coverage <= 100.0):
            raise ValueError(f"safe_threshold_coverage must be between 0 and 100, got {safe_threshold_coverage}")
        
        if not (safe_threshold_coverage <= moderate_threshold_coverage <= 100.0):
            raise ValueError(f"moderate_threshold_coverage must be >= safe_threshold and <= 100")
        
        if not (0.0 <= safe_threshold_confidence <= 1.0):
            raise ValueError(f"safe_threshold_confidence must be between 0 and 1, got {safe_threshold_confidence}")
        
        if not (safe_threshold_confidence <= moderate_threshold_confidence <= 1.0):
            raise ValueError(f"moderate_threshold_confidence must be >= safe_threshold and <= 1")
        
        if multiple_fires_threshold < 2:
            raise ValueError(f"multiple_fires_threshold must be >= 2, got {multiple_fires_threshold}")
        
        # Store configuration
        self.safe_coverage = safe_threshold_coverage
        self.moderate_coverage = moderate_threshold_coverage
        self.safe_confidence = safe_threshold_confidence
        self.moderate_confidence = moderate_threshold_confidence
        self.multiple_fires_threshold = multiple_fires_threshold
        
        logger.info(f"FireSeverityClassifier initialized with thresholds:")
        logger.info(f"  Coverage: safe < {safe_threshold_coverage}%, moderate < {moderate_threshold_coverage}%")
        logger.info(f"  Confidence: safe < {safe_threshold_confidence}, moderate < {moderate_threshold_confidence}")
        logger.info(f"  Multiple fires critical threshold: {multiple_fires_threshold}")
    
    def compute_metrics(self, frame_shape: Tuple[int, int, int], 
                       bounding_boxes: List[Dict[str, Any]]) -> SeverityMetrics:
        """Compute metrics from fire detections.
        
        Args:
            frame_shape: Shape of video frame (height, width, channels)
            bounding_boxes: List of fire bounding box dictionaries with keys:
                           x, y, width, height, confidence
        
        Returns:
            SeverityMetrics object containing computed metrics
        """
        if not bounding_boxes:
            return SeverityMetrics(
                fire_count=0,
                max_confidence=0.0,
                avg_confidence=0.0,
                total_fire_area=0.0,
                frame_coverage=0.0,
                max_box_area=0.0
            )
        
        # Extract frame dimensions
        frame_height, frame_width = frame_shape[:2]
        frame_area = frame_height * frame_width
        
        # Count fires
        fire_count = len(bounding_boxes)
        
        # Extract confidences
        confidences = [bbox.get('confidence', 0.0) for bbox in bounding_boxes]
        max_confidence = max(confidences)
        avg_confidence = sum(confidences) / len(confidences)
        
        # Calculate areas
        total_fire_area = 0.0
        max_box_area = 0.0
        
        for bbox in bounding_boxes:
            width = bbox.get('width', 0)
            height = bbox.get('height', 0)
            area = width * height
            total_fire_area += area
            max_box_area = max(max_box_area, area)
        
        # Calculate frame coverage percentage
        frame_coverage = (total_fire_area / frame_area) * 100.0 if frame_area > 0 else 0.0
        
        return SeverityMetrics(
            fire_count=fire_count,
            max_confidence=max_confidence,
            avg_confidence=avg_confidence,
            total_fire_area=total_fire_area,
            frame_coverage=frame_coverage,
            max_box_area=max_box_area
        )
    
    def classify(self, frame_shape: Tuple[int, int, int], 
                 bounding_boxes: List[Dict[str, Any]]) -> Tuple[FireSeverity, SeverityMetrics]:
        """Classify fire severity based on detection metrics.
        
        Classification logic:
        1. If no fires detected -> SAFE
        2. If multiple fires (>= threshold) -> CRITICAL
        3. If high confidence (>= moderate_threshold) -> CRITICAL
        4. If high coverage (>= moderate_threshold) -> CRITICAL
        5. If medium confidence or coverage -> MODERATE
        6. Otherwise -> SAFE
        
        Args:
            frame_shape: Shape of video frame (height, width, channels)
            bounding_boxes: List of fire bounding box dictionaries
        
        Returns:
            Tuple of (FireSeverity, SeverityMetrics)
        """
        try:
            # Compute metrics
            metrics = self.compute_metrics(frame_shape, bounding_boxes)
            
            # No fire detected
            if metrics.fire_count == 0:
                logger.debug("No fires detected -> SAFE")
                return FireSeverity.SAFE, metrics
            
            # Multiple fires detected - CRITICAL
            if metrics.fire_count >= self.multiple_fires_threshold:
                logger.info(f"Multiple fires detected ({metrics.fire_count}) -> CRITICAL")
                return FireSeverity.CRITICAL, metrics
            
            # High confidence fire - CRITICAL
            if metrics.max_confidence >= self.moderate_confidence:
                logger.info(f"High confidence fire ({metrics.max_confidence:.2f}) -> CRITICAL")
                return FireSeverity.CRITICAL, metrics
            
            # Large fire coverage - CRITICAL
            if metrics.frame_coverage >= self.moderate_coverage:
                logger.info(f"Large fire coverage ({metrics.frame_coverage:.1f}%) -> CRITICAL")
                return FireSeverity.CRITICAL, metrics
            
            # Medium confidence - MODERATE
            if metrics.max_confidence >= self.safe_confidence:
                logger.info(f"Medium confidence fire ({metrics.max_confidence:.2f}) -> MODERATE")
                return FireSeverity.MODERATE, metrics
            
            # Medium coverage - MODERATE
            if metrics.frame_coverage >= self.safe_coverage:
                logger.info(f"Medium fire coverage ({metrics.frame_coverage:.1f}%) -> MODERATE")
                return FireSeverity.MODERATE, metrics
            
            # Small, low confidence fire - SAFE
            logger.info(f"Small fire (coverage: {metrics.frame_coverage:.1f}%, "
                       f"confidence: {metrics.max_confidence:.2f}) -> SAFE")
            return FireSeverity.SAFE, metrics
            
        except Exception as e:
            logger.error(f"Error in severity classification: {e}", exc_info=True)
            # On error, return MODERATE as safe default (allows extraction but not critical alert)
            return FireSeverity.MODERATE, SeverityMetrics(0, 0.0, 0.0, 0.0, 0.0, 0.0)
    
    def should_extract_frames(self, severity: FireSeverity) -> bool:
        """Determine if frame extraction should be triggered for given severity.
        
        Args:
            severity: FireSeverity classification
        
        Returns:
            True if frames should be extracted (MODERATE or CRITICAL), False otherwise (SAFE)
        """
        extract = severity in (FireSeverity.MODERATE, FireSeverity.CRITICAL)
        
        if extract:
            logger.info(f"Frame extraction ENABLED for {severity.value} severity")
        else:
            logger.debug(f"Frame extraction DISABLED for {severity.value} severity")
        
        return extract
