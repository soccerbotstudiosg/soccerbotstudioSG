import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import ts from "typescript";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { seedFoundation } from "./foundation-fixture.mjs";
const config = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8"),
).config;
const root = mkdtempSync(path.join(tmpdir(), "soccerbot-identity-"));
const origin = "https://soccerbot.test";
let mf,
  db,
  script,
  outbound = 0;
async function start() {
  mf = new Miniflare({
    ...convertV4MiniflareOptions({
      name: "identity-test",
      modules: true,
      script,
      cf: false,
      compatibilityDate: config.compatibility_date,
      compatibilityFlags: config.compatibility_flags,
      bindings: { ...config.vars, APP_ORIGIN: origin },
      d1Databases: { STATE: "synthetic-identity" },
      d1Persist: path.join(root, "d1"),
      durableObjects: {
        COORDINATOR: {
          className: "SoccerBotAccountCoordinator",
          useSQLite: true,
        },
      },
      serviceBindings: { ASSETS: () => new Response("synthetic") },
      outboundService: () => {
        outbound++;
        throw new Error("No external identity requests");
      },
    }),
    resourcePersistencePath: root,
    isolatedResourcePersistencePath: root,
  });
  await mf.ready;
  db = await mf.getD1Database("STATE");
}
before(async () => {
  script = (
    await build({
      entryPoints: ["worker/tests/identity-harness.ts"],
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      external: ["cloudflare:workers", "node:async_hooks"],
    })
  ).outputFiles[0].text;
  await start();
  for (const name of [
    "0001_developer_journal.sql",
    "0009_identity_challenges.sql",
    "0044_identity_request_cooldown.sql",
    "0046_identity_email_request_limit.sql",
    "0047_identity_overlapping_codes.sql",
    "0013_remembered_identity.sql",
    "0048_profile_only_signout.sql",
    "0011_identity_delivery.sql",
    "0015_contact_profiles.sql",
  ])
    await db.exec(
      readFileSync(`migrations/${name}`, "utf8")
        .replace(/^--.*$/gm, "")
        .replace(/\n/g, " "),
    );
  await seedFoundation(mf, db);
});
after(async () => {
  await mf?.dispose();
  rmSync(root, { recursive: true, force: true });
  assert.equal(outbound, 0);
});
async function guest() {
  const response = await mf.dispatchFetch(origin + "/api/access", {
    method: "POST",
    headers: { origin },
  });
  assert.equal(response.status, 201);
  return response.headers.get("set-cookie").split(";")[0];
}
async function call(cookie, body) {
  return (
    await mf.dispatchFetch(origin + "/synthetic-identity/test", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify(body),
    })
  ).json();
}
let sequence = 0;
async function challenge(cookie, overrides = {}) {
  sequence++;
  return call(cookie, {
    action: "challenge",
    now: Date.now(),
    email: `synthetic${sequence}@example.invalid`,
    botToken: `synthetic-bot-${sequence}`,
    source: `synthetic-source-${sequence}`,
    ...overrides,
  });
}
function verification(response, now = Date.now()) {
  return {
    action: "verify",
    now,
    email: response.sent[0].email,
    code: response.sent[0].code,
    challengeId: response.result.challengeId,
  };
}
test("identity stores no plaintext code and consumes one concurrent redemption without renewing guest expiry", async () => {
  const cookie = await guest(),
    response = await challenge(cookie);
  assert.equal(response.error, undefined);
  assert.match(response.sent[0].code, /^\d{6}$/);
  const stored = await db
    .prepare("SELECT * FROM identity_challenges WHERE id=?")
    .bind(response.result.challengeId)
    .first();
  assert.notEqual(stored.code_hash, response.sent[0].code);
  assert.equal(JSON.stringify(stored).includes('"code":'), false);
  const results = await Promise.all([
    call(cookie, verification(response)),
    call(cookie, verification(response)),
  ]);
  assert.equal(
    results.filter((r) => r.result?.email === response.sent[0].email).length,
    1,
  );
  assert.equal(results.filter((r) => r.error).length, 1);
  assert.equal(
    (await call(cookie, verification(response))).error,
    "verification_unavailable",
  );
  const identity = await call(cookie, { action: "read", now: Date.now() });
  assert.equal(identity.result.email, response.sent[0].email);
  assert(identity.result.expiresAt <= stored.created_ms + 1800000);
});
test("identity rejects wrong expired reused and foreign email or guest codes", async () => {
  const cookie = await guest(),
    other = await guest(),
    response = await challenge(cookie);
  for (const input of [
    { ...verification(response), email: "foreign@example.invalid" },
    { ...verification(response), code: "0000000" },
  ])
    assert.equal((await call(cookie, input)).error, "verification_unavailable");
  assert.equal(
    (await call(other, verification(response))).error,
    "verification_unavailable",
  );
  const wrong = response.sent[0].code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++)
    assert.equal(
      (await call(cookie, { ...verification(response), code: wrong })).error,
      "verification_unavailable",
    );
  assert.equal(
    (await call(cookie, verification(response))).error,
    "verification_unavailable",
  );
  const fresh = await guest(),
    expired = await challenge(fresh);
  assert.equal(
    (await call(fresh, verification(expired, expired.result.expiresAt))).error,
    "verification_unavailable",
  );
});
test("identity rejects bot denial expiry purpose mismatch and durable token replay before email", async () => {
  for (const bot of ["denied", "expired", "wrong-action"]) {
    const r = await challenge(await guest(), { bot });
    assert.equal(r.sent.length, 0);
    assert.equal(r.error, "verification_unavailable");
  }
  const cookie = await guest(),
    token = "synthetic-unique-replayed-bot";
  const first = await challenge(cookie, { botToken: token });
  assert.equal(first.sent.length, 1);
  const replay = await challenge(await guest(), { botToken: token });
  assert.equal(replay.sent.length, 0);
  assert.equal(replay.error, "verification_unavailable");
});
test("identity resend preserves previous live code and unknown delivery without retry across restart", async () => {
  const cookie = await guest(),
    now = Date.now(),
    first = await challenge(cookie, { now });
  const second = await challenge(cookie, {
    now: now + 30000,
    email: first.sent[0].email,
    delivery: "lost",
  });
  assert.equal(second.sent.length, 1);
  assert.equal(
    (
      await call(cookie, {
        ...verification(first, now + 31000),
        challengeId: second.result.challengeId,
      })
    ).result.email,
    first.sent[0].email,
  );
  assert.equal(
    (await call(cookie, verification(second, now + 31000))).error,
    "verification_unavailable",
  );
  await mf.dispose();
  await start();
  assert.equal(
    (
      await db
        .prepare("SELECT state FROM identity_challenges WHERE id=?")
        .bind(second.result.challengeId)
        .first()
    ).state,
    "unknown",
  );
  assert.equal(
    (await call(cookie, verification(second, now + 31000))).error,
    "verification_unavailable",
  );
});
test("identity overlapping codes keep independent expiry and one-use limits through the latest form", async () => {
  const now = Date.now(),
    cookie = await guestAt(now),
    email = "overlap@example.invalid";
  const first = await challenge(cookie, { email, now });
  const second = await challenge(cookie, { email, now: now + 30000 });
  const third = await challenge(cookie, { email, now: now + 60000 });
  for (const [response, offset] of [
    [first, 0],
    [second, 30000],
    [third, 60000],
  ]) {
    assert.equal(response.sent.length, 1);
    assert.equal(response.result.expiresAt, now + offset + 120000);
    assert.equal(response.result.resendAfter, now + offset);
  }
  assert.equal(
    (await challenge(cookie, { email, now: now + 60001 })).retryAfterSeconds,
    600,
  );
  const latest = {
    ...verification(first, now + 60002),
    challengeId: third.result.challengeId,
    remember: true,
  };
  assert.equal(
    (await call(await guestAt(now + 60002), latest)).error,
    "verification_unavailable",
  );
  assert.equal(
    (await call(cookie, { ...latest, email: "foreign@example.invalid" })).error,
    "verification_unavailable",
  );
  const concurrent = await Promise.all([
    call(cookie, latest),
    call(cookie, latest),
  ]);
  assert.equal(concurrent.filter((r) => r.result?.email === email).length, 1);
  assert.equal(
    concurrent.filter((r) => r.error === "verification_unavailable").length,
    1,
  );
  const family = await db
    .prepare("SELECT id FROM remembered_identity WHERE id=?")
    .bind(first.result.challengeId)
    .first();
  assert.equal(family.id, first.result.challengeId);
  const beforeReplay = await db
    .prepare("SELECT * FROM verified_identity WHERE email=?")
    .bind(email)
    .first();
  assert.equal(
    (await call(cookie, { ...latest, now: now + 60003 })).error,
    "verification_unavailable",
  );
  assert.deepEqual(
    await db
      .prepare("SELECT * FROM verified_identity WHERE email=?")
      .bind(email)
      .first(),
    beforeReplay,
  );
  // The second code remains live after the first code's own deadline.
  assert.equal(
    (
      await call(cookie, {
        ...verification(second, now + 120000),
        challengeId: third.result.challengeId,
      })
    ).result.email,
    email,
  );
  assert.equal(
    (await call(cookie, { ...verification(third, now + 180000) })).error,
    "verification_unavailable",
  );
  const boundaryEmail = "overlap-boundary@example.invalid",
    boundaryCookie = await guestAt(now);
  const older = await challenge(boundaryCookie, { email: boundaryEmail, now });
  const newer = await challenge(boundaryCookie, {
    email: boundaryEmail,
    now: now + 30000,
  });
  assert.equal(
    (
      await call(boundaryCookie, {
        ...verification(older, now + 120000),
        challengeId: newer.result.challengeId,
      })
    ).error,
    "verification_unavailable",
  );
  assert.equal(
    (await call(boundaryCookie, verification(newer, now + 120000))).result
      .email,
    boundaryEmail,
  );
  // Five wrong guesses through the latest context exhaust both live candidates.
  const guessingCookie = await guestAt(now),
    guessingEmail = "overlap-guesses@example.invalid";
  const a = await challenge(guessingCookie, { email: guessingEmail, now });
  const b = await challenge(guessingCookie, {
    email: guessingEmail,
    now: now + 1000,
  });
  const wrong = ["000000", "111111", "222222"].find(
    (value) => ![a.sent[0].code, b.sent[0].code].includes(value),
  );
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await call(guessingCookie, {
          ...verification(b, now + 2000 + i),
          code: wrong,
        })
      ).error,
      "verification_unavailable",
    );
  for (const response of [a, b]) {
    assert.equal(
      (
        await call(guessingCookie, {
          ...verification(response, now + 3000),
          challengeId: b.result.challengeId,
        })
      ).error,
      "verification_unavailable",
    );
    assert.equal(
      (
        await db
          .prepare("SELECT attempts FROM identity_challenges WHERE id=?")
          .bind(response.result.challengeId)
          .first()
      ).attempts,
      5,
    );
  }
});
test("identity email limits survive session and network changes without extending denied retries", async () => {
  const email = "shared-limit@example.invalid",
    now = Date.now();
  const cookies = await Promise.all([guestAt(now), guestAt(now)]);
  const firstCandidates = await Promise.all(
    cookies.map((cookie, index) =>
      challenge(cookie, {
        email: index ? " Shared-Limit@Example.Invalid " : email,
        now,
        source: `email-limit-first-${index}`,
      }),
    ),
  );
  assert.equal(
    firstCandidates.reduce((n, response) => n + response.sent.length, 0),
    2,
  );
  for (const response of firstCandidates) {
    assert.equal(response.result.resendAfter, now);
    assert.equal(response.result.expiresAt, now + 120000);
  }
  // Aliases remain independent even when they reach the same mailbox.
  const alias = await challenge(await guestAt(now + 1000), {
    email: "shared-limit+alias@example.invalid",
    now: now + 1000,
  });
  assert.equal(alias.sent.length, 1);
  const thirdCookies = await Promise.all([
    guestAt(now + 240000),
    guestAt(now + 240000),
  ]);
  const thirds = await Promise.all(
    thirdCookies.map((cookie) =>
      challenge(cookie, { email, now: now + 240000 }),
    ),
  );
  assert.equal(
    thirds.reduce((n, response) => n + response.sent.length, 0),
    1,
  );
  const winner = thirds.findIndex((response) => response.sent.length);
  assert.equal(thirds[winner].result.resendAfter, now + 240000);
  assert.equal(thirds[winner].result.requestLimited, false);
  assert.equal(thirds[1 - winner].retryAfterSeconds, 600);
  // An issued code can still verify while the shared email request limit is active.
  assert.equal(
    (
      await call(
        thirdCookies[winner],
        verification(thirds[winner], now + 240001),
      )
    ).result.email,
    email,
  );
  const observer = await guestAt(now + 300000);
  const denied = await challenge(observer, { email, now: now + 300000 });
  assert.equal(denied.retryAfterSeconds, 540);
  assert.equal(denied.sent.length, 0);
  const snapshot = async () =>
    Promise.all(
      [
        "identity_challenges",
        "identity_bot_tokens",
        "identity_request_counters",
        "identity_request_denials",
      ].map(
        async (table) =>
          (await db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())
            .results,
      ),
    );
  const retained = await snapshot();
  // Reject any attempted write, including a no-op UPDATE, on repeated blocked requests.
  for (const table of [
    "identity_challenges",
    "identity_bot_tokens",
    "identity_request_counters",
    "identity_request_denials",
  ])
    for (const operation of ["INSERT", "UPDATE", "DELETE"])
      await db.exec(
        `CREATE TRIGGER synthetic_email_no_write_${table}_${operation} BEFORE ${operation} ON ${table} BEGIN SELECT RAISE(ABORT,'unexpected_denied_write'); END;`,
      );
  try {
    for (const offset of [300001, 500000, 839999]) {
      const repeated = await challenge(observer, { email, now: now + offset });
      assert.equal(repeated.error, "verification_request_limited");
      assert.equal(
        repeated.retryAfterSeconds,
        Math.ceil((840000 - offset) / 1000),
      );
      assert.equal(repeated.sent.length, 0);
    }
    assert.deepEqual(await snapshot(), retained);
  } finally {
    for (const table of [
      "identity_challenges",
      "identity_bot_tokens",
      "identity_request_counters",
      "identity_request_denials",
    ])
      for (const operation of ["INSERT", "UPDATE", "DELETE"])
        await db.exec(
          `DROP TRIGGER synthetic_email_no_write_${table}_${operation};`,
        );
  }
  const reset = await challenge(observer, { email, now: now + 840000 });
  assert.equal(reset.sent.length, 1);
  assert.equal(reset.result.requestLimited, false);
  assert.equal(reset.result.resendAfter, now + 840000);
  const emailCounter = await db
    .prepare(
      "SELECT request_count,last_request_ms FROM identity_request_counters WHERE scope='email' AND subject_key=(SELECT email_hash FROM identity_challenges WHERE id=?)",
    )
    .bind(reset.result.challengeId)
    .first();
  assert.deepEqual(emailCounter, {
    request_count: 1,
    last_request_ms: now + 840000,
  });
});
test("identity concurrent sends and subject limits cannot be bypassed by a new guest", async () => {
  await db.exec(
    "CREATE TABLE synthetic_identity_denial_writes(owner_id TEXT,kind TEXT); CREATE TRIGGER synthetic_identity_denial_insert AFTER INSERT ON identity_request_denials BEGIN INSERT INTO synthetic_identity_denial_writes VALUES(NEW.owner_id,'insert'); END; CREATE TRIGGER synthetic_identity_denial_update AFTER UPDATE ON identity_request_denials BEGIN INSERT INTO synthetic_identity_denial_writes VALUES(NEW.owner_id,'update'); END;",
  );
  const denialWrites = async () =>
    (
      await db
        .prepare("SELECT COUNT(*) n FROM synthetic_identity_denial_writes")
        .first()
    ).n;
  const cookie = await guest(),
    email = "rate-limited@example.invalid",
    now = Date.now();
  const first = await challenge(cookie, { email, now, source: "rate-source" });
  assert.equal(first.sent.length, 1);
  assert.equal(first.result.resendAfter, now);
  assert.equal(first.result.requestLimited, false);
  assert.deepEqual(Object.keys(first.result).sort(), [
    "challengeId",
    "expiresAt",
    "requestLimited",
    "resendAfter",
  ]);
  const second = await challenge(await guestAt(now + 1000), {
    email: "second@example.invalid",
    now: now + 1000,
    source: "rate-source",
  });
  assert.equal(second.sent.length, 1);
  assert.equal(second.result.resendAfter, now + 1000);
  assert.equal(second.result.requestLimited, false);
  const thirdCandidates = [
    await guestAt(now + 2000),
    await guestAt(now + 2000),
  ];
  const thirdResults = await Promise.all(
    thirdCandidates.map((session) =>
      challenge(session, {
        email: "third@example.invalid",
        now: now + 2000,
        source: "rate-source",
      }),
    ),
  );
  assert.equal(
    thirdResults.reduce((count, result) => count + result.sent.length, 0),
    1,
  );
  const thirdIndex = thirdResults.findIndex(
    (result) => result.sent.length === 1,
  );
  const thirdGuest = thirdCandidates[thirdIndex];
  const third = thirdResults[thirdIndex];
  assert.equal(thirdResults[1 - thirdIndex].retryAfterSeconds, 600);
  assert.equal(third.sent.length, 1);
  assert.equal(third.result.resendAfter, now + 2000);
  assert.equal(third.result.requestLimited, false);
  assert.equal(
    (
      await db
        .prepare(
          "SELECT COUNT(*) n FROM synthetic_identity_denial_writes WHERE kind='update'",
        )
        .first()
    ).n,
    0,
  );
  // The third code remains valid while new requests are blocked.
  assert.equal(
    (await call(thirdGuest, verification(third, now + 2001))).result.email,
    "third@example.invalid",
  );
  const observedGuest = await guestAt(now + 122000);
  const beforeObserved = await denialWrites();
  const observedResults = await Promise.all(
    [0, 1].map(() =>
      challenge(observedGuest, {
        now: now + 122000,
        source: "rate-source",
      }),
    ),
  );
  for (const denied of observedResults) {
    assert.equal(denied.sent.length, 0);
    assert.equal(denied.retryAfterSeconds, 480);
  }
  assert.equal(await denialWrites(), beforeObserved + 1);
  // A separately blocked IP has a later deadline; observing it must not extend this session's existing block.
  for (const offset of [10000, 20000, 30000]) {
    const accepted = await challenge(await guestAt(now + offset), {
      now: now + offset,
      source: "later-blocked-network",
    });
    assert.equal(accepted.sent.length, 1);
  }
  const beforeRepeated = await denialWrites();
  // An IP-derived denial stays with its session after network/email changes, without extending it.
  for (const session of [thirdGuest, observedGuest]) {
    for (const [offset, seconds] of [
      [122000, 480],
      [601999, 1],
    ]) {
      const blocked = await challenge(session, {
        now: now + offset,
        source: "fresh-network",
      });
      assert.equal(blocked.sent.length, 0);
      assert.equal(blocked.retryAfterSeconds, seconds);
      const laterIp = await challenge(session, {
        now: now + offset,
        source: "later-blocked-network",
      });
      assert.equal(laterIp.sent.length, 0);
      assert.equal(laterIp.retryAfterSeconds, seconds);
    }
  }
  assert.equal(await denialWrites(), beforeRepeated);
  // Once the original block expires, the current IP's remaining independent block may be observed.
  const remainingIpBlock = await challenge(observedGuest, {
    now: now + 602000,
    source: "later-blocked-network",
  });
  assert.equal(remainingIpBlock.retryAfterSeconds, 28);
  const restarted = await challenge(thirdGuest, {
    now: now + 602000,
    source: "rate-source",
  });
  assert.equal(restarted.sent.length, 1);
  assert.equal(restarted.result.resendAfter, now + 602000);
  assert.equal(restarted.result.requestLimited, false);
  const idle = await challenge(thirdGuest, {
    now: now + 1202000,
    source: "rate-source",
  });
  assert.equal(idle.sent.length, 1);
  assert.equal(idle.result.requestLimited, false);
  const counter = await db
    .prepare(
      "SELECT request_count FROM identity_request_counters WHERE scope='session' AND subject_key=(SELECT owner_id FROM identity_challenges WHERE id=?)",
    )
    .bind(idle.result.challengeId)
    .first();
  assert.equal(counter.request_count, 1);
  // Rotating both email and IP cannot bypass the session's own three-request cycle.
  const rotating = await guest();
  const rotatingNow = Date.now();
  for (const offset of [0, 120000, 240000]) {
    const accepted = await challenge(rotating, { now: rotatingNow + offset });
    assert.equal(accepted.sent.length, 1);
    assert.equal(accepted.result.requestLimited, false);
  }
  const rotated = await challenge(rotating, { now: rotatingNow + 360000 });
  assert.equal(rotated.retryAfterSeconds, 480);
  assert.equal(rotated.sent.length, 0);
  // A slow send retains an observed shared block while returning the normal success timer.
  const slowGuest = await guest();
  const slowNow = Date.now();
  const pending = challenge(slowGuest, {
    now: slowNow,
    source: "held-source",
    delivery: "held",
  });
  assert.equal(
    (await call(slowGuest, { action: "wait-delivery", now: slowNow })).result
      .waiting,
    true,
  );
  for (const offset of [1000, 2000]) {
    const completed = await challenge(await guestAt(slowNow + offset), {
      now: slowNow + offset,
      source: "held-source",
    });
    assert.equal(completed.sent.length, 1);
  }
  await call(slowGuest, { action: "release-delivery", now: slowNow });
  const slowResult = await pending;
  assert.equal(slowResult.result.requestLimited, false);
  assert.equal(slowResult.result.resendAfter, slowNow);
  const slowChangedNetwork = await challenge(slowGuest, {
    now: slowNow + 122000,
    source: "held-new-network",
  });
  assert.equal(slowChangedNetwork.sent.length, 0);
  assert.equal(slowChangedNetwork.retryAfterSeconds, 480);
  assert.equal(
    (await call(slowGuest, verification(slowResult, slowNow + 119999))).error,
    undefined,
  );
  await db.exec(
    "DROP TRIGGER synthetic_identity_denial_insert; DROP TRIGGER synthetic_identity_denial_update; DROP TABLE synthetic_identity_denial_writes;",
  );
});
test("identity guest revocation denies verified session and ambiguous contacts never prefill", async () => {
  const cookie = await guest(),
    response = await challenge(cookie, { source: "prefill-source" });
  await call(cookie, verification(response));
  const revoke = await mf.dispatchFetch(origin + "/api/access", {
    method: "DELETE",
    headers: { origin, cookie },
  });
  assert.equal(revoke.status, 200);
  assert.equal(
    (await call(cookie, { action: "read", now: Date.now() })).error,
    "access_denied",
  );
  const candidate = {
    email: "verified@example.invalid",
    name: "Synthetic Guest",
    phone: "00000000",
  };
  for (const matches of [
    [],
    [candidate, candidate],
    [{ ...candidate, email: "foreign@example.invalid" }],
  ])
    assert.equal(
      (
        await call("", {
          action: "profile",
          now: 0,
          email: candidate.email,
          matches,
        })
      ).result,
      null,
    );
  assert.deepEqual(
    (
      await call("", {
        action: "profile",
        now: 0,
        email: candidate.email,
        matches: [candidate],
      })
    ).result,
    { name: candidate.name, phone: candidate.phone },
  );
});

