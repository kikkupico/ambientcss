/* Families: how each one is dressed, in both directions at once.
 *
 *  Every family answers the same two questions — what goes in the frames,
 *  and what the root wears — and both products of this page fall out of the
 *  same answer: the live dressing function the preview runs, and the source
 *  the export writes. `parts.tsx` holds the leaves; this file holds the
 *  arrangement.
 *
 *  There is no second, shallower path. A shipped look is a seed for the
 *  element list, not a mode — which is why every knob on this page can be
 *  taken apart, including the two the library ships. */

import type { ControlParts, KitDefaults, KitDress, KitLook } from "@ambientcss/components";
import type { ReactNode } from "react";
import { elementPiece, nodesOf } from "./parts";
import type { BuildContext, Piece } from "./parts";
import { rootClass, rootDeclarations } from "./css";
import { FRAMES, elementApplies } from "./model";
import type { FrameName, KitElement } from "./model";
import type { KitConfig, MaterialChoice } from "./config";

export type { Piece } from "./parts";

export type FamilyName = "rotary" | "travel" | "press" | "latch" | "bank";

export const FAMILIES: FamilyName[] = ["rotary", "travel", "press", "latch", "bank"];

export const FAMILY_LABELS: Record<FamilyName, string> = {
  rotary: "Knobs — rotary",
  travel: "Faders & sliders — travel",
  press: "Buttons — press",
  latch: "Switches — latch",
  bank: "Key banks — bank"
};

type Frames = Partial<Record<FrameName, Piece[]>>;

/** A dressed family, before it is split into its two views. */
type Build = { className: string; frames: Frames };

