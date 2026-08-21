import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Render a grid of whole material VARIANTS against the shipped ambient.css.
//
// ladder.mjs varies ONE custom property, which is what a closed-loop fit of a
// single fitted constant needs. This varies the grain TILE itself — its size,
// its baseFrequency, its contrast stretch — which is what hand-tuning the
// shape of a finish needs, and which a single --var cannot reach.
//
//   node variants.mjs specs/handtune-2026-08-21-brushed.json
//
// It prints the grid geometry as JSON on stdout; feed that straight to
// ambient3d/measure/variant_grid.py to measure every panel.
//
// Panels default to 480x240 rather than square: a tiling seam is invisible on
// a panel narrower than about two tiles, which is exactly how a 128px tile's
// discontinuous dashes survived a whole fit (derived/notes/brushed.md's
// 2026-08-20 correction). Set w wider than 2x the largest tile under test.

// The same SVG turbulence tile ambient.css inlines, with the knobs exposed.
// normal: slope s, intercept (1-s)/2. inverse: -s, (1+s)/2 — both fix x=0.5,
// which is what makes the screen/multiply pair cancel on a flat mid-grey.
export function tile({ size = 128, bf = "0.28125 20", octaves = 1, seed = 3, slope = 2 }, inv = false) {
  const s = inv ? -slope : slope;
  const i = inv ? (1 + slope) / 2 : (1 - slope) / 2;
  const f = (ch) => `<feFunc${ch} type="linear" slope="${s}" intercept="${i}"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="linearRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${bf}" numOctaves="${octaves}" seed="${seed}" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/>` +
    `<feComponentTransfer>${f("R")}${f("G")}${f("B")}</feComponentTransfer>` +
    `</filter><rect width="100%" height="100%" filter="url(#t)"/></svg>`;
  // Single-quoted: this lands inside a double-quoted style="" attribute, and a
  // double quote there silently truncates it — the variant then renders as the
  // shipped material and every panel measures identical.
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
}

const MATS = {
  brushed: "amb-mat-brushed",
  spun: "amb-mat-brushed-round",
  blasted: "amb-mat-blasted",
};
// Each finish's own reference tone, so a variant is judged at the tone the
// material was fitted at rather than at whatever the page inherits.
const TONES = { brushed: "0.482", spun: "0.480", blasted: "0.446" };

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec = JSON.parse(await readFile(process.argv[2], "utf8"));
  const { pad = 40, gap = 40, w = 480, h = 240, cols = 2, dpr = 1, mat, variants } = spec;
  if (!MATS[mat]) throw new Error(`mat must be one of ${Object.keys(MATS).join(", ")}`);
  const tone = spec.tone ?? TONES[mat];

  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, "../..");
  const css = await readFile(path.join(repo, "packages/ambient-css/src/ambient.css"), "utf8");
  // Relative paths resolve against the harness dir, as ladder.mjs does, so a
  // spec run from the repo root does not scatter out/ directories.
  const rel = spec.out ?? `out/variants_${mat}.png`;
  const out = path.isAbsolute(rel) ? rel : path.join(here, rel);

  const rows = Math.ceil(variants.length / cols);
  const panels = variants.map((v) => {
    const d = [`--amb-albedo: color(srgb-linear ${tone} ${tone} ${tone})`];
    if (v.tile) {
      d.push(`--_grain-tile: ${tile(v.tile)}`, `--_grain-tile-inv: ${tile(v.tile, true)}`,
             `--_grain-scale: ${v.scale ?? v.tile.size ?? 128}px`);
    } else if (v.scale) {
      d.push(`--_grain-scale: ${v.scale}px`);
    }
    for (const [k, val] of Object.entries(v.vars ?? {})) d.push(`${k}: ${val}`);
    return `<div class="panel ambient amb-surface ${MATS[mat]}" style="${d.join("; ")}"></div>`;
  }).join("");

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: pad * 2 + cols * w + (cols - 1) * gap, height: pad * 2 + rows * h + (rows - 1) * gap },
    deviceScaleFactor: dpr,
  });
  await page.setContent(
    `<!doctype html><html><head><style>${css}
       html, body { margin: 0; background: #202020; }
       #grid { display: grid; grid-template-columns: repeat(${cols}, ${w}px);
               gap: ${gap}px; padding: ${pad}px; }
       .panel { width: ${w}px; height: ${h}px; }
     </style></head><body><div id="grid">${panels}</div></body></html>`,
    { waitUntil: "networkidle" },
  );
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  await browser.close();

  // Geometry is reported in DEVICE pixels: the screenshot is dpr x the
  // viewport, and the whole point of a dpr run is to measure what the
  // rasteriser actually produced, not what the CSS asked for.
  console.log(JSON.stringify({ out, cols, rows, dpr, pad: pad * dpr, gap: gap * dpr,
    w: w * dpr, h: h * dpr, labels: variants.map((v) => v.label) }));
}
