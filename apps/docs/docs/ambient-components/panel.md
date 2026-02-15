---
title: AmbientPanel
---

import { PanelPreview } from "@site/src/components/ComponentPreviews";

`AmbientPanel` is a convenience wrapper over `div` with default ambient panel classes.

## Interactive preview

<PanelPreview />

## Props

Inherits all `HTMLAttributes<HTMLDivElement>` props.

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
