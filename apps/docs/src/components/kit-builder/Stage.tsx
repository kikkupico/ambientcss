/* The renderings: one control large, the whole rack, and thumbnails.
 *
 *  All of them are the kit being built, running. The call sites are the
 *  ordinary presets any app writes, and the stylesheet behind them is the
 *  string the export writes, injected once. Nothing here is a picture. */

import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKitProvider,
  AmbientKnob,
  AmbientPanel,
  AmbientProvider,
  AmbientSelect,
  AmbientSlider,
  AmbientSwitch
} from "@ambientcss/components";
import { buildKit, buildStyles, buildTheme } from "./emit";
import type { KitConfig } from "./config";
import { kitSlug } from "./config";
import type { FamilyName } from "./catalog";
import { shapeSelector } from "./model";
import type { KitElement } from "./model";

/** The controls the builder lists. Six over five families: a fader and a
 *  slider are one family and one layer list, but only a tab each shows what
 *  a layer marked "fader only" actually does. */
export type ControlDef = {
  id: ControlId;
  label: string;
  family: FamilyName;
  /** Travel only. Vertical is the fader. */
  upright: boolean;
};

export type ControlId = "knob" | "button" | "slider" | "fader" | "switch" | "bank";

export const CONTROLS: ControlDef[] = [
  { id: "knob", label: "Knob", family: "rotary", upright: true },
  { id: "fader", label: "Fader", family: "travel", upright: true },
  { id: "slider", label: "Slider", family: "travel", upright: false },
  { id: "button", label: "Button", family: "press", upright: true },
  { id: "switch", label: "Switch", family: "latch", upright: true },
  { id: "bank", label: "Key bank", family: "bank", upright: true }
];

const BANK = [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }];

/* ── The kit, as the preview runs it ──────────────────────────────────── */

