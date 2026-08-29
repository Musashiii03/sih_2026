import React from 'react';
import { PageView } from '../types';

interface SidebarProps {
  activeView: PageView;
  setActiveView: (view: PageView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems: { id: PageView; label: string; icon: string }[] = [
    { id: 'grid', label: 'Live Grid', icon: 'grid_view' },
    { id: 'incidents', label: 'Incident Log', icon: 'history' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
    { id: 'cameras', label: 'Cameras', icon: 'videocam' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col p-4 z-40 bg-surface border-r border-outline-variant shadow-sm hidden md:flex justify-between">
      <div>
        {/* NOC Status Header */}
        <div className="mb-8 px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-primary flex items-center justify-center bg-primary-container/20">
            <span className="material-symbols-outlined text-primary">router</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-primary">NOC-01</div>
            <div className="font-label-xs text-label-xs text-on-surface-variant">Active Monitoring</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-label-xs text-label-xs hover:translate-x-1 duration-200 text-left transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Support & Logout */}
      <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col gap-2">
        <button
          onClick={() => setActiveView('settings')}
          className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all rounded font-label-xs text-label-xs w-full text-left"
        >
          <span className="material-symbols-outlined">help_center</span>
          <span>Support</span>
        </button>
        <button
          onClick={() => alert('Operator logged out of NOC session.')}
          className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-all rounded font-label-xs text-label-xs w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};
