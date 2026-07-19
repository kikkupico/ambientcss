---
title: AmbientButton
---

import { ButtonPreview, GroundedButtonDemo } from "@site/src/components/ComponentPreviews";
import { RenderComparison } from "@site/src/components/RenderComparison";

`AmbientButton` wraps a native `<button>` with ambient styling.

## Interactive preview

<ButtonPreview />

## Grounded counterpart

The button is modeled on its 3D referent (`ambient3d/components/button.py`):
a chamfered key cap seated in a clearance well, the well's gap ring showing
around it. Pressing sinks the cap by the referent's 0.7mm travel — the
chamfer bands and the swept shadow shrink with it.

<RenderComparison slug="button" dir="components"><GroundedButtonDemo /></RenderComparison>

## Props

Inherits all `ButtonHTMLAttributes<HTMLButtonElement>` props.

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
