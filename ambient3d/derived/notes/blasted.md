# blasted — grounded fit

Model: `--amb-albedo solved from the default scene's mean flat+grain tone through fit_surface's exposure law; alpha from mean RMS L* over the <name>_angle sweep; anisotropy from summed rms_drow/rms_dcol over that sweep`

- **albedo_linear**: `0.4457`
- **mean_rms_lstar**: `16.5911`
- **max_rms_lstar**: `18.4266`
- **anisotropy_row_over_col**: `1.008`
- **n_angle_frames**: `8`

## Transcribed into ambient.css

CSS-side closed-loop search (baseFrequency and tile size UNCHANGED from
the photographed-crop fit, which was already isotropic — only
`--_grain-alpha` was re-searched): mean RMS L* target 1.27
(mat_blasted_default's own measurement, this file's default light, key
0.9/fill 0.7). `--_grain-alpha` `0.281` -> `0.137` — the render's own
contrast is markedly weaker than the photographed crop the prior fit ran
on, so alpha nearly halves. Read as a real difference in how a
bead-blast finish scatters light under this rig's studio lighting versus
the photographed reference, not a tuning miss. `--amb-albedo` reference
tone -> `0.0594 0.0594 0.0594` (from `albedo_linear` above, solved
through `fit_surface`'s exposure law). `--amb-mat-specular`/
`--amb-mat-roughness` set to `0`/`1` (fully matte): the Blender material
has no Anisotropic BSDF term for this finish at all — this material never
carries a sheen, by construction, not as an ungrounded gap.

## Correction (2026-08-21): this is aluminium, not an elastomer

**The prose above is wrong in its premise and is superseded.** It describes
a bead-blasted *elastomer* — dark, fully matte, "no Anisotropic BSDF term
for this finish at all". That was this material's previous identity. It was
renamed `.amb-mat-rubber` -> `.amb-mat-blasted` in commit `fe347b8` and the
grounding never followed the rename; `--amb-albedo: 0.0594` was a fossil of
the elastomer. The reference is bead-blasted **aluminium**: light grey,
with dense sparkle.

### The metalness is earned, not assumed

A dielectric was tried first and ruled out by measurement. At albedo 0.49
and roughness 1.0, sweeping `GRAIN_BUMP_DISTANCE_MM` upward against a grain
target of 11.9:

| period / distance | grain | mean L\* |
|---|---|---|
| 2.5mm / 0.4 | 2.58 | 71.8 |
| 2.5mm / 1.0 | 4.10 | 66.1 |
| 2.5mm / 2.0 | 4.40 | 59.3 |
| 2.5mm / 4.0 | **4.48** | **52.8** |

It saturates at 4.5 and only reaches even that by darkening the plate 19
L\* below target. `BLAST_METALLIC = 1.0` at roughness 0.25 reaches 11.3 at
the correct tone. The glitter *is* the material, and a diffuse lobe cannot
produce it.

`BLAST_ROUGHNESS` is 0.25 — low, for something called "blasted" — because
the two scales are modelled separately: the bead craters are the height
field, so what is left for the BSDF is the smooth metal *between* craters.
Putting roughness in both places double-counts and flattens it.

| | was | now |
|---|---|---|
| `albedo_linear` | `0.0594` | **`0.4457`** |
| `grain_texture.rms_lstar` (the CSS target) | `1.27` | **`11.7355`** |
| `--amb-albedo` reference tone | `0.0594` | **`0.446`** |
| `--_grain-alpha` | `0.137` | **`0.85`** |

### `--amb-mat-specular: 0` / `--amb-mat-roughness: 1` are KEPT — decided, not inherited

The prose above justified these by "the Blender material has no Anisotropic
BSDF term at all", which is no longer true. The decision stands on a
different footing now: `--amb-mat-specular` paints a broad highlight, and
the reference crop's low-frequency sweep is only **3.4** against its grain
of **11.9** — there is no distinct highlight band to paint. The Blender
metal's low roughness exists to make each *crater* glitter, which on the
CSS side is the grain tile's job. With specular at 0 the roughness beside
it is inert; it is left at 1 so the pair still reads as "fully matte, by
decision".

### The grain target is NOT reached — recorded, not tuned away

`--_grain-alpha` is one factor of an `opacity` product whose other factors
(`--_grain-aniso`, `--_grain-lit`, `--amb-grain-amount`) are all exactly 1
for this isotropic material at the default light, so it **hard-rails at
1.0**. Reaching the target needs ~1.27.

The rail is a real ceiling, not a saturation point — the response is linear
right up to it, measured on the panel harness:

| alpha | 0 | 0.137 | 0.4 | 0.7 | 0.85 | 1.0 | >1.0 |
|---|---|---|---|---|---|---|---|
| grain | 0.000 | 0.864 | 2.472 | 4.449 | 5.468 | 6.529 | 6.529 (clamped) |

*Measured with `tools/css-harness/ladder.mjs` (renders one panel per candidate value against the shipped `ambient.css`) split by `ambient3d/measure/panel_split.py`. Re-runnable: `node ladder.mjs --mat <finish> --var <prop> --values a,b,c`.*

So alpha 1.0 buys **x7.6** the shipped contrast where **x9.2** is wanted.

Stopped at **0.85** rather than at the rail, on a visual read: at 1.0 the
panel reads as sensor static rather than bead-blast. That is this note's own
scale caveat biting for real — the render carries ~10px craters (4 px/mm on
2.5mm dimples) where the CSS tile at `baseFrequency 0.9` / 96px carries
~1px features, so matching per-pixel RMS means equal *contrast* at very
different *spatial frequency*. It is the repo's existing convention and it
suits the reference's fine sparkle, but it is an assumption, and at the top
of the range it visibly fails. 0.85 gives x6.3 the shipped contrast (~68% of
target) and reads as dense sparkle. Be precise about the headroom that
leaves: the opacity product clamps once `--_grain-lit` reaches ~1.18, and
that factor ranges to 1.5, so the grain still fades correctly in a dim scene
but stops brightening about 18% above the default light instead of tracking
all the way up.

**Next lever, if this is picked up again:** the tile's own contrast stretch
(`feComponentTransfer` slope 2) and its feature size (`baseFrequency 0.9` at
a 96px tile). Both were out of scope here. Raising alpha further is not an
option — it is already at the rail.

## Hand-tune (2026-08-21): contrast lowered to the last unclamped alpha

`--_grain-alpha` **0.85 -> 0.666**, on a direct request for slightly lower
contrast. Chosen by eye, but it lands on an exact edge rather than an
arbitrary step, and the edge is the same headroom problem the correction
above records.

The opacity this alpha feeds is a product of four factors, all of which are
1 for this isotropic material except the light term, and the product clamps
at 1. `--_grain-lit` tops out at **1.50**, so an alpha of `1/1.5 = 0.6667`
is the boundary: **0.666** is the highest value that never clamps
(`1.50 x 0.666 = 0.999`). At the previous 0.85 the clamp bit from
`--_grain-lit` 1.18 upward, so the material stopped brightening about 18%
above the default scene. It now tracks the light across its whole range.

0.667 would clamp too, but only in the top 0.05% of the range — the choice
between 0.666 and 0.667 is bookkeeping, not appearance. All of this holds at
`--amb-grain-amount` 1; a consumer raising that knob moves the clamp point
down in proportion, and no alpha here is immune to that.

| `--_grain-alpha` | grain RMS L* | vs 0.85 | share of the 11.7355 target | clamps at |
|---|---|---|---|---|
| `0.85` (was) | `5.468` | — | ~68% | 1.18 of 1.50 |
| `0.75` | `4.771` | -13% | ~59% | 1.33 of 1.50 |
| **`0.666`** | **`4.212`** | **-23%** | **~52%** | **never** |
| `0.60` | `3.772` | -31% | ~47% | never |

The target share is quoted as a ratio off the 68% the correction above
already records, because `11.7355` comes from a different instrument on a
different image and is only ever comparable that way.

So this pass trades ~16 points of a shortfall that could not be closed —
`--_grain-alpha` hard-railed at 1.0 where ~1.27 was needed, and the rail
read as sensor static — for a light response that could be. The two levers
the correction above identifies as the way to close the rest, the tile's
contrast stretch and its feature size, are still untouched and still the
next step.

*Measured with `tools/css-harness/variants.mjs`, spec
`tools/css-harness/specs/handtune-2026-08-21-blasted.json`, split by
`ambient3d/measure/variant_grid.py`.*