export function Scene({
  config,
  className,
  style,
  children
}: {
  config: KitConfig;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const kit = useMemo(() => buildKit(config), [config]);
  const theme = useMemo(() => buildTheme(config), [config]);
  const accent = config.theme.accent;
  return (
    <AmbientProvider
      theme={theme}
      className={className}
      style={{ ...(accent ? { "--ambx-accent": accent } : null), ...style } as CSSProperties}
    >
      <AmbientKitProvider kit={kit}>{children}</AmbientKitProvider>
    </AmbientProvider>
  );
}

/** The kit's own stylesheet — the same string the export writes — plus, for
 *  the stage only, an outline on the selected shape so you can find it. */
export function KitStyles({
  config,
  highlight
}: {
  config: KitConfig;
  highlight?: { family: FamilyName; element: KitElement } | null;
}) {
  /* Every shape's rule, hidden or not: a rule for an element that is not
     rendered is harmless, and the thumbnail of a hidden or isolated layer
     still needs it. Only the export leaves hidden shapes out. */
  const styles = useMemo(() => buildStyles(unhideAll(config)), [config]);
  const outline =
    highlight && highlight.element.kind === "shape" && !highlight.element.hidden
      ? `.kb-stage-canvas ${shapeSelector(kitSlug(config.name), highlight.family, highlight.element)} {` +
        ` outline: 1.5px dashed var(--kb-accent, #3b82f6); outline-offset: 2px; }`
      : "";
  return (
    <>
      {styles ? <style>{styles}</style> : null}
      {outline ? <style>{outline}</style> : null}
    </>
  );
}

function unhideAll(config: KitConfig): KitConfig {
  const next = { ...config } as Record<string, unknown>;
  for (const family of ["rotary", "travel", "press", "latch", "bank"] as const) {
    next[family] = {
      ...config[family],
      dressed: true,
      elements: config[family].elements.map((element) => (element.hidden ? { ...element, hidden: false } : element))
    };
  }
  return next as KitConfig;
}

/* ── Isolating one layer ──────────────────────────────────────────────── */

/** A button's frames are `display: contents` markers and its CAP gives it a
 *  size. Isolate the legend alone and you get a zero-height sliver, which
 *  reads as broken. So whatever sizes a button stays in every isolation. */
function sizesTheControl(family: FamilyName, element: KitElement) {
  if (family !== "press") return false;
  return element.kind === "part" || element.box.place === "flow";
}

export function isolate(config: KitConfig, family: FamilyName, id: string | null): KitConfig {
  if (id === null) return config;
  const elements = config[family].elements ?? [];
  return {
    ...config,
    [family]: {
      ...config[family],
      /* Always dressed, and the chosen layer always visible: a thumbnail of
         a hidden layer should still show what the layer is. */
      dressed: true,
      elements: elements
        .filter((element) => element.id === id || (sizesTheControl(family, element) && !element.hidden))
        .map((element) => (element.id === id ? { ...element, hidden: false } : element))
    }
  };
}

/* ── One control ──────────────────────────────────────────────────────── */

export type PreviewState = {
  value: number;
  on: boolean;
  bank: string;
};

export function ControlPreview({
  control,
  size,
  state,
  onState,
  label = true
}: {
  control: ControlDef;
  size: "sm" | "md" | "lg";
  state: PreviewState;
  onState?: (patch: Partial<PreviewState>) => void;
  label?: boolean;
}) {
  const set = onState ?? (() => undefined);
  switch (control.id) {
    case "knob":
      return (
        <AmbientKnob label={label ? "LEVEL" : undefined} size={size} value={state.value} onChange={(value) => set({ value })} />
      );
    case "fader":
      return (
        <AmbientFader label={label ? "LEVEL" : undefined} size={size} value={state.value} onChange={(value) => set({ value })} />
      );
    case "slider":
      return (
        <AmbientSlider label={label ? "LEVEL" : undefined} size={size} value={state.value} onChange={(value) => set({ value })} />
      );
    case "button":
      return <AmbientButton size={size}>PLAY</AmbientButton>;
    case "switch":
      return (
        <AmbientSwitch label={label ? "ON" : undefined} size={size} led value={state.on} onChange={(on) => set({ on })} />
      );
    case "bank":
      return (
        <AmbientSelect
          label={label ? "BANK" : undefined}
          size={size}
          options={BANK}
          orientation="horizontal"
          value={state.bank}
          onChange={(bank) => set({ bank: bank as string })}
        />
      );
  }
}

/* ── The whole rack ───────────────────────────────────────────────────── */

/** Every family at once — the claim the page exists to make: the call sites
 *  are the ordinary ones and only the kit above them changed. */
export function Rack({
  state,
  onState
}: {
  state: PreviewState;
  onState: (patch: Partial<PreviewState>) => void;
}) {
  return (
    <div className="kb-rack">
      <div className="kb-rack-row">
        <AmbientKnob label="GAIN" value={state.value} onChange={(value) => onState({ value })} />
        <AmbientKnob label="TONE" defaultValue={72} />
        <AmbientSelect
          label="BANK"
          options={BANK}
          orientation="horizontal"
          value={state.bank}
          onChange={(bank) => onState({ bank: bank as string })}
        />
      </div>
      <div className="kb-rack-row">
        <AmbientFader label="LEVEL" value={state.value} onChange={(value) => onState({ value })} />
        <div className="kb-rack-column">
          <AmbientSlider label="MIX" defaultValue={45} />
          <AmbientSwitch label="ON" value={state.on} onChange={(on) => onState({ on })} led />
        </div>
      </div>
      <div className="kb-rack-row">
        <AmbientButton>PLAY</AmbientButton>
        <AmbientButton>REC</AmbientButton>
        <AmbientButton disabled>OFF</AmbientButton>
      </div>
    </div>
  );
}

/** The stage canvas: the kit's own room and panel, filling the area. */
export function Canvas({ config, children }: { config: KitConfig; children: ReactNode }) {
  return (
    <Scene config={config} className="kb-stage-canvas">
      <AmbientPanel material={config.panel.material} className="kb-stage-panel">
        {children}
      </AmbientPanel>
    </Scene>
  );
}

/* ── Thumbnails ───────────────────────────────────────────────────────── */

const THUMB_STATE: PreviewState = { value: 62, on: true, bank: "1" };

/** A control (or one layer of it), rendered small and inert. */
export function Thumb({
  config,
  control,
  elementId = null
}: {
  config: KitConfig;
  control: ControlDef;
  elementId?: string | null;
}) {
  const alone = useMemo(
    () => isolate(config, control.family, elementId),
    [config, control.family, elementId]
  );
  return (
    <Scene config={alone} className="kb-thumb amb-surface">
      {/* Inert rather than disabled: a disabled control is a look of its own. */}
      <div className="kb-thumb-art" data-control={control.id} {...({ inert: "" } as Record<string, string>)}>
        <ControlPreview control={control} size="sm" state={THUMB_STATE} label={false} />
      </div>
    </Scene>
  );
}
