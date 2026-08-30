"""
Convert 2D fire detection data to 3D hologram format

This script converts pixel-based bounding box detections from images
into 3D spatial coordinates suitable for hologram generation.
"""

import json
import sys
from datetime import datetime
from pathlib import Path


def estimate_3d_position(bbox, image_width=1920, image_height=1080, room_width=8.0, room_depth=6.0, room_height=3.0):
    """
    Estimate 3D position from 2D bounding box
    
    Assumptions:
    - Camera is positioned at center of one wall looking across room
    - Objects closer to bottom of image are closer to camera
    - Fire typically starts near floor level
    
    Args:
        bbox: Bounding box dict with x, y, width, height
        image_width: Image width in pixels
        image_height: Image height in pixels  
        room_width: Room width in meters (X-axis)
        room_depth: Room depth in meters (Y-axis)
        room_height: Room height in meters (Z-axis)
    
    Returns:
        Tuple (x, y, z) in meters
    """
    # Center of bounding box in pixels
    center_x = bbox['x'] + bbox['width'] / 2
    center_y = bbox['y'] + bbox['height'] / 2
    
    # Normalize to 0-1 range
    norm_x = center_x / image_width
    norm_y = center_y / image_height
    
    # Convert to room coordinates
    # X: left-right position in room
    x = norm_x * room_width
    
    # Y: depth (distance from camera)
    # Objects lower in image are closer (higher y pixel value = closer)
    # Assume camera at y=0, objects spread across depth
    y = norm_y * room_depth * 0.8  # Use 80% of depth
    
    # Z: height from floor
    # Fire typically starts low, estimate based on bbox height
    bbox_height_ratio = bbox['height'] / image_height
    z = 0.2 + (bbox_height_ratio * 2.0)  # 0.2m to 2.2m range
    z = min(z, room_height * 0.8)  # Cap at 80% of room height
    
    return round(x, 2), round(y, 2), round(z, 2)


def convert_detection_to_hologram(summary_path, output_path=None, 
                                  room_width=8.0, room_depth=6.0, room_height=3.0):
    """
    Convert detection summary to hologram format
    
    Args:
        summary_path: Path to summary.json from fire detection
        output_path: Output path for hologram JSON (optional)
        room_width: Estimated room width in meters
        room_depth: Estimated room depth in meters  
        room_height: Estimated room height in meters
    """
    # Load detection data
    with open(summary_path, 'r') as f:
        detection_data = json.load(f)
    
    # Use the frame with highest confidence
    best_frame = max(detection_data['frames'], key=lambda f: f['confidence'])
    
    # Get incident info
    incident_id = detection_data['incident_id']
    timestamp_str = detection_data['timestamp_readable']
    camera_id = detection_data.get('camera_id', 'UNKNOWN')
    
    # Process fire detections
    fire_bboxes = sorted(best_frame['bounding_boxes'], 
                        key=lambda b: b['confidence'], 
                        reverse=True)
    
    if not fire_bboxes:
        print("No fire detections found!")
        return None
    
    # Primary fire source (highest confidence)
    primary_fire_bbox = fire_bboxes[0]
    fire_x, fire_y, fire_z = estimate_3d_position(
        primary_fire_bbox, 
        room_width=room_width,
        room_depth=room_depth,
        room_height=room_height
    )
    
    # Fire spread points (other detections)
    fire_spread = []
    for i, bbox in enumerate(fire_bboxes[1:4]):  # Max 3 spread points
        spread_x, spread_y, spread_z = estimate_3d_position(
            bbox,
            room_width=room_width,
            room_depth=room_depth,
            room_height=room_height
        )
        fire_spread.append({
            "x": spread_x,
            "y": spread_y,
            "z": spread_z,
            "intensity": bbox['confidence'],
            "age_seconds": (i + 1) * 5
        })
    
    # Estimate smoke plume (above primary fire)
    smoke_x = fire_x
    smoke_y = fire_y
    smoke_z = fire_z + 1.0  # 1m above fire
    smoke_radius = 1.5 + (len(fire_bboxes) * 0.3)  # Larger with more fires
    smoke_density = min(0.4 + (best_frame['confidence'] * 0.4), 0.9)
    
    # Estimate fire area (sum of bbox areas, converted to m²)
    total_bbox_area = sum(b['width'] * b['height'] for b in fire_bboxes)
    fire_area_m2 = round((total_bbox_area / (1920 * 1080)) * (room_width * room_depth) * 0.5, 2)
    
    # Build hologram data
    hologram_data = {
        "incident_id": incident_id,
        "timestamp": timestamp_str,
        "building": {
            "name": "Detected Location",
            "floor": 1,
            "room_id": camera_id,
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
                "confidence": primary_fire_bbox['confidence'],
                "severity": "active" if best_frame['confidence'] > 0.7 else "detected"
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
        "persons": [],  # No person detection in this data
        "furniture": [],  # No furniture detection in this data
        "ventilation": {
            "doors": [],
            "windows": []
        },
        "metadata": {
            "source_camera": camera_id,
            "detection_model": "YOLOv8_fire_detection",
            "processing_time_ms": 0,
            "conversion_notes": "Converted from 2D bounding boxes to estimated 3D coordinates",
            "original_frame_index": best_frame['frame_index'],
            "detection_count": len(fire_bboxes)
        }
    }
    
    # Determine output path
    if output_path is None:
        output_path = Path(summary_path).parent / f"hologram_data_{incident_id}.json"
    
    # Save hologram data
    with open(output_path, 'w') as f:
        json.dump(hologram_data, f, indent=2)
    
    print(f"✓ Converted detection data to hologram format")
    print(f"  Incident: {incident_id}")
    print(f"  Frame: {best_frame['frame_index']} (confidence: {best_frame['confidence']:.2%})")
    print(f"  Fire detections: {len(fire_bboxes)}")
    print(f"  Primary fire location: ({fire_x}, {fire_y}, {fire_z}) meters")
    print(f"  Estimated fire area: {fire_area_m2} m²")
    print(f"  Smoke density: {smoke_density:.2%}")
    print(f"  Output: {output_path}")
    
    return str(output_path)


def main():
    """Command-line interface"""
    if len(sys.argv) < 2:
        print("Usage: python convert_detection_to_hologram.py <summary.json> [room_width] [room_depth] [room_height]")
        print("\nExample:")
        print("  python convert_detection_to_hologram.py data/fire_incidents/.../summary.json")
        print("  python convert_detection_to_hologram.py data/fire_incidents/.../summary.json 10.0 8.0 3.5")
        sys.exit(1)
    
    summary_path = sys.argv[1]
    
    # Optional room dimensions
    room_width = float(sys.argv[2]) if len(sys.argv) > 2 else 8.0
    room_depth = float(sys.argv[3]) if len(sys.argv) > 3 else 6.0
    room_height = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0
    
    print(f"Converting fire detection data to hologram format...")
    print(f"  Room dimensions: {room_width}m × {room_depth}m × {room_height}m")
    print()
    
    hologram_path = convert_detection_to_hologram(
        summary_path,
        room_width=room_width,
        room_depth=room_depth,
        room_height=room_height
    )
    
    if hologram_path:
        print()
        print("Next step: Generate hologram")
        print(f"  cd s:\\Programming\\sih_2026")
        print(f"  python -m hologram_generator -i {hologram_path} -o hologram.glb --stats")


if __name__ == '__main__':
    main()
