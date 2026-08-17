"""Parametric rotary knob.

Geometry is generated directly with bmesh — no modifiers, no booleans — so
every dimension is an explicit parameter and output is deterministic.

Reference styles (see inspiration/):
- OP-Z: ~12 broad flutes (rib_sharpness ~3), slight taper, centered dot
- OP-1 field encoder: fine knurl (ribs 64+, depth ~0.15), smooth
  contrasting top disc, no indicator (endless encoder)
- TX-6: small smooth body, offset dot pointer

State: `value` (0..1) rotates the whole knob like a real pot. The pointer
angle is `min_angle + value * sweep`, measured clockwise from 12 o'clock in
top view; indicators are built pointing at 12. Mapping is stored as custom
properties so `set_value` can re-pose a built knob.

`markers` prints a scale ring on the panel over that same sweep. Those dots
are the one part that does NOT turn with the knob — see `_markers`.

Units: mm.
"""

import math

import bmesh
import bpy

from components._common import (accent_bar, base_tile, capped_solid,
                                prism_object, superellipse)


def build_knob(
    name="Knob",
    radius=6.0,          # body radius
    height=9.0,          # total height
    ribs=48,             # knurl/flute ridge count; 0 = smooth knob
    rib_depth=0.22,      # groove depth
    rib_sharpness=1.4,   # higher = narrower grooves, broader ridges
    taper=0.0,           # 0..~0.15, base narrower than top (OP-Z style)
    fillet=1.4,          # top edge round-over radius
    chamfer=0.35,        # small chamfer at the base
    indicator="line",    # "line", "dot", or "none"
    dot_frac=0.3,        # dot radius as a fraction of the cap radius
    dot_offset=0.0,      # 0 = centered dot; else offset fraction toward rim
    bar_inner=0.0,       # "line": near end as a fraction of `radius`; 0 =
                          # a full spoke from the centre
    bar_length=0.85,     # "line": far end as a fraction of the cap radius
    markers=0,           # printed scale dots around the knob; 0 = none
    marker_r=1.33,       # ring radius as a fraction of `radius`
    marker_d=0.14,       # dot diameter as a fraction of `radius`
    marker_material=None,
    top_disc=False,      # smooth contrasting cap disc (OP-1 encoder style)
    top_disc_frac=None,  # disc radius as a fraction of `radius`; None
                          # keeps the old near-full-cap sizing (cap_r-0.15)
    value=0.5,           # 0..1 pot position
    min_angle=-135.0,    # pointer at value 0, degrees CW from 12 o'clock
    sweep=270.0,         # pointer travel in degrees
    base=None,           # (w, d) mounting tile; None = bare knob
    base_h=2.5,          # tile thickness
    body_material=None,
    accent_material=None,
    top_material=None,   # top disc color; falls back to accent_material
    base_material=None,
    location=(0.0, 0.0, 0.0),
):
    segs = max(256, ribs * 12) if ribs else 256

    def wall_r(theta):
        r = radius
        if ribs:
            r -= rib_depth * (0.5 + 0.5 * math.cos(ribs * theta)) ** rib_sharpness
        return r

    # profile levels: (z, radial inset from the knurled wall)
    levels = [(0.0, chamfer), (chamfer, 0.0), (height - fillet, 0.0)]
    fillet_steps = 8
    for i in range(1, fillet_steps + 1):
        t = (i / fillet_steps) * (math.pi / 2)
        levels.append((height - fillet + fillet * math.sin(t),
                       fillet * (1.0 - math.cos(t))))

    bm = bmesh.new()
    rings = []
    for z, inset in levels:
        scale = 1.0 - taper * (1.0 - z / height)
        ring = []
        for j in range(segs):
            th = 2 * math.pi * j / segs
            r = max(wall_r(th) * scale - inset, 0.3)
            ring.append(bm.verts.new((r * math.cos(th), r * math.sin(th), z)))
        rings.append(ring)

    for a, b in zip(rings, rings[1:]):
        for j in range(segs):
            bm.faces.new((a[j], a[(j + 1) % segs], b[(j + 1) % segs], b[j]))

    bm.faces.new(list(reversed(rings[0])))   # bottom cap
    bm.faces.new(rings[-1])                  # top cap

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate()
    for poly in mesh.polygons:
        poly.use_smooth = True

    knob = bpy.data.objects.new(name, mesh)
    knob.location = location
    bpy.context.collection.objects.link(knob)
    if body_material:
        knob.data.materials.append(body_material)

    cap_r = radius - fillet
    top_z = height
    if top_disc:
        disc_r = radius * top_disc_frac if top_disc_frac is not None \
            else cap_r - 0.15
        disc = capped_solid(
            name + "_Top", superellipse(disc_r, disc_r, 2.0, 128),
            0.55, fillet=0.2, chamfer=0.0,
            material=top_material or accent_material,
        )
        disc.parent = knob
        disc.location = (0, 0, height - 0.2)  # 0.35mm proud
        top_z = height + 0.35
        cap_r = disc_r

    if indicator == "line":
        bar = accent_bar(
            name + "_Indicator",
            length=cap_r * bar_length,
            width=radius * 0.14,
            thickness=0.35,
            top_z=top_z,
            angle=math.radians(90),  # 12 o'clock reference
            inner=radius * bar_inner,
        )
        bar.parent = knob
        if accent_material:
            bar.data.materials.append(accent_material)
    elif indicator == "dot":
        dot_r = cap_r * dot_frac
        dot = capped_solid(
            name + "_Dot", superellipse(dot_r, dot_r, 2.0, 96),
            0.3, fillet=0.12, chamfer=0.0,
            material=accent_material,
        )
        dot.parent = knob
        dot.location = (0, cap_r * dot_offset, top_z - 0.1)

    knob["skeuo_type"] = "knob"
    knob["skeuo_min_angle"] = min_angle
    knob["skeuo_sweep"] = sweep
    set_value(knob, value)

    if base:
        tile = base_tile(name + "_Base", base[0], base[1], base_h,
                         material=base_material, location=location)
        knob.parent = tile
        knob.location = (0, 0, base_h)
        _markers(name, markers, radius * marker_r, radius * marker_d / 2,
                 min_angle, sweep, marker_material or accent_material,
                 parent=tile, z=base_h, location=location)
        return tile

    _markers(name, markers, radius * marker_r, radius * marker_d / 2,
             min_angle, sweep, marker_material or accent_material,
             parent=None, z=0.0, location=location)
    return knob


