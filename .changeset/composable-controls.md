---
"@ambientcss/components": major
---

Split every control into a mechanism and a skin

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
  value={gain} onChange={setGain}
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
