/* What a family starts as.
 *
 *  Every family in this builder is composed — a list of parts and shapes you
 *  can open. A seed is where that list starts, and the two library seeds are
 *  the shipped kits expressed as element lists: pick `grounded parts` and you
 *  are holding the pieces of the knob this library draws by default, with
 *  nothing hidden behind a preset.
 *
 *  `console-shapes` is the interesting one — the console knob and toggle
 *  drawn ENTIRELY from generic shapes, with the reference's own numbers. It
 *  is there as proof and as a starting point: everything in it can be built
 *  from the empty list with the same form, and taking it apart is the
 *  fastest way to see how. */

import { defaultPart, defaultShape } from "./model";
import type { ElementOnly, FrameName, KitElement, PartName, PartProps, ShapeElement } from "./model";

export type SeedName = "grounded" | "console" | "console-shapes" | "empty";

export const SEED_LABELS: Record<SeedName, string> = {
  grounded: "grounded parts",
  console: "console parts",
  "console-shapes": "console, in shapes",
  empty: "empty"
};

function part(frame: FrameName, name: PartName, props: PartProps = {}, only?: ElementOnly): KitElement {
  return { ...defaultPart(frame, name), props, ...(only ? { only } : null) };
}

type ShapePatch = {
  box?: Partial<ShapeElement["box"]>;
  paint?: Partial<ShapeElement["paint"]>;
} & Partial<Omit<ShapeElement, "box" | "paint" | "id" | "kind" | "frame" | "name">>;

function shape(frame: FrameName, name: string, patch: ShapePatch): ShapeElement {
  const base = defaultShape(frame, name);
  const { box, paint, ...rest } = patch;
  return {
    ...base,
    ...rest,
    box: { ...base.box, ...box },
    paint: { ...base.paint, ...paint }
  };
}

/* ── The console knob, drawn from shapes ──────────────────────────────── */

/* Every number is the reference's own, converted to the units the shape
   form speaks: percentages of the frame, and factors of --ambx-size.
   `.amb-console-housing` is a 0.27-deep groove filled with the near-black
   floor colour; the face is inset by one half-grid (2px of a 64px knob);
   the bar is 0.24 x 0.94 of that face, chamfered, knob-thick, sitting at
   elevation 0 so its shadow hugs the face it stands on. */
function consoleKnobShapes(): KitElement[] {
  return [
    shape("base", "housing", {
      box: { place: "fill", inset: 0, radius: "circle" },
      paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.27, fill: "lume" }
    }),
    shape("base", "face", {
      box: { place: "fill", inset: 3.1, radius: "circle" },
      paint: { structure: "plain", surface: "flat", edge: "none", thickness: null, fill: "none" }
    }),
    shape("actuator", "bar", {
      box: { place: "centre", width: 22.6, height: 88.6, radius: "soft", softness: 2.8 },
      paint: {
        structure: "body",
        surface: "flat",
        edge: "chamfer",
        thickness: 2,
        elevation: 0,
        fill: "none"
      },
      steadyLight: true
    }),
    shape("actuator", "mark", {
      box: { place: "centre", width: 14, height: 6.6, y: -34.8, radius: "soft", softness: 1.2 },
      paint: { structure: "plain", surface: "none", edge: "none", fill: "ink" }
    }),
    shape("panel", "centre-mark", {
      box: { place: "edge", anchor: "above", y: 7, width: 8.5, height: 20, radius: "soft", softness: 1 },
      paint: { structure: "plain", surface: "none", edge: "none", fill: "accent" }
    }),
    shape("panel", "legend-min", {
      box: { place: "edge", anchor: "outside-left", y: 10 },
      paint: { structure: "plain", surface: "none", edge: "none", fill: "label" },
      content: "text",
      text: "−"
    }),
    shape("panel", "legend-max", {
      box: { place: "edge", anchor: "outside-right", y: 10 },
      paint: { structure: "plain", surface: "none", edge: "none", fill: "label" },
      content: "text",
      text: "+"
    })
  ];
}

/* The toggle: a pill track that mixes its own colour from the travel, and a
   round thumb inside a white ring. The track's `accent-travel` fill is the
   whole trick — no React state reaches this element; it reads the percent
   the control publishes on its own root. */
function consoleToggleShapes(): KitElement[] {
  return [
    shape("base", "track", {
      box: { place: "fill", inset: 0, radius: "pill" },
      paint: {
        structure: "groove",
        surface: "none",
        edge: "none",
        thickness: 0.4,
        fill: "accent-travel",
        transition: true
      }
    }),
    shape("actuator", "thumb", {
      box: { place: "fill", inset: 0, radius: "circle" },
      paint: {
        structure: "body",
        surface: "none",
        edge: "none",
        thickness: 2,
        fill: "accent",
        ring: 9,
        ringColour: "#ffffff"
      }
    })
  ];
}

