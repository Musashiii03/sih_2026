import React from 'react';

export const Analytics: React.FC = () => {
  const handleExport = () => {
    alert('Exporting Model Performance & Telemetry Report (PDF/CSV)...');
  };

  return (
    <main className="ml-0 md:ml-64 pt-16 flex-1 p-gutter overflow-y-auto h-[calc(100vh-64px)] hud-grid bg-background text-on-surface">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Model Performance</h1>
          <p className="font-data-mono text-data-mono text-on-surface-variant mt-1">
            YOLOv8x // Real-time Inference Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-label-xs text-label-xs text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Live Sync
          </span>
          <button
            onClick={handleExport}
            className="bg-surface-elevated border border-outline-variant hover:border-primary text-on-surface font-label-xs text-label-xs px-3 py-1.5 rounded flex items-center gap-2 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[14px]">download</span> Export Report
          </button>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-6">
        {/* mAP@50 */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              mAP@50
            </span>
            <span className="material-symbols-outlined text-primary text-[16px]">target</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-data-lg text-[32px] leading-tight text-primary font-bold">99.5%</div>
            <svg className="w-24 h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,2"
                fill="none"
                stroke="#855300"
                strokeWidth="2"
                className="opacity-80"
              />
              <path
                d="M0,30 L0,25 Q10,20 20,25 T40,15 T60,20 T80,5 T100,2 L100,30 Z"
                fill="url(#grad1)"
                className="opacity-20"
              />
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#855300" stopOpacity="1" />
                  <stop offset="100%" stopColor="#855300" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Precision */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Precision
            </span>
            <span className="material-symbols-outlined text-primary text-[16px]">center_focus_strong</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-data-lg text-[32px] leading-tight text-primary font-bold">99.6%</div>
            <svg className="w-24 h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,20 Q15,25 30,15 T60,18 T85,8 T100,5"
                fill="none"
                stroke="#855300"
                strokeWidth="2"
                className="opacity-80"
              />
              <path
                d="M0,30 L0,20 Q15,25 30,15 T60,18 T85,8 T100,5 L100,30 Z"
                fill="url(#grad2)"
                className="opacity-20"
              />
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#855300" stopOpacity="1" />
                  <stop offset="100%" stopColor="#855300" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Recall */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Recall
            </span>
            <span className="material-symbols-outlined text-primary text-[16px]">fact_check</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="font-data-lg text-[32px] leading-tight text-primary font-bold">99.3%</div>
            <svg className="w-24 h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,15 Q20,20 40,10 T70,12 T100,4"
                fill="none"
                stroke="#855300"
                strokeWidth="2"
                className="opacity-80"
              />
              <path
                d="M0,30 L0,15 Q20,20 40,10 T70,12 T100,4 L100,30 Z"
                fill="url(#grad3)"
                className="opacity-20"
              />
              <defs>
                <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#855300" stopOpacity="1" />
                  <stop offset="100%" stopColor="#855300" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Bento Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-6">
        {/* Training Loss Curve */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg col-span-1 md:col-span-8 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase font-semibold">
              Training Convergence (Box/Class Loss)
            </h3>
            <span className="font-data-mono text-data-mono text-xs text-on-surface-variant">Epoch 1 - 300</span>
          </div>
          <div className="flex-1 rounded flex items-center justify-center relative overflow-hidden min-h-[200px] border border-outline-variant bg-surface-container-low">
            <div className="absolute bottom-0 left-0 w-full h-[80%] flex items-end px-2 gap-1 opacity-70">
              <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="1000" y2="50" stroke="#d8c3ad" strokeDasharray="4" strokeWidth="1" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#d8c3ad" strokeDasharray="4" strokeWidth="1" />
                <line x1="0" y1="150" x2="1000" y2="150" stroke="#d8c3ad" strokeDasharray="4" strokeWidth="1" />
                {/* Box Loss Line (Orange/Primary-Container) */}
                <path
                  d="M0,180 Q100,100 200,80 T400,50 T600,30 T800,20 T1000,15"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
                {/* Class Loss Line (Primary Amber-Brown) */}
                <path
                  d="M0,190 Q150,150 300,120 T500,80 T700,50 T900,40 T1000,35"
                  fill="none"
                  stroke="#855300"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="absolute top-2 right-2 flex gap-4 font-label-xs text-[9px] p-1.5 rounded backdrop-blur border bg-surface/90 text-on-surface-variant border-outline-variant shadow-xs">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 bg-primary-container rounded-sm"></span> Box Loss
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 bg-primary rounded-sm"></span> Class Loss
              </span>
            </div>
          </div>
        </div>

        {/* Hardware Status */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg col-span-1 md:col-span-4 flex flex-col justify-between shadow-sm">
          <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-4 border-b border-outline-variant pb-2 font-semibold">
            Hardware Telemetry
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between font-label-xs text-label-xs text-on-surface font-semibold mb-1">
                <span>GPU</span>
                <span className="font-data-mono text-primary font-bold">NVIDIA RTX 4090</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[85%]"></div>
              </div>
              <div className="flex justify-between font-data-mono text-[10px] text-on-surface-variant mt-1">
                <span>Util: 85%</span>
                <span>Temp: 72°C</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-label-xs text-label-xs text-on-surface font-semibold mb-1">
                <span>VRAM</span>
                <span className="font-data-mono text-primary-container font-bold">21.4 / 24 GB</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full w-[89%]"></div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-outline-variant">
              <div className="flex justify-between items-center text-sm">
                <span className="font-label-xs text-on-surface-variant">Model Params</span>
                <span className="font-data-mono text-on-surface font-bold">68.2M (YOLOv8x)</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="font-label-xs text-on-surface-variant">Inference Time</span>
                <span className="font-data-mono text-primary font-bold">4.2ms / frame</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter pb-6">
        {/* Bar Chart: Hazard Volume */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg flex flex-col shadow-sm">
          <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-4 font-semibold">
            Incident Volume by Hazard Class
          </h3>
          <div className="flex-1 rounded flex flex-col justify-end p-4 relative min-h-[160px] border border-outline-variant bg-surface-container-low">
            <div className="flex justify-around items-end h-full w-full px-4 gap-4">
              {/* Fire */}
              <div className="flex flex-col items-center w-full">
                <div className="w-full bg-hazard-fire border border-hazard-fire/30 rounded-t-sm h-[80%] flex items-start justify-center pt-1 transition-all hover:bg-hazard-fire/90 relative group cursor-pointer shadow-xs">
                  <span className="font-data-mono text-[10px] text-white font-bold bg-hazard-fire px-1 rounded shadow-xs absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    1,204
                  </span>
                </div>
                <span className="font-label-xs text-label-xs text-on-surface-variant mt-2 font-semibold">Fire</span>
              </div>

              {/* Smoke */}
              <div className="flex flex-col items-center w-full">
                <div className="w-full bg-hazard-smoke border border-hazard-smoke/30 rounded-t-sm h-[65%] flex items-start justify-center pt-1 transition-all hover:bg-hazard-smoke/90 relative group cursor-pointer shadow-xs">
                  <span className="font-data-mono text-[10px] text-white font-bold bg-hazard-smoke px-1 rounded shadow-xs absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    942
                  </span>
                </div>
                <span className="font-label-xs text-label-xs text-on-surface-variant mt-2 font-semibold">Smoke</span>
              </div>

              {/* Water */}
              <div className="flex flex-col items-center w-full">
                <div className="w-full bg-hazard-water border border-hazard-water/30 rounded-t-sm h-[30%] flex items-start justify-center pt-1 transition-all hover:bg-hazard-water/90 relative group cursor-pointer shadow-xs">
                  <span className="font-data-mono text-[10px] text-white font-bold bg-hazard-water px-1 rounded shadow-xs absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    412
                  </span>
                </div>
                <span className="font-label-xs text-label-xs text-on-surface-variant mt-2 font-semibold">Water</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap: Zone Incidents */}
        <div className="bg-surface-elevated border border-outline-variant p-4 rounded-lg flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase font-semibold">
              Incidents by Zone (Heatmap)
            </h3>
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">map</span>
          </div>
          <div className="flex-1 rounded overflow-hidden relative min-h-[160px] border border-outline-variant">
            <div
              className="bg-cover bg-center w-full h-full absolute inset-0 opacity-85"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAjJG1ezacvknlrum8OdSShYL6nKWkhzl0QTYJlqYFUJHmT3XvWNrZpAuY0tV2opHNcEwoKd1YT3AFFkPkLrj3gTQdfzx1PQnkCGK0CQwVE8PoedrpzMbyQZbL9odUigysVoCgsYA9BeOCn_d_3TblVBis-hJ6LS10HBQm4MbVPWVHDS2RmIKAPwPN8D4OuzwCJWgm7cmTAW3ppy-BG3qr5if_XBRhCpFdBwFsDEUEgcTw7gHFyOjz1_w')`,
              }}
            ></div>
            <div className="absolute bottom-2 right-2 bg-surface/90 border border-outline-variant p-1.5 rounded flex items-center gap-2 backdrop-blur-sm shadow-xs">
              <span className="font-label-xs text-[9px] text-on-surface-variant">Low</span>
              <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-hazard-water via-primary-container to-hazard-fire"></div>
              <span className="font-label-xs text-[9px] text-hazard-fire font-bold">High</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
