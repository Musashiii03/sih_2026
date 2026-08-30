# Implementation Plan: Fire Frame Extraction Feature

## Overview

This implementation plan converts the fire frame extraction design into discrete coding tasks. The feature extends the existing YOLOv8 fire detection pipeline to capture, select, store, and display representative frames when fire is detected. The implementation follows a layered architecture: Frame Extractor → Frame Selector → Storage Manager → Frame API → Frontend Grid Component.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create `backend/frame_extraction/` directory with `__init__.py`
  - Create `backend/api/` directory
  - Create initial empty module files: `config.py`, `extractor.py`, `selector.py`, `storage.py`
  - _Requirements: 7.1, 7.6_

- [x] 2. Implement Python dependency management
  - [x] 2.1 Create requirements.txt with frame extraction dependencies
    - Add opencv-python>=4.5.0, numpy>=1.21.0, scikit-image>=0.19.0, Pillow>=9.0.0
    - Include existing dependencies: ultralytics, torch, torchvision
    - Add python-dotenv for configuration management
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 2.2 Write property test for dependency version constraints
    - **Property 2: Dependency version validation**
    - **Validates: Requirements 7.2, 7.4, 7.5**

- [x] 3. Implement Configuration Module
  - [x] 3.1 Create backend/frame_extraction/config.py
    - Implement FrameExtractionConfig class with environment variable loading
    - Add validation for SAMPLE_RATE (2.0-5.0 FPS), WINDOW_DURATION (30-60s), MIN_FRAMES (6), MAX_FRAMES (15)
    - Add storage path and image quality configuration
    - Include validate() class method that runs on import
    - _Requirements: 1.2, 1.5, 2.5_

  - [ ]* 3.2 Write unit tests for configuration validation
    - Test valid and invalid ranges for all configuration parameters
    - Test environment variable loading
    - Test validation error messages
    - _Requirements: 1.2, 1.5, 2.5_

- [x] 4. Implement Frame Extractor Module
  - [x] 4.1 Create Frame and BBox data classes in extractor.py
    - Implement Frame dataclass with image, timestamp, confidence, bounding_boxes, frame_index fields
    - Implement BBox dataclass or use dict structure for bounding box coordinates
    - _Requirements: 1.6_

  - [x] 4.2 Implement FrameExtractor class core structure
    - Create __init__ method with sample_rate and window_duration parameters
    - Initialize extraction state tracking variables (extraction_active, start_time, extracted_frames)
    - Add logging configuration
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 4.3 Implement fire detection event handler
    - Implement on_fire_detected() method to start extraction window
    - Record detection timestamp as extraction_start_time
    - Set extraction_active flag
    - Initialize extracted_frames list
    - Add error handling for invalid inputs
    - _Requirements: 1.1, 1.3, 4.1_

  - [x] 4.4 Implement frame sampling logic
    - Implement should_extract_frame() method using sample rate timing
    - Track last_extract_time to enforce FPS interval
    - Calculate time interval as 1/sample_rate seconds
    - _Requirements: 1.2_

  - [ ]* 4.5 Write property test for sample rate accuracy
    - **Property 2: Sample Rate Accuracy**
    - **Validates: Requirements 1.2**

  - [x] 4.6 Implement frame extraction method
    - Implement extract_frame() method to capture frame with metadata
    - Create Frame object with numpy array copy, timestamp, confidence, bounding boxes
    - Append to extracted_frames list
    - Add error handling for OpenCV read errors
    - _Requirements: 1.6, 4.1_

  - [x] 4.7 Implement extraction window completion check
    - Implement check_window_complete() method comparing current time to start time + duration
    - Return True when window duration exceeded or video ends
    - _Requirements: 1.4, 4.4_

  - [ ]* 4.8 Write property test for window duration enforcement
    - **Property 4: Window Duration Enforcement**
    - **Validates: Requirements 1.4, 1.5**

  - [x] 4.9 Implement extraction completion handler
    - Implement get_extracted_frames() method to return and reset state
    - Clear extracted_frames list and reset extraction_active flag
    - Return copy of extracted frames
    - _Requirements: 1.4_

  - [ ]* 4.10 Write property test for extraction trigger reliability
    - **Property 1: Extraction Trigger Reliability**
    - **Validates: Requirements 1.1**

  - [ ]* 4.11 Write property test for metadata completeness
    - **Property 5: Metadata Completeness**
    - **Validates: Requirements 1.6**

  - [ ]* 4.12 Write unit tests for error resilience
    - Test OpenCV read error handling
    - Test invalid timestamp handling
    - Test frame buffer behavior
    - _Requirements: 4.1, 4.5_

