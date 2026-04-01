---
"@ambientcss/css": minor
"@ambientcss/components": minor
---

Implement and refine `amb-mat-*` material classes with physically-based reflectance.

**`@ambientcss/css`**

- Add shared material custom properties (`--amb-mat-specular`, `--amb-mat-roughness`, `--amb-mat-opacity`) to `:root` for downstream use
- `amb-mat-matte`: unchanged — bare surface colour, no additional treatment
- `amb-mat-shiny`: two-layer rendering model
  - *Environment reflection* (overlay blend, fixed vertical): cylindrical dome model driven by `--amb-light-y`; lit half reflects bright walls/ceiling at key-light intensity, opposite half reflects dark environment at `(1 − fill-light)` intensity; both halves taper to neutral at the edges with the horizon split at 50%
  - *Specular highlight* (screen blend, light-direction-aware): narrow white band near the lit edge; peak opacity equals `--amb-key-light-intensity`; position follows `atan2(light-y, light-x)`
  - Slight overall brightness boost (`brightness(1.04)`) so the surface reads shinier than matte
- `amb-mat-glass`: extends shiny with translucency — identical specular and environment layers, plus a semi-transparent `background-color` and `backdrop-filter: blur() saturate()` that scale with key-light intensity; thin light-hue border

**`@ambientcss/components`**

- `AmbientKnob`, `AmbientFader`, `AmbientSlider`: add `material?: "matte" | "shiny" | "glass"` prop, applied to the interactive element (knob body / fader thumb / slider thumb)
- When `material="glass"`, the concave surface class is omitted from the thumb so the glass translucency is not occluded by an opaque gradient
