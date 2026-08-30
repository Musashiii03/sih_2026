"""
Unit tests for material library
"""

import pytest
import numpy as np

from hologram_generator.materials import (
    GLBMaterial,
    MaterialLibrary,
    create_gradient_color
)


class TestGLBMaterial:
    """Test GLBMaterial class"""
    
    def test_material_creation(self):
        """Test basic material creation"""
        material = GLBMaterial(
            name="test_material",
            base_color_rgb=(255, 0, 0),
            alpha=1.0,
            emissive_rgb=(200, 0, 0),
            emissive_strength=1.0
        )
        assert material.name == "test_material"
        assert material.base_color_rgb == (255, 0, 0)
        assert material.alpha == 1.0
    
    def test_to_trimesh_material(self):
        """Test conversion to trimesh material format"""
        material = GLBMaterial(
            name="test",
            base_color_rgb=(255, 128, 0),
            alpha=0.8,
            emissive_rgb=(255, 100, 0),
            emissive_strength=1.5,
            metallic=0.5,
            roughness=0.3
        )
        
        mat_obj = material.to_trimesh_material()
        
        assert mat_obj.name == "test"
        assert len(mat_obj.baseColorFactor) == 4
        assert mat_obj.baseColorFactor[0] == pytest.approx(1.0)  # 255/255
        assert mat_obj.baseColorFactor[1] == pytest.approx(128/255, rel=1e-2)
        assert mat_obj.baseColorFactor[3] == pytest.approx(0.8)  # alpha
        assert mat_obj.metallicFactor == 0.5
        assert mat_obj.roughnessFactor == 0.3
    
    def test_to_color_rgba(self):
        """Test conversion to RGBA array"""
        material = GLBMaterial(
            name="test",
            base_color_rgb=(255, 128, 64),
            alpha=0.5
        )
        
        rgba = material.to_color_rgba()
        
        assert rgba[0] == 255
        assert rgba[1] == 128
        assert rgba[2] == 64
        assert rgba[3] == 127  # 0.5 * 255


class TestMaterialLibrary:
    """Test predefined material library"""
    
    def test_fire_source_material(self):
        """Test fire source material properties"""
        material = MaterialLibrary.FIRE_SOURCE
        
        assert material.name == "fire_source"
        assert material.base_color_rgb == (255, 0, 0)  # Red
        assert material.emissive_strength == 2.0
        assert material.alpha == 1.0
    
    def test_smoke_material(self):
        """Test smoke material properties"""
        material = MaterialLibrary.SMOKE
        
        assert material.name == "smoke"
        assert material.alpha < 1.0  # Semi-transparent
        assert material.double_sided is True
    
    def test_person_materials(self):
        """Test person material variants"""
        stationary = MaterialLibrary.PERSON_STATIONARY
        moving = MaterialLibrary.PERSON_MOVING
        
        assert stationary.base_color_rgb == (255, 255, 0)  # Yellow
        assert moving.base_color_rgb == (0, 255, 255)  # Cyan
        assert stationary.alpha == 1.0
        assert moving.alpha == 1.0
    
    def test_get_fire_spread_material(self):
        """Test dynamic fire spread material generation"""
        low_intensity = MaterialLibrary.get_fire_spread_material(0.3)
        high_intensity = MaterialLibrary.get_fire_spread_material(0.9)
        
        assert low_intensity.emissive_strength < high_intensity.emissive_strength
        assert low_intensity.base_color_rgb[1] > high_intensity.base_color_rgb[1]  # More green in low
    
    def test_get_smoke_material(self):
        """Test dynamic smoke material generation"""
        low_density = MaterialLibrary.get_smoke_material(0.2)
        high_density = MaterialLibrary.get_smoke_material(0.8)
        
        assert low_density.alpha < high_density.alpha
        assert low_density.base_color_rgb[0] > high_density.base_color_rgb[0]  # Lighter gray
    
    def test_get_all_materials(self):
        """Test getting all predefined materials"""
        materials = MaterialLibrary.get_all_materials()
        
        assert isinstance(materials, dict)
        assert len(materials) > 0
        assert "fire_source" in materials
        assert "smoke" in materials
        assert isinstance(materials["fire_source"], GLBMaterial)


class TestGradientColor:
    """Test gradient color function"""
    
    def test_gradient_start(self):
        """Test gradient at start (factor=0)"""
        start = (255, 0, 0)
        end = (0, 255, 0)
        result = create_gradient_color(start, end, 0.0)
        
        assert result == start
    
    def test_gradient_end(self):
        """Test gradient at end (factor=1)"""
        start = (255, 0, 0)
        end = (0, 255, 0)
        result = create_gradient_color(start, end, 1.0)
        
        assert result == end
    
    def test_gradient_middle(self):
        """Test gradient at middle (factor=0.5)"""
        start = (255, 0, 0)
        end = (0, 255, 0)
        result = create_gradient_color(start, end, 0.5)
        
        # Should be approximately halfway
        assert result[0] == pytest.approx(127, abs=1)
        assert result[1] == pytest.approx(127, abs=1)
        assert result[2] == 0
