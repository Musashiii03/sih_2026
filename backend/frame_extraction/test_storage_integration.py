"""
Integration tests for StorageManager module

Tests complete flow from frame extraction to storage.
"""

import unittest
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
import numpy as np
import json

import sys
sys.path.insert(0, str(Path(__file__).parent))

from storage import StorageManager
from extractor import Frame, BBox


class TestStorageIntegration(unittest.TestCase):
    """Integration tests for complete storage workflow."""
    
    def setUp(self):
        """Create temporary directory for test storage."""
        self.test_dir = tempfile.mkdtemp()
        self.storage = StorageManager(base_path=self.test_dir)
    
    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def create_realistic_incident(self):
        """Create a realistic fire incident with multiple frames."""
        base_time = 1705330822.0  # Jan 15, 2024, 14:30:22
        frames = []
        
        for i in range(10):
            # Create a frame with progressively different fire
            image = np.zeros((480, 640, 3), dtype=np.uint8)
            # Simulate fire spreading by changing image content
            image[i*10:(i+1)*40, i*20:(i+1)*60] = (0, 0, 255)  # Red fire region
            
            bbox = BBox(
                x=i*20,
                y=i*10,
                width=(i+1)*40,
                height=(i+1)*30,
                confidence=0.75 + (i * 0.02)
            )
            
            frame = Frame(
                image=image,
                timestamp=base_time + (i * 1.5),  # 1.5 seconds apart
                confidence=0.75 + (i * 0.02),
                bounding_boxes=[bbox],
                frame_index=i
            )
            frames.append(frame)
        
        return frames, base_time
    
    def test_complete_incident_save_workflow(self):
        """Test complete workflow: frames -> save -> verify files."""
        frames, base_time = self.create_realistic_incident()
        incident_id = 'INC-20240115-143022'
        
        # Save incident
        summary = self.storage.save_incident(
            frames=frames,
            incident_id=incident_id,
            timestamp=base_time,
            camera_id='CAM-INTEGRATION-01',
            location='Integration Test Zone'
        )
        
        # Verify summary object
        self.assertEqual(summary.incident_id, incident_id)
        self.assertEqual(summary.frame_count, 10)
        self.assertEqual(summary.camera_id, 'CAM-INTEGRATION-01')
        self.assertEqual(len(summary.frames), 10)
        
        # Verify directory structure
        date_str = '2024-01-15'
        incident_path = Path(self.test_dir) / date_str / incident_id
        self.assertTrue(incident_path.exists())
        self.assertTrue((incident_path / 'frames').exists())
        self.assertTrue((incident_path / 'metadata').exists())
        self.assertTrue((incident_path / 'summary.json').exists())
        
        # Verify all frame files exist
        for i in range(10):
            image_path = incident_path / 'frames' / f'frame_{i:03d}.jpg'
            metadata_path = incident_path / 'metadata' / f'frame_{i:03d}.json'
            
            self.assertTrue(image_path.exists())
            self.assertTrue(metadata_path.exists())
            
            # Verify metadata content
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            self.assertEqual(metadata['frame_index'], i)
            self.assertGreater(metadata['confidence'], 0.7)
            self.assertIn('bounding_boxes', metadata)
            self.assertIn('timestamp_readable', metadata)
        
        # Verify summary.json content
        with open(incident_path / 'summary.json', 'r') as f:
            summary_json = json.load(f)
        
        self.assertEqual(summary_json['incident_id'], incident_id)
        self.assertEqual(summary_json['frame_count'], 10)
        self.assertEqual(summary_json['camera_id'], 'CAM-INTEGRATION-01')
        self.assertEqual(summary_json['location'], 'Integration Test Zone')
        self.assertEqual(len(summary_json['frames']), 10)
    
    def test_multiple_incidents_same_day(self):
        """Test saving multiple incidents on the same day."""
        base_time = 1705330822.0
        
        # Save first incident
        frames1, _ = self.create_realistic_incident()
        summary1 = self.storage.save_incident(
            frames=frames1[:5],
            incident_id='INC-20240115-143022',
            timestamp=base_time
        )
        
        # Save second incident (different time, same day)
        frames2, _ = self.create_realistic_incident()
        summary2 = self.storage.save_incident(
            frames=frames2[:5],
            incident_id='INC-20240115-153045',
            timestamp=base_time + 3600  # 1 hour later
        )
        
        # Verify both exist under same date directory
        date_str = '2024-01-15'
        date_dir = Path(self.test_dir) / date_str
        
        self.assertTrue((date_dir / 'INC-20240115-143022').exists())
        self.assertTrue((date_dir / 'INC-20240115-153045').exists())
        
        # Verify both summaries are independent
        self.assertNotEqual(summary1.incident_id, summary2.incident_id)
        self.assertEqual(summary1.frame_count, 5)
        self.assertEqual(summary2.frame_count, 5)
    
    def test_frame_metadata_accuracy(self):
        """Test that saved metadata accurately reflects frame data."""
        # Create single frame with specific properties
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        image[20:40, 30:50] = (0, 0, 255)
        
        bbox1 = BBox(x=30, y=20, width=20, height=20, confidence=0.92)
        bbox2 = BBox(x=50, y=60, width=15, height=15, confidence=0.88)
        
        frame = Frame(
            image=image,
            timestamp=1705330822.543,
            confidence=0.90,
            bounding_boxes=[bbox1, bbox2],
            frame_index=0
        )
        
        # Save frame
        summary = self.storage.save_incident(
            frames=[frame],
            incident_id='INC-METADATA-TEST',
            timestamp=1705330822.543
        )
        
        # Verify metadata matches original frame
        self.assertEqual(len(summary.frames), 1)
        saved_metadata = summary.frames[0]
        
        self.assertEqual(saved_metadata.frame_index, 0)
        self.assertEqual(saved_metadata.timestamp, 1705330822.543)
        self.assertEqual(saved_metadata.confidence, 0.90)
        self.assertEqual(len(saved_metadata.bounding_boxes), 2)
        
        # Verify bounding boxes
        self.assertEqual(saved_metadata.bounding_boxes[0]['x'], 30)
        self.assertEqual(saved_metadata.bounding_boxes[0]['y'], 20)
        self.assertEqual(saved_metadata.bounding_boxes[0]['width'], 20)
        self.assertEqual(saved_metadata.bounding_boxes[0]['height'], 20)
        self.assertEqual(saved_metadata.bounding_boxes[0]['confidence'], 0.92)


if __name__ == '__main__':
    unittest.main()
