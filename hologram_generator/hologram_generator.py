"""
Main HologramGenerator class for 3D fire detection hologram generation
Assembles all scene elements and exports to GLB format
"""

import json
import time
from pathlib import Path
from datetime import datetime
from typing import Union, Dict, List, Optional
import trimesh
from loguru import logger

from .models import DetectionData
from .materials import MaterialLibrary
from .mesh_generators import MeshGenerators, validate_mesh
from .exceptions import (
    HologramGenerationError,
    InvalidDetectionDataError,
    MeshGenerationError,
    GLBExportError
)


class HologramGenerator:
    """
    Main class for generating 3D hologram scenes from fire detection data
    """
    
    def __init__(self, verbose: bool = False):
        """
        Initialize hologram generator
        
        Args:
            verbose: Enable verbose logging
        """
        self.verbose = verbose
        self.meshes: List[trimesh.Trimesh] = []
        self.scene: Optional[trimesh.Scene] = None
        self.detection_data: Optional[DetectionData] = None
        
        # Configure logger
        if verbose:
            logger.add(
                "hologram_generation.log",
                format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {message}",
                level="DEBUG",
                rotation="500 MB",
                retention="7 days"
            )
        
        logger.info("HologramGenerator initialized")
    
    def generate_from_dict(
        self,
        data: Dict,
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate hologram from dictionary data
        
        Args:
            data: Detection data as dictionary
            output_path: Output GLB file path (optional)
        
        Returns:
            Path to generated GLB file
        """
        logger.info("Loading detection data from dictionary")
        
        try:
            # Validate and parse data
            self.detection_data = DetectionData(**data)
            logger.info(f"Detection data validated: Incident {self.detection_data.incident_id}")
        except Exception as e:
            logger.error(f"Data validation failed: {str(e)}")
            raise InvalidDetectionDataError(f"Invalid detection data: {str(e)}")
        
        return self.generate(output_path)
    
    def generate_from_json(
        self,
        json_path: Union[str, Path],
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate hologram from JSON file
        
        Args:
            json_path: Path to JSON detection data file
            output_path: Output GLB file path (optional)
        
        Returns:
            Path to generated GLB file
        """
        logger.info(f"Loading detection data from {json_path}")
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            return self.generate_from_dict(data, output_path)
        except FileNotFoundError:
            raise InvalidDetectionDataError(f"File not found: {json_path}")
        except json.JSONDecodeError as e:
            raise InvalidDetectionDataError(f"Invalid JSON: {str(e)}")
    
    def generate(self, output_path: Optional[str] = None) -> str:
        """
        Generate hologram from loaded detection data
        
        Args:
            output_path: Output GLB file path (optional)
        
        Returns:
            Path to generated GLB file
        """
        if self.detection_data is None:
            raise HologramGenerationError("No detection data loaded")
        
        start_time = time.time()
        logger.info(f"Starting hologram generation for incident {self.detection_data.incident_id}")
        
        try:
            # Step 1: Initialize scene
            self._initialize_scene()
            
            # Step 2: Generate room geometry
            self._generate_room_geometry()
            
            # Step 3: Generate fire geometry
            self._generate_fire_geometry()
            
            # Step 4: Generate smoke volume
            self._generate_smoke_geometry()
            
            # Step 5: Generate person geometries
            self._generate_person_geometries()
            
            # Step 6: Generate furniture meshes
            self._generate_furniture_meshes()
            
            # Step 7: Add ventilation elements
            self._generate_ventilation_elements()
            
            # Step 8: Add reference grid
            self._generate_reference_grid()
            
            # Step 9: Add ground plane
            self._generate_ground_plane()
            
            # Step 10: Validate and optimize
            self._validate_scene()
            
            # Step 11: Export to GLB
            glb_path = self._export_glb(output_path)
            
            elapsed_time = time.time() - start_time
            logger.info(f"Hologram generation completed in {elapsed_time:.2f}s")
            logger.info(f"Output: {glb_path}")
            
            return glb_path
            
        except Exception as e:
            logger.error(f"Hologram generation failed: {str(e)}")
            raise HologramGenerationError(f"Generation failed: {str(e)}")
    
    def _initialize_scene(self):
        """Initialize trimesh scene with metadata"""
        logger.debug("Initializing scene")
        
        self.scene = trimesh.Scene()
        self.meshes = []
        
        # Add scene metadata
        self.scene.metadata = {
            'incident_id': self.detection_data.incident_id,
            'timestamp': self.detection_data.timestamp.isoformat(),
            'building': self.detection_data.building.name,
            'floor': self.detection_data.building.floor,
            'room_id': self.detection_data.building.room_id,
            'generator': 'Fire Detection Hologram Generator v1.0',
        }
        
        logger.debug("Scene initialized")
    
    def _generate_room_geometry(self):
        """Generate room wireframe geometry"""
        logger.debug("Generating room geometry")
        
        room = self.detection_data.room_geometry
        material = MaterialLibrary.ROOM_WIREFRAME
        
        try:
            wireframe = MeshGenerators.create_room_wireframe(room, material)
            self.scene.add_geometry(wireframe, node_name="room_wireframe")
            self.meshes.append(wireframe)
            
            stats = validate_mesh(wireframe, "room_wireframe")
            logger.debug(f"Room wireframe: {stats['vertices']} vertices, {stats['faces']} faces")
            
        except Exception as e:
            logger.warning(f"Room wireframe generation failed: {str(e)}")
    
    def _generate_fire_geometry(self):
        """Generate fire source and spread geometry"""
        logger.debug("Generating fire geometry")
        
        fire = self.detection_data.fire
        
        # Fire source
        try:
            fire_source = MeshGenerators.create_fire_source(
                fire.source,
                MaterialLibrary.FIRE_SOURCE
            )
            self.scene.add_geometry(fire_source, node_name="fire_source")
            self.meshes.append(fire_source)
            
            logger.debug(f"Fire source at ({fire.source.x:.2f}, {fire.source.y:.2f}, {fire.source.z:.2f})")
        except Exception as e:
            logger.error(f"Fire source generation failed: {str(e)}")
            raise
        
        # Fire spread points
        for idx, spread in enumerate(fire.spread):
            try:
                material = MaterialLibrary.get_fire_spread_material(spread.intensity)
                spread_mesh = MeshGenerators.create_fire_spread(spread, material)
                self.scene.add_geometry(spread_mesh, node_name=f"fire_spread_{idx}")
                self.meshes.append(spread_mesh)
                
                logger.debug(f"Fire spread {idx}: intensity={spread.intensity:.2f}, age={spread.age_seconds}s")
            except Exception as e:
                logger.warning(f"Fire spread {idx} generation failed: {str(e)}")
    
    def _generate_smoke_geometry(self):
        """Generate smoke plume geometry"""
        logger.debug("Generating smoke geometry")
        
        smoke = self.detection_data.smoke
        material = MaterialLibrary.get_smoke_material(smoke.density_0_to_1)
        
        try:
            smoke_mesh = MeshGenerators.create_smoke_plume(smoke, material)
            self.scene.add_geometry(smoke_mesh, node_name="smoke_plume")
            self.meshes.append(smoke_mesh)
            
            logger.debug(f"Smoke plume: radius={smoke.extent_radius_m:.2f}m, density={smoke.density_0_to_1:.2f}")
        except Exception as e:
            logger.warning(f"Smoke plume generation failed: {str(e)}")
    
    def _generate_person_geometries(self):
        """Generate person capsule geometries with motion trails"""
        logger.debug(f"Generating {len(self.detection_data.persons)} person geometries")
        
        for person in self.detection_data.persons:
            try:
                # Select material based on state
                if person.state == "moving":
                    material = MaterialLibrary.PERSON_MOVING
                    trail_material = MaterialLibrary.MOTION_TRAIL_MOVING
                else:
                    material = MaterialLibrary.PERSON_STATIONARY
                    trail_material = MaterialLibrary.MOTION_TRAIL_STATIONARY
                
                # Create person capsule
                capsule = MeshGenerators.create_person_capsule(person, material)
                self.scene.add_geometry(capsule, node_name=f"person_{person.person_id}")
                self.meshes.append(capsule)
                
                logger.debug(f"Person {person.person_id}: state={person.state}, confidence={person.confidence:.2f}")
                
                # Create motion trail if available
                if len(person.motion_trail) >= 2:
                    trail = MeshGenerators.create_motion_trail(
                        person.motion_trail,
                        trail_material
                    )
                    if trail:
                        self.scene.add_geometry(trail, node_name=f"trail_{person.person_id}")
                        self.meshes.append(trail)
                        logger.debug(f"Motion trail for {person.person_id}: {len(person.motion_trail)} points")
                
            except Exception as e:
                logger.warning(f"Person {person.person_id} generation failed: {str(e)}")
    
    def _generate_furniture_meshes(self):
        """Generate furniture bounding box meshes"""
        logger.debug(f"Generating {len(self.detection_data.furniture)} furniture meshes")
        
        for furniture in self.detection_data.furniture:
            try:
                material = MaterialLibrary.FURNITURE
                
                box = MeshGenerators.create_furniture_box(furniture, material)
                self.scene.add_geometry(box, node_name=f"furniture_{furniture.object_id}")
                self.meshes.append(box)
                
                logger.debug(f"Furniture {furniture.object_id}: type={furniture.type}, "
                           f"size=({furniture.width_m:.2f}×{furniture.depth_m:.2f}×{furniture.height_m:.2f}m)")
                
            except Exception as e:
                logger.warning(f"Furniture {furniture.object_id} generation failed: {str(e)}")
    
    def _generate_ventilation_elements(self):
        """Generate door and window geometries"""
        if not self.detection_data.ventilation:
            logger.debug("No ventilation data provided")
            return
        
        ventilation = self.detection_data.ventilation
        
        # Doors
        logger.debug(f"Generating {len(ventilation.doors)} doors")
        for idx, door in enumerate(ventilation.doors):
            try:
                door_mesh = MeshGenerators.create_door(door, MaterialLibrary.DOOR)
                self.scene.add_geometry(door_mesh, node_name=f"door_{idx}")
                self.meshes.append(door_mesh)
                
                logger.debug(f"Door {idx}: position={door.position}, state={door.state}")
            except Exception as e:
                logger.warning(f"Door {idx} generation failed: {str(e)}")
        
        # Windows
        logger.debug(f"Generating {len(ventilation.windows)} windows")
        for idx, window in enumerate(ventilation.windows):
            try:
                window_mesh = MeshGenerators.create_window(window, MaterialLibrary.WINDOW)
                self.scene.add_geometry(window_mesh, node_name=f"window_{idx}")
                self.meshes.append(window_mesh)
                
                logger.debug(f"Window {idx}: position={window.position}")
            except Exception as e:
                logger.warning(f"Window {idx} generation failed: {str(e)}")
    
    def _generate_reference_grid(self):
        """Generate reference grid at floor level"""
        logger.debug("Generating reference grid")
        
        try:
            grid = MeshGenerators.create_reference_grid(
                self.detection_data.room_geometry,
                grid_spacing=1.0,
                material=MaterialLibrary.GRID
            )
            self.scene.add_geometry(grid, node_name="reference_grid")
            self.meshes.append(grid)
            
            logger.debug("Reference grid created")
        except Exception as e:
            logger.warning(f"Reference grid generation failed: {str(e)}")
    
    def _generate_ground_plane(self):
        """Generate ground plane at floor level"""
        logger.debug("Generating ground plane")
        
        try:
            ground = MeshGenerators.create_ground_plane(
                self.detection_data.room_geometry,
                MaterialLibrary.GROUND
            )
            self.scene.add_geometry(ground, node_name="ground_plane")
            self.meshes.append(ground)
            
            logger.debug("Ground plane created")
        except Exception as e:
            logger.warning(f"Ground plane generation failed: {str(e)}")
    
    def _validate_scene(self):
        """Validate and optimize scene"""
        logger.debug("Validating scene")
        
        total_vertices = sum(len(m.vertices) for m in self.meshes)
        total_faces = sum(len(m.faces) for m in self.meshes)
        
        logger.info(f"Scene statistics: {len(self.meshes)} meshes, "
                   f"{total_vertices} vertices, {total_faces} faces")
        
        if total_vertices > 500000:
            logger.warning(f"Vertex count ({total_vertices}) exceeds target (500k)")
        
        # Calculate scene bounds
        if self.meshes:
            all_vertices = []
            for mesh in self.meshes:
                all_vertices.extend(mesh.vertices)
            
            bounds = {
                'min': [float(min(v[i] for v in all_vertices)) for i in range(3)],
                'max': [float(max(v[i] for v in all_vertices)) for i in range(3)],
            }
            
            logger.debug(f"Scene bounds: min={bounds['min']}, max={bounds['max']}")
    
    def _export_glb(self, output_path: Optional[str] = None) -> str:
        """
        Export scene to GLB file
        
        Args:
            output_path: Output file path (optional)
        
        Returns:
            Path to exported GLB file
        """
        logger.debug("Exporting to GLB")
        
        if not self.scene:
            raise GLBExportError("No scene to export")
        
        # Generate output path if not provided
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            incident_id = self.detection_data.incident_id.replace(" ", "_")
            output_path = f"hologram_{incident_id}_{timestamp}.glb"
        
        try:
            # Export to GLB (binary glTF 2.0)
            export_data = self.scene.export(file_type='glb')
            
            # Write to file
            with open(output_path, 'wb') as f:
                f.write(export_data)
            
            # Validate file
            file_size = Path(output_path).stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            
            logger.info(f"GLB exported: {output_path} ({file_size_mb:.2f} MB)")
            
            if file_size_mb > 10:
                logger.warning(f"File size ({file_size_mb:.2f} MB) exceeds target (10 MB)")
            
            # Verify GLB magic bytes
            with open(output_path, 'rb') as f:
                magic = f.read(4)
                if magic != b'glTF':
                    logger.warning("GLB magic bytes verification failed")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"GLB export failed: {str(e)}")
            raise GLBExportError(f"Export failed: {str(e)}")
    
    def get_scene_stats(self) -> Dict:
        """
        Get scene statistics
        
        Returns:
            Dictionary with scene statistics
        """
        if not self.meshes:
            return {}
        
        stats = {
            'mesh_count': len(self.meshes),
            'total_vertices': sum(len(m.vertices) for m in self.meshes),
            'total_faces': sum(len(m.faces) for m in self.meshes),
            'incident_id': self.detection_data.incident_id if self.detection_data else None,
            'timestamp': self.detection_data.timestamp.isoformat() if self.detection_data else None,
        }
        
        return stats
