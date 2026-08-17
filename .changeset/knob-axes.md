---
"@ambientcss/components": major
---

`AmbientKnob`: `variant` replaced by `knurling`, `markers` and `indicator`

**Breaking.** The `variant` prop and the `AmbientKnobVariant` type are gone.
The five variant names bundled three unrelated decisions into one enum, so
picking a knurl also picked an indicator and there was no way to ask for a
combination the enum did not happen to list. They are now three independent
props, and every combination is reachable.

```tsx
// before
<AmbientKnob variant="dot" />
<AmbientKnob variant="line" />

// after
<AmbientKnob />                                   // the same knob: knurled + circle
<AmbientKnob indicator="rectangle" />
<AmbientKnob knurling={false} markers="full" indicator="rectangle" />
```

Migration: `variant="dot"` is the default and needs nothing. `variant="line"`
becomes `indicator="rectangle"`. `variant="flute"`, `"cap"` and `"wheel"` have
no replacement — see below.

- **`knurling`** (`boolean`, default `true`) — the grounded referent's 36-rib
  knurl, or a smooth turned body. With no teeth standing proud there is
  nothing for the body to hold back from, so a smooth knob's body takes the
  full width and becomes the whole visible knob, its rim read from the
  thickness bands; the rotating layer above it then paints nothing and exists
  only to carry the indicator.
- **`markers`** (`"none" | "ends" | "full"`, default `"none"`) — printed scale
  dots on the panel around the knob. `"ends"` marks where the travel starts
  and stops; `"full"` is 13 dots at 22.5°, the pitch measured off the
  reference panel. They are placed from the same sweep constants the value
  mapping uses, so a dot always sits exactly where its value points, and they
  sit outside the rotating layer because a printed scale that turned with the
  knob would mean nothing. Ink is `--amb-label`, the legend colour, rather
  than the accent the indicator takes — these are panel graphics, not part of
  the control.
- **`indicator`** (`"rectangle" | "circle"`, default `"circle"`) — the offset
  dot, or a short radial bar near the rim.

**The rectangle is not the old `line`.** `variant="line"` drew a full spoke
from close to the centre out to 0.76R. The rectangle runs 0.50R to 0.84R and
is half again as wide, the proportions measured off the reference panels, with
a quarter-grid round-over instead of the old pill ends. Code moving from
`line` to `rectangle` will see the indicator change shape, not just change
name.

`"flute"` (14 broad flutes), `"cap"` (accent top disc) and `"wheel"` (bare
knurl, no indicator) are removed rather than ported: the first needs a second
knurl type, and the other two need a top disc and an indicator-less knob,
none of which these three axes carry. `knurling` is deliberately a boolean
rather than a union so it can grow into one when the other knurls return. The
3D referents for all three stay in `ambient3d` as kit styles (the
`--knob-style opz|op1|wheel` presets) with no CSS counterpart for now.

Grounded against new referents rather than by eye: `ambient3d/components/knob.py`
gains a tick ring and a bar with an inner radius, and `knob-smooth` /
`knob-markers` join the referent lineup with docs comparisons. Checked the CSS
against the Blender render at the calibration rig's scale — the marker ring
circle-fits to a 0.09px residual with a 270.01° span and 22.502° pitch against
the referent's 270.03° and 22.502°.

`material` now lands on whichever element paints the knob — the clipped face
when there is a knurl, the body when there is not. A smooth knob's face paints
nothing, so leaving the material there made it doubly inert: invisible, and
reset away by the smooth-body rule that outspecifies `amb-mat-*`. This is what
makes `knurling={false} material="shiny"` the machined wheel the removed
`variant="wheel"` used to be. Unchanged, and worth knowing: on a *knurled*
knob, `amb-knob-face`'s rib gradient still wins over a material's
`background-image` — they have equal specificity and the component stylesheet
loads later — so a material there contributes its `--amb-mat-*` variables and
its own paint is not applied over the grounded rib shading.

One layout note: `markers="full"` reserves its clearance on all four sides,
not the three the arc actually needs. Reserving three moves the knob off the
centre of its own box — measured 6.4px low at `md` — so turning markers on
would shift the knob down from wherever it was positioned. The cost is a band
of unused space under the arc.
