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
  // Components – neutral bright
  { lightX: -0.7, lightY: -0.7, keyLight: 0.9, fillLight: 0.7, lightHue: 234, lightSaturation: 5 },
  // Theming playground – neutral bright (user takes over here)
  { lightX: -0.7, lightY: -0.7, keyLight: 0.9, fillLight: 0.7, lightHue: 234, lightSaturation: 5 },
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

/* ── Theming presets ──────────────────────────────────────────────────── */

type ThemePreset = {
  label: string;
  lightX: number;      // -1..1
  lightY: number;      // -1..1
  keyLight: number;    // 0..1
  fillLight: number;   // 0..1
  lightHue: number;    // 0..360
  lightSaturation: number; // 0..100
  lumeHue: number; // 0..360
};

// Day/Night use the exact values from the original sticky day→night transition
const THEME_PRESETS: ThemePreset[] = [
  { label: "Day",    lightX: -0.7, lightY: -0.7, keyLight: 0.9,  fillLight: 0.7,  lightHue: 234, lightSaturation: 5,  lumeHue: 16 },
  { label: "Night",  lightX: 0.7,  lightY: -0.7, keyLight: 0.3,  fillLight: 0.1,  lightHue: 250, lightSaturation: 30, lumeHue: 16 },
  { label: "Sci-Fi", lightX: 0,    lightY: -0.9, keyLight: 0.2,  fillLight: 0.05, lightHue: 190, lightSaturation: 50, lumeHue: 180 },
  { label: "Fun",    lightX: 0,    lightY: -1,   keyLight: 0.55, fillLight: 0,    lightHue: 0,   lightSaturation: 100, lumeHue: 0 },
];

