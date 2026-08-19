---
"@ambientcss/components": minor
---

Knurl the knob's rim instead of its whole face

The knurled knob was a cog: 36 near-trapezoidal teeth cut the full silhouette,
their shading ran in from the edge, and the body behind them had no chamfer, so
nothing said where the top face stopped. A real turned-and-knurled knob is a
smooth chamfered cap with a band of ribs machined into the rim beyond that
cap's edge and a step below it.

It is now built that way. `KnobBody` is the cap either way — chamfered in both
variants, and inset by the knurl band's width when there is one — and
`KnurledFace` clips to a toothed **annulus** rather than a disc, so the cap and
its chamfer bands paint through underneath. The ribs themselves are finer (48,
sampled off the referent's `depth * (0.5 + 0.5cos(N.theta))^sharpness` section
rather than a four-point trapezoid) and carry a contact-occlusion band along the
inner edge where the cap overhangs them, radial so it survives the frame's
rotation, and a `--amb-shade` step down so the band reads as material sitting
lower rather than a black wash over the cap's tone.

`material` now applies to both elements a knurled knob paints with, rather than
only the clipped face; `knurling={false}` is unchanged.

The referent follows. `knob.py` grows `knurl_rim` / `cap_chamfer` — the ribs
stop below the top face, a bevel of that radial width carries them out to the
full radius, and a smooth chamfer and flat cap sit above and inside it — and
`referents.py` takes every knob number straight from `KNURLS.standard` and the
component's own CSS. `renders/components/knob.png` and `knob-line.png` are
re-rendered. The two rib sections are now the same formula, which is a stronger
parity claim than the depth-matching the old comment made.
