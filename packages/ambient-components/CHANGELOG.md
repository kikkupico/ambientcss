# @ambientcss/components

## 3.1.0

### Minor Changes

- 8651a46: `AmbientBank` / `AmbientSelect`: a key's on and off state can now be genuinely different markup, and a bank's own enclosure can be dressed separately from its keys.

  `AmbientBank` gains `keyPartsOn` / `keyPartsOff`, overriding `keyParts` per key state — for a bank where the lit and unlit keys are different castings rather than the same key restyled through `[data-on]`. `KitDress` gains matching `onParts` / `offParts`, plus `panelParts` for the bank's own root frame (the rail around every key), which `AmbientSelect` now actually forwards to `AmbientBank`'s `parts` prop — it was previously accepted and silently dropped.

  The `grounded` kit demonstrates the new split with a second bank look, `look={{ shape: "round" }}`: a row of ordinary round pushbuttons with no shared rail, Dieter Rams style — off is a plain matte cap, on is a glossy one wearing the bank's lamp colour.

  The `console` kit now dresses `bank` too: selection reads as the key sitting flush (`--amb-thickness: 0`) against the rest at knob-scale thickness, with a moulded circular dish sunk into every key — a mixer-desk key bank, not a lamp-strip. The selected key's lamp has two readings, chosen by whether the option carries a legend: a key without one keeps a small centre LED that lights only when selected; a key with a legend (an empty-string label counts as none) drops the LED and lights the text itself, from the panel's ink to the bank's lamp colour — the same `--amb-led-color` channel, so one `color` prop lights either alike. Both readings are the same markup styled through `[data-on]`, so the kit's bank needs neither `onParts` nor `offParts`.

### Patch Changes

- 8651a46: `AmbientBank` keys get a real box and a positioning context of their own, independent of any look.

  Every other actuator sizes and positions itself at the mechanism level — `.ambx-latch` is `position: relative` with its own width and height before any look touches it. A bank's keys never had that: sizing (`min-width`/`height: var(--ambx-select-size)`) and `position: relative` were only ever declared on the look-specific classes (`.amb-select .ambx-key`, and neither `.amb-select-radio` nor `.amb-console-bank` set `position: relative` at all). A bank dressed with no look — a from-scratch kit, or the Kit Builder's "empty" seed — had keys with no size, and any `fill`-placed content inside one had no positioned ancestor to fill: it escaped to whatever ancestor further up the page happened to be positioned, collapsing every key's content into one shape spanning the wrong box.

  `.ambx-key` now carries that baseline itself. A look's own class is more specific and still wins outright where it sets a real size or shape (the round radio key, the square console key); this only supplies the floor underneath, so a custom bank has correctly boxed, correctly positioned keys from the moment it exists, before any look is chosen.

## 3.0.1

### Patch Changes

- 3963634: Add a test suite for the bare mechanisms (AmbientRotary, AmbientTravel, AmbientPress, AmbientLatch, AmbientBank) covering ARIA, the keyboard contract, the state channel and controlled/uncontrolled behaviour. Fix an AmbientBank bug the suite surfaced: `useBank.keyProps()` included a `key` prop that was spread into JSX, making React warn and dropping keys on release builds — the key now lives at the mapping site in `AmbientBank`.

  The knob's indicator dot, indicator bar and printed scale markers now take `--amb-lume` instead of `--amb-highlight-color` / `--amb-label`, and the console kit's bar-knob mark takes `--amb-lume` instead of darkened surface ink, so pointer and scale read as one backlit instrument: bright in a bright scene, glowing as the lights drop. Override `background` on `.amb-knob-indicator-circle`, `.amb-knob-indicator-rectangle`, `.amb-knob-marker` or `.amb-console-indicator` to restore painted ink.

  The console kit's toggle keeps its accent orange but now wears it as reflectance — the thumb is an `amb-surface` body with `--amb-albedo` pinned to the accent, the track's ON fill shades the accent through the same `--amb-exposure` law the thumb's face uses, its OFF floor is the lit albedo held at 30% in linear light (a dark grey that still tracks the lamp), and the thumb's ring is `--amb-lume`, an emissive halo around the orange face. Every part of the switch re-lights with the lamp; the track no longer carries a fixed recess step, so OFF reads as shaded ground rather than painted black.

- Updated dependencies [3963634]
  - @ambientcss/css@3.0.1

## 3.0.0

### Major Changes

