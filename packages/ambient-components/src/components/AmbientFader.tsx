import { useId, useRef } from "react";
import type { HTMLAttributes, PointerEvent } from "react";
import { cn } from "../lib/cn";

export type AmbientFaderProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
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

export function AmbientFader({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  onChange,
  className,
  ...props
}: AmbientFaderProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const percent = ((value - min) / (max - min || 1)) * 100;

  const updateFromClientY = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    const nextValue = min + clamp(ratio, 0, 1) * (max - min);
    const snapped = Math.round(nextValue / step) * step;
    onChange?.(clamp(snapped, min, max));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    updateFromClientY(event.clientY);
  };

  return (
    <div className={cn("ambx-stack", className)} {...props}>
      <div
        className="amb-fader ambx-fader"
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-labelledby={label ? id : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromClientY(event.clientY);
        }}
        onPointerMove={onPointerMove}
      >
        <div
          className="amb-fader-thumb ambient amb-fillet amb-elevation-1 amb-surface-concave ambx-fader-thumb"
          style={{ top: `${100 - percent}%` }}
        >
          <div className="amb-fader-grip">
            <span className="amb-fader-dot" />
            <span className="amb-fader-dot" />
            <span className="amb-fader-dot" />
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
