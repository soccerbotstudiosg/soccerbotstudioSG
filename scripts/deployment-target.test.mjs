import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import {
  loadTarget,
  validateTarget,
  targetConfig,
  targetDigest,
  pagesConfig,
} from "./deployment-target.mjs";
import { validateTargetRun } from "./verified-target-run.mjs";
const staging = loadTarget("staging");
const production = {
  ...staging,
  target: "production",
  repository: "client/booking",
  accountId: "b".repeat(32),
  databaseId: "11111111-1111-4111-8111-111111111111",
  workerName: "client-worker",
  databaseName: "client-state",
  origin: "https://booking.example.com",
  coordinatorName: "client-account",
  environment: "production",
  campaignId: "client-production",
  pagesProject: "client-entry",
  access: "closed",
  sandbox: null,
};
test("deployment targets reject incomplete identities, secret fields and production activation", () => {
  assert.throws(() => loadTarget("production"));
  assert.throws(() => loadTarget("../staging"));
  assert.deepEqual(validateTarget(production), production);
  for (const change of [
    { accountId: "" },
    { databaseId: "" },
    { origin: "https://booking.example.com/path" },
    { origin: "http://example.com" },
    { turnstileSitekey: "" },
    { access: "developer-sandbox" },
    { environment: "developer" },
    { pagesProject: "" },
    { apiToken: "not-a-secret" },
  ])
    assert.throws(() => validateTarget({ ...production, ...change }));
});
test("target rendering has no developer identity fallback and seals every public setting", () => {
  const base = {
    name: "old-worker",
    account_id: "old-account",
    d1_databases: [{ binding: "STATE", database_id: "old-db" }],
    vars: { PROVIDER_ACCESS: "disabled", LIVE_CUSTOMER_ACCESS: "disabled" },
  };
  const config = targetConfig(base, production);
  assert.equal(config.account_id, production.accountId);
  assert.equal(config.d1_databases[0].database_id, production.databaseId);
  assert.equal(config.vars.COORDINATOR_NAME, production.coordinatorName);
  assert.equal(config.vars.PROVIDER_ACCESS, "disabled");
  assert.equal(config.workers_dev, false);
  assert.equal(JSON.stringify(config).includes("old-"), false);
  assert.notEqual(
    targetDigest(production),
    targetDigest({ ...production, origin: "https://other.example.com" }),
  );
  assert.deepEqual(pagesConfig(production, "2026-10-08").services, [
    { binding: "BACKEND", service: production.workerName },
  ]);
});
const revision = "a".repeat(40);
const run = {
  id: 42,
  run_attempt: 2,
  repository: { full_name: "client/booking" },
  head_repository: { full_name: "client/booking" },
  head_sha: revision,
  head_branch: "main",
  path: ".github/workflows/verify-target.yml",
  event: "workflow_dispatch",
  status: "completed",
  conclusion: "success",
};
const jobs = ["frontend", "backend", "live-email"].map((name) => ({
  name: `verify / ${name}`,
  conclusion: "success",
  head_sha: revision,
  run_attempt: 2,
}));
const options = {
  repository: "client/booking",
  revision,
  target: "production",
  mainRevision: revision,
};
test("deployment evidence rejects wrong revisions, forks, missing gates and mixed rerun attempts", () => {
  assert.equal(
    validateTargetRun(run, jobs, options),
    "live-email-evidence-42-2",
  );
  for (const patch of [
    { head_sha: "b".repeat(40) },
    { head_branch: "feature" },
    { head_repository: { full_name: "fork/booking" } },
    { path: ".github/workflows/verify.yml" },
    { conclusion: "cancelled" },
    { event: "pull_request" },
  ])
    assert.throws(() => validateTargetRun({ ...run, ...patch }, jobs, options));
  for (const patch of [
    { conclusion: "failure" },
    { run_attempt: 1 },
    { head_sha: "b".repeat(40) },
  ])
    assert.throws(() =>
      validateTargetRun(
        run,
        [{ ...jobs[0], ...patch }, ...jobs.slice(1)],
        options,
      ),
    );
  assert.throws(() => validateTargetRun(run, jobs.slice(1), options));
  assert.throws(() =>
    validateTargetRun(run, jobs, { ...options, mainRevision: "c".repeat(40) }),
  );
  assert.throws(() =>
    validateTargetRun(run, jobs, {
      ...options,
      target: "staging",
      reservation: "",
    }),
  );
  assert.equal(
    validateTargetRun(run, jobs, {
      ...options,
      target: "staging",
      reservation: revision,
    }),
    "live-email-evidence-42-2",
  );
});
test("target workflows isolate credentials and require manual verified-revision deployment", () => {
  const read = (name) =>
    YAML.parse(readFileSync(`.github/workflows/${name}.yml`, "utf8"));
  const verify = read("verify-target");
  assert.deepEqual(Object.keys(verify.jobs).sort(), [
    "backend",
    "frontend",
    "live-email",
  ]);
  assert.equal(JSON.stringify(verify).includes("secrets."), false);
  for (const job of Object.values(verify.jobs)) {
    assert.ok(!job["continue-on-error"]);
    assert.ok(
      job.steps.some((s) => s.run === "node scripts/deployment-target.mjs"),
    );
  }
  for (const target of ["staging", "production"]) {
    const workflow = read(`deploy-${target}`);
    assert.deepEqual(Object.keys(workflow.on), ["workflow_dispatch"]);
    assert.equal(workflow.concurrency["cancel-in-progress"], false);
    assert.ok(!workflow.jobs.deploy.environment);
    const steps = workflow.jobs.deploy.steps;
    assert.equal(steps[0].with.ref, "main");
    assert.equal(steps[3].run, "node scripts/verified-target-run.mjs");
    assert.equal(steps[4].run, "node scripts/deploy-cloudflare.mjs");
    assert.equal(
      steps[4].env.CLOUDFLARE_API_TOKEN,
      `\${{ secrets.${target.toUpperCase()}_CLOUDFLARE_API_TOKEN }}`,
    );
  }
});
