import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Atmarakshak3DHero({
  theme = 'dark',
  minHeight = '520px',
  maxHeight = '640px',
  height = '100%'
}) {
  const mountRef = useRef(null);
  const [thermalMode, setThermalMode] = useState(false);
  const thermalModeRef = useRef(thermalMode);

  useEffect(() => {
    thermalModeRef.current = thermalMode;
  }, [thermalMode]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 550;
    const H = el.clientHeight || 550;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Perspective camera positioned for optimal isometric view of entire 1 BHK floor map
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(7.5, 6.5, 8.5);
    camera.lookAt(0, -0.4, 0);

    // ── Gruvbox Theme Palette ──
    const G_RED = 0xfb4934;
    const G_ORANGE = 0xfe8019;
    const G_YELLOW = 0xfabd2f;
    const G_GREEN = 0xb8bb26;
    const G_AQUA = 0x8ec07c;
    const G_BLUE = 0x83a598;
    const G_PURPLE = 0xd3869b;
    const G_BG0 = 0x1d2021;
    const G_BG1 = 0x3c3836;
    const G_BG2 = 0x504945;
    const G_BG3 = 0x665c54;
    const G_FG = 0xebdbb2;

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x32302f, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(G_FG, 1.4);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const blueFill = new THREE.DirectionalLight(G_BLUE, 0.9);
    blueFill.position.set(-8, 5, -6);
    scene.add(blueFill);

    // Alert light inside the kitchen
    const alertLight = new THREE.PointLight(G_RED, 4.0, 8);
    alertLight.position.set(2.2, 1.0, 1.4);
    scene.add(alertLight);

    // Warm lamp light in the living room & bedroom
    const livingLamp = new THREE.PointLight(G_YELLOW, 1.8, 6);
    livingLamp.position.set(0.2, 0.2, 0.8);
    scene.add(livingLamp);

    const bedLamp = new THREE.PointLight(G_YELLOW, 1.5, 5);
    bedLamp.position.set(-2.2, 0.2, 1.4);
    scene.add(bedLamp);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Dynamic material tracking for Thermal View
    const dynamicMats = [];

    // Helper: Holographic box (face + glowing edges)
    const addHolo = (w, h, d, color, [x, y, z], faceAlpha = 0.14, edgeAlpha = 0.85, isHot = false, roomTag = 'all') => {
      const faceMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: faceAlpha,
        metalness: 0.4,
        roughness: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), faceMat);

      const edgeGeo = new THREE.EdgesGeometry(face.geometry, 15);
      const edgeMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: edgeAlpha,
      });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);

      const group = new THREE.Group();
      group.add(face);
      group.add(edges);
      group.position.set(x, y, z);
      rootGroup.add(group);

      dynamicMats.push({
        faceMat,
        edgeMat,
        origColor: color,
        isHot,
        roomTag,
      });

      return group;
    };

    // Helper: Solid architectural furniture/fixture
    const addSolid = (geo, color, [x, y, z], isHot = false, roomTag = 'all') => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      rootGroup.add(mesh);

      dynamicMats.push({
        faceMat: mat,
        edgeMat: null,
        origColor: color,
        isHot,
        roomTag,
      });

      return mesh;
    };

    // ═════════════════════════════════════════════════════════════════
    // ─── 1 BHK ARCHITECTURAL LAYOUT SPECIFICATION ───
    // Total footprint: 7.2m (X: -3.6 to +3.6) by 5.4m (Z: -2.7 to +2.7)
    // Floor Level: Y = -1.5
    // Wall Height: 0.95m (low isometric cutaway so all rooms are visible)
    // ═════════════════════════════════════════════════════════════════
    const floorY = -1.5;
    const wallH = 1.05;
    const wallThick = 0.1;
    const floorW = 7.4;
    const floorD = 5.6;

    // 1. Concrete Foundation Slab
    addHolo(floorW, 0.14, floorD, G_BG2, [0, floorY - 0.07, 0], 0.35, 0.95);

    // Floor tile grid
    const floorGrid = new THREE.GridHelper(7.2, 18, G_YELLOW, G_BG3);
    floorGrid.position.y = floorY + 0.005;
    rootGroup.add(floorGrid);

    // 2. Exterior Boundary Walls (with door & window openings)
    const wallY = floorY + wallH / 2;

    // North Wall (Back)
    addHolo(floorW, wallH, wallThick, G_BG3, [0, wallY, -floorD / 2], 0.25, 0.9);
    // South Wall (Front - split by main entrance)
    addHolo(2.8, wallH, wallThick, G_BG3, [-2.2, wallY, floorD / 2], 0.25, 0.9);
    addHolo(3.2, wallH, wallThick, G_BG3, [2.0, wallY, floorD / 2], 0.25, 0.9);
    // West Wall (Left - Bedroom & Bath)
    addHolo(wallThick, wallH, floorD, G_BG3, [-floorW / 2, wallY, 0], 0.25, 0.9);
    // East Wall (Right - Kitchen & Balcony)
    addHolo(wallThick, wallH, floorD, G_BG3, [floorW / 2, wallY, 0], 0.25, 0.9);

    // 3. Interior Partition Walls (Dividing Bedroom, Bath, Living, Kitchen)
    // Wall dividing Bedroom/Bath from Living Room (X = -1.1)
    addHolo(wallThick, wallH, 1.8, G_BLUE, [-1.1, wallY, 1.7], 0.18, 0.85); // Living/Bed divider
    addHolo(wallThick, wallH, 1.8, G_BLUE, [-1.1, wallY, -1.7], 0.18, 0.85); // Living/Bath divider
    // (Gap at Z = -0.1 to 0.7 for Bedroom door & corridor access)

    // Wall dividing Bedroom from Bathroom (Z = 0.1, X = -3.6 to -1.1)
    addHolo(2.4, wallH, wallThick, G_BLUE, [-2.35, wallY, 0.1], 0.18, 0.85);

    // Wall dividing Living Room from Kitchen (X = 1.1)
    addHolo(wallThick, wallH, 1.8, G_YELLOW, [1.1, wallY, 1.7], 0.18, 0.85); // Kitchen/Living divider with open breakfast counter gap

    // Wall dividing Kitchen from Balcony (Z = -0.1, X = 1.1 to 3.6)
    addHolo(2.4, wallH, wallThick, G_BG3, [2.35, wallY, -0.1], 0.18, 0.85); // Sliding door gap

    // ═════════════════════════════════════════════════════════════════
    // ─── ROOM 1: HALL / LIVING ROOM (Center & Front) ───
    // ═════════════════════════════════════════════════════════════════
    const livingTag = 'living';

    // L-Shaped Sectional Sofa
    addHolo(1.8, 0.45, 0.7, G_AQUA, [0.0, floorY + 0.25, 1.8], 0.25, 0.9, false, livingTag);
    addHolo(0.7, 0.45, 1.1, G_AQUA, [-0.55, floorY + 0.25, 1.0], 0.25, 0.9, false, livingTag);
    // Sofa backrest
    addHolo(1.8, 0.35, 0.18, G_AQUA, [0.0, floorY + 0.65, 2.05], 0.3, 0.95, false, livingTag);

    // Center Coffee Table
    addHolo(0.9, 0.25, 0.55, G_YELLOW, [0.15, floorY + 0.15, 1.1], 0.2, 0.85, false, livingTag);

    // Entertainment TV Media Console (Opposite Wall)
    addHolo(1.6, 0.35, 0.3, G_BG2, [0.0, floorY + 0.2, -0.1], 0.25, 0.9, false, livingTag);
    // Flat TV Screen mounted on wall
    const tvScreen = addHolo(1.4, 0.8, 0.04, G_BLUE, [0.0, floorY + 0.95, -0.1], 0.35, 1.0, false, livingTag);

    // Living Room Ceiling Smoke Sensor #01 (Normal Green)
    const lrSensor = addHolo(0.25, 0.08, 0.25, G_GREEN, [0.0, floorY + 2.4, 1.2], 0.4, 1.0, false, livingTag);
    // Green safe detection cone
    const lrCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.6, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: G_GREEN, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
    );
    lrCone.position.set(0.0, floorY + 1.6, 1.2);
    rootGroup.add(lrCone);

    // ═════════════════════════════════════════════════════════════════
    // ─── ROOM 2: KITCHEN & UTILITY (Front Right) ───
    // ACTIVE HAZARD / FIRE SOURCE (LPG / Stove Heat Anomaly)
    // ═════════════════════════════════════════════════════════════════
    const kitchenTag = 'kitchen';

    // Kitchen Counter (L-Shape along East & South Walls)
    addHolo(0.65, 0.85, 2.3, G_BG1, [3.25, floorY + 0.45, 1.4], 0.3, 0.9, false, kitchenTag);
    addHolo(1.5, 0.85, 0.65, G_BG1, [2.2, floorY + 0.45, 2.25], 0.3, 0.9, false, kitchenTag);

    // Refrigerator Unit (Tall Fridge)
    addHolo(0.75, 1.75, 0.7, G_AQUA, [3.2, floorY + 0.9, 0.25], 0.25, 0.9, false, kitchenTag);

    // Kitchen Sink with Faucet
    addHolo(0.55, 0.08, 0.4, G_BLUE, [3.2, floorY + 0.89, 1.9], 0.4, 1.0, false, kitchenTag);

    // Gas Stove (Stove Top - Hot Zone)
    const stovePos = [2.2, floorY + 0.9, 2.25];
    const stove = addHolo(0.6, 0.08, 0.45, G_RED, stovePos, 0.45, 1.0, true, kitchenTag);

    // ── Active Kitchen Multi-Sensor Unit (Ceiling Mounted) ──
    const kSensorPos = [2.2, floorY + 2.45, 2.0];
    const kSensor = addHolo(0.3, 0.1, 0.3, G_RED, kSensorPos, 0.5, 1.0, true, kitchenTag);

    // Strobe Alert Beacon
    const beaconMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: G_RED })
    );
    beaconMesh.position.set(kSensorPos[0], kSensorPos[1] - 0.06, kSensorPos[2]);
    rootGroup.add(beaconMesh);

    // Alert Shockwave Pulse Rings
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.34, 24),
      new THREE.MeshBasicMaterial({ color: G_RED, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    pulseRing.rotation.x = Math.PI / 2;
    pulseRing.position.set(kSensorPos[0], kSensorPos[1] - 0.08, kSensorPos[2]);
    rootGroup.add(pulseRing);

    // Inverted Red Alert Thermal Cone
    const kCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.0, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: G_RED, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
    );
    kCone.position.set(kSensorPos[0], kSensorPos[1] - 1.0, kSensorPos[2]);
    rootGroup.add(kCone);

    // Fire Suppression Overhead Pipe & Sprinkler Head
    const kPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: G_RED, metalness: 0.7 })
    );
    kPipe.rotation.z = Math.PI / 2;
    kPipe.position.set(2.3, floorY + 2.55, 2.0);
    rootGroup.add(kPipe);

    const kSprinkler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.05, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: G_YELLOW, metalness: 0.9 })
    );
    kSprinkler.position.set(2.2, floorY + 2.48, 2.0);
    rootGroup.add(kSprinkler);

    // ── Rising Smoke / Heat Particles from Stove ──
    const smokeCount = 50;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    for (let s = 0; s < smokeCount; s++) {
      smokePos[s * 3] = stovePos[0] + (Math.random() - 0.5) * 0.4;
      smokePos[s * 3 + 1] = stovePos[1] + 0.1 + Math.random() * 1.5;
      smokePos[s * 3 + 2] = stovePos[2] + (Math.random() - 0.5) * 0.4;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: G_ORANGE,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    rootGroup.add(smokeParticles);

    // ═════════════════════════════════════════════════════════════════
    // ─── ROOM 3: MASTER BEDROOM (Left Front & Mid) ───
    // ═════════════════════════════════════════════════════════════════
    const bedTag = 'bedroom';

    // King Size Bed (Frame & Mattress)
    addHolo(1.7, 0.35, 2.1, G_PURPLE, [-2.35, floorY + 0.2, 1.4], 0.25, 0.9, false, bedTag);
    // Headboard against West Wall
    addHolo(0.2, 0.85, 2.1, G_PURPLE, [-3.3, floorY + 0.55, 1.4], 0.3, 0.95, false, bedTag);
    // Pillows
    addHolo(0.35, 0.12, 0.65, G_FG, [-3.0, floorY + 0.42, 1.05], 0.4, 0.9, false, bedTag);
    addHolo(0.35, 0.12, 0.65, G_FG, [-3.0, floorY + 0.42, 1.75], 0.4, 0.9, false, bedTag);

    // Bedside Nightstands
    addHolo(0.45, 0.4, 0.45, G_BG2, [-3.15, floorY + 0.22, 0.2], 0.2, 0.85, false, bedTag);
    addHolo(0.45, 0.4, 0.45, G_BG2, [-3.15, floorY + 0.22, 2.6], 0.2, 0.85, false, bedTag);

    // Full-Height Wardrobe / Closet
    addHolo(0.65, 1.9, 1.4, G_BG1, [-1.55, floorY + 0.95, 2.0], 0.25, 0.9, false, bedTag);

    // Bedroom Ceiling Sensor #03 (Normal Green)
    addHolo(0.22, 0.08, 0.22, G_GREEN, [-2.35, floorY + 2.4, 1.4], 0.35, 1.0, false, bedTag);

    // ═════════════════════════════════════════════════════════════════
    // ─── ROOM 4: ATTACHED BATHROOM (Back Left) ───
    // ═════════════════════════════════════════════════════════════════
    const bathTag = 'bath';

    // Vanity Basin Counter & Mirror
    addHolo(0.6, 0.75, 1.0, G_BLUE, [-3.25, floorY + 0.4, -0.9], 0.25, 0.85, false, bathTag);
    addHolo(0.04, 0.7, 0.8, G_BLUE, [-3.52, floorY + 1.15, -0.9], 0.4, 1.0, false, bathTag);

    // Commode / Water Closet
    addHolo(0.45, 0.45, 0.6, G_FG, [-3.25, floorY + 0.25, -1.9], 0.3, 0.85, false, bathTag);

    // Glass Shower Stall Partition
    addHolo(0.9, 1.6, 0.04, G_AQUA, [-2.0, floorY + 0.82, -1.9], 0.12, 0.85, false, bathTag);

    // Bathroom Exhaust & Temp Sensor
    addHolo(0.18, 0.06, 0.18, G_AQUA, [-2.4, floorY + 2.3, -1.4], 0.3, 0.9, false, bathTag);

    // ═════════════════════════════════════════════════════════════════
    // ─── ROOM 5: BALCONY / UTILITY TERRACE (Back Right) ───
    // ═════════════════════════════════════════════════════════════════
    const balconyTag = 'balcony';

    // Balcony Railing Perimeter
    addHolo(2.4, 0.75, 0.04, G_GREEN, [2.35, floorY + 0.4, -floorD / 2], 0.15, 0.85, false, balconyTag);
    addHolo(0.04, 0.75, 2.4, G_GREEN, [floorW / 2, floorY + 0.4, -1.3], 0.15, 0.85, false, balconyTag);

    // Planters / Pots on Balcony
    addHolo(0.35, 0.4, 0.35, G_GREEN, [3.2, floorY + 0.22, -2.3], 0.3, 0.9, false, balconyTag);
    addHolo(0.35, 0.4, 0.35, G_GREEN, [1.5, floorY + 0.22, -2.3], 0.3, 0.9, false, balconyTag);

    // ═════════════════════════════════════════════════════════════════
    // ─── MAIN CORRIDOR & EMERGENCY EVACUATION PATH ───
    // ═════════════════════════════════════════════════════════════════
    // Main Entry Door location: X = -0.6 to 0.2, Z = floorD / 2
    // Green Illuminated EXIT Sign above door
    const exitSign = addHolo(0.7, 0.22, 0.05, G_GREEN, [-0.2, floorY + 1.8, floorD / 2], 0.45, 1.0);

    // Floor-Projected Evacuation Chevron Arrows (Directing from Kitchen & Bedroom to Exit)
    const arrowGroup = new THREE.Group();
    rootGroup.add(arrowGroup);

    // Arrows from Living / Kitchen to Main Door
    const arrowCoords = [
      [1.4, 1.2],
      [0.8, 1.5],
      [0.2, 1.8],
      [-0.2, 2.2],
    ];
    arrowCoords.forEach(([ax, az]) => {
      const arr = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.28, 3),
        new THREE.MeshBasicMaterial({ color: G_GREEN, transparent: true, opacity: 0.85 })
      );
      arr.rotation.x = Math.PI / 2;
      arr.rotation.z = Math.PI / 2;
      arr.position.set(ax, floorY + 0.02, az);
      arrowGroup.add(arr);
    });

    // ── Surveillance Camera (Corner of Living Room scanning entire flat) ──
    const camGroup = new THREE.Group();
    camGroup.position.set(-1.0, floorY + 2.3, -0.2);
    rootGroup.add(camGroup);

    addHolo(0.2, 0.14, 0.25, G_YELLOW, [0, 0, 0], 0.3, 0.95);
    const camFOV = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 2.8, 4, 1, true),
      new THREE.MeshBasicMaterial({ color: G_BLUE, wireframe: true, transparent: true, opacity: 0.22 })
    );
    camFOV.rotation.x = -Math.PI / 2.8;
    camFOV.rotation.y = Math.PI / 4;
    camFOV.position.set(0.8, -0.9, 0.9);
    camGroup.add(camFOV);

    // ── Mouse & Camera Orbit Controls ──
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = 0.65;
    let rotX = 0.35;
    let targetRotY = rotY;
    let targetRotX = rotX;
    let zoomDist = 11.2;
    let targetZoom = zoomDist;

    const onMouseDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        targetRotY += dx * 0.007;
        targetRotX += dy * 0.005;
        targetRotX = Math.max(-0.1, Math.min(0.8, targetRotX));
        prevX = e.clientX;
        prevY = e.clientY;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      targetZoom += e.deltaY * 0.006;
      targetZoom = Math.max(8.0, Math.min(15.0, targetZoom));
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // ResizeObserver ensures 3D canvas scales dynamically with section width/height
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(el);

    // ── Animation Loop ──
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera orbit
      rotY += (targetRotY - rotY) * 0.08;
      rotX += (targetRotX - rotX) * 0.08;
      zoomDist += (targetZoom - zoomDist) * 0.08;

      // Subtle idle orbit
      if (!isDragging) {
        targetRotY += 0.0012;
      }

      // Position camera around 1 BHK center
      const cosX = Math.cos(rotX);
      camera.position.x = Math.sin(rotY) * cosX * zoomDist;
      camera.position.y = Math.sin(rotX) * zoomDist + 0.6;
      camera.position.z = Math.cos(rotY) * cosX * zoomDist;
      camera.lookAt(0, -0.3, 0);

      // 1. Kitchen Alert Beacon Pulse
      const pulse = 0.5 + Math.sin(elapsed * 7.5) * 0.5;
      beaconMesh.scale.set(1 + pulse * 0.35, 1 + pulse * 0.35, 1 + pulse * 0.35);
      alertLight.intensity = 2.5 + pulse * 3.5;

      // 2. Expanding Pulse Ring
      const ringScale = ((elapsed * 1.6) % 1.0) * 3.6;
      pulseRing.scale.set(ringScale, ringScale, ringScale);
      pulseRing.material.opacity = Math.max(0, 0.85 * (1.0 - ringScale / 3.6));

      // 3. Smoke Particles rising from kitchen stove
      const pArr = smokeGeo.attributes.position.array;
      for (let s = 0; s < smokeCount; s++) {
        pArr[s * 3 + 1] += 0.016;
        pArr[s * 3] += (Math.random() - 0.5) * 0.006;
        if (pArr[s * 3 + 1] > kSensorPos[1]) {
          pArr[s * 3 + 1] = stovePos[1] + 0.1;
          pArr[s * 3] = stovePos[0] + (Math.random() - 0.5) * 0.35;
          pArr[s * 3 + 2] = stovePos[2] + (Math.random() - 0.5) * 0.35;
        }
      }
      smokeGeo.attributes.position.needsUpdate = true;

      // 4. CCTV Camera gentle oscillation
      camGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.35;

      // 5. Evacuation arrows pulse wave
      arrowGroup.children.forEach((arr, idx) => {
        const arrPulse = Math.sin(elapsed * 4.5 - idx * 0.7);
        arr.material.opacity = arrPulse > 0 ? 0.95 : 0.35;
      });

      // 6. Dynamic Thermal View
      const isThermal = thermalModeRef.current;

      dynamicMats.forEach((m) => {
        if (isThermal) {
          if (m.isHot) {
            m.faceMat.color.setHex(0xff2200);
            m.faceMat.emissive.setHex(0xff3300);
            m.faceMat.opacity = 0.55;
          } else {
            m.faceMat.color.setHex(0x1a237e);
            m.faceMat.emissive.setHex(0x0d47a1);
            m.faceMat.opacity = 0.35;
          }
        } else {
          m.faceMat.color.setHex(m.origColor);
          m.faceMat.emissive.setHex(m.origColor);
          m.faceMat.opacity = 0.15;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      if (renderer.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        minHeight,
        maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        className="vite-3d-canvas"
        style={{ width: '100%', height: '100%' }}
      />


      {/* Bottom Controls Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Toggle Thermal Infrared View */}
          <button
            onClick={() => setThermalMode(!thermalMode)}
            style={{
              background: thermalMode ? 'rgba(251, 73, 52, 0.28)' : 'rgba(29, 32, 33, 0.92)',
              border: `1px solid ${thermalMode ? '#fb4934' : 'var(--color-nickel)'}`,
              color: thermalMode ? '#fb4934' : 'var(--color-white)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <span>🌡️</span>
            <span>{thermalMode ? 'Thermal: ON' : 'Thermal View'}</span>
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            background: 'rgba(29, 32, 33, 0.9)',
            border: '1px solid var(--color-nickel)',
            borderRadius: '6px',
            padding: '5px 12px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--color-dim)',
            }}
          >
            ↖↗ Orbit 360° · Scroll Zoom
          </span>
        </div>
      </div>
    </div>
  );
}