- f91f203: Surfaces take a colour: `--amb-albedo` and `--amb-shade` replace the surface variants

  **Breaking.** `.amb-surface-lighter`, `.amb-surface-lightest`,
  `.amb-surface-darker` and `.amb-surface-darkest` are removed. A surface is now
  a _material under a light_ rather than a fixed lightness, so one
  `.amb-surface` covers every hue and every tone:

  ```css
  /* before */
  .panel {
  } /* one of five hardcoded tones */
  .well {
  } /* .amb-surface-darker */

  /* after */
  .panel {
    --amb-albedo: #7a3b2e;
  } /* any CSS colour */
  .well {
    --amb-shade: 0.38;
  } /* a tone of whatever it inherits */
  ```

  Migration: drop the variant class and set `--amb-shade` to `1.11`
  (`-lighter`), `1.16` (`-lightest`), `0.38` (`-darker`) or `0.07`
  (`-darkest`) on a plain `.amb-surface`. Those four numbers are the plates'
  albedos over the reference ground's, so the tones are unchanged.

  **Why one law replaces five.** The five variants were five affine
  lightness fits, one per rendered plate. They were all the same physics seen
  through sRGB gamma: a surface reflects **albedo × exposure**, and _exposure_
  is what the light intensities are linear in — irradiance adds up, lightness
  does not, which is why each fit needed its own floor to absorb the curve.
  Refit in linear light (`ambient3d/measure/fit.py`), one two-parameter law,

      exposure = 0.6396 · key + 0.5496 · fill

  reproduces all 54 measured plate frames across all five albedos to within
  **0.03 points of lightness** (R² 0.9999998), against R² 0.996 and ~1.1 points
  for the fits it replaces. The free intercept comes back at 2e-5, so it is
  dropped: with both lamps off a surface is black.

  New public variables:

  - `--amb-albedo` (any CSS colour, default the rig's reference ground) — the
    colour a surface would show under full white illumination.
  - `--amb-shade` (number, default `1`) — a multiplier on that reflectance.
    Prefer it for hierarchy inside a themed panel: unlike a second albedo it
    composes with whatever colour is inherited.
  - `--amb-lit` (derived, read-only) — the finished tone of a flat face.
  - `--amb-exposure` (derived, read-only) — the irradiance, where `1` is full
    white illumination.

  Both inputs inherit, so a coloured panel colours everything inside it.
  `.amb-groove` now cuts its recess **in the panel's own material** (a groove in
  a red panel is red; its floor keeps its own slightly hot exposure, refit the
  same way from the same 15 frames), the curved classes paint only the shading
  and ride `--amb-lit`, and every grounded surface tone in
  `@ambientcss/components` — knob face, switch pill, select key and lens —
  reads `--amb-lit` instead of carrying its own copy of the old formula.

  A coloured lamp now acts on a coloured surface: the cast is a mix toward
  `--amb-light-hue` at `--amb-light-saturation`, with the tint's own saturation
  set to `100 − s` of the surface. On a grey that is exactly the HSL identity
  the old formulas encoded, so **neutral surfaces are unchanged** — within 1
  point of lightness across the measured light range, and closer to the Blender
  ground truth where they differ. On a chromatic surface the light washes it
  toward grey rather than rotating its hue, which is what a lamp does to a
  colour it cannot light.

  **Dim scenes get darker.** The old fits extrapolated to a lit grey under no
  lights; this one goes to black. Below the measured box (key 0.1–1.0 at fill
  0.7, key 0.9 at fill 0–0.7) both models are extrapolating and neither is
  grounded, so this is a deliberate design change, not a fidelity claim: at
  key 0.2 / fill 0.05 a default surface sits about 12 points of lightness lower
  than before. Themes built around very low key light will want their
  intensities re-checked.

  **Browser floor.** The surface tone is built with relative colour syntax
  (`color(from … srgb-linear …)`, `hsl(from … calc(100 - s) l)`), so Firefox
  128, Chrome 119 and Safari 16.4 are the floor for surface _colour_. Verified
  identical in Chromium and WebKit; Firefox was not available to test locally.
  Note the spelling is `calc(100 - s)` — relative colour substitutes `s` and
  `l` as numbers, and the percentage form invalidates the declaration.

  **Known limitation: dished caps want `--amb-shade` for luminance.**
  `AmbientButton`'s cap dish needs its base lightness as a _number_ to turn the
  curve delta into overlay alphas, and a colour's luminance cannot be reached as
  a number in CSS. It is rebuilt from `--amb-shade` and `--amb-exposure`
  instead, which is exact for any shade of the reference material — but on a
  dark chromatic `--amb-albedo` the two halves of the dish miss in opposite
  directions (the black half under-shades, the white half over-lifts) and the
  cap reads as a bright sheen rather than a curve. Split the two axes and both
  halves stay exact:

  ```css
  .panel {
    --amb-albedo: #c98a7a; /* the hue, near the reference reflectance */
    --amb-shade: 0.45; /* the luminance */
  }
  ```

  Flat surfaces, grooves and the curved classes have no such limit — they carry
  colour, not numbers, and follow any `--amb-albedo` exactly.

  The compare gate (`ambient3d/measure/compare.py`) could not be run locally:
  it needs `ambient3d/renders/`, which is not committed. The manifest's four
  plate scenes now drive the CSS side through `--amb-albedo` instead of a
  variant class, so the gate exercises the general law rather than five fixed
  classes.

