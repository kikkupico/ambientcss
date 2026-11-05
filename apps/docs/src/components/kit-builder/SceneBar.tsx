/* The scene: the room the kit is lit by, chosen above the stage.
 *
 *  A row of preset rooms — day, dusk, night and a couple more — each with
 *  its own lamp, the way the demo app's header bank works, and a Custom key
 *  that opens the full lighting console. Picking a preset glides the light
 *  there rather than cutting, because watching a kit relight is how you see
 *  whether it holds up.
 *
 *  A preset is LIGHT only. A kit's accent, panel colour and label colour are
 *  the kit's own business, and changing the time of day should not repaint
 *  them. */

import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { KitConfig } from "./config";
import { SceneEditor } from "./Editors";
import { Icon } from "./ExportDialog";
import { Note } from "./Fields";

type Lighting = Pick<
  KitConfig["theme"],
  "lightX" | "lightY" | "keyLight" | "fillLight" | "lightHue" | "lightSaturation" | "lumeHue"
>;

const LIGHT_KEYS: (keyof Lighting)[] = [
  "lightX",
  "lightY",
  "keyLight",
  "fillLight",
  "lightHue",
  "lightSaturation",
  "lumeHue"
];

export type ScenePreset = { id: string; label: string; icon: string; lamp: string; light: Lighting };

/** Day is the builder's own default room, so a fresh kit opens on it. */
export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "day",
    label: "Day",
    icon: "sun",
    lamp: "#f59e0b",
    light: { lightX: -1, lightY: -1, keyLight: 0.9, fillLight: 0.72, lightHue: 220, lightSaturation: 14, lumeHue: 190 }
  },
  {
    id: "dusk",
    label: "Dusk",
    icon: "sunset",
    lamp: "#fb7185",
    /* A low sun from the side: long shadows, a warm cast, the fill gone
       amber with it. */
    light: { lightX: -1, lightY: -0.3, keyLight: 0.66, fillLight: 0.42, lightHue: 18, lightSaturation: 42, lumeHue: 24 }
  },
  {
    id: "night",
    label: "Night",
    icon: "moon",
    lamp: "#6366f1",
    light: { lightX: 0.7, lightY: -0.7, keyLight: 0.125, fillLight: 0, lightHue: 250, lightSaturation: 30, lumeHue: 16 }
  },
  {
    id: "studio",
    label: "Studio",
    icon: "spot",
    lamp: "#e5e7eb",
    /* Straight overhead and neutral: no light direction to hide behind. */
    light: { lightX: 0, lightY: -1, keyLight: 0.7, fillLight: 0.56, lightHue: 215, lightSaturation: 6, lumeHue: 200 }
  },
  {
    id: "scifi",
    label: "Sci-fi",
    icon: "sparkle",
    lamp: "#22d3d3",
    light: { lightX: 0, lightY: -0.9, keyLight: 0.2, fillLight: 0.05, lightHue: 190, lightSaturation: 50, lumeHue: 180 }
  }
];

const near = (a: number, b: number) => Math.abs(a - b) < 1e-3;

export function activeScenePreset(theme: KitConfig["theme"]): ScenePreset | undefined {
  return SCENE_PRESETS.find((preset) => LIGHT_KEYS.every((key) => near(theme[key], preset.light[key])));
}

/** Hue goes round the short way, so dusk to night passes through purple
 *  rather than back through green. */
