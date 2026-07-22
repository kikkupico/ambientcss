import { useId, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";

/* Straight-knurled silhouettes for the rotating face, in
   objectBoundingBox units so the clip scales with the component. Each
   variant family mirrors its referent's rib section
   (ambient3d/ground_components.py): trapezoid teeth between the outer
   radius and the tooth-root radius. The circular body underneath keeps
   the smooth drop shadow. */
type KnurlSpec = {
  teeth: number; // rib count
  root: number; // tooth-root radius (bounding-box units; outer is 0.5)
  rise: number; // fraction of the pitch spent climbing to the crest
  fall: [number, number]; // crest-end and root-return pitch fractions
};

const KNURLS: Record<"standard" | "flute" | "fine", KnurlSpec> = {
  /* 36 ribs — the grounded referent knob (dot and line variants) */
  standard: { teeth: 36, root: 0.468, rise: 0.12, fall: [0.5, 0.62] },
  /* 14 broad flutes with deeper roots (OP-Z-style flute variant) */
  flute: { teeth: 14, root: 0.44, rise: 0.08, fall: [0.72, 0.8] },
  /* 48-rib fine knurl, shallower (cap and wheel variants) */
  fine: { teeth: 48, root: 0.476, rise: 0.12, fall: [0.5, 0.62] }
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

const KNURL_PATHS = {
  standard: knurlPath(KNURLS.standard),
  flute: knurlPath(KNURLS.flute),
  fine: knurlPath(KNURLS.fine)
};

/* Knob types from the referent lineup (ambient3d/generate.py):
   - "dot":   the grounded referent — 36-rib knurl, offset indicator dot
   - "line":  same body with a radial indicator line (classic pot)
   - "flute": 14 broad flutes, centered dot (OP-Z-style encoder)
   - "cap":   fine knurl under a smooth accent top disc (OP-1-style)
   - "wheel": bare fine knurl, no indicator (machined wheel — pair with
     material="shiny") */
export type AmbientKnobVariant = "dot" | "line" | "flute" | "cap" | "wheel";

const VARIANT_FAMILY: Record<AmbientKnobVariant, keyof typeof KNURL_PATHS> = {
  dot: "standard",
  line: "standard",
  flute: "flute",
  cap: "fine",
  wheel: "fine"
};

export type AmbientKnobSize = "sm" | "md" | "lg";

export type AmbientKnobProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  material?: "matte" | "shiny" | "glass";
  variant?: AmbientKnobVariant;
  size?: AmbientKnobSize;
  onChange?: (nextValue: number) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function AmbientKnob({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  material,
  variant = "dot",
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
  const family = VARIANT_FAMILY[variant];

  const percent = (value - min) / (max - min || 1);
  const rotation = percent * 270 - 135;

  // Convert pointer position to a knob angle in [-180, 180] where 0 = up,
  // positive = clockwise. The knob's active range is [-135, 135] (270°),
  // with the dead zone at the bottom (~135° to ~225° i.e. past ±135°).
  const pointerToValue = (event: PointerEvent<HTMLDivElement>) => {
    const rect = knobRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // atan2 with screen coords: 0=right, 90=down; add 90 to rotate so 0=up
    const atan2Deg = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI);
    let angle = atan2Deg + 90;
    // Normalize to [-180, 180]
    if (angle > 180) angle -= 360;

    // Clamp dead zone based on current value position
    if (angle < -135 || angle > 135) {
      angle = percent >= 0.5 ? 135 : -135;
    }

    const range = max - min;
    const raw = min + ((angle + 135) / 270) * range;
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

  return (
    <div className={cn("ambx-stack", className)} {...props}>
      <div
        ref={knobRef}
        className={cn("amb-knob ambx-knob", `ambx-knob-${size}`)}
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
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden focusable={false}>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={KNURL_PATHS[family]} />
            </clipPath>
          </defs>
        </svg>
        <span className="amb-knob-body ambient amb-thickness-2 amb-surface" />
        <div
          className={cn(
            "ambx-knob-rotation amb-knob-face",
            family === "flute" && "amb-knob-face-flute",
            family === "fine" && "amb-knob-face-fine",
            variant === "cap" && "amb-knob-face-cap",
            material && `amb-mat-${material}`
          )}
          style={{ transform: `rotate(${rotation}deg)`, clipPath: `url(#${clipId})` }}
        >
          {variant === "dot" ? <span className="amb-knob-indicator-dot" /> : null}
          {variant === "line" ? <span className="amb-knob-indicator-line" /> : null}
          {variant === "flute" ? (
            <span className="amb-knob-indicator-dot amb-knob-indicator-dot-center" />
          ) : null}
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
