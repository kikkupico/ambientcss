/* The renderings: one control large, one element alone, and the whole rack.
 *
 *  All three are the kit being built, running. The call sites never change —
 *  these are the same presets any app writes, with the same props — and the
 *  stylesheet behind them is the string the export writes, injected once by
 *  the device around them. Nothing here is a picture of the kit. */

import { useMemo, useState } from "react";
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
import type { FamilyName } from "./catalog";

const BANK = [{ value: "1" }, { value: "2" }, { value: "3" }, { value: "4" }];

/** The tabs across the top, and what each one is looking at.
 *
 *  Six controls over five families: a fader and a slider are one family and
 *  one element list, and giving them a tab each is not a fiction — it is the
 *  only way to see what an element marked `sliders only` actually does. */
export type ControlTab = {
  id: string;
  label: string;
  family: FamilyName;
  /** Travel only. Vertical is the fader. */
  upright: boolean;
};

export const CONTROL_TABS: ControlTab[] = [
  { id: "knob", label: "Knob", family: "rotary", upright: true },
  { id: "button", label: "Button", family: "press", upright: true },
  { id: "slider", label: "Slider", family: "travel", upright: false },
  { id: "fader", label: "Fader", family: "travel", upright: true },
  { id: "switch", label: "Switch", family: "latch", upright: true },
  { id: "bank", label: "Bank", family: "bank", upright: true }
];

/* ── The kit, as the preview runs it ──────────────────────────────────── */

function useDressing(config: KitConfig) {
  const kit = useMemo(() => buildKit(config), [config]);
  const theme = useMemo(() => buildTheme(config), [config]);
  return { kit, theme };
}

function Scene({
  config,
  className,
  children
}: {
  config: KitConfig;
  className: string;
  children: ReactNode;
}) {
  const { kit, theme } = useDressing(config);
  const accent = config.theme.accent;
  return (
    <AmbientProvider
      theme={theme}
      className={className}
      {...(accent ? { style: { "--ambx-accent": accent } as CSSProperties } : null)}
    >
      <AmbientKitProvider kit={kit}>{children}</AmbientKitProvider>
    </AmbientProvider>
  );
}

/** The kit's own stylesheet — the SAME string the export writes, injected
 *  into the page once. Every rendering below it, large or thumbnail, is
 *  therefore not a rendering of the file you download; it is that file
 *  running. */
export function KitStyles({ config }: { config: KitConfig }) {
  const styles = useMemo(() => buildStyles(config), [config]);
  return styles ? <style>{styles}</style> : null;
}

/* ── One control, large ───────────────────────────────────────────────── */

export function ControlStage({ config, tab }: { config: KitConfig; tab: ControlTab }) {
  const [value, setValue] = useState(62);
  const [on, setOn] = useState(true);
  const [bank, setBank] = useState("2");
  const [hits, setHits] = useState(0);

  return (
    <Scene config={config} className="kb-stage-scene">
      {tab.family === "rotary" ? (
        <AmbientKnob label="LEVEL" size="lg" value={value} onChange={setValue} />
      ) : null}
      {tab.family === "travel" && tab.upright ? (
        <AmbientFader label="LEVEL" size="lg" value={value} onChange={setValue} />
      ) : null}
      {tab.family === "travel" && !tab.upright ? (
        <AmbientSlider label="LEVEL" size="lg" value={value} onChange={setValue} />
      ) : null}
      {tab.family === "press" ? (
        <AmbientButton size="lg" onClick={() => setHits((n) => n + 1)}>
          {hits % 2 === 0 ? "PLAY" : "STOP"}
        </AmbientButton>
      ) : null}
      {tab.family === "latch" ? (
        <AmbientSwitch label="ON" size="lg" led value={on} onChange={setOn} />
      ) : null}
      {tab.family === "bank" ? (
        <AmbientSelect
          label="BANK"
          size="lg"
          options={BANK}
          orientation="horizontal"
          value={bank}
          onChange={(next) => setBank(next as string)}
        />
      ) : null}
    </Scene>
  );
}

