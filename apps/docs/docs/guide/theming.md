---
title: Theming
---

Ambient CSS theming is mostly variable-driven. You can control the visual language globally with `AmbientProvider` or directly with CSS custom properties.

If terms like key light and fill light are new, read [Guide > Concept](/guide/concept) first.

## Theme controls

These map to CSS variables:

- `lightX` -> `--amb-light-x`
- `lightY` -> `--amb-light-y`
- `keyLight` -> `--amb-key-light-intensity`
- `fillLight` -> `--amb-fill-light-intensity`
- `lightHue` -> `--amb-light-hue`
- `lightSaturation` -> `--amb-light-saturation`
- `highlightColor` -> `--amb-highlight-color`
- `lumeHue` -> `--amb-lume-hue`

## React example

```tsx
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";

import { AmbientProvider, AmbientPanel, AmbientButton } from "@ambientcss/components";

export function ThemedSurface() {
  return (
    <AmbientProvider
      theme={{
        lightX: -1,
        lightY: -1,
        keyLight: 0.9,
        fillLight: 0.72,
        lightHue: 220,
        lightSaturation: 14,
        highlightColor: "#7dd3fc",
        lumeHue: 190
      }}
    >
      <AmbientPanel>
        <AmbientButton>Power</AmbientButton>
      </AmbientPanel>
    </AmbientProvider>
  );
}
```

## CSS-only override

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

## Tuning tips

- Keep `keyLight` higher than `fillLight` for readable depth.
- Move `lightX`/`lightY` with intent: avoid flipping often across one screen.
- Use lower saturation for neutral UI and higher saturation for stylized looks.
