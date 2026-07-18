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


EXTRACTORS = {
    "surface_lightness": surface_lightness,
    "edge_bands": edge_bands,
}
