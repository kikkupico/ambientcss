import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import { isDev } from "./dev";
import type { ControlParts } from "./types";
import type { RotaryInput, RotaryTravel } from "./useRotary";
import type { ControlAnimate } from "./types";

/** The five control families a kit can dress. */
export type ControlFamily = "rotary" | "travel" | "press" | "latch" | "bank";

/** What a preset hands its kit: the look options the caller asked for.
 *
 *  Deliberately loose. Look props are *kit vocabulary* — `knurling` and
 *  `markers` are words the grounded kit made up — so a kit reads the keys it
 *  understands and ignores the rest, exactly as a stylesheet that never
 *  implemented a class simply does not react to it. See `looks` below for
 *  how that stays honest rather than silent. */
export type KitLook = Record<string, unknown>;

/** A dressed control: what goes in the frames, and what the root wears.
 *
 *  The class comes from the kit rather than the preset because it is part of
 *  the look — `.amb-knob` carries the grounded knob's own token table, and a
 *  kit that replaces the parts has no use for it.
 *
 *  `onParts` / `offParts` / `panelParts` exist for the `bank` family only,
 *  where `parts` is reused to mean "every key's frames" rather than "the
 *  control's own frames" (see `AmbientSelect`). A bank whose lit and unlit
 *  keys are the same markup styled through `[data-on]` — the grounded key,
 *  lamp under a diffuser — never needs them: `parts` alone covers both
 *  states, as it always has. They earn their keep only when on and off are
 *  genuinely different markup — a glossy cap swapped in for a matte one
 *  cannot be reached by a CSS selector, since `material` picks a different
 *  class at render time, not a variable. `panelParts` is the rail itself:
 *  the frames around the whole row of keys, painted once, distinct from any
 *  one key's own. */
export type KitDress = {
  parts: ControlParts;
  className?: string | undefined;
  onParts?: ControlParts | undefined;
  offParts?: ControlParts | undefined;
  panelParts?: ControlParts | undefined;
};

/** Presentation defaults a visual identity may legitimately set.
 *
 *  Narrow on purpose: a kit says how its controls should *feel* to turn, not
 *  what they are worth. Anything touching value, range or handlers stays with
 *  the caller. */
export type KitDefaults = {
  rotary?: { travel?: RotaryTravel; input?: RotaryInput; animate?: ControlAnimate } | undefined;
  travel?: { animate?: ControlAnimate } | undefined;
  latch?: { animate?: ControlAnimate } | undefined;
};

export type ControlKit = {
  name: string;
  rotary?: ((look: KitLook) => KitDress) | undefined;
  travel?: ((look: KitLook) => KitDress) | undefined;
  press?: ((look: KitLook) => KitDress) | undefined;
  latch?: ((look: KitLook) => KitDress) | undefined;
  bank?: ((look: KitLook) => KitDress) | undefined;
  defaults?: KitDefaults | undefined;
  /** Look keys each family honours. Used only to warn in development when a
   *  caller passes a prop the active kit is going to drop on the floor —
   *  the one real cost of letting look props pass through untyped. */
  looks?: Partial<Record<ControlFamily, readonly string[]>> | undefined;
};

const KitContext = createContext<ControlKit | null>(null);

/** Dress every control below this point in `kit`.
 *
 *  A kit is a plain object, so shipping one is shipping a module: no
 *  registry, no lifecycle, nothing to initialise. A kit that leaves a family
 *  undefined falls through to the default, which is what a real third-party
 *  kit will do for most of them. */
export function AmbientKitProvider({ kit, children }: PropsWithChildren<{ kit: ControlKit }>) {
  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

export function useKit(): ControlKit | null {
  return useContext(KitContext);
}

const warned = new Set<string>();

/** Resolve a family's dressing: the active kit if it dresses this family,
 *  otherwise the fallback the preset was built around. */
export function useDress<F extends ControlFamily>(
  family: F,
  look: KitLook,
  fallback: (look: KitLook) => KitDress
): { dress: KitDress; defaults: F extends keyof KitDefaults ? KitDefaults[F] : undefined } {
  const kit = useKit();
  const dressed = kit?.[family];

  if (isDev && kit && dressed) {
    const honoured = kit.looks?.[family];
    if (honoured) {
      for (const key of Object.keys(look)) {
        if (look[key] === undefined || honoured.includes(key)) continue;
        const id = `${kit.name}:${family}:${key}`;
        if (warned.has(id)) continue;
        warned.add(id);
        console.warn(
          `[@ambientcss/components] the "${kit.name}" kit's ${family} does not use ` +
            `\`${key}\` — it is a look prop from another kit's vocabulary, so it will ` +
            `have no effect here.`
        );
      }
    }
  }

  return {
    dress: (dressed ?? fallback)(look),
    /* Defaults come from the kit that actually dressed the control: a kit
       that falls through to grounded for a family has no say in how that
       family behaves either. */
    defaults: (dressed ? kit?.defaults?.[family as keyof KitDefaults] : undefined) as never
  };
}
