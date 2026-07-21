import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

// Side-by-side of the live CSS effect and the Blender ground-truth render
// it is calibrated against (ambient3d/renders, published via
// ambient3d/measure/publish.py). Both stages are 128 CSS px (the
// calibration frame) shown at 2x.

const defaultVars: React.CSSProperties = {
  ["--amb-light-x" as string]: "-1",
  ["--amb-light-y" as string]: "-1",
  ["--amb-key-light-intensity" as string]: "0.9",
  ["--amb-fill-light-intensity" as string]: "0.7",
  ["--amb-light-hue" as string]: "234",
  ["--amb-light-saturation" as string]: "15%"
};

const stageStyle: React.CSSProperties = {
  ...defaultVars,
  width: 128,
  height: 128,
  display: "grid",
  placeItems: "center",
  zoom: 2
};

const captionStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.7,
  marginTop: 6
};

export function RenderComparison({
  slug,
  classes,
  size = [80, 80],
  subjectStyle,
  dir = "renders",
  children
}: {
  slug: string;
  classes?: string;
  size?: [number, number];
  subjectStyle?: React.CSSProperties;
  /** image directory under /img: "renders" (effect calibration frames)
   *  or "components" (component counterpart shots) */
  dir?: "renders" | "components";
  /** live subject: rendered instead of the classes div when given
   *  (component comparisons pass the live React component) */
  children?: React.ReactNode;
}) {
  return (
    <figure
      style={{
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        flexWrap: "wrap",
        margin: "16px 0"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div className="amb-surface" style={stageStyle}>
          {children ?? (
            <div
              className={classes}
              style={{ width: size[0], height: size[1], ...subjectStyle }}
            />
          )}
        </div>
        <figcaption style={captionStyle}>Live CSS</figcaption>
      </div>
      <div style={{ textAlign: "center" }}>
        <img
          src={useBaseUrl(`/img/${dir}/${slug}.png`)}
          width={256}
          height={256}
          alt={`${slug} ground-truth render`}
          style={{ display: "block" }}
        />
        <figcaption style={captionStyle}>Blender ground truth</figcaption>
      </div>
    </figure>
  );
}
