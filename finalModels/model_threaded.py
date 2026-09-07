"""
Multi-threaded Fire Detection System with Intelligent Frame Extraction
- Runs 5 YOLO models in background thread
- Displays video at 30 FPS
- Extracts 6-10 best frames when fire is detected
"""

import cv2
import numpy as np
import time
import os
import tkinter as tk
import tkinter.filedialog as fd
from ultralytics import YOLO
import threading
import queue
from collections import deque
from datetime import datetime

# ============================================================================
# 1. VIDEO PICKER
# ============================================================================
root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
video_path = fd.askopenfilename(
    title="Select Test Video",
    filetypes=[("Video Files", "*.mp4 *.avi *.mkv *.mov")]
)
root.destroy()

if not video_path:
    print("❌ No video selected.")
    exit()

print(f"📁 Selected video: {video_path}")

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("❌ Cannot read video file.")
    exit()

# Get video properties
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
fps = 30.0 if fps <= 0 or fps > 120 else fps
duration = total_frames / fps if fps > 0 else 0

print(f"📹 Video info:")
print(f"   - Total frames: {total_frames}")
print(f"   - FPS: {fps:.1f}")
print(f"   - Duration: {duration:.1f} seconds")

# ============================================================================
# 2. LOAD MODELS
# ============================================================================
models_dir = os.path.dirname(os.path.abspath(__file__))
fire_model_path   = os.path.join(models_dir, "universal_fire_master_100pct.pt")
smoke_model_path  = os.path.join(models_dir, "smoke_v8s_production.pt")
animal_model_path = os.path.join(models_dir, "animal_model.pt")
human_model_path  = os.path.join(models_dir, "rescue_human_master_best.pt")
object_model_path = os.path.join(models_dir, "yolov8n.pt")

print(f"\n▶ Fire Model Locked         : {os.path.basename(fire_model_path)}")
print(f"▶ Smoke Model Locked        : {os.path.basename(smoke_model_path)}")
print(f"▶ Animal Model Locked       : {os.path.basename(animal_model_path)}")
print(f"▶ Rescue Human Model Locked : {os.path.basename(human_model_path)}")
print(f"▶ Object Model Locked       : {os.path.basename(object_model_path)}")

fire_model   = YOLO(fire_model_path)
smoke_model  = YOLO(smoke_model_path)
animal_model = YOLO(animal_model_path)
human_model  = YOLO(human_model_path)
object_model = YOLO(object_model_path)

RELEVANT_OBJECTS = {
    56: 'chair', 57: 'couch', 58: 'potted plant', 59: 'bed',
    60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop',
    64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone',
    68: 'microwave', 69: 'oven', 70: 'toaster', 71: 'sink',
    72: 'refrigerator', 73: 'book', 74: 'clock', 75: 'vase',
    76: 'scissors', 77: 'teddy bear', 78: 'hair drier', 79: 'toothbrush'
}

# ============================================================================
# 3. UTILITY FUNCTIONS
# ============================================================================
def compute_iou(boxA, boxB):
    xa, ya = max(boxA[0], boxB[0]), max(boxA[1], boxB[1])
    xb, yb = min(boxA[2], boxB[2]), min(boxA[3], boxB[3])
    inter = max(0, xb - xa) * max(0, yb - ya)
    if inter == 0:
        return 0.0
    areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    return inter / float(areaA + areaB - inter)

def compute_iomin(boxA, boxB):
    xa, ya = max(boxA[0], boxB[0]), max(boxA[1], boxB[1])
    xb, yb = min(boxA[2], boxB[2]), min(boxA[3], boxB[3])
    inter = max(0, xb - xa) * max(0, yb - ya)
    if inter == 0:
        return 0.0
    areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    return inter / float(min(areaA, areaB))

def verify_flame_strict(crop, bh, frame_h):
    if crop.size == 0 or crop.shape[0] < 4 or crop.shape[1] < 4:
        return False
    if bh > (frame_h * 0.40):
        return False
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    v, s, h = hsv[:, :, 2], hsv[:, :, 1], hsv[:, :, 0]
    white_core = np.count_nonzero(v >= 245) / v.size
    flame_color = np.count_nonzero(((h <= 26) | (h >= 168)) & (s > 95) & (v > 140)) / h.size
    return (white_core > 0.015) or (flame_color > 0.04)

