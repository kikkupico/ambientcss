import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface AmbientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  material?: "matte" | "shiny" | "glass";
}

export function AmbientButton({ className, children, material = "matte", ...props }: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn("amb-button amb-groove ambx-button", className)}
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
