import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const [, , input, output] = process.argv;

if (!input || !output) {
  console.error("Usage: node scripts/build-css.mjs <input.css> <output.css>");
  process.exit(1);
}

// Resolve lightningcss from the caller package so pnpm workspace deps are found.
const requireFromCwd = createRequire(path.resolve(process.cwd(), "package.json"));
const { transform } = requireFromCwd("lightningcss");

const source = await readFile(input);
const { code } = transform({
  filename: input,
  code: source,
  minify: true,
  sourceMap: false,
  drafts: {
    customMedia: true,
  },
  targets: {
    chrome: 109 << 16,
    safari: 16 << 16,
    firefox: 115 << 16,
    edge: 109 << 16,
  },
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, code);
