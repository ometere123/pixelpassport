"use client";

/**
 * Rotating 3D "hologram" passport card. Drop-in decorative element above
 * the standard PassportCard. Auto-rotates and reacts to mouse.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import type { Passport } from "@/types";

function PassportMesh({ level }: { level: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });

  return (
    <group ref={ref}>
      {/* Main card body */}
      <mesh>
        <boxGeometry args={[2.4, 1.6, 0.08]} />
        <meshStandardMaterial
          color="#F6C85F"
          metalness={0.7}
          roughness={0.25}
          emissive="#F6C85F"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Inner glow plate */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[2.2, 1.4, 0.02]} />
        <meshStandardMaterial color="#1B1E35" emissive="#38D9F8" emissiveIntensity={0.2} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.65, 0.06]}>
        <boxGeometry args={[2.0, 0.06, 0.02]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, -0.65, 0.06]}>
        <boxGeometry args={[2.0, 0.06, 0.02]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={0.6} />
      </mesh>
      {/* Avatar circle */}
      <mesh position={[-0.75, 0.05, 0.06]}>
        <cylinderGeometry args={[0.32, 0.32, 0.02, 32]} />
        <meshStandardMaterial color="#0c0d18" />
      </mesh>
      <mesh position={[-0.75, 0.05, 0.075]}>
        <cylinderGeometry args={[0.3, 0.3, 0.01, 32]} />
        <meshStandardMaterial color="#38D9F8" emissive="#38D9F8" emissiveIntensity={1.0} />
      </mesh>
      {/* Level pip — one cube per level (cap at 10 for visual) */}
      {Array.from({ length: Math.min(10, Math.max(1, level)) }).map((_, i) => (
        <mesh key={i} position={[0.3 + (i % 5) * 0.18, -0.15 + Math.floor(i / 5) * -0.2, 0.07]}>
          <boxGeometry args={[0.12, 0.12, 0.03]} />
          <meshStandardMaterial
            color="#38D9F8"
            emissive="#38D9F8"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* Back face */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2.2, 1.4, 0.02]} />
        <meshStandardMaterial color="#0c0d18" />
      </mesh>
    </group>
  );
}

export function PassportHologram({ passport, height = 240 }: { passport: Passport; height?: number }) {
  return (
    <div style={{ height, borderRadius: 16, overflow: "hidden", background: "rgba(9,10,18,0.6)" }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 35 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[3, 3, 5]} intensity={1.2} color="#F6C85F" />
          <pointLight position={[-3, -2, -3]} intensity={0.8} color="#38D9F8" />
          <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.3}>
            <PassportMesh level={passport.level} />
          </Float>
          <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
