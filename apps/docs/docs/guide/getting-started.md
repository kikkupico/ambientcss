---
title: Getting Started
---

Ambient CSS is organized as two packages:

- `@ambientcss/css`: CSS primitives and ambient utility classes.
- `@ambientcss/components`: React components built with those primitives.

## Install

```bash
pnpm add @ambientcss/components @ambientcss/css
```

If you only need CSS utilities:

```bash
pnpm add @ambientcss/css
```

## Basic React setup

```tsx
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";

import { AmbientButton, AmbientKnob, AmbientProvider } from "@ambientcss/components";

export function Example() {
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
      <AmbientButton>Play</AmbientButton>
      <AmbientKnob value={40} onChange={(next) => console.log(next)} />
    </AmbientProvider>
  );
}
```
