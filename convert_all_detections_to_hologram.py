"""
Enhanced Detection to Hologram Converter
Converts fire, human, AND object detections to 3D hologram format
"""

import json
import sys
import numpy as np
from datetime import datetime
from pathlib import Path
from collections import defaultdict


def estimate_3d_position(bbox, image_width=1920, image_height=1080, 
                         room_width=8.0, room_depth=6.0, room_height=3.0, 
                         object_type='fire'):
    """
    Estimate 3D position from 2D bounding box with type-specific logic
    
    Args:
        bbox: Bounding box dict with x, y, width, height
        image_width: Image width in pixels
        image_height: Image height in pixels  
        room_width: Room width in meters (X-axis)
        room_depth: Room depth in meters (Y-axis)
        room_height: Room height in meters (Z-axis)
        object_type: 'fire', 'person', or 'furniture'
    
    Returns:
        Tuple (x, y, z) in meters
    """
    # Center of bounding box
    center_x = bbox['x'] + bbox['width'] / 2
    center_y = bbox['y'] + bbox['height'] / 2
    
    # Normalize to 0-1
    norm_x = center_x / image_width
    norm_y = center_y / image_height
    
    # X: left-right position
    x = norm_x * room_width
    
    # Y: depth (distance from camera)
    y = norm_y * room_depth * 0.8
    
    # Z: height depends on object type
    if object_type == 'fire':
        # Fire typically near floor
        bbox_height_ratio = bbox['height'] / image_height
        z = 0.2 + (bbox_height_ratio * 1.5)
        z = min(z, room_height * 0.5)
        
    elif object_type == 'person':
        # Person standing: estimate center of mass
        # Person's z should represent head position (1.7m for standing)
        bbox_height_ratio = bbox['height'] / image_height
        # Larger bbox = closer/taller person
        z = 1.7  # Standard standing height
        
    else:  # furniture/objects
        # Object height based on bbox size and position
        bbox_height_ratio = bbox['height'] / image_height
        # Lower in image = on floor, higher = elevated
        z_base = (1.0 - norm_y) * 0.5  # Objects lower in image are on floor
        z_size = bbox_height_ratio * 1.2
        z = z_base + z_size / 2  # Center of object
        z = min(z, room_height * 0.8)
    
    return round(x, 2), round(y, 2), round(z, 2)


def estimate_object_dimensions(bbox, image_width=1920, image_height=1080, 
                               room_width=8.0, room_depth=6.0, room_height=3.0,
                               object_class='chair'):
    """
    Estimate 3D dimensions for furniture/objects
    
    Returns:
        Tuple (width_m, depth_m, height_m)
    """
    # Normalize bbox size
    norm_width = bbox['width'] / image_width
    norm_height = bbox['height'] / image_height
    
    # Base dimensions (typical sizes)
    typical_sizes = {
        'chair': (0.5, 0.5, 1.0),
        'couch': (2.0, 0.9, 0.8),
        'bed': (2.0, 1.6, 0.5),
        'dining table': (1.5, 0.9, 0.8),
        'desk': (1.2, 0.6, 0.75),
        'tv': (1.0, 0.1, 0.6),
        'refrigerator': (0.7, 0.7, 1.8),
        'oven': (0.6, 0.6, 0.9),
        'sink': (0.6, 0.5, 0.3),
        'toilet': (0.5, 0.7, 0.8),
        'cabinet': (0.8, 0.4, 1.5),
        'bookshelf': (0.8, 0.3, 2.0),
    }
    
    # Get base dimensions
    base_w, base_d, base_h = typical_sizes.get(object_class, (0.6, 0.6, 0.8))
    
    # Scale based on bbox size (apparent size in image)
    scale_factor = (norm_width + norm_height) / 2
    scale_factor = max(0.5, min(scale_factor * 3, 2.0))  # Clamp between 0.5x and 2x
    
    width_m = round(base_w * scale_factor, 2)
    depth_m = round(base_d * scale_factor, 2)
    height_m = round(base_h * scale_factor, 2)
    
    return width_m, depth_m, height_m


