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

# Defaults mirror the :root block of packages/ambient-css/src/ambient.css.
AMB_DEFAULTS = {
    "light_x": -1.0,
    "light_y": -1.0,
    "key_light_intensity": 0.9,
    "fill_light_intensity": 0.7,
    "elevation": 0.0,
    "chamfer": 0.0,
    "chamfer_width": 1.0,
    "fillet": 0.0,
    "fillet_width": 1.0,
    "mat": "matte",       # matte | shiny | glass
    "emit": None,         # hex color for emissive plates
    "surface": "flat",    # flat | concave | concave-h | convex
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


def edge_mm(a):
    """(chamfer_mm, fillet_mm) for the plate's top edge."""
    chamfer = a["chamfer"] * a["chamfer_width"] * CHAMFER_MM_PER_WIDTH
    fillet = a["fillet"] * a["fillet_width"] * FILLET_MM_PER_WIDTH
    return chamfer, fillet


def elevation_mm(a):
    return a["elevation"] * ELEVATION_MM_PER_LEVEL


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
