import React, { useState } from 'react';
import { CameraNode } from '../types';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCamera: (newCamera: CameraNode) => void;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({
  isOpen,
  onClose,
  onAddCamera,
}) => {
  const [nodeId, setNodeId] = useState('');
  const [protocol, setProtocol] = useState('rtsp');
  const [uri, setUri] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId) return;

    const newCam: CameraNode = {
      id: `CAM-0${Math.floor(Math.random() * 90 + 10)}`,
      name: nodeId.toUpperCase(),
      location: 'Custom Stream Zone',
      protocol: protocol === 'rtsp' ? 'RTSP (H.264)' : protocol === 'webcam' ? 'V4L2 (Local)' : 'HTTP/MJPEG',
      ipOrUri: uri || '192.168.1.150:554',
      status: 'synced',
      hazard: 'none',
      fps: 30,
      enabled: true,
      bgImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiUbh8EowoSsTUnpEiiEAE6TwCwW62tUutG3SCI0aR_9LmeP6ENMx6ClXvU3nlz6WfYjI2l9WOwN0QZaC8a459eXByrr5KCHO6VgONMNoGX3dvEyq1kXdQp97pA3dQ3-dydxNX48le1qo3i7VTdaS99RrHgab8v_z_6mj3_a4eeDLMz80FBqI7tBRlBLDfI2ku29ek_Q3Qy-7ZB-_Ytf1WsFZUpreERjLmFAmQ0HxAsoIvydWY4PJ5Qg',
    };

    onAddCamera(newCam);
    setNodeId('');
    setUri('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-elevated border border-outline-variant rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="font-data-mono text-primary flex items-center gap-2 text-[14px] font-bold">
            <span className="material-symbols-outlined text-[16px]">add_link</span>
            INITIALIZE NEW SOURCE
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-data-mono text-[11px] text-on-surface-variant mb-1 uppercase font-semibold">
              Node Identifier
            </label>
            <input
              type="text"
              required
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="e.g. CAM-04-HALLWAY"
              className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-data-mono text-[13px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div>
            <label className="block font-data-mono text-[11px] text-on-surface-variant mb-1 uppercase font-semibold">
              Protocol Type
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-data-mono text-[13px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="rtsp">RTSP Stream</option>
              <option value="webcam">Local V4L2 / USB</option>
              <option value="http">HTTP/MJPEG</option>
            </select>
          </div>

          <div>
            <label className="block font-data-mono text-[11px] text-on-surface-variant mb-1 uppercase font-semibold">
              URI / Path
            </label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="rtsp://admin:pass@ip:port/stream"
              className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-data-mono text-[13px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-data-mono text-[12px] text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-data-mono text-[12px] bg-primary text-on-primary rounded hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-xs flex items-center gap-2 font-bold"
            >
              <span className="material-symbols-outlined text-[14px]">save</span>
              COMMIT SOURCE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
