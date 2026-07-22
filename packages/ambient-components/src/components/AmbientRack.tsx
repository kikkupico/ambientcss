import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientRackGap = "tight" | "normal" | "loose";

export interface AmbientRackProps extends HTMLAttributes<HTMLDivElement> {
  /** Clearance between controls: tight for one functional unit/repeated
   * row, normal (default) for a few related controls, loose for
   * separating distinct zones. */
  gap?: AmbientRackGap;
  direction?: "row" | "column";
}

export function AmbientRack({
  className,
  gap = "normal",
  direction = "row",
  ...props
}: AmbientRackProps) {
  return (
    <div
      className={cn(
        "ambx-rack",
        gap === "tight" && "ambx-rack-tight",
        gap === "loose" && "ambx-rack-loose",
        direction === "column" && "ambx-rack-column",
        className
      )}
      {...props}
    />
  );
}
