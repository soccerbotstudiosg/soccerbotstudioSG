import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { readFileSync } from "node:fs";
import ts from "typescript";

const bundle = await build({
  entryPoints: ["worker/pages.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
});
const origin = "https://booking.example.test";

test("Pages service binding reaches the actual Worker with guest cookie continuity and origin enforcement", async () => {
  const config = ts.parseConfigFileTextToJson(
    "wrangler.jsonc",
    readFileSync("wrangler.jsonc", "utf8"),
  ).config;
  config.vars = {
    ...config.vars,
    ENVIRONMENT: "production",
    DEPLOYMENT_ACCOUNT_ID: "b".repeat(32),
    STATE_DATABASE_ID: "11111111-1111-4111-8111-111111111111",
    COORDINATOR_NAME: "client-coordinator",
  };
  const app = await build({
    entryPoints: ["worker/index.ts"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    external: ["cloudflare:workers", "node:async_hooks"],
  });
  let outbound = 0;
  const pages = convertV4MiniflareOptions({
    name: "pages",
    modules: true,
    script: bundle.outputFiles[0].text,
    compatibilityDate: config.compatibility_date,
    bindings: { APP_ORIGIN: origin },
    serviceBindings: {
      BACKEND: "application",
      ASSETS: () => new Response("static"),
    },
  }).workers[0];
  const backend = convertV4MiniflareOptions({
    name: "application",
    modules: true,
    script: app.outputFiles[0].text,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags,
    bindings: { ...config.vars, APP_ORIGIN: origin },
    d1Databases: { STATE: "pages-synthetic-state" },
    durableObjects: {
      COORDINATOR: {
        className: "SoccerBotAccountCoordinator",
        useSQLite: true,
      },
    },
    serviceBindings: { ASSETS: () => new Response("backend-static") },
    outboundService: () => {
      outbound++;
      throw new Error("Provider requests forbidden");
    },
  }).workers[0];
  const mf = new Miniflare({ workers: [pages, backend], cf: false });
  try {
    const db = await mf.getD1Database("STATE", "application");
    for (const file of [
      "0001_developer_journal.sql",
      "0005_foundation_identity.sql",
      "0035_portable_foundation_identity.sql",
    ])
      await db.exec(
        readFileSync("migrations/" + file, "utf8")
          .replace(/^--.*$/gm, "")
          .replace(/\n/g, " "),
      );
    const ns = await mf.getDurableObjectNamespace("COORDINATOR", "application");
    await db
      .prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)")
      .bind(
        config.vars.DEPLOYMENT_ACCOUNT_ID,
        config.vars.ENVIRONMENT,
        config.vars.STATE_DATABASE_ID,
        ns.idFromName(config.vars.COORDINATOR_NAME).toString(),
      )
      .run();
    const health = await mf.dispatchFetch(origin + "/api/health");
    assert.equal(health.status, 200);
    assert.equal((await health.json()).origin, origin);
    const guest = await mf.dispatchFetch(origin + "/api/access", {
      method: "POST",
      headers: { origin },
    });
    assert.equal(guest.status, 201);
    const setCookie = guest.headers.get("set-cookie");
    assert.match(
      setCookie,
      /__Host-soccerbot-access=[a-f0-9]{64}; Path=\/; Secure; HttpOnly; SameSite=Strict/,
    );
    const originalAccess = await db
      .prepare("SELECT owner_id,capability_hash FROM guest_access")
      .first();
    await db
      .prepare("UPDATE guest_access SET expires_ms=?")
      .bind(Date.now() + 60000)
      .run();
    const beforeRenew = Date.now();
    const again = await mf.dispatchFetch(origin + "/api/access", {
      method: "POST",
      headers: { origin, cookie: setCookie.split(";")[0] },
    });
    assert.equal(again.status, 200);
    assert.equal(
      again.headers.get("set-cookie").split(";")[0],
      setCookie.split(";")[0],
    );
    const renewed = await db.prepare("SELECT * FROM guest_access").first();
    assert.equal(renewed.owner_id, originalAccess.owner_id);
    assert.equal(renewed.capability_hash, originalAccess.capability_hash);
    assert.ok(
      renewed.expires_ms >=
        beforeRenew + Number(config.vars.ACCESS_LIFETIME_MS),
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS count FROM guest_access").first())
        .count,
      1,
    );
    const missingOrigin = await mf.dispatchFetch(origin + "/api/access", {
      method: "POST",
    });
    assert.equal(
      missingOrigin.status,
      403,
      "backend still enforces mutation origin",
    );
    await db
      .prepare("UPDATE guest_access SET revoked_ms=? WHERE capability_hash=?")
      .bind(Date.now(), originalAccess.capability_hash)
      .run();
    const revoked = await mf.dispatchFetch(origin + "/api/access", {
      method: "POST",
      headers: { origin, cookie: setCookie.split(";")[0] },
    });
    assert.equal(revoked.status, 201);
    assert.notEqual(
      revoked.headers.get("set-cookie").split(";")[0],
      setCookie.split(";")[0],
    );
    assert.equal(
      (
        await db
          .prepare(
            "SELECT expires_ms FROM guest_access WHERE capability_hash=?",
          )
          .bind(originalAccess.capability_hash)
          .first()
      ).expires_ms,
      renewed.expires_ms,
    );
    assert.equal(outbound, 0);
  } finally {
    await mf.dispose();
  }
});

/** Exercise the Pages entry with isolated services and no external transport. */
async function fixture(backend, appOrigin = origin) {
  let assets = 0;
  const mf = new Miniflare({
    ...convertV4MiniflareOptions({
      modules: true,
      script: bundle.outputFiles[0].text,
      compatibilityDate: "2026-10-08",
      cf: false,
      bindings: { APP_ORIGIN: appOrigin },
      serviceBindings: {
        BACKEND: backend,
        ASSETS: () => {
          assets++;
          return new Response("static", { headers: { "X-Asset": "yes" } });
        },
      },
      outboundService: () => {
        throw new Error("External transport forbidden");
      },
    }),
  });
  return { mf, assets: () => assets };
}

test("Pages service routing preserves public URL cookies raw payload and backend proof headers", async () => {
  let calls = 0;
  const f = await fixture(async (request) => {
    calls++;
    assert.equal(request.url, origin + "/api/booking/checkout/example?hold=1");
    assert.equal(request.method, "POST");
    assert.equal(request.headers.get("origin"), origin);
    assert.equal(
      request.headers.get("cookie"),
      "__Host-soccerbot-access=synthetic",
    );
    assert.equal(request.headers.get("x-signature"), "synthetic-signature");
    assert.equal(await request.text(), '{ "accepted": true }');
    const headers = new Headers({
      "Server-Timing": "checkout;dur=5",
      "X-Request-ID": "synthetic",
      "Cache-Control": "public, max-age=600",
    });
    headers.append("Set-Cookie", "one=1; Path=/; Secure; HttpOnly");
    headers.append("Set-Cookie", "two=2; Path=/; Secure; HttpOnly");
    return new Response("accepted", { status: 201, headers });
  });
  try {
    const r = await f.mf.dispatchFetch(
      origin + "/api/booking/checkout/example?hold=1",
      {
        method: "POST",
        headers: {
          origin,
          cookie: "__Host-soccerbot-access=synthetic",
          "x-signature": "synthetic-signature",
        },
        body: '{ "accepted": true }',
      },
    );
    assert.equal(r.status, 201);
    assert.equal(await r.text(), "accepted");
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.equal(r.headers.get("server-timing"), "checkout;dur=5");
    assert.equal(r.headers.get("x-request-id"), "synthetic");
    assert.equal(r.headers.getSetCookie().length, 2);
    assert.equal(calls, 1);
    assert.equal(f.assets(), 0);
  } finally {
    await f.mf.dispose();
  }
});

test("Pages routing denies foreign preview origins and never falls back or retries failed API writes", async () => {
  let calls = 0;
  const f = await fixture(() => {
    calls++;
    return new Response("unknown", { status: 503 });
  });
  try {
    for (const [url, headers] of [
      ["https://preview.example.test/api/health", {}],
      [origin + "/api/health", { origin: "https://foreign.example.test" }],
      ["http://booking.example.test/api/health", {}],
    ])
      assert.equal((await f.mf.dispatchFetch(url, { headers })).status, 403);
    assert.equal(calls, 0);
    const response = await f.mf.dispatchFetch(origin + "/api/checkout", {
      method: "POST",
      body: "synthetic",
    });
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
    assert.equal(f.assets(), 0);
    assert.equal(
      await (await f.mf.dispatchFetch(origin + "/booking")).text(),
      "static",
    );
    assert.equal(
      (await f.mf.dispatchFetch(origin + "/booking", { method: "POST" }))
        .status,
      405,
    );
    assert.equal(f.assets(), 1);
  } finally {
    await f.mf.dispose();
  }
});

test("Pages routing leaves redirect navigation to the browser and rejects malformed configuration", async () => {
  let calls = 0;
  const f = await fixture(() => {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { Location: "https://checkout.example.test/session" },
    });
  });
  try {
    const r = await f.mf.dispatchFetch(origin + "/api/return", {
      redirect: "manual",
    });
    assert.equal(r.status, 302);
    assert.equal(
      r.headers.get("location"),
      "https://checkout.example.test/session",
    );
    assert.equal(calls, 1);
  } finally {
    await f.mf.dispose();
  }
  const invalid = await fixture(() => {
    throw new Error("Must not dispatch");
  }, origin + "/path");
  try {
    assert.equal(
      (await invalid.mf.dispatchFetch(origin + "/api/health")).status,
      503,
    );
  } finally {
    await invalid.mf.dispose();
  }
});
