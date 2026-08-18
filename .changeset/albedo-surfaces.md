---
"@ambientcss/css": major
"@ambientcss/components": major
---

Surfaces take a colour: `--amb-albedo` and `--amb-shade` replace the surface variants

**Breaking.** `.amb-surface-lighter`, `.amb-surface-lightest`,
`.amb-surface-darker` and `.amb-surface-darkest` are removed. A surface is now
a *material under a light* rather than a fixed lightness, so one
`.amb-surface` covers every hue and every tone:

```css
/* before */
.panel { }                       /* one of five hardcoded tones */
.well  { }                       /* .amb-surface-darker */

/* after */
.panel { --amb-albedo: #7a3b2e; }   /* any CSS colour */
.well  { --amb-shade: 0.38; }       /* a tone of whatever it inherits */
```

Migration: drop the variant class and set `--amb-shade` to `1.11`
(`-lighter`), `1.16` (`-lightest`), `0.38` (`-darker`) or `0.07`
(`-darkest`) on a plain `.amb-surface`. Those four numbers are the plates'
albedos over the reference ground's, so the tones are unchanged.

**Why one law replaces five.** The five variants were five affine
lightness fits, one per rendered plate. They were all the same physics seen
through sRGB gamma: a surface reflects **albedo × exposure**, and *exposure*
is what the light intensities are linear in — irradiance adds up, lightness
does not, which is why each fit needed its own floor to absorb the curve.
Refit in linear light (`ambient3d/measure/fit.py`), one two-parameter law,

    exposure = 0.6396 · key + 0.5496 · fill

reproduces all 54 measured plate frames across all five albedos to within
**0.03 points of lightness** (R² 0.9999998), against R² 0.996 and ~1.1 points
for the fits it replaces. The free intercept comes back at 2e-5, so it is
dropped: with both lamps off a surface is black.

New public variables:

- `--amb-albedo` (any CSS colour, default the rig's reference ground) — the
  colour a surface would show under full white illumination.
- `--amb-shade` (number, default `1`) — a multiplier on that reflectance.
  Prefer it for hierarchy inside a themed panel: unlike a second albedo it
  composes with whatever colour is inherited.
- `--amb-lit` (derived, read-only) — the finished tone of a flat face.
- `--amb-exposure` (derived, read-only) — the irradiance, where `1` is full
  white illumination.

Both inputs inherit, so a coloured panel colours everything inside it.
`.amb-groove` now cuts its recess **in the panel's own material** (a groove in
a red panel is red; its floor keeps its own slightly hot exposure, refit the
same way from the same 15 frames), the curved classes paint only the shading
and ride `--amb-lit`, and every grounded surface tone in
`@ambientcss/components` — knob face, switch pill, select key and lens —
reads `--amb-lit` instead of carrying its own copy of the old formula.

A coloured lamp now acts on a coloured surface: the cast is a mix toward
`--amb-light-hue` at `--amb-light-saturation`, with the tint's own saturation
set to `100 − s` of the surface. On a grey that is exactly the HSL identity
the old formulas encoded, so **neutral surfaces are unchanged** — within 1
point of lightness across the measured light range, and closer to the Blender
ground truth where they differ. On a chromatic surface the light washes it
toward grey rather than rotating its hue, which is what a lamp does to a
colour it cannot light.

**Dim scenes get darker.** The old fits extrapolated to a lit grey under no
lights; this one goes to black. Below the measured box (key 0.1–1.0 at fill
0.7, key 0.9 at fill 0–0.7) both models are extrapolating and neither is
grounded, so this is a deliberate design change, not a fidelity claim: at
key 0.2 / fill 0.05 a default surface sits about 12 points of lightness lower
than before. Themes built around very low key light will want their
intensities re-checked.

**Browser floor.** The surface tone is built with relative colour syntax
(`color(from … srgb-linear …)`, `hsl(from … calc(100 - s) l)`), so Firefox
128, Chrome 119 and Safari 16.4 are the floor for surface *colour*. Verified
identical in Chromium and WebKit; Firefox was not available to test locally.
Note the spelling is `calc(100 - s)` — relative colour substitutes `s` and
`l` as numbers, and the percentage form invalidates the declaration.

**Known limitation: dished caps want `--amb-shade` for luminance.**
`AmbientButton`'s cap dish needs its base lightness as a *number* to turn the
curve delta into overlay alphas, and a colour's luminance cannot be reached as
a number in CSS. It is rebuilt from `--amb-shade` and `--amb-exposure`
instead, which is exact for any shade of the reference material — but on a
dark chromatic `--amb-albedo` the two halves of the dish miss in opposite
directions (the black half under-shades, the white half over-lifts) and the
cap reads as a bright sheen rather than a curve. Split the two axes and both
halves stay exact:

```css
.panel {
  --amb-albedo: #c98a7a;   /* the hue, near the reference reflectance */
  --amb-shade: 0.45;       /* the luminance */
}
```

Flat surfaces, grooves and the curved classes have no such limit — they carry
colour, not numbers, and follow any `--amb-albedo` exactly.

The compare gate (`ambient3d/measure/compare.py`) could not be run locally:
it needs `ambient3d/renders/`, which is not committed. The manifest's four
plate scenes now drive the CSS side through `--amb-albedo` instead of a
variant class, so the gate exercises the general law rather than five fixed
classes.
