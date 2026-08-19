import { useCallback, useEffect, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientButton,
  AmbientKnob,
  AmbientFader,
  AmbientSlider,
  AmbientSwitch,
  AmbientSelect,
  AmbientPanel,
  AmbientKitProvider,
  consoleKit,
  type AmbientTheme,
  type AmbientKnobIndicator,
} from "@ambientcss/components";

/* The README hero film (tools/hero-gif): the same device raytraced in
   Blender and rendered by the CSS, wiped against each other. Imported from
   the repo root rather than copied into the app so the demo can never show
   a stale cut of it. */
import heroFilm from "../../../ambientcss.mp4";
import kubernetes3dShot from "./assets/kubernetes3d.jpg";

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

/* ── Reduced motion ───────────────────────────────────────────────────── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/* ── Theming presets ──────────────────────────────────────────────────────
   The lighting is driven entirely by the header now (presets + the settings
   pulldown) — not by scroll. Every scene below re-lights from the same theme. */

type ThemePreset = {
  label: string;
  icon: string;
  led: string;         // indicator colour
  lightX: number;      // -1..1
  lightY: number;      // -1..1
  keyLight: number;    // 0..1
  fillLight: number;   // 0..1
  lightHue: number;    // 0..360
  lightSaturation: number; // 0..100
  lumeHue: number; // 0..360
};

const THEME_PRESETS: ThemePreset[] = [
  { label: "Day",    icon: "☀", led: "#f59e0b", lightX: -0.7, lightY: -0.7, keyLight: 0.9,  fillLight: 0.7,  lightHue: 234, lightSaturation: 5,   lumeHue: 16 },
  { label: "Night",  icon: "☾", led: "#6366f1", lightX: 0.7,  lightY: -0.7, keyLight: 0.3,  fillLight: 0.1,  lightHue: 250, lightSaturation: 30,  lumeHue: 16 },
  { label: "Sci-Fi", icon: "✦", led: "#22d3d3", lightX: 0,    lightY: -0.9, keyLight: 0.2,  fillLight: 0.05, lightHue: 190, lightSaturation: 50,  lumeHue: 180 },
  { label: "Fun",    icon: "✷", led: "#ec4899", lightX: 0,    lightY: -1,   keyLight: 0.55, fillLight: 0,    lightHue: 0,   lightSaturation: 100, lumeHue: 0 },
];

const DEFAULTS = THEME_PRESETS[0]!;

/* The settings pulldown is a little lighting console: one AmbientKnob per
   light parameter. The knobs themselves re-shade as you turn them, since
   they're lit by the very light they control. */
type KnobCfg = {
  key: string;
  label: string;
  prop: keyof AmbientTheme;
  indicator: AmbientKnobIndicator;
  min: number;
  max: number;
  step: number;
  value: (t: ThemePreset) => number;
  to: (v: number) => number;
};

/* The two bipolar controls take the rectangle: a bar reads as a pointer
   swinging either side of centre, which is what Light X/Y do. Everything
   else runs 0..max and takes the dot. Markers stay off — the console row is
   seven knobs on a 4px grid and a printed ring would not survive it. */
const LIGHT_KNOBS: KnobCfg[] = [
  { key: "lx",   label: "Light X", prop: "lightX",         indicator: "rectangle", min: -100, max: 100, step: 2, value: (t) => Math.round(t.lightX * 100),  to: (v) => v / 100 },
  { key: "ly",   label: "Light Y", prop: "lightY",         indicator: "rectangle", min: -100, max: 100, step: 2, value: (t) => Math.round(t.lightY * 100),  to: (v) => v / 100 },
  { key: "key",  label: "Key",     prop: "keyLight",       indicator: "circle",    min: 0,    max: 100, step: 1, value: (t) => Math.round(t.keyLight * 100), to: (v) => v / 100 },
  { key: "fill", label: "Fill",    prop: "fillLight",      indicator: "circle",    min: 0,    max: 100, step: 1, value: (t) => Math.round(t.fillLight * 100), to: (v) => v / 100 },
  { key: "hue",  label: "Hue",     prop: "lightHue",       indicator: "circle",    min: 0,    max: 360, step: 2, value: (t) => Math.round(t.lightHue),       to: (v) => v },
  { key: "sat",  label: "Sat",     prop: "lightSaturation", indicator: "circle",   min: 0,    max: 100, step: 1, value: (t) => Math.round(t.lightSaturation), to: (v) => v },
  { key: "lume", label: "Lume",    prop: "lumeHue",        indicator: "circle",    min: 0,    max: 360, step: 2, value: (t) => Math.round(t.lumeHue),        to: (v) => v },
];

