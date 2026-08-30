"""
Utility functions for hologram generation
"""

from typing import Tuple, List
import numpy as np
from pathlib import Path
import json


def normalize_rgb(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    """
    Normalize RGB values from 0-255 to 0-1 range
    
    Args:
        rgb: RGB tuple (0-255)
    
    Returns:
        Normalized RGB tuple (0-1)
    """
    return tuple(c / 255.0 for c in rgb)


def denormalize_rgb(rgb: Tuple[float, float, float]) -> Tuple[int, int, int]:
    """
    Denormalize RGB values from 0-1 to 0-255 range
    
    Args:
        rgb: RGB tuple (0-1)
    
    Returns:
        Denormalized RGB tuple (0-255)
    """
    return tuple(int(c * 255) for c in rgb)


def calculate_distance_3d(
    point1: Tuple[float, float, float],
    point2: Tuple[float, float, float]
) -> float:
    """
    Calculate Euclidean distance between two 3D points
    
    Args:
        point1: First point (x, y, z)
        point2: Second point (x, y, z)
    
    Returns:
        Distance in same units as input
    """
    return np.sqrt(sum((p1 - p2) ** 2 for p1, p2 in zip(point1, point2)))


def interpolate_points(
    start: Tuple[float, float, float],
    end: Tuple[float, float, float],
    num_points: int
) -> List[Tuple[float, float, float]]:
    """
    Interpolate points between start and end
    
    Args:
        start: Start point (x, y, z)
        end: End point (x, y, z)
        num_points: Number of interpolated points
    
    Returns:
        List of interpolated points
    """
    points = []
    for i in range(num_points):
        t = i / (num_points - 1) if num_points > 1 else 0
        point = tuple(s + (e - s) * t for s, e in zip(start, end))
        points.append(point)
    return points


def validate_json_file(json_path: str) -> bool:
    """
    Validate JSON file is readable and parseable
    
    Args:
        json_path: Path to JSON file
    
    Returns:
        True if valid, False otherwise
    """
    try:
        with open(json_path, 'r') as f:
            json.load(f)
        return True
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return False


def ensure_directory(directory: str) -> Path:
    """
    Ensure directory exists, create if it doesn't
    
    Args:
        directory: Directory path
    
    Returns:
        Path object
    """
    dir_path = Path(directory)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: Size in bytes
    
    Returns:
        Formatted string (e.g., "2.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def clamp(value: float, min_val: float, max_val: float) -> float:
    """
    Clamp value between min and max
    
    Args:
        value: Value to clamp
        min_val: Minimum value
        max_val: Maximum value
    
    Returns:
        Clamped value
    """
    return max(min_val, min(value, max_val))


def lerp(start: float, end: float, t: float) -> float:
    """
    Linear interpolation between start and end
    
    Args:
        start: Start value
        end: End value
        t: Interpolation factor (0-1)
    
    Returns:
        Interpolated value
    """
    return start + (end - start) * t
