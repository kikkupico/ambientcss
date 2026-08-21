---
"@ambientcss/components": minor
---

`AmbientKnob` takes a `knurlColor`

A two-tone knob — dark grip ring round a pale cap — is a real piece of
hardware, and until now the ring could only be the cap's own colour. The new
prop sets it, and `KnurledFace` takes the matching `color`.

It is an **albedo**, not paint: the value lands on `--amb-albedo` for the ring
alone, so a dark knurl still takes the scene's exposure, the lamp's cast and
the rim's own contact shading, and still goes dark when the lights do. It is
set inline on the ring, so it wins over the albedo a micro-relief material
would otherwise put there — an explicit colour wins the tone and the finish
keeps its grain.

The cap has no matching prop on purpose: the cap's colour is the control's
colour, set the ordinary way with `--amb-albedo`. The grounded kit gains
`knurlColor` in its `looks` vocabulary, so a kit that dresses rotaries
differently warns about it in development like any other foreign look prop.
