import { useId, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientSwitchSize = "sm" | "md" | "lg";

export type AmbientSwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: AmbientSwitchSize;
  label?: string;
  /** Show a small LED indicator that lights up when the switch is on. Pass `true` for default green or a CSS color string. */
  led?: boolean | string;
};

export function AmbientSwitch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onClick,
  size = "md",
  label,
  led,
  children,
  ...props
}: AmbientSwitchProps) {
  const labelId = useId();
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const active = isControlled ? (checked ?? false) : internalChecked;

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-labelledby={label ? labelId : props["aria-labelledby"]}
      className={cn(
        "ambient amb-switch amb-chamfer amb-elevation-1 amb-heading-3",
        active ? "amb-surface-convex amb-switch-on" : "amb-surface-concave",
        "ambx-switch",
        `ambx-switch-${size}`,
        className
      )}
      onClick={(event) => {
        const next = !active;
        if (!isControlled) setInternalChecked(next);
        onCheckedChange?.(next);
        onClick?.(event);
      }}
      {...props}
    >
      {led ? (
        <span
          className={cn("amb-led", !active && "amb-led-off")}
          style={typeof led === "string" ? { "--amb-led-color": led } as React.CSSProperties : undefined}
        />
      ) : null}
      {children}
    </button>
  );

  if (!label) return button;

  return (
    <div className="ambx-stack">
      {button}
      <span id={labelId} className="ambx-label">
        {label}
      </span>
    </div>
  );
}
