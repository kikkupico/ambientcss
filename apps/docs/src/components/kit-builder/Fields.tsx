/* Form primitives.
 *
 *  Deliberately plain HTML rather than Ambient controls: everything above the
 *  form is the kit being built, and a knob in the form would be a knob you
 *  cannot tell apart from the one you are designing. */

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="kb-field">
      <div className="kb-field-head">
        <span className="kb-field-label">{label}</span>
        {hint ? <span className="kb-field-hint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export type Option<T extends string> = { value: T; label: string; title?: string };

export function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  onChange
}: {
  label: string;
  hint?: string | undefined;
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="kb-segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={`kb-seg${option.value === value ? " kb-seg-on" : ""}`}
            title={option.title}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Check({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint?: string | undefined;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="kb-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="kb-check-label">
        {label}
        {hint ? <span className="kb-field-hint"> {hint}</span> : null}
      </span>
    </label>
  );
}

export function Range({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  format,
  onChange
}: {
  label: string;
  /** Overrides the value readout, for a number whose units need saying. */
  hint?: string | undefined;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (next: number) => void;
}) {
  return (
    <Field label={label} hint={hint ?? (format ? format(value) : String(value))}>
      <input
        className="kb-range"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

/** A colour with an "unset" state, because unset is a real answer: an
 *  optional colour left alone is inherited from the scene rather than being
 *  a colour of its own. */
export function ColorField({
  label,
  hint,
  value,
  fallback,
  unsetLabel = "inherit",
  onChange
}: {
  label: string;
  hint?: string | undefined;
  value: string | null;
  fallback: string;
  unsetLabel?: string;
  onChange: (next: string | null) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="kb-color">
        <input
          type="color"
          className="kb-color-swatch"
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <code className="kb-color-value">{value ?? unsetLabel}</code>
        <button
          type="button"
          className="kb-mini"
          onClick={() => onChange(value === null ? fallback : null)}
        >
          {value === null ? "set" : "clear"}
        </button>
      </div>
    </Field>
  );
}

/** A required colour — no unset state. */
export function SolidColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Field label={label} hint={value}>
      <input
        type="color"
        className="kb-color-swatch"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </Field>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint?: string | undefined;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="kb-text"
        type="text"
        value={value}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
