"""
Demonstration of Storage Manager Module

This script demonstrates the complete storage workflow:
1. Create sample frames with fire detection data
2. Save frames and metadata to disk
3. Verify directory structure
4. Display saved data
"""

import numpy as np
from pathlib import Path
import json

from storage import StorageManager, FrameMetadata, IncidentSummary
from extractor import Frame, BBox


def create_sample_frames(count: int = 5) -> list:
    """Create sample frames for demonstration."""
    frames = []
    
    for i in range(count):
        # Create a test image with different colors
        image = np.zeros((480, 640, 3), dtype=np.uint8)
        # Create a gradient effect
        image[:, :, 0] = (i * 50) % 256  # Blue channel
        image[:, :, 1] = (i * 30) % 256  # Green channel
        image[:, :, 2] = 200 - (i * 20)  # Red channel
        
        # Create bounding boxes for fire detection
        bboxes = [
            BBox(
                x=100 + i * 20,
                y=50 + i * 10,
                width=150,
                height=120,
                confidence=0.85 + i * 0.02
            )
        ]
        
        # Create Frame object
        frame = Frame(
            image=image,
            timestamp=1705330822.0 + i * 2.5,  # 2.5 seconds apart
            confidence=0.85 + i * 0.02,
            bounding_boxes=bboxes,
            frame_index=i
        )
        
        frames.append(frame)
    
    return frames


def main():
    """Run storage demonstration."""
    print("=" * 70)
    print("Storage Manager Module Demonstration")
    print("=" * 70)
    print()
    
    # Create storage manager with demo path
    demo_path = Path("demo_output/fire_incidents")
    storage_manager = StorageManager(base_path=str(demo_path))
    
    print(f"✓ Storage Manager initialized")
    print(f"  Base path: {demo_path.absolute()}")
    print(f"  Image quality: {storage_manager.image_quality}%")
    print()
    
    # Create sample frames
    print("Creating sample frames...")
    frames = create_sample_frames(count=5)
    print(f"✓ Created {len(frames)} sample frames")
    for i, frame in enumerate(frames):
        print(f"  Frame {i}: {frame.image.shape}, confidence={frame.confidence:.2f}, "
              f"{len(frame.bounding_boxes)} bbox(es)")
    print()
    
    # Save incident
    print("Saving incident to disk...")
    incident_id = "INC-20250115-143022"
    summary = storage_manager.save_incident(
        frames=frames,
        incident_id=incident_id,
        timestamp=frames[0].timestamp,
        camera_id="CAM-03",
        location="Warehouse A (Hazard Epicenter)"
    )
    
    print(f"✓ Incident saved successfully")
    print(f"  Incident ID: {summary.incident_id}")
    print(f"  Timestamp: {summary.timestamp}")
    print(f"  Camera ID: {summary.camera_id}")
    print(f"  Location: {summary.location}")
    print(f"  Frames saved: {summary.frame_count}")
    print(f"  Incident path: {summary.incident_path}")
    print()
    
    # Verify directory structure
    print("Verifying directory structure...")
    incident_path = summary.incident_path
    frames_dir = incident_path / "frames"
    metadata_dir = incident_path / "metadata"
    summary_file = incident_path / "summary.json"
    
    print(f"✓ Directory structure verified:")
    print(f"  {incident_path}")
    print(f"  ├── frames/")
    
    # List frame files
    frame_files = sorted(frames_dir.glob("*.jpg"))
    for frame_file in frame_files:
        print(f"  │   ├── {frame_file.name}")
    
    print(f"  ├── metadata/")
    
    # List metadata files
    metadata_files = sorted(metadata_dir.glob("*.json"))
    for metadata_file in metadata_files:
        print(f"  │   ├── {metadata_file.name}")
    
    print(f"  └── summary.json")
    print()
    
    # Display summary content
    print("Summary.json content:")
    print("-" * 70)
    with open(summary_file, 'r') as f:
        summary_data = json.load(f)
    
    print(f"Incident ID: {summary_data['incident_id']}")
    print(f"Timestamp: {summary_data['timestamp_readable']}")
    print(f"Camera: {summary_data['camera_id']}")
    print(f"Location: {summary_data['location']}")
    print(f"Frame count: {summary_data['frame_count']}")
    print()
    print("Frames:")
    for frame_meta in summary_data['frames']:
        print(f"  - Frame {frame_meta['frame_index']}: "
              f"confidence={frame_meta['confidence']:.2f}, "
              f"timestamp={frame_meta['timestamp_readable']}")
    print()
    
    # Display one metadata file
    print("Sample frame metadata (frame_000.json):")
    print("-" * 70)
    first_metadata_file = metadata_dir / "frame_000.json"
    with open(first_metadata_file, 'r') as f:
        frame_metadata = json.load(f)
    
    print(json.dumps(frame_metadata, indent=2))
    print()
    
    print("=" * 70)
    print("✓ Demonstration complete!")
    print(f"  Output saved to: {demo_path.absolute()}")
    print("=" * 70)


if __name__ == '__main__':
    main()
