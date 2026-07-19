"""Copy the docs-flagged ground-truth renders into the docs site.

    python3 measure/publish.py

Every manifest scene with docs.publish gets its calib render copied to
apps/docs/static/img/renders/<slug>.png (optimized with oxipng when
available). CI never runs Blender: these copies are committed.
"""

import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(ROOT)
DEST = os.path.join(REPO, "apps", "docs", "static", "img", "renders")


def main():
    with open(os.path.join(ROOT, "manifest.json")) as fh:
        manifest = json.load(fh)

    os.makedirs(DEST, exist_ok=True)
    have_oxipng = shutil.which("oxipng") is not None
    count = 0
    for scene in manifest["scenes"]:
        docs = scene.get("docs")
        if not (docs and docs.get("publish")):
            continue
        src = os.path.join(ROOT, "renders", "calib", scene["id"] + ".png")
        if not os.path.exists(src):
            print(f"SKIP (not rendered): {scene['id']}", file=sys.stderr)
            continue
        dst = os.path.join(DEST, docs["slug"] + ".png")
        shutil.copyfile(src, dst)
        if have_oxipng:
            subprocess.run(["oxipng", "-q", "-o", "2", dst], check=False)
        count += 1
        print(f"PUBLISHED {docs['slug']}.png")
    print(f"{count} render(s) -> {DEST}")


if __name__ == "__main__":
    main()
