---
title: AmbientKnob
---

import { KnobPreview, GroundedKnobDemo } from "@site/src/components/ComponentPreviews";
import { RenderComparison } from "@site/src/components/RenderComparison";

`AmbientKnob` is a vertical-drag control that maps pointer movement to a numeric value.

## Interactive preview

<KnobPreview />

## Grounded counterpart

The knob is modeled on its 3D referent (`ambient3d/components/knob.py`): a
knob-scale body (thickness 2 — the referent's 9mm height) resting on the
panel, with a knurled rim, a smooth top disc and an indicator dot. The
whole face rotates with the value, ribs and all.

<RenderComparison slug="knob" dir="components"><GroundedKnobDemo /></RenderComparison>

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | required |
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `label` | `string` | - |
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
