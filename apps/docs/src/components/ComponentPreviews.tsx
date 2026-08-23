import React, { type ReactNode, useState } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKitProvider,
  AmbientKnob,
  AmbientPanel,
  AmbientProvider,
  AmbientSelect,
  AmbientSlider,
  AmbientSwitch,
  ConsoleKnob,
  ConsoleToggle,
  consoleKit
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
        <AmbientSwitch label="Warm Theme" value={warm} onChange={setWarm} />
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
        <AmbientSwitch label="Bypass" defaultValue />
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
        <AmbientSwitch label="Power" value={enabled} onChange={setEnabled} led />
        <AmbientSwitch label="Record" defaultValue led="#ef4444" />
        <AmbientSwitch label="Small" size="sm" />
        <AmbientSwitch label="Large" size="lg" />
      </div>
    </DemoShell>
  );
}

const BANK = [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }];

export function SelectPreview() {
  const [bank, setBank] = useState("3");

  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientSelect
          label="Bank"
          options={BANK}
          value={bank}
          onChange={(next) => setBank(next as string)}
          color="#00b4dc"
        />
        <AmbientSelect
          label="Accent"
          options={BANK}
          defaultValue="2"
        />
      </div>
    </DemoShell>
  );
}

export function SelectMultiPreview() {
  const [tracks, setTracks] = useState<string[]>(["A", "C"]);

  return (
    <DemoShell>
      <div className="docs-demo-stack">
        <AmbientSelect
          multiple
          orientation="horizontal"
          label="Tracks"
          color="#4ade80"
          options={[{ value: "A" }, { value: "B" }, { value: "C" }, { value: "D" }]}
          value={tracks}
          onChange={(next) => setTracks(next as string[])}
        />
        <p className="docs-demo-text">Armed: {tracks.length ? tracks.join(", ") : "none"}</p>
      </div>
    </DemoShell>
  );
}

export function SelectSizesPreview() {
  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientSelect size="sm" options={BANK} defaultValue="1" color="#00b4dc" />
        <AmbientSelect size="md" options={BANK} defaultValue="2" color="#00b4dc" />
        <AmbientSelect size="lg" options={BANK} defaultValue="3" color="#00b4dc" />
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

export function KnobKnurlingPreview() {
  const [ribbed, setRibbed] = useState(42);
  const [smooth, setSmooth] = useState(70);
  const [wheel, setWheel] = useState(25);

  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientKnob label="Knurled" value={ribbed} onChange={setRibbed} />
        <AmbientKnob label="Smooth" knurling={false} value={smooth} onChange={setSmooth} />
        <AmbientKnob
          label="Shiny"
          knurling={false}
          material="shiny"
          value={wheel}
          onChange={setWheel}
        />
      </div>
    </DemoShell>
  );
}

export function KnobMarkersPreview() {
  const [none, setNone] = useState(42);
  const [ends, setEnds] = useState(15);
  const [full, setFull] = useState(70);

  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientKnob label="None" value={none} onChange={setNone} />
        <AmbientKnob label="Ends" markers="ends" value={ends} onChange={setEnds} />
        <AmbientKnob label="Full" markers="full" value={full} onChange={setFull} />
      </div>
    </DemoShell>
  );
}

export function KnobIndicatorPreview() {
  const [circle, setCircle] = useState(42);
  const [rectangle, setRectangle] = useState(70);

  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientKnob label="Circle" value={circle} onChange={setCircle} />
        <AmbientKnob
          label="Rectangle"
          indicator="rectangle"
          value={rectangle}
          onChange={setRectangle}
        />
      </div>
    </DemoShell>
  );
}

