"""Metric extractors: rendered (or screenshotted) PNG -> numbers.

Pure numpy + Pillow; runs outside Blender. Every extractor takes the
image as a float array and the job meta ({"amb": ..., "plate": ...,
"pxPerMm": ..., "frameMm": ...}) and returns a flat dict of numbers.

Coordinates: CSS screen mm, origin at frame center, sx right+, sy down+.
The calibration camera maps these to pixels as col = (sx + F/2) * s,
row = (sy + F/2) * s. All lightness comparisons are done both in raw
sRGB value (what HSL lightness approximates for neutral colors) and in
CIE L* (perceptual), computed from the final PNG pixels — the same color
space a browser composits in.
"""

import numpy as np
from PIL import Image

from amb_model import reference_layout


def load(path):
    """PNG -> float (H, W) luminance-ish array in 0..1 (mean of RGB;
    calibration scenes are neutral so channels agree)."""
    img = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64) / 255.0
    return img.mean(axis=2)


def srgb_to_lstar(v):
    """sRGB value (0..1) -> CIE L* (0..100) for neutral gray."""
    v = np.asarray(v, dtype=np.float64)
    linear = np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    return np.where(linear > 0.008856,
                    116.0 * np.cbrt(linear) - 16.0,
                    903.3 * linear)


class Frame:
    """Pixel <-> screen-mm addressing for one rendered frame."""

    def __init__(self, img, meta):
        self.img = img
        self.frame_mm = meta.get("frameMm", 128)
        self.s = img.shape[0] / self.frame_mm  # px per mm
        plate = meta["plate"]
        self.plate_w, self.plate_d = plate["size"]
        self.amb = meta["amb"]

    def region(self, sx0, sx1, sy0, sy1):
        """Mean-preserving crop by screen-mm bounds."""
        half = self.frame_mm / 2
        c0 = int(round((sx0 + half) * self.s))
        c1 = int(round((sx1 + half) * self.s))
        r0 = int(round((sy0 + half) * self.s))
        r1 = int(round((sy1 + half) * self.s))
        return self.img[r0:r1, c0:c1]


# -------------------------------------------------------------- extractors ---

def surface_lightness(img, meta):
    """Mean plate-interior value, well away from edges and bands."""
    f = Frame(img, meta)
    interior = f.region(-30, 30, -30, 30)
    v = float(interior.mean())
    return {
        "srgb_pct": v * 100.0,
        "lstar": float(srgb_to_lstar(v)),
        "noise": float(interior.std()),
    }


def edge_bands(img, meta):
    """Per-edge inward lightness profile -> band peak, width, mean delta.

    For each plate edge, averages a profile running from the silhouette
    inward (0..8 mm), subtracts the interior baseline, and characterizes
    the edge band: signed peak delta, width at half max, and the band's
    mean delta over its width. The outermost 0.25 mm (1 px) is skipped to
    avoid silhouette antialiasing.
    """
    f = Frame(img, meta)
    hw, hd = f.plate_w / 2, f.plate_d / 2
    depth = 8.0        # profile depth into the plate, mm
    lat = 28.0         # lateral averaging half-extent, mm (clear of corners)

    # (name, region getter, needs_flip) — flip so index 0 = at the edge
    edges = {
        "left":   (f.region(-hw, -hw + depth, -lat, lat).mean(axis=0), False),
        "right":  (f.region(hw - depth, hw, -lat, lat).mean(axis=0), True),
        "top":    (f.region(-lat, lat, -hd, -hd + depth).mean(axis=1), False),
        "bottom": (f.region(-lat, lat, hd - depth, hd).mean(axis=1), True),
    }

    out = {}
    for name, (profile, flip) in edges.items():
        if flip:
            profile = profile[::-1]
        skip = max(1, int(round(0.25 * f.s)))       # silhouette AA
        base_lo = int(round(4.0 * f.s))             # baseline: 4..8 mm in
        baseline = profile[base_lo:].mean()
        delta = profile[skip:base_lo] - baseline

        idx = int(np.argmax(np.abs(delta)))
        peak = float(delta[idx])
        if abs(peak) < 1e-4:
            out[name] = {"peak_srgb": 0.0, "width_mm": 0.0,
                         "mean_delta_srgb": 0.0,
                         "baseline_srgb": float(baseline)}
            continue

        above = np.abs(delta) >= abs(peak) / 2
        # contiguous half-max run containing the peak
        lo = idx
        while lo > 0 and above[lo - 1]:
            lo -= 1
        hi = idx
        while hi < len(above) - 1 and above[hi + 1]:
            hi += 1
        width_mm = (hi - lo + 1) / f.s
        band_mean = float(delta[lo:hi + 1].mean())

        out[name] = {
            "peak_srgb": peak,
            "width_mm": float(width_mm),
            "mean_delta_srgb": band_mean,
            "baseline_srgb": float(baseline),
        }
    return out


