---
"@ambientcss/css": major
"@ambientcss/components": major
---

Relief materials carry no `--amb-albedo` of their own any more

`.amb-mat-brushed`, `.amb-mat-brushed-round` and `.amb-mat-rubber` each used
to ship a calibrated default reflectance (0.49 linear for both metals, 0.0644
for rubber), so a plain `<div class="ambient amb-surface amb-mat-rubber">`
rendered as dark rubber and a brushed one as mid-grey metal without any
colour set. That made them the odd ones out: `.amb-mat-matte` and
`.amb-mat-shiny` have never carried a colour, they only add relief or gloss
on top of whatever `--amb-albedo` the surface already has. All five now
behave the same way — a material is relief and specular only, never a
colour — so left alone, brushed/spun/rubber render at the reference ground,
same as matte and shiny.

**This changes default rendered output** for any element that wears one of
the three relief classes without setting `--amb-albedo` itself: it now
renders pale (the reference ground) instead of its old fitted tone. Set
`--amb-albedo` explicitly for the calibrated look — the reference each
material's grain was fitted at is documented at its class in
`packages/ambient-css/src/ambient.css` and in the docs' "Colouring every
material" section:

```css
.amb-mat-brushed,
.amb-mat-brushed-round { --amb-albedo: color(srgb-linear 0.49 0.49 0.49); }
.amb-mat-rubber { --amb-albedo: color(srgb-linear 0.0644 0.0629 0.0629); }
```

In `@ambientcss/components`, `ButtonCap` no longer swaps a relief-material
cap onto `.ambx-cap-tone-brushed` / `-brushed-round` / `-rubber` to correct
its dish-shading math for a fixed tone that no longer exists — a relief-faced
cap now derives its dish the same way any other dished surface does, from
`--amb-shade`. The rubber tone class's automatic light-label override (for
legibility against a face that used to always be dark) goes with it: a
rubber-faced cap you colour dark now needs its own `--amb-label` override,
the same as a dark matte or shiny one would.
