# @ambientcss/css

## 3.0.0

### Major Changes

- f91f203: Surfaces take a colour: `--amb-albedo` and `--amb-shade` replace the surface variants

  **Breaking.** `.amb-surface-lighter`, `.amb-surface-lightest`,
  `.amb-surface-darker` and `.amb-surface-darkest` are removed. A surface is now
  a _material under a light_ rather than a fixed lightness, so one
  `.amb-surface` covers every hue and every tone:

  ```css
  /* before */
  .panel {
  } /* one of five hardcoded tones */
  .well {
  } /* .amb-surface-darker */

  /* after */
  .panel {
    --amb-albedo: #7a3b2e;
  } /* any CSS colour */
  .well {
    --amb-shade: 0.38;
  } /* a tone of whatever it inherits */
  ```

  Migration: drop the variant class and set `--amb-shade` to `1.11`
  (`-lighter`), `1.16` (`-lightest`), `0.38` (`-darker`) or `0.07`
  (`-darkest`) on a plain `.amb-surface`. Those four numbers are the plates'
  albedos over the reference ground's, so the tones are unchanged.

  **Why one law replaces five.** The five variants were five affine
  lightness fits, one per rendered plate. They were all the same physics seen
  through sRGB gamma: a surface reflects **albedo × exposure**, and _exposure_
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
  128, Chrome 119 and Safari 16.4 are the floor for surface _colour_. Verified
  identical in Chromium and WebKit; Firefox was not available to test locally.
  Note the spelling is `calc(100 - s)` — relative colour substitutes `s` and
  `l` as numbers, and the percentage form invalidates the declaration.

  **Known limitation: dished caps want `--amb-shade` for luminance.**
  `AmbientButton`'s cap dish needs its base lightness as a _number_ to turn the
  curve delta into overlay alphas, and a colour's luminance cannot be reached as
  a number in CSS. It is rebuilt from `--amb-shade` and `--amb-exposure`
  instead, which is exact for any shade of the reference material — but on a
  dark chromatic `--amb-albedo` the two halves of the dish miss in opposite
  directions (the black half under-shades, the white half over-lifts) and the
  cap reads as a bright sheen rather than a curve. Split the two axes and both
  halves stay exact:

  ```css
  .panel {
    --amb-albedo: #c98a7a; /* the hue, near the reference reflectance */
    --amb-shade: 0.45; /* the luminance */
  }
  ```

  Flat surfaces, grooves and the curved classes have no such limit — they carry
  colour, not numbers, and follow any `--amb-albedo` exactly.

  The compare gate (`ambient3d/measure/compare.py`) could not be run locally:
  it needs `ambient3d/renders/`, which is not committed. The manifest's four
  plate scenes now drive the CSS side through `--amb-albedo` instead of a
  variant class, so the gate exercises the general law rather than five fixed
  classes.

- f91f203: Relief materials carry no `--amb-albedo` of their own any more

  `.amb-mat-brushed`, `.amb-mat-brushed-round` and `.amb-mat-blasted` each used
  to ship a calibrated default reflectance (0.49 linear for both metals, 0.0644
  for blasted), so a plain `<div class="ambient amb-surface amb-mat-blasted">`
  rendered as dark elastomer and a brushed one as mid-grey metal without any
  colour set. That made them the odd ones out: `.amb-mat-matte` and
  `.amb-mat-shiny` have never carried a colour, they only add relief or gloss
  on top of whatever `--amb-albedo` the surface already has. All five now
  behave the same way — a material is relief and specular only, never a
  colour — so left alone, brushed/spun/blasted render at the reference ground,
  same as matte and shiny.

  (`.amb-mat-blasted` was `.amb-mat-rubber` before this same change — renamed
  because a name borrowed from the substance it was fitted against implied a
  fixed colour, which is exactly what this change removes; `brushed`/`shiny`/
  `matte` were already named for the process, not a substance.)

  **This changes default rendered output** for any element that wears one of
  the three relief classes without setting `--amb-albedo` itself: it now
  renders pale (the reference ground) instead of its old fitted tone. Set
  `--amb-albedo` explicitly for the calibrated look — the reference each
  material's grain was fitted at is documented at its class in
  `packages/ambient-css/src/ambient.css` and in the docs' "Colouring every
  material" section:

  ```css
  .amb-mat-brushed,
  .amb-mat-brushed-round {
    --amb-albedo: color(srgb-linear 0.49 0.49 0.49);
  }
  .amb-mat-blasted {
    --amb-albedo: color(srgb-linear 0.0644 0.0629 0.0629);
  }
  ```

  In `@ambientcss/components`, `ButtonCap` no longer swaps a relief-material
  cap onto `.ambx-cap-tone-brushed` / `-brushed-round` / `-blasted` to correct
  its dish-shading math for a fixed tone that no longer exists — a relief-faced
  cap now derives its dish the same way any other dished surface does, from
  `--amb-shade`. The blasted tone class's automatic light-label override (for
  legibility against a face that used to always be dark) goes with it: a
  blasted-faced cap you colour dark now needs its own `--amb-label` override,
  the same as a dark matte or shiny one would.

