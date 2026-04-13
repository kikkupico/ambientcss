# @ambientcss/css

## 1.2.1

### Patch Changes

- 7361ad7: Fix `amb-mat-glass` material to look like frosted glass instead of polished metal.

  The glass material was reusing the same sharp specular highlight and cylindrical dome environment reflection as the shiny/metal material, making it appear reflective and metallic. It now uses a wide, faint diffuse brightening gradient (max alpha 0.12 vs 1.0, spanning 75% of the surface) that softly brightens the light-facing edge — consistent with how frosted glass scatters light. The metallic overlay blend layer and brightness/contrast filter have been removed. Roughness is raised to 0.9 and specular lowered to 0.05.

## 1.2.0

### Minor Changes

- a738bda: Implement and refine `amb-mat-*` material classes with physically-based reflectance.

  **`@ambientcss/css`**

  - Add shared material custom properties (`--amb-mat-specular`, `--amb-mat-roughness`, `--amb-mat-opacity`) to `:root` for downstream use
  - `amb-mat-matte`: unchanged — bare surface colour, no additional treatment
  - `amb-mat-shiny`: two-layer rendering model
    - _Environment reflection_ (overlay blend, fixed vertical): cylindrical dome model driven by `--amb-light-y`; lit half reflects bright walls/ceiling at key-light intensity, opposite half reflects dark environment at `(1 − fill-light)` intensity; both halves taper to neutral at the edges with the horizon split at 50%
    - _Specular highlight_ (screen blend, light-direction-aware): narrow white band near the lit edge; peak opacity equals `--amb-key-light-intensity`; position follows `atan2(light-y, light-x)`
    - Slight overall brightness boost (`brightness(1.04)`) so the surface reads shinier than matte
  - `amb-mat-glass`: extends shiny with translucency — identical specular and environment layers, plus a semi-transparent `background-color` and `backdrop-filter: blur() saturate()` that scale with key-light intensity; thin light-hue border

  **`@ambientcss/components`**

  - `AmbientKnob`, `AmbientFader`, `AmbientSlider`: add `material?: "matte" | "shiny" | "glass"` prop, applied to the interactive element (knob body / fader thumb / slider thumb)
  - When `material="glass"`, the concave surface class is omitted from the thumb so the glass translucency is not occluded by an opaque gradient

## 1.1.1

### Patch Changes

- ad9da82: fixing npm installation errors

## 1.1.0

### Minor Changes

- e0600a6: fixes the error with ambientcss package import

## 1.0.1

### Patch Changes

- a9b62c1: fix amb-lume

## 1.0.1

### Patch Changes

- Revert `--amb-lume` formula to use `calc(clamp(...) * 100%)` form, avoiding a `clamp()` nesting issue inside `color-mix()`.

## 1.0.0

### Major Changes

- first publish
