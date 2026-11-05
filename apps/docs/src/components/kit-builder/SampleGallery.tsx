/* The sample gallery: every sample kit, running, one card each.
 *
 *  A card is the sample's own kit on its own panel in its own light — the
 *  same renderer as the stage, not a screenshot — so what you see is what
 *  opening it gives you. */

import { useEffect, useMemo, useRef } from "react";
import {
  AmbientButton,
  AmbientFader,
  AmbientKnob,
  AmbientPanel,
  AmbientSelect,
  AmbientSlider,
  AmbientSwitch
} from "@ambientcss/components";
import { buildStyles } from "./emit";
import { SAMPLE_KITS } from "./samples";
import type { SampleKit } from "./samples";
import { Scene } from "./Stage";
import { Icon } from "./ExportDialog";
import { variantNames } from "./config";

/** A sample's stylesheet, every rule scoped under its card. A sample and the
 *  kit on the stage may share a name, and scoping keeps the card's rules
 *  from reaching the stage — and gives them the edge inside the card. */
function scopedStyles(sample: SampleKit): string {
  return buildStyles(sample.config).replace(/^(\.[^\n{]+) \{$/gm, ".kb-sample-preview $1 {");
}

const KEYS = [{ value: "1" }, { value: "2" }, { value: "3" }];

function Preview({ sample }: { sample: SampleKit }) {
  const styles = useMemo(() => scopedStyles(sample), [sample]);
  const cfg = sample.config;
  return (
    <div className="kb-sample-preview">
      {styles ? <style>{styles}</style> : null}
      <Scene config={cfg} className="kb-sample-scene">
        <AmbientPanel material={cfg.panel.material} className="kb-sample-panel">
          <div className="kb-sample-art" {...({ inert: "" } as Record<string, string>)}>
            <div className="kb-sample-row">
              <AmbientKnob defaultValue={64} />
              <AmbientFader defaultValue={70} />
              <div className="kb-sample-column">
                <AmbientSwitch defaultValue />
                <AmbientSlider defaultValue={40} />
              </div>
            </div>
            <div className="kb-sample-row">
              <AmbientButton>PLAY</AmbientButton>
              <AmbientSelect options={KEYS} orientation="horizontal" defaultValue="2" />
            </div>
          </div>
        </AmbientPanel>
      </Scene>
    </div>
  );
}

function versionCount(sample: SampleKit): number {
  return (["rotary", "travel", "press", "latch", "bank"] as const).reduce(
    (sum, family) => sum + (sample.config[family].dressed ? variantNames(sample.config, family).length - 1 : 0),
    0
  );
}

export function SamplesDialog({
  onOpen,
  onClose
}: {
  onOpen: (sample: SampleKit) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="kb-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        className="kb-dialog kb-dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kb-samples-title"
        tabIndex={-1}
      >
        <header className="kb-dialog-head">
          <div>
            <h2 id="kb-samples-title" className="kb-dialog-title">
              Sample kits
            </h2>
            <p className="kb-dialog-sub">
              Six very different kits, all built in this builder. Open one to take it apart or make it your own.
            </p>
          </div>
          <button type="button" className="kb-btn kb-btn-ghost kb-btn-icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="kb-samples">
          {SAMPLE_KITS.map((sample) => {
            const versions = versionCount(sample);
            return (
              <article key={sample.id} className="kb-sample">
                <Preview sample={sample} />
                <div className="kb-sample-text">
                  <h3 className="kb-sample-name">{sample.name}</h3>
                  <p className="kb-sample-tagline">{sample.tagline}</p>
                  <ul className="kb-sample-tags">
                    {sample.shows.map((tag) => (
                      <li key={tag} className="kb-pill">
                        {tag}
                      </li>
                    ))}
                    {versions > 0 ? <li className="kb-pill">+{versions} extra {versions === 1 ? "version" : "versions"}</li> : null}
                  </ul>
                </div>
                <button type="button" className="kb-btn kb-btn-primary kb-sample-open" onClick={() => onOpen(sample)}>
                  Open {sample.name}
                </button>
              </article>
            );
          })}
        </div>
        <footer className="kb-dialog-foot">
          <p className="kb-dialog-note">
            Opening a sample replaces what's in the builder. Undo brings your kit back.
          </p>
        </footer>
      </div>
    </div>
  );
}
