import { useCallback, useEffect, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientPanel,
  AmbientButton,
  AmbientKnob,
  AmbientFader,
  AmbientSlider,
  AmbientSwitch,
  type AmbientTheme,
} from "@ambientcss/components";

/* ── Scroll-driven theme keyframes ────────────────────────────────────────
   As the user scrolls, the global lighting morphs through these states.    */

type LightFrame = {
  lightX: number;
  lightY: number;
  keyLight: number;
  fillLight: number;
  lightHue: number;
  lightSaturation: number;
};

const LIGHT_FRAMES: LightFrame[] = [
  // Hero – bright, top-left
  { lightX: -1, lightY: -1, keyLight: 0.92, fillLight: 0.72, lightHue: 234, lightSaturation: 10 },
  // Orbit – rotating light (starting point, will be overridden locally)
  { lightX: 1, lightY: -0.5, keyLight: 0.85, fillLight: 0.65, lightHue: 220, lightSaturation: 15 },
  // Elevation – dramatic top light
  { lightX: 0, lightY: -1, keyLight: 0.9, fillLight: 0.5, lightHue: 240, lightSaturation: 8 },
  // Surfaces – warm side light
  { lightX: -1, lightY: 0, keyLight: 0.88, fillLight: 0.6, lightHue: 30, lightSaturation: 20 },
  // Edges – cool overhead
  { lightX: 0.3, lightY: -1, keyLight: 0.82, fillLight: 0.55, lightHue: 210, lightSaturation: 18 },
  // Components day – neutral bright
  { lightX: -0.7, lightY: -0.7, keyLight: 0.9, fillLight: 0.7, lightHue: 234, lightSaturation: 5 },
  // Components night (end of sticky) – deep blue night
  { lightX: 0.7, lightY: -0.7, keyLight: 0.3, fillLight: 0.1, lightHue: 250, lightSaturation: 30 },
  // Moods – stays night-ish
  { lightX: 1, lightY: -1, keyLight: 0.35, fillLight: 0.12, lightHue: 250, lightSaturation: 30 },
  // Mosaic – warm dusk
  { lightX: -1, lightY: -0.3, keyLight: 0.7, fillLight: 0.45, lightHue: 20, lightSaturation: 25 },
  // Finale – bright dawn
  { lightX: -1, lightY: -1, keyLight: 0.95, fillLight: 0.8, lightHue: 40, lightSaturation: 12 },
];

function lerpFrame(a: LightFrame, b: LightFrame, t: number): LightFrame {
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    lightX: l(a.lightX, b.lightX),
    lightY: l(a.lightY, b.lightY),
    keyLight: l(a.keyLight, b.keyLight),
    fillLight: l(a.fillLight, b.fillLight),
    lightHue: l(a.lightHue, b.lightHue),
    lightSaturation: l(a.lightSaturation, b.lightSaturation),
  };
}

/* ── Intersection observer hook ───────────────────────────────────────── */

function useInView(threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry!.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ── Section scroll progress hook ─────────────────────────────────────── */

function useSectionProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight;
          // 0 when top enters viewport bottom, 1 when bottom leaves viewport top
          const p = Math.max(0, Math.min(1, -rect.top / (rect.height - vh)));
          setProgress(p);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);

  return progress;
}

/* ── LED colors for the constellation ──────────────────────────────────── */

const LED_COLORS = [
  "#ef4444", "#4ade80", "#f59e0b", "#22d3d3", "#3b82f6",
  "#ef4444", "#4ade80", "#f59e0b", "#22d3d3", "#3b82f6",
  "#ffffff", "#ef4444", "#4ade80", "#f59e0b", "#22d3d3",
  "#3b82f6", "#ffffff", "#ef4444", "#4ade80", "#f59e0b",
  "#22d3d3", "#3b82f6", "#ffffff", "#ef4444", "#4ade80",
  "#f59e0b", "#22d3d3", "#3b82f6", "#ffffff", "#ef4444",
  "#4ade80", "#f59e0b", "#22d3d3", "#3b82f6", "#ffffff",
];

