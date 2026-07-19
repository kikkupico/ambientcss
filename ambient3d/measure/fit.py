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
    return _fit_edge_effect(m, "chamfer")


def fit_fillet(m):
    return _fit_edge_effect(m, "fillet")


def _fit_edge_effect(m, effect):
    """Models (shape of the .ambient chamfer/fillet layers, affine: a
    curved or tilted face keeps a residual band even at Ik = If, and the
    highlight rides the fill light too — the render exposes both):
    highlight alpha = p * key_light_intensity + pf * fill_light_intensity + p0
    shadow alpha    = q * (key_light_intensity - fill_light_intensity) + q0
    band offset     = w px per width unit."""
    hl, sh, widths = [], [], {}
    for rel, entry in m.items():
        if not (rel.startswith(f"sweeps/{effect}/") or
                rel == f"calib/{effect}_default.png"):
            continue
        for kind, alpha, width_mm, a in band_alphas(entry):
            cw = a[f"{effect}_width"]
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
    # the geometric band grows linearly per width unit; the half-max
    # measurement clips a constant ~0.25 mm of AA — fit the slope only
    w_px = float(np.polyfit(cws, wms, 1)[0]) if len(cws) > 1 else 1.0

    return {
        "model": ("hl_alpha = p * Ik + pf * If + p0; "
                  "sh_alpha = q * (Ik - If) + q0; "
                  "offset_px = w * width"),
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


# ----------------------------------------------------- curved surfaces ---

def fit_curved(m):
    """Joint model for concave / concave-h / convex (shape of the CSS
    5-stop gradients): the half-difference between the far and near stop
    is affine in light contrast, delta_end = K * (Ik - If) + K0, with the
    35/65% stops at a fixed ratio of it. The gradient runs along the axis
    of the corresponding light component (y; x for -h) and flips sign for
    convex."""
    ends, mids = [], []
    for rel, entry in m.items():
        if not any(rel.startswith(f"sweeps/{s}/") or
                   rel == f"calib/surface_{s.replace('-', '_')}_default.png"
                   for s in ("concave", "concave_h", "convex")):
            continue
        a = entry["amb"]
        variant = a["surface"]
        comp = a["light_x"] if variant == "concave-h" else a["light_y"]
        if comp == 0:
            continue                    # CSS predicts flat; validated in compare
        g = entry["metrics"]["surface_gradient"]
        # far-minus-near along +axis; CSS concave predicts -comp * delta.
        # The plate-wide irradiance gradient (lit side slightly closer to
        # the light) contaminates the measurement with opposite signs for
        # concave vs convex after normalization, so it gets its own
        # separable column g_sign and is excluded from the CSS model.
        sign = comp if variant == "convex" else -comp
        g_sign = 1.0 if variant == "convex" else -1.0
        c = a["key_light_intensity"] - a["fill_light_intensity"]
        ends.append((c, g_sign, g["delta_end_srgb"] / sign))
        mids.append((c, g_sign, g["delta_mid_srgb"] / sign))

    eX = np.array([[v[0], 1.0, v[1]] for v in ends])
    ey = np.array([v[2] for v in ends])
    (K, K0, G), *_ = np.linalg.lstsq(eX, ey, rcond=None)
    my = np.array([v[2] for v in mids])
    dish = ey - G * eX[:, 2]            # ambient-gradient-corrected
    mid_dish = my - G * 0.45 * eX[:, 2]
    mid_ratio = float((mid_dish * dish).sum() / (dish * dish).sum())
    return {
        "model": ("delta_end = K * (Ik - If) + K0 (sRGB, signed by the "
                  "light component along the gradient axis; convex "
                  "flipped); delta_mid = mid_ratio * delta_end; ambient "
                  "plate gradient G separated out, not part of the CSS"),
        "K_per_contrast_pct": round(float(K) * 100, 2),
        "K0_pct": round(float(K0) * 100, 2),
        "G_ambient_pct": round(float(G) * 100, 2),
        "mid_ratio": round(mid_ratio, 3),
        "r2_end": round(r2(ey, eX @ [K, K0, G]), 4),
        "n_samples": len(ends),
    }


def fit_darker(m):
    """Same affine surface model as .amb-surface, fit on the dark plate."""
    pts = []
    for rel, entry in m.items():
        if (rel.startswith("sweeps/darker/") or
                rel == "calib/surface_darker_default.png"):
            a = entry["amb"]
            pts.append((a["key_light_intensity"], a["fill_light_intensity"],
                        entry["metrics"]["surface_lightness"]["srgb_pct"]))
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
    }


