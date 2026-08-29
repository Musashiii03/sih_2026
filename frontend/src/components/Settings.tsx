import React, { useState } from 'react';

export const Settings: React.FC = () => {
  const [modelBackend, setModelBackend] = useState('TensorRT');
  const [webhookUrl, setWebhookUrl] = useState('https://api.atmarakshak.internal/alerts/webhook');
  const [autoRecord, setAutoRecord] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('NOC Settings updated successfully!');
  };

  return (
    <main className="md:ml-64 pt-16 min-h-screen p-margin max-w-container-max mx-auto flex flex-col gap-gutter bg-background text-on-surface">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">settings</span>
          NOC System & Pipeline Settings
        </h1>
        <p className="font-body-base text-body-base text-on-surface-variant">
          Configure model runtimes, automated webhooks, storage retention, and operator notifications.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
        <div className="xl:col-span-8 flex flex-col gap-gutter">
          {/* AI Model Runtime Config */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">memory</span>
                AI Execution Runtime
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-data-mono text-[12px] text-on-surface mb-1 uppercase font-semibold">
                  Target Acceleration Engine
                </label>
                <select
                  value={modelBackend}
                  onChange={(e) => setModelBackend(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-data-mono text-[13px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="TensorRT">NVIDIA TensorRT (FP16 Optimized)</option>
                  <option value="ONNXRuntime">ONNX Runtime (GPU CUDA Execution)</option>
                  <option value="OpenVINO">Intel OpenVINO (CPU Acceleration)</option>
                </select>
              </div>

              <div>
                <label className="block font-data-mono text-[12px] text-on-surface mb-1 uppercase font-semibold">
                  Alert Webhook Integration URL
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-data-mono text-[13px] text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Video Recording & Retention */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">hard_drive</span>
                Evidence Storage & Retention
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-data-mono text-[13px] text-on-surface font-bold">
                    Auto-Record Hazard Events
                  </div>
                  <div className="font-label-xs text-[10px] text-on-surface-variant">
                    Automatically buffer 30 seconds prior to and post detection.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRecord}
                    onChange={(e) => setAutoRecord(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-elevated after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block font-data-mono text-[12px] text-on-surface mb-1 uppercase font-semibold">
                  Evidence Retention Period ({retentionDays} Days)
                </label>
                <input
                  type="range"
                  min="7"
                  max="90"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="xl:col-span-4 flex flex-col gap-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="font-data-mono text-primary text-[14px] uppercase border-b border-outline-variant pb-2 font-bold">
              Save Configuration
            </h3>
            <p className="font-label-xs text-[11px] text-on-surface-variant">
              Changes will immediately synchronize across NOC-01 processing units.
            </p>
            <button
              type="submit"
              className="bg-primary text-on-primary font-data-mono text-[13px] py-2 rounded hover:bg-primary-container hover:text-on-primary-container transition-colors font-bold shadow-xs"
            >
              SAVE SETTINGS
            </button>
          </div>
        </div>
      </form>
    </main>
  );
};
