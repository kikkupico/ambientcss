import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

/* Cap silhouettes from the referent lineup (ambient3d/generate.py):
   - "pill":   the default wide stadium key (transport-key style)
   - "round":  a circular key — pair with material="shiny" for the
     machined metal-button look
   - "square": a squarer, flatter pad (EP-133-style, tighter corners,
     lower cap) */
export type AmbientButtonShape = "pill" | "round" | "square";

export interface AmbientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  material?: "matte" | "shiny" | "glass";
  shape?: AmbientButtonShape;
}

export function AmbientButton({
  className,
  children,
  material = "matte",
  shape = "pill",
  ...props
}: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "amb-button amb-groove ambx-button",
        shape === "round" && "amb-button-round",
        shape === "square" && "amb-button-square",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "amb-button-cap ambient amb-chamfer amb-surface amb-heading-3",
          material === "matte" ? "amb-mat-matte" : material === "shiny" ? "amb-mat-shiny" : "amb-mat-glass"
        )}
      >
        {children}
      </span>
    </button>
  );
}
