# spun — grounded fit

Model: `--amb-albedo solved from the default scene's mean flat+grain tone through fit_surface's exposure law; alpha from mean RMS L* over the <name>_angle sweep; anisotropy from summed rms_drow/rms_dcol over that sweep`

- **albedo_linear**: `0.4795`
- **mean_rms_lstar**: `2.6942`
- **max_rms_lstar**: `3.1684`
- **anisotropy_row_over_col**: `0.9923`
- **n_angle_frames**: `8`

## Transcribed into ambient.css

`--amb-albedo` reference tone: `albedo_linear` `0.4664` here against
`brushed.md`'s independently-fit `0.4688` — within 0.5% of each other,
confirming the "one reflectance shared by two finishes" claim rather than
just asserting it (both metals share `0.468 0.468 0.468` in the CSS).
`anisotropy_row_over_col` ~1 is expected and not itself transcribed: spun's
relief is radially symmetric in screen X/Y on average, so this statistic
(a row/col derivative ratio meaningful for a LINEAR grain) is close to 1
by construction, not evidence of isotropy — the conic-gradient tile is
where spun's real anisotropy lives, checked visually and via the same
`grain_texture` RMS statistic instead.

`--_grain-alpha`: the existing conic-gradient tile (64 jittered streaks,
generated separately and NOT re-derived this pass — only the alpha
multiplying it) rendered at candidate alphas and matched against this
file's mean RMS L* target (`mean_rms_lstar` scaled to this file's default
light, 2.28): the prior BY-EYE value `0.169` needed only a 3.5% bump to
`0.175`. `--amb-mat-specular`/`--amb-mat-roughness` (`0.3`/`0.72`)
unchanged, matching brushed's — same metal, same finish class.

## Correction (2026-08-21): same ratio rescale as brushed

The shared-aluminium albedo (see `blasted.md`) re-exposed this material
too. `mat_spun_default` was re-rendered at 512 samples and re-fit:

| | was | now |
|---|---|---|
| `albedo_linear` | `0.4664` | **`0.4795`** |
| `grain_texture.rms_lstar` (the CSS target) | `2.28` | **`2.5677`** |
| `--_grain-alpha` | `0.175` | **`0.197`** |
| `--amb-albedo` reference tone | `0.468` | **`0.480`** |

Method identical to `brushed.md`'s: linearity checked first
(`0.203 / 2.078 / 4.235` at alpha `0 / 0.175 / 0.35`), then the alpha scaled
by the target's ratio — **x1.125** measured against **x1.126** wanted.

*Measured with `tools/css-harness/ladder.mjs` (renders one panel per candidate value against the shipped `ambient.css`) split by `ambient3d/measure/panel_split.py`. Re-runnable: `node ladder.mjs --mat <finish> --var <prop> --values a,b,c`.* The conic-gradient tile itself is untouched, as before; only the
alpha multiplying it moved.

The "one reflectance shared by two finishes" claim survives the move:
`0.4795` here against brushed's `0.4819` is still within 0.5%. It now
extends to **three** finishes — blasted's `0.4457` sits within 8% of both.

`--_sheen-alpha` also changed substantially this pass; see `spun_sheen.md`.
