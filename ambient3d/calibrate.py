"""Render the manifest's calibration scenes and sweeps, run inside Blender:

    blender -b -P calibrate.py -- --all
    blender -b -P calibrate.py -- --scene chamfer_default
    blender -b -P calibrate.py -- --sweep chamfer --samples 64

Writes renders/calib/<scene>.png and renders/sweeps/<sweep>/<axis>=<val>.png.
One Blender process renders every requested job (scene reset between jobs).
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import skeuo_kit as kit
import amb_params as ap
from amb_model import manifest_jobs
from components.plate import build_dome, build_groove, build_plate

ROOT = os.path.dirname(os.path.abspath(__file__))


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="calibrate.py")
    p.add_argument("--all", action="store_true")
    p.add_argument("--scene", action="append", default=[])
    p.add_argument("--sweep", action="append", default=[])
    p.add_argument("--samples", type=int, default=512)
    p.add_argument("--out-dir", default=os.path.join(ROOT, "renders"))
    return p.parse_args(argv)


def render_job(rel, amb_over, spec, manifest, args):
    a = ap.amb(**{k.replace("-", "_"): v for k, v in amb_over.items()})
    kit.reset_scene()
    plate_cfg = spec.get("geometry") or manifest["plate"]
    ground = ap.setup_calibration_rig(a, plate_size=tuple(plate_cfg["size"]))

    if spec["builder"] == "plate":
        chamfer_mm, fillet_mm = ap.edge_mm(a)
        build_plate(
            width=plate_cfg["size"][0], depth=plate_cfg["size"][1],
            thickness=ap.thickness_mm(a),
            chamfer=chamfer_mm, fillet=fillet_mm,
            surface=a["surface"],
            sagitta=ap.SAGITTA_MM if a["surface"] != "flat" else 0.0,
            location=(0, 0, ap.plate_z(a)),
            material=ap.material_for(a),
        )
    elif spec["builder"] == "dome":
        build_dome(radius=plate_cfg.get("radius", 20.0),
                   material=ap.material_for(a))
    elif spec["builder"] == "groove":
        build_groove(ground, width=plate_cfg["size"][0],
                     depth=plate_cfg["size"][1],
                     recess=ap.thickness_mm(a))
    else:
        raise ValueError(f"unknown builder '{spec['builder']}'")

    if a["emit"]:
        ap.enable_bloom()

    png = os.path.join(args.out_dir, rel)
    os.makedirs(os.path.dirname(png), exist_ok=True)
    kit.setup_render(png, resolution=ap.FRAME_MM * ap.PX_PER_MM,
                     samples=args.samples)
    ap.finalize_calibration_render(samples=args.samples)
    kit.render_and_save(png)
    print(f"WROTE {png}")


def main():
    args = parse_args()
    with open(os.path.join(ROOT, "manifest.json")) as fh:
        manifest = json.load(fh)

    todo = list(manifest_jobs(manifest, scenes=args.scene,
                              sweeps=args.sweep, all_jobs=args.all))
    if not todo:
        print("nothing to render: pass --all, --scene <id> or --sweep <id>")
        sys.exit(1)
    print(f"{len(todo)} render job(s)")
    for rel, amb_over, spec in todo:
        render_job(rel, amb_over, spec, manifest, args)


main()
