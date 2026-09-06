# Project Atmarakshak

### AI-Powered Real-Time Fire, Smoke & Life-Safety Monitoring System

## Overview

**Project Atmarakshak** is an AI-powered real-time surveillance and life-safety system designed to detect fire and smoke at an early stage using CCTV camera feeds.

The system combines computer vision, human-risk detection, incident management, automated emergency calling, and a centralized dashboard to help reduce response time during emergencies.

## Problem Statement

Traditional CCTV systems mainly provide video surveillance and require a person to continuously monitor the footage.

This can lead to delayed fire detection, delayed intervention, difficulty identifying the exact incident location, and delayed emergency notification.

Atmarakshak aims to automate the detection and initial emergency notification process.

## Solution

Atmarakshak continuously analyzes CCTV footage using an AI-based detection model.

When fire or smoke is detected, the system identifies the hazard, calculates confidence, determines fire severity, detects people in the scene, identifies people who may be at risk, maps the camera to its registered location, creates an incident, triggers an automated emergency call, and displays the incident on the dashboard.

## System Flowchart

The following flowchart represents the current end-to-end detection and alert workflow:

![Atmarakshak System Flowchart](assets/atmarakshak-flowchart.png)

### Flow Explanation

**01 — CCTV Camera**  
The system receives a live video feed or RTSP stream from the CCTV camera.

**02 — Frame Extraction**  
Frames are extracted from the live video stream for real-time analysis.

**03 — YOLOv8 Model**  
The trained YOLOv8 model analyzes the frames and detects fire or smoke along with the detection confidence.

**04 — Decision**  
The system determines whether a fire event has been detected.

**05 — Evidence**  
When a relevant detection is confirmed, a screenshot/frame is captured as evidence.

**06 — Location**  
The detected camera is mapped to its registered physical location.

**07 — Alert**  
An emergency alert is generated and the responsible person is notified through the configured communication system.

**08 — Dashboard**  
The incident and its current status are displayed on the Atmarakshak dashboard.

## How Atmarakshak Works

### 1. CCTV Monitoring
The system receives live CCTV/RTSP streams from connected cameras.

### 2. AI-Based Detection
Frames from the camera feed are processed using a fine-tuned **YOLOv8** model for fire and smoke detection.

### 3. Fire Severity Analysis

| Fire Coverage | Severity |
|---|---|
| < 1.5% | Small |
| 1.5% – 6% | Moderate |
| > 6% | Large / Critical |

### 4. Human Risk Detection
A separate human-occupancy component detects people in the scene and provides information such as number of people detected, human coordinates, proximity to the fire, and people potentially at risk.

### 5. Smoke Analysis
Smoke detection is enhanced using bounding-box information and image characteristics to estimate smoke density as Light, Moderate, or Heavy.

### 6. False Alarm Reduction
Negative datasets and visual sanity checks are used to reduce incorrect detections caused by visually similar objects or scenes.

## Automated Emergency Calling

When a confirmed fire incident is created, Atmarakshak can trigger an automated voice call to the responsible owner.

The call can contain the **Camera ID, fire location, and fire severity**.

### Example Emergency Message

> “Atmarakshak Emergency Alert. Fire has been detected by Camera 03 at Warehouse Block A. The detected fire severity is moderate. Please check the Atmarakshak dashboard immediately.”

## Owner Dashboard

The dashboard provides a centralized view of the surveillance system and active emergencies.

It includes:

- Total cameras
- Online/offline camera status
- Active fire and smoke alerts
- People at risk
- Live CCTV feeds
- Detection bounding boxes
- Fire confidence
- Fire severity
- Camera/location information
- Incident history
- Emergency response status
- Basic analytics
- Camera settings

## Emergency Response Flow

**AI Detection → Incident Creation → Automated Owner Call → Dashboard Verification → Owner Contacts Concerned Authority**

The current implementation focuses on reliable detection, incident creation, owner notification, and dashboard visibility. Direct authority integration can be added in a future phase.

## Key Features

- Real-time CCTV/RTSP monitoring
- AI-based fire detection
- AI-based smoke detection
- YOLOv8 computer vision model
- Fire confidence estimation
- Fire severity classification
- Smoke density analysis
- Human occupancy detection
- People-at-risk identification
- Camera-to-location mapping
- Evidence capture
- Automated emergency voice calling
- Centralized owner dashboard
- Incident history
- False-alarm reduction
- Real-time emergency status

## Tech Stack

- **Computer Vision:** YOLOv8
- **Backend:** Python
- **API Layer:** FastAPI
- **Database:** PostgreSQL / Firebase
- **Frontend:** React / HTML-based dashboard
- **Video Input:** CCTV / RTSP
- **Communication:** Cloud Telephony / Exotel
- **Visualization:** Monitoring dashboard and analytics

## Project Scope

The project scope covers the complete AI-based frame processing and incident workflow, including:

- **Frame Extraction:** Reading and processing video frames in real time.
- **Severity Classifier:** Classifying detected fire based on its coverage in the frame.
- **Extractor Integration:** Integrating frame extraction with the AI detection pipeline.
- **Frame Selector:** Selecting relevant frames using similarity and detection-based logic.
- **Storage Manager:** Managing captured evidence, files, and incident metadata.
- **Fire & Smoke Detection:** Detecting fire and smoke using the trained YOLOv8 model.
- **Human Risk Detection:** Detecting people and identifying people potentially at risk.
- **Incident Management:** Creating and tracking detected incidents.
- **Location Mapping:** Mapping cameras to their registered locations.
- **Alert System:** Triggering emergency notifications and automated calling.
- **Dashboard:** Displaying live detection and incident information.

## Team

- **Shray Gupta**
- **Smarth Gupta**
- **Bharat Chadha**
- **Ansh Pandey**
- **Ali Vaqar**

An AI-driven approach toward faster fire detection, better situational awareness, and improved emergency response.
