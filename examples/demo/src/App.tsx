import { useCallback, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientKnob,
  AmbientFader,
  AmbientSlider,
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
  const [sliderValue, setSliderValue] = useState(50);
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
      className="amb-surface appliance-frame"
      theme={{
        lightX: light.lightX,
        lightY: -1,
        keyLight: light.keyLight,
        fillLight: light.fillLight,
        lightHue: 234,
        lightSaturation: light.lightSaturation,
      }}
    >
      <div className="appliance">
        <AmbientPanel className="panel left">
          <h2 className="panel-title">Sample Components</h2>
          <p className="panel-subtitle">Touch points for a modular system.</p>
          <div className="stack">
            <div className="row align-center gap-lg">
              <AmbientKnob value={knobValue} onChange={setKnobValue} label="Gain" />
              <AmbientFader value={faderValue} min={0} max={100} onChange={setFaderValue} label="Mix" />
              <AmbientSwitch checked={switchOn} onCheckedChange={setSwitchOn} led />
            </div>
            <div className="row">
              <AmbientSlider value={sliderValue} min={0} max={100} onChange={setSliderValue} label="Depth" />
            </div>
          </div>
        </AmbientPanel>

        <AmbientPanel className="panel center">
          <div className="center-header">
            <div className="brand">
              a m b i e n t <span>CSS</span>
            </div>
            <div className="subtitle">Lighting appliance · Model 12</div>
          </div>

          <div className="section">
            <div className="section-title">Day / Night</div>
            <div className="row">
              <DayNightWatchSwitch
                night={nightMode}
                onToggle={(nextNight) => {
                  setNightMode(nextNight);
                  animateTo(nextNight ? NIGHT : DAY);
                }}
              />
            </div>
          </div>

          <div className="section">
            <div className="section-title">Global Lighting</div>
            <div className="controls-grid">
              <AmbientKnob
                value={Math.round((light.lightX + 1) * 50)}
                onChange={(next) => setLight((prev) => ({ ...prev, lightX: next / 50 - 1 }))}
                label="Azimuth"
              />
              <AmbientFader
                value={Math.round(light.keyLight * 100)}
                min={0}
                max={100}
                onChange={(next) => setLight((prev) => ({ ...prev, keyLight: next / 100 }))}
                label="Key"
              />
              <AmbientFader
                value={Math.round(light.fillLight * 100)}
                min={0}
                max={100}
                onChange={(next) => setLight((prev) => ({ ...prev, fillLight: next / 100 }))}
                label="Fill"
              />
              <AmbientSlider
                value={Math.round(light.lightSaturation)}
                min={0}
                max={30}
                onChange={(next) => setLight((prev) => ({ ...prev, lightSaturation: next }))}
                label="Saturation"
              />
            </div>
          </div>
        </AmbientPanel>

        <AmbientPanel className="panel right">
          <h2 className="panel-title">Surface Treatments</h2>
          <p className="panel-subtitle">Edges, elevation, and material studies.</p>
          <div className="treatment-grid">
            <div className="treatment">
              <div className="circle ambient amb-fillet amb-elevation-0" />
              <span>Fillet 0</span>
            </div>
            <div className="treatment">
              <div className="circle ambient amb-fillet amb-elevation-1" />
              <span>Fillet 1</span>
            </div>
            <div className="treatment">
              <div className="circle ambient amb-fillet amb-elevation-2" />
              <span>Fillet 2</span>
            </div>
            <div className="treatment">
              <div className="circle ambient amb-fillet amb-elevation-3" />
              <span>Fillet 3</span>
            </div>
            <div className="treatment">
              <div className="circle ambient amb-round amb-elevation-1" />
              <span>Round</span>
            </div>
            <div className="treatment">
              <div className="circle ambient amb-square amb-elevation-2" />
              <span>Square</span>
            </div>
          </div>
        </AmbientPanel>
      </div>
    </AmbientProvider>
  );
}
