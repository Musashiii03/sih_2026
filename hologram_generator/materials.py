"""
Material library for 3D hologram generation
Defines PBR materials for all scene elements
"""

from dataclasses import dataclass
from typing import Tuple, Optional
import numpy as np


@dataclass
class GLBMaterial:
    """
    GLB/glTF 2.0 compatible material definition
    Uses PBR (Physically-Based Rendering) workflow
    """
    name: str
    base_color_rgb: Tuple[int, int, int]  # RGB values 0-255
    alpha: float = 1.0  # Transparency: 0.0 (transparent) to 1.0 (opaque)
    emissive_rgb: Optional[Tuple[int, int, int]] = None  # Emissive color 0-255
    emissive_strength: float = 0.0  # Emissive intensity multiplier
    metallic: float = 0.0  # Metallic: 0.0 (dielectric) to 1.0 (metal)
    roughness: float = 0.5  # Roughness: 0.0 (smooth) to 1.0 (rough)
    double_sided: bool = False  # Render both sides of faces
    
    def to_trimesh_material(self):
        """Convert to trimesh-compatible material object"""
        import trimesh
        
        # Normalize RGB to 0-1 range
        base_color = [c / 255.0 for c in self.base_color_rgb]
        
        # Create PBRMaterial
        material = trimesh.visual.material.PBRMaterial(
            name=self.name,
            baseColorFactor=base_color + [self.alpha],
            metallicFactor=self.metallic,
            roughnessFactor=self.roughness,
            doubleSided=self.double_sided,
        )
        
        # Add emissive if present
        if self.emissive_rgb:
            emissive = [c / 255.0 * self.emissive_strength for c in self.emissive_rgb]
            material.emissiveFactor = emissive
        
        return material
    
    def to_color_rgba(self) -> np.ndarray:
        """Convert to RGBA array for trimesh (0-255 range)"""
        return np.array([*self.base_color_rgb, int(self.alpha * 255)], dtype=np.uint8)


# ============================================================================
# MATERIAL LIBRARY
# ============================================================================

