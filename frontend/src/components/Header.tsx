import React from 'react';
import { PageView } from '../types';

interface HeaderProps {
  activeView: PageView;
  setActiveView: (view: PageView) => void;
  onlineCount: number;
  alertCount: number;
  gpuLoad: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onlineCount,
  alertCount,
  gpuLoad,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin h-16 bg-surface border-b border-outline-variant bg-surface/80 backdrop-blur-md shadow-sm">
      {/* Brand & Stats */}
      <div className="flex items-center gap-4">
        <span
          className="font-display-lg text-display-lg tracking-tighter text-primary cursor-pointer select-none"
          onClick={() => setActiveView('grid')}
        >
          ATMARAKSHAK
        </span>
        <div className="h-6 w-px bg-outline-variant mx-2 hidden sm:block"></div>
        <div className="font-data-mono text-data-mono hidden lg:flex gap-6 text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {onlineCount} Cameras Online
          </span>
          <span className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-error text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            {alertCount} Active Alerts
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">memory</span>
            GPU: NVIDIA RTX 4090 ({gpuLoad}% Load)
          </span>
        </div>
      </div>

      {/* Global Search & System Buttons */}
      <div className="flex-1 flex justify-end items-center gap-4 md:gap-6">
        <div className="relative w-48 md:w-64 hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search system..."
            className="w-full bg-surface-container-high border border-outline-variant rounded-full py-1.5 pl-10 pr-4 text-data-mono font-data-mono text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none placeholder:text-on-surface-variant/50"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setActiveView('analytics')}
            title="System Analytics"
            className={`p-2 rounded-full transition-colors ${
              activeView === 'analytics'
                ? 'text-primary bg-surface-container-high'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">memory</span>
          </button>
          <button
            onClick={() => setActiveView('cameras')}
            title="Camera Sensors"
            className={`p-2 rounded-full transition-colors ${
              activeView === 'cameras'
                ? 'text-primary bg-surface-container-high'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">sensors</span>
          </button>
          <button
            onClick={() => setActiveView('settings')}
            title="System Settings"
            className={`p-2 rounded-full transition-colors ${
              activeView === 'settings'
                ? 'text-primary bg-surface-container-high'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">settings_suggest</span>
          </button>

          <div className="h-8 w-px bg-outline-variant mx-1 hidden sm:block"></div>

          {/* Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFsp1CW35doftZE1I-dDlQfPfxzXuNyvGJili8fayNka30XAk5IveHfiX987_iNoqStiZ6aQ_7XZTVK6GUAlpacx59VdJgrRJl1S8sqqkfx-6mLJ_w-fUroURwptOGSx6Su6_asK0IXehgr5g9bYufeOYPqcq4rFZLsNfBU06Y-huFaOFLDBDYfb4pncndQBWrPqBIt8Vy-MZYAqLMPaRV7Dv_n0HeJFcBH6UhLz2yUVSPzOBCtjwHkA"
              alt="Lead Operator Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
