import { useId, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";

export type AmbientKnobProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  material?: "matte" | "shiny" | "glass";
  onChange?: (nextValue: number) => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Straight-knurled silhouette for the rotating face: 36 trapezoid teeth
   (the referent's rib count; ambient3d/ground_components.py) between the
   outer radius and the tooth-root radius, in objectBoundingBox units so
   the clip scales with the component. The circular body underneath keeps
   the smooth drop shadow. */
const KNURL_TEETH = 36;
const KNURL_PATH = (() => {
  const outer = 0.5;
  const root = 0.468;
  const pitch = (Math.PI * 2) / KNURL_TEETH;
  const pts: string[] = [];
  for (let i = 0; i < KNURL_TEETH; i++) {
    const a = i * pitch;
    const tooth: Array<[number, number]> = [
      [0, root],
      [0.12, outer],
      [0.5, outer],
      [0.62, root]
    ];
    for (const [frac, radius] of tooth) {
      const t = a + frac * pitch;
      pts.push(
        `${(0.5 + radius * Math.cos(t)).toFixed(4)} ${(0.5 + radius * Math.sin(t)).toFixed(4)}`
      );
    }
  }
  return `M${pts.join(" L")} Z`;
})();

export function AmbientKnob({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  material,
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
        className="amb-knob ambx-knob"
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
              <path d={KNURL_PATH} />
            </clipPath>
          </defs>
        </svg>
        <span className="amb-knob-body ambient amb-thickness-2 amb-surface" />
        <div
          className={cn("ambx-knob-rotation amb-knob-face", material && `amb-mat-${material}`)}
          style={{ transform: `rotate(${rotation}deg)`, clipPath: `url(#${clipId})` }}
        >
          <span className="amb-knob-indicator-dot" />
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
