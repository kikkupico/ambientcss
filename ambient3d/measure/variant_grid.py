"""Measure a grid rendered by tools/css-harness/variants.mjs.

    node tools/css-harness/variants.mjs spec.json | python3 ambient3d/measure/variant_grid.py

Reports panel_split's mean/sweep/grain plus the ANISOTROPY RATIO, which is
the statistic a brushed finish lives or dies by and the one panel_split has
no reason to carry (it is meaningless on an isotropic surface).

WHY THE RATIO IS MEASURED ON THE BROWSER RASTER, not computed from the tile's
baseFrequency x:y: feTurbulence rasterises at DEVICE resolution, so a tile
whose across-grain frequency sits above Nyquist does not render the grain it
specifies — it renders that grain's aliasing, which is close to isotropic and
changes with devicePixelRatio. The shipped 128px brushed tile asks for 20
cycles per CSS pixel and measures 1.55 here at dpr 1 against the 7.4963 its
Blender fit targets. Only the raster knows.
"""
import json
import sys

import numpy as np
from PIL import Image

from panel_split import _linear_to_lstar, _srgb_to_linear, split


def aniso(img, box=None):
    """RMS row-to-row over RMS column-to-column pixel difference in L*.

    The same pair metrics.py's grain_texture reports as rms_drow / rms_dcol,
    off a browser screenshot instead of a Blender render. Grain running
    horizontally is coarse along rows and fine across them, so a brushed
    finish reads high and an isotropic one reads 1.
    """
    im = Image.open(img) if isinstance(img, str) else img
    im = im.convert("L")
    if box:
        im = im.crop(box)
    lstar = _linear_to_lstar(_srgb_to_linear(np.asarray(im).astype(float) / 255))
    dcol = lstar[:, 1:] - lstar[:, :-1]
    drow = lstar[1:, :] - lstar[:-1, :]
    return float(np.sqrt(np.mean(drow ** 2)) / max(1e-9, np.sqrt(np.mean(dcol ** 2))))


def main(grid):
    im = Image.open(grid["out"])
    # Same middle-70%x60% inset panel_split.split_grid uses, so the numbers
    # are commensurable with a ladder's.
    mx, my = int(grid["w"] * 0.15), int(grid["h"] * 0.20)
    print(f"{'label':<28} {'mean':>6} {'sweep':>7} {'grain':>7} {'row/col':>8}")
    for i, label in enumerate(grid["labels"]):
        r, c = divmod(i, grid["cols"])
        x = grid["pad"] + c * (grid["w"] + grid["gap"])
        y = grid["pad"] + r * (grid["h"] + grid["gap"])
        box = (x + mx, y + my, x + grid["w"] - mx, y + grid["h"] - my)
        mean, sweep, grain = split(im, box)
        print(f"{label:<28} {mean:6.2f} {sweep:7.3f} {grain:7.3f} {aniso(im, box):8.2f}")


if __name__ == "__main__":
    main(json.loads(sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()))