- [ ] 5. Checkpoint - Verify frame extraction module
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Frame Selector Module
  - [ ] 6.1 Create FrameSelector class structure in selector.py
    - Implement __init__ with min_frames, max_frames, similarity_threshold parameters
    - Add logging configuration
    - Import scikit-image for SSIM computation
    - _Requirements: 2.5_

  - [ ] 6.2 Implement SSIM computation method
    - Implement compute_similarity() using structural_similarity from scikit-image
    - Convert frames to grayscale for comparison
    - Return similarity score in [0.0, 1.0] range
    - Add error handling for SSIM computation failures
    - _Requirements: 2.2, 2.4_

  - [ ] 6.3 Implement histogram similarity fallback
    - Implement compute_histogram_similarity() using OpenCV histogram comparison
    - Use cv2.compareHist with correlation method
    - Normalize result to [0.0, 1.0] range
    - _Requirements: 2.4, 4.3_

  - [ ] 6.4 Implement frame selection algorithm
    - Implement select_frames() method with diversity-based selection
    - Always select first frame (fire onset)
    - Iteratively add frames with SSIM < similarity_threshold to all selected
    - Enforce min_frames and max_frames constraints
    - Maintain chronological ordering
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 6.5 Write property test for frame analysis completeness
    - **Property 6: Frame Analysis Completeness**
    - **Validates: Requirements 2.1**

  - [ ]* 6.6 Write property test for diversity selection
    - **Property 7: Diversity Selection**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 6.7 Write property test for selection count bounds
    - **Property 8: Selection Count Bounds**
    - **Validates: Requirements 2.5**

  - [ ]* 6.8 Write unit tests for selection error handling
    - Test corrupted frame data handling
    - Test SSIM failure fallback to histogram
    - Test behavior with fewer frames than min_frames
    - _Requirements: 4.3_

- [ ] 7. Implement Storage Manager Module
  - [ ] 7.1 Create data classes in storage.py
    - Implement FrameMetadata dataclass with frame_index, timestamp, confidence, bounding_boxes, paths
    - Implement IncidentSummary dataclass with incident_id, timestamp, frame_count, frames list
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 7.2 Create StorageManager class structure
    - Implement __init__ with base_path parameter
    - Add logging configuration
    - Import Path from pathlib for filesystem operations
    - _Requirements: 3.1_

  - [ ] 7.3 Implement directory creation utility
    - Implement ensure_directory_exists() method using Path.mkdir(parents=True, exist_ok=True)
    - Add error handling for permission errors
    - _Requirements: 3.6, 4.2_

  - [ ]* 7.4 Write property test for directory creation guarantee
    - **Property 15: Directory Creation Guarantee**
    - **Validates: Requirements 3.6**

  - [ ] 7.5 Implement frame image saving
    - Implement save_frame_image() method using cv2.imwrite() with JPEG format
    - Use configured image quality (default 90%)
    - Return success boolean
    - Add error handling for disk write failures
    - _Requirements: 3.1, 4.2_

  - [ ]* 7.6 Write property test for image file format validity
    - **Property 10: Image File Format Validity**
    - **Validates: Requirements 3.1**

  - [ ] 7.7 Implement frame metadata saving
    - Implement save_frame_metadata() method writing JSON with all required fields
    - Include timestamp, timestamp_readable (ISO format), confidence, bounding_boxes, image_path
    - Use json.dump() with indent=2 for readability
    - Add error handling for JSON serialization errors
    - _Requirements: 3.3, 3.4, 4.2_

  - [ ]* 7.8 Write property test for metadata field completeness
    - **Property 13: Metadata Field Completeness**
    - **Validates: Requirements 3.4**

  - [ ] 7.9 Implement incident summary generation
    - Implement generate_summary() method creating summary.json structure
    - Include incident_id, timestamps (unix and readable), camera_id, location, frame_count, frames array
    - Return dictionary ready for JSON serialization
    - _Requirements: 3.5_

  - [ ] 7.10 Implement main save_incident method
    - Implement save_incident() orchestrating full save pipeline
    - Create directory structure: {base_path}/{YYYY-MM-DD}/{incident_id}/frames/ and /metadata/
    - Loop through frames, calling save_frame_image() and save_frame_metadata()
    - Write summary.json at incident root
    - Return IncidentSummary object
    - Add comprehensive error handling and logging
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 4.2_

  - [ ]* 7.11 Write property test for directory structure consistency
    - **Property 11: Directory Structure Consistency**
    - **Validates: Requirements 3.2**

  - [ ]* 7.12 Write property test for metadata file correspondence
    - **Property 12: Metadata File Correspondence**
    - **Validates: Requirements 3.3**

  - [ ]* 7.13 Write property test for storage frame retention
    - **Property 9: Storage Frame Retention**
    - **Validates: Requirements 2.6**

  - [ ]* 7.14 Write property test for summary metadata completeness
    - **Property 14: Summary Metadata Completeness**
    - **Validates: Requirements 3.5**

  - [ ]* 7.15 Write unit tests for storage error resilience
    - Test disk write error handling
    - Test insufficient disk space simulation
    - Test partial write scenarios
    - _Requirements: 4.2_

