"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D hero scene — an abstract gateway arch (India-Gate motif) in the brand
 * palette, with an orbiting gold ring, sparkles and pointer parallax.
 * Pure primitives, no external assets; lazy-loaded by the consumer.
 */

const SAND = "#eed9b4";
const SAFFRON = "#ff7a1a";
const GOLD = "#c9a227";

function Arch() {
  return (
    <group position={[0, -0.55, 0]}>
      {/* stepped base */}
      <mesh position={[0, -1.42, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.22, 1.5]} />
        <meshStandardMaterial color="#dcc9a6" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[2.9, 0.2, 1.3]} />
        <meshStandardMaterial color="#e5d2b0" roughness={0.8} />
      </mesh>

      {/* pillars */}
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 0.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.62, 2.2, 0.62]} />
            <meshStandardMaterial color={SAND} roughness={0.5} metalness={0.05} />
          </mesh>
          <mesh position={[0, 1.22, 0]}>
            <boxGeometry args={[0.78, 0.24, 0.78]} />
            <meshStandardMaterial color={SAND} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* crown beam */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <boxGeometry args={[3.2, 0.5, 0.78]} />
        <meshStandardMaterial color={SAFFRON} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[2.5, 0.16, 0.66]} />
        <meshStandardMaterial color={GOLD} roughness={0.3} metalness={0.55} />
      </mesh>

      {/* dome */}
      <mesh position={[0, 2.18, 0]}>
        <sphereGeometry args={[0.4, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.22} emissive="#5c420c" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function OrbitRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.25;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.25, 0.35, 0]}>
      <torusGeometry args={[2.35, 0.028, 16, 140]} />
      <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} emissive="#8a6414" emissiveIntensity={0.5} />
    </mesh>
  );
}

/** pointer parallax + slow idle sway */
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetY = state.pointer.x * 0.45;
    const targetX = -state.pointer.y * 0.2;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, targetY, 2.4, delta);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, targetX, 2.4, delta);
  });
  return <group ref={ref}>{children}</group>;
}

export default function GatewayScene() {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <Canvas
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 2]}
      camera={{ position: [0, 1.1, 6.4], fov: 38 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 3]} intensity={2.4} castShadow />
      <pointLight position={[-3.5, 2.5, -2]} intensity={14} distance={14} color={SAFFRON} />
      <pointLight position={[3, -1, 3]} intensity={7} distance={10} color="#3b2fa8" />

      <Rig>
        <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.55} floatingRange={[-0.06, 0.06]}>
          <Arch />
        </Float>
        <Float speed={1.1} rotationIntensity={0} floatIntensity={0.3}>
          <OrbitRing />
        </Float>
        <Sparkles count={42} scale={[7, 4.5, 4]} size={2.6} speed={reduced ? 0 : 0.35} color="#ffc37a" opacity={0.55} />
      </Rig>

      <ContactShadows position={[0, -2.05, 0]} opacity={0.32} scale={9} blur={2.6} far={3.2} color="#1a1440" />
    </Canvas>
  );
}
