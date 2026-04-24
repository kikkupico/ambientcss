import { forwardRef, useMemo } from "react";
import type { Mesh } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";
import { createPlateGeometry } from "./geometries";
import { createAmbientMaterial } from "./materials";
import type {
  AmbientEdge,
  AmbientElevation,
  AmbientMaterial,
  AmbientSurface,
} from "./types";

const ELEVATION_Z: Record<AmbientElevation, number> = {
  0: 0,
  1: 0.06,
  2: 0.12,
  3: 0.20,
};

export type AmbientSurface3DProps = {
  width?: number;
  height?: number;
  depth?: number;
  surface?: AmbientSurface;
  edge?: AmbientEdge;
  material?: AmbientMaterial;
  elevation?: AmbientElevation;
  tint?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onPointerDown?: (e: any) => void;
  onPointerUp?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
  onClick?: (e: any) => void;
  children?: React.ReactNode;
};

/**
 * The fundamental ambient 3D primitive — a plate with configurable surface
 * curvature, edge treatment, material finish, and elevation. Every higher
 * level component (Panel, Button, Knob, ...) is a composition of this.
 */
export const AmbientSurface3D = forwardRef<Mesh, AmbientSurface3DProps>(function AmbientSurface3D(
  {
    width = 1.6,
    height = 1.0,
    depth = 0.08,
    surface = "flat",
    edge = "fillet",
    material = "matte",
    elevation = 1,
    tint,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    children,
    ...events
  },
  ref
) {
  const theme = useAmbient3DTheme();

  const geometry = useMemo(
    () => createPlateGeometry(width, height, depth, edge, surface),
    [width, height, depth, edge, surface]
  );

  const mat = useMemo(
    () =>
      createAmbientMaterial(material, {
        baseHue: theme.lightHue,
        baseSaturation: theme.lightSaturation,
        ...(tint !== undefined ? { tint } : {}),
      }),
    [material, theme.lightHue, theme.lightSaturation, tint]
  );

  const z = position[2] + ELEVATION_Z[elevation];

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      material={mat}
      position={[position[0], position[1], z]}
      rotation={rotation}
      castShadow
      receiveShadow
      {...events}
    >
      {children}
    </mesh>
  );
});
