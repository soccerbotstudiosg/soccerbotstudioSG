import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
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

test("Worker groups cover each whole suite and retain the complete 484-case inventory", () => {
  const files = workerGroups.flatMap(({ id }) => groupFiles(id));
  assert.equal(files.length, 14);
  assert.equal(new Set(files).size, files.length);
  assert.deepEqual(files.sort(), groupFiles());
  assert.deepEqual(
    workerGroups.map(({ id }) => expectedTitles(id).length),
    [125, 195, 164],
  );
  assert.equal(expectedTitles().length, 484);
  assert.throws(() => groupFiles("unknown"));
  validateGroupEvidence(evidence(), identity);
});

test("Worker inventory preserves literal source declaration order before runtime execution", () => {
  const inventory = JSON.parse(
    readFileSync("scripts/worker-test-inventory.json", "utf8"),
  );
  for (const file of groupFiles()) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS,
    );
    const declared = [];
    /** Collect literal cases without executing fixtures or provider harnesses. */
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "test" &&
        ts.isStringLiteral(node.arguments[0])
      )
        declared.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    // Parameterized titles still require complete runtime TAP validation.
    const literalTitles = new Set(declared);
    assert.deepEqual(
      inventory
        .filter((item) => item.file === file && literalTitles.has(item.title))
        .map((item) => item.title),
      declared,
      file,
    );
  }
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
    log.replace(
      `# Subtest: ${expected[0]}\n# Subtest: ${expected[1]}`,
      `# Subtest: ${expected[1]}\n# Subtest: ${expected[0]}`,
    ),
    ...["fail", "skipped", "cancelled", "todo"].map((key) =>
      log.replace(`# ${key} 0`, `# ${key} 1`),
    ),
    log.replace(`# pass ${expected.length}`, `# pass ${expected.length - 1}`),
  ]) {
    assert.notEqual(
      bad,
      log,
      "Negative fixture must actually alter the receipt",
    );
    assert.throws(() => validateRuntimeLog(bad, expected));
  }
});
