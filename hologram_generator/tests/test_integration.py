"""
Integration tests for hologram generator
Tests the complete pipeline from JSON to GLB
"""

import pytest
import json
import tempfile
from pathlib import Path

from hologram_generator import HologramGenerator, DetectionData
from hologram_generator.exceptions import (
    HologramGenerationError,
    InvalidDetectionDataError,
    GLBExportError
)


class TestHologramGeneratorIntegration:
    """Integration tests for complete hologram generation"""
    
    @pytest.fixture
    def minimal_detection_data(self):
        """Minimal valid detection data"""
        return {
            "incident_id": "TEST_MINIMAL",
            "timestamp": "2025-08-30T10:00:00Z",
            "building": {
                "name": "Test Building",
                "floor": 1,
                "room_id": "101",
                "gps": {"latitude": 28.5355, "longitude": 77.3910}
            },
            "room_geometry": {
                "width_m": 4.0,
                "depth_m": 3.0,
                "height_m": 2.8
            },
            "fire": {
                "source": {
                    "x": 2.0,
                    "y": 1.5,
                    "z": 0.2,
                    "confidence": 0.88,
                    "severity": "active"
                },
                "spread": [],
                "estimated_area_m2": 0.5
            },
            "smoke": {
                "plume_center": {"x": 2.0, "y": 1.5, "z": 1.2},
                "extent_radius_m": 1.0,
                "density_0_to_1": 0.45,
                "spread_direction": {"x": 0.1, "y": 0.1, "z": 0.5},
                "coverage_region": []
            },
            "persons": [],
            "furniture": [],
            "ventilation": {"doors": [], "windows": []},
            "metadata": {
                "source_camera": "TEST_CAM",
                "detection_model": "TEST_MODEL",
                "processing_time_ms": 100
            }
        }
    
    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary directory for outputs"""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)
    
    def test_generate_from_dict(self, minimal_detection_data, temp_output_dir):
        """Test hologram generation from dictionary"""
        generator = HologramGenerator(verbose=False)
        output_path = temp_output_dir / "test_hologram.glb"
        
        result = generator.generate_from_dict(
            minimal_detection_data,
            output_path=str(output_path)
        )
        
        assert Path(result).exists()
        assert Path(result).suffix == '.glb'
        assert Path(result).stat().st_size > 0
    
    def test_generate_from_json_file(self, minimal_detection_data, temp_output_dir):
        """Test hologram generation from JSON file"""
        # Create temporary JSON file
        json_path = temp_output_dir / "test_data.json"
        with open(json_path, 'w') as f:
            json.dump(minimal_detection_data, f)
        
        generator = HologramGenerator(verbose=False)
        output_path = temp_output_dir / "test_hologram.glb"
        
        result = generator.generate_from_json(
            json_path,
            output_path=str(output_path)
        )
        
        assert Path(result).exists()
    
    def test_generate_with_auto_filename(self, minimal_detection_data, temp_output_dir):
        """Test hologram generation with auto-generated filename"""
        generator = HologramGenerator(verbose=False)
        
        # Change to temp directory for auto-generated file
        import os
        old_cwd = os.getcwd()
        os.chdir(temp_output_dir)
        
        try:
            result = generator.generate_from_dict(minimal_detection_data)
            assert Path(result).exists()
            assert "TEST_MINIMAL" in result
            assert result.endswith('.glb')
        finally:
            os.chdir(old_cwd)
    
    def test_invalid_json_file(self, temp_output_dir):
        """Test error handling for invalid JSON file"""
        json_path = temp_output_dir / "invalid.json"
        with open(json_path, 'w') as f:
            f.write("{ invalid json }")
        
        generator = HologramGenerator(verbose=False)
        
        with pytest.raises(InvalidDetectionDataError):
            generator.generate_from_json(json_path)
    
    def test_missing_json_file(self):
        """Test error handling for missing JSON file"""
        generator = HologramGenerator(verbose=False)
        
        with pytest.raises(InvalidDetectionDataError):
            generator.generate_from_json("nonexistent.json")
    
    def test_scene_statistics(self, minimal_detection_data):
        """Test scene statistics generation"""
        generator = HologramGenerator(verbose=False)
        
        with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as tmp:
            output_path = tmp.name
        
        try:
            generator.generate_from_dict(minimal_detection_data, output_path=output_path)
            
            stats = generator.get_scene_stats()
            
            assert 'mesh_count' in stats
            assert 'total_vertices' in stats
            assert 'total_faces' in stats
            assert 'incident_id' in stats
            assert stats['incident_id'] == "TEST_MINIMAL"
            assert stats['mesh_count'] > 0
        finally:
            Path(output_path).unlink(missing_ok=True)
    
    def test_glb_file_format(self, minimal_detection_data, temp_output_dir):
        """Test GLB file has correct format"""
        generator = HologramGenerator(verbose=False)
        output_path = temp_output_dir / "test.glb"
        
        generator.generate_from_dict(minimal_detection_data, output_path=str(output_path))
        
        # Check GLB magic bytes
        with open(output_path, 'rb') as f:
            magic = f.read(4)
            assert magic == b'glTF'
    
    def test_generate_with_all_elements(self, temp_output_dir):
        """Test generation with all scene elements"""
        full_data = {
            "incident_id": "TEST_FULL",
            "timestamp": "2025-08-30T10:00:00Z",
            "building": {
                "name": "Test Building",
                "floor": 1,
                "room_id": "101",
                "gps": {"latitude": 28.5355, "longitude": 77.3910}
            },
            "room_geometry": {
                "width_m": 5.0,
                "depth_m": 4.0,
                "height_m": 3.0
            },
            "fire": {
                "source": {
                    "x": 2.5,
                    "y": 2.0,
                    "z": 0.3,
                    "confidence": 0.95,
                    "severity": "active"
                },
                "spread": [
                    {"x": 2.6, "y": 2.1, "z": 0.4, "intensity": 0.8, "age_seconds": 5}
                ],
                "estimated_area_m2": 1.0
            },
            "smoke": {
                "plume_center": {"x": 2.5, "y": 2.0, "z": 1.5},
                "extent_radius_m": 1.5,
                "density_0_to_1": 0.65,
                "spread_direction": {"x": 0.1, "y": 0.1, "z": 0.5},
                "coverage_region": []
            },
            "persons": [
                {
                    "person_id": "P_001",
                    "x": 1.0,
                    "y": 3.0,
                    "z": 1.7,
                    "state": "moving",
                    "motion_trail": [
                        {"x": 0.8, "y": 2.8, "z": 1.7},
                        {"x": 1.0, "y": 3.0, "z": 1.7}
                    ],
                    "confidence": 0.92
                }
            ],
            "furniture": [
                {
                    "object_id": "OBJ_001",
                    "type": "table",
                    "x": 3.0,
                    "y": 2.5,
                    "z": 0.4,
                    "width_m": 1.0,
                    "depth_m": 0.6,
                    "height_m": 0.8,
                    "confidence": 0.85,
                    "material": "generic"
                }
            ],
            "ventilation": {
                "doors": [
                    {
                        "position": "north",
                        "x": 2.5,
                        "y": 4.0,
                        "z": 0.0,
                        "width": 0.9,
                        "height": 2.1,
                        "state": "closed"
                    }
                ],
                "windows": [
                    {
                        "position": "east",
                        "x": 5.0,
                        "y": 2.0,
                        "z": 1.2,
                        "width": 1.0,
                        "height": 1.0
                    }
                ]
            },
            "metadata": {
                "source_camera": "TEST_CAM",
                "detection_model": "TEST_MODEL",
                "processing_time_ms": 250
            }
        }
        
        generator = HologramGenerator(verbose=False)
        output_path = temp_output_dir / "full_hologram.glb"
        
        result = generator.generate_from_dict(full_data, output_path=str(output_path))
        
        assert Path(result).exists()
        
        stats = generator.get_scene_stats()
        assert stats['mesh_count'] >= 8  # room, fire, spread, smoke, person, trail, furniture, door, window, grid, ground
    
    def test_no_data_loaded_error(self):
        """Test error when generating without loading data"""
        generator = HologramGenerator(verbose=False)
        
        with pytest.raises(HologramGenerationError):
            generator.generate()
