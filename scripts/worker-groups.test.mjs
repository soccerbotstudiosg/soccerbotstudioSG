import { test } from "node:test";
import assert from "node:assert/strict";
import {
  workerGroups,
  groupFiles,
  expectedTitles,
  validateRuntimeLog,
  validateGroupEvidence,
} from "./worker-groups.mjs";

const identity = {
  revision: "a".repeat(40),
  sourceFingerprint: "b".repeat(64),
  target: "staging",
  repository: "client/repo",
  runId: "1",
  attempt: "1",
};
/** Construct complete synthetic receipts to exercise the aggregation boundary. */
function evidence() {
  return workerGroups.map(({ id }) => {
    const titles = expectedTitles(id);
    return {
      receipt: {
        group: id,
        files: groupFiles(id),
        identity: { ...identity },
        status: "passed",
        commands: [
          { name: "runtime", exitCode: 0 },
          ...(id === "sustained" ? [{ name: "load-smoke", exitCode: 0 }] : []),
        ],
      },
      log:
        titles.map((title) => `# Subtest: ${title}`).join("\n") +
        `\n# tests ${titles.length}\n# pass ${titles.length}\n# fail 0\n# skipped 0\n# cancelled 0\n# todo 0\n`,
    };
  });
}

test("Worker groups cover each whole suite and retain the complete 461-case inventory", () => {
  const files = workerGroups.flatMap(({ id }) => groupFiles(id));
  assert.equal(files.length, 14);
  assert.equal(new Set(files).size, files.length);
  assert.deepEqual(files.sort(), groupFiles());
  assert.deepEqual(
    workerGroups.map(({ id }) => expectedTitles(id).length),
    [109, 188, 164],
  );
  assert.equal(expectedTitles().length, 461);
  assert.throws(() => groupFiles("unknown"));
  validateGroupEvidence(evidence(), identity);
});

test("Worker aggregation rejects missing duplicate foreign failed and mixed-attempt groups", () => {
  assert.throws(() => validateGroupEvidence(evidence().slice(1), identity));
  const duplicate = evidence();
  duplicate[1] = duplicate[0];
  assert.throws(() => validateGroupEvidence(duplicate, identity));
  for (const key of Object.keys(identity)) {
    const items = evidence();
    items[0].receipt.identity[key] = "foreign";
    assert.throws(() => validateGroupEvidence(items, identity), key);
  }
  for (const change of [
    { status: "failed" },
    { group: "unknown" },
    { files: [] },
    { commands: [{ name: "runtime", exitCode: 1 }] },
  ]) {
    const items = evidence();
    Object.assign(items[0].receipt, change);
    assert.throws(() => validateGroupEvidence(items, identity));
  }
});

test("Worker TAP rejects missing repeated skipped cancelled and failed cases", () => {
  const { log } = evidence()[0];
  const expected = expectedTitles("contracts");
  for (const bad of [
    log.replace(/^# Subtest:.*\n/, ""),
    `# Subtest: ${expected[0]}\n${log}`,
    `${log}\nnot ok 1 - failure`,
    ...["fail", "skipped", "cancelled", "todo"].map((key) =>
      log.replace(`# ${key} 0`, `# ${key} 1`),
    ),
    log.replace("# pass 109", "# pass 108"),
  ])
    assert.throws(() => validateRuntimeLog(bad, expected));
});
