---
title: AmbientKnob
---

import { KnobPreview, KnobKnurlingPreview, KnobMarkersPreview, KnobIndicatorPreview, GroundedKnobDemo } from "@site/src/components/ComponentPreviews";
import { RenderComparison } from "@site/src/components/RenderComparison";

`AmbientKnob` is a vertical-drag control that maps pointer movement to a numeric value.

## Interactive preview

<KnobPreview />

## Grounded counterpart

The knob is modeled on its 3D referent (`ambient3d/components/knob.py`): a
knob-scale body (thickness 2 — the referent's 9mm height) resting on the
panel, with a knurled rim and an indicator dot. The whole face rotates with
the value, ribs and all.

<RenderComparison slug="knob" dir="components"><GroundedKnobDemo /></RenderComparison>

## Shape

The knob is described by three independent props rather than one variant
name: whether the body is ribbed, what is printed on the panel around it,
and what the face points with. They compose freely — every combination is a
knob someone has built.

### `knurling`

`true` (default) gives the grounded referent's 36-rib knurl, clipped to a
toothed silhouette so the ribs break the outline and rotate with the value.
`false` gives a smooth turned body: with no teeth standing proud, the body
takes the full width and its rim is read from the thickness bands alone.

`material` applies to whichever of the two actually paints the knob, so
`knurling={false} material="shiny"` is the machined-metal wheel. On a knurled
knob the rib shading holds the face and a material contributes only its
`--amb-mat-*` variables.

<KnobKnurlingPreview />

<RenderComparison slug="knob-smooth" dir="components"><GroundedKnobDemo knurling={false} indicator="rectangle" /></RenderComparison>

### `markers`

Printed scale dots on the panel around the knob, on the same 270° arc the
value sweeps — so a dot always sits where its value points. They do not
rotate, because they are panel graphics rather than part of the control, and
they take `--amb-label` (the legend ink) rather than the accent colour.

- **`none`** (default) — bare panel.
- **`ends`** — the two dots the travel starts and stops at. They sit at 0.94
  of the radius, so only their outer edge clears the knob's own footprint and
  no clearance is reserved.
- **`full`** — 13 dots at 22.5°. The ring reaches past the knob, so the
  component reserves that clearance — on all four sides, not just the three
  the arc needs, so the knob stays concentric with the box it occupies rather
  than shifting down off the point you positioned it on. The label clears the
  ring too, so it sits further from a knob with a full ring than from a bare
  one.

<KnobMarkersPreview />

<RenderComparison slug="knob-markers" dir="components"><GroundedKnobDemo knurling={false} markers="full" indicator="rectangle" /></RenderComparison>

### `indicator`

- **`circle`** (default) — the grounded referent's offset dot.
- **`rectangle`** — a short radial bar out near the rim, running 0.50 to
  0.84 of the radius.

<KnobIndicatorPreview />

<RenderComparison slug="knob-line" dir="components"><GroundedKnobDemo indicator="rectangle" /></RenderComparison>

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | required |
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `label` | `string` | - |
| `knurling` | `boolean` | `true` |
| `markers` | `"none" \| "ends" \| "full"` | `"none"` |
| `indicator` | `"rectangle" \| "circle"` | `"circle"` |
| `material` | `"matte" \| "shiny" \| "glass"` | - |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` |
| `onChange` | `(nextValue: number) => void` | - |

Also accepts standard `HTMLAttributes<HTMLDivElement>` (except native `onChange`).

## Example

```tsx
import { useState } from "react";

function GainKnob() {
  const [gain, setGain] = useState(45);

  return (
    <AmbientKnob
      label="Gain"
      value={gain}
      min={0}
      max={100}
      step={1}
      onChange={setGain}
    />
  );
}
```

## Behavior notes

- Drag up to increase, drag down to decrease.
- Value is clamped to `[min, max]`.
- Value is snapped using `step`.
