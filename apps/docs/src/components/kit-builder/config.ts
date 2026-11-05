/* The Kit Builder's whole state: one plain object, serialisable, and the
   single input to both the live preview and the generated file. Everything
   the page can produce is a pure function of this. */

import type { AmbientMaterial } from "@ambientcss/components";
import type { KitElement } from "./model";
import { seedElements, seedRoot, seedRootClass, seedsFor } from "./seeds";
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
/** The fields that make up one VERSION of a family — what it draws and
 *  what its root wears. Everything else on a family (whether it is dressed,
 *  how it feels to turn) is shared by every version. */
export const VARIANT_KEYS = ["seed", "elements", "rootClass", "rootClassH", "root"] as const;

export type VariantFields = {
  seed: SeedName;
  elements: KitElement[];
  rootClass: string;
  rootClassH?: string | undefined;
  root?: Record<string, number | boolean> | undefined;
};

/** A further version of a family, beyond the default one. */
export type ExtraVariant = VariantFields & { name: string };

export type CustomState = {
  /** Off means the family is left undressed and falls through to grounded —
   *  which is what a real third-party kit does with most of them. */
  dressed: boolean;
  seed: SeedName;
  elements: KitElement[];
  /** The library classes the control root keeps. `className` replaces rather
   *  than joins, so this string is the whole of what the root inherits. */
  rootClass: string;
  /** The default version's name — what `variant="…"` calls it. */
  variantName?: string | undefined;
  /** Every version after the default. A kit may draw a pill switch AND a
   *  toggle switch; the caller picks with the preset's `variant` prop. The
   *  family's own fields above are the default version, which is also how a
   *  link made before versions existed still reads. */
  variants?: ExtraVariant[] | undefined;
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
    /** `--amb-label`, overriding the label colour the light would give.
     *  A dark panel under a bright lamp needs light print. */
    label?: string | null | undefined;
  };
  panel: {
    material: AmbientMaterial;
    /** `--amb-albedo` — the panel's own colour, which every part inside
     *  inherits unless it states its own. Unset is the calibrated grey. */
    albedo?: string | null | undefined;
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
    accent: null,
    label: null
  },
  panel: {
    material: "matte",
    albedo: null
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

/* ── Whole-kit starting points ────────────────────────────────────────── */

/** A starting point for the whole kit at once: a seed per family, and which
 *  families are left to fall through. Applying one is the same as picking
 *  each family's "Start from" by hand — it is a shortcut, not a mode. */
export type KitPresetName = "grounded" | "console" | "console-shapes" | "empty";

export const KIT_PRESETS: { id: KitPresetName; label: string; note: string }[] = [
  {
    id: "grounded",
    label: "Grounded",
    note: "The library's default hardware look, every part ready to change."
  },
  {
    id: "console",
    label: "Console",
    note: "Mixer-desk knobs, pill toggles and keys. Faders and buttons stay grounded."
  },
  {
    id: "console-shapes",
    label: "Console, from shapes",
    note: "The console knob and toggle rebuilt from plain shapes, so you can take them apart."
  },
  {
    id: "empty",
    label: "Blank",
    note: "Empty controls. Draw every part yourself."
  }
];

const FAMILY_KEYS = ["rotary", "travel", "press", "latch", "bank"] as const;

function presetSeed(preset: KitPresetName, family: string): { dressed: boolean; seed: SeedName } {
  if (preset === "grounded" || preset === "empty") return { dressed: true, seed: preset };
  const wanted: SeedName = preset === "console-shapes" && family === "bank" ? "console" : preset;
  return seedsFor(family).includes(wanted)
    ? { dressed: true, seed: wanted }
    : /* consoleKit has no opinion about faders or buttons, so neither does
         a kit started from it: they fall through to grounded. */
      { dressed: false, seed: "grounded" };
}

export function applyKitPreset(cfg: KitConfig, preset: KitPresetName): KitConfig {
  const next = { ...cfg } as KitConfig;
  for (const family of FAMILY_KEYS) {
    const { dressed, seed } = presetSeed(preset, family);
    const current = cfg[family] as { root?: Record<string, number | boolean> };
    (next as Record<string, unknown>)[family] = {
      ...cfg[family],
      ...seedPatch(family, seed, current.root),
      dressed,
      /* A new starting point for the whole kit is one version per control;
         undo brings any others back. */
      variantName: undefined,
      variants: undefined
    };
  }
  /* The console knob is an absolute-position pot: it grabs where you press,
     over a 280° sweep. That is part of the look consoleKit ships. */
  const consoleFeel = preset === "console" || preset === "console-shapes";
  next.rotary = {
    ...next.rotary,
    input: consoleFeel ? "angle" : "default",
    travel: consoleFeel ? 280 : null,
    animate: "default"
  };
  next.travel = { ...next.travel, animate: "default" };
  next.latch = { ...next.latch, animate: "default" };
  return next;
}

/** Whether a family still matches the seed it started from — ids aside,
 *  since every seeding mints new ones. */
export function isPristine(cfg: KitConfig, family: (typeof FAMILY_KEYS)[number], index = 0): boolean {
  const state = projectVariant(cfg, family, index)[family];
  const strip = (elements: KitElement[]) =>
    JSON.stringify(elements.map(({ id: _id, ...rest }) => rest));
  return (
    strip(state.elements) === strip(seedElements(family, state.seed)) &&
    state.rootClass === seedRootClass(family, state.seed).rootClass
  );
}

/* ── Versions ───────────────────────────────────────────────────────── */

export type FamilyKey = (typeof FAMILY_KEYS)[number];

export const DEFAULT_VARIANT = "default";

/** One version, as a record: the default one is read off the family itself. */
export type VariantRecord = ExtraVariant;

function pickVariant(source: Record<string, unknown>): VariantFields {
  const out: Record<string, unknown> = {};
  for (const key of VARIANT_KEYS) if (source[key] !== undefined) out[key] = source[key];
  return out as VariantFields;
}

export function getVariants(cfg: KitConfig, family: FamilyKey): VariantRecord[] {
  const state = cfg[family];
  return [
    { ...pickVariant(state as unknown as Record<string, unknown>), name: state.variantName ?? DEFAULT_VARIANT },
    ...(state.variants ?? [])
  ];
}

export function variantNames(cfg: KitConfig, family: FamilyKey): string[] {
  return getVariants(cfg, family).map((variant) => variant.name);
}

/** Write a list of versions back: the first becomes the family's own
 *  fields, the rest its `variants`. */
export function setVariants(cfg: KitConfig, family: FamilyKey, list: VariantRecord[]): KitConfig {
  const [first, ...rest] = list;
  if (!first) return cfg;
  const { name, ...fields } = first;
  return {
    ...cfg,
    [family]: {
      ...cfg[family],
      ...fields,
      variantName: name === DEFAULT_VARIANT ? undefined : name,
      variants: rest.length > 0 ? rest : undefined
    }
  };
}

/** The config as if version `index` were the family's only version. Every
 *  engine function reads a family off the config, so this is how they all
 *  learn to speak about one version without each being taught. */
export function projectVariant(cfg: KitConfig, family: FamilyKey, index: number): KitConfig {
  if (index === 0) return cfg;
  const variant = cfg[family].variants?.[index - 1];
  if (!variant) return cfg;
  const { name, ...fields } = variant;
  return { ...cfg, [family]: { ...cfg[family], ...fields, variantName: name, variants: undefined } };
}

/** What a version's generated classes are scoped by. The default version
 *  keeps the bare family, so a kit with one version writes the same CSS it
 *  always did; the others carry their name, so two versions may each have a
 *  `track` shape without their rules colliding. */
export function variantScope(family: string, name: string, index: number): string {
  return index === 0 ? family : `${family}-${name}`;
}

/** Change one version in place. */
export function updateVariant(
  cfg: KitConfig,
  family: FamilyKey,
  index: number,
  update: (fields: VariantRecord) => VariantRecord
): KitConfig {
  const list = getVariants(cfg, family);
  if (!list[index]) return cfg;
  return setVariants(cfg, family, list.map((variant, i) => (i === index ? update(variant) : variant)));
}

/** Patch a family from a form: the version's own keys go to that version,
 *  the rest (dressed, feel) to the family. */
export function patchVariant(
  cfg: KitConfig,
  family: FamilyKey,
  index: number,
  values: Record<string, unknown>
): KitConfig {
  const own: Record<string, unknown> = {};
  const shared: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    ((VARIANT_KEYS as readonly string[]).includes(key) ? own : shared)[key] = value;
  }
  const next = { ...cfg, [family]: { ...cfg[family], ...shared } } as KitConfig;
  return Object.keys(own).length > 0
    ? updateVariant(next, family, index, (variant) => ({ ...variant, ...own }) as VariantRecord)
    : next;
}

/** A version name: kebab, because it is written into class names and into
 *  `variant="…"` at the call site. */
export function variantSlug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "version"
  );
}

export function uniqueVariantName(taken: string[], wanted: string): string {
  const stem = variantSlug(wanted);
  if (!taken.includes(stem)) return stem;
  let i = 2;
  while (taken.includes(`${stem}-${i}`)) i += 1;
  return `${stem}-${i}`;
}

/** The binding a version's dress function is exported under: `latchToggle`. */
export function variantIdent(family: string, name: string): string {
  const pascal = variantSlug(name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `${family}${/^[0-9]/.test(pascal) ? `V${pascal}` : pascal}`;
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
