import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { useControllableValue } from "./controllable";
import { stateData, stateStyle } from "./types";
import type { ControlState } from "./types";

/** A transport key, a latching mute and an auto-repeating nudge button are
 *  the same object with three state machines and identical paint. */
export type PressMode = "momentary" | "toggle" | "repeat";

export type UsePressOptions = {
  mode?: PressMode | undefined;
  /** `toggle` mode only: the pressed-in state. */
  value?: boolean | undefined;
  defaultValue?: boolean | undefined;
  onChange?: ((next: boolean) => void) | undefined;
  /** Fires once per activation, and repeatedly in `repeat` mode. */
  onPress?: (() => void) | undefined;
  /** `repeat` mode: delay before repeating starts, then its interval. */
  repeatDelay?: number | undefined;
  repeatInterval?: number | undefined;
  disabled?: boolean | undefined;
};

export function usePress(options: UsePressOptions) {
  const {
    mode = "momentary",
    repeatDelay = 400,
    repeatInterval = 60,
    disabled = false
  } = options;

  const [on, setOn] = useControllableValue(
    options.value,
    options.defaultValue ?? false,
    options.onChange
  );
  const [held, setHeld] = useState(false);

  const onPressRef = useRef(options.onPress);
  onPressRef.current = options.onPress;
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>(
    {}
  );

  const stopRepeat = useCallback(() => {
    if (timers.current.delay) clearTimeout(timers.current.delay);
    if (timers.current.tick) clearInterval(timers.current.tick);
    timers.current = {};
  }, []);

  /* A held key that unmounts must not keep firing. */
  useEffect(() => stopRepeat, [stopRepeat]);

  const activate = useCallback(() => {
    if (mode === "toggle") setOn(!on);
    onPressRef.current?.();
  }, [mode, on, setOn]);

  const pressed = mode === "toggle" ? on : held;

  const state: ControlState = useMemo(
    () => ({
      value: pressed ? 1 : 0,
      min: 0,
      max: 1,
      percent: pressed ? 1 : 0,
      angle: 0,
      travelStart: 0,
      travelSweep: 0,
      detents: 2,
      dragging: held,
      disabled,
      atMin: !pressed,
      atMax: pressed
    }),
    [pressed, held, disabled]
  );

  const rootProps = {
    type: "button" as const,
    disabled,
    "aria-pressed": mode === "toggle" ? on : undefined,
    style: stateStyle(state) as CSSProperties,
    "data-pressed": pressed ? "" : undefined,
    "data-mode": mode,
    ...stateData(state),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0) return;
      setHeld(true);
      if (mode !== "repeat") return;
      /* Repeat fires immediately, then accelerates into its interval —
         the same shape a keyboard's own auto-repeat has, so a held nudge
         button does not feel like a different kind of control. */
      onPressRef.current?.();
      timers.current.delay = setTimeout(() => {
        timers.current.tick = setInterval(() => onPressRef.current?.(), repeatInterval);
      }, repeatDelay);
    },
    onPointerUp: () => {
      setHeld(false);
      stopRepeat();
    },
    onPointerCancel: () => {
      setHeld(false);
      stopRepeat();
    },
    onPointerLeave: () => {
      setHeld(false);
      stopRepeat();
    },
    onClick: () => {
      /* Repeat already fired on the press; firing again on click would
         double every tap. */
      if (mode !== "repeat") activate();
    }
  };

  return { state, rootProps, pressed, on, setOn };
}
