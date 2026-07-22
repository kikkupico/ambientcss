"""Demo panel: a mock device face — grille, knobs, fader, switch, metal
button and key rows — composed as a modular rack rather than a butted
monolithic slab: components keep their own base tiles and sit apart by the
same gap tiers documented for the CSS/React spacing system
(components._common.GAP_TIGHT_MM/-NORMAL_MM/-LOOSE_MM), so this render is a
worked hardware-composition example, not just a lighting/shading one.

Real modular hardware with reveal gaps between controls still has one
continuous chassis underneath (a pan/PCB deck), not empty air between
floating parts — each row gets a shared backing plate spanning its full
computed width, sitting 0.05mm below the component tiles' own top surface
(same z-fighting-avoidance margin the t0 "sheet" decal elsewhere in this kit
uses) so it only shows through in the gaps, not through the tiles above it.
No other builder needed to change: every component still builds its own
individual base tile exactly as before.

The composition that used to live inline in generate.py's panel mode, formalized
so other scenes (and docs shots) can rebuild it.

Every component keeps its own state and re-poses via components.set_value.
"""

import skeuo_kit as kit
from components._common import GAP_LOOSE_MM, GAP_NORMAL_MM, GAP_TIGHT_MM, base_tile, grouped_row_layout, row_layout
from components.button import build_button
from components.fader import build_fader
from components.grille import build_grille
from components.knob import build_knob
from components.switch import build_switch

_CHASSIS_MARGIN_MM = 4.0   # overhang beyond the outermost component tile
_CHASSIS_RECESS_MM = 0.05  # kept below component tiles' top face


def _build_chassis(name, y, depth, row_total, material, base_h):
    """Shared backing plate for one row, spanning its full computed width
    plus a small overhang. Sits _CHASSIS_RECESS_MM below the component
    tiles' own top face so it only shows through the gaps between them."""
    return base_tile(
        name, row_total + 2 * _CHASSIS_MARGIN_MM, depth,
        base_h - _CHASSIS_RECESS_MM, material=material, location=(0, y, 0),
    )


def build_demo_panel(panel_preset=None, base_h=2.5):
    bone, _ = kit.materials_for("bone")
    orange, orange_acc = kit.materials_for("orange")
    graphite, graphite_acc = kit.materials_for("graphite")
    grey, _ = kit.materials_for("grey")
    panel = kit.base_material_for(panel_preset, "bone")
    alu_bright = kit.metal_material("AluBright", rough=0.32)

    # row 1 (y center 21, depth 30): grille + knobs, large to small. The
    # grille is its own zone (a different component family), separated from
    # the knob bank by the loose tier; the four knobs are one dense cluster
    # at the tight tier (mirrors generate.py's `lineup` pitch).
    knob_specs = [
        (22, 7.0, 10.0, "orange", 0.15),
        (18, 5.5, 8.0, "grey", 0.4),
        (18, 5.5, 8.0, "graphite", 0.7),
        (18, 4.0, 6.0, "orange", 0.95),
    ]
    grille_width = 36
    knob_widths = [w for w, *_ in knob_specs]
    row1_xs, row1_total = grouped_row_layout(
        [([grille_width], 0), (knob_widths, GAP_TIGHT_MM)], GAP_LOOSE_MM)
    grille_x, knob_xs = row1_xs[0], row1_xs[1:]

    _build_chassis("Row1Chassis", 21, 30, row1_total, panel, base_h)
    build_grille(name="Grille", width=grille_width, depth=30, height=base_h,
                 margin=4.5, plate_material=panel,
                 backing_material=graphite, location=(grille_x, 21, 0))
    for x, (tile_w, r, h, preset_name, v) in zip(knob_xs, knob_specs):
        kb, ka = kit.materials_for(preset_name)
        build_knob(name=f"PKnob_{x:.0f}", radius=r, height=h, ribs=48,
                   value=v, base=(tile_w, 30), base_material=panel,
                   body_material=kb, accent_material=ka,
                   location=(x, 21, 0))

    # row 2 (y center -5, depth 22): fader + metal button + slide switch —
    # three distinct control families in one functional row (master
    # controls), spaced at the normal tier.
    row2_widths = [74, 22, 16]  # fader / button / switch base widths
    (fader_x, button_x, switch_x), row2_total = row_layout(row2_widths, GAP_NORMAL_MM)

    _build_chassis("Row2Chassis", -5, 22, row2_total, panel, base_h)
    build_fader(name="PFader", base_w=74, base_d=22, slot_len=60,
                cap_shape="disc", ticks=9, value=0.65,
                plate_material=panel, cap_material=grey,
                well_material=graphite, tick_material=graphite,
                location=(fader_x, -5, 0))
    build_button(name="PMetal", shape_n=2.0, width=8.0, dome=0.05,
                 fillet=0.35, height=3.5, base_style="well", travel=0.5,
                 base_size=(22, 22), label="@plus",
                 label_material=graphite,
                 cap_material=alu_bright, base_material=panel,
                 location=(button_x, -5, 0))
    build_switch(name="PSwitch", base_w=16, base_d=22, base_h=base_h,
                 well_l=11, well_w=6, value=1.0, led=True,
                 plate_material=panel, pill_material=graphite,
                 led_material=orange, location=(switch_x, -5, 0))

    # row 3 (y center -26, depth 20): wide transport keys (one functional
    # group, tight among themselves) + small number keys (a second group,
    # tight among themselves), with a loose boundary between the two groups.
    transport = (("@rec", orange, orange_acc),
                 ("@play", bone, graphite),
                 ("@stop", bone, graphite))
    transport_widths = [20] * len(transport)
    key_widths = [13] * 4
    row3_xs, row3_total = grouped_row_layout(
        [(transport_widths, GAP_TIGHT_MM), (key_widths, GAP_TIGHT_MM)], GAP_LOOSE_MM)
    transport_xs, key_xs = row3_xs[:len(transport)], row3_xs[len(transport):]

    _build_chassis("Row3Chassis", -26, 20, row3_total, panel, base_h)
    for (lab, cap, lab_mat), x in zip(transport, transport_xs):
        build_button(name=f"PT{lab[1:]}", shape_n=4.5, width=16.0,
                     depth=11.0, height=3.2, dome=0.2, fillet=0.8,
                     base_size=(20, 20), cap_material=cap,
                     base_material=panel, label=lab,
                     label_material=lab_mat, location=(x, -26, 0))
    for i, x in enumerate(key_xs):
        build_button(name=f"PKey_{i}", shape_n=4.5, width=9.0,
                     base_size=(13, 20), cap_material=bone,
                     base_material=panel, value=1.0 if i == 1 else 0.0,
                     label=str(i + 1), label_material=graphite,
                     location=(x, -26, 0))