- f91f203: Split every control into a mechanism and a skin

  A control is now two separable things: a **mechanism** the library owns —
  kinematics, value, state and ARIA — and a **skin** you supply. `AmbientKnob`
  and friends still exist and still look the same; they are now presets that
  compose a mechanism with a set of parts.

  **New: mechanisms.** `AmbientRotary`, `AmbientTravel`, `AmbientPress`,
  `AmbientLatch` and `AmbientBank` have no appearance of their own. You give
  each one `parts` — ordinary markup, usually just some `@ambientcss/css`
  classes — and it supplies the movement.

  ```tsx
  <AmbientRotary
    value={gain}
    onChange={setGain}
    travel={{ start: -135, sweep: 270 }}
    parts={{
      panel: <ScaleRing count={13} />,
      base: <KnobBody flush />,
      actuator: <MyPointer />,
    }}
  />
  ```

  Parts go into one of four **frames** — `panel`, `base`, `actuator`,
  `fixture` — stacked in that paint order. Only `actuator` moves; only
  `panel` may overflow the control's box, which is what lets a scale ring sit
  outside the knob it belongs to.

  **New: the state channel.** Every control publishes its state on its own
  root as custom properties (`--ambx-percent`, `--ambx-angle`, `--ambx-value`,
  `--ambx-size`, `--ambx-travel-start`, `--ambx-travel-sweep`,
  `--ambx-detents`) and data attributes (`data-dragging`, `data-at-min`,
  `data-at-max`, `data-disabled`). A part can therefore be pure CSS with no
  React state plumbing at all. `useControlState()` is the same data typed,
  for parts that need JS.

  **New: hooks.** `useRotary`, `useTravel`, `usePress`, `useLatch` and
  `useBank` are the mechanisms without any markup, for a control you want to
  render from the ground up.

  **New axes on the rotary presets.** `travel` (any sweep, not just 270°),
  `input` (`drag` / `angle` / `delta`), `animate` (`follow` / `ease` /
  `snap`), `detents`, `wrap` and `dragDistance`.

  ### Breaking

  - **The knob's default pointer mapping is now `drag`, not absolute angle.**
    The docs have always described a vertical-drag control; the code did
    absolute-angle-with-a-dead-zone. `drag` is what most audio software does
    and the only mapping that behaves on touch. Pass `input="angle"` for the
    old behaviour — improved, since the dead zone now holds at the nearer end
    instead of throwing the knob across the sweep.
  - **`AmbientSwitch` uses `value` / `defaultValue` / `onChange`**, replacing
    `checked` / `defaultChecked` / `onCheckedChange`, so one
    controlled/uncontrolled convention covers every control. Knob, slider and
    fader gain `defaultValue` and are no longer controlled-only.
  - **Slider and fader thumbs move by `transform`**, not inline `left`/`top`.
    App CSS overriding those properties will stop working.
  - **Every control's DOM gains `[data-frame]` wrappers.** Descendant
    selectors written against the old structure may miss. The `amb-*` class
    names on the default parts are unchanged.
  - **`step` now quantises from `min`, not from zero.** `min={10} max={100}
step={25}` used to rest on 25/50/75/100 and now rests on 10/35/60/85 — the
    step grid is anchored to the range it belongs to. Identical whenever `min`
    is `0`, which is the default.
  - **`step={0}` now means continuous** instead of being silently coerced to
    `1`. Use `detents` if you want rest positions without quantising the value.
  - `.ambx-knob-*`, `.ambx-slider-*`, `.ambx-fader-*`, `.ambx-switch-*`,
    `.ambx-button-*` and `.ambx-select-*` size classes are now
    `.ambx-rotary-*`, `.ambx-travel-*`, `.ambx-latch-*`, `.ambx-press-*` and
    `.ambx-bank-*`. `.amb-select-option` is `.ambx-key`, and its lit state is
    `[data-on]` rather than `.amb-select-on`.

  ### Also

  - One keyboard implementation instead of three copies of the same
    Arrow/Page/Home/End handler.
  - A dev-only check warns when a part contains a focusable element, which
    would give the control a second tab stop and a conflicting role.
  - `setPointerCapture` is guarded, so these controls no longer appear broken
    under jsdom and Testing Library.

