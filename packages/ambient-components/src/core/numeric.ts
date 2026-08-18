/* Value maths shared by every control.

   These four functions were previously inlined — identically — in
   AmbientKnob, AmbientSlider and AmbientFader. The keyboard handler below
   was copied three times with the same `pageStep = step * 10`, the same
   Home/End edges and the same snap-then-clamp order. */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Quantise to the step grid, anchored at `min` rather than at zero so a
 *  range like 10..100 step 25 rests on 10/35/60/85 instead of 25/50/75. */
export function snap(value: number, min: number, step: number): number {
  if (!(step > 0)) return value;
  return min + Math.round((value - min) / step) * step;
}

/** Value to its 0-1 position in the range. */
export function normalise(value: number, min: number, max: number): number {
  return (value - min) / (max - min || 1);
}

/** A 0-1 position back to a value. */
export function denormalise(t: number, min: number, max: number): number {
  return min + t * (max - min);
}

/** Snap and clamp in the order every control needs: quantise first, then
 *  hold the result inside the range, so a step that does not divide the
 *  range still cannot push the value past `max`. */
export function commit(value: number, min: number, max: number, step: number): number {
  return clamp(snap(value, min, max === min ? 1 : step), min, max);
}

export type ValueKeysOptions = {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  /** Swap the direction of the arrow keys along the control's own axis. */
  invert?: boolean;
  onChange: (next: number) => void;
};

/** The Arrow/Page/Home/End contract, in one place.
 *
 *  Both arrow axes act on every control: a knob has no "left", and a
 *  horizontal slider has no "up", but a keyboard user should not have to
 *  know which. Page steps are ten of `step`, the figure all three
 *  components already used. */
export function valueKeyHandler(options: ValueKeysOptions) {
  return (event: { key: string; preventDefault(): void }): boolean => {
    const { value, min, max, step, invert, onChange, disabled } = options;
    if (disabled) return false;
    const dir = invert ? -1 : 1;
    const set = (next: number) => {
      event.preventDefault();
      onChange(commit(next, min, max, step));
    };

    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        set(value + step * dir);
        return true;
      case "ArrowDown":
      case "ArrowLeft":
        set(value - step * dir);
        return true;
      case "PageUp":
        set(value + step * 10 * dir);
        return true;
      case "PageDown":
        set(value - step * 10 * dir);
        return true;
      case "Home":
        set(min);
        return true;
      case "End":
        set(max);
        return true;
      default:
        return false;
    }
  };
}