function lerpHue(a: number, b: number, t: number): number {
  const delta = ((((b - a) % 360) + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}

const GLIDE_MS = 700;

/** Glide the scene's light to a preset, the demo app's 800ms ease-out in a
 *  little less. Each frame is an ordinary config change, so undo takes the
 *  whole glide back in one step — history only records a state once it has
 *  stopped changing. */
export function useSceneGlide(
  current: KitConfig["theme"],
  apply: (light: Lighting) => void
): (target: Lighting) => void {
  const frame = useRef(0);
  const live = useRef(current);
  live.current = current;

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return useCallback(
    (target: Lighting) => {
      cancelAnimationFrame(frame.current);
      const reduce =
        typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        apply(target);
        return;
      }
      const from = { ...live.current };
      const start = performance.now();
      const tick = (now: number) => {
        const raw = Math.min((now - start) / GLIDE_MS, 1);
        const t = 1 - Math.pow(1 - raw, 3);
        const next = {} as Lighting;
        for (const key of LIGHT_KEYS) {
          next[key] =
            key === "lightHue" || key === "lumeHue"
              ? lerpHue(from[key], target[key], t)
              : from[key] + (target[key] - from[key]) * t;
        }
        /* Land exactly on the preset, so it reads as selected. */
        apply(raw < 1 ? next : target);
        if (raw < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    },
    [apply]
  );
}

/* ── The bar ──────────────────────────────────────────────────────────── */

export function SceneBar({
  theme,
  customOpen,
  onPreset,
  onCustom
}: {
  theme: KitConfig["theme"];
  customOpen: boolean;
  onPreset: (preset: ScenePreset) => void;
  onCustom: () => void;
}) {
  const active = activeScenePreset(theme);
  return (
    <div className="kb-scene-bar" role="group" aria-label="Scene">
      <span className="kb-scene-label">Scene</span>
      <div className="kb-scene-keys">
        {SCENE_PRESETS.map((preset) => {
          const on = active?.id === preset.id && !customOpen;
          return (
            <button
              key={preset.id}
              type="button"
              className={`kb-scene-key${on ? " kb-scene-key-on" : ""}`}
              aria-pressed={on}
              title={`${preset.label} lighting`}
              style={{ "--kb-lamp": preset.lamp } as CSSProperties}
              onClick={() => onPreset(preset)}
            >
              <span className="kb-scene-lamp" aria-hidden />
              <Icon name={preset.icon} size={14} />
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          className={`kb-scene-key kb-scene-custom${!active || customOpen ? " kb-scene-key-on" : ""}`}
          aria-pressed={!active || customOpen}
          aria-haspopup="dialog"
          aria-expanded={customOpen}
          style={{ "--kb-lamp": "#a78bfa" } as CSSProperties}
          onClick={onCustom}
        >
          <span className="kb-scene-lamp" aria-hidden />
          <Icon name="sliders" size={14} />
          Custom…
        </button>
      </div>
    </div>
  );
}

/* ── The custom console ───────────────────────────────────────────────── */

/** The full lighting console, in a dialog that does NOT cover the stage: it
 *  docks over the inspector (or, on a phone, slides up under the pinned
 *  stage), with no dimming, so the kit relights in plain view as you drag. */
export function SceneDialog({
  config,
  patch,
  onClose
}: {
  config: KitConfig;
  patch: (key: "theme" | "panel", values: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    /* On a phone the console is a sheet along the bottom: bring the stage
       up to where it pins, so the kit is in view above the sheet. */
    if (window.matchMedia?.("(max-width: 760px)").matches) {
      const stage = document.querySelector(".kb-stage");
      if (stage) window.scrollTo({ top: window.scrollY + stage.getBoundingClientRect().top - 60, behavior: "smooth" });
    }
    dialog.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      ref={dialog}
      className="kb-scene-dialog"
      role="dialog"
      aria-modal="false"
      aria-labelledby="kb-scene-title"
      tabIndex={-1}
    >
      <header className="kb-scene-dialog-head">
        <div>
          <h2 id="kb-scene-title" className="kb-dialog-title">
            Custom scene
          </h2>
          <p className="kb-dialog-sub">The stage relights as you go.</p>
        </div>
        <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>
      <div className="kb-scene-dialog-body">
        <SceneEditor config={config} patch={patch} />
        <Note>The scene isn't part of the kit. It's exported beside it so the file reproduces what you see here.</Note>
      </div>
      <footer className="kb-scene-dialog-foot">
        <button type="button" className="kb-btn kb-btn-primary" onClick={onClose}>
          Done
        </button>
      </footer>
    </div>
  );
}