def surface_gradient(img, meta):
    """L profile along the curvature axis of a curved-surface plate,
    sampled at the CSS gradient stop positions (0/35/50/65/100%).
    Values are far-edge-positive: stops run along +axis (screen down for
    concave/convex, screen right for concave-h)."""
    f = Frame(img, meta)
    axis = "x" if f.amb["surface"] == "concave-h" else "y"
    hw, hd = f.plate_w / 2, f.plate_d / 2
    span = hw if axis == "x" else hd
    lat = (hd if axis == "x" else hw) * 0.6

    if axis == "x":
        band = f.region(-hw, hw, -lat, lat).mean(axis=0)
    else:
        band = f.region(-lat, lat, -hd, hd).mean(axis=1)

    n = len(band)
    inset = int(round(1.0 * f.s))          # skip silhouette AA
    stops = {}
    for pos in (0.0, 0.35, 0.5, 0.65, 1.0):
        c = inset + (n - 1 - 2 * inset) * pos
        lo, hi = int(round(c - f.s)), int(round(c + f.s)) + 1
        v = float(band[max(0, lo):hi].mean())
        stops[f"{pos:g}"] = v
    return {
        "stop_srgb_pct": {k: round(v * 100, 3) for k, v in stops.items()},
        "delta_end_srgb": (stops["1"] - stops["0"]) / 2,
        "delta_mid_srgb": (stops["0.65"] - stops["0.35"]) / 2,
        "center_srgb_pct": round(stops["0.5"] * 100, 3),
    }


def drop_shadow(img, meta):
    """Drop-shadow characterization from the crescent outside the plate.

    For each edge, an outward shadow-alpha profile a(d) = 1 - v(d)/v_ref
    (sRGB compositing of a black shadow over the ground). Reported per
    edge: hm_mm, the outermost half-max crossing (for a Gaussian-blurred
    boundary the half-max sits AT the boundary, so hm = per-axis offset +
    spread on shadowed edges and = spread on perpendicular ones),
    sigma_mm from the 25..75% falloff (IQR = 1.349 sigma), and peak alpha.
    """
    f = Frame(img, meta)
    hw, hd = f.plate_w / 2, f.plate_d / 2
    half = f.frame_mm / 2
    reach = half - max(hw, hd) - 2.0   # outward profile depth, mm
    lat = min(hw, hd) * 0.7            # lateral averaging half-extent

    # Unshadowed ground reference: the two light-perpendicular sample
    # zones from reference_layout — the lit side blooms (side-wall
    # bounce) and the far side is shadowed, but these are clear of both,
    # of the patches, and of the edge-profile bands.
    layout = reference_layout(f.amb, f.plate_w, f.plate_d)
    refs = [float(f.region(cx - 3, cx + 3, cy - 3, cy + 3).mean())
            for cx, cy in (layout["ref_a"], layout["ref_b"])]
    v_ref = float(np.mean(refs))

    edges = {
        "left":   (f.region(-hw - reach, -hw, -lat, lat).mean(axis=0), True),
        "right":  (f.region(hw, hw + reach, -lat, lat).mean(axis=0), False),
        "top":    (f.region(-lat, lat, -hd - reach, -hd).mean(axis=1), True),
        "bottom": (f.region(-lat, lat, hd, hd + reach).mean(axis=1), False),
    }

    out = {}
    for name, (profile, flip) in edges.items():
        if flip:
            profile = profile[::-1]     # index 0 = at the plate edge
        skip = max(1, int(round(0.5 * f.s)))
        prof = profile[skip:]
        alpha = 1.0 - prof / v_ref

        peak = float(alpha.max())
        if peak < 0.02:
            out[name] = {"hm_mm": 0.0, "sigma_mm": 0.0, "peak_alpha": 0.0,
                         "v_ref": v_ref}
            continue

        def outermost(level):
            above = np.nonzero(alpha >= level)[0]
            return (above[-1] + skip) / f.s if len(above) else 0.0

        hm = outermost(peak / 2)
        # falloff width between 75% and 25% of peak -> Gaussian sigma
        sigma = max(0.0, (outermost(peak * 0.25) - outermost(peak * 0.75))
                    / 1.349)
        out[name] = {"hm_mm": float(hm), "sigma_mm": float(sigma),
                     "peak_alpha": peak, "v_ref": v_ref}

    out.update(_shadow_shape(f, v_ref))
    return out


