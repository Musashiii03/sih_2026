"""
Unit tests for mesh generators
"""

import pytest
import numpy as np

from hologram_generator.models import (
    RoomGeometry,
    FireSource,
    FireSpread,
    SmokePlume,
    Person,
    Furniture,
    Door,
    Window,
    Point3D
)
from hologram_generator.materials import MaterialLibrary
from hologram_generator.mesh_generators import MeshGenerators, validate_mesh
from hologram_generator.exceptions import MeshGenerationError


class TestRoomGeneration:
    """Test room wireframe generation"""
    
    def test_create_room_wireframe(self):
        """Test room wireframe creation"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        material = MaterialLibrary.ROOM_WIREFRAME
        
        wireframe = MeshGenerators.create_room_wireframe(room, material)
        
        assert wireframe is not None
        assert len(wireframe.vertices) > 0
        assert len(wireframe.faces) > 0
    
    def test_room_dimensions(self):
        """Test room has correct dimensions"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        material = MaterialLibrary.ROOM_WIREFRAME
        
        wireframe = MeshGenerators.create_room_wireframe(room, material)
        bounds = wireframe.bounds
        
        # Check bounds are approximately correct (with some tolerance for line width)
        assert bounds[1][0] <= room.width_m + 0.1
        assert bounds[1][1] <= room.depth_m + 0.1
        assert bounds[1][2] <= room.height_m + 0.1


class TestFireGeneration:
    """Test fire mesh generation"""
    
    def test_create_fire_source(self):
        """Test fire source sphere creation"""
        fire = FireSource(x=2.5, y=2.0, z=0.3, confidence=0.95, severity="active")
        material = MaterialLibrary.FIRE_SOURCE
        
        sphere = MeshGenerators.create_fire_source(fire, material)
        
        assert sphere is not None
        assert len(sphere.vertices) > 0
        assert sphere.is_volume
    
    def test_fire_source_position(self):
        """Test fire source is at correct position"""
        fire = FireSource(x=2.5, y=2.0, z=0.3, confidence=0.95, severity="active")
        material = MaterialLibrary.FIRE_SOURCE
        
        sphere = MeshGenerators.create_fire_source(fire, material)
        centroid = sphere.centroid
        
        assert centroid[0] == pytest.approx(fire.x, abs=0.01)
        assert centroid[1] == pytest.approx(fire.y, abs=0.01)
        assert centroid[2] == pytest.approx(fire.z, abs=0.01)
    
    def test_create_fire_spread(self):
        """Test fire spread point creation"""
        spread = FireSpread(x=2.6, y=2.1, z=0.4, intensity=0.8, age_seconds=5)
        material = MaterialLibrary.FIRE_SPREAD
        
        sphere = MeshGenerators.create_fire_spread(spread, material)
        
        assert sphere is not None
        assert len(sphere.vertices) > 0


class TestSmokeGeneration:
    """Test smoke mesh generation"""
    
    def test_create_smoke_plume(self):
        """Test smoke plume creation"""
        smoke = SmokePlume(
            plume_center=Point3D(x=2.5, y=2.0, z=1.5),
            extent_radius_m=1.8,
            density_0_to_1=0.65,
            spread_direction=Point3D(x=0.1, y=0.1, z=0.5),
            coverage_region=[]
        )
        material = MaterialLibrary.SMOKE
        
        smoke_mesh = MeshGenerators.create_smoke_plume(smoke, material)
        
        assert smoke_mesh is not None
        assert len(smoke_mesh.vertices) > 0
    
    def test_smoke_radius(self):
        """Test smoke has correct radius"""
        smoke = SmokePlume(
            plume_center=Point3D(x=2.5, y=2.0, z=1.5),
            extent_radius_m=1.8,
            density_0_to_1=0.65,
            spread_direction=Point3D(x=0.1, y=0.1, z=0.5),
            coverage_region=[]
        )
        material = MaterialLibrary.SMOKE
        
        smoke_mesh = MeshGenerators.create_smoke_plume(smoke, material)
        
        # Check approximate radius (sphere extents)
        extents = smoke_mesh.extents
        avg_extent = np.mean(extents)
        expected_diameter = smoke.extent_radius_m * 2
        
        assert avg_extent == pytest.approx(expected_diameter, rel=0.1)


