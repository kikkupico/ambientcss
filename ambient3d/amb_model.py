"""The pure (bpy-free) half of the amb parameter model.

Shared by the Blender side (amb_params.py) and the measurement pipeline
(measure/*), which runs outside Blender. Holds the design constants that
define the calibration rig and the mapping from --amb-* values to
millimetres. The CSS coefficients are derived from these constants,
never the other way around.
"""

# ------------------------------------------------------ design constants ---

PX_PER_MM = 4
FRAME_MM = 128            # square camera footprint -> 512 px renders
CAM_Z = 400.0
# Key light geometry: far enough that irradiance varies < ~6% across the
# 80 mm plate (a closer light reads as a visible gradient the flat CSS
# surface color cannot express), size/Z = 0.7 for soft, studio-like
# penumbras. Placement is per-axis (R*lx, -R*ly): light-x/y behave as tan
# components, matching the CSS's per-axis formulas; apply_lighting
# compensates energy so plate irradiance is direction-invariant.
LIGHT_R = 800.0
LIGHT_Z = 800.0
LIGHT_SIZE = 560.0
GROUND_MM = 400.0
GROUND_ALBEDO = 0.82      # linear reflectance of the reference ground

# Exposure anchors, calibrated once against the CSS surface ramp
# (see derived/notes/surface.md). Anchoring: at the CSS defaults
# (key 0.9, fill 0.7) the plate renders at exactly today's `.amb-surface`
# lightness (90% sRGB), with the fill contributing 0.40 of the luminance —
# the fraction that maximizes linearity of the key-intensity ramp (so the
# CSS's linear formula fits the physics well) while keeping shadow depths
# near today's defaults. An identity ramp (L = Ik*100%) is physically
# unreachable through sRGB gamma; the grounded surface coefficients come
# from fitting the rendered ramp instead.
E0 = 22_150_000.0         # key area-light energy at key_light_intensity = 1
S0 = 0.55                 # world strength at fill_light_intensity = 1


def key_energy(a):
    """Key light energy, compensated so plate irradiance depends only on
    key_light_intensity, never on direction: irradiance from a tracked
    area light goes as E * cos(zenith) / d^2, so E scales by d^2/cos
    relative to the default (-1,-1) direction E0 was calibrated at."""
    import math

    def d2_over_cos(lx, ly):
        d2 = (LIGHT_R * lx) ** 2 + (LIGHT_R * ly) ** 2 + LIGHT_Z ** 2
        return d2 / (LIGHT_Z / math.sqrt(d2))

    ref = d2_over_cos(AMB_DEFAULTS["light_x"], AMB_DEFAULTS["light_y"])
    here = d2_over_cos(a["light_x"], a["light_y"])
    return E0 * a["key_light_intensity"] * here / ref

# CSS px per unit of the corresponding --amb-* width property.
CHAMFER_MM_PER_WIDTH = 1.0
FILLET_MM_PER_WIDTH = 2.0
ELEVATION_MM_PER_LEVEL = 8.0

# Thickness levels: 0 = paper-thin sheet (imperceptible at rest: embedded
# flush in the ground like a decal, no walls, no shadow; only elevation
# reveals it), 1 = button-scale slab, 2 = knob-scale. The drop shadow is
# cast by the top silhouette — h = elevation_mm for a sheet (its top face
# rides at exactly the elevation height), elevation_mm + thickness_mm for
# slabs — so elevation and thickness feed one unified shadow model. Edge
# treatments require t >= 1.
THICKNESS_MM_PER_LEVEL = 4.5
SHEET_MM = 0.15           # physical stand-in for thickness 0
SHEET_PROUD_MM = 0.02     # how far an embedded sheet sits above the ground
                          # (0.08 px: invisible, but never coplanar)
SAGITTA_MM = 4.0          # dish/dome depth of the curved surface variants
                          # (deep enough that its shading dominates the
                          # residual plate-wide irradiance gradient)
DARKER_ALBEDO = 0.06      # .amb-surface-darker plate (~30% of the default
                          # lightness at the (0.9, 0.7) defaults)

# Defaults mirror the :root block of packages/ambient-css/src/ambient.css.
AMB_DEFAULTS = {
    "light_x": -1.0,
    "light_y": -1.0,
    "key_light_intensity": 0.9,
    "fill_light_intensity": 0.7,
    "elevation": 0.0,
    "thickness": 0.0,
    "chamfer": 0.0,
    "chamfer_width": 1.0,
    "fillet": 0.0,
    "fillet_width": 1.0,
    "mat": "matte",       # matte | shiny | glass
    "emit": None,         # hex color for emissive plates
    "surface": "flat",    # flat | concave | concave-h | convex
    "albedo": None,       # None = ground albedo; darker plates override
}


def amb(**overrides):
    """A full amb parameter dict: defaults overlaid with `overrides`.
    Keys may use CSS spelling ('light-x') or python spelling ('light_x')."""
    merged = dict(AMB_DEFAULTS)
    for key, val in overrides.items():
        key = key.replace("-", "_")
        if key not in merged:
            raise KeyError(f"unknown amb parameter '{key}'")
        merged[key] = val
    return merged


