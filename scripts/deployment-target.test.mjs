import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import YAML from "yaml";
import {
  loadTarget,
  validateTarget,
  targetConfig,
  targetDigest,
  pagesConfig,
  isWorkersDevTarget,
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
  coordinatorLocationHint: "apac-ne",
  environment: "production",
  campaignId: "client-production",
  pagesProject: "client-entry",
  access: "closed",
  sandbox: null,
};
test("deployment targets reject incomplete identities, secret fields and production activation", () => {
  assert.equal(loadTarget("production").access, "closed");
  assert.throws(() => loadTarget("../staging"));
  assert.deepEqual(validateTarget(production), production);
  for (const change of [
    { accountId: "" },
    { coordinatorLocationHint: "" },
    { coordinatorLocationHint: "invalid" },
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
  assert.equal(config.vars.COORDINATOR_LOCATION_HINT, "apac-ne");
  assert.equal(targetConfig(base, staging).vars.COORDINATOR_LOCATION_HINT, "");
  assert.notEqual(
    targetDigest(production),
    targetDigest({ ...production, coordinatorLocationHint: "apac-se" }),
  );
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
test("SaaS target seals its dedicated zone and routes all assets through the origin guard", () => {
  const saas = {
    ...production,
    pagesProject: "",
    saasZone: {
      id: "c".repeat(32),
      name: "hosting.example.com",
      fallbackOrigin: "fallback.hosting.example.com",
    },
  };
  assert.deepEqual(validateTarget(saas), saas);
  const config = targetConfig(
    {
      d1_databases: [{}],
      vars: {},
      assets: { binding: "ASSETS", directory: "./out" },
    },
    saas,
  );
  assert.deepEqual(config.routes, [
    { pattern: "*/*", zone_id: saas.saasZone.id },
  ]);
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.assets.binding, "ASSETS");
  assert.notEqual(
    targetDigest(saas),
    targetDigest({
      ...saas,
      saasZone: { ...saas.saasZone, id: "d".repeat(32) },
    }),
  );
  for (const patch of [
    { pagesProject: "client-entry" },
    { origin: "https://hosting.example.com" },
    { saasZone: { ...saas.saasZone, id: "invalid" } },
    { saasZone: { ...saas.saasZone, fallbackOrigin: "foreign.example.com" } },
  ])
    assert.throws(() => validateTarget({ ...saas, ...patch }));
  assert.throws(() => validateTarget({ ...staging, saasZone: saas.saasZone }));
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
const jobs = ["frontend", "backend", "live-email", "worker-runtime"].map(
  (name) => ({
    name: `verify / ${name}`,
    conclusion: "success",
    head_sha: revision,
    run_attempt: 2,
  }),
);
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
  for (const gate of jobs) {
    assert.throws(() =>
      validateTargetRun(
        run,
        jobs.filter((job) => job !== gate),
        options,
      ),
    );
    for (const patch of [
      { conclusion: "failure" },
      { conclusion: "skipped" },
      { run_attempt: 1 },
      { head_sha: "b".repeat(40) },
    ])
      assert.throws(() =>
        validateTargetRun(
          run,
          jobs.map((job) => (job === gate ? { ...job, ...patch } : job)),
          options,
        ),
      );
  }
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
test("target workflows isolate PR credentials and deploy through trusted main after completed verification", () => {
  const read = (name) =>
    YAML.parse(readFileSync(`.github/workflows/${name}.yml`, "utf8"));
  assert.deepEqual(readdirSync(".github/workflows").sort(), [
    "deploy-release.yml",
    "verify-target.yml",
  ]);
  const verify = read("verify-target");
  assert.deepEqual(verify.on.push.branches, ["main"]);
  assert.deepEqual(verify.on.pull_request, { branches: ["main"] });
  assert.deepEqual(verify.on.push, { branches: ["main"] });
  assert.equal(verify.on.pull_request_target, undefined);
  assert.deepEqual(Object.keys(verify.jobs).sort(), [
    "backend",
    "browser-build",
    "browser-shards",
    "frontend",
    "live-email",
    "worker",
  ]);
  assert.equal(JSON.stringify(verify).includes("secrets."), false);
  for (const job of Object.values(verify.jobs)) {
    assert.equal(
      job.steps[0].with.ref,
      "${{ github.event.pull_request.head.sha || github.sha }}",
    );
    assert.ok(!job["continue-on-error"]);
    assert.equal(
      job.container.image,
      `mcr.microsoft.com/playwright:v${JSON.parse(readFileSync("package.json", "utf8")).devDependencies["@playwright/test"]}-noble`,
    );
    assert.equal(job["timeout-minutes"], 20);
    assert.ok(!job.steps.some((s) => s.run?.includes("playwright install")));
    assert.ok(
      job.steps.some((s) => s.run === "node scripts/deployment-target.mjs"),
    );
  }
  const shards = verify.jobs["browser-shards"];
  assert.deepEqual(shards.strategy.matrix, {
    profile: ["backend", "live-email"],
    shard: [1, 2],
  });
  assert.equal(shards.strategy["fail-fast"], false);
  assert.equal(shards.needs, "browser-build");
  assert.equal(
    shards.container.options,
    "${{ matrix.profile == 'live-email' && '--ipc=host --tmpfs /tmp:rw,size=2g' || '--ipc=host' }}",
  );
  assert.ok(
    shards.steps.some(
      (step) =>
        step.run === 'test "$(stat -f -c %T /tmp)" = tmpfs' &&
        step.if === "matrix.profile == 'live-email'",
    ),
  );
  assert.ok(
    shards.steps.some(
      (step) =>
        step.run === "node scripts/browser-shards.mjs run ${{ matrix.shard }}",
    ),
  );
  assert.ok(
    verify.jobs["browser-build"].steps.some(
      (step) => step.run === "node scripts/browser-shards.mjs build",
    ),
  );
  for (const name of [
    "frontend",
    "backend",
    "worker",
    "live-email",
    "browser-build",
  ])
    assert.equal(verify.jobs[name].container.options, "--ipc=host");
  const runtime = verify.jobs.worker;
  assert.deepEqual(
    runtime.steps
      .filter((step) => step.run?.startsWith("npm run"))
      .map((step) => step.run),
    ["npm run verify:worker", "npm run test:load:smoke"],
  );
  assert.equal(runtime.if, undefined);
  for (const name of ["backend", "live-email"]) {
    const gate = verify.jobs[name];
    assert.deepEqual(gate.needs, ["worker", "browser-build", "browser-shards"]);
    assert.equal(gate.if, undefined);
    const download = gate.steps.find(
      (step) =>
        step.uses?.startsWith("actions/download-artifact@") &&
        step.with?.name?.startsWith("worker-evidence-"),
    );
    assert.equal(
      download.uses,
      "actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093",
    );
    assert.deepEqual(download.with, {
      name: "worker-evidence-${{ github.run_id }}-${{ github.run_attempt }}",
      path: "test-results/",
    });
    assert.equal(download.if, undefined);
    assert.ok(
      gate.steps.some(
        (step) => step.run === "node scripts/browser-shards.mjs merge",
      ),
    );
    assert.ok(
      !gate.steps.some(
        (step) =>
          step.run === "npm run build" || step.run === "npm run verify:browser",
      ),
    );
  }
  assert.deepEqual(
    Object.keys(
      YAML.parse(readFileSync(".github/legacy/verify.yml", "utf8")).on,
    ),
    ["workflow_dispatch"],
  );
  const workflow = read("deploy-release");
  assert.deepEqual(Object.keys(workflow.jobs).sort(), [
    "production",
    "staging",
  ]);
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.target.options, [
    "staging",
    "production",
  ]);
  for (const target of ["staging", "production"]) {
    const job = workflow.jobs[target];
    assert.deepEqual(Object.keys(workflow.on), [
      "workflow_run",
      "workflow_dispatch",
    ]);
    assert.deepEqual(workflow.on.workflow_run, {
      workflows: ["Verify deployment target"],
      types: ["completed"],
    });
    assert.ok(
      job.if.includes("github.event.workflow_run.conclusion == 'success'"),
    );
    assert.ok(
      job.if.includes(
        `github.event.workflow_run.event == '${target === "staging" ? "pull_request" : "push"}'`,
      ),
    );
    assert.ok(
      job.if.includes(
        "github.repository == 'soccerbotstudiosg/soccerbotstudioSG'",
      ),
    );
    assert.ok(job.if.includes(`inputs.target == '${target}'`));
    assert.ok(
      job.if.includes(`vars.${target.toUpperCase()}_DEPLOY_ENABLED == 'true'`),
    );
    assert.equal(job.env.RELEASE_TARGET, target);
    assert.equal(job.concurrency.group, `deploy-cloudflare-${target}`);
    assert.equal(job.concurrency["cancel-in-progress"], false);
    assert.ok(!job.environment);
    const steps = job.steps;
    assert.equal(steps[0].with.ref, "main");
    assert.equal(steps[3].run, "node scripts/verified-target-run.mjs");
    assert.equal(steps[4].run, "node scripts/deploy-cloudflare.mjs");
    assert.equal(
      steps[4].env.CLOUDFLARE_API_TOKEN,
      `\${{ secrets.${target.toUpperCase()}_CLOUDFLARE_API_TOKEN }}`,
    );
  }
});

test("closed client Workers.dev entry preserves the existing database and first-use placement", () => {
  const client = loadTarget("production");
  assert.equal(client.databaseId, "e2a21801-0107-4db5-8551-ca1ff338df53");
  assert.equal(client.coordinatorName, "simplybook-production-account");
  assert.equal(client.coordinatorLocationHint, "apac-ne");
  assert.equal(isWorkersDevTarget(client), true);
  const config = targetConfig({ d1_databases: [{}], vars: {} }, client);
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.equal(config.vars.COORDINATOR_LOCATION_HINT, "apac-ne");
  assert.equal(config.assets.run_worker_first, true);
  for (const patch of [
    { origin: "https://another.lucky-poetry-b25e.workers.dev" },
    { origin: "https://soccerbotsg.com" },
    {
      origin:
        "https://soccerbot-production.lucky-poetry-b25e.workers.dev.attacker.invalid",
    },
    { access: "developer-sandbox" },
    { coordinatorLocationHint: "" },
  ])
    assert.throws(() => validateTarget({ ...client, ...patch }));
});

test("automatic staging rejects forks, bots, stale PR heads, closed PRs and untrusted authors", () => {
  const pr = {
    state: "open",
    draft: false,
    user: { login: "owner", type: "User" },
    head: { sha: revision, repo: { full_name: "client/booking" } },
    base: { ref: "main", repo: { full_name: "client/booking" } },
  };
  const automatic = {
    ...run,
    event: "pull_request",
    head_branch: "feature",
    actor: { type: "User" },
    triggering_actor: { type: "User" },
  };
  const opts = {
    ...options,
    target: "staging",
    pullRequest: pr,
    permission: "write",
    attempt: 2,
  };
  assert.equal(
    validateTargetRun(automatic, jobs, opts),
    "live-email-evidence-42-2",
  );
  for (const patch of [
    { state: "closed" },
    { draft: true },
    { user: { login: "dependabot[bot]", type: "Bot" } },
    { head: { ...pr.head, sha: "b".repeat(40) } },
    { head: { ...pr.head, repo: { full_name: "fork/booking" } } },
    { base: { ...pr.base, ref: "other" } },
  ])
    assert.throws(() =>
      validateTargetRun(automatic, jobs, {
        ...opts,
        pullRequest: { ...pr, ...patch },
      }),
    );
  for (const permission of [undefined, "read", "triage", "none"])
    assert.throws(() =>
      validateTargetRun(automatic, jobs, { ...opts, permission }),
    );
  assert.throws(() =>
    validateTargetRun(
      { ...automatic, triggering_actor: { type: "Bot" } },
      jobs,
      opts,
    ),
  );
  assert.throws(() =>
    validateTargetRun(automatic, jobs, { ...opts, attempt: 1 }),
  );
  assert.throws(() =>
    validateTargetRun(automatic, jobs, { ...opts, target: "production" }),
  );
  assert.equal(
    validateTargetRun({ ...run, event: "push" }, jobs, options),
    "live-email-evidence-42-2",
  );
  assert.throws(() =>
    validateTargetRun({ ...run, event: "push" }, jobs, {
      ...options,
      mainRevision: "b".repeat(40),
    }),
  );
});