def is_valid_smoke(crop, box, frame_w, frame_h):
    if crop.size == 0 or crop.shape[0] < 4 or crop.shape[1] < 4:
        return False
    bx1, by1, bx2, by2 = box
    bw, bh = bx2 - bx1, by2 - by1
    if bh > (frame_h * 0.35) and (bw / float(bh)) < 0.50:
        return False
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    pure_white = np.count_nonzero(gray >= 250) / gray.size
    if pure_white > 0.05:
        return False
    if bx1 < (frame_w * 0.35) and by2 > (frame_h * 0.50):
        std_dev = np.std(gray)
        if std_dev < 24.0:
            return False
    return True

def is_valid_human(crop, bw, bh, frame_w, frame_h):
    if crop.size == 0 or bw < 18 or bh < 30:
        return False
    if bw > (frame_w * 0.65) or bh > (frame_h * 0.65):
        return False
    aspect_ratio = bw / float(bh)
    if aspect_ratio < 0.30 or aspect_ratio > 0.95:
        return False
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    if np.std(gray) < 18.0:
        return False
    return True

def is_valid_animal(crop, bw, bh, frame_w, frame_h):
    if crop.size == 0 or bw < 10 or bh < 10:
        return False
    aspect_ratio = bw / float(bh)
    if aspect_ratio > 2.0 or aspect_ratio < 0.4:
        return False
    if bw > (frame_w * 0.35) or bh > (frame_h * 0.50):
        return False
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    v = hsv[:, :, 2]
    if (np.count_nonzero(v >= 248) / v.size) > 0.03:
        return False
    return True

def compute_frame_quality_score(frame, fire_boxes, smoke_boxes):
    """
    Compute quality score for frame selection:
    - Fire coverage
    - Detection confidence
    - Image sharpness (Laplacian variance)
    - Diversity (different from previously selected)
    """
    h, w = frame.shape[:2]
    total_area = float(h * w)
    
    # Fire coverage
    fire_area = sum((x2-x1)*(y2-y1) for x1,y1,x2,y2,_ in fire_boxes)
    fire_coverage = (fire_area / total_area) * 100.0
    
    # Average confidence
    avg_conf = np.mean([conf for *_, conf in fire_boxes]) if fire_boxes else 0.0
    
    # Image sharpness
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Weighted score
    score = (fire_coverage * 2.0) + (avg_conf * 100.0) + (sharpness * 0.1)
    
    return score, fire_coverage, avg_conf, sharpness

# ============================================================================
# 4. FRAME EXTRACTION SYSTEM
# ============================================================================
class FireFrameExtractor:
    def __init__(self, output_dir="fire_extractions", min_frames=6, max_frames=10):
        self.output_dir = output_dir
        self.min_frames = min_frames
        self.max_frames = max_frames
        self.frame_buffer = deque(maxlen=60)  # Keep last 60 frames (2 seconds at 30fps)
        self.fire_incident_active = False
        self.incident_start_time = None
        self.incident_id = None
        self.extracted_count = 0
        
        os.makedirs(output_dir, exist_ok=True)
    
    def add_frame(self, frame, timestamp, fire_boxes, smoke_boxes, has_fire):
        """Add frame to buffer with metadata"""
        if has_fire:
            score, coverage, conf, sharpness = compute_frame_quality_score(frame, fire_boxes, smoke_boxes)
            self.frame_buffer.append({
                'frame': frame.copy(),
                'timestamp': timestamp,
                'fire_boxes': fire_boxes,
                'smoke_boxes': smoke_boxes,
                'score': score,
                'coverage': coverage,
                'confidence': conf,
                'sharpness': sharpness
            })
            
            if not self.fire_incident_active:
                # New fire incident detected
                self.fire_incident_active = True
                self.incident_start_time = timestamp
                self.incident_id = datetime.now().strftime("INC-%Y%m%d-%H%M%S")
                self.extracted_count = 0
                print(f"\n🔥 FIRE INCIDENT DETECTED: {self.incident_id}")
                print(f"   Starting frame extraction...")
        
        elif self.fire_incident_active:
            # Fire ended - extract best frames
            self._extract_best_frames()
            self.fire_incident_active = False
            self.frame_buffer.clear()
    
    def _extract_best_frames(self):
        """Select and save 6-10 best frames from buffer"""
        if len(self.frame_buffer) < self.min_frames:
            print(f"   ⚠️  Only {len(self.frame_buffer)} frames available, need at least {self.min_frames}")
            return
        
        # Sort frames by quality score
        sorted_frames = sorted(self.frame_buffer, key=lambda x: x['score'], reverse=True)
        
        # Select diverse frames (avoid too similar frames)
        selected_frames = []
        for candidate in sorted_frames:
            if len(selected_frames) >= self.max_frames:
                break
            
            # Check diversity (at least 0.5 seconds apart)
            is_diverse = all(
                abs(candidate['timestamp'] - s['timestamp']) > 0.5
                for s in selected_frames
            )
            
            if is_diverse or len(selected_frames) < self.min_frames:
                selected_frames.append(candidate)
        
        # Save frames
        incident_dir = os.path.join(self.output_dir, self.incident_id)
        os.makedirs(incident_dir, exist_ok=True)
        
        for idx, frame_data in enumerate(sorted(selected_frames, key=lambda x: x['timestamp'])):
            filename = f"frame_{idx:03d}_t{frame_data['timestamp']:.2f}s_score{frame_data['score']:.1f}.jpg"
            filepath = os.path.join(incident_dir, filename)
            cv2.imwrite(filepath, frame_data['frame'])
            self.extracted_count += 1
        
        print(f"   ✅ Extracted {len(selected_frames)} frames to: {incident_dir}")
        quality_scores = [f"{f['score']:.1f}" for f in selected_frames]
        print(f"   📊 Quality scores: {quality_scores}")

