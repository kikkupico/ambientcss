import { useId, useRef } from "react";
import type { CSSProperties, HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";

/* Straight-knurled silhouette for the rotating face, in objectBoundingBox
   units so the clip scales with the component. It mirrors the grounded
   referent's rib section (ambient3d/referents.py knob(), ribs=36): trapezoid
   teeth between the outer radius and the tooth-root radius. The circular body
   underneath keeps the smooth drop shadow.

   One knurl for now, kept in a table because the shape is a data question and
   the referent lineup already carries broader flutes and a finer 48-rib knurl
   we may expose later — at which point `knurling` grows from a boolean into a
   union and this table gains rows rather than changing shape. */
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

/* The pot's travel, shared by the value mapping, the pointer maths and the
   marker ring — the markers have to land on the same arc the value sweeps, so
   these are read, never restated. Degrees clockwise from 12 o'clock. */
const MIN_ANGLE = -135;
const SWEEP = 270;

/* 12 divisions — 13 dots at 22.5deg over the 270deg sweep, the pitch measured
   off the reference panel. */
const MARKER_DIVISIONS = 12;

/** Printed scale dots on the panel around the knob: the arc's two ends, the
 *  full graduated ring, or nothing. */
export type AmbientKnobMarkers = "none" | "ends" | "full";

/** The pointer riding the rotating face: a radial bar or an offset dot. */
export type AmbientKnobIndicator = "rectangle" | "circle";

export type AmbientKnobSize = "sm" | "md" | "lg";

export type AmbientKnobProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  material?: "matte" | "shiny" | "glass";
  /** Ribbed grip around the rotating body. Off gives a smooth turned body. */
  knurling?: boolean;
  /** Printed scale dots on the panel around the knob. */
  markers?: AmbientKnobMarkers;
  indicator?: AmbientKnobIndicator;
  size?: AmbientKnobSize;
  onChange?: (nextValue: number) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Marker angles along the sweep. "ends" is the pair the arc starts and stops
   at — the two dots that say where the travel runs out. */
function markerAngles(markers: AmbientKnobMarkers): number[] {
  if (markers === "none") return [];
  if (markers === "ends") return [MIN_ANGLE, MIN_ANGLE + SWEEP];
  return Array.from(
    { length: MARKER_DIVISIONS + 1 },
    (_, i) => MIN_ANGLE + (i / MARKER_DIVISIONS) * SWEEP
  );
}

export function AmbientKnob({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  material,
  knurling = true,
  markers = "none",
  indicator = "circle",
  size = "md",
  onChange,
  className,
  ...props
}: AmbientKnobProps) {
  const id = useId();
  const clipId = `amb-knurl-${id.replace(/:/g, "")}`;
  const draggingRef = useRef(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const safeStep = step > 0 ? step : 1;

  const percent = (value - min) / (max - min || 1);
  const rotation = percent * SWEEP + MIN_ANGLE;

  // Convert pointer position to a knob angle in [-180, 180] where 0 = up,
  // positive = clockwise. The knob's active range is the sweep, with the dead
  // zone at the bottom (past ±135°).
  const pointerToValue = (event: PointerEvent<HTMLDivElement>) => {
    const rect = knobRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // atan2 with screen coords: 0=right, 90=down; add 90 to rotate so 0=up
    const atan2Deg = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI);
    let angle = atan2Deg + 90;
    // Normalize to [-180, 180]
    if (angle > 180) angle -= 360;

    const maxAngle = MIN_ANGLE + SWEEP;
    // Clamp dead zone based on current value position
    if (angle < MIN_ANGLE || angle > maxAngle) {
      angle = percent >= 0.5 ? maxAngle : MIN_ANGLE;
    }

    const range = max - min;
    const raw = min + ((angle - MIN_ANGLE) / SWEEP) * range;
    const snapped = Math.round(raw / safeStep) * safeStep;
    onChange?.(clamp(snapped, min, max));
  };

  const setValue = (nextValue: number) => {
    const snapped = Math.round(nextValue / safeStep) * safeStep;
    onChange?.(clamp(snapped, min, max));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const pageStep = safeStep * 10;
    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        event.preventDefault();
        setValue(value + safeStep);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        event.preventDefault();
        setValue(value - safeStep);
        break;
      case "PageUp":
        event.preventDefault();
        setValue(value + pageStep);
        break;
      case "PageDown":
        event.preventDefault();
        setValue(value - pageStep);
        break;
      case "Home":
        event.preventDefault();
        setValue(min);
        break;
      case "End":
        event.preventDefault();
        setValue(max);
        break;
      default:
        break;
    }
  };

  const angles = markerAngles(markers);

  return (
    <div className={cn("ambx-stack", className)} {...props}>
      <div
        ref={knobRef}
        className={cn(
          "amb-knob ambx-knob",
          `ambx-knob-${size}`,
          !knurling && "amb-knob-smooth",
          markers === "full" && "amb-knob-markers-full"
        )}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-labelledby={label ? id : undefined}
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          draggingRef.current = true;
          pointerToValue(event);
        }}
        onPointerMove={(event) => {
          if (draggingRef.current) pointerToValue(event);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        onKeyDown={onKeyDown}
      >
        {knurling ? (
          <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden focusable={false}>
            <defs>
              <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                <path d={KNURL_PATH} />
              </clipPath>
            </defs>
          </svg>
        ) : null}
        {/* The markers are panel graphics, not part of the control: they sit
            outside the rotating layer so they stay put while the knob turns,
            and take no pointer events so the ring does not enlarge the grab
            area past the knob body. */}
        {angles.length > 0 ? (
          <span className="amb-knob-marker-ring" aria-hidden>
            {angles.map((angle) => (
              <span
                key={angle}
                className="amb-knob-marker"
                style={{ "--amb-marker-angle": `${angle}deg` } as CSSProperties}
              />
            ))}
          </span>
        ) : null}
        {/* `material` goes on whichever element actually paints the knob: the
            clipped face when there is a knurl, the body when there is not.
            A smooth knob's face paints nothing at all, so a material left
            there would be both invisible and overridden by the reset. */}
        <span
          className={cn(
            "amb-knob-body ambient amb-thickness-2 amb-surface",
            !knurling && material && `amb-mat-${material}`
          )}
        />
        <div
          className={cn(
            "ambx-knob-rotation amb-knob-face",
            knurling && material && `amb-mat-${material}`
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
            ...(knurling ? { clipPath: `url(#${clipId})` } : null)
          }}
        >
          {indicator === "circle" ? <span className="amb-knob-indicator-circle" /> : null}
          {indicator === "rectangle" ? <span className="amb-knob-indicator-rectangle" /> : null}
        </div>
      </div>
      {label ? (
        <span id={id} className="ambx-label">
          {label}
        </span>
      ) : null}
    </div>
  );
}
