---
"@ambientcss/components": minor
---

New `AmbientSelect`: a bank of lamp-lit keys

A select / multi-select built as hardware builds one — a rail of keys whose
state is a lamp under the cap, not a tick or a fill. Selecting a key lights
the LED beneath it and the light floods up through the key's translucent cap.

Each key is three layers, and the order is the whole mechanism: the option is
the pocket floor in the grounded `amb-surface` tone, `amb-select-lens` is the
LED's lens lying on it, and `amb-select-cap` is an `amb-mat-glass` diffuser
over both. Because the cap is glass, its `backdrop-filter` blurs what is
behind it — which is the lens — so one disc produces both states with no
second gradient anywhere: a soft dark circle through the frost when unlit
(the lamp is visibly *there*), and a broad radial glow with a hot centre when
lit. Verified in the browser that `backdrop-filter` samples a positioned
sibling, which is why the lens is absolute and the cap is `position: relative`
rather than the reverse. The blur is tied to the key size, since diffusion is
a ratio of the lens it spreads. Light escaping onto the rail uses the grounded
emissive bloom radius (6.2px, from `glow.md` — the figure `amb-glow` uses).

Pressing a key sinks it and only sinks it, matching `AmbientButton`.

The lamp colour is `--amb-led-color`, the variable `amb-led` and
`AmbientSwitch`'s `led` prop already use, so one declaration lights every
indicator on a panel; set it per group with `color` or per key on the option.
Unset it falls back to `--amb-highlight-color` rather than a hardcoded hue.

Keys are square by default, but the size is a floor rather than a fixed width,
so a longer legend may widen one and a vertical rail stretches the rest to
match. For uniform keys with long names, legend them with icons and give each
option an `ariaLabel` — which supplies both the accessible name and the hover
title, since a glyph has neither.

Single select is a `radiogroup` of `radio`s with a roving tabindex — the lit
key owns the tab stop, and the arrows move focus and selection together, with
Home/End. `multiple` switches to a `group` of `checkbox`es where every key is
tabbable and Space toggles. Arrow direction follows `orientation`.
