import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AmbientProvider,
  AmbientButton,
  AmbientKnob,
  AmbientFader,
  AmbientSlider,
  AmbientSwitch,
  AmbientPanel,
  type AmbientTheme,
  type AmbientKnobVariant,
} from "@ambientcss/components";

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
  variant: AmbientKnobVariant;
  min: number;
  max: number;
  step: number;
  value: (t: ThemePreset) => number;
  to: (v: number) => number;
};

const LIGHT_KNOBS: KnobCfg[] = [
  { key: "lx",   label: "Light X", prop: "lightX",         variant: "line",  min: -100, max: 100, step: 2, value: (t) => Math.round(t.lightX * 100),  to: (v) => v / 100 },
  { key: "ly",   label: "Light Y", prop: "lightY",         variant: "line",  min: -100, max: 100, step: 2, value: (t) => Math.round(t.lightY * 100),  to: (v) => v / 100 },
  { key: "key",  label: "Key",     prop: "keyLight",       variant: "dot",   min: 0,    max: 100, step: 1, value: (t) => Math.round(t.keyLight * 100), to: (v) => v / 100 },
  { key: "fill", label: "Fill",    prop: "fillLight",      variant: "dot",   min: 0,    max: 100, step: 1, value: (t) => Math.round(t.fillLight * 100), to: (v) => v / 100 },
  { key: "hue",  label: "Hue",     prop: "lightHue",       variant: "flute", min: 0,    max: 360, step: 2, value: (t) => Math.round(t.lightHue),       to: (v) => v },
  { key: "sat",  label: "Sat",     prop: "lightSaturation", variant: "dot",  min: 0,    max: 100, step: 1, value: (t) => Math.round(t.lightSaturation), to: (v) => v },
  { key: "lume", label: "Lume",    prop: "lumeHue",        variant: "cap",   min: 0,    max: 360, step: 2, value: (t) => Math.round(t.lumeHue),        to: (v) => v },
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Set a single theme property (settings pulldown sliders).
  const setThemeProp = useCallback((key: keyof AmbientTheme, value: number) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    setActivePreset("Custom");
    setTheme(prev => ({ ...prev, [key]: value }));
  }, []);

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
  const thickView = useInView(0.2);
  const surfView = useInView(0.2);
  const matView = useInView(0.2);
  const edgeView = useInView(0.2);
  const grooveView = useInView(0.2);
  const compView = useInView(0.1);
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

  /* Hero-title → header morph ─────────────────────────────────────────────
     The big centred "ambient" wordmark shrinks and flies up into the header
     brand as the hero scrolls away; the chips + settings + panel skin fade
     in. Driven imperatively (a --scroll-p var + a direct transform) so the
     whole section tree isn't re-rendered on every scroll frame. */
  const themebarRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const brand = brandRef.current;
    const home = { cx: 0, cy: 0, w: 1 };
    let bigScale = 5;

    const measure = () => {
      if (!brand) return;
      const prev = brand.style.transform;
      brand.style.transform = "none";
      const r = brand.getBoundingClientRect();
      brand.style.transform = prev;
      home.cx = r.left + r.width / 2;
      home.cy = r.top + r.height / 2;
      home.w = r.width || 1;
      bigScale = Math.max(2, Math.min(6, (window.innerWidth * 0.66) / home.w));
    };

    const update = () => {
      const heroH = heroRef.current?.offsetHeight || window.innerHeight;
      const p = Math.max(0, Math.min(1, window.scrollY / (heroH * 0.7)));
      document.documentElement.style.setProperty("--scroll-p", String(p));
      if (brand) {
        if (p >= 1) {
          // Fully docked: drop the transform layer so the wordmark renders
          // natively crisp instead of rasterised at a scaled resolution.
          brand.style.transform = "none";
          brand.style.willChange = "auto";
        } else {
          const s = bigScale - (bigScale - 1) * p;
          const dx = (window.innerWidth / 2 - home.cx) * (1 - p);
          const dy = (window.innerHeight * 0.42 - home.cy) * (1 - p);
          brand.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
          brand.style.willChange = "transform";
        }
      }
      themebarRef.current?.classList.toggle("is-docked", p > 0.6);
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; update(); });
    };
    const onResize = () => { measure(); update(); };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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

      {/* ── HEADER — global light control (hero title morphs into it) ───── */}
      <ThemeBar
        theme={mergedTheme}
        activePreset={activePreset}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen(v => !v)}
        onPreset={animateToPreset}
        onProp={setThemeProp}
        themebarRef={themebarRef}
        brandRef={brandRef}
      />
      {/* Subtitle that lives under the big wordmark and fades as it docks. */}
      <div className="hero-morph-sub">physically based css</div>

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="hero amb-surface" ref={heroRef}>
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
                  className={`elevation-circle ambient amb-surface-lighter amb-elevation-${elev}`}
                  data-visible={elevView.visible}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                />
                <span className="elevation-label">{elev}</span>
              </div>
            ))}
            <div className="elevation-item">
              <div
                className="elevation-circle ambient amb-surface-lighter amb-bounce"
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
          <div className="scene-hint">grounded material depth — shadow grows with thickness, no elevation · new</div>
          <div className="elevation-row">
            {[
              { t: 0, label: "t0 · sheet" },
              { t: 1, label: "t1 · button" },
              { t: 2, label: "t2 · knob" },
            ].map(({ t, label }, i) => (
              <div className="elevation-item" key={t}>
                <div
                  className={`elevation-circle ambient amb-surface-lighter amb-chamfer amb-thickness-${t}`}
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
          <div className="surface-gallery">
            {[
              { mat: "matte" as const, label: "Matte" },
              { mat: "shiny" as const, label: "Shiny" },
              { mat: "glass" as const, label: "Glass" },
            ].map(({ mat, label }, i) => (
              <div className="surface-item" key={label}>
                <div style={{ position: "relative" }}>
                  {mat === "glass" && (
                    <div
                      className="moving-circle"
                      style={{
                        position: "absolute",
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        background: "var(--amb-highlight-color)",
                        top: "50%",
                        left: "50%",
                        marginTop: "-45px",
                        marginLeft: "-45px",
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
          <div className="scene-hint">grounded recess — lit-wall shadow + far-wall bounce · new</div>
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
              <AmbientKnob value={knob2} onChange={setKnob2} variant="flute" label="Knob" />
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
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton shape="round" material="shiny" aria-label="Round button" />
            </div>
            <div className="component-cell" data-visible={compView.visible}>
              <AmbientButton shape="square">FX</AmbientButton>
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
   THEME BAR — the header. Presets + a settings pulldown that drives the
   global light. Everything below re-lights from these values.
   ══════════════════════════════════════════════════════════════════════════ */

type ThemeBarProps = {
  theme: ThemePreset;
  activePreset: string;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onPreset: (p: ThemePreset) => void;
  onProp: (key: keyof AmbientTheme, value: number) => void;
  themebarRef: React.RefObject<HTMLElement | null>;
  brandRef: React.RefObject<HTMLDivElement | null>;
};

function ThemeBar({ theme, activePreset, settingsOpen, onToggleSettings, onPreset, onProp, themebarRef, brandRef }: ThemeBarProps) {
  return (
    <header className="themebar" ref={themebarRef}>
      {/* Panel skin fades in as the bar docks (opacity rides --scroll-p). */}
      <AmbientPanel material="matte" className="themebar-skin" aria-hidden />

      <div className="themebar-brand" ref={brandRef}>
        ambient
      </div>

      {/* Presets — real AmbientButtons seated in the bar, each with an LED
          that lights (and the cap goes shiny) when its preset is active. */}
      <div className="themebar-presets">
        {THEME_PRESETS.map((p) => {
          const active = activePreset === p.label;
          return (
            <div className="preset-item" key={p.label}>
              <span
                className={`amb-led preset-led${active ? "" : " amb-led-off"}`}
                style={{ "--amb-led-color": p.led } as React.CSSProperties}
              />
              <AmbientButton
                className={`preset-btn${active ? " is-active" : ""}`}
                material={active ? "shiny" : "matte"}
                onClick={() => onPreset(p)}
                aria-pressed={active}
              >
                <span className="preset-inner">
                  <span className="preset-icon">{p.icon}</span>
                  {p.label}
                </span>
              </AmbientButton>
            </div>
          );
        })}
      </div>

      {/* Settings — a metal (shiny) key that drops a knob console. */}
      <div className="themebar-settings">
        <AmbientButton
          className={`settings-btn${settingsOpen ? " is-active" : ""}`}
          material="shiny"
          onClick={onToggleSettings}
          aria-expanded={settingsOpen}
        >
          <span className="preset-inner">
            <span className="settings-gear">⚙</span>
            Light
            <span className={`settings-caret${settingsOpen ? " is-open" : ""}`}>▾</span>
          </span>
        </AmbientButton>

        {settingsOpen && (
          <AmbientPanel material="matte" className="settings-menu">
            <div className="settings-title">
              Global light
              <span className="settings-preset">{activePreset}</span>
            </div>
            <div className="settings-console">
              {LIGHT_KNOBS.map((k) => (
                <AmbientKnob
                  key={k.key}
                  value={k.value(theme)}
                  min={k.min}
                  max={k.max}
                  step={k.step}
                  variant={k.variant}
                  onChange={(v) => onProp(k.prop, k.to(v))}
                  label={k.label}
                />
              ))}
            </div>
            <div className="settings-hint">every scene re-lights live</div>
          </AmbientPanel>
        )}
      </div>
    </header>
  );
}
