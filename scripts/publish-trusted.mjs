import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const packages = [
  { name: "@ambientcss/css", dir: "packages/ambient-css" },
  { name: "@ambientcss/components", dir: "packages/ambient-components" },
];

function getLocalVersion(pkgDir) {
  const pkgJsonPath = path.resolve(process.cwd(), pkgDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  return pkg.version;
}

function getPublishedVersion(pkgName) {
  try {
    return execFileSync("npm", ["view", pkgName, "version"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function runOrThrow(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

// Log npm version for debugging
const npmVersion = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
console.log(`Using npm v${npmVersion}`);

for (const pkg of packages) {
  const localVersion = getLocalVersion(pkg.dir);
  const publishedVersion = getPublishedVersion(pkg.name);

  if (publishedVersion === localVersion) {
    console.log(`Skipping ${pkg.name}@${localVersion} (already published)`);
    continue;
  }

  console.log(`Publishing ${pkg.name}@${localVersion} from ${pkg.dir}`);
  runOrThrow(
    "npm",
    ["publish", "--access", "public", "--provenance"],
    path.resolve(process.cwd(), pkg.dir)
  );
}
