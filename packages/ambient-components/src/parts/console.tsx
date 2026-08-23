import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useBankKey } from "../core/context";

/* Parts for the `console` kit — a mixer-desk visual language, measured off
   photographs of the real controls. Nothing here is a variant of a grounded
   part: a bar knob and a lit pill track are a different vocabulary, which is
   the reason kits exist rather than another round of boolean props. */

/** The knob's base: a flat face housed in a circular groove.
 *
 *  Two elements, because they are two pieces of the panel: the groove is the
 *  cut, and the face is the flat disc sitting in it, showing the ring of the
 *  cut around itself. Neither carries `.ambient` — the face has no body, so
 *  there is no edge to cut and nothing to cast, and every cue that reads as
 *  depth here belongs either to the walls of the housing or to the bar
 *  standing on the face.
 *
 *  It sits in the `base` frame, so it does not turn. A plain disc looks the
 *  same at every angle, and leaving it still keeps the scene's light on it
 *  untouched — only the bar has to do the work below. */
export function ConsoleWell({ className }: { className?: string | undefined }) {
  return (
    <span className={cn("amb-console-housing amb-groove", className)}>
      <span className="amb-console-face amb-surface" />
    </span>
  );
}

/** The actuator: a cuboid bar lying across the disc on its diameter.
 *
 *  Two spans, and the nesting is load-bearing. The bar rides the rotating
 *  actuator frame, so a chamfer highlight painted from the inherited light
 *  would turn with it and put the lit edge on the wrong side of the screen
 *  at half the angles. The fix is to rotate the LIGHT the other way: the
 *  outer span captures the scene's light vector, the inner one re-states it
 *  in the frame's own turned coordinates, so the bright edge and the drop
 *  shadow both stay put on screen while the bar sweeps under them.
 *
 *  It has to be two elements because a custom property cannot read itself —
 *  `--amb-light-x: calc(var(--amb-light-x) ...)` is a cycle, which resolves
 *  to invalid at computed-value time and takes the whole `box-shadow`
 *  composite down with it, silently. */
export function ConsoleBar({ className }: { className?: string | undefined }) {
  return (
    <span className={cn("amb-console-bar", className)}>
      <span className="amb-console-bar-body ambient amb-surface amb-chamfer amb-thickness-2">
        {/* Printed on the bar near one end, the way the reference prints a
            short black mark at the outer edge of its pointer: with a bar
            that crosses the whole face, this is what says which end reads. */}
        <span className="amb-console-indicator" />
      </span>
    </span>
  );
}

/** Panel graphics around the knob: the centre mark above it, and the
 *  −/+ legends at the ends of the travel. Both sit outside the knob's own
 *  box, which is what the `panel` frame is for. */
export function ConsoleMarks({
  mark = true,
  legend = true,
  className
}: {
  mark?: boolean | undefined;
  legend?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <span className={cn("amb-console-marks", className)} aria-hidden>
      {mark ? <span className="amb-console-mark amb-surface" /> : null}
      {legend ? (
        <>
          <span className="amb-console-legend amb-console-legend-min">−</span>
          <span className="amb-console-legend amb-console-legend-max">+</span>
        </>
      ) : null}
    </span>
  );
}

/** The toggle's track: a pill groove that fills with the accent as the
 *  switch travels.
 *
 *  A pure-CSS part — it reads `--ambx-percent` off the control root and
 *  mixes its own colour from it, so the mechanism does not know this element
 *  exists and no React state reaches it. */
export function ToggleTrack({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-console-track amb-groove", className)} />;
}

/** The travelling thumb: an albedo disc inside a light ring.
 *
 *  Flat on top and deliberately so — no chamfer, no fillet — but still a
 *  knob-scale body, so it casts. That pairing is why the classes are spelt
 *  out rather than reached through `.amb-fillet-2`: the edge treatments set
 *  a thickness of their own, and here the thickness is wanted without the
 *  cut that usually comes with it. It wears `amb-surface`, so its colour IS
 *  the scene's albedo under the current light rather than a fixed paint —
 *  it re-shades when the lamp moves or the intensities change. */
export function ToggleThumb({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-console-thumb ambient amb-surface amb-thickness-2", className)} />;
}

/** The bank key: a squared cast face with the desk's own moulded circle sunk
 *  into the middle of it — the referent's tooling mark, present on every
 *  key regardless of selection — and one of two readings for the selected
 *  key, chosen by whether the option carries a text legend:
 *
 *  - No legend (the default): a small LED at the centre that lights only
 *    on the selected one, and no printed text.
 *  - A legend: the LED is left out and the text itself changes colour,
 *    from the panel's ink to the bank's lamp colour — the engraved-and-filled
 *    legend on the referent's longer keys.
 *
 *  Selection is doubly read either way: the lamp or the lit legend, and the
 *  face itself sitting flush — the SAME markup in both states, styled
 *  through `[data-on]` in `.amb-console-bank` (styles.css): off stands at
 *  the desk's own knob-scale thickness, the body ConsoleBar and ToggleThumb
 *  both stand at; on drops to zero, the flattest the `.ambient` composite
 *  goes, reading as a button held all the way in. */
export function ConsoleKey({
  className,
  children
}: {
  className?: string | undefined;
  children?: ReactNode | undefined;
}) {
  const { option } = useBankKey();
  /* An empty-string label is no legend — some callers pass "" to keep the
     value from printing, and a blank legend must not put the LED out. */
  const legend = children ?? (option.label || undefined);
  return (
    <span
      className={cn(
        "amb-console-key ambient amb-surface amb-chamfer amb-heading-3",
        legend != null && "amb-console-key-text",
        className
      )}
    >
      <span className="amb-console-key-dish amb-surface-concave" aria-hidden />
      {legend == null && <span className="amb-console-key-led" aria-hidden />}
      {legend}
    </span>
  );
}
