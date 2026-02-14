---
title: AmbientKnob
---

import { KnobPreview } from "@site/src/components/ComponentPreviews";

`AmbientKnob` is a vertical-drag control that maps pointer movement to a numeric value.

## Interactive preview

<KnobPreview />

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
