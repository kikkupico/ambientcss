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
 *    cockpit    versions everywhere: a selector knob with printed positions
 *               and a trim knob, a toggle and a guarded toggle, annunciator
 *               buttons in three colours
 *    arcade     a dark room and glossy shapes: buttons in four colours, a
 *               trackball, a ball-top joystick, keys that light when chosen
 *    lab        nothing but library parts and their options, re-chosen
 *    glass      Apple-style: graphite and white, frosted panes over soft
 *               light, filled / tinted / plain buttons
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

/* ── Cockpit ──────────────────────────────────────────────────────────── */

const GUNMETAL = "#202326";

/** A label printed on the panel at an angle around the knob, on its own
 *  sweep: 0° is straight up, and the 270° pot runs from -135° to +135°. */
function dialLabel(text: string, angle: number, radius = 72) {
  const rad = (angle * Math.PI) / 180;
  return shape("panel", `pos-${text.toLowerCase()}`, {
    box: {
      place: "centre",
      x: Math.round(radius * Math.sin(rad) * 10) / 10,
      y: Math.round(-radius * Math.cos(rad) * 10) / 10
    },
    paint: { structure: "plain", surface: "none", edge: "none", fill: "label" },
    content: "text",
    text,
    textSize: 0.13
  });
}

/** An annunciator: a lit square lens carrying the button's own label. */
function lamp(colour: string): KitElement[] {
  return [
    shape("actuator", "lens", {
      box: { place: "flow", width: 13, height: 7, radius: "inherit" },
      paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 0.8, material: "shiny", fill: "albedo", colour },
      content: "legend",
      textSize: 0.17
    })
  ];
}

/** A chrome bat in a dark slot — the toggle every cockpit has. */
function toggleElements(): KitElement[] {
  return [
    shape("base", "slot", {
      box: { place: "fill", inset: 0, radius: "pill" },
      paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.5, fill: "lume" }
    }),
    shape("actuator", "bat", {
      box: { place: "fill", inset: 6, radius: "circle" },
      paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1.4, material: "brushed-round", fill: "albedo", colour: "#d9dde1" }
    })
  ];
}

/* Mission hardware. A selector knob with its positions printed round it, a
   trim knob for fine work, a throttle, a mode bank with annunciator lamps,
   and two versions of the switch — the second with a red guard either side,
   because some switches should take two moves to throw. The push buttons
   come in three colours, one version each. */
