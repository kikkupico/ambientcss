/* Sample kits — what a kit can be, shown rather than described.
 *
 *  These live in the builder, not the library, on purpose: they are starting
 *  points to open and take apart, not looks an app should import. Each is a
 *  complete builder config (layers, scene, versions), so opening one is the
 *  same as having built it by hand, and every number in it can be changed.
 *
 *  They are chosen to differ along every axis a kit has:
 *
 *    studio     library parts only, and versions — two knobs, two switches
 *    bakelite   shapes with material colour: domed bodies, a chicken-head
 *               pointer that holds the light as it turns, ivory keys
 *    neon       a dark room, and colour driven by value with no JavaScript:
 *               rings and tracks that light up as they move
 *    lab        nothing but library parts and their options, re-chosen
 *    pastel     a consumer gadget: glossy pastel bodies, custom switch
 *               geometry, light from straight above
 *    blueprint  no lighting at all — flat line drawing, to show a kit does
 *               not have to be skeuomorphic */

import { DEFAULT_CONFIG, seedPatch } from "./config";
import type { CustomState, ExtraVariant, KitConfig } from "./config";
import type { KitElement } from "./model";
import { part, seedElements, seedRootClass, shape } from "./seeds";
import type { SeedName } from "./seeds";

export type SampleKit = {
  id: string;
  name: string;
  tagline: string;
  /** What the sample demonstrates, as short tags for the gallery. */
  shows: string[];
  config: KitConfig;
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

type Family = "rotary" | "travel" | "press" | "latch" | "bank";

/** A family drawn from explicit elements and a root class. */
function drawn(elements: KitElement[], rootClass: string, extra: Partial<CustomState> = {}) {
  return { dressed: true, seed: "empty" as SeedName, elements, rootClass, ...extra };
}

/** A family started from a library seed, unchanged. */
function seeded(family: Family, seed: SeedName) {
  return { dressed: true, seed, elements: seedElements(family, seed), rootClass: seedRootClass(family, seed).rootClass };
}

function version(name: string, fields: Omit<ExtraVariant, "name">): ExtraVariant {
  return { name, ...fields };
}

function kit(patch: {
  name: string;
  rotary?: Partial<KitConfig["rotary"]>;
  travel?: Partial<KitConfig["travel"]>;
  press?: Partial<KitConfig["press"]>;
  latch?: Partial<KitConfig["latch"]>;
  bank?: Partial<KitConfig["bank"]>;
  theme: Partial<KitConfig["theme"]>;
  panel: KitConfig["panel"];
}): KitConfig {
  const base = DEFAULT_CONFIG;
  return {
    name: patch.name,
    rotary: { ...base.rotary, ...patch.rotary },
    travel: { ...base.travel, ...patch.travel },
    press: { ...base.press, ...patch.press },
    latch: { ...base.latch, ...patch.latch },
    bank: { ...base.bank, ...patch.bank },
    theme: { ...base.theme, ...patch.theme },
    panel: patch.panel
  };
}

/** Plain marks — no lighting model, no surface of their own. */
const FLAT = { structure: "plain", surface: "none", edge: "none" } as const;

/* ── Studio desk ──────────────────────────────────────────────────────── */

/* A mixing desk made of nothing but the library's own parts — and two
   versions each of the knob and the switch. Apps pick with `variant`:
   `<AmbientKnob variant="trim" />`, `<AmbientSwitch variant="toggle" />`. */
const studio = kit({
  name: "studio desk",
  rotary: {
    ...seeded("rotary", "console"),
    variantName: "pot",
    variants: [
      version("trim", {
        seed: "grounded",
        rootClass: "amb-knob",
        elements: [
          part("base", "KnobBody", { material: "blasted", flush: true }),
          part("actuator", "IndicatorBar")
        ],
        root: { clearanceTop: 0, clearanceSides: 0 }
      })
    ],
    root: { clearanceTop: 0, clearanceSides: 0 },
    input: "angle",
    travel: 280
  },
  travel: {
    ...seeded("travel", "grounded"),
    rootClassH: "amb-slider",
    elements: [
      part("base", "TravelTrack", { depth: "slot" }, "vertical"),
      part("base", "TravelTrack", { depth: "channel" }, "horizontal"),
      part("actuator", "FaderCap", { material: "blasted" }, "vertical"),
      part("actuator", "SliderThumb", { material: "blasted" }, "horizontal")
    ]
  },
  press: seeded("press", "grounded"),
  latch: {
    ...seeded("latch", "grounded"),
    variantName: "pill",
    variants: [
      version("toggle", {
        ...(seedPatch("latch", "console", DEFAULT_CONFIG.latch.root) as Omit<ExtraVariant, "name">)
      })
    ]
  },
  bank: seeded("bank", "console"),
  theme: {
    lightX: 0,
    lightY: -1,
    keyLight: 0.7,
    fillLight: 0.58,
    lightHue: 215,
    lightSaturation: 8,
    lumeHue: 200,
    highlightColor: "#ff8a3d",
    accent: "#ff7a1a"
  },
  panel: { material: "blasted" }
});

/* ── Bakelite radio ───────────────────────────────────────────────────── */

const IVORY = "#efe4cc";
const BAKELITE = "#4a2a18";

const bakelite = kit({
  name: "bakelite",
  rotary: {
    ...drawn(
      [
        part("panel", "ScaleRing", { count: 11 }),
        shape("base", "body", {
          box: { place: "fill", inset: 4, radius: "circle" },
          paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 1.6, material: "shiny", fill: "albedo", colour: BAKELITE }
        }),
        /* A chicken-head pointer. It rides the turning frame, so it holds
           the light: its lit edge stays where the lamp is at every angle. */
        shape("actuator", "pointer", {
          box: { place: "centre", width: 16, height: 62, y: -14, radius: "pill" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 0.8, elevation: 0, material: "shiny", fill: "albedo", colour: IVORY },
          steadyLight: true
        })
      ],
      "amb-knob amb-knob-markers-full"
    ),
    root: { clearanceTop: 0, clearanceSides: 0 }
  },
  press: drawn(
    [
      shape("actuator", "key", {
        box: { place: "flow", width: 12, height: 6, radius: "soft", softness: 6 },
        paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1, material: "shiny", fill: "albedo", colour: IVORY },
        content: "legend",
        textSize: 0.24
      })
    ],
    "amb-button amb-groove"
  ),
  latch: {
    ...drawn(
      [
        shape("base", "slot", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.45, fill: "lume" }
        }),
        shape("actuator", "lever", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1, material: "shiny", fill: "albedo", colour: IVORY }
        })
      ],
      "amb-switch"
    )
  },
  /* Faders fall through to grounded: a kit does not have to dress every
     control, and a radio has no faders. */
  travel: { ...DEFAULT_CONFIG.travel, dressed: false },
  bank: seeded("bank", "radio"),
  theme: {
    lightX: -0.6,
    lightY: -1,
    keyLight: 0.86,
    fillLight: 0.7,
    lightHue: 32,
    lightSaturation: 30,
    lumeHue: 36,
    highlightColor: "#f0b660",
    accent: "#e09a3a"
  },
  panel: { material: "matte" }
});