- [ ] 8. Checkpoint - Verify storage module
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integrate with existing fire detection pipeline
  - [ ] 9.1 Modify run_fire_human_only.py for frame extraction
    - Import FrameExtractor, FrameSelector, StorageManager at top of file
    - Instantiate extraction modules after model initialization
    - Add fire detection event handler calling on_fire_detected()
    - Add frame extraction logic in main loop using should_extract_frame()
    - Add window completion check and processing pipeline
    - Add comprehensive error handling to prevent detection pipeline crashes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.5_

  - [ ]* 9.2 Write integration test for extraction pipeline
    - Test end-to-end flow with test video
    - Verify frames extracted, selected, and stored
    - Verify metadata accuracy
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 9.3 Write property test for extraction error resilience
    - **Property 16: Extraction Error Resilience**
    - **Validates: Requirements 4.1, 4.5**

- [ ] 10. Implement Node.js Frame API Service
  - [x] 10.1 Create backend/package.json with dependencies
    - Add express, cors, dotenv as dependencies
    - Add nodemon as dev dependency
    - Configure start and dev scripts
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 10.2 Create backend/server.js Express server
    - Set up Express app with CORS middleware
    - Configure JSON body parser
    - Import and mount frame_api routes at /api
    - Add health check endpoint
    - Start server on configured port (default 3001)
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ] 10.3 Create backend/api/frame_api.js with route structure
    - Set up Express Router
    - Define INCIDENTS_BASE_PATH constant
    - Add error handling middleware
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 10.4 Implement GET /api/incidents endpoint
    - Implement scanIncidentDirectories() helper to read directory structure
    - Parse date directories and incident subdirectories
    - Read summary.json from each incident for metadata
    - Return sorted list of incidents (newest first)
    - Add error handling for file system errors
    - _Requirements: 5.1, 5.5_

  - [ ] 10.5 Implement GET /api/incidents/:incidentId/summary endpoint
    - Implement findSummaryPath() helper to locate summary.json
    - Read and parse summary JSON file
    - Return complete incident metadata
    - Return 404 if incident not found
    - Return 500 on file read errors
    - _Requirements: 5.2, 5.3, 5.6_

  - [ ]* 10.6 Write property test for API incident summary retrieval
    - **Property 20: API Incident Summary Retrieval**
    - **Validates: Requirements 5.2**

  - [ ]* 10.7 Write property test for API frame data consistency
    - **Property 21: API Frame Data Consistency**
    - **Validates: Requirements 5.3**

  - [ ] 10.8 Implement GET /api/incidents/:incidentId/frames/:frameIndex endpoint
    - Implement findFramePath() helper to locate frame image file
    - Validate incident ID and frame index parameters
    - Serve image file using res.sendFile()
    - Return 404 if frame not found
    - Return 400 for invalid parameters
    - Return 500 on file read errors
    - _Requirements: 5.4, 5.5, 5.6_

  - [ ]* 10.9 Write property test for API frame image serving
    - **Property 22: API Frame Image Serving**
    - **Validates: Requirements 5.4**

  - [ ]* 10.10 Write property test for API HTTP status code correctness
    - **Property 23: API HTTP Status Code Correctness**
    - **Validates: Requirements 5.5, 5.6**

  - [ ]* 10.11 Write integration tests for Frame API
    - Test all endpoints with real test data
    - Test error responses (404, 500, 400)
    - Test CORS headers
    - Test concurrent requests
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 11. Checkpoint - Verify API service
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Frontend Frame Grid Component
  - [ ] 12.1 Create frontend/src/components/FireFrameGrid.jsx component structure
    - Set up React component with state management (incidents, selectedIncidentId, frames, loading, error)
    - Import lucide-react icons (AlertCircle, Flame, Clock)
    - Add propTypes or TypeScript types if applicable
    - _Requirements: 6.1_

  - [ ] 12.2 Implement incident polling logic
    - Add useEffect hook to fetch /api/incidents every 5 seconds
    - Implement fetchIncidents() async function
    - Auto-select newest incident if none selected
    - Update incidents state
    - Add cleanup on unmount to clear interval
    - _Requirements: 6.2_

  - [ ]* 12.3 Write property test for API polling frequency
    - **Property 24: API Polling Frequency**
    - **Validates: Requirements 6.2**

  - [ ] 12.4 Implement frame data fetching
    - Add useEffect hook triggered by selectedIncidentId changes
    - Fetch /api/incidents/:id/summary when incident selected
    - Parse frames array from summary
    - Update frames state
    - Handle loading states
    - _Requirements: 6.2_

  - [ ] 12.5 Implement grid layout rendering
    - Render frame grid with responsive CSS Grid layout
    - Display frames in chronological order
    - Map through frames array to create FrameCard components
    - Add scrollable container for >12 frames
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 12.6 Write property test for frame chronological ordering
    - **Property 26: Frame Chronological Ordering**
    - **Validates: Requirements 6.4**

  - [ ] 12.6 Create FrameCard sub-component
    - Render individual frame with image and metadata
    - Display timestamp using formatTimestamp() helper
    - Display confidence percentage
    - Construct image URL: /api/incidents/:id/frames/:index
    - Add hover effects for interactivity
    - _Requirements: 6.1, 6.3_

  - [ ]* 12.7 Write property test for frame metadata display completeness
    - **Property 25: Frame Metadata Display Completeness**
    - **Validates: Requirements 6.3**

  - [ ] 12.8 Implement error handling for image loading
    - Add onError handler to <img> element
    - Set imageError state on load failure
    - Display error placeholder with AlertCircle icon
    - _Requirements: 6.6_

  - [ ]* 12.9 Write property test for frame load error handling
    - **Property 27: Frame Load Error Handling**
    - **Validates: Requirements 6.6**

  - [ ] 12.10 Implement error state rendering
    - Add error state display for API failures
    - Show user-friendly error messages
    - Add retry capability on next poll interval
    - _Requirements: 6.6_

  - [ ] 12.11 Implement loading state rendering
    - Display loading spinner or skeleton while fetching frames
    - Show "Loading frames..." message
    - _Requirements: 6.2_

  - [ ] 12.12 Add incident selector dropdown
    - Render dropdown in grid header
    - Populate with all available incidents
    - Update selectedIncidentId on change
    - Display incident ID and frame count in options
    - _Requirements: 6.1_

