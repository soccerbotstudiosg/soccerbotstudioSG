import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import ts from "typescript";
import { Miniflare, convertV4MiniflareOptions, Log, LogLevel } from "miniflare";
import { seedFoundation } from "./foundation-fixture.mjs";
const config = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8"),
).config;
let mf,
  db,
  outbound = 0;
const logs = [];
const root = mkdtempSync(path.join(tmpdir(), "soccerbot-foundation-"));
class Capture extends Log {
  log(message) {
    logs.push(message);
  }
}
before(async () => {
  const { outputFiles } = await build({
    entryPoints: ["worker/tests/foundation-harness.ts"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    external: ["cloudflare:workers", "node:async_hooks"],
  });
  mf = new Miniflare({
    ...convertV4MiniflareOptions({
      name: "foundation-test",
      modules: true,
      script: outputFiles[0].text,
      compatibilityDate: config.compatibility_date,
      compatibilityFlags: config.compatibility_flags,
      cf: false,
      bindings: {
        ...config.vars,
        APP_ORIGIN: "https://soccerbot.test",
        SIMPLYBOOK_DEV_API_KEY: "SYNTHETIC_PRIVATE_PUBLIC_KEY",
        SIMPLYBOOK_DEV_ADMIN_API_USER_KEY: "SYNTHETIC_PRIVATE_ADMIN_KEY",
        SIMPLYBOOK_DEV_COMPANY_LOGIN: "synthetic-developer",
        SIMPLYBOOK_DEV_ADMIN_LOGIN: "synthetic-operator",
      },
      d1Databases: { STATE: "synthetic-state", FOREIGN: "foreign-state" },
      durableObjects: {
        COORDINATOR: {
          className: "SoccerBotAccountCoordinator",
          useSQLite: true,
        },
      },
      serviceBindings: { ASSETS: () => new Response("synthetic-asset") },
      outboundService: () => {
        outbound++;
        throw new Error("SYNTHETIC_PRIVATE_NETWORK_ERROR");
      },
      log: new Capture(LogLevel.DEBUG),
      handleStructuredLogs: (entry) => logs.push(entry.message),
    }),
    resourcePersistencePath: root,
    isolatedResourcePersistencePath: root,
  });
  await mf.ready;
  db = await mf.getD1Database("STATE");
  for (const name of [
    "0001_developer_journal.sql",
    "0002_developer_operations.sql",
    "0003_session_effects.sql",
    "0004_operator_read_scopes.sql",
  ])
    await db.exec(
      readFileSync("migrations/" + name, "utf8")
        .replace(/^--.*$/gm, "")
        .replace(/\n/g, " "),
    );
  // Populated pre-upgrade operation data must survive the additive identity table.
  await db.exec(
    "INSERT INTO developer_operations VALUES('synthetic-old','provider_identity',1,'running',NULL)",
  );
  await seedFoundation(mf, db);
  const foreign = await mf.getD1Database("FOREIGN");
  await seedFoundation(mf, foreign);
  // Separate database with a different account manifest, not a missing-table error.
  await foreign.exec(
    "DROP TRIGGER immutable_foundation_identity_update; UPDATE foundation_identity SET account_id='other-account'",
  );
});
after(async () => {
  await mf.dispose();
  rmSync(root, { recursive: true, force: true });
  assert.equal(outbound, 0);
});
async function call(input = {}) {
  const r = await mf.dispatchFetch("https://test-driver.test/", {
    method: "POST",
    body: JSON.stringify(input),
  });
  assert.equal(r.status, 200);
  return r.json();
}
function deniedBeforeProtected(r) {
  assert.equal(r.status, 503);
  assert.ok(
    !r.queries.some((q) =>
      /guest_access|attempts|developer_operations/.test(q),
    ),
  );
}
test("foundation valid bindings emit correlated storage evidence without secret markers", async () => {
  const r = await call();
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).providerAccess, "disabled");
  assert.equal(JSON.parse(r.body).environment, "developer");
  assert.equal(JSON.parse(r.body).foundationRegistration, "registered");
  assert.match(r.headers["x-request-id"], /^[a-f0-9-]{36}$/);
  assert.ok(
    logs.some(
      (l) =>
        l.includes(r.headers["x-request-id"]) &&
        l.includes("foundation_trace") &&
        l.includes('"storage"'),
    ),
  );
  assert.ok(!JSON.stringify({ r, logs }).includes("SYNTHETIC_PRIVATE"));
});
test("foundation missing and malformed configuration denies before protected reads", async () => {
  for (const vars of [
    { ENVIRONMENT: "production" },
    { DEPLOYMENT_ACCOUNT_ID: "other" },
    { STATE_DATABASE_ID: "other" },
    { APP_ORIGIN: "http://soccerbot.test" },
    { CAMPAIGN_ID: "INVALID budget" },
    { CAMPAIGN_END_MS: "not-a-time" },
    { ACCESS_LIFETIME_MS: "0" },
  ])
    deniedBeforeProtected(await call({ vars }));
  for (const missing of [
    "ENVIRONMENT",
    "DEPLOYMENT_ACCOUNT_ID",
    "STATE_DATABASE_ID",
    "APP_ORIGIN",
    "STATE",
    "COORDINATOR",
    "ASSETS",
  ])
    deniedBeforeProtected(await call({ missing }));
});
test("foundation accepts a validated campaign name without changing retained account identity", async () => {
  assert.equal(
    (await call({ vars: { CAMPAIGN_ID: "new-budget" } })).status,
    200,
  );
});
test("foundation foreign database and coordinator namespace identities fail closed", async () => {
  deniedBeforeProtected(await call({ foreign: true }));
  const row = await db.prepare("SELECT * FROM foundation_identity").first();
  assert.equal(row.database_id, config.vars.STATE_DATABASE_ID);
  // A different singleton identity models a namespace mismatch, using actual idFromName.
  await db.exec(
    "DROP TRIGGER immutable_foundation_identity_update; UPDATE foundation_identity SET coordinator_id='" +
      "0".repeat(64) +
      "'",
  );
  deniedBeforeProtected(await call());
  await db
    .prepare("UPDATE foundation_identity SET coordinator_id=?")
    .bind(row.coordinator_id)
    .run();
  await db.exec(
    "CREATE TRIGGER immutable_foundation_identity_update BEFORE UPDATE ON foundation_identity BEGIN SELECT RAISE(ABORT, 'immutable foundation identity'); END;",
  );
});
test("foundation manifests are immutable and populated uncertain operations survive upgrade", async () => {
  assert.equal(
    (
      await db
        .prepare(
          "SELECT state FROM developer_operations WHERE capability_hash='synthetic-old'",
        )
        .first()
    ).state,
    "running",
  );
  await assert.rejects(
    db.exec("UPDATE foundation_identity SET environment='developer'"),
    /immutable foundation identity/,
  );
  await assert.rejects(
    db.exec("DELETE FROM foundation_identity"),
    /immutable foundation identity/,
  );
});
test("foundation rejects forged host cross-origin GET and unsupported methods", async () => {
  assert.equal((await call({ host: "https://forged.test" })).status, 403);
  assert.equal(
    (await call({ headers: { origin: "https://forged.test" } })).status,
    403,
  );
  for (const method of ["PUT", "PATCH", "DELETE", "OPTIONS"])
    assert.equal((await call({ method })).status, 404);
  assert.equal(
    (await call({ path: "/api/health?token=SYNTHETIC_PRIVATE_URL" })).status,
    400,
  );
});
test(
  "foundation bounds stalled bodies with a fixed one-second deadline",
  { timeout: 5000 },
  async () => {
    const r = await call({
      path: "/api/access",
      method: "POST",
      stalled: true,
    });
    assert.equal(r.status, 408);
    assert.deepEqual(r.queries, []);
  },
);
test("foundation invalid customer access never reaches attempt or operator data", async () => {
  for (const headers of [{}, { cookie: "__Host-soccerbot-access=bad" }]) {
    const r = await call({
      path: "/api/attempts/00000000-0000-4000-8000-000000000000/confirmation",
      headers,
    });
    assert.equal(r.status, 401);
    assert.ok(!r.queries.some((q) => /attempts|guest_access/.test(q)));
  }
  const guest = await call({ path: "/api/access", method: "POST" });
  const cookie = guest.headers["set-cookie"].split(";")[0];
  const r = await call({
    path: "/api/developer/provider-identity",
    method: "POST",
    headers: { cookie },
  });
  assert.equal(r.status, 401);
  assert.ok(!r.queries.some((q) => /developer_operations/.test(q)));
});
test("foundation concurrent requests isolate correlations and redact injected failures", async () => {
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      call({ headers: { "x-request-id": "SYNTHETIC_PRIVATE_CORRELATION" } }),
    ),
  );
  assert.equal(new Set(results.map((r) => r.headers["x-request-id"])).size, 8);
  const bad = await call({
    missing: "STATE",
    headers: { authorization: "Bearer SYNTHETIC_PRIVATE_BEARER" },
  });
  assert.equal(bad.status, 503);
  assert.ok(
    !JSON.stringify({ results, bad, logs }).includes("SYNTHETIC_PRIVATE"),
  );
});
test("production static entry serves only its canonical HTTPS origin and safe methods", async () => {
  const vars = { ENVIRONMENT: "production" };
  for (const method of ["GET", "HEAD"]) {
    const result = await call({ path: "/", method, vars });
    assert.equal(result.status, 200);
    assert.equal(result.body, method === "HEAD" ? "" : "synthetic-asset");
    assert.deepEqual(result.queries, []);
  }
  for (const host of [
    "https://alternate.example.com",
    "https://fallback.hosting.example.com",
    "http://soccerbot.test",
  ]) {
    const result = await call({ path: "/", host, vars });
    assert.equal(result.status, 403);
    assert.deepEqual(JSON.parse(result.body), { error: "origin_denied" });
    assert.deepEqual(result.queries, []);
  }
  const post = await call({ path: "/", method: "POST", vars });
  assert.equal(post.status, 405);
  assert.deepEqual(post.queries, []);
});

