import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import type { AmbientMaterial } from "../core/material";

export interface AmbientPanelProps extends HTMLAttributes<HTMLDivElement> {
  material?: AmbientMaterial;
}

/** A panel is a plain surface, so it can wear any finish directly: it spends
 *  neither pseudo-element of its own, which is what the two micro-relief
 *  materials need. Their grain paints below the panel's children, and their
 *  `overflow: hidden` clips whatever hangs outside it — a control's drop
 *  shadow at the very edge included. */
export function AmbientPanel({ className, material = "matte", ...props }: AmbientPanelProps) {
  return (
    <div
      className={cn(
        "ambient amb-surface amb-chamfer amb-elevation-2 ambx-panel",
        `amb-mat-${material}`,
        className
      )}
      {...props}
    />
  );
}
