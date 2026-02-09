import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AmbientButton({ className, children, ...props }: AmbientButtonProps) {
  return (
    <button
      type="button"
      className={cn("ambient amb-button amb-fillet amb-elevation-1 ambx-button", className)}
      {...props}
    >
      {children}
    </button>
  );
}