class TestPersonGeneration:
    """Test person mesh generation"""
    
    def test_create_person_capsule(self):
        """Test person capsule creation"""
        person = Person(
            person_id="P_001",
            x=1.0,
            y=2.0,
            z=1.7,
            state="stationary",
            motion_trail=[],
            confidence=0.92
        )
        material = MaterialLibrary.PERSON_STATIONARY
        
        capsule = MeshGenerators.create_person_capsule(person, material)
        
        assert capsule is not None
        assert len(capsule.vertices) > 0
        assert capsule.is_volume
    
    def test_person_height(self):
        """Test person capsule height is approximately correct"""
        person = Person(
            person_id="P_001",
            x=1.0,
            y=2.0,
            z=1.7,
            state="stationary",
            motion_trail=[],
            confidence=0.92
        )
        material = MaterialLibrary.PERSON_STATIONARY
        
        capsule = MeshGenerators.create_person_capsule(person, material)
        
        # Check height (z extent)
        z_extent = capsule.bounds[1][2] - capsule.bounds[0][2]
        assert z_extent == pytest.approx(1.7, rel=0.2)  # Allow 20% tolerance
    
    def test_create_motion_trail(self):
        """Test motion trail creation"""
        trail = [
            Point3D(x=1.0, y=2.0, z=1.7),
            Point3D(x=1.1, y=2.1, z=1.7),
            Point3D(x=1.2, y=2.2, z=1.7),
        ]
        material = MaterialLibrary.MOTION_TRAIL_MOVING
        
        trail_mesh = MeshGenerators.create_motion_trail(trail, material)
        
        assert trail_mesh is not None
        assert len(trail_mesh.vertices) > 0
    
    def test_motion_trail_too_short(self):
        """Test motion trail with single point returns None"""
        trail = [Point3D(x=1.0, y=2.0, z=1.7)]
        material = MaterialLibrary.MOTION_TRAIL_MOVING
        
        trail_mesh = MeshGenerators.create_motion_trail(trail, material)
        
        assert trail_mesh is None


class TestFurnitureGeneration:
    """Test furniture mesh generation"""
    
    def test_create_furniture_box(self):
        """Test furniture box creation"""
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
        material = MaterialLibrary.FURNITURE
        
        box = MeshGenerators.create_furniture_box(furniture, material)
        
        assert box is not None
        assert len(box.vertices) > 0
        assert box.is_volume
    
    def test_furniture_dimensions(self):
        """Test furniture has correct dimensions"""
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
        material = MaterialLibrary.FURNITURE
        
        box = MeshGenerators.create_furniture_box(furniture, material)
        extents = box.extents
        
        assert extents[0] == pytest.approx(furniture.width_m, abs=0.01)
        assert extents[1] == pytest.approx(furniture.depth_m, abs=0.01)
        assert extents[2] == pytest.approx(furniture.height_m, abs=0.01)


class TestVentilationGeneration:
    """Test door and window generation"""
    
    def test_create_door(self):
        """Test door plane creation"""
        door = Door(
            position="north",
            x=2.5,
            y=4.0,
            z=0.0,
            width=0.9,
            height=2.1,
            state="closed"
        )
        material = MaterialLibrary.DOOR
        
        door_mesh = MeshGenerators.create_door(door, material)
        
        assert door_mesh is not None
        assert len(door_mesh.vertices) > 0
        assert len(door_mesh.faces) > 0
    
    def test_create_window(self):
        """Test window plane creation"""
        window = Window(
            position="east",
            x=5.0,
            y=2.0,
            z=1.2,
            width=1.0,
            height=1.0
        )
        material = MaterialLibrary.WINDOW
        
        window_mesh = MeshGenerators.create_window(window, material)
        
        assert window_mesh is not None
        assert len(window_mesh.vertices) > 0


class TestGridGeneration:
    """Test reference grid generation"""
    
    def test_create_reference_grid(self):
        """Test reference grid creation"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        
        grid = MeshGenerators.create_reference_grid(room, grid_spacing=1.0)
        
        assert grid is not None
        assert len(grid.vertices) > 0
    
    def test_create_ground_plane(self):
        """Test ground plane creation"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        material = MaterialLibrary.GROUND
        
        plane = MeshGenerators.create_ground_plane(room, material)
        
        assert plane is not None
        assert len(plane.vertices) == 4  # Rectangle has 4 vertices
        assert len(plane.faces) == 2  # Rectangle has 2 triangular faces


class TestMeshValidation:
    """Test mesh validation function"""
    
    def test_validate_mesh(self):
        """Test mesh validation returns statistics"""
        room = RoomGeometry(width_m=5.0, depth_m=4.0, height_m=3.0)
        material = MaterialLibrary.GROUND
        
        plane = MeshGenerators.create_ground_plane(room, material)
        stats = validate_mesh(plane, "test_mesh")
        
        assert stats['name'] == "test_mesh"
        assert stats['vertices'] == 4
        assert stats['faces'] == 2
        assert 'is_watertight' in stats
        assert 'bounds' in stats
