import { useState, type CSSProperties, type ReactNode } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKnob,
  AmbientSlider,
  AmbientSwitch,
  type AmbientTheme,
} from "@ambientcss/components";
import {
  Ambient3DProvider,
  AmbientButton3D,
  AmbientFader3D,
  AmbientKnob3D,
  AmbientPanel3D,
  AmbientSlider3D,
  AmbientStage,
  AmbientSurface3D,
  AmbientSwitch3D,
  DEFAULT_THEME,
  type AmbientEdge,
  type AmbientMaterial,
  type AmbientSurface,
} from "./ambient3d";

type Theme = typeof DEFAULT_THEME;

type SectionProps = {
  label: string;
  description: string;
  children: ReactNode;
};

function Section({ label, description, children }: SectionProps) {
  return (
    <section className="a3d-section">
      <div className="a3d-section-label">{label}</div>
      <p className="a3d-section-desc">{description}</p>
      {children}
    </section>
  );
}

type SplitProps = {
  left: ReactNode;
  right: ReactNode;
};

function Split({ left, right }: SplitProps) {
  return (
    <div className="a3d-split">
      <div className="a3d-pane a3d-pane-3d">
        <span className="a3d-pane-tag">three.js · real 3D</span>
        <div className="a3d-canvas">{left}</div>
      </div>
      <div className="a3d-pane a3d-pane-css">
        <span className="a3d-pane-tag">ambient css · 2D</span>
        {right}
      </div>
    </div>
  );
}

