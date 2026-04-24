import { Canvas } from "@react-three/fiber";
import type { CSSProperties, PropsWithChildren, ReactNode } from "react";
import { Color } from "three";
import { AmbientLights } from "./AmbientLights";
import { useAmbient3DTheme } from "./Ambient3DProvider";

export type AmbientStageProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  /** Vertical camera offset, defaults to 0 */
  cameraY?: number;
  /** Distance of the camera from origin */
  cameraDistance?: number;
  /** Optional overlay rendered on top of the canvas (HTML) */
  overlay?: ReactNode;
  /** Show a softly-lit backdrop plate behind the scene */
  backdrop?: boolean;
}>;

function Backdrop() {
  const theme = useAmbient3DTheme();
  // Match the matte surface base colour so shadows read naturally against it
  const sat = Math.min(theme.lightSaturation, 12) / 100;
  const bg = new Color().setHSL(theme.lightHue / 360, sat, 0.68);
  return (
    <mesh position={[0, 0, -0.05]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color={bg} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/**
 * The canvas wrapper for every 3D ambient scene. It wires up the lights,
 * the background, the camera, and soft shadows — so each primitive only
 * has to worry about its own geometry.
 */
export function AmbientStage({
  children,
  className,
  style,
  cameraY = 0,
  cameraDistance = 6,
  overlay,
  backdrop = true,
}: AmbientStageProps) {
  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%", ...style }}>
      <Canvas
        orthographic
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [0, cameraY, cameraDistance], zoom: 600 / cameraDistance }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <AmbientLights />
        {backdrop && <Backdrop />}
        {children}
      </Canvas>
      {overlay && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{overlay}</div>
      )}
    </div>
  );
}
