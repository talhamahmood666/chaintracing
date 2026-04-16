'use client';

import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[-2, 0, 0]}>
          <torusKnotGeometry args={[1, 0.3, 100, 16]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      </Float>
      <Float speed={4} rotationIntensity={0.5} floatIntensity={2}>
        <mesh position={[2.5, -1, -1]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>
    </>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Scene />
      </Canvas>
    </div>
  );
}