- [ ] 13. Style FireFrameGrid component
  - [ ] 13.1 Create CSS styles for frame grid in index.css or component CSS module
    - Style .fire-frame-grid-container with panel background and borders
    - Style .frame-grid-header with title and incident selector
    - Style .frame-grid with responsive CSS Grid layout (minmax(140px, 1fr))
    - Style .frame-card with hover effects and transitions
    - Style .frame-image with object-fit cover
    - Style .frame-metadata with flex layout
    - Style .frame-error-placeholder for error states
    - Add responsive breakpoints for mobile/tablet
    - _Requirements: 6.1, 6.3, 6.5_

  - [ ]* 13.2 Write visual regression tests or component tests
    - Test grid layout with various frame counts
    - Test responsive behavior
    - Test hover states
    - _Requirements: 6.1, 6.5_

- [ ] 14. Integrate FireFrameGrid into main application
  - [ ] 14.1 Import and add FireFrameGrid to App.jsx
    - Import FireFrameGrid component
    - Add component to right-panel section below EntityBreakdown
    - Pass currentIncidentId prop if available from activeCamera state
    - _Requirements: 6.1_

  - [ ] 14.2 Configure Vite proxy for API requests
    - Update frontend/vite.config.js to add proxy configuration
    - Proxy /api requests to http://localhost:3001
    - Set changeOrigin: true for CORS
    - _Requirements: 5.1, 5.5_

  - [ ]* 14.3 Write end-to-end integration test
    - Test complete flow from frame extraction to frontend display
    - Verify polling behavior
    - Verify frame rendering
    - Verify error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 15. Create data storage directory structure
  - [ ] 15.1 Create data/fire_incidents directory
    - Create directory in backend or project root
    - Set appropriate permissions (750)
    - Add .gitignore entry to exclude frame images from version control
    - _Requirements: 3.2, 3.6_

