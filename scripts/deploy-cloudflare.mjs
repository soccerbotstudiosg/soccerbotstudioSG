// GitHub main deployment consumes the verified artifact; it never builds it.
import assert from "node:assert/strict";
import {
  releaseConfig,
  loadTarget,
  targetDigest,
  isWorkersDevTarget,
} from "./deployment-target.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { exportInventory } from "./check-export.mjs";
/** Verify sealed release bytes and receipts before allowing deployment. */
export function validateDeployment(directory, revision, target = null) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  const read = (file) =>
    JSON.parse(readFileSync(`${directory}/${file}`, "utf8"));
  const manifest = read("developer-release/manifest.json");
  const inventory = exportInventory(`${directory}/developer-release`);
  delete inventory["manifest.json"];
  assert.deepEqual(inventory, manifest.files, "Artifact file hashes changed");
  assert.equal(manifest.sourceRevision, revision);
  assert.equal(manifest.testedCheckout, revision);
  assert.equal(manifest.releaseProfile, "live-email");
  assert.equal(manifest.bookingMode, "live");
  assert.equal(manifest.basePath, "");
  const worker = read("verification-worker.json");
  const browser = read("verification-browser.json");
  const artifact = read("developer-release-check.json");
  for (const receipt of [worker, browser, artifact])
    assert.equal(receipt.status, "passed");
  assert.equal(browser.gitHead, revision);
  assert.equal(browser.browserExecuted, true);
  assert.equal(browser.bookingMode, "live");
  assert.equal(browser.releaseProfile, "live-email");
  assert.equal(browser.basePath, "");
  assert.equal(artifact.sourceRevision, revision);
  assert.equal(artifact.testedCheckout, revision);
  const closed = read("developer-release/wrangler.json");
  const config = read("developer-release/wrangler-live.json");
  assert.deepEqual(
    config,
    releaseConfig(closed, target || loadTarget("staging")),
  );
  if (target) {
    assert.deepEqual(manifest.target, target);
    assert.equal(manifest.targetDigest, targetDigest(target));
    assert.equal(config.name, target.workerName);
    assert.equal(config.account_id, target.accountId);
    assert.equal(config.d1_databases[0].database_id, target.databaseId);
    assert.equal(config.d1_databases[0].database_name, target.databaseName);
    assert.equal(config.vars.DEPLOYMENT_ACCOUNT_ID, target.accountId);
    assert.equal(config.vars.STATE_DATABASE_ID, target.databaseId);
    assert.equal(config.vars.APP_ORIGIN, target.origin);
    assert.equal(config.workers_dev, isWorkersDevTarget(target));
    assert.equal(config.preview_urls, false);
    if (target.target === "production")
      assert.equal(config.assets.run_worker_first, true);
    if (target.saasZone) {
      assert.deepEqual(config.routes, [
        { pattern: "*/*", zone_id: target.saasZone.id },
      ]);
      assert.equal(config.assets.run_worker_first, true);
    } else assert.equal(config.routes, undefined);
    assert.equal(config.vars.ENVIRONMENT, target.environment);
    if (target.target === "production")
      assert.equal(config.vars.CLIENT_SANDBOX_ACCESS, "disabled");
    if (target.hitpaySandbox) {
      assert.equal(
        config.vars.HITPAY_EXPECTED_MERCHANT,
        target.hitpaySandbox.merchant,
      );
      assert.equal(
        config.vars.HITPAY_EXPECTED_BUSINESS_ID,
        target.hitpaySandbox.businessId,
      );
    }
    if (target.simplybook) {
      assert.equal(
        config.vars.SIMPLYBOOK_EXPECTED_COMPANY_LOGIN,
        target.simplybook.companyLogin,
      );
      assert.equal(
        config.vars.PRIMARY_SERVICE_ID,
        target.simplybook.primaryServiceId,
      );
      assert.equal(
        config.vars.PREMIUM_SERVICE_ID,
        target.simplybook.premiumServiceId,
      );
    }
    assert.equal(config.vars.COORDINATOR_NAME, target.coordinatorName);
    assert.equal(
      config.vars.COORDINATOR_LOCATION_HINT,
      target.coordinatorLocationHint,
    );
    assert.equal(manifest.turnstileSitekey, target.turnstileSitekey);
    assert.equal(browser.turnstileSitekey, target.turnstileSitekey);
    if (target.access === "closed") {
      for (const key of [
        "PROVIDER_ACCESS",
        "LIVE_CUSTOMER_ACCESS",
        "IDENTITY_DELIVERY",
        "HITPAY_CHECKOUT",
        "HITPAY_RECOVERY",
        "HITPAY_WEBHOOK",
      ])
        assert.equal(config.vars[key], "disabled");
      assert.ok(!config.triggers);
    }
  } else {
    assert.equal(config.name, "soccerbot-dev");
    assert.equal(config.account_id, "517f4f85eb8f982b483dbc05b797fd88");
    assert.equal(
      config.d1_databases[0].database_id,
      "297a991b-70a7-438d-a0e3-39fa3a7f2cee",
    );
  }
  assert.equal(config.vars.SOURCE_REVISION, revision);
  assert.equal(config.no_bundle, true);
  assert.equal(config.main, "./worker/index.js");
  assert.equal(config.assets.directory, "./assets");
  assert.equal(config.vars.CAMPAIGN_END_MS, "0");
  return config;
}
// Cloudflare can acknowledge activation before every edge reports the new
// revision. Observe only the known previous revision while propagation settles;
// never redeploy, accept a third revision, or retry failed/malformed health reads.
/** Observe bounded revision propagation without redeploying the artifact. */
export async function awaitDeploymentHealth({
  revision,
  previousRevision,
  read,
  pause,
  closed = false,
}) {
  const observedRevisions = [];
  for (let observation = 0; observation < 16; observation++) {
    const health = await read();
    assert.match(health.revision, /^[a-f0-9]{40}$/);
    observedRevisions.push(health.revision);
    if (health.revision === revision) {
      assert.equal(health.liveCustomerAccess, closed ? "disabled" : "enabled");
      assert.equal(
        health.effectiveProviderAccess,
        closed ? "disabled" : "trusted-reads",
      );
      assert.equal(health.environment, closed ? "production" : "developer");
      if (closed)
        assert.ok(
          ["pending", "registered"].includes(health.foundationRegistration),
          "Require explicit closed-install foundation state",
        );
      else {
        assert.equal(health.foundationRegistration, "registered");
        assert.equal(health.providerCredentialsPresent, true);
      }
      return { health, observedRevisions };
    }
    assert.equal(
      health.revision,
      previousRevision,
      "Unexpected deployment revision",
    );
    console.log(
      `Waiting for deployed revision (${observation + 1}/16): ${health.revision}`,
    );
    if (observation < 15) await pause(2000);
  }
  throw new Error("Deployed revision did not propagate within 16 observations");
}
/** Capture the predecessor without requiring an existing closed first installation. */
export async function readDeploymentPredecessor(origin, closed) {
  const previous = await readHealth(origin, { allowMissing: closed });
  if (previous) assert.match(previous.revision, /^[a-f0-9]{40}$/);
  return previous;
}
/** Read canonical health with bounded transport and no redirects. */
export async function readHealth(origin, { allowMissing = false } = {}) {
  const response = await fetch(`${origin}/api/health`, {
    headers: {
      accept: "application/json",
      "User-Agent": "SoccerBot-deployment-verification",
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (allowMissing && response.status === 404) return null;
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.ok(health && typeof health === "object", "Invalid deployment health");
  return health;
}
/** Reject foreign zones, inactive fallback origins and competing routes before writes. */
export function verifySaasResources(
  target,
  { zone, fallback, routes, dns },
  deployed = false,
) {
  assert.ok(target.saasZone);
  assert.equal(zone.id, target.saasZone.id);
  assert.equal(zone.name, target.saasZone.name);
  assert.equal(zone.account.id, target.accountId);
  assert.equal(zone.status, "active");
  assert.equal(zone.paused, false);
  assert.equal(fallback.origin, target.saasZone.fallbackOrigin);
  assert.equal(fallback.status, "active");
  assert.equal(dns.length, 1);
  assert.equal(dns[0].name, target.saasZone.fallbackOrigin);
  assert.equal(dns[0].type, "AAAA");
  assert.equal(dns[0].content, "100::");
  assert.equal(dns[0].proxied, true);
  assert.ok(routes.length <= 1, "Dedicated SaaS zone has competing routes");
  for (const route of routes) {
    assert.equal(route.pattern, "*/*");
    assert.equal(
      route.script,
      target.workerName,
      "Do not replace another Worker's route",
    );
  }
  if (deployed)
    assert.equal(
      routes.length,
      1,
      "SaaS Worker route missing after deployment",
    );
}
/** Read the declared SaaS resources without changing DNS or custom hostnames. */
async function readSaasResources(target) {
  const get = async (suffix) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${target.saasZone.id}${suffix}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    assert.equal(response.status, 200, "SaaS resource read failed");
    const result = await response.json();
    assert.equal(result.success, true);
    if (result.result_info?.total_pages)
      assert.ok(result.result_info.total_pages <= 1);
    return result.result;
  };
  const [zone, fallback, routes, dns] = await Promise.all([
    get(""),
    get("/custom_hostnames/fallback_origin"),
    get("/workers/routes"),
    get(
      `/dns_records?name=${encodeURIComponent(target.saasZone.fallbackOrigin)}&per_page=100`,
    ),
  ]);
  return { zone, fallback, routes, dns };
}
/** Check deployed sandbox settings and required secret binding names. */
export function verifySandboxSettings(settings, config) {
  for (const name of [
    "SOURCE_REVISION",
    "CHECKOUT_PAYMENT_ROUTE",
    "HITPAY_CHECKOUT",
    "HITPAY_RECOVERY",
    "HITPAY_WEBHOOK",
    "HITPAY_MERCHANT",
    "HITPAY_BUSINESS_ID",
    "HITPAY_CONTRACT_ACCEPTED",
    "SIMPLYBOOK_EXTERNAL_PAYMENT",
    "SIMPLYBOOK_EXTERNAL_PROCESSOR",
  ]) {
    assert.equal(
      settings.bindings.find(
        (binding) => binding.name === name && binding.type === "plain_text",
      )?.text,
      config.vars[name],
      `Deployed setting mismatch: ${name}`,
    );
  }
  for (const name of [
    "HITPAY_SANDBOX_API_KEY",
    "HITPAY_WEBHOOK_SALT",
    "SIMPLYBOOK_DEV_SIGNING_SECRET",
  ]) {
    assert.ok(
      settings.bindings.some(
        (binding) => binding.name === name && binding.type === "secret_text",
      ),
      `Missing deployed secret binding: ${name}`,
    );
  }
}
/** Deploy the verified main artifact and record its observed revision. */
async function deploy() {
  assert.equal(process.env.GITHUB_REF, "refs/heads/main");
  assert.ok(
    ["push", "workflow_dispatch", "workflow_run"].includes(
      process.env.GITHUB_EVENT_NAME,
    ),
  );
  assert.ok(
    process.env.CLOUDFLARE_API_TOKEN,
    "Configure the repository CLOUDFLARE_API_TOKEN secret",
  );
  const directory = "work/deploy-evidence";
  const target = process.env.RELEASE_TARGET
    ? loadTarget(process.env.RELEASE_TARGET)
    : null;
  const revision = target
    ? process.env.RELEASE_REVISION
    : process.env.GITHUB_SHA;
  if (target) {
    assert.ok(
      process.env.VERIFIED_TARGET_RUN,
      "Require verified workflow evidence",
    );
    assert.equal(target.repository, process.env.GITHUB_REPOSITORY);
    assert.equal(
      target.accountId,
      process.env.CLOUDFLARE_ACCOUNT_ID,
      "Selected account mismatch",
    );
  }
  const config = validateDeployment(directory, revision, target);
  const closed = target?.access === "closed";
  // Verify existing resources in the selected account before any migration/write.
  if (target) {
    if (target.saasZone)
      verifySaasResources(target, await readSaasResources(target));
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${target.accountId}/d1/database/${target.databaseId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        },
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    assert.equal(response.status, 200, "Target database/account access failed");
    const database = await response.json();
    assert.equal(database.success, true);
    assert.equal(database.result.uuid, target.databaseId);
    assert.equal(database.result.name, target.databaseName);
    if (target.pagesProject) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${target.accountId}/pages/projects/${target.pagesProject}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          },
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      assert.equal(
        response.status,
        200,
        "Provision the target Pages project separately",
      );
      const project = await response.json();
      assert.equal(project.success, true);
      assert.equal(project.result.name, target.pagesProject);
      assert.equal(
        project.result.production_branch,
        target.pagesBranch,
        "Pages production branch mismatch",
      );
    }
  }
  const configPath = resolve(directory, "developer-release/wrangler-live.json");
  const wrangler = (args) =>
    execFileSync(
      process.execPath,
      [
        "node_modules/wrangler/bin/wrangler.js",
        ...args,
        "--config",
        configPath,
      ],
      {
        stdio: "inherit",
        env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      },
    );
  const previous = await readDeploymentPredecessor(
    config.vars.APP_ORIGIN,
    closed,
  );
  const checkpoint = (phase) =>
    writeFileSync(
      `${directory}/deployment.json`,
      JSON.stringify(
        {
          status: "incomplete",
          phase,
          sourceRevision: revision,
          target: target?.target || "legacy-developer",
          accountId: config.account_id,
          databaseId: config.d1_databases[0].database_id,
        },
        null,
        2,
      ),
    );
  checkpoint("preflight-passed");
  // Applied migrations are skipped by D1; only reviewed artifact SQL is supplied.
  wrangler(["d1", "migrations", "apply", "STATE", "--remote"]);
  checkpoint("migrations-applied");
  wrangler(["deploy", "--no-bundle"]);
  checkpoint("worker-uploaded");
  if (target?.saasZone)
    verifySaasResources(target, await readSaasResources(target), true);
  if (target?.pagesProject) {
    execFileSync(
      process.execPath,
      [
        "node_modules/wrangler/bin/wrangler.js",
        "pages",
        "deploy",
        "--config",
        resolve(directory, "developer-release/wrangler-pages.json"),
        "--project-name",
        target.pagesProject,
        "--branch",
        target.pagesBranch,
        "--commit-hash",
        revision,
        "--no-bundle",
      ],
      { stdio: "inherit", env: process.env },
    );
  }
  const { health, observedRevisions } = await awaitDeploymentHealth({
    revision,
    previousRevision: previous?.revision,
    closed,
    read: () => readHealth(config.vars.APP_ORIGIN),
    pause: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  });
  const settingsResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.account_id}/workers/scripts/${config.name}/settings`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        Accept: "application/json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    },
  );
  assert.equal(settingsResponse.status, 200, "Deployed settings read failed");
  const settings = await settingsResponse.json();
  assert.equal(settings.success, true);
  if (!closed) verifySandboxSettings(settings.result, config);
  else
    for (const [name, value] of Object.entries(config.vars))
      assert.equal(
        settings.result.bindings.find(
          (b) => b.name === name && b.type === "plain_text",
        )?.text,
        value,
      );
  writeFileSync(
    `${directory}/deployment.json`,
    JSON.stringify(
      {
        sourceRevision: revision,
        status: "deployed",
        observedRevisions,
        versionId: health.versionId,
        origin: config.vars.APP_ORIGIN,
        liveCustomerAccess: closed ? "disabled" : "enabled",
        sandboxSettingsVerified: !closed,
        target: target?.target || "legacy-developer",
        foundationRegistration: health.foundationRegistration,
        verifiedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Deployed verified source ${revision} to ${config.vars.APP_ORIGIN}`,
  );
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) await deploy();
