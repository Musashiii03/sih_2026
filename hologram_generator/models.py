"""
Pydantic data models for fire detection hologram generation
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime
from .exceptions import CoordinateOutOfBoundsError


class GPSCoordinates(BaseModel):
    """GPS coordinates for building location"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")


class Building(BaseModel):
    """Building information"""
    name: str = Field(..., description="Building name or identifier")
    floor: int = Field(..., description="Floor number")
    room_id: str = Field(..., description="Room identifier")
    gps: GPSCoordinates = Field(..., description="GPS coordinates")


class Point3D(BaseModel):
    """3D point in room coordinate system"""
    x: float = Field(..., description="X coordinate (left-right, meters)")
    y: float = Field(..., description="Y coordinate (front-back, meters)")
    z: float = Field(..., description="Z coordinate (floor-ceiling, meters)")


class RoomGeometry(BaseModel):
    """Room dimensions and scale"""
    width_m: float = Field(..., gt=0, description="Room width in meters (X-axis)")
    depth_m: float = Field(..., gt=0, description="Room depth in meters (Y-axis)")
    height_m: float = Field(..., gt=0, description="Room height in meters (Z-axis)")
    scale_unit: str = Field(default="meters", description="Measurement unit")


class FireSource(BaseModel):
    """Primary fire source location"""
    x: float = Field(..., description="X coordinate (meters)")
    y: float = Field(..., description="Y coordinate (meters)")
    z: float = Field(..., description="Z coordinate (meters)")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence [0-1]")
    severity: str = Field(..., description="Fire severity: active, spreading, contained")


class FireSpread(BaseModel):
    """Fire spread point"""
    x: float = Field(..., description="X coordinate (meters)")
    y: float = Field(..., description="Y coordinate (meters)")
    z: float = Field(..., description="Z coordinate (meters)")
    intensity: float = Field(..., ge=0, le=1, description="Fire intensity [0-1]")
    age_seconds: int = Field(..., ge=0, description="Time since detection (seconds)")


class Fire(BaseModel):
    """Fire detection data"""
    source: FireSource = Field(..., description="Primary fire source")
    spread: List[FireSpread] = Field(default_factory=list, description="Fire spread points")
    estimated_area_m2: float = Field(default=0.0, ge=0, description="Estimated fire area (m²)")


class SmokePlume(BaseModel):
    """Smoke plume detection data"""
    plume_center: Point3D = Field(..., description="Center of smoke plume")
    extent_radius_m: float = Field(..., gt=0, description="Smoke extent radius (meters)")
    density_0_to_1: float = Field(..., ge=0, le=1, description="Smoke density [0-1]")
    spread_direction: Point3D = Field(..., description="Smoke spread direction vector")
    coverage_region: List[Point3D] = Field(
        default_factory=list,
        description="Smoke coverage boundary points"
    )


class Person(BaseModel):
    """Person detection data"""
    person_id: str = Field(..., description="Unique person identifier")
    x: float = Field(..., description="X coordinate (meters)")
    y: float = Field(..., description="Y coordinate (meters)")
    z: float = Field(..., description="Z coordinate (meters, head position)")
    state: str = Field(..., description="Person state: stationary, moving")
    motion_trail: List[Point3D] = Field(
        default_factory=list,
        description="Recent motion trajectory"
    )
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence [0-1]")


class Furniture(BaseModel):
    """Furniture/object detection data"""
    object_id: str = Field(..., description="Unique object identifier")
    type: str = Field(..., description="Object type: bed, cabinet, table, etc.")
    x: float = Field(..., description="X coordinate (center, meters)")
    y: float = Field(..., description="Y coordinate (center, meters)")
    z: float = Field(..., description="Z coordinate (center, meters)")
    width_m: float = Field(..., gt=0, description="Object width (meters)")
    depth_m: float = Field(..., gt=0, description="Object depth (meters)")
    height_m: float = Field(..., gt=0, description="Object height (meters)")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence [0-1]")
    material: str = Field(default="generic", description="Material type")


class Door(BaseModel):
    """Door detection data"""
    position: str = Field(..., description="Wall position: north, south, east, west")
    x: float = Field(..., description="X coordinate (meters)")
    y: float = Field(..., description="Y coordinate (meters)")
    z: float = Field(..., description="Z coordinate (meters)")
    width: float = Field(..., gt=0, description="Door width (meters)")
    height: float = Field(..., gt=0, description="Door height (meters)")
    state: str = Field(default="closed", description="Door state: open, closed")


class Window(BaseModel):
    """Window detection data"""
    position: str = Field(..., description="Wall position: north, south, east, west")
    x: float = Field(..., description="X coordinate (meters)")
    y: float = Field(..., description="Y coordinate (meters)")
    z: float = Field(..., description="Z coordinate (meters)")
    width: float = Field(..., gt=0, description="Window width (meters)")
    height: float = Field(..., gt=0, description="Window height (meters)")


class Ventilation(BaseModel):
    """Ventilation elements (doors and windows)"""
    doors: List[Door] = Field(default_factory=list, description="Door locations")
    windows: List[Window] = Field(default_factory=list, description="Window locations")


