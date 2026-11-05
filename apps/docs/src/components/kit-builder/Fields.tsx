/* Form primitives for the inspector.
 *
 *  Plain HTML on purpose: everything on the stage is the kit being built,
 *  and a knob in the form would be a knob you cannot tell apart from the one
 *  you are designing. They follow the docs site's own colours, so the tool
 *  reads as a tool in both light and dark mode. */

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";

/* ── Layout ───────────────────────────────────────────────────────────── */

/** A titled, collapsible group of fields. */
export function Section({
  title,
  children,
  defaultOpen = true,
  aside
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  aside?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`kb-section${open ? " kb-section-open" : ""}`}>
      <div className="kb-section-head">
        <button
          type="button"
          className="kb-section-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((on) => !on)}
        >
          <span className="kb-caret" aria-hidden />
          {title}
        </button>
        {aside}
      </div>
      {open ? (
        <div className="kb-section-body" id={id}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

/** One labelled field. The hint sits under the control, in plain words. */
export function Row({
  label,
  hint,
  htmlFor,
  stacked = false,
  children
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  /** Label above rather than beside — for controls that need the width. */
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`kb-row${stacked ? " kb-row-stacked" : ""}`}>
      {htmlFor ? (
        <label className="kb-row-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="kb-row-label">{label}</span>
      )}
      <div className="kb-row-control">
        {children}
        {hint ? <p className="kb-hint">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Note({ children, tone }: { children: ReactNode; tone?: "warn" }) {
  return <p className={`kb-note${tone === "warn" ? " kb-note-warn" : ""}`}>{children}</p>;
}

/* ── Controls ─────────────────────────────────────────────────────────── */

export type Option<T extends string> = { value: T; label: string; title?: string };

export function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  stacked
}: {
  label: string;
  hint?: ReactNode;
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
  stacked?: boolean;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <Row label={label} hint={hint ?? current?.title} stacked={stacked ?? options.length > 4}>
      <div className="kb-seg-group" role="radiogroup" aria-label={label}>
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
    </Row>
  );
}

export function Select<T extends string>({
  label,
  hint,
  value,
  options,
  onChange
}: {
  label: string;
  hint?: ReactNode;
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
}) {
  const id = useId();
  const current = options.find((option) => option.value === value);
  return (
    <Row label={label} hint={hint ?? current?.title} htmlFor={id}>
      <select
        id={id}
        className="kb-select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Row>
  );
}

/** An on/off switch. */
export function Toggle({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <Row label={label} hint={hint} htmlFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`kb-switch${checked ? " kb-switch-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="kb-switch-thumb" aria-hidden />
        <span className="kb-switch-text">{checked ? "On" : "Off"}</span>
      </button>
    </Row>
  );
}

/** A slider with a typed value beside it, for when dragging to 0.27 is
 *  harder than typing it. */
export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange
}: {
  label: string;
  hint?: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = (String(step).split(".")[1] ?? "").length;
  const shown = draft ?? value.toFixed(decimals).replace(/\.?0+$/, (m) => (decimals ? "" : m));
  const pct = ((value - min) / (max - min)) * 100;

  const commit = (raw: string) => {
    setDraft(null);
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    onChange(Math.min(max, Math.max(min, parsed)));
  };

  return (
    <Row label={label} hint={hint} htmlFor={id}>
      <div className="kb-slider">
        <input
          id={id}
          className="kb-range"
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          style={{ "--kb-pct": `${Math.max(0, Math.min(100, pct))}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="kb-number-wrap">
          <input
            className="kb-number"
            type="text"
            inputMode="decimal"
            aria-label={`${label} value`}
            value={shown}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
              if (e.key === "Escape") setDraft(null);
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const delta = (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
                onChange(Math.min(max, Math.max(min, Number((value + delta).toFixed(6)))));
              }
            }}
          />
          {unit ? <span className="kb-unit">{unit}</span> : null}
        </span>
      </div>
    </Row>
  );
}

/** A slider that can also be left unset — "unset" is a real answer when the
 *  library class underneath already has an opinion. */
export function OptionalSlider({
  label,
  hint,
  value,
  fallback,
  onChange,
  ...range
}: {
  label: string;
  hint?: ReactNode;
  value: number | null;
  fallback: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number | null) => void;
}) {
  if (value === null) {
    return (
      <Row label={label} hint={hint}>
        <button type="button" className="kb-unset" onClick={() => onChange(fallback)}>
          <span>Default</span>
          <span className="kb-unset-action">Set</span>
        </button>
      </Row>
    );
  }
  return (
    <div className="kb-optional">
      <Slider label={label} hint={hint} value={value} onChange={onChange} {...range} />
      <button type="button" className="kb-link kb-optional-clear" onClick={() => onChange(null)}>
        Use default
      </button>
    </div>
  );
}

