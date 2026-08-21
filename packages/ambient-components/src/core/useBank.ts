import { useCallback, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useControllableValue } from "./controllable";

export type BankOption = {
  value: string;
  /** Key legend — a numeral in the referent, but any node works. */
  label?: ReactNode | undefined;
  /** Accessible name, and the hover title. Needed whenever the legend is a
   *  glyph or an icon: a key reading "*" has no name otherwise. */
  ariaLabel?: string | undefined;
  /** Overrides the bank's lamp colour for this key only. */
  color?: string | undefined;
  disabled?: boolean | undefined;
};

export type BankOrientation = "vertical" | "horizontal";

export type UseBankOptions = {
  options: BankOption[];
  value?: string | string[] | undefined;
  defaultValue?: string | string[] | undefined;
  onChange?: ((value: string | string[]) => void) | undefined;
  /** Let more than one lamp be lit at a time. */
  multiple?: boolean | undefined;
  orientation?: BankOrientation | undefined;
  disabled?: boolean | undefined;
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** N presses sharing a selection model.
 *
 *  The roving tabindex, the radiogroup-versus-checkbox-group keyboard
 *  difference and the selection-follows-focus rule are the reason this
 *  mechanism exists: they are the part nobody should have to re-derive in
 *  order to change what a key looks like. */
export function useBank(options: UseBankOptions) {
  const { options: items, multiple = false, orientation = "vertical", disabled = false } = options;

  const [raw, setRaw] = useControllableValue<string | string[]>(
    options.value,
    options.defaultValue ?? (multiple ? [] : ""),
    options.onChange
  );
  const selected = toArray(raw);
  const keyRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const commit = useCallback(
    (next: string[]) => setRaw(multiple ? next : (next[0] ?? "")),
    [setRaw, multiple]
  );

  const select = useCallback(
    (option: BankOption | undefined) => {
      if (!option || option.disabled || disabled) return;
      if (!multiple) return commit([option.value]);
      commit(
        selected.includes(option.value)
          ? selected.filter((v) => v !== option.value)
          : [...selected, option.value]
      );
    },
    [commit, multiple, selected, disabled]
  );

  const enabled = items.filter((o) => !o.disabled);
  /* Roving tabindex: exactly one key is tab-reachable. The lit one owns the
     stop, so Tab lands where the eye already is; with nothing lit (or in
     multiple mode, where every lamp is independent) the first enabled key
     takes it. */
  const litIndex = items.findIndex((o) => selected.includes(o.value) && !o.disabled);
  const firstEnabled = items.findIndex((o) => !o.disabled);
  const tabStop = multiple ? -1 : litIndex >= 0 ? litIndex : firstEnabled;

  const focusAt = (index: number) => keyRefs.current[index]?.focus();

  const step = (from: number, delta: number) => {
    if (enabled.length === 0) return;
    let i = from;
    for (let guard = 0; guard < items.length; guard += 1) {
      i = (i + delta + items.length) % items.length;
      if (!items[i]?.disabled) break;
    }
    focusAt(i);
    /* A radio group moves selection with focus (WAI-ARIA radiogroup
       pattern); a checkbox group only moves focus, since each lamp toggles
       on its own. */
    if (!multiple) select(items[i]);
  };

  const edge = (which: "first" | "last") => {
    const i =
      which === "first" ? firstEnabled : items.map((o) => !o.disabled).lastIndexOf(true);
    if (i < 0) return;
    focusAt(i);
    if (!multiple) select(items[i]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const back = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    switch (event.key) {
      case back:
        event.preventDefault();
        step(index, -1);
        break;
      case forward:
        event.preventDefault();
        step(index, 1);
        break;
      case "Home":
        event.preventDefault();
        edge("first");
        break;
      case "End":
        event.preventDefault();
        edge("last");
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        select(items[index]);
        break;
      default:
        break;
    }
  };

  const rootProps = {
    role: multiple ? ("group" as const) : ("radiogroup" as const),
    "aria-orientation": multiple ? undefined : orientation,
    "aria-disabled": disabled || undefined,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined
  };

  /** Props for the key at `index`, including its own state channel. */
  const keyProps = (option: BankOption, index: number) => {
    const on = selected.includes(option.value);
    return {
      /* No `key` here on purpose: the caller maps the options, so it owns
         the list key. Spreading one into JSX makes React warn and drops
         the key on release builds. */
      type: "button" as const,
      ref: (node: HTMLButtonElement | null) => {
        keyRefs.current[index] = node;
      },
      role: multiple ? ("checkbox" as const) : ("radio" as const),
      "aria-checked": on,
      "aria-label": option.ariaLabel,
      title: option.ariaLabel,
      disabled: option.disabled || disabled,
      tabIndex: multiple ? 0 : index === tabStop ? 0 : -1,
      "data-on": on ? "" : undefined,
      onClick: () => select(option),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, index)
    };
  };

  return { selected, select, rootProps, keyProps };
}
