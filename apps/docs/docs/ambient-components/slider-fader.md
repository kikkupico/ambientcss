---
title: AmbientSlider and AmbientFader
---

import { SliderFaderPreview } from "@site/src/components/ComponentPreviews";

`AmbientSlider` and `AmbientFader` share the same value model and props.

Both are composed from grounded primitives: the track is an `.amb-groove`
recess (the lit wall casts a crisp shadow band into it, the far wall
bounces the key back — see the [grounded reference](/ambient-css/grounded#groove))
with a lume interior that reads dark under bright light and glows as the
room dims; the thumb is an `ambient amb-fillet amb-elevation-1` body.

## Interactive preview

<SliderFaderPreview />

## Shared props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | required |
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `label` | `string` | - |
| `onChange` | `(nextValue: number) => void` | - |

## Example: horizontal + vertical pair

```tsx
import { useState } from "react";

function MixerPair() {
  const [pan, setPan] = useState(50);
  const [level, setLevel] = useState(72);

  return (
    <>
      <AmbientSlider label="Pan" value={pan} min={0} max={100} step={1} onChange={setPan} />
      <AmbientFader label="Level" value={level} min={0} max={100} step={1} onChange={setLevel} />
    </>
  );
}
```

## Behavior notes

- Slider maps pointer X position to value.
- Fader maps pointer Y position to value (top is higher).
- Both controls clamp and snap using `min`, `max`, and `step`.
