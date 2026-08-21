import { useId } from "react";
import { cn } from "../lib/cn";
import { AmbientLatch } from "../controls/AmbientLatch";
import type { AmbientLatchProps } from "../controls/AmbientLatch";
import { useControllableValue } from "../core/controllable";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import { groundedKit } from "../kits/grounded";
import { Led } from "../parts/latch";

export type AmbientSwitchSize = "sm" | "md" | "lg";

export type AmbientSwitchProps = Omit<AmbientLatchProps, "parts" | "size"> & {
  size?: AmbientSwitchSize | undefined;
  /** A lamp above the switch. `true` for the scene's own colour, or any
   *  CSS colour string. */
  led?: boolean | string | undefined;
  /** Look options in the active kit's vocabulary. */
  look?: KitLook | undefined;
};

/** A pill sliding in a dark stadium recess, with an optional lamp above.
 *
 *  The lamp is mounted beside the switch rather than inside it: the latch
 *  control IS the track, so anything that is neither track nor pill belongs
 *  to whatever composes them. That means the preset has to hold the state —
 *  the lamp and the pill read the same boolean, and only their common
 *  parent can see both.
 */
export function AmbientSwitch({
  size = "md",
  led,
  label,
  look,
  value,
  defaultValue,
  onChange,
  animate,
  className,
  ...rest
}: AmbientSwitchProps) {
  const labelId = useId();
  const [on, setOn] = useControllableValue(value, defaultValue ?? false, onChange);
  const { dress, defaults } = useDress("latch", { ...look }, groundedKit.latch!);

  const control = (
    <AmbientLatch
      {...rest}
      value={on}
      onChange={setOn}
      size={size}
      animate={animate ?? defaults?.animate}
      aria-labelledby={label ? labelId : rest["aria-labelledby"]}
      className={cn(dress.className, className)}
      parts={dress.parts}
    />
  );

  if (!led && !label) return control;

  return (
    <div className="ambx-stack">
      {led ? (
        <span className="ambx-switch-mount">
          <Led on={on} {...(typeof led === "string" ? { color: led } : null)} />
          {control}
        </span>
      ) : (
        control
      )}
      {label ? (
        <span id={labelId} className="ambx-label">
          {label}
        </span>
      ) : null}
    </div>
  );
}
