---
"@ambientcss/components": minor
---

Dished button caps, and a press that reads as lost light

The button cap is no longer a flat face. A `.amb-button-cap::after` overlay
gives it a subtle concavity along the light axis — the far wall of the
scoop tilts into the light, the near wall tilts away, so the face darkens
just past the lit edge and brightens toward the far one. The profile's
shape (a lift at the lit rim, a minimum ~20% across, then an accelerating
rise) is measured off a photographed dished key; its amplitude reads
`--amb-curve-delta`, the grounded fit `.amb-surface-concave` also rides, so
a concave cap and a concave plate curve by the same amount and cannot drift
apart. Only the axis and the profile are the cap's own — the curved classes
are single-axis and symmetric, and a cap has to follow whichever light an
app has set. The overlay reorients with all eight `.amb-light-*` positions
and sits under the label, not over it.

All three cap silhouettes — pill, round and square — carry the same
curvature; a dish is a property of the tooling, not of the outline. Tune it
with `@ambientcss/css`'s `--amb-curve-scale`, which works at any scope from
a single button to the whole page.

The pressed state is unchanged in colour: it still only sinks the cap by the
referent's 0.7mm travel, so the press reads as travel — a shortening drop
shadow and narrowing chamfer bands — rather than as a repaint.

The `ambient3d` button referents are scooped to match, so the docs'
side-by-side comparison still lines up.
