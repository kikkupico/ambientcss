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


def _surface_dz(surface, sagitta, x, y, hw, hd):
    """Top-face displacement for the curved surface variants. The CSS
    gradients run along one axis, so the physical shapes are cylinders:
    concave dips along y (screen-vertical), concave-h along x, convex
    bulges along y."""
    if surface == "concave":
        return -sagitta * (1.0 - (y / hd) ** 2)
    if surface == "concave-h":
        return -sagitta * (1.0 - (x / hw) ** 2)
    if surface == "convex":
        return sagitta * (1.0 - (y / hd) ** 2)
    return 0.0


def _curved_plate(name, width, depth, thickness, surface, sagitta,
                  location, material, segs=48):
    """Slab whose top face is a displaced grid (curved surface variants)."""
    hw, hd = width / 2, depth / 2
    bm = bmesh.new()
    grid = []
    for j in range(segs + 1):
        row = []
        for i in range(segs + 1):
            x = -hw + width * i / segs
            y = -hd + depth * j / segs
            z = thickness + _surface_dz(surface, sagitta, x, y, hw, hd)
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(segs):
        for i in range(segs):
            bm.faces.new((grid[j][i], grid[j][i + 1],
                          grid[j + 1][i + 1], grid[j + 1][i]))
    # boundary ring, CCW seen from above, dropped to the base
    ring = (grid[0][:-1] + [row[-1] for row in grid[:-1]] +
            grid[-1][:0:-1] + [row[0] for row in grid[:0:-1]])
    base = [bm.verts.new((v.co.x, v.co.y, 0.0)) for v in ring]
    n = len(ring)
    for i in range(n):
        bm.faces.new((ring[i], base[i], base[(i + 1) % n],
                      ring[(i + 1) % n]))
    bm.faces.new(list(reversed(base)))
    obj = _finish(bm, name, location, material, smooth=True)
    for poly in obj.data.polygons:   # flat-shade the walls and bottom
        if abs(poly.normal.z) < 0.99 or poly.center.z < 0.01:
            poly.use_smooth = False
    return obj


def build_dome(name="Dome", radius=20.0, location=(0, 0, 0), material=None,
               segs=96, rings=48):
    """Hemisphere on the ground. The calibration referent for
    .amb-mat-shiny: its normals span every direction, so the flat-on
    camera sees the key light's real mirror band for ANY light azimuth —
    a cylinder only redirects one axis, and a flat plate none."""
    import math

    bm = bmesh.new()
    apex = bm.verts.new((0.0, 0.0, radius))
    ringverts = []
    for j in range(1, rings + 1):
        phi = (j / rings) * (math.pi / 2)   # 0 = apex, pi/2 = ground
        r, z = radius * math.sin(phi), radius * math.cos(phi)
        ringverts.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs),
                                        r * math.sin(2 * math.pi * i / segs),
                                        z))
                          for i in range(segs)])
    for i in range(segs):
        bm.faces.new((apex, ringverts[0][i], ringverts[0][(i + 1) % segs]))
    for a, b in zip(ringverts, ringverts[1:]):
        for i in range(segs):
            bm.faces.new((a[i], b[i], b[(i + 1) % segs], a[(i + 1) % segs]))
    bm.faces.new(list(reversed(ringverts[-1])))
    return _finish(bm, name, location, material, smooth=True)


def build_groove(ground, width=60.0, depth=12.0, recess=4.5):
    """Rectangular recess cut into the ground plane: the calibration
    referent for .amb-groove. The CSS element is the groove *opening*
    (width x depth in plan), recessed `recess` mm; walls and floor keep
    the ground material, so at recess 0 nothing would render — the whole
    effect is occlusion and the walls' cast shadow, the inverse of a
    plate's drop shadow."""
    from ._common import boolean_cut, prism_object

    cutter = prism_object("GrooveCut", _rect(width, depth), -recess, 1.0)
    boolean_cut(ground, cutter)
    return ground


def build_plate(name="Plate", width=80.0, depth=80.0, thickness=6.0,
                chamfer=0.0, fillet=0.0, surface="flat", sagitta=0.0,
                location=(0, 0, 0), material=None):
    """Slab with an optional top-edge chamfer (45 deg, `chamfer` mm) or
    fillet (radius `fillet` mm), or a curved top surface. Only one
    treatment at a time."""
    if chamfer and fillet:
        raise ValueError("plate takes a chamfer or a fillet, not both")
    if surface != "flat" and sagitta > 0:
        if chamfer or fillet:
            raise ValueError("curved surfaces take no edge treatment")
        return _curved_plate(name, width, depth, thickness, surface,
                             sagitta, location, material)
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
