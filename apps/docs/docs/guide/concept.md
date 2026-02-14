---
title: Concept
---

import { ConceptIsometricDiagrams } from "@site/src/components/ConceptIsometricDiagrams";

Ambient CSS is based on a physically motivated lighting model for interface surfaces.

## Visual overview

<ConceptIsometricDiagrams />

## Core idea

Instead of painting fixed shadows and highlights, each element is shaded from shared light parameters. This keeps depth cues consistent across buttons, panels, switches, knobs, and sliders.

## Assumed camera/view

The model assumes an orthographic front view of the interface:

- The UI is treated as a set of surfaces viewed straight on.
- Depth is represented through lighting response and edge treatment, not perspective distortion.
- Elevation changes affect shadow offset/spread while preserving front-facing geometry.

## Two-light system

Ambient CSS uses two directional/intensity terms:

- Key light (`--amb-key-light-intensity`): primary shaping light that drives stronger highlights and shadow definition.
- Fill light (`--amb-fill-light-intensity`): secondary light that lifts dark regions and controls contrast.

Together with light direction (`--amb-light-x`, `--amb-light-y`), they define where each surface appears raised, recessed, or flat.

## Physically based shading cues

The `ambient` class composes multiple effects to approximate material behavior:

- Drop shadow offset by light direction and elevation.
- Inner highlight and inner shadow for edge curvature.
- Fillet/chamfer responses for rounded or beveled transitions.
- Surface gradients (`concave`, `convex`) for volume perception.

This is not a full path-traced renderer; it is a practical, deterministic approximation tuned for UI controls.

## Surface grammar

A typical element combines:

- One structure class: `ambient`
- One surface class: `amb-surface`, `amb-surface-concave`, or `amb-surface-convex`
- One edge class: `amb-fillet` or `amb-chamfer`
- One depth class: `amb-elevation-*`

Because all classes read from the same light variables, whole layouts remain visually coherent.

## Why it works

- Shared light state makes components look like parts of the same physical device.
- Orthographic assumptions keep controls legible and stable.
- Key/fill balancing gives you a direct contrast dial from soft to dramatic.