def thickness_mm(a):
    t = a["thickness"]
    return SHEET_MM if t < 1 else t * THICKNESS_MM_PER_LEVEL


def edge_mm(a):
    """(chamfer_mm, fillet_mm) for the plate's top edge. A sheet (t < 1)
    has no material to cut, so edge treatments require thickness >= 1.
    Widths cap level-for-level (|width| <= thickness: a width-2 cut needs a
    knob-scale body — mirrored by the --_amb-*-w vars in ambient.css), with
    the old mm safety cap kept so the cut never consumes the whole slab."""
    if a["thickness"] < 1:
        return 0.0, 0.0
    t = a["thickness"]

    def level_cap(width):
        return max(-t, min(width, t))

    cap = thickness_mm(a) - 0.5
    chamfer = min(cap, a["chamfer"] * level_cap(a["chamfer_width"])
                  * CHAMFER_MM_PER_WIDTH)
    fillet = min(cap, a["fillet"] * level_cap(a["fillet_width"])
                 * FILLET_MM_PER_WIDTH)
    return max(0.0, chamfer), max(0.0, fillet)


def elevation_mm(a):
    return a["elevation"] * ELEVATION_MM_PER_LEVEL


def plate_z(a):
    """Z of the plate's base. A sheet (t < 1) rests embedded like a decal —
    its top face a sub-pixel hair above the ground (exactly flush would
    z-fight the coplanar ground face) — and rises out with elevation; a
    slab sits on the ground."""
    z = elevation_mm(a)
    return z - SHEET_MM + SHEET_PROUD_MM if a["thickness"] < 1 else z


def silhouette_mm(a):
    """Height of the shadow-casting top silhouette above the ground."""
    return plate_z(a) + thickness_mm(a)


def reference_layout(a, plate_w, plate_d):
    """Screen-mm centers for the white patch, black trap and the two 8x8
    unshadowed-ground reference samples, placed in the two frame regions
    perpendicular to the light axis — the only zones untouched by the
    lit-edge bloom, the drop shadow, and the edge-profile bands. Shared by
    the Blender rig (builds the patches) and the measurement pipeline
    (samples the refs), so they can never disagree on geometry."""
    lx, ly = a["light_x"], a["light_y"]
    if lx == 0 and ly == 0:
        lx, ly = -1.0, -1.0
    perp = (-ly, lx)

    def cheb(v):
        m = max(abs(v[0]), abs(v[1]))
        return (v[0] / m, v[1] / m)

    lat_ext = 0.7 * min(plate_w, plate_d) / 2  # profile lateral half-extent
    out = {}
    for patch, ref, c in (("white", "ref_a", cheb(perp)),
                          ("black", "ref_b", cheb((-perp[0], -perp[1])))):
        base = (52.0 * c[0], 52.0 * c[1])
        if c[0] == 0 or c[1] == 0:
            # edge-midpoint strip: shift tangentially past the profile band
            t = (1.0, 0.0) if c[0] == 0 else (0.0, 1.0)
            s = lat_ext + 8.0
        else:
            # diagonal corner pocket: split along the pocket diagonal
            t = (-c[1], c[0])
            s = 6.0
        out[patch] = (base[0] + s * t[0], base[1] + s * t[1])
        out[ref] = (base[0] - s * t[0], base[1] - s * t[1])
    return out


def expand_overrides(overrides):
    """Resolve manifest pseudo-params: 'light' -> light_x/light_y."""
    out = {}
    for key, val in overrides.items():
        if key == "light":
            out["light_x"], out["light_y"] = float(val[0]), float(val[1])
        else:
            out[key] = val
    return out


def fmt(v):
    """Stable value formatting for sweep frame filenames."""
    if isinstance(v, (list, tuple)):
        return ",".join(fmt(x) for x in v)
    return f"{v:g}" if isinstance(v, (int, float)) else str(v)


def manifest_jobs(manifest, scenes=(), sweeps=(), all_jobs=False):
    """Yield (relpath, amb_overrides, spec) for every requested render job.
    The single enumeration shared by calibrate.py (render), measure/run.py
    (measure) and the css harness (screenshot), so they can never drift."""
    import os

    for scene in manifest["scenes"]:
        if all_jobs or scene["id"] in scenes:
            yield (os.path.join("calib", scene["id"] + ".png"),
                   dict(scene["amb"]), scene)
    for sweep in manifest["sweeps"]:
        if not (all_jobs or sweep["id"] in sweeps):
            continue
        for axis in sweep["axes"]:
            for param, values in axis["vary"].items():
                for val in values:
                    amb_over = dict(sweep["amb"])
                    amb_over.update(expand_overrides({param: val}))
                    rel = os.path.join("sweeps", sweep["id"],
                                       f"{param}={fmt(val)}.png")
                    yield rel, amb_over, sweep