/** Exercise first-install health against fresh real storage without provider transport. */
async function closedInstallation(overrides = {}) {
  const { outputFiles } = await build({
    entryPoints: ["worker/index.ts"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    external: ["cloudflare:workers", "node:async_hooks"],
  });
  const vars = {
    ...config.vars,
    ENVIRONMENT: "production",
    APP_ORIGIN: "https://soccerbot.test",
    SOURCE_REVISION: "a".repeat(40),
    COORDINATOR_NAME: "simplybook-production-account",
    COORDINATOR_LOCATION_HINT: "apac-ne",
    LIVE_CUSTOMER_ACCESS: "disabled",
    PROVIDER_ACCESS: "disabled",
    IDENTITY_DELIVERY: "disabled",
    HITPAY_CHECKOUT: "disabled",
    HITPAY_RECOVERY: "disabled",
    HITPAY_WEBHOOK: "disabled",
    PUBLIC_DISPLAY_WARMING: "disabled",
    PUBLIC_TOKEN_REFRESH_AHEAD: "disabled",
  };
  let effects = 0;
  const local = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: outputFiles[0].text,
      compatibilityDate: config.compatibility_date,
      compatibilityFlags: config.compatibility_flags,
      cf: false,
      bindings: { ...vars, ...overrides },
      d1Databases: { STATE: "closed-health" },
      durableObjects: {
        COORDINATOR: {
          className: "SoccerBotAccountCoordinator",
          useSQLite: true,
        },
      },
      serviceBindings: { ASSETS: () => new Response("static") },
      outboundService: () => {
        effects++;
        throw new Error("External transport forbidden");
      },
    }),
  );
  const database = await local.getD1Database("STATE");
  for (const name of readdirSync("migrations").sort())
    await database.exec(
      readFileSync(`migrations/${name}`, "utf8")
        .replace(/^--.*$/gm, "")
        .replace(/\n/g, " "),
    );
  return { local, database, vars, effects: () => effects };
}

