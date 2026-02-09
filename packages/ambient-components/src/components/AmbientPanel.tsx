import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientPanelProps = HTMLAttributes<HTMLDivElement>;

export function AmbientPanel({ className, ...props }: AmbientPanelProps) {
  return <div className={cn("ambient amb-surface amb-fillet amb-elevation-2 ambx-panel", className)} {...props} />;
}
