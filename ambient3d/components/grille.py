"""Parametric speaker grille: rounded plate with a perforation pattern.

TE grilles (OP-1, EP-133) use a square grid of small holes; "hex" close
packing is also available. Units: mm.
"""

import math

import bmesh

from components._common import base_tile, boolean_cut, _finish


def build_grille(
    name="Grille",
    width=42.0,
    depth=28.0,
    height=2.0,
    hole_d=2.0,
    pitch=3.4,            # center-to-center hole spacing
    margin=3.5,           # hole-free border
    corner_n=5.0,         # rounding of the hole-field boundary
    pattern="grid",       # "grid" (TE style) or "hex"
    plate_material=None,
    backing_material=None,  # dark slab behind the holes (speaker fabric)
    location=(0.0, 0.0, 0.0),
):
    # sharp flat tile; the perforated field keeps its rounded TE boundary
    plate = base_tile(name + "_Plate", width, depth, height,
                      material=plate_material, location=location)

    if backing_material:
        backing = base_tile(name + "_Backing", width - 3, depth - 3,
                            height - 0.8, material=backing_material)
        backing.parent = plate
        backing.location = (0, 0, 0.05)

    # hole centers within the margin, corners respected approximately
    ax = width / 2 - margin
    ay = depth / 2 - margin
    row_h = pitch * math.sqrt(3) / 2 if pattern == "hex" else pitch
    centers = []
    ny = int(ay // row_h)
    for iy in range(-ny, ny + 1):
        y = iy * row_h
        xoff = pitch / 2 if (pattern == "hex" and iy % 2) else 0.0
        nx = int((ax + pitch) // pitch)
        for ix in range(-nx, nx + 1):
            x = ix * pitch + xoff
            # keep inside the superellipse of the margin inset
            if abs(x / ax) ** corner_n + abs(y / ay) ** corner_n <= 1.0:
                centers.append((x, y))

    bm = bmesh.new()
    r = hole_d / 2
    segs = 24
    circle = [(r * math.cos(2 * math.pi * j / segs),
               r * math.sin(2 * math.pi * j / segs)) for j in range(segs)]
    for cx, cy in centers:
        _add_cylinder(bm, circle, cx, cy, -1.0, height + 1.0)
    cutter = _finish(bm, name + "_Holes", (0, 0, 0), None, smooth=False)
    boolean_cut(plate, cutter)

    return plate


def _add_cylinder(bm, circle, cx, cy, z0, z1):
    bot = [bm.verts.new((cx + x, cy + y, z0)) for x, y in circle]
    top = [bm.verts.new((cx + x, cy + y, z1)) for x, y in circle]
    m = len(circle)
    for j in range(m):
        bm.faces.new((bot[j], bot[(j + 1) % m], top[(j + 1) % m], top[j]))
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
