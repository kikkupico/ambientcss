import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useControllableValue } from "./controllable";
import { clamp, commit, denormalise, normalise, valueKeyHandler } from "./numeric";
import { capturePointer } from "./useRotary";
import { stateData, stateStyle } from "./types";
import type { ControlState } from "./types";

export type TravelOrientation = "horizontal" | "vertical";

export type UseTravelOptions = {
  value?: number | undefined;
  defaultValue?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  detents?: number | undefined;
  orientation?: TravelOrientation | undefined;
  /** Flip which end of the axis is `min`. */
  invert?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange?: ((next: number) => void) | undefined;
};

/** A value riding a straight track.
 *
 *  One mechanism behind both the slider and the fader, which before v3 were
 *  the same file twice with X and Y swapped. The only real difference is
 *  which axis the pointer reads — and which end is `min`, where the two
 *  disagree for a physical reason rather than a stylistic one: a horizontal
 *  track runs min-at-the-left, and an upright one runs min-at-the-bottom,
 *  because that is how a fader is built. Both are the default here, so
 *  neither preset has to ask. */
export function useTravel(options: UseTravelOptions) {
  const {
    min = 0,
    max = 100,
    step = 1,
    orientation = "horizontal",
    invert = false,
    disabled = false
  } = options;

  const [value, setValue] = useControllableValue(
    options.value,
    options.defaultValue ?? min,
    options.onChange
  );

  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const vertical = orientation === "vertical";
  const range = max - min;
  const keyStep = step > 0 ? step : range / 100 || 1;
  const percent = clamp(normalise(value, min, max), 0, 1);

  const set = useCallback(
    (next: number) => setValue(commit(next, min, max, step)),
    [setValue, min, max, step]
  );

  const track = (event: PointerEvent<HTMLElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    // An upright track reads bottom-up: 1 at the top of the box.
    const raw = vertical
      ? 1 - (event.clientY - rect.top) / (rect.height || 1)
      : (event.clientX - rect.left) / (rect.width || 1);
    set(denormalise(clamp(invert ? 1 - raw : raw, 0, 1), min, max));
  };

  const state: ControlState = useMemo(
    () => ({
      value,
      min,
      max,
      percent,
      angle: 0,
      travelStart: 0,
      travelSweep: 0,
      detents: options.detents ?? (step > 0 && range > 0 ? Math.round(range / step) : 0),
      dragging,
      disabled,
      atMin: value <= min,
      atMax: value >= max
    }),
    [value, min, max, percent, options.detents, step, range, dragging, disabled]
  );

  const onKeyDown = valueKeyHandler({
    value,
    min,
    max,
    step: keyStep,
    disabled,
    invert,
    onChange: setValue
  });

  const rootProps = {
    ref: rootRef,
    role: "slider" as const,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    "aria-orientation": orientation,
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : 0,
    style: stateStyle(state) as CSSProperties,
    "data-orientation": orientation,
    ...stateData(state),
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      capturePointer(event.currentTarget, event.pointerId);
      draggingRef.current = true;
      setDragging(true);
      /* A track is absolute by nature: pressing anywhere on it means "put
         the thumb here", which is what a fader does under a finger. */
      track(event);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || disabled) return;
      track(event);
    },
    onPointerUp: () => {
      draggingRef.current = false;
      setDragging(false);
    },
    onPointerCancel: () => {
      draggingRef.current = false;
      setDragging(false);
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown(event);
    }
  };

  return { state, rootProps, setValue: set };
}