- f91f203: `AmbientKnob`: `variant` replaced by `knurling`, `markers` and `indicator`

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
  `variant="wheel"` used to be. Unchanged, and worth knowing: on a _knurled_
  knob, `amb-knob-face`'s rib gradient still wins over a material's
  `background-image` — they have equal specificity and the component stylesheet
  loads later — so a material there contributes its `--amb-mat-*` variables and
  its own paint is not applied over the grounded rib shading.

  One layout note: `markers="full"` reserves its clearance on all four sides,
  not the three the arc actually needs. Reserving three moves the knob off the
  centre of its own box — measured 6.4px low at `md` — so turning markers on
  would shift the knob down from wherever it was positioned. The cost is a band
  of unused space under the arc.

- f91f203: Relief materials carry no `--amb-albedo` of their own any more

  `.amb-mat-brushed`, `.amb-mat-brushed-round` and `.amb-mat-blasted` each used
  to ship a calibrated default reflectance (0.49 linear for both metals, 0.0644
  for blasted), so a plain `<div class="ambient amb-surface amb-mat-blasted">`
  rendered as dark elastomer and a brushed one as mid-grey metal without any
  colour set. That made them the odd ones out: `.amb-mat-matte` and
  `.amb-mat-shiny` have never carried a colour, they only add relief or gloss
  on top of whatever `--amb-albedo` the surface already has. All five now
  behave the same way — a material is relief and specular only, never a
  colour — so left alone, brushed/spun/blasted render at the reference ground,
  same as matte and shiny.

  (`.amb-mat-blasted` was `.amb-mat-rubber` before this same change — renamed
  because a name borrowed from the substance it was fitted against implied a
  fixed colour, which is exactly what this change removes; `brushed`/`shiny`/
  `matte` were already named for the process, not a substance.)

  **This changes default rendered output** for any element that wears one of
  the three relief classes without setting `--amb-albedo` itself: it now
  renders pale (the reference ground) instead of its old fitted tone. Set
  `--amb-albedo` explicitly for the calibrated look — the reference each
  material's grain was fitted at is documented at its class in
  `packages/ambient-css/src/ambient.css` and in the docs' "Colouring every
  material" section:

  ```css
  .amb-mat-brushed,
  .amb-mat-brushed-round {
    --amb-albedo: color(srgb-linear 0.49 0.49 0.49);
  }
  .amb-mat-blasted {
    --amb-albedo: color(srgb-linear 0.0644 0.0629 0.0629);
  }
  ```

  In `@ambientcss/components`, `ButtonCap` no longer swaps a relief-material
  cap onto `.ambx-cap-tone-brushed` / `-brushed-round` / `-blasted` to correct
  its dish-shading math for a fixed tone that no longer exists — a relief-faced
  cap now derives its dish the same way any other dished surface does, from
  `--amb-shade`. The blasted tone class's automatic light-label override (for
  legibility against a face that used to always be dark) goes with it: a
  blasted-faced cap you colour dark now needs its own `--amb-label` override,
  the same as a dark matte or shiny one would.

### Minor Changes

- f91f203: New `AmbientSelect`: a bank of lamp-lit keys

  A select / multi-select built as hardware builds one — a rail of keys whose
  state is a lamp under the cap, not a tick or a fill. Selecting a key lights
  the LED beneath it and the light floods up through the key's translucent cap.

  Each key is three layers, and the order is the whole mechanism: the option is
  the pocket floor in the grounded `amb-surface` tone, `amb-select-lens` is the
  LED's lens lying on it, and `amb-select-cap` is an `amb-mat-glass` diffuser
  over both. Because the cap is glass, its `backdrop-filter` blurs what is
  behind it — which is the lens — so one disc produces both states with no
  second gradient anywhere: a soft dark circle through the frost when unlit
  (the lamp is visibly _there_), and a broad radial glow with a hot centre when
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

- f91f203: New `.amb-mat-brushed-round`: spun aluminium

  The same metal as `.amb-mat-brushed` with the grain turned about the element's
  centre instead of run across its face — the lathe finish on a knob cap or a
  volume dial, rather than the belt finish on a faceplate. It is the third
  micro-relief material and behaves like the other two: `--amb-albedo` for its
  tone, `--amb-grain-amount` for the relief, both pseudo-elements consumed,
  `overflow: hidden` on the host. `AmbientMaterial` gains `"brushed-round"`, so
  every component that takes a `material` takes this one.

  The grain is a conic gradient rather than a repeating tile, because circular
  grain has no translational period to tile: 64 jittered streaks of angle from a
  fixed seed, with the same contrast stretch the SVG tiles apply, plus the exact
  per-stop inverse the screen/multiply pair subtracts against. The tile is sized
  to twice the box and centred so its conic centre lands on the element's, which
  is also why `::before` and `::after` position from `50%` rather than from the
  corner the repeating materials use.

  The lighting needs no new mechanism. The pair is still offset ±2px along the
  lamp, so it still evaluates the directional derivative of the height field —
  and on a circular field that derivative is proportional to the _tangential_
  component of the offset, which vanishes where the offset points straight out
  from the centre. The two bright arcs with dark lobes 90° away, swinging as the
  lamp does, are therefore geometry rather than a painted effect. Toward the
  centre the angular pitch shrinks past the offset and the samples decorrelate,
  which is the converged hotspot every spun disc has.

