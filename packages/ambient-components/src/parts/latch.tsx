import type { CSSProperties } from "react";
import { cn } from "../lib/cn";

/** The recess the pill slides in (switch.py: a 1.5mm well, thickness 0.33). */
export function SwitchTrack({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-switch-track amb-groove", className)} />;
}

/** The sliding pill, standing 2.6mm above the recess floor. */
export function SwitchPill({ className }: { className?: string | undefined }) {
  return (
    <span className={cn("amb-switch-pill ambient amb-fillet amb-surface-convex", className)} />
  );
}

/** A pinprick indicator lamp. `color` is any CSS colour; unset it takes the
 *  scene's own lamp colour, the same `--amb-led-color` a bank reads. */
export function Led({
  on = true,
  color,
  className
}: {
  on?: boolean | undefined;
  color?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn("amb-led", !on && "amb-led-off", className)}
      style={color ? ({ "--amb-led-color": color } as CSSProperties) : undefined}
    />
  );
}
