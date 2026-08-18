---
title: Composing controls
---

Every control here is two separable things: a **mechanism** the library owns
and a **skin** you supply.

> The control owns kinematics, state and ARIA. The part owns paint.

`AmbientKnob` is `AmbientRotary` plus a set of knob parts. If you want a
control that behaves like a knob but looks like yours, take the mechanism
and give it different parts.

## Frames

Parts go into one of four **frames**, painted in this order:

| Frame | Kinematics | Overflows the box? |
| --- | --- | --- |
| `panel` | static, behind the control | yes |
| `base` | static, the control's own footprint | no |
| `actuator` | **moves with the value** | no |
| `fixture` | static, above the actuator | no |

All four are optional. "Actuator" is the hardware term for the part you
touch and that moves — a rotor, a thumb, a cap and a pill are all actuators
— so one vocabulary covers every family:

| Frame | Rotary | Travel | Press | Latch | Bank (per key) |
| --- | --- | --- | --- | --- | --- |
| `panel` | printed scale | printed ticks | — | legend | — |
| `base` | seated body | track | well | track | bezel |
| `actuator` | rotor + pointer | thumb | cap | pill | cap |
| `fixture` | hub, dome | — | — | — | lamp lens |

```tsx
<AmbientRotary
  value={gain} onChange={setGain}
  className="amb-knob"
  parts={{
    panel: <ScaleRing count={13} />,
    base: <KnobBody flush />,
    actuator: <MyPointer />,
  }}
/>
```

A frame is a box where the control has a size of its own — a rotary, a
travel track, a latch — and a `display: contents` marker where the part's
content sizes the control, as a button's cap does. A part that fills a
boxed frame does it at `position: absolute; inset: 0`.

## The state channel

A control publishes its state on its own root, three ways from one source.

### Custom properties — the canonical outlet

| Property | Meaning |
| --- | --- |
| `--ambx-percent` | normalised position, 0–1 |
| `--ambx-angle` | rotary only, degrees from 12 o'clock |
| `--ambx-value` | the raw value |
| `--ambx-size` | the control's nominal size |
| `--ambx-travel-start` / `--ambx-travel-sweep` | the rotary arc |
| `--ambx-detents` | rest positions; `0` is continuous |

Because these are CSS, a part can be **pure CSS with no React state at
all**:

```css
.my-value-arc {
  position: absolute;
  inset: 0;
  opacity: var(--ambx-percent);
  transform: rotate(var(--ambx-angle));
}
```

Express your part's geometry as fractions of `--ambx-size` and it scales
with the control for free — that is how the built-in parts are written.

### Data attributes

`data-dragging`, `data-at-min`, `data-at-max`, `data-disabled`,
`data-pressed`, `data-orientation` — the discrete conditions a part cannot
detect for itself.

### `useControlState()`

The same values, typed, for parts that genuinely need JS — a numeric
readout, a tick ring that has to emit N children, an SVG whose path data
depends on the value.

```tsx
function Readout() {
  const { value } = useControlState();
  return <span className="my-readout">{Math.round(value)}</span>;
}
```

Inside a bank key, `useBankKey()` also gives you the option itself — its
legend, its accessible name, its own lamp colour.

## Animation

The actuator moves by `transform`, so one rule animates it. `animate`
defaults to `auto`: follow the pointer 1:1 while dragging, ease otherwise.
`follow`, `ease` and `snap` pin it.

## Rules for parts

- **A part must not contain a focusable element or an interactive role.**
  The control root already owns the role, the tab stop and the keyboard
  handler; a second one gives you two tab stops and a conflicting role. A
  development-only check warns if a part breaks this.
- **Mechanisms have no `material` prop; presets do.** Which element a
  material belongs on is a fact about a particular control's construction —
  on the knob's clipped face when it is knurled, on its body when it is not
  — and a mechanism cannot know that once the parts are yours.

## Just the mechanism

If you want to render the markup yourself from the ground up, the hooks are
the mechanisms without any DOM: `useRotary`, `useTravel`, `usePress`,
`useLatch`, `useBank`. Each returns the state plus the props to spread on
your own root.
