# Plan: `amb-mat-brushed` and `amb-mat-rubber`

Two new surface materials, peers of the existing `amb-mat-matte` / `-shiny` /
`-glass`. Grounded on two photographed reference crops rather than eyeballed.

Study, with live swatches and the photo-vs-CSS wipes:
<https://claude.ai/code/artifact/6b0a14cc-0402-4106-a60a-a7e45363a59b>

---

## 1. What these are

| class | material | character |
|---|---|---|
| `amb-mat-brushed` | brushed aluminium sheet | pale, **anisotropic**, very low contrast |
| `amb-mat-rubber` | bead-blasted elastomer | dark, **isotropic**, grain 3x stronger |

Both are matte in the specular sense: they set `--amb-mat-specular: 0` and
`--amb-mat-roughness: 1`. They add micro-relief, not gloss. They compose with
the existing surface/edge/elevation classes like any other material.

Deliberately only two. They sit at opposite corners of the space (pale/dark,
directional/isotropic), so between them they exercise every part of the model;
a third mid-grey isotropic plastic added nothing the rubber did not already
cover.

## 2. The core decision: no direction is baked into the tile

**Rejected:** light a height field with `feDiffuseLighting` at a fixed azimuth,
then rotate the overlay to follow `--amb-light-*`. This is what the first pass
did and it is visibly wrong — rotating a lit relief rotates a *photograph* of a
relief. The pattern swims across the surface as the lamp moves.

**Adopted:** the tile carries the **raw height field** and nothing else. A second
tile carries its **exact inverse**. One is offset toward the lamp, the other away
from it, so the pair evaluates

```
f(x + d*l) - f(x - d*l)  ~=  2d * df/dl
```

the slope of the surface along the light — which is what shading a bumpy
surface is, to first order.

Consequences, all three load-bearing:

- **Nothing is ever transformed.** Only `background-position` changes, so every
  bump stays on the same pixel and the shading crosses over it. This is the
  behaviour that was actually asked for.
- **The two tiles must be inverses, not complementary halves.** Inverses
  *subtract* where they overlap. Complementary halves (peaks-only / valleys-only)
  leave the raw height field showing as brightness when the offsets coincide —
  the swimming-photograph look again, at a different angle. This was tried and
  measured; it is not theoretical.
- **Anisotropy comes free.** Offsetting *along* a brushed grain samples two
  points at the same height, so the pair cancels and the metal goes smooth.
  Across it, full slope. "Only the across-grain component shades it" stops being
  a special case and becomes geometry.

## 3. Blend modes: one bright layer, one dark

`screen` for the peaks tile, `multiply` for the inverse.

- `multiply` is the **only** mode with the right tone law. Multiplying in a
  power-law-encoded space scales linear luminance by a constant factor, putting
  grain amplitude proportional to Y^(1/3), which is what Lambertian roughness
  does. Normalised to the darkest base, physics wants 1.00 / 1.73 / 2.09 across
  L\* 36, 74, 93; `multiply` gives 1.00 / 1.87 / 2.29. `normal` gives
  1.00 / 0.91 / 0.88 and `soft-light` collapses to 0.19 at L\* 93 — which is
  exactly where the repo's default ground sits.
- The bright `screen` layer is not just the second term of the subtraction. Both
  references **skew bright** (bright/dark half-range 1.45 on the dark rubber,
  1.11 on the pale aluminium). On a dark body the diffuse floor is low, so what
  you see of the roughness is facets catching the key light.

## 4. Offsets must snap to whole pixels

The one finding that nearly sank the mechanism. A fractional
`background-position` resamples the tile and erases grain about a pixel across
— which is most of it. Axis-aligned offsets happen to be integers; diagonals are
not, **and all four stock `.amb-light-*` presets are diagonal.**

Rubber grain, RMS L\* by lamp angle:

| | 0deg | 45deg | 90deg | 135deg | consistency |
|---|---|---|---|---|---|
| plain `calc()` | 2.31 | **1.01** | 2.29 | **1.01** | **0.44** |
| `calc()`, grain coarsened 4x | 2.28 | 2.04 | 2.25 | 1.97 | 0.86 |
| `round(..., 1px)` | 2.31 | **2.29** | 2.29 | **2.31** | **0.99** |

Coarsening fixes it by discarding the fidelity just measured. `round()` fixes it
for free — the emboss *direction* quantises instead, which for sub-pixel grain
is invisible. **Use `round()`.**

Cost: with a 2px baseline the across-grain offset is either 0 or 1, so brushed
metal *switches* rather than fades. It therefore keeps an explicit across-grain
term on its amount — the same physical statement written out longhand.

## 5. Fitted constants

Tile = one `feTurbulence` + one `feComponentTransfer`. No lighting primitive.
`stitchTiles="stitch"`, `seed="3"`, slope 2 (negated for the inverse tile),
intercept parking the mean at 0.5.

