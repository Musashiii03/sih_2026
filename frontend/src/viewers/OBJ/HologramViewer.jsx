/**
 * HologramViewer
 * 
 * Specialized wrapper for using OBJViewer in the Dispatch Dashboard.
 * Loads the backend hologram OBJ file and presents it in compact dark mode.
 * 
 * This is specifically for the HOLOGRAM button in the dashboard.
 * The underlying OBJViewer is reusable and generic.
 */

import React from 'react';
import { OBJViewer } from './OBJViewer';

export function HologramViewer({ theme = 'dark' }) {
  // The backend serves the hologram OBJ at this route
  const hologramObjUrl = '/data/hologram/geometry.obj';
  const hologramMtlUrl = '/data/hologram/geometry.mtl';

  return (
    <OBJViewer
      initialObjUrl={hologramObjUrl}
      initialMtlUrl={hologramMtlUrl}
      theme={theme}
      showControls={true}
      showInfo={true}
      showGrid={true}
      onModelLoaded={(info) => {
        console.log('Hologram loaded:', info);
      }}
      onModelLoadError={(error) => {
        console.error('Hologram load error:', error);
      }}
    />
  );
}
