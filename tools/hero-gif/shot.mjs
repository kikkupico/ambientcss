import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Screenshot the CSS half of the hero frame at the calibration rig's scale:
// a viewport of frameMm CSS px at deviceScaleFactor pxPerMm, so the output
// is pixel-for-pixel comparable with the Blender render of the same layout.
// Same convention as tools/css-harness/render.mjs.
//
//   node shot.mjs [layout]              # default "panel"
//   node shot.mjs gate button-square    # one referent at its docs framing,
//                                       # for diffing against
//                                       # ambient3d/renders/components/<it>.png

const here = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] ?? "panel";
const only = process.argv[3];
const layout = JSON.parse(
  await readFile(path.join(here, "layouts", `${name}.json`), "utf8"),
);
const [frameW, frameH] = layout.frameMm;

// Chromium refuses ES module scripts over file://, so serve dist/ instead.
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  const rel = (req.url ?? "/").split("?")[0];
  const file = path.join(here, "dist", rel === "/" ? "index.html" : rel);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: frameW, height: frameH },
  deviceScaleFactor: layout.pxPerMm,
});
// referent name (ambient3d/referents.py REFERENTS) -> component + the state
// that referent is built in, so the pair is comparable
const REFERENTS = {
  "button": ["button", "pill", 0],
  "button-round": ["button", "round", 0],
  "button-square": ["button", "square", 0],
  "knob": ["knob", "dot", 0.33],
  "knob-line": ["knob", "line", 0.33],
  "knob-flute": ["knob", "flute", 0.33],
  "knob-cap": ["knob", "cap", 0.33],
  "knob-wheel": ["knob", "wheel", 0.33],
  "switch": ["switch", "", 0],
  "fader": ["fader", "", 0.5],
  "slider": ["slider", "", 0.5],
};

const query = new URLSearchParams({ layout: name });
if (only) {
  const spec = REFERENTS[only];
  if (!spec) throw new Error(`unknown referent "${only}" (${Object.keys(REFERENTS)})`);
  const [kind, variant, value] = spec;
  query.set("kind", kind);
  if (variant) query.set("variant", variant);
  query.set("value", String(value));
}
await page.goto(`http://127.0.0.1:${port}/?${query}`, { waitUntil: "networkidle" });
// the knurl clip-path is an inline SVG def; give the layout a beat to settle
await page.waitForSelector("#frame");
await page.evaluate(() => document.fonts.ready);

const out = path.join(here, "out", "css", `${only ?? name}.png`);
await mkdir(path.dirname(out), { recursive: true });
await page.screenshot({ path: out });
await browser.close();
server.close();
console.log(`WROTE ${out} (${frameW * layout.pxPerMm}x${frameH * layout.pxPerMm})`);
