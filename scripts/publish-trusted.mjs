import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
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

async function setupOIDCAuth() {
  const idTokenUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const idTokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  if (!idTokenUrl || !idTokenRequestToken) {
    console.log("No OIDC environment detected, skipping OIDC auth setup");
    return;
  }

  console.log("Requesting OIDC token from GitHub Actions...");
  const oidcResponse = await fetch(
    `${idTokenUrl}&audience=https://registry.npmjs.org`,
    { headers: { Authorization: `Bearer ${idTokenRequestToken}` } }
  );
  if (!oidcResponse.ok) {
    throw new Error(`Failed to get OIDC token: ${oidcResponse.status} ${oidcResponse.statusText}`);
  }
  const { value: oidcToken } = await oidcResponse.json();

  console.log("Exchanging OIDC token for npm publish token...");
  const npmResponse = await fetch(
    "https://registry.npmjs.org/-/npm/v1/security/oidc/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: oidcToken }),
    }
  );
  if (!npmResponse.ok) {
    const body = await npmResponse.text();
    throw new Error(`Failed to exchange OIDC token with npm: ${npmResponse.status} ${npmResponse.statusText}\n${body}`);
  }
  const { token } = await npmResponse.json();

  console.log("Setting up npm auth...");
  const npmrcPath = path.join(homedir(), ".npmrc");
  writeFileSync(
    npmrcPath,
    `//registry.npmjs.org/:_authToken=${token}\n`,
  );
  process.env.NODE_AUTH_TOKEN = token;
  process.env.NPM_TOKEN = token;
}

await setupOIDCAuth();

for (const pkg of packages) {
  const localVersion = getLocalVersion(pkg.dir);
  const publishedVersion = getPublishedVersion(pkg.name);

  if (publishedVersion === localVersion) {
    console.log(`Skipping ${pkg.name}@${localVersion} (already published)`);
    continue;
  }

  console.log(`Publishing ${pkg.name}@${localVersion} from ${pkg.dir}`);
  runOrThrow(
    "pnpm",
    ["publish", "--access", "public", "--provenance", "--no-git-checks"],
    path.resolve(process.cwd(), pkg.dir)
  );
}
