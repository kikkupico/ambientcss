"""Shared geometry helpers for components. Units: mm.

Solids are lofted from 2D profiles (superellipses cover circles, pills and
rounded squares in one form). Holes are cut with live boolean modifiers so
builders stay simple; cutters are hidden from render.
"""

import math

import bmesh
import bpy


# ---------------------------------------------------------------- profiles ---

def superellipse(a, b, n, segs=256):
    """CCW profile. n=2 -> ellipse/circle, n~2.5 -> pill, n>=4 -> squircle."""
    pts = []
    for j in range(segs):
        t = 2 * math.pi * j / segs
        c, s = math.cos(t), math.sin(t)
        x = a * math.copysign(abs(c) ** (2.0 / n), c)
        y = b * math.copysign(abs(s) ** (2.0 / n), s)
        pts.append((x, y))
    return pts


def offset_profile(pts, dist):
    """Offset a CCW profile inward by dist (outward if negative)."""
    out = []
    m = len(pts)
    for i in range(m):
        x0, y0 = pts[i - 1]
        x1, y1 = pts[(i + 1) % m]
        tx, ty = x1 - x0, y1 - y0
        length = math.hypot(tx, ty) or 1.0
        nx, ny = ty / length, -tx / length  # outward normal
        px, py = pts[i]
        out.append((px - nx * dist, py - ny * dist))
    return out


# ------------------------------------------------------------------ solids ---

def capped_solid(name, profile, height, fillet=0.8, chamfer=0.2, dome=0.0,
                 location=(0, 0, 0), material=None, smooth=True):
    """Extruded profile with base chamfer, top edge fillet, flat or domed cap."""
    segs = len(profile)
    levels = [(0.0, chamfer), (chamfer, 0.0), (height - fillet, 0.0)]
    fillet_steps = 8
    for i in range(1, fillet_steps + 1):
        t = (i / fillet_steps) * (math.pi / 2)
        levels.append((height - fillet + fillet * math.sin(t),
                       fillet * (1.0 - math.cos(t))))

    bm = bmesh.new()
    rings = []
    for z, inset in levels:
        pts = offset_profile(profile, inset) if inset else profile
        rings.append([bm.verts.new((x, y, z)) for x, y in pts])

    if dome > 0:
        top_pts = offset_profile(profile, fillet)
        dome_steps = 6
        for k in range(1, dome_steps):
            s = 1.0 - k / dome_steps
            z = height + dome * (1.0 - s * s)
            rings.append([bm.verts.new((x * s, y * s, z)) for x, y in top_pts])

    for a, b in zip(rings, rings[1:]):
        for j in range(segs):
            bm.faces.new((a[j], a[(j + 1) % segs], b[(j + 1) % segs], b[j]))

    bm.faces.new(list(reversed(rings[0])))
    if dome > 0:
        center = bm.verts.new((0.0, 0.0, height + dome))
        last = rings[-1]
        for j in range(segs):
            bm.faces.new((last[j], last[(j + 1) % segs], center))
    else:
        bm.faces.new(rings[-1])

    return _finish(bm, name, location, material, smooth=smooth)


def add_prism(bm, pts, z0, z1):
    """Closed straight-walled solid from a CCW profile, added into bm."""
    bot = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    m = len(pts)
    for j in range(m):
        bm.faces.new((bot[j], bot[(j + 1) % m], top[(j + 1) % m], top[j]))
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)


def prism_object(name, pts, z0, z1, location=(0, 0, 0), material=None,
                 smooth=False):
    bm = bmesh.new()
    add_prism(bm, pts, z0, z1)
    return _finish(bm, name, location, material, smooth=smooth)


def _finish(bm, name, location, material, smooth):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate()
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    return obj


# -------------------------------------------------------------- base tiles ---

def base_tile(name, w, d, h, material=None, location=(0, 0, 0)):
    """Sharp-cornered flat mounting tile. Tiles with the same `h` butt
    together seamlessly to compose a panel."""
    pts = [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]
    return prism_object(name, pts, 0.0, h, location=location,
                        material=material, smooth=False)


# ------------------------------------------------------------------- holes ---

def boolean_cut(target, cutter, name="Cut"):
    """Live boolean difference; cutter is hidden from render."""
    cutter.display_type = "WIRE"
    cutter.hide_render = True
    cutter.parent = target
    mod = target.modifiers.new(name, "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    try:
        mod.solver = "EXACT"
    except TypeError:
        pass
    return mod


# ----------------------------------------------------------------- labels ---

_label_font_cache = [None, False]  # [font, tried]


def _label_font():
    """A clean sans-serif close to TE's typography; None = Blender default."""
    if not _label_font_cache[1]:
        _label_font_cache[1] = True
        for path in ("/System/Library/Fonts/HelveticaNeue.ttc",
                     "/System/Library/Fonts/Helvetica.ttc",
                     "/System/Library/Fonts/Supplemental/Arial.ttf"):
            try:
                _label_font_cache[0] = bpy.data.fonts.load(path)
                break
            except Exception:
                continue
    return _label_font_cache[0]


def _glyph_pts(key, s):
    """Geometric symbol outlines (TE transport style), sized to height s."""
    if key == "play":
        return [(-0.4 * s, 0.5 * s), (-0.4 * s, -0.5 * s), (0.6 * s, 0.0)]
    if key == "stop":
        h = 0.42 * s
        return [(-h, -h), (h, -h), (h, h), (-h, h)]
    if key == "rec":
        return superellipse(0.5 * s, 0.5 * s, 2.0, 48)
    if key == "minus":
        return [(-0.5 * s, -0.15 * s), (0.5 * s, -0.15 * s),
                (0.5 * s, 0.15 * s), (-0.5 * s, 0.15 * s)]
    if key == "plus":
        a, b = 0.15 * s, 0.5 * s
        return [(-a, -b), (a, -b), (a, -a), (b, -a), (b, a), (a, a),
                (a, b), (-a, b), (-a, a), (-b, a), (-b, -a), (-a, -a)]
    raise ValueError(f"unknown glyph '@{key}'")


def label_object(name, label, size=3.2, thickness=0.2, material=None):
    """Printed label: text, or an @-prefixed geometric glyph (@play, @stop,
    @rec, @plus, @minus). Centered on its origin, `thickness` through Z."""
    if label.startswith("@"):
        # glyph outlines are wound for readability from +Z; reverse if CW
        pts = _glyph_pts(label[1:], size)
        area = sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1)
                   in zip(pts, pts[1:] + pts[:1]))
        if area < 0:
            pts.reverse()
        return prism_object(name, pts, -thickness / 2, thickness / 2,
                            material=material)

    curve = bpy.data.curves.new(name, "FONT")
    curve.body = label
    curve.size = size
    curve.extrude = thickness / 2
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    font = _label_font()
    if font:
        curve.font = font
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    return obj


# ------------------------------------------------------------- accent bar ---

def accent_bar(name, length, width, thickness, top_z, angle=0.0, embed=0.15):
    """Thin rounded printed bar, from local origin outward along +X."""
    bm = bmesh.new()
    x0, x1 = 0.0, length
    y0, y1 = -width / 2, width / 2
    z0, z1 = top_z - embed, top_z + thickness - embed
    vs = [bm.verts.new(v) for v in (
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    )]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    for f in faces:
        bm.faces.new([vs[i] for i in f])
    try:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=width * 0.25,
                        offset_type="OFFSET", segments=2, profile=0.5,
                        affect="EDGES")
    except TypeError:
        pass

    bar = _finish(bm, name, (0, 0, 0), None, smooth=False)
    bar.rotation_euler = (0.0, 0.0, angle)
    return bar
