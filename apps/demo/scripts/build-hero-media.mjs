#!/usr/bin/env node
// Regenerates apps/demo/src/assets/hero-film.{mp4,webm} and hero-poster.jpg
// from the root ambientcss.mp4. Run this after tools/hero-gif produces a new
// cut of the hero film — the demo intentionally serves a downscaled copy
// (the film never displays wider than 720 CSS px, see .hero-film in
// App.css) rather than importing the root file directly, so the copies can
// go stale and must be rebuilt by hand.
//
// Usage: node apps/demo/scripts/build-hero-media.mjs

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const source = path.join(repoRoot, "ambientcss.mp4");
const destDir = path.join(here, "../src/assets");

if (!existsSync(source)) {
  console.error(`Source film not found: ${source}`);
  process.exit(1);
}

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("ffmpeg is required (brew install ffmpeg) but was not found on PATH.");
  process.exit(1);
}

const scale = "scale=1440:-2"; // 2x the film's 720px CSS max-width

function run(args) {
  console.log("ffmpeg", args.join(" "));
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

run([
  "-y", "-i", source,
  "-vf", scale,
  "-c:v", "libx264", "-preset", "slow", "-crf", "26",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
  path.join(destDir, "hero-film.mp4"),
]);

run([
  "-y", "-i", source,
  "-vf", scale,
  "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1", "-an",
  path.join(destDir, "hero-film.webm"),
]);

run([
  "-y", "-i", source,
  "-vf", scale,
  "-frames:v", "1", "-q:v", "4",
  path.join(destDir, "hero-poster.jpg"),
]);

console.log("Done. Review the output before committing.");
