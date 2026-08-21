import { useId, useRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { ControlStateProvider } from "../core/context";
import { Frames, useDevPartCheck } from "../core/frames";
import { sizeProps } from "../core/types";
import type { ControlAnimate, ControlParts, ControlSize } from "../core/types";
import { useTravel } from "../core/useTravel";
import type { UseTravelOptions } from "../core/useTravel";

export type AmbientTravelProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> &
  UseTravelOptions & {
    parts?: ControlParts | undefined;
    size?: ControlSize | undefined;
    animate?: ControlAnimate | undefined;
    label?: ReactNode | undefined;
  };

/** A value on a straight track, with no appearance of its own. */
export function AmbientTravel({
  parts,
  size,
  animate = "auto",
  label,
  className,
  value,
  defaultValue,
  min,
  max,
  step,
  detents,
  orientation = "horizontal",
  invert,
  disabled,
  onChange,
  ...rest
}: AmbientTravelProps) {
  const labelId = useId();
  const stackRef = useRef<HTMLDivElement>(null);
  const { state, rootProps } = useTravel({
    value,
    defaultValue,
    min,
    max,
    step,
    detents,
    orientation,
    invert,
    disabled,
    onChange
  });
  useDevPartCheck(stackRef, "AmbientTravel");

  const sized = sizeProps("travel", size);
  const { style: restStyle, ...restProps } = rest;

  return (
    <div className="ambx-stack" ref={stackRef}>
      <div
        {...restProps}
        {...rootProps}
        aria-labelledby={label ? labelId : rest["aria-labelledby"]}
        data-animate={animate}
        className={cn(
          "ambx-control ambx-travel",
          `ambx-travel-${orientation}`,
          sized.className,
          className
        )}
        style={{ ...rootProps.style, ...sized.style, ...restStyle }}
      >
        <ControlStateProvider value={state}>
          <Frames parts={parts} />
        </ControlStateProvider>
      </div>
      {label ? (
        <span id={labelId} className="ambx-label">
          {label}
        </span>
      ) : null}
    </div>
  );
}
