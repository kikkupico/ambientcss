import React, { useState } from "react";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientButton,
  AmbientKnob,
  AmbientSwitch,
} from "@ambientcss/components";

export default function App() {
  const [gain, setGain] = useState(50);
  const [armed, setArmed] = useState(false);

  return (
    <div className="bg-slate-300 min-h-screen flex items-center justify-center">
      <AmbientProvider theme={{ lightHue: 220, lightSaturation: 14, lumeHue: 190, keyLight: 0.9, fillLight: 0.72 }}>
        <AmbientPanel className="flex flex-col gap-4 p-6 items-center">
          <AmbientButton>Play</AmbientButton>
          <AmbientSwitch label="Arm" checked={armed} onCheckedChange={setArmed} led="#ef4444" />
          <AmbientKnob label="Gain" value={gain} onChange={setGain} />
        </AmbientPanel>
      </AmbientProvider>
    </div>
  );
}
