import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import {
  workerGroups,
  groupFiles,
  expectedTitles,
  validateRuntimeLog,
  workerIdentity,
  validateGroupEvidence,
} from "./worker-groups.mjs";
import assert from "node:assert/strict";
const mode = process.argv[2] || "all";
const group = process.argv[3];
assert.ok(["all", "group", "merge"].includes(mode));
if (mode === "group") groupFiles(group);
else assert.equal(group, undefined);
expectedTitles();
const initialIdentity = mode === "all" ? null : workerIdentity();
const dir = "test-results";
mkdirSync(dir, { recursive: true });
const env = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
  WRANGLER_LOG_PATH: "test-results/wrangler-logs",
};
const commands = [
  ["source", "node", ["scripts/check-worker.mjs"]],
  [
    "types-generate",
    "node",
    ["node_modules/wrangler/bin/wrangler.js", "types", "worker/runtime.d.ts"],
  ],
  [
    "telemetry-types-generate",
    "node",
    [
      "node_modules/wrangler/bin/wrangler.js",
      "types",
      "worker/telemetry-env.d.ts",
      "--config",
      "wrangler.telemetry.jsonc",
      "--env-interface",
      "TelemetryEnv",
      "--include-runtime=false",
      "--strict-vars=false",
    ],
  ],
  [
    "types",
    "node",
    ["node_modules/typescript/bin/tsc", "-p", "worker/tsconfig.json"],
  ],
  [
    "runtime",
    "node",
    [
      "--test",
      "--test-reporter=tap",
      "--test-concurrency=2",
      ...(mode === "group" ? groupFiles(group) : groupFiles()),
    ],
  ],
];
if (mode === "group" && group === "sustained")
  commands.push(["load-smoke", "node", ["scripts/run-load.mjs", "--smoke"]]);
const receipt = { status: "running", providerRequests: 0, commands: [] };
for (const [name, cmd, args] of commands.filter(([name]) =>
  mode === "group"
    ? ["runtime", "load-smoke"].includes(name)
    : mode === "merge"
      ? name !== "runtime"
      : true,
)) {
  const r = spawnSync(cmd, args, { env, encoding: "utf8" });
  const output = (r.stdout || "") + (r.stderr || "");
  writeFileSync(
    `${dir}/worker-${mode === "group" ? `${group}-` : ""}${name}.log`,
    output,
  );
  process.stdout.write(output);
  receipt.commands.push({ name, exitCode: r.status });
  if (r.status !== 0) {
    receipt.status = "failed";
    break;
  }
  if (name === "runtime") {
    try {
      validateRuntimeLog(
        output,
        expectedTitles(mode === "group" ? group : undefined),
      );
    } catch (error) {
      receipt.status = "failed";
      receipt.error = error.message;
      break;
    }
  }
}
if (receipt.status === "running" && mode === "merge") {
  try {
    assert.deepEqual(
      readdirSync(`${dir}/worker-inputs`).sort(),
      workerGroups
        .map(
          ({ id }) =>
            `worker-group-${id}-${initialIdentity.runId}-${initialIdentity.attempt}`,
        )
        .sort(),
      "Unexpected Worker group artifact directories",
    );
    const evidence = workerGroups.map(({ id }) => {
      const root = `${dir}/worker-inputs/worker-group-${id}-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`;
      return {
        receipt: JSON.parse(
          readFileSync(`${root}/worker-group-${id}.json`, "utf8"),
        ),
        log: readFileSync(`${root}/worker-${id}-runtime.log`, "utf8"),
      };
    });
    assert.deepEqual(workerIdentity(), initialIdentity);
    validateGroupEvidence(evidence, initialIdentity);
    receipt.groups = evidence.map(({ receipt }) => receipt);
    receipt.commands.push({ name: "runtime", exitCode: 0 });
  } catch (error) {
    receipt.status = "failed";
    receipt.error = error.message;
  }
}
if (receipt.status === "running") receipt.status = "passed";
if (mode === "group") {
  receipt.group = group;
  receipt.files = groupFiles(group);
  assert.deepEqual(workerIdentity(), initialIdentity);
  receipt.identity = initialIdentity;
}
writeFileSync(
  `${dir}/${mode === "group" ? `worker-group-${group}` : "verification-worker"}.json`,
  JSON.stringify(receipt, null, 2) + "\n",
);
if (receipt.status !== "passed") process.exitCode = 1;
