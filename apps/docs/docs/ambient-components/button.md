---
title: AmbientButton
---

import { ButtonPreview, ButtonShapesPreview, GroundedButtonDemo, GroundedButtonRoundDemo, GroundedButtonSquareDemo } from "@site/src/components/ComponentPreviews";
import { RenderComparison } from "@site/src/components/RenderComparison";

`AmbientButton` wraps a native `<button>` with ambient styling.

## Interactive preview

<ButtonPreview />

## Grounded counterpart

The button is modeled on its 3D referent (`ambient3d/components/button.py`):
a chamfered key cap seated in a clearance well, the well's gap ring showing
around it. Pressing sinks the cap by the referent's 0.7mm travel — the
chamfer bands and the swept shadow shrink with it.

The cap top is **dished**, not flat: the far wall of the scoop tilts into
the light and the near wall tilts away, so the face darkens just past the
lit edge and brightens toward the far one. It reads
[`--amb-curve-delta`](/ambient-css/global-settings#curvature---amb-curve-delta),
the same measured curvature `amb-surface-concave` rides, and all three cap
silhouettes get it equally — a dish belongs to the tooling, not to the
outline. Deepen or flatten it with `--amb-curve-scale`, on one button or a
whole panel.

Pressing changes nothing about the cap's colour. It only **sinks** the cap
by the referent's 0.7mm travel (thickness `1` to `0.84`, `0.8` to `0.64`
for the square pad): the swept drop shadow shortens as the silhouette drops
toward the well floor, and the chamfer bands narrow with it. The press reads
as travel rather than as a state repaint.

<RenderComparison slug="button" dir="components"><GroundedButtonDemo /></RenderComparison>

## Shapes

Cap silhouettes from the referent lineup (`ambient3d/generate.py`):

<ButtonShapesPreview />

- **`pill`** (default) — the wide stadium transport key.
- **`round`** — a circular key (superellipse exponent 2). Pair with
  `material="shiny"` for the machined metal-button look.
- **`square`** — a squarer, flatter pad (exponent 6): tighter corners
  and a 3.6mm cap instead of the key's 4.5mm, with the same 0.7mm press
  travel.

### Grounded shape counterparts

<RenderComparison slug="button-round" dir="components"><GroundedButtonRoundDemo /></RenderComparison>
<RenderComparison slug="button-square" dir="components"><GroundedButtonSquareDemo /></RenderComparison>

## Sizes

`size="sm" | "md" | "lg"` scales min-width, cap padding, and label size per
shape — `"md"` is the unchanged default. See the full per-shape table in
[Design tokens](/ambient-components/design-tokens#sizes).

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `shape` | `"pill" \| "round" \| "square"` | `"pill"` |
| `material` | `"matte" \| "shiny" \| "glass"` | `"matte"` |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |
| `mode` | `"momentary" \| "toggle" \| "repeat"` | `"momentary"` |
| `onPress` | `() => void` | - |
| `value` | `boolean` | - |
| `defaultValue` | `boolean` | `false` |
| `onChange` | `(on: boolean) => void` | - |
| `repeatDelay` | `number` | `400` |
| `repeatInterval` | `number` | `60` |

Also inherits all `ButtonHTMLAttributes<HTMLButtonElement>` props.

## `mode`

A transport key, a latching mute and an auto-repeating nudge button are the
same object with three state machines and identical paint.

- **`momentary`** (default) — fires `onPress` (and `onClick`) on activation.
- **`toggle`** — stays pressed in. Drive it with `value`/`onChange` or leave
  it uncontrolled with `defaultValue`; it reports `aria-pressed`.
- **`repeat`** — fires `onPress` on the press, then repeatedly while held,
  after `repeatDelay` and every `repeatInterval` thereafter.

```tsx
<AmbientButton mode="toggle" value={muted} onChange={setMuted}>Mute</AmbientButton>
<AmbientButton mode="repeat" onPress={() => setBpm((n) => n + 1)}>+</AmbientButton>
```

`AmbientButton` is a preset over `AmbientPress`. For a key that looks like
yours, give the mechanism your own cap — see
[Composing controls](./composing).

## Examples

### Basic

```tsx
<AmbientButton>Play</AmbientButton>
```

### Disabled

```tsx
<AmbientButton disabled>Bypass</AmbientButton>
```

### Custom click handler

```tsx
<AmbientButton onClick={() => console.log("trigger")}>Trigger</AmbientButton>
```

## Default class stack

`ambient amb-button amb-chamfer amb-elevation-1 ambx-button amb-heading-3`