- f91f203: Kits: one mechanism, many visual identities

  v3 split every control into a mechanism and a skin, then shipped exactly one
  skin. Composing a different one worked, but there was no way to say "dress
  this whole panel in that other look" — every call site had to pass its own
  `parts`.

  A **kit** closes that. It is a named bundle of parts, tokens and presentation
  defaults, and it is a plain object, so publishing one is publishing a module:
  no registry, no lifecycle, nothing to initialise.

  ```tsx
  <AmbientKitProvider kit={consoleKit}>
    <AmbientKnob label="LEVEL" defaultValue={68} />
    <AmbientSwitch label="ON" defaultValue />
  </AmbientKitProvider>
  ```

  The call sites do not change. Only the look does.

  **`consoleKit`** is the first non-default kit — a mixer-desk identity built
  from two controls measured off photographs of the real hardware. Its knob is a
  cuboid bar standing on a flat face housed in a circular groove — the same
  construction, depth and near-black floor the button's well uses. The bar is
  the pointer, and a short mark printed across one end of it says which end
  reads. Its toggle is a pill track that
  fills with the accent as the switch travels, carrying a round accent thumb
  inside a white ring. `ConsoleKnob` and
  `ConsoleToggle` are presets that type the kit's own look vocabulary.

  **`groundedKit`** is the existing look, packaged as a kit rather than
  hardwired into the presets. That was the integrity test for the whole idea: if
  the built-in parts had needed a private back door the presets could reach and a
  third party could not, the abstraction would have been a fiction. They did not
  — every preset now resolves its dressing through the same `useDress` call a
  published kit goes through.

  Notable properties of the design:

  - **A kit may be partial.** `consoleKit` dresses knobs and switches and lets
    faders, buttons and key banks fall through to `groundedKit`, which is what a
    real third-party kit looks like.
  - **A kit is paint, not behaviour.** Neither new control needed a line of
    mechanism code: the toggle's thumb travels because the latch already moves
    its actuator frame by `--ambx-percent`, and its track lights because a
    stylesheet can read that same number. That was the real test of the v3
    split.
  - **Look props are kit vocabulary.** `knurling` and `markers` are the grounded
    kit's words. They pass through and a kit reads what it understands, exactly
    as a stylesheet that never implemented a class does not react to it. The
    common path stays typed, and a `looks` declaration makes the drop visible: a
    development warning names the prop the active kit is going to ignore.
  - **Precedence is caller → kit → mechanism.** A kit that falls through for a
    family has no say in that family's defaults either.

  Also in this release:

  - `--ambx-accent` is the panel accent a kit paints its lit states with,
    defaulting to the scene's own `--amb-highlight-color` so a kit inherits the
    app's colour rather than imposing one.
  - The latch's thumb geometry moved into `--ambx-latch-thumb-w/-h` and
    `--ambx-latch-inset`, so a kit that wants a round thumb on a wider track
    restates three lengths instead of re-writing a selector.

  **Renamed:** the press control's size classes are now `.ambx-press`,
  `.ambx-press-sm/-md/-lg`, matching the family name the rest of the split uses
  (`.ambx-button*` was left over from when the mechanism was called a button).
  Nothing that renders `AmbientButton` is affected — the class comes off
  `sizeProps` — but markup that hand-rolls the well/cap structure has to be
  updated, because that class is what carries `--ambx-button-size` and the cap
  padding. Without it the cap collapses to the width of its own text.

- f91f203: Dished button caps, and a press that reads as lost light

  The button cap is no longer a flat face. A `.amb-button-cap::after` overlay
  gives it a subtle concavity along the light axis — the far wall of the
  scoop tilts into the light, the near wall tilts away, so the face darkens
  just past the lit edge and brightens toward the far one. The profile's
  shape (a lift at the lit rim, a minimum ~20% across, then an accelerating
  rise) is measured off a photographed dished key; its amplitude reads
  `--amb-curve-delta`, the grounded fit `.amb-surface-concave` also rides, so
  a concave cap and a concave plate curve by the same amount and cannot drift
  apart. Only the axis and the profile are the cap's own — the curved classes
  are single-axis and symmetric, and a cap has to follow whichever light an
  app has set. The overlay reorients with all eight `.amb-light-*` positions
  and sits under the label, not over it.

  All three cap silhouettes — pill, round and square — carry the same
  curvature; a dish is a property of the tooling, not of the outline. Tune it
  with `@ambientcss/css`'s `--amb-curve-scale`, which works at any scope from
  a single button to the whole page.

  The pressed state is unchanged in colour: it still only sinks the cap by the
  referent's 0.7mm travel, so the press reads as travel — a shortening drop
  shadow and narrowing chamfer bands — rather than as a repaint.

  The `ambient3d` button referents are scooped to match, so the docs'
  side-by-side comparison still lines up.

