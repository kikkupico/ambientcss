/* What a part IS, once you stop picking from a menu and start drawing one.
 *
 *  Reading the kits this library ships, a part turns out to be one of two
 *  things and nothing else: a component the package already exports, or an
 *  absolutely-positioned `<span>` wearing some ambient classes and a handful
 *  of custom properties. The console kit — a groove ring, a flat disc, a bar
 *  that keeps its lit edge still while it turns, an ink mark across it — is
 *  the second kind all the way down.
 *
 *  So that is the model: a frame holds a list of ELEMENTS, each of which is
 *  a library part or a shape. Nothing here knows how to render or emit; that
 *  is `parts.tsx` and `css.ts`, which are two views of this same data. */

import type { MaterialChoice } from "./config";

export type FrameName = "panel" | "base" | "actuator" | "fixture";

export const FRAMES: FrameName[] = ["panel", "base", "actuator", "fixture"];

export const FRAME_NOTES: Record<FrameName, string> = {
  panel: "behind the control, allowed to overflow its box — printed graphics",
  base: "the control's own footprint, static",
  actuator: "the frame the control moves: it turns, or it slides",
  fixture: "above the actuator, static"
};

/* ── Library parts ────────────────────────────────────────────────────── */

export type PartName =
  | "KnobBody"
  | "KnurledFace"
  | "IndicatorDot"
  | "IndicatorBar"
  | "ScaleRing"
  | "ConsoleWell"
  | "ConsoleBar"
  | "ConsoleMarks"
  | "TravelTrack"
  | "FaderCap"
  | "SliderThumb"
  | "ButtonCap"
  | "SwitchTrack"
  | "SwitchPill"
  | "ToggleTrack"
  | "ToggleThumb"
  | "KeyLens"
  | "KeyCap";

/** A part's own options, as the builder needs to render a form for them. */
export type PartOption =
  | { key: string; kind: "material"; label: string }
  | { key: string; kind: "boolean"; label: string }
  | { key: string; kind: "colour"; label: string }
  | { key: string; kind: "number"; label: string; min: number; max: number; step: number }
  | { key: string; kind: "choice"; label: string; values: string[] };

export type PartProps = Record<string, string | number | boolean | null | undefined>;

/* ── Shapes ───────────────────────────────────────────────────────────── */

/** How a shape finds its box inside the frame.
 *
 *  - `fill`   inset from all four sides — a ring, a disc, a track
 *  - `centre` a width x height sitting on the frame's centre, offset if asked
 *  - `edge`   hung off one side of the frame, including OUTSIDE it, which is
 *             what a panel graphic does: the console centre mark is `above`
 *  - `flow`   in normal flow, sized by what is inside it plus padding — the
 *             one a button needs, because a press control's frames are
 *             `display: contents` markers and the CAP is what gives the
 *             control its size. An absolutely-positioned key collapses the
 *             button to nothing. */
export type ShapePlace = "fill" | "centre" | "edge" | "flow";

export type ShapeAnchor = "top" | "bottom" | "left" | "right" | "above" | "below" | "outside-left" | "outside-right";

export type ShapeRadius = "circle" | "pill" | "sharp" | "soft";

/** The three structures an element can have, and they do not combine.
 *
 *  `.ambient` composites the whole lighting model into `box-shadow`, and
 *  `.amb-groove` paints its recess into that same property — an element
 *  wearing both is one silently overwriting the other. A groove is negative
 *  space; a body is material. Nothing is both. */
export type ShapeStructure = "plain" | "body" | "groove";

export type ShapeSurface = "none" | "flat" | "concave" | "convex";

export type ShapeEdge = "none" | "chamfer" | "chamfer-2" | "fillet" | "fillet-2";

/** Where a shape's colour comes from.
 *
 *  `albedo` is the ambient-native answer — a REFLECTANCE the surface classes
 *  then light — and it is the right one for anything made of material. The
 *  others paint a colour directly, which is what ink, lamps and lit tracks
 *  actually are. */
export type ShapeFill =
  | "none"
  | "albedo"
  | "colour"
  | "lume"
  | "accent"
  | "accent-travel"
  | "ink"
  | "label";

export type ShapeContent = "none" | "text" | "legend";

export type ShapeBox = {
  place: ShapePlace;
  /** `fill`: inset from every side, in % of the frame. */
  inset: number;
  /** `centre` and `edge`: size in % of the frame. `flow`: padding, across
   *  and down, as a % of the control's own size. */
  width: number;
  height: number;
  /** `centre`: offset from the centre, in % of the frame. `edge`: the gap
   *  between the shape and the side it hangs off. */
  x: number;
  y: number;
  anchor: ShapeAnchor;
  radius: ShapeRadius;
  /** `soft` radius only: % of the shape's own width. */
  softness: number;
};

