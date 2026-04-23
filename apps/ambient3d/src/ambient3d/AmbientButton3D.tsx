import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { AmbientSurface3D } from "./AmbientSurface3D";
import type { AmbientMaterial } from "./types";

export type AmbientButton3DProps = {
  position?: [number, number, number];
  width?: number;
  height?: number;
  material?: AmbientMaterial;
  tint?: string;
  onClick?: () => void;
};

/**
 * A button that physically presses down on hover/click — the 3D analogue of
 * the CSS `.amb-button` press animation.
 */
export function AmbientButton3D({
  position = [0, 0, 0],
  width = 1.4,
  height = 0.6,
  material = "matte",
  tint,
  onClick,
}: AmbientButton3DProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = pressed ? -0.08 : hovered ? 0.04 : 0;
    const current = groupRef.current.position.z;
    groupRef.current.position.z = current + (target - current) * Math.min(delta * 16, 1);
  });

  return (
    <group ref={groupRef} position={position}>
      <AmbientSurface3D
        width={width}
        height={height}
        depth={0.28}
        edge="chamfer"
        surface="flat"
        material={material}
        elevation={1}
        {...(tint !== undefined ? { tint } : {})}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false);
          setPressed(false);
        }}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => {
          setPressed(false);
          onClick?.();
        }}
      />
    </group>
  );
}
