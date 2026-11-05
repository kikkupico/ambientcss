/* The inspector's forms.
 *
 *  Three things can be selected and each has an editor here: a layer (a
 *  library part, or a shape — a `<span>` plus a rule in the generated
 *  stylesheet), the control itself (what its root wears and how it feels),
 *  and the scene the kit is lit by.
 *
 *  A layer's `frame` is the one field worth pausing on: four frames in paint
 *  order, and paint order is the whole of what a frame means. A lamp under a
 *  glass cap is a lens in `base` and a cap in `actuator`; swap them and the
 *  lamp goes out. */

import { useState } from "react";
import type { ReactNode } from "react";
import { FRAMES } from "./model";
import type {
  BankKeyState,
  BankScope,
  ElementOnly,
  FrameName,
  KitElement,
  PartElement,
  ShapeElement
} from "./model";
import { PARTS } from "./parts";
import { MATERIALS, PANEL_MATERIALS } from "./config";
import type { KitConfig, MaterialChoice } from "./config";
import type { FamilyName } from "./catalog";
import { SEED_LABELS, seedsFor } from "./seeds";
import type { SeedName } from "./seeds";
import {
  ColorInput,
  LightPad,
  Note,
  OptionalSlider,
  Section,
  Segmented,
  Select,
  Slider,
  TextInput,
  Toggle
} from "./Fields";
import type { Option } from "./Fields";

/* ── Shared vocabulary ────────────────────────────────────────────────── */

export const MATERIAL_LABELS: Record<MaterialChoice, string> = {
  default: "Part's own",
  matte: "Matte",
  shiny: "Shiny",
  glass: "Glass",
  brushed: "Brushed",
  "brushed-round": "Spun",
  blasted: "Blasted"
};

const MATERIAL_OPTIONS: Option<MaterialChoice>[] = MATERIALS.map((value) => ({
  value,
  label: MATERIAL_LABELS[value]
}));

export const FRAME_INFO: Record<FrameName, { label: string; note: string }> = {
  panel: { label: "Panel", note: "Printed behind the control. May spill outside its box." },
  base: { label: "Base", note: "The control's own footprint. Stays still." },
  actuator: { label: "Moving", note: "The part that turns or slides with the value." },
  fixture: { label: "Top", note: "Above the moving part. Stays still." }
};

const FRAME_OPTIONS: Option<FrameName>[] = FRAMES.map((frame) => ({
  value: frame,
  label: FRAME_INFO[frame].label,
  title: FRAME_INFO[frame].note
}));

/** What a layer is called: the part's own name, or the shape's name — which
 *  also names its class in the stylesheet. */
export function elementLabel(element: KitElement): string {
  return element.kind === "part" ? PARTS[element.part].label : element.name || "shape";
}

/* ── A library part ───────────────────────────────────────────────────── */

