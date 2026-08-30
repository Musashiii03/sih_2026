# Requirements Document

## Introduction

The Fire Frame Extraction Feature captures and selects representative frames from CCTV footage when fire is detected by the YOLOv8 fire detection model. The system extracts frames at a controlled rate during a defined time window, applies intelligent selection to avoid duplicates, and makes the frames available to the React frontend through a Node.js API for display in the incident review interface.

## Glossary

- **Frame_Extractor**: Python module responsible for extracting frames from video when fire is detected
- **Frame_Selector**: Python component that filters extracted frames to select diverse representative images
- **Storage_Manager**: Python component that writes frames and metadata to disk
- **Frame_API**: Node.js service that provides HTTP endpoints for frame retrieval
- **Frame_Grid**: React component that displays selected fire frames in the right sidebar
- **Fire_Detection_Event**: Timestamp when YOLOv8 fire model first detects fire in video
- **Extraction_Window**: Time duration after Fire_Detection_Event during which frames are extracted
- **Sample_Rate**: Number of frames extracted per second (FPS)
- **Frame_Metadata**: JSON data containing timestamp, confidence score, fire bounding boxes, and file path
- **Dependencies_File**: requirements.txt file listing Python package dependencies

## Requirements

### Requirement 1: Frame Extraction on Fire Detection

**User Story:** As a security operator, I want frames to be automatically extracted when fire is detected, so that I can review the progression of the fire incident.

#### Acceptance Criteria

1.1 WHEN a Fire_Detection_Event occurs, THE Frame_Extractor SHALL begin extracting frames from the video stream

1.2 WHILE extracting frames, THE Frame_Extractor SHALL use OpenCV to capture frames at a rate between 2 and 5 frames per second

1.3 WHEN a Fire_Detection_Event occurs, THE Frame_Extractor SHALL record the detection timestamp as the start of the Extraction_Window

1.4 WHEN the elapsed time since Fire_Detection_Event reaches 30 seconds, THE Frame_Extractor SHALL stop extracting frames

1.5 WHERE the user configures a custom Extraction_Window duration, THE Frame_Extractor SHALL support durations between 30 and 60 seconds

1.6 WHILE extracting frames, THE Frame_Extractor SHALL include the original frame timestamp and fire detection confidence score in each Frame_Metadata record

### Requirement 2: Intelligent Frame Selection

**User Story:** As a security operator, I want only diverse representative frames to be saved, so that I avoid reviewing redundant duplicate images.

#### Acceptance Criteria

2.1 WHEN Frame_Extractor completes extraction, THE Frame_Selector SHALL analyze all extracted frames

2.2 THE Frame_Selector SHALL select frames that show visual diversity in fire progression

2.3 THE Frame_Selector SHALL exclude frames that are visually similar to previously selected frames

2.4 WHEN comparing frames for similarity, THE Frame_Selector SHALL use structural similarity or histogram comparison metrics

2.5 THE Frame_Selector SHALL select between 6 and 15 representative frames per fire incident

2.6 WHEN Frame_Selector completes selection, THE Storage_Manager SHALL retain only the selected frames

### Requirement 3: Frame and Metadata Persistence

**User Story:** As a system administrator, I want extracted frames and their metadata saved to disk, so that incident data persists for review and audit purposes.

#### Acceptance Criteria

3.1 WHEN Frame_Selector completes selection, THE Storage_Manager SHALL write each selected frame to disk as a PNG or JPEG file

3.2 THE Storage_Manager SHALL organize frame files in a directory structure by date and incident identifier

3.3 WHEN writing each frame, THE Storage_Manager SHALL create a corresponding Frame_Metadata JSON file

3.4 THE Frame_Metadata SHALL include the frame timestamp, fire detection confidence score, fire bounding box coordinates, and absolute file path

3.5 THE Storage_Manager SHALL write a summary JSON file containing an array of all Frame_Metadata records for the incident

3.6 WHEN writing files to disk, THE Storage_Manager SHALL create parent directories if they do not exist

### Requirement 4: Error Handling and System Resilience

**User Story:** As a system operator, I want the frame extraction system to handle errors gracefully, so that detection continues even if frame extraction encounters problems.

#### Acceptance Criteria

4.1 IF Frame_Extractor encounters an OpenCV read error, THEN THE Frame_Extractor SHALL log the error and continue processing the next frame

4.2 IF Storage_Manager encounters a disk write error, THEN THE Storage_Manager SHALL log the error and continue attempting to write subsequent frames

4.3 IF Frame_Selector fails to process a frame, THEN THE Frame_Selector SHALL exclude that frame and continue processing remaining frames

4.4 IF the video stream ends before the Extraction_Window completes, THEN THE Frame_Extractor SHALL process all frames captured up to that point

4.5 THE Frame_Extractor SHALL not terminate the fire detection pipeline when extraction errors occur

4.6 WHEN an error occurs in any component, THE component SHALL log an error message with timestamp and error details

### Requirement 5: Backend API for Frame Retrieval

**User Story:** As a frontend developer, I want a Node.js API to retrieve fire frames, so that I can display them in the React interface.

#### Acceptance Criteria

5.1 THE Frame_API SHALL provide an HTTP endpoint that returns a list of incident identifiers

5.2 THE Frame_API SHALL provide an HTTP endpoint that accepts an incident identifier and returns the summary JSON file for that incident

5.3 WHEN the frontend requests frame data, THE Frame_API SHALL read the Frame_Metadata from disk

5.4 THE Frame_API SHALL provide an HTTP endpoint that serves individual frame image files by file path or incident identifier and frame index

5.5 THE Frame_API SHALL return appropriate HTTP status codes for success and error conditions

5.6 IF a requested incident or frame does not exist, THEN THE Frame_API SHALL return HTTP 404 status

### Requirement 6: Frontend Frame Display

**User Story:** As a security operator, I want to see selected fire frames in a grid panel, so that I can quickly review the progression of the fire incident.

#### Acceptance Criteria

6.1 THE Frame_Grid SHALL display selected fire frames in a grid layout in the right sidebar

6.2 THE Frame_Grid SHALL poll the Frame_API at regular intervals to retrieve new incident data

6.3 WHEN displaying each frame, THE Frame_Grid SHALL show the frame timestamp and fire detection confidence score

6.4 THE Frame_Grid SHALL display frames in chronological order from earliest to latest

6.5 WHERE an incident has more than 12 frames, THE Frame_Grid SHALL provide a scrollable view

6.6 WHEN a frame fails to load, THE Frame_Grid SHALL display a placeholder or error indicator for that frame position

### Requirement 7: Python Dependency Management

**User Story:** As a developer, I want a requirements.txt file listing all Python dependencies, so that I can reproduce the environment for frame extraction.

#### Acceptance Criteria

7.1 THE Dependencies_File SHALL list all Python packages required by Frame_Extractor, Frame_Selector, and Storage_Manager

7.2 THE Dependencies_File SHALL include OpenCV with minimum version 4.5.0

7.3 THE Dependencies_File SHALL include the ultralytics package for YOLOv8 integration

7.4 THE Dependencies_File SHALL include numpy with minimum version 1.21.0

7.5 THE Dependencies_File SHALL specify exact or minimum versions for all dependencies

7.6 THE Dependencies_File SHALL be located in the backend directory at backend/requirements.txt
