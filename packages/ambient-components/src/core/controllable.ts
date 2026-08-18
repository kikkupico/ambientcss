import { useCallback, useRef, useState } from "react";

/** One controlled/uncontrolled convention for every control.
 *
 *  Pass `value` to drive it from outside; pass `defaultValue` (or neither)
 *  to let the control hold its own. `onChange` fires either way, so a
 *  caller can read an uncontrolled control without taking it over.
 *
 *  Before v3 this was inconsistent: AmbientSwitch and AmbientSelect took a
 *  default, while knob, slider and fader were controlled-only and would
 *  sit frozen if you forgot `onChange`. */
export function useControllableValue<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void
): [T, (next: T) => void] {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue);

  /* The setter is called from pointer handlers that run many times per
     drag, so it must not change identity between renders. */
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const controlledRef = useRef(isControlled);
  controlledRef.current = isControlled;

  const set = useCallback((next: T) => {
    if (!controlledRef.current) setInternal(next);
    onChangeRef.current?.(next);
  }, []);

  return [isControlled ? (controlled as T) : internal, set];
}
