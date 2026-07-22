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

## Materials

Materials define the physical finish and texture of an element, affecting its background and response to light.

### Matte (Default)

The standard skeuomorphic surface. Use `amb-mat-matte` (or no class) for a flat, non-reflective finish.

```html
<div class="ambient amb-surface amb-mat-matte amb-elevation-1">Matte Surface</div>
```

### Shiny

Adds a light-reflective gradient that aligns with the global light source. Use `amb-mat-shiny` for polished plastic or metal finishes.

```html
<div class="ambient amb-surface amb-mat-shiny amb-elevation-2">Shiny Surface</div>
```

### Glass

A frosted glass effect with translucency and background blur. Use `amb-mat-glass` for overlay panels or modern frosted interfaces.

```html
<div class="ambient amb-surface amb-mat-glass amb-elevation-3">Glass Surface</div>
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

## Thickness

Thickness controls the physical body height of the element — how much
material it's cut from, grounded in the `ambient3d` rig. Like elevation, it
scales the drop shadow; unlike elevation, it also gates the edge treatments
(`amb-chamfer`, `amb-fillet`, `amb-groove`), which need material to cut into.

- `amb-thickness-0`: Paper-thin sheet (0.15mm). Imperceptible at rest on a
  matching surface (no edge bands, no shadow) — only elevation reveals it.
- `amb-thickness-1`: Button-scale slab (4.5mm).
- `amb-thickness-2`: Knob-scale body (9mm) — twice as thick as a button.

```html
<div class="ambient amb-surface amb-chamfer amb-thickness-0">Thickness 0</div>
<div class="ambient amb-surface amb-chamfer amb-thickness-1">Thickness 1</div>
<div class="ambient amb-surface amb-chamfer amb-thickness-2">Thickness 2</div>
```

### Thickness and edge treatments

Edge treatments imply material to cut into, so `amb-chamfer` and `amb-fillet`
default an element's thickness to 1 if nothing else sets it; the wider
`amb-chamfer-2` and `amb-fillet-2` cuts default it to 2, since a cut can't be
wider than the body is thick. `amb-groove` (a recess cut into the material)
defaults thickness to 1 too. Add an explicit `amb-thickness-*` class to
override any of these defaults:

```html
<!-- amb-chamfer alone defaults to thickness 1; this thickens the body to knob-scale -->
<div class="ambient amb-surface amb-chamfer amb-thickness-2">Thick chamfer</div>
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

- `amb-rounded`: Small radius (4px).
- `amb-rounded-md`: Medium radius (8px).
- `amb-rounded-lg`: Large radius (12px).
- `amb-rounded-xl`: Extra large radius (16px).
- `amb-rounded-full`: Full pill/circle radius (9999px).

`@ambientcss/components` mirrors these exact values as `--ambx-radius-sm/-md/-lg/-xl/-full`
tokens, so the two packages share one radius scale — see
[Design tokens](/ambient-components/design-tokens#border-radius) for the
full component-side scale, including sizing and spacing.

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