async function guestAt(now) {
  const r = await call("", { action: "guest", now });
  assert.equal(r.error, undefined);
  return r.cookies[0].split(";")[0];
}
async function remembered(now = Date.now(), email) {
  const cookie = await guestAt(now);
  const c = await challenge(cookie, {
    now,
    source: `remember-source-${sequence}`,
    ...(email ? { email } : {}),
  });
  assert.equal(c.error, undefined);
  const v = await call(cookie, { ...verification(c, now), remember: true });
  assert.equal(v.error, undefined);
  return {
    guest: cookie,
    cookie: v.cookies[0].split(";")[0],
    header: v.cookies[0],
    email: v.result.email,
    id: c.result.challengeId,
    now,
  };
}
test("remembered identity requires opt in and persists only digests with fixed cookie expiry", async () => {
  const now = Date.now(),
    cookie = await guestAt(now);
  const c = await challenge(cookie, { now, source: "opt-out" });
  const v = await call(cookie, verification(c, now));
  assert.equal(v.cookies.length, 1);
  assert.match(v.cookies[0], /Max-Age=0/);
  assert.equal(
    await db
      .prepare("SELECT id FROM remembered_identity WHERE id=?")
      .bind(c.result.challengeId)
      .first(),
    null,
  );
  const r = await remembered();
  assert.match(
    r.header,
    /Path=\/; Secure; HttpOnly; SameSite=Strict; Expires=/,
  );
  const stored = await db
    .prepare("SELECT * FROM remembered_identity WHERE id=?")
    .bind(r.id)
    .first();
  assert.equal(stored.expires_ms, r.now + 90 * 86400000);
  assert.equal(JSON.stringify(stored).includes(r.cookie.split("=")[1]), false);
  await assert.rejects(
    db
      .prepare(
        "UPDATE remembered_identity SET expires_ms=expires_ms+1 WHERE id=?",
      )
      .bind(r.id)
      .run(),
    /remembered_expiry_immutable/,
  );
});
test("remembered identity survives restart and restores into a fresh guest without old attempt authority", async () => {
  const r = await remembered();
  const original = await db
    .prepare(
      "SELECT * FROM guest_access WHERE capability_hash=(SELECT origin_access_hash FROM remembered_identity WHERE id=?)",
    )
    .bind(r.id)
    .first();
  await mf.dispose();
  await start();
  const now = r.now + 86400000,
    next = await guestAt(now);
  const restored = await call(`${next}; ${r.cookie}`, {
    action: "restore",
    now,
  });
  assert.equal(restored.result.email, r.email);
  assert.equal(restored.result.expiresAt, now + 1800000);
  const owner = await db
    .prepare(
      "SELECT owner_id FROM verified_identity WHERE email=? ORDER BY expires_ms DESC LIMIT 1",
    )
    .bind(r.email)
    .first();
  assert.notEqual(owner.owner_id, original.owner_id);
  assert.deepEqual(
    await db
      .prepare("SELECT * FROM guest_access WHERE capability_hash=?")
      .bind(original.capability_hash)
      .first(),
    original,
  );
});
test("remembered identity denies at and after absolute day ninety and rotation cannot extend expiry", async () => {
  const r = await remembered(),
    end = r.now + 90 * 86400000;
  const fresh = await guestAt(end - 1);
  const before = await call(`${fresh}; ${r.cookie}`, {
    action: "restore",
    now: end - 1,
  });
  assert.equal(before.result.email, r.email);
  assert.equal(before.result.expiresAt, end);
  const rotated = before.cookies[0].split(";")[0];
  for (const now of [end, end + 1]) {
    const result = await call(`${await guestAt(now)}; ${rotated}`, {
      action: "restore",
      now,
    });
    assert.equal(result.error, "identity_unavailable");
  }
  assert.equal(
    (
      await db
        .prepare("SELECT expires_ms FROM remembered_identity WHERE id=?")
        .bind(r.id)
        .first()
    ).expires_ms,
    end,
  );
});
test("remembered concurrent rotation returns one successor and old-token replay revokes every linked session", async () => {
  const r = await remembered(),
    now = r.now + 60000;
  const a = await guestAt(now),
    b = await guestAt(now);
  const pair = await Promise.all(
    [a, b].map((g) => call(`${g}; ${r.cookie}`, { action: "restore", now })),
  );
  for (const result of pair) assert.equal(result.result.email, r.email);
  assert.equal(pair[0].cookies[0], pair[1].cookies[0]);
  assert.notEqual(pair[0].cookies[0].split(";")[0], r.cookie);
  const recovered = await call(`${await guestAt(now + 29999)}; ${r.cookie}`, {
    action: "restore",
    now: now + 29999,
  });
  assert.equal(recovered.cookies[0], pair[0].cookies[0]);
  const replay = await call(`${await guestAt(now + 30000)}; ${r.cookie}`, {
    action: "restore",
    now: now + 30000,
  });
  assert.equal(replay.error, "identity_unavailable");
  for (const cookie of [r.guest, a, b])
    assert.equal(
      (await call(cookie, { action: "read", now: now + 30000 })).error,
      "access_denied",
    );
});
test("remembered logout fences concurrent restore and a delayed issued cookie cannot revive authority", async () => {
  const r = await remembered(),
    now = r.now + 60000,
    fresh = await guestAt(now);
  const [restored, logout] = await Promise.all([
    call(`${fresh}; ${r.cookie}`, { action: "restore", now }),
    mf.dispatchFetch(origin + "/api/access", {
      method: "DELETE",
      headers: { origin, cookie: r.guest },
    }),
  ]);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /__Host-soccerbot-remember=;/);
  const delayed = restored.cookies?.[0]?.split(";")[0] ?? r.cookie;
  assert.equal(
    (
      await call(`${await guestAt(now)}; ${delayed}`, {
        action: "restore",
        now,
      })
    ).error,
    "identity_unavailable",
  );
  assert.equal(
    (await call(r.guest, { action: "read", now })).error,
    "access_denied",
  );
});
test("remembered all-device signout accepts restored and older valid sessions and invalidates older challenges", async () => {
  const r = await remembered(),
    later = r.now + 121000;
  const pendingGuest = await guestAt(later);
  const pending = await challenge(pendingGuest, {
    now: later,
    email: r.email,
    source: "pending-all-devices",
  });
  const other = await guestAt(later);
  assert.equal(
    (await call(`${other}; ${r.cookie}`, { action: "restore", now: later }))
      .result.email,
    r.email,
  );
  assert.equal(
    (await call(other, { action: "all-signout", now: later })).error,
    undefined,
  );
  assert.equal(
    (await call(r.guest, { action: "read", now: later + 1 })).result,
    null,
  );
  assert.equal(
    (
      await call(pendingGuest, {
        ...verification(pending, later + 2),
        remember: true,
      })
    ).error,
    "verification_unavailable",
  );
  assert.equal(
    (await call(other, { action: "read", now: later + 2 })).result,
    null,
  );
  // The booking capability survives, but no profile can be read or changed.
  for (const cookie of [r.guest, other]) {
    assert.equal(
      (await call(cookie, { action: "contact-read", now: later + 2 })).error,
      "identity_unavailable",
    );
    assert.equal(
      (
        await call(cookie, {
          action: "contact-save",
          now: later + 2,
          contact: {
            email: r.email,
            name: "Untrusted change",
            phone: "81234567",
          },
        })
      ).error,
      "identity_unavailable",
    );
  }
  assert.equal(
    (
      await db
        .prepare(
          "SELECT revoked_ms FROM guest_access WHERE capability_hash=(SELECT origin_access_hash FROM remembered_identity WHERE id=?)",
        )
        .bind(r.id)
        .first()
    ).revoked_ms,
    null,
  );
  const old = await remembered();
  assert.equal(
    (await call(old.guest, { action: "all-signout", now: old.now + 300000 }))
      .error,
    undefined,
  );
  assert.equal(
    (
      await db
        .prepare("SELECT revoked_ms FROM remembered_identity WHERE id=?")
        .bind(old.id)
        .first()
    ).revoked_ms,
    old.now + 300000,
  );
  assert.equal(
    (
      await call(await guestAt(old.now), {
        action: "all-signout",
        now: old.now,
      })
    ).error,
    "identity_unavailable",
  );
});
test("fresh remembered login after all-device signout keeps old families revoked", async () => {
  for (const remember of [false, true]) {
    const old = await remembered();
    const signedOutAt = old.now + 1000;
    assert.equal(
      (await call(old.guest, { action: "all-signout", now: signedOutAt }))
        .error,
      undefined,
    );
    // Issue a new challenge after revocation without reviving the older family.
    const now = old.now + 121000;
    const fresh = await guestAt(now);
    const next = await challenge(fresh, {
      now,
      email: old.email,
      source: `fresh-after-signout-${sequence}`,
    });
    assert.equal(next.error, undefined);
    const verified = await call(fresh, {
      ...verification(next, now),
      remember,
    });
    assert.equal(verified.error, undefined);
    assert.equal(verified.result.email, old.email);
    assert.equal(verified.result.remember, remember);
    assert.equal((await call(old.guest, { action: "read", now })).result, null);
    assert.equal(
      (
        await call(`${await guestAt(now)}; ${old.cookie}`, {
          action: "restore",
          now,
        })
      ).error,
      "identity_unavailable",
    );
    if (remember) {
      const restored = await call(
        `${await guestAt(now)}; ${verified.cookies[0].split(";")[0]}`,
        { action: "restore", now: now + 1 },
      );
      assert.equal(restored.error, undefined);
      assert.equal(restored.result.email, old.email);
    }
  }
});
test("all-device signout rejects expired identity and preserves another email", async () => {
  const r = await remembered();
  const other = await remembered();
  await db
    .prepare("UPDATE verified_identity SET expires_ms=? WHERE email=?")
    .bind(r.now, r.email)
    .run();
  assert.equal(
    (await call(r.guest, { action: "all-signout", now: r.now + 1 })).error,
    "identity_unavailable",
  );
  assert.equal(
    (
      await db
        .prepare("SELECT revoked_ms FROM remembered_identity WHERE id=?")
        .bind(r.id)
        .first()
    ).revoked_ms,
    null,
  );
  assert.equal(
    (await call(other.guest, { action: "read", now: other.now + 1 })).result
      .email,
    other.email,
  );
});
test("remembered malformed duplicate foreign and missing credentials cannot disclose identity", async () => {
  const r = await remembered(),
    now = r.now + 60000;
  assert.equal(
    (await call(await guestAt(now), { action: "restore", now })).result,
    null,
  );
  for (const suffix of [
    "__Host-soccerbot-remember=forged",
    `${r.cookie}; ${r.cookie}`,
    "__Host-soccerbot-remember=" + "a".repeat(64),
  ])
    assert.equal(
      (
        await call(`${await guestAt(now)}; ${suffix}`, {
          action: "restore",
          now,
        })
      ).error,
      "identity_unavailable",
    );
  await db
    .prepare("UPDATE remembered_identity SET account_id='foreign' WHERE id=?")
    .bind(r.id)
    .run();
  assert.equal(
    (
      await call(`${await guestAt(now)}; ${r.cookie}`, {
        action: "restore",
        now,
      })
    ).error,
    "identity_unavailable",
  );
  const response = await mf.dispatchFetch(origin + "/api/identity/restore", {
    method: "POST",
    headers: { origin: "https://foreign.test", cookie: r.guest },
  });
  assert.equal(response.status, 403);
});
test("remembered storage failure rolls back consumption and emits no credential", async () => {
  const now = Date.now(),
    cookie = await guestAt(now),
    c = await challenge(cookie, { now, source: "storage-failure" });
  await db.exec(
    "CREATE TRIGGER synthetic_remember_failure BEFORE INSERT ON remembered_identity BEGIN SELECT RAISE(ABORT,'synthetic_storage_failure'); END;",
  );
  const failed = await call(cookie, {
    ...verification(c, now),
    remember: true,
  });
  assert.equal(failed.result, undefined);
  assert.equal(failed.cookies, undefined);
  assert.equal(
    (
      await db
        .prepare("SELECT state FROM identity_challenges WHERE id=?")
        .bind(c.result.challengeId)
        .first()
    ).state,
    "sent",
  );
  await db.exec("DROP TRIGGER synthetic_remember_failure;");
});