### Minor Changes

- f91f203: New `.amb-mat-brushed-round`: spun aluminium

  The same metal as `.amb-mat-brushed` with the grain turned about the element's
  centre instead of run across its face — the lathe finish on a knob cap or a
  volume dial, rather than the belt finish on a faceplate. It is the third
  micro-relief material and behaves like the other two: `--amb-albedo` for its
  tone, `--amb-grain-amount` for the relief, both pseudo-elements consumed,
  `overflow: hidden` on the host. `AmbientMaterial` gains `"brushed-round"`, so
  every component that takes a `material` takes this one.

  The grain is a conic gradient rather than a repeating tile, because circular
  grain has no translational period to tile: 64 jittered streaks of angle from a
  fixed seed, with the same contrast stretch the SVG tiles apply, plus the exact
  per-stop inverse the screen/multiply pair subtracts against. The tile is sized
  to twice the box and centred so its conic centre lands on the element's, which
  is also why `::before` and `::after` position from `50%` rather than from the
  corner the repeating materials use.

  The lighting needs no new mechanism. The pair is still offset ±2px along the
  lamp, so it still evaluates the directional derivative of the height field —
  and on a circular field that derivative is proportional to the _tangential_
  component of the offset, which vanishes where the offset points straight out
  from the centre. The two bright arcs with dark lobes 90° away, swinging as the
  lamp does, are therefore geometry rather than a painted effect. Toward the
  centre the angular pitch shrinks past the offset and the samples decorrelate,
  which is the converged hotspot every spun disc has.

- f91f203: New `.amb-mat-brushed` and `.amb-mat-blasted`: micro-relief materials

  Two surface finishes that add texture rather than gloss, fitted against
  photographed crops: brushed aluminium (pale, anisotropic, very low contrast)
  and bead-blasted rubber (dark, isotropic, grain about 3x deeper). Both set
  `--amb-mat-specular: 0` and `--amb-mat-roughness: 1`, and both compose with
  `.amb-surface`, the edge treatments and the elevations like any other
  material.

  Nothing about the relief is ever transformed. The tile carries the raw height
  field and a second tile carries its exact inverse; one is offset toward the
  lamp and the other away from it, so the pair evaluates the slope of the
  surface along the light. Only `background-position` moves, so every bump stays
  on the same pixel and the shading crosses over it — where a lit relief rotated
  to follow the lamp is a photograph of a relief, and visibly swims. Anisotropy
  then falls out of the geometry: offsetting _along_ a brushed grain samples two
  points at the same height, the pair cancels, and the metal goes smooth.

  Offsets snap to whole pixels with `round()`. A fractional `background-position`
  resamples the tile and erases grain about a pixel across, which for grain this
  fine is most of it; on rubber that is the difference between 0.44 and 0.99
  consistency across lamp angles.

  New `--amb-grain-amount` (default `1`) scales the relief and inherits, so a
  panel can dial down everything inside it. A material's own directional term is
  deliberately not this property: turning the grain down must not be able to
  delete the brushed anisotropy.

  Each material ships its own `--amb-albedo` — the reflectance it was calibrated
  at. It stays overridable, but the grain's amplitude is fitted at that tone and
  does not follow the tone law far from it, so refit if you retone a long way.

  Two costs: the relief consumes both pseudo-elements, so an element that already
  uses one of its own needs the grain on an inner layer (`@ambientcss/components`
  paints its button-cap dish in `::after`, so a cap cannot take these directly);
  and the host gets `overflow: hidden`, needed so the blend clips to a rounded
  corner, which clips real children too.

