import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useControllableValue } from "./controllable";
import { clamp, commit, denormalise, normalise, valueKeyHandler } from "./numeric";
import { stateData, stateStyle } from "./types";
import { isDev } from "./dev";
import type { ControlState } from "./types";

/** How pointer movement becomes value.
 *
 *  These are three different mappings, not one with a parameter, and the
 *  library was ambiguous about which it implemented: the code did `angle`
 *  while knob.md documented `drag`. Naming it makes that drift impossible.
 *
 *  - `drag`  pointer DISTANCE -> value delta. The v3 default: it is what the
 *            docs always described, what most audio software does, and the
 *            only one that behaves on touch, where a finger covers the knob.
 *  - `angle` pointer POSITION -> absolute angle -> value. Needs a dead zone,
 *            and needs a sweep under a full turn to be unambiguous.
 *  - `delta` accumulated angular change. The endless-encoder mapping: no
 *            ends, no dead zone, and the value may wrap independently of
 *            where the pointer happens to be. */
export type RotaryInput = "drag" | "angle" | "delta";

/** The pot's travel in degrees clockwise from 12 o'clock. A bare number is
 *  a sweep centred on 12 o'clock, so `270` is the default 8-to-4 pot. */
export type RotaryTravel = number | { start: number; sweep: number };

export type UseRotaryOptions = {
  value?: number | undefined;
  defaultValue?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Quantises the VALUE. `0` leaves it continuous. */
  step?: number | undefined;
  /** Quantises the TRAVEL: rest positions along the arc. Defaults to the
   *  step grid, but the two are independent — an endless encoder can have
   *  24 detents per turn while its value stays continuous. */
  detents?: number | undefined;
  travel?: RotaryTravel | undefined;
  input?: RotaryInput | undefined;
  /** Pixels of drag for one full range, in `drag` mode. */
  dragDistance?: number | undefined;
  /** `delta` mode only: run past the ends and come round again. */
  wrap?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange?: ((next: number) => void) | undefined;
};

const DEFAULT_TRAVEL = { start: -135, sweep: 270 };

