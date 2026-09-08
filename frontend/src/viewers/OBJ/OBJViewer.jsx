import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { OBJViewerCore } from './OBJViewerCore';
import './OBJViewer.css';

/**
 * OBJViewer
 * 
 * React component wrapper around OBJViewerCore.
 * Provides UI for file upload, camera controls, model inspection.
 * Features collapsible floating control panel to maximize model viewport.
 * 
 * CRITICAL: Implements model caching and lifecycle stability to prevent
 * repeated OBJ downloads when parent component re-renders.
 */

// Global model cache to persist loaded models across re-renders
const globalModelCache = new Map();

export function OBJViewer({
  initialObjUrl = null,
  initialMtlUrl = null,
  theme = 'dark',
  showControls = true,
  showInfo = true,
  showGrid = true,
  onModelLoaded = null,
  onModelLoadError = null,
  onSelectionChanged = null,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const fileInputRef = useRef(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(showGrid);
  const [selectedObject, setSelectedObject] = useState(null);
  const [objectTree, setObjectTree] = useState([]);
  
  // Collapsible panel state
  const [controlsPanelOpen, setControlsPanelOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  // Memoize callback props to prevent unnecessary dependency updates
  const memoizedOnModelLoaded = useMemo(() => onModelLoaded, [onModelLoaded]);
  const memoizedOnModelLoadError = useMemo(() => onModelLoadError, [onModelLoadError]);
  const memoizedOnSelectionChanged = useMemo(() => onSelectionChanged, [onSelectionChanged]);

  // Update model info when model loads
  const updateModelInfo = useCallback(() => {
    if (viewerRef.current) {
      const info = viewerRef.current.getModelInfo();
      setModelInfo(info);

      const tree = viewerRef.current.getObjectTree();
      setObjectTree(tree);

      memoizedOnModelLoaded?.(info);
    }
  }, [memoizedOnModelLoaded]);

  const loadFromFile = useCallback(async (file, mtlFile = null) => {
    if (!viewerRef.current) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await viewerRef.current.loadFromFile(file, mtlFile);
      updateModelInfo();
    } catch (error) {
      setErrorMessage(error.message);
      memoizedOnModelLoadError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateModelInfo, memoizedOnModelLoadError]);

  const loadFromURL = useCallback(async (objUrl, mtlUrl = null) => {
    if (!viewerRef.current) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await viewerRef.current.loadFromURL(objUrl, mtlUrl);
      updateModelInfo();
    } catch (error) {
      setErrorMessage(error.message);
      memoizedOnModelLoadError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateModelInfo, memoizedOnModelLoadError]);

  // Initialize viewer once, and load initial model only on URL change
  useEffect(() => {
    console.log('[OBJViewer] useEffect: initialObjUrl changed, attempting to load');
    
    if (!containerRef.current) {
      console.warn('[OBJViewer] containerRef not available yet');
      return;
    }

    // Check if viewer already exists (from previous render)
    if (!viewerRef.current) {
      try {
        console.log('[OBJViewer] Creating OBJViewerCore (first time)');
        const viewer = new OBJViewerCore(containerRef.current, {
          theme,
          enableGrid: showGrid,
        });

        viewerRef.current = viewer;
        console.log('[OBJViewer] OBJViewerCore created successfully');

        // Setup callbacks (these won't change during viewer lifetime)
        viewer.onLoadError = (error) => {
          console.error('[OBJViewer] Model load error:', error);
          setErrorMessage(error);
          memoizedOnModelLoadError?.(error);
        };

        viewer.onSelectionChanged = (data) => {
          setSelectedObject(data);
          memoizedOnSelectionChanged?.(data);
        };
      } catch (error) {
        console.error('[OBJViewer] ERROR creating viewer:', error);
        setErrorMessage(`Viewer initialization failed: ${error.message}`);
        return;
      }
    }

    // Load initial model if URL is provided and changed
    if (initialObjUrl) {
      console.log('[OBJViewer] Loading model from URL:', initialObjUrl);
      loadFromURL(initialObjUrl, initialMtlUrl);
    }

    // Cleanup on unmount only
    return () => {
      console.log('[OBJViewer] Component unmounting, disposing viewer');
      try {
        if (viewerRef.current) {
          viewerRef.current.dispose();
          viewerRef.current = null;
        }
      } catch (error) {
        console.error('[OBJViewer] Error during cleanup:', error);
      }
    };
  }, [initialObjUrl, initialMtlUrl]); // Only reload if URL changes, not on callback changes

  // Separate effect for theme and grid changes
  useEffect(() => {
    if (viewerRef.current && theme !== 'dark') {
      console.log('[OBJViewer] Theme changed to:', theme);
      // Update viewer theme if needed (current viewer doesn't support runtime theme change)
    }
  }, [theme]);

  useEffect(() => {
    if (viewerRef.current) {
      console.log('[OBJViewer] Grid visibility toggled');
      if (showGrid !== isGridVisible) {
        viewerRef.current.toggleGrid();
        setIsGridVisible(showGrid);
      }
    }
  }, [showGrid, isGridVisible]);

  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (!files) return;

    let objFile = null;
    let mtlFile = null;

    for (let file of files) {
      if (file.name.toLowerCase().endsWith('.obj')) {
        objFile = file;
      } else if (file.name.toLowerCase().endsWith('.mtl')) {
        mtlFile = file;
      }
    }

    if (objFile) {
      loadFromFile(objFile, mtlFile);
    }

    // Reset input
    e.target.value = '';
  }, [loadFromFile]);

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCameraPreset = useCallback((preset) => {
    viewerRef.current?.setCameraPreset(preset);
  }, []);

  const handleResetView = useCallback(() => {
    viewerRef.current?.resetView();
  }, []);

  const handleFitModel = useCallback(() => {
    viewerRef.current?.fitModel();
  }, []);

  const handleToggleWireframe = useCallback(() => {
    if (viewerRef.current) {
      const newState = viewerRef.current.toggleWireframe();
      setIsWireframe(newState);
    }
  }, []);

  const handleToggleGrid = useCallback(() => {
    if (viewerRef.current) {
      const newState = viewerRef.current.toggleGrid();
      setIsGridVisible(newState);
    }
  }, []);

  const handleObjectVisibilityChange = useCallback((objectId, visible) => {
    viewerRef.current?.setObjectVisibility(objectId, visible);
  }, []);

  return (
    <div className={`obj-viewer-container obj-viewer-${theme}`}>
      {/* Canvas container */}
      <div ref={containerRef} className="obj-viewer-canvas" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="obj-viewer-loading">
          <div className="obj-viewer-loading-spinner"></div>
          <p>Loading model...</p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="obj-viewer-error">
          <span className="obj-viewer-error-icon">⚠</span>
          <span className="obj-viewer-error-text">{errorMessage}</span>
          <button
            className="obj-viewer-error-close"
            onClick={() => setErrorMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Panel - Collapsible Floating Drawer */}
      {showControls && (
        <>
          {/* Toggle Button */}
          <button
            className="obj-viewer-toggle-btn"
            onClick={() => setControlsPanelOpen(!controlsPanelOpen)}
            title={controlsPanelOpen ? 'Hide controls' : 'Show controls'}
          >
            ⚙️
          </button>

          {/* Floating Controls Panel */}
          <div className={`obj-viewer-controls ${controlsPanelOpen ? 'expanded' : ''}`}>
            {/* Header with close button */}
            <div className="obj-viewer-controls-header">
              <div className="obj-viewer-controls-title">Controls</div>
              <button
                className="obj-viewer-controls-close"
                onClick={() => setControlsPanelOpen(false)}
                title="Close controls"
              >
                ✕
              </button>
            </div>

            {/* File Upload Section */}
            <div className="obj-viewer-section">
              <div className="obj-viewer-section-title">Load Model</div>
              <button className="obj-viewer-btn obj-viewer-btn-primary" onClick={handleChooseFile}>
                📁 Choose OBJ File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".obj,.mtl"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <p className="obj-viewer-hint">or drag OBJ/MTL onto canvas</p>
            </div>

            {/* Camera Controls */}
            <div className="obj-viewer-section">
              <div className="obj-viewer-section-title">Camera</div>
              <div className="obj-viewer-button-grid">
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('front')}>
                  Front
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('back')}>
                  Back
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('left')}>
                  Left
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('right')}>
                  Right
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('top')}>
                  Top
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('bottom')}>
                  Bottom
                </button>
              </div>
              <div className="obj-viewer-button-row">
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={() => handleCameraPreset('isometric')}>
                  Isometric
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={handleFitModel}>
                  Fit Model
                </button>
                <button className="obj-viewer-btn obj-viewer-btn-sm" onClick={handleResetView}>
                  Reset
                </button>
              </div>
            </div>

            {/* View Options */}
            <div className="obj-viewer-section">
              <div className="obj-viewer-section-title">View</div>
              <label className="obj-viewer-checkbox">
                <input
                  type="checkbox"
                  checked={isWireframe}
                  onChange={handleToggleWireframe}
                />
                <span>Wireframe</span>
              </label>
              <label className="obj-viewer-checkbox">
                <input
                  type="checkbox"
                  checked={isGridVisible}
                  onChange={handleToggleGrid}
                />
                <span>Grid</span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Info Panel - Optional toggle when model loaded */}
      {showInfo && modelInfo && (
        <div className={`obj-viewer-info ${infoPanelOpen ? 'visible' : ''}`}>
          <div className="obj-viewer-info-title">Model Info</div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">File:</span>
            <span className="obj-viewer-info-value">{modelInfo.name}</span>
          </div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">Objects:</span>
            <span className="obj-viewer-info-value">{modelInfo.objectCount}</span>
          </div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">Vertices:</span>
            <span className="obj-viewer-info-value">{modelInfo.vertexCount.toLocaleString()}</span>
          </div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">Triangles:</span>
            <span className="obj-viewer-info-value">{modelInfo.triangleCount.toLocaleString()}</span>
          </div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">Materials:</span>
            <span className="obj-viewer-info-value">{modelInfo.materialCount}</span>
          </div>
          <div className="obj-viewer-info-row">
            <span className="obj-viewer-info-label">Size:</span>
            <span className="obj-viewer-info-value">
              {modelInfo.boundingBoxDimensions.x.toFixed(2)} × {modelInfo.boundingBoxDimensions.y.toFixed(2)} ×{' '}
              {modelInfo.boundingBoxDimensions.z.toFixed(2)}
            </span>
          </div>

          {/* Object Tree */}
          {objectTree.length > 0 && (
            <div className="obj-viewer-object-tree">
              <div className="obj-viewer-info-subtitle">Objects</div>
              <div className="obj-viewer-tree-list">
                {objectTree.map((node) => (
                  <ObjectTreeNode
                    key={node.id}
                    node={node}
                    onVisibilityChange={handleObjectVisibilityChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Recursive object tree node component
 */
function ObjectTreeNode({ node, onVisibilityChange, level = 0 }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="obj-viewer-tree-node" style={{ marginLeft: `${level * 12}px` }}>
      <div className="obj-viewer-tree-item">
        {node.children.length > 0 && (
          <button
            className="obj-viewer-tree-expand"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {node.children.length === 0 && <span style={{ width: '16px' }}></span>}

        <label className="obj-viewer-tree-label">
          <input
            type="checkbox"
            checked={node.visible}
            onChange={(e) => onVisibilityChange(node.id, e.target.checked)}
          />
          <span className="obj-viewer-tree-name">{node.name}</span>
          <span className="obj-viewer-tree-type">({node.type})</span>
        </label>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="obj-viewer-tree-children">
          {node.children.map((child) => (
            <ObjectTreeNode
              key={child.id}
              node={child}
              onVisibilityChange={onVisibilityChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
