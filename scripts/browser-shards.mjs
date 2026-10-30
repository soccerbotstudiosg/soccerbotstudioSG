import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { fingerprint } from "./source-fingerprint.mjs";
import { checkExport, exportInventory } from "./check-export.mjs";
import { releaseProfile } from "./release-profile.mjs";
import { siteBasePath } from "../src/content/site-path.ts";
import { validateResults, validateEngines } from "./verify-test-results.mjs";
import { batchCount, shardCount } from "./browser-batch-path.mjs";
import { runtimeResources } from "./browser-evidence.mjs";
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const write = (file, value) =>
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** Exclude process memory from CI core dumps while retaining crash status and browser traces. */
export function configureBrowserCoreDump({
  enabled = process.env.GITHUB_ACTIONS === "true" &&
    process.platform === "linux",
  read = readFileSync,
  write = writeFileSync,
} = {}) {
  if (!enabled) return null;
  const file = "/proc/self/coredump_filter";
  const before = String(read(file, "utf8")).trim();
  assert.match(before, /^[0-9a-f]+$/i);
  write(file, "0\n");
  const after = String(read(file, "utf8")).trim();
  assert.match(after, /^0+$/);
  return { before, after };
}
/** Partition every batch once across independent runner shards. */
export function batchesForShard(index) {
  assert.ok(Number.isInteger(index) && index >= 1 && index <= shardCount);
  return Array.from({ length: batchCount }, (_, i) => i + 1).filter(
    (i) => (i - 1) % shardCount === index - 1,
  );
}
/** Join original reports, retaining every duplicate/error for strict inventory validation. */
export function combineReports(reports) {
  assert.equal(reports.length, batchCount);
  const first = reports[0];
  const projectConfiguration = (report) =>
    report.config.projects.map((project) => {
      const config = { ...project };
      delete config.outputDir;
      return config;
    });
  for (const [index, report] of reports.entries()) {
    assert.deepEqual(report.config.shard, {
      current: index + 1,
      total: batchCount,
    });
    assert.ok(
      report.stats.expected >= 1 && report.stats.expected <= 2,
      "Each browser batch must pass one or two cases",
    );
    assert.deepEqual(projectConfiguration(report), projectConfiguration(first));
    assert.ok(Array.isArray(report.suites) && Array.isArray(report.errors));
  }
  return {
    config: first.config,
    suites: reports.flatMap((report) => report.suites),
    errors: reports.flatMap((report) => report.errors),
    stats: {
      startTime: first.stats.startTime,
      ...Object.fromEntries(
        ["duration", "expected", "unexpected", "flaky", "skipped"].map(
          (key) => [
            key,
            reports.reduce((total, report) => {
              assert.ok(Number.isFinite(report.stats[key]));
              return total + report.stats[key];
            }, 0),
          ],
        ),
      ),
    },
  };
}
/** Reject missing, duplicated or foreign-run shard receipts before combining evidence. */
export function validateShards(receipts, build) {
  assert.equal(receipts.length, shardCount);
  const seen = new Set();
  for (const receipt of receipts) {
    assert.equal(receipt.status, "passed");
    assert.equal(receipt.buildDigest, digest(build));
    assert.deepEqual(receipt.batches, batchesForShard(receipt.index));
    assert.ok(!seen.has(receipt.index), "Duplicate shard");
    seen.add(receipt.index);
  }
}
/** Bind the public build and every shard to this exact checkout and CI attempt. */
function identity() {
  const profile = releaseProfile();
  return {
    gitHead: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    sourceFingerprint: fingerprint(),
    basePath: siteBasePath,
    bookingMode: profile.bookingMode,
    releaseProfile: profile.name,
    turnstileSitekey: profile.sitekey,
    browserSuite: profile.browserSuite,
    target: process.env.RELEASE_TARGET || null,
    repository: process.env.GITHUB_REPOSITORY || null,
    runId: process.env.GITHUB_RUN_ID || null,
    attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  };
}
/** Require unchanged source and exact shared export bytes at every stage. */
function checkBuild(build) {
  assert.deepEqual(build.identity, identity());
  assert.deepEqual(build.export.files, exportInventory("out"));
}
/** Execute one command without retries and retain its original output. */
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Command failed: ${command} ${args.join(" ")}`,
  );
}
/** Run disjoint batches in fresh Playwright processes while preserving whole test scenarios. */
function executeBatches(batches) {
  const coreDump = configureBrowserCoreDump();
  if (coreDump)
    console.log(
      JSON.stringify({ event: "browser_core_dump_filter", ...coreDump }),
    );
  const failures = [];
  for (const batch of batches) {
    const directory = `test-results/browser-batches/${batch}`;
    mkdirSync(directory, { recursive: true });
    write(`${directory}/storage-before.json`, runtimeResources());
    try {
      run(
        process.execPath,
        [
          "node_modules/@playwright/test/cli.js",
          "test",
          `--shard=${batch}/${batchCount}`,
        ],
        { ...process.env, SOCCERBOT_BROWSER_BATCH: String(batch) },
      );
    } catch (error) {
      failures.push(error.message);
    } finally {
      write(`${directory}/storage-after.json`, runtimeResources());
    }
  }
  assert.deepEqual(
    failures,
    [],
    "One or more browser batches failed; preserve all original evidence",
  );
}
/** Validate the complete device inventory before emitting a releasable receipt. */
function mergeBatches(profile) {
  const reports = [];
  let engines;
  for (let batch = 1; batch <= batchCount; batch++) {
    const directory = `test-results/browser-batches/${batch}`;
    const current = read(`${directory}/browser-engines.json`);
    assert.deepEqual(validateEngines(current), []);
    engines = current;
    reports.push(read(`${directory}/browser.json`));
  }
  const report = combineReports(reports);
  assert.deepEqual(
    validateResults(
      "browser",
      report,
      read("scripts/test-inventory.json"),
      process.cwd(),
      profile.browserSuite,
    ),
    [],
  );
  write("test-results/browser.json", report);
  write("test-results/browser-engines.json", engines);
}
/** Build once, execute shards, or aggregate without rebuilding the tested artifact. */
async function main() {
  const mode = process.argv[2];
  assert.equal(process.version, "v24.19.0");
  mkdirSync("test-results", { recursive: true });
  if (mode === "local") {
    executeBatches(Array.from({ length: batchCount }, (_, i) => i + 1));
    mergeBatches(releaseProfile());
    return;
  }
  assert.ok(["build", "run", "merge"].includes(mode));
  assert.ok(process.env.GITHUB_RUN_ID && process.env.GITHUB_RUN_ATTEMPT);
  const buildPath = "test-results/browser-build.json";
  if (mode === "build") {
    const baseline = identity();
    run("npm", ["run", "build"]);
    assert.deepEqual(identity(), baseline);
    write(buildPath, {
      identity: baseline,
      export: checkExport("out", siteBasePath),
    });
    return;
  }
  const build = read(buildPath);
  checkBuild(build);
  if (mode === "run") {
    const index = Number(process.argv[3]);
    const batches = batchesForShard(index);
    const receipt = {
      index,
      batches,
      buildDigest: digest(build),
      status: "running",
    };
    try {
      executeBatches(batches);
      checkBuild(build);
      receipt.status = "passed";
    } finally {
      write("test-results/browser-shard.json", receipt);
    }
    return;
  }
  const directories = readdirSync("test-results/shard-inputs");
  assert.equal(directories.length, shardCount);
  const receipts = directories.map((directory) =>
    read(`test-results/shard-inputs/${directory}/browser-shard.json`),
  );
  validateShards(receipts, build);
  for (const directory of directories) {
    const root = `test-results/shard-inputs/${directory}`;
    const receipt = read(`${root}/browser-shard.json`);
    assert.deepEqual(
      readdirSync(`${root}/browser-batches`).sort(),
      receipt.batches.map(String).sort(),
    );
    for (const batch of receipt.batches)
      cpSync(
        `${root}/browser-batches/${batch}`,
        `test-results/browser-batches/${batch}`,
        { recursive: true, errorOnExist: true, force: false },
      );
  }
  mergeBatches(build.identity);
  checkBuild(build);
  write("test-results/export.json", build.export);
  write("test-results/verification-browser.json", {
    ...build.identity,
    scope: "browser",
    status: "passed",
    browserExecuted: true,
    export: build.export,
    shards: receipts,
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
