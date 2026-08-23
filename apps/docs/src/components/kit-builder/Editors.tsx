/* The forms.
 *
 *  Three things can be selected on this page and each gets an editor here:
 *  an element (a library part, or a shape — which is a `<span>` plus a rule
 *  in the generated stylesheet), the control itself (what its root wears,
 *  and how it feels to turn), and the scene the whole rack stands in.
 *
 *  An element's `frame` is the one field worth pausing on: four frames in
 *  paint order, because paint order is the whole of what a frame means. A
 *  lamp under a glass cap is a lens in `base` and a cap in `actuator`, and
 *  swapping them puts the lamp out. */

import { FRAMES, FRAME_NOTES } from "./model";
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
import { Check, ColorField, Field, Range, Segmented, SolidColorField, TextField } from "./Fields";
import type { Option } from "./Fields";

const MATERIAL_LABELS: Record<MaterialChoice, string> = {
  default: "part's own",
  matte: "matte",
  shiny: "shiny",
  glass: "glass",
  brushed: "brushed",
  "brushed-round": "spun",
  blasted: "blasted"
};

const MATERIAL_OPTIONS: Option<MaterialChoice>[] = MATERIALS.map((value) => ({
  value,
  label: MATERIAL_LABELS[value]
}));

const FRAME_OPTIONS: Option<FrameName>[] = FRAMES.map((frame) => ({
  value: frame,
  label: frame,
  title: FRAME_NOTES[frame]
}));

/** What a chip is called: the part's own name, or whatever you named the
 *  shape — which is also what names its class in the stylesheet. */
export function elementLabel(element: KitElement): string {
  return element.kind === "part" ? PARTS[element.part].label : element.name || "shape";
}

/* ── One element's editor ─────────────────────────────────────────────── */