/* ── Stable random elevations for orbit dancing ───────────────────────── */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ORBIT_COUNT = 15;
const ORBIT_DANCE_FRAMES = 12;

// Pre-compute elevation sequences for each circle
const ORBIT_ELEVATIONS: number[][] = (() => {
  const rand = seededRandom(42);
  return Array.from({ length: ORBIT_COUNT }, () =>
    Array.from({ length: ORBIT_DANCE_FRAMES }, () => Math.floor(rand() * 3) + 1)
  );
})();

/* ══════════════════════════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════════════════════════ */

export function App() {
  const [theme, setTheme] = useState<AmbientTheme>({
    lightX: LIGHT_FRAMES[0]!.lightX,
    lightY: LIGHT_FRAMES[0]!.lightY,
    keyLight: LIGHT_FRAMES[0]!.keyLight,
    fillLight: LIGHT_FRAMES[0]!.fillLight,
    lightHue: LIGHT_FRAMES[0]!.lightHue,
    lightSaturation: LIGHT_FRAMES[0]!.lightSaturation,
  });

  /* Scroll-driven lighting ------------------------------------------------ */
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const totalScroll = document.documentElement.scrollHeight - vh;
      const globalProgress = totalScroll > 0 ? scrollY / totalScroll : 0;

      const frameCount = LIGHT_FRAMES.length - 1;
      const raw = globalProgress * frameCount;
      const idx = Math.min(Math.floor(raw), frameCount - 1);
      const t = raw - idx;

      const frame = lerpFrame(LIGHT_FRAMES[idx]!, LIGHT_FRAMES[idx + 1]!, t);
      setTheme({
        lightX: frame.lightX,
        lightY: frame.lightY,
        keyLight: frame.keyLight,
        fillLight: frame.fillLight,
        lightHue: frame.lightHue,
        lightSaturation: frame.lightSaturation,
      });

      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* Component demo state -------------------------------------------------- */
  const [knob1, setKnob1] = useState(65);
  const [knob2, setKnob2] = useState(30);
  const [slider1, setSlider1] = useState(50);
  const [fader1, setFader1] = useState(70);
  const [sw1, setSw1] = useState(true);
  const [sw2, setSw2] = useState(false);

  /* InView hooks for each section ----------------------------------------- */
  const orbitView = useInView(0.2);
  const elevView = useInView(0.15);
  const surfView = useInView(0.2);
  const edgeView = useInView(0.2);
  const compView = useInView(0.1);
  const moodView = useInView(0.2);
  const mosaicView = useInView(0.2);
  const ledView = useInView(0.15);

  /* Orbit: auto-animating light around the square perimeter ─────────────
     Runs continuously when the section is in view.
     Segment 0: (-1,-1)→(1,-1)  top edge
     Segment 1: (1,-1)→(1,1)    right edge
     Segment 2: (1,1)→(-1,1)    bottom edge
     Segment 3: (-1,1)→(-1,-1)  left edge                                */
  const [orbitLight, setOrbitLight] = useState({ x: -1, y: -1 });
  const [orbitDanceFrame, setOrbitDanceFrame] = useState(0);

  useEffect(() => {
    if (!orbitView.visible) return;
    let raf: number;
    const CYCLE_MS = 6000; // one full lap
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = (elapsed / CYCLE_MS) % 1;
      const seg = t * 4;

      let x: number, y: number;
      if (seg < 1)      { x = -1 + 2 * seg;        y = -1; }
      else if (seg < 2) { x = 1;                    y = -1 + 2 * (seg - 1); }
      else if (seg < 3) { x = 1 - 2 * (seg - 2);   y = 1; }
      else              { x = -1;                    y = 1 - 2 * (seg - 3); }

      setOrbitLight({ x, y });
      setOrbitDanceFrame(Math.floor(t * ORBIT_DANCE_FRAMES) % ORBIT_DANCE_FRAMES);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [orbitView.visible]);


  /* Components sticky section ---------------------------------------------- */
  const compStickyRef = useRef<HTMLDivElement>(null);
  const compStickyProgress = useSectionProgress(compStickyRef);

  return (
    <AmbientProvider className="amb-surface" theme={theme}>

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="hero amb-surface">
        <div>
          <div className="hero-title">ambient</div>
          <div className="hero-sub">physically based css</div>
        </div>
        <div className="hero-scroll-hint">
          <div className="hero-scroll-circle ambient amb-surface amb-fillet amb-bounce amb-rounded-full">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── 2. LIGHT ORBIT ───────────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={orbitView.ref}>
          <div className="scene-label">Light Direction</div>
          <div
            className="orbit-grid"
            style={{
              "--amb-light-x": orbitLight.x,
              "--amb-light-y": orbitLight.y,
            } as React.CSSProperties}
          >
            {Array.from({ length: ORBIT_COUNT }, (_, i) => {
              const elev = ORBIT_ELEVATIONS[i]![orbitDanceFrame]!;
              return (
                <div
                  key={i}
                  className={`orbit-circle ambient amb-surface ${
                    i % 3 === 0 ? "amb-fillet" : i % 3 === 1 ? "amb-chamfer" : "amb-fillet-2"
                  }`}
                  style={{
                    "--amb-elevation": elev,
                    opacity: orbitView.visible ? 1 : 0,
                    transform: orbitView.visible ? "scale(1)" : "scale(0.5)",
                    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s, box-shadow 0.3s ease`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. ELEVATION ─────────────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={elevView.ref}>
          <div className="scene-label">Elevation</div>
          <div className="elevation-row">
            {([0, 1, 2, 3] as const).map((elev, i) => (
              <div className="elevation-item" key={elev}>
                <div
                  className={`elevation-circle ambient amb-surface amb-fillet amb-elevation-${elev}`}
                  data-visible={elevView.visible}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                />
                <span className="elevation-label">{elev}</span>
              </div>
            ))}
            <div className="elevation-item">
              <div
                className="elevation-circle ambient amb-surface amb-fillet amb-bounce"
                data-visible={elevView.visible}
                style={{ transitionDelay: "0.32s" }}
              />
              <span className="elevation-label">bounce</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SURFACES ──────────────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={surfView.ref}>
          <div className="scene-label">Surfaces</div>
          <div className="surface-gallery">
            {[
              { cls: "amb-surface-concave", label: "Concave" },
              { cls: "amb-surface", label: "Flat" },
              { cls: "amb-surface-convex", label: "Convex" },
            ].map(({ cls, label }, i) => (
              <div className="surface-item" key={label}>
                <div
                  className={`surface-swatch ambient amb-fillet-2 amb-elevation-2 ${cls}`}
                  data-visible={surfView.visible}
                  style={{
                    transitionDelay: `${i * 0.12}s`,
                    "--amb-light-y": -1,
                    "--amb-light-x": -0.8,
                    "--amb-key-light-intensity": 0.9,
                    "--amb-fill-light-intensity": 0.45,
                  } as React.CSSProperties}
                />
                <span className="surface-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. EDGE TREATMENTS ───────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={edgeView.ref}>
          <div className="scene-label">Edge Treatments</div>
          <div className="edge-wall">
            {[
              { cls: "amb-fillet", label: "Fillet" },
              { cls: "amb-fillet-2", label: "Fillet 2x" },
              { cls: "amb-fillet-minus-1", label: "Fillet -1" },
              { cls: "amb-chamfer", label: "Chamfer" },
              { cls: "amb-chamfer-2", label: "Chamfer 2x" },
              { cls: "amb-chamfer amb-fillet", label: "Both" },
            ].map(({ cls, label }, i) => (
              <div className="edge-item" key={label}>
                <div
                  className={`edge-swatch ambient amb-surface amb-elevation-1 ${cls}`}
                  data-visible={edgeView.visible}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                />
                <span className="edge-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. COMPONENTS (sticky day→night) ─────────────────────────── */}
      <section className="comp-sticky-wrapper" ref={compStickyRef}>
        <div className="comp-sticky-content amb-surface" ref={compView.ref}>
          <div className="scene-inner">
            <div className="scene-label">Components</div>
            <div className="component-stage">
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientKnob value={knob1} onChange={setKnob1} label="Volume" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientKnob value={knob2} onChange={setKnob2} label="Tone" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientSlider value={slider1} min={0} max={100} onChange={setSlider1} label="Pan" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientFader value={fader1} min={0} max={100} onChange={setFader1} label="Mix" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientSwitch checked={sw1} onCheckedChange={setSw1} led label="Active" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientSwitch checked={sw2} onCheckedChange={setSw2} led="amber" label="Bypass" />
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientButton>Play</AmbientButton>
              </div>
              <div className="component-cell" data-visible={compView.visible}>
                <AmbientButton>Stop</AmbientButton>
              </div>
            </div>
            {/* Day / Night indicator */}
            <div className="comp-time-label">
              {compStickyProgress < 0.3 ? "day" : compStickyProgress > 0.7 ? "night" : ""}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. COLOR MOODS ───────────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={moodView.ref}>
          <div className="scene-label">Color Moods</div>
          <div className="mood-strip">
            {[
              { hue: 234, sat: 5, key: 0.9, label: "Neutral" },
              { hue: 20, sat: 25, key: 0.85, label: "Warm" },
              { hue: 210, sat: 20, key: 0.75, label: "Cool" },
              { hue: 280, sat: 18, key: 0.35, label: "Midnight" },
            ].map(({ hue, sat, key, label }) => (
              <div
                key={label}
                className="mood-card ambient amb-surface amb-fillet-2 amb-elevation-2"
                data-visible={moodView.visible}
                style={{
                  "--amb-light-hue": hue,
                  "--amb-light-saturation": `${sat}%`,
                  "--amb-key-light-intensity": key,
                  "--amb-fill-light-intensity": key * 0.6,
                } as React.CSSProperties}
              >
                <span className="mood-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. MOSAIC ────────────────────────────────────────────────── */}
      <section className="scene amb-surface">
        <div className="scene-inner" ref={mosaicView.ref}>
          <div className="scene-label">Composition</div>
          <div className="mosaic">
            <AmbientPanel
              className="mosaic-panel"
              data-visible={mosaicView.visible}
            >
              <div className="mosaic-inner">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className={`mosaic-dot ambient amb-surface-convex amb-chamfer amb-elevation-${(i % 3) + 1}`}
                  />
                ))}
              </div>
            </AmbientPanel>

            <div
              className="mosaic-panel ambient amb-surface-concave amb-fillet amb-elevation-2"
              data-visible={mosaicView.visible}
            >
              <div className="mosaic-bar-group">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="mosaic-bar ambient amb-surface-convex amb-chamfer amb-elevation-1"
                    style={{ width: `${60 + i * 12}%` }}
                  />
                ))}
              </div>
            </div>

            <div
              className="mosaic-panel ambient amb-surface-darker amb-fillet amb-elevation-1"
              data-visible={mosaicView.visible}
              ref={ledView.ref}
            >
              <div className="led-constellation">
                {LED_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="led-dot amb-led"
                    data-visible={ledView.visible}
                    style={{
                      "--amb-led-color": color,
                      transitionDelay: `${i * 0.02}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. FINALE ────────────────────────────────────────────────── */}
      <section className="finale amb-surface">
        <div>
          <div className="finale-text">ambient</div>
          <div className="finale-sub">physically based css</div>
          <div className="finale-links">
            <a
              className="finale-link ambient amb-surface amb-fillet amb-elevation-1 amb-rounded-lg"
              href="https://github.com/kikkupico/ambientcss"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="finale-link-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              className="finale-link ambient amb-surface amb-fillet amb-elevation-1 amb-rounded-lg"
              href="#/docs"
            >
              <svg className="finale-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Docs
            </a>
          </div>
        </div>
      </section>

    </AmbientProvider>
  );
}
