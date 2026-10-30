import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadTarget, targetDigest } from "./deployment-target.mjs";
import { validateDeployment } from "./deploy-cloudflare.mjs";

/** Require the deployed bindings to match the reviewed closed target and namespace. */
export function validateFoundationSettings(
  settings,
  target,
  revision,
  namespaceId,
) {
  assert.equal(target.target, "production");
  assert.equal(target.access, "closed");
  assert.match(namespaceId, /^[a-f0-9]{32}$/);
  const binding = (name) => {
    const found = settings.bindings.filter((b) => b.name === name);
    assert.equal(found.length, 1, `Missing or duplicate binding: ${name}`);
    return found[0];
  };
  for (const [name, value] of Object.entries({
    DEPLOYMENT_ACCOUNT_ID: target.accountId,
    STATE_DATABASE_ID: target.databaseId,
    ENVIRONMENT: "production",
    SOURCE_REVISION: revision,
    COORDINATOR_NAME: target.coordinatorName,
    COORDINATOR_LOCATION_HINT: target.coordinatorLocationHint,
    APP_ORIGIN: target.origin,
    LIVE_CUSTOMER_ACCESS: "disabled",
    PROVIDER_ACCESS: "disabled",
    IDENTITY_DELIVERY: "disabled",
    HITPAY_CHECKOUT: "disabled",
    HITPAY_RECOVERY: "disabled",
    HITPAY_WEBHOOK: "disabled",
    PUBLIC_DISPLAY_WARMING: "disabled",
    PUBLIC_TOKEN_REFRESH_AHEAD: "disabled",
  })) {
    assert.equal(binding(name).type, "plain_text");
    assert.equal(binding(name).text, value, `Wrong deployed binding: ${name}`);
  }
  assert.equal(binding("STATE").type, "d1");
  assert.equal(binding("STATE").id, target.databaseId);
  assert.equal(binding("COORDINATOR").type, "durable_object_namespace");
  assert.equal(binding("COORDINATOR").namespace_id, namespaceId);
  assert.equal(
    binding("COORDINATOR").class_name,
    "SoccerBotAccountCoordinator",
  );
}

/** Bind the runtime-derived identity to the inspected deployment and operator receipt. */
export function validateFoundationInspection(value, expected) {
  for (const [key, wanted] of Object.entries(expected))
    assert.equal(value[key], wanted, `Wrong runtime identity: ${key}`);
  assert.match(value.coordinatorId, /^[a-f0-9]{64}$/);
  assert.ok(["pending", "registered"].includes(value.registration));
}

/** Separate inspection, immutable registration and first-use initialization into explicit phases. */
export async function runFoundationPhase({
  phase,
  service,
  expected,
  namespaceId,
  digest,
  receipt,
}) {
  assert.ok(["inspect", "register", "initialize"].includes(phase));
  const observed = await service.inspect(expected);
  validateFoundationInspection(observed, expected);
  const identity = { ...expected, coordinatorId: observed.coordinatorId };
  if (phase !== "inspect") {
    assert.equal(receipt?.namespaceId, namespaceId);
    assert.equal(receipt?.targetDigest, digest);
    assert.deepEqual(receipt?.identity, identity);
  }
  let result = observed;
  if (phase === "register") {
    // A lost acknowledgement is resolved by a new inspection, never by reset/update.
    result = await service.register(identity);
    validateFoundationInspection(result, identity);
    assert.equal(result.registration, "registered");
    const verified = await service.inspect(expected);
    validateFoundationInspection(verified, identity);
    assert.equal(verified.registration, "registered");
  }
  if (phase === "initialize") {
    assert.equal(observed.registration, "registered");
    result = await service.initialize(identity);
    assert.equal(result.coordinatorId, identity.coordinatorId);
    assert.equal(
      result.alarm,
      null,
      "Unexpected coordinator alarm; inspect without clearing it",
    );
    assert.equal(
      result.pendingWakeups,
      0,
      "Unexpected retained work; inspect without cleanup",
    );
    assert.equal(
      result.location,
      null,
      "Location requires independent platform evidence",
    );
  }
  const recorded =
    phase === "initialize"
      ? {
          coordinatorId: result.coordinatorId,
          alarm: result.alarm,
          pendingWakeups: result.pendingWakeups,
          location: result.location,
        }
      : { ...identity, registration: result.registration };
  return {
    phase,
    identity,
    namespaceId,
    targetDigest: digest,
    result: recorded,
  };
}

