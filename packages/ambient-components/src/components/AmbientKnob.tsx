import { useId, useRef } from "react";
import type { HTMLAttributes, KeyboardEvent, PointerEvent } from "react";
import { cn } from "../lib/cn";

export type AmbientKnobProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
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
  onChange,
  className,
  ...props
}: AmbientKnobProps) {
  const id = useId();
  const dragStateRef = useRef<{ startY: number; startValue: number } | null>(null);
  const safeStep = step > 0 ? step : 1;

  const percent = (value - min) / (max - min || 1);
  const rotation = percent * 270 - 135;

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    const delta = drag.startY - event.clientY;
    const range = max - min;
    const sensitivity = range / 180;
    const raw = drag.startValue + delta * sensitivity;
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
        className="ambient amb-knob amb-chamfer amb-elevation-2 amb-surface ambx-knob"
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
          dragStateRef.current = { startY: event.clientY, startValue: value };
        }}
        onPointerMove={updateFromPointer}
        onPointerUp={() => {
          dragStateRef.current = null;
        }}
        onPointerCancel={() => {
          dragStateRef.current = null;
        }}
        onKeyDown={onKeyDown}
      >
        <div className="ambx-knob-rotation" style={{ transform: `rotate(${rotation}deg)` }}>
          <div className="amb-knob-indicator">
            <div className="amb-knob-grip">
              <span className="amb-fader-dot" />
              <span className="amb-fader-dot" />
              <span className="amb-fader-dot" />
            </div>
          </div>
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
