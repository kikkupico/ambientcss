---
"@ambientcss/css": minor
"@ambientcss/components": minor
---

New `.amb-mat-brushed-round`: spun aluminium

The same metal as `.amb-mat-brushed` with the grain turned about the element's
centre instead of run across its face — the lathe finish on a knob cap or a
volume dial, rather than the belt finish on a faceplate. It is the third
micro-relief material and behaves like the other two: `--amb-albedo` for its
tone, `--amb-grain-amount` for the relief, both pseudo-elements consumed,
`overflow: hidden` on the host. `AmbientMaterial` gains `"brushed-round"`, so
every component that takes a `material` takes this one.

The grain is a conic gradient rather than a repeating tile, because circular
grain has no translational period to tile: 64 jittered streaks of angle from a
fixed seed, with the same contrast stretch the SVG tiles apply, plus the exact
per-stop inverse the screen/multiply pair subtracts against. The tile is sized
to twice the box and centred so its conic centre lands on the element's, which
is also why `::before` and `::after` position from `50%` rather than from the
corner the repeating materials use.

The lighting needs no new mechanism. The pair is still offset ±2px along the
lamp, so it still evaluates the directional derivative of the height field —
and on a circular field that derivative is proportional to the *tangential*
component of the offset, which vanishes where the offset points straight out
from the centre. The two bright arcs with dark lobes 90° away, swinging as the
lamp does, are therefore geometry rather than a painted effect. Toward the
centre the angular pitch shrinks past the offset and the samples decorrelate,
which is the converged hotspot every spun disc has.
