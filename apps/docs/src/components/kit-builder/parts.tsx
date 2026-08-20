/* Every element the builder can put in a frame, defined ONCE as the pair of
   things that must never drift: the React node the preview renders, and the
   source line the export prints.

   Library parts and generated shapes go through the same door. A shape is a
   `<span>` wearing ambient classes and a generated class whose rule `css.ts`
   writes — which is what a part IS in this library; the console kit is four
   of them. */

import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  ButtonCap,
  ConsoleBar,
  ConsoleMarks,
  ConsoleWell,
  FaderCap,
  IndicatorBar,
  IndicatorDot,
  KeyCap,
  KeyLens,
  KnobBody,
  KnurledFace,
  ScaleRing,
  SliderThumb,
  SwitchPill,
  SwitchTrack,
  ToggleThumb,
  ToggleTrack,
  TravelTrack
} from "@ambientcss/components";
import type { AmbientMaterial } from "@ambientcss/components";
import { shapeAmbientClasses } from "./css";
import { mountClass, shapeClass } from "./model";
import type { KitElement, PartName, PartOption, PartProps, ShapeElement } from "./model";
import type { MaterialChoice } from "./config";

export type Piece = { node: ReactNode; code: string; imports: string[] };

/** What a part may need from the control it is being dressed into. Only one
 *  thing so far, and it is not decoration: a button's legend is the caller's
 *  and arrives through the look, so whatever part carries it has to be told. */
export type BuildContext = { children?: ReactNode | undefined };

/* ── helpers shared by both views ─────────────────────────────────────── */

function material(value: unknown): AmbientMaterial | undefined {
  return value === undefined || value === "default" ? undefined : (value as AmbientMaterial);
}

function attr(name: string, value: string | undefined): string {
  return value === undefined ? "" : ` ${name}="${value}"`;
}

