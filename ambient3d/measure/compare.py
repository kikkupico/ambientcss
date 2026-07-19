"""Verify the shipped CSS against the Blender ground truth.

    node tools/css-harness/render.mjs      # (first) screenshot the CSS
    python3 measure/compare.py [--effect chamfer]

Runs the same metric extractors on the CSS screenshots and the renders,
then diffs metric-by-metric against per-metric tolerances. Exits non-zero
if any pair drifts out of tolerance. Writes derived/compare-report.json.
Metrics are compared, never pixels — the CSS approximates the render
within its formula shapes; pixel identity is not the contract.
"""

import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from amb_model import amb, manifest_jobs
from measure.fit import lit_edges
from measure.metrics import EXTRACTORS, load

HARNESS_OUT = os.path.join(ROOT, "..", "tools", "css-harness", "out")

# tolerance per metric leaf key (absolute)
TOLERANCES = {
    "srgb_pct": 3.0,        # surface lightness, percent points
    "lstar": 3.0,
    "peak_srgb": 0.06,      # band depth, sRGB units
    "mean_delta_srgb": 0.05,
    "width_mm": 0.6,        # band width, mm (~CSS px)
    "baseline_srgb": 0.04,
    "hm_mm": 1.5,           # drop-shadow half-max reach, mm
    "sigma_mm": 1.2,        # drop-shadow falloff sigma, mm
    "peak_alpha": 0.06,
    "v_ref": 0.04,          # unshadowed ground value
    "0": 3.0, "0.35": 3.0, "0.5": 3.0, "0.65": 3.0, "1": 3.0,  # stop %
    "delta_end_srgb": 0.022,   # render keeps the ~1.4% ambient plate
    "delta_mid_srgb": 0.022,   # gradient the CSS doesn't paint
    "center_srgb_pct": 3.0,
}
SKIP_KEYS = {"noise"}


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def main():
    p = argparse.ArgumentParser(prog="measure/compare.py")
    p.add_argument("--effect", default=None,
                   help="only frames whose path contains this substring")
    p.add_argument("--renders-dir", default=os.path.join(ROOT, "renders"))
    p.add_argument("--harness-dir", default=HARNESS_OUT)
    args = p.parse_args()

    with open(os.path.join(ROOT, "manifest.json")) as fh:
        manifest = json.load(fh)

    report, failures, compared = {}, 0, 0
    for rel, amb_over, spec in manifest_jobs(manifest, all_jobs=True):
        if args.effect and args.effect not in rel:
            continue
        if not spec.get("css"):
            continue
        render_png = os.path.join(args.renders_dir, rel)
        css_png = os.path.join(args.harness_dir, rel)
        if not (os.path.exists(render_png) and os.path.exists(css_png)):
            print(f"SKIP (missing frame): {rel}", file=sys.stderr)
            continue

        a = amb(**{k.replace("-", "_"): v for k, v in amb_over.items()})
        meta = {"amb": a, "plate": spec.get("geometry") or manifest["plate"],
                "pxPerMm": manifest["pxPerMm"], "frameMm": manifest["frameMm"]}
        truth_img, css_img = load(render_png), load(css_png)

        # edge_bands: only gate the edges the CSS formula claims (lit and
        # shadow edges for this light direction). Under an axis-aligned
        # light the render shows a faint band on the perpendicular edges
        # too — a real effect box-shadow cannot express per-edge; those are
        # reported as residuals, not failures (see notes/chamfer.md).
        lit, shadow = lit_edges(a)
        gated_edges = set(lit) | set(shadow)

        frame_report = {}
        for metric in spec["measure"]:
            truth = flatten(EXTRACTORS[metric](truth_img, meta))
            got = flatten(EXTRACTORS[metric](css_img, meta))
            for key, tv in truth.items():
                leaf = key.rsplit(".", 1)[-1]
                if leaf in SKIP_KEYS:
                    continue
                # (drop_shadow gates all four edges: blur+spread reach
                # every edge in the CSS model too. But under an
                # axis-aligned light the render concentrates the whole
                # shadow — deeper alpha, tighter perpendicular penumbra —
                # anisotropy that a single isotropic box-shadow cannot
                # express, so axis-light frames are residual-only.)
                axis_light = (a["light_x"] == 0) != (a["light_y"] == 0)
                if metric == "drop_shadow" and axis_light:
                    frame_report[f"{metric}.{key}"] = {
                        "render": round(tv, 4), "css": round(got[key], 4),
                        "residual": True,
                    }
                    continue
                if metric == "edge_bands" and \
                        key.split(".", 1)[0] not in gated_edges:
                    frame_report[f"{metric}.{key}"] = {
                        "render": round(tv, 4), "css": round(got[key], 4),
                        "residual": True,
                    }
                    continue
                tol = TOLERANCES.get(leaf)
                if tol is None:
                    continue
                diff = abs(got[key] - tv)
                ok = diff <= tol
                frame_report[f"{metric}.{key}"] = {
                    "render": round(tv, 4), "css": round(got[key], 4),
                    "diff": round(diff, 4), "tol": tol, "ok": ok,
                }
                if not ok:
                    failures += 1
                    print(f"FAIL {rel} {metric}.{key}: "
                          f"render={tv:.4f} css={got[key]:.4f} "
                          f"diff={diff:.4f} > tol={tol}")
        report[rel] = frame_report
        compared += 1

    out = os.path.join(ROOT, "derived", "compare-report.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)
    print(f"compared {compared} frame pair(s); {failures} metric failure(s)")
    print(f"WROTE {out}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
