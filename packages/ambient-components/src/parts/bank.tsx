import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useBankKey } from "../core/context";

/** The lamp under a key: a big disc lying on the pocket floor.
 *
 *  It has to paint BEFORE the cap, because the cap's `backdrop-filter` is
 *  what diffuses it — which is the whole trick, and the reason the lens
 *  belongs in the `base` frame and the cap in `actuator`. */
export function KeyLens({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-select-lens", className)} />;
}

/** The translucent diffuser over the lamp, carrying the key's legend.
 *
 *  With no children it prints the option's own label, which is why a bank
 *  of numerals needs no `renderKey`: the part reads the option it belongs
 *  to out of the key context. */
export function KeyCap({
  className,
  children
}: {
  className?: string | undefined;
  children?: ReactNode | undefined;
}) {
  const { option } = useBankKey();
  return (
    <span className={cn("amb-select-cap ambient amb-chamfer amb-mat-glass", className)}>
      {children ?? option.label ?? option.value}
    </span>
  );
}
