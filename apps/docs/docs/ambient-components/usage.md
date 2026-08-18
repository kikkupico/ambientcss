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
        <AmbientSwitch label="Bypass" defaultValue />
        <AmbientKnob value={40} onChange={(next) => console.log("knob", next)} />
        <AmbientSlider value={28} onChange={(next) => console.log("slider", next)} />
        <AmbientFader value={72} onChange={(next) => console.log("fader", next)} />
      </AmbientPanel>
    </AmbientProvider>
  );
}
```

## Controlled vs uncontrolled

Every control takes the same pair. Pass `value` to drive it from outside, or
`defaultValue` (or neither) to let it hold its own state. `onChange` fires
either way, so you can read an uncontrolled control without taking it over.

## Presets and mechanisms

The components above are **presets**: a mechanism with a set of parts already
chosen. Underneath, each one is a mechanism that owns the kinematics, the
value and the ARIA, and knows nothing about how the control looks.

If you want a control that looks like yours rather than like ours, reach for
the mechanism and give it parts — see [Composing controls](./composing).

## Accessibility

Controls expose slider/switch semantics and ARIA values. Prefer providing
`label` for clear assistive text.

The control root owns the role, the tab stop and the keyboard handler, so
parts are presentational by contract: a part must not contain a focusable
element or an interactive role. In development, a check warns if one does.
