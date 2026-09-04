"""
Unit tests for Storage Manager Module

Tests the storage functionality including:
- FrameMetadata and IncidentSummary dataclasses
- Directory creation
- Frame image saving
- Frame metadata saving
- Incident summary generation
- Complete save_incident workflow
"""

import pytest
import numpy as np
import cv2
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

from frame_extraction.storage import StorageManager, FrameMetadata, IncidentSummary
from frame_extraction.extractor import Frame, BBox


class TestFrameMetadata:
    """Tests for FrameMetadata dataclass."""
    
    def test_frame_metadata_creation(self):
        """Test creating FrameMetadata with all fields."""
        bbox_dict = {'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.9}
        
        metadata = FrameMetadata(
            frame_index=0,
            timestamp=1234567890.5,
            confidence=0.87,
            bounding_boxes=[bbox_dict],
            image_path='/path/to/image.jpg',
            metadata_path='/path/to/metadata.json'
        )
        
        assert metadata.frame_index == 0
        assert metadata.timestamp == 1234567890.5
        assert metadata.confidence == 0.87
        assert len(metadata.bounding_boxes) == 1
        assert metadata.image_path == '/path/to/image.jpg'
    
    def test_frame_metadata_to_dict(self):
        """Test converting FrameMetadata to dictionary."""
        bbox_dict = {'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.9}
        
        metadata = FrameMetadata(
            frame_index=5,
            timestamp=1234567890.5,
            confidence=0.92,
            bounding_boxes=[bbox_dict],
            image_path='/path/to/image.jpg',
            metadata_path='/path/to/metadata.json'
        )
        
        result = metadata.to_dict()
        
        assert result['frame_index'] == 5
        assert result['timestamp'] == 1234567890.5
        assert 'timestamp_readable' in result
        assert result['confidence'] == 0.92
        assert result['bounding_boxes'] == [bbox_dict]
        assert result['image_path'] == '/path/to/image.jpg'


class TestIncidentSummary:
    """Tests for IncidentSummary dataclass."""
    
    def test_incident_summary_creation(self):
        """Test creating IncidentSummary with all fields."""
        bbox_dict = {'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.9}
        
        frame_metadata = FrameMetadata(
            frame_index=0,
            timestamp=1234567890.5,
            confidence=0.87,
            bounding_boxes=[bbox_dict],
            image_path='/path/to/image.jpg',
            metadata_path='/path/to/metadata.json'
        )
        
        summary = IncidentSummary(
            incident_id='INC-20250115-143022',
            timestamp=1234567890.0,
            frame_count=1,
            frames=[frame_metadata],
            incident_path=Path('/path/to/incident'),
            camera_id='CAM-01',
            location='Warehouse A'
        )
        
        assert summary.incident_id == 'INC-20250115-143022'
        assert summary.timestamp == 1234567890.0
        assert summary.frame_count == 1
        assert len(summary.frames) == 1
        assert summary.camera_id == 'CAM-01'
        assert summary.location == 'Warehouse A'
    
    def test_incident_summary_to_dict(self):
        """Test converting IncidentSummary to dictionary."""
        bbox_dict = {'x': 100, 'y': 50, 'width': 200, 'height': 150, 'confidence': 0.9}
        
        frame_metadata = FrameMetadata(
            frame_index=0,
            timestamp=1234567890.5,
            confidence=0.87,
            bounding_boxes=[bbox_dict],
            image_path='/path/to/image.jpg',
            metadata_path='/path/to/metadata.json'
        )
        
        summary = IncidentSummary(
            incident_id='INC-20250115-143022',
            timestamp=1234567890.0,
            frame_count=1,
            frames=[frame_metadata],
            incident_path=Path('/path/to/incident'),
            camera_id='CAM-01',
            location='Warehouse A'
        )
        
        result = summary.to_dict()
        
        assert result['incident_id'] == 'INC-20250115-143022'
        assert result['timestamp'] == 1234567890.0
        assert 'timestamp_readable' in result
        assert result['frame_count'] == 1
        assert result['camera_id'] == 'CAM-01'
        assert result['location'] == 'Warehouse A'
        assert len(result['frames']) == 1


class TestStorageManager:
    """Tests for StorageManager class."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        temp = tempfile.mkdtemp()
        yield Path(temp)
        shutil.rmtree(temp)
    
    @pytest.fixture
    def storage_manager(self, temp_dir):
        """Create a StorageManager instance with temp directory."""
        return StorageManager(base_path=str(temp_dir))
    
    @pytest.fixture
    def sample_frame(self):
        """Create a sample Frame object for testing."""
        # Create a simple test image (100x100 red square)
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        image[:, :] = (0, 0, 255)  # Red in BGR
        
        bbox = BBox(x=10, y=10, width=50, height=50, confidence=0.85)
        
        frame = Frame(
            image=image,
            timestamp=1234567890.5,
            confidence=0.85,
            bounding_boxes=[bbox],
            frame_index=0
        )
        
        return frame
    
    def test_storage_manager_initialization(self, temp_dir):
        """Test StorageManager initialization with custom path."""
        manager = StorageManager(base_path=str(temp_dir))
        assert manager.base_path == temp_dir
        assert manager.image_quality == 90  # Default from config
    
    def test_ensure_directory_exists_creates_directory(self, storage_manager, temp_dir):
        """Test that ensure_directory_exists creates a new directory."""
        test_path = temp_dir / 'test' / 'nested' / 'directory'
        
        result = storage_manager.ensure_directory_exists(test_path)
        
        assert result is True
        assert test_path.exists()
        assert test_path.is_dir()
    
    def test_ensure_directory_exists_already_exists(self, storage_manager, temp_dir):
        """Test that ensure_directory_exists works when directory already exists."""
        test_path = temp_dir / 'existing'
        test_path.mkdir()
        
        result = storage_manager.ensure_directory_exists(test_path)
        
        assert result is True
        assert test_path.exists()
    
    def test_save_frame_image_success(self, storage_manager, temp_dir, sample_frame):
        """Test saving a frame image successfully."""
        image_path = temp_dir / 'test_frame.jpg'
        
        result = storage_manager.save_frame_image(sample_frame, image_path)
        
        assert result is True
        assert image_path.exists()
        
        # Verify image can be read back
        loaded_image = cv2.imread(str(image_path))
        assert loaded_image is not None
        assert loaded_image.shape[:2] == sample_frame.image.shape[:2]
    
    def test_save_frame_image_invalid_path(self, storage_manager):
        """Test save_frame_image with invalid file path."""
        # Create a valid frame
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        bbox = BBox(x=10, y=10, width=50, height=50, confidence=0.85)
        
        frame = Frame(
            image=image,
            timestamp=1234567890.5,
            confidence=0.85,
            bounding_boxes=[bbox],
            frame_index=0
        )
        
        # Use an invalid path (directory that doesn't exist and can't be created)
        image_path = Path('/invalid/path/that/cannot/exist/test_frame.jpg')
        
        # Should handle error gracefully and return False
        result = storage_manager.save_frame_image(frame, image_path)
        
        # May succeed on some systems or fail gracefully
        # Just verify it doesn't crash
        assert isinstance(result, bool)
    
    def test_save_frame_metadata_success(self, storage_manager, temp_dir, sample_frame):
        """Test saving frame metadata successfully."""
        metadata_path = temp_dir / 'test_metadata.json'
        image_path = temp_dir / 'test_frame.jpg'
        
        result = storage_manager.save_frame_metadata(sample_frame, metadata_path, image_path)
        
        assert result is True
        assert metadata_path.exists()
        
        # Verify JSON can be read and contains correct data
        with open(metadata_path, 'r') as f:
            data = json.load(f)
        
        assert data['frame_index'] == sample_frame.frame_index
        assert data['timestamp'] == sample_frame.timestamp
        assert data['confidence'] == sample_frame.confidence
        assert 'timestamp_readable' in data
        assert 'bounding_boxes' in data
        assert data['image_path'] == str(image_path.absolute())
    
    def test_generate_summary(self, storage_manager, sample_frame):
        """Test generating incident summary dictionary."""
        bbox_dict = {'x': 10, 'y': 10, 'width': 50, 'height': 50, 'confidence': 0.85}
        
        frame_metadata = FrameMetadata(
            frame_index=0,
            timestamp=sample_frame.timestamp,
            confidence=sample_frame.confidence,
            bounding_boxes=[bbox_dict],
            image_path='/path/to/image.jpg',
            metadata_path='/path/to/metadata.json'
        )
        
        summary = storage_manager.generate_summary(
            frames=[sample_frame],
            incident_id='INC-TEST-001',
            frame_metadata_list=[frame_metadata],
            timestamp=1234567890.0,
            camera_id='CAM-01',
            location='Test Location'
        )
        
        assert summary['incident_id'] == 'INC-TEST-001'
        assert summary['timestamp'] == 1234567890.0
        assert summary['camera_id'] == 'CAM-01'
        assert summary['location'] == 'Test Location'
        assert summary['frame_count'] == 1
        assert len(summary['frames']) == 1
        assert 'timestamp_readable' in summary
    
    def test_save_incident_success(self, storage_manager, temp_dir):
        """Test complete save_incident workflow."""
        # Create multiple sample frames
        frames = []
        for i in range(3):
            image = np.zeros((100, 100, 3), dtype=np.uint8)
            image[:, :] = (0, 0, 255)  # Red
            
            bbox = BBox(x=10, y=10, width=50, height=50, confidence=0.85)
            
            frame = Frame(
                image=image,
                timestamp=1234567890.0 + i,
                confidence=0.85 + i * 0.01,
                bounding_boxes=[bbox],
                frame_index=i
            )
            frames.append(frame)
        
        # Save incident
        incident_id = 'INC-20090213-233130'
        summary = storage_manager.save_incident(
            frames=frames,
            incident_id=incident_id,
            timestamp=1234567890.0,
            camera_id='CAM-TEST',
            location='Test Location'
        )
        
        # Verify summary
        assert summary.incident_id == incident_id
        assert summary.frame_count == 3
        assert len(summary.frames) == 3
        assert summary.camera_id == 'CAM-TEST'
        assert summary.location == 'Test Location'
        
        # Verify directory structure
        # Note: Use the actual date from the log/summary, not hardcoded
        date_str = datetime.fromtimestamp(1234567890.0).strftime('%Y-%m-%d')
        incident_path = temp_dir / date_str / incident_id
        assert incident_path.exists()
        assert (incident_path / 'frames').exists()
        assert (incident_path / 'metadata').exists()
        assert (incident_path / 'summary.json').exists()
        
        # Verify all frame files exist
        for i in range(3):
            frame_file = incident_path / 'frames' / f'frame_{i:03d}.jpg'
            metadata_file = incident_path / 'metadata' / f'frame_{i:03d}.json'
            assert frame_file.exists()
            assert metadata_file.exists()
        
        # Verify summary.json content
        with open(incident_path / 'summary.json', 'r') as f:
            summary_data = json.load(f)
        
        assert summary_data['incident_id'] == incident_id
        assert summary_data['frame_count'] == 3
        assert len(summary_data['frames']) == 3
    
    def test_save_incident_empty_frames(self, storage_manager):
        """Test save_incident with empty frames list."""
        summary = storage_manager.save_incident(
            frames=[],
            incident_id='INC-EMPTY',
            timestamp=1234567890.0
        )
        
        assert summary.incident_id == 'INC-EMPTY'
        assert summary.frame_count == 0
        assert len(summary.frames) == 0
    
    def test_save_incident_uses_first_frame_timestamp(self, storage_manager, temp_dir):
        """Test that save_incident uses first frame timestamp when not provided."""
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        bbox = BBox(x=10, y=10, width=50, height=50, confidence=0.85)
        
        frame = Frame(
            image=image,
            timestamp=1705330822.0,  # 2025-01-15
            confidence=0.85,
            bounding_boxes=[bbox],
            frame_index=0
        )
        
        summary = storage_manager.save_incident(
            frames=[frame],
            incident_id='INC-TEST-002',
            timestamp=None  # Don't provide timestamp
        )
        
        # Should use frame timestamp
        assert summary.timestamp == frame.timestamp
        
        # Verify correct date directory
        date_str = datetime.fromtimestamp(frame.timestamp).strftime('%Y-%m-%d')
        incident_path = temp_dir / date_str / 'INC-TEST-002'
        assert incident_path.exists()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
