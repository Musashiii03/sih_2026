"""
Enhanced Fire Detection with Hologram Generation
Detects: Fire, Humans, and Objects (furniture/obstacles)
Stores all coordinates and generates 3D holograms
"""

import cv2
import numpy as np
import time
import os
import sys
import json
import tkinter as tk
from tkinter import filedialog
from ultralytics import YOLO
import logging
from datetime import datetime

# Frame extraction imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from frame_extraction.extractor import FrameExtractor
from frame_extraction.selector import FrameSelector
from frame_extraction.storage import StorageManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# ============================================================================
# 1. INITIALIZE MODELS
# ============================================================================

FIRE_MODEL_PATH = "universal_fire_master_100pct.pt"
HUMAN_MODEL_PATH = "universal_human_master.pt"

# Check models exist
if not os.path.exists(FIRE_MODEL_PATH):
    print(f"❌ Fire model not found: {FIRE_MODEL_PATH}")
    sys.exit(1)

if not os.path.exists(HUMAN_MODEL_PATH):
    candidates = [f for f in os.listdir('.') if 'human' in f.lower() and f.endswith('.pt')]
    if candidates:
        HUMAN_MODEL_PATH = candidates[0]
    else:
        print(f"❌ Human model not found: {HUMAN_MODEL_PATH}")
        sys.exit(1)

print(f"🔥 Loading Fire Model: {FIRE_MODEL_PATH} ...")
fire_model = YOLO(FIRE_MODEL_PATH)

print(f"👤 Loading Human Model: {HUMAN_MODEL_PATH} ...")
human_model = YOLO(HUMAN_MODEL_PATH)

# Try to load COCO model for object detection (furniture, etc.)
print(f"📦 Loading Object Detection Model (COCO)...")
try:
    object_model = YOLO('yolov8n.pt')  # YOLOv8 nano for general objects
    DETECT_OBJECTS = True
    print("✅ Object detection enabled")
except Exception as e:
    print(f"⚠️ Object detection disabled: {e}")
    object_model = None
    DETECT_OBJECTS = False

# Relevant COCO classes for indoor fire scenarios
RELEVANT_OBJECTS = {
    56: 'chair', 57: 'couch', 58: 'potted plant', 59: 'bed',
    60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop',
    64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone',
    68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink',
    72: 'refrigerator', 73: 'book', 74: 'clock', 75: 'vase',
    76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
}

# Initialize frame extraction modules
print("📸 Initializing frame extraction system...")
try:
    frame_extractor = FrameExtractor(sample_rate=5.0, window_duration=30)
    frame_selector = FrameSelector(min_frames=6, max_frames=15, similarity_threshold=0.85)
    storage_manager = StorageManager(base_path=os.path.join('..', '..', 'data', 'fire_incidents'))
    print("✅ Frame extraction system initialized")
except Exception as e:
    print(f"⚠️ Frame extraction initialization failed: {e}")
    frame_extractor = None
    frame_selector = None
    storage_manager = None

# ============================================================================
# 2. ENHANCED STORAGE MANAGER
# ============================================================================

