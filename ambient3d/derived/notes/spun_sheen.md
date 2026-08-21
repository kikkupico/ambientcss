# spun_sheen — grounded fit

Model: `amplitude: mean sheen excess (ring_profile minus its relief-only twin) = s * Ik + s0 (sRGB), from spun_sheen; the center disk's own excess is hotspot_s * Ik + hotspot_s0. Directionality checked, not assumed: see pos_frac_by_bearing`

- **s_mean_per_key**: `0.0022`
- **s0_mean**: `0.0068`
- **r2**: `0.9926`
- **n_samples**: `3`
- **hotspot_s_per_key**: `0.0025`
- **hotspot_over_ring_ratio**: `1.012`
- **pos_frac_by_bearing**: `[0.213, 0.851, 0.915, 0.511]`
- **pos_frac_expected_if_directional**: `0.5`

## Transcribed into ambient.css

`--_sheen-alpha` only. Inverted through the same `excess = alpha * (1 -
base)` relation `brushed_sheen.md` uses (spun's `ring_profile` mean and
`brushed`'s `axis_profile` mean invert to alpha values matching to 3
decimal places at every key sampled — one Anisotropic BSDF amount and
specular setting shared by both finishes in the rig, so this agreement is
expected, and it is also the strongest cross-check either fit has):
`calc(key * 0.11 + 0.04)` -> `calc(key * 0.0207 + 0.0103)`, the same
formula now shared by `.amb-mat-brushed` and `.amb-mat-brushed-round`
(unchanged from before this pass — they always shared one formula, only
its value moved).

NOT transcribed, and this is a checked conclusion, not a gap: the conic
band's 62deg half-width and the center hotspot's 1.5x factor. Checked via
`spun_sheen_pos` — 4 light bearings at the SAME high contrast
(key 0.9/fill 0.1) that recovered a real, clean, light-tracking peak for
brushed's equivalent check. If the excess here were a real conic lobe
locked to the light, as the CSS's shape assumes, `pos_frac_by_bearing`
would land near `0.5` (this extractor's own convention: 0.5 = aligned
with the light) for every bearing. It does not: `[0.213, 0.851, 0.915,
0.511]` — only one of four is close, and there is no consistent offset
explaining the other three either. `hotspot_over_ring_ratio` (`1.012`)
says the same thing a different way: the center disk's own excess is
statistically the same as the ring's, i.e. no distinct hotspot separate
from the general (non-directional) brightening.

Ruling out "not enough signal": the ORIGINAL low-contrast `spun_sheen`
sweep (this fit's own amplitude data, key 0.3-0.9 against fixed fill 0.7)
gave a similarly flat, undifferentiated angular profile — raising the
possibility this was just noise, the same failure mode brushed's
low-contrast sweep had. `spun_sheen_pos` rules that out by using
IDENTICAL rig conditions to `brushed_sheen_pos`, which DID resolve a
clean, real peak under those exact conditions. Same rig, same camera, same
extraction method, different grain orientation, different result: the
directionality genuinely is not there for this finish under this rig's
lighting, not merely unmeasured. Left at the prior hand-tuned shape,
which is therefore unconfirmed rather than disconfirmed by this pass —
see the CSS comment above `.amb-mat-brushed-round`'s sheen for the same
statement in context.

## Correction (2026-08-21): same alpha revert, and the directionality claim is downgraded

### Alpha

Identical to `brushed_sheen.md`'s, which carries the full argument: the
amplitude fit above rests on an orthographic rig that cannot resolve a
positional sweep at all, and the reference crops' `13.4` is not the same
quantity as a 240px control's sheen band. Reverted and re-grounded visually
at the shared formula:

`calc(key * 0.0207 + 0.0103)` -> **`calc(key * 0.237 + 0.0863)`**

Still one formula shared with `.amb-mat-brushed`, as it always was. Worth
recording that spun needs the sheen *less*: its alpha-0 sweep is already
**2.32**, against brushed's **0.19**, because the conic tile carries that
structure itself.

*Measured with `tools/css-harness/ladder.mjs` (renders one panel per candidate value against the shipped `ambient.css`) split by `ambient3d/measure/panel_split.py`. Re-runnable: `node ladder.mjs --mat <finish> --var <prop> --values a,b,c`.* It reads correctly at the shared value,
and one metal in two finishes should not carry two sheen formulas.

### The directionality conclusion is downgraded: unmeasurable, not disconfirmed

The section above claims the conic band's 62deg half-width and the centre
hotspot's 1.5x factor are **"a checked conclusion, not a gap"** — that the
directionality "genuinely is not there for this finish under this rig's
lighting, not merely unmeasured".

**That claim is withdrawn.** Its reasoning was that `brushed_sheen_pos`
resolved a clean peak under identical rig conditions while
`spun_sheen_pos` did not, so the difference had to be the material. But the
orthographic-camera argument above shows the rig cannot resolve a
positional sweep for *either* finish; brushed's apparent peak came through
perturbed normals, and spun's radial grain has no equivalent linear axis to
produce one. Same blindness, different grain geometry — not evidence about
the material.

Reference crop #2 plainly shows the converged hotspot and opposed lobes the
CSS already paints. **The shipped conic shape is kept**, and its status
changes from *disconfirmed by this rig* to **unmeasurable on this rig** —
`pos_frac_by_bearing` and `hotspot_over_ring_ratio` above should be read as
null results, not negative ones.
