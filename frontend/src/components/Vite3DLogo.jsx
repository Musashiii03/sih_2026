import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Vite3DLogo({ theme = 'dark' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const width = el.clientWidth || 500;
    const height = el.clientHeight || 500;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0xbd34fe, 4, 15);
    purpleLight.position.set(-4, 3, 4);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x41d1ff, 4, 15);
    cyanLight.position.set(4, -2, 4);
    scene.add(cyanLight);

    const yellowLight = new THREE.DirectionalLight(0xffea00, 2.5);
    yellowLight.position.set(0, 4, 6);
    scene.add(yellowLight);

    // Main Group to rotate
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // ─── 1. Outer Polygon (Vite Shield / Facet) ───
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(-2.2, 2.1);
    shieldShape.lineTo(2.2, 2.1);
    shieldShape.lineTo(1.8, 0.2);
    shieldShape.lineTo(0.0, -2.5);
    shieldShape.lineTo(-1.8, 0.2);
    shieldShape.closePath();

    const extrudeSettingsShield = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettingsShield);
    shieldGeo.center();

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x221345,
      emissive: 0x471d88,
      emissiveIntensity: 0.45,
      metalness: 0.5,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.92,
    });

    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    logoGroup.add(shieldMesh);

    // Shield glowing edge
    const edgesGeo = new THREE.EdgesGeometry(shieldGeo, 20);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xb39aff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const edgesMesh = new THREE.LineSegments(edgesGeo, edgeMat);
    logoGroup.add(edgesMesh);

    // ─── 2. Sharp Lightning Bolt (Golden Metallic) ───
    const boltShape = new THREE.Shape();
    boltShape.moveTo(0.5, 2.0);
    boltShape.lineTo(-0.8, 0.4);
    boltShape.lineTo(-0.1, 0.35);
    boltShape.lineTo(-0.9, -1.8);
    boltShape.lineTo(0.9, -0.2);
    boltShape.lineTo(0.2, -0.15);
    boltShape.closePath();

    const extrudeSettingsBolt = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const boltGeo = new THREE.ExtrudeGeometry(boltShape, extrudeSettingsBolt);
    boltGeo.center();

    const boltMat = new THREE.MeshStandardMaterial({
      color: 0xffd21e,
      emissive: 0xff9900,
      emissiveIntensity: 0.3,
      metalness: 0.85,
      roughness: 0.18,
    });

    const boltMesh = new THREE.Mesh(boltGeo, boltMat);
    boltMesh.position.z = 0.32;
    logoGroup.add(boltMesh);

    // ─── 3. Particle Stars / Aura Field ───
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      // Purple to Cyan gradient
      const isCyan = Math.random() > 0.5;
      colors[i * 3] = isCyan ? 0.25 : 0.74;
      colors[i * 3 + 1] = isCyan ? 0.82 : 0.2;
      colors[i * 3 + 2] = 1.0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.7;
      targetRotationX = -y * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow + subtle idle float
      logoGroup.rotation.y += (targetRotationY - logoGroup.rotation.y) * 0.05 + Math.sin(elapsed * 0.8) * 0.003;
      logoGroup.rotation.x += (targetRotationX - logoGroup.rotation.x) * 0.05 + Math.cos(elapsed * 0.6) * 0.002;
      logoGroup.position.y = Math.sin(elapsed * 1.5) * 0.12;

      // Slowly rotate particle field
      particleSystem.rotation.y = elapsed * 0.04;
      particleSystem.rotation.x = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={mountRef}
      className="vite-3d-canvas"
      style={{ width: '100%', height: '100%', minHeight: '440px' }}
    />
  );
}
