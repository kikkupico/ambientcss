# @ambientcss/components

## 2.0.1

### Patch Changes

- d3e9ee6: Fix controls rendering oversized on pages without a global `box-sizing`
  reset. Every control sizes its moving part as a percentage of a padded box
  — a button's cap is `width: 100%` of a well inset by the clearance ring,
  a knob's face `100%` of the knob — and under the default `content-box`
  those paddings add to the percentage instead of fitting inside it, so the
  button cap rendered visibly larger than the well it sits in, with the gap
  ring showing on only two sides. `styles.css` now scopes
  `box-sizing: border-box` to the package's own elements. Apps that already
  reset globally (the demo does, which is what masked this) see no change.

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

- a3c92f8: Button shapes and knob types, matching the referent lineup
  (`ambient3d/generate.py` — the catalog's round/square keys, pads, and
  the classic/OP-Z/OP-1/wheel knob styles):

  - **AmbientButton** gains `shape`: `"pill"` (default, the wide stadium
    transport key), `"round"` (circular key — pair with
    `material="shiny"` for the machined metal-button look), and
    `"square"` (EP-133-style pad: tighter corners, 3.6mm cap at thickness
    0.8 instead of the key's 4.5mm, same 0.7mm press travel).
  - **AmbientKnob** gains `variant`: `"dot"` (default, the grounded
    36-rib referent), `"line"` (radial indicator line), `"flute"` (14
    broad flutes with deep roots and a centered dot, OP-Z-style),
    `"cap"` (fine 48-rib knurl under a smooth accent top disc,
    OP-1-style), and `"wheel"` (bare fine knurl, no indicator). Each
    family gets its own knurl clip silhouette and pitch-matched flank
    shading.

  Each new shape/variant has a flat-on grounded referent render
  (`ambient3d/ground_components.py`, which now accepts a name filter
  after `--`) compared against the live component in the docs.

- a3c92f8: Components rebuilt from grounded primitives to match their richer 3D
  referents (`ambient3d/components/*` — the design source of truth), with
  thickness-based bodies instead of resting elevation:

  - **AmbientButton**: a chamfered key cap (thickness 1) seated in a
    clearance well — the button element is an `.amb-groove` whose lume
    interior shows as the gap ring. Pressing sinks the cap by the
    referent's 0.7mm travel; the chamfer bands and swept shadow shrink
    with it.
  - **AmbientKnob**: knob-scale body (thickness 2 = the referent's 9mm)
    resting on the panel. The rotating face is clipped to a true
    straight-knurl silhouette (36 trapezoid teeth via an inline SVG
    clipPath in objectBoundingBox units, so it scales with the grid) with
    phase-aligned per-tooth flank shading, under a smooth top disc and an
    accent indicator dot; teeth and all rotate with the value. The
    circular body beneath keeps the drop shadow smooth.
  - **AmbientSwitch**: now a slide switch — a pill riding in a recessed
    stadium `.amb-groove` track, optional LED above. Same props and ARIA.
  - **AmbientFader**: pill thumb with a grip line (thickness 1.5, riding
    2.2mm above the plate like the referent's stem) on the groove + lume
    track.
  - **AmbientSlider**: domed disc thumb gliding over a shallow concave
    channel (groove at thickness 0.22).

  Each component's docs page gains a "Grounded counterpart" section
  comparing the live component against a flat-on render of its 3D referent
  built at the CSS dimensions (`ambient3d/ground_components.py`).

### Patch Changes

- Updated dependencies [a3c92f8]
- Updated dependencies [a3c92f8]
- Updated dependencies [a3c92f8]
  - @ambientcss/css@2.0.0

## 1.2.1

### Patch Changes

- Updated dependencies [7361ad7]
  - @ambientcss/css@1.2.1

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

### Patch Changes

- Updated dependencies [a738bda]
  - @ambientcss/css@1.2.0

## 1.1.1

### Patch Changes

- f12c295: sync publish script changes

## 1.1.0

### Minor Changes

- ad9da82: fixing npm installation errors

### Patch Changes

- Updated dependencies [ad9da82]
  - @ambientcss/css@1.1.1

## 1.0.2

### Patch Changes

- Updated dependencies [e0600a6]
  - @ambientcss/css@1.1.0

## 1.0.1

### Patch Changes

- a9b62c1: fix amb-lume
- Updated dependencies [a9b62c1]
  - @ambientcss/css@1.0.1

## 1.0.1

### Patch Changes

- Fix `--amb-lume` and `--amb-label` not reacting to theme changes. Derived CSS variables are now re-declared on the provider element so they recompute when input variables like `--amb-key-light-intensity` are overridden.

## 1.0.0

### Major Changes

- first publish

### Patch Changes

- Updated dependencies
  - @ambientcss/css@1.0.0