/* ── Neon synth ───────────────────────────────────────────────────────── */

const NIGHT_CAP = "#24223a";

/* Every coloured thing here is "lit by value": it mixes the accent in from
   the control's own --ambx-percent, so a knob's ring glows brighter as it
   turns up — in the stylesheet, with no React state involved. */
const neon = kit({
  name: "neon",
  rotary: {
    ...drawn(
      [
        shape("base", "well", {
          box: { place: "fill", inset: 0, radius: "circle" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.3, fill: "lume" }
        }),
        shape("base", "glow", {
          box: { place: "fill", inset: 5, radius: "circle" },
          paint: { ...FLAT, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "cap", {
          box: { place: "fill", inset: 16, radius: "circle" },
          paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 1, elevation: 0, fill: "albedo", colour: NIGHT_CAP }
        }),
        shape("actuator", "tick", {
          box: { place: "centre", width: 6, height: 20, y: -22, radius: "pill" },
          paint: { ...FLAT, fill: "accent" }
        })
      ],
      "amb-knob"
    ),
    root: { clearanceTop: 0, clearanceSides: 0 }
  },
  travel: {
    ...drawn(
      [
        shape("base", "slot", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.5, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "cap", {
          box: { place: "fill", inset: 0, radius: "soft", softness: 8 },
          paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 1, fill: "albedo", colour: NIGHT_CAP }
        }),
        shape("actuator", "line", {
          box: { place: "centre", width: 70, height: 8, radius: "pill" },
          paint: { ...FLAT, fill: "accent" }
        })
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: drawn(
    [
      shape("actuator", "key", {
        box: { place: "flow", width: 12, height: 7, radius: "soft", softness: 5 },
        /* A key with a neon outline. The legend takes the room's own label
           colour, which a dark room turns light. */
        paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 1, fill: "label", ring: 1.5, ringColour: "#ff3fb4" },
        content: "legend",
        textSize: 0.2
      })
    ],
    "amb-button amb-groove"
  ),
  latch: drawn(
    [
      shape("base", "track", {
        box: { place: "fill", inset: 0, radius: "pill" },
        paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.4, fill: "accent-travel", transition: true }
      }),
      shape("actuator", "thumb", {
        box: { place: "fill", inset: 0, radius: "pill" },
        paint: { structure: "body", surface: "flat", edge: "fillet", thickness: 1, fill: "albedo", colour: "#e8e6f4" }
      })
    ],
    "amb-switch"
  ),
  /* A key bank whose selected key has a lamp its neighbours do not — the
     "Selected" state, which is different markup rather than a restyle. */
  bank: drawn(
    [
      shape("actuator", "face", {
        box: { place: "fill", inset: 0, radius: "soft", softness: 6 },
        paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 0.8, fill: "albedo", colour: NIGHT_CAP }
      }),
      { ...shape("fixture", "lamp", {
        box: { place: "centre", width: 30, height: 30, radius: "circle" },
        paint: { ...FLAT, fill: "accent", ring: 3, ringColour: "#ffd6f0" }
      }), bankState: "on" }
    ],
    "amb-select amb-groove"
  ),
  theme: {
    lightX: -0.6,
    lightY: -1,
    keyLight: 0.12,
    fillLight: 0.32,
    lightHue: 250,
    lightSaturation: 12,
    lumeHue: 300,
    highlightColor: "#ff3fb4",
    accent: "#ff3fb4"
  },
  panel: { material: "matte" }
});

