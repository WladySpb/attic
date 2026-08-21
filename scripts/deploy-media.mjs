import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicationManifestPath = path.join(siteRoot, "public", "data", "publication-manifest.v1.json");
const deploymentStatePath = path.join(siteRoot, "media-deployment.v1.json");
const mediaRoot = path.join(siteRoot, "public", "media");

export function normalizeMediaMap(value, label = "media_sha256") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, hash]) => {
    if (!key || key.startsWith("/") || key.includes("..") || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`${label} contains an invalid entry: ${key}`);
    }
    return [key.replaceAll("\\", "/"), hash];
  }));
}

export function diffMedia(desiredValue, deployedValue) {
  const desired = normalizeMediaMap(desiredValue, "desired media_sha256");
  const deployed = normalizeMediaMap(deployedValue, "deployed media_sha256");
  const added = Object.keys(desired).filter((key) => !(key in deployed));
  const changed = Object.keys(desired).filter((key) => key in deployed && desired[key] !== deployed[key]);
  const removed = Object.keys(deployed).filter((key) => !(key in desired));
  return {
    added,
    changed,
    removed,
    unchanged: Object.keys(desired).length - added.length - changed.length,
    hasChanges: added.length > 0 || changed.length > 0 || removed.length > 0,
  };
}

async function readJson(file, optional = false) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (optional && error?.code === "ENOENT") return null;
    throw error;
  }
}

async function listFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, child));
    else if (entry.isFile()) files.push(child.split(path.sep).join("/"));
    else throw new Error(`media staging contains a non-file entry: ${child}`);
  }
  return files;
}

async function verifyStagedMedia(desired) {
  const staged = await listFiles(mediaRoot);
  const expected = Object.keys(desired);
  const extras = staged.filter((key) => !(key in desired));
  const missing = expected.filter((key) => !staged.includes(key));
  if (extras.length || missing.length) {
    throw new Error(`media staging does not match the publication manifest (extra: ${extras.join(", ") || "-"}; missing: ${missing.join(", ") || "-"})`);
  }
  for (const key of expected) {
    const payload = await readFile(path.join(mediaRoot, ...key.split("/")));
    const actual = createHash("sha256").update(payload).digest("hex");
    if (actual !== desired[key]) throw new Error(`staged media hash mismatch: ${key}`);
  }
}

async function saveDeploymentState(mediaSha256) {
  const state = `${JSON.stringify({ schema_version: 1, project: "attic-media", media_sha256: mediaSha256 }, null, 2)}\n`;
  const temporary = `${deploymentStatePath}.tmp`;
  await writeFile(temporary, state, "utf8");
  await rename(temporary, deploymentStatePath);
}

function runWrangler() {
  const wrangler = path.join(siteRoot, "node_modules", "wrangler", "bin", "wrangler.js");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, "pages", "deploy", "public/media", "--project-name", "attic-media", "--branch", "main"], {
      cwd: siteRoot,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Wrangler exited with code ${code}`)));
  });
}

function printDiff(diff) {
  console.log(`media: ${diff.unchanged} unchanged, ${diff.added.length} added, ${diff.changed.length} changed, ${diff.removed.length} removed`);
  for (const kind of ["added", "changed", "removed"]) {
    for (const key of diff[kind]) console.log(`${kind}: ${key}`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const publication = await readJson(publicationManifestPath);
  const desired = normalizeMediaMap(publication.media_sha256, "publication manifest media_sha256");
  const deployedState = await readJson(deploymentStatePath, true);
  const deployed = deployedState ? normalizeMediaMap(deployedState.media_sha256, "deployment state media_sha256") : {};
  const diff = diffMedia(desired, deployed);
  printDiff(diff);

  if (args.has("--check")) return;
  await verifyStagedMedia(desired);
  if (args.has("--mark-deployed")) {
    await saveDeploymentState(desired);
    console.log("recorded the externally verified media deployment");
    return;
  }
  if (!diff.hasChanges) {
    console.log("media unchanged; Cloudflare deployment skipped");
    return;
  }
  await runWrangler();
  await saveDeploymentState(desired);
  console.log("media deployment completed and state recorded");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