function str(props: PartProps, key: string): string | undefined {
  const value = props[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function bool(props: PartProps, key: string, fallback: boolean): boolean {
  const value = props[key];
  return typeof value === "boolean" ? value : fallback;
}

function num(props: PartProps, key: string, fallback: number): number {
  const value = props[key];
  return typeof value === "number" ? value : fallback;
}

const MATERIAL_OPTION: PartOption = { key: "material", kind: "material", label: "Material" };

export type PartSpec = {
  label: string;
  /** One line for the picker: what this part is, physically. */
  note: string;
  /** The frame it belongs in. A lens under a glass cap has to paint first;
   *  a knurl has to turn. Getting this wrong is how a lamp goes out. */
  frame: "panel" | "base" | "actuator" | "fixture";
  options: PartOption[];
  build: (props: PartProps, ctx: BuildContext) => Piece;
};

export const PARTS: Record<PartName, PartSpec> = {
  KnobBody: {
    label: "Knob body",
    note: "the smooth chamfered cap, and the element that casts the drop shadow",
    frame: "base",
    options: [MATERIAL_OPTION, { key: "flush", kind: "boolean", label: "Full width (no knurl ring)" }],
    build: (props) => {
      const mat = material(props.material);
      const flush = bool(props, "flush", false);
      return {
        node: <KnobBody flush={flush} material={mat} />,
        code: `<KnobBody${flush ? " flush" : ""}${attr("material", mat)} />`,
        imports: ["KnobBody"]
      };
    }
  },
  KnurledFace: {
    label: "Knurled ring",
    note: "48 ribs clipped to a toothed annulus, shaded per tooth",
    frame: "actuator",
    options: [MATERIAL_OPTION, { key: "color", kind: "colour", label: "Grip colour" }],
    build: (props) => {
      const mat = material(props.material);
      const color = str(props, "color");
      return {
        node: <KnurledFace material={mat} color={color} />,
        code: `<KnurledFace${attr("material", mat)}${attr("color", color)} />`,
        imports: ["KnurledFace"]
      };
    }
  },
  IndicatorDot: {
    label: "Indicator dot",
    note: "the grounded referent's offset dot",
    frame: "actuator",
    options: [],
    build: () => ({ node: <IndicatorDot />, code: "<IndicatorDot />", imports: ["IndicatorDot"] })
  },
  IndicatorBar: {
    label: "Indicator bar",
    note: "a short radial bar out near the rim",
    frame: "actuator",
    options: [],
    build: () => ({ node: <IndicatorBar />, code: "<IndicatorBar />", imports: ["IndicatorBar"] })
  },
  ScaleRing: {
    label: "Scale ring",
    note: "printed dots on the panel, landing on the control's own sweep",
    frame: "panel",
    options: [{ key: "count", kind: "number", label: "Dots", min: 2, max: 25, step: 1 }],
    build: (props) => {
      const count = num(props, "count", 13);
      return {
        node: <ScaleRing count={count} />,
        code: `<ScaleRing count={${count}} />`,
        imports: ["ScaleRing"]
      };
    }
  },
  ConsoleWell: {
    label: "Console well",
    note: "a circular groove with a flat face sitting in it",
    frame: "base",
    options: [],
    build: () => ({ node: <ConsoleWell />, code: "<ConsoleWell />", imports: ["ConsoleWell"] })
  },
  ConsoleBar: {
    label: "Console bar",
    note: "a cuboid bar across the face, keeping its lit edge still as it turns",
    frame: "actuator",
    options: [],
    build: () => ({ node: <ConsoleBar />, code: "<ConsoleBar />", imports: ["ConsoleBar"] })
  },
  ConsoleMarks: {
    label: "Console marks",
    note: "the accent centre tick and the −/+ legends, printed on the panel",
    frame: "panel",
    options: [
      { key: "mark", kind: "boolean", label: "Centre mark" },
      { key: "legend", kind: "boolean", label: "− / + legends" }
    ],
    build: (props) => {
      const mark = bool(props, "mark", true);
      const legend = bool(props, "legend", true);
      return {
        node: <ConsoleMarks mark={mark} legend={legend} />,
        code: `<ConsoleMarks mark={${mark}} legend={${legend}} />`,
        imports: ["ConsoleMarks"]
      };
    }
  },
  TravelTrack: {
    label: "Travel track",
    note: "the groove a thumb rides in — a through-slot or a shallow channel",
    frame: "base",
    options: [{ key: "depth", kind: "choice", label: "Depth", values: ["slot", "channel"] }],
    build: (props) => {
      const depth = (str(props, "depth") ?? "slot") as "slot" | "channel";
      return {
        node: <TravelTrack depth={depth} />,
        code: `<TravelTrack depth="${depth}" />`,
        imports: ["TravelTrack"]
      };
    }
  },
  FaderCap: {
    label: "Fader cap",
    note: "a pill on a stem with a grip line across the top",
    frame: "actuator",
    options: [MATERIAL_OPTION],
    build: (props) => {
      const mat = material(props.material);
      return {
        node: <FaderCap material={mat} />,
        code: `<FaderCap${attr("material", mat)} />`,
        imports: ["FaderCap"]
      };
    }
  },
  SliderThumb: {
    label: "Slider thumb",
    note: "a domed disc gliding over the channel",
    frame: "actuator",
    options: [MATERIAL_OPTION],
    build: (props) => {
      const mat = material(props.material);
      return {
        node: <SliderThumb material={mat} />,
        code: `<SliderThumb${attr("material", mat)} />`,
        imports: ["SliderThumb"]
      };
    }
  },
  ButtonCap: {
    label: "Button cap",
    note: "a chamfered, subtly dished key top — carries the caller's legend",
    frame: "actuator",
    options: [MATERIAL_OPTION],
    build: (props, ctx) => {
      const mat = (material(props.material) ?? "matte") as AmbientMaterial;
      return {
        node: <ButtonCap material={mat}>{ctx.children}</ButtonCap>,
        code: `<ButtonCap material="${mat}">{look.children as ReactNode}</ButtonCap>`,
        imports: ["ButtonCap"]
      };
    }
  },
  SwitchTrack: {
    label: "Switch track",
    note: "the dark recess the pill slides in",
    frame: "base",
    options: [],
    build: () => ({ node: <SwitchTrack />, code: "<SwitchTrack />", imports: ["SwitchTrack"] })
  },
  SwitchPill: {
    label: "Switch pill",
    note: "the sliding pill, standing proud of the recess floor",
    frame: "actuator",
    options: [],
    build: () => ({ node: <SwitchPill />, code: "<SwitchPill />", imports: ["SwitchPill"] })
  },
  ToggleTrack: {
    label: "Toggle track",
    note: "a pill track that mixes its own colour from the travel",
    frame: "base",
    options: [],
    build: () => ({ node: <ToggleTrack />, code: "<ToggleTrack />", imports: ["ToggleTrack"] })
  },
  ToggleThumb: {
    label: "Toggle thumb",
    note: "a round accent thumb inside a white ring",
    frame: "actuator",
    options: [],
    build: () => ({ node: <ToggleThumb />, code: "<ToggleThumb />", imports: ["ToggleThumb"] })
  },
  KeyLens: {
    label: "Key lens",
    note: "the lamp lying on the pocket floor — paints BEFORE the cap",
    frame: "base",
    options: [],
    build: () => ({ node: <KeyLens />, code: "<KeyLens />", imports: ["KeyLens"] })
  },
  KeyCap: {
    label: "Key cap",
    note: "the translucent diffuser over the lamp, printing the key's legend",
    frame: "actuator",
    options: [],
    build: () => ({ node: <KeyCap />, code: "<KeyCap />", imports: ["KeyCap"] })
  }
};

/** Which parts are worth offering for a family. Nothing enforces this — a
 *  kit may put any markup in any frame — but a knurl in a key bank is a
 *  mistake rather than a choice. */
export const FAMILY_PARTS: Record<string, PartName[]> = {
  rotary: [
    "KnobBody",
    "KnurledFace",
    "IndicatorDot",
    "IndicatorBar",
    "ScaleRing",
    "ConsoleWell",
    "ConsoleBar",
    "ConsoleMarks"
  ],
  travel: ["TravelTrack", "FaderCap", "SliderThumb"],
  press: ["ButtonCap"],
  latch: ["SwitchTrack", "SwitchPill", "ToggleTrack", "ToggleThumb"],
  bank: ["KeyLens", "KeyCap"]
};

/* ── Shapes ───────────────────────────────────────────────────────────── */

function shapeContent(shape: ShapeElement, ctx: BuildContext): { node: ReactNode; code: string } {
  if (shape.content === "text") return { node: shape.text, code: `{${JSON.stringify(shape.text)}}` };
  if (shape.content === "legend")
    return { node: ctx.children, code: "{look.children as ReactNode}" };
  return { node: null, code: "" };
}

/** One shape, as markup. Everything that makes it look like anything lives
 *  in the generated stylesheet — which is what the library means when it
 *  says most of a kit is a stylesheet and a handful of spans. */
export function shapePiece(
  shape: ShapeElement,
  slug: string,
  family: string,
  ctx: BuildContext
): Piece {
  const classes = [...shapeAmbientClasses(shape), shapeClass(slug, family, shape)].join(" ");
  const content = shapeContent(shape, ctx);

  const inner = content.code
    ? {
        node: <span className={classes}>{content.node}</span>,
        code: `<span className="${classes}">${content.code}</span>`
      }
    : {
        node: <span className={classes} />,
        code: `<span className="${classes}" />`
      };

  if (!shape.steadyLight) return { ...inner, imports: [] };

  const mount = mountClass(slug, family, shape);
  return {
    node: <span className={mount}>{inner.node}</span>,
    code: `<span className="${mount}">${inner.code}</span>`,
    imports: []
  };
}

/** An element of either kind, as its pair of views. */
export function elementPiece(
  element: KitElement,
  slug: string,
  family: string,
  ctx: BuildContext
): Piece {
  return element.kind === "part"
    ? PARTS[element.part].build(element.props, ctx)
    : shapePiece(element, slug, family, ctx);
}

/** A default material for a part, so the picker can show what it will do. */
export function partDefaults(part: PartName): PartProps {
  const props: PartProps = {};
  for (const option of PARTS[part].options) {
    if (option.kind === "boolean") props[option.key] = option.key === "flush" ? false : true;
    if (option.kind === "material") props[option.key] = "default" as MaterialChoice;
    if (option.kind === "number") props[option.key] = option.key === "count" ? 13 : option.min;
    if (option.kind === "choice") props[option.key] = option.values[0]!;
  }
  return props;
}

/* Fragments, for a frame holding more than one element. */
export function nodesOf(pieces: Piece[]): ReactNode {
  if (pieces.length === 1) return pieces[0]!.node;
  return (
    <>
      {pieces.map((piece, i) => (
        <Fragment key={i}>{piece.node}</Fragment>
      ))}
    </>
  );
}
