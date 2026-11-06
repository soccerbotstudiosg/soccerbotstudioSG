import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import YAML from "yaml";
import { format } from "prettier";

/** Read only a version command's successful standard output. */
function command(name, args) {
  const result = spawnSync(name, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Cannot inspect ${name}`);
  return result.stdout.trim();
}
/** Escape repository values before inserting them into Markdown tables. */
function cell(value) {
  return String(value).replace(
    /[&<>|\r\n]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "|": "&#124;",
        "\r": " ",
        "\n": " ",
      })[c],
  );
}
const mode = process.argv[2];
if (!["write", "check", "report"].includes(mode))
  throw new Error("Use write, check or report");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const lockBytes = readFileSync("package-lock.json");
const lock = JSON.parse(lockBytes);
const workflows = ["verify-target.yml"].map((file) =>
  YAML.parse(readFileSync(`.github/workflows/${file}`, "utf8")),
);
const python = [
  ...new Set(
    workflows.flatMap((workflow) =>
      Object.values(workflow.jobs).flatMap((job) =>
        job.steps
          .filter((step) => step.uses?.startsWith("actions/setup-python@"))
          .map((step) => String(step.with["python-version"])),
      ),
    ),
  ),
].sort();
const direct = { ...pkg.dependencies, ...pkg.devDependencies };
const packages = Object.entries(lock.packages)
  .filter(([location]) => location)
  .map(([location, entry]) => ({
    location,
    name: entry.name || location.split("node_modules/").at(-1),
    version: entry.version,
    direct: Object.hasOwn(direct, location.replace(/^node_modules\//, "")),
    development: !!entry.dev,
    optional: !!entry.optional,
  }))
  .sort((a, b) => a.location.localeCompare(b.location));
const tools = {
  Node: readFileSync(".nvmrc", "utf8").trim(),
  npm: pkg.packageManager,
  "Python (CI series)": python.join(", "),
};
const table = (rows) =>
  "| Item | Version |\n| --- | --- |\n" +
  rows
    .map(([name, version]) => `| ${cell(name)} | ${cell(version)} |`)
    .join("\n");
const document = await format(
  `# Versions

- Versions configured on this branch, generated from the manifests and lockfile.
- This is not a deployed-version receipt.
- Python is a verification tool, not the Cloudflare application runtime; its exact patch version is recorded in each Actions run.

## Toolchain

${table(Object.entries(tools))}

## Direct dependencies

${table(
  Object.keys(direct)
    .sort()
    .map((name) => [name, lock.packages[`node_modules/${name}`].version]),
)}

## Full locked dependency inventory

- Includes transitive dependencies and optional platform packages.
- A locked package is not necessarily installed on every platform or included in the deployed application.
- Paths distinguish multiple versions of the same package.

<details>
<summary>All ${packages.length} locked package entries</summary>

| Lockfile path | Version | Development | Optional |
| --- | --- | --- | --- |
${packages.map((p) => `| ${cell(p.location)} | ${cell(p.version)} | ${p.development ? "yes" : "no"} | ${p.optional ? "yes" : "no"} |`).join("\n")}

</details>

## Refresh and inspect

- Run \`node scripts/versions.mjs write\` after dependency or toolchain changes and commit this file with the update.
- CI checks it against the source manifests; it never commits back to main.
- Dependabot PRs that change these versions need this generated file refreshed before merging.

- Actions verification summaries show observed Node, npm and Python versions, checked-out commit, job and target.
- Download that job's evidence artifact for \`versions.json\` (full lock inventory) and \`versions.md\`.
- Reports describe the verification environment; use the deployment receipt to establish which revision was deployed.
- Cloudflare manages its production runtime independently of the local workerd test package.
`,
  { parser: "markdown" },
);
if (mode === "write") {
  mkdirSync("docs", { recursive: true });
  writeFileSync("docs/versions.md", document);
}
if (mode === "check" && readFileSync("docs/versions.md", "utf8") !== document)
  throw new Error(
    "docs/versions.md is stale: run node scripts/versions.mjs write",
  );
if (mode === "report") {
  const observed = {
    Node: process.version,
    npm: command("npm", ["--version"]),
    Python: command("python3", ["--version"]),
  };
  const report = {
    schemaVersion: 1,
    scope: "verification environment; not deployment proof",
    generatedAt: new Date().toISOString(),
    checkoutRevision: command("git", ["rev-parse", "HEAD"]),
    job: process.env.GITHUB_JOB || "local",
    target: process.env.RELEASE_TARGET || "developer verification",
    runId: process.env.GITHUB_RUN_ID || null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
    lockfileSha256: createHash("sha256").update(lockBytes).digest("hex"),
    configured: tools,
    observed,
    packages,
  };
  const summary = `## Versions — ${cell(report.job)}\n\nVerification environment (${cell(report.target)}), not deployment proof.\n\nChecked-out commit: ${report.checkoutRevision}\n\n${table(Object.entries(observed))}\n\n### Direct dependencies\n\n${table(packages.filter((p) => p.direct).map((p) => [p.name, p.version]))}\n\nFull locked inventory: versions.json in this job's evidence artifact.\n`;
  mkdirSync("test-results", { recursive: true });
  writeFileSync(
    "test-results/versions.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  writeFileSync("test-results/versions.md", summary);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(table(Object.entries(observed)));
}