- f91f203: `AmbientKnob` takes a `knurlColor`

  A two-tone knob — dark grip ring round a pale cap — is a real piece of
  hardware, and until now the ring could only be the cap's own colour. The new
  prop sets it, and `KnurledFace` takes the matching `color`.

  It is an **albedo**, not paint: the value lands on `--amb-albedo` for the ring
  alone, so a dark knurl still takes the scene's exposure, the lamp's cast and
  the rim's own contact shading, and still goes dark when the lights do. It is
  set inline on the ring, so it wins over the albedo a micro-relief material
  would otherwise put there — an explicit colour wins the tone and the finish
  keeps its grain.

  The cap has no matching prop on purpose: the cap's colour is the control's
  colour, set the ordinary way with `--amb-albedo`. The grounded kit gains
  `knurlColor` in its `looks` vocabulary, so a kit that dresses rotaries
  differently warns about it in development like any other foreign look prop.

- f91f203: Knurl the knob's rim instead of its whole face

  The knurled knob was a cog: 36 near-trapezoidal teeth cut the full silhouette,
  their shading ran in from the edge, and the body behind them had no chamfer, so
  nothing said where the top face stopped. A real turned-and-knurled knob is a
  smooth chamfered cap with a band of ribs machined into the rim beyond that
  cap's edge and a step below it.

  It is now built that way. `KnobBody` is the cap either way — chamfered in both
  variants, and inset by the knurl band's width when there is one — and
  `KnurledFace` clips to a toothed **annulus** rather than a disc, so the cap and
  its chamfer bands paint through underneath. The ribs themselves are finer (48,
  sampled off the referent's `depth * (0.5 + 0.5cos(N.theta))^sharpness` section
  rather than a four-point trapezoid) and carry a contact-occlusion band along the
  inner edge where the cap overhangs them, radial so it survives the frame's
  rotation, and a `--amb-shade` step down so the band reads as material sitting
  lower rather than a black wash over the cap's tone.

  `material` now applies to both elements a knurled knob paints with, rather than
  only the clipped face; `knurling={false}` is unchanged.

  The referent follows. `knob.py` grows `knurl_rim` / `cap_chamfer` — the ribs
  stop below the top face, a bevel of that radial width carries them out to the
  full radius, and a smooth chamfer and flat cap sit above and inside it — and
  `referents.py` takes every knob number straight from `KNURLS.standard` and the
  component's own CSS. `renders/components/knob.png` and `knob-line.png` are
  re-rendered. The two rib sections are now the same formula, which is a stronger
  parity claim than the depth-matching the old comment made.

- f91f203: `AmbientMaterial` gains `brushed` and `blasted`

  The two micro-relief finishes from `@ambientcss/css` are now part of the
  material vocabulary, so every part that already took a material takes these
  as well.

  `AmbientPanel` was the one component that could not have been extended by
  adding to the union alone: it mapped its material through a hardcoded ternary
  whose else-branch sent anything unrecognised to `amb-mat-glass`, so a new
  member would have rendered as glass rather than as itself. It now builds the
  class the same way every other part does, and its prop is typed
  `AmbientMaterial` rather than a second copy of the union.

  `ButtonCap` needed real work. A relief material wants BOTH pseudo-elements for
  its grain, and the cap already spends its own `::after` on the dish — the
  dish's `background` shorthand and the grain's tile would each have silently
  won half of the other's declarations. The cap now gives a relief material an
  inner `.ambx-cap-face` layer, under the dish and under the legend, which is
  the inner layer the CSS package's own note prescribes. Markup and props are
  unchanged; only the internals of a cap wearing one of these two finishes are.

  The face wears the cap's chamfer itself. A chamfer is painted as INSET
  shadows, which belong to the background layer of the element that declares
  them, so an opaque face laid over the cap would otherwise have hidden the cut
  — and a relief button would have been the one material that lost its bevel.
  Wearing it puts the cut back, in the material's own tone rather than the cap's.

  Two further consequences of putting a genuinely dark material on a cap for the
  first time, both fixed here rather than left to the caller:

  - The dish derives its overlay alphas from the surface lightness it washes
    over, and assumed the reference ground. On a rubber face (L\* 28.6) it
    computed a 0.44-alpha white wash down one side, reading as chrome rather
    than as a curve. `--_ambx-cap-tone` now tells it the face's reflectance as
    a ratio of the reference, taking that peak to 0.06. It multiplies
    `--amb-shade` rather than replacing it, so a consumer's own shade still
    composes, and it defaults to 1 — every existing cap is unchanged.
  - `--amb-label` is derived from the light rather than from the surface it
    lands on, which is right down to about L\* 40 and wrong below it: a rubber
    cap's legend computed to a 26% lightness and vanished into the face. A
    rubber cap now inverts its label. Brushed, at L\* 72, reads fine with the
    stock one and is left alone.

  Neither is a new limitation of the cap — set `--amb-albedo` to something this
  dark on a plain cap today and you get the same blown-out dish and the same
  vanished legend. These two finishes are simply the first materials that carry
  such a tone themselves, so they carry the correction with it.

