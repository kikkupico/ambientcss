# brushed_sheen — grounded fit

Model: `amplitude: mean sheen excess (axis_profile minus its relief-only twin) = s * Ik + s0 (sRGB), from brushed_sheen. position: --_sheen-at's pos_frac (0=top, 1=bottom) = pos_s * light_y + pos_s0, from the high-contrast light_y sweep brushed_sheen_pos, where pos_frac is a real _band_features peak (not noise) — see the note for why the two need separate sweeps`

- **s_mean_per_key**: `0.0021`
- **s0_mean**: `0.0069`
- **r2**: `0.999`
- **n_samples**: `3`
- **pos_slope_per_light_y**: `0.4202`
- **pos_intercept**: `0.5378`
- **pos_r2**: `0.975`
- **pos_fwhm_frac_at_edges**: `[0.0064, 1.0032, 0.0128]`
- **n_pos_samples**: `3`

## Transcribed into ambient.css

`--_sheen-alpha`: amplitude alone (mean excess, `s_mean_per_key`/`s0_mean`
above) does not map directly to the CSS alpha — the sheen paints
`hsl(H S 100% / alpha)` over the surface, so `excess = alpha * (1 -
surface_srgb)`. Inverted per key sample against each frame's own
relief-only reference tone and re-fit affine in key (this is shared with
`spun_sheen.md` — both invert to the same line, see there):
`--_sheen-alpha: calc(key * 0.11 + 0.04)` -> `calc(key * 0.0207 +
0.0103)`, roughly a 4-5x amplitude cut. `--_sheen-at`:
`pos_slope_per_light_y`/`pos_intercept` above transcribe directly (already
in the CSS's own 0-1-as-percent convention): `calc(50% + light_y * 30%)`
-> `calc(54% + light_y * 42%)`.

NOT transcribed: the half-width (`42%` in the gradient's stop offsets,
unrelated to the new `42%` slope above — coincidentally the same digits).
`pos_fwhm_frac_at_edges` is `[0.0064, 1.0032, 0.0128]` for light_y =
`[-1, 0, 1]` — near-zero at the two extremes (the band reads as a sharp
glint concentrated at the top/bottom silhouette, not the broad ~84%-wide
band the CSS paints) and ~100% at light_y=0 (no resolvable peak against
the flat middle). Three points, two different failure modes: not enough
to safely replace a shipped shape. A future pass wanting the width would
need a finer light_y sweep (5-7 values) to see whether the edge
concentration is real specular geometry (would motivate a genuinely
different shape, closer to a grazing-Fresnel rim than a broad band) or an
artifact of sampling right at the plate's silhouette.

## Superseded: original cyl_profile attempt (kept for context)

The original `NOT transcribed — provisional` pass (cyl_profile, sampling
along the light diagonal) is superseded, not merely corrected: that
geometry mismatch was real, but fixing it alone (an early axis_profile
pass, single-column, no averaging) still failed — the material's own fine
relief noise at one pixel column is comparable in amplitude to the sheen,
so a peak search over a raw single-column profile finds noise, not
signal, with a spuriously high r2 (the noise happened to scale
monotonically with key by chance). Averaging axis_profile across most of
the plate's width (the CSS band is stated as x-invariant, so this loses
no real signal) is what made amplitude measurable at all; the position
fit needed the further, separate high-contrast light_y sweep above.

## Correction (2026-08-21): the rig cannot see this quantity; the cut it caused is reverted

**The fit above is withdrawn as a basis for `--_sheen-alpha`.** It cut the
amplitude 4-5x (`calc(key * 0.11 + 0.04)` -> `calc(key * 0.0207 + 0.0103)`),
which at key 0.9 is an alpha of ~0.029 — effectively invisible. That cut is
an artifact of measuring a rig that is structurally blind to what was being
measured.

### Why the rig cannot see it

The calibration camera is **orthographic** (`amb_params.py:426`). Every view
ray is parallel; reflected off a flat plate they all leave in one direction
and sample a single point of the environment. Positional variation can only
reach the image through perturbed normals. The reference crops are
perspective photographs of a large near source, which is exactly where their
gradient comes from.

Measured, not inferred: **24 renders across roughness x anisotropy x bump
strength reach a maximum low-frequency sweep RMS of 1.04 against the
reference crops' 16.2, and with the bump reduced the sweep goes to exactly
0.00** — proving the bump was the only source of spatial variation in the
frame. Do **not** change the camera to perspective; it would invalidate
every other calibration in the manifest.

### The reference crops cannot supply a replacement target either

This is a rejection, not a miss. `16.2` is the low-frequency RMS across the
middle 70%x60% of a photograph of a large aluminium sheet, so most of that
energy is scene-scale illumination falloff across a big object. A 240px
control has no scene-scale falloff to reproduce, and forcing one into the
sheen band produces a wash, not a sheen. Measured on the panel harness:

| alpha (at key 0.9) | 0 | 0.0289 | 0.10 | 0.139 | 0.30 | 0.50 | **1.0** |
|---|---|---|---|---|---|---|---|
| brushed sweep RMS L\* | 0.186 | 0.259 | 0.649 | 0.885 | 1.908 | 3.190 | **6.284** |
| spun sweep RMS L\* | 2.315 | 2.314 | — | 2.648 | 3.698 | 5.214 | **8.290** |

A **fully opaque white band** reaches 6.28 (brushed) / 8.29 (spun) against
targets of 16.2 / 13.4. The exposure-invariant sweep/grain *ratio* fails the
same way (3.7 at alpha 1.0 against the crops' 6.5), which rules out exposure
difference as the explanation and leaves non-commensurability. **The target
has no solution at any alpha. Do not re-run this fit.**

*Measured with `tools/css-harness/ladder.mjs` (renders one panel per candidate value against the shipped `ambient.css`) split by `ambient3d/measure/panel_split.py`. Re-runnable: `node ladder.mjs --mat <finish> --var <prop> --values a,b,c`.*

### What the shipped value is grounded on instead

The ladder above, read visually: `0.0289` is invisible, `0.139` barely
present, **`0.30` is where the band reads as brushed metal**. `0.50` still
reads as metal but runs hot.

The replaced constant `0.11/0.04` was *also* never grounded — checking
`247d4f9`, it was authored by analogy ("Amplitude rides the key alone, as
`.amb-mat-shiny`'s does, with a small floor"). So this is not "restoring a
grounded value"; it is replacing an actively-wrong measurement with an
honest visual fit. What was kept from the original is its **floor:slope
proportion** (0.04:0.11), because that encodes a real intent — the sheen
survives a dim scene the way a metal face does — rescaled so key 0.9 lands
on 0.30:

`--_sheen-alpha: calc(key * 0.0207 + 0.0103)` -> **`calc(key * 0.237 + 0.0863)`**

Grounding is therefore **split by quantity, deliberately**: relief amplitude
and anisotropy still come from the rig (`brushed.md`), the sweep amplitude
comes from the reference crops read visually, because the rig cannot see the
latter at all. The band's *position* law (`54% + light_y * 42%`) is
untouched and still rig-grounded — the rig resolves position fine, it is
amplitude it is blind to.
