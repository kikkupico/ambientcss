import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const [, , task] = process.argv;

if (!task) {
  console.error("Usage: node scripts/run-workspace-task.mjs <build|clean|typecheck>");
  process.exit(1);
}

// Keep deterministic topological order for package-local dependencies.
const WORKSPACES_BY_TASK = {
  build: [
    "packages/ambient-css",
    "packages/ambient-components",
    "apps/demo",
    "apps/docs",
  ],
  clean: [
    "packages/ambient-css",
    "packages/ambient-components",
    "apps/demo",
    "apps/docs",
  ],
  // docs:build is the docs quality gate; docs tsc is noisy with framework-level aliases.
  typecheck: [
    "packages/ambient-css",
    "packages/ambient-components",
    "apps/demo",
  ],
};

const workspaces = WORKSPACES_BY_TASK[task];
if (!workspaces) {
  console.error(`Unsupported task: ${task}`);
  process.exit(1);
}

for (const workspace of workspaces) {
  await new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["run", task], {
      cwd: path.resolve(process.cwd(), workspace),
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${workspace}: pnpm run ${task} failed with exit code ${code}`));
    });
  });
}
