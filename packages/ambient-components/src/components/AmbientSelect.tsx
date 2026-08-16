import { useId, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../lib/cn";

export type AmbientSelectSize = "sm" | "md" | "lg";
export type AmbientSelectOrientation = "vertical" | "horizontal";

export type AmbientSelectOption = {
  value: string;
  /** Cap legend — a numeral in the referent, but any node works. */
  label?: ReactNode;
  /** Overrides the group's lamp colour for this option only. */
  color?: string;
  disabled?: boolean;
};

export type AmbientSelectProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> & {
  options: AmbientSelectOption[];
  /** Selected value(s). A string for single select, an array when `multiple`. */
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  /** Let more than one lamp be lit at a time. */
  multiple?: boolean;
  orientation?: AmbientSelectOrientation;
  size?: AmbientSelectSize;
  /** Lamp colour. Defaults to the scene's `--amb-highlight-color`. */
  color?: string;
  /** Accessible name for the bank. */
  label?: string;
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function AmbientSelect({
  options,
  value,
  defaultValue,
  onChange,
  multiple = false,
  orientation = "vertical",
  size = "md",
  color,
  label,
  className,
  style,
  ...props
}: AmbientSelectProps) {
  const labelId = useId();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(() => toArray(defaultValue));
  const selected = isControlled ? toArray(value) : internal;
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const commit = (next: string[]) => {
    if (!isControlled) setInternal(next);
    onChange?.(multiple ? next : (next[0] ?? ""));
  };

  const select = (option: AmbientSelectOption | undefined) => {
    if (!option || option.disabled) return;
    if (!multiple) return commit([option.value]);
    commit(
      selected.includes(option.value)
        ? selected.filter((v) => v !== option.value)
        : [...selected, option.value]
    );
  };

  const enabled = options.filter((o) => !o.disabled);
  /* Roving tabindex: exactly one option is tab-reachable. The lit one owns
     the stop, so Tab lands where the eye already is; with nothing lit (or
     in multiple mode, where every lamp is independent) the first enabled
     option takes it. */
  const tabStop = multiple
    ? -1
    : options.findIndex((o) => selected.includes(o.value) && !o.disabled);
  const firstEnabled = options.findIndex((o) => !o.disabled);

  const focusAt = (index: number) => {
    const target = optionRefs.current[index];
    target?.focus();
    return target;
  };

  const step = (from: number, delta: number) => {
    if (enabled.length === 0) return;
    let i = from;
    for (let guard = 0; guard < options.length; guard += 1) {
      i = (i + delta + options.length) % options.length;
      if (!options[i]?.disabled) break;
    }
    focusAt(i);
    /* A radio group moves selection with focus (WAI-ARIA radiogroup
       pattern); a checkbox group only moves focus, since each lamp
       toggles on its own. */
    if (!multiple) select(options[i]);
  };

  const edge = (which: "first" | "last") => {
    const i = which === "first" ? firstEnabled : options.map((o) => !o.disabled).lastIndexOf(true);
    if (i < 0) return;
    focusAt(i);
    if (!multiple) select(options[i]);
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
        select(options[index]);
        break;
      default:
        break;
    }
  };

  const bank = (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-labelledby={label ? labelId : props["aria-labelledby"]}
      aria-orientation={multiple ? undefined : orientation}
      className={cn(
        "amb-select amb-groove",
        orientation === "horizontal" && "amb-select-horizontal",
        "ambx-select",
        `ambx-select-${size}`,
        className
      )}
      style={
        color ? ({ "--amb-led-color": color, ...style } as CSSProperties) : style
      }
      {...props}
    >
      {options.map((option, index) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            disabled={option.disabled}
            tabIndex={
              multiple ? 0 : index === (tabStop >= 0 ? tabStop : firstEnabled) ? 0 : -1
            }
            className={cn("amb-select-option", on && "amb-select-on")}
            style={
              option.color
                ? ({ "--amb-led-color": option.color } as CSSProperties)
                : undefined
            }
            onClick={() => select(option)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span className="amb-select-lens" />
            <span className="amb-select-cap ambient amb-chamfer amb-mat-glass">
              {option.label ?? option.value}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (!label) return bank;

  return (
    <div className="ambx-stack">
      {bank}
      <span id={labelId} className="ambx-label">
        {label}
      </span>
    </div>
  );
}
