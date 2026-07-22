"""Registration check for a Blender/CSS frame pair.

    python3 align.py <blender.png> <css.png> [--out out/align]

Writes three diagnostics and prints the numbers that decide whether the
wipe will land:

  side.png    the pair side by side
  blend.png   50/50 average — silhouettes must coincide
  diff.png    absolute difference, boosted; position/size error shows up as
              bright paired crescents, shading error as soft gradients

Silhouettes are compared by thresholding each frame against its own
background level, so the reported bbox/centroid drift is in output pixels
(4 px = 1 mm at the rig's pxPerMm).
"""

import argparse
import os

import numpy as np
from PIL import Image, ImageFilter


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64) / 255.0


def silhouette(img):
    """The subject's own detail, isolated from the frame background.

    A flat background threshold does not work on the Blender side: the key
    light falls off across the frame, so the whole plate reads as "not
    background". Comparing each pixel against a heavily blurred copy of the
    same frame removes that low-frequency ramp and leaves the component's
    edges, facets and contact shadow.
    """
    grey = img.mean(axis=2)
    lo = np.asarray(Image.fromarray((grey * 255).astype(np.uint8))
                    .filter(ImageFilter.GaussianBlur(24)), dtype=np.float64) / 255.0
    return np.abs(grey - lo) > 0.02


def stats(name, mask):
    ys, xs = np.nonzero(mask)
    if not len(xs):
        return None
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    cen = (xs.mean(), ys.mean())
    print(f"{name:8s} bbox x[{box[0]},{box[2]}] y[{box[1]},{box[3]}] "
          f"({box[2] - box[0] + 1}x{box[3] - box[1] + 1} px)  "
          f"centroid ({cen[0]:.1f}, {cen[1]:.1f})")
    return box, cen


def main():
    p = argparse.ArgumentParser(prog="align.py")
    p.add_argument("blender")
    p.add_argument("css")
    p.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "out", "align"))
    args = p.parse_args()

    a, b = load(args.blender), load(args.css)
    if a.shape != b.shape:
        raise SystemExit(f"size mismatch: {a.shape[1]}x{a.shape[0]} vs {b.shape[1]}x{b.shape[0]}")
    os.makedirs(args.out, exist_ok=True)

    ma, mb = silhouette(a), silhouette(b)
    ba = stats("blender", ma)
    bb = stats("css", mb)
    if ba and bb:
        print(f"drift    bbox corners {tuple(int(x - y) for x, y in zip(bb[0], ba[0]))} px, "
              f"centroid ({bb[1][0] - ba[1][0]:+.1f}, {bb[1][1] - ba[1][1]:+.1f}) px")
        inter = (ma & mb).sum()
        print(f"overlap  IoU {inter / (ma | mb).sum():.3f}")

    d = np.abs(a - b)
    print(f"pixels   mean |diff| {d.mean():.4f}  p99 {np.percentile(d, 99):.4f}  max {d.max():.4f}")

    def save(name, arr):
        Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(
            os.path.join(args.out, name))

    save("side.png", np.concatenate([a, b], axis=1))
    save("blend.png", (a + b) / 2)
    save("diff.png", 1.0 - d * 6.0)
    print(f"WROTE {args.out}/{{side,blend,diff}}.png")


main()
