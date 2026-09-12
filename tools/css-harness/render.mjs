import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Screenshot the CSS rendering of every manifest scene (and sweep frame
// that declares a css spec) at the calibration rig's scale: a viewport of
// frameMm CSS px at deviceScaleFactor pxPerMm, one div at the center.
// Output mirrors ambient3d/renders/ paths under out/, so the comparison
// pipeline pairs frames by relative path.

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const manifest = JSON.parse(
  await readFile(path.join(repo, "ambient3d/manifest.json"), "utf8"),
);
const css = await readFile(
  path.join(repo, "packages/ambient-css/src/ambient.css"),
  "utf8",
);

// python-spelled amb overrides -> inline --amb-* declarations
function inlineVars(amb) {
  const skip = new Set(["mat", "emit", "surface", "albedo"]); // class-level, not vars
  return Object.entries(amb)
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => `--amb-${k.replaceAll("_", "-")}: ${v};`)
    .join(" ");
}

function* jobs() {
  for (const scene of manifest.scenes) {
    if (scene.css) yield { rel: `calib/${scene.id}.png`, amb: scene.amb, spec: scene };
  }
  for (const sweep of manifest.sweeps) {
    if (!sweep.css) continue;
    for (const axis of sweep.axes) {
      for (const [param, values] of Object.entries(axis.vary)) {
        for (const val of values) {
          const amb = { ...sweep.amb };
          if (param === "light") {
            amb.light_x = val[0];
            amb.light_y = val[1];
          } else {
            amb[param] = val;
          }
          const fmt = (v) => (Array.isArray(v) ? v.map(fmt).join(",") : `${v}`);
          yield { rel: `sweeps/${sweep.id}/${param}=${fmt(val)}.png`, amb, spec: sweep };
        }
      }
    }
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: manifest.frameMm, height: manifest.frameMm },
  deviceScaleFactor: manifest.pxPerMm,
});

let count = 0;
for (const { rel, amb, spec } of jobs()) {
  const [w, h] = spec.css.size;
  // backdrop decals (glass scenes): rects in screen mm from the frame
  // center, the same numbers the Blender rig builds its decals from,
  // painted behind the subject so backdrop-filter has something to blur
  const backdrop = (spec.css.backdrop ?? [])
    .map(({ classes, rect: [x0, y0, x1, y1], style }) =>
      `<div class="${classes.join(" ")}" style="position: absolute; left: calc(50% + ${x0}px); top: calc(50% + ${y0}px); width: ${x1 - x0}px; height: ${y1 - y0}px; ${style ?? ""}"></div>`)
    .join("");
  const html = `<!doctype html><html><head><style>${css}
    html, body { margin: 0; width: 100%; height: 100%; }
    body { display: grid; place-items: center; position: relative; }
    #subject { width: ${w}px; height: ${h}px; position: relative; }
  </style></head><body class="amb-surface" style="${inlineVars(amb)}">${backdrop}
    <!-- the physical ground and plate share the same albedo, so the body
         takes .amb-surface and always tracks the shipped formula. The
         subject repeats the frame's inline vars: classes may carry their
         own var defaults (edge classes default a thickness), and the
         harness gates the formulas at the *rendered* parameters, which
         must win over those defaults -->
    <div id="subject" class="${spec.css.classes.join(" ")}" style="${inlineVars(amb)} ${spec.css.style ?? ""}"></div>
  </body></html>`;
  await page.setContent(html, { waitUntil: "networkidle" });
  const out = path.join(here, "out", rel);
  await mkdir(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  count++;
}

await browser.close();
console.log(`WROTE ${count} screenshots under ${path.join(here, "out")}`);
