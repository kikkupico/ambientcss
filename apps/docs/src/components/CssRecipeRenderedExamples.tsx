import React from "react";

export function CssRecipeRenderedExamples() {
  return (
    <div className="docs-css-examples">
      <section className="docs-demo-shell docs-bright-theme">
        <h3 className="docs-css-title">Raised Card</h3>
        <section className="ambient amb-surface amb-chamfer amb-elevation-2 amb-rounded-lg docs-css-card">Raised card</section>
      </section>

      <section className="docs-demo-shell docs-bright-theme">
        <h3 className="docs-css-title">Inset Display Window</h3>
        <div className="ambient amb-surface-concave amb-fillet amb-elevation-1 amb-rounded-md docs-css-meter" />
      </section>

      <section className="docs-demo-shell docs-bright-theme">
        <h3 className="docs-css-title">Pulsing Indicator</h3>
        <span className="ambient amb-surface-convex amb-rounded-full amb-glow amb-bounce docs-css-led" />
      </section>
    </div>
  );
}
