import cv2
import numpy as np
import time
import os
import sys
import tkinter as tk
from tkinter import filedialog
from ultralytics import YOLO

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
