import React, { type ReactNode, useState } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKnob,
  AmbientPanel,
  AmbientProvider,
  AmbientSlider,
  AmbientSwitch
} from "@ambientcss/components";

function DemoShell({ children }: { children: ReactNode }) {
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
      <div className="docs-demo-shell docs-bright-theme">{children}</div>
    </AmbientProvider>
  );
}

export function ProviderPreview() {
  const [warm, setWarm] = useState(false);

  return (
    <DemoShell>
      <div className="docs-demo-stack">
        <AmbientSwitch label="Warm Theme" checked={warm} onCheckedChange={setWarm} />
        <AmbientProvider
          theme={
            warm
              ? { lightHue: 28, lightSaturation: 18, lumeHue: 36, keyLight: 0.9, fillLight: 0.7 }
              : { lightHue: 220, lightSaturation: 14, lumeHue: 190, keyLight: 0.9, fillLight: 0.72 }
          }
        >
          <AmbientPanel className="docs-demo-panel">
            <AmbientButton>{warm ? "Warm" : "Cool"}</AmbientButton>
            <AmbientKnob value={45} label="Drive" />
          </AmbientPanel>
        </AmbientProvider>
      </div>
    </DemoShell>
  );
}

export function PanelPreview() {
  return (
    <DemoShell>
      <AmbientPanel className="docs-demo-panel">
        <AmbientButton>Power</AmbientButton>
        <AmbientSwitch label="Bypass" defaultChecked />
      </AmbientPanel>
    </DemoShell>
  );
}

export function ButtonPreview() {
  const [count, setCount] = useState(0);

  return (
    <DemoShell>
      <div className="docs-demo-stack">
        <div className="docs-demo-row">
          <AmbientButton onClick={() => setCount((n) => n + 1)}>Trigger</AmbientButton>
          <AmbientButton disabled>Disabled</AmbientButton>
        </div>
        <p className="docs-demo-text">Triggered: {count}</p>
      </div>
    </DemoShell>
  );
}

export function SwitchPreview() {
  const [enabled, setEnabled] = useState(true);

  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientSwitch label="Power" checked={enabled} onCheckedChange={setEnabled} led />
        <AmbientSwitch label="Record" defaultChecked led="#ef4444" />
        <AmbientSwitch label="Small" size="sm" />
        <AmbientSwitch label="Large" size="lg" />
      </div>
    </DemoShell>
  );
}

export function KnobPreview() {
  const [value, setValue] = useState(42);

  return (
    <DemoShell>
      <div className="docs-demo-stack">
        <AmbientKnob label="Drive" value={value} min={0} max={100} step={1} onChange={setValue} />
        <p className="docs-demo-text">Value: {value}</p>
      </div>
    </DemoShell>
  );
}

export function SliderFaderPreview() {
  const [pan, setPan] = useState(50);
  const [level, setLevel] = useState(72);

  return (
    <DemoShell>
      <div className="docs-demo-row docs-demo-row-wide">
        <div className="docs-demo-stack">
          <AmbientSlider label="Pan" value={pan} min={0} max={100} onChange={setPan} />
          <p className="docs-demo-text">Pan: {pan}</p>
        </div>
        <div className="docs-demo-stack">
          <AmbientFader label="Level" value={level} min={0} max={100} onChange={setLevel} />
          <p className="docs-demo-text">Level: {level}</p>
        </div>
      </div>
    </DemoShell>
  );
}

export function CompositionPreview() {
  const [armed, setArmed] = useState(false);
  const [gain, setGain] = useState(45);
  const [level, setLevel] = useState(68);

  return (
    <DemoShell>
      <AmbientPanel className="docs-demo-panel docs-demo-panel-grid">
        <AmbientButton>Play</AmbientButton>
        <AmbientSwitch label="Arm" checked={armed} onCheckedChange={setArmed} led="#ef4444" />
        <AmbientKnob label="Gain" value={gain} onChange={setGain} />
        <AmbientFader label="Level" value={level} onChange={setLevel} />
      </AmbientPanel>
    </DemoShell>
  );
}

/* Neutral demos for the grounded-counterpart comparisons: no DemoShell
   theme — the live stage must sit under the same default lighting the
   calibration renders use. Values mirror the referent shots
   (ambient3d/ground_components.py). */
export function GroundedButtonDemo() {
  return <AmbientButton>OK</AmbientButton>;
}

export function GroundedKnobDemo() {
  const [v, setV] = useState(33);
  return <AmbientKnob aria-label="Knob" value={v} min={0} max={100} onChange={setV} />;
}

export function GroundedSwitchDemo() {
  const [on, setOn] = useState(false);
  return <AmbientSwitch aria-label="Switch" checked={on} onCheckedChange={setOn} />;
}

export function GroundedFaderDemo() {
  const [v, setV] = useState(50);
  return <AmbientFader aria-label="Fader" value={v} onChange={setV} />;
}

export function GroundedSliderDemo() {
  const [v, setV] = useState(50);
  return <AmbientSlider aria-label="Slider" value={v} onChange={setV} />;
}
