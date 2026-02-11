import { useCallback, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientButton,
  AmbientKnob,
  AmbientFader,
  AmbientSlider,
  AmbientSwitch,
} from "@ambientcss/components";
import { DayNightWatchSwitch } from "./components/DayNightWatchSwitch";

type LightState = {
  lightX: number;
  lightY: number;
  keyLight: number;
  fillLight: number;
  lightSaturation: number;
};

const DAY: LightState = { lightX: -1, lightY: -1, keyLight: 0.9, fillLight: 0.7, lightSaturation: 0 };
const NIGHT: LightState = { lightX: 1, lightY: -1, keyLight: 0.3, fillLight: 0.1, lightSaturation: 15 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ── Treatment circles for the right-hand grid ─────────────────────────── */

const TREATMENTS = [
  /* Row 1 – Fillets */
  { classes: "amb-fillet amb-elevation-0", label: "Fillet" },
  { classes: "amb-fillet-2 amb-elevation-0", label: "Fillet 2" },
  { classes: "amb-fillet-minus-1 amb-elevation-0", label: "Fillet -1" },
  /* Row 2 – Chamfers & mixed */
  { classes: "amb-chamfer amb-elevation-0", label: "Chamfer" },
  { classes: "amb-chamfer-2 amb-elevation-0", label: "Chamfer 2" },
  { classes: "amb-chamfer amb-elevation-1", label: "Chamfer\u00a0+\u00a0Elev" },
  /* Row 3 – Elevations */
  { classes: "amb-fillet amb-elevation-1", label: "Elev 1" },
  { classes: "amb-fillet amb-elevation-2", label: "Elev 2" },
  { classes: "amb-fillet amb-elevation-3", label: "Elev 3" },
];

export function App() {
  const [light, setLight] = useState<LightState>(DAY);
  const [nightMode, setNightMode] = useState(false);

  /* Left-section interactive controls */
  const [knobValue, setKnobValue] = useState(50);
  const [faderValue, setFaderValue] = useState(50);
  const [sliderValue, setSliderValue] = useState(50);
  const [switchOn, setSwitchOn] = useState(false);

  /* Centre-section lighting controls (0-100 range for knob/slider UI) */
  const [keyLightKnob, setKeyLightKnob] = useState(90);
  const [fillLightKnob, setFillLightKnob] = useState(70);
  const [lightXSlider, setLightXSlider] = useState(0);   // 0-100 maps to -1..1
  const [lightYFader, setLightYFader] = useState(0);      // 0-100 maps to -1..1

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
      const next: LightState = {
        lightX: lerp(start.lightX, target.lightX, t),
        lightY: lerp(start.lightY, target.lightY, t),
        keyLight: lerp(start.keyLight, target.keyLight, t),
        fillLight: lerp(start.fillLight, target.fillLight, t),
        lightSaturation: lerp(start.lightSaturation, target.lightSaturation, t),
      };
      setLight(next);
      /* Animate knobs/sliders in sync */
      setKeyLightKnob(Math.round(next.keyLight * 100));
      setFillLightKnob(Math.round(next.fillLight * 100));
      setLightXSlider(Math.round((next.lightX + 1) * 50));
      setLightYFader(Math.round((next.lightY + 1) * 50));
      if (t >= 1) {
        animRef.current = null;
      } else {
        animRef.current = requestAnimationFrame(step);
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
        lightY: light.lightY,
        keyLight: light.keyLight,
        fillLight: light.fillLight,
        lightHue: 234,
        lightSaturation: light.lightSaturation,
      }}
    >
      {/* ── Appliance shell ───────────────────────────────────────────── */}
      <AmbientPanel className="appliance">

        {/* ── LEFT SECTION: Sample components ─────────────────────────── */}
        <div className="section section-left">
          <div className="section-heading">Components</div>

          <div className="component-grid">
            <div className="component-item">
              <AmbientKnob value={knobValue} onChange={setKnobValue} label="Knob" />
            </div>

            <div className="component-item-row">
              <AmbientSlider value={sliderValue} min={0} max={100} onChange={setSliderValue} label="Slider" />
              <div className="component-item">
                <AmbientSwitch checked={switchOn} onCheckedChange={setSwitchOn} led label="Switch" />
              </div>
              <AmbientFader value={faderValue} min={0} max={100} onChange={setFaderValue} label="Fader" />
            </div>
            <div className="button-row">
              <AmbientButton>Play</AmbientButton>
              <AmbientButton>Stop</AmbientButton>
              <AmbientButton>Vibe</AmbientButton>
            </div>

            {/* LED indicator strip */}
            <div className="led-strip">
              <div className="amb-led amb-emit-green" style={{ "--amb-led-color": "#4ade80" } as React.CSSProperties} />
              <div className="amb-led amb-emit-amber" style={{ "--amb-led-color": "#f59e0b" } as React.CSSProperties} />
              <div className="amb-led amb-emit-red" style={{ "--amb-led-color": "#ef4444" } as React.CSSProperties} />
            </div>
          </div>
        </div>

        {/* ── CENTRE SECTION: Title + Day/Night + Global lighting ──── */}
        <div className="section section-centre">
          <div className="title">
            a m b i e n t
            <div className="title-sub">CSS</div>
          </div>

          <DayNightWatchSwitch
            night={nightMode}
            onToggle={(nextNight) => {
              setNightMode(nextNight);
              animateTo(nextNight ? NIGHT : DAY);
            }}
          />

          <div className="centre-controls">
            <div className="section-heading">Lighting</div>

            <div className="control-group">
              <AmbientSlider
                value={lightXSlider}
                min={0}
                max={100}
                label="Light X"
                onChange={(v) => {
                  setLightXSlider(v);
                  setLight((prev) => ({ ...prev, lightX: (v / 50) - 1 }));
                }}
              />
            </div>

            <div className="control-row">
              <div className="control-group">
                <AmbientKnob
                  value={keyLightKnob}
                  min={0}
                  max={100}
                  label="Key Light"
                  onChange={(v) => {
                    setKeyLightKnob(v);
                    setLight((prev) => ({ ...prev, keyLight: v / 100 }));
                  }}
                />
              </div>

              <div className="control-group">
                <AmbientFader
                  value={lightYFader}
                  min={0}
                  max={100}
                  onChange={(v) => {
                    setLightYFader(v);
                    setLight((prev) => ({ ...prev, lightY: (v / 50) - 1 }));
                  }}
                  label="Light Y"
                />
              </div>

              <div className="control-group">
                <AmbientKnob
                  value={fillLightKnob}
                  min={0}
                  max={100}
                  label="Fill Light"
                  onChange={(v) => {
                    setFillLightKnob(v);
                    setLight((prev) => ({ ...prev, fillLight: v / 100 }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SECTION: Treatment circle grid ────────────────────── */}
        <div className="section section-right">
          <div className="section-heading">Treatments</div>

          <div className="circle-grid">
            {TREATMENTS.map(({ classes, label }) => (
              <div className="circle-cell" key={label}>
                <div className={`grid-circle ambient amb-surface ${classes}`} />
                <span className="grid-circle-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </AmbientPanel>
    </AmbientProvider>
  );
}
