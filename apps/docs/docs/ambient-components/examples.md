---
title: Composition Examples
---

import { CompositionPreview } from "@site/src/components/ComponentPreviews";

These are practical composition patterns using multiple controls.

## Interactive preview

<CompositionPreview />

## Transport + channel strip

```tsx
import { useState } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKnob,
  AmbientPanel,
  AmbientSwitch
} from "@ambientcss/components";

export function ChannelStrip() {
  const [level, setLevel] = useState(68);
  const [gain, setGain] = useState(40);
  const [armed, setArmed] = useState(false);

  return (
    <AmbientPanel
      style={{
        display: "grid",
        gap: 16,
        justifyItems: "center",
        width: 220
      }}
    >
      <AmbientButton>Play</AmbientButton>
      <AmbientSwitch label="Arm" checked={armed} onCheckedChange={setArmed} led="#ef4444" />
      <AmbientKnob label="Gain" value={gain} onChange={setGain} />
      <AmbientFader label="Level" value={level} onChange={setLevel} />
    </AmbientPanel>
  );
}
```

## Theme switcher shell

```tsx
import { useState } from "react";
import { AmbientProvider, AmbientPanel, AmbientSwitch } from "@ambientcss/components";

export function ThemeToggleShell() {
  const [warm, setWarm] = useState(false);

  return (
    <AmbientProvider
      theme={
        warm
          ? { lightHue: 28, lightSaturation: 18, lumeHue: 36, keyLight: 0.9, fillLight: 0.7 }
          : { lightHue: 220, lightSaturation: 14, lumeHue: 190, keyLight: 0.9, fillLight: 0.72 }
      }
    >
      <AmbientPanel>
        <AmbientSwitch label="Warm Mode" checked={warm} onCheckedChange={setWarm} />
      </AmbientPanel>
    </AmbientProvider>
  );
}
```
