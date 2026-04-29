'use client';

import { useRef, useMemo, Suspense, lazy, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 120;
const CONNECTION_DIST = 2.2;

function initParticles(): { positions: Float32Array; velocities: Float32Array } {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const vel = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    vel[i * 3]     = (Math.random() - 0.5) * 0.004;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }
  return { positions: pos, velocities: vel };
}

function Particles() {
  const meshRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const { positions, velocities } = useMemo(() => initParticles(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = (meshRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     += velocities[i * 3]     + mouse.x * 0.0008;
      pos[i * 3 + 1] += velocities[i * 3 + 1] + mouse.y * 0.0008;
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      // eslint-disable-next-line react-hooks/immutability -- velocities mutated in animation loop by design
      if (Math.abs(pos[i * 3])     > 7)  velocities[i * 3]     *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 5)  velocities[i * 3 + 1] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 3)  velocities[i * 3 + 2] *= -1;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#00D9FF" size={0.06} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Lines() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const { scene } = useThree();

  useFrame(() => {
    // Rebuild line geometry each frame from parent particle positions
    const points = scene.getObjectByName('particles') as THREE.Points;
    if (!points || !linesRef.current) return;
    if (!points.geometry?.attributes?.position) return;
    const pos = (points.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const linePositions: number[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = pos[i*3] - pos[j*3];
        const dy = pos[i*3+1] - pos[j*3+1];
        const dz = pos[i*3+2] - pos[j*3+2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < CONNECTION_DIST) {
          linePositions.push(
            pos[i*3], pos[i*3+1], pos[i*3+2],
            pos[j*3], pos[j*3+1], pos[j*3+2]
          );
        }
      }
    }

    const arr = new Float32Array(linePositions);
    linesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#00D9FF" transparent opacity={0.12} />
    </lineSegments>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <group name="particles">
        <Particles />
      </group>
      <Lines />
    </>
  );
}

export default function ThreeBackground() {
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia must be read on client mount
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMobile(window.matchMedia('(max-width: 768px)').matches);
  }, []);

  if (reduced || mobile) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true, antialias: false }}>
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
