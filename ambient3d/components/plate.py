"""Calibration/effect plate: the physical stand-in for a CSS box.

A flat rectangular slab whose top edge carries the amb edge treatment —
a 45-degree chamfer or a quarter-round fillet — and which floats at the
amb elevation height. Sharp square corners (rect rings inset analytically,
mitred at corners) so edge bands are axis-aligned and trivially profiled
by the measurement pipeline.
"""

import math

import bmesh

from ._common import _finish


def _rect(w, d):
    return [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]


def build_plate(name="Plate", width=80.0, depth=80.0, thickness=6.0,
                chamfer=0.0, fillet=0.0, location=(0, 0, 0), material=None):
    """Slab with an optional top-edge chamfer (45 deg, `chamfer` mm) or
    fillet (radius `fillet` mm). Only one of the two may be nonzero."""
    if chamfer and fillet:
        raise ValueError("plate takes a chamfer or a fillet, not both")
    inset_max = max(chamfer, fillet)
    if inset_max * 2 >= min(width, depth) or inset_max >= thickness:
        raise ValueError("edge treatment larger than the plate")

    # (z, inset) rings from bottom to top
    levels = [(0.0, 0.0)]
    if chamfer > 0:
        levels += [(thickness - chamfer, 0.0), (thickness, chamfer)]
    elif fillet > 0:
        levels.append((thickness - fillet, 0.0))
        steps = 16
        for i in range(1, steps + 1):
            t = (i / steps) * (math.pi / 2)
            levels.append((thickness - fillet + fillet * math.sin(t),
                           fillet * (1.0 - math.cos(t))))
    else:
        levels.append((thickness, 0.0))

    bm = bmesh.new()
    rings = []
    for z, inset in levels:
        pts = _rect(width - 2 * inset, depth - 2 * inset)
        rings.append([bm.verts.new((x, y, z)) for x, y in pts])

    for a, b in zip(rings, rings[1:]):
        for j in range(4):
            bm.faces.new((a[j], a[(j + 1) % 4], b[(j + 1) % 4], b[j]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])

    # flat shading throughout: smoothing would bleed the fillet's curved
    # normals across the flat top; 16 fillet steps keep faceting sub-pixel
    return _finish(bm, name, location, material, smooth=False)