const ORBIT_COUNT = 9;
const ANIM_DURATION = 800; // ms for preset transitions

/* ══════════════════════════════════════════════════════════════════════════
   APP
   ══════════════════════════════════════════════════════════════════════════ */

export function App() {
  const [theme, setTheme] = useState<AmbientTheme>({
    lightX: DEFAULTS.lightX,
    lightY: DEFAULTS.lightY,
    keyLight: DEFAULTS.keyLight,
    fillLight: DEFAULTS.fillLight,
    lightHue: DEFAULTS.lightHue,
    lightSaturation: DEFAULTS.lightSaturation,
    lumeHue: DEFAULTS.lumeHue,
  });
  const [activePreset, setActivePreset] = useState("Day");

  /* Scroll navigation helpers --------------------------------------------- */
  const scrollToNextSection = useCallback((currentRef: React.RefObject<HTMLElement | null>) => {
    const current = currentRef.current;
    if (!current) return;
    const sections = Array.from(document.querySelectorAll('section'));
    const currentIndex = sections.indexOf(current);
    if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      sections[currentIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* Animated theme transitions (preset chips) ----------------------------- */
  const animRef = useRef<number>(0);
  const animFrom = useRef<AmbientTheme | null>(null);
  const animTo = useRef<AmbientTheme | null>(null);
  const animStart = useRef(0);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const animateToPreset = useCallback((target: ThemePreset) => {
    setActivePreset(target.label);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const cur = themeRef.current;
    animFrom.current = {
      lightX: cur.lightX ?? DEFAULTS.lightX,
      lightY: cur.lightY ?? DEFAULTS.lightY,
      keyLight: cur.keyLight ?? DEFAULTS.keyLight,
      fillLight: cur.fillLight ?? DEFAULTS.fillLight,
      lightHue: cur.lightHue ?? DEFAULTS.lightHue,
      lightSaturation: cur.lightSaturation ?? DEFAULTS.lightSaturation,
      lumeHue: cur.lumeHue ?? DEFAULTS.lumeHue,
    };
    animTo.current = {
      lightX: target.lightX,
      lightY: target.lightY,
      keyLight: target.keyLight,
      fillLight: target.fillLight,
      lightHue: target.lightHue,
      lightSaturation: target.lightSaturation,
      lumeHue: target.lumeHue,
    };
    animStart.current = performance.now();

    function tick(now: number) {
      const from = animFrom.current!;
      const to = animTo.current!;
      const rawT = Math.min((now - animStart.current) / ANIM_DURATION, 1);
      const t = 1 - Math.pow(1 - rawT, 3); // ease-out cubic
      const lerp = (a: number, b: number) => a + (b - a) * t;

      setTheme({
        lightX: lerp(from.lightX!, to.lightX!),
        lightY: lerp(from.lightY!, to.lightY!),
        keyLight: lerp(from.keyLight!, to.keyLight!),
        fillLight: lerp(from.fillLight!, to.fillLight!),
        lightHue: lerp(from.lightHue!, to.lightHue!),
        lightSaturation: lerp(from.lightSaturation!, to.lightSaturation!),
        lumeHue: lerp(from.lumeHue!, to.lumeHue!),
      });

      if (rawT < 1) animRef.current = requestAnimationFrame(tick);
      else animRef.current = 0;
    }

    animRef.current = requestAnimationFrame(tick);
  }, []);

  // Set a single theme property (the custom-cord light console).
  const setThemeProp = useCallback((key: keyof AmbientTheme, value: number) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    setActivePreset("Custom");
    setTheme(prev => ({ ...prev, [key]: value }));
  }, []);

  // Pulling the Custom cord marks the theme "Custom" and hands the scene to
  // the console — the light keeps its current values, now free to tune.
  const activateCustom = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    setActivePreset("Custom");
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  /* Component demo state (local dummies) ---------------------------------- */
  const [knob1, setKnob1] = useState(65);
  const [knob2, setKnob2] = useState(30);
  const [knob3, setKnob3] = useState(48);
  const [slider1, setSlider1] = useState(50);
  const [fader1, setFader1] = useState(70);
  const [bank, setBank] = useState("3");
  const [armed, setArmed] = useState<string[]>(["A", "C"]);
  const [sw1, setSw1] = useState(true);
  const [sw2, setSw2] = useState(false);

  /* The kit section drives BOTH columns off one pair of values. Turning the
     grounded knob turns the console knob with it, which is the point: the
     call site and the state are the same, only the kit above them differs. */
  const [kitLevel, setKitLevel] = useState(68);
  const [kitOn, setKitOn] = useState(true);

  /* The hero film loops on its own; under prefers-reduced-motion it becomes
     an ordinary paused video the visitor can start themselves. */
  const reducedMotion = usePrefersReducedMotion();

  /* InView hooks for each section ----------------------------------------- */
  const orbitView = useInView(0.2);
  const elevView = useInView(0.15);
  const thickView = useInView(0.2);
  const surfView = useInView(0.2);
  const matView = useInView(0.2);
  const edgeView = useInView(0.2);
  const grooveView = useInView(0.2);
  const compView = useInView(0.1);
  const kitView = useInView(0.1);
  const finaleView = useInView(0.3);

  /* Section refs for scroll navigation ------------------------------------ */
  const heroRef = useRef<HTMLElement>(null);
  const orbitSectionRef = useRef<HTMLElement>(null);
  const elevSectionRef = useRef<HTMLElement>(null);
  const thickSectionRef = useRef<HTMLElement>(null);
  const surfSectionRef = useRef<HTMLElement>(null);
  const matSectionRef = useRef<HTMLElement>(null);
  const edgeSectionRef = useRef<HTMLElement>(null);
  const grooveSectionRef = useRef<HTMLElement>(null);
  const compSectionRef = useRef<HTMLElement>(null);
  const kitSectionRef = useRef<HTMLElement>(null);

  /* Orbit: pointer/touch-driven light direction ───────────────────────── */
  const [orbitLight, setOrbitLight] = useState({ x: -1, y: -1 });
  const orbitGridRef = useRef<HTMLDivElement>(null);

  const handleOrbitPointer = useCallback((e: React.PointerEvent | React.TouchEvent) => {
    const el = orbitGridRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]!.clientX : (e as React.PointerEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]!.clientY : (e as React.PointerEvent).clientY;
    const rawX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const rawY = ((clientY - rect.top) / rect.height) * 2 - 1;
    const maxAbs = Math.max(Math.abs(rawX), Math.abs(rawY), 0.01);
    setOrbitLight({ x: rawX / maxAbs, y: rawY / maxAbs });
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
      <div className="scroll-down-circle ambient amb-surface amb-rounded-full">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
      </div>
    </div>
  );

  const mergedTheme = { ...DEFAULTS, ...theme };

  return (
    <AmbientProvider className="amb-surface" theme={theme}>

      {/* ── HEADER — global light control ────────────────────────────── */}
      <ThemeSwitcher
        theme={mergedTheme}
        activePreset={activePreset}
        onPreset={animateToPreset}
        onCustom={activateCustom}
        onProp={setThemeProp}
      />

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="hero amb-surface" ref={heroRef}>
        <div className="hero-title">ambient</div>
        <div className="hero-sub">physically based css</div>
        <video
          className="hero-film ambient amb-elevation-1 amb-rounded-lg"
          src={heroFilm}
          autoPlay={!reducedMotion}
          controls={reducedMotion}
          loop
          muted
          playsInline
          aria-label="A hardware panel raytraced in Blender rotating to a flat-on view, then wiped across to reveal the same panel rendered by Ambient CSS"
        />
        <div
          className="hero-scroll-hint"
          onClick={() => scrollToNextSection(heroRef)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToNextSection(heroRef); }}
        >
          <div className="hero-scroll-circle ambient amb-surface amb-bounce amb-rounded-full">
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
            onPointerMove={handleOrbitPointer}
            onTouchMove={handleOrbitPointer}
            style={{
              "--amb-light-x": orbitLight.x,
              "--amb-light-y": orbitLight.y,
              touchAction: "none",
            } as React.CSSProperties}
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
                    transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s, box-shadow 0.3s ease`,
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
                  className={`elevation-circle ambient amb-surface amb-elevation-${elev}`}
                  data-visible={elevView.visible}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                />
                <span className="elevation-label">{elev}</span>
              </div>
            ))}
            <div className="elevation-item">
              <div
                className="elevation-circle ambient amb-surface amb-bounce"
                data-visible={elevView.visible}
                style={{ transitionDelay: "0.32s" }}
              />
              <span className="elevation-label">bounce</span>
            </div>
          </div>
        </div>
        <ScrollButton sectionRef={elevSectionRef} />
      </section>

      {/* ── THICKNESS (grounded) ─────────────────────────────────────── */}
      <section className="scene amb-surface" ref={thickSectionRef}>
        <div className="scene-inner" ref={thickView.ref}>
          <div className="scene-label">Thickness</div>
          <div className="elevation-row">
            {[
              { t: 0, label: "t0 · sheet" },
              { t: 1, label: "t1 · button" },
              { t: 2, label: "t2 · knob" },
            ].map(({ t, label }, i) => (
              <div className="elevation-item" key={t}>
                <div
                  className={`elevation-circle ambient amb-surface amb-chamfer amb-thickness-${t}`}
                  data-visible={thickView.visible}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                />
                <span className="elevation-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={thickSectionRef} />
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
                  style={{ transitionDelay: `${i * 0.12}s` } as React.CSSProperties}
                />
                <span className="surface-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={surfSectionRef} />
      </section>

      {/* ── 5. MATERIALS ─────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={matSectionRef}>
        <div className="scene-inner" ref={matView.ref}>
          <div className="scene-label">Materials</div>
          <div className="surface-gallery materials-gallery">
            {[
              { mat: "matte" as const, label: "Matte" },
              { mat: "shiny" as const, label: "Shiny" },
              { mat: "glass" as const, label: "Glass" },
              { mat: "brushed" as const, label: "Brushed" },
              { mat: "rubber" as const, label: "Rubber" },
            ].map(({ mat, label }, i) => (
              <div className="surface-item" key={label}>
                <div style={{ position: "relative" }}>
                  {mat === "glass" && (
                    <div
                      className="moving-circle"
                      style={{
                        position: "absolute",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "var(--amb-highlight-color)",
                        top: "50%",
                        left: "50%",
                        marginTop: "-24px",
                        marginLeft: "-24px",
                        zIndex: 0,
                        opacity: 0.8,
                      }}
                    />
                  )}
                  <AmbientPanel
                    material={mat}
                    className="surface-swatch"
                    data-visible={matView.visible}
                    style={{
                      transitionDelay: `${i * 0.12}s`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 1,
                    } as React.CSSProperties}
                  />
                </div>
                <span className="surface-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={matSectionRef} />
      </section>

      {/* ── 6. EDGE TREATMENTS ───────────────────────────────────────── */}
      <section className="scene amb-surface" ref={edgeSectionRef}>
        <div className="scene-inner" ref={edgeView.ref}>
          <div className="scene-label">Edge Treatments</div>
          <div className="edge-wall">
            {[
              { cls: "amb-chamfer", elev: 1, label: "Chamfer" },
              { cls: "amb-chamfer-2", elev: 1, label: "Chamfer 2x" },
              { cls: "amb-fillet", elev: 1, label: "Fillet" },
              { cls: "amb-fillet-2", elev: 1, label: "Fillet 2x" },
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

      {/* ── GROOVE (grounded) ────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={grooveSectionRef}>
        <div className="scene-inner" ref={grooveView.ref}>
          <div className="scene-label">Groove</div>
          <div className="groove-wall">
            {[
              { cls: "groove-channel", label: "Channel", tone: "lume" },
              { cls: "groove-well", label: "Well", tone: "darker" },
              { cls: "groove-inset", label: "Inset", tone: "darker" },
            ].map(({ cls, label, tone }, i) => (
              <div className="groove-item" key={label}>
                <div
                  className={`groove-swatch ambient amb-groove ${cls} groove-${tone}`}
                  data-visible={grooveView.visible}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                />
                <span className="groove-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollButton sectionRef={grooveSectionRef} />
      </section>

      {/* ── 7. COMPONENTS ─────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={compSectionRef}>
        <div className="scene-inner" ref={compView.ref}>
          <div className="scene-label">Components</div>
          <div className="scene-subtitle">(react only)</div>
          <div className="component-stage">
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientKnob value={knob1} onChange={setKnob1} label="Knob" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              {/* All three knob axes at once, against the default beside it:
                  smooth body, printed marker ring, rectangle pointer. */}
              <AmbientKnob
                value={knob2}
                onChange={setKnob2}
                knurling={false}
                markers="full"
                indicator="rectangle"
                label="Knob"
              />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSlider value={slider1} min={0} max={100} onChange={setSlider1} label="Slider" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientFader value={fader1} min={0} max={100} onChange={setFader1} label="Fader" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSwitch value={sw1} onChange={setSw1} led label="Switch" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSwitch value={sw2} onChange={setSw2} led="amber" label="Switch" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton>Button</AmbientButton>
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton shape="round" material="shiny" aria-label="Round button" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton shape="square">FX</AmbientButton>
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              {/* The cap spends its own ::after on the dish, so a relief
                  material rides an inner layer under it. */}
              <AmbientButton shape="square" material="rubber">PAD</AmbientButton>
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              {/* Brushed metal never rotates its grain: turn this knob and the
                  streaks stay put while the shading crosses them. Smooth-bodied
                  on purpose — the knurled rim rides the rotating frame, so its
                  grain would turn with it and say the opposite. */}
              <AmbientKnob
                value={knob3}
                onChange={setKnob3}
                material="brushed"
                knurling={false}
                label="Knob"
              />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSelect
                size="sm"
                options={[{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }]}
                value={bank}
                onChange={(v) => setBank(v as string)}
                color="#22d3d3"
                label="Bank"
              />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientSelect
                multiple
                size="sm"
                orientation="horizontal"
                options={[{ value: "A" }, { value: "B" }, { value: "C" }]}
                value={armed}
                onChange={(v) => setArmed(v as string[])}
                color="#4ade80"
                label="Arm"
              />
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

      {/* ── 8. KITS ───────────────────────────────────────────────────── */}
      <section className="scene amb-surface" ref={kitSectionRef}>
        <div className="scene-inner" ref={kitView.ref}>
          <div className="scene-label">Kits</div>
          <div className="scene-subtitle">(react only)</div>
          <div className="scene-hint">
            One call site, two looks — grab either knob and both follow
          </div>
          <div className="component-stage kit-stage">
            <div className="component-cell" data-visible={kitView.visible}>
              <div className="kit-row">
                <AmbientKnob value={kitLevel} onChange={setKitLevel} label="Level" />
                <AmbientSwitch value={kitOn} onChange={setKitOn} led label="On" />
              </div>
              <div className="kit-name">grounded</div>
            </div>
            <div className="component-cell" data-visible={kitView.visible}>
              {/* The identical markup, one provider deeper. No prop below
                  this line knows which kit it is being painted by. */}
              <AmbientKitProvider kit={consoleKit}>
                <div className="kit-row">
                  <AmbientKnob value={kitLevel} onChange={setKitLevel} label="Level" />
                  <AmbientSwitch value={kitOn} onChange={setKitOn} led label="On" />
                </div>
              </AmbientKitProvider>
              <div className="kit-name">consoleKit</div>
            </div>
          </div>
        </div>
        <ScrollButton sectionRef={kitSectionRef} />
      </section>

      {/* ── 9. FINALE ────────────────────────────────────────────────── */}
      <section className="finale amb-surface" ref={finaleView.ref}>
        <div>
          <div className="finale-text" data-visible={finaleView.visible}>
            {"ambient".split("").map((ch, i) => (
              <span key={i} className="finale-letter" style={{ transitionDelay: `${i * 0.08}s` }}>{ch}</span>
            ))}
          </div>
          <div className="finale-sub" data-visible={finaleView.visible}>physically based css</div>

          <a
            className="made-with ambient amb-surface amb-chamfer amb-elevation-2"
            data-visible={finaleView.visible}
            href="https://kubernetes3d.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="made-with-label">made with ambientcss</span>
            <img
              className="made-with-shot amb-rounded-md"
              src={kubernetes3dShot}
              alt="kubernetes3d.com — Kubernetes visualized as a synth rack, built with Ambient CSS"
              loading="lazy"
            />
            <span className="made-with-caption">kubernetes3d.com ↗</span>
          </a>

          <div className="finale-links">
            <a
              className="finale-link amb-button amb-groove ambx-press ambx-press-md"
              href="https://github.com/kikkupico/ambientcss"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="amb-button-cap ambient amb-chamfer amb-surface amb-heading-3 amb-mat-matte">
                <svg className="finale-link-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </span>
            </a>
            <a
              className="finale-link amb-button amb-groove ambx-press ambx-press-md"
              href="https://kikkupico.github.io/ambientcss/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="amb-button-cap ambient amb-chamfer amb-surface amb-heading-3 amb-mat-matte">
                <svg className="finale-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Docs
              </span>
            </a>
          </div>
          <div
            className="finale-top-button"
            onClick={scrollToTop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollToTop(); }}
          >
            <div className="scroll-top-circle ambient amb-surface amb-rounded-full">
              <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </div>
            <span>Top</span>
          </div>
        </div>
      </section>

    </AmbientProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THEME SWITCHER — the header. A bank of lamp-lit keys seated IN the console
   slab's lip: one per theme preset, plus a "Custom" key. The lit lamp IS the
   current selection, and each key lights in its own preset's indicator
   colour, so the bank reads as the panel's status row rather than as a menu.
   Selecting Custom drops the slab to reveal the light console above the bank;
   clicking outside (or Esc) rolls the whole assembly back up.
   ══════════════════════════════════════════════════════════════════════════ */

type ThemeSwitcherProps = {
  theme: ThemePreset;
  activePreset: string;
  onPreset: (p: ThemePreset) => void;
  onCustom: () => void;
  onProp: (key: keyof AmbientTheme, value: number) => void;
};

function ThemeSwitcher({ theme, activePreset, onPreset, onCustom, onProp }: ThemeSwitcherProps) {
  const [consoleOpen, setConsoleOpen] = useState(false);
  const rigRef = useRef<HTMLDivElement>(null);

  // While the console is down, a click outside the rig (or Escape) rolls the
  // whole assembly back up. Custom stays the active theme — its cord stays low.
  useEffect(() => {
    if (!consoleOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rigRef.current?.contains(e.target as Node)) setConsoleOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setConsoleOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [consoleOpen]);

  // One key per preset plus Custom, legended with the preset's glyph so every
  // key stays the same square — a bank, not a menu. Each carries its own
  // indicator colour, so the lit key says which scene you are in by hue as
  // well as by position (the same --amb-led-color the LEDs use), and its name
  // rides along as the accessible name and the hover title.
  const keys = [
    ...THEME_PRESETS.map((p) => ({ value: p.label, label: p.icon, ariaLabel: p.label, color: p.led })),
    { value: "Custom", label: "\u2699", ariaLabel: "Custom", color: "#a78bfa" }
  ];

  const pick = (next: string) => {
    if (next === "Custom") {
      onCustom();
      setConsoleOpen((o) => !o);
      return;
    }
    const preset = THEME_PRESETS.find((p) => p.label === next);
    if (preset) onPreset(preset);
    setConsoleOpen(false);
  };

  return (
    <header className="cordbar">
      <div className={`cord-assembly${consoleOpen ? " is-open" : ""}`} ref={rigRef}>
        {/* One thick slab of the surface itself, holding both the light
            console and the key bank. Its upper region is the console, parked
            above the top of the screen; only the bottom lip — and the bank
            seated in it — shows at rest. Picking Custom drops the whole slab
            into view: the console was always just the hidden part of this
            same panel. */}
        <div className="cord-panel ambient amb-surface amb-chamfer amb-thickness-2 amb-elevation-1">
          <div className="cord-console">
            <div className="cord-console-title">
              Global light
              <span className="cord-console-preset">Custom</span>
            </div>
            {/* Controls sit in a recessed darker well so they pop and read
                apart from the key bank below. */}
            <div className="cord-console-well ambient amb-groove groove-darker">
              <div className="cord-console-grid">
                {LIGHT_KNOBS.map((k) => (
                  <AmbientKnob
                    key={k.key}
                    value={k.value(theme)}
                    min={k.min}
                    max={k.max}
                    step={k.step}
                    indicator={k.indicator}
                    onChange={(v) => onProp(k.prop, k.to(v))}
                    label={k.label}
                  />
                ))}
              </div>
            </div>
            <div className="cord-console-hint">every scene re-lights live</div>
          </div>

          {/* The key bank is seated in the slab's lip — the one part of the
              panel that stays on screen at rest, so the bank reads as this
              console's bottom row rather than as a bar floating under it.
              Selecting a key lights its lamp and re-lights every scene below;
              the Custom key also drops the slab so the console above comes
              into view, carrying the bank down with it. */}
          <div className="theme-keys">
            <AmbientSelect
              orientation="horizontal"
              options={keys}
              value={activePreset}
              onChange={(next) => pick(next as string)}
              aria-label="Theme"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
