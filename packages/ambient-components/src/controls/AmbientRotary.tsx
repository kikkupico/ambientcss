import { useId, useRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { ControlStateProvider } from "../core/context";
import { Frames, useDevPartCheck } from "../core/frames";
import { sizeProps } from "../core/types";
import type { ControlAnimate, ControlParts, ControlSize } from "../core/types";
import { useRotary } from "../core/useRotary";
import type { UseRotaryOptions } from "../core/useRotary";

export type AmbientRotaryProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> &
  UseRotaryOptions & {
    parts?: ControlParts | undefined;
    size?: ControlSize | undefined;
    animate?: ControlAnimate | undefined;
    label?: ReactNode | undefined;
  };

/** A rotary mechanism with no appearance of its own.
 *
 *  It owns the value, the three pointer mappings, the sweep, the keyboard
 *  contract and the ARIA; what it looks like is entirely the `parts` you
 *  give it. There is deliberately no `material` prop: which element a
 *  material belongs on is a fact about a particular knob's construction —
 *  on the clipped face when it is knurled, on the body when it is not —
 *  and a mechanism cannot know that once the body is yours. Presets carry
 *  `material`, because a preset knows its own parts. */
export function AmbientRotary({
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
  travel,
  input,
  dragDistance,
  wrap,
  disabled,
  onChange,
  ...rest
}: AmbientRotaryProps) {
  const labelId = useId();
  const stackRef = useRef<HTMLDivElement>(null);
  const { state, rootProps } = useRotary({
    value,
    defaultValue,
    min,
    max,
    step,
    detents,
    travel,
    input,
    dragDistance,
    wrap,
    disabled,
    onChange
  });
  useDevPartCheck(stackRef, "AmbientRotary");

  const sized = sizeProps("rotary", size);
  const { style: restStyle, ...restProps } = rest;

  const control = (
    <div
      {...restProps}
      {...rootProps}
      aria-labelledby={label ? labelId : rest["aria-labelledby"]}
      data-animate={animate}
      className={cn("ambx-control ambx-rotary", sized.className, className)}
      style={{ ...rootProps.style, ...sized.style, ...restStyle }}
    >
      <ControlStateProvider value={state}>
        <Frames parts={parts} />
      </ControlStateProvider>
    </div>
  );

  return (
    <div className="ambx-stack" ref={stackRef}>
      {control}
      {label ? (
        <span id={labelId} className="ambx-label">
          {label}
        </span>
      ) : null}
    </div>
  );
}
