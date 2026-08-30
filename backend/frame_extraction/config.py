"""
Configuration for Frame Extraction System

This module provides centralized configuration management for the fire frame
extraction feature. It loads settings from environment variables with sensible
defaults and validates all configuration values on import to fail fast if
misconfigured.

Environment Variables:
    FRAME_SAMPLE_RATE: Frames per second to extract (2.0 - 5.0)
    FRAME_WINDOW_DURATION: Extraction window in seconds (30 - 60)
    FRAME_MIN_SELECTION: Minimum frames to select (6+)
    FRAME_MAX_SELECTION: Maximum frames to select (15 max)
    FRAME_SIMILARITY_THRESHOLD: SSIM threshold for similarity (0.0 - 1.0)
    FRAME_STORAGE_PATH: Root directory for frame storage
    FRAME_IMAGE_QUALITY: JPEG quality percentage (1 - 100)

Requirements Coverage:
    - 1.2: Sample rate configuration (2-5 FPS)
    - 1.5: Window duration configuration (30-60 seconds)
    - 2.5: Frame selection bounds (6-15 frames)
"""

import os
from pathlib import Path


class FrameExtractionConfig:
    """
    Configuration class for frame extraction system.
    
    Loads configuration from environment variables with validated defaults.
    All validation is performed on import to ensure configuration correctness
    before any extraction operations begin.
    """
    
    # Extraction settings
    SAMPLE_RATE = float(os.getenv('FRAME_SAMPLE_RATE', '3.0'))
    """Frames per second to extract during fire detection (2.0 - 5.0 FPS)"""
    
    WINDOW_DURATION = int(os.getenv('FRAME_WINDOW_DURATION', '30'))
    """Extraction window duration in seconds (30 - 60 seconds)"""
    
    # Selection settings
    MIN_FRAMES = int(os.getenv('FRAME_MIN_SELECTION', '6'))
    """Minimum number of frames to select per incident"""
    
    MAX_FRAMES = int(os.getenv('FRAME_MAX_SELECTION', '15'))
    """Maximum number of frames to select per incident"""
    
    SIMILARITY_THRESHOLD = float(os.getenv('FRAME_SIMILARITY_THRESHOLD', '0.85'))
    """SSIM threshold for considering frames similar (0.0 - 1.0)"""
    
    # Storage settings
    STORAGE_PATH = Path(os.getenv('FRAME_STORAGE_PATH', 'data/fire_incidents'))
    """Root directory path for storing fire incident frames"""
    
    IMAGE_QUALITY = int(os.getenv('FRAME_IMAGE_QUALITY', '90'))
    """JPEG image quality for saved frames (1 - 100)"""
    
    @classmethod
    def validate(cls):
        """
        Validates all configuration values against their constraints.
        
        This method is automatically called on module import to fail fast
        if any configuration values are invalid.
        
        Raises:
            AssertionError: If any configuration value is outside valid range
            
        Requirements:
            - 1.2: Validates sample rate is between 2.0 and 5.0 FPS
            - 1.5: Validates window duration is between 30 and 60 seconds
            - 2.5: Validates frame selection range is 6-15 frames
        """
        # Validate extraction settings (Requirement 1.2)
        assert 2.0 <= cls.SAMPLE_RATE <= 5.0, (
            f"SAMPLE_RATE must be between 2.0 and 5.0 FPS, got {cls.SAMPLE_RATE}"
        )
        
        # Validate window duration (Requirement 1.5)
        assert 30 <= cls.WINDOW_DURATION <= 60, (
            f"WINDOW_DURATION must be between 30 and 60 seconds, got {cls.WINDOW_DURATION}"
        )
        
        # Validate frame selection bounds (Requirement 2.5)
        assert 6 <= cls.MIN_FRAMES <= cls.MAX_FRAMES <= 15, (
            f"Frame selection range must be 6-15 with MIN_FRAMES <= MAX_FRAMES, "
            f"got MIN_FRAMES={cls.MIN_FRAMES}, MAX_FRAMES={cls.MAX_FRAMES}"
        )
        
        # Validate similarity threshold
        assert 0.0 <= cls.SIMILARITY_THRESHOLD <= 1.0, (
            f"SIMILARITY_THRESHOLD must be between 0.0 and 1.0, got {cls.SIMILARITY_THRESHOLD}"
        )
        
        # Validate image quality
        assert 1 <= cls.IMAGE_QUALITY <= 100, (
            f"IMAGE_QUALITY must be between 1 and 100, got {cls.IMAGE_QUALITY}"
        )
    
    @classmethod
    def get_summary(cls):
        """
        Returns a human-readable summary of current configuration.
        
        Returns:
            str: Formatted configuration summary
        """
        return f"""
Frame Extraction Configuration:
  Extraction Settings:
    - Sample Rate: {cls.SAMPLE_RATE} FPS
    - Window Duration: {cls.WINDOW_DURATION} seconds
  
  Selection Settings:
    - Frame Range: {cls.MIN_FRAMES}-{cls.MAX_FRAMES} frames
    - Similarity Threshold: {cls.SIMILARITY_THRESHOLD}
  
  Storage Settings:
    - Storage Path: {cls.STORAGE_PATH}
    - Image Quality: {cls.IMAGE_QUALITY}%
"""


# Validate configuration on module import
# This ensures that invalid configuration is caught immediately when the
# module is first imported, rather than during runtime operations
FrameExtractionConfig.validate()