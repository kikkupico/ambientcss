import { useCallback, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientKnob,
  AmbientFader,
  AmbientSwitch,
} from "@ambientcss/components";
import { DayNightWatchSwitch } from "./components/DayNightWatchSwitch";

type LightState = {
  lightX: number;
  keyLight: number;
  fillLight: number;
  lightSaturation: number;
};

const DAY: LightState = { lightX: -1, keyLight: 0.9, fillLight: 0.7, lightSaturation: 0 };
const NIGHT: LightState = { lightX: 1, keyLight: 0.3, fillLight: 0.1, lightSaturation: 15 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function App() {
  const [light, setLight] = useState<LightState>(DAY);
  const [nightMode, setNightMode] = useState(false);
  const [knobValue, setKnobValue] = useState(50);
  const [faderValue, setFaderValue] = useState(50);
  const [switchOn, setSwitchOn] = useState(false);
  const animRef = useRef<number | null>(null);
  const lightRef = useRef(light);
  lightRef.current = light;

  const animateTo = useCallback((target: LightState) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    const start = { ...lightRef.current };
    const duration = 3000;
    let startTime: number | null = null;

    function step(time: number) {
      if (startTime === null) startTime = time;
      const t = Math.min((time - startTime) / duration, 1);
      setLight({
        lightX: lerp(start.lightX, target.lightX, t),
        keyLight: lerp(start.keyLight, target.keyLight, t),
        fillLight: lerp(start.fillLight, target.fillLight, t),
        lightSaturation: lerp(start.lightSaturation, target.lightSaturation, t),
      });
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    }

    animRef.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AmbientProvider
      className="amb-surface container"
      theme={{
        lightX: light.lightX,
        lightY: -1,
        keyLight: light.keyLight,
        fillLight: light.fillLight,
        lightHue: 234,
        lightSaturation: light.lightSaturation,
      }}
    >
      <div className="content">
        <AmbientPanel className="box logo">
          a m b i e n t <br />
          <div style={{ fontSize: 35 }}>CSS</div>

          <div className="row" style={{ marginTop: "1rem" }}>
            <DayNightWatchSwitch
              night={nightMode}
              onToggle={(nextNight) => {
                setNightMode(nextNight);
                animateTo(nextNight ? NIGHT : DAY);
              }}
            />
          </div>

          <div className="row" style={{ marginTop: "2rem", gap: "2rem", alignItems: "center" }}>
            <AmbientKnob value={knobValue} onChange={setKnobValue} label="Knob" />
            <AmbientFader value={faderValue} min={0} max={100} onChange={setFaderValue} label="Fader" />
            <AmbientSwitch checked={switchOn} onCheckedChange={setSwitchOn} />
          </div>

          <div className="row" style={{ marginTop: "2rem" }}>
            <div className="circle ambient amb-fillet amb-elevation-0" />
            <div className="circle ambient amb-fillet amb-elevation-1" />
            <div className="circle ambient amb-fillet amb-elevation-2" />
            <div className="circle ambient amb-fillet amb-elevation-3" />
          </div>
        </AmbientPanel>
      </div>
    </AmbientProvider>
  );
}
