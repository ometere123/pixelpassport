"use client";

/**
 * Rotating 3D "hologram" passport card. Drop-in decorative element above
 * the standard PassportCard. Auto-rotates gently; drag to spin manually.
 */

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { OrbitControls, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import type { Passport } from "@/types";

/** Loads the passport avatar URL as a Three.js texture (suspends until ready). */
function AvatarDisc({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url, (loader) => {
    (loader as THREE.TextureLoader).crossOrigin = "anonymous";
  });
  return (
    <mesh position={[-0.85, 0.35, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.32, 0.32, 0.01, 32]} />
      <meshStandardMaterial map={texture} emissive="#ffffff" emissiveIntensity={0.15} />
    </mesh>
  );
}

/** Cyan fallback when there's no avatar URL. */
function FallbackAvatarDisc() {
  return (
    <mesh position={[-0.85, 0.35, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.32, 0.32, 0.01, 32]} />
      <meshStandardMaterial color="#38D9F8" emissive="#38D9F8" emissiveIntensity={1.5} />
    </mesh>
  );
}

function PassportMesh({ passport }: { passport: Passport }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });

  const levelPips = Math.min(10, Math.max(1, passport.level));

  return (
    <group ref={ref}>
      {/* Card body — slim slab */}
      <mesh>
        <boxGeometry args={[2.6, 1.7, 0.1]} />
        <meshStandardMaterial
          color="#1B1E35"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Front face — bright inner panel */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[2.4, 1.5]} />
        <meshStandardMaterial
          color="#0E1130"
          emissive="#38D9F8"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Gold border frame */}
      <mesh position={[0, 0.8, 0.06]}>
        <boxGeometry args={[2.45, 0.04, 0.01]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, -0.8, 0.06]}>
        <boxGeometry args={[2.45, 0.04, 0.01]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[-1.21, 0, 0.06]}>
        <boxGeometry args={[0.04, 1.64, 0.01]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[1.21, 0, 0.06]}>
        <boxGeometry args={[0.04, 1.64, 0.01]} />
        <meshStandardMaterial color="#F6C85F" emissive="#F6C85F" emissiveIntensity={1.4} />
      </mesh>

      {/* Avatar ring (dark backing) */}
      <mesh position={[-0.85, 0.35, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.01, 32]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* Avatar disc — texture if available, else cyan fallback */}
      <Suspense fallback={<FallbackAvatarDisc />}>
        {passport.avatar_url ? (
          <AvatarDisc url={passport.avatar_url} />
        ) : (
          <FallbackAvatarDisc />
        )}
      </Suspense>

      {/* Username text */}
      <Text
        position={[0.15, 0.45, 0.07]}
        fontSize={0.22}
        color="#F6C85F"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#000"
      >
        {(passport.username ?? "PASSPORT").slice(0, 12).toUpperCase()}
      </Text>

      {/* "PASSPORT" tag */}
      <Text
        position={[0.15, 0.18, 0.07]}
        fontSize={0.08}
        color="#38D9F8"
        anchorX="left"
        anchorY="middle"
      >
        PIXELPASSPORT · GENLAYER
      </Text>

      {/* Stats row */}
      <Text
        position={[-0.85, -0.18, 0.07]}
        fontSize={0.09}
        color="#94a3b8"
        anchorX="center"
      >
        LEVEL
      </Text>
      <Text
        position={[-0.85, -0.4, 0.07]}
        fontSize={0.22}
        color="#F6C85F"
        anchorX="center"
        outlineWidth={0.006}
        outlineColor="#000"
      >
        {String(passport.level ?? 1)}
      </Text>

      <Text position={[0, -0.18, 0.07]} fontSize={0.09} color="#94a3b8" anchorX="center">
        XP
      </Text>
      <Text
        position={[0, -0.4, 0.07]}
        fontSize={0.2}
        color="#60A5FA"
        anchorX="center"
        outlineWidth={0.006}
        outlineColor="#000"
      >
        {Number(passport.ecosystem_xp ?? 0).toLocaleString()}
      </Text>

      <Text position={[0.85, -0.18, 0.07]} fontSize={0.09} color="#94a3b8" anchorX="center">
        REP
      </Text>
      <Text
        position={[0.85, -0.4, 0.07]}
        fontSize={0.22}
        color="#65D46E"
        anchorX="center"
        outlineWidth={0.006}
        outlineColor="#000"
      >
        {String(passport.reputation ?? 100)}
      </Text>

      {/* Level pips on the right column above stats */}
      {Array.from({ length: levelPips }).map((_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        return (
          <mesh
            key={i}
            position={[0.45 + col * 0.13, 0.55 - row * 0.18, 0.07]}
          >
            <boxGeometry args={[0.09, 0.09, 0.02]} />
            <meshStandardMaterial
              color="#38D9F8"
              emissive="#38D9F8"
              emissiveIntensity={1.4}
            />
          </mesh>
        );
      })}

      {/* Back face — dark with a soft hint */}
      <mesh position={[0, 0, -0.051]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.4, 1.5]} />
        <meshStandardMaterial color="#0E1130" />
      </mesh>
    </group>
  );
}

export function PassportHologram({
  passport,
  height = 260,
}: {
  passport: Passport;
  height?: number;
}) {
  return (
    <div
      style={{
        height,
        borderRadius: 16,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(56,217,248,0.08) 0%, rgba(9,10,18,0.85) 70%)",
        border: "1px solid rgba(246,200,95,0.2)",
      }}
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 35 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[3, 4, 5]} intensity={1.4} color="#ffffff" />
          <pointLight position={[-3, -2, 3]} intensity={1.0} color="#38D9F8" />
          <pointLight position={[0, 0, 3]} intensity={0.8} color="#F6C85F" />
          <Float speed={1.2} floatIntensity={0.35} rotationIntensity={0.25}>
            <PassportMesh passport={passport} />
          </Float>
          <OrbitControls enablePan={false} enableZoom={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
