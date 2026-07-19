---
"@ambientcss/css": minor
---

Blender-grounded rewrite: every effect's coefficients are now derived from
measured Cycles renders of an equivalent physical scene, verified by a
render-vs-CSS comparison harness. The public API is unchanged (frozen by
api-baseline.json); computed values changed throughout, anchored so the
default look (key 0.9, fill 0.7) is preserved.

- `.amb-surface` family: lightness affine in key AND fill intensity
- chamfer/fillet bands: affine alphas (bands persist at key = fill), the
  highlight rides the fill light, fillet offset 1.5px/width
- drop shadow: unified over silhouette height (8px·elevation +
  4.5px·thickness); constant spread; alpha decays with elevation only
- NEW `.amb-thickness-0/1/2`: physical body height — 0 is imperceptible
  at rest, 1 is button-scale, 2 knob-scale; edge treatments require
  thickness ≥ 1 and imply it by default
- curved surfaces: gradient stops ride the grounded surface base
- `.amb-mat-shiny`: two grounded specular features — a grazing Fresnel
  rim at the lit edge plus the key light's mirror band at 29% in from it
- `.amb-glow`: halo radius 4px → 5.5px from measured bloom falloff
- `.amb-mat-glass` keeps its designed values (documented)