/** Execute only against a sealed verified artifact and an authenticated remote service binding. */
async function main() {
  const [phase, directory, revision, namespaceId, output, previous] =
    process.argv.slice(2);
  assert.ok(
    ["inspect", "register", "initialize"].includes(phase),
    "Usage: foundation-setup.mjs inspect|register|initialize ARTIFACT_DIR REVISION NAMESPACE_ID OUTPUT [PREVIOUS_RECEIPT]",
  );
  assert.ok(output);
  assert.ok(!existsSync(output), "Use a new output receipt path");
  assert.ok(
    existsSync(path.dirname(path.resolve(output))),
    "Receipt directory must exist",
  );
  const previousReceipt = previous
    ? JSON.parse(readFileSync(previous, "utf8"))
    : undefined;
  if (phase !== "inspect")
    assert.ok(previousReceipt, "Inspection receipt required before mutation");
  const target = loadTarget("production");
  validateDeployment(directory, revision, target);
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, target.accountId);
  const token = process.env.CLOUDFLARE_API_TOKEN;
  assert.ok(
    token,
    "CLOUDFLARE_API_TOKEN required; never pass it as a CLI argument",
  );
  const api = async (suffix, body) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${target.accountId}${suffix}`,
      {
        method: body ? "POST" : "GET",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    assert.ok(
      response.ok,
      `Cloudflare management request failed: ${response.status}`,
    );
    const data = await response.json();
    assert.equal(data.success, true, "Cloudflare management request rejected");
    return data.result;
  };
  const settings = await api(`/workers/scripts/${target.workerName}/settings`);
  validateFoundationSettings(settings, target, revision, namespaceId);
  const migrations = await api(`/d1/database/${target.databaseId}/query`, {
    sql: "SELECT name FROM d1_migrations ORDER BY name",
  });
  assert.equal(migrations[0].success, true);
  assert.deepEqual(
    migrations[0].results.map((x) => x.name),
    readdirSync(`${directory}/developer-release/migrations`)
      .filter((x) => x.endsWith(".sql"))
      .sort(),
  );
  const temporary = mkdtempSync(path.join(tmpdir(), "soccerbot-foundation-"));
  let proxy;
  try {
    const configPath = path.join(temporary, "wrangler.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        name: "soccerbot-foundation-management-client",
        account_id: target.accountId,
        compatibility_date: "2026-10-01",
        services: [
          {
            binding: "MANAGEMENT",
            service: target.workerName,
            entrypoint: "FoundationManagement",
            remote: true,
          },
        ],
      }),
    );
    const { getPlatformProxy } = await import("wrangler");
    proxy = await getPlatformProxy({
      configPath,
      persist: false,
      remoteBindings: true,
      envFiles: [],
    });
    const receipt = await runFoundationPhase({
      phase,
      service: proxy.env.MANAGEMENT,
      namespaceId,
      digest: targetDigest(target),
      expected: {
        accountId: target.accountId,
        databaseId: target.databaseId,
        coordinatorName: target.coordinatorName,
        locationHint: target.coordinatorLocationHint,
        revision,
      },
      receipt: previousReceipt,
    });
    writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    console.log(`Foundation ${phase} completed; receipt: ${output}`);
  } finally {
    await proxy?.dispose();
    rmSync(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error(
      "Foundation setup stopped. Preserve prior receipts; inspect current state before retrying. No reset or overwrite was attempted.",
    );
    process.exitCode = 1;
  });
