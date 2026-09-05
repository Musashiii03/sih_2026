import cv2
import numpy as np
import time
import os
import tkinter as tk
import tkinter.filedialog as fd
from ultralytics import YOLO

# 1. Video Picker GUI
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

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print("❌ Cannot read video file.")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
fps = 30.0 if fps <= 0 or fps > 120 else fps
frame_delay = 1.0 / fps

# 2. Hardcoded Model Paths
models_dir = os.path.expandvars(r"%USERPROFILE%\OneDrive\Desktop\all models")
fire_model_path   = os.path.join(models_dir, "universal_fire_master_100pct.pt")
smoke_model_path  = os.path.join(models_dir, "smoke_v8s_production.pt")
animal_model_path = os.path.join(models_dir, "animal_model.pt")
human_model_path  = os.path.join(models_dir, "rescue_human_master_best.pt")

print(f"\n▶ Fire Model Locked         : {os.path.basename(fire_model_path)}")
print(f"▶ Smoke Model Locked        : {os.path.basename(smoke_model_path)}")
print(f"▶ Animal Model Locked       : {os.path.basename(animal_model_path)}")
print(f"▶ Rescue Human Model Locked : {os.path.basename(human_model_path)}")

fire_model   = YOLO(fire_model_path)
smoke_model  = YOLO(smoke_model_path)
animal_model = YOLO(animal_model_path)
human_model  = YOLO(human_model_path)

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
    """Rejects static worklamps and floor beam glare while passing real smoke."""
    if crop.size == 0 or crop.shape[0] < 4 or crop.shape[1] < 4:
        return False
    
    bx1, by1, bx2, by2 = box
    bw, bh = bx2 - bx1, by2 - by1

    # Rejects tall, slender vertical light poles
    if bh > (frame_h * 0.35) and (bw / float(bh)) < 0.50:
        return False

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    # Reject saturated lamp cores
    pure_white = np.count_nonzero(gray >= 250) / gray.size
    if pure_white > 0.05:
        return False
    
    # Reject static floor beam glare in the bottom-left corner with low variance
    if bx1 < (frame_w * 0.35) and by2 > (frame_h * 0.50):
        std_dev = np.std(gray)
        # Uniform light on concrete has low standard deviation compared to turbulent smoke
        if std_dev < 24.0:
            return False

    return True

def is_valid_human(crop, bw, bh, frame_w, frame_h):
    """Rejects empty floor shadows and background columns falsely tagged as humans."""
    if crop.size == 0 or bw < 18 or bh < 30:
        return False

    # Discard whole-frame / oversized bounding boxes
    if bw > (frame_w * 0.65) or bh > (frame_h * 0.65):
        return False

    aspect_ratio = bw / float(bh)
    # Natural human bounding boxes (standing or seated) fall between 0.30 and 0.95
    if aspect_ratio < 0.30 or aspect_ratio > 0.95:
        return False

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    # Empty flat floor shadows lack structural variance
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

HOLD_FRAMES = 45
fire_hold = 0
smoke_hold = 0
animal_hold = 0
human_hold = 0

last_fire = []
last_smoke = []
last_animals = []
last_humans = []

paused = False

