---
title: AmbientKnob
---

import { KnobPreview, KnobVariantsPreview, GroundedKnobDemo } from "@site/src/components/ComponentPreviews";
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

## Variants

Knob types from the referent lineup (`ambient3d/generate.py` renders the
styled versions; `ambient3d/ground_components.py` the grounded ones):

<KnobVariantsPreview />

- **`dot`** (default) — the grounded referent: 36-rib knurl, offset
  indicator dot.
- **`line`** — same body with a radial indicator line, like a classic
  pot.
- **`flute`** — 14 broad flutes with deep roots and a centered dot
  (OP-Z-style encoder). The flutes rotate with the value.
- **`cap`** — fine 48-rib knurl under a smooth accent-colored top disc
  (OP-1-style encoder; the disc takes `--amb-highlight-color`).
- **`wheel`** — bare fine knurl, no indicator; pair with
  `material="shiny"` for the machined-metal wheel.

### Grounded variant counterparts

<RenderComparison slug="knob-line" dir="components"><GroundedKnobDemo variant="line" /></RenderComparison>
<RenderComparison slug="knob-flute" dir="components"><GroundedKnobDemo variant="flute" /></RenderComparison>
<RenderComparison slug="knob-cap" dir="components"><GroundedKnobDemo variant="cap" /></RenderComparison>
<RenderComparison slug="knob-wheel" dir="components"><GroundedKnobDemo variant="wheel" /></RenderComparison>

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | required |
| `min` | `number` | `0` |
| `max` | `number` | `100` |
| `step` | `number` | `1` |
| `label` | `string` | - |
| `variant` | `"dot" \| "line" \| "flute" \| "cap" \| "wheel"` | `"dot"` |
| `material` | `"matte" \| "shiny" \| "glass"` | - |
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
