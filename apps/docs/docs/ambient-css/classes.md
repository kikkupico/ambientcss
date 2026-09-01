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

There is one flat-surface class, not a ladder of tones: the colour comes from
`--amb-albedo` (any CSS colour) and `--amb-shade` (a multiplier on its
reflectance), and the class lights whatever it finds.

```html
<div class="ambient amb-surface" style="--amb-albedo: #7a3b2e">Oxide panel</div>
<div class="ambient amb-surface" style="--amb-shade: 0.38">Darker plate</div>
```

Both inherit, so setting them on a container themes everything inside it.
See [Global Settings](./global-settings.md#material-colour---amb-albedo---amb-shade).

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

### Concave Surfaces (horizontal)

`amb-surface-concave-h` is the same dished gradient as `amb-surface-concave`,
riding `--amb-light-x` across the element left-to-right instead of
`--amb-light-y` top-to-bottom — for horizontal tracks and troughs.

```html
<div class="ambient amb-surface-concave-h amb-elevation-1">Concave Surface (h)</div>
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

### Brushed

Brushed aluminium: a pale, anisotropic micro-relief fitted against a
photographed crop. Use `amb-mat-brushed` for machined faceplates and metal
caps. The streaks never rotate — only the light crossing them moves — so the
finish shades most when the lamp is across the grain and goes almost smooth
when it runs along it.

```html
<div class="ambient amb-surface amb-mat-brushed amb-elevation-1">Brushed Surface</div>
```

### Brushed round

The same aluminium spun about the element's centre instead of run across it —
the lathe finish on a knob cap or a volume dial, so put `amb-mat-brushed-round`
on round faces. The streaks converge to a bright hotspot at the centre, and two
opposed arcs swing round the rim as the lamp moves, which is the tangent of a
circular groove going to zero in exactly two places rather than an effect
painted on.

```html
<div class="ambient amb-surface amb-mat-brushed-round amb-elevation-1"
     style="border-radius: 50%">Spun Surface</div>
```

### Blasted

Bead-blasted elastomer: a dark, isotropic micro-relief about three times the
depth of the brushed grain. Use `amb-mat-blasted` for pads, feet, grips and
overmoulded caps.

```html
<div class="ambient amb-surface amb-mat-blasted amb-elevation-1">Blasted Surface</div>
```

None of the three carries a `--amb-albedo` of its own — same as Matte and
Shiny, they add relief and nothing else, and take colour from whatever the
surface already has (see [Colouring every material](#colouring-every-material)
below). Each was fitted at a reference tone, though, and the grain's
amplitude does not follow the tone law far from it: colour a finish a long
way from its reference and the relief reads too strong or too weak.

`amb-mat-blasted` was named for the finishing process (bead-blasting), not
the substance underneath it — the same pattern `amb-mat-brushed` follows —
so it stays a fair name for that texture on any material, not only rubber.

The rubber is matte in the specular sense. The two metals are not: each also
carries a broad sheen, anisotropic in its own grain's direction. On the linear
finish that is a band across the grain, so `--amb-light-y` slides it and
`--amb-light-x` deliberately does nothing; on the spun one it is the pair of
lobes on the lamp's axis. The sheen rides the key light and is painted on the
element's own background, so a component that has already spoken for
`background-image` (`.amb-surface-concave`, `.amb-surface-convex`) keeps its
own and shows the relief alone.

Scale the relief with `--amb-grain-amount` (default `1`; `0` leaves the flat
material). It inherits, so a panel can dial down everything inside it. A
material's own directional term is deliberately *not* this property, so
turning the grain down never deletes the brushed anisotropy.

```html
<div class="ambient amb-surface amb-mat-blasted" style="--amb-grain-amount: 0.5">
  Half-strength grain
</div>
```

### Colouring every material

Materials aren't skinned with a colour, they're lit. None of the five —
Matte, Shiny, Brushed, Brushed round, Blasted — carries a `--amb-albedo` of
its own: each is relief and specular only, painted on top of whatever
`.amb-surface` is already showing, so all five take colour exactly the way
[Flat Surfaces](#flat-surfaces) does — override `--amb-albedo` on the
element:

```html
<div class="ambient amb-surface amb-mat-shiny" style="--amb-albedo: #7a3b2e">
  Oxide-red shiny panel
</div>
<div class="ambient amb-surface amb-mat-brushed" style="--amb-albedo: #24405c">
  Steel-blue brushed panel
</div>
<div class="ambient amb-surface amb-mat-blasted" style="--amb-albedo: #6e1f24">
  Crimson blasted pad
</div>
```

Left unset, all five render at whatever `--amb-albedo` they inherit — the
reference ground by default. Brushed, Brushed round and Blasted's grain was
fitted at a specific reference tone each (stated above); set `--amb-albedo`
to that value for the exact calibrated look, same as any other override.

**Glass is the one exception.** It's translucent rather than pigmented, so
it has no albedo to override — `--amb-albedo` set on a glass element does
nothing to it, because its background comes from `--amb-light-hue` /
`--amb-light-saturation` instead, the way a real pane takes the colour of
whatever's shining through it:

```html
<div class="ambient amb-surface amb-mat-glass"
     style="--amb-light-hue: 280; --amb-light-saturation: 55%">
  Violet-lit glass
</div>
```

`--amb-shade` (see [Global Settings](./global-settings.md#material-colour---amb-albedo---amb-shade))
composes with any of these — reach for it for a tonal step within one
material's colour, on every finish except glass, instead of a second
`--amb-albedo`.

Two costs worth knowing before you reach for these. Each material paints its
relief in `::before` and `::after`, so an element that already uses one of
its own pseudo-elements needs the grain on an inner layer instead. And the
host gets `overflow: hidden`, needed so the blend clips to a rounded corner —
it clips real children too.

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

### Groove

`amb-groove` cuts a recessed slot into the surface rather than beveling its
outer edge — the recess floor takes the same `--amb-albedo`/`--amb-shade` as
the surrounding surface, under its own exposure, so it stays the same
material at a different depth. Use it for slider/fader tracks or any inset
channel.

```html
<div class="ambient amb-surface amb-groove amb-elevation-1">Groove</div>
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

Add `amb-glow` to any element to give it a soft halo. The halo is a fixed
`box-shadow: 0 0 6.2px var(--amb-lume)` — it uses the scene's derived light
colour, which warms as the key light dims, and does **not** track the
element's own background. Set the fill yourself:

```html
<div class="ambient amb-surface-convex amb-rounded-full amb-glow" style="background-color: #ef4444;"></div>
```

### Emissive Indicators

`amb-emit-red` `amb-emit-green` `amb-emit-amber` `amb-emit-cyan` `amb-emit-blue` `amb-emit-white`
each publish a `--amb-emit-color` custom property; they don't paint anything
by themselves. Pair one with `background-color: var(--amb-emit-color)` for
the fill and `amb-glow` for the halo (`box-shadow: 0 0 6.2px var(--amb-lume)`,
which shifts warmer as the key light dims):

```html
<span class="ambient amb-rounded-full amb-glow amb-emit-red"
      style="background-color: var(--amb-emit-color)"></span>
```

Use a flat LED shape (`amb-rounded-full`) rather than `amb-surface-convex` —
that class paints its own opaque gradient `background`, which would fully
occlude the emit colour.

Note that `@ambientcss/components` does not build on `--amb-emit-color`: its
`.amb-led` reads a separate `--amb-led-color`, driving both its fill and a
tighter halo from that one variable. The two channels are independent.

### Motion

Add `amb-bounce` for a simple press animation on active/focus states.

```html
<button class="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-bounce">Press Me</button>
```