# -------------------------------------------------------------- elevation ---

def shadow_components(a):
    """Per-edge fraction of the drop-shadow displacement pointing at that
    edge: the CSS offset is (-lx, -ly) * elevation * A."""
    lx, ly = a["light_x"], a["light_y"]
    return {"left": max(0.0, lx), "right": max(0.0, -lx),
            "top": max(0.0, ly), "bottom": max(0.0, -ly)}


def fit_shadow(m):
    """Unified drop-shadow model over the silhouette height
    h = 8 * elevation + 4.5 * thickness (mm = CSS px): a thick slab at
    rest casts the same family of shadow as a thin sheet elevated.
    Shapes of the .ambient drop-shadow layer:
    per-axis offset = A * h (px, opposite the light component)
    blur            = B * h (CSS blur radius = 2 * Gaussian sigma)
    spread          = C (constant: penumbra keeps the half-max pinned
                         a fixed distance past the silhouette boundary)
    alpha           = D * (Ik - If) + De * elevation + D0
    Alpha decays with ELEVATION only: an elevated sheet lets fill light
    wash under it, but a resting slab's walls block that light, so
    thickness pins the contact shadow at full depth (measured: alpha
    ~0.36 for t1 and t2 at rest alike). Residual: axis-aligned lights
    concentrate the displacement on one axis and read ~0.13 deeper than
    diagonal ones — inexpressible in a single shadow alpha."""
    import amb_model

    rows, hms, sigmas, alphas = [], [], [], []
    for rel, entry in m.items():
        if not (rel.startswith(("sweeps/elevation/", "sweeps/thickness/")) or
                rel in ("calib/elevation_default.png",
                        "calib/thickness_default.png")):
            continue
        a = entry["amb"]
        h = amb_model.silhouette_mm(a)
        if h < 1.0:
            continue                    # sheet at rest: no visible shadow
        # signed displacement component toward each edge: positive on the
        # shadow side, zero on perpendicular edges, negative on the lit
        # side. Lit edges are excluded — the shadow vacates them entirely
        # (reach clamps at zero, which a linear fit cannot express).
        lx, ly = a["light_x"], a["light_y"]
        signed = {"left": lx, "right": -lx, "top": ly, "bottom": -ly}
        peak_frame = 0.0
        for edge, d in entry["metrics"]["drop_shadow"].items():
            if signed[edge] < 0:
                continue
            rows.append([h * signed[edge], 1.0])
            hms.append(d["hm_mm"])
            if signed[edge] == max(signed.values()) and d["sigma_mm"] > 0:
                sigmas.append((h, d["sigma_mm"]))
            peak_frame = max(peak_frame, d["peak_alpha"])
        alphas.append((a["key_light_intensity"] - a["fill_light_intensity"],
                       a["elevation"], peak_frame))

    R = np.array(rows); H = np.array(hms)
    (A, C), *_ = np.linalg.lstsq(R, H, rcond=None)
    se = np.array([s[0] for s in sigmas]); sv = np.array([s[1] for s in sigmas])
    B_sigma = float((se * sv).sum() / (se * se).sum())
    aX = np.array([[v[0], v[1], 1.0] for v in alphas])
    ay = np.array([v[2] for v in alphas])
    (D, De, D0), *_ = np.linalg.lstsq(aX, ay, rcond=None)
    return {
        "model": ("h = 8*elevation + 4.5*thickness; "
                  "offset_px = A * h per light component; "
                  "css_blur = 2 * sigma = B * h; spread = C const; "
                  "alpha = D * (Ik - If) + De * elevation + D0"),
        "A_offset_px_per_mm": round(float(A), 4),
        "B_css_blur_px_per_mm": round(2 * B_sigma, 4),
        "C_spread_px": round(float(C), 3),
        "D_alpha_per_contrast": round(float(D), 3),
        "De_alpha_per_level": round(float(De), 4),
        "D0_alpha": round(float(D0), 3),
        "r2_reach": round(r2(H, R @ [A, C]), 4),
        "r2_alpha": round(r2(ay, aX @ [D, De, D0]), 4),
        "n_edges": len(rows),
    }


# ------------------------------------------------------------------- main ---

FITTERS = {"surface": fit_surface, "chamfer": fit_chamfer,
           "fillet": fit_fillet, "shadow": fit_shadow,
           "curved": fit_curved, "darker": fit_darker}


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
