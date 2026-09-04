"""
Frame Extractor Module

Responsible for extracting frames from video when fire is detected.
Frame extraction is triggered only for moderate or critical severity fires.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import logging
import time

from .severity_classifier import FireSeverity, FireSeverityClassifier, SeverityMetrics


# Configure logging for frame extraction module
logger = logging.getLogger('frame_extraction.extractor')
logger.setLevel(logging.INFO)


@dataclass
class BBox:
    """Data class representing a bounding box for fire detection."""
    x: int          # Top-left x coordinate
    y: int          # Top-left y coordinate
    width: int      # Bounding box width
    height: int     # Bounding box height
    confidence: float  # Detection confidence score [0.0, 1.0]

    def to_dict(self) -> Dict[str, Any]:
        """Convert bounding box to dictionary for JSON serialization."""
        return {
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'confidence': self.confidence
        }


@dataclass
class Frame:
    """Data class representing an extracted frame with metadata."""
    image: np.ndarray              # Frame image data (numpy array)
    timestamp: float               # Unix timestamp (seconds since epoch)
    confidence: float              # Fire detection confidence score [0.0, 1.0]
    bounding_boxes: List[BBox]     # List of fire bounding boxes
    frame_index: int               # Sequential frame number in extraction window

    def __post_init__(self):
        """Validate frame data after initialization."""
        if self.confidence < 0.0 or self.confidence > 1.0:
            raise ValueError(f"Confidence must be between 0.0 and 1.0, got {self.confidence}")
        
        if self.timestamp < 0:
            raise ValueError(f"Timestamp must be non-negative, got {self.timestamp}")
        
        if self.frame_index < 0:
            raise ValueError(f"Frame index must be non-negative, got {self.frame_index}")
        
        if not isinstance(self.image, np.ndarray):
            raise TypeError(f"Image must be numpy ndarray, got {type(self.image)}")
    
    def get_metadata_dict(self) -> Dict[str, Any]:
        """Get frame metadata as dictionary (excludes image data)."""
        return {
            'frame_index': self.frame_index,
            'timestamp': self.timestamp,
            'confidence': self.confidence,
            'bounding_boxes': [bbox.to_dict() for bbox in self.bounding_boxes]
        }


class FrameExtractor:
    """Extracts frames during fire detection events.
    
    This class monitors fire detection events from the YOLOv8 model and extracts
    frames at a configurable sample rate during a defined time window.
    
    Frame extraction is only triggered for fires classified as MODERATE or CRITICAL
    severity. SAFE fires are ignored to avoid unnecessary storage and processing.
    """
    
    def __init__(self, sample_rate: float = 3.0, window_duration: int = 30,
                 severity_classifier: Optional[FireSeverityClassifier] = None):
        """Initialize the FrameExtractor.
        
        Args:
            sample_rate: Frames per second to extract (must be between 2.0 and 5.0)
            window_duration: Extraction window duration in seconds (must be between 30 and 60)
            severity_classifier: Optional FireSeverityClassifier instance. If None, creates default.
            
        Raises:
            ValueError: If sample_rate or window_duration are outside valid ranges
        """
        # Validate parameters against requirements
        if not (2.0 <= sample_rate <= 5.0):
            raise ValueError(f"sample_rate must be between 2.0 and 5.0 FPS, got {sample_rate}")
        
        if not (30 <= window_duration <= 60):
            raise ValueError(f"window_duration must be between 30 and 60 seconds, got {window_duration}")
        
        # Configuration
        self.sample_rate = sample_rate
        self.window_duration = window_duration
        
        # Initialize severity classifier
        self.severity_classifier = severity_classifier if severity_classifier else FireSeverityClassifier()
        
        # Extraction state tracking
        self.extraction_active = False
        self.extraction_start_time: Optional[float] = None
        self.extracted_frames: List[Frame] = []
        self.last_extract_time: float = 0
        self.current_frame_index: int = 0
        
        # Severity tracking
        self.current_severity: Optional[FireSeverity] = None
        self.current_metrics: Optional[SeverityMetrics] = None
        
        logger.info(f"FrameExtractor initialized: sample_rate={sample_rate} FPS, window_duration={window_duration}s")
        logger.info("Frame extraction enabled only for MODERATE and CRITICAL severity fires")
    
    def on_fire_detected(self, timestamp: float, frame: np.ndarray, 
                        confidence: float, bounding_boxes: List[Dict[str, Any]]) -> Tuple[bool, Optional[FireSeverity]]:
        """Triggered when fire is detected. Classifies severity and starts extraction window if appropriate.
        
        This method is called by the fire detection pipeline when fire is first detected.
        It classifies the fire severity and only initializes the extraction window for
        MODERATE or CRITICAL fires. SAFE fires are logged but do not trigger extraction.
        
        Args:
            timestamp: Unix timestamp of fire detection event (seconds since epoch)
            frame: Video frame as numpy array
            confidence: Fire detection confidence score [0.0, 1.0]
            bounding_boxes: List of fire bounding box dictionaries with keys:
                           x, y, width, height, confidence
        
        Returns:
            Tuple of (extraction_started: bool, severity: FireSeverity or None)
            extraction_started is True if extraction window was initiated
        
        Requirements: 1.1, 1.3, 4.1, Severity Classification
        """
        try:
            # Validate inputs
            if timestamp < 0:
                logger.warning(f"Invalid timestamp {timestamp}, using current time")
                timestamp = time.time()
            
            if not isinstance(frame, np.ndarray):
                logger.error(f"Invalid frame type: {type(frame)}, expected np.ndarray")
                return False, None
            
            if not (0.0 <= confidence <= 1.0):
                logger.warning(f"Invalid confidence {confidence}, clamping to [0.0, 1.0]")
                confidence = max(0.0, min(1.0, confidence))
            
            # Classify fire severity
            severity, metrics = self.severity_classifier.classify(frame.shape, bounding_boxes)
            
            # Store current severity and metrics
            self.current_severity = severity
            self.current_metrics = metrics
            
            logger.info(f"Fire detected - Severity: {severity.value.upper()}")
            logger.info(f"  Metrics: {metrics.fire_count} fire(s), "
                       f"coverage: {metrics.frame_coverage:.2f}%, "
                       f"confidence: {metrics.max_confidence:.2f}")
            
            # Check if extraction should be triggered based on severity
            should_extract = self.severity_classifier.should_extract_frames(severity)
            
            if not should_extract:
                logger.info(f"Fire severity is {severity.value} - Frame extraction SKIPPED")
                return False, severity
            
            # Start extraction window for MODERATE or CRITICAL fires
            if not self.extraction_active:
                self.extraction_active = True
                self.extraction_start_time = timestamp
                self.extracted_frames = []
                self.last_extract_time = 0
                self.current_frame_index = 0
                
                logger.info(f"Fire severity is {severity.value} - Starting frame extraction at timestamp {timestamp}")
                logger.info(f"Extraction window: {self.window_duration}s at {self.sample_rate} FPS")
                return True, severity
            
            return False, severity
            
        except Exception as e:
            # Error handling requirement 4.1: Log error and continue without raising exception
            logger.error(f"Error in on_fire_detected: {e}", exc_info=True)
            return False, None
    
    def should_extract_frame(self, current_time: float) -> bool:
        """Determines if a frame should be extracted based on sample rate timing.
        
        This method checks if enough time has elapsed since the last extracted frame
        based on the configured sample rate. The interval between frames is calculated
        as 1/sample_rate seconds.
        
        Args:
            current_time: Current timestamp (Unix timestamp in seconds)
        
        Returns:
            True if a frame should be extracted, False otherwise
            
        Requirements: 1.2
        """
        # Not extracting if window is not active
        if not self.extraction_active:
            return False
        
        # Calculate required interval between frames (in seconds)
        frame_interval = 1.0 / self.sample_rate
        
        # Check if enough time has elapsed since last extraction
        time_since_last_extract = current_time - self.last_extract_time
        
        # Extract if interval has elapsed
        if time_since_last_extract >= frame_interval:
            return True
        
        return False
    
    def extract_frame(self, frame: np.ndarray, timestamp: float,
                     confidence: float, bounding_boxes: List[Dict[str, Any]]) -> None:
        """Extracts a single frame with metadata.
        
        This method creates a Frame object with the provided image data and metadata,
        then appends it to the extracted_frames list. It handles errors gracefully
        to ensure extraction failures don't crash the detection pipeline.
        
        Args:
            frame: Video frame as numpy array
            timestamp: Unix timestamp of frame capture (seconds since epoch)
            confidence: Fire detection confidence score [0.0, 1.0]
            bounding_boxes: List of fire bounding box dictionaries with keys:
                           x, y, width, height, confidence
        
        Requirements: 1.6, 4.1
        """
        try:
            # Validate frame data
            if not isinstance(frame, np.ndarray):
                logger.error(f"Invalid frame type: {type(frame)}, expected np.ndarray")
                return
            
            # Create a copy of the frame to avoid reference issues
            try:
                frame_copy = frame.copy()
            except Exception as e:
                logger.error(f"Failed to copy frame: {e}", exc_info=True)
                return
            
            # Validate and clamp confidence to [0.0, 1.0]
            if not (0.0 <= confidence <= 1.0):
                logger.warning(f"Invalid confidence {confidence}, clamping to [0.0, 1.0]")
                confidence = max(0.0, min(1.0, confidence))
            
            # Validate timestamp
            if timestamp < 0:
                logger.warning(f"Invalid timestamp {timestamp}, using current time")
                timestamp = time.time()
            
            # Parse bounding boxes into BBox objects
            bbox_objects = []
            for bbox_dict in bounding_boxes:
                try:
                    bbox = BBox(
                        x=int(bbox_dict.get('x', 0)),
                        y=int(bbox_dict.get('y', 0)),
                        width=int(bbox_dict.get('width', 0)),
                        height=int(bbox_dict.get('height', 0)),
                        confidence=float(bbox_dict.get('confidence', confidence))
                    )
                    bbox_objects.append(bbox)
                except (ValueError, TypeError, KeyError) as e:
                    logger.warning(f"Failed to parse bounding box {bbox_dict}: {e}")
                    continue
            
            # Create Frame object
            try:
                frame_obj = Frame(
                    image=frame_copy,
                    timestamp=timestamp,
                    confidence=confidence,
                    bounding_boxes=bbox_objects,
                    frame_index=self.current_frame_index
                )
                
                # Append to extracted frames list
                self.extracted_frames.append(frame_obj)
                
                # Update state
                self.last_extract_time = timestamp
                self.current_frame_index += 1
                
                logger.debug(f"Extracted frame {self.current_frame_index - 1} at timestamp {timestamp}")
                
            except (ValueError, TypeError) as e:
                logger.error(f"Failed to create Frame object: {e}", exc_info=True)
                return
                
        except Exception as e:
            # Requirement 4.1: Log error and continue without raising exception
            logger.error(f"Error in extract_frame: {e}", exc_info=True)
    
    def check_window_complete(self, current_time: float) -> bool:
        """Returns True if extraction window has elapsed.
        
        This method checks if the configured window duration has passed since
        the extraction started, or if the video stream has ended prematurely.
        
        Args:
            current_time: Current timestamp (Unix timestamp in seconds)
        
        Returns:
            True if window duration exceeded, False otherwise
            
        Requirements: 1.4, 4.4
        """
        # Not complete if not currently extracting
        if not self.extraction_active:
            return False
        
        # No start time set - shouldn't happen, but handle gracefully
        if self.extraction_start_time is None:
            logger.warning("check_window_complete called with no extraction_start_time")
            return False
        
        # Calculate elapsed time since extraction started
        elapsed_time = current_time - self.extraction_start_time
        
        # Window complete if duration exceeded
        if elapsed_time >= self.window_duration:
            logger.info(f"Extraction window complete: {elapsed_time:.2f}s elapsed (duration: {self.window_duration}s)")
            return True
        
        return False
    
    def get_extracted_frames(self) -> List[Frame]:
        """Returns all extracted frames and resets state.
        
        This method retrieves all frames extracted during the current window,
        resets the extractor state for the next fire detection event, and
        returns a copy of the extracted frames list.
        
        Returns:
            List of Frame objects extracted during the window
            
        Requirements: 1.4
        """
        # Create a copy of extracted frames to return
        frames_copy = self.extracted_frames.copy()
        
        # Log extraction summary with severity information
        severity_info = f" (Severity: {self.current_severity.value})" if self.current_severity else ""
        logger.info(f"Extraction complete: {len(frames_copy)} frames extracted over {self.window_duration}s window{severity_info}")
        
        # Reset extraction state
        self.extraction_active = False
        self.extraction_start_time = None
        self.extracted_frames = []
        self.last_extract_time = 0
        self.current_frame_index = 0
        self.current_severity = None
        self.current_metrics = None
        
        logger.debug("FrameExtractor state reset, ready for next fire detection event")
        
        return frames_copy
    
    def get_current_severity(self) -> Optional[FireSeverity]:
        """Returns the current fire severity classification.
        
        Returns:
            Current FireSeverity or None if no fire detected yet
        """
        return self.current_severity
    
    def get_current_metrics(self) -> Optional[SeverityMetrics]:
        """Returns the current severity metrics.
        
        Returns:
            Current SeverityMetrics or None if no fire detected yet
        """
        return self.current_metrics