def _shadow_shape(f, v_ref):
    """Chevron diagnostics for the swept-silhouette shadow model.

    corner: outward alpha profile along the shadow diagonal past the
    shadow-side corner — the 45-degree miter the single-offset box-shadow
    cannot produce (only present for lights with two nonzero components).
    hug: for each shadowed edge, contact-zone alpha (0.5..1.5 mm out) in
    thirds along the edge, ordered lit-corner-first — the swept shadow
    keeps the near-lit third dark, the single-offset model leaves a gap.
    """
    lx, ly = f.amb["light_x"], f.amb["light_y"]
    hw, hd = f.plate_w / 2, f.plate_d / 2
    out = {}

    if lx != 0 and ly != 0:
        # shadow-side corner and the outward shadow direction (-light)
        cx, cy = -np.sign(lx) * hw, -np.sign(ly) * hd
        ux, uy = -lx / np.hypot(lx, ly), -ly / np.hypot(lx, ly)
        reach = f.frame_mm / 2 - max(hw, hd) - 2.0
        vals = []
        for i in range(int(reach * f.s)):
            d = (i + 0.5) / f.s
            sx, sy = cx + ux * d, cy + uy * d
            vals.append(float(f.region(sx - 0.75, sx + 0.75,
                                       sy - 0.75, sy + 0.75).mean()))
        alpha = 1.0 - np.array(vals) / v_ref
        peak = float(alpha.max()) if len(alpha) else 0.0
        # threshold above the plate-wide irradiance ripple: a shadowless
        # frame must report zeros, not the ripple's half-max position
        if peak >= 0.05:
            above = np.nonzero(alpha >= peak / 2)[0]
            hm = (above[-1] + 0.5) / f.s if len(above) else 0.0
            out["corner"] = {"alpha": peak, "hm": float(hm)}
        else:
            out["corner"] = {"alpha": 0.0, "hm": 0.0}

    # contact strips: 0.5..1.5 mm outside each shadowed edge
    strips = {
        "right": lambda t0, t1: f.region(hw + 0.5, hw + 1.5, t0, t1),
        "left": lambda t0, t1: f.region(-hw - 1.5, -hw - 0.5, t0, t1),
        "bottom": lambda t0, t1: f.region(t0, t1, hd + 0.5, hd + 1.5),
        "top": lambda t0, t1: f.region(t0, t1, -hd - 1.5, -hd - 0.5),
    }
    shadowed = {"right": -lx, "left": lx, "bottom": -ly, "top": ly}
    hug = {}
    for name, comp in shadowed.items():
        if comp <= 0:
            continue
        horiz = name in ("bottom", "top")
        span = hw if horiz else hd
        perp = lx if horiz else ly      # component along the edge
        thirds = []
        for i in range(3):
            t0 = -span + 2 * span * i / 3
            t1 = -span + 2 * span * (i + 1) / 3
            thirds.append(1.0 - float(strips[name](t0, t1).mean()) / v_ref)
        # order lit-corner-first: the lit corner sits where the light's
        # along-edge component points from (perp < 0 -> low end, already
        # first; perp > 0 -> high end, so reverse)
        if perp > 0:
            thirds.reverse()
        hug[name] = {"lit_third": round(thirds[0], 4),
                     "mid_third": round(thirds[1], 4),
                     "far_third": round(thirds[2], 4)}
    if hug:
        out["hug"] = hug
    return out


