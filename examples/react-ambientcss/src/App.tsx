import { useState } from "react";
import {
  AmbientProvider,
  AmbientButton,
  AmbientKnob,
  AmbientSlider,
  AmbientSwitch,
} from "@ambientcss/components";

export function App() {
  const [volume, setVolume] = useState(75);
  const [bass, setBass] = useState(50);
  const [treble, setTreble] = useState(60);
  const [enabled, setEnabled] = useState(true);

  return (
    <AmbientProvider className="amb-surface app">
      <div className="panel ambient amb-surface amb-elevation-2 amb-chamfer">
        <h1 className="title amb-heading-2">AmbientCSS</h1>

        <div className="row">
          <AmbientKnob value={bass} onChange={setBass} label="Bass" />
          <AmbientKnob value={volume} onChange={setVolume} label="Volume" />
          <AmbientKnob value={treble} onChange={setTreble} label="Treble" />
        </div>

        <div className="row">
          <AmbientSlider
            value={volume}
            min={0}
            max={100}
            onChange={setVolume}
            label="Master"
          />
        </div>

        <div className="row">
          <AmbientSwitch
            checked={enabled}
            onCheckedChange={setEnabled}
            led
            label="Power"
          />
          <AmbientButton onClick={() => { setVolume(75); setBass(50); setTreble(60); }}>
            Reset
          </AmbientButton>
        </div>
      </div>
    </AmbientProvider>
  );
}
