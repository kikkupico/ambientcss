import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface AmbientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  material?: "matte" | "shiny" | "glass";
}

export function AmbientButton({ className, children, material = "matte", ...props }: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "ambient amb-button amb-chamfer amb-elevation-1 ambx-button amb-heading-3",
        material === "matte" ? "amb-mat-matte" : material === "shiny" ? "amb-mat-shiny" : "amb-mat-glass",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
