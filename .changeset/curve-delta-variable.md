---
"@ambientcss/css": minor
---

New `--amb-curve-delta`: the curvature magnitude as a shared variable

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
