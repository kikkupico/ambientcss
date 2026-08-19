import { cn } from "../lib/cn";
import { AmbientTravel } from "../controls/AmbientTravel";
import type { AmbientTravelProps } from "../controls/AmbientTravel";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import { groundedKit } from "../kits/grounded";
import type { AmbientMaterial } from "../core/material";

export type AmbientFaderSize = "sm" | "md" | "lg";

export type AmbientFaderProps = Omit<AmbientTravelProps, "parts" | "size" | "orientation"> & {
  material?: AmbientMaterial | undefined;
  size?: AmbientFaderSize | undefined;
  /** Look options in the active kit's vocabulary. */
  look?: KitLook | undefined;
};

/** A pill cap on a stem, riding an upright slot. Min is at the bottom,
 *  which `AmbientTravel` already does for a vertical track. */
export function AmbientFader({
  material,
  look,
  size = "md",
  animate,
  className,
  ...rest
}: AmbientFaderProps) {
  const { dress, defaults } = useDress(
    "travel",
    { material, orientation: "vertical", ...look },
    groundedKit.travel!
  );
  return (
    <AmbientTravel
      {...rest}
      orientation="vertical"
      size={size}
      animate={animate ?? defaults?.animate}
      className={cn(dress.className, className)}
      parts={dress.parts}
    />
  );
}