const ORBIT_COUNT = 9;
const ANIM_DURATION = 800; // ms for preset transitions

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

  /* Scroll to next section helper -------------------------------------------- */
  const scrollToNextSection = useCallback((currentRef: React.RefObject<HTMLElement | null>) => {
    const current = currentRef.current;
    if (!current) return;
    const sections = Array.from(document.querySelectorAll('section'));
    const currentIndex = sections.indexOf(current);
    if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      sections[currentIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  /* Scroll to top helper ------------------------------------------------------ */
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* Scroll-driven lighting ------------------------------------------------ */
  const ticking = useRef(false);
  const playgroundRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      // Check if playground section is in view
      const pgEl = playgroundRef.current;
      if (pgEl) {
        const rect = pgEl.getBoundingClientRect();
        const vh = window.innerHeight;
        const inView = rect.top < vh * 0.5 && rect.bottom > vh * 0.5;
        if (inView) {
          ticking.current = false;
          return; // Don't update theme from scroll while playground is active
        }
      }

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

  /* Animated theme transitions -------------------------------------------- */
  const animRef = useRef<number>(0);
  const animFrom = useRef<ThemePreset | null>(null);
  const animTo = useRef<ThemePreset | null>(null);
  const animStart = useRef(0);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const animateToPreset = useCallback((target: ThemePreset) => {
    // Cancel any running animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    // Snapshot current theme as starting point (via ref to avoid stale closure)
    const cur = themeRef.current;
    animFrom.current = {
      label: "",
      lightX: cur.lightX ?? 0,
      lightY: cur.lightY ?? 0,
      keyLight: cur.keyLight ?? 0.9,
      fillLight: cur.fillLight ?? 0.7,
      lightHue: cur.lightHue ?? 234,
      lightSaturation: cur.lightSaturation ?? 5,
      lumeHue: cur.lumeHue ?? 16,
    };
    animTo.current = target;
    animStart.current = performance.now();

    function tick(now: number) {
      const from = animFrom.current!;
      const to = animTo.current!;
      const elapsed = now - animStart.current;
      const rawT = Math.min(elapsed / ANIM_DURATION, 1);
      // Ease out cubic for smooth deceleration
      const t = 1 - Math.pow(1 - rawT, 3);

      const lerp = (a: number, b: number) => a + (b - a) * t;

      setTheme({
        lightX: lerp(from.lightX, to.lightX),
        lightY: lerp(from.lightY, to.lightY),
        keyLight: lerp(from.keyLight, to.keyLight),
        fillLight: lerp(from.fillLight, to.fillLight),
        lightHue: lerp(from.lightHue, to.lightHue),
        lightSaturation: lerp(from.lightSaturation, to.lightSaturation),
        lumeHue: lerp(from.lumeHue, to.lumeHue),
      });

      if (rawT < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = 0;
      }
    }

    animRef.current = requestAnimationFrame(tick);
  }, []);

  // Cancel animation and set a single theme property (for control changes)
  const setThemeProp = useCallback((key: keyof AmbientTheme, value: number) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    setTheme(prev => ({ ...prev, [key]: value }));
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  /* Component demo state (local dummies) ---------------------------------- */
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
  const playgroundView = useInView(0.1);
  const finaleView = useInView(0.3);

  /* Section refs for scroll navigation ------------------------------------ */
  const heroRef = useRef<HTMLElement>(null);
  const orbitSectionRef = useRef<HTMLElement>(null);
  const elevSectionRef = useRef<HTMLElement>(null);
  const surfSectionRef = useRef<HTMLElement>(null);
  const edgeSectionRef = useRef<HTMLElement>(null);
  const compSectionRef = useRef<HTMLElement>(null);
  const playgroundSectionRef = useRef<HTMLElement>(null);

  /* Orbit: pointer/touch-driven light direction ───────────────────────── */
  const orbitGridRef = useRef<HTMLDivElement>(null);

  // Window-level pointer tracking — immediate, no smoothing, bypasses React
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const el = orbitGridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawX = (e.clientX - cx) / (window.innerWidth / 2);
      const rawY = (e.clientY - cy) / (window.innerHeight / 2);
      const maxAbs = Math.max(Math.abs(rawX), Math.abs(rawY), 0.01);
      el.style.setProperty("--amb-light-x", String(Math.max(-1, Math.min(1, rawX / maxAbs))));
      el.style.setProperty("--amb-light-y", String(Math.max(-1, Math.min(1, rawY / maxAbs))));
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  /* Scroll button component ----------------------------------------------- */
  const ScrollButton = ({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) => (
    <div
      className="scroll-down-button"
      onClick={() => scrollToNextSection(sectionRef)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToNextSection(sectionRef); }}
    >
      <div className="scroll-down-circle ambient amb-surface amb-chamfer amb-rounded-full">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
      </div>
    </div>
  );

  return (
    <AmbientProvider className="amb-surface" theme={theme}>

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="hero amb-surface" ref={heroRef}>
        <div>
          <div className="hero-title">ambient</div>
          <div className="hero-sub">physically based css</div>
        </div>
        <div
          className="hero-scroll-hint"
          onClick={() => scrollToNextSection(heroRef)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToNextSection(heroRef); }}
        >
          <div className="hero-scroll-circle ambient amb-surface amb-chamfer amb-bounce amb-rounded-full">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── 2. LIGHT ORBIT ───────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={orbitSectionRef}>
        <div className="scene-inner" ref={orbitView.ref}>
          <div className="scene-label">Light Direction</div>
          <div className="scene-hint">move pointer to change light direction</div>
          <div
            className="orbit-grid"
            ref={orbitGridRef}
          >
            {Array.from({ length: ORBIT_COUNT }, (_, i) => (
                <div
                  key={i}
                  className={`orbit-circle ambient amb-surface amb-elevation-3 ${
                    i % 3 === 0 ? "amb-chamfer" : i % 3 === 1 ? "amb-fillet" : "amb-chamfer-2"
                  }`}
                  style={{
                    opacity: orbitView.visible ? 1 : 0,
                    transform: orbitView.visible ? "scale(1)" : "scale(0.5)",
                    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s`,
                  } as React.CSSProperties}
                />
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={orbitSectionRef} />
      </section>

      {/* ── 3. ELEVATION ─────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={elevSectionRef}>
        <div className="scene-inner" ref={elevView.ref}>
          <div className="scene-label">Elevation</div>
          <div className="elevation-row">
            {([0, 1, 2, 3] as const).map((elev, i) => (
              <div className="elevation-item" key={elev}>
                <div
                  className={`elevation-circle ambient amb-surface amb-chamfer amb-elevation-${elev}`}
                  data-visible={elevView.visible}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                />
                <span className="elevation-label">{elev}</span>
              </div>
            ))}
            <div className="elevation-item">
              <div
                className="elevation-circle ambient amb-surface amb-chamfer amb-bounce"
                data-visible={elevView.visible}
                style={{ transitionDelay: "0.32s" }}
              />
              <span className="elevation-label">bounce</span>
            </div>
          </div>
        </div>
        <ScrollButton sectionRef={elevSectionRef} />
      </section>

      {/* ── 4. SURFACES ──────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={surfSectionRef}>
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
                  className={`surface-swatch ambient amb-chamfer-2 amb-elevation-2 ${cls}`}
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
        <ScrollButton sectionRef={surfSectionRef} />
      </section>

      {/* ── 5. EDGE TREATMENTS ───────────────────────────────────────── */}
      <section className="scene amb-surface" ref={edgeSectionRef}>
        <div className="scene-inner" ref={edgeView.ref}>
          <div className="scene-label">Edge Treatments</div>
          <div className="edge-wall">
            {[
              { cls: "amb-chamfer", elev: 1, label: "Chamfer" },
              { cls: "amb-chamfer-2", elev: 1, label: "Chamfer 2x" },
              { cls: "amb-chamfer-minus-1", elev: 0, label: "Chamfer -1" },
              { cls: "amb-fillet", elev: 1, label: "Fillet" },
              { cls: "amb-fillet-2", elev: 1, label: "Fillet 2x" },
              { cls: "amb-fillet-minus-1", elev: 0, label: "Fillet -1" },
            ].map(({ cls, elev, label }, i) => (
              <div className="edge-item" key={label}>
                <div
                  className={`edge-swatch ambient amb-surface amb-elevation-${elev} ${cls}`}
                  data-visible={edgeView.visible}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                />
                <span className="edge-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={edgeSectionRef} />
      </section>

      {/* ── 6. COMPONENTS ─────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={compSectionRef}>
        <div className="scene-inner" ref={compView.ref}>
          <div className="scene-label">Components</div>
          <div className="scene-subtitle">(react only)</div>
          <div className="component-stage">
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientKnob value={knob1} onChange={setKnob1} label="Knob" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientKnob value={knob2} onChange={setKnob2} label="Knob" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSlider value={slider1} min={0} max={100} onChange={setSlider1} label="Slider" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientFader value={fader1} min={0} max={100} onChange={setFader1} label="Fader" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSwitch checked={sw1} onCheckedChange={setSw1} led label="Switch" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSwitch checked={sw2} onCheckedChange={setSw2} led="amber" label="Switch" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton>Button</AmbientButton>
            </div>
          </div>
          <div className="comp-led-row" data-visible={compView.visible}>
            <div className="amb-led" style={{ "--amb-led-color": "#ef4444" } as React.CSSProperties} />
            <div className="amb-led" style={{ "--amb-led-color": "#4ade80" } as React.CSSProperties} />
            <div className="amb-led" style={{ "--amb-led-color": "#3b82f6" } as React.CSSProperties} />
          </div>
        </div>
        <ScrollButton sectionRef={compSectionRef} />
      </section>

      {/* ── 7. THEMING PLAYGROUND ─────────────────────────────────────── */}
      <section className="scene amb-surface" ref={playgroundSectionRef}>
        <div className="scene-inner" ref={playgroundView.ref}>
          <div className="scene-label">Endless Theming Possibilities</div>
          <div className="scene-hint">tap a preset or tweak the controls</div>

          <div className="theme-presets">
            {THEME_PRESETS.map((preset) => (
              <AmbientButton
                key={preset.label}
                onClick={() => animateToPreset(preset)}
              >
                {preset.label}
              </AmbientButton>
            ))}
          </div>

          <div className="theme-playground">
            <div className="theme-controls">
              <div className="theme-controls-row">
                <AmbientKnob
                  value={Math.round((theme.keyLight ?? 0.9) * 100)}
                  onChange={(v) => setThemeProp("keyLight", v / 100)}
                  label="Key Light"
                />
                <AmbientFader
                  value={Math.round((theme.lightY ?? 0) * -100)}
                  min={-100}
                  max={100}
                  onChange={(v) => setThemeProp("lightY", v / -100)}
                  label="Light Y"
                />
                <AmbientKnob
                  value={Math.round((theme.fillLight ?? 0.7) * 100)}
                  onChange={(v) => setThemeProp("fillLight", v / 100)}
                  label="Fill Light"
                />
              </div>
              <div className="theme-controls-row">
                <AmbientSlider
                  value={Math.round((theme.lightX ?? 0) * 100)}
                  min={-100}
                  max={100}
                  onChange={(v) => setThemeProp("lightX", v / 100)}
                  label="Light X"
                />
              </div>
              <div className="theme-controls-row">
                <AmbientKnob
                  value={Math.round(((theme.lightHue ?? 234) / 360) * 100)}
                  onChange={(v) => setThemeProp("lightHue", (v / 100) * 360)}
                  label="Hue"
                />
                <AmbientKnob
                  value={Math.round(theme.lightSaturation ?? 5)}
                  onChange={(v) => setThemeProp("lightSaturation", v)}
                  label="Saturation"
                />
                <AmbientKnob
                  value={Math.round(((theme.lumeHue ?? 16) / 360) * 100)}
                  onChange={(v) => setThemeProp("lumeHue", (v / 100) * 360)}
                  label="Lume Hue"
                />
              </div>
            </div>
          </div>
        </div>
        <ScrollButton sectionRef={playgroundSectionRef} />
      </section>

      {/* ── 8. FINALE ────────────────────────────────────────────────── */}
      <section className="finale amb-surface" ref={finaleView.ref}>
        <div>
          <div className="finale-text" data-visible={finaleView.visible}>
            {"ambient".split("").map((ch, i) => (
              <span key={i} className="finale-letter" style={{ transitionDelay: `${i * 0.08}s` }}>{ch}</span>
            ))}
          </div>
          <div className="finale-sub" data-visible={finaleView.visible}>physically based css</div>
          <div className="finale-links">
            <a
              className="finale-link ambient amb-surface amb-chamfer amb-elevation-1 amb-rounded-lg"
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
              className="finale-link ambient amb-surface amb-chamfer amb-elevation-1 amb-rounded-lg"
              href="https://kikkupico.github.io/ambientcss/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="finale-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Docs
            </a>
          </div>
          <div
            className="finale-top-button"
            onClick={scrollToTop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToTop(); }}
          >
            <div className="scroll-top-circle ambient amb-surface amb-chamfer amb-rounded-full">
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </div>
            <span>Top</span>
          </div>
        </div>
      </section>

    </AmbientProvider>
  );
}
