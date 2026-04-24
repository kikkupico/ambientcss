import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";
import { createAmbientMaterial } from "./materials";
import { createPlateGeometry } from "./geometries";
import type { AmbientMaterial } from "./types";

export type AmbientSlider3DProps = {
  position?: [number, number, number];
  value?: number; // 0..100
  onChange?: (value: number) => void;
  material?: AmbientMaterial;
  width?: number;
  tint?: string;
};

/**
 * Horizontal slider — a round puck that travels along a recessed track.
 */
export function AmbientSlider3D({
  position = [0, 0, 0],
  value: controlled,
  onChange,
  material = "matte",
  width = 2.4,
  tint,
}: AmbientSlider3DProps) {
  const theme = useAmbient3DTheme();
  const [internal, setInternal] = useState(50);
  const value = controlled ?? internal;
  const puckRef = useRef<Group>(null);

  const baseMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const trackMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation * 0.6,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const puckMaterial = useMemo(
    () =>
      createAmbientMaterial(material, {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        ...(tint !== undefined ? { tint } : {}),
      }),
    [material, theme.lightHue, theme.lightSaturation, tint]
  );

  const baseGeom = useMemo(
    () => createPlateGeometry(width, 0.55, 0.08, "fillet", "flat"),
    [width]
  );
  const trackGeom = useMemo(
    () => createPlateGeometry(width * 0.9, 0.12, 0.04, "fillet", "concave"),
    [width]
  );

  const travel = width * 0.9 - 0.4;
  const targetX = -travel / 2 + (value / 100) * travel;

  useFrame((_, delta) => {
    if (!puckRef.current) return;
    const current = puckRef.current.position.x;
    puckRef.current.position.x = current + (targetX - current) * Math.min(delta * 16, 1);
  });

  const dragState = useRef<{ startX: number; startValue: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      e.target?.setPointerCapture?.(e.pointerId);
      dragState.current = { startX: e.clientX, startValue: value };
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const next = Math.max(0, Math.min(100, dragState.current.startValue + dx * 0.3));
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
      <mesh geometry={baseGeom} material={baseMaterial} castShadow receiveShadow />
      <mesh geometry={trackGeom} material={trackMaterial} position={[0, 0, 0.04]} receiveShadow />
      <group
        ref={puckRef}
        position={[targetX, 0, 0.08]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={puckMaterial}>
          <cylinderGeometry args={[0.2, 0.2, 0.08, 40]} />
        </mesh>
      </group>
    </group>
  );
}
