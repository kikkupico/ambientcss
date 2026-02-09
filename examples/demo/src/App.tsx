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
      className="amb-surface app-shell"
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
        <AmbientPanel className="panel panel--left">
          <div className="panel-title">Sample components</div>
          <div className="sample-stack">
            <div className="sample-card amb-surface">
              <div className="sample-dot amb-fillet amb-elevation-2" />
              <div>
                <div className="sample-label">Edge tile</div>
                <div className="sample-meta">Inset &amp; raised</div>
              </div>
            </div>
            <div className="sample-card amb-surface">
              <div className="sample-pill amb-fillet amb-elevation-1" />
              <div>
                <div className="sample-label">Toggle track</div>
                <div className="sample-meta">Soft radius</div>
              </div>
            </div>
            <div className="sample-card amb-surface">
              <div className="sample-square amb-fillet amb-elevation-3" />
              <div>
                <div className="sample-label">Depth badge</div>
                <div className="sample-meta">Elevated</div>
              </div>
            </div>
          </div>
        </AmbientPanel>

        <AmbientPanel className="panel panel--center">
          <div className="logo">a m b i e n t</div>
          <div className="subtitle">Lighting Appliance Console</div>

          <div className="row day-night-row">
            <span className="section-label">Day / Night</span>
            <DayNightWatchSwitch
              night={nightMode}
              onToggle={(nextNight) => {
                setNightMode(nextNight);
                animateTo(nextNight ? NIGHT : DAY);
              }}
            />
          </div>

          <div className="controls">
            <div className="section-label">Global lighting</div>
            <div className="row" style={{ gap: "2.5rem", alignItems: "center" }}>
              <AmbientKnob value={knobValue} onChange={setKnobValue} label="Glow" />
              <AmbientFader value={faderValue} min={0} max={100} onChange={setFaderValue} label="Fill" />
              <AmbientSwitch checked={switchOn} onCheckedChange={setSwitchOn} led />
            </div>
            <div className="row" style={{ marginTop: "1.5rem" }}>
              <AmbientSlider value={sliderValue} min={0} max={100} onChange={setSliderValue} label="Beam" />
            </div>
          </div>
        </AmbientPanel>

        <AmbientPanel className="panel panel--right">
          <div className="panel-title">Surface treatments</div>
          <div className="treatment-grid">
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-0" />
              <span>Edge</span>
            </div>
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-1" />
              <span>Lift</span>
            </div>
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-2" />
              <span>Depth</span>
            </div>
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-3" />
              <span>Glow</span>
            </div>
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-4" />
              <span>Peak</span>
            </div>
            <div className="treatment-item">
              <div className="treatment-circle amb-fillet amb-elevation-5" />
              <span>Rim</span>
            </div>
          </div>
        </AmbientPanel>
      </div>
    </AmbientProvider>
  );
}
