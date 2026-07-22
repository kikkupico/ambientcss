"""The 3D referents of the @ambientcss/components React components.

Each builder here is the physical counterpart of one CSS component (and of
each button-shape / knob-type variant): the richer design the CSS component
is modeled after, built at the CSS component's dimensions — 1 CSS px = 1 mm,
`--ambx-grid` = 4 px = GRID mm — in neutral calibration materials.

Kept apart from the scenes that render them so more than one scene can place
the same referent: `ground_components.py` renders them one per frame for the
docs, `hero_panel.py` composes several into the README panel. The dimensions
and rib parameters below are tuned against the CSS implementations (see the
knurl note) and must not be duplicated elsewhere.

`location` places the referent's centre in rig millimetres; `value` is the
component's normalized 0..1 state.
"""

import math

import amb_params as ap
from components.button import build_button
from components.fader import build_fader
from components.knob import build_knob
from components.slider import build_slider
from components.switch import build_switch

GRID = 4.0                      # --ambx-grid in px = mm
CAP = ap.GROUND_ALBEDO          # caps share the surface albedo (amb-surface)
DARK = 0.06                     # wells and accents (the lume-dark parts)


def _mats():
    return (ap.calib_material("Cap", CAP),
            ap.calib_material("Plate", ap.GROUND_ALBEDO),
            ap.calib_material("Dark", DARK))


# The CSS button is a lined well, not a clearance hole: "the button element
# IS the well ... whose lume interior shows as the gap ring around the cap"
# (styles.css). So the referents seat their caps in a pocket lined with the
# dark accent, gap ring `--ambx-grid-half` wide (2 px = 2 mm, the CSS
# button's padding) and `seat` deep (thickness 0.27 = 1.2 mm).
BUTTON_WELL = dict(base_style="well", well_gap=0.5 * GRID, well_depth=1.2)


def button(location=(0.0, 0.0, 0.0), value=0.0):
    cap, plate, dark = _mats()
    return build_button(width=16 * GRID, depth=7 * GRID, height=4.5,
                        shape_n=4.5, dome=0.3, fillet=0.8,
                        tile_shape="fit", base_h=2.5, **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


def button_round(location=(0.0, 0.0, 0.0), value=0.0):
    cap, plate, dark = _mats()
    return build_button(width=12 * GRID, height=4.5, shape_n=2.0, dome=0.3,
                        fillet=0.8, tile_shape="fit", base_h=2.5,
                        **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


def button_square(location=(0.0, 0.0, 0.0), value=0.0):
    # EP-133-style pad: squarer superellipse, flatter and lower cap
    cap, plate, dark = _mats()
    return build_button(width=14 * GRID, height=3.6, shape_n=6.0, dome=0.15,
                        fillet=0.8, tile_shape="fit", base_h=2.5,
                        **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


# Knurl depth = (0.5 - root) * 2 * radius, root fractions taken directly from
# AmbientKnob.tsx's KNURLS (standard .468, flute .44, fine .476), so the
# tooth-crest-to-root depth matches the CSS clip-path teeth exactly at the
# grounded referent's 8*GRID radius. Sharpness bumped from the (unrelated)
# generate.py catalog default so the crest/root read as distinct facets
# rather than a soft sinusoid, closer to the clip-path's near-trapezoidal
# tooth (short rise/fall, flat crest and root).
def knob(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    return build_knob(radius=8 * GRID, height=9.0, ribs=36, rib_depth=2.05,
                      rib_sharpness=3.0,
                      indicator="dot", dot_frac=0.12, dot_offset=0.68,
                      value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


def knob_line(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    return build_knob(radius=8 * GRID, height=9.0, ribs=36, rib_depth=2.05,
                      rib_sharpness=3.0,
                      indicator="line", value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


def knob_flute(location=(0.0, 0.0, 0.0), value=0.33):
    # OP-Z-style: broad flutes, deep roots, centered dot
    cap, plate, dark = _mats()
    return build_knob(radius=8 * GRID, height=9.0, ribs=14, rib_depth=3.84,
                      rib_sharpness=8.0, taper=0.1, indicator="dot",
                      dot_frac=0.32, dot_offset=0.0, value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


def knob_cap(location=(0.0, 0.0, 0.0), value=0.33):
    # OP-1-style encoder: fine knurl, smooth contrasting top disc sized to
    # the CSS cap variant's radial-gradient stop (65% of the knob radius),
    # leaving the fine knurl visible as a rim
    cap, plate, dark = _mats()
    return build_knob(radius=8 * GRID, height=9.0, ribs=48, rib_depth=1.54,
                      rib_sharpness=3.0,
                      indicator="none", top_disc=True, top_disc_frac=0.65,
                      value=value,
                      body_material=cap, accent_material=dark,
                      top_material=dark, base=None, location=location)


def knob_wheel(location=(0.0, 0.0, 0.0), value=0.33):
    # machined wheel: bare fine knurl, no indicator
    cap, plate, dark = _mats()
    return build_knob(radius=8 * GRID, height=9.0, ribs=48, rib_depth=1.54,
                      rib_sharpness=3.0,
                      indicator="none", fillet=0.8, chamfer=0.3, value=value,
                      body_material=cap, base=None, location=location)


def switch(location=(0.0, 0.0, 0.0), value=0.0):
    cap, plate, dark = _mats()
    return build_switch(base_w=15 * GRID, base_d=9 * GRID, base_h=2.5,
                        well_l=12 * GRID, well_w=6 * GRID,
                        well_depth=1.5, pill_h=2.6, value=value,
                        tile_shape="fit", floor_material=dark,
                        plate_material=plate, pill_material=cap,
                        led_material=dark, location=location)


def fader(location=(0.0, 0.0, 0.0), value=0.5):
    cap, plate, dark = _mats()
    obj = build_fader(base_w=32 * GRID, base_d=8 * GRID, base_h=2.5,
                      slot_len=30 * GRID, slot_w=2 * GRID,
                      cap_shape="pill", cap_w=9 * GRID, cap_d=6 * GRID,
                      cap_h=7.0, value=value,
                      plate_material=plate, cap_material=cap,
                      accent_material=dark, well_material=dark,
                      location=location)
    obj.rotation_euler = (0.0, 0.0, math.pi / 2)   # CSS fader is vertical
    return obj


def slider(location=(0.0, 0.0, 0.0), value=0.5):
    cap, plate, dark = _mats()
    return build_slider(base_w=32 * GRID, base_d=8 * GRID, base_h=2.5,
                        groove_len=30 * GRID, groove_w=2 * GRID,
                        groove_depth=1.0, thumb_d=6 * GRID, thumb_h=3.2,
                        value=value, floor_material=dark,
                        plate_material=plate, thumb_material=cap,
                        location=location)


REFERENTS = {"button": button, "button-round": button_round,
             "button-square": button_square,
             "knob": knob, "knob-line": knob_line,
             "knob-flute": knob_flute, "knob-cap": knob_cap,
             "knob-wheel": knob_wheel,
             "switch": switch, "fader": fader, "slider": slider}
