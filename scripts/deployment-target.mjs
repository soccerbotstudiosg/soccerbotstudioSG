import assert from "node:assert/strict";
import { readFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { z } from "zod";
const name = z.string().regex(/^[a-z][a-z0-9-]{1,62}$/);
const origin = z
  .string()
  .url()
  .refine(
    (value) => new URL(value).origin === value && value.startsWith("https://"),
  );
const schema = z.strictObject({
  target: z.enum(["staging", "production"]),
  sandbox: z
    .strictObject({
      premiumServiceId: z.string().regex(/^[1-9][0-9]{0,14}$/),
      merchant: name,
      businessId: z.string().uuid(),
    })
    .nullable(),
  repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  accountId: z.string().regex(/^[a-f0-9]{32}$/),
  workerName: name,
  databaseName: name,
  databaseId: z.string().uuid(),
  origin,
  coordinatorName: name,
  coordinatorLocationHint: z.enum(["", "apac-ne", "apac-se"]),
  environment: z.enum(["developer", "production"]),
  campaignId: name,
  turnstileSitekey: z.string().regex(/^0x[a-zA-Z0-9_-]{10,100}$/),
  access: z.enum(["closed", "developer-sandbox"]),
  pagesProject: z.union([name, z.literal("")]),
  pagesBranch: name,
  saasZone: z
    .strictObject({
      id: z.string().regex(/^[a-f0-9]{32}$/),
      name: z.string().regex(/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/),
      fallbackOrigin: z.string(),
    })
    .nullable(),
});
/** Reject incomplete target identities and unsupported production activation. */
export function validateTarget(value) {
  const target = schema.parse(value);
  assert.equal(
    target.environment,
    target.target === "production" ? "production" : "developer",
  );
  if (target.target === "production") {
    assert.equal(
      target.access,
      "closed",
      "Client activation requires separate provider acceptance",
    );
    assert.equal(target.sandbox, null);
    assert.ok(
      target.coordinatorLocationHint,
      "Client coordinator requires explicit placement",
    );
    assert.ok(
      [
        Boolean(target.pagesProject),
        Boolean(target.saasZone),
        isWorkersDevTarget(target),
      ].filter(Boolean).length === 1,
      "Client entry requires exactly one Pages, SaaS or closed Workers.dev target",
    );
  }
  if (target.saasZone) {
    assert.equal(target.target, "production", "SaaS routing is client-only");
    assert.equal(
      target.saasZone.fallbackOrigin,
      `fallback.${target.saasZone.name}`,
    );
    assert.notEqual(
      new URL(target.origin).hostname,
      target.saasZone.name,
      "Custom hostname cannot be the SaaS zone apex",
    );
  }
  if (target.access === "developer-sandbox") assert.ok(target.sandbox);
  return target;
}
/** Load public target configuration without inheriting another account's defaults. */
export function loadTarget(name) {
  assert.ok(["staging", "production"].includes(name));
  const target = validateTarget(
    JSON.parse(readFileSync(`deployment/${name}.json`, "utf8")),
  );
  assert.equal(target.target, name);
  return target;
}
/** Bind artifact configuration to the reviewed public target settings. */
export function targetDigest(target) {
  return createHash("sha256")
    .update(JSON.stringify(validateTarget(target)))
    .digest("hex");
}
/** Recognize an explicit temporary Worker hostname without granting customer access. */
export function isWorkersDevTarget(target) {
  return (
    !target.pagesProject &&
    !target.saasZone &&
    new RegExp(
      `^https://${target.workerName}\\.[a-z0-9-]+\\.workers\\.dev$`,
    ).test(target.origin)
  );
}
/** Render a closed backend while preserving the reviewed runtime and migration schema. */
export function targetConfig(base, target) {
  validateTarget(target);
  return {
    ...base,
    name: target.workerName,
    account_id: target.accountId,
    workers_dev: isWorkersDevTarget(target),
    preview_urls: false,
    ...(target.saasZone
      ? {
          routes: [{ pattern: "*/*", zone_id: target.saasZone.id }],
          assets: { ...base.assets, run_worker_first: true },
        }
      : {}),
    d1_databases: [
      {
        ...base.d1_databases[0],
        database_name: target.databaseName,
        database_id: target.databaseId,
      },
    ],
    vars: {
      ...base.vars,
      DEPLOYMENT_ACCOUNT_ID: target.accountId,
      STATE_DATABASE_ID: target.databaseId,
      APP_ORIGIN: target.origin,
      ENVIRONMENT: target.environment,
      CAMPAIGN_ID: target.campaignId,
      COORDINATOR_NAME: target.coordinatorName,
      COORDINATOR_LOCATION_HINT: target.coordinatorLocationHint,
    },
  };
}
/** Render the Pages entry with an explicit same-account backend binding. */
export function pagesConfig(target, compatibilityDate) {
  validateTarget(target);
  assert.ok(target.pagesProject);
  return {
    name: target.pagesProject,
    pages_build_output_dir: "./pages",
    compatibility_date: compatibilityDate,
    vars: { APP_ORIGIN: target.origin },
    services: [{ binding: "BACKEND", service: target.workerName }],
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const target = loadTarget(process.env.RELEASE_TARGET);
  assert.equal(
    process.env.GITHUB_REPOSITORY,
    target.repository,
    "Target repository mismatch",
  );
  assert.ok(process.env.GITHUB_ENV);
  if (process.env.RELEASE_PROFILE === "live-email")
    appendFileSync(
      process.env.GITHUB_ENV,
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${target.turnstileSitekey}\n`,
    );
}

/** Compose only the supported staging sandbox or closed client release. */
export function releaseConfig(config, target = loadTarget("staging")) {
  if (target.access === "closed") return config;
  return {
    ...config,
    triggers: { crons: ["* * * * *"] },
    vars: {
      ...config.vars,
      PROVIDER_ACCESS: "trusted-reads",
      LIVE_CUSTOMER_ACCESS: "enabled",
      PUBLIC_DISPLAY_WARMING: "enabled",
      PUBLIC_TOKEN_REFRESH_AHEAD: "enabled",
      PREMIUM_SERVICE_ID: target.sandbox.premiumServiceId,
      IDENTITY_DELIVERY: "ongoing",
      LIVE_READBACK: "enabled",
      CHECKOUT_PAYMENT_ROUTE: "hitpay",
      HITPAY_CHECKOUT: "enabled",
      HITPAY_RECOVERY: "enabled",
      HITPAY_WEBHOOK: "enabled",
      HITPAY_MERCHANT: target.sandbox.merchant,
      HITPAY_BUSINESS_ID: target.sandbox.businessId,
      HITPAY_CONTRACT_ACCEPTED: "sandbox-reviewed",
      SIMPLYBOOK_EXTERNAL_PAYMENT: "sandbox-reviewed",
      SIMPLYBOOK_EXTERNAL_PROCESSOR: "manual",
    },
  };
}