export function PartEditor({
  element,
  onChange
}: {
  element: PartElement;
  onChange: (next: PartElement) => void;
}) {
  const spec = PARTS[element.part];
  const setProp = (key: string, value: unknown) =>
    onChange({ ...element, props: { ...element.props, [key]: value as never } });

  return (
    <>
      <p className="kb-note">{spec.note}</p>
      {spec.options.map((option) => {
        if (option.kind === "material") {
          return (
            <Segmented
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
            <Check
              key={option.key}
              label={option.label}
              checked={element.props[option.key] === true}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        if (option.kind === "number") {
          return (
            <Range
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
              options={option.values.map((value) => ({ value, label: value }))}
              onChange={(value) => setProp(option.key, value)}
            />
          );
        }
        return (
          <ColorField
            key={option.key}
            label={option.label}
            value={(element.props[option.key] as string | null) ?? null}
            fallback="#2a2f36"
            unsetLabel="the part's own"
            onChange={(value) => setProp(option.key, value)}
          />
        );
      })}
    </>
  );
}

const FILL_OPTIONS: Option<ShapeElement["paint"]["fill"]>[] = [
  { value: "none", label: "none", title: "whatever the surface class gives it" },
  { value: "albedo", label: "albedo", title: "a reflectance the light then acts on" },
  { value: "colour", label: "colour", title: "painted flat, ignoring the light" },
  { value: "lume", label: "floor", title: "the scene's own dark recess colour" },
  { value: "accent", label: "accent", title: "--ambx-accent" },
  { value: "accent-travel", label: "lit by value", title: "mixes the accent in as the value moves" },
  { value: "ink", label: "ink", title: "a printed mark" },
  { value: "label", label: "label", title: "the scene's own text colour" }
];

export function ShapeEditor({
  element,
  family,
  onChange
}: {
  element: ShapeElement;
  family: string;
  onChange: (next: ShapeElement) => void;
}) {
  const box = (patch: Partial<ShapeElement["box"]>) =>
    onChange({ ...element, box: { ...element.box, ...patch } });
  const paint = (patch: Partial<ShapeElement["paint"]>) =>
    onChange({ ...element, paint: { ...element.paint, ...patch } });

  const needsColour = element.paint.fill === "albedo" || element.paint.fill === "colour";

  return (
    <>
      <TextField
        label="Name"
        hint="names its class"
        value={element.name}
        onChange={(name) => onChange({ ...element, name: name.replace(/[^a-zA-Z0-9-]/g, "-") })}
      />

      <Segmented
        label="Placement"
        value={element.box.place}
        options={[
          { value: "fill", label: "fill", title: "inset from all four sides" },
          { value: "centre", label: "centre", title: "a size sitting on the centre" },
          { value: "edge", label: "edge", title: "hung off one side — including outside it" },
          {
            value: "flow",
            label: "in flow",
            title: "sized by what is inside it — the only placement that can size a button"
          }
        ]}
        onChange={(place) => box({ place })}
      />

      {element.box.place === "fill" ? (
        <Range
          label="Inset"
          value={element.box.inset}
          min={0}
          max={45}
          step={0.1}
          format={(v) => `${v}%`}
          onChange={(inset) => box({ inset })}
        />
      ) : null}

      {element.box.place === "flow" ? (
        <>
          <Range
            label="Padding across"
            value={element.box.width}
            min={0}
            max={40}
            step={0.5}
            format={(v) => `${v}% of the control`}
            onChange={(width) => box({ width })}
          />
          <Range
            label="Padding down"
            value={element.box.height}
            min={0}
            max={40}
            step={0.5}
            format={(v) => `${v}% of the control`}
            onChange={(height) => box({ height })}
          />
        </>
      ) : null}

      {element.box.place !== "fill" && element.box.place !== "flow" && element.content === "none" ? (
        <>
          <Range
            label="Width"
            value={element.box.width}
            min={1}
            max={100}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={(width) => box({ width })}
          />
          <Range
            label="Height"
            value={element.box.height}
            min={1}
            max={120}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={(height) => box({ height })}
          />
        </>
      ) : null}

      {element.box.place === "centre" ? (
        <>
          <Range
            label="Offset across"
            value={element.box.x}
            min={-60}
            max={60}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={(x) => box({ x })}
          />
          <Range
            label="Offset down"
            value={element.box.y}
            min={-60}
            max={60}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={(y) => box({ y })}
          />
        </>
      ) : null}

      {element.box.place === "edge" ? (
        <>
          <Segmented
            label="Anchor"
            hint="the four outside anchors need panel clearance"
            value={element.box.anchor}
            options={[
              { value: "top", label: "top" },
              { value: "bottom", label: "bottom" },
              { value: "left", label: "left" },
              { value: "right", label: "right" },
              { value: "above", label: "above" },
              { value: "below", label: "below" },
              { value: "outside-left", label: "◀ outside" },
              { value: "outside-right", label: "outside ▶" }
            ]}
            onChange={(anchor) => box({ anchor })}
          />
          <Range
            label="Gap"
            value={element.box.y}
            min={0}
            max={60}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={(y) => box({ y })}
          />
        </>
      ) : null}

      <Segmented
        label="Corners"
        value={element.box.radius}
        options={[
          { value: "circle", label: "circle" },
          { value: "pill", label: "pill" },
          { value: "soft", label: "rounded" },
          { value: "sharp", label: "square" }
        ]}
        onChange={(radius) => box({ radius })}
      />
      {element.box.radius === "soft" ? (
        <Range
          label="Corner radius"
          value={element.box.softness}
          min={0.5}
          max={30}
          step={0.1}
          format={(v) => `${v}% of the control`}
          onChange={(softness) => box({ softness })}
        />
      ) : null}

      <Segmented
        label="Structure"
        hint="a body and a groove both paint into box-shadow — nothing is both"
        value={element.paint.structure}
        options={[
          { value: "plain", label: "flat", title: "no lighting model: ink, a printed mark" },
          { value: "body", label: "body", title: ".ambient — cuts edges and casts a shadow" },
          { value: "groove", label: "groove", title: "a recess cut into the panel" }
        ]}
        onChange={(structure) => paint({ structure })}
      />

      <Segmented
        label="Surface"
        value={element.paint.surface}
        options={[
          { value: "none", label: "none" },
          { value: "flat", label: "flat" },
          { value: "concave", label: "dished" },
          { value: "convex", label: "domed" }
        ]}
        onChange={(surface) => paint({ surface })}
      />

      {element.paint.structure === "body" ? (
        <>
          <Segmented
            label="Edge"
            value={element.paint.edge}
            options={[
              { value: "none", label: "none" },
              { value: "chamfer", label: "chamfer" },
              { value: "chamfer-2", label: "chamfer 2" },
              { value: "fillet", label: "fillet" },
              { value: "fillet-2", label: "fillet 2" }
            ]}
            onChange={(edge) => paint({ edge })}
          />
          <Check
            label="Set elevation"
            hint="how far the part floats off what it sits on"
            checked={element.paint.elevation !== null}
            onChange={(on) => paint({ elevation: on ? 0 : null })}
          />
          {element.paint.elevation !== null ? (
            <Range
              label="Elevation"
              value={element.paint.elevation}
              min={0}
              max={3}
              step={0.1}
              onChange={(elevation) => paint({ elevation })}
            />
          ) : null}
        </>
      ) : null}

      <Check
        label="Set thickness"
        hint="body height, or recess depth for a groove"
        checked={element.paint.thickness !== null}
        onChange={(on) => paint({ thickness: on ? 1 : null })}
      />
      {element.paint.thickness !== null ? (
        <Range
          label="Thickness"
          value={element.paint.thickness}
          min={0}
          max={2}
          step={0.01}
          onChange={(thickness) => paint({ thickness })}
        />
      ) : null}

      <Segmented
        label="Material"
        value={element.paint.material}
        options={MATERIAL_OPTIONS}
        onChange={(material) => paint({ material })}
      />

      <Segmented
        label="Colour"
        value={element.paint.fill}
        options={FILL_OPTIONS}
        onChange={(fill) => paint({ fill })}
      />
      {needsColour ? (
        <Field label={element.paint.fill === "albedo" ? "Albedo" : "Paint"} hint={element.paint.colour}>
          <input
            type="color"
            className="kb-color-swatch"
            value={element.paint.colour}
            onChange={(e) => paint({ colour: e.target.value })}
            aria-label="Colour"
          />
        </Field>
      ) : null}

      <Range
        label="Ring"
        hint={element.paint.ring > 0 ? `${element.paint.ring}% border` : "none"}
        value={element.paint.ring}
        min={0}
        max={20}
        step={0.5}
        onChange={(ring) => paint({ ring })}
      />
      {element.paint.ring > 0 ? (
        <Field label="Ring colour" hint={element.paint.ringColour}>
          <input
            type="color"
            className="kb-color-swatch"
            value={element.paint.ringColour}
            onChange={(e) => paint({ ringColour: e.target.value })}
            aria-label="Ring colour"
          />
        </Field>
      ) : null}

      <Segmented
        label="Content"
        value={element.content}
        options={
          family === "press"
            ? [
                { value: "none", label: "none" },
                { value: "text", label: "text" },
                { value: "legend", label: "the caller's label" }
              ]
            : [
                { value: "none", label: "none" },
                { value: "text", label: "text" }
              ]
        }
        onChange={(content) => onChange({ ...element, content })}
      />
      {element.content === "text" ? (
        <TextField
          label="Text"
          value={element.text}
          onChange={(text) => onChange({ ...element, text })}
        />
      ) : null}
      {element.content !== "none" ? (
        <Range
          label="Text size"
          value={element.textSize}
          min={0.05}
          max={0.6}
          step={0.01}
          format={(v) => `${v}× the control`}
          onChange={(textSize) => onChange({ ...element, textSize })}
        />
      ) : null}

      {element.frame === "actuator" && element.box.place !== "flow" ? (
        <Check
          label="Keep the light still"
          hint="restates the scene's light in the turned frame, so the lit edge stays put"
          checked={element.steadyLight}
          onChange={(steadyLight) => onChange({ ...element, steadyLight })}
        />
      ) : null}

      <Check
        label="Ease colour changes"
        checked={element.paint.transition}
        onChange={(transition) => paint({ transition })}
      />
    </>
  );
}


/* ── One element ──────────────────────────────────────────────────────── */

const ONLY_OPTIONS: Option<ElementOnly>[] = [
  { value: "both", label: "both" },
  { value: "vertical", label: "faders", title: "vertical travel only" },
  { value: "horizontal", label: "sliders", title: "horizontal travel only" }
];

const BANK_SCOPE_OPTIONS: Option<BankScope>[] = [
  { value: "key", label: "each key", title: "inside every button — the bank's per-key dress" },
  { value: "panel", label: "the rail", title: "painted once, around the whole row of keys" }
];

const BANK_STATE_OPTIONS: Option<BankKeyState>[] = [
  { value: "both", label: "both", title: "same markup, restyled through [data-on]" },
  { value: "on", label: "selected only", title: "only the lit / checked key" },
  { value: "off", label: "unselected only", title: "every key that is not selected" }
];

/** The fields every element has, whichever kind it is, and then the kind's
 *  own form. */
export function ElementEditor({
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
      <Segmented
        label="Frame"
        hint={FRAME_NOTES[element.frame]}
        value={element.frame}
        options={FRAME_OPTIONS}
        onChange={(frame) => onChange({ ...element, frame })}
      />
      {family === "travel" ? (
        <Segmented
          label="Shown on"
          hint="one family, two controls — a fader cap on a slider is wrong"
          value={element.only ?? "both"}
          options={ONLY_OPTIONS}
          onChange={(only) => onChange({ ...element, only })}
        />
      ) : null}
      {family === "bank" ? (
        <Segmented
          label="Placement"
          hint="a key's own dress, or the enclosure around the whole row"
          value={element.bankScope ?? "key"}
          options={BANK_SCOPE_OPTIONS}
          onChange={(bankScope) => onChange({ ...element, bankScope })}
        />
      ) : null}
      {family === "bank" && (element.bankScope ?? "key") === "key" ? (
        <Segmented
          label="Shown when"
          hint="different markup per state — [data-on] already covers same-markup restyling"
          value={element.bankState ?? "both"}
          options={BANK_STATE_OPTIONS}
          onChange={(bankState) => onChange({ ...element, bankState })}
        />
      ) : null}
      {element.kind === "part" ? (
        <PartEditor element={element} onChange={onChange} />
      ) : (
        <ShapeEditor element={element} family={family} onChange={onChange} />
      )}
    </>
  );
}

/* ── The control itself ───────────────────────────────────────────────── */

const ANIMATE_OPTIONS: Option<KitConfig["rotary"]["animate"]>[] = [
  { value: "default", label: "default", title: "the mechanism decides" },
  { value: "auto", label: "auto", title: "follow while dragging, ease otherwise" },
  { value: "follow", label: "follow", title: "1:1 with the pointer, no transition" },
  { value: "ease", label: "ease", title: "transitions to the new position" },
  { value: "snap", label: "snap", title: "instant — reads as a detent clicking" }
];

/** Everything about a family that is not one of its parts: whether it is
 *  dressed at all, where its element list started, what its root wears, and
 *  the presentation defaults a kit is allowed to have an opinion about. */
export function ControlEditor({
  family,
  config,
  patch,
  onSeed
}: {
  family: FamilyName;
  config: KitConfig;
  patch: (family: FamilyName, values: Record<string, unknown>) => void;
  onSeed: (family: FamilyName, seed: SeedName) => void;
}) {
  const state = config[family];
  const rotary = config.rotary;
  const latch = config.latch;

  return (
    <>
      <Check
        label="Dress this family"
        hint="off falls through to the built-in grounded look"
        checked={state.dressed}
        onChange={(dressed) => patch(family, { dressed })}
      />

      <Segmented
        label="Start from"
        hint="replaces the parts below"
        value={state.seed}
        options={seedsFor(family).map((seed) => ({ value: seed, label: SEED_LABELS[seed] }))}
        onChange={(seed) => onSeed(family, seed)}
      />

      <TextField
        label={family === "travel" ? "Root class, fader" : "Root class"}
        hint="the library classes the root keeps — className replaces, it never joins"
        value={state.rootClass}
        onChange={(rootClass) => patch(family, { rootClass })}
      />
      {family === "travel" ? (
        <TextField
          label="Root class, slider"
          hint="the class is what sizes the track, so it has to know which way it runs"
          value={config.travel.rootClassH}
          onChange={(rootClassH) => patch(family, { rootClassH })}
        />
      ) : null}

      {family === "rotary" ? (
        <>
          <Range
            label="Panel clearance, top"
            hint="room for graphics printed above the knob"
            value={rotary.root.clearanceTop}
            min={0}
            max={60}
            step={1}
            format={(v) => `${v}%`}
            onChange={(clearanceTop) =>
              patch("rotary", { root: { ...rotary.root, clearanceTop } })
            }
          />
          <Range
            label="Panel clearance, sides"
            value={rotary.root.clearanceSides}
            min={0}
            max={60}
            step={1}
            format={(v) => `${v}%`}
            onChange={(clearanceSides) =>
              patch("rotary", { root: { ...rotary.root, clearanceSides } })
            }
          />
          <Segmented
            label="Pointer mapping"
            hint="how it feels to turn — a kit may say this much"
            value={rotary.input}
            options={[
              { value: "default", label: "default", title: "the mechanism's own: drag" },
              { value: "drag", label: "drag", title: "pointer distance → value" },
              { value: "angle", label: "angle", title: "pointer position → absolute angle" },
              { value: "delta", label: "delta", title: "endless encoder" }
            ]}
            onChange={(input) => patch("rotary", { input })}
          />
          <Check
            label="Set the sweep"
            hint="degrees of travel; unset leaves the 270° pot"
            checked={rotary.travel !== null}
            onChange={(on) => patch("rotary", { travel: on ? 280 : null })}
          />
          {rotary.travel !== null ? (
            <Range
              label="Sweep"
              value={rotary.travel}
              min={90}
              max={340}
              step={10}
              format={(value) => `${value}°`}
              onChange={(travel) => patch("rotary", { travel })}
            />
          ) : null}
        </>
      ) : null}

      {family === "latch" ? (
        <>
          <Check
            label="Set the track geometry"
            hint="only when no library class is holding it — a track you drew yourself"
            checked={latch.root.on}
            onChange={(on) => patch("latch", { root: { ...latch.root, on } })}
          />
          {latch.root.on ? (
            <>
              <Range
                label="Track width"
                hint={`${latch.root.trackW} × 4px`}
                value={latch.root.trackW}
                min={6}
                max={24}
                step={0.5}
                onChange={(trackW) => patch("latch", { root: { ...latch.root, trackW } })}
              />
              <Range
                label="Track height"
                hint={`${latch.root.trackH} × 4px`}
                value={latch.root.trackH}
                min={3}
                max={14}
                step={0.1}
                onChange={(trackH) => patch("latch", { root: { ...latch.root, trackH } })}
              />
              <Range
                label="Thumb width"
                value={latch.root.thumbW}
                min={0.2}
                max={1}
                step={0.01}
                format={(v) => `${v}× the track`}
                onChange={(thumbW) => patch("latch", { root: { ...latch.root, thumbW } })}
              />
              <Range
                label="Thumb height"
                value={latch.root.thumbH}
                min={0.2}
                max={1}
                step={0.01}
                format={(v) => `${v}× the track`}
                onChange={(thumbH) => patch("latch", { root: { ...latch.root, thumbH } })}
              />
              <Range
                label="End clearance"
                value={latch.root.inset}
                min={0}
                max={0.3}
                step={0.01}
                format={(v) => `${v}× the track height`}
                onChange={(inset) => patch("latch", { root: { ...latch.root, inset } })}
              />
            </>
          ) : null}
        </>
      ) : null}

      {family === "rotary" || family === "travel" || family === "latch" ? (
        <Segmented
          label="Motion"
          value={config[family].animate}
          options={ANIMATE_OPTIONS}
          onChange={(animate) => patch(family, { animate })}
        />
      ) : null}
    </>
  );
}

/* ── The room ─────────────────────────────────────────────────────────── */

/** The scene, which is not part of the kit at all — light is the room's
 *  business, and the same hardware under a different lamp is still the same
 *  hardware. It is exported beside the kit so the file reproduces what this
 *  page showed. */
export function SceneEditor({
  config,
  patch
}: {
  config: KitConfig;
  patch: (key: "theme" | "panel", values: Record<string, unknown>) => void;
}) {
  const theme = config.theme;
  return (
    <>
      <Range
        label="Light X"
        value={theme.lightX}
        min={-1}
        max={1}
        step={0.1}
        format={(value) => value.toFixed(1)}
        onChange={(lightX) => patch("theme", { lightX })}
      />
      <Range
        label="Light Y"
        value={theme.lightY}
        min={-1}
        max={1}
        step={0.1}
        format={(value) => value.toFixed(1)}
        onChange={(lightY) => patch("theme", { lightY })}
      />
      <Range
        label="Key light"
        value={theme.keyLight}
        min={0}
        max={1}
        step={0.02}
        format={(value) => value.toFixed(2)}
        onChange={(keyLight) => patch("theme", { keyLight })}
      />
      <Range
        label="Fill light"
        value={theme.fillLight}
        min={0}
        max={1}
        step={0.02}
        format={(value) => value.toFixed(2)}
        onChange={(fillLight) => patch("theme", { fillLight })}
      />
      <Range
        label="Light hue"
        value={theme.lightHue}
        min={0}
        max={360}
        step={1}
        format={(value) => `${value}°`}
        onChange={(lightHue) => patch("theme", { lightHue })}
      />
      <Range
        label="Light saturation"
        value={theme.lightSaturation}
        min={0}
        max={60}
        step={1}
        format={(value) => `${value}%`}
        onChange={(lightSaturation) => patch("theme", { lightSaturation })}
      />
      <Range
        label="Lume hue"
        value={theme.lumeHue}
        min={0}
        max={360}
        step={1}
        format={(value) => `${value}°`}
        onChange={(lumeHue) => patch("theme", { lumeHue })}
      />
      <SolidColorField
        label="Highlight colour"
        value={theme.highlightColor}
        onChange={(highlightColor) => patch("theme", { highlightColor })}
      />
      <ColorField
        label="Accent"
        hint="--ambx-accent, read by parts that light up"
        value={theme.accent}
        fallback="#00a84d"
        unsetLabel="the scene's highlight"
        onChange={(accent) => patch("theme", { accent })}
      />
      <Segmented
        label="Panel finish"
        value={config.panel.material}
        options={PANEL_MATERIALS.map((value) => ({ value, label: MATERIAL_LABELS[value] }))}
        onChange={(material) => patch("panel", { material })}
      />
    </>
  );
}