/* ── Lab instrument ───────────────────────────────────────────────────── */

/* Not one shape: a kit can be nothing but the library's parts, re-chosen and
   re-finished. Flush spun knobs with a bar pointer and a fine 21-step
   scale, brushed caps, radio-style keys and an orange-lit toggle. */
const lab = kit({
  name: "lab instrument",
  rotary: {
    ...drawn(
      [
        part("panel", "ScaleRing", { count: 21 }),
        part("base", "KnobBody", { material: "brushed-round", flush: true }),
        part("actuator", "IndicatorBar")
      ],
      "amb-knob amb-knob-markers-full"
    ),
    root: { clearanceTop: 0, clearanceSides: 0 },
    animate: "snap"
  },
  travel: {
    ...drawn(
      [
        part("base", "TravelTrack", { depth: "channel" }),
        part("actuator", "FaderCap", { material: "brushed" }, "vertical"),
        part("actuator", "SliderThumb", { material: "brushed" }, "horizontal")
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: {
    ...drawn([part("actuator", "ButtonCap", { material: "brushed" })], "amb-button amb-groove"),
    variantName: "key",
    variants: [
      version("round", {
        seed: "grounded",
        rootClass: "amb-button amb-groove amb-button-round",
        elements: [part("actuator", "ButtonCap", { material: "shiny" })]
      })
    ]
  },
  latch: seeded("latch", "console"),
  bank: seeded("bank", "radio"),
  theme: {
    lightX: -1,
    lightY: -1,
    keyLight: 0.92,
    fillLight: 0.74,
    lightHue: 210,
    lightSaturation: 6,
    lumeHue: 200,
    highlightColor: "#ff5a1f",
    accent: "#ff5a1f"
  },
  panel: { material: "brushed" }
});

/* ── Pastel gadget ────────────────────────────────────────────────────── */

const pastel = kit({
  name: "pastel",
  rotary: {
    ...drawn(
      [
        shape("base", "puck", {
          box: { place: "fill", inset: 4, radius: "circle" },
          paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 1.4, material: "shiny", fill: "albedo", colour: "#f6b8c8" }
        }),
        shape("actuator", "dot", {
          box: { place: "centre", width: 14, height: 14, y: -26, radius: "circle" },
          paint: { ...FLAT, fill: "accent" }
        })
      ],
      "amb-knob"
    ),
    root: { clearanceTop: 0, clearanceSides: 0 }
  },
  travel: {
    ...drawn(
      [
        shape("base", "groove", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.3, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "bead", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1, material: "shiny", fill: "albedo", colour: "#ffffff" }
        })
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: drawn(
    [
      shape("actuator", "pill", {
        box: { place: "flow", width: 16, height: 8, radius: "pill" },
        paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1, material: "shiny", fill: "albedo", colour: "#bfe3ff" },
        content: "legend",
        textSize: 0.2
      })
    ],
    "amb-button"
  ),
  /* A round thumb in a short track: geometry no library class gives, so the
     kit states it on the switch's own root. */
  latch: {
    ...drawn(
      [
        shape("base", "track", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.35, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "thumb", {
          box: { place: "fill", inset: 0, radius: "circle" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1.2, material: "shiny", fill: "albedo", colour: "#ffffff" }
        })
      ],
      "amb-switch"
    ),
    root: { on: true, trackW: 12, trackH: 6.6, thumbW: 0.46, thumbH: 0.84, inset: 0.08 }
  },
  bank: seeded("bank", "grounded"),
  theme: {
    lightX: 0,
    lightY: -1,
    keyLight: 0.92,
    fillLight: 0.8,
    lightHue: 330,
    lightSaturation: 30,
    lumeHue: 160,
    highlightColor: "#3ccf9e",
    accent: "#3ccf9e"
  },
  panel: { material: "shiny" }
});

/* ── Blueprint ────────────────────────────────────────────────────────── */

const INK = "#eaf2ff";

/* No bodies, no grooves, no light: every element is a flat mark. Kits are
   paint, and paint does not have to pretend to be hardware. */
const blueprint = kit({
  name: "blueprint",
  rotary: {
    ...drawn(
      [
        shape("panel", "min", {
          box: { place: "edge", anchor: "outside-left", y: 8 },
          paint: { ...FLAT, fill: "colour", colour: INK },
          content: "text",
          text: "0",
          textSize: 0.2
        }),
        shape("panel", "max", {
          box: { place: "edge", anchor: "outside-right", y: 8 },
          paint: { ...FLAT, fill: "colour", colour: INK },
          content: "text",
          text: "10",
          textSize: 0.2
        }),
        shape("base", "outline", {
          box: { place: "fill", inset: 4, radius: "circle" },
          paint: { ...FLAT, ring: 3, ringColour: INK }
        }),
        shape("actuator", "needle", {
          box: { place: "centre", width: 4, height: 42, y: -21, radius: "pill" },
          paint: { ...FLAT, fill: "colour", colour: INK }
        })
      ],
      "amb-knob"
    ),
    root: { clearanceTop: 0, clearanceSides: 30 }
  },
  travel: {
    ...drawn(
      [
        shape("base", "rail", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { ...FLAT, ring: 2.5, ringColour: INK }
        }),
        shape("actuator", "handle", {
          box: { place: "fill", inset: 0, radius: "soft", softness: 6 },
          paint: { ...FLAT, fill: "colour", colour: "#2a5592", ring: 3, ringColour: INK }
        })
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: drawn(
    [
      shape("actuator", "frame", {
        box: { place: "flow", width: 13, height: 6, radius: "soft", softness: 3 },
        paint: { ...FLAT, fill: "colour", colour: INK, ring: 3, ringColour: INK },
        content: "legend",
        textSize: 0.2
      })
    ],
    /* The seat well `.amb-button` cuts reads as the blueprint's own navy. */
    "amb-button"
  ),
  latch: drawn(
    [
      shape("base", "outline", {
        box: { place: "fill", inset: 0, radius: "pill" },
        paint: { ...FLAT, ring: 3, ringColour: INK }
      }),
      shape("actuator", "knob", {
        box: { place: "fill", inset: 12, radius: "pill" },
        paint: { ...FLAT, fill: "colour", colour: INK }
      })
    ],
    "amb-switch"
  ),
  bank: drawn(
    [
      shape("actuator", "box", {
        box: { place: "fill", inset: 0, radius: "soft", softness: 4 },
        paint: { ...FLAT, fill: "colour", colour: "#2a5592", ring: 3, ringColour: INK }
      }),
      { ...shape("fixture", "mark", {
        box: { place: "centre", width: 34, height: 34, radius: "circle" },
        paint: { ...FLAT, fill: "colour", colour: INK }
      }), bankState: "on" }
    ],
    "amb-select"
  ),
  theme: {
    lightX: -1,
    lightY: -1,
    keyLight: 0.62,
    fillLight: 0.6,
    lightHue: 214,
    lightSaturation: 48,
    lumeHue: 214,
    highlightColor: INK,
    accent: INK
  },
  panel: { material: "matte" }
});

export const SAMPLE_KITS: SampleKit[] = [
  {
    id: "studio",
    name: "Studio desk",
    tagline: "A mixing desk made only of library parts, with two knobs and two switches to choose from.",
    shows: ["Library parts", "Versions", "Grab-to-turn knobs"],
    config: studio
  },
  {
    id: "bakelite",
    name: "Bakelite radio",
    tagline: "Glossy brown domes, an ivory chicken-head pointer that holds the light as it turns, ivory keys.",
    shows: ["Shapes", "Material colour", "Hold the light", "Partial kit"],
    config: bakelite
  },
  {
    id: "neon",
    name: "Neon synth",
    tagline: "A dark room where rings and tracks glow brighter as their value rises.",
    shows: ["Dark scene", "Lit by value", "Selected-only lamp"],
    config: neon
  },
  {
    id: "lab",
    name: "Lab instrument",
    tagline: "Spun aluminium, a 21-step scale and snap motion. Not a single custom shape.",
    shows: ["Library parts", "Part options", "Versions"],
    config: lab
  },
  {
    id: "pastel",
    name: "Pastel gadget",
    tagline: "Soft glossy pastels lit from straight above, with a round-thumb switch.",
    shows: ["Shapes", "Custom switch geometry", "Overhead light"],
    config: pastel
  },
  {
    id: "blueprint",
    name: "Blueprint",
    tagline: "Flat line drawing with no lighting at all. Kits don't have to look like hardware.",
    shows: ["Flat marks", "Panel graphics", "No lighting"],
    config: blueprint
  }
];

export function findSample(id: string): SampleKit | undefined {
  return SAMPLE_KITS.find((sample) => sample.id === id);
}
