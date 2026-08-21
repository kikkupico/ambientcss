/* The Kit Builder's whole state: one plain object, serialisable, and the
   single input to both the live preview and the generated file. Everything
   the page can produce is a pure function of this. */

import type { AmbientMaterial } from "@ambientcss/components";
import type { KitElement } from "./model";
import { seedElements, seedRoot, seedRootClass } from "./seeds";
import type { SeedName } from "./seeds";

/** A material choice, plus the "say nothing" option — a part that is handed
 *  no material keeps whatever its own stylesheet gives it. */
export type MaterialChoice = AmbientMaterial | "default";

export const MATERIALS: MaterialChoice[] = [
  "default",
  "matte",
  "shiny",
  "glass",
  "brushed",
  "brushed-round",
  "blasted"
];

/** Panels always wear a finish, so they get the list without `default`. */
export const PANEL_MATERIALS: AmbientMaterial[] = [
  "matte",
  "shiny",
  "glass",
  "brushed",
  "brushed-round",
  "blasted"
];

export type AnimateChoice = "default" | "auto" | "follow" | "ease" | "snap";
export type InputChoice = "default" | "drag" | "angle" | "delta";

/** What every family carries.
 *
 *  There is one way to dress a family and it is the real one: a list of
 *  elements per frame, plus the class its root wears. A "shipped look" is
 *  not a mode — it is a seed for that list, which is why picking `console
 *  parts` and then opening the housing works at all. */
export type CustomState = {
  /** Off means the family is left undressed and falls through to grounded —
   *  which is what a real third-party kit does with most of them. */
  dressed: boolean;
  seed: SeedName;
  elements: KitElement[];
  /** The library classes the control root keeps. `className` replaces rather
   *  than joins, so this string is the whole of what the root inherits. */
  rootClass: string;
};

export type KitConfig = {
  name: string;
  rotary: CustomState & {
    /** Graphics printed outside the control's box, in % of --ambx-size.
     *  Only the kit knows it put them there, so only the kit can pay for
     *  the layout clearance. */
    root: { clearanceTop: number; clearanceSides: number };
    /* presentation defaults — the one place a kit may speak about feel */
    input: InputChoice;
    travel: number | null;
    animate: AnimateChoice;
  };
  travel: CustomState & {
    /** The horizontal root class. A fader and a slider are one family and
     *  one element list, but never one class: the class is what sizes the
     *  track, and it has to know which way the track runs. */
    rootClassH: string;
    animate: AnimateChoice;
  };
  press: CustomState;
  latch: CustomState & {
    root: { on: boolean; trackW: number; trackH: number; thumbW: number; thumbH: number; inset: number };
    animate: AnimateChoice;
  };
  bank: CustomState;
  /* Not part of the kit — the scene it was tuned under. Exported beside it
     so the file reproduces what the builder showed. */
  theme: {
    lightX: number;
    lightY: number;
    keyLight: number;
    fillLight: number;
    lightHue: number;
    lightSaturation: number;
    highlightColor: string;
    lumeHue: number;
    /** `--ambx-accent`, read by parts that light up. Not an `AmbientTheme`
     *  field — it goes on the wrapper as a custom property. */
    accent: string | null;
  };
  panel: {
    material: AmbientMaterial;
  };
};

/** A family's starting state, drawn from its seed so the three things a seed
 *  decides — the elements, the root class, the root tokens — can never fall
 *  out of step with each other. */
function seeded(family: string, seed: SeedName) {
  return {
    dressed: true,
    seed,
    elements: seedElements(family, seed),
    rootClass: seedRootClass(family, seed).rootClass
  };
}

export const DEFAULT_CONFIG: KitConfig = {
  name: "my kit",
  rotary: {
    ...seeded("rotary", "grounded"),
    root: { clearanceTop: 0, clearanceSides: 0 },
    input: "default",
    travel: null,
    animate: "default"
  },
  travel: {
    ...seeded("travel", "grounded"),
    rootClassH: seedRootClass("travel", "grounded").rootClassH,
    animate: "default"
  },
  press: seeded("press", "grounded"),
  latch: {
    ...seeded("latch", "grounded"),
    /* The grounded switch's own numbers, restated — and left off, because
       `.amb-switch` is already saying them. They are here so that moving a
       slider starts from the truth rather than from zero. */
    root: { on: false, trackW: 12, trackH: 6, thumbW: 0.52, thumbH: 0.78, inset: 0.11 },
    animate: "default"
  },
  bank: seeded("bank", "grounded"),
  theme: {
    lightX: -1,
    lightY: -1,
    keyLight: 0.9,
    fillLight: 0.72,
    lightHue: 220,
    lightSaturation: 14,
    highlightColor: "#7dd3fc",
    lumeHue: 190,
    accent: null
  },
  panel: {
    material: "matte"
  }
};

/** The three things a seed decides, as one patch: the elements, the class
 *  the root wears, and the root tokens that class does not already provide.
 *  Applied together, because a seed whose elements arrive without its root
 *  class is a knob with no token table under it. */
export function seedPatch(
  family: string,
  seed: SeedName,
  currentRoot?: Record<string, number | boolean>
): Record<string, unknown> {
  const classes = seedRootClass(family, seed);
  const root = seedRoot(family, seed);
  return {
    seed,
    elements: seedElements(family, seed),
    rootClass: classes.rootClass,
    ...(family === "travel" ? { rootClassH: classes.rootClassH } : null),
    ...(root ? { root: { ...currentRoot, ...root } } : null)
  };
}

/* ── Naming ───────────────────────────────────────────────────────────── */

/** The `name:` field of the kit — kebab, because it is an identity string
 *  that shows up in dev warnings. */
export function kitSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "my-kit";
}

/** The exported binding — `deskKit`, `myKit`. */
export function kitIdent(name: string): string {
  const parts = kitSlug(name).split("-");
  const camel = parts
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
  const safe = /^[a-z]/.test(camel) ? camel : `kit${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
  return safe.endsWith("Kit") || safe === "kit" ? safe : `${safe}Kit`;
}

/** The theme binding that travels with it. */
export function themeIdent(name: string): string {
  const kit = kitIdent(name);
  return kit.endsWith("Kit") ? `${kit.slice(0, -3)}Theme` : `${kit}Theme`;
}

export function fileName(name: string): string {
  return `${kitSlug(name)}.tsx`;
}

/* ── Sharing ──────────────────────────────────────────────────────────── */

/* A config round-trips through the URL so a look can be sent to someone.
   base64 of the JSON, url-safe: short enough for a link, and no schema to
   keep in step with a hand-rolled encoding. */

export function encodeConfig(config: KitConfig): string {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(encoded: string): KitConfig | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<KitConfig>;
    if (!parsed || typeof parsed !== "object") return null;
    /* Merged over the defaults rather than trusted: a link from an older
       build is missing whatever was added since, and a missing family would
       otherwise crash the preview rather than fall back. */
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      rotary: { ...DEFAULT_CONFIG.rotary, ...parsed.rotary },
      travel: { ...DEFAULT_CONFIG.travel, ...parsed.travel },
      press: { ...DEFAULT_CONFIG.press, ...parsed.press },
      latch: { ...DEFAULT_CONFIG.latch, ...parsed.latch },
      bank: { ...DEFAULT_CONFIG.bank, ...parsed.bank },
      theme: { ...DEFAULT_CONFIG.theme, ...parsed.theme },
      panel: { ...DEFAULT_CONFIG.panel, ...parsed.panel }
    };
  } catch {
    return null;
  }
}
