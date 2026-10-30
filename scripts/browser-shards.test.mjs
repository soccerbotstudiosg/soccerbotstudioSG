import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  batchesForShard,
  combineReports,
  validateShards,
} from "./browser-shards.mjs";
import { batchCount, browserEvidenceDirectory } from "./browser-batch-path.mjs";
import { validateResults } from "./verify-test-results.mjs";
const inventory = JSON.parse(
  readFileSync("scripts/test-inventory.json", "utf8"),
);
const names = ["desktop-chromium", "phone-webkit", "tablet-webkit"];
/** Exercise the unchanged complete inventory through independent synthetic batch reports. */
function reportsFor(suite) {
  const reports = Array.from({ length: batchCount }, (_, i) => ({
    config: {
      shard: { current: i + 1, total: batchCount },
      projects: names.map((name) => ({ name, outputDir: `batch-${i}` })),
    },
    suites: [{ specs: [] }],
    errors: [],
    stats: {
      startTime: "2026-10-30T00:00:00Z",
      duration: 1,
      expected: 0,
      unexpected: 0,
      flaky: 0,
      skipped: 0,
    },
  }));
  const cases = inventory
    .filter(
      (item) =>
        item.file.endsWith(".spec.ts") &&
        (suite === "live-email"
          ? item.file === "tests/live-email.spec.ts"
          : item.file !== "tests/live-email.spec.ts"),
    )
    .flatMap((item) => names.map((projectName) => ({ item, projectName })));
  cases.forEach(({ item, projectName }, index) => {
    const report = reports[index % batchCount];
    report.stats.expected++;
    report.suites[0].specs.push({
      file: item.file,
      title: item.title,
      ok: true,
      tests: [
        {
          projectName,
          expectedStatus: "passed",
          status: "expected",
          annotations: [],
          results: [{ status: "passed", retry: 0, errors: [] }],
        },
      ],
    });
  });
  return reports;
}
test("browser shards preserve complete demo and live inventories and reject gaps or duplicates", () => {
  assert.deepEqual(
    [...batchesForShard(1), ...batchesForShard(2)].sort((a, b) => a - b),
    Array.from({ length: batchCount }, (_, i) => i + 1),
  );
  for (const suite of ["demo", "live-email"]) {
    const reports = reportsFor(suite);
    assert.deepEqual(
      validateResults(
        "browser",
        combineReports(reports),
        inventory,
        process.cwd(),
        suite,
      ),
      [],
    );
    assert.throws(() => combineReports(reports.slice(1)));
    const duplicate = structuredClone(reports);
    duplicate[0].suites = structuredClone(duplicate[1].suites);
    duplicate[0].stats = structuredClone(duplicate[1].stats);
    assert.ok(
      validateResults(
        "browser",
        combineReports(duplicate),
        inventory,
        process.cwd(),
        suite,
      ).length,
    );
    const skipped = structuredClone(reports);
    skipped[0].stats.skipped = 1;
    assert.ok(
      validateResults(
        "browser",
        combineReports(skipped),
        inventory,
        process.cwd(),
        suite,
      ).length,
    );
    const retry = structuredClone(reports);
    retry[0].suites[0].specs[0].tests[0].results[0].retry = 1;
    assert.ok(
      validateResults(
        "browser",
        combineReports(retry),
        inventory,
        process.cwd(),
        suite,
      ).length,
    );
    const oversized = structuredClone(reports);
    oversized[0].stats.expected = 3;
    assert.throws(() => combineReports(oversized));
  }
});
test("browser shards reject foreign builds, mixed attempts, failed receipts and unsafe batch paths", () => {
  const build = {
    identity: { gitHead: "a".repeat(40), attempt: "1", runId: "42" },
    export: { files: { "index.html": "digest" } },
  };
  const buildDigest = createHash("sha256")
    .update(JSON.stringify(build))
    .digest("hex");
  const receipts = [1, 2].map((index) => ({
    index,
    batches: batchesForShard(index),
    status: "passed",
    buildDigest,
  }));
  validateShards(receipts, build);
  assert.throws(() => validateShards(receipts.slice(1), build));
  assert.throws(() => validateShards([receipts[0], receipts[0]], build));
  for (const field of ["attempt", "runId", "gitHead"]) {
    const foreign = structuredClone(build);
    foreign.identity[field] = "different";
    assert.throws(() => validateShards(receipts, foreign));
  }
  const changed = structuredClone(build);
  changed.export.files["index.html"] = "changed";
  assert.throws(() => validateShards(receipts, changed));
  const failed = structuredClone(receipts);
  failed[1].status = "running";
  assert.throws(() => validateShards(failed, build));
  for (const value of ["0", "43", "../1", "1/42"])
    assert.throws(() =>
      browserEvidenceDirectory({ SOCCERBOT_BROWSER_BATCH: value }),
    );
  assert.equal(
    browserEvidenceDirectory({ SOCCERBOT_BROWSER_BATCH: "42" }),
    "test-results/browser-batches/42",
  );
});
