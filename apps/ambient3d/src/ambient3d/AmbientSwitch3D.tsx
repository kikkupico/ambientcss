import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";
import { createAmbientMaterial } from "./materials";
import { createPlateGeometry } from "./geometries";

export type AmbientSwitch3DProps = {
  position?: [number, number, number];
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  tint?: string;
};

/**
 * Toggle switch — a plate that rocks between two tilted positions. The
 * tilt reveals light and shadow flipping across the switch face.
 */
export function AmbientSwitch3D({
  position = [0, 0, 0],
  checked = false,
  onCheckedChange,
  tint,
}: AmbientSwitch3DProps) {
  const theme = useAmbient3DTheme();
  const tiltRef = useRef<Group>(null);

  const baseMaterial = useMemo(
    () =>
      createAmbientMaterial("matte", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
      }),
    [theme.lightHue, theme.lightSaturation]
  );

  const rockerMaterial = useMemo(
    () =>
      createAmbientMaterial("shiny", {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        ...(tint !== undefined ? { tint } : {}),
      }),
    [theme.lightHue, theme.lightSaturation, tint]
  );

  const baseGeom = useMemo(() => createPlateGeometry(0.9, 0.55, 0.08, "fillet", "concave"), []);
  const rockerGeom = useMemo(() => createPlateGeometry(0.78, 0.44, 0.06, "fillet", "convex"), []);

  const targetAngle = checked ? -0.45 : 0.45;

  useFrame((_, delta) => {
    if (!tiltRef.current) return;
    const cur = tiltRef.current.rotation.x;
    tiltRef.current.rotation.x = cur + (targetAngle - cur) * Math.min(delta * 14, 1);
  });

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      onCheckedChange?.(!checked);
    },
    [checked, onCheckedChange]
  );

  return (
    <group position={position} onClick={handleClick}>
      <mesh geometry={baseGeom} material={baseMaterial} castShadow receiveShadow />
      <group ref={tiltRef} position={[0, 0, 0.06]}>
        <mesh geometry={rockerGeom} material={rockerMaterial} castShadow receiveShadow />
      </group>
    </group>
  );
}
