---
"@ambientcss/css": patch
---

Fix `--amb-elevation` leaking into nested `.ambient` elements. It's a
plain CSS custom property, so without an explicit `inherits: false` it
cascaded down the DOM by default: any component nested inside an
`.amb-elevation-2` container (e.g. AmbientPanel) picked up that
elevation's shadow even without an elevation class of its own. The
`@property` registration now sets `inherits: false`, so every element
falls back to the initial value (0) unless it explicitly sets its own
`--amb-elevation` or `.amb-elevation-N` class.
