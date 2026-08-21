"""The 3D referents of the @ambientcss/components React components.

Each builder here is the physical counterpart of one CSS component (and of
each button shape, and of each shape a knob's knurling/markers/indicator props
can take): the richer design the CSS component is modeled after, built at the
CSS component's dimensions — 1 CSS px = 1 mm, `--ambx-grid` = 4 px = GRID mm —
in neutral calibration materials. The three exceptions are the fluted, capped
and wheel knobs, which outlived the CSS `variant` prop that used to select
them; they stay as 3D kit styles, and are marked as such below.

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

# Cap tops are DISHED, not domed: the CSS cap carries a concave face
# (.amb-button-cap::after in the components styles.css) — the Round 7
# direction, CSS first, referent follows.
#
# Depth comes from the CSS's own source: the cap dish reuses the grounded
# curved fit, so the referent reuses the geometry that fit was measured on
# — amb_model.SAGITTA_MM / plate width = 4/80 = 5% of the span across the
# dish. Confirmed by rendering the round cap at 0.3/0.8/1.5/2.4mm and
# measuring the face: 2.4mm (5% of its 48mm) spans 84.7% -> 94.4%
# lightness, against the CSS dish's 87.2% -> 94.8%. A shallower sagitta
# reads as flat — 0.3mm, the old dome's depth inverted, measured dead level.
DISH_FRAC = ap.SAGITTA_MM / 80.0


def _dish(span):
    """Cap sagitta (negative = scooped) for a cap `span` mm across its
    narrow axis. Every cap silhouette gets the same proportional scoop, as
    the CSS does: curvature belongs to the tooling, not to the outline."""
    return -DISH_FRAC * span


def button(location=(0.0, 0.0, 0.0), value=0.0):
    cap, plate, dark = _mats()
    return build_button(width=16 * GRID, depth=7 * GRID, height=4.5,
                        shape_n=4.5, dome=_dish(7 * GRID), fillet=0.8,
                        tile_shape="fit", base_h=2.5, **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


def button_round(location=(0.0, 0.0, 0.0), value=0.0):
    cap, plate, dark = _mats()
    return build_button(width=12 * GRID, height=4.5, shape_n=2.0,
                        dome=_dish(12 * GRID),
                        fillet=0.8, tile_shape="fit", base_h=2.5,
                        **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


def button_square(location=(0.0, 0.0, 0.0), value=0.0):
    # EP-133-style pad: squarer superellipse, flatter and lower cap
    cap, plate, dark = _mats()
    return build_button(width=14 * GRID, height=3.6, shape_n=6.0,
                        dome=_dish(14 * GRID),
                        fillet=0.8, tile_shape="fit", base_h=2.5,
                        **BUTTON_WELL,
                        cap_material=cap, base_material=plate,
                        well_material=dark, location=location)


# The knurled knob, built the way the CSS component is: a smooth chamfered
# cap with the ribs machined into a rim band beyond its edge and below it, not
# ribs running the whole way up. Every number below is one of AmbientKnob's,
# converted at the grounded referent's 8*GRID radius (1 CSS px = 1 mm, so the
# knob is D = 64mm across):
#
#   ribs / sharpness      KNURLS.standard, unchanged — the two rib sections
#                         are now the SAME formula, not two shapes fitted to
#                         each other: parts/knob.tsx restates `wall_r`'s
#                         depth * (0.5 + 0.5cos(N.theta))^sharpness.
#   rib_depth   0.009 D   KNURLS.standard.depth, bounding-box units -> mm
#   knurl_rim   0.05 D    KNURLS.standard.band, the width of the ribbed ring
#                         .amb-knob-face's clip leaves outside the cap
#   cap_chamfer 2mm       .amb-knob-body's --amb-chamfer-width: 2, at the
#                         rig's 1px = 1mm
#
# How far the rim FALLS is the one thing the CSS cannot name — flat-on it says
# only how wide the ribbed ring is. So it was swept against the ring's rendered
# tone instead (.amb-knob-face is --amb-shade: 0.88 against the cap, and reads
# 0.83-0.88 of it across the band): the band lightens with the fall and
# saturates around 45deg, landing within ~2 points there, so `knurl_rim_drop`
# is left at its default — as deep as the rim is wide.
KNOB_R = 8 * GRID
KNOB_D = 2 * KNOB_R
KNOB_RIM = 0.05 * KNOB_D
KNOB_CAP_CHAMFER = 2.0
KNOB_RIB_DEPTH = 0.009 * KNOB_D
# The flat top face the indicators are placed on, which the builder takes
# fractions of: everything inside both the ribbed rim and the cap chamfer.
KNOB_CAP_R = KNOB_R - KNOB_RIM - KNOB_CAP_CHAMFER

KNOB_KNURL = dict(radius=KNOB_R, height=9.0, ribs=48,
                  rib_depth=KNOB_RIB_DEPTH, rib_sharpness=1.6,
                  knurl_rim=KNOB_RIM, cap_chamfer=KNOB_CAP_CHAMFER)


# The dot indicator is .amb-knob-indicator-circle: 0.125 of the knob's size
# across, its top edge 0.16 down from the top, so a 0.0625 D radius centred
# 0.2775 D out. The builder takes both as fractions of the cap face.
def knob(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    return build_knob(**KNOB_KNURL,
                      indicator="dot",
                      dot_frac=0.0625 * KNOB_D / KNOB_CAP_R,
                      dot_offset=0.2775 * KNOB_D / KNOB_CAP_R,
                      value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


# The rectangle indicator is a short mark near the rim, not a spoke: the CSS
# .amb-knob-indicator-rectangle runs 0.50R to 0.84R of the knob radius (top 8%
# + height 17% of --ambx-knob-size), so bar_inner is that near end and
# bar_length converts the far end to the cap-radius fraction the builder takes.
# That far end now lands a hair PAST the cap face and onto its chamfer — which
# is where the CSS puts it too, 0.84R against a face that stops at 0.8375R.
def knob_line(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    return build_knob(**KNOB_KNURL,
                      indicator="line", bar_inner=0.50,
                      bar_length=0.84 * KNOB_R / KNOB_CAP_R,
                      value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


# knurling={false}: ribs 0 is the builder's smooth body, the CSS
# .amb-knob-smooth case where the knurl clip and tone are both dropped and the
# body itself becomes the whole visible knob.
def knob_smooth(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    r = 8 * GRID
    return build_knob(radius=r, height=9.0, ribs=0,
                      indicator="line", bar_inner=0.50,
                      bar_length=0.84 * r / (r - 1.4),
                      value=value,
                      body_material=cap, accent_material=dark, base=None,
                      location=location)


# markers="full": 13 dots at 22.5deg over the 270deg sweep, ring at 1.33R and
# dots 0.14R across — the same fractions AmbientKnob's
# --ambx-knob-marker-radius / --ambx-knob-marker-size carry. Printed in the
# dark plate ink, since the CSS paints them --amb-label (panel graphics) rather
# than the accent the indicator takes.
def knob_markers(location=(0.0, 0.0, 0.0), value=0.33):
    cap, plate, dark = _mats()
    r = 8 * GRID
    return build_knob(radius=r, height=9.0, ribs=0,
                      indicator="line", bar_inner=0.50,
                      bar_length=0.84 * r / (r - 1.4),
                      markers=13, marker_r=1.33, marker_d=0.14,
                      marker_material=dark,
                      value=value,
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
             "knob-smooth": knob_smooth, "knob-markers": knob_markers,
             # No CSS counterpart since AmbientKnob collapsed to
             # knurling/markers/indicator: these stay as 3D kit styles (the
             # --knob-style opz|op1|wheel presets) and as the reference for a
             # future knurling union.
             "knob-flute": knob_flute, "knob-cap": knob_cap,
             "knob-wheel": knob_wheel,
             "switch": switch, "fader": fader, "slider": slider}