function classes(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

function toParts(frames: Frames): ControlParts {
  const parts: ControlParts = {};
  for (const frame of FRAMES) {
    const pieces = frames[frame];
    if (pieces && pieces.length > 0) parts[frame] = nodesOf(pieces);
  }
  return parts;
}

function importsOf(frames: Frames): string[] {
  return FRAMES.flatMap((frame) => frames[frame] ?? []).flatMap((piece) => piece.imports);
}

/** `parts: { … }` as source. A frame holding more than one element prints as
 *  a fragment, which is what the hand-written kits in the library do. */
function partsCode(frames: Frames, pad: string): string {
  const entries: string[] = [];
  for (const frame of FRAMES) {
    const pieces = frames[frame];
    if (!pieces || pieces.length === 0) continue;
    if (pieces.length === 1) {
      entries.push(`${pad}  ${frame}: ${pieces[0]!.code}`);
    } else {
      const inner = pieces.map((piece) => `${pad}      ${piece.code}`).join("\n");
      entries.push(`${pad}  ${frame}: (\n${pad}    <>\n${inner}\n${pad}    </>\n${pad}  )`);
    }
  }
  return `${pad}parts: {\n${entries.join(",\n")}\n${pad}}`;
}

export type FamilyCode = { code: string; imports: string[]; looks: string[] };

/* ── One family, dressed ──────────────────────────────────────────────── */

/** The elements that reach this orientation. Only travel has two, and only
 *  the elements that say so are dropped: `both` is the default, and it is
 *  also what an element written before the field existed reads as. */
export function elementsFor(cfg: KitConfig, family: FamilyName, upright: boolean): KitElement[] {
  const elements = cfg[family].elements ?? [];
  return family === "travel"
    ? elements.filter((element) => elementApplies(element, upright))
    : elements;
}

function frames(
  elements: KitElement[],
  slug: string,
  family: FamilyName,
  ctx: BuildContext
): Frames {
  const out: Frames = {};
  for (const element of elements) {
    const pieces = out[element.frame] ?? (out[element.frame] = []);
    pieces.push(elementPiece(element, slug, family, ctx));
  }
  return out;
}

/** The root class: the library classes this look keeps, plus the generated
 *  one carrying whatever tokens no library class is providing. */
function className(cfg: KitConfig, family: FamilyName, slug: string, upright: boolean): string {
  const state = cfg[family];
  const library = family === "travel" && !upright ? cfg.travel.rootClassH : state.rootClass;
  const hasRoot = rootDeclarations(cfg, family).length > 0;
  return classes(library, hasRoot && rootClass(slug, family));
}

function build(
  cfg: KitConfig,
  slug: string,
  family: FamilyName,
  upright: boolean,
  ctx: BuildContext
): Build {
  return {
    className: className(cfg, family, slug, upright),
    frames: frames(elementsFor(cfg, family, upright), slug, family, ctx)
  };
}

/* ── The two products ─────────────────────────────────────────────────── */

/** The live dressing function for a family. */
export function familyDress(
  cfg: KitConfig,
  slug: string,
  family: FamilyName
): (look: KitLook) => KitDress {
  if (family === "travel") {
    return (look) => {
      const made = build(cfg, slug, "travel", look.orientation === "vertical", {});
      return { className: made.className, parts: toParts(made.frames) };
    };
  }
  /* A button's legend is the caller's and arrives through the look, so the
     press family cannot be built once and reused — whatever part carries the
     legend has to be handed it. */
  if (family === "press") {
    return (look) => {
      const made = build(cfg, slug, "press", true, { children: look.children as ReactNode });
      return { className: made.className, parts: toParts(made.frames) };
    };
  }
  const made = build(cfg, slug, family, true, {});
  return () => ({ className: made.className, parts: toParts(made.frames) });
}

/** The same family as source. */
export function familyCode(cfg: KitConfig, slug: string, family: FamilyName): FamilyCode {
  if (family === "travel") {
    const vertical = build(cfg, slug, "travel", true, {});
    const horizontal = build(cfg, slug, "travel", false, {});
    const sameParts = partsCode(vertical.frames, "      ") === partsCode(horizontal.frames, "      ");
    const code = sameParts
      ? [
          `  travel: (look) => ({`,
          `    className: look.orientation === "vertical" ? "${vertical.className}" : "${horizontal.className}",`,
          partsCode(vertical.frames, "    "),
          `  }),`
        ].join("\n")
      : [
          `  travel: (look) => {`,
          `    const upright = look.orientation === "vertical";`,
          `    return upright`,
          `      ? {`,
          `          className: "${vertical.className}",`,
          partsCode(vertical.frames, "          "),
          `        }`,
          `      : {`,
          `          className: "${horizontal.className}",`,
          partsCode(horizontal.frames, "          "),
          `        };`,
          `  },`
        ].join("\n");
    return {
      code,
      imports: [...importsOf(vertical.frames), ...importsOf(horizontal.frames)],
      looks: ["orientation"]
    };
  }

  if (family === "press") {
    const made = build(cfg, slug, "press", true, {});
    return {
      code: [
        `  press: (look) => ({`,
        `    className: "${made.className}",`,
        partsCode(made.frames, "    "),
        `  }),`
      ].join("\n"),
      imports: importsOf(made.frames),
      /* None of these are honoured — the cap is chosen here. They are named
         because `AmbientButton` sends all three on every call: `children` is
         the caller's legend passing through, and `material` and `shape` are
         the preset's OWN defaults, which arrive whether the caller asked for
         them or not. A kit that dresses press and does not name them warns
         on every button about props nobody passed. */
      looks: ["material", "shape", "children"]
    };
  }

  const made = build(cfg, slug, family, true, {});
  return {
    code: [
      `  ${family}: () => ({`,
      `    className: "${made.className}",`,
      partsCode(made.frames, "    "),
      `  }),`
    ].join("\n"),
    imports: importsOf(made.frames),
    looks: []
  };
}

/* ── Presentation defaults ────────────────────────────────────────────── */

/* Narrow on purpose: a kit says how its controls should feel to turn, never
   what they are worth. Anything touching value, range or handlers stays with
   the caller. */

export function kitDefaults(cfg: KitConfig): KitDefaults | undefined {
  const rotary: Record<string, unknown> = {};
  if (cfg.rotary.dressed) {
    if (cfg.rotary.input !== "default") rotary.input = cfg.rotary.input;
    if (cfg.rotary.travel !== null) rotary.travel = cfg.rotary.travel;
    if (cfg.rotary.animate !== "default") rotary.animate = cfg.rotary.animate;
  }
  const travel: Record<string, unknown> = {};
  if (cfg.travel.dressed && cfg.travel.animate !== "default") {
    travel.animate = cfg.travel.animate;
  }
  const latch: Record<string, unknown> = {};
  if (cfg.latch.dressed && cfg.latch.animate !== "default") {
    latch.animate = cfg.latch.animate;
  }

  const defaults: KitDefaults = {};
  if (Object.keys(rotary).length > 0) defaults.rotary = rotary as KitDefaults["rotary"];
  if (Object.keys(travel).length > 0) defaults.travel = travel as KitDefaults["travel"];
  if (Object.keys(latch).length > 0) defaults.latch = latch as KitDefaults["latch"];
  return Object.keys(defaults).length > 0 ? defaults : undefined;
}

/** Which families this config dresses, in the order the kit prints them.
 *  An undressed family is the interesting case: a kit that dresses two and
 *  lets the rest fall through is what a real third-party kit looks like. */
export function dressedFamilies(cfg: KitConfig): FamilyName[] {
  return FAMILIES.filter((family) => cfg[family].dressed);
}

/** Materials are a part's own business; a shape carries one too. */
export type { MaterialChoice };
