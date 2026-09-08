/**
 * HologramViewer with Error Boundary
 * 
 * Wraps HologramViewer with error handling to prevent crashes
 * from affecting the entire dashboard.
 */

import React from 'react';
import { OBJViewer } from './OBJViewer';

class HologramErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    console.error('[HologramErrorBoundary] Error caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HologramErrorBoundary] componentDidCatch:', error);
    console.error('[HologramErrorBoundary] Error info:', errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#121413',
            border: '1px solid #fb4934',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            color: '#e2e8f0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.5,
            overflow: 'auto',
          }}
        >
          <div style={{ color: '#fb4934', marginBottom: 12, fontWeight: 700 }}>
            ⚠ Hologram Viewer Error
          </div>
          <div style={{ color: '#8b928a', marginBottom: 8, maxWidth: 300 }}>
            {this.state.error?.toString()}
          </div>
          {this.state.errorInfo && (
            <details
              style={{
                width: '100%',
                marginTop: 12,
                padding: 8,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 4,
                border: '1px solid #323633',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                Stack Trace
              </summary>
              <pre
                style={{
                  margin: 0,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: 10,
                  color: '#64748b',
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return (
      <OBJViewer
        initialObjUrl="/data/hologram/geometry.obj"
        initialMtlUrl="/data/hologram/geometry.mtl"
        theme="dark"
        showControls={true}
        showInfo={true}
        showGrid={true}
        onModelLoaded={(info) => {
          console.log('[HologramViewer] Model loaded:', info);
        }}
        onModelLoadError={(error) => {
          console.error('[HologramViewer] Model load error:', error);
        }}
      />
    );
  }
}

export { HologramErrorBoundary as HologramViewer };
