import React, { useState } from "react";

const tips = {
  view: "Orthographic front view. No perspective distortion — depth comes from lighting and edge treatment only.",
  key: "Key light: primary source. Produces the strongest highlights and sharpest shadows.",
  fill: "Fill light: secondary source. Lifts shadow regions. Key-to-fill ratio controls contrast.",
  elevation:
    "Elevation (0–3) scales drop shadow offset and spread. Higher values = larger, softer shadow.",
  edge: "Edge treatment: fillet gives rounded inner edges, chamfer gives beveled ones. Both follow the light direction.",
  surface:
    "Surface type sets the background gradient. Flat is uniform, concave darkens toward light, convex brightens toward light.",
  shadow:
    "Five-layer box-shadow: drop shadow + fillet highlight/shadow + chamfer highlight/shadow. All derived from the same light parameters.",
};

function Hotspot({
  label,
  tip,
  className,
}: {
  label: string;
  tip: string;
  className: string;
}) {
  return (
    <button
      type="button"
      className={`td-hotspot ${className}`}
      aria-label={`${label}: ${tip}`}
    >
      <span className="td-hotspot-pill">{label}</span>
      <span className="td-tooltip" role="tooltip">
        {tip}
      </span>
    </button>
  );
}

function LightIcon({ kind }: { kind: "key" | "fill" }) {
  return (
    <span className={`td-light-icon td-light-icon-${kind}`} aria-hidden="true" />
  );
}

function CameraIcon() {
  return <span className="td-camera-icon" aria-hidden="true" />;
}

export function ConceptIsometricDiagrams() {
  const [exploded, setExploded] = useState(false);

  return (
    <section className="td-wrapper">
      <div className="td-header">
        <div>
          <h3 className="td-title">Lighting Model Overview</h3>
          <p className="td-help">
            {exploded
              ? "Exploded view — layers separated by elevation."
              : "Hover or tap any label for details."}
          </p>
        </div>
        <button
          type="button"
          className="td-toggle"
          onClick={() => setExploded((v) => !v)}
        >
          {exploded ? "Front View" : "Exploded View"}
        </button>
      </div>

      <div className={`td-viewport ${exploded ? "td-exploded" : ""}`}>
        <div className="td-scene docs-bright-theme">
          {/* Elevation 0 layer — recessed elements */}
          <div className="td-layer td-layer-0">
            <div
              className="td-meter ambient amb-surface-concave amb-fillet-minus-1 amb-elevation-0 amb-rounded-md"
              aria-label="Recessed meter — elevation 0"
            />
          </div>

          {/* Elevation 1 layer — base plane */}
          <div className="td-layer td-layer-1">
            <div
              className="td-panel ambient amb-surface amb-fillet amb-elevation-1 amb-rounded-xl"
              aria-label="Panel background — elevation 1"
            >
              {/* Meter placeholder to maintain layout */}
              <div className="td-meter-placeholder" />

              <div className="td-panel-row">
                <div
                  className="td-knob ambient amb-surface-convex amb-fillet amb-elevation-1 amb-rounded-full"
                  aria-label="Convex knob — elevation 1"
                />
                <div
                  className="td-btn ambient amb-surface-convex amb-fillet amb-elevation-1 amb-rounded-md"
                  aria-label="Fillet button — elevation 1"
                >
                  Fillet
                </div>
              </div>

              {/* Chamfer button placeholder */}
              <div className="td-btn-placeholder" />
            </div>
          </div>

          {/* Elevation 2 layer — raised elements */}
          <div className="td-layer td-layer-2">
            <div
              className="td-btn td-btn-chamfer ambient amb-surface-convex amb-chamfer amb-elevation-2 amb-rounded-md"
              aria-label="Chamfer button — elevation 2"
            >
              Chamfer
            </div>
          </div>

          {/* Annotations — visible in exploded view */}
          <div className="td-annotations">
            <div className="td-annotation td-anno-camera">
              <CameraIcon />
              <span className="td-anno-label">Camera (orthographic)</span>
            </div>

            <div className="td-annotation td-anno-key">
              <LightIcon kind="key" />
              <span className="td-anno-label">Key Light</span>
              <div className="td-beam td-beam-key" />
            </div>

            <div className="td-annotation td-anno-fill">
              <LightIcon kind="fill" />
              <span className="td-anno-label">Fill Light</span>
              <div className="td-beam td-beam-fill" />
            </div>

            <div className="td-elev-label td-elev-0">elev 0</div>
            <div className="td-elev-label td-elev-1">elev 1</div>
            <div className="td-elev-label td-elev-2">elev 2</div>
          </div>
        </div>

        {/* Hotspots — only visible in front view */}
        <div className="td-hotspots">
          <button
            type="button"
            className="td-hotspot td-hs-view"
            aria-label={`Camera: ${tips.view}`}
          >
            <span className="td-hotspot-pill">
              <CameraIcon />
              Camera
            </span>
            <span className="td-tooltip" role="tooltip">
              {tips.view}
            </span>
          </button>
          <Hotspot label="Surface" tip={tips.surface} className="td-hs-surface" />
          <Hotspot label="Edge" tip={tips.edge} className="td-hs-edge" />
          <Hotspot label="Elevation" tip={tips.elevation} className="td-hs-elevation" />
          <Hotspot label="5-Layer Shadow" tip={tips.shadow} className="td-hs-shadow" />
          <button
            type="button"
            className="td-hotspot td-hs-key"
            aria-label={`Key Light: ${tips.key}`}
          >
            <span className="td-hotspot-pill">
              <LightIcon kind="key" />
              Key Light
            </span>
            <span className="td-tooltip" role="tooltip">
              {tips.key}
            </span>
          </button>
          <button
            type="button"
            className="td-hotspot td-hs-fill"
            aria-label={`Fill Light: ${tips.fill}`}
          >
            <span className="td-hotspot-pill">
              <LightIcon kind="fill" />
              Fill Light
            </span>
            <span className="td-tooltip" role="tooltip">
              {tips.fill}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
