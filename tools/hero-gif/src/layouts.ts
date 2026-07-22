import gate from "../layouts/gate.json";
import panel from "../layouts/panel.json";

/* The shared layout spec, in millimetres. The calibration rig maps
   1 CSS px = 1 mm (ambient3d/amb_params.py), so these same files drive
   the Blender scene (ambient3d/hero_panel.py) and the DOM below —
   which is what makes the two renders register. */
export type Component = {
  id: string;
  kind: "knob" | "button" | "switch" | "fader" | "slider" | "screen";
  variant?: string;
  x: number; // mm, +x = right of frame centre
  y: number; // mm, +y = UP (Blender convention; the DOM flips it)
  value?: number; // 0..1
  label?: string;
  /* screen only: the referents' controls carry their own fixed dimensions */
  size?: [number, number];
  amb?: { thickness?: number };
};

/* The device the controls mount into: physically the calibration plate
   (ambient3d/components/plate.py), so its CSS peer is a plain
   `.ambient .amb-surface .amb-chamfer-2` box at the same amb parameters. */
export type Body = {
  note?: string;
  size: [number, number];
  amb: {
    thickness: number;
    chamfer: number;
    chamfer_width: number;
    elevation: number;
  };
};

export type Layout = {
  id: string;
  frameMm: [number, number];
  pxPerMm: number;
  /* The rig's light environment (ambient3d/amb_params.py amb()), spelled as
     the Python side spells it. Both renderers read these. */
  amb: {
    light_x: number;
    light_y: number;
    key_light_intensity: number;
    fill_light_intensity: number;
  };
  /* Theme values with no counterpart in the rig — the referents are neutral
     calibration materials, so the DOM drops the shipped tint. Spread onto
     the provider theme; `note` is documentation and is ignored. */
  css?: { note?: string; lightSaturation?: number; highlightColor?: string };
  body?: Body;
  components: Component[];
};

export const LAYOUTS: Record<string, Layout> = {
  gate: gate as unknown as Layout,
  panel: panel as unknown as Layout,
};