def _markers(name, count, ring_r, dot_r, min_angle, sweep, material,
             parent, z, location):
    """Printed scale dots on the panel around the knob.

    Deliberately NOT parented to the knob: `set_value` turns the knob about
    its own Z, and a printed scale that turned with it would be meaningless.
    They ride the mounting tile when there is one, and otherwise stand on the
    panel the bare knob stands on — which means a caller that moves an
    unbased knob afterwards leaves its markers behind.

    Angles run clockwise from 12 o'clock (+Y) to match `set_value`'s pointer
    convention, so dot i lands exactly where value i/(count-1) points.
    """
    if count < 2:
        return
    for i in range(count):
        theta = math.radians(min_angle + sweep * i / (count - 1))
        dot = prism_object(
            name + f"_Marker{i}",
            superellipse(dot_r, dot_r, 2.0, 32),
            z - 0.05, z + 0.04,
            material=material,
        )
        x = ring_r * math.sin(theta)
        y = ring_r * math.cos(theta)
        if parent is not None:
            dot.parent = parent
            dot.location = (x, y, 0)
        else:
            dot.location = (location[0] + x, location[1] + y, location[2])


def set_value(obj, value):
    v = max(0.0, min(1.0, value))
    obj["skeuo_value"] = v
    pointer = obj["skeuo_min_angle"] + v * obj["skeuo_sweep"]
    obj.rotation_euler[2] = math.radians(-pointer)  # CW pointer = -Z rotation
    return obj
