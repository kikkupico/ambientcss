---
"@ambientcss/components": minor
---

Button shapes and knob types, matching the referent lineup
(`ambient3d/generate.py` — the catalog's round/square keys, pads, and
the classic/OP-Z/OP-1/wheel knob styles):

- **AmbientButton** gains `shape`: `"pill"` (default, the wide stadium
  transport key), `"round"` (circular key — pair with
  `material="shiny"` for the machined metal-button look), and
  `"square"` (EP-133-style pad: tighter corners, 3.6mm cap at thickness
  0.8 instead of the key's 4.5mm, same 0.7mm press travel).
- **AmbientKnob** gains `variant`: `"dot"` (default, the grounded
  36-rib referent), `"line"` (radial indicator line), `"flute"` (14
  broad flutes with deep roots and a centered dot, OP-Z-style),
  `"cap"` (fine 48-rib knurl under a smooth accent top disc,
  OP-1-style), and `"wheel"` (bare fine knurl, no indicator). Each
  family gets its own knurl clip silhouette and pitch-matched flank
  shading.

Each new shape/variant has a flat-on grounded referent render
(`ambient3d/ground_components.py`, which now accepts a name filter
after `--`) compared against the live component in the docs.
