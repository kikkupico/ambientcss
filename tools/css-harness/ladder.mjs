import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Render one panel per candidate value of a single CSS custom property, so
// the value can be fit against a measured target. render.mjs reproduces the
// manifest's scenes for compare.py; this reproduces a PARAMETER LADDER, the
// closed-loop search the material notes describe.
//
//   node ladder.mjs --mat brushed --var --_sheen-alpha --values 0,0.139,0.30
//
// then measure the grid with ambient3d/measure/panel_split.py's split_grid
// at the PAD/GAP/SIZE below. Always include a 0 panel: the surface carries
// its own lighting, so only the excess over that twin is the parameter's.
//
// Values are set inline, which beats the class rule, so a private --_var is
// reachable without editing ambient.css.

const PAD = 40, GAP = 40, SIZE = 240, COLS = 4;

const MATS = {
  brushed: "amb-mat-brushed",
  spun: "amb-mat-brushed-round",
  blasted: "amb-mat-blasted",
};
// Each finish's own reference tone, so a ladder is measured at the tone the
// material was fitted at rather than at whatever the page inherits.
const TONES = { brushed: "0.482", spun: "0.480", blasted: "0.446" };

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback === undefined) throw new Error(`missing --${name}`);
    return fallback;
  }
  return argv[i + 1];
};

const mat = arg("mat");
if (!MATS[mat]) throw new Error(`--mat must be one of ${Object.keys(MATS).join(", ")}`);
const varName = arg("var");
const values = arg("values").split(",").filter((s) => s !== "");
const out = arg("out", path.join("out", `ladder_${mat}.png`));

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const css = await readFile(path.join(repo, "packages/ambient-css/src/ambient.css"), "utf8");

const cols = Math.min(COLS, values.length);
const rows = Math.ceil(values.length / COLS);
const tone = `color(srgb-linear ${TONES[mat]} ${TONES[mat]} ${TONES[mat]})`;
const panels = values
  .map((v) => `<div class="panel ambient amb-surface ${MATS[mat]}" style="--amb-albedo: ${tone}; ${varName}: ${v};"></div>`)
  .join("");

const browser = await chromium.launch();
// deviceScaleFactor 1: the tiles are authored in CSS px, and the notes'
// numbers are per-CSS-pixel RMS. Rendering at 2x would resample the grain.
const page = await browser.newPage({
  viewport: {
    width: PAD * 2 + cols * SIZE + (cols - 1) * GAP,
    height: PAD * 2 + rows * SIZE + (rows - 1) * GAP,
  },
  deviceScaleFactor: 1,
});
await page.setContent(
  `<!doctype html><html><head><style>${css}
     html, body { margin: 0; background: #202020; }
     #grid { display: grid; grid-template-columns: repeat(${cols}, ${SIZE}px);
             gap: ${GAP}px; padding: ${PAD}px; }
     .panel { width: ${SIZE}px; height: ${SIZE}px; }
   </style></head><body><div id="grid">${panels}</div></body></html>`,
  { waitUntil: "networkidle" },
);
const outPath = path.isAbsolute(out) ? out : path.join(here, out);
await mkdir(path.dirname(outPath), { recursive: true });
await page.screenshot({ path: outPath });
await browser.close();

console.log(`WROTE ${outPath}`);
console.log(`grid: cols=${cols} rows=${rows} pad=${PAD} gap=${GAP} size=${SIZE}`);
console.log(`values: ${values.join(", ")}`);
