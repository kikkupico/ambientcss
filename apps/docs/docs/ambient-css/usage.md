---
title: Usage
---

Start by importing the CSS:

```ts
import "@ambientcss/css/ambient.css";
```

## Minimal markup

```html
<div class="ambient amb-surface amb-fillet amb-elevation-2 amb-rounded-lg">
  Ambient panel surface
</div>
```

## Typical class stack

Most surfaces combine these layers:

- `ambient`: enables physically based shadows/highlights.
- One surface class: `amb-surface`, `amb-surface-convex`, or `amb-surface-concave`.
- One edge class: `amb-fillet` or `amb-chamfer`.
- One elevation class: `amb-elevation-0` to `amb-elevation-3`.

## Bright baseline settings

```css
:root {
  --amb-light-x: -1;
  --amb-light-y: -1;
  --amb-key-light-intensity: 0.9;
  --amb-fill-light-intensity: 0.72;
  --amb-light-hue: 220;
  --amb-light-saturation: 14%;
  --amb-highlight-color: #7dd3fc;
  --amb-lume-hue: 190;
}
```

## Quick variants

```html
<!-- raised -->
<div class="ambient amb-surface-convex amb-fillet amb-elevation-2 amb-rounded-md"></div>

<!-- inset -->
<div class="ambient amb-surface-concave amb-chamfer amb-elevation-1 amb-rounded-md"></div>
```

For React component visuals, also import:

```ts
import "@ambientcss/components/styles.css";
```
