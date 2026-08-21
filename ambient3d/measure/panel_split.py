"""Low-frequency SWEEP vs high-frequency GRAIN split of a flat surface crop.

The statistic behind the CSS-side sheen and grain fits in
derived/notes/{brushed,spun,blasted{,_sheen}}.md. Gaussian-blur the crop,
then take RMS L* of the blur (the sweep — a broad highlight or an
illumination gradient) and of the residual (the grain — micro-relief).

WHY sigma IS A FRACTION OF WIDTH, NOT A PIXEL COUNT: a reference photo, a
512px render and a browser panel are three different spatial scales, so a
shared sigma=6 silently compares three different cutoffs and the numbers
stop being commensurable. 2% of crop width keeps the cutoff at one fixed
fraction of the object.

This is deliberately NOT metrics.py's grain_texture, which needs a Frame
with a mm scale the browser has no equivalent of. Where a CSS-side fit only
needs to know how a parameter SCALES (see brushed.md's ratio method), use
this and take a ratio — the choice of sigma then cancels out entirely.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

SIGMA_FRAC = 0.02


def _srgb_to_linear(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _linear_to_lstar(y):
    y = np.clip(y, 0, 1)
    return np.where(y > 0.008856, 116 * np.cbrt(y) - 16, 903.3 * y)


def split(img, box=None):
    """(mean L*, sweep RMS L*, grain RMS L*) over `box` of `img`.

    img: a PIL image or a path. box: (x0, y0, x1, y1), defaults to the whole
    image. Crop to the interior of a panel before calling — a rounded corner
    or an edge highlight is not part of either statistic.
    """
    im = Image.open(img) if isinstance(img, str) else img
    im = im.convert("L")
    if box:
        im = im.crop(box)
    sigma = max(1.0, SIGMA_FRAC * im.size[0])
    flat = np.asarray(im).astype(float) / 255
    blur = np.asarray(im.filter(ImageFilter.GaussianBlur(sigma))).astype(float) / 255
    lstar = _linear_to_lstar(_srgb_to_linear(flat))
    lstar_blur = _linear_to_lstar(_srgb_to_linear(blur))
    return float(lstar.mean()), float(lstar_blur.std()), float((lstar - lstar_blur).std())


def split_grid(img, cols, rows, pad, gap, size, inset=(0.15, 0.20)):
    """Same, over every panel of a ladder rendered by tools/css-harness/ladder.mjs.

    Yields one (mean, sweep, grain) per panel in row-major order, measuring
    the middle 70%x60% of each — the same fraction the reference photo crops
    were taken at.
    """
    im = Image.open(img) if isinstance(img, str) else img
    mx, my = int(size * inset[0]), int(size * inset[1])
    for r in range(rows):
        for c in range(cols):
            x, y = pad + c * (size + gap), pad + r * (size + gap)
            yield split(im, (x + mx, y + my, x + size - mx, y + size - my))


if __name__ == "__main__":
    for path in sys.argv[1:]:
        mean, sweep, grain = split(path)
        print(f"{path}: mean {mean:.2f}  sweep {sweep:.3f}  grain {grain:.3f}")
