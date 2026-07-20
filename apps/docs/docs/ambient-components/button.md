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

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `shape` | `"pill" \| "round" \| "square"` | `"pill"` |
| `material` | `"matte" \| "shiny" \| "glass"` | `"matte"` |

Also inherits all `ButtonHTMLAttributes<HTMLButtonElement>` props.

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
