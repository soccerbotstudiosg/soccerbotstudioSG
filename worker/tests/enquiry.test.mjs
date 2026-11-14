import { afterEach, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import ts from "typescript";
import { initializeFixture } from "./foundation-fixture.mjs";

const config = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8"),
).config;
const origin = "https://soccerbot.test";
const source = "192.0.2.10";
const sender = "SoccerBotStudio Singapore <contact@soccerbotsg.com>";
const pepper = "SYNTHETIC_ENQUIRY_PEPPER_".repeat(3);
let script, mf, db, root, bindings, calls, botResult, mailResult;

before(async () => {
  script = (
    await build({
      entryPoints: ["worker/index.ts"],
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      external: ["cloudflare:workers", "node:async_hooks"],
    })
  ).outputFiles[0].text;
});

async function start() {
  mf = new Miniflare({
    ...convertV4MiniflareOptions({
      name: "enquiry-test",
      modules: true,
      script,
      cf: false,
      compatibilityDate: config.compatibility_date,
      compatibilityFlags: config.compatibility_flags,
      bindings,
      d1Databases: { STATE: "synthetic-enquiry" },
      d1Persist: path.join(root, "d1"),
      durableObjects: {
        COORDINATOR: {
          className: "SoccerBotAccountCoordinator",
          useSQLite: true,
        },
      },
      serviceBindings: { ASSETS: () => new Response("synthetic") },
      outboundService: async (request) => {
        assert.equal(request.method, "POST");
        const url = new URL(request.url);
        const body = await request.json();
        const kind =
          url.href ===
          "https://challenges.cloudflare.com/turnstile/v0/siteverify"
            ? "bot"
            : "email";
        if (kind === "email")
          assert.equal(url.href, "https://api.resend.com/emails");
        const call = { kind, body, headers: request.headers };
        calls.push(call);
        if (kind === "bot") {
          assert.equal(body.secret, bindings.TURNSTILE_SECRET);
          return botResult
            ? botResult(call)
            : Response.json({
                success: true,
                hostname: new URL(origin).hostname,
                action: "send-enquiry",
                challenge_ts: new Date().toISOString(),
              });
        }
        assert.equal(
          request.headers.get("Authorization"),
          `Bearer ${bindings.RESEND_API_KEY}`,
        );
        return mailResult
          ? mailResult(call)
          : Response.json({ id: crypto.randomUUID() });
      },
    }),
    resourcePersistencePath: root,
    isolatedResourcePersistencePath: root,
  });
  await mf.ready;
  db = await mf.getD1Database("STATE");
}

beforeEach(async () => {
  root = mkdtempSync(path.join(tmpdir(), "soccerbot-enquiry-"));
  bindings = {
    ...config.vars,
    APP_ORIGIN: origin,
    SOURCE_REVISION: "a".repeat(40),
    LIVE_CUSTOMER_ACCESS: "enabled",
    PROVIDER_ACCESS: "trusted-reads",
    IDENTITY_DELIVERY: "ongoing",
    IDENTITY_SENDER: sender,
    IDENTITY_PEPPER: pepper,
    RESEND_API_KEY: "SYNTHETIC_ENQUIRY_RESEND_".repeat(3),
    TURNSTILE_SECRET: "SYNTHETIC_ENQUIRY_BOT_".repeat(3),
  };
  calls = [];
  botResult = null;
  mailResult = null;
  await start();
  await initializeFixture(mf, db);
});

afterEach(async () => {
  await mf?.dispose();
  rmSync(root, { recursive: true, force: true });
});

function enquiry(overrides = {}) {
  return {
    key: crypto.randomUUID(),
    botToken: crypto.randomUUID(),
    values: {
      name: "Synthetic Enquirer",
      email: "synthetic-enquirer@example.com",
      phone: "+6591234567",
      organisation: "Synthetic School",
      purpose: "Academy / school visit",
      guests: "12",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      time: "14:30",
      message:
        "Synthetic school visit with ordinary prose & <details>.\nThank you.",
    },
    ...overrides,
  };
}

