import { cn } from "../lib/cn";
import type { ControlKit, KitDress, KitLook } from "../core/kit";
import type { AmbientMaterial } from "../core/material";
import { IndicatorBar, IndicatorDot, KnobBody, KnurledFace, ScaleRing } from "../parts/knob";
import { FaderCap, SliderThumb, TravelTrack } from "../parts/travel";
import { ButtonCap } from "../parts/press";
import { SwitchPill, SwitchTrack } from "../parts/latch";
import { KeyCap, KeyLens } from "../parts/bank";

/* The built-in look, packaged as a kit rather than hardwired into the
   presets. That is the integrity test for the whole idea: if the grounded
   parts needed a private back door the presets could reach and a third party
   could not, the abstraction would be a fiction. They do not — everything
   below is the same `(look) => { parts, className }` a published kit writes. */

/* 12 divisions — 13 dots over the sweep, the pitch measured off the
   reference panel. */
const FULL_MARKERS = 13;

function rotary(look: KitLook): KitDress {
  const material = look.material as AmbientMaterial | undefined;
  const knurling = look.knurling !== false;
  const knurlColor = look.knurlColor as string | undefined;
  const markers = (look.markers as "none" | "ends" | "full" | undefined) ?? "none";
  const indicator = (look.indicator as "circle" | "rectangle" | undefined) ?? "circle";

  return {
    /* The full ring reaches past the knob's own box, so its layout clearance
       has to be reserved — and only the kit knows it put a ring there. */
    className: cn("amb-knob", markers === "full" && "amb-knob-markers-full"),
    parts: {
      panel:
        markers === "none" ? null : <ScaleRing count={markers === "ends" ? 2 : FULL_MARKERS} />,
      /* `material` goes on every element that paints. The cap always does —
         it is the knob's top face either way — and the knurl ring does too
         when there is one, so a knurled knob's rim and cap are the same
         material rather than the rim being the only thing wearing it.

         `knurlColor` is the one thing the ring may hold on its own: a
         two-tone knob — dark grip round a pale cap — is a real piece of
         hardware, and the cap has no matching prop because the cap's colour
         is the control's colour, set the ordinary way with --amb-albedo. */
      base: <KnobBody flush={!knurling} material={material} />,
      actuator: (
        <>
          {knurling ? <KnurledFace material={material} color={knurlColor} /> : null}
          {indicator === "circle" ? <IndicatorDot /> : <IndicatorBar />}
        </>
      )
    }
  };
}

function travel(look: KitLook): KitDress {
  const material = look.material as AmbientMaterial | undefined;
  const upright = look.orientation === "vertical";
  return {
    className: upright ? "amb-fader" : "amb-slider",
    parts: {
      base: <TravelTrack depth={upright ? "slot" : "channel"} />,
      actuator: upright ? <FaderCap material={material} /> : <SliderThumb material={material} />
    }
  };
}

function press(look: KitLook): KitDress {
  const shape = (look.shape as "pill" | "round" | "square" | undefined) ?? "pill";
  return {
    className: cn(
      "amb-button amb-groove",
      shape === "round" && "amb-button-round",
      shape === "square" && "amb-button-square"
    ),
    parts: {
      actuator: (
        <ButtonCap material={(look.material as AmbientMaterial | undefined) ?? "matte"}>
          {look.children as React.ReactNode}
        </ButtonCap>
      )
    }
  };
}

function latch(): KitDress {
  return {
    className: "amb-switch",
    parts: { base: <SwitchTrack />, actuator: <SwitchPill /> }
  };
}

function bank(): KitDress {
  return {
    className: "amb-select amb-groove",
    parts: { base: <KeyLens />, actuator: <KeyCap /> }
  };
}

/** The Blender-grounded hardware look: the default every preset falls back to. */
export const groundedKit: ControlKit = {
  name: "grounded",
  rotary,
  travel,
  press,
  latch,
  bank,
  looks: {
    rotary: ["material", "knurling", "knurlColor", "markers", "indicator"],
    travel: ["material", "orientation"],
    press: ["material", "shape", "children"],
    latch: [],
    bank: []
  }
};
