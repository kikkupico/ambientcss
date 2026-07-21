---
"@ambientcss/css": minor
---

Blender-grounded rewrite: every effect's coefficients are now derived from
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
