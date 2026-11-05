/* The Kit Builder.
 *
 *  Three columns, like any design tool: the controls on the left, the one
 *  you're working on in the middle — running, in the kit's own light — and
 *  its layers and their properties on the right. What you edit is always the
 *  real thing: a list of library parts and shapes per frame, which is what a
 *  kit is. A shipped look is a starting point, not a mode.
 *
 *  What comes out is a module and, when shapes are involved, the stylesheet
 *  it imports — the same stylesheet this page is running. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import { buildStyles, emitKit, emitUsage, styleFileName } from "./emit";
import { FAMILIES, FAMILY_LABELS } from "./catalog";
import type { FamilyName } from "./catalog";
import {
  DEFAULT_CONFIG,
  KIT_PRESETS,
  applyKitPreset,
  decodeConfig,
  encodeConfig,
  fileName,
  isPristine,
  kitIdent,
  seedPatch,
  themeIdent
} from "./config";
import type { KitConfig, KitPresetName } from "./config";
import { FRAMES, defaultPart, defaultShape, duplicateElement, elementApplies } from "./model";
import type { FrameName, KitElement, PartName } from "./model";
import { FAMILY_PARTS, PARTS, partDefaults } from "./parts";
import { ControlEditor, FRAME_INFO, LayerEditor, SCENE_PRESETS, SceneEditor, elementLabel } from "./Editors";
import { Note, Segmented, Slider, Toggle } from "./Fields";
import { CONTROLS, Canvas, ControlPreview, KitStyles, Rack, Thumb, isolate } from "./Stage";
import type { ControlDef, ControlId, PreviewState } from "./Stage";
import { ExportDialog, Icon, useCopy } from "./ExportDialog";
import type { ExportFile } from "./ExportDialog";
import { useHistory } from "./useHistory";
import { SEED_LABELS } from "./seeds";
import type { SeedName } from "./seeds";
import "./kit-builder.css";

const STORAGE_KEY = "ambientcss:kit-builder";

/* ── Loading and saving ───────────────────────────────────────────────── */

/** A link wins; otherwise whatever you had open last time. */
function initialConfig(): KitConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const hash = window.location.hash;
  if (hash.startsWith("#s=")) {
    const fromLink = decodeConfig(hash.slice(3));
    if (fromLink) return fromLink;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const fromStorage = saved ? decodeConfig(saved) : null;
    if (fromStorage) return fromStorage;
  } catch {
    /* Storage can be blocked; starting fresh is the right answer then. */
  }
  return DEFAULT_CONFIG;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** A control's layers as the list shows them: in paint order, and — for the
 *  two travel controls — only the layers that reach this one. Hidden layers
 *  stay in the list; that is where you turn them back on. */
function layersFor(config: KitConfig, control: ControlDef): KitElement[] {
  const all = config[control.family].elements ?? [];
  const visible =
    control.family === "travel" ? all.filter((element) => elementApplies(element, control.upright)) : all;
  return FRAMES.flatMap((frame) => visible.filter((element) => element.frame === frame));
}

function controlStatus(config: KitConfig, family: FamilyName): string {
  const state = config[family];
  if (!state.dressed) return "Library default";
  return `${SEED_LABELS[state.seed]}${isPristine(config, family) ? "" : " · edited"}`;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return true;
  if (target.tagName !== "INPUT") return false;
  const type = (target as HTMLInputElement).type;
  return type === "text" || type === "search" || type === "url" || type === "number";
}

type Selection = { kind: "control"; id: ControlId } | { kind: "scene" };

type Toast = { id: number; message: string; undo?: boolean };

/* ── The page ─────────────────────────────────────────────────────────── */

