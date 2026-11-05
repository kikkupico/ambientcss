---
"@ambientcss/components": minor
---

Kits can draw more than one version of a control. Every preset (`AmbientKnob`, `AmbientFader`, `AmbientSlider`, `AmbientButton`, `AmbientSwitch`, `AmbientSelect`) takes a `variant` prop, which reaches the kit's family function as `look.variant`. `ControlKit.variants` lists the names each family offers, default first; in development, asking for a name the kit does not offer warns once and draws the default.
