---
title: AmbientSwitch
---

import { SwitchPreview } from "@site/src/components/ComponentPreviews";

`AmbientSwitch` is a circular switch button with optional LED indicator.

## Interactive preview

<SwitchPreview />

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
