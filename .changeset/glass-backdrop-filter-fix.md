---
"@ambientcss/css": patch
---

Fix: `amb-mat-glass` shipped with no backdrop blur at all

`ambient.css` wrote `backdrop-filter` and then a hand-rolled
`-webkit-backdrop-filter` copy of it. lightningcss (which does the
prefixing itself in `scripts/build-css.mjs`) collapses that pair to the
last declaration it sees, so `dist/ambient.css` carried the **prefixed form
alone** — and current Chrome reports `CSS.supports("-webkit-backdrop-filter",
"blur(8px)")` as false. Every consumer loading the built stylesheet has had
glass with no blur: `AmbientButton material="glass"`, `AmbientSlider`, and
the new `AmbientSelect`, whose diffuser depends on it entirely.

It went unnoticed because the demo app resolves the package's `development`
export to the unprocessed source, where both declarations are present and
the material works. It reproduces on the docs site, which loads `dist`.

Removing the hand-written prefix fixes it: given the standard property
alone, lightningcss emits both, prefixed first. Verified in the built file
and in the browser. `ambient.css` had no other hand-written prefixes.

Kept a patch rather than a minor: it restores documented behaviour rather
than changing any API. It is not invisible, though — glass components render
differently now. Checked side by side: the shift is small, because the glass
cap sits over a flat well and blurring a solid colour is close to a no-op
except at the edges. That is also why the bug survived this long; the new
`AmbientSelect` is the first place the blur has structure behind it to work
on.