function PartFields({
  element,
  onChange
}: {
  element: PartElement;
  onChange: (next: PartElement) => void;
}) {
  const spec = PARTS[element.part];
  const setProp = (key: string, value: unknown) =>
    onChange({ ...element, props: { ...element.props, [key]: value as never } });

  if (spec.options.length === 0) {
    return <Note>This part has no options of its own. Move it, hide it, or swap it for a shape.</Note>;
  }

  return (
    <>
      {spec.options.map((option) => {
        if (option.kind === "material") {
          return (
            <Select
              key={option.key}
              label={option.label}
              value={(element.props[option.key] as MaterialChoice) ?? "default"}
              options={MATERIAL_OPTIONS}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        if (option.kind === "boolean") {
          return (
            <Toggle
              key={option.key}
              label={option.label}
              checked={element.props[option.key] === true}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        if (option.kind === "number") {
          return (
            <Slider
              key={option.key}
              label={option.label}
              value={(element.props[option.key] as number) ?? option.min}
              min={option.min}
              max={option.max}
              step={option.step}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        if (option.kind === "choice") {
          return (
            <Segmented
              key={option.key}
              label={option.label}
              value={(element.props[option.key] as string) ?? option.values[0]!}
              options={option.values.map((value) => ({
                value,
                label: value.charAt(0).toUpperCase() + value.slice(1)
              }))}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        return (
          <ColorInput
            key={option.key}
            label={option.label}
            value={(element.props[option.key] as string | null) ?? null}
            fallback="#2a2f36"
            unsetLabel="Part's own"
            onChange={(value) => setProp(option.key, value)}
          />
        );
      })}
    </>
  );
}

/* ── A shape ──────────────────────────────────────────────────────────── */

const FILL_OPTIONS: Option<ShapeElement["paint"]["fill"]>[] = [
  { value: "none", label: "None", title: "Whatever the surface gives it." },
  { value: "albedo", label: "Material colour", title: "A colour the light then shades." },
  { value: "colour", label: "Flat paint", title: "Painted flat, ignoring the light." },
  { value: "lume", label: "Recess floor", title: "The scene's own dark recess colour." },
  { value: "accent", label: "Accent", title: "The kit's accent colour (--ambx-accent)." },
  {
    value: "accent-travel",
    label: "Accent, lit by value",
    title: "Fades in the accent as the value rises. No JavaScript involved."
  },
  { value: "ink", label: "Ink", title: "A dark printed mark." },
  { value: "label", label: "Label text", title: "The scene's own text colour." }
];

const ANCHOR_OPTIONS: Option<ShapeElement["box"]["anchor"]>[] = [
  { value: "top", label: "Top edge (inside)" },
  { value: "bottom", label: "Bottom edge (inside)" },
  { value: "left", label: "Left edge (inside)" },
  { value: "right", label: "Right edge (inside)" },
  { value: "above", label: "Above the control" },
  { value: "below", label: "Below the control" },
  { value: "outside-left", label: "Left of the control" },
  { value: "outside-right", label: "Right of the control" }
];

function ShapeFields({
  element,
  family,
  onChange
}: {
  element: ShapeElement;
  family: FamilyName;
  onChange: (next: ShapeElement) => void;
}) {
  const box = (patch: Partial<ShapeElement["box"]>) =>
    onChange({ ...element, box: { ...element.box, ...patch } });
  const paint = (patch: Partial<ShapeElement["paint"]>) =>
    onChange({ ...element, paint: { ...element.paint, ...patch } });

  const { place } = element.box;
  const sized = place !== "fill" && place !== "flow" && element.content === "none";
  const needsColour = element.paint.fill === "albedo" || element.paint.fill === "colour";
  const outside = place === "edge" && ["above", "below", "outside-left", "outside-right"].includes(element.box.anchor);

  return (
    <>
      <Section title="Position & size">
        <Segmented
          label="Placement"
          value={place}
          stacked
          options={[
            { value: "fill", label: "Fill", title: "Fills the frame, inset from every side." },
            { value: "centre", label: "Centred", title: "A set size, on the centre, optionally offset." },
            { value: "edge", label: "Edge", title: "Hung off one side, inside or outside the control." },
            {
              value: "flow",
              label: "Wrap content",
              title: "Sized by its text plus padding. A button cap needs this."
            }
          ]}
          onChange={(next) => box({ place: next })}
        />
        {place === "fill" ? (
          <Slider label="Inset" value={element.box.inset} min={0} max={45} step={0.1} unit="%" onChange={(inset) => box({ inset })} />
        ) : null}
        {place === "flow" ? (
          <>
            <Slider label="Padding X" value={element.box.width} min={0} max={40} step={0.5} unit="%" onChange={(width) => box({ width })} />
            <Slider label="Padding Y" value={element.box.height} min={0} max={40} step={0.5} unit="%" onChange={(height) => box({ height })} />
          </>
        ) : null}
        {sized ? (
          <>
            <Slider label="Width" value={element.box.width} min={1} max={100} step={0.5} unit="%" onChange={(width) => box({ width })} />
            <Slider label="Height" value={element.box.height} min={1} max={120} step={0.5} unit="%" onChange={(height) => box({ height })} />
          </>
        ) : null}
        {place === "centre" ? (
          <>
            <Slider label="Offset X" value={element.box.x} min={-60} max={60} step={0.5} unit="%" onChange={(x) => box({ x })} />
            <Slider label="Offset Y" value={element.box.y} min={-60} max={60} step={0.5} unit="%" onChange={(y) => box({ y })} />
          </>
        ) : null}
        {place === "edge" ? (
          <>
            <Select label="Anchor" value={element.box.anchor} options={ANCHOR_OPTIONS} onChange={(anchor) => box({ anchor })} />
            <Slider label="Gap" value={element.box.y} min={0} max={60} step={0.5} unit="%" onChange={(y) => box({ y })} />
            {outside && family === "rotary" ? (
              <Note>
                Outside the control's box. Give it room under <em>Control settings → Panel
                clearance</em>, or neighbouring controls will overlap it.
              </Note>
            ) : null}
          </>
        ) : null}
        <Segmented
          label="Corners"
          value={element.box.radius}
          options={[
            { value: "circle", label: "Circle" },
            { value: "pill", label: "Pill" },
            { value: "soft", label: "Rounded" },
            { value: "sharp", label: "Square" },
            {
              value: "inherit",
              label: "Match container",
              title: "Takes the corners of the button or key it sits in, so it nests without clipping."
            }
          ]}
          onChange={(radius) => box({ radius })}
        />
        {element.box.radius === "soft" ? (
          <Slider label="Radius" value={element.box.softness} min={0.5} max={30} step={0.1} unit="%" onChange={(softness) => box({ softness })} />
        ) : null}
      </Section>

      <Section title="Form">
        <Segmented
          label="Structure"
          value={element.paint.structure}
          options={[
            { value: "plain", label: "Flat", title: "No lighting at all: ink, a printed mark." },
            { value: "body", label: "Raised", title: "A solid body: lit edges and a drop shadow." },
            { value: "groove", label: "Recessed", title: "A cut into the panel." }
          ]}
          onChange={(structure) => paint({ structure })}
        />
        <Segmented
          label="Surface"
          value={element.paint.surface}
          options={[
            { value: "none", label: "None", title: "No surface colour of its own." },
            { value: "flat", label: "Flat", title: "Lit like the panel." },
            { value: "concave", label: "Dished", title: "Curves in, like a fingertip dip." },
            { value: "convex", label: "Domed", title: "Curves out, like a cap." }
          ]}
          onChange={(surface) => paint({ surface })}
        />
        {element.paint.structure === "body" ? (
          <Select
            label="Edge"
            value={element.paint.edge}
            options={[
              { value: "none", label: "None" },
              { value: "chamfer", label: "Chamfer" },
              { value: "chamfer-2", label: "Chamfer, wide" },
              { value: "fillet", label: "Fillet" },
              { value: "fillet-2", label: "Fillet, wide" }
            ]}
            onChange={(edge) => paint({ edge })}
          />
        ) : null}
        {element.paint.structure !== "plain" ? (
          <OptionalSlider
            label={element.paint.structure === "groove" ? "Depth" : "Thickness"}
            value={element.paint.thickness}
            fallback={element.paint.structure === "groove" ? 0.3 : 1}
            min={0}
            max={2}
            step={0.01}
            onChange={(thickness) => paint({ thickness })}
          />
        ) : null}
        {element.paint.structure === "body" ? (
          <OptionalSlider
            label="Elevation"
            hint="How far it floats above what it sits on."
            value={element.paint.elevation}
            fallback={0}
            min={0}
            max={3}
            step={0.1}
            onChange={(elevation) => paint({ elevation })}
          />
        ) : null}
      </Section>

      <Section title="Finish">
        <Select label="Material" value={element.paint.material} options={MATERIAL_OPTIONS} onChange={(material) => paint({ material })} />
        <Select label="Colour" value={element.paint.fill} options={FILL_OPTIONS} onChange={(fill) => paint({ fill })} />
        {needsColour ? (
          <ColorInput
            label={element.paint.fill === "albedo" ? "Material" : "Paint"}
            value={element.paint.colour}
            onChange={(colour) => paint({ colour: colour ?? "#8a8f98" })}
          />
        ) : null}
        <Slider label="Ring" hint="A border, as % of the control." value={element.paint.ring} min={0} max={20} step={0.5} unit="%" onChange={(ring) => paint({ ring })} />
        {element.paint.ring > 0 ? (
          <ColorInput label="Ring colour" value={element.paint.ringColour} onChange={(ringColour) => paint({ ringColour: ringColour ?? "#ffffff" })} />
        ) : null}
        <Toggle label="Ease colour" hint="Fade colour changes over 160ms." checked={element.paint.transition} onChange={(transition) => paint({ transition })} />
      </Section>

      <Section title="Text" defaultOpen={element.content !== "none"}>
        <Segmented
          label="Content"
          value={element.content}
          options={
            family === "press"
              ? [
                  { value: "none", label: "None" },
                  { value: "text", label: "Fixed text" },
                  { value: "legend", label: "Button label", title: "Whatever the app passes as the button's children." }
                ]
              : [
                  { value: "none", label: "None" },
                  { value: "text", label: "Fixed text" }
                ]
          }
          onChange={(content) => onChange({ ...element, content })}
        />
        {element.content === "text" ? (
          <TextInput label="Text" value={element.text} onChange={(text) => onChange({ ...element, text })} />
        ) : null}
        {element.content !== "none" ? (
          <Slider label="Size" value={element.textSize} min={0.05} max={0.6} step={0.01} unit="×" onChange={(textSize) => onChange({ ...element, textSize })} />
        ) : null}
      </Section>

      {element.frame === "actuator" && place !== "flow" ? (
        <Section title="Motion">
          <Toggle
            label="Hold the light"
            hint="Keeps the lit edge and shadow where the lamp is while the part turns."
            checked={element.steadyLight}
            onChange={(steadyLight) => onChange({ ...element, steadyLight })}
          />
        </Section>
      ) : null}
    </>
  );
}

/* ── One layer ────────────────────────────────────────────────────────── */

const ONLY_OPTIONS: Option<ElementOnly>[] = [
  { value: "both", label: "Both" },
  { value: "vertical", label: "Fader", title: "Only on the vertical fader." },
  { value: "horizontal", label: "Slider", title: "Only on the horizontal slider." }
];

const BANK_SCOPE_OPTIONS: Option<BankScope>[] = [
  { value: "key", label: "Every key", title: "Drawn inside each key." },
  { value: "panel", label: "The rail", title: "Drawn once, around the whole row of keys." }
];

const BANK_STATE_OPTIONS: Option<BankKeyState>[] = [
  { value: "both", label: "Always", title: "Same markup when selected or not." },
  { value: "on", label: "Selected", title: "Only on the selected key." },
  { value: "off", label: "Unselected", title: "Only on keys that are not selected." }
];

export function LayerEditor({
  element,
  family,
  onChange
}: {
  element: KitElement;
  family: FamilyName;
  onChange: (next: KitElement) => void;
}) {
  return (
    <>
      <Section title="Layer">
        {element.kind === "shape" ? (
          <TextInput
            label="Name"
            hint="Also names its CSS class."
            mono
            value={element.name}
            onChange={(name) => onChange({ ...element, name: name.replace(/[^a-zA-Z0-9-]/g, "-") })}
          />
        ) : (
          <Note>{PARTS[element.part].note}.</Note>
        )}
        <Segmented
          label="Frame"
          value={element.frame}
          options={FRAME_OPTIONS}
          onChange={(frame) => onChange({ ...element, frame })}
        />
        {family === "travel" ? (
          <Segmented label="Shown on" value={element.only ?? "both"} options={ONLY_OPTIONS} onChange={(only) => onChange({ ...element, only })} />
        ) : null}
        {family === "bank" ? (
          <Segmented label="Draw on" value={element.bankScope ?? "key"} options={BANK_SCOPE_OPTIONS} onChange={(bankScope) => onChange({ ...element, bankScope })} />
        ) : null}
        {family === "bank" && (element.bankScope ?? "key") === "key" ? (
          <Segmented label="When" value={element.bankState ?? "both"} options={BANK_STATE_OPTIONS} onChange={(bankState) => onChange({ ...element, bankState })} />
        ) : null}
        {element.kind === "part" ? <PartFields element={element} onChange={onChange} /> : null}
      </Section>
      {element.kind === "shape" ? (
        <ShapeFields element={element} family={family} onChange={onChange} />
      ) : null}
    </>
  );
}

/* ── The control itself ───────────────────────────────────────────────── */

/* ── The bank's look layers ─────────────────────────────────────────────── */

const BANK_LAYERS = [
  { name: "amb-select", label: "Rail", hint: "The dark groove the keys sit in, and their square boxes." },
  { name: "amb-select-lamp", label: "Lamp floor", hint: "The light floor a key lens lies on. Needed under Key lens and Key cap." },
  { name: "amb-select-glow", label: "Glow", hint: "The selected key spills its lamp colour onto the rail." }
];

function hasClass(list: string, name: string): boolean {
  return list.split(/\s+/).includes(name);
}

/** Add or remove one class, keeping the others where they were. A layer
 *  added goes right after the rail, so the root class reads in order. */
function toggleClass(list: string, name: string, on: boolean): string {
  const classes = list.split(/\s+/).filter(Boolean).filter((candidate) => candidate !== name);
  if (on) {
    const rail = classes.indexOf("amb-select");
    if (name === "amb-select" || rail === -1) classes.unshift(name);
    else classes.splice(rail + 1, 0, name);
  }
  return classes.join(" ");
}

const ANIMATE_OPTIONS: Option<KitConfig["rotary"]["animate"]>[] = [
  { value: "default", label: "Default", title: "Let the control decide." },
  { value: "auto", label: "Auto", title: "Follow while dragging, ease otherwise." },
  { value: "follow", label: "Follow", title: "1:1 with the pointer, no easing." },
  { value: "ease", label: "Ease", title: "Glide to each new value." },
  { value: "snap", label: "Snap", title: "Jump instantly, like a detent." }
];

export function ControlEditor({
  family,
  config,
  patch,
  onSeed,
  advanced
}: {
  family: FamilyName;
  config: KitConfig;
  patch: (family: FamilyName, values: Record<string, unknown>) => void;
  onSeed: (family: FamilyName, seed: SeedName) => void;
  advanced?: ReactNode;
}) {
  const state = config[family];
  const rotary = config.rotary;
  const latch = config.latch;

  return (
    <>
      <Section title="Look">
        <Toggle
          label="Dress it"
          hint={
            state.dressed
              ? "This kit draws these controls."
              : "Off: these controls fall back to the library's grounded look."
          }
          checked={state.dressed}
          onChange={(dressed) => patch(family, { dressed })}
        />
        <Segmented
          label="Start from"
          hint="Replaces this control's layers. Undo brings them back."
          value={state.seed}
          options={seedsFor(family).map((seed) => ({ value: seed, label: SEED_LABELS[seed] }))}
          onChange={(seed) => onSeed(family, seed)}
        />
      </Section>

      {family === "rotary" ? (
        <Section title="Feel">
          <Segmented
            label="Drag"
            value={rotary.input}
            options={[
              { value: "default", label: "Default", title: "The control's own: drag up and down." },
              { value: "drag", label: "Linear", title: "Drag distance sets the value." },
              { value: "angle", label: "Grab", title: "Jumps to where you press, like a real pot." },
              { value: "delta", label: "Endless", title: "An encoder with no end stops." }
            ]}
            onChange={(input) => patch("rotary", { input })}
          />
          <OptionalSlider
            label="Sweep"
            hint="Degrees of rotation. Default is 270°."
            value={rotary.travel}
            fallback={280}
            min={90}
            max={340}
            step={10}
            unit="°"
            onChange={(travel) => patch("rotary", { travel })}
          />
          <Segmented label="Motion" value={rotary.animate} options={ANIMATE_OPTIONS} onChange={(animate) => patch("rotary", { animate })} />
        </Section>
      ) : null}

      {family === "travel" || family === "latch" ? (
        <Section title="Feel">
          <Segmented
            label="Motion"
            value={config[family].animate}
            options={ANIMATE_OPTIONS}
            onChange={(animate) => patch(family, { animate })}
          />
        </Section>
      ) : null}

      {family === "rotary" ? (
        <Section title="Panel clearance" defaultOpen={rotary.root.clearanceTop > 0 || rotary.root.clearanceSides > 0}>
          <Note>Room around the knob for graphics printed outside it, like a centre mark or −/+ legends.</Note>
          <Slider label="Top" value={rotary.root.clearanceTop} min={0} max={60} unit="%" onChange={(clearanceTop) => patch("rotary", { root: { ...rotary.root, clearanceTop } })} />
          <Slider label="Sides" value={rotary.root.clearanceSides} min={0} max={60} unit="%" onChange={(clearanceSides) => patch("rotary", { root: { ...rotary.root, clearanceSides } })} />
        </Section>
      ) : null}

      {family === "latch" ? (
        <Section title="Track geometry" defaultOpen={latch.root.on}>
          <Toggle
            label="Custom size"
            hint="Only needed when you drew the track yourself and no library class is sizing it."
            checked={latch.root.on}
            onChange={(on) => patch("latch", { root: { ...latch.root, on } })}
          />
          {latch.root.on ? (
            <>
              <Slider label="Track W" value={latch.root.trackW} min={6} max={24} step={0.5} unit="×4px" onChange={(trackW) => patch("latch", { root: { ...latch.root, trackW } })} />
              <Slider label="Track H" value={latch.root.trackH} min={3} max={14} step={0.1} unit="×4px" onChange={(trackH) => patch("latch", { root: { ...latch.root, trackH } })} />
              <Slider label="Thumb W" value={latch.root.thumbW} min={0.2} max={1} step={0.01} unit="×" onChange={(thumbW) => patch("latch", { root: { ...latch.root, thumbW } })} />
              <Slider label="Thumb H" value={latch.root.thumbH} min={0.2} max={1} step={0.01} unit="×" onChange={(thumbH) => patch("latch", { root: { ...latch.root, thumbH } })} />
              <Slider label="End gap" value={latch.root.inset} min={0} max={0.3} step={0.01} unit="×" onChange={(inset) => patch("latch", { root: { ...latch.root, inset } })} />
            </>
          ) : null}
        </Section>
      ) : null}

      {family === "bank" ? (
        <Section title="Rail & lamp">
          <Note>
            Three separate classes on the bank's root. The glow is yours to choose: a bank of your own keys can sit in
            the rail without it.
          </Note>
          {BANK_LAYERS.map((layer) => (
            <Toggle
              key={layer.name}
              label={layer.label}
              hint={layer.hint}
              checked={hasClass(state.rootClass, layer.name)}
              onChange={(on) => patch("bank", { rootClass: toggleClass(state.rootClass, layer.name, on) })}
            />
          ))}
        </Section>
      ) : null}

      <Section title="Advanced" defaultOpen={false}>
        <TextInput
          label={family === "travel" ? "Fader class" : "Root class"}
          hint="Library classes on the control's root. They carry the token table the parts expect. This replaces the default; it doesn't add to it."
          mono
          value={state.rootClass}
          onChange={(rootClass) => patch(family, { rootClass })}
        />
        {family === "travel" ? (
          <TextInput
            label="Slider class"
            hint="The horizontal control's root class."
            mono
            value={config.travel.rootClassH}
            onChange={(rootClassH) => patch(family, { rootClassH })}
          />
        ) : null}
        {advanced}
      </Section>
    </>
  );
}

/* ── One version of a control ─────────────────────────────────────────── */

/** Name, order and removal of the version being edited. The name is what an
 *  app writes — `<AmbientSwitch variant="toggle" />` — so it is committed on
 *  blur, cleaned up and made unique, rather than rewritten as you type. */
export function VersionEditor({
  name,
  isDefault,
  preset,
  onRename,
  onMakeDefault,
  onDelete
}: {
  name: string;
  isDefault: boolean;
  preset: string;
  onRename: (name: string) => void;
  onMakeDefault: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() !== "" && draft !== name) onRename(draft);
    setDraft(null);
  };
  return (
    <Section title="Version">
      <div className="kb-row">
        <label className="kb-row-label" htmlFor="kb-version-name">
          Name
        </label>
        <div className="kb-row-control">
          <input
            id="kb-version-name"
            className="kb-text kb-mono"
            value={draft ?? name}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setDraft(null);
            }}
          />
          <p className="kb-hint">
            Apps pick it with <code>{`<${preset} variant="${name}" />`}</code>
            {isDefault ? ". It's also what they get without asking." : "."}
          </p>
        </div>
      </div>
      <div className="kb-version-actions">
        {!isDefault ? (
          <button type="button" className="kb-btn kb-btn-small" onClick={onMakeDefault}>
            Make default
          </button>
        ) : null}
        <button type="button" className="kb-btn kb-btn-small kb-btn-danger" onClick={onDelete}>
          Delete version
        </button>
      </div>
    </Section>
  );
}

/* ── The scene ────────────────────────────────────────────────────────── */

type ThemePatch = Partial<KitConfig["theme"]>;

/** Quick rooms to try a kit under. A kit should survive all of them. */
export const SCENE_PRESETS: { id: string; label: string; theme: ThemePatch }[] = [
  {
    id: "day",
    label: "Daylight",
    theme: { lightX: -1, lightY: -1, keyLight: 0.9, fillLight: 0.72, lightHue: 220, lightSaturation: 14, lumeHue: 190 }
  },
  {
    id: "warm",
    label: "Warm",
    theme: { lightX: -0.6, lightY: -1, keyLight: 0.88, fillLight: 0.7, lightHue: 30, lightSaturation: 26, lumeHue: 36 }
  },
  {
    id: "studio",
    label: "Studio",
    theme: { lightX: 0, lightY: -1, keyLight: 0.66, fillLight: 0.55, lightHue: 215, lightSaturation: 8, lumeHue: 200 }
  },
  {
    id: "night",
    label: "Night",
    theme: { lightX: -1, lightY: -1, keyLight: 0.3, fillLight: 0.4, lightHue: 225, lightSaturation: 20, lumeHue: 190 }
  }
];

export function SceneEditor({
  config,
  patch
}: {
  config: KitConfig;
  patch: (key: "theme" | "panel", values: Record<string, unknown>) => void;
}) {
  const theme = config.theme;
  const activePreset = SCENE_PRESETS.find((preset) =>
    Object.entries(preset.theme).every(([key, value]) => theme[key as keyof typeof theme] === value)
  );

  return (
    <>
      <Section title="Presets">
        <div className="kb-scene-presets">
          {SCENE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`kb-chip${activePreset?.id === preset.id ? " kb-chip-on" : ""}`}
              onClick={() => patch("theme", preset.theme)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Note>The scene isn't part of the kit. It's exported beside it so the file reproduces what you see here.</Note>
      </Section>

      <Section title="Light">
        <LightPad x={theme.lightX} y={theme.lightY} onChange={(lightX, lightY) => patch("theme", { lightX, lightY })} />
        <Slider label="Key light" hint="Below 0.5 the room goes dark." value={theme.keyLight} min={0} max={1} step={0.02} onChange={(keyLight) => patch("theme", { keyLight })} />
        <Slider label="Fill light" value={theme.fillLight} min={0} max={1} step={0.02} onChange={(fillLight) => patch("theme", { fillLight })} />
        <Slider label="Hue" value={theme.lightHue} min={0} max={360} unit="°" onChange={(lightHue) => patch("theme", { lightHue })} />
        <Slider label="Saturation" value={theme.lightSaturation} min={0} max={60} unit="%" onChange={(lightSaturation) => patch("theme", { lightSaturation })} />
      </Section>

      <Section title="Colour">
        <ColorInput
          label="Accent"
          hint="Read by parts that light up. Unset, it follows the highlight."
          value={theme.accent}
          fallback="#00a84d"
          unsetLabel="Follows highlight"
          onChange={(accent) => patch("theme", { accent })}
        />
        <ColorInput
          label="Highlight"
          value={theme.highlightColor}
          onChange={(highlightColor) => patch("theme", { highlightColor: highlightColor ?? "#7dd3fc" })}
        />
        <Slider label="Lume hue" hint="Tint of recesses in a dark room." value={theme.lumeHue} min={0} max={360} unit="°" onChange={(lumeHue) => patch("theme", { lumeHue })} />
        <ColorInput
          label="Panel colour"
          hint="Everything on the panel inherits it, unless it has a colour of its own."
          value={config.panel.albedo ?? null}
          fallback="#3a3f44"
          unsetLabel="Default grey"
          onChange={(albedo) => patch("panel", { albedo })}
        />
        <ColorInput
          label="Label colour"
          hint="Unset, labels darken and lighten with the key light."
          value={config.theme.label ?? null}
          fallback="#eeeeee"
          unsetLabel="Follows the light"
          onChange={(label) => patch("theme", { label })}
        />
        <Select
          label="Panel"
          value={config.panel.material}
          options={PANEL_MATERIALS.map((value) => ({ value, label: MATERIAL_LABELS[value] }))}
          onChange={(material) => patch("panel", { material })}
        />
      </Section>
    </>
  );
}