# ============================================================================
# 5. INFERENCE THREAD
# ============================================================================
class InferenceThread(threading.Thread):
    def __init__(self, frame_queue, result_dict, result_lock):
        super().__init__(daemon=True)
        self.frame_queue = frame_queue
        self.result_dict = result_dict
        self.result_lock = result_lock
        self.running = True
    
    def run(self):
        print("🔧 Inference thread started!")
        frame_count = 0
        while self.running:
            try:
                frame, frame_num, timestamp = self.frame_queue.get(timeout=0.1)
                frame_count += 1
                if frame_count == 1:
                    print("🔧 First frame received, starting inference...")
            except queue.Empty:
                continue
            
            h_f, w_f, _ = frame.shape
            total_frame_area = float(h_f * w_f)
            
            # 1. Fire Detection
            fire_res = fire_model.predict(frame, conf=0.25, verbose=False)[0]
            cur_fire = []
            cur_fire_area = 0
            for box in fire_res.boxes:
                if int(box.cls[0]) == 0:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf[0])
                    crop = frame[max(0, y1):min(h_f, y2), max(0, x1):min(w_f, x2)]
                    if verify_flame_strict(crop, y2 - y1, h_f):
                        cur_fire.append((x1, y1, x2, y2, conf))
                        cur_fire_area += (x2 - x1) * (y2 - y1)
            
            cur_fire_pct = (cur_fire_area / total_frame_area) * 100.0
            
            # 2. Smoke Detection
            smoke_res = smoke_model.predict(frame, conf=0.28, verbose=False)[0]
            cur_smoke = []
            cur_smoke_area = 0
            for box in smoke_res.boxes:
                sx1, sy1, sx2, sy2 = map(int, box.xyxy[0])
                s_conf = float(box.conf[0])
                s_box = (sx1, sy1, sx2, sy2)
                
                if any(compute_iou(s_box, fb[:4]) > 0.30 for fb in cur_fire):
                    continue
                
                crop = frame[max(0, sy1):min(h_f, sy2), max(0, sx1):min(w_f, sx2)]
                if not is_valid_smoke(crop, s_box, w_f, h_f):
                    continue
                
                cur_smoke.append((sx1, sy1, sx2, sy2, s_conf))
                cur_smoke_area += (sx2 - sx1) * (sy2 - sy1)
            
            cur_smoke_pct = (cur_smoke_area / total_frame_area) * 100.0
            
            # 3. Animal Detection
            animal_res = animal_model.predict(frame, conf=0.70, verbose=False)[0]
            cur_animals = []
            for box in animal_res.boxes:
                ax1, ay1, ax2, ay2 = map(int, box.xyxy[0])
                a_conf = float(box.conf[0])
                ab = (ax1, ay1, ax2, ay2)
                bw, bh = ax2 - ax1, ay2 - ay1
                
                if any(compute_iou(ab, fb[:4]) > 0.20 for fb in cur_fire):
                    continue
                if any(compute_iou(ab, sb[:4]) > 0.25 for sb in cur_smoke):
                    continue
                
                crop = frame[max(0, ay1):min(h_f, ay2), max(0, ax1):min(w_f, ax2)]
                if not is_valid_animal(crop, bw, bh, w_f, h_f):
                    continue
                
                cur_animals.append((ax1, ay1, ax2, ay2, a_conf))
            
            # 4. Human Detection
            human_res = human_model.predict(frame, conf=0.45, verbose=False)[0]
            raw_humans = []
            for box in human_res.boxes:
                hx1, hy1, hx2, hy2 = map(int, box.xyxy[0])
                h_conf = float(box.conf[0])
                bw = hx2 - hx1
                bh = hy2 - hy1
                
                if any(compute_iou((hx1, hy1, hx2, hy2), fb[:4]) > 0.35 for fb in cur_fire):
                    continue
                
                crop = frame[max(0, hy1):min(h_f, hy2), max(0, hx1):min(w_f, hx2)]
                if not is_valid_human(crop, bw, bh, w_f, h_f):
                    continue
                
                raw_humans.append((hx1, hy1, hx2, hy2, h_conf))
            
            raw_humans = sorted(raw_humans, key=lambda x: x[4], reverse=True)
            cur_humans = []
            for h_cand in raw_humans:
                if any(compute_iomin(h_cand[:4], kept[:4]) > 0.45 or 
                       compute_iou(h_cand[:4], kept[:4]) > 0.25 for kept in cur_humans):
                    continue
                cur_humans.append(h_cand)
            
            # 5. Object Detection
            object_res = object_model.predict(
                source=frame,
                conf=0.50,
                iou=0.45,
                verbose=False,
                classes=list(RELEVANT_OBJECTS.keys())
            )[0]
            cur_objects = []
            for box in object_res.boxes:
                cls_id = int(box.cls[0].item())
                ox1, oy1, ox2, oy2 = map(int, box.xyxy[0].tolist())
                o_conf = float(box.conf[0].item())
                obj_name = RELEVANT_OBJECTS.get(cls_id, 'object')
                cur_objects.append((ox1, oy1, ox2, oy2, o_conf, obj_name))
            
            # Store results
            with self.result_lock:
                self.result_dict[frame_num] = {
                    'fire': cur_fire,
                    'smoke': cur_smoke,
                    'animals': cur_animals,
                    'humans': cur_humans,
                    'objects': cur_objects,
                    'fire_pct': cur_fire_pct,
                    'smoke_pct': cur_smoke_pct,
                    'timestamp': timestamp
                }
                if frame_count % 30 == 0:  # Print every 30 frames
                    print(f"🔧 Processed {frame_count} frames. Fire: {len(cur_fire)}, Smoke: {len(cur_smoke)}, Humans: {len(cur_humans)}")
    
    def stop(self):
        self.running = False

