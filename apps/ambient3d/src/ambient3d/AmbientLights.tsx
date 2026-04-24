import { useMemo } from "react";
import { Color } from "three";
import { useAmbient3DTheme } from "./Ambient3DProvider";

export type AmbientLightsProps = {
  /** Distance of key/fill lights from scene origin */
  distance?: number;
  /** Enable shadow casting on the key light */
  shadows?: boolean;
};

/**
 * Two-light rig (key + fill) driven by the ambient theme. The key light
 * position is derived from (lightX, lightY) exactly as in the CSS model:
 * negative x is left, negative y is up (screen coords), positive z pulls
 * the light forward toward the viewer.
 */
export function AmbientLights({ distance = 8, shadows = true }: AmbientLightsProps) {
  const theme = useAmbient3DTheme();

  const { keyPos, fillPos, keyColor, fillColor, ambientColor } = useMemo(() => {
    // Screen y-down → three y-up, so flip lightY sign.
    const kp: [number, number, number] = [
      theme.lightX * distance,
      -theme.lightY * distance,
      distance * 1.8,
    ];
    const fp: [number, number, number] = [
      -theme.lightX * distance * 0.6,
      -theme.lightY * distance * 0.4,
      distance * 0.5,
    ];
    const sat = Math.min(theme.lightSaturation, 100) / 100;
    const key = new Color().setHSL(theme.lightHue / 360, sat * 0.6, 0.85);
    const fill = new Color().setHSL(theme.lightHue / 360, sat * 0.4, 0.7);
    const amb = new Color().setHSL(theme.lightHue / 360, sat * 0.25, 0.45);
    return { keyPos: kp, fillPos: fp, keyColor: key, fillColor: fill, ambientColor: amb };
  }, [theme, distance]);

  return (
    <>
      <ambientLight color={ambientColor} intensity={0.35 + theme.fillLight * 0.3} />
      <directionalLight
        position={keyPos}
        color={keyColor}
        intensity={theme.keyLight * 2.4}
        castShadow={shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
      />
      <directionalLight
        position={fillPos}
        color={fillColor}
        intensity={theme.fillLight * 1.2}
      />
    </>
  );
}