- [ ] 16. Final integration and testing
  - [ ] 16.1 Verify complete end-to-end workflow
    - Run Python detection script with frame extraction
    - Verify frames are captured and stored
    - Start Node.js API server
    - Start frontend dev server
    - Verify frames display in FireFrameGrid
    - Test all error scenarios
    - _Requirements: All_

  - [ ] 16.2 Create setup documentation
    - Document installation steps (pip install, npm install)
    - Document how to run detection with extraction
    - Document how to start API server
    - Document environment variable configuration
    - _Requirements: 7.1, 7.6_

  - [ ]* 16.3 Write property test for error logging completeness
    - **Property 19: Error Logging Completeness**
    - **Validates: Requirements 4.6**

  - [ ]* 16.4 Write property test for storage error resilience
    - **Property 17: Storage Error Resilience**
    - **Validates: Requirements 4.2**

  - [ ]* 16.5 Write property test for selection error resilience
    - **Property 18: Selection Error Resilience**
    - **Validates: Requirements 4.3**

- [ ] 17. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- The implementation maintains backward compatibility with existing detection pipeline
- Error handling is defensive - extraction failures do not crash detection
- All timestamps are Unix timestamps with millisecond precision
- Frame images are stored as JPEG with 90% quality for efficient storage
- API uses RESTful conventions with appropriate HTTP status codes
- Frontend uses polling instead of WebSockets for simplicity in v1
- Checkpoints ensure incremental validation and user feedback opportunities

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1", "10.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "10.2"] },
    { "id": 2, "tasks": ["3.2", "4.1", "10.3"] },
    { "id": 3, "tasks": ["4.2", "4.3", "10.4"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6", "10.5", "10.6", "10.7"] },
    { "id": 5, "tasks": ["4.7", "4.8", "4.9", "10.8", "10.9", "10.10"] },
    { "id": 6, "tasks": ["4.10", "4.11", "4.12", "6.1", "10.11"] },
    { "id": 7, "tasks": ["6.2", "6.3", "12.1"] },
    { "id": 8, "tasks": ["6.4", "6.5", "6.6", "6.7", "12.2", "12.3"] },
    { "id": 9, "tasks": ["6.8", "7.1", "7.2", "12.4"] },
    { "id": 10, "tasks": ["7.3", "7.4", "7.5", "7.6", "12.5", "12.6"] },
    { "id": 11, "tasks": ["7.7", "7.8", "7.9", "12.7", "12.8", "12.9"] },
    { "id": 12, "tasks": ["7.10", "7.11", "7.12", "7.13", "7.14", "12.10", "12.11", "12.12"] },
    { "id": 13, "tasks": ["7.15", "9.1", "13.1", "13.2"] },
    { "id": 14, "tasks": ["9.2", "9.3", "14.1", "14.2"] },
    { "id": 15, "tasks": ["14.3", "15.1"] },
    { "id": 16, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] }
  ]
}
```
