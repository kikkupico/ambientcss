/* The stylesheet a custom kit needs, generated from its shapes.
 *
 *  This string is the single source for BOTH sides of the page: the preview
 *  injects it into the document and renders the same class names the export
 *  writes, so what you are looking at is literally the stylesheet you take
 *  away. There is no second implementation to keep in step. */

import type { KitConfig } from "./config";
import type { FamilyName } from "./catalog";
import { mountSelector, shapeSelector } from "./model";
import type { ShapeElement } from "./model";

/** Two decimal places, no trailing zeros — these are hand-editable numbers
 *  in a file someone is going to read. */
function n(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function radius(shape: ShapeElement): string | null {
  /* A line of text with no box to speak of has no corners to round, and a
     `border-radius: 50%` sitting in the rule is noise in a file someone is
     going to read. A key cap has content AND a body, so it keeps its. */
  const { paint: p } = shape;
  const paintsNothing =
    p.structure === "plain" &&
    p.surface === "none" &&
    p.ring === 0 &&
    (p.fill === "none" || p.fill === "label" || p.fill === "ink");
  if (shape.content !== "none" && paintsNothing) return null;
  switch (shape.box.radius) {
    case "circle":
      return "50%";
    case "pill":
      return "var(--ambx-radius-full)";
    case "soft":
      return `calc(var(--ambx-size) * ${n(shape.box.softness / 100)})`;
    default:
      return null;
  }
}

/** `top: 50%`, `top: calc(50% + 8%)`, `top: calc(50% - 34.8%)` — the sign
 *  spelled as an operator, because `calc(50% + -34.8%)` reads as a mistake. */
function offset(side: "top" | "left", value: number): string {
  if (value === 0) return `${side}: 50%`;
  return `${side}: calc(50% ${value < 0 ? "-" : "+"} ${n(Math.abs(value))}%)`;
}

/** Where the box sits. Percentages resolve against the FRAME, which is why
 *  offsets go in `top`/`left` rather than in a percentage `translate` — a
 *  percentage transform resolves against the element's own size, and a
 *  centre mark would then move by its own width instead of the knob's. */
function geometry(shape: ShapeElement): string[] {
  const { box } = shape;
  const sized = shape.content === "none";
  const out: string[] = [];

  if (box.place === "fill") {
    out.push(box.inset === 0 ? "inset: 0" : `inset: ${n(box.inset)}%`);
    return out;
  }

  if (box.place === "flow") {
    /* In flow, and sized by its content: this is the shape that can BE a
       button. The padding is in control-size units rather than percentages
       because a percentage padding resolves against a containing block the
       frame does not provide. */
    out.push(
      "position: relative",
      "display: grid",
      "place-items: center",
      "width: 100%",
      `padding: calc(var(--ambx-size) * ${n(box.height / 100)}) calc(var(--ambx-size) * ${n(box.width / 100)})`
    );
    return out;
  }

  if (sized) {
    out.push(`width: ${n(box.width)}%`, `height: ${n(box.height)}%`);
  }

  if (box.place === "centre") {
    out.push(
      offset("top", box.y),
      offset("left", box.x),
      "transform: translate(-50%, -50%)"
    );
    return out;
  }

  /* `edge`: hung off one side, including the far side of it — which is what
     a panel graphic does, and the reason the panel frame is allowed to
     overflow the control's box at all. */
  const gap = n(box.y);
  switch (box.anchor) {
    case "top":
      out.push(`top: ${gap}%`, "left: 50%", "transform: translateX(-50%)");
      break;
    case "bottom":
      out.push(`bottom: ${gap}%`, "left: 50%", "transform: translateX(-50%)");
      break;
    case "left":
      out.push(`left: ${gap}%`, "top: 50%", "transform: translateY(-50%)");
      break;
    case "right":
      out.push(`right: ${gap}%`, "top: 50%", "transform: translateY(-50%)");
      break;
    case "above":
      out.push("bottom: 100%", `margin-bottom: ${gap}%`, "left: 50%", "transform: translateX(-50%)");
      break;
    case "below":
      out.push("top: 100%", `margin-top: ${gap}%`, "left: 50%", "transform: translateX(-50%)");
      break;
    case "outside-left":
      out.push("right: 100%", `margin-right: ${gap}%`, "top: 50%", "transform: translateY(-50%)");
      break;
    case "outside-right":
      out.push("left: 100%", `margin-left: ${gap}%`, "top: 50%", "transform: translateY(-50%)");
      break;
  }
  return out;
}

const INK = "color-mix(in oklab, var(--amb-lit), black 82%)";
const TRACK_OFF = "color-mix(in oklab, var(--amb-lit), black 55%)";

/** The colour, and which property it lands on: a shape carrying text is
 *  drawing ink, everything else is drawing a surface. */
function fill(shape: ShapeElement): string[] {
  const { fill: kind, colour } = shape.paint;
  if (kind === "none") return [];
  if (kind === "albedo") return [`--amb-albedo: ${colour}`];

  const value =
    kind === "colour"
      ? colour
      : kind === "lume"
        ? "var(--amb-lume)"
        : kind === "accent"
          ? "var(--ambx-accent)"
          : kind === "label"
            ? "var(--amb-label)"
            : kind === "ink"
              ? INK
              : /* accent-travel: the track lights as the value moves, with no
                   React anywhere near it — the control publishes the percent
                   on its own root and this reads it. */
                `color-mix(in oklab, ${TRACK_OFF}, var(--ambx-accent) calc(var(--ambx-percent) * 100%))`;

  return [`${shape.content === "none" ? "background-color" : "color"}: ${value}`];
}

function paint(shape: ShapeElement): string[] {
  const { paint: p } = shape;
  const out: string[] = [];
  if (p.thickness !== null) out.push(`--amb-thickness: ${n(p.thickness)}`);
  if (p.elevation !== null) out.push(`--amb-elevation: ${n(p.elevation)}`);
  out.push(...fill(shape));
  if (p.ring > 0) {
    /* A border, never a shadow: `box-shadow` is where `.ambient` composites
       the whole lighting model, so a ring drawn there would take the drop
       shadow with it. With the package's border-box reset this grows
       inward, which keeps the outer diameter you set. */
    out.push(`border: calc(var(--ambx-size) * ${n(p.ring / 100)}) solid ${p.ringColour}`);
  }
  if (p.transition) out.push("transition: background-color 160ms ease");
  return out;
}

function text(shape: ShapeElement): string[] {
  if (shape.content === "none") return [];
  return [
    `font-size: calc(var(--ambx-size) * ${n(shape.textSize)})`,
    "line-height: 1",
    "white-space: nowrap"
  ];
}

/** The classes a shape wears — everything that is a library class rather
 *  than a generated declaration. Shared with the JSX emitter, so the markup
 *  and the stylesheet cannot disagree about which is which. */
export function shapeAmbientClasses(shape: ShapeElement): string[] {
  const { paint: p } = shape;
  const out: string[] = [];
  if (p.structure === "body") out.push("ambient");
  if (p.structure === "groove") out.push("amb-groove");
  if (p.surface === "flat") out.push("amb-surface");
  if (p.surface === "concave") out.push("amb-surface-concave");
  if (p.surface === "convex") out.push("amb-surface-convex");
  /* An edge treatment is a cut into material: it needs a body to cut into,
     and on a groove it would fight the recess for the same property. */
  if (p.structure === "body" && p.edge !== "none") out.push(`amb-${p.edge}`);
  if (p.material !== "default") out.push(`amb-mat-${p.material}`);
  return out;
}

function rule(selector: string, declarations: string[]): string {
  if (declarations.length === 0) return "";
  return `${selector} {\n${declarations.map((line) => `  ${line};`).join("\n")}\n}`;
}

function shapeRules(slug: string, family: FamilyName, shape: ShapeElement): string[] {
  const rules: string[] = [];

  if (shape.steadyLight) {
    /* Two elements, and the split is load-bearing. A custom property cannot
       read itself: `--amb-light-x: calc(var(--amb-light-x) …)` is a cycle,
       which resolves to invalid at computed-value time and takes the whole
       `.ambient` box-shadow composite down with it — silently, and looking
       exactly like a flat rectangle. So the wrapper captures the scene's
       light and carries no paint at all. */
    rules.push(
      rule(mountSelector(slug, family, shape), [
        /* The wrapper takes the placement the shape would have had: an
           absolute mount around an in-flow key would collapse the button
           exactly as an absolute key does. */
        ...(shape.box.place === "flow"
          ? ["position: relative", "display: block", "width: 100%"]
          : ["position: absolute", "inset: 0"]),
        `--_${slug}-light-x: var(--amb-light-x)`,
        `--_${slug}-light-y: var(--amb-light-y)`
      ])
    );
  }

  const declarations = [...geometry(shape), ...paint(shape), ...text(shape)];
  const round = radius(shape);
  if (round) declarations.push(`border-radius: ${round}`);

  if (shape.steadyLight) {
    /* The world light restated in the frame's own turned coordinates: the
       inverse rotation applied to the captured vector. `--ambx-angle` is an
       <angle>, which is what cos() and sin() want, so this is the whole
       correction — the lit edge and the drop shadow stay where the room put
       them while the part sweeps under them. */
    declarations.push(
      `--amb-light-x: calc(var(--_${slug}-light-x) * cos(var(--ambx-angle)) + var(--_${slug}-light-y) * sin(var(--ambx-angle)))`,
      `--amb-light-y: calc(var(--_${slug}-light-y) * cos(var(--ambx-angle)) - var(--_${slug}-light-x) * sin(var(--ambx-angle)))`
    );
  }

  rules.push(rule(shapeSelector(slug, family, shape), declarations));
  return rules.filter(Boolean);
}

/** Tokens a family's ROOT has to carry. They cannot be inline: a kit hands
 *  back a className and nothing else, and these are read by the control's
 *  own box — a latch is its own track, so its width is the root's width. */
export function rootDeclarations(cfg: KitConfig, family: FamilyName): string[] {
  const out: string[] = [];
  if (family === "rotary") {
    const { clearanceTop, clearanceSides } = cfg.rotary.root;
    /* Graphics printed outside the control's box have to be paid for in
       layout, and only the kit knows it put them there. */
    if (clearanceTop > 0) out.push(`margin-top: calc(var(--ambx-size) * ${n(clearanceTop / 100)})`);
    if (clearanceSides > 0)
      out.push(`margin-inline: calc(var(--ambx-size) * ${n(clearanceSides / 100)})`);
  }
  if (family === "latch" && cfg.latch.root.on) {
    const { trackW, trackH, thumbW, thumbH, inset } = cfg.latch.root;
    /* A latch IS its own track, so the track's box is the control's box and
       these have to reach the root. Widths off the width, heights off the
       height — the grounded pill is wide and the console thumb is round, and
       one factor cannot say both.

       Off by default, and that is not laziness: `.amb-switch` and
       `.amb-console-toggle` already carry these five, so a kit that keeps
       either class and restates them is arguing with the stylesheet it is
       standing on. Turn it on when nothing else is holding the geometry —
       which is exactly the case when the track is a shape you drew. */
    out.push(
      `--ambx-switch-w: calc(var(--ambx-grid) * ${n(trackW)})`,
      `--ambx-switch-h: calc(var(--ambx-grid) * ${n(trackH)})`,
      `--ambx-latch-thumb-w: calc(var(--ambx-switch-w) * ${n(thumbW)})`,
      `--ambx-latch-thumb-h: calc(var(--ambx-switch-h) * ${n(thumbH)})`,
      `--ambx-latch-inset: calc(var(--ambx-switch-h) * ${n(inset)})`
    );
  }
  return out;
}

export function rootClass(slug: string, family: FamilyName): string {
  return `${slug}-${family}-root`;
}

/** Every shape in the kit, plus the two shared hooks and any root tokens.
 *  Empty when no family uses shapes, which is how the export stays a single
 *  file for a kit built entirely out of library parts. */
export function emitCss(cfg: KitConfig, slug: string, families: FamilyName[]): string {
  const blocks: string[] = [];
  let usesShapes = false;
  let usesMount = false;

  const bodies: string[] = [];
  let usesTransition = false;
  for (const family of families) {
    const elements = cfg[family].elements ?? [];

    const root = rootDeclarations(cfg, family);
    if (root.length > 0) bodies.push(rule(`.${rootClass(slug, family)}`, root));

    for (const element of elements) {
      if (element.kind !== "shape") continue;
      usesShapes = true;
      if (element.steadyLight) usesMount = true;
      if (element.paint.transition) usesTransition = true;
      bodies.push(...shapeRules(slug, family, element));
    }
  }

  if (bodies.length === 0) return "";

  blocks.push(
    `/* ${slug}.css — the shapes this kit is drawn from.\n` +
      `   Imported by ${slug}.tsx. Every rule is two classes wide so it beats\n` +
      `   the library's own single-class rules on specificity rather than on\n` +
      `   import order, which the app that consumes this kit controls. */`
  );

  if (usesShapes) {
    blocks.push(rule(`.${slug}-shape`, ["position: absolute", "box-sizing: border-box"]));
  }
  if (usesMount) {
    blocks.push(rule(`.${slug}-mount`, ["position: absolute", "inset: 0"]));
  }

  blocks.push(...bodies);

  /* Only when something actually eases: a shape whose colour tracks the
     value is the one thing on this page that moves on its own. */
  if (usesTransition) {
    blocks.push(
      `@media (prefers-reduced-motion: reduce) {\n  .${slug}-shape {\n    transition: none;\n  }\n}`
    );
  }

  return blocks.filter(Boolean).join("\n\n") + "\n";
}
