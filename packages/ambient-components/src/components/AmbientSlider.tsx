import { cn } from "../lib/cn";
import { AmbientTravel } from "../controls/AmbientTravel";
import type { AmbientTravelProps } from "../controls/AmbientTravel";
import { useDress } from "../core/kit";
import type { KitLook } from "../core/kit";
import { groundedKit } from "../kits/grounded";
import type { AmbientMaterial } from "../core/material";

export type AmbientSliderSize = "sm" | "md" | "lg";

export type AmbientSliderProps = Omit<AmbientTravelProps, "parts" | "size" | "orientation"> & {
  material?: AmbientMaterial | undefined;
  size?: AmbientSliderSize | undefined;
  /** Look options in the active kit's vocabulary. */
  look?: KitLook | undefined;
};

/** A domed disc gliding over a shallow concave channel. */
export function AmbientSlider({
  material,
  look,
  size = "md",
  animate,
  className,
  ...rest
}: AmbientSliderProps) {
  const { dress, defaults } = useDress(
    "travel",
    { material, orientation: "horizontal", ...look },
    groundedKit.travel!
  );
  return (
    <AmbientTravel
      {...rest}
      orientation="horizontal"
      size={size}
      animate={animate ?? defaults?.animate}
      className={cn(dress.className, className)}
      parts={dress.parts}
    />
  );
}
