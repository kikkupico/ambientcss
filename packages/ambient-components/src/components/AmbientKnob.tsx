import { cn } from "../lib/cn";
import { AmbientRotary } from "../controls/AmbientRotary";
import type { AmbientRotaryProps } from "../controls/AmbientRotary";
import type { AmbientMaterial } from "../core/material";
import { IndicatorBar, IndicatorDot, KnobBody, KnurledFace, ScaleRing } from "../parts/knob";

/** Printed scale dots on the panel around the knob: the arc's two ends, the
 *  full graduated ring, or nothing. */
export type AmbientKnobMarkers = "none" | "ends" | "full";

/** The pointer riding the rotating face: a radial bar or an offset dot. */
export type AmbientKnobIndicator = "rectangle" | "circle";

export type AmbientKnobSize = "sm" | "md" | "lg";

export type AmbientKnobProps = Omit<AmbientRotaryProps, "parts" | "size"> & {
  material?: AmbientMaterial | undefined;
  /** Ribbed grip around the rotating body. Off gives a smooth turned body. */
  knurling?: boolean | undefined;
  markers?: AmbientKnobMarkers | undefined;
  indicator?: AmbientKnobIndicator | undefined;
  size?: AmbientKnobSize | undefined;
};

/* 12 divisions — 13 dots over the sweep, the pitch measured off the
   reference panel. */
const FULL_MARKERS = 13;

/**
 * The grounded knob: a knurled body on the panel with an indicator on the
 * rotating face, assembled out of `AmbientRotary` and the knob parts.
 *
 * Everything this preset does beyond choosing parts is knowledge a
 * mechanism cannot have. `material` lands on whichever element actually
 * paints — the clipped face when there is a knurl, the body when there is
 * not, because a smooth knob's face paints nothing at all. And the full
 * marker ring reaches past the knob's own box, so its layout clearance has
 * to be reserved; `AmbientRotary` cannot know what is in its `panel`
 * frame, but this preset knows it put a `ScaleRing` there.
 */
export function AmbientKnob({
  material,
  knurling = true,
  markers = "none",
  indicator = "circle",
  size = "md",
  className,
  ...rest
}: AmbientKnobProps) {
  return (
    <AmbientRotary
      {...rest}
      size={size}
      className={cn(
        "amb-knob",
        !knurling && "amb-knob-smooth",
        markers === "full" && "amb-knob-markers-full",
        className
      )}
      parts={{
        panel:
          markers === "none" ? null : <ScaleRing count={markers === "ends" ? 2 : FULL_MARKERS} />,
        base: <KnobBody flush={!knurling} material={!knurling ? material : undefined} />,
        actuator: (
          <>
            {knurling ? <KnurledFace material={material} /> : null}
            {indicator === "circle" ? <IndicatorDot /> : <IndicatorBar />}
          </>
        )
      }}
    />
  );
}
