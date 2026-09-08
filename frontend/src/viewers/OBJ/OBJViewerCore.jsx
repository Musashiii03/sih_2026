import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * OBJViewerCore
 * 
 * High-quality 3D OBJ viewer using Three.js.
 * Supports loading OBJ files from various sources (file upload, URL).
 * Automatically frames models regardless of size or position.
 * Provides professional camera controls and viewing modes.
 * 
 * This is a GENERIC viewer - not tied to any specific domain.
 * The viewer receives OBJ data and renders it. That's it.
 */
export class OBJViewerCore {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      theme: options.theme || 'dark',
      backgroundColor: options.backgroundColor || 0x0a0e27,
      enableGrid: options.enableGrid !== false,
      enableAxes: options.enableAxes !== false,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      ...options,
    };

    // Scene state
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModel = null;
    this.modelName = null;
    this.grid = null;
    this.axes = null;
    this.isWireframeMode = false;

    // CRITICAL: Lifecycle tracking to prevent race conditions
    this._isDisposed = false;
    this._pendingLoads = new Set();
    this._animationFrameId = null;

    // Model information cache
    this.modelInfo = {
      name: 'None loaded',
      objectCount: 0,
      vertexCount: 0,
      triangleCount: 0,
      materialCount: 0,
      boundingBoxDimensions: { x: 0, y: 0, z: 0 },
    };

    // Loading state
    this.isLoading = false;

    // Camera presets cache
    this.cameraPresets = {};

    // Selection system
    this.selectedObject = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.originalMaterial = null;

    // Initialize
    this._initialize();
  }

  /**
   * Initialize Three.js scene, renderer, and controls
   */
  _initialize() {
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    console.log(`[OBJViewerCore] Initializing with container size: ${width}x${height}`);

    // CRITICAL: If container has no size yet, this will fail
    if (width === 0 || height === 0) {
      console.warn('[OBJViewerCore] Container has zero dimensions! Deferring initialization.');
      // Defer until container is properly sized
      setTimeout(() => this._initialize(), 100);
      return;
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    this.camera.position.set(5, 5, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.options.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // CRITICAL: Ensure canvas fills its container with explicit CSS
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    this.container.appendChild(this.renderer.domElement);

    console.log('[OBJViewerCore] Renderer created and appended to container');

    // Lighting - studio-like setup
    this._setupLighting();

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0;
    
    // CRITICAL: Prevent camera from going below the floor
    // Floor is at Y = 0, so we restrict polar angle to keep camera above floor level
    // minPolarAngle = 0 rad (top view, 90°)
    // maxPolarAngle = π/2.2 rad (floor-level view, ~81°, allowing low perspectives but not underneath)
    this.controls.minPolarAngle = 0;                    // Allow top-down view (0 radians = looking down)
    this.controls.maxPolarAngle = Math.PI / 2.2;        // Stop at ~81° to prevent going below floor

    // Grid and axes (initially invisible)
    this._setupHelpers();

    // Event listeners
    this._setupEventListeners();

    // Start animation loop
    this._animate();

    // Handle window resize
    this._setupResizeObserver();
  }

  /**
   * Setup studio lighting - optimized for architectural visualization
   * Uses a balanced 3-light setup for professional results
   */
  _setupLighting() {
    console.log('[OBJViewerCore] Setting up architectural lighting...');

    // Hemisphere light - mimics natural sky dome lighting
    // Sky color (top): natural daylight white
    // Ground color (bottom): neutral tone
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xa8a8a8, 0.5);
    this.scene.add(hemisphereLight);
    console.log('  Added hemisphere light (sky dome)');

    // Main directional light - key light for definition and shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.75);
    keyLight.position.set(15, 20, 12);  // Upper-right front position
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 200;
    keyLight.shadow.camera.left = -80;
    keyLight.shadow.camera.right = 80;
    keyLight.shadow.camera.top = 80;
    keyLight.shadow.camera.bottom = -80;
    keyLight.shadow.bias = 0.0008;
    keyLight.shadow.normalBias = 0.03;
    this.scene.add(keyLight);
    console.log('  Added directional key light with shadows');

    // Fill light - subtle light from opposite side to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(0xb0d0ff, 0.25);
    fillLight.position.set(-12, 10, -15);  // Opposite upper-left back
    this.scene.add(fillLight);
    console.log('  Added directional fill light');

    // Optional: Slight back light for rim definition (very subtle)
    const rimLight = new THREE.DirectionalLight(0xf0e5d8, 0.1);
    rimLight.position.set(0, 5, -20);
    this.scene.add(rimLight);
    console.log('  Added subtle rim light');

    console.log('[OBJViewerCore] Lighting setup complete');
  }

  /**
   * Setup grid and axes helpers
   * CRITICAL: Grid must not interfere with model floor
   */
  _setupHelpers() {
    // Grid - positioned BELOW the model to avoid z-fighting with floor
    // Model floor is at y=0, so grid goes to y=-1 (well below)
    const gridSize = 100;
    const gridDivisions = 20;
    this.grid = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    this.grid.position.y = -1.0;  // CRITICAL: Well below model floor (y=0)
    this.grid.renderOrder = -1;  // Render behind model
    this.grid.visible = this.options.enableGrid;
    this.scene.add(this.grid);

    // Axes - also positioned below to avoid interference
    this.axes = new THREE.AxesHelper(5);
    this.axes.position.y = -1.0;
    this.axes.visible = this.options.enableAxes;
    this.scene.add(this.axes);
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Mouse click for object selection
    this.renderer.domElement.addEventListener('click', (e) => this._onMouseClick(e));

    // Drag and drop
    this.renderer.domElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.renderer.domElement.style.opacity = '0.8';
    });

    this.renderer.domElement.addEventListener('dragleave', () => {
      this.renderer.domElement.style.opacity = '1';
    });

    this.renderer.domElement.addEventListener('drop', (e) => {
      e.preventDefault();
      this.renderer.domElement.style.opacity = '1';
      this._handleFilesDrop(e.dataTransfer.files);
    });
  }

  /**
   * Setup resize observer
   */
  _setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this._handleWindowResize();
    });
    resizeObserver.observe(this.container);
  }

  /**
   * Animation loop
   */
  _animate = () => {
    // CRITICAL: Check if disposed before continuing loop
    if (this._isDisposed || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    this._animationFrameId = requestAnimationFrame(this._animate);

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Handle window/container resize
   */
  _handleWindowResize() {
    // Guard against ResizeObserver firing after disposal
    if (!this.container || !this.camera || !this.renderer || this._isDisposed) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Calculate camera framing based on model bounding box
   */
  _calculateOptimalCamera() {
    if (!this.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Store for presets
    this.modelCenter = center.clone();
    this.modelSize = size;
    this.modelBoundingBox = box;

    // Calculate camera distance based on FOV and model size
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180); // Convert to radians
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));

    // Position camera isometrically
    const offset = cameraDistance * 0.6; // Slightly closer for better framing
    this.camera.position.set(
      center.x + offset,
      center.y + offset,
      center.z + offset
    );

    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();

    // Update grid position - keep it BELOW the model floor, not on it
    if (this.grid) {
      this.grid.position.copy(center);
      this.grid.position.y = -1.0;  // CRITICAL: Always below floor
    }

    // Cache this as the default preset
    this._cachePreset('default', this.camera.position.clone(), center);

    // Update model info
    this._updateModelInfo();
  }

  /**
   * Cache camera preset
   */
  _cachePreset(name, position, target) {
    this.cameraPresets[name] = {
      position: position.clone(),
      target: target.clone(),
    };
  }

  /**
   * Update model information panel
   */
  _updateModelInfo() {
    if (!this.currentModel) return;

    let objectCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;
    let materialCount = new Set();

    this.currentModel.traverse((child) => {
      if (child.isMesh) {
        objectCount++;

        if (child.geometry) {
          const positionAttribute = child.geometry.getAttribute('position');
          if (positionAttribute) {
            vertexCount += positionAttribute.count;
          }

          if (child.geometry.index) {
            triangleCount += child.geometry.index.count / 3;
          } else if (child.geometry.attributes.position) {
            triangleCount += child.geometry.attributes.position.count / 3;
          }
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => materialCount.add(m.uuid));
          } else {
            materialCount.add(child.material.uuid);
          }
        }
      }
    });

    const size = this.modelBoundingBox.getSize(new THREE.Vector3());

    this.modelInfo = {
      name: this.modelName || 'Unnamed Model',
      objectCount,
      vertexCount,
      triangleCount: Math.floor(triangleCount),
      materialCount: materialCount.size,
      boundingBoxDimensions: {
        x: parseFloat(size.x),
        y: parseFloat(size.y),
        z: parseFloat(size.z),
      },
    };
  }

  /**
   * Clear current model
   */
  clearModel() {
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this._disposeObject(this.currentModel);
      this.currentModel = null;
    }

    // Remove architectural edges
    this._removeArchitecturalEdges();

    this.selectedObject = null;
    this.objectNameMap = null;
    this.modelName = null;
    this.modelInfo = {
      name: 'None loaded',
      objectCount: 0,
      vertexCount: 0,
      triangleCount: 0,
      materialCount: 0,
      boundingBoxDimensions: { x: 0, y: 0, z: 0 },
    };
  }

  /**
   * Recursively dispose of Three.js objects to prevent memory leaks
   */
  _disposeObject(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }

    obj.children.forEach((child) => this._disposeObject(child));
  }

  /**
   * Load OBJ from File object (from file input or drag-drop)
   */
  async loadFromFile(file, mtlFile = null) {
    if (!file) return;

    this.isLoading = true;

    try {
      // Validate file
      if (!file.name.toLowerCase().endsWith('.obj')) {
        throw new Error('Invalid file format. Please upload an .obj file.');
      }

      if (file.size === 0) {
        throw new Error('File is empty.');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File is too large (max 50MB).');
      }

      this.modelName = file.name;

      // Read OBJ file
      const objText = await this._readFileAsText(file);

      // Prepare URLs for loading
      const objUrl = URL.createObjectURL(file);
      let mtlUrl = null;

      if (mtlFile) {
        if (!mtlFile.name.toLowerCase().endsWith('.mtl')) {
          throw new Error('MTL file has invalid format.');
        }
        mtlUrl = URL.createObjectURL(mtlFile);
      } else {
        // Try to find MTL reference in OBJ
        const mtlMatch = objText.match(/^mtllib\s+(.+)$/m);
        if (mtlMatch && mtlFile === undefined) {
          // MTL is referenced but not provided - log info but continue
          console.info(`OBJ references MTL file: ${mtlMatch[1]} (not provided)`);
        }
      }

      // Load model
      await this._loadOBJFromURL(objUrl, mtlUrl);

      // Cleanup temporary URLs
      URL.revokeObjectURL(objUrl);
      if (mtlUrl) URL.revokeObjectURL(mtlUrl);

      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Load OBJ from URL
   */
  async loadFromURL(objUrl, mtlUrl = null) {
    console.log(`[OBJViewerCore] loadFromURL called: ${objUrl} (${new Date().toLocaleTimeString()})`);
    this.isLoading = true;

    try {
      // Extract filename for display
      this.modelName = objUrl.split('/').pop().split('?')[0] || 'Model';

      await this._loadOBJFromURL(objUrl, mtlUrl);

      console.log(`[OBJViewerCore] Model loaded successfully: ${this.modelName}`);
      this.isLoading = false;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Internal OBJ loading from URL
   */
  async _loadOBJFromURL(objUrl, mtlUrl = null) {
    return new Promise((resolve, reject) => {
      const objLoader = new OBJLoader();

      // If MTL URL provided, load materials first
      if (mtlUrl) {
        const mtlLoader = new MTLLoader();
        mtlLoader.load(
          mtlUrl,
          (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            this._loadOBJWithLoader(objLoader, objUrl, resolve, reject);
          },
          undefined,
          (error) => {
            console.warn('Failed to load MTL file:', error);
            // Continue loading OBJ without MTL
            this._loadOBJWithLoader(objLoader, objUrl, resolve, reject);
          }
        );
      } else {
        // Load OBJ without materials
        this._loadOBJWithLoader(objLoader, objUrl, resolve, reject);
      }
    });
  }

  /**
   * Load OBJ with OBJLoader
   * CRITICAL: Must check if scene is still valid before calling .add()
   */
  _loadOBJWithLoader(loader, objUrl, resolve, reject) {
    // Create a unique load ID to track this specific load operation
    const loadId = Symbol('obj-load');
    this._pendingLoads.add(loadId);

    console.log('[OBJViewerCore] Starting OBJ load...');

    loader.load(
      objUrl,
      (group) => {
        // CRITICAL: Verify this instance is still valid and not disposed
        if (this._isDisposed || !this.scene || !this.container) {
          console.warn('[OBJViewerCore] Load completed but viewer was disposed. Ignoring.');
          this._pendingLoads.delete(loadId);
          reject(new Error('Viewer disposed during load'));
          return;
        }

        console.log('[OBJViewerCore] OBJ loaded successfully, processing...');

        try {
          // Clear previous model
          this.clearModel();

          // CRITICAL: Process materials for proper architectural visualization
          group.traverse((child) => {
            if (child.isMesh) {
              // Enable shadows for depth perception
              child.castShadow = true;
              child.receiveShadow = true;

              // CRITICAL: Material handling for architectural quality
              if (child.material) {
                if (Array.isArray(child.material)) {
                  // Clone and optimize each material in the array
                  child.material = child.material.map((mat) => {
                    return this._optimizeMaterial(mat);
                  });
                } else {
                  // Single material - optimize it
                  child.material = this._optimizeMaterial(child.material);
                }
              } else {
                // Fallback material if none exists
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xcccccc,
                  metalness: 0.0,
                  roughness: 0.95,
                });
              }
            }
          });

          // CRITICAL: Guard check - scene could have been nullified during traverse
          if (!this.scene) {
            console.error('[OBJViewerCore] Scene became null during material processing');
            this._pendingLoads.delete(loadId);
            reject(new Error('Scene disposed during material processing'));
            return;
          }

          // CRITICAL: THIS IS WHERE THE BUG WAS - add group to scene
          // But only if scene is still valid
          this.scene.add(group);
          this.currentModel = group;

          console.log('[OBJViewerCore] Model added to scene, building hierarchy...');

          // Build object tree for visibility control
          this._buildObjectNameMapping();

          // Calculate optimal camera framing
          this._calculateOptimalCamera();

          console.log('[OBJViewerCore] Load complete');
          this._pendingLoads.delete(loadId);
          resolve();
        } catch (error) {
          console.error('[OBJViewerCore] Error processing loaded OBJ:', error);
          this._pendingLoads.delete(loadId);
          reject(error);
        }
      },
      (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
          console.log(`[OBJViewerCore] Loading: ${percentComplete.toFixed(1)}%`);
        }
      },
      (error) => {
        console.error('[OBJViewerCore] OBJ loading error:', error);
        this._pendingLoads.delete(loadId);
        reject(new Error(`Failed to load OBJ: ${error.message}`));
      }
    );
  }

  /**
  /**
   * Optimize material for professional architectural rendering
   * Converts various material types to MeshStandardMaterial with proper PBR
   * CRITICAL: Walls, doors, and floor must be completely opaque
   */
  _optimizeMaterial(mat) {
    // Extract key properties
    const color = mat.color ? mat.color.clone() : new THREE.Color(0xcccccc);
    const matName = mat.name ? mat.name.toLowerCase() : '';
    
    // CRITICAL: Walls, doors, and floor must ALWAYS be completely opaque
    // Even if MTL defines transparency, these elements override it
    const isWall = matName.includes('wall');
    const isDoor = matName.includes('door');
    const isFloor = matName.includes('floor');
    const isWindow = matName.includes('window');
    
    let transparent = mat.transparent || (mat.opacity !== undefined && mat.opacity < 1.0);
    let opacity = mat.opacity !== undefined ? mat.opacity : 1.0;
    
    // Override transparency for opaque architectural elements
    if (isWall || isDoor || isFloor) {
      transparent = false;
      opacity = 1.0;
    }
    
    const alphaTest = mat.alphaTest || 0;

    console.log(`[OBJViewerCore] Optimizing material: ${matName} | color=${color.getHexString()}, opacity=${opacity}, transparent=${transparent}`);

    // Create optimized MeshStandardMaterial
    const optimized = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.0,           // No metallic sheen - matte architectural finish
      roughness: 0.95,          // Slightly rough for realistic matte appearance
      transparent: transparent,
      opacity: opacity,
      alphaTest: alphaTest,
      depthWrite: true,         // CRITICAL: Always write to depth for proper occlusion
      depthTest: true,          // CRITICAL: Always test depth for correct rendering order
      side: THREE.FrontSide,
    });

    // Preserve original material for reference
    optimized.userData = {
      originalMaterial: mat.name || 'unknown',
      originalOpacity: opacity,
      isWall,
      isDoor,
      isFloor,
      isWindow,
    };

    return optimized;
  }

  /**
   * Read file as text
   */
  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Handle files dropped on viewer
   */
  _handleFilesDrop(files) {
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
      this.loadFromFile(objFile, mtlFile).catch((error) => {
        this.onLoadError?.(error.message);
      });
    }
  }

  /**
   * Fit entire model in view
   */
  fitModel() {
    if (!this.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.currentModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
    const offset = cameraDistance * 0.6;

    this.camera.position.set(
      center.x + offset,
      center.y + offset,
      center.z + offset
    );

    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Reset camera to default view
   */
  resetView() {
    if (!this.cameraPresets.default) {
      this.fitModel();
      return;
    }

    const preset = this.cameraPresets.default;
    if (preset) {
      this.camera.position.copy(preset.position);
      this.controls.target.copy(preset.target);
      this.camera.lookAt(preset.target);
      this.controls.update();
    }
  }

  /**
   * Apply camera preset (Front, Back, Left, Right, Top, Bottom, Isometric)
   */
  setCameraPreset(preset) {
    if (!this.currentModel || !this.modelCenter) return;

    const center = this.modelCenter;
    const size = this.modelSize;
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;

    let position;

    switch (preset.toLowerCase()) {
      case 'front':
        position = new THREE.Vector3(center.x, center.y, center.z + distance);
        break;
      case 'back':
        position = new THREE.Vector3(center.x, center.y, center.z - distance);
        break;
      case 'left':
        position = new THREE.Vector3(center.x - distance, center.y, center.z);
        break;
      case 'right':
        position = new THREE.Vector3(center.x + distance, center.y, center.z);
        break;
      case 'top':
        position = new THREE.Vector3(center.x, center.y + distance, center.z);
        break;
      case 'bottom':
        // Low floor-level view (not underneath)
        // Position camera at floor level looking at model from front-low perspective
        position = new THREE.Vector3(center.x, center.y + size.y * 0.15, center.z + distance);
        break;
      case 'isometric':
        const offset = distance * 0.6;
        position = new THREE.Vector3(
          center.x + offset,
          center.y + offset,
          center.z + offset
        );
        break;
      default:
        return;
    }

    this.camera.position.copy(position);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Toggle wireframe mode
   */
  toggleWireframe() {
    this.isWireframeMode = !this.isWireframeMode;

    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              m.wireframe = this.isWireframeMode;
            });
          } else {
            child.material.wireframe = this.isWireframeMode;
          }
        }
      });
    }

    return this.isWireframeMode;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    if (this.grid) {
      this.grid.visible = !this.grid.visible;
      return this.grid.visible;
    }
    return false;
  }

  /**
   * Toggle axes visibility
   */
  toggleAxes() {
    if (this.axes) {
      this.axes.visible = !this.axes.visible;
      return this.axes.visible;
    }
    return false;
  }

  /**
   * Handle mouse click for object selection
   */
  _onMouseClick(event) {
    if (!this.currentModel) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = [];
    this.currentModel.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      this._selectObject(clickedMesh);
    } else {
      this._clearSelection();
    }
  }

  /**
   * Select an object and apply subtle highlight
   * CRITICAL: Do NOT replace the material - only modify emissive
   */
  _selectObject(object) {
    // Clear previous selection first
    this._clearSelection();

    this.selectedObject = object;

    // Apply subtle emissive highlight - do NOT replace material
    if (Array.isArray(object.material)) {
      object.material.forEach((mat) => {
        if (!mat._originalEmissive) {
          mat._originalEmissive = mat.emissive.getHex();
          mat._originalEmissiveIntensity = mat.emissiveIntensity || 0;
        }
        // Apply subtle highlight
        mat.emissive.setHex(0x444444);
        mat.emissiveIntensity = 0.3;
      });
    } else if (object.material) {
      if (!object.material._originalEmissive) {
        object.material._originalEmissive = object.material.emissive.getHex();
        object.material._originalEmissiveIntensity = object.material.emissiveIntensity || 0;
      }
      // Apply subtle highlight
      object.material.emissive.setHex(0x444444);
      object.material.emissiveIntensity = 0.3;
    }

    // Emit selection event
    this.onSelectionChanged?.({
      object: object,
      name: object.name || 'Unnamed',
    });
  }

  /**
   * Clear object selection - RESTORE ORIGINAL EMISSIVE
   */
  _clearSelection() {
    if (!this.selectedObject) return;

    // Restore original emissive values
    if (Array.isArray(this.selectedObject.material)) {
      this.selectedObject.material.forEach((mat) => {
        if (mat._originalEmissive !== undefined) {
          mat.emissive.setHex(mat._originalEmissive);
          mat.emissiveIntensity = mat._originalEmissiveIntensity;
          delete mat._originalEmissive;
          delete mat._originalEmissiveIntensity;
        }
      });
    } else if (this.selectedObject.material) {
      if (this.selectedObject.material._originalEmissive !== undefined) {
        this.selectedObject.material.emissive.setHex(this.selectedObject.material._originalEmissive);
        this.selectedObject.material.emissiveIntensity = this.selectedObject.material._originalEmissiveIntensity;
        delete this.selectedObject.material._originalEmissive;
        delete this.selectedObject.material._originalEmissiveIntensity;
      }
    }

    this.selectedObject = null;

    this.onSelectionChanged?.({ object: null });
  }

  /**
   * Add edge lines for architectural definition
   * Creates crisp edges without messy wireframe
   * Uses EdgesGeometry with 20° angle threshold for clean architectural appearance
   */
  _addArchitecturalEdges() {
    if (!this.currentModel || !this.scene) return;

    // Remove any existing edge lines
    this._removeArchitecturalEdges();

    console.log('[OBJViewerCore] Adding architectural edges...');

    this.edgeLines = new THREE.Group();
    let edgeCount = 0;

    this.currentModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Create edges from the geometry using 20° angle threshold
        // This detects major geometric features (walls, doors, windows)
        // Without creating noisy triangle-level wireframe
        const edges = new THREE.EdgesGeometry(child.geometry, 20);
        
        if (edges.attributes.position.count > 0) {
          const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
              color: 0x2a2a2a,        // Dark gray - subtle but visible
              linewidth: 1,
              transparent: false,
              opacity: 0.4,
              depthTest: true,
              depthWrite: false,      // Don't write to depth to avoid interfering with model
            })
          );

          // Position edge lines at same location as mesh
          line.position.copy(child.position);
          line.rotation.copy(child.rotation);
          line.scale.copy(child.scale);
          line.renderOrder = 10;     // Render on top of model surfaces

          this.edgeLines.add(line);
          edgeCount++;
        }
      }
    });

    this.scene.add(this.edgeLines);
    console.log(`[OBJViewerCore] Added architectural edges (${edgeCount} meshes with edges)`);
  }

  /**
   * Remove architectural edges
   */
  _removeArchitecturalEdges() {
    if (this.edgeLines) {
      this.scene.remove(this.edgeLines);
      this._disposeObject(this.edgeLines);
      this.edgeLines = null;
    }
  }

  /**
   * Build mapping of object names to actual loaded meshes
   * This allows us to properly hide/show Floor, Walls, Doors, Windows
   * CRITICAL: Map ALL meshes, including nested ones
   */
  _buildObjectNameMapping() {
    this.objectNameMap = {};

    if (!this.currentModel) return;

    console.log('[OBJViewerCore] Building object name mapping...');

    // Traverse and map by object name
    let meshCount = 0;
    this.currentModel.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        const name = child.name;
        
        // CRITICAL: Only map if name is meaningful
        if (name && name.trim() !== '') {
          if (!this.objectNameMap[name]) {
            this.objectNameMap[name] = [];
          }
          this.objectNameMap[name].push(child);
          console.log(`  Mapped mesh: "${name}" (type: ${child.type}, vertices: ${child.geometry.attributes.position.count})`);
        } else {
          console.warn(`  Mesh has no name or empty name: ${child}`);
        }
      }
    });

    console.log(`[OBJViewerCore] Mapping complete. Found ${meshCount} total meshes.`);
    console.log(`[OBJViewerCore] Object categories: ${Object.keys(this.objectNameMap).join(', ')}`);
    console.log('[OBJViewerCore] Object Name Map:', this.objectNameMap);

    // Add architectural edges for clean definition
    this._addArchitecturalEdges();
  }

  /**
   * Get hierarchical object tree
   */
  getObjectTree() {
    if (!this.currentModel) return [];

    const tree = [];

    const buildTree = (object, depth = 0) => {
      if (object.isMesh || object.isGroup) {
        const node = {
          id: object.uuid,
          name: object.name || `Object_${tree.length}`,
          type: object.type,
          visible: object.visible,
          children: [],
        };

        if (object.children) {
          object.children.forEach((child) => {
            const childNode = buildTree(child, depth + 1);
            if (childNode) node.children.push(childNode);
          });
        }

        return node;
      }

      return null;
    };

    this.currentModel.children.forEach((child) => {
      const node = buildTree(child);
      if (node) tree.push(node);
    });

    return tree;
  }

  /**
   * Set object visibility by UUID
   */
  setObjectVisibility(objectId, visible) {
    const object = this.scene.getObjectByProperty('uuid', objectId);
    if (object) {
      object.visible = visible;
      if (object.children) {
        object.children.forEach((child) => {
          child.visible = visible;
        });
      }
    }
  }

  /**
   * Set visibility by object name (e.g., "Floor", "Walls", "Doors", "Windows")
   * This is the primary visibility control for architectural models
   * CRITICAL: Must handle all meshes under that name
   */
  setObjectNameVisibility(objectName, visible) {
    if (!this.objectNameMap) {
      console.error('[OBJViewerCore] Object name map not initialized');
      return false;
    }

    if (!this.objectNameMap[objectName]) {
      console.warn(`[OBJViewerCore] Object name not found: "${objectName}". Available: ${Object.keys(this.objectNameMap).join(', ')}`);
      return false;
    }

    const meshes = this.objectNameMap[objectName];
    console.log(`[OBJViewerCore] Setting visibility for "${objectName}": ${visible} (${meshes.length} meshes)`);

    meshes.forEach((obj) => {
      obj.visible = visible;
    });

    return true;
  }

  /**
   * Get visibility state for an object name
   */
  getObjectNameVisibility(objectName) {
    if (!this.objectNameMap || !this.objectNameMap[objectName]) {
      return null;
    }
    
    // Return visibility state of first mesh (all should be synchronized)
    const meshes = this.objectNameMap[objectName];
    return meshes.length > 0 ? meshes[0].visible : null;
  }

  /**
   * Get all available object names for visibility control
   */
  getAvailableObjectNames() {
    if (!this.objectNameMap) return [];
    return Object.keys(this.objectNameMap);
  }

  /**
   * Get hierarchical object tree

  /**
   * Get model information
   */
  getModelInfo() {
    return { ...this.modelInfo };
  }

  /**
   * Dispose viewer and clean up resources
   * CRITICAL: Mark as disposed to prevent async callbacks from executing
   */
  dispose() {
    console.log('[OBJViewerCore] Disposing viewer...');

    // CRITICAL: Set disposed flag FIRST to stop animation loop and prevent race conditions
    this._isDisposed = true;

    // Cancel animation frame loop
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    // Wait for pending loads to complete before disposing (or they'll error silently which is fine)
    // This allows in-flight network requests to complete without crashing
    this._pendingLoads.clear();

    // Dispose objects
    if (this.currentModel) {
      this._disposeObject(this.currentModel);
      this.currentModel = null;
    }

    // Dispose edges
    if (this.edgeLines) {
      this._disposeObject(this.edgeLines);
      this.edgeLines = null;
    }

    // Dispose helpers
    if (this.grid) {
      this.grid.geometry.dispose();
      this.grid = null;
    }
    if (this.axes) {
      this.axes.geometry.dispose();
      this.axes = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    // Clear references (but DON'T set scene to null yet - let async callbacks check for it)
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.objectNameMap = null;

    console.log('[OBJViewerCore] Dispose complete');
  }
}
