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
    return out


EXTRACTORS = {
    "surface_lightness": surface_lightness,
    "edge_bands": edge_bands,
    "drop_shadow": drop_shadow,
}