/** Fold an angle into (-180, 180]. */
function wrapDeg(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function resolveTravel(travel: RotaryTravel | undefined) {
  if (travel === undefined) return DEFAULT_TRAVEL;
  if (typeof travel === "number") return { start: -travel / 2, sweep: travel };
  return travel;
}

let warnedFullTurn = false;

/** Pointer capture, but survivable.
 *
 *  `setPointerCapture` throws NotFoundError for a pointer id the browser
 *  does not currently have down, and is missing outright in jsdom. Neither
 *  happens with a real finger, but both happen constantly in tests — and an
 *  exception here would abort the handler before the drag ever starts,
 *  making the control look broken rather than untestable. */
export function capturePointer(target: Element, pointerId: number): void {
  try {
    target.setPointerCapture?.(pointerId);
  } catch {
    /* Without capture the drag still tracks; it just stops at the edge of
       the element instead of following the pointer off it. */
  }
}

export function useRotary(options: UseRotaryOptions) {
  const {
    min = 0,
    max = 100,
    step = 1,
    dragDistance = 200,
    wrap = false,
    disabled = false
  } = options;

  const { start, sweep } = resolveTravel(options.travel);

  /* A full turn cannot be read as an absolute angle: 0 and max land on the
     same screen position, and the dead-zone clamp has no end to snap to.
     Fall back rather than misbehave silently. */
  let input = options.input ?? "drag";
  if (input === "angle" && Math.abs(sweep) >= 360) {
    if (isDev && !warnedFullTurn) {
      warnedFullTurn = true;
      console.warn(
        `[@ambientcss/components] input="angle" needs a sweep under a full turn ` +
          `(got ${sweep}deg): an absolute angle is ambiguous at 360deg, where the ` +
          `first and last values share a screen position. Falling back to "drag".`
      );
    }
    input = "drag";
  }

  const [value, setValue] = useControllableValue(
    options.value,
    options.defaultValue ?? min,
    options.onChange
  );

  /* `dragging` is state because the root publishes it as data-dragging, and
     a REF because the move handler has to gate on it. Reading the state in
     the handler drops every move that fires before React re-renders after
     the press — which is most of them on a fast drag. */
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  /* Drag bookkeeping. Deltas are accumulated rather than measured from the
     press point so that toggling the fine-mode modifier mid-drag changes
     the gearing from here on instead of jumping the value. */
  const drag = useRef({ value: 0, clientY: 0, angle: 0, accum: 0 });

  const range = max - min;
  const keyStep = step > 0 ? step : range / 100 || 1;
  const percent = clamp(normalise(value, min, max), 0, 1);
  const angle = start + percent * sweep;

  const set = useCallback(
    (next: number) => setValue(commit(next, min, max, step)),
    [setValue, min, max, step]
  );

  /** Pointer position as an angle in degrees clockwise from 12 o'clock. */
  const pointerAngle = (event: PointerEvent<HTMLElement>): number | null => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    // atan2 in screen coords reads 0 at 3 o'clock and grows clockwise; +90
    // rotates the origin to 12 o'clock.
    return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  };

  const fromAngle = (event: PointerEvent<HTMLElement>) => {
    const raw = pointerAngle(event);
    if (raw === null) return;
    /* Fold the reading into the half-turn either side of the sweep's own
       midpoint, so a sweep whose end passes 180deg stays reachable. */
    const mid = start + sweep / 2;
    let a = mid + wrapDeg(raw - mid);
    const end = start + sweep;
    if (a < Math.min(start, end) || a > Math.max(start, end)) {
      /* In the dead zone: hold at whichever end is angularly nearer. The
         pre-v3 code chose by which half the value was in, which threw the
         knob to the far end whenever a drag crossed the gap. */
      const toStart = Math.abs(wrapDeg(a - start));
      const toEnd = Math.abs(wrapDeg(a - end));
      a = toStart <= toEnd ? start : end;
    }
    set(denormalise((a - start) / (sweep || 1), min, max));
  };

  const fromDrag = (event: PointerEvent<HTMLElement>) => {
    const dy = drag.current.clientY - event.clientY;
    drag.current.clientY = event.clientY;
    drag.current.accum += dy * (event.shiftKey ? 0.25 : 1);
    set(drag.current.value + (drag.current.accum / dragDistance) * range);
  };

  const fromDelta = (event: PointerEvent<HTMLElement>) => {
    const raw = pointerAngle(event);
    if (raw === null) return;
    drag.current.accum += wrapDeg(raw - drag.current.angle);
    drag.current.angle = raw;
    const next = drag.current.value + (drag.current.accum / (sweep || 360)) * range;
    set(wrap && range > 0 ? min + (((next - min) % range) + range) % range : next);
  };

  const track = (event: PointerEvent<HTMLElement>) => {
    if (input === "angle") fromAngle(event);
    else if (input === "delta") fromDelta(event);
    else fromDrag(event);
  };

  const state: ControlState = useMemo(
    () => ({
      value,
      min,
      max,
      percent,
      angle,
      travelStart: start,
      travelSweep: sweep,
      detents: options.detents ?? (step > 0 && range > 0 ? Math.round(range / step) : 0),
      dragging,
      disabled,
      atMin: value <= min,
      atMax: value >= max
    }),
    [value, min, max, percent, angle, start, sweep, options.detents, step, range, dragging, disabled]
  );

  const onKeyDown = valueKeyHandler({ value, min, max, step: keyStep, disabled, onChange: setValue });

  const rootProps = {
    ref: rootRef,
    role: "slider" as const,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    "aria-orientation": "vertical" as const,
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : 0,
    style: stateStyle(state) as CSSProperties,
    ...stateData(state),
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      capturePointer(event.currentTarget, event.pointerId);
      draggingRef.current = true;
      setDragging(true);
      drag.current = {
        value,
        clientY: event.clientY,
        angle: pointerAngle(event) ?? 0,
        accum: 0
      };
      /* Only the absolute mapping jumps to the press point; the relative
         ones would lurch, which is the whole reason to prefer them. */
      if (input === "angle") fromAngle(event);
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
