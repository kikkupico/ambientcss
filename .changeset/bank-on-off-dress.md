---
"@ambientcss/components": minor
---

`AmbientBank` / `AmbientSelect`: a key's on and off state can now be genuinely different markup, and a bank's own enclosure can be dressed separately from its keys.

`AmbientBank` gains `keyPartsOn` / `keyPartsOff`, overriding `keyParts` per key state — for a bank where the lit and unlit keys are different castings rather than the same key restyled through `[data-on]`. `KitDress` gains matching `onParts` / `offParts`, plus `panelParts` for the bank's own root frame (the rail around every key), which `AmbientSelect` now actually forwards to `AmbientBank`'s `parts` prop — it was previously accepted and silently dropped.

The `grounded` kit demonstrates the new split with a second bank look, `look={{ shape: "round" }}`: a row of ordinary round pushbuttons with no shared rail, Dieter Rams style — off is a plain matte cap, on is a glossy one wearing the bank's lamp colour.

The `console` kit now dresses `bank` too: selection reads as the key sitting flush (`--amb-thickness: 0`) against the rest at knob-scale thickness, with a moulded circular dish sunk into every key — a mixer-desk key bank, not a lamp-strip. The selected key's lamp has two readings, chosen by whether the option carries a legend: a key without one keeps a small centre LED that lights only when selected; a key with a legend (an empty-string label counts as none) drops the LED and lights the text itself, from the panel's ink to the bank's lamp colour — the same `--amb-led-color` channel, so one `color` prop lights either alike. Both readings are the same markup styled through `[data-on]`, so the kit's bank needs neither `onParts` nor `offParts`.
