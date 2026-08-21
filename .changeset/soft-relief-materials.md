---
"@ambientcss/css": patch
---

Soften the micro-relief materials. Grain contrast is dialed back ~50% on all three finishes — `.amb-mat-brushed` (`--_grain-alpha` 0.42 → 0.20), `.amb-mat-blasted` (0.666 → 0.32) and `.amb-mat-brushed-round` (0.197 → 0.10) — and the metals' anisotropic sheen amplitude is halved (key-light 0.9 now lands at ~0.14 instead of 0.30). The public API is unchanged; only the fitted constants move.
