---
"@ambientcss/components": minor
---

`AmbientMaterial` gains `brushed` and `blasted`

The two micro-relief finishes from `@ambientcss/css` are now part of the
material vocabulary, so every part that already took a material takes these
as well.

`AmbientPanel` was the one component that could not have been extended by
adding to the union alone: it mapped its material through a hardcoded ternary
whose else-branch sent anything unrecognised to `amb-mat-glass`, so a new
member would have rendered as glass rather than as itself. It now builds the
class the same way every other part does, and its prop is typed
`AmbientMaterial` rather than a second copy of the union.

`ButtonCap` needed real work. A relief material wants BOTH pseudo-elements for
its grain, and the cap already spends its own `::after` on the dish — the
dish's `background` shorthand and the grain's tile would each have silently
won half of the other's declarations. The cap now gives a relief material an
inner `.ambx-cap-face` layer, under the dish and under the legend, which is
the inner layer the CSS package's own note prescribes. Markup and props are
unchanged; only the internals of a cap wearing one of these two finishes are.

The face wears the cap's chamfer itself. A chamfer is painted as INSET
shadows, which belong to the background layer of the element that declares
them, so an opaque face laid over the cap would otherwise have hidden the cut
— and a relief button would have been the one material that lost its bevel.
Wearing it puts the cut back, in the material's own tone rather than the cap's.

Two further consequences of putting a genuinely dark material on a cap for the
first time, both fixed here rather than left to the caller:

- The dish derives its overlay alphas from the surface lightness it washes
  over, and assumed the reference ground. On a rubber face (L\* 28.6) it
  computed a 0.44-alpha white wash down one side, reading as chrome rather
  than as a curve. `--_ambx-cap-tone` now tells it the face's reflectance as
  a ratio of the reference, taking that peak to 0.06. It multiplies
  `--amb-shade` rather than replacing it, so a consumer's own shade still
  composes, and it defaults to 1 — every existing cap is unchanged.
- `--amb-label` is derived from the light rather than from the surface it
  lands on, which is right down to about L\* 40 and wrong below it: a rubber
  cap's legend computed to a 26% lightness and vanished into the face. A
  rubber cap now inverts its label. Brushed, at L\* 72, reads fine with the
  stock one and is left alone.

Neither is a new limitation of the cap — set `--amb-albedo` to something this
dark on a plain cap today and you get the same blown-out dish and the same
vanished legend. These two finishes are simply the first materials that carry
such a tone themselves, so they carry the correction with it.
