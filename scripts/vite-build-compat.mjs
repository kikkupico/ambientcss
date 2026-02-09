import crypto from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = crypto.webcrypto;
}
if (typeof crypto.getRandomValues !== "function" && crypto.webcrypto?.getRandomValues) {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}

const requireFromCwd = createRequire(path.resolve(process.cwd(), "package.json"));
const viteEntry = requireFromCwd.resolve("vite");
const viteModule = await import(viteEntry);
const build = viteModule.build ?? viteModule.default?.build;

if (typeof build !== "function") {
  throw new TypeError("Unable to resolve Vite build API");
}

await build();
