import type { CSSProperties, ReactNode } from "react";

/** The four frames every control renders, in paint order.
 *
 *  - `panel`    static, behind the control, allowed to overflow its box
 *  - `base`     static, the control's own footprint
 *  - `actuator` the moving part: the frame the control transforms
 *  - `fixture`  static, above the actuator
 *
 *  A part dropped into a frame is ordinary markup. The control moves the
 *  frame; the part only has to look like something. */
export type ControlParts = {
  panel?: ReactNode | undefined;
  base?: ReactNode | undefined;
  actuator?: ReactNode | undefined;
  fixture?: ReactNode | undefined;
};

export type FrameName = keyof ControlParts;

export const FRAME_ORDER: FrameName[] = ["panel", "base", "actuator", "fixture"];

/** `"sm" | "md" | "lg"` picks a size from the family's table; any other
 *  string is used as a CSS length for `--ambx-size`. */
export type ControlSize = "sm" | "md" | "lg" | (string & {});

/** How the actuator moves to a new position.
 *
 *  - `follow` 1:1 with the pointer, no transition — right while dragging
 *  - `ease`   transitions, right for keyboard and click-to-set
 *  - `snap`   instant, for a detented control that should read as clicking
 *
 *  The default is contextual: follow while `data-dragging` is on the root,
 *  ease otherwise. That needs no JS — see `.ambx-control` in styles.css. */
export type ControlAnimate = "auto" | "follow" | "ease" | "snap";

/** What a part can read, via `useControlState()`. The same values are on
 *  the control root as custom properties, which are canonical; this is a
 *  typed view of them for parts that genuinely need JS. */
export type ControlState = {
  /** The raw value. Booleans arrive as 0/1, selections as the index. */
  value: number;
  min: number;
  max: number;
  /** Normalised position, 0-1. */
  percent: number;
  /** Degrees clockwise from 12 o'clock. 0 for non-rotary controls. */
  angle: number;
  /** Sweep origin and extent in degrees. 0 for non-rotary controls. */
  travelStart: number;
  travelSweep: number;
  /** Rest positions along the travel; 0 means continuous. */
  detents: number;
  dragging: boolean;
  disabled: boolean;
  atMin: boolean;
  atMax: boolean;
};

export const IDLE_STATE: ControlState = {
  value: 0,
  min: 0,
  max: 1,
  percent: 0,
  angle: 0,
  travelStart: 0,
  travelSweep: 0,
  detents: 0,
  dragging: false,
  disabled: false,
  atMin: true,
  atMax: false
};

/** The state channel, written onto the control root.
 *
 *  Every property is declared here even when a family does not use it,
 *  because these inherit: a control nested inside another control's frame
 *  would otherwise read its ancestor's angle. `.ambx-control` carries the
 *  neutral defaults and this overrides them per instance. */
export function stateStyle(state: ControlState): CSSProperties {
  return {
    "--ambx-value": state.value,
    "--ambx-percent": state.percent,
    "--ambx-angle": `${state.angle}deg`,
    "--ambx-travel-start": `${state.travelStart}deg`,
    "--ambx-travel-sweep": `${state.travelSweep}deg`,
    "--ambx-detents": state.detents
  } as CSSProperties;
}

/** The discrete half of the state channel: conditions a part can style
 *  against but cannot detect for itself. */
export function stateData(state: ControlState): Record<string, string | undefined> {
  return {
    "data-dragging": state.dragging ? "" : undefined,
    "data-disabled": state.disabled ? "" : undefined,
    "data-at-min": state.atMin ? "" : undefined,
    "data-at-max": state.atMax ? "" : undefined
  };
}

/** Resolve `size` into the class suffix and/or the `--ambx-size` override.
 *  A named size picks the family's table; a length goes straight through,
 *  which is what lets a part scale off one property instead of matching a
 *  class it cannot know about. */
export function sizeProps(
  family: string,
  size: ControlSize | undefined
): { className?: string; style?: CSSProperties } {
  if (size === undefined) return {};
  if (size === "sm" || size === "md" || size === "lg") {
    return { className: `ambx-${family}-${size}` };
  }
  return { style: { "--ambx-size": size } as CSSProperties };
}