def shiny_features(excess):
    """Two-feature decomposition of a baseline-subtracted glossy profile
    whose index 0 is the LIT edge: the grazing Fresnel RIM (searched
    within the first 12%) and the key light's MIRROR band (searched in
    the 20..55% window where the mirror geometry puts it). Shared by the
    fit and the compare gate."""
    excess = np.asarray(excess)
    n = len(excess)
    from_lit = np.arange(n) / (n - 1)

    rim_mask = from_lit <= 0.12
    rim_peak = float(excess[rim_mask].max()) if rim_mask.any() else 0.0

    band_mask = (from_lit >= 0.20) & (from_lit <= 0.55)
    masked = np.where(band_mask, excess, -np.inf)
    i = int(np.argmax(masked))
    peak = float(excess[i])
    above = excess >= peak / 2
    lo = i
    while lo > 0 and above[lo - 1] and band_mask[lo - 1]:
        lo -= 1
    hi = i
    while hi < n - 1 and above[hi + 1] and band_mask[hi + 1]:
        hi += 1
    return {
        "rim_peak_srgb": round(rim_peak, 4),
        "band_pos_frac": round(float(from_lit[i]), 4),
        "band_fwhm_frac": round((hi - lo + 1) / (n - 1), 4),
        "band_peak_srgb": round(peak, 4),
    }


