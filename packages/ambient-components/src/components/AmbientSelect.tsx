import { cn } from "../lib/cn";
import { AmbientBank } from "../controls/AmbientBank";
import type { AmbientBankProps } from "../controls/AmbientBank";
import type { BankOption, BankOrientation } from "../core/useBank";
import { KeyCap, KeyLens } from "../parts/bank";

export type AmbientSelectOption = BankOption;
export type AmbientSelectOrientation = BankOrientation;
export type AmbientSelectSize = "sm" | "md" | "lg";

export type AmbientSelectProps = Omit<AmbientBankProps, "keyParts" | "parts" | "size"> & {
  size?: AmbientSelectSize | undefined;
};

/**
 * A bank of lamp-lit keys in a shared rail — the hardware idiom for a
 * mode selector, where the state is a lamp rather than a mark.
 *
 * Three physical layers per key, and the ORDER is the whole trick: the key
 * itself is the pocket floor, the lens is a disc lying on it, and the cap
 * is a translucent diffuser over both. The cap is `.amb-mat-glass`, so its
 * backdrop-filter blurs the lens behind it — which is why the lens goes in
 * the `base` frame and the cap in `actuator`, and why swapping them would
 * put out every lamp.
 */
export function AmbientSelect({ size = "md", className, ...rest }: AmbientSelectProps) {
  return (
    <AmbientBank
      {...rest}
      size={size}
      className={cn("amb-select amb-groove", className)}
      keyParts={{ base: <KeyLens />, actuator: <KeyCap /> }}
    />
  );
}
