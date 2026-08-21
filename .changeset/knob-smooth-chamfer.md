---
"@ambientcss/components": patch
---

Chamfer the smooth knob's rim

`knurling={false}` now cuts a small base chamfer into the knob body, the
edge treatment `knob.py` puts on every knob (`chamfer=0.35`) regardless of
rib count. A knurled knob's clipped silhouette already reads as machined,
but a smooth body with nothing standing proud had no cue that its rim is
turned rather than a flat disc; the chamfer highlight/shadow bands supply
that. Width 2, paired level-for-level with the body's knob-scale
(`amb-thickness-2`) thickness, matching `.amb-chamfer-2`'s own convention.
