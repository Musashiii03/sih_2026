"""
Storage Manager Module

Responsible for persisting extracted frames and metadata to disk.
Creates organized directory structures and JSON metadata files for fire incidents.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import json
import cv2
import numpy as np
import logging

try:
    from .extractor import Frame, BBox
    from .config import FrameExtractionConfig
except ImportError:
    # Fallback for direct script execution
    from extractor import Frame, BBox
    from config import FrameExtractionConfig


# Configure logging for storage module
logger = logging.getLogger('frame_extraction.storage')
logger.setLevel(logging.INFO)


@dataclass
class FrameMetadata:
    """Metadata for a single saved frame."""
    frame_index: int              # Sequential frame index
    timestamp: float              # Unix timestamp (seconds since epoch)
    confidence: float             # Fire detection confidence [0.0, 1.0]
    bounding_boxes: List[Dict[str, Any]]  # Fire bounding box data
    image_path: str               # Absolute path to image file
    metadata_path: str            # Absolute path to metadata JSON file
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary for JSON serialization."""
        return {
            'frame_index': self.frame_index,
            'timestamp': self.timestamp,
            'timestamp_readable': datetime.fromtimestamp(self.timestamp).isoformat() + 'Z',
            'confidence': self.confidence,
            'bounding_boxes': self.bounding_boxes,
            'image_path': self.image_path,
            'metadata_path': self.metadata_path
        }


@dataclass
class IncidentSummary:
    """Summary information for a fire incident."""
    incident_id: str              # Unique incident identifier (INC-YYYYMMDD-HHMMSS)
    timestamp: float              # Incident start timestamp (Unix)
    frame_count: int              # Number of frames saved
    frames: List[FrameMetadata]   # List of frame metadata
    incident_path: Path           # Directory path to incident
    camera_id: Optional[str] = None         # Camera identifier (optional)
    location: Optional[str] = None          # Location description (optional)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert summary to dictionary for JSON serialization."""
        return {
            'incident_id': self.incident_id,
            'timestamp': self.timestamp,
            'timestamp_readable': datetime.fromtimestamp(self.timestamp).isoformat() + 'Z',
            'camera_id': self.camera_id,
            'location': self.location,
            'frame_count': self.frame_count,
            'frames': [frame.to_dict() for frame in self.frames]
        }


