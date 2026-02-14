---
id: intro
title: Ambient CSS
slug: /
---

Ambient CSS is a small design system split into two packages:

- `@ambientcss/css`: lighting primitives and utility classes.
- `@ambientcss/components`: React controls built on those primitives.

## Concept summary

Ambient CSS treats UI like front-view physical hardware under a shared two-light setup (key + fill).

- Orthographic front view is assumed: depth comes from shading, not perspective.
- Directional lighting (`lightX`, `lightY`) keeps highlights and shadows coherent across all controls.
- Key/fill intensity balance controls contrast, from soft matte surfaces to high-relief industrial looks.

Read [Guide > Concept](/guide/concept) for the full model.

## What you can build

- Hardware-style buttons and toggles.
- Mixer-style knobs, sliders, and faders.
- Light-direction-aware panels and surfaces.

## Docs map

- Start with `Guide > Getting Started`.
- Use [Guide > Concept](/guide/concept) for the lighting/shadow model.
- Use `Guide > Theming` to tune light direction and color behavior.
- Use `@ambientcss/components` pages for per-component props and examples.
- Use `@ambientcss/css` pages for utility classes and recipes.

## Quick links

- Demo app: https://ambientcss.vercel.app/
- GitHub repository: https://github.com/kikkupico/ambientcss
