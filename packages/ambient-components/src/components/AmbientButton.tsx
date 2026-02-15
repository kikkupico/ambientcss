import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AmbientButton({ className, children, ...props }: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn("ambient amb-button amb-chamfer amb-elevation-1 ambx-button amb-heading-3", className)}
      {...props}
    >
      {children}
    </button>
  );
}
