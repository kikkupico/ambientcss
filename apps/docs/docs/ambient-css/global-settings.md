---
title: Global Settings
---

Ambient CSS uses global CSS variables for light direction, contrast, and material response.

If terms like key light and fill light are new, read [Guide > Concept](/guide/concept) first.

## Core variables

| Variable | Meaning | Typical range |
| --- | --- | --- |
| `--amb-light-x` | Horizontal light direction | `-1` to `1` |
| `--amb-light-y` | Vertical light direction | `-1` to `1` |
| `--amb-key-light-intensity` | Main shaping light intensity | `0` to `1` |
| `--amb-fill-light-intensity` | Secondary fill light intensity | `0` to `1` |
| `--amb-light-hue` | Light hue in HSL | `0` to `360` |
| `--amb-light-saturation` | Light saturation | `%` value |
| `--amb-highlight-color` | Interactive highlight color | CSS color |
| `--amb-lume-hue` | Emissive/trim hue | `0` to `360` |

## Bright reference preset

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

## Warm bright preset

```css
:root {
  --amb-light-x: -1;
  --amb-light-y: -0.8;
  --amb-key-light-intensity: 0.9;
  --amb-fill-light-intensity: 0.7;
  --amb-light-hue: 28;
  --amb-light-saturation: 18%;
  --amb-highlight-color: #fbbf24;
  --amb-lume-hue: 36;
}
```
