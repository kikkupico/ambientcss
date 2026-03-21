import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface AmbientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  thickness?: 0 | 1 | 2;
}

export function AmbientButton({ className, thickness = 1, children, ...props }: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "ambient amb-button amb-chamfer amb-elevation-1 ambx-button amb-heading-3",
        thickness > 0 && `amb-thickness-${thickness}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
