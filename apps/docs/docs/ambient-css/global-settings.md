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

## Emissive color (`--amb-lume`)

`--amb-lume` is a derived CSS color that acts as the emissive/accent tone for glows, trim highlights, and accent text. You control it with a single variable:

| Variable | Meaning | Default |
| --- | --- | --- |
| `--amb-lume-hue` | Base hue of the emissive color (HSL) | `17` (orange) |

The actual `--amb-lume` color is computed automatically using `color-mix()` in the oklab color space. It blends a vivid version of the lume hue with the scene's light color, reacting to `--amb-key-light-intensity`:

- **High key-light** (bright scene): `--amb-lume` converges toward the light color, keeping the scene cohesive.
- **Low key-light** (dark scene): `--amb-lume` becomes a vivid, saturated accent that stands out against the dark background — like a backlit LED or neon trim.

### Where it's used

- **`amb-glow`** class — applies `box-shadow: 0 0 4px var(--amb-lume)`.
- **Component accents** — button borders, slider fills, fader dots, and labels in `@ambientcss/components` use `var(--amb-lume)` for their accent color.
- **Custom use** — use `var(--amb-lume)` in your own styles for any emissive or accent element (text, borders, shadows).

### Changing the hue

```css
:root {
  --amb-lume-hue: 190; /* cyan accent */
}
```

Common values: `17` (orange), `36` (warm amber), `190` (cyan), `270` (purple), `0` (red).

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
