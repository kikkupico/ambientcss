// Builds the coupon page published at claude.ai/code/artifact/f1315cc0 — the
// candidate ladders the shipped brushed tile and blasted alpha were chosen
// from. Inlines ambient.css so the panels are the real material, not a
// screenshot of it:
//   node handtune-2026-08-21-coupons.mjs out.html
import { readFile, writeFile } from "node:fs/promises";
import { tile } from "../variants.mjs";

const css = await readFile("/Users/kikkupico/Projects/ambientcss/packages/ambient-css/src/ambient.css", "utf8");

const BRUSHED = [
  { id: "A", name: "Previous", note: "What shipped until 21 August 2026.", shipped: true,
    spec: { Tile: "128 px", "Cells across": "36", "Streak length": "3.6 px",
            "Across-grain freq": "20 /px", "Across-grain period": "0.05 px",
            "Grain alpha": "0.515", "Grain RMS L*": "1.695", "Row/col 1x": "1.55", "Row/col 2x": "2.70" } },
  { id: "B", name: "Fine grain", note: "The smallest step that still reads as grain rather than weave.",
    t: { size: 256, bf: "0.0625 0.5" }, alpha: "0.424",
    spec: { Tile: "256 px", "Cells across": "16", "Streak length": "16 px",
            "Across-grain freq": "0.5 /px", "Across-grain period": "2 px",
            "Grain alpha": "0.424", "Grain RMS L*": "1.694", "Row/col 1x": "5.48", "Row/col 2x": "4.74" } },
  { id: "C", name: "Long grain", note: "Twelve times the streak length, and the closest of the four on a Retina screen. Not the pick.",
    t: { size: 512, bf: "0.0234375 0.5" }, alpha: "0.405",
    spec: { Tile: "512 px", "Cells across": "12", "Streak length": "43 px",
            "Across-grain freq": "0.5 /px", "Across-grain period": "2 px",
            "Grain alpha": "0.405", "Grain RMS L*": "1.688", "Row/col 1x": "8.81", "Row/col 2x": "6.90" } },
  { id: "D", name: "Long and soft", picked: true, note: "The chosen streak LENGTH \u2014 but read as thick soft bands, which the second ladder below fixes. Closest of the four to the fitted anisotropy at 1x. Two caveats: it drifts toward polished stone if you look for it, and its 8 cells sit under the 10-cell floor the 2026-08-20 correction set \u2014 though that floor was measured on a 128px tile, and it does not seam here.",
    t: { size: 512, bf: "0.015625 0.35" }, alpha: "0.426",
    spec: { Tile: "512 px", "Cells across": "8", "Streak length": "64 px",
            "Across-grain freq": "0.35 /px", "Across-grain period": "2.9 px",
            "Grain alpha": "0.426", "Grain RMS L*": "1.687", "Row/col 1x": "7.13", "Row/col 2x": "5.42" } },
];


const FREQ = [
  { id: "1", name: "2.9px", note: "D as first shipped. Bands, not lines.", picked: true,
    t: { size: 512, bf: "0.015625 0.35" }, alpha: "0.426",
    spec: { "Across-grain freq": "0.35 /px", "Period": "2.9 px", "Grain alpha": "0.426",
            "Grain RMS L*": "1.687", "Row/col 1x": "7.13" } },
  { id: "2", name: "2.0px", note: "A third finer.",
    t: { size: 512, bf: "0.015625 0.5" }, alpha: "0.426",
    spec: { "Across-grain freq": "0.5 /px", "Period": "2.0 px", "Grain alpha": "0.426",
            "Grain RMS L*": "1.837", "Row/col 1x": "10.62" } },
  { id: "3", name: "1.4px", note: "Hairlines, with a little weight left in them.",
    t: { size: 512, bf: "0.015625 0.7" }, alpha: "0.426",
    spec: { "Across-grain freq": "0.7 /px", "Period": "1.4 px", "Grain alpha": "0.426",
            "Grain RMS L*": "1.703", "Row/col 1x": "11.12" } },
  { id: "4", name: "1.1px", note: "Fine lines. Holds contrast at every device pixel ratio tested \u2014 1, 1.11, 1.25, 1.5, 1.75, 2.", chosen: true,
    t: { size: 512, bf: "0.015625 0.9" }, alpha: "0.42",
    spec: { "Across-grain freq": "0.9 /px", "Period": "1.1 px", "Grain alpha": "0.42",
            "Grain RMS L*": "1.680", "Row/col 1x": "12.15" } },
  { id: "5", name: "1.0px \u2014 collapses", note: "One cycle per CSS pixel. The noise lattice lands on the pixel grid, every sample hits a lattice node where gradient noise is zero by construction, and the tile renders far weaker and far less directional than it specifies. Shown because it is the trap, not a candidate.",
    t: { size: 512, bf: "0.015625 1" }, alpha: "0.426",
    spec: { "Across-grain freq": "1.0 /px", "Period": "1.0 px", "Grain alpha": "0.426",
            "Grain RMS L*": "1.212", "Row/col 1x": "8.38" } },
];

