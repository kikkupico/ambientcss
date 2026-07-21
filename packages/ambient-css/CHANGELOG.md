# @ambientcss/css

## 2.0.0

### Major Changes

- a3c92f8: **v2.0.0 — the library is re-based on the Blender-grounded rewrite.**

  Every effect's coefficients are now derived from measured Cycles renders of an
  equivalent physical scene (verified end-to-end by a render-vs-CSS comparison
  harness), replacing the previously hand-tuned values. Computed output changes
  throughout — anchored so the default look (key 0.9, fill 0.7) is preserved —
  which is why this ships as a major release rather than a minor one.

  The accompanying changesets carry the detailed per-effect notes: the
  `.amb-surface` tone ladder, the swept drop shadow, the new `.amb-groove`
  primitive and thickness vocabulary, the studio-lit `.amb-mat-shiny`
  environment, refit chamfer/fillet bands and curved surfaces, plus the new
  button shapes and knob variants in `@ambientcss/components`.

### Minor Changes

- a3c92f8: Blender-grounded rewrite: every effect's coefficients are now derived from
  measured Cycles renders of an equivalent physical scene, verified by a
  render-vs-CSS comparison harness (0 failures over 144 frame pairs). The
  public API gains one class (`.amb-groove`); computed values changed
  throughout, anchored so the default look (key 0.9, fill 0.7) is preserved.

  - `.amb-surface` family: lightness affine in key AND fill intensity
  - **white studio environment**: all renders are lit by a
    product-photography world — overhead softbox, neutral walls, dimmer
    floor — normalized so matte surfaces receive the same fill irradiance
    as before. `.amb-mat-shiny`'s env reflection is now that studio (softbox
    veil at the top, floor grade at the bottom, riding the fill light and
    never flipping with the key), replacing the old sky/ground split
  - **swept drop shadow**: the umbra is the silhouette projection swept
    from the body's bottom (elevation) to its top (elevation + thickness) —
    four stacked box-shadow layers sample the sweep at quarter-heights,
    producing a wedge that hugs the shadow-side edges, mitres the corner
    and fades outward at rest, detaching cleanly when elevated; new
    corner/contact-hug metrics gate the shape
  - NEW `.amb-groove`: a grounded recessed slot (depth reuses the thickness
    vocabulary): near-surface floor, crisp lit-wall shadow band, and the
    far wall's key bounce — the physical origin of the inset highlight
  - `.amb-thickness-0/1/2`: physical body height — 0 is a sheet embedded
    flush like a decal (invisible at rest, revealed by elevation), 1 is
    button-scale, 2 knob-scale; edge treatments require thickness and cap
    level-for-level (|width| ≤ thickness; the width-2 classes imply
    thickness 2)
  - chamfer/fillet bands: affine alphas refit under the studio fill,
    fillet offset 1.4px/width
  - curved surfaces: gradient stops ride the grounded surface base
  - `.amb-mat-shiny` specular: grazing Fresnel rim + the key's mirror band
    at 30% in from the lit edge
  - `.amb-glow`: halo radius 6.2px from the measured bloom falloff
  - all `clamp()` replaced with `max(min())`: postcss-preset-env's clamp
    downlevel drops operands from expression middles, which zeroed the
    elevation shadow in pipelines using it
  - `.amb-mat-glass` keeps its designed values (documented)

### Patch Changes

- a3c92f8: Fix `--amb-elevation` leaking into nested `.ambient` elements. It's a
  plain CSS custom property, so without an explicit `inherits: false` it
  cascaded down the DOM by default: any component nested inside an
  `.amb-elevation-2` container (e.g. AmbientPanel) picked up that
  elevation's shadow even without an elevation class of its own. The
  `@property` registration now sets `inherits: false`, so every element
  falls back to the initial value (0) unless it explicitly sets its own
  `--amb-elevation` or `.amb-elevation-N` class.

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
