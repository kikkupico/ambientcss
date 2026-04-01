import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface AmbientPanelProps extends HTMLAttributes<HTMLDivElement> {
  material?: "matte" | "shiny" | "glass";
}

export function AmbientPanel({ className, material = "matte", ...props }: AmbientPanelProps) {
  return (
    <div
      className={cn(
        "ambient amb-surface amb-chamfer amb-elevation-2 ambx-panel",
        material === "matte" ? "amb-mat-matte" : material === "shiny" ? "amb-mat-shiny" : "amb-mat-glass",
        className
      )}
      {...props}
    />
  );
}