def cyl_profile(img, meta):
    """Lightness profile through the dome center ALONG THE LIGHT
    DIRECTION (the axis the CSS shiny gradient runs on), plus a
    baseline-relative specular-feature summary. The baseline is a wide
    running median, applied identically to renders and CSS screenshots so
    the two are comparable; the fit and gate additionally use
    matte-reference subtraction on the render side."""
    f = Frame(img, meta)
    hw = f.plate_w / 2
    lx, ly = f.amb["light_x"], f.amb["light_y"]
    if lx == 0 and ly == 0:
        lx, ly = -1.0, -1.0
    norm = np.hypot(lx, ly)
    ux, uy = lx / norm, ly / norm    # from center toward the lit edge

    n = 65
    half = f.frame_mm / 2
    ts = np.linspace(-0.98, 0.98, n)
    rows = (uy * ts * hw + half) * f.s
    cols = (ux * ts * hw + half) * f.s
    r0 = np.clip(rows.astype(int), 0, f.img.shape[0] - 2)
    c0 = np.clip(cols.astype(int), 0, f.img.shape[1] - 2)
    fr, fc = rows - r0, cols - c0
    prof = ((1 - fr) * (1 - fc) * f.img[r0, c0] +
            (1 - fr) * fc * f.img[r0, c0 + 1] +
            fr * (1 - fc) * f.img[r0 + 1, c0] +
            fr * fc * f.img[r0 + 1, c0 + 1])
    # index 0 = lit end: ts negative side is toward the light
    prof = prof[::-1]

    win = max(3, n // 4)
    pad = np.pad(prof, win // 2, mode="edge")
    baseline = np.array([np.median(pad[i:i + win]) for i in range(n)])

    out = shiny_features(prof - baseline)
    out["profile_srgb"] = [round(float(v), 4) for v in prof]
    # saturated profiles cannot locate the band; the gate treats them
    # as residual-only
    out["clipped"] = bool(prof.max() >= 0.995)
    return out


def glow(img, meta):
    """Emissive halo, measured on the LIT edges (the shadow side is
    contaminated by the slab's own contact shadow): outward brightening
    profile -> edge alpha, half-max radius and falloff sigma."""
    f = Frame(img, meta)
    hw, hd = f.plate_w / 2, f.plate_d / 2
    reach = f.frame_mm / 2 - max(hw, hd) - 2.0
    lat = min(hw, hd) * 0.7
    lx, ly = f.amb["light_x"], f.amb["light_y"]

    profiles = []
    if lx < 0:
        profiles.append(f.region(-hw - reach, -hw, -lat, lat)
                        .mean(axis=0)[::-1])
    elif lx > 0:
        profiles.append(f.region(hw, hw + reach, -lat, lat).mean(axis=0))
    if ly < 0:
        profiles.append(f.region(-lat, lat, -hd - reach, -hd)
                        .mean(axis=1)[::-1])
    elif ly > 0:
        profiles.append(f.region(-lat, lat, hd, hd + reach).mean(axis=1))

    out = {"edge_alpha": 0.0, "halfmax_mm": 0.0, "sigma_mm": 0.0}
    for prof in profiles:
        skip = max(1, int(round(0.5 * f.s)))
        p = prof[skip:]
        v_far = float(p[int(len(p) * 0.7):].mean())
        if v_far >= 0.999:
            continue
        alpha = (p - v_far) / (1.0 - v_far)
        peak = float(alpha.max())
        if peak < 0.02:
            continue

        def outermost(level):
            above = np.nonzero(alpha >= level)[0]
            return (above[-1] + skip) / f.s if len(above) else 0.0

        out["edge_alpha"] += float(alpha[0])
        out["halfmax_mm"] += outermost(peak / 2)
        out["sigma_mm"] += max(0.0, (outermost(peak * 0.25) -
                                     outermost(peak * 0.75)) / 1.349)
    if profiles:
        for k in out:
            out[k] = round(out[k] / len(profiles), 4)
    return out


def groove(img, meta):
    """Recess (groove) characterization, viewed flat-on: only the floor is
    visible. Reports the floor's clear lightness (fill occlusion leaves it
    darker than the open ground even where no wall shadow falls) and, per
    lit-side interior edge, the wall's cast shadow band on the floor:
    inward alpha profile against the clear-floor value, half-max reach and
    falloff sigma. The clear-floor sample is the center strip, past the
    lit walls' shadow reach and clear of the far walls' bounce band."""
    f = Frame(img, meta)
    hw, hd = f.plate_w / 2, f.plate_d / 2   # the groove opening
    lx, ly = f.amb["light_x"], f.amb["light_y"]

    layout = reference_layout(f.amb, f.plate_w, f.plate_d)
    refs = [float(f.region(cx - 3, cx + 3, cy - 3, cy + 3).mean())
            for cx, cy in (layout["ref_a"], layout["ref_b"])]
    v_ref = float(np.mean(refs))

    # clear floor: the center strip — past the lit walls' shadow reach and
    # clear of the far walls' bounce band
    floor = float(f.region(-8, 8, -2.5, 2.5).mean())

    # toward-light walls shadow the floor (positive alpha); the far walls
    # catch the key and bounce it onto the floor beside them (negative
    # alpha = brightening) — the physical inset-highlight
    toward = {"left": -lx, "top": -ly, "right": lx, "bottom": ly}
    edges = {}
    for name, comp in toward.items():
        if comp == 0:
            continue                    # perpendicular wall: no band
        depth = 10.0
        if name in ("left", "right"):
            # narrow lateral window: the top/bottom walls' own bands span
            # the full groove width and would contaminate a wider average
            lat = hd * 0.25
            if name == "left":
                prof = f.region(-hw, -hw + depth, -lat, lat).mean(axis=0)
            else:
                prof = f.region(hw - depth, hw, -lat, lat).mean(axis=0)[::-1]
        else:
            lat = hw * 0.6
            if name == "top":
                prof = f.region(-lat, lat, -hd, -hd + depth).mean(axis=1)
            else:
                prof = f.region(-lat, lat, hd - depth, hd).mean(axis=1)[::-1]

        skip = max(1, int(round(0.5 * f.s)))    # rim AA
        alpha = 1.0 - prof[skip:] / floor       # signed: + shadow, - bounce
        idx = int(np.argmax(np.abs(alpha)))
        peak = float(alpha[idx])
        if abs(peak) < 0.04:
            edges[name] = {"hm_mm": 0.0, "sigma_mm": 0.0, "peak_alpha": 0.0,
                           "kind": "shadow" if comp > 0 else "bounce"}
            continue

        mag = np.abs(alpha)

        def outermost(level):
            above = np.nonzero(mag >= level)[0]
            return (above[-1] + skip) / f.s if len(above) else 0.0

        hm = outermost(abs(peak) / 2)
        sigma = max(0.0, (outermost(abs(peak) * 0.25) -
                          outermost(abs(peak) * 0.75)) / 1.349)
        edges[name] = {"hm_mm": float(hm), "sigma_mm": float(sigma),
                       "peak_alpha": peak,
                       "kind": "shadow" if comp > 0 else "bounce"}

    return {
        "v_ref": v_ref,
        "floor_srgb_pct": floor * 100.0,
        "floor_lstar": float(srgb_to_lstar(floor)),
        "floor_over_ref": floor / v_ref if v_ref else 0.0,
        "edges": edges,
    }


EXTRACTORS = {
    "surface_lightness": surface_lightness,
    "edge_bands": edge_bands,
    "drop_shadow": drop_shadow,
    "surface_gradient": surface_gradient,
    "cyl_profile": cyl_profile,
    "glow": glow,
    "groove": groove,
}
