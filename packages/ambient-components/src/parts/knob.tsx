import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useControlState } from "../core/context";
import type { AmbientMaterial } from "../core/material";

/* Straight-knurled silhouette for the rotating face, in objectBoundingBox
   units so the clip scales with the component. It mirrors the grounded
   referent's rib section (ambient3d/referents.py knob(), ribs=36): trapezoid
   teeth between the outer radius and the tooth-root radius. The circular body
   underneath keeps the smooth drop shadow.

   One knurl for now, kept in a table because the shape is a data question and
   the referent lineup already carries broader flutes and a finer 48-rib knurl
   we may expose later — at which point `teeth` grows a second row rather than
   this file changing shape. */
type KnurlSpec = {
  teeth: number; // rib count
  root: number; // tooth-root radius (bounding-box units; outer is 0.5)
  rise: number; // fraction of the pitch spent climbing to the crest
  fall: [number, number]; // crest-end and root-return pitch fractions
};

const KNURLS: Record<"standard", KnurlSpec> = {
  /* 36 ribs — the grounded referent knob */
  standard: { teeth: 36, root: 0.468, rise: 0.12, fall: [0.5, 0.62] }
};

function knurlPath({ teeth, root, rise, fall }: KnurlSpec): string {
  const outer = 0.5;
  const pitch = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    const tooth: Array<[number, number]> = [
      [0, root],
      [rise, outer],
      [fall[0], outer],
      [fall[1], root]
    ];
    for (const [frac, radius] of tooth) {
      const t = a + frac * pitch;
      pts.push(
        `${(0.5 + radius * Math.cos(t)).toFixed(4)} ${(0.5 + radius * Math.sin(t)).toFixed(4)}`
      );
    }
  }
  return `M${pts.join(" L")} Z`;
}

const KNURL_PATH = knurlPath(KNURLS.standard);

/** The knob's body: the smooth circle that carries the drop shadow.
 *
 *  `flush` takes the full width and cuts the referent's base chamfer,
 *  which is what a smooth turned knob wants; the default sits back at the
 *  tooth-root radius so a knurled face can stand proud of it. */
export function KnobBody({
  material,
  flush = false,
  className
}: {
  material?: AmbientMaterial | undefined;
  flush?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "amb-knob-body ambient amb-thickness-2 amb-surface",
        flush && "amb-knob-body-flush",
        material && `amb-mat-${material}`,
        className
      )}
    />
  );
}

/** The rotating knurled face: opaque at the knob's surface colour with
 *  per-tooth flank shading, clipped to the toothed silhouette so the ribs
 *  break the outline instead of being painted inside a circle.
 *
 *  The clip is the part's own business — it generates the path, emits its
 *  own `<defs>` and references it by a local id. A rotary mechanism has no
 *  idea any of this is happening, which is exactly the point: if this part
 *  needed help from the control to exist, the split would not be clean. */
export function KnurledFace({
  material,
  className
}: {
  material?: AmbientMaterial | undefined;
  className?: string | undefined;
}) {
  const id = `amb-knurl-${useId().replace(/:/g, "")}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden focusable={false}>
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={KNURL_PATH} />
          </clipPath>
        </defs>
      </svg>
      <span
        className={cn("amb-knob-face", material && `amb-mat-${material}`, className)}
        style={{ clipPath: `url(#${id})` }}
      />
    </>
  );
}

/** The grounded referent's offset indicator dot (knob() dot_frac 0.12,
 *  dot_offset 0.68). Put it in the `actuator` frame and it sweeps; put it
 *  in `base` and it stays put while everything else turns. */
export function IndicatorDot({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-knob-indicator-circle", className)} />;
}

/** A short radial bar out near the rim, running 0.50R to 0.84R. */
export function IndicatorBar({ className }: { className?: string | undefined }) {
  return <span className={cn("amb-knob-indicator-rectangle", className)} />;
}

export type ScaleRingProps = {
  /** Dots to print. `2` is the pair the travel starts and stops at. */
  count?: number | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
};

/** Printed scale dots on the panel around a rotary, on the same arc the
 *  value sweeps.
 *
 *  This is the part that has to read state as JS rather than CSS: the
 *  angles come from the control's own travel, and there is no way to emit
 *  N children from a stylesheet. It is also the proof that the context
 *  outlet works — the dots land on the sweep whatever `travel` is set to,
 *  without the ring being told. */
export function ScaleRing({ count = 13, className, children }: ScaleRingProps) {
  const { travelStart, travelSweep } = useControlState();
  const divisions = Math.max(1, count - 1);
  const angles =
    count <= 1
      ? [travelStart]
      : Array.from({ length: count }, (_, i) => travelStart + (i / divisions) * travelSweep);

  return (
    <span className={cn("amb-knob-marker-ring", className)} aria-hidden>
      {angles.map((angle) => (
        <span
          key={angle}
          className="amb-knob-marker"
          style={{ "--amb-marker-angle": `${angle}deg` } as CSSProperties}
        />
      ))}
      {children}
    </span>
  );
}
