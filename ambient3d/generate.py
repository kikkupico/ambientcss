"""CLI entry point, run inside Blender:

    blender -b -P generate.py -- knob --preset orange
    blender -b -P generate.py -- button --shape square --preset cream
    blender -b -P generate.py -- fader --preset orange --pos 0.7
    blender -b -P generate.py -- grille
    blender -b -P generate.py -- lineup
    blender -b -P generate.py -- catalog

Outputs a .blend and a PNG render into out/.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy

import skeuo_kit as kit
import amb_params as ap
from components.knob import build_knob
from components.button import build_button
from components.fader import build_fader
from components.grille import build_grille
from components.slider import build_slider
from components.switch import build_switch
from components.panel import build_demo_panel


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="generate.py")
    p.add_argument("mode", choices=["knob", "button", "fader", "grille",
                                    "slider", "switch",
                                    "lineup", "catalog", "panel"])
    p.add_argument("--preset", default=None, choices=sorted(kit.PRESETS))
    # knob
    p.add_argument("--knob-style", choices=["classic", "opz", "op1", "wheel"],
                   default="classic")
    p.add_argument("--radius", type=float, default=6.0)
    p.add_argument("--height", type=float, default=9.0)
    p.add_argument("--ribs", type=int, default=48)
    p.add_argument("--rib-depth", type=float, default=0.22)
    p.add_argument("--rib-sharpness", type=float, default=1.4)
    p.add_argument("--taper", type=float, default=0.0)
    p.add_argument("--indicator", choices=["line", "dot", "none"],
                   default="line")
    p.add_argument("--no-indicator", dest="indicator", action="store_const",
                   const="none")
    p.add_argument("--top-disc", action="store_true")
    p.add_argument("--top-preset", default=None, choices=sorted(kit.PRESETS))
    # button
    p.add_argument("--shape", choices=["round", "square"], default="round")
    p.add_argument("--style", choices=["key", "pad", "metal"], default="key")
    p.add_argument("--width", type=float, default=9.0)
    p.add_argument("--depth", type=float, default=None,
                   help="cap depth in mm; default = --width (square/round)")
    p.add_argument("--cap-h", type=float, default=None,
                   help="cap height in mm (button/fader)")
    p.add_argument("--fillet", type=float, default=None,
                   help="edge round-over in mm (knob/button)")
    p.add_argument("--travel", type=float, default=None)
    p.add_argument("--dome", type=float, default=None)
    p.add_argument("--label", default=None,
                   help='printed text, or "@play" "@stop" "@rec" "@plus" "@minus"')
    # base tile (all components)
    p.add_argument("--base", type=float, nargs=2, default=None,
                   metavar=("W", "D"), help="tile footprint in mm")
    p.add_argument("--base-h", type=float, default=2.5,
                   help="tile thickness in mm")
    p.add_argument("--base-preset", default=None,
                   choices=sorted(kit.PRESETS) + ["alu"])
    # fader
    p.add_argument("--cap", choices=["pill", "disc"], default="pill")
    p.add_argument("--ticks", type=int, default=0)
    p.add_argument("--slot-len", type=float, default=36.0)
    p.add_argument("--slot-w", type=float, default=2.8)
    p.add_argument("--cap-w", type=float, default=11.0)
    p.add_argument("--cap-d", type=float, default=7.0)
    p.add_argument("--disc-d", type=float, default=8.5)
    # state (knob/button/fader); default depends on mode
    p.add_argument("--value", "--pos", dest="value", type=float, default=None)
    p.add_argument("--pressed", action="store_true")
    # grille
    p.add_argument("--hole-d", type=float, default=2.0)
    p.add_argument("--pitch", type=float, default=3.4)
    p.add_argument("--pattern", choices=["grid", "hex"], default="grid")
    p.add_argument("--margin", type=float, default=3.5)
    # switch
    p.add_argument("--led", action="store_true")
    # output
    p.add_argument("--out-dir", default=None)
    p.add_argument("--resolution", type=int, default=900)
    p.add_argument("--samples", type=int, default=96)
    # every mode also accepts the ambientcss vocabulary (--amb-light-x,
    # --amb-key-light-intensity, ...): when any is given, the studio's
    # three-point lights are replaced by the amb key/fill rig
    ap.add_argparse_group(p)
    return p.parse_args(argv)


materials_for = kit.materials_for
base_material_for = kit.base_material_for


def main():
    args = parse_args()
    root = os.path.dirname(os.path.abspath(__file__))
    out_dir = args.out_dir or os.path.join(root, "out")
    os.makedirs(out_dir, exist_ok=True)

    kit.reset_scene()
    alu = kit.metal_material("Aluminum")

    if args.mode == "knob":
        # style bundles from the reference photos; classic uses raw CLI flags
        styles = {
            "classic": dict(ribs=args.ribs, rib_depth=args.rib_depth,
                            rib_sharpness=args.rib_sharpness,
                            taper=args.taper, indicator=args.indicator,
                            top_disc=args.top_disc),
            "opz":     dict(ribs=14, rib_depth=0.7, rib_sharpness=8.0,
                            taper=0.1, fillet=1.0, indicator="dot",
                            dot_frac=0.32),
            "op1":     dict(ribs=64, rib_depth=0.15, indicator="none",
                            top_disc=True),
            "wheel":   dict(ribs=80, rib_depth=0.15, indicator="none",
                            fillet=0.8, chamfer=0.3),
        }
        style_presets = {"classic": "orange", "opz": "grey", "op1": "bone",
                         "wheel": None}
        preset = args.preset or style_presets[args.knob_style]
        if args.knob_style == "wheel" and args.preset is None:
            body = kit.metal_material("WheelAlu", rough=0.35)
            accent = None
            preset_name = "alu"
        else:
            body, accent = materials_for(preset)
            preset_name = preset
        if args.knob_style == "opz" and args.preset is None:
            accent, _ = materials_for("cobalt")
        top = None
        if args.top_preset or args.knob_style == "op1":
            top, _ = materials_for(args.top_preset or "orange")
        params = styles[args.knob_style]
        if args.fillet is not None:
            params["fillet"] = args.fillet
        base = tuple(args.base) if args.base else None
        build_knob(
            name=f"Knob_{preset_name}",
            radius=args.radius, height=args.height,
            value=args.value if args.value is not None else 0.33,
            body_material=body, accent_material=accent, top_material=top,
            base=base, base_h=args.base_h,
            base_material=base_material_for(args.base_preset, "bone"),
            **params,
        )
        extent = max(args.radius, args.height,
                     max(base) * 0.6 if base else 0)
        kit.setup_studio(center=(0, 0, args.height * 0.45), extent=extent * 1.1)
        stem = f"knob_{args.knob_style}_{preset_name}"

    elif args.mode == "button":
        shape_n = 2.0 if args.shape == "round" else 4.5
        value = 1.0 if args.pressed else (
            args.value if args.value is not None else 0.0)
        if args.style == "metal":  # TP-7: aluminum cap in machined pocket
            params = dict(shape_n=shape_n, dome=0.05, fillet=0.35,
                          height=3.5, width=min(args.width, 8.0),
                          base_style="well", travel=0.5)
            if args.preset:
                body, _ = materials_for(args.preset)
            else:
                body = kit.metal_material("ButtonAlu", rough=0.32)
            base_mat = base_material_for(args.base_preset, "alu")
            preset_name = args.preset or "alu"
        else:
            if args.style == "pad":  # EP-133: squarer, flatter, lower
                params = dict(shape_n=6.0, dome=0.15, height=3.6, fillet=0.6,
                              width=max(args.width, 11.0))
            else:
                params = dict(shape_n=shape_n, dome=0.5, width=args.width)
            preset_name = args.preset or "cream"
            body, _ = materials_for(preset_name)
            base_mat = base_material_for(args.base_preset, "graphite")
        if args.dome is not None:
            params["dome"] = args.dome
        if args.depth is not None:
            params["depth"] = args.depth
        if args.cap_h is not None:
            params["height"] = args.cap_h
        if args.fillet is not None:
            params["fillet"] = args.fillet
        if args.travel is not None:
            params["travel"] = args.travel
        if args.base:
            params["base_size"] = tuple(args.base)
        if args.style == "metal":
            label_mat, _ = materials_for("graphite")
        else:
            _, label_mat = materials_for(preset_name)
        build_button(
            name=f"Button_{preset_name}",
            value=value, label=args.label, label_material=label_mat,
            base_h=args.base_h,
            cap_material=body, base_material=base_mat,
            **params,
        )
        w = params["width"]
        d = params.get("depth") or w
        bs = params.get("base_size") or (w + 6, d + 6)
        kit.setup_studio(center=(0, 0, 2.2), extent=max(bs) * 0.8,
                         elevation=32)
        stem = f"button_{args.style}_{preset_name}"

    elif args.mode == "fader":
        preset = args.preset or "orange"
        body, accent = materials_for(preset)
        well, _ = materials_for("graphite")
        base_w, base_d = args.base or (48.0, 14.0)
        build_fader(
            name=f"Fader_{preset}",
            base_w=base_w, base_d=base_d, base_h=args.base_h,
            slot_len=args.slot_len, slot_w=args.slot_w,
            cap_shape=args.cap, cap_w=args.cap_w, cap_d=args.cap_d,
            cap_h=args.cap_h if args.cap_h is not None else 7.0,
            disc_d=args.disc_d, ticks=args.ticks,
            value=args.value if args.value is not None else 0.5,
            plate_material=base_material_for(args.base_preset, "alu"),
            cap_material=body, accent_material=accent,
            well_material=well, tick_material=well,
        )
        kit.setup_studio(center=(0, 0, 3.0), extent=max(base_w * 0.46, 14),
                         azimuth=22, elevation=38)
        stem = f"fader_{preset}"

    elif args.mode == "slider":
        preset = args.preset or "grey"
        body, _ = materials_for(preset)
        base_w, base_d = args.base or (48.0, 14.0)
        build_slider(
            name=f"Slider_{preset}",
            base_w=base_w, base_d=base_d, base_h=args.base_h,
            value=args.value if args.value is not None else 0.5,
            plate_material=base_material_for(args.base_preset, "bone"),
            thumb_material=body,
        )
        kit.setup_studio(center=(0, 0, 2.5), extent=max(base_w * 0.46, 14),
                         azimuth=22, elevation=38)
        stem = f"slider_{preset}"

    elif args.mode == "switch":
        preset = args.preset or "cream"
        body, _ = materials_for(preset)
        led_mat, _ = materials_for("orange")
        value = 1.0 if args.pressed else (
            args.value if args.value is not None else 0.0)
        build_switch(
            name=f"Switch_{preset}",
            value=value, led=args.led,
            plate_material=base_material_for(args.base_preset, "graphite"),
            pill_material=body, led_material=led_mat,
        )
        kit.setup_studio(center=(0, 0, 2.0), extent=16, azimuth=24,
                         elevation=40)
        stem = f"switch_{preset}"

    elif args.mode == "grille":
        dark, _ = materials_for("graphite")
        width, depth = args.base or (42.0, 28.0)
        build_grille(name="Grille", width=width, depth=depth,
                     height=args.base_h, margin=args.margin,
                     hole_d=args.hole_d, pitch=args.pitch,
                     pattern=args.pattern,
                     plate_material=base_material_for(args.base_preset, "alu"),
                     backing_material=dark)
        kit.setup_studio(center=(0, 0, 1.0), extent=max(width, depth) * 0.5,
                         azimuth=18, elevation=48)
        stem = "grille"

    elif args.mode == "lineup":
        variants = [
            ("graphite", dict(radius=7.5, height=10.5, ribs=64, value=0.0)),
            ("orange",   dict(radius=6.0, height=9.0,  ribs=48, value=0.25)),
            ("cream",    dict(radius=5.0, height=7.5,  ribs=0,  value=0.5)),
            ("grey",     dict(radius=4.5, height=11.0, ribs=36, rib_depth=0.3,
                              value=0.75)),
            ("cobalt",   dict(radius=6.5, height=6.0,  ribs=80, rib_depth=0.15,
                              value=1.0)),
        ]
        gap = 5.0
        widths = [2 * v[1]["radius"] for v in variants]
        total = sum(widths) + gap * (len(variants) - 1)
        x = -total / 2
        for preset_name, params in variants:
            body, accent = materials_for(preset_name)
            r = params["radius"]
            build_knob(
                name=f"Knob_{preset_name}",
                body_material=body, accent_material=accent,
                location=(x + r, 0, 0), **params,
            )
            x += 2 * r + gap
        kit.setup_studio(center=(0, 0, 4.5), extent=total * 0.40,
                         azimuth=8, elevation=16)
        stem = "knob_lineup"

    elif args.mode == "panel":
        # mock device, 112x72mm, butted tiles, mixed component sizes
        build_demo_panel(panel_preset=args.base_preset, base_h=args.base_h)
        kit.setup_studio(center=(0, -4, 1.5), extent=50, azimuth=8,
                         elevation=55)
        stem = "panel"

    else:  # catalog: one of everything, flat-lay, styled after the refs
        orange, orange_acc = materials_for("orange")
        graphite, graphite_acc = materials_for("graphite")
        bone, _ = materials_for("bone")
        cobalt, _ = materials_for("cobalt")
        grey, grey_acc = materials_for("grey")

        build_grille(name="Grille", plate_material=alu,
                     backing_material=graphite, location=(-17, 15, 0))
        # long TX-6-style fader: disc thumb, printed ticks
        build_fader(name="Fader", base_w=56, base_d=16, slot_len=44,
                    cap_shape="disc", ticks=7, value=0.7,
                    plate_material=alu, cap_material=grey,
                    well_material=graphite, tick_material=graphite,
                    location=(-22, -15, 0))
        # OP-1 field encoder: fine knurl, smooth orange top, endless
        build_knob(name="Knob_op1", radius=6.0, height=8.0, ribs=64,
                   rib_depth=0.15, indicator="none", top_disc=True,
                   value=0.65, body_material=bone, top_material=orange,
                   location=(12, 16, 0))
        # OP-Z-style: broad flutes, taper, cobalt dot
        build_knob(name="Knob_opz", radius=7.0, height=10.0, ribs=14,
                   rib_depth=0.7, rib_sharpness=8.0, taper=0.1,
                   fillet=1.0, indicator="dot", dot_frac=0.32, value=0.2,
                   body_material=grey, accent_material=cobalt,
                   location=(28, 16, 0))
        # small classic line knob
        build_knob(name="Knob_line", radius=4.0, height=6.0, ribs=36,
                   value=0.9, body_material=orange,
                   accent_material=orange_acc, location=(42, 15, 0))
        # TP-7 machined metal: small pocketed button + knurled wheel
        alu_bright = kit.metal_material("AluBright", rough=0.32)
        build_button(name="Button_metal", shape_n=2.0, width=7.5, dome=0.05,
                     fillet=0.35, height=3.5, base_style="well", travel=0.5,
                     cap_material=alu_bright, base_material=alu,
                     location=(15, 1.5, 0))
        build_knob(name="Knob_wheel", radius=4.5, height=6.0, ribs=80,
                   rib_depth=0.13, indicator="none", fillet=0.8, chamfer=0.3,
                   body_material=alu_bright, location=(46, 1, 0))
        # small round key, wide transport key, pressed pad — three sizes
        build_button(name="Button_key", shape_n=2.0, width=9.0,
                     label="@stop", label_material=graphite,
                     base_size=(15, 15), cap_material=bone,
                     base_material=graphite, location=(32, 0.5, 0))
        build_button(name="Button_wide", shape_n=4.5, width=20.0, depth=13.0,
                     height=3.2, dome=0.2, fillet=0.8, label="@play",
                     label_material=graphite, base_size=(26, 18),
                     cap_material=bone, base_material=graphite,
                     location=(22, -17, 0))
        build_button(name="Button_pad", shape_n=6.0, width=12.0, dome=0.15,
                     height=3.6, fillet=0.6, value=1.0, label="fx",
                     label_material=graphite_acc, base_size=(18, 18),
                     cap_material=graphite, base_material=grey,
                     location=(45, -17, 0))
        # slider + slide switch, the newest counterparts
        build_slider(name="Slider", base_w=44, base_d=13, value=0.7,
                     plate_material=alu, thumb_material=grey,
                     location=(8, -33, 0))
        build_switch(name="Switch", value=1.0, led=True,
                     plate_material=graphite, pill_material=bone,
                     led_material=orange, location=(41, -33, 0))
        kit.setup_studio(center=(2, -2, 1.5), extent=46, azimuth=12,
                         elevation=52)
        stem = "catalog"

    amb = ap.amb_from_args(args)
    if amb:
        for obj in list(bpy.context.scene.objects):
            if obj.type == "LIGHT":
                bpy.data.objects.remove(obj)
        ap.apply_lighting(amb)

    png = os.path.join(out_dir, stem + ".png")
    blend = os.path.join(out_dir, stem + ".blend")
    kit.setup_render(png, resolution=args.resolution, samples=args.samples)
    kit.render_and_save(png, blend_path=blend)
    print(f"WROTE {blend}")
    print(f"WROTE {png}")


main()
