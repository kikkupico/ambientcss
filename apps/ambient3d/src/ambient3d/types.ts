export type AmbientSurface = "flat" | "concave" | "convex";
export type AmbientEdge =
  | "square"
  | "chamfer"
  | "chamfer-2"
  | "fillet"
  | "fillet-2";
export type AmbientMaterial = "matte" | "shiny" | "glass";
export type AmbientElevation = 0 | 1 | 2 | 3;

/**
 * The 3D theme mirrors the CSS Ambient theme so the same inputs drive both
 * worlds. lightX / lightY live in [-1, 1] with (-1, -1) being top-left —
 * identical to the CSS semantics used by AmbientProvider.
 */
export type Ambient3DTheme = {
  lightX: number;
  lightY: number;
  keyLight: number;
  fillLight: number;
  lightHue: number;
  lightSaturation: number;
};

export const DEFAULT_THEME: Ambient3DTheme = {
  lightX: -0.7,
  lightY: -0.7,
  keyLight: 0.9,
  fillLight: 0.65,
  lightHue: 234,
  lightSaturation: 6,
};
