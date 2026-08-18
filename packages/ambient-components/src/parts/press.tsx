import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { AmbientMaterial } from "../core/material";

/** The key cap: a chamfered, subtly dished top that sinks on `:active`.
 *
 *  The cap is what sizes a press control — its legend sets the width above
 *  the well's `min-width` — which is why a press control's frames are
 *  `display: contents` markers rather than boxes. */
export function ButtonCap({
  material = "matte",
  className,
  children
}: {
  material?: AmbientMaterial | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <span
      className={cn(
        "amb-button-cap ambient amb-chamfer amb-surface amb-heading-3",
        `amb-mat-${material}`,
        className
      )}
    >
      {children}
    </span>
  );
}
