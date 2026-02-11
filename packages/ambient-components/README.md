# @ambientcss/components

React components built with Ambient CSS.

## Install

```bash
pnpm add @ambientcss/components @ambientcss/css
```

## Usage

```tsx
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";

import { AmbientButton, AmbientKnob, AmbientProvider } from "@ambientcss/components";

export function Example() {
  return (
    <AmbientProvider theme={{ keyLight: 0.45, fillLight: 0.18, lightX: -1, lightY: -1 }}>
      <AmbientButton>Play</AmbientButton>
      <AmbientKnob value={40} onChange={(next) => console.log(next)} />
    </AmbientProvider>
  );
}
```
