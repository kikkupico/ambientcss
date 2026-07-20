import * as THREE from "three";

/**
 * Traces a rounded-rect outline into a THREE.Path/Shape, centered at
 * (cx, cz). `cz` becomes the shape's local-Y coordinate — buildPlateGeometry
 * rotates the finished extrusion -90deg about X so shape-Y becomes world -Z,
 * which is why hole offsets get negated there rather than here.
 */
function traceRoundedRect(
  path: THREE.Path,
  width: number,
  depth: number,
  radius: number,
  cx = 0,
  cz = 0
): void {
  const w = width / 2;
  const d = depth / 2;
  const r = Math.min(radius, w, d);
  path.moveTo(cx - w + r, cz - d);
  path.lineTo(cx + w - r, cz - d);
  path.quadraticCurveTo(cx + w, cz - d, cx + w, cz - d + r);
  path.lineTo(cx + w, cz + d - r);
  path.quadraticCurveTo(cx + w, cz + d, cx + w - r, cz + d);
  path.lineTo(cx - w + r, cz + d);
  path.quadraticCurveTo(cx - w, cz + d, cx - w, cz + d - r);
  path.lineTo(cx - w, cz - d + r);
  path.quadraticCurveTo(cx - w, cz - d, cx - w + r, cz - d);
}

export interface PlateHole {
  width: number;
  depth: number;
  cornerRadius: number;
  /** World-space offset of the hole center, relative to the plate center. */
  x: number;
  z: number;
}

export interface PlateOptions {
  width: number;
  depth: number;
  cornerRadius: number;
  /** Total height of the finished plate, top edge bevel included. */
  thickness: number;
  /** Bevel size in mm; 0 gives a sharp, unbeveled edge. */
  edgeSize: number;
  /** 1 = a flat chamfer cut, 6+ = a smooth filleted curve. */
  edgeSegments: number;
  hole?: PlateHole;
}

/**
 * An extruded rounded-rect slab, optionally with a rounded-rect hole cut
 * through it (for the recessed "meter" pocket). The top+bottom edges get a
 * matching bevel — three.js's ExtrudeGeometry bevels both extrusion caps
 * symmetrically, so thin plates read as gently bevelled on the underside
 * too; harmless here since the underside is never visible.
 *
 * Geometry is built with its base at local y=0 and its top at y=thickness.
 */
export function buildPlateGeometry(opts: PlateOptions): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  traceRoundedRect(shape, opts.width, opts.depth, opts.cornerRadius);

  if (opts.hole) {
    const holePath = new THREE.Path();
    traceRoundedRect(
      holePath,
      opts.hole.width,
      opts.hole.depth,
      opts.hole.cornerRadius,
      opts.hole.x,
      -opts.hole.z
    );
    shape.holes.push(holePath);
  }

  const bevel = opts.edgeSize > 0;
  const straightDepth = Math.max(0.05, opts.thickness - (bevel ? opts.edgeSize * 2 : 0));

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: straightDepth,
    bevelEnabled: bevel,
    bevelThickness: opts.edgeSize,
    bevelSize: opts.edgeSize,
    bevelSegments: opts.edgeSegments,
    curveSegments: 16,
    steps: 1
  });

  geometry.rotateX(-Math.PI / 2);
  if (bevel) geometry.translate(0, opts.edgeSize, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A knob: a short cylindrical body topped with a convex dome, built as one
 * revolved profile (bottom rim -> top of the wall -> dome -> apex pole).
 * Base at local y=0.
 */
export function buildKnobGeometry(
  radius: number,
  bodyHeight: number,
  domeHeight: number
): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(radius, 0),
    new THREE.Vector2(radius, bodyHeight),
    new THREE.Vector2(radius * 0.86, bodyHeight + domeHeight * 0.45),
    new THREE.Vector2(radius * 0.5, bodyHeight + domeHeight * 0.82),
    new THREE.Vector2(0, bodyHeight + domeHeight)
  ];
  const geometry = new THREE.LatheGeometry(profile, 32);
  geometry.computeVertexNormals();
  return geometry;
}
