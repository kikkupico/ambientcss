import { cn } from "../lib/cn";
import { AmbientTravel } from "../controls/AmbientTravel";
import type { AmbientTravelProps } from "../controls/AmbientTravel";
import type { AmbientMaterial } from "../core/material";
import { FaderCap, TravelTrack } from "../parts/travel";

export type AmbientFaderSize = "sm" | "md" | "lg";

export type AmbientFaderProps = Omit<AmbientTravelProps, "parts" | "size" | "orientation"> & {
  material?: AmbientMaterial | undefined;
  size?: AmbientFaderSize | undefined;
};

/** A pill cap on a stem, riding an upright slot. Min is at the bottom,
 *  which `AmbientTravel` already does for a vertical track. */
export function AmbientFader({ material, size = "md", className, ...rest }: AmbientFaderProps) {
  return (
    <AmbientTravel
      {...rest}
      orientation="vertical"
      size={size}
      className={cn("amb-fader", className)}
      parts={{
        base: <TravelTrack />,
        actuator: <FaderCap material={material} />
      }}
    />
  );
}
