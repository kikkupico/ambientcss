---
"@ambientcss/components": minor
---

The bank's glow is now a kit's choice rather than part of the bank. `.amb-select` draws only the rail and the keys' boxes; the light pocket floor the lamp parts sit on is `.amb-select-lamp`, and the light a selected key spills onto the rail is `.amb-select-glow`. `groundedKit` wears all three, so `AmbientSelect` renders exactly as before. `KeyLens` and `KeyCap` now style their lit, hover and disabled states from the key itself, so they work in any bank.

A custom kit that wore `amb-select` with `KeyLens` / `KeyCap` and wants to keep the old look should add `amb-select-lamp amb-select-glow` to its bank's `className`.
