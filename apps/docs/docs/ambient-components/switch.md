---
title: AmbientSwitch
---

import { SwitchPreview, GroundedSwitchDemo } from "@site/src/components/ComponentPreviews";
import { RenderComparison } from "@site/src/components/RenderComparison";

`AmbientSwitch` is a slide switch — a pill riding in a recessed stadium
track — with an optional LED indicator.

## Interactive preview

<SwitchPreview />

## Grounded counterpart

The switch is modeled on its 3D referent (`ambient3d/components/switch.py`):
a pill sliding in a stadium recess cut into the panel. The track is an
`.amb-groove`; the pill stands the referent's 2.6mm above the recess floor.

<RenderComparison slug="switch" dir="components"><GroundedSwitchDemo /></RenderComparison>

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `checked` | `boolean` | - | Controlled state. |
| `defaultChecked` | `boolean` | `false` | Uncontrolled initial state. |
| `onCheckedChange` | `(checked: boolean) => void` | - | Called when toggled. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Switch size variant. |
| `label` | `string` | - | Optional visible label. |
| `led` | `boolean \| string` | - | `true` for default green, string for custom color. |

Also accepts standard button props (except native `onChange`).

## Examples

### Uncontrolled

```tsx
<AmbientSwitch label="Power" defaultChecked />
```

### Controlled

```tsx
const [enabled, setEnabled] = useState(false);

<AmbientSwitch checked={enabled} onCheckedChange={setEnabled} label="Bypass" />
```

### Custom LED color

```tsx
<AmbientSwitch label="Record" led="#ef4444" defaultChecked />
```
