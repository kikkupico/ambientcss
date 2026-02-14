---
title: Concept
---

import { ConceptIsometricDiagrams } from "@site/src/components/ConceptIsometricDiagrams";

## Motivation

People understand light intuitively. You can tell when something is raised off a surface, when it's recessed into one, when it's caught by a strong directional beam versus sitting in soft ambient glow. This is not learned design language — it's just how vision works. Shadows tell you where objects sit in space because your brain already knows where light comes from.

CSS design systems don't use any of this. They define shadows as a fixed scale — `shadow-sm`, `shadow-md`, `shadow-lg` — where the names are t-shirt sizes and the values are hand-tuned blur radii that looked reasonable to whoever picked them. There's no light source behind the numbers. A card with `shadow-lg` next to a button with `shadow-sm` doesn't imply a shared physical scene; they're just two unrelated visual effects that happen to coexist on the same page.

This means elevation is decorative rather than spatial. Making a shadow bigger is supposed to suggest "further from the surface," but without a consistent light direction, it just looks heavier. And the model stops at outer shadows entirely — there's no account for how light catches the top edge of a raised button, or how a recessed input should darken on the side facing away from the source. Those details get left to one-off manual styling, if they're addressed at all.

Ambient CSS starts from the other end. Instead of choosing shadow values per component, you describe a lighting environment — where the light is, how strong it is, how far each element sits from the background — and the shadows, highlights, and surface gradients follow from that.

## How it works

<ConceptIsometricDiagrams />

The model treats the UI as flat surfaces viewed straight on (orthographic projection). There's no perspective distortion. Depth comes from lighting and edge treatment.

### Light environment

Every element reads from the same CSS custom properties:

| Property | Controls |
|---|---|
| `--amb-light-x`, `--amb-light-y` | Light direction (-1 to 1 on each axis) |
| `--amb-key-light-intensity` | Primary light strength (0 to 1) |
| `--amb-fill-light-intensity` | Secondary light strength (0 to 1) |
| `--amb-light-hue`, `--amb-light-saturation` | Light color |

Since all elements read from the same variables, changing a value updates every element in the scene.

### Two-light system

The model uses two lights:

**Key light** — the dominant source. It produces the strongest highlights and sharpest shadows. It determines where surfaces appear raised or recessed.

**Fill light** — the secondary source. It lifts shadow regions so they don't go fully dark. The key-to-fill ratio controls contrast:

```
key = 0.85, fill = 0.80  →  soft, diffuse
key = 0.90, fill = 0.72  →  balanced
key = 0.95, fill = 0.50  →  high contrast
```

### Five-layer box-shadow

The `ambient` class generates a five-layer `box-shadow` from the light parameters:

1. **Drop shadow** — offset by light direction, scaled by elevation.
2. **Fillet highlight** (inset) — bright inner edge on the lit side.
3. **Fillet shadow** (inset) — dark inner edge on the opposite side.
4. **Chamfer highlight** (inset) — wider, softer inner glow for beveled edges.
5. **Chamfer shadow** (inset) — dark bevel on the far side.

All five layers derive from the same direction, intensity, and elevation values.

### Surface grammar

Each element combines four concerns:

```
┌─────────────┬──────────────────────────────────┐
│ Structure   │ ambient                          │
│ Surface     │ amb-surface / -concave / -convex  │
│ Edge        │ amb-fillet / amb-chamfer          │
│ Depth       │ amb-elevation-0 … amb-elevation-3 │
└─────────────┴──────────────────────────────────┘
```

- **Structure** (`ambient`) enables the five-layer shadow system.
- **Surface** sets the background gradient. Flat is uniform. Concave darkens toward the light. Convex brightens toward the light.
- **Edge** controls inner highlights/shadows. Fillet gives rounded inner edges, chamfer gives beveled ones.
- **Depth** (`amb-elevation-0` through `amb-elevation-3`) scales drop shadow offset and spread.

All four read from the same light variables, so any combination is consistent.
