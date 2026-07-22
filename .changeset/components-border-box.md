---
"@ambientcss/components": patch
---

Fix controls rendering oversized on pages without a global `box-sizing`
reset. Every control sizes its moving part as a percentage of a padded box
— a button's cap is `width: 100%` of a well inset by the clearance ring,
a knob's face `100%` of the knob — and under the default `content-box`
those paddings add to the percentage instead of fitting inside it, so the
button cap rendered visibly larger than the well it sits in, with the gap
ring showing on only two sides. `styles.css` now scopes
`box-sizing: border-box` to the package's own elements. Apps that already
reset globally (the demo does, which is what masked this) see no change.
