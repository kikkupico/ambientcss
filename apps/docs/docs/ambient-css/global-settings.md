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
| `--amb-albedo` | Material colour of a surface | CSS color |
| `--amb-shade` | Multiplier on that material's reflectance | `0` to ~`1.2` |

## Material colour (`--amb-albedo`, `--amb-shade`)

A surface in Ambient CSS is a **material under a light**, never a fixed
colour. `--amb-albedo` is the material half: the colour the surface would
show under full white illumination.

```css
.console {
  --amb-albedo: #7a3b2e;   /* an oxide-red panel */
}
```

Everything downstream follows from it. `amb-surface` paints
albedo × exposure; `amb-groove` cuts a recess **in that same material**, so
a groove in a red panel is red; the curved classes paint only the shading
and ride the panel's colour; and the components package's knobs, keys and
faces read the same lit tone. Turn the key light down and the panel darkens
the way that red would; give the lamp a hue and the panel takes its cast.

`--amb-shade` is the tone half — a plain multiplier on the same material:

```css
.console .well { --amb-shade: 0.38; }  /* a darker recess, same material */
```

Prefer `--amb-shade` for hierarchy inside a themed panel: unlike a second
`--amb-albedo` it composes with whatever colour is inherited, so it keeps
working when the theme changes. Both variables inherit normally.

:::note Migrating from the surface variants

`amb-surface-darker`, `-darkest`, `-lighter` and `-lightest` are gone. They
were five hardcoded albedos of the one law this replaces; the equivalent is
`--amb-shade` at `0.38`, `0.07`, `1.11` and `1.16` on a plain
`amb-surface`.

:::

## Exposure (`--amb-lit`, `--amb-exposure`)

Two derived read-only outputs, like `--amb-lume`:

- `--amb-exposure` — the irradiance reaching a face-on surface, where `1` is
  full white illumination: `0.6396 · key + 0.5496 · fill`. Proportional, with
  no floor, because *irradiance* is what the intensities are linear in
  (sRGB lightness is not). Lights off is black.
- `--amb-lit` — the finished tone of a flat face: albedo × shade × exposure
  multiplied out in linear light, then given the lamp's cast. Read it
  anywhere you need a surface to match:

```css
.my-panel-edge { border-color: var(--amb-lit); }
```

The lamp's cast is a mix toward `--amb-light-hue` at
`--amb-light-saturation`, with the tint's own saturation set to
`100 − s` of the surface. The less chromatic the surface, the more
completely it takes the lamp's colour: a grey lands exactly where a
`hsl(hue, saturation, L)` surface always did, while a crimson panel under a
cyan lamp washes toward grey rather than rotating to green.

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

## Curvature (`--amb-curve-delta`)

`--amb-curve-delta` is the other derived variable, and the one you are most
likely to read rather than set. It is how far a curved face departs from its
flat tone at the ends of the curve — the single measured magnitude that
`amb-surface-concave`, `amb-surface-concave-h` and `amb-surface-convex` all
ride, so the three can never drift apart. It is affine in light contrast:
a dish still shades when the key equals the fill.

It is in **points of lightness and unitless** — multiply by `1%` to use it in
a color, and divide it to turn it into an overlay alpha over a known base
(this is how `@ambientcss/components` dishes its button cap):

```css
.my-dish {
  background: linear-gradient(
    hsl(from var(--amb-lit) h s calc(l - var(--amb-curve-delta))) 0%,
    hsl(from var(--amb-lit) h s calc(l + var(--amb-curve-delta))) 100%
  );
}
```

(Relative colour syntax substitutes `l` as a **number**, which is why the
delta carries no `%` of its own. Riding `--amb-lit` is what keeps a dish on
the panel's own `--amb-albedo`.)

Like `--amb-lume`, it is derived — read it, but **theme it through
`--amb-curve-scale`** rather than by assigning to it:

```css
:root {
  --amb-curve-scale: 1.6; /* deeper dishes and domes everywhere */
}
```

`--amb-curve-scale` is an ordinary variable, so it inherits and can be set on
`:root` or on any subtree. `--amb-curve-delta` itself is declared on *every*
element, because a custom property has its `var()`s substituted on the element
that declares it — on `:root` alone it would freeze at the document's light
and ignore any subtree that scopes its own, whether an `AmbientProvider`, an
`amb-light-*` class, or a pressed button cap. The side effect is that
assigning to `--amb-curve-delta` on an ancestor will not reach descendants,
which is exactly why the knob is a separate variable.

It carries no direction: each class applies its own axis and sign.

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
