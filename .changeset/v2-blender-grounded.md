---
"@ambientcss/css": major
"@ambientcss/components": major
---

**v2.0.0 — the library is re-based on the Blender-grounded rewrite.**

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
