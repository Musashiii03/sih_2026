"""
Mesh generation utilities for hologram scene elements
Creates 3D geometry for room, fire, smoke, persons, furniture, etc.
"""

import numpy as np
import trimesh
from typing import List, Tuple, Optional
from .models import (
    RoomGeometry, FireSource, FireSpread, SmokePlume,
    Person, Furniture, Door, Window, Point3D
)
from .materials import GLBMaterial, MaterialLibrary
from .exceptions import MeshGenerationError


class MeshGenerators:
    """Collection of mesh generation methods for hologram elements"""
    
    @staticmethod
    def create_room_wireframe(room: RoomGeometry, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create wireframe box representing room boundaries
        
        Args:
            room: Room geometry data
            material: Material for wireframe
        
        Returns:
            Trimesh object representing room wireframe
        """
        try:
            # Define the 8 corners of the room
            vertices = np.array([
                [0, 0, 0],  # 0: bottom-left-front
                [room.width_m, 0, 0],  # 1: bottom-right-front
                [room.width_m, room.depth_m, 0],  # 2: bottom-right-back
                [0, room.depth_m, 0],  # 3: bottom-left-back
                [0, 0, room.height_m],  # 4: top-left-front
                [room.width_m, 0, room.height_m],  # 5: top-right-front
                [room.width_m, room.depth_m, room.height_m],  # 6: top-right-back
                [0, room.depth_m, room.height_m],  # 7: top-left-back
            ])
            
            # Define edges (12 edges for a box)
            edges = np.array([
                # Bottom edges
                [0, 1], [1, 2], [2, 3], [3, 0],
                # Top edges
                [4, 5], [5, 6], [6, 7], [7, 4],
                # Vertical edges
                [0, 4], [1, 5], [2, 6], [3, 7],
            ])
            
            # Create line segments as thin cylinders
            meshes = []
            line_radius = 0.002  # 2mm radius
            
            for edge in edges:
                start = vertices[edge[0]]
                end = vertices[edge[1]]
                
                # Create cylinder between points
                direction = end - start
                length = np.linalg.norm(direction)
                
                if length > 0:
                    cylinder = trimesh.creation.cylinder(
                        radius=line_radius,
                        height=length,
                        sections=8
                    )
                    
                    # Calculate rotation and translation
                    cylinder_axis = np.array([0, 0, 1])
                    edge_axis = direction / length
                    
                    # Rotation to align cylinder with edge
                    rotation_axis = np.cross(cylinder_axis, edge_axis)
                    if np.linalg.norm(rotation_axis) > 1e-6:
                        rotation_axis = rotation_axis / np.linalg.norm(rotation_axis)
                        angle = np.arccos(np.clip(np.dot(cylinder_axis, edge_axis), -1, 1))
                        rotation_matrix = trimesh.transformations.rotation_matrix(
                            angle, rotation_axis, point=[0, 0, 0]
                        )
                        cylinder.apply_transform(rotation_matrix)
                    
                    # Translation to position
                    center = (start + end) / 2
                    cylinder.apply_translation(center)
                    
                    meshes.append(cylinder)
            
            # Combine all edge meshes
            if meshes:
                wireframe = trimesh.util.concatenate(meshes)
                wireframe.visual.material = material.to_trimesh_material()
                return wireframe
            else:
                raise MeshGenerationError("Failed to create room wireframe edges")
                
        except Exception as e:
            raise MeshGenerationError(f"Room wireframe generation failed: {str(e)}")
    
    @staticmethod
    def create_fire_source(fire: FireSource, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create fire source sphere with emissive material
        
        Args:
            fire: Fire source data
            material: Fire material
        
        Returns:
            Trimesh sphere at fire location
        """
        try:
            sphere = trimesh.creation.icosphere(
                subdivisions=3,
                radius=0.2  # 0.2m radius
            )
            
            # Position at fire location
            sphere.apply_translation([fire.x, fire.y, fire.z])
            
            # Apply material
            sphere.visual.material = material.to_trimesh_material()
            
            return sphere
            
        except Exception as e:
            raise MeshGenerationError(f"Fire source generation failed: {str(e)}")
    
    @staticmethod
    def create_fire_spread(spread: FireSpread, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create fire spread point sphere
        
        Args:
            spread: Fire spread data
            material: Fire spread material (intensity-based)
        
        Returns:
            Trimesh sphere at spread location
        """
        try:
            # Radius based on intensity: 0.1m to 0.15m
            radius = 0.1 + spread.intensity * 0.05
            
            sphere = trimesh.creation.icosphere(
                subdivisions=2,
                radius=radius
            )
            
            # Position at spread location
            sphere.apply_translation([spread.x, spread.y, spread.z])
            
            # Apply material
            sphere.visual.material = material.to_trimesh_material()
            
            return sphere
            
        except Exception as e:
            raise MeshGenerationError(f"Fire spread generation failed: {str(e)}")
    
    @staticmethod
    def create_smoke_plume(smoke: SmokePlume, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create smoke volume as semi-transparent sphere
        
        Args:
            smoke: Smoke plume data
            material: Smoke material (density-based)
        
        Returns:
            Trimesh sphere representing smoke volume
        """
        try:
            sphere = trimesh.creation.icosphere(
                subdivisions=2,
                radius=smoke.extent_radius_m
            )
            
            # Position at plume center
            center = smoke.plume_center
            sphere.apply_translation([center.x, center.y, center.z])
            
            # Apply material with transparency
            sphere.visual.material = material.to_trimesh_material()
            
            return sphere
            
        except Exception as e:
            raise MeshGenerationError(f"Smoke plume generation failed: {str(e)}")
    
    @staticmethod
    def create_person_capsule(person: Person, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create person representation as capsule (cylinder + hemispheres)
        
        Args:
            person: Person detection data
            material: Person material (state-based color)
        
        Returns:
            Trimesh capsule at person location
        """
        try:
            radius = 0.15  # 0.15m shoulder width
            body_height = 1.5  # 1.5m body
            
            # Create cylinder for body
            cylinder = trimesh.creation.cylinder(
                radius=radius,
                height=body_height,
                sections=8
            )
            
            # Create hemisphere for head (top)
            head = trimesh.creation.icosphere(
                subdivisions=2,
                radius=radius
            )
            head.apply_translation([0, 0, body_height / 2])
            
            # Combine body and head
            capsule = trimesh.util.concatenate([cylinder, head])
            
            # Position so z coordinate represents head top (z=1.7m for standing person)
            # Person.z is head position, so translate down by (body_height/2 + radius)
            offset_z = person.z - (body_height / 2 + radius)
            capsule.apply_translation([person.x, person.y, offset_z])
            
            # Apply material
            capsule.visual.material = material.to_trimesh_material()
            
            return capsule
            
        except Exception as e:
            raise MeshGenerationError(f"Person capsule generation failed: {str(e)}")
    
    @staticmethod
    def create_motion_trail(
        trail: List[Point3D],
        material: GLBMaterial,
        line_radius: float = 0.002
    ) -> Optional[trimesh.Trimesh]:
        """
        Create motion trail as connected line segments
        
        Args:
            trail: List of motion trail points
            material: Trail material
            line_radius: Radius of line cylinders (meters)
        
        Returns:
            Trimesh representing motion trail or None if trail too short
        """
        if len(trail) < 2:
            return None
        
        try:
            meshes = []
            
            for i in range(len(trail) - 1):
                start = np.array([trail[i].x, trail[i].y, trail[i].z])
                end = np.array([trail[i + 1].x, trail[i + 1].y, trail[i + 1].z])
                
                direction = end - start
                length = np.linalg.norm(direction)
                
                if length > 1e-6:  # Only create if points are different
                    cylinder = trimesh.creation.cylinder(
                        radius=line_radius,
                        height=length,
                        sections=6
                    )
                    
                    # Align and position
                    cylinder_axis = np.array([0, 0, 1])
                    edge_axis = direction / length
                    
                    rotation_axis = np.cross(cylinder_axis, edge_axis)
                    if np.linalg.norm(rotation_axis) > 1e-6:
                        rotation_axis = rotation_axis / np.linalg.norm(rotation_axis)
                        angle = np.arccos(np.clip(np.dot(cylinder_axis, edge_axis), -1, 1))
                        rotation_matrix = trimesh.transformations.rotation_matrix(
                            angle, rotation_axis, point=[0, 0, 0]
                        )
                        cylinder.apply_transform(rotation_matrix)
                    
                    center = (start + end) / 2
                    cylinder.apply_translation(center)
                    
                    meshes.append(cylinder)
            
            if meshes:
                trail_mesh = trimesh.util.concatenate(meshes)
                trail_mesh.visual.material = material.to_trimesh_material()
                return trail_mesh
            
            return None
            
        except Exception as e:
            raise MeshGenerationError(f"Motion trail generation failed: {str(e)}")
    
    @staticmethod
    def create_furniture_box(furniture: Furniture, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create furniture as axis-aligned bounding box
        
        Args:
            furniture: Furniture detection data
            material: Furniture material
        
        Returns:
            Trimesh box at furniture location
        """
        try:
            box = trimesh.creation.box(
                extents=[furniture.width_m, furniture.depth_m, furniture.height_m]
            )
            
            # Position at furniture center
            box.apply_translation([furniture.x, furniture.y, furniture.z])
            
            # Apply material
            box.visual.material = material.to_trimesh_material()
            
            return box
            
        except Exception as e:
            raise MeshGenerationError(f"Furniture box generation failed: {str(e)}")
    
    @staticmethod
    def create_door(door: Door, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create door as rectangular plane
        
        Args:
            door: Door detection data
            material: Door material
        
        Returns:
            Trimesh plane at door location
        """
        try:
            # Create vertical rectangle
            vertices = np.array([
                [-door.width / 2, 0, 0],
                [door.width / 2, 0, 0],
                [door.width / 2, 0, door.height],
                [-door.width / 2, 0, door.height],
            ])
            
            faces = np.array([
                [0, 1, 2],
                [0, 2, 3],
            ])
            
            plane = trimesh.Trimesh(vertices=vertices, faces=faces)
            
            # Position door
            plane.apply_translation([door.x, door.y, door.z])
            
            # Apply material
            plane.visual.material = material.to_trimesh_material()
            
            return plane
            
        except Exception as e:
            raise MeshGenerationError(f"Door generation failed: {str(e)}")
    
    @staticmethod
    def create_window(window: Window, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create window as rectangular plane
        
        Args:
            window: Window detection data
            material: Window material
        
        Returns:
            Trimesh plane at window location
        """
        try:
            # Create vertical rectangle
            vertices = np.array([
                [-window.width / 2, 0, 0],
                [window.width / 2, 0, 0],
                [window.width / 2, 0, window.height],
                [-window.width / 2, 0, window.height],
            ])
            
            faces = np.array([
                [0, 1, 2],
                [0, 2, 3],
            ])
            
            plane = trimesh.Trimesh(vertices=vertices, faces=faces)
            
            # Position window
            plane.apply_translation([window.x, window.y, window.z])
            
            # Apply material
            plane.visual.material = material.to_trimesh_material()
            
            return plane
            
        except Exception as e:
            raise MeshGenerationError(f"Window generation failed: {str(e)}")
    
    @staticmethod
    def create_reference_grid(
        room: RoomGeometry,
        grid_spacing: float = 1.0,
        material: GLBMaterial = None
    ) -> trimesh.Trimesh:
        """
        Create reference grid at floor level (z=0)
        
        Args:
            room: Room geometry
            grid_spacing: Grid spacing in meters
            material: Grid material
        
        Returns:
            Trimesh lines representing grid
        """
        if material is None:
            material = MaterialLibrary.GRID
        
        try:
            meshes = []
            line_radius = 0.001  # 1mm radius
            
            # Create grid lines parallel to X-axis
            y = 0
            while y <= room.depth_m:
                start = np.array([0, y, 0])
                end = np.array([room.width_m, y, 0])
                
                direction = end - start
                length = np.linalg.norm(direction)
                
                if length > 0:
                    cylinder = trimesh.creation.cylinder(
                        radius=line_radius,
                        height=length,
                        sections=6
                    )
                    
                    # Rotate to align with X-axis
                    rotation = trimesh.transformations.rotation_matrix(
                        np.pi / 2, [0, 1, 0]
                    )
                    cylinder.apply_transform(rotation)
                    
                    # Translate to position
                    center = (start + end) / 2
                    cylinder.apply_translation(center)
                    
                    meshes.append(cylinder)
                
                y += grid_spacing
            
            # Create grid lines parallel to Y-axis
            x = 0
            while x <= room.width_m:
                start = np.array([x, 0, 0])
                end = np.array([x, room.depth_m, 0])
                
                direction = end - start
                length = np.linalg.norm(direction)
                
                if length > 0:
                    cylinder = trimesh.creation.cylinder(
                        radius=line_radius,
                        height=length,
                        sections=6
                    )
                    
                    # Rotate to align with Y-axis
                    rotation = trimesh.transformations.rotation_matrix(
                        np.pi / 2, [1, 0, 0]
                    )
                    cylinder.apply_transform(rotation)
                    
                    # Translate to position
                    center = (start + end) / 2
                    cylinder.apply_translation(center)
                    
                    meshes.append(cylinder)
                
                x += grid_spacing
            
            if meshes:
                grid = trimesh.util.concatenate(meshes)
                grid.visual.material = material.to_trimesh_material()
                return grid
            else:
                raise MeshGenerationError("Failed to create reference grid")
                
        except Exception as e:
            raise MeshGenerationError(f"Reference grid generation failed: {str(e)}")
    
    @staticmethod
    def create_ground_plane(room: RoomGeometry, material: GLBMaterial) -> trimesh.Trimesh:
        """
        Create ground plane at z=0
        
        Args:
            room: Room geometry
            material: Ground material
        
        Returns:
            Trimesh plane at floor level
        """
        try:
            vertices = np.array([
                [0, 0, 0],
                [room.width_m, 0, 0],
                [room.width_m, room.depth_m, 0],
                [0, room.depth_m, 0],
            ])
            
            faces = np.array([
                [0, 1, 2],
                [0, 2, 3],
            ])
            
            plane = trimesh.Trimesh(vertices=vertices, faces=faces)
            
            # Apply material
            plane.visual.material = material.to_trimesh_material()
            
            return plane
            
        except Exception as e:
            raise MeshGenerationError(f"Ground plane generation failed: {str(e)}")


def validate_mesh(mesh: trimesh.Trimesh, name: str = "mesh") -> dict:
    """
    Validate mesh integrity and return statistics
    
    Args:
        mesh: Trimesh to validate
        name: Name for logging
    
    Returns:
        Dictionary with validation results and statistics
    """
    stats = {
        "name": name,
        "vertices": len(mesh.vertices),
        "faces": len(mesh.faces),
        "is_watertight": mesh.is_watertight,
        "is_empty": mesh.is_empty,
        "bounds": mesh.bounds.tolist() if hasattr(mesh, 'bounds') else None,
        "volume": float(mesh.volume) if mesh.is_volume else 0.0,
    }
    
    return stats
