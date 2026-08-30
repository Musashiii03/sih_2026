"""
3D Fire Detection Hologram Generator

Procedural GLB model generation from real-time fire detection data.
"""

__version__ = "1.0.0"
__author__ = "AtmaRakshak Team"

from .hologram_generator import HologramGenerator
from .models import DetectionData
from .exceptions import (
    HologramGenerationError,
    InvalidDetectionDataError,
    CoordinateOutOfBoundsError,
    MeshGenerationError,
    GLBExportError,
)

__all__ = [
    "HologramGenerator",
    "DetectionData",
    "HologramGenerationError",
    "InvalidDetectionDataError",
    "CoordinateOutOfBoundsError",
    "MeshGenerationError",
    "GLBExportError",
]
