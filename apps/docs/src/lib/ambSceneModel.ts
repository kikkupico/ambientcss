/**
 * The --amb-* to millimetre mapping, mirrored from the Blender rig those
 * CSS coefficients were derived from (ambient3d/amb_model.py). Keep these
 * in sync if that file's constants change — this is the "grounding" the
 * 3D concept scene stands on.
 */

export const ELEVATION_MM_PER_LEVEL = 8.0;
export const THICKNESS_MM_PER_LEVEL = 4.5;
export const CHAMFER_MM_PER_WIDTH = 1.0;
export const FILLET_MM_PER_WIDTH = 2.0;

export const LIGHT_DEFAULTS = {
  x: -1,
  y: -1,
  key: 0.9,
  fill: 0.7
};

export function elevationMm(elevation: number): number {
  return elevation * ELEVATION_MM_PER_LEVEL;
}

export function thicknessMm(thickness: number): number {
  return thickness * THICKNESS_MM_PER_LEVEL;
}

/** Edge cut width in mm, capped level-for-level like ambient.css's --_amb-*-w vars. */
export function edgeMm(width: number, mmPerWidth: number, thickness: number): number {
  const t = thicknessMm(thickness);
  const cap = t - 0.5;
  return Math.max(0, Math.min(cap, width * mmPerWidth));
}
