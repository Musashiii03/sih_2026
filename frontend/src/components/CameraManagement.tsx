import React from 'react';
import { CameraNode, InferenceParams } from '../types';

interface CameraManagementProps {
  cameras: CameraNode[];
  onToggleCamera: (id: string) => void;
  params: InferenceParams;
  onUpdateParams: (newParams: Partial<InferenceParams>) => void;
  onOpenAddModal: () => void;
}

export const CameraManagement: React.FC<CameraManagementProps> = ({
  cameras,
  onToggleCamera,
  params,
  onUpdateParams,
  onOpenAddModal,
}) => {
  const onlineCount = cameras.filter((c) => c.enabled && c.status !== 'error').length;

  return (
    <main className="md:ml-64 pt-16 min-h-screen p-margin max-w-container-max mx-auto flex flex-col gap-gutter bg-background text-on-surface">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">videocam</span>
            Camera Fleet Management
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant">
            Configure video sources and active detection parameters.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-primary text-on-primary font-data-mono text-data-mono px-4 py-2 rounded flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 border border-transparent shadow-sm font-bold"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          ADD SOURCE
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        {/* Left Column: Camera List (Bento Span 8) */}
        <div className="xl:col-span-8 flex flex-col gap-gutter">
          {/* Table Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden relative shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">router</span>
                Active Nodes
              </span>
              <span className="font-data-mono text-data-mono text-primary bg-primary-container/20 px-2 py-0.5 rounded text-[11px] font-bold">
                {onlineCount} ONLINE
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container/70">
                    <th className="px-4 py-2 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      ID / Name
                    </th>
                    <th className="px-4 py-2 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      Source Protocol
                    </th>
                    <th className="px-4 py-2 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold text-center">
                      Status
                    </th>
                    <th className="px-4 py-2 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold text-right">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody className="font-data-mono text-data-mono divide-y divide-outline-variant">
                  {cameras.map((cam) => {
                    const isError = cam.status === 'error';
                    return (
                      <tr
                        key={cam.id}
                        className={`hover:bg-surface-container-high/50 transition-colors group ${
                          isError ? 'bg-error-container/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded bg-surface-container border border-outline-variant flex items-center justify-center ${
                                isError ? 'text-error' : 'text-on-surface-variant'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isError ? 'warning' : 'point_of_sale'}
                              </span>
                            </div>
                            <div>
                              <div className={`font-bold transition-colors ${
                                isError ? 'text-error' : 'text-on-surface group-hover:text-primary'
                              }`}>
                                {cam.name}
                              </div>
                              <div className="text-[10px] text-on-surface-variant mt-0.5">
                                {cam.ipOrUri}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-secondary">{cam.protocol}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {isError ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-error status-dot-red"></div>
                                <span className="text-[11px] text-error font-bold">ERR_NO_SIG</span>
                              </>
                            ) : (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-600 status-dot-green"></div>
                                <span className="text-[11px] text-green-700 font-bold">SYNCED</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <label className={`relative inline-flex items-center cursor-pointer ${isError ? 'opacity-50' : ''}`}>
                            <input
                              type="checkbox"
                              checked={cam.enabled}
                              disabled={isError}
                              onChange={() => onToggleCamera(cam.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-secondary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-elevated after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Preview Panes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden relative aspect-video group shadow-sm">
              <div className="hud-scanline"></div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiUbh8EowoSsTUnpEiiEAE6TwCwW62tUutG3SCI0aR_9LmeP6ENMx6ClXvU3nlz6WfYjI2l9WOwN0QZaC8a459eXByrr5CHO6VgONMNoGX3dvEyq1kXdQp97pA3dQ3-dydxNX48le1qo3i7VTdaS99RrHgab8v_z_6mj3_a4eeDLMz80FBqI7tBRlBLDfI2ku29ek_Q3Qy-7ZB-_Ytf1WsFZUpreERjLmFAmQ0HxAsoIvydWY4PJ5Qg"
                alt="Live Camera Feed Preview"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
              />
              <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur border border-outline-variant px-2 py-1 rounded text-[10px] font-data-mono text-primary flex flex-col shadow-sm">
                <span>CAM-01 [LIVE]</span>
                <span className="text-on-surface-variant">FPS: 29.97</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden relative aspect-video flex items-center justify-center shadow-sm">
              <div className="text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-outline text-3xl">videocam_off</span>
                <span className="font-data-mono text-[11px] text-outline font-bold">CAM-06 OFFLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Diagnostics (Bento Span 4) */}
        <div className="xl:col-span-4 flex flex-col gap-gutter">
          {/* Inference Parameters */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Inference Engine Parameters
              </span>
            </div>
            <div className="p-4 space-y-6">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="font-data-mono text-[12px] text-on-surface font-semibold">Confidence Threshold</label>
                  <span className="font-data-mono text-[11px] text-primary bg-primary-container/20 px-1.5 rounded font-bold">
                    {params.confidenceThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={params.confidenceThreshold}
                  onChange={(e) => onUpdateParams({ confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="font-label-xs text-[10px] text-on-surface-variant mt-2">
                  Minimum certainty required to trigger an alert.
                </p>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="font-data-mono text-[12px] text-on-surface font-semibold">Temporal Frame Window</label>
                  <span className="font-data-mono text-[11px] text-primary bg-primary-container/20 px-1.5 rounded font-bold">
                    {params.temporalWindow}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={params.temporalWindow}
                  onChange={(e) => onUpdateParams({ temporalWindow: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="font-label-xs text-[10px] text-on-surface-variant mt-2">
                  Number of consecutive frames hazard must be detected.
                </p>
              </div>

              <button
                onClick={() => alert('Inference parameters applied to live pipeline successfully!')}
                className="w-full bg-surface-container border border-outline-variant text-on-surface font-data-mono text-[12px] py-2 rounded hover:bg-surface-container-high transition-colors active:scale-95 font-bold"
              >
                APPLY CHANGES
              </button>
            </div>
          </div>

          {/* System Diagnostics */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col flex-1 shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">terminal</span>
                System Diagnostics
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4 font-data-mono text-[11px]">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">GPU VRAM Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-container transition-all duration-300"
                      style={{ width: `${(params.vramUsed / params.vramTotal) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-primary font-bold">
                    {params.vramUsed}/{params.vramTotal}GB
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">Model Format</span>
                <span className="text-on-surface bg-surface-container px-2 py-0.5 rounded border border-outline-variant font-semibold">
                  {params.modelFormat}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">Export Status</span>
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span> OPTIMIZED
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <span className="text-on-surface-variant">Current Target</span>
                <span className="text-secondary font-bold">{params.targetBackend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
