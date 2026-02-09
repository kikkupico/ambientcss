import { useId, useRef } from "react";
import type { HTMLAttributes, PointerEvent } from "react";
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

  const percent = (value - min) / (max - min || 1);
  const rotation = percent * 270 - 135;

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    const delta = drag.startY - event.clientY;
    const range = max - min;
    const sensitivity = range / 180;
    const raw = drag.startValue + delta * sensitivity;
    const snapped = Math.round(raw / step) * step;
    onChange?.(clamp(snapped, min, max));
  };

  return (
    <div className={cn("ambx-stack", className)} {...props}>
      <div
        className="ambient amb-knob amb-fillet amb-elevation-2 amb-surface ambx-knob"
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-labelledby={label ? id : undefined}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStateRef.current = { startY: event.clientY, startValue: value };
        }}
        onPointerMove={updateFromPointer}
        onPointerUp={() => {
          dragStateRef.current = null;
        }}
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
