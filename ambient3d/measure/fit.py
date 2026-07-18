"""Fit CSS formula coefficients from derived/measurements.json.

    python3 measure/fit.py

Per-effect models keep the exact shape of the ambient.css formulas — the
fit only produces their coefficients. Writes derived/coefficients.json and
a human-readable derived/notes/<effect>.md per effect with the model, the
fitted values, R² and residuals. The engineer transcribes the coefficients
into packages/ambient-css/src/ambient.css by hand; measure/compare.py then
verifies the shipped CSS against the renders.
"""

import json
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


def load_measurements():
    with open(os.path.join(ROOT, "derived", "measurements.json")) as fh:
        return json.load(fh)


def r2(y, pred):
    y, pred = np.asarray(y), np.asarray(pred)
    ss_res = ((y - pred) ** 2).sum()
    ss_tot = ((y - y.mean()) ** 2).sum()
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 1.0


# ---------------------------------------------------------------- surface ---

def fit_surface(m):
    """Model (shape of .amb-surface): L% = k * Ik + f * If + floor.
    Physically both lights brighten the surface; the old formula's Ik-only
    proportionality is the special case f = floor = 0. Fit jointly over the
    key-intensity and fill-intensity sweeps."""
    pts = []
    for rel, entry in m.items():
        if rel.startswith("sweeps/surface/"):
            a = entry["amb"]
            pts.append((a["key_light_intensity"], a["fill_light_intensity"],
                        entry["metrics"]["surface_lightness"]["srgb_pct"]))
    pts.sort()
    A = np.array([[p[0], p[1], 1.0] for p in pts])
    L = np.array([p[2] for p in pts])
    (k, f, floor), *_ = np.linalg.lstsq(A, L, rcond=None)
    pred = A @ [k, f, floor]
    return {
        "model": "L% = k * key_intensity + f * fill_intensity + floor",
        "k_pct": round(float(k), 2),
        "f_pct": round(float(f), 2),
        "floor_pct": round(float(floor), 2),
        "r2": round(r2(L, pred), 5),
        "max_resid_pct": round(float(np.abs(L - pred).max()), 3),
        "samples": [[float(a), float(b), round(float(c), 2)]
                    for a, b, c in pts],
    }


# ---------------------------------------------------------------- chamfer ---

def lit_edges(a):
    """Edges carrying the highlight band for a light direction, and the
    opposite (shadow) edges — mirrors the CSS inset-offset behavior where
    only the axes with a nonzero light component get bands."""
    lx, ly = a["light_x"], a["light_y"]
    lit, shadow = [], []
    if lx < 0:
        lit.append("left"); shadow.append("right")
    elif lx > 0:
        lit.append("right"); shadow.append("left")
    if ly < 0:
        lit.append("top"); shadow.append("bottom")
    elif ly > 0:
        lit.append("bottom"); shadow.append("top")
    return lit, shadow


def band_alphas(entry):
    """Measured band -> equivalent CSS overlay alphas.
    Highlight (white over base): a = dv / (1 - base).
    Shadow (black over base):    a = -dv / base."""
    a = entry["amb"]
    bands = entry["metrics"]["edge_bands"]
    lit, shadow = lit_edges(a)
    out = []
    for e in lit:
        b = bands[e]
        if b["baseline_srgb"] < 0.999:
            out.append(("hl", b["mean_delta_srgb"] / (1 - b["baseline_srgb"]),
                        b["width_mm"], a))
    for e in shadow:
        b = bands[e]
        if b["baseline_srgb"] > 0.001:
            out.append(("sh", -b["mean_delta_srgb"] / b["baseline_srgb"],
                        b["width_mm"], a))
    return out


def fit_chamfer(m):
    """Models (shape of the .ambient chamfer layers, affine: a tilted face
    keeps a residual band even at Ik = If, which the render exposes):
    highlight alpha = p * key_light_intensity + pf * fill_light_intensity + p0
    shadow alpha    = q * (key_light_intensity - fill_light_intensity) + q0
    band offset     = w px per chamfer_width unit."""
    hl, sh, widths = [], [], {}
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/chamfer/") or
                rel == "calib/chamfer_default.png"):
            continue
        for kind, alpha, width_mm, a in band_alphas(entry):
            cw = a["chamfer_width"]
            widths.setdefault(cw, []).append(width_mm)
            if kind == "hl":
                hl.append((a["key_light_intensity"],
                           a["fill_light_intensity"], alpha))
            else:
                sh.append((a["key_light_intensity"] -
                           a["fill_light_intensity"], alpha))

    hX = np.array([[v[0], v[1], 1.0] for v in hl])
    hy = np.array([v[2] for v in hl])
    (p, pf, p0), *_ = np.linalg.lstsq(hX, hy, rcond=None)
    p, pf, p0 = float(p), float(pf), float(p0)
    sx = np.array([v[0] for v in sh]); sy = np.array([v[1] for v in sh])
    q, q0 = (float(v) for v in np.polyfit(sx, sy, 1))

    width_table = {f"{cw:g}": round(float(np.mean(ws)), 3)
                   for cw, ws in sorted(widths.items())}
    cws = np.array([float(k) for k in width_table])
    wms = np.array(list(width_table.values()))
    # geometric band grows 1 mm per chamfer_width unit; the half-max
    # measurement clips a constant ~0.25 mm of AA — fit the slope only
    w_px = float(np.polyfit(cws, wms, 1)[0]) if len(cws) > 1 else 1.0

    return {
        "model": ("hl_alpha = p * Ik + pf * If + p0; "
                  "sh_alpha = q * (Ik - If) + q0; "
                  "offset_px = w * chamfer_width"),
        "p_highlight_per_key": round(p, 3),
        "pf_highlight_per_fill": round(pf, 3),
        "p0_highlight": round(p0, 3),
        "q_shadow_per_contrast": round(q, 3),
        "q0_shadow": round(q0, 3),
        "w_px_per_width": round(w_px, 3),
        "r2_highlight": round(r2(hy, hX @ [p, pf, p0]), 4),
        "r2_shadow": round(r2(sy, q * sx + q0), 4),
        "n_highlight_samples": len(hl),
        "n_shadow_samples": len(sh),
        "width_mm_by_chamfer_width": width_table,
    }


# ------------------------------------------------------------------- main ---

FITTERS = {"surface": fit_surface, "chamfer": fit_chamfer}


def write_note(effect, coeffs):
    lines = [f"# {effect} — grounded fit", "",
             f"Model: `{coeffs['model']}`", ""]
    for key, val in coeffs.items():
        if key == "model":
            continue
        lines.append(f"- **{key}**: `{json.dumps(val)}`")
    lines.append("")
    path = os.path.join(ROOT, "derived", "notes", f"{effect}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write("\n".join(lines))


def main():
    m = load_measurements()
    out_path = os.path.join(ROOT, "derived", "coefficients.json")
    coeffs = {}
    if os.path.exists(out_path):
        with open(out_path) as fh:
            coeffs = json.load(fh)
    for effect, fitter in FITTERS.items():
        coeffs[effect] = fitter(m)
        write_note(effect, coeffs[effect])
        print(f"{effect}: {json.dumps(coeffs[effect], indent=2)}")
    with open(out_path, "w") as fh:
        json.dump(coeffs, fh, indent=2, sort_keys=True)
    print(f"WROTE {out_path}")


if __name__ == "__main__":
    main()
