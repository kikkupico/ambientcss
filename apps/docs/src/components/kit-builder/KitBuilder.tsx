/* The Kit Builder, as a device.
 *
 *  A tab per control, the control itself large enough to see, and under it
 *  its parts — each one a rendering of that part alone, and each one a tab
 *  into the form that edits it. There is no second, shallower mode: what you
 *  are always editing is the real thing, a list of parts and shapes per
 *  frame, which is what writing a kit is. A shipped look is where the list
 *  starts, not a wall you stop at.
 *
 *  What comes out is a module and, when shapes are involved, the stylesheet
 *  it imports — the same stylesheet everything on this page is running. */

import { useCallback, useEffect, useMemo, useState } from "react";
import CodeBlock from "@theme/CodeBlock";
import { AmbientProvider } from "@ambientcss/components";
import type { AmbientTheme } from "@ambientcss/components";
import { CONTROL_TABS, ControlStage, KitStyles, PartThumb, Stage } from "./Preview";
import type { ControlTab } from "./Preview";
import { buildStyles, emitKit, emitUsage, styleFileName } from "./emit";
import { FAMILIES, FAMILY_LABELS, elementsFor } from "./catalog";
import type { FamilyName } from "./catalog";
import {
  DEFAULT_CONFIG,
  decodeConfig,
  encodeConfig,
  fileName,
  kitIdent,
  seedPatch,
  themeIdent
} from "./config";
import type { KitConfig } from "./config";
import { FRAMES, FRAME_NOTES, defaultPart, defaultShape } from "./model";
import type { FrameName, KitElement, PartName } from "./model";
import { FAMILY_PARTS, PARTS, partDefaults } from "./parts";
import { ControlEditor, ElementEditor, SceneEditor, elementLabel } from "./Editors";
import { TextField } from "./Fields";
import type { SeedName } from "./seeds";
import "./kit-builder.css";

/** The room the BUILDER stands in, which is not the room the kit stands in.
 *  Fixed on purpose: the scene sliders move the rack, and a device whose own
 *  casing swung with them would make it impossible to tell which of the two
 *  you had just changed. */
const CHROME: AmbientTheme = {
  lightX: -1,
  lightY: -1,
  keyLight: 0.86,
  fillLight: 0.7,
  lightHue: 222,
  lightSaturation: 10,
  highlightColor: "#8ab4f8",
  lumeHue: 205
};

type TabId = string;

function hashConfig(): KitConfig | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  return hash.startsWith("#s=") ? decodeConfig(hash.slice(3)) : null;
}