function submit(body, headers = {}) {
  return mf.dispatchFetch(`${origin}/api/enquiry`, {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": source,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function count(table) {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n;
}

function gate() {
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test("public enquiry sends fixed staff recipients and customer reply-to without creating booking access", async () => {
  const input = enquiry();
  input.values.message = "Synthetic enquiry: " + "球".repeat(1800);
  input.botToken = "synthetic-token-" + "a".repeat(2000);
  assert.ok(Buffer.byteLength(JSON.stringify(input)) > 4096);
  const response = await submit(input);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "sent" });
  assert.equal(response.headers.has("Set-Cookie"), false);
  assert.deepEqual(
    calls.map(({ kind }) => kind),
    ["bot", "email"],
  );
  const mail = calls[1];
  assert.equal(mail.body.from, sender);
  assert.deepEqual(mail.body.to, [
    "contact@soccerbotsg.com",
    "glenna@soccerbotsg.com",
  ]);
  assert.equal(mail.body.reply_to, input.values.email);
  assert.equal(mail.body.html, undefined);
  assert.match(mail.body.text, /Synthetic Enquirer/);
  assert.match(mail.body.text, /Synthetic School/);
  assert.ok(mail.body.text.includes(input.values.message));
  assert.equal(mail.headers.get("Idempotency-Key"), `enquiry/${input.key}`);
  for (const table of [
    "guest_access",
    "attempts",
    "native_checkout_grants",
    "identity_challenges",
    "verified_identity",
  ])
    assert.equal(await count(table), 0, `${table} remains unchanged`);
  const retained = await db
    .prepare("SELECT * FROM enquiry_requests WHERE request_key=?")
    .bind(input.key)
    .first();
  assert.equal(retained.state, "sent");
  for (const value of [
    input.values.email,
    input.values.phone,
    input.values.message,
  ])
    assert.equal(JSON.stringify(retained).includes(value), false);
  const admissions = await db
    .prepare(
      "SELECT kind,state,source_hash,ongoing FROM identity_delivery_dispatches ORDER BY kind",
    )
    .all();
  assert.deepEqual(
    admissions.results.map(({ kind }) => kind),
    ["bot", "email"],
  );
  const expectedSource = createHmac("sha256", pepper)
    .update(JSON.stringify(["delivery-source", source]))
    .digest("hex");
  for (const admission of admissions.results) {
    assert.equal(admission.state, "responded");
    assert.equal(admission.ongoing, 1);
    assert.equal(admission.source_hash, expectedSource);
  }
});

test("public enquiry rejects invalid fields and cross-origin requests before provider dispatch", async () => {
  const valid = enquiry();
  const invalid = [
    { ...valid, key: "not-a-request-key" },
    {
      ...valid,
      values: {
        ...valid.values,
        email: "invalid@example.com\r\nBcc: injected@example.com",
      },
    },
    { ...valid, values: { ...valid.values, message: " " } },
    { ...valid, values: { ...valid.values, purpose: "Unapproved purpose" } },
    { ...valid, values: { ...valid.values, message: "a".repeat(2001) } },
  ];
  for (const input of invalid) {
    const response = await submit(input);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "enquiry_invalid" });
  }
  const foreign = await submit(valid, { origin: "https://foreign.example" });
  assert.equal(foreign.status, 403);
  assert.deepEqual(await foreign.json(), { error: "origin_denied" });
  assert.equal(calls.length, 0);
  assert.equal(await count("identity_delivery_dispatches"), 0);
});

