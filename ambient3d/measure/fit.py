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
                rel.startswith(f"sweeps/{effect}_w2/") or
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
    """Swept-silhouette drop shadow, TWO stacked box-shadow layers.

    The umbra is the silhouette projection swept from the body's bottom
    (elevation) to its top (elevation + thickness). At rest that is the
    chevron hugging the shadow-side edges with a mitred corner; elevated,
    it detaches into the blurred offset square. The CSS approximates the
    sweep with two layers:

    far (top silhouette, h = 8*elevation + 4.5*thickness):
      per-axis offset = A * h; blur = B * h; spread = C const;
      alpha_far = D * (Ik - If) + De * elevation + D0
    mid (body mid-height, hm = 8*elevation + 2.25*thickness, gated on
    thickness — a sheet has no body and keeps a single layer):
      per-axis offset = A * hm; blur = B * hm; no spread;
      alpha_mid = E * (Ik - If) + F * thickness + G

    Stacked translated squares cannot reproduce the sweep's uniform
    alpha (overlaps compound), so per slab frame the two alphas are
    BALANCED: the deep-zone composite 1-(1-af)(1-am) tracks the measured
    peak while the lit-corner contact (hug lit third, per-layer lateral
    coverage c = 1 - offset/third_len, af*cf + am*cm - af*am*cf) tracks
    the render's hug — errors weighted by the compare gate's tolerances.
    Sheets have no body: their far alpha is the measured peak directly,
    which is why alpha_far carries a thickness term. Residual:
    axis-aligned lights concentrate the displacement on one axis and
    read deeper than diagonal ones — inexpressible in a single shadow
    alpha."""
    import amb_model

    rows, hms, sigmas = [], [], []
    far_rows, mid_rows = [], []
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
            if edge in ("corner", "hug") or signed[edge] < 0:
                continue
            rows.append([h * signed[edge], 1.0])
            hms.append(d["hm_mm"])
            if signed[edge] == max(signed.values()) and d["sigma_mm"] > 0:
                sigmas.append((h, d["sigma_mm"]))
            peak_frame = max(peak_frame, d["peak_alpha"])
        contrast = (a["key_light_intensity"] - a["fill_light_intensity"])
        e, t = a["elevation"], a["thickness"]
        if t < 1:
            far_rows.append((contrast, e, t, peak_frame))
        elif abs(lx) == 1 and abs(ly) == 1:
            hug = entry["metrics"]["drop_shadow"].get("hug") or {}
            lit = (float(np.mean([v["lit_third"] for v in hug.values()]))
                   if hug else None)
            mid_rows.append((contrast, e, t, peak_frame, lit))

    R = np.array(rows); H = np.array(hms)
    (A, C), *_ = np.linalg.lstsq(R, H, rcond=None)
    se = np.array([s[0] for s in sigmas]); sv = np.array([s[1] for s in sigmas])
    B_sigma = float((se * sv).sum() / (se * se).sum())

    # balance the far and shared-body alphas per slab frame for the
    # 4-layer sweep (far + three body layers at 1/4, 1/2, 3/4 height):
    # grid search, errors weighted by the compare tolerances (peak 0.06,
    # hug 0.10), plus a light pull of the far-only zone toward the
    # measured flat profile
    far_fit, mid_fit = list(far_rows), []
    grid = np.arange(0.0, 0.601, 0.005)
    third = 40.0 / 3                # shadow scenes render the 40 mm plate
    for contrast, e, t, peak, lit in mid_rows:
        cf = max(0.0, 1.0 - float(A) * (8 * e + 4.5 * t) / third)
        cbody = [max(0.0, 1.0 - float(A) * (8 * e + f * 4.5 * t) / third)
                 for f in (0.25, 0.5, 0.75)]
        af_g, am_g = np.meshgrid(grid, grid, indexing="ij")
        deep = 1.0 - (1.0 - af_g) * (1.0 - am_g) ** 3
        err = ((deep - peak) / 0.06) ** 2 + 0.3 * ((af_g - peak) / 0.06) ** 2
        if lit is not None:
            hug_css = 1.0 - (1.0 - af_g * cf)
            for c in cbody:
                hug_css = hug_css + (1.0 - hug_css) * am_g * c
            err = err + ((hug_css - lit) / 0.10) ** 2
        i, j = np.unravel_index(np.argmin(err), err.shape)
        far_fit.append((contrast, e, t, float(grid[i])))
        mid_fit.append((contrast, t, float(grid[j])))

    fX = np.array([[v[0], v[1], v[2], 1.0] for v in far_fit])
    fy = np.array([v[3] for v in far_fit])
    (D, De, Dt, D0), *_ = np.linalg.lstsq(fX, fy, rcond=None)
    mX = np.array([[v[0], v[1], 1.0] for v in mid_fit])
    my = np.array([v[2] for v in mid_fit])
    (E, F, G), *_ = np.linalg.lstsq(mX, my, rcond=None)

    return {
        "model": ("4-layer sweep. far: h = 8*elevation + 4.5*thickness, "
                  "offset = A*h, blur = B*h, spread = C, "
                  "alpha = D*(Ik-If) + De*elevation + Dt*thickness + D0; "
                  "three body layers (thickness-gated) at 1/4, 1/2, 3/4 "
                  "of body height, same A/B scaling, shared "
                  "alpha = E*(Ik-If) + F*thickness + G; layers composite "
                  "multiplicatively (the stack IS the outward fade)"),
        "A_offset_px_per_mm": round(float(A), 4),
        "B_css_blur_px_per_mm": round(2 * B_sigma, 4),
        "C_spread_px": round(float(C), 3),
        "D_alpha_per_contrast": round(float(D), 3),
        "De_alpha_per_level": round(float(De), 4),
        "Dt_alpha_per_level": round(float(Dt), 4),
        "D0_alpha": round(float(D0), 3),
        "E_mid_alpha_per_contrast": round(float(E), 3),
        "F_mid_alpha_per_thickness": round(float(F), 4),
        "G_mid_alpha": round(float(G), 3),
        "r2_reach": round(r2(H, R @ [A, C]), 4),
        "r2_alpha_far": round(r2(fy, fX @ [D, De, Dt, D0]), 4),
        "r2_alpha_mid": round(r2(my, mX @ [E, F, G]), 4),
        "n_edges": len(rows),
        "n_balanced_frames": len(mid_fit),
    }