### Patch Changes

- f91f203: Chamfer the smooth knob's rim

  `knurling={false}` now cuts a small base chamfer into the knob body, the
  edge treatment `knob.py` puts on every knob (`chamfer=0.35`) regardless of
  rib count. A knurled knob's clipped silhouette already reads as machined,
  but a smooth body with nothing standing proud had no cue that its rim is
  turned rather than a flat disc; the chamfer highlight/shadow bands supply
  that. Width 2, paired level-for-level with the body's knob-scale
  (`amb-thickness-2`) thickness, matching `.amb-chamfer-2`'s own convention.

- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
- Updated dependencies [f91f203]
  - @ambientcss/css@3.0.0

## 2.1.0

### Minor Changes

- 17548b6: A coherent design-token system for sizing, border radius, and hardware-style
  spacing, so components compose into a device face the way real hardware
  (Braun/Dieter Rams, Teenage Engineering) does — one modular pitch instead of
  ad hoc per-component numbers:

  - **Border-radius scale** — `--ambx-radius-sm/md/lg/xl/full`, deliberately
    identical in px to `@ambientcss/css`'s `.amb-rounded-*` utilities. The
    button's cap/well nesting is now an explicit concentric formula (outer
    radius = inner radius + clearance) instead of an unrelated magic number.
  - **Size variants** — `size?: "sm" | "md" | "lg"` added to `AmbientButton`,
    `AmbientKnob`, `AmbientSlider`, and `AmbientFader`, matching
    `AmbientSwitch`'s existing pattern. `"md"` reproduces each component's
    original footprint exactly, so this is additive and non-breaking.
  - **Spacing scale** — `--ambx-gap-tight/normal/loose` gap tiers, a new
    `.ambx-rack` utility / `AmbientRack` component for composing controls into
    a device face, and an opt-in `.ambx-panel-device` modifier so a panel's
    edge margin matches the loose gap used between the racks inside it.
  - Fixed two latent cascade bugs in `styles.css` where a later rule silently
    overrode an earlier one: the button pill actually rendered at 72px (not
    the documented 64px), and the fader/slider track at 8px (not 4-6px). The
    previously-winning values are now the documented, single source of truth.

  See the new [Design tokens](https://kikkupico.github.io/ambientcss/ambient-components/design-tokens)
  docs page for the full scale, size table, and spacing guidance.

  The Blender referent kit (`ambient3d/`, not published) mirrors the same
  gap tiers (`GAP_TIGHT_MM`/`GAP_NORMAL_MM`/`GAP_LOOSE_MM` in
  `components/_common.py`) so the demo device-panel render composes its
  grille, knob bank, and key rows with the same hardware pitch as the
  CSS/React layer.

## 2.0.1

### Patch Changes

- d3e9ee6: Fix controls rendering oversized on pages without a global `box-sizing`
  reset. Every control sizes its moving part as a percentage of a padded box
  — a button's cap is `width: 100%` of a well inset by the clearance ring,
  a knob's face `100%` of the knob — and under the default `content-box`
  those paddings add to the percentage instead of fitting inside it, so the
  button cap rendered visibly larger than the well it sits in, with the gap
  ring showing on only two sides. `styles.css` now scopes
  `box-sizing: border-box` to the package's own elements. Apps that already
  reset globally (the demo does, which is what masked this) see no change.

## 2.0.0

### Major Changes

- a3c92f8: **v2.0.0 — the library is re-based on the Blender-grounded rewrite.**

  Every effect's coefficients are now derived from measured Cycles renders of an
  equivalent physical scene (verified end-to-end by a render-vs-CSS comparison
  harness), replacing the previously hand-tuned values. Computed output changes
  throughout — anchored so the default look (key 0.9, fill 0.7) is preserved —
  which is why this ships as a major release rather than a minor one.

  The accompanying changesets carry the detailed per-effect notes: the
  `.amb-surface` tone ladder, the swept drop shadow, the new `.amb-groove`
  primitive and thickness vocabulary, the studio-lit `.amb-mat-shiny`
  environment, refit chamfer/fillet bands and curved surfaces, plus the new
  button shapes and knob variants in `@ambientcss/components`.

### Minor Changes

- a3c92f8: Button shapes and knob types, matching the referent lineup
  (`ambient3d/generate.py` — the catalog's round/square keys, pads, and
  the classic/OP-Z/OP-1/wheel knob styles):

  - **AmbientButton** gains `shape`: `"pill"` (default, the wide stadium
    transport key), `"round"` (circular key — pair with
    `material="shiny"` for the machined metal-button look), and
    `"square"` (EP-133-style pad: tighter corners, 3.6mm cap at thickness
    0.8 instead of the key's 4.5mm, same 0.7mm press travel).
  - **AmbientKnob** gains `variant`: `"dot"` (default, the grounded
    36-rib referent), `"line"` (radial indicator line), `"flute"` (14
    broad flutes with deep roots and a centered dot, OP-Z-style),
    `"cap"` (fine 48-rib knurl under a smooth accent top disc,
    OP-1-style), and `"wheel"` (bare fine knurl, no indicator). Each
    family gets its own knurl clip silhouette and pitch-matched flank
    shading.

  Each new shape/variant has a flat-on grounded referent render
  (`ambient3d/ground_components.py`, which now accepts a name filter
  after `--`) compared against the live component in the docs.

- a3c92f8: Components rebuilt from grounded primitives to match their richer 3D
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

### Patch Changes

- Updated dependencies [a3c92f8]
- Updated dependencies [a3c92f8]
- Updated dependencies [a3c92f8]
  - @ambientcss/css@2.0.0

## 1.2.1

### Patch Changes

- Updated dependencies [7361ad7]
  - @ambientcss/css@1.2.1

## 1.2.0

### Minor Changes

- a738bda: Implement and refine `amb-mat-*` material classes with physically-based reflectance.

  **`@ambientcss/css`**

  - Add shared material custom properties (`--amb-mat-specular`, `--amb-mat-roughness`, `--amb-mat-opacity`) to `:root` for downstream use
  - `amb-mat-matte`: unchanged — bare surface colour, no additional treatment
  - `amb-mat-shiny`: two-layer rendering model
    - _Environment reflection_ (overlay blend, fixed vertical): cylindrical dome model driven by `--amb-light-y`; lit half reflects bright walls/ceiling at key-light intensity, opposite half reflects dark environment at `(1 − fill-light)` intensity; both halves taper to neutral at the edges with the horizon split at 50%
    - _Specular highlight_ (screen blend, light-direction-aware): narrow white band near the lit edge; peak opacity equals `--amb-key-light-intensity`; position follows `atan2(light-y, light-x)`
    - Slight overall brightness boost (`brightness(1.04)`) so the surface reads shinier than matte
  - `amb-mat-glass`: extends shiny with translucency — identical specular and environment layers, plus a semi-transparent `background-color` and `backdrop-filter: blur() saturate()` that scale with key-light intensity; thin light-hue border

  **`@ambientcss/components`**

  - `AmbientKnob`, `AmbientFader`, `AmbientSlider`: add `material?: "matte" | "shiny" | "glass"` prop, applied to the interactive element (knob body / fader thumb / slider thumb)
  - When `material="glass"`, the concave surface class is omitted from the thumb so the glass translucency is not occluded by an opaque gradient

### Patch Changes

- Updated dependencies [a738bda]
  - @ambientcss/css@1.2.0

## 1.1.1

### Patch Changes

- f12c295: sync publish script changes

## 1.1.0

### Minor Changes

- ad9da82: fixing npm installation errors

### Patch Changes

- Updated dependencies [ad9da82]
  - @ambientcss/css@1.1.1

## 1.0.2

### Patch Changes

- Updated dependencies [e0600a6]
  - @ambientcss/css@1.1.0

## 1.0.1

### Patch Changes

- a9b62c1: fix amb-lume
- Updated dependencies [a9b62c1]
  - @ambientcss/css@1.0.1

## 1.0.1

### Patch Changes

- Fix `--amb-lume` and `--amb-label` not reacting to theme changes. Derived CSS variables are now re-declared on the provider element so they recompute when input variables like `--amb-key-light-intensity` are overridden.

## 1.0.0

### Major Changes

- first publish

### Patch Changes

- Updated dependencies
  - @ambientcss/css@1.0.0
