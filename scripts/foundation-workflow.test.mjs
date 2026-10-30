import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import {
  setupFoundation,
  validateRegisteredHealth,
  validateSetupContext,
} from "./foundation-workflow.mjs";
const revision = "a".repeat(40),
  namespaceId = "b".repeat(32),
  origin = "https://production.example.com";
const health = {
  revision,
  origin,
  environment: "production",
  foundationRegistration: "registered",
  liveCustomerAccess: "disabled",
  providerAccess: "disabled",
  effectiveProviderAccess: "disabled",
};
test("foundation workflow runs ordered receipted phases and stops on a failed phase", async () => {
  for (const fail of [null, "inspect", "register", "initialize"]) {
    const calls = [],
      probes = [];
    const run = async (args) => {
      calls.push(args);
      if (args[1] === fail) throw new Error("phase failed");
    };
    const result = setupFoundation({
      revision,
      namespaceId,
      origin,
      directory: "evidence",
      run,
      health: async (url) => {
        probes.push(url);
        return health;
      },
    });
    if (fail) await assert.rejects(result, /phase failed/);
    else assert.equal((await result).placement, "unverified");
    const expected = ["inspect", "register", "initialize"];
    assert.deepEqual(
      calls.map((x) => x[1]),
      fail ? expected.slice(0, expected.indexOf(fail) + 1) : expected,
    );
    for (const args of calls) {
      assert.deepEqual(args.slice(2, 5), ["evidence", revision, namespaceId]);
      if (args[1] !== "inspect")
        assert.equal(args[6], "evidence/foundation-inspection.json");
    }
    assert.deepEqual(probes, fail ? [] : [origin]);
  }
});
test("foundation completion rejects pending foreign stale or open health", () => {
  validateRegisteredHealth(health, revision, origin);
  for (const key of Object.keys(health))
    assert.throws(() =>
      validateRegisteredHealth({ ...health, [key]: "wrong" }, revision, origin),
    );
});
test("foundation setup requires exact verified main and manual production dispatch", () => {
  const env = {
    GITHUB_REPOSITORY: "soccerbotstudiosg/soccerbotstudioSG",
    GITHUB_REF: "refs/heads/main",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    RELEASE_TARGET: "production",
    GITHUB_SHA: revision,
    RELEASE_REVISION: revision,
    VERIFIED_TARGET_RUN: "42",
    VERIFY_RUN_ID: "42",
  };
  validateSetupContext(env);
  for (const key of Object.keys(env))
    assert.throws(() => validateSetupContext({ ...env, [key]: "wrong" }));
});
test("foundation dispatch shares production lock and never replaces automatic deployment", () => {
  const workflow = YAML.parse(
    readFileSync(".github/workflows/deploy-release.yml", "utf8"),
  );
  assert.equal(
    workflow.on.workflow_dispatch.inputs.operation.default,
    "deploy",
  );
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.operation.options, [
    "deploy",
    "setup-foundation",
  ]);
  const job = workflow.jobs.production;
  assert.deepEqual(job.concurrency, {
    group: "deploy-cloudflare-production",
    "cancel-in-progress": false,
  });
  assert.equal(job.steps[0].with.ref, "main");
  const setup = job.steps.find(
    (s) => s.run === "node scripts/foundation-workflow.mjs",
  );
  assert.equal(
    setup.if,
    "github.event_name == 'workflow_dispatch' && inputs.operation == 'setup-foundation'",
  );
  assert.equal(
    setup.env.CLOUDFLARE_API_TOKEN,
    "${{ secrets.PRODUCTION_CLOUDFLARE_API_TOKEN }}",
  );
  assert.equal(
    job.steps.find((s) => s.run === "node scripts/deploy-cloudflare.mjs").if,
    "inputs.operation != 'setup-foundation'",
  );
  assert.ok(
    workflow.jobs.staging.if.startsWith(
      "inputs.operation != 'setup-foundation'",
    ),
  );
  assert.ok(
    job.steps.findIndex(
      (s) => s.run === "node scripts/verified-target-run.mjs",
    ) < job.steps.indexOf(setup),
  );
  assert.ok(
    job.steps
      .find((s) => s.if === "always()")
      .with.path.includes("foundation-*.json"),
  );
});
