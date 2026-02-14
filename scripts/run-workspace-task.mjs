import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const [, , task] = process.argv;

if (!task) {
  console.error("Usage: node scripts/run-workspace-task.mjs <build|clean|typecheck>");
  process.exit(1);
}

// Keep deterministic topological order for package-local dependencies.
const workspaces = [
  "packages/ambient-css",
  "packages/ambient-components",
  "examples/demo",
  "apps/docs",
];

for (const workspace of workspaces) {
  await new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", task], {
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
      reject(new Error(`${workspace}: npm run ${task} failed with exit code ${code}`));
    });
  });
}
