import { CSSProperties } from "react";
import { AmbientSwitch } from "@ambientcss/components";

type DayNightWatchSwitchProps = {
  night: boolean;
  onToggle: (night: boolean) => void;
};

export function DayNightWatchSwitch({ night, onToggle }: DayNightWatchSwitchProps) {
  const day = !night;
  const style = { "--dn-progress": day ? 0 : 1 } as CSSProperties;

  return (
    <AmbientSwitch
      checked={day}
      size="lg"
      aria-label={day ? "Switch to night mode" : "Switch to day mode"}
      className="day-night-watch"
      style={style}
      onCheckedChange={(nextDay) => onToggle(!nextDay)}
    >
      <span className="day-night-watch__icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="day-night-watch__icon day-night-watch__icon--sun">
          <circle cx="12" cy="12" r="4.25" />
          <path d="M12 2.5v2.5M12 19v2.5M21.5 12H19M5 12H2.5M18.72 5.28l-1.77 1.77M7.05 16.95l-1.77 1.77M18.72 18.72l-1.77-1.77M7.05 7.05L5.28 5.28" />
        </svg>
        <svg viewBox="0 0 24 24" className="day-night-watch__icon day-night-watch__icon--moon">
          <path d="M20 13.2a8.5 8.5 0 1 1-9.2-9.2 7 7 0 1 0 9.2 9.2z" />
        </svg>
      </span>
    </AmbientSwitch>
  );
}