/* ── One element, alone ───────────────────────────────────────────────── */

/** A press control has no boxes of its own: its frames are `display:
 *  contents` markers and the CAP is what gives the button its size. Isolate
 *  the legend on such a control and you get a zero-height sliver, which
 *  reads as a broken thumbnail rather than as a part. So whatever is sizing
 *  the button stays in every one of its thumbnails. */
function sizesTheControl(family: FamilyName, element: KitConfig["press"]["elements"][number]) {
  if (family !== "press") return false;
  return element.kind === "part" || element.box.place === "flow";
}

function isolate(config: KitConfig, family: FamilyName, id: string | null): KitConfig {
  const elements = config[family].elements ?? [];
  return {
    ...config,
    [family]: {
      ...config[family],
      elements:
        id === null
          ? elements
          : elements.filter(
              (element) => element.id === id || sizesTheControl(family, element)
            )
    }
  };
}

/** One element of the control, rendered by itself — which is to say the
 *  whole control, dressed in that element and nothing else. A part is not a
 *  picture; it only means anything inside the frame it was written for. */
export function PartThumb({
  config,
  tab,
  elementId
}: {
  config: KitConfig;
  tab: ControlTab;
  /** `null` renders the control whole. */
  elementId: string | null;
}) {
  const alone = useMemo(
    () => isolate(config, tab.family, elementId),
    [config, tab.family, elementId]
  );

  return (
    <Scene config={alone} className="kb-thumb-scene">
      {/* Inert rather than disabled: a disabled control is a look of its own,
          and these are meant to show the part as it is. */}
      <div className="kb-thumb-art" {...({ inert: "" } as Record<string, string>)}>
        {tab.family === "rotary" ? <AmbientKnob size="sm" defaultValue={62} /> : null}
        {tab.family === "travel" && tab.upright ? <AmbientFader size="sm" defaultValue={62} /> : null}
        {tab.family === "travel" && !tab.upright ? <AmbientSlider size="sm" defaultValue={62} /> : null}
        {tab.family === "press" ? <AmbientButton size="sm">KEY</AmbientButton> : null}
        {tab.family === "latch" ? <AmbientSwitch size="sm" defaultValue /> : null}
        {tab.family === "bank" ? (
          <AmbientSelect
            size="sm"
            options={BANK.slice(0, 2)}
            orientation="horizontal"
            defaultValue="1"
          />
        ) : null}
      </div>
    </Scene>
  );
}

/* ── The whole rack ───────────────────────────────────────────────────── */

/** Every family at once, which is the claim the page exists to make: the
 *  call sites are the ordinary ones and only the kit above them changed. */
export function Stage({ config }: { config: KitConfig }) {
  const [gain, setGain] = useState(38);
  const [tone, setTone] = useState(72);
  const [level, setLevel] = useState(64);
  const [mix, setMix] = useState(45);
  const [on, setOn] = useState(true);
  const [bank, setBank] = useState("2");
  const [hits, setHits] = useState(0);

  return (
    <Scene config={config} className="kb-stage-scene">
      <AmbientPanel material={config.panel.material} className="kb-panel">
        <div className="kb-row">
          <AmbientKnob label="GAIN" value={gain} onChange={setGain} />
          <AmbientKnob label="TONE" value={tone} onChange={setTone} />
          <AmbientSelect
            label="BANK"
            options={BANK}
            orientation="horizontal"
            value={bank}
            onChange={(next) => setBank(next as string)}
          />
        </div>

        <div className="kb-row">
          <AmbientFader label="LEVEL" value={level} onChange={setLevel} />
          <div className="kb-column">
            <AmbientSlider label="MIX" value={mix} onChange={setMix} />
            <AmbientSwitch label="ON" value={on} onChange={setOn} led />
          </div>
        </div>

        <div className="kb-row">
          <AmbientButton onClick={() => setHits((n) => n + 1)}>PLAY</AmbientButton>
          <AmbientButton>REC</AmbientButton>
          <AmbientButton disabled>OFF</AmbientButton>
        </div>
      </AmbientPanel>
    </Scene>
  );
}
