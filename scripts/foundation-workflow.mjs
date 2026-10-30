import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { loadTarget } from "./deployment-target.mjs";
import { readHealth } from "./deploy-cloudflare.mjs";

/** Stop setup unless the final health reports this registered, still-closed production. */
export function validateRegisteredHealth(health, revision, origin) {
  assert.equal(health.revision, revision);
  assert.equal(health.origin, origin);
  assert.equal(health.environment, "production");
  assert.equal(health.foundationRegistration, "registered");
  assert.equal(health.liveCustomerAccess, "disabled");
  assert.equal(health.providerAccess, "disabled");
  assert.equal(health.effectiveProviderAccess, "disabled");
}

/** Run the three separately receipted phases in order and stop on the first failure. */
export async function setupFoundation({
  revision,
  namespaceId,
  directory,
  run,
  health,
  origin,
}) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.match(namespaceId, /^[a-f0-9]{32}$/);
  const inspection = `${directory}/foundation-inspection.json`;
  for (const phase of ["inspect", "register", "initialize"]) {
    const output =
      phase === "inspect"
        ? inspection
        : `${directory}/foundation-${phase}.json`;
    await run([
      "scripts/foundation-setup.mjs",
      phase,
      directory,
      revision,
      namespaceId,
      output,
      ...(phase === "inspect" ? [] : [inspection]),
    ]);
  }
  const result = await health(origin);
  validateRegisteredHealth(result, revision, origin);
  return {
    status: "passed",
    revision,
    namespaceId,
    health: result,
    placement: "unverified",
  };
}

/** Restrict credentialed orchestration to the manually dispatched trusted main workflow. */
export function validateSetupContext(env) {
  assert.equal(env.GITHUB_REPOSITORY, "soccerbotstudiosg/soccerbotstudioSG");
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  assert.equal(env.GITHUB_EVENT_NAME, "workflow_dispatch");
  assert.equal(env.RELEASE_TARGET, "production");
  assert.equal(env.GITHUB_SHA, env.RELEASE_REVISION);
  assert.equal(env.VERIFIED_TARGET_RUN, env.VERIFY_RUN_ID);
  assert.match(env.VERIFY_RUN_ID || "", /^[1-9][0-9]*$/);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  validateSetupContext(process.env);
  const directory = "work/deploy-evidence";
  const receipt = await setupFoundation({
    revision: process.env.RELEASE_REVISION,
    namespaceId: process.env.FOUNDATION_NAMESPACE_ID,
    directory,
    origin: loadTarget("production").origin,
    run: (args) => execFileSync(process.execPath, args, { stdio: "inherit" }),
    health: readHealth,
  });
  writeFileSync(
    `${directory}/foundation-complete.json`,
    JSON.stringify(receipt, null, 2) + "\n",
    { flag: "wx" },
  );
}
