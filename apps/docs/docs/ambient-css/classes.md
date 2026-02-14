---
title: Classes
---

import { CssRenderedExamples } from "@site/src/components/CssRenderedExamples";

If you want the physical meaning behind terms like fillet/chamfer/elevation, read [Guide > Concept](/guide/concept).

## Rendered examples

<CssRenderedExamples />

## Core

- `ambient`: enables ambient shading and edge lighting.
- `amb-surface`, `amb-surface-darker`: flat surfaces.
- `amb-surface-concave`, `amb-surface-concave-h`: inset surfaces.
- `amb-surface-convex`: raised curved surface.

## Edge treatment

- `amb-fillet`, `amb-fillet-2`, `amb-fillet-minus-1`
- `amb-chamfer`, `amb-chamfer-2`, `amb-chamfer-minus-1`

## Elevation

- `amb-elevation-0`
- `amb-elevation-1`
- `amb-elevation-2`
- `amb-elevation-3`

## Light direction helpers

- Corners: `amb-light-tl`, `amb-light-tr`, `amb-light-bl`, `amb-light-br`
- Axes: `amb-light-top`, `amb-light-bottom`, `amb-light-left`, `amb-light-right`

## Shape and effects

- Radius: `amb-rounded`, `amb-rounded-md`, `amb-rounded-lg`, `amb-rounded-xl`, `amb-rounded-full`
- Glow: `amb-glow`
- Motion: `amb-bounce`

## Emissive helpers

- `amb-emit-red`
- `amb-emit-green`
- `amb-emit-amber`
- `amb-emit-cyan`
- `amb-emit-blue`
- `amb-emit-white`

## Bright baseline wrapper

Use this wrapper in examples to keep a bright, realistic baseline:

```html
<div style="--amb-light-x:-1; --amb-light-y:-1; --amb-key-light-intensity:0.9; --amb-fill-light-intensity:0.72; --amb-light-hue:220; --amb-light-saturation:14%; --amb-highlight-color:#7dd3fc; --amb-lume-hue:190;">
  <!-- ambient elements -->
</div>
```
