import React from "react";

const tips = {
  view: "Orthographic front view: depth cues come from lighting and edge response, not perspective distortion.",
  key: "Key light: primary shaping light controlling strongest highlights and shadow definition.",
  fill: "Fill light: secondary light that softens dark regions and controls contrast.",
  elevation: "Elevation controls perceived depth by changing shadow offset/spread.",
  edge: "Fillet/chamfer controls edge response and material feel.",
  surface: "Surface classes (flat/concave/convex) define macro volume perception.",
  stack: "Composition order: ambient + surface + edge + elevation = coherent control shading."
};

function Hotspot({ label, tip, className }: { label: string; tip: string; className: string }) {
  return (
    <button type="button" className={`iso-hotspot ${className}`} aria-label={`${label}: ${tip}`}>
      <span className="iso-hotspot-pill">{label}</span>
      <span className="iso-tooltip" role="tooltip">{tip}</span>
    </button>
  );
}

function LightIcon({ kind }: { kind: "key" | "fill" }) {
  return <span className={`iso-light-icon iso-light-icon-${kind}`} aria-hidden="true" />;
}

function CameraIcon() {
  return <span className="iso-camera-icon" aria-hidden="true" />;
}

export function ConceptIsometricDiagrams() {
  return (
    <section className="iso-combined">
      <h3 className="iso-title">Unified Isometric Model</h3>
      <p className="iso-help">Hover (or tap) labels to see how each concept affects the final surface.</p>

      <div className="iso-stage docs-bright-theme">
        <div className="iso-base" />
        <div className="iso-surface" />
        <div className="iso-edge" />
        <div className="iso-control" />

        <div className="iso-beam iso-beam-key" />
        <div className="iso-beam iso-beam-fill" />

        <div className="iso-light-chip iso-light-chip-key"><LightIcon kind="key" />Key</div>
        <div className="iso-light-chip iso-light-chip-fill"><LightIcon kind="fill" />Fill</div>

        <button type="button" className="iso-hotspot iso-hs-view" aria-label={`Camera: ${tips.view}`}>
          <span className="iso-hotspot-pill"><CameraIcon />Camera</span>
          <span className="iso-tooltip" role="tooltip">{tips.view}</span>
        </button>
        <Hotspot label="Surface" tip={tips.surface} className="iso-hs-surface" />
        <Hotspot label="Edge" tip={tips.edge} className="iso-hs-edge" />
        <Hotspot label="Elevation" tip={tips.elevation} className="iso-hs-elevation" />
        <button type="button" className="iso-hotspot iso-hs-key" aria-label={`Key Light: ${tips.key}`}>
          <span className="iso-hotspot-pill"><LightIcon kind="key" />Key Light</span>
          <span className="iso-tooltip" role="tooltip">{tips.key}</span>
        </button>
        <button type="button" className="iso-hotspot iso-hs-fill" aria-label={`Fill Light: ${tips.fill}`}>
          <span className="iso-hotspot-pill"><LightIcon kind="fill" />Fill Light</span>
          <span className="iso-tooltip" role="tooltip">{tips.fill}</span>
        </button>
        <Hotspot label="Class Stack" tip={tips.stack} className="iso-hs-stack" />
      </div>
    </section>
  );
}
