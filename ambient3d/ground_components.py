"""Flat-on ground-truth renders of the component referents, run inside
Blender:

    blender -b -P ground_components.py
    blender -b -P ground_components.py -- knob-flute button-round

Each @ambientcss/components component (and each button-shape / knob-type
variant) gets its 3D counterpart from `referents.py` — built at the CSS
component's dimensions (1 CSS px = 1 mm, --ambx-grid = 4px), in neutral
calibration materials — rendered one per frame on the calibration rig under
the default amb lighting: the same flat-on view as the effect calibration
frames, minus the reference patches (these are published docs imagery, not
measured frames). Writes renders/components/<name>.png; measure/publish.py
copies them into the docs site.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import skeuo_kit as kit
import amb_params as ap
from referents import REFERENTS

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "renders", "components")


def main():
    # optional filter: blender -b -P ground_components.py -- knob-flute ...
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    names = argv or list(REFERENTS)
    os.makedirs(OUT, exist_ok=True)
    a = ap.amb()
    for name in names:
        build = REFERENTS[name]
        kit.reset_scene()
        ap.setup_calibration_rig(a, patches=False)
        build()
        png = os.path.join(OUT, f"{name}.png")
        kit.setup_render(png, resolution=ap.FRAME_MM * ap.PX_PER_MM,
                         samples=256)
        ap.finalize_calibration_render(samples=256)
        kit.render_and_save(png)
        print(f"WROTE {png}")


main()
