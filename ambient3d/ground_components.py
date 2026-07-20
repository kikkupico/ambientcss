"""Flat-on ground-truth renders of the component referents, run inside
Blender:

    blender -b -P ground_components.py
    blender -b -P ground_components.py -- knob-flute button-round

Each @ambientcss/components component (and each button-shape / knob-type
variant) gets its 3D counterpart (the
richer designs the CSS components are modeled after) built at the CSS
component's dimensions (1 CSS px = 1 mm, --ambx-grid = 4px), in neutral
calibration materials, on the calibration rig under the default amb
lighting — the same flat-on view as the effect calibration frames, minus
the reference patches (these are published docs imagery, not measured
frames). Writes renders/components/<name>.png; measure/publish.py copies
them into the docs site.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import skeuo_kit as kit
import amb_params as ap
from components.button import build_button
from components.fader import build_fader
from components.knob import build_knob
from components.slider import build_slider
from components.switch import build_switch

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "renders", "components")

GRID = 4.0                      # --ambx-grid in px = mm
CAP = ap.GROUND_ALBEDO          # caps share the surface albedo (amb-surface)
DARK = 0.06                     # wells and accents (the lume-dark parts)


def _mats():
    return (ap.calib_material("Cap", CAP),
            ap.calib_material("Plate", ap.GROUND_ALBEDO),
            ap.calib_material("Dark", DARK))


def button():
    cap, plate, dark = _mats()
    build_button(width=16 * GRID, depth=7 * GRID, height=4.5,
                 shape_n=4.5, dome=0.3, fillet=0.8,
                 base_size=(18 * GRID, 9 * GRID), base_h=2.5,
                 base_style="flush", seat=1.2, clearance=0.5 * GRID / 2,
                 cap_material=cap, base_material=plate)


def button_round():
    cap, plate, dark = _mats()
    build_button(width=12 * GRID, height=4.5, shape_n=2.0, dome=0.3,
                 fillet=0.8, base_size=(14 * GRID, 14 * GRID), base_h=2.5,
                 base_style="flush", seat=1.2, clearance=0.5 * GRID / 2,
                 cap_material=cap, base_material=plate)


def button_square():
    # EP-133-style pad: squarer superellipse, flatter and lower cap
    cap, plate, dark = _mats()
    build_button(width=14 * GRID, height=3.6, shape_n=6.0, dome=0.15,
                 fillet=0.8, base_size=(16 * GRID, 16 * GRID), base_h=2.5,
                 base_style="flush", seat=1.2, clearance=0.5 * GRID / 2,
                 cap_material=cap, base_material=plate)


def knob():
    cap, plate, dark = _mats()
    build_knob(radius=8 * GRID, height=9.0, ribs=36, rib_depth=0.5,
               indicator="dot", dot_frac=0.12, dot_offset=0.68, value=0.33,
               body_material=cap, accent_material=dark, base=None)


def knob_line():
    cap, plate, dark = _mats()
    build_knob(radius=8 * GRID, height=9.0, ribs=36, rib_depth=0.5,
               indicator="line", value=0.33,
               body_material=cap, accent_material=dark, base=None)


def knob_flute():
    # OP-Z-style: broad flutes, deep roots, centered dot
    cap, plate, dark = _mats()
    build_knob(radius=8 * GRID, height=9.0, ribs=14, rib_depth=3.2,
               rib_sharpness=8.0, taper=0.1, indicator="dot",
               dot_frac=0.32, dot_offset=0.0, value=0.33,
               body_material=cap, accent_material=dark, base=None)


def knob_cap():
    # OP-1-style encoder: fine knurl, smooth contrasting top disc
    cap, plate, dark = _mats()
    build_knob(radius=8 * GRID, height=9.0, ribs=48, rib_depth=0.8,
               indicator="none", top_disc=True, value=0.33,
               body_material=cap, accent_material=dark, top_material=dark,
               base=None)


def knob_wheel():
    # machined wheel: bare fine knurl, no indicator
    cap, plate, dark = _mats()
    build_knob(radius=8 * GRID, height=9.0, ribs=48, rib_depth=0.8,
               indicator="none", fillet=0.8, chamfer=0.3, value=0.33,
               body_material=cap, base=None)


def switch():
    cap, plate, dark = _mats()
    build_switch(base_w=15 * GRID, base_d=9 * GRID, base_h=2.5,
                 well_l=12 * GRID, well_w=6 * GRID,
                 well_depth=1.5, pill_h=2.6, value=0.0,
                 plate_material=plate, pill_material=cap,
                 led_material=dark)


def fader():
    import bpy

    cap, plate, dark = _mats()
    obj = build_fader(base_w=32 * GRID, base_d=8 * GRID, base_h=2.5,
                      slot_len=30 * GRID, slot_w=1.5 * GRID,
                      cap_shape="pill", cap_w=9 * GRID, cap_d=6 * GRID,
                      cap_h=7.0, value=0.5,
                      plate_material=plate, cap_material=cap,
                      accent_material=dark, well_material=dark)
    obj.rotation_euler = (0.0, 0.0, math.pi / 2)   # CSS fader is vertical
    return obj


def slider():
    cap, plate, dark = _mats()
    build_slider(base_w=32 * GRID, base_d=8 * GRID, base_h=2.5,
                 groove_len=30 * GRID, groove_w=1.5 * GRID,
                 groove_depth=1.0, thumb_d=6 * GRID, thumb_h=3.2,
                 value=0.5, plate_material=plate, thumb_material=cap)


COMPONENTS = {"button": button, "button-round": button_round,
              "button-square": button_square,
              "knob": knob, "knob-line": knob_line,
              "knob-flute": knob_flute, "knob-cap": knob_cap,
              "knob-wheel": knob_wheel,
              "switch": switch, "fader": fader, "slider": slider}


def main():
    # optional filter: blender -b -P ground_components.py -- knob-flute ...
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    names = argv or list(COMPONENTS)
    os.makedirs(OUT, exist_ok=True)
    a = ap.amb()
    for name in names:
        build = COMPONENTS[name]
        kit.reset_scene()
        ap.setup_calibration_rig(a, patches=False)
        build()
        png = os.path.join(OUT, f"{name}.png")
        kit.setup_render(png, resolution=ap.FRAME_MM * ap.PX_PER_MM,
                         samples=256)
        ap.finalize_calibration_render(samples=256)
        kit.render_and_save(png)
        print(f"WROTE {png}")


main()