export type ShapePaint = {
  structure: ShapeStructure;
  surface: ShapeSurface;
  edge: ShapeEdge;
  /** `null` leaves whatever the structure and edge classes default to. */
  thickness: number | null;
  elevation: number | null;
  material: MaterialChoice;
  fill: ShapeFill;
  colour: string;
  /** A border, in % of the shape's height. Never a shadow: `box-shadow` is
   *  where `.ambient` puts the entire lighting model, so a ring drawn there
   *  would wipe the drop shadow out. */
  ring: number;
  ringColour: string;
  /** Ease colour changes, for a fill that tracks the value. */
  transition: boolean;
};

/** Which orientation an element is dressed into.
 *
 *  Only the travel family has two, and it genuinely has two: a fader and a
 *  slider are one mechanism, but a fader cap on a horizontal slider is
 *  wrong. So an element may say which one it belongs to, and the kit prints
 *  the branch. Everything else is `both`, which is also what an element that
 *  predates this field reads as. */
export type ElementOnly = "both" | "vertical" | "horizontal";

export function elementApplies(element: KitElement, upright: boolean): boolean {
  const only = element.only ?? "both";
  return only === "both" || (only === "vertical") === upright;
}

/** Which half of a bank an element dresses — meaningless outside that
 *  family, the same way `only` is meaningless outside travel.
 *
 *  `key` is a key's own frames, applied inside every button — the field
 *  that already existed. `panel` is new: the rail's own frames, painted
 *  once around the whole row, the thing `AmbientSelect` was silently
 *  dropping before `panelParts` existed to carry it. */
export type BankScope = "key" | "panel";

/** Which key state a `key`-scope element belongs to. `both` — the default,
 *  and what an element written before this field reads as — is the same
 *  markup for on and off, restyled through `[data-on]`; that is the common
 *  case and needs nothing else. `on` / `off` are for a bank whose lit and
 *  unlit keys are genuinely different markup, the case `keyPartsOn` /
 *  `keyPartsOff` exist for. */
export type BankKeyState = "both" | "on" | "off";

export function elementBankScope(element: KitElement): BankScope {
  return element.bankScope ?? "key";
}

export function elementBankState(element: KitElement): BankKeyState {
  return element.bankState ?? "both";
}

export type ShapeElement = {
  id: string;
  kind: "shape";
  frame: FrameName;
  only?: ElementOnly | undefined;
  bankScope?: BankScope | undefined;
  bankState?: BankKeyState | undefined;
  /** Names the generated class — `desk-rotary-housing`. */
  name: string;
  box: ShapeBox;
  paint: ShapePaint;
  content: ShapeContent;
  text: string;
  /** Text size as a factor of `--ambx-size`. */
  textSize: number;
  /** Restate the scene's light in the frame's own turned coordinates, so a
   *  lit edge stays where the room put it while the part sweeps under it.
   *  Only meaningful in the `actuator` frame of a rotary. */
  steadyLight: boolean;
};

export type PartElement = {
  id: string;
  kind: "part";
  frame: FrameName;
  only?: ElementOnly | undefined;
  bankScope?: BankScope | undefined;
  bankState?: BankKeyState | undefined;
  part: PartName;
  props: PartProps;
};

export type KitElement = PartElement | ShapeElement;

/* ── Defaults ─────────────────────────────────────────────────────────── */

export function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function defaultShape(frame: FrameName, name: string): ShapeElement {
  return {
    id: newId(),
    kind: "shape",
    frame,
    name,
    box: {
      place: "fill",
      inset: 0,
      width: 50,
      height: 50,
      x: 0,
      y: 0,
      anchor: "top",
      radius: "circle",
      softness: 12
    },
    paint: {
      structure: "body",
      surface: "flat",
      edge: "chamfer",
      thickness: null,
      elevation: null,
      material: "default",
      fill: "none",
      colour: "#8a8f98",
      ring: 0,
      ringColour: "#ffffff",
      transition: false
    },
    content: "none",
    text: "",
    textSize: 0.26,
    steadyLight: false
  };
}

export function defaultPart(frame: FrameName, part: PartName): PartElement {
  return { id: newId(), kind: "part", frame, part, props: {} };
}

/** The class a shape wears: a shared hook plus its own name, so the rule is
 *  two classes wide and beats any single library class on specificity rather
 *  than on import order — which the app that consumes the kit controls and
 *  we do not. */
export function shapeClass(slug: string, family: string, shape: ShapeElement): string {
  return `${slug}-shape ${slug}-${family}-${shape.name || shape.id}`;
}

export function shapeSelector(slug: string, family: string, shape: ShapeElement): string {
  return `.${slug}-shape.${slug}-${family}-${shape.name || shape.id}`;
}

/** The light-capturing wrapper `steadyLight` needs. It carries no paint of
 *  its own: a custom property cannot read itself, so the capture and the
 *  restatement have to be two elements. */
export function mountClass(slug: string, family: string, shape: ShapeElement): string {
  return `${slug}-mount ${slug}-${family}-${shape.name || shape.id}-mount`;
}

export function mountSelector(slug: string, family: string, shape: ShapeElement): string {
  return `.${slug}-mount.${slug}-${family}-${shape.name || shape.id}-mount`;
}