test("public enquiry requires fresh bot proof for its exact action and hostname", async () => {
  const cases = [
    { success: false },
    { action: "create-checkout" },
    { action: "verify-email" },
    { hostname: "foreign.example" },
    { challenge_ts: new Date(Date.now() - 301000).toISOString() },
    { challenge_ts: new Date(Date.now() + 60000).toISOString() },
  ];
  for (const [index, patch] of cases.entries()) {
    botResult = () =>
      Response.json({
        success: true,
        hostname: new URL(origin).hostname,
        action: "send-enquiry",
        challenge_ts: new Date().toISOString(),
        ...patch,
      });
    const response = await submit(enquiry(), {
      "CF-Connecting-IP": `192.0.2.${index + 20}`,
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "enquiry_verification_required",
    });
  }
  assert.equal(calls.filter(({ kind }) => kind === "bot").length, cases.length);
  assert.equal(calls.filter(({ kind }) => kind === "email").length, 0);
});

test("public enquiry deduplicates completed keys and rejects changed enquiry content", async () => {
  const input = enquiry();
  assert.equal((await submit(input)).status, 200);
  const duplicate = await submit({ ...input, botToken: crypto.randomUUID() });
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), { status: "sent" });
  const changed = await submit({
    ...input,
    values: { ...input.values, message: "Changed request" },
  });
  assert.equal(changed.status, 409);
  assert.deepEqual(await changed.json(), { error: "enquiry_changed" });
  assert.deepEqual(
    calls.map(({ kind }) => kind),
    ["bot", "email"],
  );
  assert.equal(await count("enquiry_requests"), 1);
});

test("public enquiry rejects a bot token already bound to another submission", async () => {
  const input = enquiry();
  assert.equal((await submit(input)).status, 200);
  const replay = await submit({ ...input, key: crypto.randomUUID() });
  assert.equal(replay.status, 400);
  assert.deepEqual(await replay.json(), {
    error: "enquiry_verification_required",
  });
  assert.equal(calls.filter(({ kind }) => kind === "bot").length, 2);
  assert.equal(calls.filter(({ kind }) => kind === "email").length, 1);
});

test("public enquiry concurrent submissions reserve one physical email dispatch", async () => {
  const entered = gate(),
    release = gate();
  mailResult = async () => {
    entered.release();
    await release.promise;
    return Response.json({ id: crypto.randomUUID() });
  };
  const input = enquiry();
  const first = submit(input);
  try {
    await entered.promise;
    const admission = await db
      .prepare(
        "SELECT state FROM identity_delivery_dispatches WHERE kind='email'",
      )
      .first();
    assert.equal(admission.state, "reserved");
    const second = await submit(input);
    assert.equal(second.status, 429);
    assert.deepEqual(await second.json(), { error: "enquiry_retry_later" });
    assert.ok(Number(second.headers.get("Retry-After")) > 0);
    assert.deepEqual(
      calls.map(({ kind }) => kind),
      ["bot", "email"],
    );
  } finally {
    release.release();
  }
  assert.equal((await first).status, 200);
  assert.equal((await submit(input)).status, 200);
  assert.equal(calls.filter(({ kind }) => kind === "email").length, 1);
});

test("public enquiry retains uncertain sends and retries with the original email idempotency key", async () => {
  const input = enquiry();
  mailResult = () => new Response(null, { status: 503 });
  const uncertain = await submit(input);
  assert.equal(uncertain.status, 503);
  assert.deepEqual(await uncertain.json(), { error: "enquiry_unavailable" });
  assert.equal(
    (
      await db
        .prepare("SELECT state FROM enquiry_requests WHERE request_key=?")
        .bind(input.key)
        .first()
    ).state,
    "pending",
  );
  const early = await submit(input);
  assert.equal(early.status, 429);
  assert.deepEqual(await early.json(), { error: "enquiry_retry_later" });
  assert.equal(calls.length, 2);
  await db
    .prepare("UPDATE enquiry_requests SET next_ms=0 WHERE request_key=?")
    .bind(input.key)
    .run();
  mailResult = null;
  const retried = await submit(input);
  assert.equal(retried.status, 200);
  assert.deepEqual(await retried.json(), { status: "sent" });
  const sends = calls.filter(({ kind }) => kind === "email");
  assert.equal(sends.length, 2);
  assert.deepEqual(sends[0].body, sends[1].body);
  for (const send of sends)
    assert.equal(send.headers.get("Idempotency-Key"), `enquiry/${input.key}`);
  assert.equal(calls.filter(({ kind }) => kind === "bot").length, 1);
  const admissions = await db
    .prepare(
      "SELECT state FROM identity_delivery_dispatches WHERE kind='email' ORDER BY created_ms,id",
    )
    .all();
  assert.deepEqual(admissions.results.map(({ state }) => state).sort(), [
    "responded",
    "unknown",
  ]);
});

