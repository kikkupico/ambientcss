import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { AmbientMaterial } from "../core/material";
import { isRelief } from "../core/material";

/** The key cap: a chamfered, subtly dished top that sinks on `:active`.
 *
 *  The cap is what sizes a press control — its legend sets the width above
 *  the well's `min-width` — which is why a press control's frames are
 *  `display: contents` markers rather than boxes.
 *
 *  The cap spends its own `::after` on the dish, so the two micro-relief
 *  materials cannot ride on it: their grain wants both pseudo-elements, and
 *  the dish's `background` shorthand and the grain's tile would each silently
 *  win half of the other's declarations. They get `.ambx-cap-face` instead —
 *  an inner layer under the dish and under the legend, which is the inner
 *  layer @ambientcss/css's own note prescribes. The cap itself stays a plain
 *  `amb-surface` when relief is down there: the dish's overlay alphas are
 *  derived from `--amb-shade` the ordinary way, and since the relief
 *  materials carry no `--amb-albedo` of their own any more, that derivation
 *  is already correct for them too — no per-material tone correction to
 *  apply. */
export function ButtonCap({
  material = "matte",
  className,
  children
}: {
  material?: AmbientMaterial | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
}) {
  const relief = isRelief(material);
  return (
    <span
      className={cn(
        "amb-button-cap ambient amb-chamfer amb-surface amb-heading-3",
        relief ? undefined : `amb-mat-${material}`,
        className
      )}
    >
      {relief ? (
        <span
          /* `ambient amb-chamfer` on the face, not just on the cap: the
             chamfer is painted as INSET shadows, which belong to the cap's
             own background layer — and the face, being opaque and covering
             it, would hide them. Wearing the cut itself puts the bevel back,
             and puts it back in the material's own tone rather than the
             cap's. */
          className={cn("ambx-cap-face ambient amb-chamfer amb-surface", `amb-mat-${material}`)}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