test("closed production health reports pending registration without claiming storage or opening protected operations", async () => {
  const f = await closedInstallation();
  try {
    const response = await f.local.dispatchFetch(
      "https://soccerbot.test/api/health",
      { headers: { "X-Readiness-Nonce": "b".repeat(32) } },
    );
    assert.equal(response.status, 200);
    const health = await response.json();
    assert.equal(health.environment, "production");
    assert.equal(health.foundationRegistration, "pending");
    assert.equal(health.revision, "a".repeat(40));
    assert.equal(health.readinessNonce, "b".repeat(32));
    assert.equal(health.liveCustomerAccess, "disabled");
    assert.equal(health.effectiveProviderAccess, "disabled");
    assert.equal(
      (
        await f.database
          .prepare("SELECT COUNT(*) AS n FROM foundation_identity")
          .first()
      ).n,
      0,
    );
    const denied = await f.local.dispatchFetch(
      "https://soccerbot.test/api/access",
      { method: "POST", headers: { origin: "https://soccerbot.test" } },
    );
    assert.equal(denied.status, 503);
    assert.equal(
      (
        await f.database
          .prepare("SELECT COUNT(*) AS n FROM guest_access")
          .first()
      ).n,
      0,
    );
    assert.equal(f.effects(), 0);
  } finally {
    await f.local.dispose();
  }
});