class Metadata(BaseModel):
    """Detection metadata"""
    source_camera: str = Field(..., description="Source camera identifier")
    detection_model: str = Field(..., description="Detection model name/version")
    processing_time_ms: int = Field(..., ge=0, description="Processing time (milliseconds)")


class DetectionData(BaseModel):
    """Complete fire detection data for hologram generation"""
    incident_id: str = Field(..., description="Unique incident identifier")
    timestamp: datetime = Field(..., description="Detection timestamp (ISO 8601)")
    building: Building = Field(..., description="Building information")
    room_geometry: RoomGeometry = Field(..., description="Room dimensions")
    fire: Fire = Field(..., description="Fire detection data")
    smoke: SmokePlume = Field(..., description="Smoke plume data")
    persons: List[Person] = Field(default_factory=list, description="Detected persons")
    furniture: List[Furniture] = Field(default_factory=list, description="Detected furniture")
    ventilation: Optional[Ventilation] = Field(
        default=None,
        description="Ventilation elements"
    )
    metadata: Metadata = Field(..., description="Detection metadata")

    @field_validator('persons')
    @classmethod
    def validate_person_coordinates(cls, persons, info):
        """Validate person coordinates are within room bounds"""
        if 'room_geometry' not in info.data:
            return persons
        
        room = info.data['room_geometry']
        for person in persons:
            if not (0 <= person.x <= room.width_m):
                raise CoordinateOutOfBoundsError(
                    f"Person {person.person_id} x={person.x} outside room bounds [0, {room.width_m}]"
                )
            if not (0 <= person.y <= room.depth_m):
                raise CoordinateOutOfBoundsError(
                    f"Person {person.person_id} y={person.y} outside room bounds [0, {room.depth_m}]"
                )
            if not (0 <= person.z <= room.height_m):
                raise CoordinateOutOfBoundsError(
                    f"Person {person.person_id} z={person.z} outside room bounds [0, {room.height_m}]"
                )
        return persons

    @field_validator('furniture')
    @classmethod
    def validate_furniture_coordinates(cls, furniture, info):
        """Validate furniture coordinates are within room bounds"""
        if 'room_geometry' not in info.data:
            return furniture
        
        room = info.data['room_geometry']
        for obj in furniture:
            # Check center position
            if not (0 <= obj.x <= room.width_m):
                raise CoordinateOutOfBoundsError(
                    f"Furniture {obj.object_id} x={obj.x} outside room bounds [0, {room.width_m}]"
                )
            if not (0 <= obj.y <= room.depth_m):
                raise CoordinateOutOfBoundsError(
                    f"Furniture {obj.object_id} y={obj.y} outside room bounds [0, {room.depth_m}]"
                )
            if not (0 <= obj.z <= room.height_m):
                raise CoordinateOutOfBoundsError(
                    f"Furniture {obj.object_id} z={obj.z} outside room bounds [0, {room.height_m}]"
                )
        return furniture

    @model_validator(mode='after')
    def validate_fire_coordinates(self):
        """Validate fire source coordinates are within room bounds"""
        room = self.room_geometry
        fire_src = self.fire.source
        
        if not (0 <= fire_src.x <= room.width_m):
            raise CoordinateOutOfBoundsError(
                f"Fire source x={fire_src.x} outside room bounds [0, {room.width_m}]"
            )
        if not (0 <= fire_src.y <= room.depth_m):
            raise CoordinateOutOfBoundsError(
                f"Fire source y={fire_src.y} outside room bounds [0, {room.depth_m}]"
            )
        if not (0 <= fire_src.z <= room.height_m):
            raise CoordinateOutOfBoundsError(
                f"Fire source z={fire_src.z} outside room bounds [0, {room.height_m}]"
            )
        
        # Validate fire spread points
        for idx, spread in enumerate(self.fire.spread):
            if not (0 <= spread.x <= room.width_m and 
                    0 <= spread.y <= room.depth_m and 
                    0 <= spread.z <= room.height_m):
                raise CoordinateOutOfBoundsError(
                    f"Fire spread point {idx} outside room bounds"
                )
        
        return self

    @model_validator(mode='after')
    def validate_smoke_coordinates(self):
        """Validate smoke plume center is within room bounds"""
        room = self.room_geometry
        smoke_center = self.smoke.plume_center
        
        if not (0 <= smoke_center.x <= room.width_m):
            raise CoordinateOutOfBoundsError(
                f"Smoke center x={smoke_center.x} outside room bounds [0, {room.width_m}]"
            )
        if not (0 <= smoke_center.y <= room.depth_m):
            raise CoordinateOutOfBoundsError(
                f"Smoke center y={smoke_center.y} outside room bounds [0, {room.depth_m}]"
            )
        if not (0 <= smoke_center.z <= room.height_m):
            raise CoordinateOutOfBoundsError(
                f"Smoke center z={smoke_center.z} outside room bounds [0, {room.height_m}]"
            )
        
        return self