export function ButtonShapesPreview() {
  return (
    <DemoShell>
      <div className="docs-demo-row">
        <AmbientButton>Play</AmbientButton>
        <AmbientButton shape="round">On</AmbientButton>
        <AmbientButton shape="round" material="shiny" aria-label="Metal button" />
        <AmbientButton shape="square">FX</AmbientButton>
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
        <AmbientSwitch label="Arm" value={armed} onChange={setArmed} led="#ef4444" />
        <AmbientKnob label="Gain" value={gain} onChange={setGain} />
        <AmbientFader label="Level" value={level} onChange={setLevel} />
      </AmbientPanel>
    </DemoShell>
  );
}

/* ── Kits ──────────────────────────────────────────────────────────────
   The console kit's samples. Note what is NOT here: no `knurling`,
   `markers` or `indicator` inside the provider. Those are grounded's
   vocabulary, and passing them under another kit is exactly the case
   `looks` warns about — a docs page should not be printing that warning
   into the reader's console.

   Everything below sits in `.docs-kit-row`, which is a fixed height rather
   than a natural one: the console knob reserves layout room for the marks
   printed around it and the grounded knob does not, so left to themselves
   two rows of the same controls come out different heights and their
   captions land on different lines. */

export function KitComparisonPreview() {
  const [level, setLevel] = useState(68);
  const [on, setOn] = useState(true);
  const [channel, setChannel] = useState<string | string[]>("1");

  /* One call site, rendered twice. The props are identical and the state
     is shared — the only difference between the columns is the kit above
     them, which is the whole claim the page makes. */
  const controls = (
    <>
      <AmbientKnob label="LEVEL" value={level} onChange={setLevel} />
      <AmbientSwitch label="ON" value={on} onChange={setOn} />
      {/* Legend keys: the selection reads through the text taking the
          lamp colour, not a numeral-plus-LED. */}
      <AmbientSelect
        orientation="horizontal"
        options={[
          { value: "1", label: "1", ariaLabel: "Channel 1" },
          { value: "2", label: "2", ariaLabel: "Channel 2" },
          { value: "3", label: "3", ariaLabel: "Channel 3" }
        ]}
        value={channel}
        onChange={setChannel}
      />
    </>
  );

  return (
    <DemoShell>
      <div className="docs-kit-columns">
        <div className="docs-kit-column">
          <div className="docs-kit-row">{controls}</div>
          <p className="docs-demo-text">grounded (default)</p>
        </div>
        <div className="docs-kit-column">
          <AmbientKitProvider kit={consoleKit}>
            <div className="docs-kit-row">{controls}</div>
          </AmbientKitProvider>
          <p className="docs-demo-text">consoleKit</p>
        </div>
      </div>
    </DemoShell>
  );
}

export function ConsoleKitPreview() {
  const [gain, setGain] = useState(40);
  const [bare, setBare] = useState(72);
  const [arm, setArm] = useState(false);
  const [channel, setChannel] = useState<string | string[]>("1");

  /* The bare knob gets its own column rather than standing next to the
     marked one: a knob with the centre mark printed above it is a taller
     box than one without, so side by side in a single row the two sit at
     visibly different heights — which reads as a layout slip rather than
     as the prop doing its job. */
  return (
    <DemoShell>
      <AmbientKitProvider kit={consoleKit}>
        <div className="docs-demo-stack">
          <div className="docs-kit-columns">
            <div className="docs-kit-column">
              <div className="docs-kit-row">
                <ConsoleKnob label="GAIN" value={gain} onChange={setGain} />
                <ConsoleToggle label="ARM" value={arm} onChange={setArm} />
              </div>
              <p className="docs-demo-text">default</p>
            </div>
            <div className="docs-kit-column">
              <div className="docs-kit-row">
                <ConsoleKnob
                  label="BARE"
                  mark={false}
                  legend={false}
                  value={bare}
                  onChange={setBare}
                />
              </div>
              <p className="docs-demo-text">
                <code>mark={"{false}"} legend={"{false}"}</code>
              </p>
            </div>
          </div>
          <div className="docs-kit-row">
            {/* Legend keys: the selected key's text takes the lamp colour. */}
            <AmbientSelect
              orientation="horizontal"
              options={[
                { value: "1", label: "1", ariaLabel: "Channel 1" },
                { value: "2", label: "2", ariaLabel: "Channel 2" },
                { value: "3", label: "3", ariaLabel: "Channel 3" }
              ]}
              value={channel}
              onChange={setChannel}
            />
          </div>
          <p className="docs-demo-text">
            Gain {gain} · Bare {bare} · {arm ? "armed" : "safe"} · ch {channel}
          </p>
        </div>
      </AmbientKitProvider>
    </DemoShell>
  );
}

