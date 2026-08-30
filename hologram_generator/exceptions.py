"""
Custom exceptions for hologram generation
"""


class HologramGenerationError(Exception):
    """Base exception for hologram generation"""
    pass


class InvalidDetectionDataError(HologramGenerationError):
    """Invalid input JSON schema"""
    pass


class CoordinateOutOfBoundsError(HologramGenerationError):
    """Detected object outside room geometry"""
    pass


class MeshGenerationError(HologramGenerationError):
    """Failed to create 3D geometry"""
    pass


class GLBExportError(HologramGenerationError):
    """Failed to write GLB file"""
    pass
