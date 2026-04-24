import { useMemo, useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";
import { createAmbientMaterial } from "./materials";
import type { AmbientMaterial } from "./types";

export type AmbientKnob3DProps = {
  position?: [number, number, number];
  value?: number; // 0..100
  onChange?: (value: number) => void;
  material?: AmbientMaterial;
  radius?: number;
  tint?: string;
};

const MIN_ANGLE = -Math.PI * 0.75;
const MAX_ANGLE = Math.PI * 0.75;

/**
 * Cylindrical knob with a pointer marker. Rotates based on drag or an
 * externally-controlled `value` prop (0..100 like AmbientKnob).
 */
export function AmbientKnob3D({
  position = [0, 0, 0],
  value: controlled,
  onChange,
  material = "matte",
  radius = 0.35,
  tint,
}: AmbientKnob3DProps) {
  const theme = useAmbient3DTheme();
  const [internal, setInternal] = useState(50);
  const value = controlled ?? internal;
  const capGroupRef = useRef<Group>(null);

  const capMaterial = useMemo(
    () =>
      createAmbientMaterial(material, {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        ...(tint !== undefined ? { tint } : {}),
      }),
    [material, theme.lightHue, theme.lightSaturation, tint]
  );

  const bodyMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const markerMaterial = useMemo(
    () =>
      createAmbientMaterial("shiny", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        tint: "#ffffff",
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const angle = MIN_ANGLE + (value / 100) * (MAX_ANGLE - MIN_ANGLE);

  useFrame((_, delta) => {
    if (!capGroupRef.current) return;
    const current = capGroupRef.current.rotation.z;
    capGroupRef.current.rotation.z = current + (-angle - current) * Math.min(delta * 10, 1);
  });

  const dragState = useRef<{ startY: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      e.target?.setPointerCapture?.(e.pointerId);
      dragState.current = { startY: e.clientY, startValue: value };
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!dragState.current) return;
      const dy = dragState.current.startY - e.clientY;
      const next = Math.max(0, Math.min(100, dragState.current.startValue + dy * 0.6));
      if (onChange) onChange(next);
      else setInternal(next);
    },
    [onChange]
  );

  const handlePointerUp = useCallback((e: any) => {
    e.target?.releasePointerCapture?.(e.pointerId);
    dragState.current = null;
  }, []);

  return (
    <group position={position}>
      {/* Base plate — cylinder rotated so its axis points along world Z */}
      <mesh position={[0, 0, 0.00]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={bodyMaterial}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.08, 48]} />
      </mesh>
      {/* Rotating cap group — rotations.z drives the knob angle */}
      <group
        ref={capGroupRef}
        position={[0, 0, 0.08]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={capMaterial}>
          <cylinderGeometry args={[radius, radius, 0.10, 48]} />
        </mesh>
        <mesh position={[0, radius * 0.55, 0.06]} castShadow material={markerMaterial}>
          <boxGeometry args={[0.06, 0.12, 0.04]} />
        </mesh>
      </group>
    </group>
  );
}