class EnhancedStorageManager(StorageManager):
    """Extended storage manager that saves fire, human, and object detections"""
    
    def save_incident_with_all_detections(self, frames, incident_id, camera_id, location, 
                                         fire_data, human_data, object_data):
        """
        Save incident with comprehensive detection data
        
        Args:
            frames: List of Frame objects (dataclass)
            incident_id: Unique incident ID
            camera_id: Camera identifier
            location: Location description
            fire_data: Dict mapping frame_index -> list of fire bboxes
            human_data: Dict mapping frame_index -> list of human bboxes
            object_data: Dict mapping frame_index -> list of object bboxes
        """
        # Import cv2 here
        import cv2
        
        # Create incident directory
        incident_date = datetime.now().strftime('%Y-%m-%d')
        incident_dir = self.base_path / incident_date / incident_id
        frames_dir = incident_dir / 'frames'
        metadata_dir = incident_dir / 'metadata'
        
        frames_dir.mkdir(parents=True, exist_ok=True)
        metadata_dir.mkdir(parents=True, exist_ok=True)
        
        saved_frames = []
        
        for frame_obj in frames:
            # Access Frame object attributes, not dict keys
            frame_idx = frame_obj.frame_index
            
            # Save frame image
            frame_filename = f"frame_{frame_idx:03d}.jpg"
            frame_path = frames_dir / frame_filename
            cv2.imwrite(str(frame_path), frame_obj.image)
            
            # Enhanced metadata with ALL detections
            metadata = {
                'frame_index': frame_idx,
                'timestamp': frame_obj.timestamp,
                'timestamp_readable': datetime.fromtimestamp(frame_obj.timestamp).isoformat() + 'Z',
                'fire': {
                    'detected': frame_idx in fire_data and len(fire_data[frame_idx]) > 0,
                    'count': len(fire_data.get(frame_idx, [])),
                    'confidence': frame_obj.confidence,
                    'bounding_boxes': fire_data.get(frame_idx, [])
                },
                'humans': {
                    'detected': frame_idx in human_data and len(human_data[frame_idx]) > 0,
                    'count': len(human_data.get(frame_idx, [])),
                    'bounding_boxes': human_data.get(frame_idx, [])
                },
                'objects': {
                    'detected': frame_idx in object_data and len(object_data[frame_idx]) > 0,
                    'count': len(object_data.get(frame_idx, [])),
                    'bounding_boxes': object_data.get(frame_idx, [])
                },
                'image_path': str(frame_path.absolute())
            }
            
            # Save metadata
            metadata_filename = f"frame_{frame_idx:03d}.json"
            metadata_path = metadata_dir / metadata_filename
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            saved_frames.append({
                'frame_index': frame_idx,
                'timestamp': frame_obj.timestamp,
                'timestamp_readable': metadata['timestamp_readable'],
                'fire_confidence': frame_obj.confidence,
                'fire_count': metadata['fire']['count'],
                'human_count': metadata['humans']['count'],
                'object_count': metadata['objects']['count'],
                'image_path': str(frame_path.absolute()),
                'metadata_path': str(metadata_path.absolute())
            })
        
        # Create comprehensive summary
        summary = {
            'incident_id': incident_id,
            'timestamp': time.time(),
            'timestamp_readable': datetime.now().isoformat() + 'Z',
            'camera_id': camera_id,
            'location': location,
            'frame_count': len(saved_frames),
            'frames': saved_frames,
            'statistics': {
                'total_fire_detections': sum(f['fire_count'] for f in saved_frames),
                'total_human_detections': sum(f['human_count'] for f in saved_frames),
                'total_object_detections': sum(f['object_count'] for f in saved_frames),
                'avg_fire_confidence': np.mean([f['fire_confidence'] for f in saved_frames])
            }
        }
        
        # Save summary
        summary_path = incident_dir / 'summary.json'
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logging.info(f"Saved incident {incident_id}: {len(saved_frames)} frames, "
                    f"{summary['statistics']['total_fire_detections']} fires, "
                    f"{summary['statistics']['total_human_detections']} humans, "
                    f"{summary['statistics']['total_object_detections']} objects")
        
        return summary

# Initialize enhanced storage
if storage_manager:
    enhanced_storage = EnhancedStorageManager(base_path=storage_manager.base_path)
else:
    enhanced_storage = None

# ============================================================================
# 3. VIDEO SELECTION & PROCESSING
# ============================================================================

root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
video_path = filedialog.askopenfilename(
    title="Select Video for Fire/Human/Object Detection",
    filetypes=[("Video Files", "*.mp4 *.avi *.mov *.mkv *.wmv"), ("All Files", "*.*")]
)

if not video_path:
    print("❌ No video file selected. Exiting.")
    sys.exit(0)

print(f"🎬 Processing video: {video_path}")
cap = cv2.VideoCapture(video_path)

# CLAHE filter
clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

def preprocess_white_background(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l_eq = clahe.apply(l)
    lab_eq = cv2.merge((l_eq, a, b))
    enhanced = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)
    
    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.25, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.90, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

# Storage for all detections per frame
all_fire_detections = {}
all_human_detections = {}
all_object_detections = {}
frame_counter = 0

