import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type Material } from "three";
import type { AmbientMaterial } from "./types";

export type MaterialOptions = {
  baseHue: number;
  baseSaturation: number;
  tint?: string;
};

/**
 * Build a three.js material that approximates the @ambientcss/components
 * `material` prop: matte plastic, glossy clearcoat, or transmissive glass.
 * The base surface tint follows the ambient light hue so the 3D scene
 * visually reads as the same environment as the CSS version.
 */
export function createAmbientMaterial(
  kind: AmbientMaterial,
  opts: MaterialOptions
): Material {
  const { baseHue, baseSaturation, tint } = opts;
  const color = tint
    ? new Color(tint)
    : new Color().setHSL(baseHue / 360, Math.min(baseSaturation, 12) / 100, 0.68);

  if (kind === "glass") {
    return new MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.08,
      transmission: 0.9,
      thickness: 0.08,
      ior: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationDistance: 1.2,
      reflectivity: 0.4,
    });
  }

  if (kind === "shiny") {
    return new MeshPhysicalMaterial({
      color,
      metalness: 0.25,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      reflectivity: 0.6,
    });
  }

  return new MeshStandardMaterial({
    color,
    metalness: 0.02,
    roughness: 0.72,
  });
}