test("closed health rejects foreign foundation and only reports registered after matching immutable identity", async () => {
  for (const foreign of [false, true]) {
    const f = await closedInstallation();
    try {
      const namespace = await f.local.getDurableObjectNamespace("COORDINATOR");
      await f.database
        .prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)")
        .bind(
          foreign ? "f".repeat(32) : f.vars.DEPLOYMENT_ACCOUNT_ID,
          "production",
          f.vars.STATE_DATABASE_ID,
          namespace.idFromName(f.vars.COORDINATOR_NAME).toString(),
        )
        .run();
      const response = await f.local.dispatchFetch(
        "https://soccerbot.test/api/health",
      );
      assert.equal(response.status, foreign ? 503 : 200);
      if (!foreign)
        assert.equal(
          (await response.json()).foundationRegistration,
          "registered",
        );
      assert.equal(f.effects(), 0);
    } finally {
      await f.local.dispose();
    }
  }
});

test("pending foundation health requires production and every effect switch explicitly disabled", async () => {
  for (const vars of [
    { ENVIRONMENT: "developer" },
    ...[
      "LIVE_CUSTOMER_ACCESS",
      "PROVIDER_ACCESS",
      "IDENTITY_DELIVERY",
      "HITPAY_CHECKOUT",
      "HITPAY_RECOVERY",
      "HITPAY_WEBHOOK",
      "PUBLIC_DISPLAY_WARMING",
      "PUBLIC_TOKEN_REFRESH_AHEAD",
    ].map((name) => ({
      [name]: name === "PROVIDER_ACCESS" ? "trusted-reads" : "enabled",
    })),
  ]) {
    const f = await closedInstallation(vars);
    try {
      assert.equal(
        (await f.local.dispatchFetch("https://soccerbot.test/api/health"))
          .status,
        503,
        JSON.stringify(vars),
      );
      assert.equal(
        (
          await f.database
            .prepare("SELECT COUNT(*) AS n FROM foundation_identity")
            .first()
        ).n,
        0,
      );
      assert.equal(f.effects(), 0);
    } finally {
      await f.local.dispose();
    }
  }
});
