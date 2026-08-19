import { cn } from "../lib/cn";
import { AmbientRotary } from "../controls/AmbientRotary";
import type { AmbientRotaryProps } from "../controls/AmbientRotary";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import type { AmbientMaterial } from "../core/material";
import { groundedKit } from "../kits/grounded";

/** Printed scale dots on the panel around the knob: the arc's two ends, the
 *  full graduated ring, or nothing. */
export type AmbientKnobMarkers = "none" | "ends" | "full";

/** The pointer riding the rotating face: a radial bar or an offset dot. */
export type AmbientKnobIndicator = "rectangle" | "circle";

export type AmbientKnobSize = "sm" | "md" | "lg";

export type AmbientKnobProps = Omit<AmbientRotaryProps, "parts" | "size"> & {
  material?: AmbientMaterial | undefined;
  /** Ribbed grip around the rotating body. Off gives a smooth turned body. */
  knurling?: boolean | undefined;
  markers?: AmbientKnobMarkers | undefined;
  indicator?: AmbientKnobIndicator | undefined;
  size?: AmbientKnobSize | undefined;
  /** Look options in another kit's vocabulary.
   *
   *  The four props above are the *grounded* kit's words. A kit that dresses
   *  knobs differently has its own, and they arrive here rather than as
   *  loose props so the common path stays typed and a misspelt `knurling`
   *  is still a compile error. Kits usually ship a preset of their own that
   *  types this properly — see `ConsoleKnob`. */
  look?: KitLook | undefined;
};

/**
 * The rotary preset: `AmbientRotary` wearing whatever the active kit says a
 * knob looks like, and the grounded hardware knob when no kit is set.
 */
export function AmbientKnob({
  material,
  knurling,
  markers,
  indicator,
  look,
  size = "md",
  className,
  travel,
  input,
  animate,
  ...rest
}: AmbientKnobProps) {
  const { dress, defaults } = useDress(
    "rotary",
    { material, knurling, markers, indicator, ...look },
    groundedKit.rotary!
  );

  return (
    <AmbientRotary
      {...rest}
      /* Caller wins over kit, kit wins over the mechanism's own default. */
      travel={travel ?? defaults?.travel}
      input={input ?? defaults?.input}
      animate={animate ?? defaults?.animate}
      size={size}
      className={cn(dress.className, className)}
      parts={dress.parts}
    />
  );
}