def determine_person_state(person_bboxes_over_time):
    """
    Determine if person is moving or stationary based on position changes
    
    Args:
        person_bboxes_over_time: List of bboxes for same person over multiple frames
    
    Returns:
        'moving' or 'stationary'
    """
    if len(person_bboxes_over_time) < 2:
        return 'stationary'
    
    # Calculate center positions
    centers = []
    for bbox in person_bboxes_over_time:
        cx = bbox['x'] + bbox['width'] / 2
        cy = bbox['y'] + bbox['height'] / 2
        centers.append((cx, cy))
    
    # Calculate total movement
    total_movement = 0
    for i in range(1, len(centers)):
        dx = centers[i][0] - centers[i-1][0]
        dy = centers[i][1] - centers[i-1][1]
        movement = np.sqrt(dx**2 + dy**2)
        total_movement += movement
    
    avg_movement = total_movement / (len(centers) - 1)
    
    # Threshold: > 50 pixels average movement = moving
    return 'moving' if avg_movement > 50 else 'stationary'


def convert_all_detections_to_hologram(metadata_dir, summary_path=None, output_path=None,
                                      room_width=8.0, room_depth=6.0, room_height=3.0):
    """
    Convert comprehensive detection metadata to hologram format
    
    Args:
        metadata_dir: Directory containing frame metadata JSON files
        summary_path: Path to summary.json (optional, for backward compatibility)
        output_path: Output path for hologram JSON
        room_width: Room width in meters
        room_depth: Room depth in meters
        room_height: Room height in meters
    """
    metadata_path = Path(metadata_dir)
    
    # Load all metadata files
    metadata_files = sorted(metadata_path.glob('frame_*.json'))
    
    if not metadata_files:
        print(f"❌ No metadata files found in {metadata_dir}")
        return None
    
    print(f"📂 Found {len(metadata_files)} metadata files")
    
    # Load all frame metadata
    all_frames = []
    for meta_file in metadata_files:
        with open(meta_file, 'r') as f:
            all_frames.append(json.load(f))
    
    # Find frame with highest fire confidence
    # Handle both old and new metadata formats
    fire_frames = []
    for f in all_frames:
        # New format: has 'fire' dict
        if 'fire' in f and f.get('fire', {}).get('detected', False):
            fire_frames.append(f)
        # Old format: has 'bounding_boxes' directly
        elif 'bounding_boxes' in f and len(f.get('bounding_boxes', [])) > 0:
            fire_frames.append(f)
    
    if not fire_frames:
        print("❌ No fire detections found in metadata!")
        print(f"   Sample frame structure: {list(all_frames[0].keys())}")
        return None
    
    # Get best frame
    if 'fire' in fire_frames[0]:
        # New format
        best_frame = max(fire_frames, key=lambda f: f['fire'].get('confidence', 0))
        frame_idx = best_frame['frame_index']
        print(f"✓ Best frame: {frame_idx} (fire confidence: {best_frame['fire']['confidence']:.2%})")
        fire_bboxes = best_frame['fire'].get('bounding_boxes', [])
    else:
        # Old format
        best_frame = max(fire_frames, key=lambda f: f.get('confidence', 0))
        frame_idx = best_frame['frame_index']
        print(f"✓ Best frame: {frame_idx} (fire confidence: {best_frame.get('confidence', 0):.2%})")
        fire_bboxes = best_frame.get('bounding_boxes', [])
    
    if not fire_bboxes:
        print("❌ No fire bounding boxes in best frame!")
        return None
    
    # Primary fire source
    primary_fire = max(fire_bboxes, key=lambda b: b.get('confidence', 0))
    fire_x, fire_y, fire_z = estimate_3d_position(
        primary_fire, 
        room_width=room_width, 
        room_depth=room_depth, 
        room_height=room_height,
        object_type='fire'
    )
    
    # Fire spread points
    fire_spread = []
    for i, bbox in enumerate(fire_bboxes[1:4]):  # Max 3 spread points
        spread_x, spread_y, spread_z = estimate_3d_position(
            bbox, 
            room_width=room_width, 
            room_depth=room_depth, 
            room_height=room_height,
            object_type='fire'
        )
        fire_spread.append({
            "x": spread_x,
            "y": spread_y,
            "z": spread_z,
            "intensity": bbox.get('confidence', 0.5),
            "age_seconds": (i + 1) * 5
        })
    
    # Fire area estimation
    total_bbox_area = sum(b['width'] * b['height'] for b in fire_bboxes)
    fire_area_m2 = round((total_bbox_area / (1920 * 1080)) * (room_width * room_depth) * 0.5, 2)
    
    # ========================================================================
    # EXTRACT HUMAN DATA
    # ========================================================================
    
    # Handle both formats
    if 'humans' in best_frame:
        human_bboxes = best_frame.get('humans', {}).get('bounding_boxes', [])
    else:
        human_bboxes = []
    persons = []
    
    for i, human_bbox in enumerate(human_bboxes):
        person_id = f"P_{i+1:03d}"
        person_x, person_y, person_z = estimate_3d_position(
            human_bbox,
            room_width=room_width,
            room_depth=room_depth,
            room_height=room_height,
            object_type='person'
        )
        
        # Try to determine if moving (simple version: always stationary from single frame)
        # In future: track across multiple frames
        person_state = 'stationary'
        
        persons.append({
            "person_id": person_id,
            "x": person_x,
            "y": person_y,
            "z": person_z,
            "state": person_state,
            "motion_trail": [],
            "confidence": human_bbox.get('confidence', 0.5)
        })
    
    print(f"✓ Detected {len(persons)} person(s)")
    
    # ========================================================================
    # EXTRACT OBJECT DATA
    # ========================================================================
    
    # Handle both formats
    if 'objects' in best_frame:
        object_bboxes = best_frame.get('objects', {}).get('bounding_boxes', [])
    else:
        object_bboxes = []
    furniture = []
    
    for i, obj_bbox in enumerate(object_bboxes):
        object_id = f"OBJ_{i+1:03d}"
        obj_class = obj_bbox.get('class', 'object')
        
        obj_x, obj_y, obj_z = estimate_3d_position(
            obj_bbox,
            room_width=room_width,
            room_depth=room_depth,
            room_height=room_height,
            object_type='furniture'
        )
        
        width_m, depth_m, height_m = estimate_object_dimensions(
            obj_bbox,
            room_width=room_width,
            room_depth=room_depth,
            room_height=room_height,
            object_class=obj_class
        )
        
        furniture.append({
            "object_id": object_id,
            "type": obj_class,
            "x": obj_x,
            "y": obj_y,
            "z": obj_z,
            "width_m": width_m,
            "depth_m": depth_m,
            "height_m": height_m,
            "confidence": obj_bbox.get('confidence', 0.5),
            "material": "generic"
        })
    
    print(f"✓ Detected {len(furniture)} object(s)")
    
    # ========================================================================
    # GENERATE SMOKE ESTIMATION
    # ========================================================================
    
    smoke_x = fire_x
    smoke_y = fire_y
    smoke_z = fire_z + 1.0
    smoke_radius = 1.5 + (len(fire_bboxes) * 0.3)
    
    # Get fire confidence based on format
    if 'fire' in best_frame:
        fire_conf = best_frame['fire']['confidence']
    else:
        fire_conf = best_frame.get('confidence', 0.5)
    
    smoke_density = min(0.4 + (fire_conf * 0.4), 0.9)
    
    # ========================================================================
    # BUILD HOLOGRAM DATA
    # ========================================================================
    
    # Get incident info from parent directory or best_frame
    incident_id = metadata_path.parent.name
    timestamp_str = best_frame.get('timestamp_readable', datetime.now().isoformat() + 'Z')
    
    hologram_data = {
        "incident_id": incident_id,
        "timestamp": timestamp_str,
        "building": {
            "name": "Detected Location",
            "floor": 1,
            "room_id": "ROOM-01",
            "gps": {
                "latitude": 28.5355,
                "longitude": 77.3910
            }
        },
        "room_geometry": {
            "width_m": room_width,
            "depth_m": room_depth,
            "height_m": room_height,
            "scale_unit": "meters"
        },
        "fire": {
            "source": {
                "x": fire_x,
                "y": fire_y,
                "z": fire_z,
                "confidence": primary_fire.get('confidence', 0.5),
                "severity": "active" if fire_conf > 0.7 else "detected"
            },
            "spread": fire_spread,
            "estimated_area_m2": fire_area_m2
        },
        "smoke": {
            "plume_center": {
                "x": smoke_x,
                "y": smoke_y,
                "z": smoke_z
            },
            "extent_radius_m": smoke_radius,
            "density_0_to_1": smoke_density,
            "spread_direction": {
                "x": 0.1,
                "y": 0.1,
                "z": 0.3
            },
            "coverage_region": []
        },
        "persons": persons,
        "furniture": furniture,
        "ventilation": {
            "doors": [],
            "windows": []
        },
        "metadata": {
            "source_camera": "CAM-01",
            "detection_model": "YOLOv8_comprehensive",
            "processing_time_ms": 0,
            "conversion_notes": "Converted from fire/human/object detections to 3D coordinates",
            "original_frame_index": frame_idx,
            "detection_counts": {
                "fire": len(fire_bboxes),
                "humans": len(human_bboxes),
                "objects": len(object_bboxes)
            }
        }
    }
    
    # ========================================================================
    # SAVE HOLOGRAM DATA
    # ========================================================================
    
    if output_path is None:
        output_path = metadata_path.parent / f"hologram_data_{incident_id}.json"
    
    with open(output_path, 'w') as f:
        json.dump(hologram_data, f, indent=2)
    
    print(f"\n✓ Converted all detections to hologram format")
    print(f"  Incident: {incident_id}")
    print(f"  Frame: {frame_idx} (fire confidence: {fire_conf:.2%})")
    print(f"  🔥 Fire detections: {len(fire_bboxes)}")
    print(f"  👤 Human detections: {len(persons)}")
    print(f"  📦 Object detections: {len(furniture)}")
    print(f"  Primary fire: ({fire_x}, {fire_y}, {fire_z}) meters")
    print(f"  Smoke density: {smoke_density:.2%}")
    print(f"  Output: {output_path}")
    
    return str(output_path)