function LightControls({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div className="a3d-controls">
      <div className="a3d-control">
        <label>Light X ({theme.lightX.toFixed(2)})</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={theme.lightX}
          onChange={(e) => setTheme({ ...theme, lightX: Number(e.target.value) })}
        />
      </div>
      <div className="a3d-control">
        <label>Light Y ({theme.lightY.toFixed(2)})</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={theme.lightY}
          onChange={(e) => setTheme({ ...theme, lightY: Number(e.target.value) })}
        />
      </div>
      <div className="a3d-control">
        <label>Key light ({theme.keyLight.toFixed(2)})</label>
        <input
          type="range"
          min="0"
          max="1.2"
          step="0.01"
          value={theme.keyLight}
          onChange={(e) => setTheme({ ...theme, keyLight: Number(e.target.value) })}
        />
      </div>
      <div className="a3d-control">
        <label>Fill light ({theme.fillLight.toFixed(2)})</label>
        <input
          type="range"
          min="0"
          max="1.2"
          step="0.01"
          value={theme.fillLight}
          onChange={(e) => setTheme({ ...theme, fillLight: Number(e.target.value) })}
        />
      </div>
      <div className="a3d-control">
        <label>Hue ({theme.lightHue.toFixed(0)}°)</label>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={theme.lightHue}
          onChange={(e) => setTheme({ ...theme, lightHue: Number(e.target.value) })}
        />
      </div>
      <div className="a3d-control">
        <label>Saturation ({theme.lightSaturation.toFixed(0)}%)</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={theme.lightSaturation}
          onChange={(e) => setTheme({ ...theme, lightSaturation: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

/* ── Section-level 3D scenes ───────────────────────────────────────────── */

function OrbitScene() {
  return (
    <AmbientStage cameraDistance={7}>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const edges: AmbientEdge[] = ["chamfer", "fillet", "chamfer-2"];
        return (
          <AmbientSurface3D
            key={i}
            width={0.9}
            height={0.9}
            edge={edges[i % 3] ?? "fillet"}
            surface="flat"
            elevation={2}
            position={[(col - 1) * 1.4, -(row - 1) * 1.4, 0]}
          />
        );
      })}
    </AmbientStage>
  );
}

function ElevationScene() {
  const stops: (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
  return (
    <AmbientStage cameraDistance={6}>
      {stops.map((elev, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <AmbientSurface3D
            key={elev}
            width={1}
            height={1}
            edge="chamfer"
            surface="flat"
            elevation={elev}
            position={[(col - 0.5) * 1.6, (0.5 - row) * 1.6, 0]}
          />
        );
      })}
    </AmbientStage>
  );
}

function SurfaceScene() {
  const surfs: AmbientSurface[] = ["concave", "flat", "convex"];
  return (
    <AmbientStage cameraDistance={7}>
      {surfs.map((s, i) => (
        <AmbientSurface3D
          key={s}
          width={1.4}
          height={1.4}
          edge="chamfer-2"
          surface={s}
          elevation={2}
          position={[(i - 1) * 2, 0, 0]}
        />
      ))}
    </AmbientStage>
  );
}

function EdgeScene() {
  const edges: AmbientEdge[] = ["chamfer", "chamfer-2", "fillet", "fillet-2", "square"];
  const positions: [number, number, number][] = [
    [-1.6, 0.9, 0], [0, 0.9, 0], [1.6, 0.9, 0],
    [-0.8, -0.9, 0], [0.8, -0.9, 0],
  ];
  return (
    <AmbientStage cameraDistance={7}>
      {edges.map((edge, i) => (
        <AmbientSurface3D
          key={edge}
          width={1.2}
          height={1.2}
          edge={edge}
          surface="flat"
          elevation={1}
          position={positions[i] ?? [0, 0, 0]}
        />
      ))}
    </AmbientStage>
  );
}

function MaterialScene() {
  const mats: AmbientMaterial[] = ["matte", "shiny", "glass"];
  return (
    <AmbientStage cameraDistance={7}>
      {mats.map((m, i) => (
        <AmbientSurface3D
          key={m}
          width={1.6}
          height={1.8}
          edge="fillet"
          surface="convex"
          elevation={2}
          material={m}
          position={[(i - 1) * 2.1, 0, 0]}
        />
      ))}
    </AmbientStage>
  );
}

function ComponentScene({
  knob,
  setKnob,
  slider,
  setSlider,
  fader,
  setFader,
  swtch,
  setSwtch,
}: {
  knob: number;
  setKnob: (n: number) => void;
  slider: number;
  setSlider: (n: number) => void;
  fader: number;
  setFader: (n: number) => void;
  swtch: boolean;
  setSwtch: (b: boolean) => void;
}) {
  return (
    <AmbientStage cameraDistance={8}>
      {/* Row 1: Knob | Fader | Slider */}
      <AmbientKnob3D position={[-2.5, 0.8, 0]} value={knob} onChange={setKnob} material="shiny" />
      <AmbientFader3D position={[0, 0.3, 0]} value={fader} onChange={setFader} material="glass" />
      <AmbientSlider3D position={[2.5, 0.8, 0]} value={slider} onChange={setSlider} />
      {/* Row 2: Switch | Button */}
      <AmbientSwitch3D position={[-2.5, -0.8, 0]} checked={swtch} onCheckedChange={setSwtch} tint="#4ade80" />
      <AmbientButton3D position={[0, -0.8, 0]} material="shiny" />
    </AmbientStage>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════════════════════════ */

export function App() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [knob, setKnob] = useState(65);
  const [slider, setSlider] = useState(50);
  const [fader, setFader] = useState(70);
  const [swtch, setSwtch] = useState(true);

  const cssTheme: AmbientTheme = theme;

  // Inject the same theme as inline CSS variables for the Component section CSS
  // controls to match the shared environment.
  const rootStyle: CSSProperties = {};

  return (
    <Ambient3DProvider theme={theme} className="a3d-root amb-surface" style={rootStyle}>
      <header className="a3d-header">
        <h1 className="a3d-title amb-heading-1">ambient<span style={{ opacity: 0.4 }}>3d</span></h1>
        <p className="a3d-sub">
          A three.js + react-three-fiber design system that mirrors Ambient CSS.
          Each scene below is rendered in real 3D on the left, with the matching
          @ambientcss/components CSS primitives on the right, driven by the same
          shared lighting theme.
        </p>
      </header>

      <LightControls theme={theme} setTheme={setTheme} />

      <Section
        label="Light Direction"
        description="(lightX, lightY) ∈ [-1, 1]² defines where the key light is coming from. In CSS it tilts the shadow and highlight; in 3D it moves an actual directional light. Drag the sliders above to reorient both worlds at once."
      >
        <Split
          left={<OrbitScene />}
          right={
            <div className="a3d-gallery">
              {Array.from({ length: 9 }, (_, i) => {
                const edgeClass = i % 3 === 0 ? "amb-chamfer" : i % 3 === 1 ? "amb-fillet" : "amb-chamfer-2";
                const radius = i % 3 === 1 ? 12 : 4;
                return (
                  <div
                    key={i}
                    className={`a3d-swatch ambient amb-surface amb-elevation-2 ${edgeClass}`}
                    style={{ borderRadius: radius }}
                  />
                );
              })}
            </div>
          }
        />
      </Section>

      <Section
        label="Elevation"
        description="Elevation 0→3 pushes the element away from the background plate. In CSS it grows the drop shadow; in 3D it lifts the mesh and casts a real shadow from the key light."
      >
        <Split
          left={<ElevationScene />}
          right={
            <div className="a3d-gallery a3d-gallery-2col">
              {[0, 1, 2, 3].map((e) => (
                <div className="a3d-swatch-item" key={e}>
                  <div
                    className={`a3d-swatch ambient amb-surface amb-chamfer amb-elevation-${e}`}
                    style={{ borderRadius: 4 }}
                  />
                  <span className="a3d-swatch-label">elev {e}</span>
                </div>
              ))}
            </div>
          }
        />
      </Section>

      <Section
        label="Surfaces"
        description="Concave dishes in, flat stays flush, convex bulges out. In CSS, a gradient suggests the curvature; in 3D, the mesh vertices are actually displaced along the front face."
      >
        <Split
          left={<SurfaceScene />}
          right={
            <div className="a3d-gallery">
              {[
                { cls: "amb-surface-concave", label: "Concave" },
                { cls: "amb-surface", label: "Flat" },
                { cls: "amb-surface-convex", label: "Convex" },
              ].map(({ cls, label }) => (
                <div className="a3d-swatch-item" key={label}>
                  <div
                    className={`a3d-swatch ambient amb-chamfer-2 amb-elevation-2 ${cls}`}
                    style={{ borderRadius: 4 }}
                  />
                  <span className="a3d-swatch-label">{label}</span>
                </div>
              ))}
            </div>
          }
        />
      </Section>

      <Section
        label="Edge Treatments"
        description="Chamfer cuts a 45° bevel; fillet rounds the corner. In CSS these are inner-edge highlights and shadows; in 3D they are actual bevel and round-box geometry."
      >
        <Split
          left={<EdgeScene />}
          right={
            <div className="a3d-gallery">
              {[
                { cls: "amb-chamfer", label: "Chamfer", radius: 4 },
                { cls: "amb-chamfer-2", label: "Chamfer 2x", radius: 4 },
                { cls: "amb-fillet", label: "Fillet", radius: 12 },
                { cls: "amb-fillet-2", label: "Fillet 2x", radius: 20 },
                { cls: "", label: "Square", radius: 0 },
              ].map(({ cls, label, radius }) => (
                <div className="a3d-swatch-item" key={label}>
                  <div
                    className={`a3d-swatch ambient amb-surface amb-elevation-1 ${cls}`}
                    style={{ borderRadius: radius }}
                  />
                  <span className="a3d-swatch-label">{label}</span>
                </div>
              ))}
            </div>
          }
        />
      </Section>

      <Section
        label="Materials"
        description="Matte, shiny, and glass finishes. The CSS version paints gradient highlights that imply the BRDF; the 3D version uses MeshStandardMaterial / MeshPhysicalMaterial with clearcoat and transmission to produce the real thing."
      >
        <Split
          left={<MaterialScene />}
          right={
            <div className="a3d-gallery">
              {(["matte", "shiny", "glass"] as const).map((mat) => (
                <div className="a3d-swatch-item" key={mat}>
                  <div
                    className={`a3d-swatch ambient amb-surface-convex amb-fillet amb-elevation-2 amb-mat-${mat}`}
                    style={{ borderRadius: 12 }}
                  />
                  <span className="a3d-swatch-label">{mat}</span>
                </div>
              ))}
            </div>
          }
        />
      </Section>

      <Section
        label="Components"
        description="Every ambient component has a real 3D counterpart. Drag the 3D controls on the left; the CSS controls on the right stay in lockstep because they're bound to the same React state."
      >
        <Split
          left={
            <ComponentScene
              knob={knob}
              setKnob={setKnob}
              slider={slider}
              setSlider={setSlider}
              fader={fader}
              setFader={setFader}
              swtch={swtch}
              setSwtch={setSwtch}
            />
          }
          right={
            <div className="a3d-component-grid">
              {/* Row 1: Knob | Fader | Slider */}
              <AmbientKnob value={knob} onChange={setKnob} label="Knob" material="shiny" />
              <AmbientFader value={fader} min={0} max={100} onChange={setFader} label="Fader" material="glass" />
              <AmbientSlider value={slider} min={0} max={100} onChange={setSlider} label="Slider" />
              {/* Row 2: Switch | Button */}
              <AmbientSwitch checked={swtch} onCheckedChange={setSwtch} led label="Switch" />
              <AmbientButton material="shiny">Press</AmbientButton>
            </div>
          }
        />
      </Section>

      <footer className="a3d-footer">
        ambient3d · visual reference for{" "}
        <a href="https://github.com/kikkupico/ambientcss">@ambientcss</a> ·{" "}
        theme hue {cssTheme.lightHue?.toFixed(0)}°
      </footer>
    </Ambient3DProvider>
  );
}
