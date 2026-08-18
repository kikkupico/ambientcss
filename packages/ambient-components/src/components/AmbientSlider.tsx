import { cn } from "../lib/cn";
import { AmbientTravel } from "../controls/AmbientTravel";
import type { AmbientTravelProps } from "../controls/AmbientTravel";
import type { AmbientMaterial } from "../core/material";
import { SliderThumb, TravelTrack } from "../parts/travel";

export type AmbientSliderSize = "sm" | "md" | "lg";

export type AmbientSliderProps = Omit<
  AmbientTravelProps,
  "parts" | "size" | "orientation"
> & {
  material?: AmbientMaterial | undefined;
  size?: AmbientSliderSize | undefined;
};

/** A domed disc gliding over a shallow concave channel. */
export function AmbientSlider({
  material,
  size = "md",
  className,
  ...rest
}: AmbientSliderProps) {
  return (
    <AmbientTravel
      {...rest}
      orientation="horizontal"
      size={size}
      className={cn("amb-slider", className)}
      parts={{
        base: <TravelTrack depth="channel" />,
        actuator: <SliderThumb material={material} />
      }}
    />
  );
}