function download(name: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  /* Not synchronously: the click has only been dispatched, and revoking the
     object URL in the same tick races the download starting. */
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** The chips, in paint order — which is the order the frames are listed in,
 *  and then the order within a frame. Reordering a part is moving it past
 *  its neighbour in the same frame, because that is the only move that
 *  changes anything. */
function chipOrder(config: KitConfig, tab: ControlTab): KitElement[] {
  const visible = elementsFor(config, tab.family, tab.upright);
  return FRAMES.flatMap((frame) => visible.filter((element) => element.frame === frame));
}

export default function KitBuilder() {
  const [config, setConfig] = useState<KitConfig>(() => hashConfig() ?? DEFAULT_CONFIG);
  /* The config a moment after it stopped changing. The big stage runs on the
     live one — it has to follow a drag — but the address bar, the code
     blocks and the thumbnails run on this.

     A range slider fires on every pixel of a drag: writing the URL from that
     would be hundreds of `replaceState` calls, which Chrome throttles and
     Safari refuses outright past about a hundred in thirty seconds. And a
     row of thumbnails rebuilding a kit each at 60Hz is how a nicer-looking
     builder ends up feeling worse than the old one. */
  const [settled, setSettled] = useState<KitConfig>(config);
  const [tabId, setTabId] = useState<TabId>("knob");
  /* Per tab, because coming back to the knob should put you back where you
     were standing. `null` is the control itself. */
  const [selected, setSelected] = useState<Record<TabId, string | null>>({});
  const [adding, setAdding] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [menu, setMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(config), 250);
    return () => window.clearTimeout(timer);
  }, [config]);

  /* The config round-trips through the address bar, so a look can be sent to
     someone as a link rather than as a paragraph describing it. */
  useEffect(() => {
    const encoded = encodeConfig(settled);
    window.history.replaceState(null, "", `#s=${encoded}`);
    setShareUrl(`${window.location.origin}${window.location.pathname}#s=${encoded}`);
  }, [settled]);

  const patchFamily = useCallback((family: FamilyName, values: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, [family]: { ...prev[family], ...values } }));
  }, []);

  const patchScene = useCallback((key: "theme" | "panel", values: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...values } }));
  }, []);

  const applySeed = useCallback((family: FamilyName, seed: SeedName) => {
    setConfig((prev) => {
      const current = prev[family] as { root?: Record<string, number | boolean> };
      return { ...prev, [family]: { ...prev[family], ...seedPatch(family, seed, current.root) } };
    });
  }, []);

  const setElements = useCallback((family: FamilyName, elements: KitElement[]) => {
    setConfig((prev) => ({ ...prev, [family]: { ...prev[family], elements } }));
  }, []);

  const tab = CONTROL_TABS.find((candidate) => candidate.id === tabId);
  const family = tab?.family;
  const elements = tab ? chipOrder(config, tab) : [];
  const pick = tab ? (selected[tab.id] ?? null) : null;
  const current = elements.find((element) => element.id === pick) ?? null;

  const select = (id: string | null) => {
    if (!tab) return;
    setAdding(false);
    setSelected((prev) => ({ ...prev, [tab.id]: id }));
  };

  /* ── Element edits ──────────────────────────────────────────────────── */

  const replace = (next: KitElement) => {
    if (!family) return;
    setElements(
      family,
      (config[family].elements ?? []).map((element) => (element.id === next.id ? next : element))
    );
  };

  const remove = (id: string) => {
    if (!family) return;
    setElements(family, (config[family].elements ?? []).filter((element) => element.id !== id));
    select(null);
  };

  /* Order inside a frame is paint order, so moving an element is moving it
     past its neighbour in the same frame — and specifically past the
     neighbour the strip is SHOWING, which on the travel tabs is not the same
     list: swapping a slider's track with a fader's is a move you cannot
     watch happen. */
  const neighbour = (element: KitElement, direction: -1 | 1): KitElement | undefined => {
    const siblings = elements.filter((candidate) => candidate.frame === element.frame);
    return siblings[siblings.indexOf(element) + direction];
  };

  const move = (element: KitElement, direction: -1 | 1) => {
    if (!family) return;
    const swap = neighbour(element, direction);
    if (!swap) return;
    setElements(
      family,
      (config[family].elements ?? []).map((candidate) =>
        candidate.id === element.id ? swap : candidate.id === swap.id ? element : candidate
      )
    );
  };

  const add = (what: PartName | "shape") => {
    if (!family || !tab) return;
    setAdding(false);
    const all = config[family].elements ?? [];
    if (what === "shape") {
      const frame: FrameName = "actuator";
      const shape = defaultShape(frame, `shape-${all.length + 1}`);
      /* A press control's frames are `display: contents` markers and the cap
         is what gives the control its size, so a key starts in flow. An
         absolutely-positioned one collapses the button to nothing — which
         looks like a bug rather than a choice. */
      if (family === "press") {
        shape.box = { ...shape.box, place: "flow", width: 11, height: 8.3, radius: "soft" };
        shape.content = "legend";
      }
      /* An element added while looking at the slider tab has to be visible
         on the slider tab, or it lands in a list you are not looking at. */
      if (family === "travel") shape.only = tab.upright ? "vertical" : "horizontal";
      setElements(family, [...all, shape]);
      setSelected((prev) => ({ ...prev, [tab.id]: shape.id }));
      return;
    }
    const part = { ...defaultPart(PARTS[what].frame, what), props: partDefaults(what) };
    if (family === "travel") part.only = tab.upright ? "vertical" : "horizontal";
    setElements(family, [...all, part]);
    setSelected((prev) => ({ ...prev, [tab.id]: part.id }));
  };

  /* ── Output ─────────────────────────────────────────────────────────── */

  const source = useMemo(() => emitKit(settled, shareUrl ?? undefined), [settled, shareUrl]);
  const usage = useMemo(() => emitUsage(settled), [settled]);
  const styles = useMemo(() => buildStyles(settled), [settled]);
  const file = fileName(settled.name);
  const cssFile = styleFileName(settled);

  const copyLink = useCallback(() => {
    if (!shareUrl || !navigator.clipboard) return;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [shareUrl]);

  const dressesNothing = FAMILIES.every((candidate) => !config[candidate].dressed);
  const undressed = family ? !config[family].dressed : false;

  return (
    <div className="kb">
      <header className="kb-intro">
        <h1 className="kb-intro-title">Kit Builder</h1>
        <p className="kb-intro-text">
          A tab per control, and under each one the parts it is made of. Open a part and
          you are editing the real thing — a list of parts and shapes per frame, which is
          what writing a kit is. <code>&lt;/&gt;</code> shows the file this makes;{" "}
          <code>↑</code> hands it to you. Nothing on this page is a picture of the kit:
          every rendering is the module and the stylesheet you take away, running.
        </p>
      </header>

      <AmbientProvider theme={CHROME} className="kb-chrome">
        <div className="kb-device ambient amb-surface amb-chamfer amb-elevation-2 amb-mat-blasted">
          {/* Live, not settled: the stylesheet IS the shapes. Debouncing it
              would leave the stage holding unstyled spans for a quarter of a
              second after every edit — and a shape slider would not move
              anything until you let go of it. */}
          <KitStyles config={config} />

          <div className="kb-bar">
            <div className="kb-name amb-groove">
              <input
                className="kb-name-input"
                value={config.name}
                spellCheck={false}
                aria-label="Kit name"
                onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className={`kb-key${showCode ? " kb-key-on" : ""}`}
              title="Show the file this makes"
              aria-pressed={showCode}
              onClick={() => {
                setShowCode((on) => !on);
                setMenu(false);
              }}
            >
              &lt;/&gt;
            </button>
            <div className="kb-menu-anchor">
              <button
                type="button"
                className={`kb-key${menu ? " kb-key-on" : ""}`}
                title="Take it away"
                aria-expanded={menu}
                onClick={() => setMenu((on) => !on)}
              >
                ↑
              </button>
              {menu ? (
                <>
                  {/* A menu that only closes on the button that opened it is a
                      menu you have to remember how to escape. */}
                  <button
                    type="button"
                    className="kb-scrim"
                    aria-label="Close the menu"
                    onClick={() => setMenu(false)}
                  />
                  <div className="kb-menu">
                    <button
                      type="button"
                      onClick={() => {
                        download(file, source);
                        setMenu(false);
                      }}
                    >
                      Download {file}
                    </button>
                    {styles ? (
                      <button
                        type="button"
                        onClick={() => {
                          download(cssFile, styles);
                          setMenu(false);
                        }}
                      >
                        Download {cssFile}
                      </button>
                    ) : null}
                    <button type="button" onClick={copyLink} disabled={!shareUrl}>
                      {copied ? "Link copied" : "Copy link to this kit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig(DEFAULT_CONFIG);
                        setMenu(false);
                      }}
                    >
                      Reset everything
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <nav className="kb-tabs" aria-label="Controls">
            {[...CONTROL_TABS, { id: "kit", label: "Kit" }].map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={`kb-tab${tabId === candidate.id ? " kb-tab-on" : ""}`}
                aria-current={tabId === candidate.id}
                onClick={() => {
                  setTabId(candidate.id);
                  setAdding(false);
                }}
              >
                {candidate.label}
              </button>
            ))}
          </nav>

          <div className="kb-screen amb-groove">
            {tab ? <ControlStage config={config} tab={tab} /> : <Stage config={config} />}
          </div>

          {tab ? (
            <>
              <div className="kb-chips" data-tab={tab.id} role="tablist" aria-label="Parts">
                <button
                  type="button"
                  role="tab"
                  aria-selected={pick === null}
                  className={`kb-chip${pick === null ? " kb-chip-on" : ""}`}
                  onClick={() => select(null)}
                >
                  <span className="kb-chip-art">
                    <PartThumb config={settled} tab={tab} elementId={null} />
                  </span>
                  <span className="kb-chip-name">the control</span>
                </button>

                {elements.map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    role="tab"
                    aria-selected={pick === element.id}
                    className={`kb-chip${pick === element.id ? " kb-chip-on" : ""}`}
                    onClick={() => select(element.id)}
                  >
                    <span className="kb-chip-art">
                      <PartThumb config={settled} tab={tab} elementId={element.id} />
                    </span>
                    <span className="kb-chip-name">{elementLabel(element)}</span>
                    <span className="kb-chip-frame">{element.frame}</span>
                  </button>
                ))}

                <button
                  type="button"
                  className={`kb-chip kb-chip-add${adding ? " kb-chip-on" : ""}`}
                  onClick={() => setAdding((on) => !on)}
                >
                  <span className="kb-chip-art kb-chip-plus">+</span>
                  <span className="kb-chip-name">add a part</span>
                </button>
              </div>

              {undressed ? (
                <p className="kb-note kb-note-wide">
                  This family is left undressed, so what you are looking at is{" "}
                  <code>groundedKit</code> showing through. Its parts are still here — turn{" "}
                  <em>Dress this family</em> back on to put them back.
                </p>
              ) : null}

              <div className="kb-form">
                {adding ? (
                  <div className="kb-add">
                    <p className="kb-note kb-note-wide">
                      A shape is a <code>&lt;span&gt;</code> and a rule in the stylesheet this
                      page writes — which is what every part below is made of.
                    </p>
                    <button type="button" className="kb-add-item" onClick={() => add("shape")}>
                      <strong>a shape</strong>
                      <span>you draw it: a box, a structure, a surface, a colour</span>
                    </button>
                    {(FAMILY_PARTS[family ?? ""] ?? []).map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="kb-add-item"
                        onClick={() => add(name)}
                      >
                        <strong>{PARTS[name].label}</strong>
                        <span>{PARTS[name].note}</span>
                      </button>
                    ))}
                  </div>
                ) : current && family ? (
                  <>
                    <div className="kb-form-head">
                      <h2 className="kb-form-title">{elementLabel(current)}</h2>
                      <span className="kb-badge" title={FRAME_NOTES[current.frame]}>
                        {current.frame}
                      </span>
                      <button
                        type="button"
                        className="kb-icon"
                        title="paint earlier"
                        disabled={!neighbour(current, -1)}
                        onClick={() => move(current, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="kb-icon"
                        title="paint later"
                        disabled={!neighbour(current, 1)}
                        onClick={() => move(current, 1)}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="kb-icon"
                        title="remove this part"
                        onClick={() => remove(current.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="kb-fields">
                      <ElementEditor
                        element={current}
                        family={family}
                        onChange={(next) => replace(next)}
                      />
                    </div>
                  </>
                ) : family ? (
                  <>
                    <div className="kb-form-head">
                      <h2 className="kb-form-title">{FAMILY_LABELS[family]}</h2>
                    </div>
                    <div className="kb-fields">
                      <ControlEditor
                        family={family}
                        config={config}
                        patch={patchFamily}
                        onSeed={applySeed}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="kb-form">
              <div className="kb-form-head">
                <h2 className="kb-form-title">The kit, and the room it stands in</h2>
              </div>
              <div className="kb-fields">
                <TextField
                  label="Name"
                  hint={`exports ${kitIdent(config.name)} and ${themeIdent(config.name)}`}
                  value={config.name}
                  onChange={(name) => setConfig((prev) => ({ ...prev, name }))}
                />
                <SceneEditor config={config} patch={patchScene} />
              </div>
              {dressesNothing ? (
                <p className="kb-note kb-note-wide">
                  Every family is undressed, so this kit dresses nothing and every control falls
                  through to <code>groundedKit</code>. Still a valid kit — just not yet a look.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </AmbientProvider>

      {showCode ? (
        <div className="kb-code">
          <h2 className="kb-code-title">{file}</h2>
          <p className="kb-note">
            The whole kit. Drop it in your project — it imports only parts that{" "}
            <code>@ambientcss/components</code> exports.
          </p>
          <CodeBlock language="tsx" title={file}>
            {source}
          </CodeBlock>

          {styles ? (
            <>
              <h2 className="kb-code-title">{cssFile}</h2>
              <p className="kb-note">
                The shapes, as rules — and the very stylesheet the device above is running. Every
                rule is two classes wide, so it beats the library's own on specificity rather than
                on import order, which the app that consumes the kit controls and this file does
                not.
              </p>
              <CodeBlock language="css" title={cssFile}>
                {styles}
              </CodeBlock>
            </>
          ) : null}

          <h2 className="kb-code-title">Using it</h2>
          <CodeBlock language="tsx" title="rack.tsx">
            {usage}
          </CodeBlock>
        </div>
      ) : null}
    </div>
  );
}