while cap.isOpened():
    if not paused:
        start_time = time.time()
        ret, frame = cap.read()
        if not ret:
            print("Video finished.")
            break

        h_f, w_f, _ = frame.shape

        # 1. Fire Detection (conf=0.25)
        fire_res = fire_model.predict(frame, conf=0.25, verbose=False)[0]
        cur_fire = []
        for box in fire_res.boxes:
            if int(box.cls[0]) == 0:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                crop = frame[max(0, y1):min(h_f, y2), max(0, x1):min(w_f, x2)]
                if verify_flame_strict(crop, y2 - y1, h_f):
                    cur_fire.append((x1, y1, x2, y2, conf))

        # 2. Smoke Detection (conf=0.28 - cuts out 0.24 floor beam glare)
        smoke_res = smoke_model.predict(frame, conf=0.28, verbose=False)[0]
        cur_smoke = []
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

        # 3. Animal Detection (conf=0.70)
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

        # 4. Human Rescue Detection (conf=0.45 + Aspect Ratio & Edge Density + Containment NMS)
        human_res = human_model.predict(frame, conf=0.45, verbose=False)[0]
        raw_humans = []
        for box in human_res.boxes:
            hx1, hy1, hx2, hy2 = map(int, box.xyxy[0])
            h_conf = float(box.conf[0])
            bw = hx2 - hx1
            bh = hy2 - hy1

            # Discard flame cores
            if any(compute_iou((hx1, hy1, hx2, hy2), fb[:4]) > 0.35 for fb in cur_fire):
                continue

            crop = frame[max(0, hy1):min(h_f, hy2), max(0, hx1):min(w_f, hx2)]
            if not is_valid_human(crop, bw, bh, w_f, h_f):
                continue

            raw_humans.append((hx1, hy1, hx2, hy2, h_conf))

        # Containment & Overlap NMS: Keeps single best full-body box
        raw_humans = sorted(raw_humans, key=lambda x: x[4], reverse=True)
        cur_humans = []
        for h_cand in raw_humans:
            if any(compute_iomin(h_cand[:4], kept[:4]) > 0.45 or compute_iou(h_cand[:4], kept[:4]) > 0.25 for kept in cur_humans):
                continue
            cur_humans.append(h_cand)

        # Update latches
        if cur_fire:
            fire_hold = HOLD_FRAMES
            last_fire = cur_fire
        elif fire_hold > 0:
            fire_hold -= 1

        if cur_smoke:
            smoke_hold = HOLD_FRAMES
            last_smoke = cur_smoke
        elif smoke_hold > 0:
            smoke_hold -= 1

        if cur_animals:
            animal_hold = HOLD_FRAMES
            last_animals = cur_animals
        elif animal_hold > 0:
            animal_hold -= 1

        if cur_humans:
            human_hold = HOLD_FRAMES
            last_humans = cur_humans
        elif human_hold > 0:
            human_hold -= 1

        # Draw Animals (Green)
        if animal_hold > 0:
            for (x1, y1, x2, y2, conf) in last_animals:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"ANIMAL {conf:.2f}", (x1, max(20, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Draw Humans / Rescue Targets (Cyan)
        if human_hold > 0:
            for (x1, y1, x2, y2, conf) in last_humans:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
                cv2.putText(frame, f"HUMAN {conf:.2f}", (x1, max(20, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        # Draw Smoke (Orange)
        if smoke_hold > 0:
            for (x1, y1, x2, y2, conf) in last_smoke:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
                cv2.putText(frame, f"SMOKE {conf:.2f}", (x1, max(20, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)

        # Draw Fire (Red)
        if fire_hold > 0:
            for (x1, y1, x2, y2, conf) in last_fire:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                cv2.putText(frame, f"FIRE {conf:.2f}", (x1, max(25, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # Unified HUD
        alerts = []
        if fire_hold > 0:
            alerts.append("FIRE")
        if smoke_hold > 0:
            alerts.append("SMOKE")
        if animal_hold > 0:
            alerts.append("ANIMAL")
        if human_hold > 0:
            alerts.append("RESCUE TARGET")

        if alerts:
            status_text = "ALERT: " + " + ".join(alerts)
            status_color = (0, 0, 255) if fire_hold > 0 else ((0, 165, 255) if smoke_hold > 0 else (255, 255, 0))
        else:
            status_text = "STATUS: ALL CLEAR"
            status_color = (0, 255, 0)

        cv2.putText(frame, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.85, status_color, 2)
        cv2.imshow("Locked Multi-Hazard System", frame)

        elapsed = time.time() - start_time
        sleep_dur = max(0.001, frame_delay - elapsed)
        key = cv2.waitKey(int(sleep_dur * 1000)) & 0xFF
    else:
        key = cv2.waitKey(30) & 0xFF

    if key == ord('q'):
        break
    elif key == ord(' '):
        paused = not paused

cap.release()
cv2.destroyAllWindows()