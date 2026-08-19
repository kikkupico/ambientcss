import { cn } from "../lib/cn";
import { AmbientKnob } from "../components/AmbientKnob";
import type { AmbientKnobProps } from "../components/AmbientKnob";
import { AmbientSwitch } from "../components/AmbientSwitch";
import type { AmbientSwitchProps } from "../components/AmbientSwitch";
import type { ControlKit, KitDress, KitLook } from "../core/kit";
import { ConsoleBar, ConsoleMarks, ConsoleWell, ToggleThumb, ToggleTrack } from "../parts/console";

/**
 * A mixer-desk visual identity: cuboid bar knobs seated in a circular
 * groove, and pill toggles that light up with the panel accent.
 *
 * It dresses two families and leaves the other three to fall through to
 * `grounded` — which is what a real third-party kit looks like. A kit is not
 * obliged to have an opinion about everything.
 */

function rotary(look: KitLook): KitDress {
  const mark = look.mark !== false;
  const legend = look.legend !== false;
  return {
    className: cn(
      "amb-console-knob",
      mark && "amb-console-knob-marked",
      legend && "amb-console-knob-legended"
    ),
    parts: {
      panel: mark || legend ? <ConsoleMarks mark={mark} legend={legend} /> : null,
      base: <ConsoleWell />,
      actuator: <ConsoleBar />
    }
  };
}

function latch(): KitDress {
  return {
    className: "amb-console-toggle",
    parts: { base: <ToggleTrack />, actuator: <ToggleThumb /> }
  };
}

export const consoleKit: ControlKit = {
  name: "console",
  rotary,
  latch,
  /* A visual identity may say how its controls feel to turn. The desk knob
     this is drawn from is an absolute-position pot with a centre detent, so
     it grabs where you press rather than tracking a drag. */
  defaults: {
    rotary: { input: "angle", travel: 280 }
  },
  looks: {
    rotary: ["mark", "legend"],
    latch: []
  }
};

/* A kit can also ship presets of its own. They are three lines each — the
   shared preset with this kit's look vocabulary typed — and they are how a
   kit gives its own words the same compile-time checking `knurling` gets. */

export type ConsoleKnobProps = Omit<AmbientKnobProps, "look" | "material" | "knurling" | "markers" | "indicator"> & {
  /** The accent centre mark printed above the knob. */
  mark?: boolean | undefined;
  /** The −/+ legends at the ends of the travel. */
  legend?: boolean | undefined;
};

export function ConsoleKnob({ mark, legend, ...rest }: ConsoleKnobProps) {
  return <AmbientKnob {...rest} look={{ mark, legend }} />;
}

export type ConsoleToggleProps = Omit<AmbientSwitchProps, "look">;

export function ConsoleToggle(props: ConsoleToggleProps) {
  return <AmbientSwitch {...props} />;
}
