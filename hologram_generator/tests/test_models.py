"""
Unit tests for Pydantic data models
"""

import pytest
from datetime import datetime
from pydantic import ValidationError

from hologram_generator.models import (
    GPSCoordinates,
    Building,
    Point3D,
    RoomGeometry,
    FireSource,
    FireSpread,
    Fire,
    SmokePlume,
    Person,
    Furniture,
    Door,
    Window,
    Ventilation,
    Metadata,
    DetectionData,
)
from hologram_generator.exceptions import CoordinateOutOfBoundsError


class TestGPSCoordinates:
    """Test GPS coordinate validation"""
    
    def test_valid_coordinates(self):
        """Test valid GPS coordinates"""
        gps = GPSCoordinates(latitude=28.5355, longitude=77.3910)
        assert gps.latitude == 28.5355
        assert gps.longitude == 77.3910
    
    def test_invalid_latitude(self):
        """Test invalid latitude values"""
        with pytest.raises(ValidationError):
            GPSCoordinates(latitude=91.0, longitude=77.3910)
        
        with pytest.raises(ValidationError):
            GPSCoordinates(latitude=-91.0, longitude=77.3910)
    
    def test_invalid_longitude(self):
        """Test invalid longitude values"""
        with pytest.raises(ValidationError):
            GPSCoordinates(latitude=28.5355, longitude=181.0)
        
        with pytest.raises(ValidationError):
            GPSCoordinates(latitude=28.5355, longitude=-181.0)


class TestRoomGeometry:
    """Test room geometry validation"""
    
    def test_valid_room(self):
        """Test valid room dimensions"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        assert room.width_m == 5.0
        assert room.depth_m == 4.0
        assert room.height_m == 3.0
        assert room.scale_unit == "meters"
    
    def test_negative_dimensions(self):
        """Test negative dimensions are rejected"""
        with pytest.raises(ValidationError):
            RoomGeometry(width_m=-5.0, depth_m=4.0, height_m=3.0)
        
        with pytest.raises(ValidationError):
            RoomGeometry(width_m=5.0, depth_m=0.0, height_m=3.0)


class TestFireModels:
    """Test fire-related models"""
    
    def test_fire_source(self):
        """Test fire source creation"""
        fire_src = FireSource(
            x=2.5,
            y=1.0,
            z=0.3,
            confidence=0.95,
            severity="active"
        )
        assert fire_src.x == 2.5
        assert fire_src.confidence == 0.95
    
    def test_fire_source_invalid_confidence(self):
        """Test confidence must be 0-1"""
        with pytest.raises(ValidationError):
            FireSource(x=2.5, y=1.0, z=0.3, confidence=1.5, severity="active")
    
    def test_fire_spread(self):
        """Test fire spread creation"""
        spread = FireSpread(x=2.6, y=1.1, z=0.4, intensity=0.8, age_seconds=5)
        assert spread.intensity == 0.8
        assert spread.age_seconds == 5


class TestPersonModels:
    """Test person detection models"""
    
    def test_person_stationary(self):
        """Test stationary person"""
        person = Person(
            person_id="P_001",
            x=1.0,
            y=2.0,
            z=1.7,
            state="stationary",
            motion_trail=[],
            confidence=0.92
        )
        assert person.state == "stationary"
        assert len(person.motion_trail) == 0
    
    def test_person_with_trail(self):
        """Test person with motion trail"""
        trail = [
            Point3D(x=1.0, y=2.0, z=1.7),
            Point3D(x=1.1, y=2.1, z=1.7),
        ]
        person = Person(
            person_id="P_002",
            x=1.1,
            y=2.1,
            z=1.7,
            state="moving",
            motion_trail=trail,
            confidence=0.89
        )
        assert len(person.motion_trail) == 2
        assert person.state == "moving"


class TestFurnitureModels:
    """Test furniture detection models"""
    
    def test_furniture(self):
        """Test furniture creation"""
        furniture = Furniture(
            object_id="OBJ_001",
            type="bed",
            x=1.5,
            y=1.0,
            z=0.25,
            width_m=1.6,
            depth_m=2.0,
            height_m=0.5,
            confidence=0.85,
            material="generic"
        )
        assert furniture.type == "bed"
        assert furniture.width_m == 1.6


class TestDetectionData:
    """Test complete detection data validation"""
    
    @pytest.fixture
    def valid_detection_data(self):
        """Fixture providing valid detection data"""
        return {
            "incident_id": "TEST_001",
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
                "spread": [],
                "estimated_area_m2": 0.5
            },
            "smoke": {
                "plume_center": {"x": 2.5, "y": 2.0, "z": 1.5},
                "extent_radius_m": 1.0,
                "density_0_to_1": 0.65,
                "spread_direction": {"x": 0.1, "y": 0.1, "z": 0.5},
                "coverage_region": []
            },
            "persons": [],
            "furniture": [],
            "ventilation": {
                "doors": [],
                "windows": []
            },
            "metadata": {
                "source_camera": "CCTV_TEST",
                "detection_model": "TEST_MODEL",
                "processing_time_ms": 100
            }
        }
    
    def test_valid_detection_data(self, valid_detection_data):
        """Test valid detection data is accepted"""
        data = DetectionData(**valid_detection_data)
        assert data.incident_id == "TEST_001"
        assert data.room_geometry.width_m == 5.0
    
    def test_fire_outside_room_bounds(self, valid_detection_data):
        """Test fire outside room bounds is rejected"""
        valid_detection_data["fire"]["source"]["x"] = 10.0  # Outside room
        
        with pytest.raises(CoordinateOutOfBoundsError):
            DetectionData(**valid_detection_data)
    
    def test_person_outside_room_bounds(self, valid_detection_data):
        """Test person outside room bounds is rejected"""
        valid_detection_data["persons"] = [{
            "person_id": "P_001",
            "x": 6.0,  # Outside room width (5.0)
            "y": 2.0,
            "z": 1.7,
            "state": "stationary",
            "motion_trail": [],
            "confidence": 0.9
        }]
        
        with pytest.raises(CoordinateOutOfBoundsError):
            DetectionData(**valid_detection_data)
    
    def test_furniture_outside_room_bounds(self, valid_detection_data):
        """Test furniture outside room bounds is rejected"""
        valid_detection_data["furniture"] = [{
            "object_id": "OBJ_001",
            "type": "bed",
            "x": 1.5,
            "y": 5.0,  # Outside room depth (4.0)
            "z": 0.5,
            "width_m": 1.0,
            "depth_m": 1.0,
            "height_m": 0.5,
            "confidence": 0.8,
            "material": "generic"
        }]
        
        with pytest.raises(CoordinateOutOfBoundsError):
            DetectionData(**valid_detection_data)
    
    def test_smoke_outside_room_bounds(self, valid_detection_data):
        """Test smoke outside room bounds is rejected"""
        valid_detection_data["smoke"]["plume_center"]["z"] = 5.0  # Outside height
        
        with pytest.raises(CoordinateOutOfBoundsError):
            DetectionData(**valid_detection_data)
    
    def test_missing_required_fields(self):
        """Test missing required fields are rejected"""
        with pytest.raises(ValidationError):
            DetectionData(incident_id="TEST", timestamp=datetime.now())
