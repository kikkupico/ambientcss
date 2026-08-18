import { useMemo } from "react";
import type { CSSProperties } from "react";
import { useControllableValue } from "./controllable";
import { stateData, stateStyle } from "./types";
import type { ControlState } from "./types";

export type UseLatchOptions = {
  value?: boolean | undefined;
  defaultValue?: boolean | undefined;
  onChange?: ((next: boolean) => void) | undefined;
  disabled?: boolean | undefined;
};

/** A two-position travel. Kept distinct from Press because its actuator
 *  genuinely slides rather than sinking, and because its ARIA is
 *  `role="switch"` — a switch is a state, not an action. */
export function useLatch(options: UseLatchOptions) {
  const { disabled = false } = options;
  const [on, setOn] = useControllableValue(
    options.value,
    options.defaultValue ?? false,
    options.onChange
  );

  const state: ControlState = useMemo(
    () => ({
      value: on ? 1 : 0,
      min: 0,
      max: 1,
      percent: on ? 1 : 0,
      angle: 0,
      travelStart: 0,
      travelSweep: 0,
      detents: 2,
      dragging: false,
      disabled,
      atMin: !on,
      atMax: on
    }),
    [on, disabled]
  );

  const rootProps = {
    type: "button" as const,
    role: "switch" as const,
    "aria-checked": on,
    disabled,
    style: stateStyle(state) as CSSProperties,
    ...stateData(state),
    onClick: () => setOn(!on)
  };

  return { state, rootProps, on, setOn };
}
