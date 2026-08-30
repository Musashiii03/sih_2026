import cv2
import numpy as np
import time
import os
import sys
import tkinter as tk
from tkinter import filedialog
from ultralytics import YOLO
import logging

# Frame extraction imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from frame_extraction.extractor import FrameExtractor
from frame_extraction.selector import FrameSelector
from frame_extraction.storage import StorageManager

# Configure logging for frame extraction
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 1. Initialize Models
FIRE_MODEL_PATH = "universal_fire_master_100pct.pt"
HUMAN_MODEL_PATH = "universal_human_master.pt"

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

# Initialize frame extraction modules
print("📸 Initializing frame extraction system...")
try:
    frame_extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
    frame_selector = FrameSelector(min_frames=6, max_frames=15, similarity_threshold=0.85)
    storage_manager = StorageManager(base_path=os.path.join('..', '..', 'data', 'fire_incidents'))
    print("✅ Frame extraction system initialized")
except Exception as e:
    print(f"⚠️ Frame extraction initialization failed: {e}")
    print("   Continuing with fire detection only...")
    frame_extractor = None
    frame_selector = None
    storage_manager = None

# 2. Select Video File via Dialog
root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
video_path = filedialog.askopenfilename(
    title="Select a Video for Fire & Human Detection (Smoke Excluded)",
    filetypes=[("Video Files", "*.mp4 *.avi *.mov *.mkv *.wmv"), ("All Files", "*.*")]
)

if not video_path:
    print("❌ No video file selected. Exiting.")
    sys.exit(0)

print(f"🎬 Processing video: {video_path}")
cap = cv2.VideoCapture(video_path)

# CLAHE filter for bright/white background glare suppression
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

print("\n🚀 Playing video (Fire & Human Only). Press 'q' to stop.")
prev_time = time.time()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("🏁 Video playback finished.")
        break

    # White-background exposure correction
    processed_frame = preprocess_white_background(frame)

    # Run Fire Model
    fire_results = fire_model.predict(
        source=processed_frame,
        conf=0.30,
        iou=0.45,
        imgsz=640,
        verbose=False
    )[0]

    # Run Human Model
    human_results = human_model.predict(
        source=frame,
        conf=0.40,
        iou=0.45,
        imgsz=640,
        verbose=False
    )[0]

    display_frame = frame.copy()
    fire_count = 0
    human_count = 0
    
    # Collect fire bounding boxes for frame extraction
    fire_bboxes = []

    # Draw ONLY Fire Bounding Boxes (Explicitly ignore Smoke)
    for box in fire_results.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        label_name = fire_results.names[cls_id].lower()

        # Filter out smoke completely
        if "smoke" in label_name:
            continue

        if "fire" in label_name:
            fire_count += 1
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            color = (0, 0, 255)  # Bright Red
            
            # Store bounding box data for frame extraction
            fire_bboxes.append({
                'x': x1,
                'y': y1,
                'width': x2 - x1,
                'height': y2 - y1,
                'confidence': conf
            })

            cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                display_frame,
                f"FIRE {conf:.2f}",
                (x1, max(20, y1 - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                color,
                2
            )
    
    # Frame extraction integration - Requirements 1.1, 1.2, 1.3, 1.4, 4.5
    if frame_extractor is not None and frame_selector is not None and storage_manager is not None:
        try:
            current_time = time.time()
            
            # Fire detection event handler - Requirement 1.1
            if fire_count > 0:
                # Start extraction on fire detection
                if not frame_extractor.extraction_active:
                    # Get average confidence from all fire detections
                    avg_confidence = sum(bbox['confidence'] for bbox in fire_bboxes) / len(fire_bboxes) if fire_bboxes else 0.0
                    frame_extractor.on_fire_detected(current_time, frame, avg_confidence, fire_bboxes)
                
                # Extract frame if sample interval elapsed - Requirement 1.2
                if frame_extractor.should_extract_frame(current_time):
                    avg_confidence = sum(bbox['confidence'] for bbox in fire_bboxes) / len(fire_bboxes) if fire_bboxes else 0.0
                    frame_extractor.extract_frame(frame, current_time, avg_confidence, fire_bboxes)
            
            # Check if extraction window complete - Requirement 1.4
            if frame_extractor.check_window_complete(current_time):
                try:
                    # Get extracted frames
                    extracted_frames = frame_extractor.get_extracted_frames()
                    
                    if extracted_frames:
                        # Select diverse frames - Requirements 2.1, 2.2, 2.3
                        selected_frames = frame_selector.select_frames(extracted_frames)
                        
                        # Generate incident ID
                        incident_id = f"INC-{time.strftime('%Y%m%d-%H%M%S')}"
                        
                        # Save incident to storage - Requirements 3.1, 3.2, 3.3, 3.5
                        summary = storage_manager.save_incident(
                            frames=selected_frames,
                            incident_id=incident_id,
                            camera_id="CAM-01",
                            location="Video Source"
                        )
                        
                        print(f"✅ Saved fire incident: {incident_id} ({len(selected_frames)} frames)")
                    else:
                        print("⚠️ No frames extracted during window")
                        
                except Exception as e:
                    # Requirement 4.5: Don't terminate detection pipeline on extraction errors
                    print(f"⚠️ Frame extraction error: {e}")
                    logging.error(f"Frame extraction processing error: {e}", exc_info=True)
                    
        except Exception as e:
            # Requirement 4.5: Comprehensive error handling to prevent pipeline crashes
            logging.error(f"Frame extraction error (non-critical): {e}", exc_info=True)
            # Continue with fire detection

    # Draw Human Bounding Boxes (Neon Cyan)
    for box in human_results.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

        color = (255, 255, 0)  # Cyan
        human_count += 1

        cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            display_frame,
            f"HUMAN {conf:.2f}",
            (x1, max(20, y1 - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            color,
            2
        )

    # Display HUD Stats
    curr_time = time.time()
    fps = 1.0 / (curr_time - prev_time + 1e-6)
    prev_time = curr_time

    cv2.rectangle(display_frame, (10, 10), (380, 80), (0, 0, 0), -1)
    cv2.putText(display_frame, f"FPS: {fps:.1f}", (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    cv2.putText(display_frame, f"Fire Detected: {fire_count}", (20, 54), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)
    cv2.putText(display_frame, f"Humans Detected: {human_count}", (20, 74), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0), 2)

    cv2.imshow("Fire & Human Real-Time Detection", display_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()