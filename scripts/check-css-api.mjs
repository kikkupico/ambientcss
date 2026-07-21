import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

// Freezes the public CSS API of ambient.css: selectors, public --amb-* custom
// properties, @keyframes names, and @property registrations. The blender
// grounding work may change any computed value, but never these names.
//
// Usage:
//   node scripts/check-css-api.mjs <input.css> <baseline.json>          # diff, exit 1 on drift
//   node scripts/check-css-api.mjs <input.css> <baseline.json> --write  # snapshot baseline

const [, , input, baselinePath, flag] = process.argv;

if (!input || !baselinePath) {
  console.error("Usage: node scripts/check-css-api.mjs <input.css> <baseline.json> [--write]");
  process.exit(1);
}

function extractApi(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");

  const selectors = new Set();
  const keyframes = new Set();
  const registeredProperties = new Set();

  // ambient.css is flat: rule preludes sit at brace depth 0, and only
  // @keyframes nests one level deeper.
  let depth = 0;
  let prelude = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      if (depth === 0) {
        const text = prelude.trim();
        if (text.startsWith("@keyframes")) {
          keyframes.add(text.replace("@keyframes", "").trim());
        } else if (text.startsWith("@property")) {
          registeredProperties.add(text.replace("@property", "").trim());
        } else if (text.startsWith("@")) {
          selectors.add(text);
        } else {
          for (const sel of text.split(",")) selectors.add(sel.trim());
        }
      }
      depth++;
      prelude = "";
    } else if (ch === "}") {
      depth--;
      prelude = "";
    } else if (depth === 0) {
      prelude += ch;
    }
  }

  // Public custom properties are declarations of --amb-*; --_* temporaries are
  // private by convention and excluded.
  const properties = new Set();
  for (const match of css.matchAll(/(--amb-[a-z0-9-]+)\s*:/g)) {
    properties.add(match[1]);
  }

  const sorted = (set) => [...set].sort();
  return {
    selectors: sorted(selectors),
    properties: sorted(properties),
    keyframes: sorted(keyframes),
    registeredProperties: sorted(registeredProperties),
  };
}

const api = extractApi(await readFile(input, "utf8"));

if (flag === "--write") {
  await writeFile(baselinePath, JSON.stringify(api, null, 2) + "\n");
  console.log(`Wrote API baseline to ${baselinePath}`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(await readFile(baselinePath, "utf8"));
} catch {
  console.error(`Missing or unreadable baseline ${baselinePath}. Run with --write to create it.`);
  process.exit(1);
}

let drift = false;
for (const key of ["selectors", "properties", "keyframes", "registeredProperties"]) {
  const expected = new Set(baseline[key] ?? []);
  const actual = new Set(api[key] ?? []);
  const removed = [...expected].filter((x) => !actual.has(x));
  const added = [...actual].filter((x) => !expected.has(x));
  for (const name of removed) {
    console.error(`REMOVED ${key}: ${name}`);
    drift = true;
  }
  for (const name of added) {
    console.error(`ADDED ${key}: ${name}`);
    drift = true;
  }
}

if (drift) {
  console.error(
    "\nPublic CSS API drifted from api-baseline.json." +
      "\nThe grounding rewrite must not add or remove selectors or --amb-* properties." +
      "\nIf this change is intentional, refresh the baseline with --write and call it out in the PR.",
  );
  process.exit(1);
}

console.log("CSS API matches baseline.");