const BLASTED = [
  { id: "A", name: "Previous", note: "What shipped until 21 August 2026.", shipped: true,
    spec: { "Grain alpha": "0.85", "Grain RMS L*": "5.468", "Change": "—",
            "Share of target": "68%", "Clamps at": "1.18 of 1.50" } },
  { id: "B", name: "Eased", note: "A visible step down that keeps most of the sparkle.", alpha: "0.75",
    spec: { "Grain alpha": "0.75", "Grain RMS L*": "4.771", "Change": "-13%",
            "Share of target": "59%", "Clamps at": "1.33 of 1.50" } },
  { id: "C", name: "Unclamped", note: "The one value where the opacity product stops truncating: the grain tracks the light across its whole range instead of flattening out above the default.", chosen: true, alpha: "0.666",
    spec: { "Grain alpha": "0.666", "Grain RMS L*": "4.212", "Change": "-23%",
            "Share of target": "52%", "Clamps at": "never" } },
  { id: "D", name: "Quiet", note: "Reads as a fine matte texture more than a blast finish.", alpha: "0.60",
    spec: { "Grain alpha": "0.60", "Grain RMS L*": "3.772", "Change": "-31%",
            "Share of target": "47%", "Clamps at": "never" } },
];

const TONE = { brushed: "0.482", blasted: "0.446" };
const CLS = { brushed: "amb-mat-brushed", blasted: "amb-mat-blasted" };

function panelStyle(mat, o) {
  const d = [`--amb-albedo: color(srgb-linear ${TONE[mat]} ${TONE[mat]} ${TONE[mat]})`];
  if (o.t) {
    d.push(`--_grain-tile: ${tile(o.t)}`, `--_grain-tile-inv: ${tile(o.t, true)}`, `--_grain-scale: ${o.t.size}px`);
  }
  if (o.alpha) d.push(`--_grain-alpha: ${o.alpha}`);
  return d.join("; ");
}

const coupon = (mat, o) => `
        <article class="gc-coupon gc-${mat}${o.chosen ? " is-rec" : ""}">
          <div class="gc-coupon-head">
            <span class="gc-id">${o.id}</span>
            <h3>${o.name}</h3>
            ${o.chosen ? '<span class="gc-chip">shipped 21 Aug</span>' : ""}
            ${o.shipped ? '<span class="gc-chip gc-chip-quiet">previous</span>' : ""}\n            ${o.picked ? '<span class="gc-chip gc-chip-quiet">step 1</span>' : ""}
          </div>
          <p class="gc-note">${o.note}</p>
          <div class="gc-panel ${CLS[mat]} ambient amb-surface" style="${panelStyle(mat, o)}"></div>
          <dl class="gc-spec">${Object.entries(o.spec)
            .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        </article>`;

