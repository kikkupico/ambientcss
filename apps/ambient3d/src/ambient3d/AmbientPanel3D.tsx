import { AmbientSurface3D, type AmbientSurface3DProps } from "./AmbientSurface3D";

export type AmbientPanel3DProps = AmbientSurface3DProps;

/** Large rectangular container plate — the 3D equivalent of AmbientPanel. */
export function AmbientPanel3D({
  width = 2.4,
  height = 1.6,
  depth = 0.08,
  edge = "fillet",
  surface = "flat",
  material = "matte",
  elevation = 2,
  ...rest
}: AmbientPanel3DProps) {
  return (
    <AmbientSurface3D
      width={width}
      height={height}
      depth={depth}
      edge={edge}
      surface={surface}
      material={material}
      elevation={elevation}
      {...rest}
    />
  );
}
