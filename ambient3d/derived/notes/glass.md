# glass — not grounded (deferred)

`.amb-mat-glass` is built on `backdrop-filter` (blur + saturate of
whatever happens to be behind the element) plus a translucent tint.
Its physical referent would be a transmission plate over a patterned
backdrop, measuring refraction blur and tint through the slab — a rig
apparatus (checker ground, transmission material, blur-through-glass
metric) that adds little: the dominant visual term, the backdrop blur,
has no counterpart in a Cycles top-down render (the CSS blur radius is
a UX convention, not an optical quantity at this scale).

Decision: glass keeps its designed values. Its tint/border/highlight
ramp can be revisited against a transmission render if the class is
ever reworked. The compare gate carries no glass scenes.