const cockpit = kit({
  name: "cockpit",
  rotary: {
    ...drawn(
      [
        dialLabel("OFF", -135),
        dialLabel("1", -67.5),
        dialLabel("2", 0),
        dialLabel("3", 67.5),
        dialLabel("4", 135),
        /* A spun-metal skirt under a black head: the classic selector. */
        shape("base", "skirt", {
          box: { place: "fill", inset: 4, radius: "circle" },
          paint: { structure: "body", surface: "flat", edge: "chamfer-2", thickness: 1.2, material: "brushed-round", fill: "albedo", colour: "#c4c8cc" }
        }),
        /* A chicken-head pointer: a long bar across the knob that keeps its
           lit edge where the lamp is as it turns. */
        shape("actuator", "head", {
          box: { place: "centre", width: 34, height: 96, radius: "pill" },
          paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 2, elevation: 0, material: "matte", fill: "albedo", colour: "#141618" },
          steadyLight: true
        }),
        shape("actuator", "line", {
          box: { place: "centre", width: 5, height: 36, y: -27, radius: "pill" },
          paint: { ...FLAT, fill: "colour", colour: "#f2f2ec" }
        })
      ],
      "amb-knob"
    ),
    variantName: "selector",
    root: { clearanceTop: 30, clearanceSides: 36 },
    variants: [
      version("trim", {
        seed: "grounded",
        rootClass: "amb-knob",
        elements: [
          part("base", "KnobBody", { material: "blasted" }),
          part("actuator", "KnurledFace", { material: "matte", color: GUNMETAL }),
          part("actuator", "IndicatorBar")
        ],
        root: { clearanceTop: 0, clearanceSides: 0 }
      })
    ],
    animate: "snap"
  },
  travel: {
    ...drawn(
      [
        shape("base", "slot", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.7, fill: "lume" }
        }),
        shape("actuator", "handle", {
          box: { place: "fill", inset: 0, radius: "soft", softness: 12 },
          paint: { structure: "body", surface: "flat", edge: "chamfer-2", thickness: 1.6, material: "matte", fill: "albedo", colour: GUNMETAL }
        }),
        ...[-18, 0, 18].map((y, i) =>
          shape("actuator", `grip-${i + 1}`, {
            box: { place: "centre", width: 62, height: 5, y, radius: "pill" },
            paint: { ...FLAT, fill: "colour", colour: "#8d949b" }
          })
        )
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: {
    ...drawn(lamp("#e8322f"), "amb-button"),
    variantName: "master",
    variants: [
      version("caution", { seed: "empty", rootClass: "amb-button", elements: lamp("#ffb000") }),
      version("go", { seed: "empty", rootClass: "amb-button", elements: lamp("#2fcf68") })
    ]
  },
  latch: {
    ...drawn(toggleElements(), "amb-switch"),
    variantName: "toggle",
    /* A round bat needs a square thumb box, which no library class gives. */
    root: { on: true, trackW: 12, trackH: 6, thumbW: 0.42, thumbH: 0.84, inset: 0.08 },
    variants: [
      version("guarded", {
        seed: "empty",
        rootClass: "amb-switch",
        root: { on: true, trackW: 12, trackH: 6, thumbW: 0.42, thumbH: 0.84, inset: 0.08 },
        elements: [
          ...(["outside-left", "outside-right"] as const).map((anchor, i) =>
            shape("panel", i === 0 ? "guard-left" : "guard-right", {
              box: { place: "edge", anchor, y: 6, width: 14, height: 150, radius: "pill" },
              paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1.2, material: "shiny", fill: "albedo", colour: "#c8102e" }
            })
          ),
          ...toggleElements()
        ]
      })
    ]
  },
  /* A mode bank whose selected key lights its annunciator strip amber; the
     others show the strip dark. Two markups, one per state. */
  bank: drawn(
    [
      shape("actuator", "key", {
        box: { place: "fill", inset: 0, radius: "inherit" },
        paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 0.8, fill: "albedo", colour: "#2a2e33" }
      }),
      {
        ...shape("fixture", "lamp-lit", {
          box: { place: "centre", width: 64, height: 20, radius: "soft", softness: 2 },
          paint: { ...FLAT, fill: "accent" }
        }),
        bankState: "on"
      },
      {
        ...shape("fixture", "lamp-dark", {
          box: { place: "centre", width: 64, height: 20, radius: "soft", softness: 2 },
          paint: { ...FLAT, fill: "colour", colour: "#45402c" }
        }),
        bankState: "off"
      }
    ],
    "amb-select amb-groove"
  ),
  /* A bright cockpit, not a dark one: the panel is dark because it is
     painted dark, so the lamp still throws real shadows and the recesses
     stay black. The print is white, as instrument panels are. */
  theme: {
    lightX: -0.5,
    lightY: -1,
    keyLight: 0.82,
    fillLight: 0.62,
    lightHue: 210,
    lightSaturation: 6,
    lumeHue: 40,
    highlightColor: "#ffb000",
    accent: "#ffb000",
    label: "#ecebe4"
  },
  panel: { material: "blasted", albedo: "#3b4045" }
});

/* ── Arcade cabinet ───────────────────────────────────────────────────── */

const ARCADE_RED = "#e2262f";

/** A domed arcade button: a black bezel, a glossy plunger in `colour`, and
 *  the caller's label printed small across it. */