# ---------------------------------------------------------------- groove ---

def fit_groove(m):
    """Recessed groove (shape of the .amb-groove class): the floor is
    affine in both light intensities like every surface; the lit walls
    cast a crisp shadow band whose reach scales with the recess depth
    (thickness levels, 4.5 mm each) exactly like the drop shadow's
    projection; the far walls bounce the key onto the floor beside them
    as a soft brightening — the physical inset-highlight."""
    import amb_model

    floor_rows, sh_alpha, sh_reach, sh_sigma = [], [], [], []
    bn_alpha, bn_reach, bn_sigma = [], [], []
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/groove/") or
                rel == "calib/groove_default.png"):
            continue
        a = entry["amb"]
        g = entry["metrics"]["groove"]
        ik, if_ = a["key_light_intensity"], a["fill_light_intensity"]
        floor_rows.append((ik, if_, g["floor_srgb_pct"]))
        recess = amb_model.thickness_mm(a)
        floor_v = g["floor_srgb_pct"] / 100.0
        for d in g["edges"].values():
            if d["peak_alpha"] == 0.0:
                continue
            if d["kind"] == "shadow":
                sh_alpha.append((ik - if_, d["peak_alpha"]))
                sh_reach.append((recess, d["hm_mm"]))
                sh_sigma.append((recess, d["sigma_mm"]))
            else:
                # the profile alpha (1 - v/floor) of a WHITE overlay of
                # opacity a is -a * (1 - floor) / floor: convert to the
                # overlay alpha the CSS paints with
                a_css = -d["peak_alpha"] * floor_v / (1.0 - floor_v)
                bn_alpha.append((ik, if_, min(1.0, a_css)))
                bn_reach.append((recess, d["hm_mm"]))
                bn_sigma.append((recess, d["sigma_mm"]))

    A = np.array([[p[0], p[1], 1.0] for p in floor_rows])
    L = np.array([p[2] for p in floor_rows])
    (gk, gf, g0), *_ = np.linalg.lstsq(A, L, rcond=None)

    def line1(pairs):
        x = np.array([p[0] for p in pairs]); y = np.array([p[1] for p in pairs])
        (a1, a0), *_ = np.linalg.lstsq(
            np.stack([x, np.ones_like(x)], axis=1), y, rcond=None)
        return float(a1), float(a0), r2(y, a1 * x + a0)

    def slope(pairs):
        x = np.array([p[0] for p in pairs]); y = np.array([p[1] for p in pairs])
        return float((x * y).sum() / (x * x).sum())

    sa, sa0, sa_r2 = line1(sh_alpha)
    bX = np.array([[p[0], p[1], 1.0] for p in bn_alpha])
    by = np.array([p[2] for p in bn_alpha])
    (ba, bf, b0), *_ = np.linalg.lstsq(bX, by, rcond=None)
    br, br0, _ = line1(bn_reach)
    return {
        "model": ("floor L% = gk * Ik + gf * If + g0; recess = 4.5mm * "
                  "thickness; wall shadow: reach = Ws * recess per light "
                  "component, css_blur = Bs * recess, alpha = "
                  "sa * (Ik - If) + sa0; far-wall bounce (white overlay): "
                  "reach = Wb * recess + Wb0, css_blur = Bb * recess, "
                  "alpha = ba * Ik + bf * If + b0, clamped to [0, 1]"),
        "gk_pct": round(float(gk), 2),
        "gf_pct": round(float(gf), 2),
        "g0_pct": round(float(g0), 2),
        "r2_floor": round(r2(L, A @ [gk, gf, g0]), 4),
        "Ws_reach_per_mm": round(slope(sh_reach), 4),
        "Bs_css_blur_per_mm": round(2 * float(np.mean(
            [s[1] / s[0] for s in sh_sigma])), 4),
        "sa_alpha_per_contrast": round(sa, 3),
        "sa0_alpha": round(sa0, 3),
        "r2_shadow_alpha": round(sa_r2, 4),
        "Wb_reach_per_mm": round(br, 4),
        "Wb0_reach_mm": round(br0, 3),
        "Bb_css_blur_per_mm": round(2 * float(np.mean(
            [s[1] / s[0] for s in bn_sigma])), 4),
        "ba_alpha_per_key": round(float(ba), 3),
        "bf_alpha_per_fill": round(float(bf), 3),
        "b0_alpha": round(float(b0), 3),
        "r2_bounce_alpha": round(r2(by, bX @ [ba, bf, b0]), 4),
        "n_floor": len(floor_rows),
        "n_shadow_bands": len(sh_alpha),
        "n_bounce_bands": len(bn_alpha),
    }


