# brushed — grounded fit

Model: `--amb-albedo solved from the default scene's mean flat+grain tone through fit_surface's exposure law; alpha from mean RMS L* over the <name>_angle sweep; anisotropy from summed rms_drow/rms_dcol over that sweep`

- **albedo_linear**: `0.4819`
- **mean_rms_lstar**: `2.4591`
- **max_rms_lstar**: `3.0814`
- **anisotropy_row_over_col**: `7.4963`
- **n_angle_frames**: `8`

## Transcribed into ambient.css

CSS-side closed-loop search (render this file's own SVG turbulence tile at
candidate `baseFrequency`/`alpha`, re-measure with `grain_texture`, repeat —
the mechanism's response to those parameters doesn't match the Blender
render's, so a direct/linear translation was not trustworthy): baseFrequency
`0.02 20` (from `0.06 2.6`), tile size unchanged (128px), `--_grain-alpha`
`0.169` -> `0.47`. Verified render: RMS L* 2.207 against the 2.2145 target
(mat_brushed_default's `mean_rms_lstar` used for the target, not this
sweep's average — matched light condition, this file's default key
0.9/fill 0.7). `--amb-albedo` reference tone -> `0.468 0.468 0.468`.

Not re-grounded this pass: `--amb-mat-specular`/`--amb-mat-roughness`
(0.3/0.72, unchanged) and `--_sheen-alpha` (unchanged) — see the CSS
comment above `.amb-mat-brushed` for why the sheen sweep's measurement
isn't trustworthy as a fit.

## Correction (2026-08-20): baseFrequency 0.02 rendered as discontinuous dashes

`0.02 20` hit both grounded targets (RMS L* 2.207, anisotropy untested at
the time) but was never re-tiled at the shipped `--_grain-scale: 128px`
before being accepted — the closed-loop search only ever rendered a single
untiled tile. Once tiled, it showed clear periodic seams (~43px apart)
instead of continuous streaks: `stitchTiles="stitch"` snaps 0.02 to the
nearest integral cycle count over 128px, landing on 3 cells, and with only
3 Perlin lattice cells spanning the width and a fast per-row axis
(baseFrequency-y 20), each cell's own smooth Hermite arch is exposed as a
visible seam. `numOctaves` does not fix this (fBm's fundamental octave
still carries most of the energy); the fix is more lattice cells, not more
detail.

Re-ran the same closed-loop search with cells-per-tile as an explicit
second axis, testing a `baseFrequency-x` ladder at exact `n/128` values
(so `stitchTiles="stitch"` is a no-op and the tested frequency is the
rendered one) crossed with `numOctaves` 1-3, re-tiling every candidate at
128px before measuring or judging it visually. Below ~10 cells the seams
are visible; above ~40 the streaks start reading as isotropic mottle
rather than brushed grain; `numOctaves` > 1 adds a second, much finer
octave (both frequencies double) that reads as cross-hatch rather than
grain. Landed on baseFrequency-x `36/128 = 0.28125`, `numOctaves` still 1:

- **baseFrequency**: `0.02 20` -> `0.28125 20`
- **--_grain-alpha**: `0.47` -> `0.45` (more cells at the old alpha read
  fractionally busier, needed a touch less to hit the same target)
- **RMS L***: `2.219` against the `2.2145` target (was `2.207`)
- **anisotropy (row/col)**: `7.60` against the `7.4963` target — not
  previously checked on the CSS side at all; this correction is the first
  time the shipped constant's anisotropy was verified against the render.

`--amb-albedo` reference tone is unchanged (`0.468 0.468 0.468`) — this
correction only touches the relief's own spatial frequency and contrast,
not the surface tone it sits on.

## Correction (2026-08-21): shared-aluminium albedo moved the target; alpha rescaled

Nothing above is retracted — the tile, its `baseFrequency` and its
anisotropy all stand. What changed is the target underneath them.

`.amb-mat-blasted`'s regrounding (see `blasted.md`) put all 14 grain
entries in `manifest.json` on one shared aluminium albedo of `0.49`, which
re-exposed this material slightly brighter, so `mat_brushed_default` was
re-rendered at 512 samples and re-fit:

| | was | now |
|---|---|---|
| `albedo_linear` | `0.4688` | **`0.4819`** |
| `grain_texture.rms_lstar` (the CSS target) | `2.2145` | **`2.5334`** |
| `--_grain-alpha` | `0.45` | **`0.515`** |
| `--amb-albedo` reference tone | `0.468` | **`0.482`** |

Alpha was **rescaled by the target's own ratio, not re-searched**, and the
reason is worth keeping: the CSS-side grain response is linear in alpha
over this range, measured at `0.124 / 1.472 / 2.997` for alpha
`0 / 0.45 / 0.90` — the excess over the alpha-0 baseline doubles when alpha
doubles. Because only the ratio is used, the answer does not depend on what
blur radius or crop the CSS-side measurement uses; that scale question
cancels. Verified: alpha `0.45 -> 0.515` moves the measured grain excess by
**x1.159** against the **x1.144** the target moved.

*Measured with `tools/css-harness/ladder.mjs` (renders one panel per candidate value against the shipped `ambient.css`) split by `ambient3d/measure/panel_split.py`. Re-runnable: `node ladder.mjs --mat <finish> --var <prop> --values a,b,c`.*

`--_sheen-alpha` also changed this pass, and substantially — see
`brushed_sheen.md`, which supersedes the "not re-grounded, see the CSS
comment" line above.

## Hand-tune (2026-08-21): the tile's SHAPE is now chosen by eye

Nothing above is retracted, and the fit is not weakened: the grain contrast
this note grounds is unchanged (**1.680** RMS L* against the previous tile's
**1.695**, measured the same way; alpha `0.417` through `0.420` all read
`1.680`, and that plateau is 8-bit quantisation, so a third decimal on this
alpha would be false precision). What moved is the tile's geometry, on a
direct request for blurrier grain with longer streaks, and it moved by eye
rather than by measurement.

| | was | now |
|---|---|---|
| tile size / `--_grain-scale` | `128px` | **`512px`** |
| `baseFrequency` | `0.28125 20` | **`0.015625 0.9`** |
| cells across the tile | `36` | **`8`** |
| streak length | `3.6px` | **`64px`** |
| across-grain period | `0.05px` | **`1.1px`** |
| `--_grain-alpha` | `0.515` | **`0.42`** |

Alpha was rescaled by the tile's own contrast ratio, the same method the
2026-08-21 correction above uses and for the same reason: the response is
linear in alpha, so only the ratio matters and the measurement's blur radius
cancels.

### The old tile did not deliver this file's own anisotropy

The `anisotropy_row_over_col` of `7.4963` at the top of this note, and the
`7.60` the 2026-08-20 correction reports as verified on the CSS side, are
not what a browser rendered. Measured off a real Chrome raster with
`ambient3d/measure/variant_grid.py`, the shipped `0.28125 20` tile reads
**1.55** at dpr 1 and **2.70** at dpr 2 — near isotropic.

The cause is Nyquist, not the fit. `baseFrequency-y 20` is 20 cycles per CSS
pixel; `feTurbulence` rasterises at device resolution, so at 1:1 the across-
grain signal is sampled forty times below its own period and what reaches
the screen is its aliasing. Aliasing carries no direction, which is why the
material read as a woven cross-hatch. The 2026-08-20 correction's CSS-side
`7.60` was measured through a different rasterisation regime and does not
describe what ships.

The new tile stays off the pixel grid on both axes and measures **12.15** at
dpr 1 (10.44 at dpr 2) against the render's `7.4963`. That **overshoots**,
and the overshoot is a choice rather than a defect — the ratio climbs as the
across-grain period gets finer, and the requested look is finer than the fit.
Both facts are worth holding at once: the old tile *undershot*, reading 1.55
while the note claimed 7.60, and that was a bug; this one overshoots
knowingly. The intermediate `y0.35` measured **7.13**, the closest to the fit
of anything tried, and was rejected on looks.

The first candidate ladder, at matched contrast, dpr 1: `0.28125 20`
(previous) **1.55**, `256px` 16 cells `y0.5` **5.48**, `512px` 12 cells
`y0.5` **8.81**, `512px` 8 cells `y0.35` **7.13**. At dpr 2 the same four
read 2.70 / 4.74 / 6.90 / 5.42 — the ratio is the one figure here that moves
with device pixel ratio, since it is the raster being measured. Grain RMS is
stable across both.

### The across-grain frequency, and the value not to reach for

`y0.35` shipped first and read as thick soft bands rather than brushed
lines, so a second ladder swept the across-grain frequency alone at fixed
streak length, matched contrast, dpr 1:

| `baseFrequency-y` | period | grain RMS L* | row/col |
|---|---|---|---|
| `0.35` | 2.9px | `1.687` | `7.13` |
| `0.5` | 2.0px | `1.837` | `10.62` |
| `0.7` | 1.4px | `1.703` | `11.12` |
| **`0.9`** | **1.1px** | **`1.680`** | **`12.15`** |
| `1.0` | 1.0px | `1.212` | `8.38` |

**`1.0` is the value not to reach for.** At exactly one cycle per CSS pixel
the Perlin lattice coincides with the pixel grid, and every sample lands on
a lattice node — where gradient noise is zero by construction. Contrast
collapses and the anisotropy falls back toward isotropic. That alignment,
not the frequency's magnitude, is also what the old `y20` was doing: 20
cycles per pixel is the same coincidence twenty times over. The rule to
carry forward is **avoid integer cycles per device pixel**, which is a
sharper statement than "stay under Nyquist" and explains both failures.

`0.9` snaps to 461 cycles over 512px — off the grid — and holds at
`1.68 +/- 0.05` across every device pixel ratio tested (1, 1.11, 1.25, 1.5,
1.75, 2), including each candidate's own worst-case alignment where its
cycles-per-device-pixel would land on 1. Only the exact-integer case fails.

### Seams, re-checked against the failure this note already records

A 512px tile has further to wrap than a 128px one, and the 2026-08-20
correction above is precisely a tile that hit both fitted targets and still
tiled visibly. Rendered across two full repeats in each axis at 4x
amplitude: no seam is visible. On a boundary-jump ratio — mean `|dL|` across
the tile boundary over the median column's — the new tile measures **1.09**,
against the old tile's own **1.17** and the **1.31** of the `baseFrequency
0.02` tile that correction rejected.

Its 8 cells do sit under the ~10-cell floor that correction sets. That floor
was measured at a 128px tile, where 8 cells means 16px cells; at 512px they
are 64px, and the smooth Hermite arch the correction describes does not
appear. Recorded as a known deviation rather than an oversight.

*Rendered with `tools/css-harness/variants.mjs` (which varies whole tiles,
where `ladder.mjs` varies one custom property), spec
`tools/css-harness/specs/handtune-2026-08-21-brushed.json`, measured with
`ambient3d/measure/variant_grid.py`. Re-runnable: `node
tools/css-harness/variants.mjs <spec> | python3
ambient3d/measure/variant_grid.py`.*
