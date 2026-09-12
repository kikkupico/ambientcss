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
import re
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


def srgb_to_linear(c):
    """sRGB transfer, inverted. The rendered lightness the extractors report
    is gamma-ENCODED; the light that made it adds up linearly. Every fit that
    wants a physical coefficient has to cross this line first."""
    c = np.asarray(c, dtype=float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(v):
    v = np.clip(np.asarray(v, dtype=float), 0.0, None)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)


# ---------------------------------------------------------------- surface ---

def fit_surface(m):
    """Model (shape of .amb-surface / --amb-exposure): a surface reflects
    albedo x exposure, and EXPOSURE is what the light intensities are linear
    in — irradiance adds up, sRGB lightness does not.

    This supersedes five separate affine-in-lightness fits (surface plus the
    lighter/lightest/darker/darkest plates). Those were one linearisation of
    this law per albedo, each needing its own floor to absorb the gamma
    curve; fit in linear light instead, ONE two-parameter law covers every
    plate in the rig. Zero intercept is a result, not an assumption — the
    free intercept comes back at 2e-5, i.e. the studio world contributes
    nothing measurable once both lamps are off.

    Fit over every matte flat-plate frame regardless of albedo."""
    import amb_model

    pts = []
    for rel, entry in m.items():
        ml = entry["metrics"].get("surface_lightness")
        if not ml:
            continue
        a = entry["amb"]
        if a["mat"] != "matte" or a["surface"] != "flat" or a["emit"]:
            continue
        albedo = a["albedo"] or amb_model.GROUND_ALBEDO
        pts.append((a["key_light_intensity"], a["fill_light_intensity"],
                    albedo, ml["srgb_pct"]))
    pts.sort()
    A = np.array([[p[0], p[1]] for p in pts])
    albedo = np.array([p[2] for p in pts])
    L = np.array([p[3] for p in pts])
    # exposure implied by each frame: linear reflected light over albedo
    E = srgb_to_linear(L / 100.0) / albedo
    (ek, ef), *_ = np.linalg.lstsq(A, E, rcond=None)
    pred = linear_to_srgb(A @ [ek, ef] * albedo) * 100.0
    (_, _, e0), *_ = np.linalg.lstsq(np.c_[A, np.ones(len(A))], E, rcond=None)
    return {
        "model": ("srgb(L) = albedo * exposure; "
                  "exposure = ek * key_intensity + ef * fill_intensity"),
        "ek": round(float(ek), 4),
        "ef": round(float(ef), 4),
        "free_intercept": round(float(e0), 6),
        "r2": round(r2(L, pred), 7),
        "max_resid_pct": round(float(np.abs(L - pred).max()), 4),
        "n_frames": len(pts),
        "albedos": sorted(set(round(float(x), 3) for x in albedo)),
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

    # Floor tone: the same albedo x exposure law as .amb-surface, so a
    # groove rides --amb-albedo instead of painting an absolute grey. Its
    # own exposure runs slightly hot — the recess walls bounce the key back
    # onto the floor.
    A = np.array([[p[0], p[1]] for p in floor_rows])
    L = np.array([p[2] for p in floor_rows])
    Eg = srgb_to_linear(L / 100.0) / amb_model.GROUND_ALBEDO
    (gk, gf), *_ = np.linalg.lstsq(A, Eg, rcond=None)
    floor_pred = linear_to_srgb(A @ [gk, gf] * amb_model.GROUND_ALBEDO) * 100.0

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
        "model": ("floor srgb(L) = albedo * (gk * Ik + gf * If); "
                  "recess = 4.5mm * "
                  "thickness; wall shadow: reach = Ws * recess per light "
                  "component, css_blur = Bs * recess, alpha = "
                  "sa * (Ik - If) + sa0; far-wall bounce (white overlay): "
                  "reach = Wb * recess + Wb0, css_blur = Bb * recess, "
                  "alpha = ba * Ik + bf * If + b0, clamped to [0, 1]"),
        "gk": round(float(gk), 4),
        "gf": round(float(gf), 4),
        "r2_floor": round(r2(L, floor_pred), 4),
        "max_resid_floor_pct": round(float(np.abs(L - floor_pred).max()), 3),
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


# ------------------------------------------------------------------ grain ---

def _grain_albedo(mean_srgb_pct, key, fill, surf):
    """Invert fit_surface's exposure law to the --amb-albedo that
    reproduces a measured flat-plus-grain mean tone under (key, fill)."""
    exposure = surf["ek"] * key + surf["ef"] * fill
    return float(srgb_to_linear(mean_srgb_pct / 100.0) / exposure)


def fit_grain(m, name):
    """Micro-relief material (brushed | spun | blasted): reference albedo
    (solved through fit_surface's exposure law, at the mat_<name>_default
    scene's key/fill — the file's defaults, the point today's brushed/
    blasted reference-tone doc comments already anchor to), overall relief
    contrast (mean RMS L* over the <name>_angle light-azimuth sweep) and the
    across:along anisotropy ratio: summed rms_drow / rms_dcol over that same
    sweep — a single-frame column/row derivative ratio (screen row-to-row
    over column-to-column; object-space Y over X for this top-down rig),
    summed across azimuths so the frames where the relief actually shows
    dominate the ratio. Blasted is isotropic by construction; its ratio is
    reported purely as a control (expected close to 1) — see
    derived/notes/blasted.md."""
    surf = fit_surface(m)
    default = m[f"calib/mat_{name}_default.png"]
    g0 = default["metrics"]["grain_texture"]
    a0 = default["amb"]
    albedo = _grain_albedo(g0["mean_srgb_pct"], a0["key_light_intensity"],
                           a0["fill_light_intensity"], surf)

    rms, dcol_sum, drow_sum = [], 0.0, 0.0
    for rel, entry in m.items():
        if not rel.startswith(f"sweeps/{name}_angle/"):
            continue
        g = entry["metrics"]["grain_texture"]
        rms.append(g["rms_lstar"])
        dcol_sum += g["rms_dcol"]
        drow_sum += g["rms_drow"]

    return {
        "model": ("--amb-albedo solved from the default scene's mean "
                  "flat+grain tone through fit_surface's exposure law; "
                  "alpha from mean RMS L* over the <name>_angle sweep; "
                  "anisotropy from summed rms_drow/rms_dcol over that sweep"),
        "albedo_linear": round(albedo, 4),
        "mean_rms_lstar": round(float(np.mean(rms)), 4),
        "max_rms_lstar": round(float(np.max(rms)), 4),
        "anisotropy_row_over_col": round(drow_sum / dcol_sum, 4),
        "n_angle_frames": len(rms),
    }


def fit_brushed(m):
    return fit_grain(m, "brushed")


def fit_spun(m):
    return fit_grain(m, "spun")


def fit_blasted(m):
    return fit_grain(m, "blasted")


def _affine_peak(peaks):
    px = np.array([v[0] for v in peaks]); py = np.array([v[1] for v in peaks])
    (s, s0), *_ = np.linalg.lstsq(np.stack([px, np.ones_like(px)], axis=1),
                                  py, rcond=None)
    return s, s0, r2(py, s * px + s0)


def fit_sheen_axis(m):
    """Brushed metal's sheen: the full material's axis_profile (a FIXED
    vertical screen scan, matching the CSS band which slides but never
    rotates) minus its relief-only twin at matching light/key, averaged
    over the whole scan (not peak-searched) for amplitude — a single
    column's fine relief noise is comparable to the sheen itself, and
    MEAN excess is the one statistic that stays robust to that noise
    regardless of the sweep's own light contrast (verified: the low- and
    high-contrast sweeps below agree on amplitude to 3 decimal places even
    though only the high-contrast one resolves a real peak at all).
    Amplitude (brushed_sheen/_ref, a key-intensity sweep) and band position
    (brushed_sheen_pos/_ref, a light_y sweep at fixed high-contrast
    key/fill, where the low-contrast key sweep's own peaks turn out to be
    argmax-of-noise — see the note) are fit from separate sweeps because
    the low-contrast condition that gives a clean amplitude read does not
    give a clean position read. Supersedes fit_sheen's cyl_profile attempt
    (derived/notes/brushed_sheen.md's 'NOT transcribed' pass), which
    sampled along the light diagonal and mostly missed this band."""
    from measure.metrics import _band_features

    means = []
    prefix = "sweeps/brushed_sheen/"
    for rel, entry in m.items():
        if not rel.startswith(prefix):
            continue
        ref_rel = rel.replace(prefix, "sweeps/brushed_sheen_ref/")
        if ref_rel not in m:
            continue
        a = entry["amb"]
        prof = np.array(entry["metrics"]["axis_profile"]["profile_srgb"])
        ref = np.array(m[ref_rel]["metrics"]["axis_profile"]["profile_srgb"])
        means.append((a["key_light_intensity"], float((prof - ref).mean())))
    s, s0, r2v = _affine_peak(means)

    pos, wid = [], []
    prefix = "sweeps/brushed_sheen_pos/"
    for rel, entry in m.items():
        if not rel.startswith(prefix):
            continue
        ref_rel = rel.replace(prefix, "sweeps/brushed_sheen_pos_ref/")
        if ref_rel not in m:
            continue
        prof = np.array(entry["metrics"]["axis_profile"]["profile_srgb"])
        ref = np.array(m[ref_rel]["metrics"]["axis_profile"]["profile_srgb"])
        feat = _band_features(prof - ref)
        pos.append((entry["amb"]["light_y"], feat["pos_frac"]))
        wid.append(feat["fwhm_frac"])
    ps, ps0, pr2 = _affine_peak(pos)

    return {
        "model": ("amplitude: mean sheen excess (axis_profile minus its "
                  "relief-only twin) = s * Ik + s0 (sRGB), from "
                  "brushed_sheen. position: --_sheen-at's pos_frac (0=top, "
                  "1=bottom) = pos_s * light_y + pos_s0, from the "
                  "high-contrast light_y sweep brushed_sheen_pos, where "
                  "pos_frac is a real _band_features peak (not noise) — "
                  "see the note for why the two need separate sweeps"),
        "s_mean_per_key": round(float(s), 4),
        "s0_mean": round(float(s0), 4),
        "r2": round(float(r2v), 4),
        "n_samples": len(means),
        "pos_slope_per_light_y": round(float(ps), 4),
        "pos_intercept": round(float(ps0), 4),
        "pos_r2": round(float(pr2), 4),
        "pos_fwhm_frac_at_edges": [round(float(v), 4) for v in wid],
        "n_pos_samples": len(pos),
    }


def fit_sheen_ring(m):
    """Spun metal's sheen: the full material's ring_profile (angular
    wedges of an annulus, aligned to the light's own bearing) minus its
    relief-only twin, MEAN-averaged for amplitude (same reasoning as
    fit_sheen_axis: mean excess stays robust to the material's own noise
    regardless of light contrast). Also checks whether the excess is
    actually DIRECTIONAL: spun_sheen_pos/_ref renders 4 light bearings at
    high contrast; if the excess were a real conic lobe locked to the
    light (as the CSS assumes), pos_frac should land near 0.5 (aligned
    with the light, by this extractor's own convention) for every
    bearing. It does not — see pos_frac_by_bearing in the result — while
    brushed's equivalent check (fit_sheen_axis's light_y sweep) DOES
    confirm a light-tracking peak under the same high-contrast condition,
    which rules out 'insufficient signal' as the explanation here: the
    same rig, camera and extraction method resolves directionality for
    one grain orientation and not the other. Supersedes fit_sheen's
    cyl_profile attempt (derived/notes/spun_sheen.md's 'NOT transcribed'
    pass): that profile is RADIAL (distance from center along the light),
    but the CSS conic-gradient is a function of ANGLE at any radius — a
    unit mismatch, not just an off-axis sampling problem, so its numbers
    were not just unreliable but for the wrong quantity."""
    from measure.metrics import _band_features

    means, hotspot = [], []
    prefix = "sweeps/spun_sheen/"
    for rel, entry in m.items():
        if not rel.startswith(prefix):
            continue
        ref_rel = rel.replace(prefix, "sweeps/spun_sheen_ref/")
        if ref_rel not in m:
            continue
        a = entry["amb"]
        ik = a["key_light_intensity"]
        ring = np.array(entry["metrics"]["ring_profile"]["ring_srgb"])
        ref_ring = np.array(m[ref_rel]["metrics"]["ring_profile"]["ring_srgb"])
        ring_mean_excess = float((ring - ref_ring).mean())
        means.append((ik, ring_mean_excess))

        disk = entry["metrics"]["ring_profile"]["disk_mean_srgb"]
        ref_disk = m[ref_rel]["metrics"]["ring_profile"]["disk_mean_srgb"]
        hotspot.append((ik, disk - ref_disk, ring_mean_excess))

    s, s0, r2v = _affine_peak(means)
    ratio = [(v[1] / v[2]) for v in hotspot if abs(v[2]) > 1e-6]

    pos_by_bearing = []
    prefix = "sweeps/spun_sheen_pos/"
    for rel, entry in m.items():
        if not rel.startswith(prefix):
            continue
        ref_rel = rel.replace(prefix, "sweeps/spun_sheen_pos_ref/")
        if ref_rel not in m:
            continue
        ring = np.array(entry["metrics"]["ring_profile"]["ring_srgb"])
        ref_ring = np.array(m[ref_rel]["metrics"]["ring_profile"]["ring_srgb"])
        feat = _band_features(ring - ref_ring)
        pos_by_bearing.append(feat["pos_frac"])

    return {
        "model": ("amplitude: mean sheen excess (ring_profile minus its "
                  "relief-only twin) = s * Ik + s0 (sRGB), from "
                  "spun_sheen; the center disk's own excess is "
                  "hotspot_s * Ik + hotspot_s0. Directionality checked, "
                  "not assumed: see pos_frac_by_bearing"),
        "s_mean_per_key": round(float(s), 4),
        "s0_mean": round(float(s0), 4),
        "r2": round(float(r2v), 4),
        "n_samples": len(means),
        "hotspot_s_per_key": round(float(np.polyfit([v[0] for v in hotspot], [v[1] for v in hotspot], 1)[0]), 5),
        "hotspot_over_ring_ratio": round(float(np.mean(ratio)), 3) if ratio else None,
        "pos_frac_by_bearing": [round(float(v), 3) for v in pos_by_bearing],
        "pos_frac_expected_if_directional": 0.5,
    }


# ------------------------------------------------------------------- main ---

def _affine3(rows):
    """Least-squares y = a*key + b*fill + c over (key, fill, y) rows."""
    x = np.array([[k, f, 1.0] for k, f, _ in rows])
    y = np.array([v for _, _, v in rows])
    coef, *_ = np.linalg.lstsq(x, y, rcond=None)
    return coef, r2(y, x @ coef)


def _glass_edge_roles(a):
    """(lit, far, perpendicular) edge-name lists for a light direction."""
    lit, far = lit_edges(a)
    perp = [e for e in ("left", "right", "top", "bottom")
            if e not in lit and e not in far]
    return list(lit), list(far), perp


def fit_glass(m):
    """Frosted glass pane (shape of .amb-mat-glass), four features, each
    grounded on its own frames:

    PANE TRANSFER: what the pane does to the tone behind it, solved as
    `out = T * backdrop + V` from the same pane over the light ground
    (sweeps/glass) and over a dark field (sweeps/glass_dark), each minus
    its bare-ground reference. This is exactly what a translucent CSS
    background-color composites in sRGB (T = 1 - alpha, V = alpha *
    lightness), so the fit is done in sRGB, not linear. T and V are
    affine in key and fill; V is what the CSS calls the frost's veil.
    BODY GATE: the same T/V per thickness from the striped frost frames
    (two backdrop tones in one frame): a t0 sheet is a near-pure
    attenuator, the veil needs a body to be lit through its walls.
    FROST BLUR: Gaussian sigma of a stripe edge seen through the pane,
    affine in the pane's height above the backdrop (elevation) and its
    thickness — the pane at rest barely blurs at all.
    EDGE BANDS: the lit walls refract the key away from the ground just
    inside the lit edges (a dark band) and pipe it out under the far
    edges (a bright band); peak affine in key and fill, per role.
    VEIL GRADIENT: the excess along the light axis, lit sixth and far
    sixth against the middle third, affine in key and fill."""
    def tint(entry, key="interior"):
        return entry["metrics"]["glass_tint"][key]["srgb_pct"] / 100.0

    # ---- pane transfer
    t_rows, v_rows, by_light = [], [], {}
    for rel, entry in m.items():
        if not rel.startswith("sweeps/glass/"):
            continue
        dark = rel.replace("sweeps/glass/", "sweeps/glass_dark/")
        ref = rel.replace("sweeps/glass/", "sweeps/glass_ref/")
        dref = rel.replace("sweeps/glass/", "sweeps/glass_dark_ref/")
        if not all(k in m for k in (dark, ref, dref)):
            continue
        a = entry["amb"]
        il, idk = tint(entry), tint(m[dark])
        rl, rd = tint(m[ref]), tint(m[dref])
        t = (il - idk) / (rl - rd)
        v = il - t * rl
        k, f = a["key_light_intensity"], a["fill_light_intensity"]
        t_rows.append((k, f, t))
        v_rows.append((k, f, v))
        if k == 0.9 and f == 0.7:
            by_light[f"{a['light_x']:g},{a['light_y']:g}"] = (round(t, 4),
                                                              round(v, 4))
    (tk, tf, t0), r2_t = _affine3(t_rows)
    (vk, vf, v0), r2_v = _affine3(v_rows)

    # ---- body gate (thickness) from the striped frames at rest
    body = {}
    dref = m.get("sweeps/glass_dark_ref/light=-1,-1.png")
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/glass_frost/thickness=") or
                rel == "calib/mat_glass_frost.png"):
            continue
        if dref is None or "decal" not in entry["metrics"]["glass_tint"]:
            continue
        il, ist = tint(entry), tint(entry, "decal")
        rl = entry["metrics"]["glass_tint"]["ref"]["srgb_pct"] / 100.0
        rd = tint(dref)
        t = (il - ist) / (rl - rd)
        body[f"t{entry['amb']['thickness']:g}"] = {
            "T": round(t, 4), "V": round(il - t * rl, 4)}

    # ---- frost blur vs height
    rows = []
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/glass_frost/") or
                rel in ("calib/mat_glass_frost.png",
                        "calib/mat_glass_frost_elevated.png")):
            continue
        a = entry["amb"]
        from amb_model import elevation_mm, thickness_mm
        rows.append((elevation_mm(a), thickness_mm(a),
                     entry["metrics"]["frost_blur"]["blur_sigma_mm"]))
    # through the origin: a sheet resting on its backdrop blurs nothing
    # (its 0.1 mm reads as the render's own antialiasing), so the model
    # has no intercept for the CSS to carry
    bx = np.array([[e, t] for e, t, _ in rows])
    by = np.array([s for _, _, s in rows])
    (be, bt), *_ = np.linalg.lstsq(bx, by, rcond=None)
    r2_blur = r2(by, bx @ np.array([be, bt]))

    # ---- edge bands by role, reference-subtracted
    role_rows = {"lit": [], "far": [], "perp": []}
    widths = {"lit": [], "far": []}
    for rel, entry in m.items():
        if not rel.startswith("sweeps/glass/"):
            continue
        ref = rel.replace("sweeps/glass/", "sweeps/glass_ref/")
        if ref not in m:
            continue
        a = entry["amb"]
        k, f = a["key_light_intensity"], a["fill_light_intensity"]
        eb, rb = entry["metrics"]["edge_bands"], m[ref]["metrics"]["edge_bands"]
        for role, names in zip(("lit", "far", "perp"), _glass_edge_roles(a)):
            for name in names:
                role_rows[role].append(
                    (k, f, eb[name]["peak_srgb"] - rb[name]["peak_srgb"]))
                if role in widths:
                    widths[role].append(eb[name]["width_mm"])
    (lk, lf, l0), r2_lit = _affine3(role_rows["lit"])
    (fk, ff, f0), r2_far = _affine3(role_rows["far"])
    perp_mean = float(np.mean([v for _, _, v in role_rows["perp"]]))
    lit_mean = float(np.mean([v for k, f, v in role_rows["lit"]
                              if k == 0.9 and f == 0.7]))

    # ---- what each band IS, over two backdrops at the defaults: solve
    # the band peak as its own pane transfer (T_b, V_b) from the light
    # ground and the dark field, then express it as a wash painted OVER
    # the pane's interior transfer (T, V): band = (1 - beta) * interior
    # + beta * L_beta. That is the layer the CSS paints (a gradient on
    # background-image sits over background-color), so beta and L_beta
    # are its alpha and lightness. A far-edge L_beta above 1 means the
    # glow is additive beyond any wash — the CSS caps it at white and
    # takes the beta that splits the difference between backdrops.
    bands = {}
    key = "light=-1,-1.png"
    g, gr = m.get(f"sweeps/glass/{key}"), m.get(f"sweeps/glass_ref/{key}")
    d, dr = (m.get(f"sweeps/glass_dark/{key}"),
             m.get(f"sweeps/glass_dark_ref/{key}"))
    if all(x and "edge_bands" in x["metrics"] for x in (g, gr, d, dr)):
        t_def = tk * 0.9 + tf * 0.7 + t0
        v_def = vk * 0.9 + vf * 0.7 + v0
        for role, edge in (("lit", "left"), ("far", "right")):
            def peak_over(frame, ref):
                eb, rb = frame["metrics"]["edge_bands"][edge], \
                    ref["metrics"]["edge_bands"][edge]
                # backdrop tone beside the band, and the band's own peak
                return (rb["baseline_srgb"],
                        eb["baseline_srgb"] + eb["peak_srgb"])
            (bl, pl), (bd, pd) = peak_over(g, gr), peak_over(d, dr)
            t_b = (pl - pd) / (bl - bd)
            v_b = pl - t_b * bl
            beta = 1.0 - t_b / t_def
            l_beta = (v_b - (1.0 - beta) * v_def) / beta if beta > 1e-6 else 0.0
            bands[role] = {"T": round(t_b, 4), "V": round(v_b, 4),
                           "beta": round(beta, 4), "L_beta": round(l_beta, 4),
                           "peak_over_ground": round(pl - bl, 4),
                           "peak_over_dark": round(pd - bd, 4)}

    # ---- veil gradient along the light axis
    lit_rows, far_rows, shape = [], [], None
    for rel, entry in m.items():
        if not rel.startswith("sweeps/glass/"):
            continue
        ref = rel.replace("sweeps/glass/", "sweeps/glass_ref/")
        if ref not in m:
            continue
        a = entry["amb"]
        k, f = a["key_light_intensity"], a["fill_light_intensity"]
        exc = (np.array(entry["metrics"]["plate_profile"]["profile_srgb"]) -
               np.array(m[ref]["metrics"]["plate_profile"]["profile_srgb"]))
        n = len(exc)
        mid = exc[n // 3: 2 * n // 3].mean()
        lit_rows.append((k, f, float(exc[: n // 6].mean() - mid)))
        far_rows.append((k, f, float(exc[-(n // 6):].mean() - mid)))
        if rel == "sweeps/glass/light=-1,-1.png":
            shape = [round(float(v - mid), 4) for v in exc]
    (gk, gf, g0), r2_gl = _affine3(lit_rows)
    (hk, hf, h0), r2_gf = _affine3(far_rows)

    # ---- drop shadow: interior depth and the ring, by elevation/thickness
    ring = {}
    rows_c, rows_p, rows_hm, near = [], [], [], []
    for rel, entry in m.items():
        if not (rel.startswith("sweeps/glass_shadow/") or
                rel == "calib/mat_glass_default.png"):
            continue
        hs = entry["metrics"].get("hollow_shadow")
        if not hs:
            continue
        a = entry["amb"]
        e, t = a["elevation"], a["thickness"]
        vals = list(hs.values())
        pk = float(np.mean([v["peak_alpha"] for v in vals]))
        pd = float(np.mean([v["peak_d_mm"] for v in vals]))
        hm = float(np.mean([v["hm_mm"] for v in vals]))
        na = float(np.mean([v["near_alpha"] for v in vals]))
        ring[f"e{e:g}_t{t:g}"] = {"peak_alpha": round(pk, 4),
                                 "peak_d_mm": round(pd, 2),
                                 "hm_mm": round(hm, 2),
                                 "near_alpha": round(na, 4),
                                 "halo_alpha": round(float(np.mean(
                                     [v["halo_alpha"] for v in vals])), 4)}
        rows_c.append((e, t, pd))
        rows_hm.append((e, t, hm - pd))
        rows_p.append((e, t, pk))
        if e > 0:
            near.append(na)
    cx = np.array([[e, t] for e, t, _ in rows_c])
    (ce, ct), *_ = np.linalg.lstsq(cx, np.array([v for *_, v in rows_c]),
                                   rcond=None)
    # half-max half-width -> Gaussian sigma of the ring's bump
    sx = np.array([[e, t] for e, t, _ in rows_hm])
    (se, st), *_ = np.linalg.lstsq(sx, np.array([v for *_, v in rows_hm]) / 1.177,
                                   rcond=None)
    px = np.array([[e, 1.0] for e, t, _ in rows_p if t == 1])
    py = np.array([v for e, t, v in rows_p if t == 1])
    (pe, p0), *_ = np.linalg.lstsq(px, py, rcond=None)

    return {
        "shadow_ring": ring,
        "shadow_interior_alpha": round(float(np.mean(near)), 4) if near else 0.0,
        "ring_center_per_elev": round(float(ce), 3),
        "ring_center_per_thick": round(float(ct), 3),
        "ring_sigma_per_elev": round(float(se), 3),
        "ring_sigma_per_thick": round(float(st), 3),
        "ring_peak_per_elev": round(float(pe), 4),
        "ring_peak0": round(float(p0), 4),
        "model": ("pane transfer out = T*backdrop + V (sRGB), T = tk*Ik + "
                  "tf*If + t0, V = vk*Ik + vf*If + v0; CSS alpha = 1 - T, "
                  "lightness = V / alpha; body gate T/V per thickness; "
                  "frost blur sigma_mm = be*elev_mm + bt*thick_mm; "
                  "edge band peaks (lit: dark, far: bright) affine in "
                  "Ik, If; veil gradient lit/far sixth excess affine in "
                  "Ik, If"),
        "T_per_key": round(float(tk), 4), "T_per_fill": round(float(tf), 4),
        "T0": round(float(t0), 4), "r2_T": round(r2_t, 4),
        "V_per_key": round(float(vk), 4), "V_per_fill": round(float(vf), 4),
        "V0": round(float(v0), 4), "r2_V": round(r2_v, 4),
        "TV_by_light_at_defaults": by_light,
        "body": body,
        "blur_per_elev_mm": round(float(be), 4),
        "blur_per_thick_mm": round(float(bt), 4),
        "r2_blur": round(r2_blur, 4),
        "n_blur_samples": len(rows),
        "bands_at_defaults": bands,
        "lit_edge_mean_at_defaults": round(lit_mean, 4),
        "lit_edge_per_key": round(float(lk), 4),
        "lit_edge_per_fill": round(float(lf), 4),
        "lit_edge0": round(float(l0), 4), "r2_lit_edge": round(r2_lit, 4),
        "lit_edge_width_mm": round(float(np.mean(widths["lit"])), 3),
        "far_edge_per_key": round(float(fk), 4),
        "far_edge_per_fill": round(float(ff), 4),
        "far_edge0": round(float(f0), 4), "r2_far_edge": round(r2_far, 4),
        "far_edge_width_mm": round(float(np.mean(widths["far"])), 3),
        "perp_edge_mean": round(perp_mean, 4),
        "veil_lit_per_key": round(float(gk), 4),
        "veil_lit_per_fill": round(float(gf), 4),
        "veil_lit0": round(float(g0), 4), "r2_veil_lit": round(r2_gl, 4),
        "veil_far_per_key": round(float(hk), 4),
        "veil_far_per_fill": round(float(hf), 4),
        "veil_far0": round(float(h0), 4), "r2_veil_far": round(r2_gf, 4),
        "veil_shape_defaults": shape,
    }


FITTERS = {"surface": fit_surface, "chamfer": fit_chamfer,
           "fillet": fit_fillet, "shadow": fit_shadow,
           "curved": fit_curved,
           "shiny": fit_shiny, "glow": fit_glow,
           "groove": fit_groove,
           "brushed": fit_brushed, "spun": fit_spun, "blasted": fit_blasted,
           "brushed_sheen": fit_sheen_axis, "spun_sheen": fit_sheen_ring,
           "glass": fit_glass}


def write_note(effect, coeffs):
    """Rewrite only the machine-generated header of a note.

    Everything from the first `## ` heading onward is hand-written prose
    (the "Transcribed into ambient.css" sections and their dated
    corrections) and is carried through verbatim. Before 2026-08-21 this
    truncated the file, which silently deleted that prose from all five
    grain notes on a routine fit run.
    """
    lines = [f"# {effect} — grounded fit", "",
             f"Model: `{coeffs['model']}`", ""]
    for key, val in coeffs.items():
        if key == "model":
            continue
        lines.append(f"- **{key}**: `{json.dumps(val)}`")
    lines.append("")
    header = "\n".join(lines)

    path = os.path.join(ROOT, "derived", "notes", f"{effect}.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    prose = ""
    if os.path.exists(path):
        with open(path) as fh:
            existing = fh.read()
        match = re.search(r"^## ", existing, flags=re.M)
        if match:
            prose = existing[match.start():]
    with open(path, "w") as fh:
        fh.write(header + ("\n" + prose if prose else ""))


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