class MaterialLibrary:
    """Predefined materials for hologram scene elements"""
    
    # Room structure
    ROOM_WIREFRAME = GLBMaterial(
        name="room_wireframe",
        base_color_rgb=(0, 100, 200),  # Blue
        alpha=0.3,
        emissive_rgb=(0, 50, 100),
        emissive_strength=0.2,
        metallic=0.1,
        roughness=0.8,
        double_sided=True
    )
    
    ROOM_EDGE = GLBMaterial(
        name="room_edge",
        base_color_rgb=(255, 255, 255),  # White edges
        alpha=0.8,
        emissive_rgb=(200, 200, 200),
        emissive_strength=0.5,
        metallic=0.0,
        roughness=0.3,
        double_sided=True
    )
    
    # Fire materials
    FIRE_SOURCE = GLBMaterial(
        name="fire_source",
        base_color_rgb=(255, 0, 0),  # Red
        alpha=1.0,
        emissive_rgb=(255, 100, 0),  # Bright orange-red
        emissive_strength=2.0,
        metallic=0.0,
        roughness=0.1,
        double_sided=True
    )
    
    FIRE_SPREAD = GLBMaterial(
        name="fire_spread",
        base_color_rgb=(255, 100, 0),  # Orange
        alpha=1.0,
        emissive_rgb=(255, 80, 0),
        emissive_strength=1.5,
        metallic=0.0,
        roughness=0.2,
        double_sided=True
    )
    
    # Smoke material
    SMOKE = GLBMaterial(
        name="smoke",
        base_color_rgb=(150, 150, 150),  # Gray
        alpha=0.4,
        emissive_rgb=(120, 80, 40),  # Dark orange tint
        emissive_strength=0.3,
        metallic=0.0,
        roughness=0.9,
        double_sided=True
    )
    
    # Person materials
    PERSON_STATIONARY = GLBMaterial(
        name="person_stationary",
        base_color_rgb=(255, 255, 0),  # Yellow
        alpha=1.0,
        emissive_rgb=(255, 200, 0),
        emissive_strength=1.0,
        metallic=0.0,
        roughness=0.4,
        double_sided=False
    )
    
    PERSON_MOVING = GLBMaterial(
        name="person_moving",
        base_color_rgb=(0, 255, 255),  # Cyan
        alpha=1.0,
        emissive_rgb=(0, 255, 255),
        emissive_strength=1.2,
        metallic=0.0,
        roughness=0.4,
        double_sided=False
    )
    
    # Motion trail
    MOTION_TRAIL_STATIONARY = GLBMaterial(
        name="motion_trail_stationary",
        base_color_rgb=(255, 255, 0),  # Yellow
        alpha=0.6,
        emissive_rgb=(255, 200, 0),
        emissive_strength=0.5,
        metallic=0.0,
        roughness=0.5,
        double_sided=True
    )
    
    MOTION_TRAIL_MOVING = GLBMaterial(
        name="motion_trail_moving",
        base_color_rgb=(0, 255, 255),  # Cyan
        alpha=0.6,
        emissive_rgb=(0, 255, 255),
        emissive_strength=0.5,
        metallic=0.0,
        roughness=0.5,
        double_sided=True
    )
    
    # Furniture/objects
    FURNITURE = GLBMaterial(
        name="furniture",
        base_color_rgb=(70, 130, 180),  # Steel blue
        alpha=0.6,
        emissive_rgb=(50, 90, 130),
        emissive_strength=0.2,
        metallic=0.6,
        roughness=0.4,
        double_sided=False
    )
    
    FURNITURE_EDGE = GLBMaterial(
        name="furniture_edge",
        base_color_rgb=(100, 160, 210),  # Lighter steel blue
        alpha=0.8,
        emissive_rgb=(80, 120, 160),
        emissive_strength=0.3,
        metallic=0.3,
        roughness=0.5,
        double_sided=True
    )
    
    # Ventilation elements
    DOOR = GLBMaterial(
        name="door",
        base_color_rgb=(200, 200, 200),  # Light gray
        alpha=0.3,
        emissive_rgb=(150, 150, 150),
        emissive_strength=0.1,
        metallic=0.2,
        roughness=0.6,
        double_sided=True
    )
    
    WINDOW = GLBMaterial(
        name="window",
        base_color_rgb=(173, 216, 230),  # Light cyan
        alpha=0.5,
        emissive_rgb=(140, 190, 210),
        emissive_strength=0.2,
        metallic=0.1,
        roughness=0.2,
        double_sided=True
    )
    
    # Reference grid
    GRID = GLBMaterial(
        name="grid",
        base_color_rgb=(50, 50, 50),  # Dark gray
        alpha=0.2,
        emissive_rgb=(30, 30, 30),
        emissive_strength=0.1,
        metallic=0.0,
        roughness=0.8,
        double_sided=True
    )
    
    GRID_AXIS_X = GLBMaterial(
        name="grid_axis_x",
        base_color_rgb=(255, 0, 0),  # Red for X-axis
        alpha=0.4,
        emissive_rgb=(200, 0, 0),
        emissive_strength=0.3,
        metallic=0.0,
        roughness=0.5,
        double_sided=True
    )
    
    GRID_AXIS_Y = GLBMaterial(
        name="grid_axis_y",
        base_color_rgb=(0, 255, 0),  # Green for Y-axis
        alpha=0.4,
        emissive_rgb=(0, 200, 0),
        emissive_strength=0.3,
        metallic=0.0,
        roughness=0.5,
        double_sided=True
    )
    
    # Ground plane
    GROUND = GLBMaterial(
        name="ground",
        base_color_rgb=(40, 40, 40),  # Very dark gray
        alpha=0.1,
        emissive_rgb=(20, 20, 20),
        emissive_strength=0.05,
        metallic=0.0,
        roughness=0.9,
        double_sided=False
    )
    
    @classmethod
    def get_fire_spread_material(cls, intensity: float) -> GLBMaterial:
        """
        Generate fire spread material with intensity-based properties
        
        Args:
            intensity: Fire intensity from 0.0 to 1.0
        
        Returns:
            GLBMaterial with scaled emissive strength
        """
        # Scale color from orange to red based on intensity
        red = 255
        green = int(100 * (1.0 - intensity * 0.5))  # 100 -> 50 as intensity increases
        blue = 0
        
        return GLBMaterial(
            name=f"fire_spread_i{int(intensity*100)}",
            base_color_rgb=(red, green, blue),
            alpha=1.0,
            emissive_rgb=(red, green, blue),
            emissive_strength=1.0 + intensity * 1.0,  # 1.0 to 2.0
            metallic=0.0,
            roughness=0.2,
            double_sided=True
        )
    
    @classmethod
    def get_smoke_material(cls, density: float) -> GLBMaterial:
        """
        Generate smoke material with density-based transparency
        
        Args:
            density: Smoke density from 0.0 to 1.0
        
        Returns:
            GLBMaterial with scaled alpha
        """
        alpha = density * 0.4 + 0.1  # 0.1 to 0.5 range
        
        # Darker smoke as density increases
        gray_value = int(150 - density * 50)  # 150 -> 100
        
        return GLBMaterial(
            name=f"smoke_d{int(density*100)}",
            base_color_rgb=(gray_value, gray_value, gray_value),
            alpha=alpha,
            emissive_rgb=(120, 80, 40),
            emissive_strength=0.2 + density * 0.2,
            metallic=0.0,
            roughness=0.9,
            double_sided=True
        )
    
    @classmethod
    def get_all_materials(cls) -> dict:
        """
        Get all predefined materials as a dictionary
        
        Returns:
            Dictionary mapping material names to GLBMaterial objects
        """
        materials = {}
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, GLBMaterial):
                materials[attr.name] = attr
        return materials


def create_gradient_color(
    start_rgb: Tuple[int, int, int],
    end_rgb: Tuple[int, int, int],
    factor: float
) -> Tuple[int, int, int]:
    """
    Create a gradient color between two RGB values
    
    Args:
        start_rgb: Starting RGB color (0-255)
        end_rgb: Ending RGB color (0-255)
        factor: Interpolation factor 0.0-1.0
    
    Returns:
        Interpolated RGB color
    """
    r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * factor)
    g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * factor)
    b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * factor)
    return (r, g, b)
