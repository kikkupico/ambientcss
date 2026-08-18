---
title: Overview
---

`@ambientcss/components` provides React UI controls built on Ambient CSS
primitives. They come in two layers.

## Presets

A preset is a mechanism with a set of parts already chosen — the grounded
hardware look, ready to use.

- `AmbientButton`
- `AmbientSwitch`
- `AmbientSelect`
- `AmbientKnob`
- `AmbientSlider`
- `AmbientFader`

Plus the scene and layout pieces: `AmbientProvider`, `AmbientPanel`,
`AmbientRack`.

## Mechanisms

A mechanism owns how a control moves, what its value is and how a screen
reader hears it — and has no appearance of its own. You supply that.

- `AmbientRotary` — knobs, encoders, dials
- `AmbientTravel` — sliders, faders, ribbons
- `AmbientPress` — buttons, keys, pads
- `AmbientLatch` — switches, rockers
- `AmbientBank` — selects, radio groups, tab bars, step sequencers

See [Composing controls](./composing) for how parts and frames work, and
`useRotary` / `useTravel` / `usePress` / `useLatch` / `useBank` if you want
the mechanism without any markup at all.

These components are designed to work alongside `@ambientcss/css`.