| | baseFrequency | oct | tile | overlay alpha | `--amb-albedo` (srgb-linear) |
|---|---|---|---|---|---|
| brushed | `0.06 2.6` | 1 | 128px | 0.169 | `0.49 0.49 0.49` |
| rubber | `0.9 0.9` | 2 | 96px | 0.281 | `0.0644 0.0629 0.0629` |

The albedo is the material's own reflectance, picked so that the surface **plus
its grain** lands on the crop's measured tone. A material class setting
`--amb-albedo` is exactly what that property is for; it stays overridable.

Verification (canvas readback, not screenshots — JPEG noise swamps a statistic
whose whole amplitude is 1-2 points of L\*):

| | mean L\* ref/css | RMS ref/css | angular consistency |
|---|---|---|---|
| brushed | 74.22 / 74.43 | 0.86 / 0.863 | 0.66 *(intended anisotropy)* |
| rubber | 36.13 / 36.24 | 2.45 / 2.449 | 0.98 |

Brushed's 0.66 is the anisotropy working: 0.57 along the grain, 0.87 across.

## 6. Amplitude: three factors, kept separate

```
opacity = --_grain-aniso        the material's own term (brushed only)
        x --_grain-lit          light contrast, 1.0 at the fitted default
        x --_grain-alpha        the fitted constant
        x --amb-grain-amount    the user's knob, default 1
```

Two things this pins down:

- **`--_grain-lit` is normalised to the calibration point.** Relief needs
  directional light and should wash out under a flat fill, but the naive form
  evaluates to 0.64 at repo defaults, which would silently render every material
  at 64% of the amplitude the table claims. Written as
  `max(0.45, min(1.5, 0.45 + 2.75 * (key - fill)))` it is **exactly 1.0** at
  key 0.9 / fill 0.7, falling to the 0.45 floor when fill equals key. Verified in
  the browser: computed `::before` opacity is 0.281, the fitted alpha itself.
- **The material's term and the user's knob must not share a name.** Brushed
  metal's across-grain expression lives in `--_grain-aniso`. If it lived in
  `--amb-grain-amount`, a consumer writing `--amb-grain-amount: 0.6` would
  silently delete the anisotropy — the one behaviour that material is about.

## 7. No change needed in `ambient.css`

An earlier draft added an `--amb-mat-shade` factor to `--_amb-diffuse` so a
material could darken itself without clobbering the user's `--amb-shade`. Setting
`--amb-albedo` does the same job with a property that already exists and already
means "this material's reflectance", so **the core file is untouched**.

## 8. Accepted limits

- **The overlay alpha is calibrated at each material's own tone and does not
  follow the physical tone law away from it.** Measured on the repo's default
  L\* 91 ground: rubber's grain falls 27% (2.45 -> 1.80 L\*) where physics would
  have it roughly double; brushed, which starts near that tone, drifts only +6%
  (0.86 -> 0.91). The symmetric pair loses amplitude on a pale base because
  `screen` runs out of headroom faster than `multiply` gains it. **Re-fit
  `--_grain-alpha` if you retone a material far from its reference.** This is
  why each material ships an albedo rather than being a tone-agnostic overlay.
- **Bright skew is not reproduced.** A signed derivative is symmetric by
  construction, so bright/dark lands near 1.0 where the references measure 1.11
  and 1.45. The rotating build matched the skew and got the relief wrong; this
  one gets the relief right and flattens the skew. Deliberate trade.
- **Both pseudo-elements are consumed.** Free in `ambient.css` today;
  `.amb-button-cap::after` in components is a different element. A control that
  needs its own pseudo must put the grain on an inner layer.
- **`overflow: hidden` on the host** — needed so `mix-blend-mode` clips on a
  rounded surface, and it clips real children too.
- **Calibrated at 1:1 CSS pixels.** The crops are of unknown physical size, so
  this is an assumption — and after the sub-pixel finding it is load-bearing:
  the tile has to stay near the pixel grid it was fitted on. Do not rescale
  `--_grain-scale` freely.
- **`round()` support**: Chrome 125+, Safari 15.4+, Firefox 118+ — the same
  vintage as the `atan2()` / `sign()` / `hypot()` the file already uses.
- **Cost**: two composited layers per textured element; each tile rasterises once
  and repeats. Right for faceplates, knob caps and pads; wrong for long lists.
- **Textured glass stays out of scope.** `mix-blend-mode` on a child and
  `backdrop-filter` on the parent do not compose.

## 9. Direction after this

Circular brushing for knob caps is the natural next material, and the mechanism
reaches it: the across-grain rule becomes tangential, and the offset becomes a
small rotation about the cap centre rather than a translation.