# ============================================================================
# 6. MAIN LOOP
# ============================================================================
print("\n🎬 Starting Multi-Threaded Fire Detection System")
print(f"   Video FPS: {fps:.1f}")
print(f"   Inference thread starting...")
print(f"   Press 'q' to quit, SPACE to pause\n")

# Initialize
frame_queue = queue.Queue(maxsize=10)
result_dict = {}
result_lock = threading.Lock()
extractor = FireFrameExtractor()

# Start inference thread
inference_thread = InferenceThread(frame_queue, result_dict, result_lock)
inference_thread.start()
print(f"🔧 Thread started. Is alive: {inference_thread.is_alive()}")
time.sleep(0.1)  # Give thread time to initialize
print(f"🔧 Thread check after 0.1s. Is alive: {inference_thread.is_alive()}")

# Display state
HOLD_FRAMES = 45
fire_hold = 0
smoke_hold = 0
animal_hold = 0
human_hold = 0

last_fire = []
last_smoke = []
last_animals = []
last_humans = []
last_objects = []

max_fire_coverage = 0.0
max_smoke_coverage = 0.0
max_animal_count = 0
max_human_count = 0
max_object_count = 0

frame_counter = 0
paused = False
last_frame_time = time.time()
frames_sent_to_queue = 0

# Get total frames for progress display
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Create display window
cv2.namedWindow("Multi-Threaded Fire Detection", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Multi-Threaded Fire Detection", 1280, 720)

try:
    print("🎥 Starting video playback...")
    while cap.isOpened():
        if not paused:
            # Mark start of frame processing
            if frame_counter == 0:
                last_frame_time = time.time()
            
            ret, frame = cap.read()
            if not ret:
                print(f"\n✅ Video finished. Total frames processed: {frame_counter}")
                break
            
            if frame_counter == 0:
                print(f"📹 Video resolution: {frame.shape[1]}x{frame.shape[0]}")
            
            frame_counter += 1
            timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            
            # Send frame to inference thread (non-blocking)
            try:
                frame_queue.put_nowait((frame.copy(), frame_counter, timestamp))
                frames_sent_to_queue += 1
                if frames_sent_to_queue == 1:
                    print("🔧 First frame sent to inference queue")
            except queue.Full:
                pass  # Skip if queue is full
            
            # Get latest detection results (check recent frames, not just exact match)
            results = None
            with result_lock:
                # Look for results from this frame or recent frames
                for offset in range(10):
                    check_frame = frame_counter - offset
                    if check_frame in result_dict:
                        results = result_dict[check_frame]
                        break
            
            if results:
                # Update display state
                if results['fire']:
                    fire_hold = HOLD_FRAMES
                    last_fire = results['fire']
                    max_fire_coverage = max(max_fire_coverage, results['fire_pct'])
                elif fire_hold > 0:
                    fire_hold -= 1
                
                if results['smoke']:
                    smoke_hold = HOLD_FRAMES
                    last_smoke = results['smoke']
                    max_smoke_coverage = max(max_smoke_coverage, results['smoke_pct'])
                elif smoke_hold > 0:
                    smoke_hold -= 1
                
                if results['animals']:
                    animal_hold = HOLD_FRAMES
                    last_animals = results['animals']
                    max_animal_count = max(max_animal_count, len(results['animals']))
                elif animal_hold > 0:
                    animal_hold -= 1
                
                if results['humans']:
                    human_hold = HOLD_FRAMES
                    last_humans = results['humans']
                    max_human_count = max(max_human_count, len(results['humans']))
                elif human_hold > 0:
                    human_hold -= 1
                
                if results['objects']:
                    last_objects = results['objects']
                    max_object_count = max(max_object_count, len(results['objects']))
                
                # Add to frame extractor
                has_fire = len(results['fire']) > 0
                extractor.add_frame(frame, timestamp, results['fire'], results['smoke'], has_fire)
            else:
                # No results yet, just decrement hold timers
                if fire_hold > 0:
                    fire_hold -= 1
                if smoke_hold > 0:
                    smoke_hold -= 1
                if animal_hold > 0:
                    animal_hold -= 1
                if human_hold > 0:
                    human_hold -= 1
            
            # Clean up old results
            with result_lock:
                old_frames = [f for f in result_dict.keys() if f < frame_counter - 30]
                for old_frame in old_frames:
                    del result_dict[old_frame]
            
            # Draw detections
            display_frame = frame.copy()
            
            # Draw Objects (Yellow)
            for (ox1, oy1, ox2, oy2, conf, name) in last_objects:
                cv2.rectangle(display_frame, (ox1, oy1), (ox2, oy2), (0, 255, 255), 2)
                cv2.putText(display_frame, f"{name.upper()} {conf:.2f}", (ox1, max(20, oy1 - 8)),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
            
            # Draw Animals (Green)
            if animal_hold > 0:
                for (x1, y1, x2, y2, conf) in last_animals:
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(display_frame, f"ANIMAL {conf:.2f}", (x1, max(20, y1 - 8)),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Draw Humans (Cyan)
            if human_hold > 0:
                for (x1, y1, x2, y2, conf) in last_humans:
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
                    cv2.putText(display_frame, f"HUMAN {conf:.2f}", (x1, max(20, y1 - 8)),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            # Draw Smoke (Orange)
            if smoke_hold > 0:
                for (x1, y1, x2, y2, conf) in last_smoke:
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                    cv2.putText(display_frame, f"SMOKE {conf:.2f}", (x1, max(20, y1 - 8)),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
            
            # Draw Fire (Red)
            if fire_hold > 0:
                for (x1, y1, x2, y2, conf) in last_fire:
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                    cv2.putText(display_frame, f"FIRE {conf:.2f}", (x1, max(25, y1 - 8)),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            # Draw HUD
            box_x1, box_y1, box_x2, box_y2 = 15, 15, 380, 210
            overlay = display_frame.copy()
            cv2.rectangle(overlay, (box_x1, box_y1), (box_x2, box_y2), (20, 20, 20), -1)
            cv2.addWeighted(overlay, 0.75, display_frame, 0.25, 0, display_frame)
            cv2.rectangle(display_frame, (box_x1, box_y1), (box_x2, box_y2), (80, 80, 80), 2)
            
            cv2.putText(display_frame, "INCIDENT AUDIT LOG", (box_x1 + 10, box_y1 + 22),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            
            # Processing indicator
            with result_lock:
                processing_count = len(result_dict)
            processing_text = f"Processing: {processing_count} frames in queue"
            cv2.putText(display_frame, processing_text, (box_x1 + 10, box_y1 + 45),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 200, 100), 1)
            
            col_fire = (0, 0, 255) if max_fire_coverage > 0 else (140, 140, 140)
            col_smoke = (0, 165, 255) if max_smoke_coverage > 0 else (140, 140, 140)
            col_human = (255, 255, 0) if max_human_count > 0 else (140, 140, 140)
            col_animal = (0, 255, 0) if max_animal_count > 0 else (140, 140, 140)
            col_obj = (0, 255, 255) if max_object_count > 0 else (140, 140, 140)
            
            cv2.putText(display_frame, f"Fire Coverage   : {max_fire_coverage:.2f}%", (box_x1 + 10, box_y1 + 68),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_fire, 2 if max_fire_coverage > 0 else 1)
            cv2.putText(display_frame, f"Smoke Coverage  : {max_smoke_coverage:.2f}%", (box_x1 + 10, box_y1 + 92),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_smoke, 2 if max_smoke_coverage > 0 else 1)
            cv2.putText(display_frame, f"Humans Detected : {max_human_count}", (box_x1 + 10, box_y1 + 116),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_human, 2 if max_human_count > 0 else 1)
            cv2.putText(display_frame, f"Animals Detected: {max_animal_count}", (box_x1 + 10, box_y1 + 140),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_animal, 2 if max_animal_count > 0 else 1)
            cv2.putText(display_frame, f"Objects Detected: {max_object_count}", (box_x1 + 10, box_y1 + 164),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, col_obj, 2 if max_object_count > 0 else 1)
            
            # Extraction status
            if extractor.fire_incident_active:
                cv2.putText(display_frame, "🔥 EXTRACTING FRAMES", (box_x1 + 10, box_y1 + 188),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            else:
                cv2.putText(display_frame, f"Extracted: {extractor.extracted_count} frames", (box_x1 + 10, box_y1 + 188),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 140, 140), 1)
            
            cv2.imshow("Multi-Threaded Fire Detection", display_frame)
            
            # Maintain proper FPS playback - measure from start of frame processing
            frame_process_time = time.time() - last_frame_time
            target_frame_time = 1.0 / fps  # Target time per frame (e.g., 0.04s for 25fps)
            sleep_time = target_frame_time - frame_process_time
            
            # Wait for remaining time to maintain FPS
            if sleep_time > 0:
                wait_ms = int(sleep_time * 1000)
            else:
                wait_ms = 1  # Minimum wait to allow window updates
            
            key = cv2.waitKey(wait_ms) & 0xFF
            
            # Update timing for next frame
            last_frame_time = time.time()
            
            if frame_counter % 30 == 0:
                print(f"📊 Frame {frame_counter}/{total_frames} | Target FPS: {fps:.1f} | Wait: {wait_ms}ms | Queue: {len(result_dict)}")
        else:
            key = cv2.waitKey(30) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord(' '):
            paused = not paused

finally:
    # Cleanup
    print("\n🛑 Shutting down...")
    inference_thread.stop()
    inference_thread.join(timeout=2)
    
    # Force extract if incident is still active
    if extractor.fire_incident_active:
        extractor._extract_best_frames()
    
    cap.release()
    cv2.destroyAllWindows()
    print("✅ System shutdown complete")
