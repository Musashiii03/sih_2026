"""
Enhanced Fire Detection with Multi-Threading for 15-20 FPS
Detects: Fire, Smoke, Animals, Humans, and Objects
Uses background inference thread + frame skipping for speed
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
import threading
import queue
from collections import deque

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

# Model paths - look in finalModels folder first
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'finalModels'))
if not os.path.exists(MODELS_DIR):
    MODELS_DIR = '.'

FIRE_MODEL_PATH = os.path.join(MODELS_DIR, "universal_fire_master_100pct.pt")
SMOKE_MODEL_PATH = os.path.join(MODELS_DIR, "smoke_v8s_production.pt")
ANIMAL_MODEL_PATH = os.path.join(MODELS_DIR, "animal_model.pt")
HUMAN_MODEL_PATH = os.path.join(MODELS_DIR, "rescue_human_master_best.pt")
OBJECT_MODEL_PATH = os.path.join(MODELS_DIR, "yolov8n.pt")

# Check models exist
models_to_load = {
    'Fire': FIRE_MODEL_PATH,
    'Smoke': SMOKE_MODEL_PATH,
    'Animal': ANIMAL_MODEL_PATH,
    'Human': HUMAN_MODEL_PATH,
    'Object': OBJECT_MODEL_PATH
}

for model_name, model_path in models_to_load.items():
    if not os.path.exists(model_path):
        print(f"❌ {model_name} model not found: {model_path}")
        sys.exit(1)

print(f"\n🔥 Loading Fire Model: {os.path.basename(FIRE_MODEL_PATH)} ...")
fire_model = YOLO(FIRE_MODEL_PATH)

print(f"💨 Loading Smoke Model: {os.path.basename(SMOKE_MODEL_PATH)} ...")
smoke_model = YOLO(SMOKE_MODEL_PATH)

print(f"🦌 Loading Animal Model: {os.path.basename(ANIMAL_MODEL_PATH)} ...")
animal_model = YOLO(ANIMAL_MODEL_PATH)

print(f"👤 Loading Human Model: {os.path.basename(HUMAN_MODEL_PATH)} ...")
human_model = YOLO(HUMAN_MODEL_PATH)

print(f"📦 Loading Object Detection Model: {os.path.basename(OBJECT_MODEL_PATH)} ...")
object_model = YOLO(OBJECT_MODEL_PATH)

print("✅ All 5 models loaded successfully\n")

# Relevant COCO classes for indoor fire scenarios
RELEVANT_OBJECTS = {
    56: 'chair', 57: 'couch', 58: 'potted plant', 59: 'bed',
    60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop',
    64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone',
    68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink',
    72: 'refrigerator', 73: 'book', 74: 'clock', 75: 'vase',
    76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
}

# ============================================================================
# 2. PREPROCESSING
# ============================================================================

clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

def preprocess_white_background(frame):
    """Fast preprocessing for white backgrounds"""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l_eq = clahe.apply(l)
    lab_eq = cv2.merge((l_eq, a, b))
    enhanced = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)
    
    hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.25, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.90, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

# ============================================================================
# 3. MULTI-THREADED INFERENCE ENGINE
# ============================================================================

class InferenceThread(threading.Thread):
    """Background thread that runs all 5 YOLO models"""
    
    def __init__(self, frame_queue, result_dict, result_lock):
        super().__init__(daemon=True)
        self.frame_queue = frame_queue
        self.result_dict = result_dict
        self.result_lock = result_lock
        self.running = True
        self.frames_processed = 0
        
    def run(self):
        print("🔧 Inference thread started!")
        
        while self.running:
            try:
                frame, frame_num, timestamp = self.frame_queue.get(timeout=0.1)
                self.frames_processed += 1
                
                if self.frames_processed == 1:
                    print("🔧 Processing first frame...")
                    
            except queue.Empty:
                continue
            
            # Preprocess
            processed_frame = preprocess_white_background(frame)
            
            # Run all 5 models (in parallel as much as possible)
            fire_results = fire_model.predict(source=processed_frame, conf=0.25, iou=0.45, verbose=False)[0]
            smoke_results = smoke_model.predict(source=processed_frame, conf=0.28, iou=0.45, verbose=False)[0]
            animal_results = animal_model.predict(source=frame, conf=0.70, iou=0.45, verbose=False)[0]
            human_results = human_model.predict(source=frame, conf=0.45, iou=0.45, verbose=False)[0]
            object_results = object_model.predict(source=frame, conf=0.50, iou=0.45, verbose=False, 
                                                  classes=list(RELEVANT_OBJECTS.keys()))[0]
            
            # Parse FIRE results - Filter only "fire" class (class 0)
            fire_bboxes = []
            for box in fire_results.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                
                # Get class name from model
                class_name = fire_results.names.get(cls_id, '').lower()
                
                # Debug: Log what we're detecting
                if self.frames_processed <= 3:
                    print(f"🔍 Fire model detection: cls_id={cls_id}, class_name='{class_name}', conf={conf:.2f}")
                
                # Only accept "fire" detections, skip "smoke" from fire model
                if 'fire' in class_name and 'smoke' not in class_name:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    fire_bboxes.append({'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1, 
                                       'confidence': conf, 'class': 'fire'})
                elif self.frames_processed <= 3:
                    print(f"   ⚠️ Skipped: '{class_name}' (not fire)")
            
            # Parse SMOKE results
            smoke_bboxes = []
            for box in smoke_results.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                smoke_bboxes.append({'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1, 
                                    'confidence': conf, 'class': 'smoke'})
            
            # Parse ANIMAL results
            animal_bboxes = []
            for box in animal_results.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                animal_bboxes.append({'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1, 
                                     'confidence': conf, 'class': 'animal'})
            
            # Parse HUMAN results
            human_bboxes = []
            for box in human_results.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                human_bboxes.append({'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1, 
                                    'confidence': conf, 'class': 'person'})
            
            # Parse OBJECT results
            object_bboxes = []
            for box in object_results.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                obj_name = RELEVANT_OBJECTS.get(cls_id, 'object')
                object_bboxes.append({'x': x1, 'y': y1, 'width': x2-x1, 'height': y2-y1, 
                                     'confidence': conf, 'class': obj_name})
            
            # Store results
            with self.result_lock:
                self.result_dict[frame_num] = {
                    'fire': fire_bboxes,
                    'smoke': smoke_bboxes,
                    'animals': animal_bboxes,
                    'humans': human_bboxes,
                    'objects': object_bboxes,
                    'timestamp': timestamp
                }
                
            if self.frames_processed % 50 == 0:
                print(f"🔧 Processed {self.frames_processed} frames | "
                      f"Fire: {len(fire_bboxes)} | Smoke: {len(smoke_bboxes)} | "
                      f"Animals: {len(animal_bboxes)} | Humans: {len(human_bboxes)} | "
                      f"Objects: {len(object_bboxes)}")
            
            # Debug: Show total boxes detected from each model
            if self.frames_processed <= 3:
                print(f"📊 Frame {self.frames_processed} raw detections: "
                      f"Fire_raw={len(fire_results.boxes)} -> Fire_filtered={len(fire_bboxes)}, "
                      f"Smoke={len(smoke_bboxes)}, Animals={len(animal_bboxes)}, "
                      f"Humans={len(human_bboxes)}, Objects={len(object_bboxes)}")
    
    def stop(self):
        self.running = False

# ============================================================================
# 4. ENHANCED STORAGE MANAGER
# ============================================================================

class EnhancedStorageManager(StorageManager):
    """Extended storage manager that saves all 5 model detections"""
    
    def save_incident_with_all_detections(self, frames, incident_id, camera_id, location, 
                                         fire_data, smoke_data, animal_data, human_data, object_data):
        """Save incident with comprehensive detection data from all 5 models"""
        import cv2
        
        incident_date = datetime.now().strftime('%Y-%m-%d')
        incident_dir = self.base_path / incident_date / incident_id
        frames_dir = incident_dir / 'frames'
        metadata_dir = incident_dir / 'metadata'
        
        frames_dir.mkdir(parents=True, exist_ok=True)
        metadata_dir.mkdir(parents=True, exist_ok=True)
        
        saved_frames = []
        
        for frame_obj in frames:
            frame_idx = frame_obj.frame_index
            
            # Save frame image
            frame_filename = f"frame_{frame_idx:03d}.jpg"
            frame_path = frames_dir / frame_filename
            cv2.imwrite(str(frame_path), frame_obj.image)
            
            # Enhanced metadata with ALL 5 detections
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
                'smoke': {
                    'detected': frame_idx in smoke_data and len(smoke_data[frame_idx]) > 0,
                    'count': len(smoke_data.get(frame_idx, [])),
                    'bounding_boxes': smoke_data.get(frame_idx, [])
                },
                'animals': {
                    'detected': frame_idx in animal_data and len(animal_data[frame_idx]) > 0,
                    'count': len(animal_data.get(frame_idx, [])),
                    'bounding_boxes': animal_data.get(frame_idx, [])
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
                'fire_count': metadata['fire']['count'],
                'smoke_count': metadata['smoke']['count'],
                'animal_count': metadata['animals']['count'],
                'human_count': metadata['humans']['count'],
                'object_count': metadata['objects']['count']
            })
        
        # Create comprehensive summary
        summary = {
            'incident_id': incident_id,
            'timestamp': time.time(),
            'camera_id': camera_id,
            'location': location,
            'frame_count': len(saved_frames),
            'statistics': {
                'total_fire_detections': sum(f['fire_count'] for f in saved_frames),
                'total_smoke_detections': sum(f['smoke_count'] for f in saved_frames),
                'total_animal_detections': sum(f['animal_count'] for f in saved_frames),
                'total_human_detections': sum(f['human_count'] for f in saved_frames),
                'total_object_detections': sum(f['object_count'] for f in saved_frames)
            }
        }
        
        summary_path = incident_dir / 'summary.json'
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logging.info(f"Saved incident {incident_id}: {len(saved_frames)} frames")
        return summary

# ============================================================================
# 5. VIDEO PROCESSING
# ============================================================================

# Initialize frame extraction
print("📸 Initializing frame extraction system...")
try:
    # Reduced window to 5 seconds so short videos can complete extraction
    frame_extractor = FrameExtractor(sample_rate=5.0, window_duration=5)
    frame_selector = FrameSelector(min_frames=6, max_frames=15, similarity_threshold=0.85)
    storage_manager = StorageManager(base_path=os.path.join('..', '..', 'data', 'fire_incidents'))
    enhanced_storage = EnhancedStorageManager(base_path=storage_manager.base_path)
    print("✅ Frame extraction system initialized (5s window for short videos)")
except Exception as e:
    print(f"⚠️ Frame extraction initialization failed: {e}")
    frame_extractor = None
    enhanced_storage = None

# Video selection
root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
video_path = filedialog.askopenfilename(
    title="Select Video for 5-Model Detection (Fast Multi-threaded)",
    filetypes=[("Video Files", "*.mp4 *.avi *.mov *.mkv *.wmv"), ("All Files", "*.*")]
)

if not video_path:
    print("❌ No video file selected. Exiting.")
    sys.exit(0)

print(f"🎬 Processing video: {video_path}")
cap = cv2.VideoCapture(video_path)

fps = cap.get(cv2.CAP_PROP_FPS)
if fps <= 0 or fps > 120:
    fps = 30.0

print(f"📹 Video FPS: {fps:.1f}")
print("🚀 Starting multi-threaded detection (Target: 15-20 FPS)\n")

# Initialize threading components
frame_queue = queue.Queue(maxsize=5)  # Small queue to avoid lag
result_dict = {}
result_lock = threading.Lock()

# Start inference thread
inference_thread = InferenceThread(frame_queue, result_dict, result_lock)
inference_thread.start()

# Storage for detections
all_fire_detections = {}
all_smoke_detections = {}
all_animal_detections = {}
all_human_detections = {}
all_object_detections = {}

# Display state (persistent across frames)
last_fire = []
last_smoke = []
last_animals = []
last_humans = []
last_objects = []

HOLD_FRAMES = 30  # How long to show detections

fire_hold = 0
smoke_hold = 0
animal_hold = 0
human_hold = 0

frame_counter = 0
prev_time = time.time()
display_fps = 0

# Create window with automatic sizing
window_name = "Fast 5-Model Detection"
cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)  # Changed from WINDOW_NORMAL

print("🎥 Video playback started. Press 'q' to quit.\n")

try:
    while cap.isOpened():
        loop_start = time.time()
        
        ret, frame = cap.read()
        if not ret:
            print("\n✅ Video finished.")
            break
        
        frame_counter += 1
        timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        
        # Send frame to inference thread (non-blocking)
        try:
            frame_queue.put_nowait((frame.copy(), frame_counter, timestamp))
        except queue.Full:
            pass  # Skip if queue full
        
        # Get latest results (look back up to 10 frames)
        results = None
        with result_lock:
            for offset in range(10):
                check_frame = frame_counter - offset
                if check_frame in result_dict:
                    results = result_dict[check_frame]
                    break
        
        # Update display state
        if results:
            if results['fire']:
                fire_hold = HOLD_FRAMES
                last_fire = results['fire']
            elif fire_hold > 0:
                fire_hold -= 1
            
            if results['smoke']:
                smoke_hold = HOLD_FRAMES
                last_smoke = results['smoke']
            elif smoke_hold > 0:
                smoke_hold -= 1
            
            if results['animals']:
                animal_hold = HOLD_FRAMES
                last_animals = results['animals']
            elif animal_hold > 0:
                animal_hold -= 1
            
            if results['humans']:
                human_hold = HOLD_FRAMES
                last_humans = results['humans']
            elif human_hold > 0:
                human_hold -= 1
            
            if results['objects']:
                last_objects = results['objects']
            
            # Frame extraction
            if frame_extractor and len(results['fire']) > 0:
                current_time = time.time()
                
                if not frame_extractor.extraction_active:
                    avg_conf = sum(b['confidence'] for b in results['fire']) / len(results['fire'])
                    extraction_started, severity = frame_extractor.on_fire_detected(
                        current_time, frame, avg_conf, results['fire']
                    )
                    if extraction_started:
                        print(f"🔥 {severity.value.upper()} fire - Frame extraction STARTED")
                
                if frame_extractor.should_extract_frame(current_time):
                    avg_conf = sum(b['confidence'] for b in results['fire']) / len(results['fire'])
                    frame_extractor.extract_frame(frame, current_time, avg_conf, results['fire'])
                    
                    all_fire_detections[frame_counter] = results['fire']
                    all_smoke_detections[frame_counter] = results['smoke']
                    all_animal_detections[frame_counter] = results['animals']
                    all_human_detections[frame_counter] = results['humans']
                    all_object_detections[frame_counter] = results['objects']
                
                if frame_extractor.check_window_complete(current_time):
                    extracted_frames = frame_extractor.get_extracted_frames()
                    if extracted_frames:
                        selected_frames = frame_selector.select_frames(extracted_frames)
                        incident_id = f"INC-{time.strftime('%Y%m%d-%H%M%S')}"
                        
                        summary = enhanced_storage.save_incident_with_all_detections(
                            frames=selected_frames,
                            incident_id=incident_id,
                            camera_id="CAM-01",
                            location="Video Source",
                            fire_data=all_fire_detections,
                            smoke_data=all_smoke_detections,
                            animal_data=all_animal_detections,
                            human_data=all_human_detections,
                            object_data=all_object_detections
                        )
                        
                        print(f"\n✅ Saved: {incident_id}")
                        print(f"   🔥 Fire: {summary['statistics']['total_fire_detections']}")
                        print(f"   💨 Smoke: {summary['statistics']['total_smoke_detections']}")
                        print(f"   🦌 Animals: {summary['statistics']['total_animal_detections']}")
                        print(f"   👤 Humans: {summary['statistics']['total_human_detections']}")
                        print(f"   📦 Objects: {summary['statistics']['total_object_detections']}")
                        print(f"\n🎬 Frame extraction complete! Closing video...\n")
                        
                        all_fire_detections.clear()
                        all_smoke_detections.clear()
                        all_animal_detections.clear()
                        all_human_detections.clear()
                        all_object_detections.clear()
                        
                        # Close video after successful extraction
                        break  # Exit the main loop
        
        # Draw detections
        display_frame = frame.copy()
        
        # Objects (Yellow)
        for bbox in last_objects:
            x1, y1 = bbox['x'], bbox['y']
            x2, y2 = x1 + bbox['width'], y1 + bbox['height']
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
            cv2.putText(display_frame, f"{bbox['class'].upper()} {bbox['confidence']:.2f}", 
                       (x1, max(20, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        # Animals (Green)
        if animal_hold > 0:
            for bbox in last_animals:
                x1, y1 = bbox['x'], bbox['y']
                x2, y2 = x1 + bbox['width'], y1 + bbox['height']
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(display_frame, f"ANIMAL {bbox['confidence']:.2f}", 
                           (x1, max(20, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Humans (Cyan)
        if human_hold > 0:
            for bbox in last_humans:
                x1, y1 = bbox['x'], bbox['y']
                x2, y2 = x1 + bbox['width'], y1 + bbox['height']
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
                cv2.putText(display_frame, f"HUMAN {bbox['confidence']:.2f}", 
                           (x1, max(20, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # Smoke (Orange)
        if smoke_hold > 0:
            for bbox in last_smoke:
                x1, y1 = bbox['x'], bbox['y']
                x2, y2 = x1 + bbox['width'], y1 + bbox['height']
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                cv2.putText(display_frame, f"SMOKE {bbox['confidence']:.2f}", 
                           (x1, max(20, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        
        # Fire (Red - thicker)
        if fire_hold > 0:
            for bbox in last_fire:
                x1, y1 = bbox['x'], bbox['y']
                x2, y2 = x1 + bbox['width'], y1 + bbox['height']
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                cv2.putText(display_frame, f"FIRE {bbox['confidence']:.2f}", 
                           (x1, max(25, y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # HUD
        curr_time = time.time()
        display_fps = 1.0 / (curr_time - prev_time + 1e-6)
        prev_time = curr_time
        
        cv2.rectangle(display_frame, (10, 10), (450, 160), (0, 0, 0), -1)
        cv2.putText(display_frame, f"FPS: {display_fps:.1f}", (20, 35), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if display_fps >= 15 else (0, 165, 255), 2)
        cv2.putText(display_frame, f"Fire: {len(last_fire) if fire_hold > 0 else 0}", (20, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255) if fire_hold > 0 else (140, 140, 140), 2)
        cv2.putText(display_frame, f"Smoke: {len(last_smoke) if smoke_hold > 0 else 0}", (20, 85), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 165, 255) if smoke_hold > 0 else (140, 140, 140), 2)
        cv2.putText(display_frame, f"Animals: {len(last_animals) if animal_hold > 0 else 0}", (20, 110), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0) if animal_hold > 0 else (140, 140, 140), 2)
        cv2.putText(display_frame, f"Humans: {len(last_humans) if human_hold > 0 else 0}", (240, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0) if human_hold > 0 else (140, 140, 140), 2)
        cv2.putText(display_frame, f"Objects: {len(last_objects)}", (240, 85), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255) if len(last_objects) > 0 else (140, 140, 140), 2)
        
        # Queue status
        with result_lock:
            queue_size = len(result_dict)
        cv2.putText(display_frame, f"Queue: {queue_size}", (240, 110), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 100), 1)
        
        # Extraction status
        if frame_extractor and frame_extractor.extraction_active:
            cv2.putText(display_frame, "Recording...", (20, 140), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        cv2.imshow(window_name, display_frame)
        
        # Adaptive wait time for consistent FPS
        loop_time = time.time() - loop_start
        target_time = 1.0 / fps
        wait_ms = max(1, int((target_time - loop_time) * 1000))
        
        if cv2.waitKey(wait_ms) & 0xFF == ord('q'):
            break
        
        # Clean up old results
        with result_lock:
            old_frames = [f for f in result_dict.keys() if f < frame_counter - 30]
            for old_frame in old_frames:
                del result_dict[old_frame]

finally:
    print("\n🛑 Shutting down...")
    
    # Force complete any active extraction before shutdown
    if frame_extractor and frame_extractor.extraction_active:
        print("⚠️ Video ended during extraction - forcing completion...")
        try:
            extracted_frames = frame_extractor.get_extracted_frames()
            if extracted_frames and len(extracted_frames) >= 3:  # At least 3 frames
                selected_frames = frame_selector.select_frames(extracted_frames)
                incident_id = f"INC-{time.strftime('%Y%m%d-%H%M%S')}"
                
                summary = enhanced_storage.save_incident_with_all_detections(
                    frames=selected_frames,
                    incident_id=incident_id,
                    camera_id="CAM-01",
                    location="Video Source",
                    fire_data=all_fire_detections,
                    smoke_data=all_smoke_detections,
                    animal_data=all_animal_detections,
                    human_data=all_human_detections,
                    object_data=all_object_detections
                )
                
                print(f"\n✅ Forced save: {incident_id}")
                print(f"   🔥 Fire: {summary['statistics']['total_fire_detections']}")
                print(f"   💨 Smoke: {summary['statistics']['total_smoke_detections']}")
                print(f"   🦌 Animals: {summary['statistics']['total_animal_detections']}")
                print(f"   👤 Humans: {summary['statistics']['total_human_detections']}")
                print(f"   📦 Objects: {summary['statistics']['total_object_detections']}")
            else:
                print(f"⚠️ Only {len(extracted_frames)} frames extracted - need at least 3")
        except Exception as e:
            print(f"❌ Failed to force save extraction: {e}")
    
    inference_thread.stop()
    inference_thread.join(timeout=2)
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("✅ Multi-threaded 5-Model Detection complete!")
    print(f"📊 Total frames processed by inference: {inference_thread.frames_processed}")
    print(f"💾 All detections saved with comprehensive metadata")
    print(f"🎬 Video closed after frame extraction completion")