export default function KitBuilder() {
  const history = useHistory<KitConfig>(initialConfig);
  const config = history.state;
  const setConfig = history.set;

  /* The config a moment after it stopped changing. The stage runs live — it
     has to follow a drag — but the address bar, the code and the thumbnails
     run on this: a slider fires on every pixel, and Safari refuses more than
     about a hundred `replaceState` calls in thirty seconds. */
  const [settled, setSettled] = useState<KitConfig>(config);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(config), 250);
    return () => window.clearTimeout(timer);
  }, [config]);

  const [selection, setSelection] = useState<Selection>({ kind: "control", id: "knob" });
  const [lastControl, setLastControl] = useState<ControlId>("knob");
  /* Per control, so coming back to the knob puts you back where you were. */
  const [picked, setPicked] = useState<Partial<Record<ControlId, string | null>>>({});
  const [stageView, setStageView] = useState<"control" | "rack">("control");
  const [size, setSize] = useState<"sm" | "md" | "lg">("lg");
  const [solo, setSolo] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ value: 62, on: true, bank: "2" });
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, copy] = useCopy();
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string, undo = false) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  /* Saved twice: in the address bar, so a look can be sent as a link, and in
     storage, so closing the tab does not throw an afternoon away. */
  useEffect(() => {
    const encoded = encodeConfig(settled);
    window.history.replaceState(null, "", `#s=${encoded}`);
    setShareUrl(`${window.location.origin}${window.location.pathname}#s=${encoded}`);
    try {
      window.localStorage.setItem(STORAGE_KEY, encoded);
    } catch {
      /* Private mode, or storage full: the link still carries it. */
    }
  }, [settled]);

  /* ── What is selected ───────────────────────────────────────────────── */

  const controlId = selection.kind === "control" ? selection.id : lastControl;
  const control = CONTROLS.find((candidate) => candidate.id === controlId) ?? CONTROLS[0]!;
  const family = control.family;
  const layers = layersFor(config, control);
  const pickedId = selection.kind === "control" ? (picked[control.id] ?? null) : null;
  const current = layers.find((element) => element.id === pickedId) ?? null;

  const selectControl = (id: ControlId) => {
    setSelection({ kind: "control", id });
    setLastControl(id);
    setAdding(false);
    setStageView("control");
  };

  const selectLayer = (id: string | null) => {
    setAdding(false);
    setPicked((prev) => ({ ...prev, [control.id]: id }));
    if (id === null) setSolo(false);
  };

  /* ── Edits ──────────────────────────────────────────────────────────── */

  const setElements = useCallback(
    (target: FamilyName, update: (elements: KitElement[]) => KitElement[]) => {
      setConfig((prev) => ({ ...prev, [target]: { ...prev[target], elements: update(prev[target].elements ?? []) } }));
    },
    [setConfig]
  );

  const patchFamily = useCallback(
    (target: FamilyName, values: Record<string, unknown>) => {
      setConfig((prev) => ({ ...prev, [target]: { ...prev[target], ...values } }));
    },
    [setConfig]
  );

  const patchScene = useCallback(
    (key: "theme" | "panel", values: Record<string, unknown>) => {
      setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...values } }));
    },
    [setConfig]
  );

  const applySeed = useCallback(
    (target: FamilyName, seed: SeedName) => {
      setConfig((prev) => {
        const root = (prev[target] as { root?: Record<string, number | boolean> }).root;
        return { ...prev, [target]: { ...prev[target], ...seedPatch(target, seed, root), dressed: true } };
      });
    },
    [setConfig]
  );

  const applyPreset = (preset: KitPresetName) => {
    setConfig((prev) => applyKitPreset(prev, preset));
    setPicked({});
    notify(`Started from ${KIT_PRESETS.find((p) => p.id === preset)?.label ?? preset}.`, true);
  };

  const replace = (next: KitElement) =>
    setElements(family, (elements) => elements.map((element) => (element.id === next.id ? next : element)));

  const remove = (element: KitElement) => {
    setElements(family, (elements) => elements.filter((candidate) => candidate.id !== element.id));
    selectLayer(null);
    notify(`Removed ${elementLabel(element)}.`, true);
  };

  const duplicate = (element: KitElement) => {
    const all = config[family].elements ?? [];
    const taken = all.flatMap((candidate) => (candidate.kind === "shape" ? [candidate.name] : []));
    const copyOf = duplicateElement(element, taken);
    setElements(family, (elements) => {
      const at = elements.findIndex((candidate) => candidate.id === element.id);
      return [...elements.slice(0, at + 1), copyOf, ...elements.slice(at + 1)];
    });
    selectLayer(copyOf.id);
  };

  const toggleHidden = (element: KitElement) =>
    replace({ ...element, hidden: !element.hidden } as KitElement);

  /* Order inside a frame is paint order, so moving is swapping with the
     neighbour in the same frame — the neighbour the LIST shows, which on the
     travel controls is not the whole list. */
  const neighbour = (element: KitElement, direction: -1 | 1): KitElement | undefined => {
    const siblings = layers.filter((candidate) => candidate.frame === element.frame);
    return siblings[siblings.indexOf(element) + direction];
  };

  const move = (element: KitElement, direction: -1 | 1) => {
    const swap = neighbour(element, direction);
    if (!swap) return;
    setElements(family, (elements) =>
      elements.map((candidate) =>
        candidate.id === element.id ? swap : candidate.id === swap.id ? element : candidate
      )
    );
  };

  const add = (what: PartName | "shape") => {
    setAdding(false);
    const all = config[family].elements ?? [];
    let element: KitElement;
    if (what === "shape") {
      const taken = all.flatMap((candidate) => (candidate.kind === "shape" ? [candidate.name] : []));
      let i = 1;
      while (taken.includes(`shape-${i}`)) i += 1;
      const shape = defaultShape("actuator", `shape-${i}`);
      /* A button's frames are `display: contents` markers and the cap gives
         it a size, so a new layer on a button wraps its label. An absolute
         one would collapse the button to nothing, which reads as a bug. */
      if (family === "press") {
        shape.box = { ...shape.box, place: "flow", width: 11, height: 8.3, radius: "soft" };
        shape.content = "legend";
      }
      element = shape;
    } else {
      element = { ...defaultPart(PARTS[what].frame, what), props: partDefaults(what) };
    }
    /* Added while looking at the slider, it has to show on the slider. */
    if (family === "travel") element.only = control.upright ? "vertical" : "horizontal";
    setElements(family, (elements) => [...elements, element]);
    if (!config[family].dressed) patchFamily(family, { dressed: true });
    selectLayer(element.id);
  };

  /* ── Keyboard ───────────────────────────────────────────────────────── */

  const keyState = useRef({ current, remove, undo: history.undo, redo: history.redo, exporting });
  keyState.current = { current, remove, undo: history.undo, redo: history.redo, exporting };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = keyState.current;
      if (state.exporting || isTyping(event.target)) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        state.redo();
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        state.current &&
        /* Only from the layer list or the stage — never from a stray focus
           somewhere in the form. */
        (event.target === document.body ||
          (event.target instanceof Element && !!event.target.closest(".kb-layers, .kb-stage")))
      ) {
        event.preventDefault();
        state.remove(state.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Output ─────────────────────────────────────────────────────────── */

  const files = useMemo<ExportFile[]>(() => {
    const styles = buildStyles(settled);
    const out: ExportFile[] = [
      {
        id: "kit",
        label: fileName(settled.name),
        name: fileName(settled.name),
        language: "tsx",
        note: `Exports ${kitIdent(settled.name)} and the scene it was tuned under, ${themeIdent(settled.name)}. Imports only parts @ambientcss/components exports.`,
        contents: emitKit(settled, shareUrl ?? undefined)
      }
    ];
    if (styles) {
      out.push({
        id: "css",
        label: styleFileName(settled),
        name: styleFileName(settled),
        language: "css",
        note: "The shapes, as rules. The kit file imports it. Every rule is two classes wide, so it wins over the library's own styles whatever the import order.",
        contents: styles
      });
    }
    out.push({
      id: "usage",
      label: "Usage",
      name: "rack.tsx",
      language: "tsx",
      note: "Put the kit above your controls. The controls themselves don't change.",
      contents: emitUsage(settled)
    });
    return out;
  }, [settled, shareUrl]);

  const hiddenCount = FAMILIES.reduce(
    (sum, candidate) => sum + (config[candidate].elements ?? []).filter((element) => element.hidden).length,
    0
  );

  /* ── Stage ──────────────────────────────────────────────────────────── */

  const stageConfig = useMemo(
    () => (solo && current ? isolate(config, family, current.id) : config),
    [solo, current, config, family]
  );
  const showRack = stageView === "rack" || selection.kind === "scene";
  const undressed = !config[family].dressed;
  const activeScene = SCENE_PRESETS.find((preset) =>
    Object.entries(preset.theme).every(([key, value]) => config.theme[key as keyof KitConfig["theme"]] === value)
  );

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="kb">
      <KitStyles config={stageConfig} highlight={!showRack && current ? { family, element: current } : null} />

      <header className="kb-toolbar">
        <div className="kb-toolbar-title">
          <h1 className="kb-title">Kit Builder</h1>
          <label className="kb-name">
            <span className="kb-visually-hidden">Kit name</span>
            <input
              className="kb-name-input"
              value={config.name}
              spellCheck={false}
              onChange={(e) => {
                const name = e.target.value;
                setConfig((prev) => ({ ...prev, name }));
              }}
            />
          </label>
        </div>

        <div className="kb-toolbar-actions">
          <label className="kb-preset">
            <span className="kb-visually-hidden">Start the whole kit from</span>
            <select
              className="kb-select kb-preset-select"
              value=""
              onChange={(e) => {
                if (e.target.value) applyPreset(e.target.value as KitPresetName);
              }}
            >
              <option value="" disabled>
                Start from…
              </option>
              {KIT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} — {preset.note}
                </option>
              ))}
            </select>
          </label>
          <div className="kb-btn-group">
            <button
              type="button"
              className="kb-btn kb-btn-icon"
              title="Undo (Ctrl/⌘ Z)"
              aria-label="Undo"
              disabled={!history.canUndo}
              onClick={history.undo}
            >
              <Icon name="undo" />
            </button>
            <button
              type="button"
              className="kb-btn kb-btn-icon"
              title="Redo (Ctrl/⌘ Shift Z)"
              aria-label="Redo"
              disabled={!history.canRedo}
              onClick={history.redo}
            >
              <Icon name="redo" />
            </button>
          </div>
          <button
            type="button"
            className="kb-btn kb-hide-narrow"
            disabled={!shareUrl}
            onClick={() => shareUrl && copy("link", shareUrl)}
          >
            <Icon name={copied === "link" ? "check" : "link"} />
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
          <button type="button" className="kb-btn kb-btn-primary" onClick={() => setExporting(true)}>
            <Icon name="code" />
            Export
          </button>
        </div>
      </header>

      <div className="kb-workspace">
        {/* ── Controls ── */}
        <nav className="kb-sidebar" aria-label="Controls">
          <h2 className="kb-panel-title">Controls</h2>
          <ul className="kb-control-list">
            {CONTROLS.map((candidate) => {
              const on = selection.kind === "control" && selection.id === candidate.id;
              return (
                <li key={candidate.id} className={`kb-control${on ? " kb-control-on" : ""}`}>
                  {/* The thumbnail is a real control (a button, for the
                      button), so it sits beside the hit target rather than
                      inside it: a button may not contain a button. */}
                  <span className="kb-control-thumb">
                    <Thumb config={settled} control={candidate} />
                  </span>
                  <span className="kb-control-text">
                    <span className="kb-control-name">{candidate.label}</span>
                    <span className="kb-control-status">{controlStatus(settled, candidate.family)}</span>
                  </span>
                  <button
                    type="button"
                    className="kb-hit"
                    aria-label={`${candidate.label}: ${controlStatus(settled, candidate.family)}`}
                    aria-current={on ? "true" : undefined}
                    onClick={() => selectControl(candidate.id)}
                  />
                </li>
              );
            })}
            <li className={`kb-control kb-control-scene${selection.kind === "scene" ? " kb-control-on" : ""}`}>
              <span className="kb-control-thumb kb-control-icon">
                <Icon name="sun" size={20} />
              </span>
              <span className="kb-control-text">
                <span className="kb-control-name">Scene</span>
                <span className="kb-control-status">{activeScene ? activeScene.label : "Custom light"}</span>
              </span>
              <button
                type="button"
                className="kb-hit"
                aria-label="Scene and lighting"
                aria-current={selection.kind === "scene" ? "true" : undefined}
                onClick={() => {
                  setSelection({ kind: "scene" });
                  setAdding(false);
                }}
              />
            </li>
          </ul>
        </nav>

        {/* ── Stage ── */}
        <main className="kb-stage">
          <div className="kb-stage-bar">
            <div className="kb-seg-group" role="radiogroup" aria-label="Stage view">
              <button
                type="button"
                role="radio"
                aria-checked={!showRack}
                className={`kb-seg${!showRack ? " kb-seg-on" : ""}`}
                onClick={() => {
                  setStageView("control");
                  if (selection.kind === "scene") setSelection({ kind: "control", id: lastControl });
                }}
              >
                {control.label}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={showRack}
                className={`kb-seg${showRack ? " kb-seg-on" : ""}`}
                onClick={() => setStageView("rack")}
              >
                Whole rack
              </button>
            </div>
            {!showRack ? (
              <div className="kb-stage-tools">
                {current ? (
                  <button
                    type="button"
                    className={`kb-btn kb-btn-small${solo ? " kb-btn-on" : ""}`}
                    aria-pressed={solo}
                    title="Show only the selected layer"
                    onClick={() => setSolo((on) => !on)}
                  >
                    <Icon name="focus" size={14} />
                    Isolate
                  </button>
                ) : null}
                <div className="kb-seg-group" role="radiogroup" aria-label="Preview size">
                  {(["sm", "md", "lg"] as const).map((candidate) => (
                    <button
                      key={candidate}
                      type="button"
                      role="radio"
                      aria-checked={size === candidate}
                      className={`kb-seg${size === candidate ? " kb-seg-on" : ""}`}
                      onClick={() => setSize(candidate)}
                    >
                      {candidate === "sm" ? "S" : candidate === "md" ? "M" : "L"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={`kb-stage-frame${showRack ? " kb-stage-frame-rack" : ""}`}>
            <Canvas config={stageConfig}>
              {showRack ? (
                <Rack state={preview} onState={(patch) => setPreview((prev) => ({ ...prev, ...patch }))} />
              ) : (
                <div className="kb-stage-control">
                  <ControlPreview
                    control={control}
                    size={size}
                    state={preview}
                    onState={(patch) => setPreview((prev) => ({ ...prev, ...patch }))}
                  />
                </div>
              )}
            </Canvas>
            {!showRack && undressed ? (
              <div className="kb-stage-badge">Library default — this kit doesn't dress {FAMILY_LABELS[family].toLowerCase()}</div>
            ) : null}
            {solo && current && !showRack ? <div className="kb-stage-badge">Showing only {elementLabel(current)}</div> : null}
          </div>

          {!showRack ? (
            <div className="kb-stage-foot">
              {control.id === "knob" || control.id === "fader" || control.id === "slider" ? (
                <Slider
                  label="Try a value"
                  value={preview.value}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(value) => setPreview((prev) => ({ ...prev, value }))}
                />
              ) : null}
              {control.id === "switch" ? (
                <Toggle label="Try it" checked={preview.on} onChange={(on) => setPreview((prev) => ({ ...prev, on }))} />
              ) : null}
              {control.id === "bank" ? (
                <Segmented
                  label="Selected key"
                  value={preview.bank}
                  options={["1", "2", "3", "4"].map((value) => ({ value, label: value }))}
                  onChange={(bank) => setPreview((prev) => ({ ...prev, bank }))}
                />
              ) : null}
              {control.id === "button" ? <Note>Press the button on the stage to try it.</Note> : null}
            </div>
          ) : (
            <div className="kb-stage-foot">
              <Note>Every control here is an ordinary component. Only the kit above them changed.</Note>
            </div>
          )}
        </main>

        {/* ── Inspector ── */}
        <aside className="kb-inspector" aria-label="Inspector">
          {selection.kind === "scene" ? (
            <>
              <div className="kb-inspector-head">
                <h2 className="kb-inspector-title">Scene</h2>
              </div>
              <SceneEditor config={config} patch={patchScene} />
            </>
          ) : (
            <>
              <div className="kb-inspector-head">
                <h2 className="kb-inspector-title">{control.label}</h2>
                <span className="kb-pill">{controlStatus(config, family)}</span>
              </div>
              {control.family === "travel" ? (
                <Note>The fader and slider share one layer list. Layers can be limited to one of them.</Note>
              ) : null}

              <div className="kb-layers">
                <div className="kb-layers-head">
                  <h3 className="kb-panel-title">Layers</h3>
                  <button
                    type="button"
                    className={`kb-btn kb-btn-small${adding ? " kb-btn-on" : ""}`}
                    aria-expanded={adding}
                    onClick={() => setAdding((on) => !on)}
                  >
                    <Icon name="plus" size={14} />
                    Add
                  </button>
                </div>

                {adding ? (
                  <div className="kb-add-menu">
                    <button type="button" className="kb-add-item" onClick={() => add("shape")}>
                      <strong>Shape</strong>
                      <span>Draw your own: a box with a structure, surface and colour.</span>
                    </button>
                    {(FAMILY_PARTS[family] ?? []).map((name) => (
                      <button key={name} type="button" className="kb-add-item" onClick={() => add(name)}>
                        <strong>{PARTS[name].label}</strong>
                        <span>
                          {PARTS[name].note.charAt(0).toUpperCase() + PARTS[name].note.slice(1)}.
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  className={`kb-layer-settings${current === null ? " kb-layer-settings-on" : ""}`}
                  onClick={() => selectLayer(null)}
                >
                  <Icon name="sliders" size={14} />
                  Control settings
                </button>

                {layers.length === 0 ? (
                  <p className="kb-empty">No layers yet. Add a shape or a part to start drawing.</p>
                ) : (
                  FRAMES.map((frame) => {
                    const inFrame = layers.filter((element) => element.frame === frame);
                    if (inFrame.length === 0) return null;
                    return (
                      <div key={frame} className="kb-frame">
                        <div className="kb-frame-head" title={FRAME_INFO[frame].note}>
                          <span>{FRAME_INFO[frame].label}</span>
                          <span className="kb-frame-note">{FRAME_INFO[frame].note}</span>
                        </div>
                        <ul className="kb-layer-list">
                          {inFrame.map((element) => (
                            <LayerRow
                              key={element.id}
                              element={element}
                              control={control}
                              config={settled}
                              selected={current?.id === element.id}
                              canUp={!!neighbour(element, -1)}
                              canDown={!!neighbour(element, 1)}
                              onSelect={() => selectLayer(current?.id === element.id ? null : element.id)}
                              onToggle={() => toggleHidden(element)}
                              onMove={(direction) => move(element, direction)}
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>

              {current ? (
                <div className="kb-props">
                  <div className="kb-props-head">
                    <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon" aria-label="Back to control settings" onClick={() => selectLayer(null)}>
                      <Icon name="back" />
                    </button>
                    <h3 className="kb-props-title">{elementLabel(current)}</h3>
                    <span className="kb-pill">{current.kind === "part" ? "Library part" : "Shape"}</span>
                    <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon" title="Duplicate" aria-label="Duplicate layer" onClick={() => duplicate(current)}>
                      <Icon name="duplicate" />
                    </button>
                    <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon kb-btn-danger" title="Delete (Del)" aria-label="Delete layer" onClick={() => remove(current)}>
                      <Icon name="trash" />
                    </button>
                  </div>
                  <LayerEditor element={current} family={family} onChange={replace} />
                </div>
              ) : (
                <div className="kb-props">
                  {undressed ? (
                    <Note tone="warn">
                      This kit doesn't dress {FAMILY_LABELS[family].toLowerCase()}, so the stage shows the library's
                      grounded look. Turn on <em>Dress it</em> to use the layers above.
                    </Note>
                  ) : null}
                  <ControlEditor family={family} config={config} patch={patchFamily} onSeed={applySeed} />
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      <section className="kb-help" aria-label="How it works">
        <div>
          <h3>Layers and frames</h3>
          <p>
            A control has four frames, painted in order: <strong>Panel</strong> (printed behind it),{" "}
            <strong>Base</strong>, <strong>Moving</strong> (turns or slides with the value) and{" "}
            <strong>Top</strong>. Each frame holds layers.
          </p>
        </div>
        <div>
          <h3>Parts and shapes</h3>
          <p>
            A layer is either a <strong>library part</strong> from <code>@ambientcss/components</code>, or a{" "}
            <strong>shape</strong>: a <code>&lt;span&gt;</code> with a generated CSS rule. The console kit is
            mostly shapes.
          </p>
        </div>
        <div>
          <h3>What you get</h3>
          <p>
            A <code>ControlKit</code> module and, if you used shapes, its stylesheet. Wrap your controls in{" "}
            <code>&lt;AmbientKitProvider&gt;</code>. Read more in the <Link to="/ambient-components/kits">kits guide</Link>.
          </p>
        </div>
        <p className="kb-help-keys">
          <kbd>Ctrl/⌘ Z</kbd> undo · <kbd>Ctrl/⌘ Shift Z</kbd> redo · <kbd>Del</kbd> delete layer · your work is saved in
          this browser and in the page link.
        </p>
      </section>

      {exporting ? (
        <ExportDialog files={files} shareUrl={shareUrl} hiddenCount={hiddenCount} onClose={() => setExporting(false)} />
      ) : null}

      {toast ? (
        <div className="kb-toast" role="status" key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              className="kb-link"
              onClick={() => {
                history.undo();
                setToast(null);
              }}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ── One row in the layer list ────────────────────────────────────────── */

function LayerRow({
  element,
  control,
  config,
  selected,
  canUp,
  canDown,
  onSelect,
  onToggle,
  onMove
}: {
  element: KitElement;
  control: ControlDef;
  config: KitConfig;
  selected: boolean;
  canUp: boolean;
  canDown: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const label = elementLabel(element);
  return (
    <li className={`kb-layer${selected ? " kb-layer-on" : ""}${element.hidden ? " kb-layer-hidden" : ""}`}>
      <span className="kb-layer-main">
        <span className="kb-layer-thumb">
          <Thumb config={config} control={control} elementId={element.id} />
        </span>
        <button type="button" className="kb-hit" aria-label={`Edit ${label}`} aria-pressed={selected} onClick={onSelect} />
        <span className="kb-layer-text">
          <span className="kb-layer-name">{label}</span>
          <span className="kb-layer-kind">
            {element.kind === "part" ? "Part" : "Shape"}
            {element.only && element.only !== "both" ? ` · ${element.only === "vertical" ? "fader only" : "slider only"}` : ""}
            {element.bankScope === "panel" ? " · rail" : ""}
            {element.bankState && element.bankState !== "both" ? ` · ${element.bankState === "on" ? "selected" : "unselected"}` : ""}
          </span>
        </span>
      </span>
      <span className="kb-layer-tools">
        <button
          type="button"
          className="kb-btn kb-btn-ghost kb-btn-icon kb-btn-tiny"
          aria-label={element.hidden ? `Show ${label}` : `Hide ${label}`}
          title={element.hidden ? "Show" : "Hide"}
          onClick={onToggle}
        >
          <Icon name={element.hidden ? "eyeOff" : "eye"} size={14} />
        </button>
        <button
          type="button"
          className="kb-btn kb-btn-ghost kb-btn-icon kb-btn-tiny"
          aria-label={`Paint ${label} earlier`}
          title="Paint earlier"
          disabled={!canUp}
          onClick={() => onMove(-1)}
        >
          <Icon name="up" size={14} />
        </button>
        <button
          type="button"
          className="kb-btn kb-btn-ghost kb-btn-icon kb-btn-tiny"
          aria-label={`Paint ${label} later`}
          title="Paint later"
          disabled={!canDown}
          onClick={() => onMove(1)}
        >
          <Icon name="down" size={14} />
        </button>
      </span>
    </li>
  );
}

export type { FrameName };
