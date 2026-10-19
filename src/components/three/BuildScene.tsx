"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D backdrop for the journey-build sequence: three tilted orbit rings with
 * task-node spheres that pop in as the build stages progress.
 * Transparent canvas — floats behind the builder card content.
 */

const SAFFRON = "#ff7a1a";
const GOLD = "#c9a227";
const INDIGO = "#6d5ae6";

function Ring({ radius, color, speed, tilt }: { radius: number; color: string; speed: number; tilt: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.02, 12, 120]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={0.35} transparent opacity={0.85} />
    </mesh>
  );
}

/** one task node on the outer ring — scales in when its turn comes */
function Node({ angle, radius, visible }: { angle: number; radius: number; visible: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = visible ? 1 : 0.001;
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, target, 6, delta));
  });
  const pos = useMemo<[number, number, number]>(() => {
    const a = (angle * Math.PI) / 180;
    return [Math.cos(a) * radius, Math.sin(a) * radius * 0.55, 0];
  }, [angle, radius]);
  return (
    <mesh ref={ref} position={pos} scale={0.001}>
      <sphereGeometry args={[0.09, 20, 20]} />
      <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={0.7} roughness={0.3} />
    </mesh>
  );
}

export default function BuildScene({ stage, total }: { stage: number; total: number }) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const progress = total > 1 ? Math.min(stage / (total - 1), 1) : 1;
  const visibleNodes = Math.round(progress * 6);

  return (
    <Canvas
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 36 }}
      gl={{ alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />

      {/* shifted right so the stage list stays readable */}
      <group position={[1.7, 0.1, 0]}>
        <Ring radius={1.7} color={SAFFRON} speed={0.28} tilt={[Math.PI / 2.35, 0.25, 0]} />
        <Ring radius={1.25} color={GOLD} speed={-0.4} tilt={[Math.PI / 2.7, -0.3, 0.2]} />
        <Ring radius={0.85} color={INDIGO} speed={0.55} tilt={[Math.PI / 1.9, 0.15, -0.15]} />

        {/* central "life event" core */}
        <mesh>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color={SAFFRON} emissive={SAFFRON} emissiveIntensity={1.1} roughness={0.25} />
        </mesh>

        {Array.from({ length: 6 }, (_, i) => (
          <Node key={i} angle={i * 60 + 15} radius={1.7} visible={i < visibleNodes} />
        ))}

        <Sparkles count={18 + Math.round(progress * 36)} scale={[4.6, 3, 3]} size={2.2} speed={reduced ? 0 : 0.4} color="#ffc37a" opacity={0.5} />
      </group>
    </Canvas>
  );
}