const html = `<title>Grain Coupons</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">
<style>
__AMBIENT_CSS__
</style>
<style>
:root {
  --gc-bg: #e9ebee;
  --gc-card: #f7f8f9;
  --gc-ink: #14181d;
  --gc-mute: #616a76;
  --gc-rule: #cfd4da;
  --gc-accent: #1d4e89;
  --gc-accent-soft: #dde6f1;
  --gc-shadow: 0 1px 2px rgba(20, 24, 29, .07), 0 8px 24px -16px rgba(20, 24, 29, .3);
}
:root:not([data-theme="light"]) { }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --gc-bg: #14171a;
    --gc-card: #1c2126;
    --gc-ink: #e4e8ec;
    --gc-mute: #949da8;
    --gc-rule: #2b3138;
    --gc-accent: #78a8dd;
    --gc-accent-soft: #1e2c3c;
    --gc-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -16px rgba(0, 0, 0, .8);
  }
}
:root[data-theme="dark"] {
  --gc-bg: #14171a;
  --gc-card: #1c2126;
  --gc-ink: #e4e8ec;
  --gc-mute: #949da8;
  --gc-rule: #2b3138;
  --gc-accent: #78a8dd;
  --gc-accent-soft: #1e2c3c;
  --gc-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 8px 24px -16px rgba(0, 0, 0, .8);
}

body {
  margin: 0;
  background: var(--gc-bg);
  color: var(--gc-ink);
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
.gc-wrap { max-width: 62rem; margin: 0 auto; padding: 0 1.5rem 6rem; }

.gc-head { padding: 4rem 0 2rem; display: flex; flex-direction: column; gap: .75rem; }
.gc-eyebrow {
  margin: 0; font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: var(--gc-mute);
}
.gc-head h1 {
  margin: 0; font-family: Archivo, "Helvetica Neue", sans-serif; font-weight: 700;
  font-size: clamp(2.4rem, 6vw, 3.6rem); line-height: 1.02; letter-spacing: -.028em; text-wrap: balance;
}
.gc-lede { margin: 0; max-width: 34em; color: var(--gc-mute); font-size: 1.08rem; }

.gc-brief { margin: 1.5rem 0 0; display: grid; gap: .5rem; max-width: 40em; }
.gc-brief div { display: grid; grid-template-columns: 5.5rem 1fr; gap: 1rem; align-items: baseline; }
.gc-brief dt {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .72rem;
  letter-spacing: .1em; text-transform: uppercase; color: var(--gc-accent);
}
.gc-brief dd { margin: 0; }

.gc-bar {
  position: sticky; top: 0; z-index: 5; margin: 2rem 0 0;
  display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;
  padding: .75rem 1rem; border: 1px solid var(--gc-rule); border-radius: 3px;
  background: color-mix(in srgb, var(--gc-card) 88%, transparent);
  backdrop-filter: blur(8px);
}
.gc-group { display: flex; align-items: center; gap: .5rem; }
.gc-group > span {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .68rem;
  letter-spacing: .12em; text-transform: uppercase; color: var(--gc-mute);
}
.gc-bar button {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .78rem;
  padding: .3rem .6rem; border: 1px solid var(--gc-rule); border-radius: 2px;
  background: transparent; color: var(--gc-ink); cursor: pointer;
}
.gc-bar button:hover { border-color: var(--gc-accent); }
.gc-bar button:focus-visible { outline: 2px solid var(--gc-accent); outline-offset: 2px; }
.gc-bar button[aria-pressed="true"] {
  background: var(--gc-accent-soft); border-color: var(--gc-accent); color: var(--gc-accent);
}

.gc-section { margin: 4rem 0 0; }
.gc-section > h2 {
  margin: 0 0 .25rem; font-family: Archivo, "Helvetica Neue", sans-serif; font-weight: 600;
  font-size: 1.9rem; letter-spacing: -.02em;
}
.gc-section > h2 code {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .62em;
  font-weight: 400; color: var(--gc-mute); letter-spacing: 0;
}
.gc-section > p { max-width: 38em; }

.gc-finding {
  margin: 1.5rem 0; padding: 1rem 1.25rem; max-width: 38em;
  border-left: 2px solid var(--gc-accent); background: var(--gc-accent-soft);
  border-radius: 0 3px 3px 0;
}
.gc-finding h4 {
  margin: 0 0 .35rem; font-family: Archivo, sans-serif; font-size: .95rem;
  font-weight: 600; letter-spacing: -.01em;
}
.gc-finding p { margin: 0 0 .6rem; font-size: .95rem; }
.gc-finding p:last-child { margin-bottom: 0; }

.gc-coupons { display: grid; gap: 1.5rem; margin-top: 2rem; }
.gc-coupon {
  padding: 1.25rem; border: 1px solid var(--gc-rule); border-radius: 3px;
  background: var(--gc-card); box-shadow: var(--gc-shadow);
  display: flex; flex-direction: column; gap: .75rem;
}
.gc-coupon.is-rec { border-color: var(--gc-accent); }
.gc-coupon-head { display: flex; align-items: center; gap: .75rem; }
.gc-id {
  font-family: Archivo, sans-serif; font-weight: 700; font-size: 1rem;
  width: 1.85rem; height: 1.85rem; display: grid; place-items: center;
  border-radius: 2px; background: var(--gc-ink); color: var(--gc-card);
}
.gc-coupon.is-rec .gc-id { background: var(--gc-accent); color: #fff; }
.gc-coupon-head h3 {
  margin: 0; font-family: Archivo, sans-serif; font-weight: 600;
  font-size: 1.15rem; letter-spacing: -.015em; flex: 1;
}
.gc-chip {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .66rem;
  letter-spacing: .1em; text-transform: uppercase; padding: .2rem .5rem;
  border-radius: 2px; background: var(--gc-accent); color: #fff;
}
.gc-chip-quiet { background: transparent; border: 1px solid var(--gc-rule); color: var(--gc-mute); }
.gc-note { margin: 0; color: var(--gc-mute); font-size: .95rem; max-width: 44em; }

/* Brushed coupons are tall: C and D repeat every 512px, and a short panel
   cannot show a streak length the reader is being asked to choose. Blasted
   features are about a pixel, so its coupons need no room. */
.gc-panel { height: 190px; border-radius: 3px; }
.gc-brushed .gc-panel { height: 420px; }

.gc-spec {
  margin: 0; display: grid; gap: .5rem 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}
.gc-spec dt { font-size: .66rem; letter-spacing: .08em; text-transform: uppercase; color: var(--gc-mute); }
.gc-spec dd { margin: 0; font-size: .9rem; }

.gc-sub { margin: 3rem 0 .25rem; font-family: Archivo, sans-serif; font-weight: 600;\n  font-size: 1.3rem; letter-spacing: -.015em; }\n.gc-outro { margin: 4rem 0 0; padding-top: 2rem; border-top: 1px solid var(--gc-rule); }
.gc-outro h2 { font-family: Archivo, sans-serif; font-weight: 600; font-size: 1.4rem; margin: 0 0 .5rem; }
.gc-outro p, .gc-outro li { max-width: 38em; font-size: .95rem; }
.gc-outro code, .gc-finding code, .gc-note code, .gc-section > p code, .gc-brief code {
  font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .85em;
}

main.is-amplified .gc-panel { --amb-grain-amount: 4; }
main.is-flat .gc-panel { --_sheen-alpha: 0; }

@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="gc-wrap">
  <header class="gc-head">
    <p class="gc-eyebrow">ambient-css · hand-tune · 21 Aug 2026</p>
    <h1>Grain Coupons</h1>
    <p class="gc-lede">Four brushed tiles and four blasted contrasts, rendered live from
      <code>ambient.css</code> in your own browser. Brushed took two ladders \u2014 one for streak
      length, one for streak height \u2014 landing on a 512px tile at a 1.1px across-grain
      period; blasted took <strong>C</strong>. The rest are kept as the record of what
      those were chosen against.</p>
    <dl class="gc-brief">
      <div><dt>Brushed</dt><dd>Blurrier, with longer streaks \u2014 then those streaks made much finer.</dd></div>
      <div><dt>Blasted</dt><dd>Slightly lower contrast.</dd></div>
      <div><dt>Off limits</dt><dd>The Blender side. Every option here is CSS only.</dd></div>
    </dl>
  </header>

  <div class="gc-bar">
    <div class="gc-group"><span>Grain</span>
      <button type="button" id="amp" aria-pressed="false">amplify 4x</button></div>
    <div class="gc-group"><span>Sheen</span>
      <button type="button" id="flat" aria-pressed="false">hide</button></div>
    <div class="gc-group"><span>Light</span>
      <button type="button" class="lt" data-x="0" data-y="-1" aria-pressed="true">top</button>
      <button type="button" class="lt" data-x="1" data-y="-1" aria-pressed="false">top right</button>
      <button type="button" class="lt" data-x="1" data-y="0" aria-pressed="false">right</button>
      <button type="button" class="lt" data-x="0" data-y="1" aria-pressed="false">bottom</button></div>
  </div>

  <main id="stage">
    <section class="gc-section">
      <h2>Brushed <code>.amb-mat-brushed</code></h2>
      <h3 class="gc-sub" style="margin-top:1.5rem">First the streak length</h3>
      <p>The two asks are one lever apart. Streak length is set by how many turbulence cells
        span the tile; blur is set by the across-grain frequency. In the tile this replaced both
        were pushed so far that it stopped being grain at all.</p>

      <div class="gc-finding">
        <h4>The shipped tile does not deliver the anisotropy it was fitted to</h4>
        <p><code>brushed.md</code> records a row/col derivative ratio of 7.60 against the render's
          7.4963. Measured off a real Chrome raster at 1x, the shipped tile reads <strong>1.55</strong>
          — near isotropic. Its across-grain frequency is 20 cycles per CSS pixel, forty times
          Nyquist, so what reaches the screen is aliasing rather than grain, and it aliases into a
          woven cross-hatch.</p>
        <p>Each option below puts that frequency under Nyquist (0.5/px is a 2px period) and takes
          streak length from the tile size instead. All three land nearer the fitted 7.50 than
          what ships \u2014 5.48, 8.81 and 7.13 against 1.55 \u2014 so this is a hand-tune that moves
          <em>toward</em> the Blender ground truth rather than away from it.</p>
      </div>

      <p>A bigger tile has to survive tiling, which is the failure the 2026-08-20 correction was
        written about: <code>baseFrequency-x 0.02</code> hit both fitted targets and still rendered
        as discontinuous dashes, invisible until the tile wrapped. Both 512px options were checked
        across two full repeats in each axis at 4x amplitude. No seam is visible, and on a
        boundary-jump ratio C measures 1.13 and D 1.09 — below the shipping tile’s own 1.17 and
        well below the 1.31 of the tile that correction rejected.</p>
      <p>Every alpha below is rescaled so all four coupons carry the same grain contrast as today
        — 1.69 RMS L*, within 0.5%. Only the shape changes; the fitted contrast is untouched.</p>

      <div class="gc-coupons">${BRUSHED.map((o) => coupon("brushed", o)).join("")}
      </div>

      <h3 class="gc-sub">Then the streak height</h3>
      <p>D fixed how long the streaks run and left them 2.9px tall, which reads as soft
        banding rather than a brushed finish. This second ladder sweeps the across-grain
        frequency alone, at the same streak length and matched contrast.</p>

      <div class="gc-finding">
        <h4>The trap is integer cycles per pixel, not high frequency</h4>
        <p>At exactly one cycle per CSS pixel the noise lattice coincides with the sampling
          grid, and gradient noise is zero at every lattice node by construction \u2014 so the
          tile renders far weaker and far less directional than it asks for. That is the same
          coincidence the old 20 was hitting, twenty times over, and it is a sharper rule than
          "stay under Nyquist": 0.9 is finer than 0.5 and renders cleanly, while 1.0 does not.</p>
      </div>

      <div class="gc-coupons">${FREQ.map((o) => coupon("brushed", o)).join("")}
      </div>
    </section>

    <section class="gc-section">
      <h2>Blasted <code>.amb-mat-blasted</code></h2>
      <p>One number, <code>--_grain-alpha</code>, and it already sat near a ceiling: the opacity it
        feeds is a product of four factors, and the product clamps at 1. At the previous 0.85 the
        clamp bit once the light term reached 1.18 of its 1.50 range, so the material stopped
        brightening about 18% above the default scene.</p>

      <div class="gc-finding">
        <h4>Lower contrast buys back the light response</h4>
        <p>0.666 is the highest value where the product never clamps (1.50 x 0.666 = 0.999) — the grain fades and
          brightens across the full lighting range instead of flattening out. Wanting slightly less
          contrast and wanting an untruncated light response turn out to be the same move.</p>
        <p>Two exact edges worth knowing: 0.667 would clamp, but only in the top 0.05% of
          the range, so the choice between them is bookkeeping rather than looks. And all of
          this assumes <code>--amb-grain-amount</code> at 1 — a consumer who raises that knob
          moves every option’s clamp point down in proportion.</p>
      </div>

      <div class="gc-coupons">${BLASTED.map((o) => coupon("blasted", o)).join("")}
      </div>
    </section>

    <section class="gc-outro">
      <h2>Reading the numbers</h2>
      <p><strong>Grain RMS L*</strong> is measured with <code>ambient3d/measure/panel_split.py</code>
        over 240px panels with the sheen off, at device pixel ratio 1. <strong>Row/col</strong> is the
        row-to-row over column-to-column pixel derivative ratio — the same statistic
        <code>metrics.py</code>'s <code>grain_texture</code> reports, which the Blender rig puts at
        7.4963 for this finish.</p>
      <p>Row/col is quoted at both 1x and 2x because it is the one figure that moves with device
        pixel ratio: SVG filters rasterize at device resolution, so a near-Nyquist tile resolves
        differently on a Retina screen. Grain RMS is stable across both. The coupons above render
        at whatever ratio your display uses.</p>
      <p><strong>Of Blender target</strong> carries forward the 68% that
        <code>blasted.md</code> already records for the shipped 0.85 — the target of 11.7355 is a
        different instrument on a different image, so it is only ever quoted as a ratio.</p>
      <p>Both picks are written into <code>ambient.css</code> as dated hand-tune paragraphs in
        each material's comment block, with matching sections in
        <code>ambient3d/derived/notes/{brushed,blasted}.md</code> and a rewritten passage in the
        Grounded page, so the record says plainly which constants are Blender-grounded and which
        were chosen by eye. The ladders here re-run from
        <code>tools/css-harness/specs/handtune-2026-08-21-*.json</code>.</p>
    </section>
  </main>
</div>

<script>
  const stage = document.getElementById("stage");
  const toggle = (btn, cls) => btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    stage.classList.toggle(cls, on);
  });
  toggle(document.getElementById("amp"), "is-amplified");
  toggle(document.getElementById("flat"), "is-flat");
  for (const b of document.querySelectorAll(".lt")) {
    b.addEventListener("click", () => {
      for (const o of document.querySelectorAll(".lt")) o.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-pressed", "true");
      stage.style.setProperty("--amb-light-x", b.dataset.x);
      stage.style.setProperty("--amb-light-y", b.dataset.y);
    });
  }
  stage.style.setProperty("--amb-light-x", "0");
  stage.style.setProperty("--amb-light-y", "-1");
</script>
`;

// The Artifact wrapper owns <head>, so a <meta charset> of ours would land
// too late to matter. Escaping the authored copy to entities makes it read
// correctly whatever charset the host declares; ambient.css's own comments
// are left as raw bytes since nothing renders them.
const escaped = html.replace(/[^\x00-\x7F]/g, (c) => `&#${c.codePointAt(0)};`)
  .replace("__AMBIENT_CSS__", () => css);
await writeFile(process.argv[2], escaped);
console.log("WROTE", process.argv[2], escaped.length, "bytes");
