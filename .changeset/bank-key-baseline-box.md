---
"@ambientcss/components": patch
---

`AmbientBank` keys get a real box and a positioning context of their own, independent of any look.

Every other actuator sizes and positions itself at the mechanism level — `.ambx-latch` is `position: relative` with its own width and height before any look touches it. A bank's keys never had that: sizing (`min-width`/`height: var(--ambx-select-size)`) and `position: relative` were only ever declared on the look-specific classes (`.amb-select .ambx-key`, and neither `.amb-select-radio` nor `.amb-console-bank` set `position: relative` at all). A bank dressed with no look — a from-scratch kit, or the Kit Builder's "empty" seed — had keys with no size, and any `fill`-placed content inside one had no positioned ancestor to fill: it escaped to whatever ancestor further up the page happened to be positioned, collapsing every key's content into one shape spanning the wrong box.

`.ambx-key` now carries that baseline itself. A look's own class is more specific and still wins outright where it sets a real size or shape (the round radio key, the square console key); this only supplies the floor underneath, so a custom bank has correctly boxed, correctly positioned keys from the moment it exists, before any look is chosen.
