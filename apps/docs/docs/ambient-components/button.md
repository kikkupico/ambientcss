---
title: AmbientButton
---

import { ButtonPreview } from "@site/src/components/ComponentPreviews";

`AmbientButton` wraps a native `<button>` with ambient styling.

## Interactive preview

<ButtonPreview />

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
