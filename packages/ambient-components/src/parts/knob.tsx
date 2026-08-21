import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";
import { useControlState } from "../core/context";
import type { AmbientMaterial } from "../core/material";

/* The knurl: a rim band of straight ribs around the knob's cap, in
   objectBoundingBox units so the clip scales with the component.

   The knob it belongs to reads like the turned-and-knurled hardware knob it
   is named for: a smooth chamfered cap on top, and beyond that cap's edge —
   and a step below it — a ring of knurling standing proud of the outline.
   So the clip is an ANNULUS, not a disc: a rippled outer contour punched
   through by a circle at the cap's radius, filled `evenodd`, which leaves
   the cap and its chamfer bands to paint themselves underneath.

   The rib section is the referent's (ambient3d/components/knob.py `wall_r`):
   radius falls from the crest by `depth * (0.5 + 0.5cos(N.theta))^sharpness`,
   so ridges are broad and grooves narrow. Sampling that curve beats the old
   four-point trapezoid — at 36 teeth a square wave silhouette reads as gear
   teeth, which is what this replaces.

   One knurl for now, kept in a table because the shape is a data question and
   the referent lineup carries broader flutes (14 ribs) we may expose later.
   A second row is not free, though: `teeth` is shadowed by the conic pitch in
   .amb-knob-face (360/teeth) and `band` by that rule's radial stop, so a knurl
   with different numbers needs its shading parameterised out of the stylesheet
   first. Only `depth` and `sharpness` live here alone. */
type KnurlSpec = {
  teeth: number; // rib count
  depth: number; // crest-to-root, bounding-box units (the crest is at 0.5)
  sharpness: number; // >1 narrows the groove and broadens the ridge
  band: number; // rim width the ribs occupy, bounding-box units
};

const KNURLS: Record<"standard", KnurlSpec> = {
  /* 48 ribs — the referent lineup's fine knurl (referents.py knob_cap /
     knob_wheel) rather than the 36 of its coarse one, because a band a tenth
     of the radius wide reads as a machined grip only if the ribs are finer
     than it is; at 36 the same band came out a bottle cap. */
  standard: { teeth: 48, depth: 0.009, sharpness: 1.6, band: 0.05 }
};

/** The cap's inset: the knurl band's width, so the ribs stand proud of it.
 *  One number, two views of the same edge — the clip's inner radius and the
 *  body's inset have to agree or the ring floats off its cap. */
const KNURL_BAND = KNURLS.standard.band;

/* The clip's hole is a hair tighter than the cap so their antialiased edges
   overlap instead of leaving a hairline of panel between them. */
const SEAM = 0.005;

/* Samples per tooth. The curve's extremes both land on samples: the groove
   at the tooth's start, the ridge at its half-pitch. */
const STEPS = 6;

function knurlPath({ teeth, depth, sharpness, band }: KnurlSpec): string {
  const outer = 0.5;
  const inner = outer - band - SEAM;
  const segs = teeth * STEPS;
  const pts: string[] = [];
  for (let i = 0; i < segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const r = outer - depth * (0.5 + 0.5 * Math.cos(teeth * t)) ** sharpness;
    pts.push(
      `${(0.5 + r * Math.cos(t)).toFixed(4)} ${(0.5 + r * Math.sin(t)).toFixed(4)}`
    );
  }
  /* Second subpath: the cap-sized hole, two half arcs. Winding is irrelevant —
     the clip fills evenodd. */
  const l = (0.5 - inner).toFixed(4);
  const r = (0.5 + inner).toFixed(4);
  const hole = `M${l} 0.5 A${inner} ${inner} 0 0 0 ${r} 0.5 A${inner} ${inner} 0 0 0 ${l} 0.5 Z`;
  return `M${pts.join(" L")} Z ${hole}`;
}

const KNURL_PATH = knurlPath(KNURLS.standard);

/** The knob's cap: the smooth chamfered disc that is most of what you see,
 *  and the element that carries the drop shadow.
 *
 *  `flush` takes the full width, which is what a smooth turned knob wants.
 *  The default sits back by the knurl band so a `KnurledFace` can ring it —
 *  the same cap either way, and the chamfer the referent cuts on every knob
 *  (knob.py's `chamfer=0.35`, regardless of rib count) either way too. */
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
        material && `amb-mat-${material}`,
        className
      )}
      /* Geometry, not styling: this is the clip's inner radius seen from the
         other side, so it comes from the same constant the path does. */
      style={flush ? undefined : { inset: `${KNURL_BAND * 100}%` }}
    />
  );
}

/** The rotating knurl: a rim ring of ribs around the cap, clipped to the
 *  toothed annulus so the ribs break the outline instead of being painted
 *  inside a circle, and shaded per tooth — a lit flank climbing to each
 *  ridge, a shaded one falling away — with a contact-occlusion band along
 *  its inner edge where the cap overhangs it.
 *
 *  The clip is the part's own business — it generates the path, emits its
 *  own `<defs>` and references it by a local id. A rotary mechanism has no
 *  idea any of this is happening, which is exactly the point: if this part
 *  needed help from the control to exist, the split would not be clean. */
export function KnurledFace({
  material,
  color,
  className
}: {
  material?: AmbientMaterial | undefined;
  /** The ribs' own colour, as an albedo. */
  color?: string | undefined;
  className?: string | undefined;
}) {
  const id = `amb-knurl-${useId().replace(/:/g, "")}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden focusable={false}>
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={KNURL_PATH} clipRule="evenodd" />
          </clipPath>
        </defs>
      </svg>
      <span
        className={cn("amb-knob-face", material && `amb-mat-${material}`, className)}
        style={{
          clipPath: `url(#${id})`,
          /* Not a paint colour: --amb-albedo is the ribs' REFLECTANCE, so a
             dark knurl still takes the scene's exposure, the lamp's cast and
             the rim's own --amb-shade step, and still goes dark when the
             lights do. Inline, so it beats the albedo a micro-relief material
             would otherwise set on this element — an explicit colour wins
             over the finish's own, and the finish keeps its grain. */
          ...(color ? { "--amb-albedo": color } : null)
        } as CSSProperties}
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
