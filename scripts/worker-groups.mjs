import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fingerprint } from "./source-fingerprint.mjs";

// Whole suites are the scheduling boundary; scenario steps are never sharded.
export const workerGroups = [
  {
    id: "contracts",
    suites: [
      "catalogue",
      "provider-queue",
      "hitpay",
      "webhook",
      "telemetry",
      "pages",
    ],
  },
  {
    id: "sustained",
    suites: ["combined-hold", "runtime", "native", "foundation"],
  },
  {
    id: "recovery",
    suites: [
      "recovery",
      "provider",
      "identity",
      "identity-delivery",
      "enquiry",
    ],
  },
];

/** Select complete suites and reject an unknown or incomplete partition. */
export function groupFiles(group) {
  const all = workerGroups
    .flatMap(({ suites }) =>
      suites.map((name) => `worker/tests/${name}.test.mjs`),
    )
    .sort();
  assert.equal(
    new Set(all).size,
    all.length,
    "Duplicate Worker suite assignment",
  );
  assert.deepEqual(
    all,
    readdirSync("worker/tests")
      .filter((name) => name.endsWith(".test.mjs"))
      .map((name) => `worker/tests/${name}`)
      .sort(),
    "Unassigned Worker suite",
  );
  if (group === undefined) return all;
  const selected = workerGroups.find(({ id }) => id === group);
  assert.ok(selected, "Unknown Worker group");
  return selected.suites.map((name) => `worker/tests/${name}.test.mjs`).sort();
}

/** Select the complete file/title inventory without filtering individual cases. */
export function expectedTitles(group) {
  const inventory = JSON.parse(
    readFileSync("scripts/worker-test-inventory.json", "utf8"),
  );
  assert.deepEqual(
    [...new Set(inventory.map((item) => item.file))].sort(),
    groupFiles(),
  );
  assert.equal(
    new Set(inventory.map((item) => `${item.file}\0${item.title}`)).size,
    inventory.length,
  );
  for (const item of inventory)
    assert.ok(typeof item.title === "string" && item.title.length);
  const files = groupFiles(group);
  return inventory
    .filter((item) => files.includes(item.file))
    .map((item) => item.title);
}

/** Reject missing, duplicate, skipped or failed runtime cases in original TAP. */
export function validateRuntimeLog(log, expected) {
  assert.deepEqual(
    [...log.matchAll(/^# Subtest: (.+)$/gm)].map((match) => match[1]),
    expected,
  );
  for (const name of ["fail", "skipped", "cancelled", "todo"])
    assert.match(log, new RegExp(`^# ${name} 0$`, "m"));
  for (const name of ["tests", "pass"])
    assert.match(log, new RegExp(`^# ${name} ${expected.length}$`, "m"));
  assert.doesNotMatch(log, /^not ok /m);
}

/** Bind Worker evidence to the source, target and exact CI run attempt. */
export function workerIdentity() {
  const identity = {
    revision: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    sourceFingerprint: fingerprint(),
    target: process.env.RELEASE_TARGET || null,
    repository: process.env.GITHUB_REPOSITORY || null,
    runId: process.env.GITHUB_RUN_ID || null,
    attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  };
  if (process.env.GITHUB_ACTIONS === "true")
    for (const value of Object.values(identity)) assert.ok(value);
  return identity;
}

/** Require every named group once with complete matching evidence before release. */
export function validateGroupEvidence(evidence, identity) {
  assert.equal(evidence.length, workerGroups.length);
  const seen = new Set();
  for (const { receipt, log } of evidence) {
    assert.equal(receipt.status, "passed");
    assert.deepEqual(receipt.identity, identity);
    assert.deepEqual(receipt.files, groupFiles(receipt.group));
    assert.ok(!seen.has(receipt.group), "Duplicate Worker group");
    seen.add(receipt.group);
    assert.deepEqual(receipt.commands, [
      { name: "runtime", exitCode: 0 },
      ...(receipt.group === "sustained"
        ? [{ name: "load-smoke", exitCode: 0 }]
        : []),
    ]);
    validateRuntimeLog(log, expectedTitles(receipt.group));
  }
  assert.deepEqual([...seen].sort(), workerGroups.map(({ id }) => id).sort());
}
