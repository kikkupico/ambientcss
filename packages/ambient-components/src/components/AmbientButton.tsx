import { cn } from "../lib/cn";
import { AmbientPress } from "../controls/AmbientPress";
import type { AmbientPressProps } from "../controls/AmbientPress";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import { groundedKit } from "../kits/grounded";
import type { AmbientMaterial } from "../core/material";

/* Cap silhouettes from the referent lineup (ambient3d/generate.py):
   - "pill":   the default wide stadium key (transport-key style)
   - "round":  a circular key — pair with material="shiny" for the
     machined metal-button look
   - "square": a squarer, flatter pad (EP-133-style, tighter corners,
     lower cap) */
export type AmbientButtonShape = "pill" | "round" | "square";
export type AmbientButtonSize = "sm" | "md" | "lg";

export type AmbientButtonProps = Omit<AmbientPressProps, "parts" | "size"> & {
  material?: AmbientMaterial | undefined;
  shape?: AmbientButtonShape | undefined;
  size?: AmbientButtonSize | undefined;
  /** Look options in the active kit's vocabulary. */
  look?: KitLook | undefined;
};

/** A key cap seated in a clearance well. */
export function AmbientButton({
  className,
  children,
  look,
  material = "matte",
  shape = "pill",
  size = "md",
  ...rest
}: AmbientButtonProps) {
  const { dress } = useDress("press", { material, shape, children, ...look }, groundedKit.press!);
  return (
    <AmbientPress
      {...rest}
      size={size}
      className={cn(dress.className, className)}
      parts={dress.parts}
    />
  );
}