# ------------------------------------------------------------ shiny/glow ---

def fit_shiny(m):
    """Specular band on the glossy half-cylinder, matte reference
    subtracted per matching frame: band center position and width as
    fractions from the lit edge, and peak excess affine in key
    intensity. Grounds the .amb-mat-shiny band geometry."""
    pos, wid, peaks, rims = [], [], [], []
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/shiny/") or
                rel == "calib/mat_shiny_default.png"):
            continue
        ref_rel = (rel.replace("sweeps/shiny/", "sweeps/shiny_ref/")
                   if rel.startswith("sweeps/")
                   else "calib/mat_shiny_matte_ref.png")
        if ref_rel not in m:
            continue
        a = entry["amb"]
        from measure.metrics import shiny_features

        prof = np.array(entry["metrics"]["cyl_profile"]["profile_srgb"])
        ref = np.array(m[ref_rel]["metrics"]["cyl_profile"]["profile_srgb"])
        if prof.max() >= 0.995:
            continue        # saturated: band unlocatable
        feat = shiny_features(prof - ref)
        ik = a["key_light_intensity"]
        rims.append((ik, feat["rim_peak_srgb"]))
        if feat["band_peak_srgb"] >= 0.02:
            pos.append(feat["band_pos_frac"])
            wid.append(feat["band_fwhm_frac"])
            peaks.append((ik, feat["band_peak_srgb"]))

    px = np.array([v[0] for v in peaks]); py = np.array([v[1] for v in peaks])
    (s, s0), *_ = np.linalg.lstsq(np.stack([px, np.ones_like(px)], axis=1),
                                  py, rcond=None)
    rx = np.array([v[0] for v in rims]); ry = np.array([v[1] for v in rims])
    (rc, r0), *_ = np.linalg.lstsq(np.stack([rx, np.ones_like(rx)], axis=1),
                                   ry, rcond=None)
    return {
        "model": ("two specular features: grazing Fresnel RIM at the lit "
                  "edge, rim = rc * Ik + r0; key MIRROR band centered at "
                  "pos_frac, fwhm_frac wide, peak = s * Ik + s0 (sRGB)"),
        "pos_frac": round(float(np.mean(pos)), 3),
        "pos_frac_std": round(float(np.std(pos)), 3),
        "fwhm_frac": round(float(np.mean(wid)), 3),
        "s_peak_per_key": round(float(s), 3),
        "s0_peak": round(float(s0), 3),
        "rc_rim_per_key": round(float(rc), 3),
        "r0_rim": round(float(r0), 3),
        "r2_band": round(r2(py, s * px + s0), 4),
        "r2_rim": round(r2(ry, rc * rx + r0), 4),
        "n_band_samples": len(pos),
        "n_rim_samples": len(rims),
    }


def fit_glow(m):
    """Emissive halo: CSS blur = 2 * sigma; edge alpha affine in key
    intensity (the halo pops as the room dims)."""
    sig, alphas = [], []
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/emit/") or
                rel == "calib/emit_default.png"):
            continue
        g = entry["metrics"]["glow"]
        if g["edge_alpha"] <= 0:
            continue
        sig.append(g["sigma_mm"])
        alphas.append((entry["amb"]["key_light_intensity"], g["edge_alpha"]))
    ax = np.array([v[0] for v in alphas]); ay = np.array([v[1] for v in alphas])
    (ga, g0), *_ = np.linalg.lstsq(np.stack([ax, np.ones_like(ax)], axis=1),
                                   ay, rcond=None)
    return {
        "model": "css_blur = 2 * sigma; edge_alpha = ga * Ik + g0",
        "css_blur_px": round(2 * float(np.mean(sig)), 3),
        "ga_alpha_per_key": round(float(ga), 3),
        "g0_alpha": round(float(g0), 3),
        "r2_alpha": round(r2(ay, ga * ax + g0), 4),
        "n_samples": len(sig),
    }


# ------------------------------------------------------------------- main ---

FITTERS = {"surface": fit_surface, "chamfer": fit_chamfer,
           "fillet": fit_fillet, "shadow": fit_shadow,
           "curved": fit_curved, "darker": fit_darker,
           "shiny": fit_shiny, "glow": fit_glow,
           "groove": fit_groove}


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