test("remembered opt-out verification clears and revokes an earlier browser family without changing guest ownership", async () => {
  const old = await remembered(),
    now = old.now + 86400000;
  const next = await guestAt(now),
    combined = `${next}; ${old.cookie}`;
  const c = await challenge(combined, { now, source: "switch-account" });
  const v = await call(combined, { ...verification(c, now), remember: false });
  assert.equal(v.result.email, c.sent[0].email);
  assert.match(v.cookies[0], /Max-Age=0/);
  assert.equal(
    (
      await db
        .prepare("SELECT revoked_ms FROM remembered_identity WHERE id=?")
        .bind(old.id)
        .first()
    ).revoked_ms,
    now,
  );
  assert.equal(
    (await call(next, { action: "read", now })).result.email,
    c.sent[0].email,
  );
  assert.equal(
    (
      await call(`${await guestAt(now)}; ${old.cookie}`, {
        action: "restore",
        now,
      })
    ).error,
    "identity_unavailable",
  );
});
test("remembered verification racing signout never establishes reusable authority", async () => {
  const now = Date.now(),
    g = await guestAt(now),
    c = await challenge(g, { now, source: "verify-logout-race" });
  const [v, logout] = await Promise.all([
    call(g, { ...verification(c, now), remember: true }),
    mf.dispatchFetch(origin + "/api/access", {
      method: "DELETE",
      headers: { origin, cookie: g },
    }),
  ]);
  assert.equal(logout.status, 200);
  assert.equal((await call(g, { action: "read", now })).error, "access_denied");
  if (v.cookies?.length)
    assert.equal(
      (
        await call(`${await guestAt(now)}; ${v.cookies[0].split(";")[0]}`, {
          action: "restore",
          now,
        })
      ).error,
      "identity_unavailable",
    );
});
test("remembered signout after the guest expires revokes the persistent credential", async () => {
  const r = await remembered();
  await db
    .prepare(
      "UPDATE guest_access SET expires_ms=issued_ms+1 WHERE capability_hash=(SELECT origin_access_hash FROM remembered_identity WHERE id=?)",
    )
    .bind(r.id)
    .run();
  const response = await mf.dispatchFetch(origin + "/api/access", {
    method: "DELETE",
    headers: { origin, cookie: `${r.guest}; ${r.cookie}` },
  });
  assert.equal(response.status, 200);
  assert.notEqual(
    (
      await db
        .prepare("SELECT revoked_ms FROM remembered_identity WHERE id=?")
        .bind(r.id)
        .first()
    ).revoked_ms,
    null,
  );
});

