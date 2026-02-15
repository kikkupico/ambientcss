---
title: Recipes
---

import { CssRecipeRenderedExamples } from "@site/src/components/CssRecipeRenderedExamples";

These recipes assume a bright baseline (`keyLight: 0.9`, `fillLight: 0.72`).

## Rendered examples

<CssRecipeRenderedExamples />

## Raised card

```html
<section class="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg">
  Raised card
</section>
```

## Inset display window

```html
<div class="ambient amb-surface-concave amb-fillet amb-elevation-1 amb-rounded-md">
  Inset display
</div>
```

## Light direction variants

```html
<div class="ambient amb-surface amb-chamfer amb-elevation-2 amb-light-tl">Top left light</div>
<div class="ambient amb-surface amb-chamfer amb-elevation-2 amb-light-br">Bottom right light</div>
```

## Pulsing indicator

```html
<span class="ambient amb-surface-convex amb-rounded-full amb-glow amb-bounce"> </span>
```

## Mixed panel layout

```html
<div class="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg">
  <div class="ambient amb-surface-convex amb-fillet amb-elevation-1 amb-rounded-md">Knob zone</div>
  <div class="ambient amb-surface-concave-h amb-fillet amb-elevation-1 amb-rounded-md">Meter zone</div>
</div>
```

## Simple transport block

```html
<div class="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg" style="padding: 14px; display: flex; gap: 10px;">
  <button class="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style="padding: 8px 12px; border: 0;">Play</button>
  <button class="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style="padding: 8px 12px; border: 0;">Stop</button>
  <button class="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style="padding: 8px 12px; border: 0;">Rec</button>
</div>
```
