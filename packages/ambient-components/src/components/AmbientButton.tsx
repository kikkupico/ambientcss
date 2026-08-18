import { cn } from "../lib/cn";
import { AmbientPress } from "../controls/AmbientPress";
import type { AmbientPressProps } from "../controls/AmbientPress";
import type { AmbientMaterial } from "../core/material";
import { ButtonCap } from "../parts/press";

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
};

/** A key cap seated in a clearance well. */
export function AmbientButton({
  className,
  children,
  material = "matte",
  shape = "pill",
  size = "md",
  ...rest
}: AmbientButtonProps) {
  return (
    <AmbientPress
      {...rest}
      size={size}
      className={cn(
        "amb-button amb-groove",
        shape === "round" && "amb-button-round",
        shape === "square" && "amb-button-square",
        className
      )}
      parts={{ actuator: <ButtonCap material={material}>{children}</ButtonCap> }}
    />
  );
}