test("public enquiry stops uncertain retries before the provider idempotency window ends", async () => {
  const input = enquiry();
  botResult = () => Response.json({ success: false });
  assert.equal((await submit(input)).status, 400);
  const original = await db
    .prepare("SELECT input_hash FROM enquiry_requests WHERE request_key=?")
    .bind(input.key)
    .first();
  const oldKey = crypto.randomUUID();
  const created = Date.now() - 23 * 3600000 - 1000;
  await db
    .prepare(
      "INSERT INTO enquiry_requests(request_key,input_hash,created_ms,state) VALUES(?,?,?,'pending')",
    )
    .bind(oldKey, original.input_hash, created)
    .run();
  const response = await submit({ ...input, key: oldKey });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "enquiry_unavailable" });
  assert.equal(calls.length, 1);
  const retained = await db
    .prepare(
      "SELECT created_ms,state FROM enquiry_requests WHERE request_key=?",
    )
    .bind(oldKey)
    .first();
  assert.deepEqual(retained, { created_ms: created, state: "pending" });
});

test("public enquiry shares the existing hourly email budget and rejects before Resend dispatch when exhausted", async () => {
  for (let index = 0; index < 60; index++)
    await db
      .prepare(
        "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state,ongoing) VALUES(?,'email',?,?,?,'responded',1)",
      )
      .bind(
        `verification/${crypto.randomUUID()}`,
        "a".repeat(64),
        "b".repeat(64),
        Date.now(),
      )
      .run();
  const response = await submit(enquiry());
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "enquiry_retry_later" });
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
  assert.deepEqual(
    calls.map(({ kind }) => kind),
    ["bot"],
  );
  assert.equal(
    (
      await db
        .prepare(
          "SELECT COUNT(*) AS n FROM identity_delivery_dispatches WHERE kind='email'",
        )
        .first()
    ).n,
    60,
  );
});

test("public enquiry shares the existing source bot limit without creating guest sessions", async () => {
  const sourceHash = createHmac("sha256", pepper)
    .update(JSON.stringify(["delivery-source", source]))
    .digest("hex");
  for (let index = 0; index < 3; index++)
    await db
      .prepare(
        "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state,ongoing) VALUES(?,'bot',?,?,?,'responded',1)",
      )
      .bind(crypto.randomUUID(), "a".repeat(64), sourceHash, Date.now())
      .run();
  const response = await submit(enquiry());
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "enquiry_retry_later" });
  assert.equal(calls.length, 0);
  assert.equal(await count("guest_access"), 0);
});

test("public enquiry fails closed for disabled delivery and missing sender or provider bindings", async () => {
  const active = { ...bindings };
  const missing = [
    { LIVE_CUSTOMER_ACCESS: "disabled" },
    { IDENTITY_DELIVERY: "disabled" },
    { IDENTITY_SENDER: undefined },
    { RESEND_API_KEY: undefined },
    { IDENTITY_PEPPER: undefined },
    {
      TURNSTILE_SECRET: undefined,
      TURNSTILE_SECRET_KEY: active.TURNSTILE_SECRET,
    },
  ];
  for (const patch of missing) {
    await mf.dispose();
    bindings = { ...active, ...patch };
    for (const [key, value] of Object.entries(bindings))
      if (value === undefined) delete bindings[key];
    await start();
    const response = await submit(enquiry());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "enquiry_unavailable" });
  }
  assert.equal(calls.length, 0);
  assert.equal(await count("identity_delivery_dispatches"), 0);
});
