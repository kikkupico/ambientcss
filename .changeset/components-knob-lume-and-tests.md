---
"@ambientcss/components": patch
---

Add a test suite for the bare mechanisms (AmbientRotary, AmbientTravel, AmbientPress, AmbientLatch, AmbientBank) covering ARIA, the keyboard contract, the state channel and controlled/uncontrolled behaviour. Fix an AmbientBank bug the suite surfaced: `useBank.keyProps()` included a `key` prop that was spread into JSX, making React warn and dropping keys on release builds — the key now lives at the mapping site in `AmbientBank`.

The knob's indicator dot, indicator bar and printed scale markers now take `--amb-lume` instead of `--amb-highlight-color` / `--amb-label`, and the console kit's bar-knob mark takes `--amb-lume` instead of darkened surface ink, so pointer and scale read as one backlit instrument: bright in a bright scene, glowing as the lights drop. Override `background` on `.amb-knob-indicator-circle`, `.amb-knob-indicator-rectangle`, `.amb-knob-marker` or `.amb-console-indicator` to restore painted ink.

The console kit's toggle thumb and the knob's centre mark keep their accent orange but now wear it as reflectance — `amb-surface` bodies with `--amb-albedo` pinned to the accent — so they shade and re-light with the scene instead of reading as flat paint.
