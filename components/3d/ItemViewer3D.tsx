"use client";

/**
 * Procedural 3D item viewer.
 *
 * Renders any item as a 3D model built from primitive shapes (boxes, cylinders,
 * torus, etc.) based on its `class`. Zero asset downloads, runs entirely on
 * Three.js primitives generated at mount time.
 *
 * Drop into any page with: <ItemViewer3D item={item} height={320} />
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CanonicalItem } from "@/types";

const RARITY_COLOR: Record<string, string> = {
  common: "#9aa3b2",
  uncommon: "#65D46E",
  rare: "#38D9F8",
  epic: "#8B5CF6",
  legendary: "#F6C85F",
};

const RARITY_EMISSIVE: Record<string, number> = {
  common: 0.05,
  uncommon: 0.2,
  rare: 0.35,
  epic: 0.6,
  legendary: 0.9,
};

const CLASS_COLORS: Record<string, string> = {
  weapon: "#F97373",
  armor: "#6b7280",
  rune: "#8B5CF6",
  combat_relic: "#F97373",
  tool: "#65D46E",
  seed: "#84cc16",
  fertilizer: "#a16207",
  harvest_relic: "#65D46E",
  relic: "#8B5CF6",
  puzzle_tool: "#38D9F8",
  void_artifact: "#a855f7",
  navigator: "#3b82f6",
};

function colorForItem(item: CanonicalItem) {
  return CLASS_COLORS[item.class] ?? RARITY_COLOR[item.rarity] ?? "#38D9F8";
}

/** A swirling sword-like model for weapons. */
function WeaponModel({ color, emissive }: { color: string; emissive: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.4;
  });
  const material = (
    <meshStandardMaterial
      color={color}
      metalness={0.9}
      roughness={0.15}
      emissive={color}
      emissiveIntensity={emissive}
    />
  );
  return (
    <group ref={groupRef}>
      {/* Blade */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.18, 1.8, 0.04]} />
        {material}
      </mesh>
      {/* Tip */}
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        {material}
      </mesh>
      {/* Crossguard */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.12]} />
        <meshStandardMaterial color="#a67c2b" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Hilt */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
        <meshStandardMaterial color="#3a2516" roughness={0.8} />
      </mesh>
      {/* Pommel */}
      <mesh position={[0, -0.9, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#a67c2b" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** A floating glowing rune octahedron. */
function RuneModel({ color, emissive }: { color: string; emissive: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.5;
      ref.current.rotation.y += dt * 0.7;
    }
  });
  return (
    <group>
      <mesh ref={ref}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={Math.max(0.5, emissive)}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

/** A plough / farm tool — angled handle + blade. */
function ToolModel({ color, emissive }: { color: string; emissive: number }) {
  return (
    <group rotation={[0, 0, -0.2]}>
      {/* Handle */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 12]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>
      {/* Blade base */}
      <mesh position={[-0.5, -0.4, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3}
          emissive={color} emissiveIntensity={emissive} />
      </mesh>
      {/* Curved blade */}
      <mesh position={[-0.55, -0.55, 0]} rotation={[0, 0, -0.4]}>
        <torusGeometry args={[0.3, 0.06, 12, 16, Math.PI]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.2}
          emissive={color} emissiveIntensity={emissive} />
      </mesh>
    </group>
  );
}

/** An armored shell — chest piece. */
function ArmorModel({ color, emissive }: { color: string; emissive: number }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35}
          emissive={color} emissiveIntensity={emissive} side={THREE.DoubleSide} />
      </mesh>
      {/* Trim */}
      <mesh position={[0, -0.05, 0]}>
        <torusGeometry args={[0.92, 0.05, 8, 32]} />
        <meshStandardMaterial color="#F6C85F" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Crest gem */}
      <mesh position={[0, 0.5, 0.85]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color="#38D9F8" emissive="#38D9F8" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

/** A void relic — clustered floating crystals. */
function RelicModel({ color, emissive }: { color: string; emissive: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.3;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.5, 0]} rotation={[0.3, 0, 0.2]}>
        <coneGeometry args={[0.35, 1.2, 6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.15}
          emissive={color} emissiveIntensity={Math.max(0.4, emissive)} />
      </mesh>
      <mesh position={[0.55, -0.2, 0.2]} rotation={[-0.2, 0.5, 0.5]}>
        <coneGeometry args={[0.2, 0.7, 6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.15}
          emissive={color} emissiveIntensity={Math.max(0.4, emissive)} />
      </mesh>
      <mesh position={[-0.5, -0.3, -0.2]} rotation={[0.2, -0.5, -0.4]}>
        <coneGeometry args={[0.22, 0.8, 6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.15}
          emissive={color} emissiveIntensity={Math.max(0.4, emissive)} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

/** Seed / fertilizer / generic small item — orb with rings. */
function OrbModel({ color, emissive }: { color: string; emissive: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.6;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3}
          emissive={color} emissiveIntensity={Math.max(0.3, emissive)} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.0, 0.04, 8, 64]} />
        <meshStandardMaterial color="#F6C85F" metalness={0.8} roughness={0.2}
          emissive="#F6C85F" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function pickModel(item: CanonicalItem) {
  const color = colorForItem(item);
  const emissive = RARITY_EMISSIVE[item.rarity] ?? 0.2;
  const cls = item.class.toLowerCase();
  if (cls.includes("weapon") || cls.includes("blade") || cls.includes("sword")) {
    return <WeaponModel color={color} emissive={emissive} />;
  }
  if (cls.includes("rune")) return <RuneModel color={color} emissive={emissive} />;
  if (cls.includes("tool") || cls.includes("plough") || cls.includes("harvest")) {
    return <ToolModel color={color} emissive={emissive} />;
  }
  if (cls.includes("armor")) return <ArmorModel color={color} emissive={emissive} />;
  if (cls.includes("relic") || cls.includes("artifact") || cls.includes("void")) {
    return <RelicModel color={color} emissive={emissive} />;
  }
  return <OrbModel color={color} emissive={emissive} />;
}

interface ItemViewer3DProps {
  item: CanonicalItem;
  height?: number;
  showRaritySparkles?: boolean;
  background?: string;
}

export function ItemViewer3D({ item, height = 320, showRaritySparkles = true, background }: ItemViewer3DProps) {
  const model = useMemo(() => pickModel(item), [item.id, item.class, item.rarity]); // eslint-disable-line react-hooks/exhaustive-deps
  const tint = colorForItem(item);
  const isFancy = item.rarity === "epic" || item.rarity === "legendary";

  return (
    <div style={{ height, background: background ?? "transparent", borderRadius: 16, overflow: "hidden", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 0.4, 3.6], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 4, 3]} intensity={0.9} color="#ffffff" />
          <pointLight position={[-3, -2, -2]} intensity={0.5} color={tint} />
          <hemisphereLight args={[tint, "#1a1a2e", 0.6]} />

          <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
            {model}
          </Float>

          {showRaritySparkles && isFancy && (
            <Sparkles
              count={item.rarity === "legendary" ? 80 : 40}
              scale={2.6}
              size={3}
              speed={0.4}
              color={tint}
            />
          )}

          <Environment preset="city" />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2.2}
            maxDistance={6}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
      {/* Subtle gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(circle at 50% 100%, ${tint}15 0%, transparent 60%)`,
      }} />
    </div>
  );
}
