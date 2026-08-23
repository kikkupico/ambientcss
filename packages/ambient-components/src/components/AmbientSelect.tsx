import { cn } from "../lib/cn";
import { AmbientBank } from "../controls/AmbientBank";
import type { AmbientBankProps } from "../controls/AmbientBank";
import type { BankOption, BankOrientation } from "../core/useBank";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import { groundedKit } from "../kits/grounded";

export type AmbientSelectOption = BankOption;
export type AmbientSelectOrientation = BankOrientation;
export type AmbientSelectSize = "sm" | "md" | "lg";

export type AmbientSelectProps = Omit<
  AmbientBankProps,
  "keyParts" | "keyPartsOn" | "keyPartsOff" | "parts" | "size"
> & {
  size?: AmbientSelectSize | undefined;
  /** Look options in the active kit's vocabulary. */
  look?: KitLook | undefined;
};

/**
 * A bank of keys sharing a selection model, dressed by the active kit.
 *
 * The grounded default (`look.shape` unset, or `"key"`) is lamp-lit keys in
 * a shared rail — the hardware idiom for a mode selector, where the state
 * is a lamp rather than a mark. Three physical layers per key, and the
 * ORDER is the whole trick: the key itself is the pocket floor, the lens is
 * a disc lying on it, and the cap is a translucent diffuser over both. The
 * cap is `.amb-mat-glass`, so its backdrop-filter blurs the lens behind it
 * — which is why the lens goes in the `base` frame and the cap in
 * `actuator`, and why swapping them would put out every lamp.
 *
 * `look={{ shape: "round" }}` swaps in the other grounded reading: a row of
 * ordinary round pushbuttons with no shared rail, Dieter Rams-style, where
 * the lit key is a different cast (a glossy cap) rather than the same cap
 * lit from behind — the case `AmbientBank`'s `keyPartsOn` / `keyPartsOff`
 * exists for.
 */
export function AmbientSelect({ size = "md", look, className, ...rest }: AmbientSelectProps) {
  const { dress } = useDress("bank", { ...look }, groundedKit.bank!);
  return (
    <AmbientBank
      {...rest}
      size={size}
      className={cn(dress.className, className)}
      parts={dress.panelParts}
      keyParts={dress.parts}
      keyPartsOn={dress.onParts}
      keyPartsOff={dress.offParts}
    />
  );
}
