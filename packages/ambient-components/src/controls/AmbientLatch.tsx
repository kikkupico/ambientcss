import { useId, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { ControlStateProvider } from "../core/context";
import { Frames, useDevPartCheck } from "../core/frames";
import { sizeProps } from "../core/types";
import type { ControlAnimate, ControlParts, ControlSize } from "../core/types";
import { useLatch } from "../core/useLatch";
import type { UseLatchOptions } from "../core/useLatch";

export type AmbientLatchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "defaultValue" | "type"
> &
  UseLatchOptions & {
    parts?: ControlParts | undefined;
    size?: ControlSize | undefined;
    animate?: ControlAnimate | undefined;
    label?: ReactNode | undefined;
  };

/** A two-position slide, with no appearance of its own. The control IS the
 *  track: its actuator is a pill-sized frame that travels across it, which
 *  is why anything sitting beside a switch — a lamp, a legend — belongs to
 *  whatever composes it rather than to the switch. */
export function AmbientLatch({
  parts,
  size,
  animate = "auto",
  label,
  className,
  value,
  defaultValue,
  onChange,
  disabled,
  children,
  ...rest
}: AmbientLatchProps) {
  const labelId = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const { state, rootProps } = useLatch({ value, defaultValue, onChange, disabled });
  useDevPartCheck(ref, "AmbientLatch");

  const sized = sizeProps("latch", size);
  const { style: restStyle, onClick, ...restProps } = rest;

  const control = (
    <button
      {...restProps}
      {...rootProps}
      ref={ref}
      aria-labelledby={label ? labelId : rest["aria-labelledby"]}
      data-animate={animate}
      className={cn("ambx-control ambx-latch", sized.className, className)}
      style={{ ...rootProps.style, ...sized.style, ...restStyle }}
      onClick={(event) => {
        rootProps.onClick();
        onClick?.(event);
      }}
    >
      <ControlStateProvider value={state}>
        <Frames parts={parts} />
        {children}
      </ControlStateProvider>
    </button>
  );

  if (!label) return control;

  return (
    <div className="ambx-stack">
      {control}
      <span id={labelId} className="ambx-label">
        {label}
      </span>
    </div>
  );
}