function arcadeButton(colour: string): KitElement[] {
  return [
    shape("base", "bezel", {
      box: { place: "fill", inset: 0, radius: "circle" },
      paint: { structure: "body", surface: "flat", edge: "chamfer", thickness: 0.6, material: "shiny", fill: "albedo", colour: "#141418" }
    }),
    shape("actuator", "plunger", {
      box: { place: "fill", inset: 15, radius: "circle" },
      paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 1.4, material: "shiny", fill: "albedo", colour }
    }),
    shape("fixture", "legend", {
      box: { place: "centre" },
      paint: { ...FLAT, fill: "colour", colour: "#ffffff" },
      content: "legend",
      textSize: 0.17
    })
  ];
}

/* After hours in an arcade: a trackball (or a spinner, its other version),
   a ball-top joystick riding the fader slot, a bank whose chosen key lights
   up yellow, and the buttons in four colours — one version each, so a
   cabinet can wire up `<AmbientButton variant="blue">`. */
const arcade = kit({
  name: "arcade",
  rotary: {
    ...drawn(
      [
        shape("base", "cup", {
          box: { place: "fill", inset: 0, radius: "circle" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.45, fill: "lume" }
        }),
        shape("base", "ball", {
          box: { place: "fill", inset: 7, radius: "circle" },
          paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 2, material: "shiny", fill: "albedo", colour: ARCADE_RED }
        }),
        /* The ball itself stays put — its shine is the room's — and a white
           fleck turns with the value, which is how a trackball reads. */
        shape("actuator", "fleck", {
          box: { place: "centre", width: 10, height: 10, y: -27, radius: "circle" },
          paint: { ...FLAT, fill: "colour", colour: "#fff3f0" }
        })
      ],
      "amb-knob"
    ),
    variantName: "trackball",
    root: { clearanceTop: 0, clearanceSides: 0 },
    variants: [
      version("spinner", {
        seed: "grounded",
        rootClass: "amb-knob",
        elements: [
          part("base", "KnobBody", { material: "shiny" }),
          part("actuator", "KnurledFace", { material: "shiny", color: "#18181c" }),
          part("actuator", "IndicatorDot")
        ],
        root: { clearanceTop: 0, clearanceSides: 0 }
      })
    ],
    input: "delta"
  },
  travel: {
    ...drawn(
      [
        shape("base", "slot", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.6, fill: "lume" }
        }),
        /* On the fader, a ball-top joystick: a stem with the ball above it.
           The slider gets just the ball. */
        {
          ...shape("actuator", "stem", {
            box: { place: "centre", width: 26, height: 56, y: 20, radius: "pill" },
            paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 0.8, material: "shiny", fill: "albedo", colour: "#1c1c20" }
          }),
          only: "vertical"
        },
        {
          ...shape("actuator", "ball", {
            box: { place: "centre", width: 100, height: 66.7, y: -12, radius: "circle" },
            paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 2, material: "shiny", fill: "albedo", colour: ARCADE_RED }
          }),
          only: "vertical"
        },
        {
          ...shape("actuator", "ball-h", {
            box: { place: "fill", inset: 0, radius: "circle" },
            paint: { structure: "body", surface: "convex", edge: "fillet-2", thickness: 2, material: "shiny", fill: "albedo", colour: ARCADE_RED }
          }),
          only: "horizontal"
        }
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: {
    ...drawn(arcadeButton(ARCADE_RED), "amb-button amb-button-round"),
    variantName: "red",
    variants: [
      version("yellow", { seed: "empty", rootClass: "amb-button amb-button-round", elements: arcadeButton("#ffcf1a") }),
      version("green", { seed: "empty", rootClass: "amb-button amb-button-round", elements: arcadeButton("#1fc35a") }),
      version("blue", { seed: "empty", rootClass: "amb-button amb-button-round", elements: arcadeButton("#1f7bff") })
    ]
  },
  latch: drawn(
    [
      shape("base", "track", {
        box: { place: "fill", inset: 0, radius: "pill" },
        paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.4, fill: "accent-travel", transition: true }
      }),
      shape("actuator", "cap", {
        box: { place: "fill", inset: 0, radius: "pill" },
        paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 1.2, material: "shiny", fill: "albedo", colour: "#18181c" }
      })
    ],
    "amb-switch"
  ),
  bank: drawn(
    [
      {
        ...shape("actuator", "key", {
          box: { place: "fill", inset: 0, radius: "inherit" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 0.9, material: "shiny", fill: "albedo", colour: "#2a2a32" }
        }),
        bankState: "off"
      },
      {
        ...shape("actuator", "key-lit", {
          box: { place: "fill", inset: 0, radius: "inherit" },
          paint: { structure: "body", surface: "convex", edge: "fillet", thickness: 0.4, material: "shiny", fill: "albedo", colour: "#ffcf1a" }
        }),
        bankState: "on"
      }
    ],
    /* The one sample whose bank glows: a lit arcade key should. */
    "amb-select amb-select-glow amb-groove"
  ),
  /* Glossy black laminate under a cool overhead, with a violet cast. */
  theme: {
    lightX: -0.4,
    lightY: -1,
    keyLight: 0.78,
    fillLight: 0.6,
    lightHue: 265,
    lightSaturation: 26,
    lumeHue: 280,
    highlightColor: "#ffcf1a",
    accent: "#ffcf1a",
    label: "#d9d3ff"
  },
  panel: { material: "shiny", albedo: "#17141f" }
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

