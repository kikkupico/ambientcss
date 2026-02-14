---
title: Usage
---

```tsx
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";

import {
  AmbientButton,
  AmbientFader,
  AmbientKnob,
  AmbientPanel,
  AmbientProvider,
  AmbientSlider,
  AmbientSwitch
} from "@ambientcss/components";

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
      <AmbientPanel>
        <AmbientButton>Play</AmbientButton>
        <AmbientSwitch label="Bypass" defaultChecked />
        <AmbientKnob value={40} onChange={(next) => console.log("knob", next)} />
        <AmbientSlider value={28} onChange={(next) => console.log("slider", next)} />
        <AmbientFader value={72} onChange={(next) => console.log("fader", next)} />
      </AmbientPanel>
    </AmbientProvider>
  );
}
```

## Controlled vs uncontrolled

- `AmbientSwitch` supports controlled (`checked`) and uncontrolled (`defaultChecked`) modes.
- `AmbientKnob`, `AmbientSlider`, and `AmbientFader` are controlled by `value` and emit `onChange`.

## Accessibility

Controls expose slider/switch semantics and ARIA values. Prefer providing `label` for clear assistive text.