print("\n🚀 Playing video with Fire/Human/Object detection. Press 'q' to stop.")
prev_time = time.time()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("🏁 Video playback finished.")
        break
    
    processed_frame = preprocess_white_background(frame)
    
    # ========================================================================
    # RUN ALL MODELS
    # ========================================================================
    
    # Fire detection
    fire_results = fire_model.predict(
        source=processed_frame,
        conf=0.30,
        iou=0.45,
        imgsz=640,
        verbose=False
    )[0]
    
    # Human detection
    human_results = human_model.predict(
        source=frame,
        conf=0.40,
        iou=0.45,
        imgsz=640,
        verbose=False
    )[0]
    
    # Object detection (if enabled)
    if DETECT_OBJECTS:
        object_results = object_model.predict(
            source=frame,
            conf=0.50,
            iou=0.45,
            imgsz=640,
            verbose=False,
            classes=list(RELEVANT_OBJECTS.keys())
        )[0]
    else:
        object_results = None
    
    # ========================================================================
    # PROCESS DETECTIONS
    # ========================================================================
    
    display_frame = frame.copy()
    fire_count = 0
    human_count = 0
    object_count = 0
    
    fire_bboxes = []
    human_bboxes = []
    object_bboxes = []
    
    # Process FIRE detections
    for box in fire_results.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        label_name = fire_results.names[cls_id].lower()
        
        if "smoke" in label_name:
            continue
        
        if "fire" in label_name:
            fire_count += 1
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            
            fire_bboxes.append({
                'x': x1,
                'y': y1,
                'width': x2 - x1,
                'height': y2 - y1,
                'confidence': conf,
                'class': 'fire'
            })
            
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(display_frame, f"FIRE {conf:.2f}", (x1, max(20, y1 - 8)),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    
    # Process HUMAN detections
    for box in human_results.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        
        human_count += 1
        human_bboxes.append({
            'x': x1,
            'y': y1,
            'width': x2 - x1,
            'height': y2 - y1,
            'confidence': conf,
            'class': 'person'
        })
        
        cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
        cv2.putText(display_frame, f"HUMAN {conf:.2f}", (x1, max(20, y1 - 8)),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    
    # Process OBJECT detections
    if object_results:
        for box in object_results.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            
            obj_name = RELEVANT_OBJECTS.get(cls_id, 'object')
            object_count += 1
            
            object_bboxes.append({
                'x': x1,
                'y': y1,
                'width': x2 - x1,
                'height': y2 - y1,
                'confidence': conf,
                'class': obj_name
            })
            
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
            cv2.putText(display_frame, f"{obj_name.upper()} {conf:.2f}", (x1, max(20, y1 - 8)),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
    
    # ========================================================================
    # FRAME EXTRACTION WITH ALL DETECTIONS
    # ========================================================================
    
    if frame_extractor is not None and enhanced_storage is not None:
        try:
            current_time = time.time()
            
            if fire_count > 0:
                if not frame_extractor.extraction_active:
                    avg_confidence = sum(b['confidence'] for b in fire_bboxes) / len(fire_bboxes)
                    extraction_started, severity = frame_extractor.on_fire_detected(current_time, frame, avg_confidence, fire_bboxes)
                    
                    # Log severity classification result
                    if extraction_started:
                        print(f"🔥 {severity.value.upper()} fire detected - Frame extraction STARTED")
                    else:
                        print(f"ℹ️  {severity.value.upper()} fire detected - Frame extraction SKIPPED (safe level)")
                
                if frame_extractor.should_extract_frame(current_time):
                    avg_confidence = sum(b['confidence'] for b in fire_bboxes) / len(fire_bboxes)
                    frame_extractor.extract_frame(frame, current_time, avg_confidence, fire_bboxes)
                    
                    # Store ALL detections for this frame
                    all_fire_detections[frame_counter] = fire_bboxes
                    all_human_detections[frame_counter] = human_bboxes
                    all_object_detections[frame_counter] = object_bboxes
            
            if frame_extractor.check_window_complete(current_time):
                try:
                    extracted_frames = frame_extractor.get_extracted_frames()
                    
                    if extracted_frames:
                        selected_frames = frame_selector.select_frames(extracted_frames)
                        incident_id = f"INC-{time.strftime('%Y%m%d-%H%M%S')}"
                        
                        # Save with ALL detections
                        summary = enhanced_storage.save_incident_with_all_detections(
                            frames=selected_frames,
                            incident_id=incident_id,
                            camera_id="CAM-01",
                            location="Video Source",
                            fire_data=all_fire_detections,
                            human_data=all_human_detections,
                            object_data=all_object_detections
                        )
                        
                        print(f"✅ Saved incident: {incident_id}")
                        print(f"   🔥 Fire: {summary['statistics']['total_fire_detections']}")
                        print(f"   👤 Humans: {summary['statistics']['total_human_detections']}")
                        print(f"   📦 Objects: {summary['statistics']['total_object_detections']}")
                        
                        # Clear detection storage
                        all_fire_detections.clear()
                        all_human_detections.clear()
                        all_object_detections.clear()
                        
                except Exception as e:
                    logging.error(f"Frame extraction error: {e}", exc_info=True)
                    
        except Exception as e:
            logging.error(f"Detection storage error: {e}", exc_info=True)
    
    # ========================================================================
    # DISPLAY HUD
    # ========================================================================
    
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time
    
    # Get current severity for display
    severity_text = ""
    severity_color = (255, 255, 255)
    if frame_extractor is not None:
        current_severity = frame_extractor.get_current_severity()
        if current_severity is not None:
            severity_text = f" ({current_severity.value.upper()})"
            if current_severity.value == "safe":
                severity_color = (0, 255, 0)  # Green
            elif current_severity.value == "moderate":
                severity_color = (0, 165, 255)  # Orange
            elif current_severity.value == "critical":
                severity_color = (0, 0, 255)  # Red
    
    cv2.rectangle(display_frame, (10, 10), (440, 120), (0, 0, 0), -1)
    cv2.putText(display_frame, f"FPS: {fps:.1f}", (20, 32), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    
    # Display fire count with severity indicator
    fire_text = f"Fire: {fire_count}{severity_text}"
    cv2.putText(display_frame, fire_text, (20, 54), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.65, severity_color if fire_count > 0 else (0, 0, 255), 2)
    cv2.putText(display_frame, f"Humans: {human_count}", (20, 76), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0), 2)
    cv2.putText(display_frame, f"Objects: {object_count}", (20, 98), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
    
    # Show extraction status
    if frame_extractor is not None and frame_extractor.extraction_active:
        cv2.putText(display_frame, "Recording Frames...", (20, 118), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
    
    cv2.imshow("Fire/Human/Object Detection", display_frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    
    frame_counter += 1

cap.release()
cv2.destroyAllWindows()

print("\n✅ Detection complete!")
