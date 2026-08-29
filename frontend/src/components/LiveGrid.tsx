import React, { useState } from 'react';
import { CameraNode } from '../types';

interface LiveGridProps {
  cameras: CameraNode[];
  onSelectCamera?: (camera: CameraNode) => void;
}

export const LiveGrid: React.FC<LiveGridProps> = ({ cameras }) => {
  const [activeModalCam, setActiveModalCam] = useState<CameraNode | null>(null);

  return (
    <main className="ml-0 md:ml-64 mt-16 p-gutter h-[calc(100vh-64px)] grid-bg relative overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter h-full min-h-[600px]">
        {/* Tile 1: System Booting Radar (CAM-01) */}
        {cameras.find((c) => c.id === 'CAM-01') && (
          <div
            onClick={() => setActiveModalCam(cameras.find((c) => c.id === 'CAM-01') || null)}
            className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden relative flex flex-col shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="font-data-mono text-data-mono text-on-surface font-bold">CAM-01</span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">NOC-01 Entrance</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-surface-container-lowest relative overflow-hidden min-h-[220px]">
              <div className="w-48 h-48 rounded-full border border-primary/30 relative">
                <div className="absolute inset-0 radar rounded-full"></div>
                <div className="absolute inset-0 border border-primary/20 rounded-full scale-75"></div>
                <div className="absolute inset-0 border border-primary/10 rounded-full scale-50"></div>
                <div className="absolute top-1/2 left-0 w-full h-px bg-primary/20"></div>
                <div className="absolute left-1/2 top-0 h-full w-px bg-primary/20"></div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-data-mono text-data-mono text-primary animate-pulse text-center w-full px-2">
                SYSTEM BOOTING... VERIFYING CONNECTION
              </div>
            </div>
          </div>
        )}

        {/* Tile 2: Active Detection Critical (CAM-02 Fire) */}
        {cameras.find((c) => c.id === 'CAM-02') && (
          <div
            onClick={() => setActiveModalCam(cameras.find((c) => c.id === 'CAM-02') || null)}
            className="bg-surface-container-lowest border border-error hazard-critical rounded overflow-hidden relative flex flex-col shadow-sm cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                <span className="font-data-mono text-data-mono text-on-surface font-bold">CAM-02</span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">Storage Zone B</span>
              </div>
              <div className="font-data-mono text-label-xs text-on-surface-variant bg-surface/80 px-2 py-0.5 rounded shadow-sm border border-outline-variant">
                FPS: 24
              </div>
            </div>
            <div className="flex-1 relative bg-surface-container-lowest min-h-[220px]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBIWmkpHDwdirpRb3UD-JmFH-83xeARZftRUsbrgpPH4xQq97o0PqxUgPKoJ5S6-__5w1bBNFcL4aDg5cqBWCgl6vW6SYvwIJiEqnRkj7d_zuvMr4GELh_dbWaE3LMGuhxeHH6Pby0c403kLSHARXCSuETRYLZ2i533ZvEKiWRM2SBXn1L3MOb_NZ16-szW3ioPBPJ4_7NVePtD_kj94JkNVeIQoY5o2sUgs2ZrTTBbfawE6JKZqP8r8g')`,
                }}
              ></div>

              {/* Bounding Box Overlay */}
              <div className="absolute bottom-[20%] right-[20%] w-[120px] h-[100px] border-2 border-error bg-error/10 flex items-start">
                <div className="bg-error text-on-error font-data-mono text-label-xs px-1 py-0.5 mt-[-20px] font-bold">
                  FIRE_DETECTED
                </div>
              </div>

              {/* Crosshairs */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-4 h-px bg-on-surface/30"></div>
                <div className="absolute bottom-1/4 right-0 w-4 h-px bg-on-surface/30"></div>
              </div>
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-end backdrop-blur-[2px]">
              <div className="flex gap-2">
                <div className="bg-error-container/80 border border-error/50 rounded-full px-3 py-1 flex items-center gap-2 backdrop-blur-md">
                  <span className="material-symbols-outlined text-on-error-container text-[14px]">local_fire_department</span>
                  <span className="font-data-mono text-label-xs text-on-error-container font-bold">FIRE 88%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-xs text-label-xs text-on-surface-variant uppercase hidden sm:inline">
                  Temporal Verification
                </span>
                <div className="flex gap-1">
                  <div className="w-3 h-1 bg-error rounded-sm"></div>
                  <div className="w-3 h-1 bg-error rounded-sm"></div>
                  <div className="w-3 h-1 bg-error rounded-sm"></div>
                  <div className="w-3 h-1 bg-error rounded-sm"></div>
                  <div className="w-3 h-1 bg-surface-variant rounded-sm border border-outline-variant"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tile 3: Safe Status (CAM-03 Main Lobby) */}
        {cameras.find((c) => c.id === 'CAM-03') && (
          <div
            onClick={() => setActiveModalCam(cameras.find((c) => c.id === 'CAM-03') || null)}
            className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden relative flex flex-col shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span className="font-data-mono text-data-mono text-on-surface font-bold">CAM-03</span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">Main Lobby</span>
              </div>
            </div>
            <div className="flex-1 relative bg-surface-container-lowest min-h-[220px]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDklbYivuHZpcnffUJU7KmhhQMoe7wgkD0LAUlF5ImC6-XNx3dlEHGCdKUC4MZMezhy5qmJ-JHtCugXaDX9hp08vtgGqXB8Rzk3Nxet6-sDyp6OQ-Goo6VuDlCL-AA-HKWv7EvcQANpCNw1LsuKzNu5AMM3u1VLEqGqDd5FQhwbXKyWGFfwZxHgDJLVftSfXmY7Olg1bQZRW-JXlRa5FteQdSpdHV9Z6EbLa7hlD8Q__UBwjsEQvISP9Q')`,
                }}
              ></div>
            </div>
            <div className="absolute bottom-2 left-2 z-10">
              <div className="bg-surface/80 border border-primary/30 rounded-full px-2 py-0.5 flex items-center gap-1 backdrop-blur-md shadow-sm">
                <span className="material-symbols-outlined text-primary text-[12px]">check_circle</span>
                <span className="font-data-mono text-label-xs text-primary font-bold">SAFE</span>
              </div>
            </div>
          </div>
        )}

        {/* Tile 4: Advisory Hazard (CAM-04 Server Room) */}
        {cameras.find((c) => c.id === 'CAM-04') && (
          <div
            onClick={() => setActiveModalCam(cameras.find((c) => c.id === 'CAM-04') || null)}
            className="bg-surface-container-lowest border border-tertiary-container rounded overflow-hidden relative flex flex-col shadow-sm cursor-pointer"
          >
            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-center backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                <span className="font-data-mono text-data-mono text-on-surface font-bold">CAM-04</span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">Server Room</span>
              </div>
            </div>
            <div className="flex-1 relative bg-surface-container-lowest min-h-[220px]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA5WDwJHNJV-tkBhi-KIRt9U8MPEgBrriNEWVyoBDF5ou4ZPzu-Pq003tV2_-_s7H-P_pX7LWWEBurPYO85f8pPU2ZYkc7Pl-Zoc_QJEdKDW2mxnhNKjF74Ka7ZbP6QvQvks6iG4iChcWBVtdTA7qW-xtFn_DAJneCbiAh3ac0aI6Fxv5IQilWKs6ShdVz7IcwrmDMqHHmGoRmhxQxAoZReNWwm1monK2zAsFbP09PGH_aKK2APTxcT4Q')`,
                }}
              ></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-surface-container-lowest/90 to-transparent z-10 flex justify-between items-end backdrop-blur-[2px]">
              <div className="flex gap-2">
                <div className="bg-surface/80 border border-outline-variant rounded-full px-3 py-1 flex items-center gap-2 shadow-sm backdrop-blur-md">
                  <span className="material-symbols-outlined text-tertiary text-[14px]">cloud</span>
                  <span className="font-data-mono text-label-xs text-on-surface font-bold">SMOKE_DETECTED?</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-1 bg-tertiary rounded-sm"></div>
                  <div className="w-3 h-1 bg-tertiary rounded-sm"></div>
                  <div className="w-3 h-1 bg-surface-variant rounded-sm border border-outline-variant"></div>
                  <div className="w-3 h-1 bg-surface-variant rounded-sm border border-outline-variant"></div>
                  <div className="w-3 h-1 bg-surface-variant rounded-sm border border-outline-variant"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Full View Modal */}
      {activeModalCam && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated border border-outline-variant rounded-lg max-w-4xl w-full overflow-hidden flex flex-col shadow-xl">
            <div className="p-3 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-data-mono text-primary font-bold">{activeModalCam.id}</span>
                <span className="text-on-surface-variant text-sm">- {activeModalCam.location}</span>
              </div>
              <button
                onClick={() => setActiveModalCam(null)}
                className="text-on-surface-variant hover:text-error transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {activeModalCam.bgImage ? (
                <img
                  src={activeModalCam.bgImage}
                  alt={activeModalCam.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-4xl text-primary animate-pulse">radar</span>
                  <span className="font-data-mono text-primary font-bold">LIVE TRANSMISSION FEED CONNECTED</span>
                </div>
              )}
              {/* Scanline Overlay */}
              <div className="hud-scanline"></div>
              <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur px-3 py-1.5 rounded border border-outline-variant font-data-mono text-xs text-on-surface flex gap-4 shadow-sm">
                <span>PROTOCOL: {activeModalCam.protocol}</span>
                <span>URI: {activeModalCam.ipOrUri}</span>
                <span>FPS: {activeModalCam.fps}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
