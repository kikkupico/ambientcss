import { StrictMode, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import {
  AmbientProvider,
  AmbientButton,
  AmbientKnob,
  AmbientSlider,
  AmbientSwitch,
  AmbientFader,
  type AmbientKnobVariant,
  type AmbientButtonShape,
} from "@ambientcss/components";
import "@ambientcss/css/ambient.css";
import "@ambientcss/components/styles.css";

import { LAYOUTS, type Component, type Layout } from "./layouts";

const params = new URLSearchParams(location.search);
const name = params.get("layout") ?? "panel";
const base: Layout = LAYOUTS[name] ?? LAYOUTS.panel!;

/* ?kind=button&variant=square replaces the layout's contents with that one
   component, centred. Paired with the gate layout it reproduces the framing
   of ambient3d/renders/components/<name>.png, so a CSS change can be diffed
   against the referent it is supposed to match — at the component's own
   size, not magnified by the hero panel. */
const kind = params.get("kind");
const layout: Layout = kind
  ? {
      ...base,
      components: [
        {
          id: "only",
          kind: kind as Component["kind"],
          x: 0,
          y: 0,
          ...(params.get("variant") ? { variant: params.get("variant")! } : {}),
          value: Number(params.get("value") ?? 0.33),
        },
      ],
    }
  : base;
const [frameW, frameH] = layout.frameMm;

/* The rig's screen mapping is sx = X, sy = -Y (ambient3d/amb_params.py) —
   Blender +y is up, the DOM's +y is down, so the vertical term flips. Each
   node is centred on its point, matching the referents, which are built
   centred on their `location`. */
function place({ x, y }: Component | { x: number; y: number }): CSSProperties {
  return {
    position: "absolute",
    left: `${frameW / 2 + x}px`,
    top: `${frameH / 2 - y}px`,
    transform: "translate(-50%, -50%)",
  };
}

/* The device body: the calibration plate, which in CSS is just a box with a
   chamfered edge at the same thickness and elevation. Everything else is
   positioned over it in the frame's own coordinates, so the controls need no
   knowledge of it. */
function Body({ body }: { body: NonNullable<Layout["body"]> }) {
  return (
    <div
      className="ambient amb-surface amb-chamfer-2"
      style={{
        ...place({ x: 0, y: 0 }),
        width: `${body.size[0]}px`,
        height: `${body.size[1]}px`,
        ["--amb-thickness" as string]: body.amb.thickness,
        ["--amb-elevation" as string]: body.amb.elevation,
      }}
    />
  );
}

/* The display cutout: a recess in the faceplate with a dark floor. The
   groove's own rule paints a neutral floor and is declared after the
   surface classes, so the interior colour has to come from the element —
   `--amb-lume` is what the shipped slider and fader tracks use for exactly
   this, and it lands on the accent albedo the referents are built in. */
function Screen({ spec }: { spec: Component }) {
  const [w, h] = spec.size ?? [0, 0];
  return (
    <div
      className="amb-groove"
      style={{
        ...place(spec),
        width: `${w}px`,
        height: `${h}px`,
        backgroundColor: "var(--amb-lume)",
        ["--amb-thickness" as string]: spec.amb?.thickness ?? 1,
      }}
    />
  );
}

/* Every control is rendered read-only: no state, no handlers. The value is
   the referent's `value` (0..1) scaled to the components' 0..100 range. */
function Control({ spec }: { spec: Component }) {
  const style = place(spec);
  const pct = Math.round((spec.value ?? 0) * 100);
  switch (spec.kind) {
    case "screen":
      return <Screen spec={spec} />;
    case "knob":
      return (
        <AmbientKnob
          style={style}
          value={pct}
          variant={(spec.variant ?? "dot") as AmbientKnobVariant}
        />
      );
    case "button":
      return (
        <AmbientButton style={style} shape={(spec.variant ?? "pill") as AmbientButtonShape}>
          {spec.label ?? ""}
        </AmbientButton>
      );
    case "switch":
      return <AmbientSwitch style={style} checked={pct >= 50} />;
    case "slider":
      return <AmbientSlider style={style} value={pct} />;
    case "fader":
      return <AmbientFader style={style} value={pct} />;
  }
}

/* The physical ground and the plate share an albedo, so the frame takes
   .amb-surface — same convention as tools/css-harness/render.mjs. The amb
   values come from the layout rather than component defaults, so the light
   vector provably matches the one the referents were rendered under. */
function Frame() {
  return (
    <AmbientProvider
      theme={{
        lightX: layout.amb.light_x,
        lightY: layout.amb.light_y,
        keyLight: layout.amb.key_light_intensity,
        fillLight: layout.amb.fill_light_intensity,
        ...(({ note, ...theme }) => theme)(layout.css ?? {}),
      }}
    >
      <div
        id="frame"
        className="amb-surface"
        style={{ position: "relative", width: `${frameW}px`, height: `${frameH}px` }}
      >
        {layout.body ? <Body body={layout.body} /> : null}
        {layout.components.map((spec) => (
          <Control key={spec.id} spec={spec} />
        ))}
      </div>
    </AmbientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
);
