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

## Two layers

Every control is a **mechanism** — kinematics, value, state and ARIA — plus a
**skin**. The named components are presets that pair one with a set of parts;
underneath, the mechanism has no appearance of its own and will wear whatever
you give it.

```tsx
import { AmbientRotary, KnobBody, ScaleRing } from "@ambientcss/components";

<AmbientRotary
  value={gain} onChange={setGain}
  travel={{ start: -135, sweep: 270 }}
  input="drag"
  className="amb-knob"
  parts={{
    panel: <ScaleRing count={13} />,
    base: <KnobBody flush />,
    actuator: <MyPointer />,
  }}
/>
```

Parts drop into four frames — `panel`, `base`, `actuator`, `fixture` — painted
in that order, of which only `actuator` moves. The control publishes its state
on its own root as `--ambx-percent`, `--ambx-angle`, `--ambx-size` and friends,
so a part can be pure CSS with no React state at all; `useControlState()` is the
same data typed, for parts that need JS.

Mechanisms: `AmbientRotary`, `AmbientTravel`, `AmbientPress`, `AmbientLatch`,
`AmbientBank`. Or take the hooks — `useRotary`, `useTravel`, `usePress`,
`useLatch`, `useBank` — and render the markup yourself.

Full guide: [Composing controls](https://kikkupico.github.io/ambientcss/ambient-components/composing).
