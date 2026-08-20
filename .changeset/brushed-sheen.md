---
"@ambientcss/css": minor
---

The brushed metals now carry a specular sheen

`.amb-mat-brushed` and `.amb-mat-brushed-round` were matte in the specular
sense — `--amb-mat-specular: 0`, relief and nothing else. A ground finish is
still metal, so both now declare `--amb-mat-specular: 0.3` /
`--amb-mat-roughness: 0.72` and paint a broad sheen to match. `.amb-mat-blasted`
is unchanged and stays matte.

The sheen is anisotropic in each material's own grain direction, which is what
makes it read as one surface with the relief rather than as a gloss laid over
it. On the linear metal the grain is horizontal, so the highlight is a
horizontal band: `--amb-light-y` slides it from the top of the face to the
bottom and `--amb-light-x` moves it not at all — the same statement
`--_grain-aniso` makes about the relief, in the specular term. On the spun
metal the grain is tangential everywhere, so "across the grain" is radial
everywhere and the band becomes two opposed lobes on the lamp's axis plus the
hotspot where the streaks converge.

It rides the key light alone, as `.amb-mat-shiny`'s specular does, and is
painted on the host's own `background-image` so it gets its own amplitude
rather than being scaled by the grain's fitted alpha. That also means a
component which has already spoken for `background-image` — `.amb-knob-face`,
`.amb-surface-concave`, `.amb-surface-convex` — keeps its own and shows the
relief without the sheen, the same precedence `.amb-mat-shiny` has always had.
