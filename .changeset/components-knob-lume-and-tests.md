---
"@ambientcss/components": patch
---

Add a test suite for the bare mechanisms (AmbientRotary, AmbientTravel, AmbientPress, AmbientLatch, AmbientBank) covering ARIA, the keyboard contract, the state channel and controlled/uncontrolled behaviour. Fix an AmbientBank bug the suite surfaced: `useBank.keyProps()` included a `key` prop that was spread into JSX, making React warn and dropping keys on release builds — the key now lives at the mapping site in `AmbientBank`.

The knob's indicator dot, indicator bar and printed scale markers now take `--amb-lume` instead of `--amb-highlight-color` / `--amb-label`, and the console kit's bar-knob mark takes `--amb-lume` instead of darkened surface ink, so pointer and scale read as one backlit instrument: bright in a bright scene, glowing as the lights drop. Override `background` on `.amb-knob-indicator-circle`, `.amb-knob-indicator-rectangle`, `.amb-knob-marker` or `.amb-console-indicator` to restore painted ink.

The console kit's toggle keeps its accent orange but now wears it as reflectance — the thumb is an `amb-surface` body with `--amb-albedo` pinned to the accent, the track's ON fill shades the accent through the same `--amb-exposure` law the thumb's face uses, its OFF floor is the lit albedo held at 30% in linear light (a dark grey that still tracks the lamp), and the thumb's ring is `--amb-lume`, an emissive halo around the orange face. Every part of the switch re-lights with the lamp; the track no longer carries a fixed recess step, so OFF reads as shaded ground rather than painted black.
