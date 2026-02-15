import React from "react";

const cardStyle: React.CSSProperties = {
  padding: 16
};

const brightThemeVars: React.CSSProperties = {
  ["--amb-light-x" as string]: "-1",
  ["--amb-light-y" as string]: "-1",
  ["--amb-key-light-intensity" as string]: "0.9",
  ["--amb-fill-light-intensity" as string]: "0.72",
  ["--amb-light-hue" as string]: "220",
  ["--amb-light-saturation" as string]: "14%",
  ["--amb-highlight-color" as string]: "#7dd3fc",
  ["--amb-lume-hue" as string]: "190"
};

const miniButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: 0,
  background: "transparent",
  cursor: "pointer"
};

export function CssRenderedExamples() {
  return (
    <div className="docs-css-examples">
      <section className="docs-demo-shell docs-bright-theme">
        <div style={brightThemeVars}>
        <h3 className="docs-css-title">Basic Control Row</h3>
        <div className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg docs-css-row-panel">
          <button className="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style={miniButtonStyle}>Play</button>
          <button className="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style={miniButtonStyle}>Stop</button>
          <button className="ambient amb-surface-convex amb-chamfer amb-elevation-1 amb-rounded-md" style={miniButtonStyle}>Rec</button>
        </div>
        </div>
      </section>

      <section className="docs-demo-shell docs-bright-theme">
        <div style={brightThemeVars}>
        <h3 className="docs-css-title">Light Direction A/B</h3>
        <div className="docs-css-grid-two">
          <div className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg amb-light-tl docs-css-block" />
          <div className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg amb-light-br docs-css-block" />
        </div>
        </div>
      </section>

      <section className="docs-demo-shell docs-bright-theme">
        <div style={brightThemeVars}>
        <h3 className="docs-css-title">Card Grid Shell</h3>
        <div className="docs-css-grid-two">
          <article className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg" style={cardStyle}>
            <h4 className="docs-css-subtitle">Input</h4>
            <div className="ambient amb-surface-concave amb-fillet amb-elevation-1 amb-rounded-md docs-css-meter" />
          </article>
          <article className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg" style={cardStyle}>
            <h4 className="docs-css-subtitle">Output</h4>
            <div className="ambient amb-surface-concave amb-fillet amb-elevation-1 amb-rounded-md docs-css-meter" />
          </article>
        </div>
        </div>
      </section>
    </div>
  );
}
