import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type AmbientSwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function AmbientSwitch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onClick,
  ...props
}: AmbientSwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const active = isControlled ? (checked ?? false) : internalChecked;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      className={cn(
        "ambient amb-switch amb-chamfer amb-elevation-1",
        active ? "amb-surface-convex amb-switch-on" : "amb-surface-concave",
        "ambx-switch",
        className
      )}
      onClick={(event) => {
        const next = !active;
        if (!isControlled) setInternalChecked(next);
        onCheckedChange?.(next);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