- f91f203: The brushed metals now carry a specular sheen

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

- f91f203: New `--amb-curve-delta`: the curvature magnitude as a shared variable

  The grounded end delta from `curved.md` — `(Ik - If) * 3.16 + 3.78` — was
  written out three times, once inside each of `.amb-surface-concave`,
  `.amb-surface-concave-h` and `.amb-surface-convex`, and a fourth time in
  `@ambientcss/components` for its dished button cap. It is now declared once
  as `--amb-curve-delta` and read by all four, so a re-derivation of that fit
  lands everywhere at once. Each class still supplies its own axis and sign;
  only the magnitude is shared.

  The variable is in points of lightness and **unitless** (multiply by `1%` to
  use it in a color), so it can also be divided — which is what turns it into
  an overlay alpha over a known base.

  It is declared on `*`, not on `:root`, and that is load-bearing: a custom
  property's `var()`s are substituted on the element that declares it, so the
  `:root` form froze at the document's light and ignored any subtree scoping
  its own — the calibration harness, `AmbientProvider`, `amb-light-*`. The
  compare gate caught this (5 metric failures across the intensity sweeps);
  the per-element form is back to 0 failures over 174 frame pairs, confirming
  the curved classes render bit-for-bit as before.

  Because `*` re-declares it on every element, assigning to
  `--amb-curve-delta` on an ancestor cannot reach descendants — so the
  themeable knob is a second, ordinary variable, `--amb-curve-scale`
  (default `1`, a multiple of the measured curvature). Set that on `:root` or
  any subtree to deepen or flatten every curved face; it inherits normally.
  The pairing mirrors `--amb-lume-hue` / `--amb-lume`: an input you set and a
  derived value you read.

  `api-baseline.json` gains one selector (`*`) and two properties
  (`--amb-curve-delta`, `--amb-curve-scale`); nothing was removed or renamed.

### Patch Changes

- f91f203: Fix: `amb-mat-glass` shipped with no backdrop blur at all

  `ambient.css` wrote `backdrop-filter` and then a hand-rolled
  `-webkit-backdrop-filter` copy of it. lightningcss (which does the
  prefixing itself in `scripts/build-css.mjs`) collapses that pair to the
  last declaration it sees, so `dist/ambient.css` carried the **prefixed form
  alone** — and current Chrome reports `CSS.supports("-webkit-backdrop-filter",
"blur(8px)")` as false. Every consumer loading the built stylesheet has had
  glass with no blur: `AmbientButton material="glass"`, `AmbientSlider`, and
  the new `AmbientSelect`, whose diffuser depends on it entirely.

  It went unnoticed because the demo app resolves the package's `development`
  export to the unprocessed source, where both declarations are present and
  the material works. It reproduces on the docs site, which loads `dist`.

  Removing the hand-written prefix fixes it: given the standard property
  alone, lightningcss emits both, prefixed first. Verified in the built file
  and in the browser. `ambient.css` had no other hand-written prefixes.

  Kept a patch rather than a minor: it restores documented behaviour rather
  than changing any API. It is not invisible, though — glass components render
  differently now. Checked side by side: the shift is small, because the glass
  cap sits over a flat well and blurring a solid colour is close to a no-op
  except at the edges. That is also why the bug survived this long; the new
  `AmbientSelect` is the first place the blur has structure behind it to work
  on.

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
