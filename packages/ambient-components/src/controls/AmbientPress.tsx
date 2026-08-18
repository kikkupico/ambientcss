import { useRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { ControlStateProvider } from "../core/context";
import { Frames, useDevPartCheck } from "../core/frames";
import { sizeProps } from "../core/types";
import type { ControlParts, ControlSize } from "../core/types";
import { usePress } from "../core/usePress";
import type { UsePressOptions } from "../core/usePress";

export type AmbientPressProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value" | "defaultValue" | "type"
> &
  UsePressOptions & {
    parts?: ControlParts | undefined;
    size?: ControlSize | undefined;
  };

/** A key that sinks under a finger, with no appearance of its own.
 *
 *  Its frames are `display: contents` markers rather than boxes, because a
 *  button is sized by its cap: the width is `min-width` plus the legend.
 *  Wrapping the cap in a positioned frame would collapse the control. */
export function AmbientPress({
  parts,
  size,
  className,
  mode,
  value,
  defaultValue,
  onChange,
  onPress,
  repeatDelay,
  repeatInterval,
  disabled,
  children,
  ...rest
}: AmbientPressProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { state, rootProps } = usePress({
    mode,
    value,
    defaultValue,
    onChange,
    onPress,
    repeatDelay,
    repeatInterval,
    disabled
  });
  useDevPartCheck(ref, "AmbientPress");

  const sized = sizeProps("press", size);
  const { style: restStyle, onClick, ...restProps } = rest;

  return (
    <button
      {...restProps}
      {...rootProps}
      ref={ref}
      className={cn("ambx-control ambx-press", sized.className, className)}
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
}
