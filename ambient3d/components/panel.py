"""Demo panel: a mock 112x72 mm device face composed from butted component
tiles — grille, knobs, fader, switch, metal button and key rows. The
composition that used to live inline in generate.py's panel mode,
formalized so other scenes (and docs shots) can rebuild it.

All tiles share base_h so they butt seamlessly; every component keeps its
own state and re-poses via components.set_value.
"""

import skeuo_kit as kit
from components.button import build_button
from components.fader import build_fader
from components.grille import build_grille
from components.knob import build_knob
from components.switch import build_switch


def build_demo_panel(panel_preset=None, base_h=2.5):
    bone, _ = kit.materials_for("bone")
    orange, orange_acc = kit.materials_for("orange")
    graphite, graphite_acc = kit.materials_for("graphite")
    grey, _ = kit.materials_for("grey")
    panel = kit.base_material_for(panel_preset, "bone")
    alu_bright = kit.metal_material("AluBright", rough=0.32)

    # row 1 (y center 21, depth 30): grille + knobs, large to small
    build_grille(name="Grille", width=36, depth=30, height=base_h,
                 margin=4.5, plate_material=panel,
                 backing_material=graphite, location=(-38, 21, 0))
    knob_specs = [
        (-9, 22, 7.0, 10.0, "orange", 0.15),
        (11, 18, 5.5, 8.0, "grey", 0.4),
        (29, 18, 5.5, 8.0, "graphite", 0.7),
        (47, 18, 4.0, 6.0, "orange", 0.95),
    ]
    for x, tile_w, r, h, preset_name, v in knob_specs:
        kb, ka = kit.materials_for(preset_name)
        build_knob(name=f"PKnob_{x}", radius=r, height=h, ribs=48,
                   value=v, base=(tile_w, 30), base_material=panel,
                   body_material=kb, accent_material=ka,
                   location=(x, 21, 0))

    # row 2 (y center -5, depth 22): fader + metal button + slide switch
    build_fader(name="PFader", base_w=74, base_d=22, slot_len=60,
                cap_shape="disc", ticks=9, value=0.65,
                plate_material=panel, cap_material=grey,
                well_material=graphite, tick_material=graphite,
                location=(-19, -5, 0))
    build_button(name="PMetal", shape_n=2.0, width=8.0, dome=0.05,
                 fillet=0.35, height=3.5, base_style="well", travel=0.5,
                 base_size=(22, 22), label="@plus",
                 label_material=graphite,
                 cap_material=alu_bright, base_material=panel,
                 location=(29, -5, 0))
    build_switch(name="PSwitch", base_w=16, base_d=22, base_h=base_h,
                 well_l=11, well_w=6, value=1.0, led=True,
                 plate_material=panel, pill_material=graphite,
                 led_material=orange, location=(48, -5, 0))

    # row 3 (y center -26, depth 20): wide transport keys + small keys
    transport = (("@rec", -46, orange, orange_acc),
                 ("@play", -26, bone, graphite),
                 ("@stop", -6, bone, graphite))
    for lab, x, cap, lab_mat in transport:
        build_button(name=f"PT{lab[1:]}", shape_n=4.5, width=16.0,
                     depth=11.0, height=3.2, dome=0.2, fillet=0.8,
                     base_size=(20, 20), cap_material=cap,
                     base_material=panel, label=lab,
                     label_material=lab_mat, location=(x, -26, 0))
    for i, x in enumerate((10.5, 23.5, 36.5, 49.5)):
        build_button(name=f"PKey_{i}", shape_n=4.5, width=9.0,
                     base_size=(13, 20), cap_material=bone,
                     base_material=panel, value=1.0 if i == 1 else 0.0,
                     label=str(i + 1), label_material=graphite,
                     location=(x, -26, 0))