def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print("Usage: python convert_all_detections_to_hologram.py <metadata_dir> [room_width] [room_depth] [room_height]")
        print("\nExample:")
        print("  python convert_all_detections_to_hologram.py data/fire_incidents/.../metadata")
        print("  python convert_all_detections_to_hologram.py data/fire_incidents/.../metadata 10.0 8.0 3.5")
        sys.exit(1)
    
    metadata_dir = sys.argv[1]
    
    # Optional room dimensions
    room_width = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0
    room_depth = float(sys.argv[3]) if len(sys.argv) > 3 else 6.0
    room_height = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0
    
    print(f"Converting comprehensive detection data to hologram format...")
    print(f"  Room dimensions: {room_width}m × {room_depth}m × {room_height}m")
    print()
    
    hologram_path = convert_all_detections_to_hologram(
        metadata_dir,
        room_width=room_width,
        room_depth=room_depth,
        room_height=room_height
    )
    
    if hologram_path:
        print()
        print("=" * 60)
        print("Next step: Generate hologram GLB file")
        print("=" * 60)
        print(f"cd s:\\Programming\\sih_2026")
        print(f"python -m hologram_generator -i \"{hologram_path}\" -o hologram.glb --stats")
        print()
        print("View online: https://gltf-viewer.donmccurdy.com/")


if __name__ == '__main__':
    main()
