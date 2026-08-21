import { useId } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { BankKeyProvider, ControlStateProvider } from "../core/context";
import { Frames } from "../core/frames";
import { sizeProps, stateData, stateStyle } from "../core/types";
import type { ControlParts, ControlSize, ControlState } from "../core/types";
import { useBank } from "../core/useBank";
import type { BankOption, UseBankOptions } from "../core/useBank";

export type AmbientBankProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> &
  UseBankOptions & {
    /** Parts applied to every key. The bank's own frames go in `parts`. */
    keyParts?: ControlParts | undefined;
    parts?: ControlParts | undefined;
    size?: ControlSize | undefined;
    /** Lamp colour. Defaults to the scene's `--amb-highlight-color`. */
    color?: string | undefined;
    label?: ReactNode | undefined;
    /** Per-key override, for a bank whose keys are not interchangeable. */
    renderKey?: ((option: BankOption, on: boolean) => ReactNode) | undefined;
  };

function keyState(on: boolean, disabled: boolean): ControlState {
  return {
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
  };
}

/** N keys sharing a selection model, with no appearance of its own.
 *
 *  Parts apply per key rather than once, because that is what a bank is.
 *  The focusable element is the key `<button>`, which this mechanism
 *  renders — your parts go inside it, which is why the presentational-parts
 *  rule still holds here. */
export function AmbientBank({
  options,
  keyParts,
  parts,
  size,
  color,
  label,
  renderKey,
  className,
  style,
  value,
  defaultValue,
  onChange,
  multiple,
  orientation = "vertical",
  disabled = false,
  ...rest
}: AmbientBankProps) {
  const labelId = useId();
  const { selected, rootProps, keyProps } = useBank({
    options,
    value,
    defaultValue,
    onChange,
    multiple,
    orientation,
    disabled
  });

  const sized = sizeProps("bank", size);

  const bank = (
    <div
      {...rest}
      {...rootProps}
      aria-labelledby={label ? labelId : rest["aria-labelledby"]}
      className={cn(
        "ambx-control ambx-bank",
        `ambx-bank-${orientation}`,
        sized.className,
        className
      )}
      style={{
        ...(color ? ({ "--amb-led-color": color } as CSSProperties) : null),
        ...sized.style,
        ...style
      }}
    >
      <Frames parts={parts} />
      {options.map((option, index) => {
        const on = selected.includes(option.value);
        /* Each key publishes its own state channel, exactly as a standalone
           control does. Without this a key's parts would inherit the bank
           root's neutral --ambx-percent and a pure-CSS part could never see
           that its lamp is lit — the one family where "the properties are
           canonical" would quietly not be true. */
        const ks = keyState(on, option.disabled || disabled);
        return (
          <button
            key={option.value}
            {...keyProps(option, index)}
            {...stateData(ks)}
            className="ambx-key"
            style={{
              ...(stateStyle(ks) as CSSProperties),
              ...(option.color ? ({ "--amb-led-color": option.color } as CSSProperties) : null)
            }}
          >
            <ControlStateProvider value={ks}>
              <BankKeyProvider value={{ option, on, index }}>
                {renderKey ? renderKey(option, on) : <Frames parts={keyParts} />}
              </BankKeyProvider>
            </ControlStateProvider>
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
