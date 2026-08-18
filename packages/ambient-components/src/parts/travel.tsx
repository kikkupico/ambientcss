import { cn } from "../lib/cn";
import type { AmbientMaterial } from "../core/material";

/** The track a thumb rides in.
 *
 *  Both grounded referents are grooves with a lume interior — dark in
 *  bright light, glowing in low light — but they are cut to different
 *  depths: a fader runs in a through-slot, a slider in a shallow concave
 *  channel (slider.py, 1mm deep = thickness 0.22). */
export function TravelTrack({
  depth = "slot",
  className
}: {
  depth?: "slot" | "channel" | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "amb-travel-track amb-groove",
        depth === "channel" && "amb-travel-track-channel",
        className
      )}
    />
  );
}

/** Fader cap: the referent (fader.py) is a pill on a stem — 7mm tall
 *  (thickness 1.5) riding 2.2mm above the plate (elevation 0.28) — with a
 *  single grip line across the top. */
export function FaderCap({
  material,
  className
}: {
  material?: AmbientMaterial | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "amb-fader-thumb ambient amb-fillet",
        material !== "glass" && "amb-surface-concave",
        material && `amb-mat-${material}`,
        className
      )}
    >
      <span className="amb-fader-gripline" />
    </span>
  );
}

/** Slider thumb: a domed disc gliding over the channel. */
export function SliderThumb({
  material,
  className
}: {
  material?: AmbientMaterial | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "amb-slider-thumb ambient amb-fillet",
        material !== "glass" && "amb-surface-convex",
        material && `amb-mat-${material}`,
        className
      )}
    />
  );
}
