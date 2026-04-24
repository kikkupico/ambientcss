import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";
import { createAmbientMaterial } from "./materials";
import { createPlateGeometry } from "./geometries";
import type { AmbientMaterial } from "./types";

export type AmbientFader3DProps = {
  position?: [number, number, number];
  value?: number; // 0..100
  onChange?: (value: number) => void;
  material?: AmbientMaterial;
  height?: number;
  tint?: string;
};

/**
 * Vertical fader with a sliding cap travelling in a recessed slot.
 */
export function AmbientFader3D({
  position = [0, 0, 0],
  value: controlled,
  onChange,
  material = "matte",
  height = 1.8,
  tint,
}: AmbientFader3DProps) {
  const theme = useAmbient3DTheme();
  const [internal, setInternal] = useState(70);
  const value = controlled ?? internal;
  const capRef = useRef<Group>(null);

  const baseMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const slotMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation * 0.6,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const capMaterial = useMemo(
    () =>
      createAmbientMaterial(material, {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        ...(tint !== undefined ? { tint } : {}),
      }),
    [material, theme.lightHue, theme.lightSaturation, tint]
  );

  const baseGeom = useMemo(
    () => createPlateGeometry(0.55, height, 0.08, "fillet", "flat"),
    [height]
  );
  const slotGeom = useMemo(
    () => createPlateGeometry(0.12, height * 0.88, 0.04, "fillet", "concave"),
    [height]
  );
  const capGeom = useMemo(
    () => createPlateGeometry(0.42, 0.28, 0.08, "fillet", "convex"),
    []
  );

  const travel = height * 0.88 - 0.28;
  const targetY = -travel / 2 + (value / 100) * travel;

  useFrame((_, delta) => {
    if (!capRef.current) return;
    const current = capRef.current.position.y;
    capRef.current.position.y = current + (targetY - current) * Math.min(delta * 16, 1);
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
      const next = Math.max(0, Math.min(100, dragState.current.startValue + dy * 0.3));
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
      <mesh geometry={slotGeom} material={slotMaterial} position={[0, 0, 0.04]} receiveShadow />
      <group
        ref={capRef}
        position={[0, targetY, 0.08]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <mesh geometry={capGeom} material={capMaterial} castShadow receiveShadow />
      </group>
    </group>
  );
}
