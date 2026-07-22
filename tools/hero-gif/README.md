# hero-gif — the README hero

Builds `ambientcss.mp4` and `ambientcss.gif`: a hardware panel raytraced in
Blender, rotating from a 3/4 view down to flat-on, then wiped across to the
same panel rendered by `@ambientcss/css` in a browser.

The wipe is the point. Both halves are rendered at the calibration rig's
scale — 1 CSS px = 1 mm, `pxPerMm` device pixels each — from one layout file,
so they register to the pixel. What you see at the seam is the actual
distance between the raytrace and the CSS approximation of it.

## Build

```sh
pnpm --filter @ambientcss/hero-gif build          # the CSS page
node shot.mjs panel                                # -> out/css/panel.png
blender -b -P ../../ambient3d/hero_panel.py        # -> out/blender/panel/*.png
python3 assemble.py                                # -> ../../ambientcss.{mp4,gif}
```

Or `pnpm hero:gif` from the repo root for everything but the Blender step.

### Video first, then a cut

`assemble.py` encodes the whole film to mp4 at full resolution, then cuts the
GIF out of that video rather than rendering it separately — so the two can
never drift apart, and the expensive stretch (the camera move, the only place
where every pixel changes) stays in the video where h264 handles it instead
of bloating a GIF. The GIF window runs from just before the camera settles
(`GIF_LEAD`), through the wipe and the hold, to the point on the return leg
showing that same frame again, so the excerpt loops on its own. The return
leg is decimated, so it covers ground faster than the forward one — the
window therefore has to close on the frame that is literally the opening
image, and span a whole number of GIF frame-steps to land on it. Expect a
brief settle at the top of the loop where the fast return arrives and holds;
that is the duplicate frame, not a stutter.

Flags: `--fps`, `--gif-fps`, `--gif-width`, `--colors`, `--dither`.

## How the two halves stay aligned

`layouts/panel.json` is the single source of truth: frame size and component
positions in millimetres, plus the `amb` light environment.

- **Blender** (`ambient3d/hero_panel.py`) builds the panel from the component
  referents in `ambient3d/referents.py` — the same ones `ground_components.py`
  renders for the docs — on the calibration rig from `amb_params.py`. The
  camera stays orthographic and its move ends at the rig's own pose, so the
  final frame is framed identically to the CSS shot by construction.
- **CSS** (`src/main.tsx` + `shot.mjs`) mounts the real React components at
  the same coordinates, in a viewport of `frameMm` CSS px at
  `deviceScaleFactor: pxPerMm`. Note the vertical flip: the rig maps
  `sy = -Y`, so a referent at `(x, y)` mm is a node at
  `left: frameW/2 + x`, `top: frameH/2 - y`.

The device itself is the calibration plate (`ambient3d/components/plate.py`)
— the most directly grounded object in the project — so its CSS peer is a
plain `.ambient .amb-surface .amb-chamfer-2` box at the same thickness and
elevation, and the screen is an `.amb-groove`. Nothing in the frame is
bespoke to the hero.

The composition is not bespoke either. Every coordinate in `panel.json` is
built from the tight-12 / normal-20 / loose-32 mm tiers of the components'
spacing scale — the same `GAP_*_MM` constants `ambient3d/components/_common.py`
composes its demo device from — using each referent's *base tile* as its
footprint, so the clearance between two controls is never tighter than the
tier between their tiles. Two columns (a display-and-mixer strip, a
three-row control block) sit loose apart and come to the same height by
construction, and the body's own edge margin is one more loose slot. The
arithmetic is written out in the file's `layout.note`; change a control and
you re-run that arithmetic rather than nudging numbers.

Four adjustments make a panel-sized frame behave like the 128 mm
calibration frame: the key light is pushed out in proportion to the frame
(with its energy scaled by the square, or everything renders dark); the
ground is scaled with it too, or the tilted opening shot runs off the edge
of the plane into the world background; the
referents' base tiles are sunk flush into the faceplate, since on a device
those tiles would be raised plates and the CSS components have no such
plate; and cuts into the body compensate for `boolean_cut` re-applying the
body's transform to its cutter, which is a no-op on the ground at z = 0 but
lifts every recess once the target is elevated.

## Checking alignment

```sh
python3 align.py out/blender/panel/0049.png out/css/panel.png
```

Prints silhouette drift and IoU and writes `out/align/{side,blend,diff}.png`.
`blend.png` is the useful one: at 50/50 the two panels should read as a single
object. Divergence in shading is expected; divergence in position or size is a
bug.

`layouts/gate.json` is a single knob at the docs referent's exact framing —
the smallest thing that proves the two pipelines still register.
