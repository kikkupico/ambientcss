---
title: AmbientPanel
---

import { PanelPreview } from "@site/src/components/ComponentPreviews";

`AmbientPanel` is a convenience wrapper over `div` with default ambient panel classes.

## Interactive preview

<PanelPreview />

## Props

Inherits all `HTMLAttributes<HTMLDivElement>` props. There is no `size` prop:
unlike the fixed-footprint controls (button, knob, slider, fader, switch), a
panel is a free-form container that sizes to its own content or parent, so
`size` would conflate "control size" with "content density."

Add the `ambx-panel-device` class when the panel represents a device face
composed of an [`AmbientRack`](/ambient-components/design-tokens#rack) of
controls, so its edge margin matches the loose gap tier used between them
— see [Design tokens](/ambient-components/design-tokens#spacing).

## Example

```tsx
import { AmbientPanel, AmbientButton } from "@ambientcss/components";

export function RackPanel() {
  return (
    <AmbientPanel className="my-panel-layout">
      <AmbientButton>Armed</AmbientButton>
    </AmbientPanel>
  );
}
```

## Default class stack

`ambient amb-surface amb-chamfer amb-elevation-2 ambx-panel`