class StorageManager:
    """Manages persistent storage of frames and metadata.
    
    This class handles writing frame images to disk, creating metadata JSON files,
    and organizing files in a structured directory hierarchy by date and incident ID.
    """
    
    def __init__(self, base_path: Optional[str] = None):
        """Initialize the StorageManager.
        
        Args:
            base_path: Root directory for frame storage. If None, uses config default.
                      Example: "data/fire_incidents"
        
        Requirements: 3.1
        """
        # Use provided path or fall back to configuration
        if base_path is None:
            self.base_path = FrameExtractionConfig.STORAGE_PATH
        else:
            self.base_path = Path(base_path)
        
        # Use image quality from configuration
        self.image_quality = FrameExtractionConfig.IMAGE_QUALITY
        
        logger.info(f"StorageManager initialized: base_path={self.base_path}, image_quality={self.image_quality}%")
    
    def ensure_directory_exists(self, path: Path) -> bool:
        """Creates directory and all parent directories if they don't exist.
        
        This method implements the requirement for automatic directory creation
        before writing files. It handles permission errors gracefully by logging
        and returning False.
        
        Args:
            path: Directory path to create
        
        Returns:
            True if directory exists or was created successfully, False on error
            
        Requirements: 3.6, 4.2
        """
        try:
            # Create directory with all parents, don't error if it already exists
            path.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Directory ensured: {path}")
            return True
            
        except PermissionError as e:
            # Permission denied - log error and return False
            logger.error(f"Permission denied creating directory {path}: {e}")
            return False
            
        except Exception as e:
            # Other filesystem errors
            logger.error(f"Failed to create directory {path}: {e}", exc_info=True)
            return False
    
    def save_frame_image(self, frame: Frame, file_path: Path) -> bool:
        """Writes frame image to disk as JPEG.
        
        This method saves the frame's image data as a JPEG file with the configured
        quality setting. It handles errors gracefully to ensure that a single frame
        write failure doesn't abort the entire save operation.
        
        Args:
            frame: Frame object containing image data
            file_path: Absolute path where image should be saved (including .jpg extension)
        
        Returns:
            True if image written successfully, False on error
            
        Requirements: 3.1, 4.2
        """
        try:
            # Validate frame has image data
            if not isinstance(frame.image, np.ndarray):
                logger.error(f"Invalid frame image type: {type(frame.image)}")
                return False
            
            # Write image using OpenCV with JPEG format and configured quality
            # cv2.imwrite returns True on success, False on failure
            success = cv2.imwrite(
                str(file_path),
                frame.image,
                [cv2.IMWRITE_JPEG_QUALITY, self.image_quality]
            )
            
            if success:
                logger.debug(f"Saved frame image: {file_path}")
            else:
                logger.error(f"cv2.imwrite failed for {file_path}")
            
            return success
            
        except Exception as e:
            # Catch all errors (disk full, I/O errors, etc.)
            # Requirement 4.2: Log error and continue with remaining frames
            logger.error(f"Error saving frame image to {file_path}: {e}", exc_info=True)
            return False
    
    def save_frame_metadata(self, frame: Frame, file_path: Path, image_path: Path) -> bool:
        """Writes frame metadata to JSON file.
        
        Creates a JSON file containing all frame metadata including timestamp,
        confidence score, bounding boxes, and path to the image file. The JSON
        is formatted with indentation for human readability.
        
        Args:
            frame: Frame object containing metadata
            file_path: Absolute path where JSON should be saved (including .json extension)
            image_path: Absolute path to the saved image file (for reference in JSON)
        
        Returns:
            True if metadata written successfully, False on error
            
        Requirements: 3.3, 3.4, 4.2
        """
        try:
            # Construct metadata dictionary with all required fields
            # Requirement 3.4: Include frame_index, timestamp, confidence, bounding_boxes, image_path
            metadata = {
                'frame_index': frame.frame_index,
                'timestamp': frame.timestamp,
                'timestamp_readable': datetime.fromtimestamp(frame.timestamp).isoformat() + 'Z',
                'confidence': frame.confidence,
                'bounding_boxes': [bbox.to_dict() for bbox in frame.bounding_boxes],
                'image_path': str(image_path.absolute())
            }
            
            # Write JSON with indentation for readability
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Saved frame metadata: {file_path}")
            return True
            
        except (TypeError, ValueError) as e:
            # JSON serialization errors
            logger.error(f"JSON serialization error for {file_path}: {e}", exc_info=True)
            return False
            
        except Exception as e:
            # File I/O errors
            # Requirement 4.2: Log error and continue with remaining frames
            logger.error(f"Error saving frame metadata to {file_path}: {e}", exc_info=True)
            return False
    
    def generate_summary(self, frames: List[Frame], incident_id: str, 
                        frame_metadata_list: List[FrameMetadata],
                        timestamp: float,
                        camera_id: Optional[str] = None,
                        location: Optional[str] = None) -> Dict[str, Any]:
        """Creates incident summary dictionary for JSON serialization.
        
        Generates a complete summary of the fire incident including metadata
        for all saved frames. This summary is written to summary.json and
        used by the API to retrieve incident information.
        
        Args:
            frames: List of Frame objects that were saved
            incident_id: Unique incident identifier
            frame_metadata_list: List of FrameMetadata objects for saved frames
            timestamp: Incident start timestamp (Unix)
            camera_id: Optional camera identifier
            location: Optional location description
        
        Returns:
            Dictionary ready for JSON serialization
            
        Requirements: 3.5
        """
        try:
            # Construct summary with all required fields
            # Requirement 3.5: Include incident_id, timestamp, frame_count, frames array
            summary = {
                'incident_id': incident_id,
                'timestamp': timestamp,
                'timestamp_readable': datetime.fromtimestamp(timestamp).isoformat() + 'Z',
                'camera_id': camera_id,
                'location': location,
                'frame_count': len(frame_metadata_list),
                'frames': [metadata.to_dict() for metadata in frame_metadata_list]
            }
            
            logger.debug(f"Generated summary for incident {incident_id} with {len(frame_metadata_list)} frames")
            return summary
            
        except Exception as e:
            # Handle any serialization errors
            logger.error(f"Error generating summary for {incident_id}: {e}", exc_info=True)
            # Return minimal valid summary
            return {
                'incident_id': incident_id,
                'timestamp': timestamp,
                'frame_count': 0,
                'frames': [],
                'error': str(e)
            }
    
    def save_incident(self, frames: List[Frame], incident_id: str,
                     timestamp: Optional[float] = None,
                     camera_id: Optional[str] = None,
                     location: Optional[str] = None) -> IncidentSummary:
        """Saves all frames and metadata for a fire incident.
        
        This is the main entry point for persisting a complete fire incident.
        It orchestrates the entire save pipeline:
        1. Creates directory structure: {base_path}/{YYYY-MM-DD}/{incident_id}/frames/ and /metadata/
        2. Saves each frame image as JPEG
        3. Saves each frame metadata as JSON
        4. Writes summary.json at incident root
        5. Returns IncidentSummary object
        
        The method implements comprehensive error handling to ensure that failures
        saving individual frames don't abort the entire operation.
        
        Args:
            frames: List of Frame objects to save
            incident_id: Unique incident identifier (e.g., "INC-20250115-143022")
            timestamp: Incident start timestamp (Unix). If None, uses first frame timestamp.
            camera_id: Optional camera identifier for metadata
            location: Optional location description for metadata
        
        Returns:
            IncidentSummary object with paths to all saved files and success status
            
        Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 4.2
        """
        # Validate inputs
        if not frames:
            logger.warning(f"save_incident called with empty frames list for {incident_id}")
            # Return empty summary for empty incident
            return IncidentSummary(
                incident_id=incident_id,
                timestamp=timestamp or datetime.now().timestamp(),
                frame_count=0,
                frames=[],
                incident_path=self.base_path / 'empty',
                camera_id=camera_id,
                location=location
            )
        
        # Use provided timestamp or extract from first frame
        if timestamp is None:
            timestamp = frames[0].timestamp
        
        # Create directory structure: {base_path}/{YYYY-MM-DD}/{incident_id}/
        # Requirement 3.2: Directory structure by date and incident ID
        date_str = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
        incident_path = self.base_path / date_str / incident_id
        frames_dir = incident_path / 'frames'
        metadata_dir = incident_path / 'metadata'
        
        logger.info(f"Saving incident {incident_id} with {len(frames)} frames to {incident_path}")
        
        # Ensure all directories exist
        # Requirement 3.6: Create parent directories if they don't exist
        if not self.ensure_directory_exists(frames_dir):
            logger.error(f"Failed to create frames directory: {frames_dir}")
            # Continue anyway - attempt to write files
        
        if not self.ensure_directory_exists(metadata_dir):
            logger.error(f"Failed to create metadata directory: {metadata_dir}")
            # Continue anyway - attempt to write files
        
        # Save each frame and collect metadata
        saved_frames_metadata: List[FrameMetadata] = []
        success_count = 0
        failure_count = 0
        
        for frame in frames:
            try:
                # Generate file paths
                frame_filename = f"frame_{frame.frame_index:03d}"
                image_path = frames_dir / f"{frame_filename}.jpg"
                metadata_path = metadata_dir / f"{frame_filename}.json"
                
                # Save frame image
                # Requirement 3.1: Write frame images as JPEG
                image_saved = self.save_frame_image(frame, image_path)
                
                # Save frame metadata
                # Requirement 3.3: Create corresponding metadata JSON file
                metadata_saved = self.save_frame_metadata(frame, metadata_path, image_path)
                
                if image_saved and metadata_saved:
                    # Both saved successfully - add to metadata list
                    frame_metadata = FrameMetadata(
                        frame_index=frame.frame_index,
                        timestamp=frame.timestamp,
                        confidence=frame.confidence,
                        bounding_boxes=[bbox.to_dict() for bbox in frame.bounding_boxes],
                        image_path=str(image_path.absolute()),
                        metadata_path=str(metadata_path.absolute())
                    )
                    saved_frames_metadata.append(frame_metadata)
                    success_count += 1
                    logger.debug(f"Successfully saved frame {frame.frame_index}")
                else:
                    # Partial or complete failure for this frame
                    failure_count += 1
                    logger.warning(f"Failed to save frame {frame.frame_index} (image: {image_saved}, metadata: {metadata_saved})")
                    # Requirement 4.2: Continue attempting to write subsequent frames
                    
            except Exception as e:
                # Unexpected error processing this frame
                # Requirement 4.2: Log error and continue with remaining frames
                failure_count += 1
                logger.error(f"Error processing frame {frame.frame_index}: {e}", exc_info=True)
                continue
        
        # Generate and save incident summary
        # Requirement 3.5: Write summary.json with all frame metadata
        summary_dict = self.generate_summary(
            frames=frames,
            incident_id=incident_id,
            frame_metadata_list=saved_frames_metadata,
            timestamp=timestamp,
            camera_id=camera_id,
            location=location
        )
        
        summary_path = incident_path / 'summary.json'
        try:
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(summary_dict, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved incident summary: {summary_path}")
        except Exception as e:
            logger.error(f"Failed to save incident summary to {summary_path}: {e}", exc_info=True)
            # Continue - summary write failure doesn't invalidate saved frames
        
        # Log final statistics
        logger.info(f"Incident {incident_id} save complete: {success_count} frames saved, {failure_count} failures")
        
        # Return incident summary
        return IncidentSummary(
            incident_id=incident_id,
            timestamp=timestamp,
            frame_count=len(saved_frames_metadata),
            frames=saved_frames_metadata,
            incident_path=incident_path,
            camera_id=camera_id,
            location=location
        )
