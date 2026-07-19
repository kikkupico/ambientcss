---
"@ambientcss/components": minor
---

Components rebuilt from grounded primitives to match their richer 3D
referents (`ambient3d/components/*` — the design source of truth), with
thickness-based bodies instead of resting elevation:

- **AmbientButton**: a chamfered key cap (thickness 1) seated in a
  clearance well — the button element is an `.amb-groove` whose lume
  interior shows as the gap ring. Pressing sinks the cap by the
  referent's 0.7mm travel; the chamfer bands and swept shadow shrink
  with it.
- **AmbientKnob**: knob-scale body (thickness 2 = the referent's 9mm)
  resting on the panel. The rotating face is clipped to a true
  straight-knurl silhouette (36 trapezoid teeth via an inline SVG
  clipPath in objectBoundingBox units, so it scales with the grid) with
  phase-aligned per-tooth flank shading, under a smooth top disc and an
  accent indicator dot; teeth and all rotate with the value. The
  circular body beneath keeps the drop shadow smooth.
- **AmbientSwitch**: now a slide switch — a pill riding in a recessed
  stadium `.amb-groove` track, optional LED above. Same props and ARIA.
- **AmbientFader**: pill thumb with a grip line (thickness 1.5, riding
  2.2mm above the plate like the referent's stem) on the groove + lume
  track.
- **AmbientSlider**: domed disc thumb gliding over a shallow concave
  channel (groove at thickness 0.22).

Each component's docs page gains a "Grounded counterpart" section
comparing the live component against a flat-on render of its 3D referent
built at the CSS dimensions (`ambient3d/ground_components.py`).