test("website contact requires verified identity and a guessed email cannot read or overwrite another profile", async () => {
  const cookie = await guest(),
    response = await challenge(cookie, { source: crypto.randomUUID() });
  const email = response.sent[0].email,
    now = Date.now();
  const contact = { email, name: "Synthetic Contact", phone: "+65 8123 4567" };
  assert.ok((await call(cookie, { action: "contact-read", now })).error);
  assert.ok(
    (await call(cookie, { action: "contact-save", now, contact })).error,
  );
  await call(cookie, { ...verification(response), remember: true });
  assert.deepEqual(
    (await call(cookie, { action: "contact-read", now: Date.now() })).result,
    { email, contact: null },
  );
  assert.deepEqual(
    (await call(cookie, { action: "contact-save", now: Date.now(), contact }))
      .result,
    { email, saved: true },
  );
  for (const patch of [
    { name: "Test\nCustomer" },
    { phone: "8123\t4567" },
    { email: "a..b@example.com" },
  ]) {
    const rejected = await call(cookie, {
      action: "contact-save",
      now: Date.now(),
      contact: { ...contact, ...patch },
    });
    assert.equal(rejected.error, "invalid_contact");
    assert.deepEqual(
      (await call(cookie, { action: "contact-read", now: Date.now() })).result
        .contact,
      { name: contact.name, phone: "+6581234567" },
    );
  }
  const foreign = await guest(),
    foreignChallenge = await challenge(foreign, {
      source: crypto.randomUUID(),
    });
  await call(foreign, { ...verification(foreignChallenge), remember: true });
  assert.ok(
    (await call(foreign, { action: "contact-save", now: Date.now(), contact }))
      .error,
  );
  assert.equal(
    (await call(foreign, { action: "contact-read", now: Date.now() })).result
      .contact,
    null,
  );
  assert.deepEqual(
    (await call(cookie, { action: "contact-read", now: Date.now() })).result,
    { email, contact: { name: contact.name, phone: "+6581234567" } },
  );
  for (const phone of ["+4412345", "+441234567890123"]) {
    assert.deepEqual(
      (
        await call(cookie, {
          action: "contact-save",
          now: Date.now(),
          contact: { ...contact, phone },
        })
      ).result,
      { email, saved: true },
    );
    assert.equal(
      (await call(cookie, { action: "contact-read", now: Date.now() })).result
        .contact.phone,
      phone,
    );
  }
});
test("website contact shared email uses latest explicit save without changing retained attempts or identity expiry", async () => {
  const first = await guest(),
    response = await challenge(first, { source: crypto.randomUUID() });
  await call(first, { ...verification(response), remember: true });
  const email = response.sent[0].email;
  const second = await guest(),
    later = Date.now() + 121000;
  const shared = await challenge(second, {
    email,
    now: later,
    source: crypto.randomUUID(),
  });
  await call(second, { ...verification(shared, later), remember: true });
  const before = (await db.prepare("SELECT * FROM attempts ORDER BY id").all())
    .results;
  const identityBefore = (
    await db
      .prepare("SELECT * FROM verified_identity ORDER BY access_hash")
      .all()
  ).results;
  for (const [cookie, name] of [
    [first, "First Contact"],
    [second, "Latest Contact"],
  ])
    assert.equal(
      (
        await call(cookie, {
          action: "contact-save",
          now: later,
          contact: { email, name, phone: "+65 8123 4567" },
        })
      ).result.saved,
      true,
    );
  assert.equal(
    (await call(first, { action: "contact-read", now: later })).result.contact
      .name,
    "Latest Contact",
  );
  assert.equal(
    (
      await db
        .prepare("SELECT COUNT(*) AS n FROM contact_profiles WHERE email=?")
        .bind(email)
        .first()
    ).n,
    1,
  );
  assert.deepEqual(
    (await db.prepare("SELECT * FROM attempts ORDER BY id").all()).results,
    before,
  );
  assert.deepEqual(
    (
      await db
        .prepare("SELECT * FROM verified_identity ORDER BY access_hash")
        .all()
    ).results,
    identityBefore,
  );
});
test("website contact rejects malformed payloads expired sessions and signout while preserving saved data", async () => {
  const cookie = await guest(),
    response = await challenge(cookie, { source: crypto.randomUUID() });
  await call(cookie, { ...verification(response), remember: true });
  const email = response.sent[0].email,
    contact = { email, name: "Retained Contact", phone: "+65 8123 4567" };
  assert.equal(
    (await call(cookie, { action: "contact-save", now: Date.now(), contact }))
      .result.saved,
    true,
  );
  for (const bad of [
    { ...contact, name: "x" },
    { ...contact, phone: "abc" },
    { ...contact, accountId: "foreign" },
  ])
    assert.ok(
      (
        await call(cookie, {
          action: "contact-save",
          now: Date.now(),
          contact: bad,
        })
      ).error,
    );
  assert.ok(
    (await call(cookie, { action: "contact-read", now: Date.now() + 1800000 }))
      .error,
  );
  assert.ok(
    (
      await call(cookie, {
        action: "contact-save",
        now: Date.now() + 1800000,
        contact,
      })
    ).error,
  );
  await call(cookie, { action: "all-signout", now: Date.now() });
  assert.ok(
    (await call(cookie, { action: "contact-read", now: Date.now() })).error,
  );
  assert.ok(
    (await call(cookie, { action: "contact-save", now: Date.now(), contact }))
      .error,
  );
  assert.equal(
    (
      await db
        .prepare("SELECT name FROM contact_profiles WHERE email=?")
        .bind(email)
        .first()
    ).name,
    contact.name,
  );
});
test("website contact HTTP boundary rejects foreign origin query targeting unverified reads and oversized writes", async () => {
  const cookie = await guest();
  for (const [url, options, status] of [
    [
      "/api/identity/contact",
      {
        method: "POST",
        headers: { origin: "https://foreign.invalid", cookie },
      },
      403,
    ],
    [
      "/api/identity/contact?email=someone@example.invalid",
      { headers: { cookie } },
      400,
    ],
    ["/api/identity/contact", { headers: { cookie } }, 401],
    [
      "/api/identity/contact",
      {
        method: "POST",
        headers: { cookie, origin, "content-type": "application/json" },
        body: "x".repeat(4097),
      },
      413,
    ],
  ]) {
    const response = await mf.dispatchFetch(origin + url, options);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});
test("website contact remembered restoration can read and save without recovering booking authority", async () => {
  const cookie = await guest(),
    response = await challenge(cookie, { source: crypto.randomUUID() }),
    at = Date.now();
  const verified = await call(cookie, {
    ...verification(response, at),
    remember: true,
  });
  const remember = verified.cookies[0].split(";")[0],
    email = response.sent[0].email;
  await call(cookie, {
    action: "contact-save",
    now: at,
    contact: { email, name: "Remembered Contact", phone: "+65 8123 4567" },
  });
  const later = at + 1800001;
  const fresh = await call("", { action: "guest", now: later });
  const nextCookie = fresh.cookies[0].split(";")[0] + "; " + remember;
  assert.ok(
    (await call(nextCookie, { action: "contact-read", now: later })).error,
  );
  assert.equal(
    (await call(nextCookie, { action: "restore", now: later })).result.email,
    email,
  );
  assert.equal(
    (await call(nextCookie, { action: "contact-read", now: later })).result
      .contact.name,
    "Remembered Contact",
  );
  assert.equal(
    (
      await call(nextCookie, {
        action: "contact-save",
        now: later,
        contact: { email, name: "Updated Contact", phone: "+65 8765 4321" },
      })
    ).result.saved,
    true,
  );
  assert.equal(
    (await call(nextCookie, { action: "contact-read", now: later })).result
      .contact.name,
    "Updated Contact",
  );
});
test("website contact opt-out cannot create or replace a profile even with a forged remember flag", async () => {
  const opted = await remembered();
  const subject = opted.email;
  const contact = {
    email: subject,
    name: "Original Contact",
    phone: "+65 8123 4567",
  };
  assert.equal(
    (
      await call(opted.guest, {
        action: "contact-save",
        now: Date.now(),
        contact,
      })
    ).result.saved,
    true,
  );
  const cookie = await guest(),
    at = Date.now() + 121000;
  const response = await challenge(cookie, {
    email: subject,
    now: at,
    source: crypto.randomUUID(),
  });
  const verified = await call(cookie, {
    ...verification(response, at),
    remember: false,
  });
  assert.equal(verified.result.remember, false);
  assert.ok(
    (
      await call(cookie, {
        action: "contact-save",
        now: at,
        contact: { ...contact, name: "Unconsented Update" },
      })
    ).error,
  );
  assert.ok(
    (
      await call(cookie, {
        action: "contact-save",
        now: at,
        contact: { ...contact, remember: true },
      })
    ).error,
  );
  assert.equal(
    (await call(cookie, { action: "contact-read", now: at })).result.contact
      .name,
    "Original Contact",
  );
  const noProfileCookie = await guest(),
    newChallenge = await challenge(noProfileCookie, {
      source: crypto.randomUUID(),
    });
  await call(noProfileCookie, verification(newChallenge));
  assert.ok(
    (
      await call(noProfileCookie, {
        action: "contact-save",
        now: Date.now(),
        contact: { ...contact, email: newChallenge.sent[0].email },
      })
    ).error,
  );
  assert.equal(
    (await call(noProfileCookie, { action: "contact-read", now: Date.now() }))
      .result.contact,
    null,
  );
});
test("website contact stays inaccessible under closed developer proof even with an otherwise valid identity", async () => {
  const cookie = await guest(),
    response = await challenge(cookie, { source: crypto.randomUUID() });
  await call(cookie, { ...verification(response), remember: true });
  const email = response.sent[0].email,
    contact = { email, name: "Retained Profile", phone: "+65 8123 4567" };
  assert.equal(
    (await call(cookie, { action: "contact-save", now: Date.now(), contact }))
      .result.saved,
    true,
  );
  for (const name of [
    "0012_identity_replacement_window.sql",
    "0014_identity_proof_window.sql",
  ])
    await db.exec(
      readFileSync(`migrations/${name}`, "utf8")
        .replace(/^--.*$/gm, "")
        .replace(/\n/g, " "),
    );
  const now = Date.now();
  for (const [id, start, end] of [
    [1, now - 5000000, now - 4000000],
    [2, now - 3000000, now - 2000000],
    [3, now, now + 600000],
  ]) {
    await db
      .prepare(
        "INSERT INTO identity_delivery_window VALUES(?,?,?,'SoccerBotStudioSG Dev <noreply@auth.app404.ai>','sheng@app404.ai',?,?,'open')",
      )
      .bind(id, "a".repeat(40), origin, start, end)
      .run();
    await db
      .prepare(
        "UPDATE identity_delivery_window SET state='closed' WHERE singleton=?",
      )
      .bind(id)
      .run();
  }
  assert.ok((await call(cookie, { action: "contact-read", now })).error);
  assert.ok(
    (
      await call(cookie, {
        action: "contact-save",
        now,
        contact: { ...contact, name: "Forbidden Update" },
      })
    ).error,
  );
  const publicRead = await mf.dispatchFetch(origin + "/api/identity/contact", {
    headers: { cookie },
  });
  assert.equal(publicRead.status, 503);
  assert.equal(
    (
      await db
        .prepare("SELECT name FROM contact_profiles WHERE email=?")
        .bind(email)
        .first()
    ).name,
    contact.name,
  );
});