function normaliseHex(raw: string): string | null {
  const value = raw.trim().replace(/^#?/, "#");
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

/** A colour, with a hex field beside the swatch. `unsetLabel` makes it
 *  optional: an optional colour left alone is inherited, not a colour. */
export function ColorInput({
  label,
  hint,
  value,
  fallback,
  unsetLabel,
  onChange
}: {
  label: string;
  hint?: ReactNode;
  value: string | null;
  fallback?: string;
  unsetLabel?: string;
  onChange: (next: string | null) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = value ?? fallback ?? "#000000";

  if (value === null && unsetLabel) {
    return (
      <Row label={label} hint={hint}>
        <button type="button" className="kb-unset" onClick={() => onChange(fallback ?? "#000000")}>
          <span>{unsetLabel}</span>
          <span className="kb-unset-action">Set</span>
        </button>
      </Row>
    );
  }

  return (
    <Row label={label} hint={hint} htmlFor={id}>
      <div className="kb-color">
        <input
          type="color"
          className="kb-swatch"
          value={shown}
          aria-label={`${label} picker`}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          id={id}
          className="kb-text kb-hex"
          type="text"
          spellCheck={false}
          value={draft ?? shown}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normaliseHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
        />
        {unsetLabel ? (
          <button type="button" className="kb-link" onClick={() => onChange(null)}>
            Clear
          </button>
        ) : null}
      </div>
    </Row>
  );
}

export function TextInput({
  label,
  hint,
  value,
  placeholder,
  mono,
  onChange
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  placeholder?: string;
  mono?: boolean;
  onChange: (next: string) => void;
}) {
  const id = useId();
  return (
    <Row label={label} hint={hint} htmlFor={id}>
      <input
        id={id}
        className={`kb-text${mono ? " kb-mono" : ""}`}
        type="text"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </Row>
  );
}

/* ── Light direction ──────────────────────────────────────────────────── */

const PAD_INSET = 14;

/** Where the light comes from, as a point you drag on a pad rather than two
 *  sliders you have to hold in your head together. -1..1 on both axes;
 *  arrow keys nudge by 0.1. */
export function LightPad({
  x,
  y,
  onChange
}: {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
}) {
  const pad = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const round = (v: number) => Math.round(Math.max(-1, Math.min(1, v)) * 10) / 10;

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = pad.current?.getBoundingClientRect();
    if (!box) return;
    /* The lamp travels inside an inset square, so that at a corner it still
       sits on the pad rather than hanging half off it. */
    const nx = ((event.clientX - box.left - PAD_INSET) / (box.width - PAD_INSET * 2)) * 2 - 1;
    const ny = ((event.clientY - box.top - PAD_INSET) / (box.height - PAD_INSET * 2)) * 2 - 1;
    onChange(round(nx), round(ny));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.5 : 0.1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange(round(x + move[0]), round(y + move[1]));
  };

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
    };
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  return (
    <Row label="Direction" hint="Drag the lamp, or use the arrow keys." stacked>
      <div className="kb-lightpad-wrap">
        <div
          ref={pad}
          className="kb-lightpad"
          role="slider"
          tabIndex={0}
          aria-label="Light direction"
          aria-valuetext={`x ${x.toFixed(1)}, y ${y.toFixed(1)}`}
          onKeyDown={onKey}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            fromPointer(event);
          }}
          onPointerMove={(event) => {
            if (dragging.current) fromPointer(event);
          }}
        >
          <span className="kb-lightpad-cross" aria-hidden />
          <span className="kb-lightpad-subject" aria-hidden />
          <span
            className="kb-lightpad-lamp"
            aria-hidden
            style={{
              left: `calc(${PAD_INSET}px + (100% - ${PAD_INSET * 2}px) * ${(x + 1) / 2})`,
              top: `calc(${PAD_INSET}px + (100% - ${PAD_INSET * 2}px) * ${(y + 1) / 2})`
            }}
          />
        </div>
        <div className="kb-lightpad-values">
          <span>
            x <strong>{x.toFixed(1)}</strong>
          </span>
          <span>
            y <strong>{y.toFixed(1)}</strong>
          </span>
          <button type="button" className="kb-link" onClick={() => onChange(-1, -1)}>
            Top-left
          </button>
        </div>
      </div>
    </Row>
  );
}
