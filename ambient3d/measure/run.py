"""Measure every rendered manifest frame -> derived/measurements.json.

    python3 measure/run.py [--renders-dir renders] [--out derived/measurements.json]

Runs outside Blender (numpy + Pillow only). Iterates the same job list as
calibrate.py; frames that have not been rendered yet are skipped with a
warning so partial pipelines still produce usable output.
"""

import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from amb_model import amb, manifest_jobs
from measure.metrics import EXTRACTORS, load


def main():
    p = argparse.ArgumentParser(prog="measure/run.py")
    p.add_argument("--renders-dir", default=os.path.join(ROOT, "renders"))
    p.add_argument("--out",
                   default=os.path.join(ROOT, "derived", "measurements.json"))
    args = p.parse_args()

    with open(os.path.join(ROOT, "manifest.json")) as fh:
        manifest = json.load(fh)

    results = {}
    missing = 0
    for rel, amb_over, spec in manifest_jobs(manifest, all_jobs=True):
        path = os.path.join(args.renders_dir, rel)
        if not os.path.exists(path):
            print(f"SKIP (not rendered): {rel}", file=sys.stderr)
            missing += 1
            continue
        a = amb(**{k.replace("-", "_"): v for k, v in amb_over.items()})
        meta = {
            "amb": a,
            "plate": spec.get("geometry") or manifest["plate"],
            "pxPerMm": manifest["pxPerMm"],
            "frameMm": manifest["frameMm"],
        }
        img = load(path)
        entry = {"amb": a, "metrics": {}}
        for metric in spec["measure"]:
            entry["metrics"][metric] = EXTRACTORS[metric](img, meta)
        results[rel] = entry

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as fh:
        json.dump(results, fh, indent=2, sort_keys=True)
    print(f"WROTE {args.out} ({len(results)} frames, {missing} missing)")


if __name__ == "__main__":
    main()