export function KitAccentPreview() {
  const [green, setGreen] = useState(55);
  const [amber, setAmber] = useState(30);
  const [sendA, setSendA] = useState<string | string[]>("a");
  const [sendB, setSendB] = useState<string | string[]>("a");

  return (
    <DemoShell>
      <AmbientKitProvider kit={consoleKit}>
        <div className="docs-kit-columns">
          <div className="docs-kit-column" style={{ "--ambx-accent": "#00a84d" } as React.CSSProperties}>
            <div className="docs-kit-row">
              <ConsoleKnob label="SEND" value={green} onChange={setGreen} />
              <ConsoleToggle label="ON" defaultValue />
            </div>
            <div className="docs-kit-row">
              {/* Legends, not numerals: these keys read through the text
                  taking the column's accent, which is the point being shown. */}
              <AmbientSelect
                orientation="horizontal"
                options={[
                  { value: "a", label: "A", ariaLabel: "Send A" },
                  { value: "b", label: "B", ariaLabel: "Send B" },
                  { value: "c", label: "C", ariaLabel: "Send C" }
                ]}
                value={sendA}
                onChange={setSendA}
              />
            </div>
            <p className="docs-demo-text">#00a84d</p>
          </div>
          <div className="docs-kit-column" style={{ "--ambx-accent": "#f59e0b" } as React.CSSProperties}>
            <div className="docs-kit-row">
              <ConsoleKnob label="SEND" value={amber} onChange={setAmber} />
              <ConsoleToggle label="ON" defaultValue />
            </div>
            <div className="docs-kit-row">
              <AmbientSelect
                orientation="horizontal"
                options={[
                  { value: "a", label: "A", ariaLabel: "Send A" },
                  { value: "b", label: "B", ariaLabel: "Send B" },
                  { value: "c", label: "C", ariaLabel: "Send C" }
                ]}
                value={sendB}
                onChange={setSendB}
              />
            </div>
            <p className="docs-demo-text">#f59e0b</p>
          </div>
        </div>
      </AmbientKitProvider>
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

export function GroundedButtonRoundDemo() {
  return <AmbientButton shape="round">On</AmbientButton>;
}

export function GroundedButtonSquareDemo() {
  return <AmbientButton shape="square">FX</AmbientButton>;
}

export function GroundedKnobDemo({
  knurling,
  markers,
  indicator
}: {
  knurling?: boolean;
  markers?: "none" | "ends" | "full";
  indicator?: "rectangle" | "circle";
}) {
  const [v, setV] = useState(33);
  return (
    <AmbientKnob
      aria-label="Knob"
      knurling={knurling}
      markers={markers}
      indicator={indicator}
      value={v}
      min={0}
      max={100}
      onChange={setV}
    />
  );
}

export function GroundedSwitchDemo() {
  const [on, setOn] = useState(false);
  return <AmbientSwitch aria-label="Switch" value={on} onChange={setOn} />;
}

export function GroundedFaderDemo() {
  const [v, setV] = useState(50);
  return <AmbientFader aria-label="Fader" value={v} onChange={setV} />;
}

export function GroundedSliderDemo() {
  const [v, setV] = useState(50);
  return <AmbientSlider aria-label="Slider" value={v} onChange={setV} />;
}
