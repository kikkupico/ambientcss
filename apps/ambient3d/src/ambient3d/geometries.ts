import {
  BoxGeometry,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { AmbientEdge, AmbientSurface } from "./types";

const EDGE_SIZE: Record<AmbientEdge, number> = {
  square: 0,
  chamfer: 0.018,
  "chamfer-2": 0.032,
  fillet: 0.022,
  "fillet-2": 0.036,
};

/**
 * Build a rectangular "plate" geometry that reflects the CSS `edge` and
 * `surface` treatments. For rounded edges we use three's RoundedBoxGeometry,
 * for chamfered edges we extrude a rectangle with a single-segment bevel,
 * and for concave/convex surfaces we displace the front-face vertices.
 */
export function createPlateGeometry(
  width: number,
  height: number,
  depth: number,
  edge: AmbientEdge,
  surface: AmbientSurface
): BufferGeometry {
  const edgeSize = Math.min(EDGE_SIZE[edge], Math.min(width, height, depth) / 2 - 0.001);
  let geom: BufferGeometry;

  if (edge === "fillet" || edge === "fillet-2") {
    geom = new RoundedBoxGeometry(width, height, depth, 6, edgeSize);
  } else if (edge === "chamfer" || edge === "chamfer-2") {
    const w = width - edgeSize * 2;
    const h = height - edgeSize * 2;
    const shape = new Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(-w / 2, h / 2);
    shape.lineTo(-w / 2, -h / 2);
    geom = new ExtrudeGeometry(shape, {
      depth: depth - edgeSize * 2,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: edgeSize,
      bevelThickness: edgeSize,
    });
    geom.translate(0, 0, -(depth - edgeSize * 2) / 2 - edgeSize);
  } else {
    geom = new BoxGeometry(width, height, depth, 8, 8, 1);
  }

  if (surface !== "flat") {
    const sign = surface === "convex" ? 1 : -1;
    const pos = geom.attributes.position;
    if (pos) {
      const halfD = depth / 2;
      const maxR = Math.hypot(width / 2, height / 2);
      const amount = Math.min(width, height) * 0.08;
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        if (z > halfD - edgeSize - 0.001) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const r = Math.hypot(x, y);
          const falloff = 1 - Math.min(r / maxR, 1) ** 2;
          pos.setZ(i, z + sign * amount * falloff);
        }
      }
      pos.needsUpdate = true;
      geom.computeVertexNormals();
    }
  }

  return geom;
}
