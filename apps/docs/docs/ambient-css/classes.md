---
title: Classes
---

import { CssRenderedExamples } from "@site/src/components/CssRenderedExamples";

## Surfaces

Surfaces define the convexity and lighting response of an element. All AmbientCSS elements start with `.ambient`.

### Flat Surfaces

The default surface is flat. Use `amb-surface` for standard panels and cards.

```html
<div class="ambient amb-surface amb-elevation-1">Flat Surface</div>
```

### Concave Surfaces

Use `amb-surface-concave` for inset areas like screens, meters, or depressed buttons.

```html
<div class="ambient amb-surface-concave amb-elevation-1">Concave Surface</div>
```

### Convex Surfaces

Use `amb-surface-convex` for raised elements like buttons, knobs, or faders.

```html
<div class="ambient amb-surface-convex amb-elevation-1">Convex Surface</div>
```

## Edge Treatments

Edge treatments define how the edges of an element catch light.

### Chamfer

Chamfered edges (`amb-chamfer`) create a hard, angled transition. This is the standard "industrial" look.

```html
<div class="ambient amb-surface amb-chamfer amb-elevation-2">Chamfered Edge</div>
```

### Fillet

Filleted edges (`amb-fillet`) create a soft, rounded transition.

```html
<div class="ambient amb-surface amb-fillet amb-elevation-2">Filleted Edge</div>
```

## Elevation

Elevation controls the depth of the element and the strength of its shadow.

- `amb-elevation-0`: No elevation (flush with surface).
- `amb-elevation-1`: Slight elevation.
- `amb-elevation-2`: Medium elevation.
- `amb-elevation-3`: High elevation.

```html
<div class="ambient amb-surface amb-chamfer amb-elevation-1">Elevation 1</div>
<div class="ambient amb-surface amb-chamfer amb-elevation-2">Elevation 2</div>
<div class="ambient amb-surface amb-chamfer amb-elevation-3">Elevation 3</div>
```

## Lighting Direction

You can override the global light source for specific elements to simulate localized lighting or different orientations.

### Corners

- `amb-light-tl`: Top-left light source.
- `amb-light-tr`: Top-right light source.
- `amb-light-bl`: Bottom-left light source.
- `amb-light-br`: Bottom-right light source.

### Axes

- `amb-light-top`
- `amb-light-bottom`
- `amb-light-left`
- `amb-light-right`

## Shape & Effects

### Border Radius

AmbientCSS uses standard utility classes for border radius, which interact correctly with lighting effects.

- `amb-rounded`: Small radius.
- `amb-rounded-md`: Medium radius.
- `amb-rounded-lg`: Large radius.
- `amb-rounded-xl`: Extra large radius.
- `amb-rounded-full`: Full pill/circle radius.

### Glow

Add `amb-glow` to any element to make it emit light based on its color.

```html
<div class="ambient amb-surface-convex amb-rounded-full amb-glow" style="background-color: #ef4444;"></div>
```

### Motion

Add `amb-bounce` for a simple press animation on active/focus states.

```html
<button class="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-bounce">Press Me</button>
```