/* ── Glass ────────────────────────────────────────────────────────────── */

/* Apple-style glass: graphite, white and frosted panes, nothing coloured.
   The accent is an off-white, so everything "lit by value" glows white —
   light under glass rather than a hue. */
const SNOW = "#f5f5f7";

/** A frosted pane. Glass makes its own milky face over whatever is behind
 *  it, so it wears no surface colour; and it only frosts what sits at a
 *  distance, so it floats — the elevation is what turns the light under it
 *  into a soft lit pane rather than a sharp blob. */
const PANE = {
  structure: "body",
  surface: "none",
  edge: "chamfer",
  thickness: 1,
  elevation: 1.6,
  material: "glass",
  fill: "none"
} as const;

/** A pill button: a glass pane over a light, or bare glass. The light's
 *  strength is the whole difference between Apple's filled, tinted and
 *  plain styles. */
function glassButton(light: string | null, ink?: string): KitElement[] {
  return [
    ...(light
      ? [
          shape("base", "light", {
            box: { place: "fill", inset: 8, radius: "pill" },
            paint: { ...FLAT, fill: "colour", colour: light }
          })
        ]
      : []),
    shape("actuator", "pane", {
      box: { place: "flow", width: 15, height: 7, radius: "inherit" },
      /* "label" colours the legend: a <button> does not inherit text
         colour, so without it the browser's own black shows through. */
      paint: { ...PANE, elevation: 1.2, ...(ink ? { fill: "colour", colour: ink } : { fill: "label" }) },
      content: "legend",
      textSize: 0.19
    })
  ];
}

