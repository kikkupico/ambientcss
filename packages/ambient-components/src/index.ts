export { AmbientProvider } from "./components/AmbientProvider";
export type { AmbientProviderProps, AmbientTheme } from "./components/AmbientProvider";

export { AmbientPanel } from "./components/AmbientPanel";
export type { AmbientPanelProps } from "./components/AmbientPanel";

export { AmbientRack } from "./components/AmbientRack";
export type { AmbientRackProps, AmbientRackGap } from "./components/AmbientRack";

/* ------------------------------------------------------------------ *\
   Presets — a mechanism with a set of parts already chosen. Start here.
\* ------------------------------------------------------------------ */

export { AmbientButton } from "./components/AmbientButton";
export type {
  AmbientButtonProps,
  AmbientButtonShape,
  AmbientButtonSize
} from "./components/AmbientButton";

export { AmbientSwitch } from "./components/AmbientSwitch";
export type { AmbientSwitchProps, AmbientSwitchSize } from "./components/AmbientSwitch";

export { AmbientSelect } from "./components/AmbientSelect";
export type {
  AmbientSelectProps,
  AmbientSelectOption,
  AmbientSelectSize,
  AmbientSelectOrientation
} from "./components/AmbientSelect";

export { AmbientKnob } from "./components/AmbientKnob";
export type {
  AmbientKnobProps,
  AmbientKnobMarkers,
  AmbientKnobIndicator,
  AmbientKnobSize
} from "./components/AmbientKnob";

export { AmbientFader } from "./components/AmbientFader";
export type { AmbientFaderProps, AmbientFaderSize } from "./components/AmbientFader";

export { AmbientSlider } from "./components/AmbientSlider";
export type { AmbientSliderProps, AmbientSliderSize } from "./components/AmbientSlider";

/* ------------------------------------------------------------------ *\
   Mechanisms — kinematics, state and ARIA with no appearance at all.
   Give one a set of parts and it becomes whatever you drew.
\* ------------------------------------------------------------------ */

export { AmbientRotary } from "./controls/AmbientRotary";
export type { AmbientRotaryProps } from "./controls/AmbientRotary";

export { AmbientTravel } from "./controls/AmbientTravel";
export type { AmbientTravelProps } from "./controls/AmbientTravel";

export { AmbientPress } from "./controls/AmbientPress";
export type { AmbientPressProps } from "./controls/AmbientPress";

export { AmbientLatch } from "./controls/AmbientLatch";
export type { AmbientLatchProps } from "./controls/AmbientLatch";

export { AmbientBank } from "./controls/AmbientBank";
export type { AmbientBankProps } from "./controls/AmbientBank";

/* ------------------------------------------------------------------ *\
   Hooks — the mechanism without the markup, for a control you render
   yourself from the ground up.
\* ------------------------------------------------------------------ */

export { useRotary } from "./core/useRotary";
export type { UseRotaryOptions, RotaryInput, RotaryTravel } from "./core/useRotary";

export { useTravel } from "./core/useTravel";
export type { UseTravelOptions, TravelOrientation } from "./core/useTravel";

export { usePress } from "./core/usePress";
export type { UsePressOptions, PressMode } from "./core/usePress";

export { useLatch } from "./core/useLatch";
export type { UseLatchOptions } from "./core/useLatch";

export { useBank } from "./core/useBank";
export type { UseBankOptions, BankOption, BankOrientation } from "./core/useBank";

/* ------------------------------------------------------------------ *\
   The state channel — read the enclosing control from inside a part.
   The custom properties on the control root are canonical; these are a
   typed view of the same values, for parts that need JS.
\* ------------------------------------------------------------------ */

export { useControlState, useBankKey } from "./core/context";
export type { BankKeyState } from "./core/context";
export type {
  ControlParts,
  ControlState,
  ControlSize,
  ControlAnimate,
  FrameName
} from "./core/types";
export type { AmbientMaterial } from "./core/material";

/* ------------------------------------------------------------------ *\
   Default parts. Nothing privileged about them — each is markup with
   some ambient classes, and a replacement of yours stands on exactly the
   same footing. They live in their own modules so an app that ships only
   its own parts does not pay for these.
\* ------------------------------------------------------------------ */

export { KnobBody, KnurledFace, IndicatorDot, IndicatorBar, ScaleRing } from "./parts/knob";
export type { ScaleRingProps } from "./parts/knob";
export { TravelTrack, FaderCap, SliderThumb } from "./parts/travel";
export { ButtonCap } from "./parts/press";
export { SwitchTrack, SwitchPill, Led } from "./parts/latch";
export { KeyLens, KeyCap } from "./parts/bank";