export function seedElements(family: string, seed: SeedName): KitElement[] {
  if (seed === "empty") return [];

  if (family === "rotary") {
    if (seed === "console-shapes") return consoleKnobShapes();
    if (seed === "console")
      return [
        part("panel", "ConsoleMarks", { mark: true, legend: true }),
        part("base", "ConsoleWell"),
        part("actuator", "ConsoleBar")
      ];
    /* The materials are the grounded knob's own: a library part carries no
       default finish of its own, so a seed that left them unset would be a
       different knob from the one this kit is drawn from. */
    return [
      part("panel", "ScaleRing", { count: 13 }),
      part("base", "KnobBody", { material: "brushed-round", flush: false }),
      part("actuator", "KnurledFace", { material: "brushed-round" }),
      part("actuator", "IndicatorDot")
    ];
  }

  if (family === "travel") {
    /* Four elements for two controls. A fader and a slider are the same
       mechanism, and most of a kit says the same thing about both — but the
       cap is not one of those things, and neither is how deep the track is
       cut. The two that differ say so, and the kit prints the branch. */
    return [
      part("base", "TravelTrack", { depth: "slot" }, "vertical"),
      part("base", "TravelTrack", { depth: "channel" }, "horizontal"),
      part("actuator", "FaderCap", { material: "brushed" }, "vertical"),
      part("actuator", "SliderThumb", { material: "brushed" }, "horizontal")
    ];
  }

  if (family === "press") {
    return [part("actuator", "ButtonCap", { material: "matte" })];
  }



  if (family === "latch") {
    if (seed === "console-shapes") return consoleToggleShapes();
    if (seed === "console")
      return [part("base", "ToggleTrack"), part("actuator", "ToggleThumb")];
    return [part("base", "SwitchTrack"), part("actuator", "SwitchPill")];
  }

  return [part("base", "KeyLens"), part("actuator", "KeyCap")];
}

/** Seeds that mean something for a family. A key bank has one construction
 *  in this library; a knob has three. */
export function seedsFor(family: string): SeedName[] {
  if (family === "rotary" || family === "latch")
    return ["grounded", "console", "console-shapes", "empty"];
  return ["grounded", "empty"];
}

/** The library classes the control root wears, per seed.
 *
 *  `className` replaces rather than joins, so this string is the whole of
 *  what the root inherits from the library — and it is doing real work:
 *  `.amb-knob` carries the grounded knob's token table, `.amb-console-knob`
 *  carries the console one, `.amb-knob-markers-full` reserves the margin the
 *  scale ring overhangs into, and `.amb-button-round` is what makes a button
 *  round. It is a field rather than something inferred, because a builder
 *  that quietly rewrites your root class from the parts you picked is a
 *  builder you cannot argue with.
 *
 *  The travel pair is two strings for one reason: which of them applies is
 *  the orientation's business, and the kit prints that branch. */
export type SeedClasses = { rootClass: string; rootClassH: string };

export function seedRootClass(family: string, seed: SeedName): SeedClasses {
  if (family === "rotary") {
    if (seed === "console")
      return {
        rootClass: "amb-console-knob amb-console-knob-marked amb-console-knob-legended",
        rootClassH: ""
      };
    /* The shapes seed rebuilds the console knob without the console class, so
       it has to pay for its own overhang — which is what the clearance
       sliders below are. */
    if (seed === "console-shapes") return { rootClass: "amb-knob", rootClassH: "" };
    return { rootClass: "amb-knob amb-knob-markers-full", rootClassH: "" };
  }
  if (family === "travel") return { rootClass: "amb-fader", rootClassH: "amb-slider" };
  if (family === "press") return { rootClass: "amb-button amb-groove", rootClassH: "" };
  if (family === "latch")
    return { rootClass: seed === "console" ? "amb-console-toggle" : "amb-switch", rootClassH: "" };
  return { rootClass: "amb-select amb-groove", rootClassH: "" };
}

/** Root tokens that go with a seed — the ones the root class does NOT
 *  already provide.
 *
 *  A look reaches past its parts. The console knob prints a mark above
 *  itself and legends beside it, and graphics outside the control's box have
 *  to be paid for in layout; a latch IS its own track, so the track's
 *  proportions are the control's own box. Both live on the root.
 *
 *  Which is why the numbers here are zero for the two library seeds and real
 *  for `console-shapes`: `.amb-console-knob-marked` and `.amb-console-toggle`
 *  already say all of it, and a generated rule restating them would be this
 *  file arguing with the stylesheet it is standing on. Draw the same look out
 *  of shapes and nothing is holding those numbers any more — so the builder
 *  writes them. */
export function seedRoot(family: string, seed: SeedName): Record<string, number | boolean> | null {
  if (family === "rotary") {
    return seed === "console-shapes"
      ? { clearanceTop: 30, clearanceSides: 34 }
      : { clearanceTop: 0, clearanceSides: 0 };
  }
  if (family !== "latch") return null;
  return seed === "console-shapes"
    ? { on: true, trackW: 13, trackH: 6.3, thumbW: 0.436, thumbH: 0.9, inset: 0.05 }
    : { on: false, trackW: 12, trackH: 6, thumbW: 0.52, thumbH: 0.78, inset: 0.11 };
}