const glass = kit({
  name: "glass",
  rotary: {
    ...drawn(
      [
        /* White light under the dial, rising with the value. */
        /* A core rather than a floodlight: the rim stays dark glass, so
           the dial keeps its depth as the light comes up. */
        shape("base", "aura", {
          box: { place: "fill", inset: 22, radius: "circle" },
          paint: { ...FLAT, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "lens", {
          box: { place: "fill", inset: 0, radius: "circle" },
          paint: PANE,
          steadyLight: true
        }),
        shape("actuator", "tick", {
          box: { place: "centre", width: 6, height: 16, y: -31, radius: "pill" },
          paint: { ...FLAT, fill: "colour", colour: "#ffffff" }
        })
      ],
      "amb-knob"
    ),
    root: { clearanceTop: 0, clearanceSides: 0 }
  },
  travel: {
    ...drawn(
      [
        shape("base", "rail", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.25, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "pane", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: PANE
        })
      ],
      "amb-fader"
    ),
    rootClassH: "amb-slider"
  },
  press: {
    /* Filled is bright glass, so its legend is dark ink, as Apple's is. */
    ...drawn(glassButton("#e5e5ea", "#1d1d1f"), "amb-button"),
    variantName: "filled",
    variants: [
      version("tinted", { seed: "empty", rootClass: "amb-button", elements: glassButton("#6e6e73") }),
      version("plain", { seed: "empty", rootClass: "amb-button", elements: glassButton(null) })
    ]
  },
  /* The iOS switch: a solid white thumb with a soft shadow, over a track
     that goes from graphite to light as it turns on. A round thumb in a
     short track is geometry no library class gives. */
  latch: {
    ...drawn(
      [
        shape("base", "track", {
          box: { place: "fill", inset: 0, radius: "pill" },
          paint: { structure: "groove", surface: "none", edge: "none", thickness: 0.3, fill: "accent-travel", transition: true }
        }),
        shape("actuator", "thumb", {
          box: { place: "fill", inset: 0, radius: "circle" },
          /* A hairline edge keeps the thumb legible on a lit track. */
          paint: { structure: "body", surface: "flat", edge: "fillet", thickness: 1, elevation: 0.4, material: "matte", fill: "albedo", colour: "#ffffff", ring: 2, ringColour: "#c7c7cc" }
        })
      ],
      "amb-switch"
    ),
    root: { on: true, trackW: 12.5, trackH: 7, thumbW: 0.43, thumbH: 0.84, inset: 0.08 }
  },
  /* A segmented control: a dark rail, and only the chosen segment is a
     raised glass pill with light under it. No glow onto the rail — Apple
     does not spill light. */
  bank: drawn(
    [
      {
        ...shape("base", "light", {
          box: { place: "fill", inset: 14, radius: "pill" },
          paint: { ...FLAT, fill: "colour", colour: "#8e8e93" }
        }),
        bankState: "on"
      },
      {
        ...shape("actuator", "pane", {
          box: { place: "fill", inset: 6, radius: "inherit" },
          paint: { ...PANE, elevation: 0.8 }
        }),
        bankState: "on"
      }
    ],
    "amb-select"
  ),
  theme: {
    lightX: 0,
    lightY: -1,
    keyLight: 0.86,
    fillLight: 0.7,
    lightHue: 230,
    lightSaturation: 4,
    lumeHue: 230,
    highlightColor: SNOW,
    accent: SNOW,
    label: "#d1d1d6"
  },
  panel: { material: "matte", albedo: "#1d1d20" }
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
        box: { place: "flow", width: 13, height: 6, radius: "inherit" },
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
        box: { place: "fill", inset: 0, radius: "inherit" },
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
    id: "cockpit",
    name: "Cockpit",
    tagline: "A chicken-head selector with its positions printed round it, a guarded toggle, and annunciator buttons in three colours.",
    shows: ["Versions", "Panel graphics", "Hold the light", "State-only lamps"],
    config: cockpit
  },
  {
    id: "arcade",
    name: "Arcade cabinet",
    tagline: "Domed buttons in four colours, a trackball, a ball-top joystick, and keys that light up when chosen.",
    shows: ["Versions", "Dark scene", "Glossy shapes", "Lit by value"],
    config: arcade
  },
  {
    id: "lab",
    name: "Lab instrument",
    tagline: "Spun aluminium, a 21-step scale and snap motion. Not a single custom shape.",
    shows: ["Library parts", "Part options", "Versions"],
    config: lab
  },
  {
    id: "glass",
    name: "Glass",
    tagline: "Apple-style glass in graphite and white: frosted panes over soft light, an iOS switch, a segmented control.",
    shows: ["Glass material", "Lit by value", "Versions", "Neutral palette"],
    config: glass
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
