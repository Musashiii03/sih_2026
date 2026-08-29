export type PageView = 'grid' | 'incidents' | 'analytics' | 'cameras' | 'settings';

export type ThemeMode = 'light' | 'dark';

export type CameraStatus = 'booting' | 'synced' | 'error' | 'advisory' | 'offline';

export type HazardType = 'fire' | 'smoke' | 'intrusion' | 'water' | 'maintenance' | 'none';

export interface CameraNode {
  id: string;
  name: string;
  location: string;
  protocol: string;
  ipOrUri: string;
  status: CameraStatus;
  hazard: HazardType;
  hazardConfidence?: number;
  hazardLabel?: string;
  fps: number;
  enabled: boolean;
  bgImage?: string;
  verificationSteps?: { total: number; current: number };
}

export interface IncidentRecord {
  id: string;
  cameraId: string;
  cameraName: string;
  incidentClass: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  classCode: string;
  zone: string;
  confidence: number;
  timestamp: string;
  evidenceUrl: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
  telemetry: {
    temp?: string;
    smokePpm?: string;
    hvacStatus?: string;
    fireSuppression?: string;
  };
  notes?: string;
}

export interface InferenceParams {
  confidenceThreshold: number;
  temporalWindow: number;
  gpuUsage: number;
  vramUsed: number;
  vramTotal: number;
  modelFormat: string;
  targetBackend: string;
}
