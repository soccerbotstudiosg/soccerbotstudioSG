import { admission, expiredReservation } from "./reservation-abuse-fixture.mjs";
import { isHitPayApiCall } from "./provider-url-fixture.mjs";
import { setTimeout as waitForClockBoundary } from "node:timers/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createBookingMechanism } from "./booking-mechanism-fixture.mjs";

/** Consume each checkout response before waiting for competing requests. */
async function checkoutResult(pending, expectedStatus) {
  const response = await pending;
  // Miniflare wraps an Undici response's stream; leaving it unread while a
  // peer request finishes lets the original response's GC finalizer cancel it.
  const body = await response.text();
  if (expectedStatus !== undefined)
    assert.equal(response.status, expectedStatus, body);
  return JSON.parse(body);
}

async function customer(m) {
  const access = await m.mf.dispatchFetch(m.origin + "/api/access", {
    method: "POST",
    headers: { origin: m.origin },
  });
  assert.equal(access.status, 201);
  const headers = {
    origin: m.origin,
    cookie: access.headers.get("set-cookie").split(";")[0],
    "content-type": "application/json",
  };
  const key = crypto.randomUUID();
  const input = {
    key,
    holding: true,
    accepted: false,
    contact: {
      name: "Synthetic Guest",
      email: "synthetic@example.test",
      phone: "+6591234567",
      contactMethod: "email",
      academy: "Synthetic School",
    },
    sessions: [
      {
        serviceId: "2",
        instructorId: "14",
        startMs: m.startMs,
        players: 2,
        totalMinor: 8800,
      },
    ],
  };
  return {
    headers,
    input,
    send: (value = input) =>
      m.mf.dispatchFetch(m.origin + `/api/booking/hold/${key}`, {
        method: "POST",
        headers,
        body: JSON.stringify(value),
      }),
  };
}

test("combined hold performs one preflight and preserves immutable identity across concurrent requests and restoration", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    await m.db
      .prepare("UPDATE guest_access SET expires_ms=?")
      .bind(Date.now() + 300000)
      .run();
    c.input.contact.contactMethod = "sms";
    const results = await Promise.all(
      [c.send(), c.send()].map((pending) => checkoutResult(pending, 200)),
    );
    assert.ok(results.some((result) => result.state === "associated"));
    const timing = await m.db
      .prepare(
        "SELECT c.booking_created_ms,c.payment_window_ms,c.hold_window_ms,c.checking_buffer_ms,c.recovery_buffer_ms,h.expires_ms FROM checkout_progress c JOIN hitpay_holds h USING(attempt_id) WHERE attempt_id=?",
      )
      .bind(c.input.key)
      .first();
    const context = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/checkout`,
      { headers: c.headers },
    );
    const checking = (await context.json()).checking;
    assert.equal(checking.holdExpiresAtMs, timing.expires_ms);
    assert.equal(checking.recoveryEndsAtMs, timing.booking_created_ms + 720000);
    assert.equal(checking.deadlineMs, timing.booking_created_ms + 540000);
    assert.equal(timing.payment_window_ms, 480000);
    assert.equal(timing.hold_window_ms, 600000);
    assert.equal(timing.checking_buffer_ms, 60000);
    assert.equal(timing.recovery_buffer_ms, 180000);
    await assert.rejects(
      m.db
        .prepare(
          "UPDATE checkout_progress SET recovery_buffer_ms=0 WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .run(),
      /checkout_recovery_immutable/,
    );
    await assert.rejects(
      m.db
        .prepare(
          "UPDATE checkout_progress SET checking_buffer_ms=300000 WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .run(),
      /checkout_buffer_immutable/,
    );
    await assert.rejects(
      m.db
        .prepare(
          "UPDATE checkout_progress SET payment_window_ms=300000 WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .run(),
      /checkout_windows_immutable/,
    );
    assert.ok(timing.booking_created_ms <= Date.now());
    assert.ok(timing.expires_ms <= timing.booking_created_ms + 600000);
    assert.ok(timing.expires_ms > timing.booking_created_ms);
    assert.ok(timing.expires_ms > timing.booking_created_ms + 540000);

    assert.ok(results.every((result) => result.attemptId === c.input.key));
    for (const method of [
      "getEventList",
      "getUnitList",
      "getAdditionalFields",
      "getAvailableUnits",
      "getAvailableTimeIntervals",
      "book",
      "getBookingDetails",
    ])
      assert.equal(
        m.calls.filter((call) => call.body?.method === method).length,
        1,
        method,
      );
    assert.equal(
      m.calls.filter((call) => call.url.endsWith("/admin/invoices/901")).length,
      1,
    );
    assert.equal(
      m.calls.some((call) => isHitPayApiCall(call)),
      false,
    );
    assert.match(
      m.calls.find((call) => call.url.endsWith("/comment")).body.comment,
      /Preferred communication: SMS/,
    );
    const creation = m.calls.findIndex((call) => call.body?.method === "book");
    assert.equal(
      m.calls
        .slice(creation + 1)
        .some((call) =>
          ["getAvailableTimeIntervals", "getAvailableUnits"].includes(
            call.body?.method,
          ),
        ),
      false,
    );
    const current = await m.mf.dispatchFetch(
      m.origin + "/api/booking/current",
      { headers: c.headers },
    );
    assert.equal(current.status, 200, await current.clone().text());
    assert.equal((await current.json()).state, "held");
    const before = await m.db
      .prepare("SELECT id,intent_hash,intent_json FROM attempts")
      .first();
    assert.equal(before.id, c.input.key);
    const changed = await c.send({
      ...c.input,
      contact: { ...c.input.contact, name: "Changed" },
    });
    assert.equal(changed.status, 409);
    assert.deepEqual(
      await m.db
        .prepare("SELECT id,intent_hash,intent_json FROM attempts")
        .first(),
      before,
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    const checkout = await m.mf.dispatchFetch(
      m.origin + `/api/booking/hitpay/${c.input.key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ accepted: true }),
      },
    );
    assert.equal(checkout.status, 200, await checkout.clone().text());
    const payment = await m.db
      .prepare("SELECT expires_ms FROM hitpay_payments WHERE attempt_id=?")
      .bind(c.input.key)
      .first();
    assert.equal(
      payment.expires_ms,
      Math.min(timing.expires_ms, timing.booking_created_ms + 480000),
    );
    const creates = m.calls.filter(
      (call) =>
        call.url.endsWith("/v1/payment-requests") && call.method === "POST",
    );
    assert.equal(creates.length, 1);
    assert.match(creates[0].body.expires_after, /^[1-7] mins$/);
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("combined hold rejects changed price and unavailable selection before creation without deleting attempt evidence", async () => {
  const m = await createBookingMechanism({
    respond: async (call) =>
      call.body?.method === "getAvailableUnits"
        ? Response.json({ jsonrpc: "2.0", id: call.body.id, result: [] })
        : undefined,
  });
  try {
    const c = await customer(m);
    const invalid = await c.send({
      ...c.input,
      sessions: [{ ...c.input.sessions[0], totalMinor: 1 }],
    });
    assert.equal(invalid.status, 409);
    assert.deepEqual(await invalid.json(), {
      error: "checkout_window_unresolved",
    });
    assert.equal(
      m.calls.filter(
        (call) => call.body?.method === "getAvailableTimeIntervals",
      ).length,
      1,
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
    for (const table of [
      "attempts",
      "dispatches",
      "session_effects",
      "hitpay_payments",
    ])
      assert.equal(
        (await m.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n,
        0,
      );
    const calendarUrl = m.origin + `/api/calendar/${m.date.slice(0, 7)}`;
    const before = await (await m.mf.dispatchFetch(calendarUrl)).json();
    assert.ok(
      before.dates
        .flatMap((day) => day.offers ?? [])
        .some((offer) => offer.startMs === m.startMs),
      "price rejection does not mark the session occupied",
    );
    const response = await c.send();
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).state, "selection_unavailable");
    const rangeReads = m.calls.filter(
      (call) => call.body?.method === "getAvailableTimeIntervals",
    ).length;
    const after = await (await m.mf.dispatchFetch(calendarUrl)).json();
    assert.ok(
      after.dates
        .flatMap((day) => day.offers ?? [])
        .every(
          (offer) =>
            offer.startMs !== m.startMs ||
            offer.instructorId !== c.input.sessions[0].instructorId,
        ),
    );
    assert.equal(
      m.calls.filter(
        (call) => call.body?.method === "getAvailableTimeIntervals",
      ).length,
      rangeReads,
      "rejected selection edits the shared cache without rebuilding the month",
    );
    assert.equal(
      m.calls.some((call) => call.body?.method === "book"),
      false,
    );
    assert.equal(
      (
        await m.db
          .prepare("SELECT state FROM attempts WHERE id=?")
          .bind(c.input.key)
          .first()
      ).state,
      "prepared",
    );
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM session_effects").first())
        .n,
      0,
    );
  } finally {
    await m.close();
  }
});

test("combined hold retains an unknown provider creation and never replays it after a lost response", async () => {
  let providerCreations = 0;
  const m = await createBookingMechanism({
    respond: async (call) => {
      if (call.body?.method === "book") {
        providerCreations++;
        return new Response(null, { status: 503 });
      }
    },
  });
  try {
    const c = await customer(m);
    const response = await c.send();
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).state, "recovery_required");
    const row = await m.db
      .prepare("SELECT id,intent_hash,state FROM attempts")
      .first();
    assert.equal(row.id, c.input.key);
    assert.equal(row.state, "recovery_required");
    assert.ok(
      await m.db
        .prepare(
          "SELECT 1 FROM session_effects WHERE attempt_id=? AND outcome='unknown'",
        )
        .bind(c.input.key)
        .first(),
    );
    await c.send();
    assert.equal(providerCreations, 1);
    assert.deepEqual(
      await m.db.prepare("SELECT id,intent_hash,state FROM attempts").first(),
      row,
    );
    const current = await m.mf.dispatchFetch(
      m.origin + "/api/booking/current",
      { headers: c.headers },
    );
    assert.equal((await current.json()).state, "checking");
  } finally {
    await m.close();
  }
});

test("combined hold rechecks revocation at the write boundary and preserves created references on readback failure", async () => {
  for (const fault of ["revoke", "readback"]) {
    let m;
    m = await createBookingMechanism({
      respond: async (call) => {
        if (
          fault === "revoke" &&
          call.body?.method === "getAvailableTimeIntervals"
        )
          await m.db
            .prepare("UPDATE guest_access SET revoked_ms=?")
            .bind(Date.now())
            .run();
        if (fault === "readback" && call.body?.method === "getBookingDetails")
          return new Response(null, { status: 503 });
      },
    });
    try {
      const c = await customer(m);
      await c.send();
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        fault === "revoke" ? 0 : 1,
      );
      const row = await m.db
        .prepare("SELECT id,intent_hash,association_json FROM attempts")
        .first();
      assert.equal(row.id, c.input.key);
      if (fault === "readback") {
        assert.ok(row.association_json);
        await c.send();
        assert.equal(
          m.calls.filter((call) => call.body?.method === "book").length,
          1,
        );
        assert.deepEqual(
          await m.db
            .prepare("SELECT id,intent_hash,association_json FROM attempts")
            .first(),
          row,
        );
        assert.equal(
          (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first())
            .n,
          0,
        );
      }
    } finally {
      await m.close();
    }
  }
});

test("combined hold serializes competing customers and rejects the second slot without duplicate creation", async () => {
  const m = await createBookingMechanism();
  try {
    const first = await customer(m),
      second = await customer(m);
    const results = await Promise.all(
      [first.send(), second.send()].map((pending) => checkoutResult(pending)),
    );
    assert.equal(
      results.filter((result) => result.state === "associated").length,
      1,
    );
    assert.equal(
      results.filter((result) => result.state === "selection_unavailable")
        .length,
      1,
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
      2,
    );
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first()).n,
      1,
    );
    const denied = await m.mf.dispatchFetch(
      m.origin + `/api/booking/hold/${first.input.key}`,
      {
        method: "POST",
        headers: second.headers,
        body: JSON.stringify(first.input),
      },
    );
    assert.equal(denied.status, 409);
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
  } finally {
    await m.close();
  }
});

test("combined batch hold uses one validation per item and retains partial or unknown creation without payment", async () => {
  for (const fault of ["none", "conflict", "unknown"]) {
    let books = 0;
    const m = await createBookingMechanism({
      batch: true,
      respond: async (call) => {
        if (call.body?.method === "book") {
          books++;
          if (fault === "unknown" && books === 2)
            return new Response(null, { status: 503 });
        }
        if (
          fault === "conflict" &&
          books === 1 &&
          call.body?.method === "getAvailableUnits"
        )
          return Response.json({
            jsonrpc: "2.0",
            id: call.body.id,
            result: [],
          });
        return undefined;
      },
    });
    try {
      const c = await customer(m);
      c.input.sessions.push({
        ...c.input.sessions[0],
        startMs: m.startMs + 3000000,
      });
      const response = await c.send();
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal(
        (await response.json()).state,
        fault === "none" ? "associated" : "recovery_required",
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "getAvailableUnits")
          .length,
        2,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "closeBatch").length,
        fault === "none" ? 1 : 0,
      );
      assert.equal(books, fault === "conflict" ? 1 : 2);
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first())
          .n,
        fault === "none" ? 1 : 0,
      );
      const before = books;
      const restored = await m.mf.dispatchFetch(
        m.origin + "/api/booking/current",
        { headers: c.headers },
      );
      assert.equal(restored.status, 200, await restored.clone().text());
      const current = await restored.json();
      assert.equal(current.attemptId, c.input.key);
      assert.equal(current.state, fault === "none" ? "held" : "checking");
      assert.equal(current.sessions.length, 2);
      assert.equal(current.sessions[1].startMs, m.startMs + 3000000);
      if (fault === "conflict")
        assert.equal(current.sessions[1].serviceName, "Requested session");
      assert.equal(books, before);
      await c.send();
      assert.equal(books, before);
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("single hold exposes creation progress while independent readbacks are pending and payment remains blocked", async () => {
  let releaseBook, releaseComment, bookStarted, commentStarted;
  const bookGate = new Promise((resolve) => {
    releaseBook = resolve;
  });
  const commentGate = new Promise((resolve) => {
    releaseComment = resolve;
  });
  const booking = new Promise((resolve) => {
    bookStarted = resolve;
  });
  const commenting = new Promise((resolve) => {
    commentStarted = resolve;
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let both;
  const entered = new Promise((resolve) => {
    both = resolve;
  });
  const reads = new Set();
  const m = await createBookingMechanism({
    respond: async (call) => {
      if (call.body?.method === "book") {
        bookStarted();
        await bookGate;
      }
      if (call.url.endsWith("/comment")) {
        commentStarted();
        await commentGate;
      }
      const kind =
        call.body?.method === "getBookingDetails"
          ? "booking"
          : call.url.endsWith("/admin/invoices/901")
            ? "invoice"
            : null;
      if (kind) {
        reads.add(kind);
        if (reads.size === 2) both();
        await gate;
      }
    },
  });
  let holding;
  try {
    const c = await customer(m);
    holding = c.send();
    await booking;
    const beforeCreation = await m.mf.dispatchFetch(
      m.origin + `/api/booking/native/${c.input.key}`,
      { headers: c.headers },
    );
    assert.deepEqual(await beforeCreation.json(), {
      attemptId: c.input.key,
      state: "running",
      paymentAvailable: false,
    });
    releaseBook();
    await commenting;
    const beforeComment = await m.mf.dispatchFetch(
      m.origin + `/api/booking/native/${c.input.key}`,
      { headers: c.headers },
    );
    assert.deepEqual(await beforeComment.json(), {
      attemptId: c.input.key,
      state: "verifying",
      paymentAvailable: false,
    });
    assert.equal(reads.size, 0);
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first()).n,
      0,
    );
    releaseComment();
    await entered;
    const progress = await m.mf.dispatchFetch(
      m.origin + `/api/booking/native/${c.input.key}`,
      { headers: c.headers },
    );
    assert.deepEqual(await progress.json(), {
      attemptId: c.input.key,
      state: "verifying",
      paymentAvailable: false,
    });
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first()).n,
      0,
    );
    const checkout = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/checkout`,
      { headers: { ...c.headers, "X-Booking-Details": "1" } },
    );
    const pendingContext = await checkout.json();
    assert.notEqual(pendingContext.checkout?.state, "available");
    assert.equal(pendingContext.details.attemptId, c.input.key);
    assert.equal(pendingContext.details.sessions.length, 1);
    assert.equal(pendingContext.details.totalMinor, 8800);
    assert.equal("verifiedAtMs" in pendingContext.details, false);
    assert.equal(pendingContext.confirmation, undefined);
    const legacyContext = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/checkout`,
      { headers: c.headers },
    );
    assert.equal((await legacyContext.json()).details, undefined);
    release();
    assert.equal((await (await holding).json()).state, "associated");
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(m.calls.filter((call) => isHitPayApiCall(call)).length, 0);
  } finally {
    releaseBook();
    releaseComment();
    release();
    await holding;
    await m.close();
  }
});

test("ongoing confirmation grants twenty bounded two-second status checks while retaining the shared cap and deadline", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    await c.send();
    const original = await m.db
      .prepare("SELECT deadline_ms,intent_hash FROM attempts WHERE id=?")
      .bind(c.input.key)
      .first();
    const calls = m.calls.length;
    for (let i = 0; i < 21; i++) {
      await m.db
        .prepare("UPDATE attempts SET confirmation_next_ms=0 WHERE id=?")
        .bind(c.input.key)
        .run();
      const start = Date.now();
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/attempts/${c.input.key}/confirmation`,
        { headers: c.headers },
      );
      assert.equal(response.status, 200);
      const next = Number(response.headers.get("X-Next-Check"));
      const delay = i < 20 ? 2000 : 10000;
      assert.ok(next >= start + delay && next <= Date.now() + delay);
      const repeated = await m.mf.dispatchFetch(
        m.origin + `/api/attempts/${c.input.key}/confirmation`,
        { headers: c.headers },
      );
      assert.equal(repeated.status, 429);
    }
    assert.equal(
      m.calls.length,
      calls,
      "status checks do not read the provider",
    );
    assert.deepEqual(
      await m.db
        .prepare("SELECT deadline_ms,intent_hash FROM attempts WHERE id=?")
        .bind(c.input.key)
        .first(),
      original,
    );
    assert.equal(
      (
        await m.db
          .prepare("SELECT confirmation_checks AS n FROM attempts WHERE id=?")
          .bind(c.input.key)
          .first()
      ).n,
      21,
    );
    await m.db
      .prepare(
        "UPDATE attempts SET confirmation_checks=120,confirmation_next_ms=0 WHERE id=?",
      )
      .bind(c.input.key)
      .run();
    const exhausted = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/confirmation`,
      { headers: c.headers },
    );
    assert.equal(exhausted.status, 429);
  } finally {
    await m.close();
  }
});

test("single hold progress requires validated retained creation before comments without granting payment", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    assert.equal((await c.send()).status, 200);
    const saved = await m.db
      .prepare("SELECT * FROM attempts WHERE id=?")
      .bind(c.input.key)
      .first();
    const cases = [
      {
        outcome: "observed",
        reference: "701",
        finalized: true,
        state: "dispatching",
        batch: false,
        expected: "verifying",
      },
      {
        outcome: "unknown",
        reference: "701",
        finalized: true,
        state: "dispatching",
        batch: false,
        expected: "running",
      },
      {
        outcome: "observed",
        reference: "701",
        finalized: false,
        state: "dispatching",
        batch: false,
        expected: "running",
      },
      {
        outcome: "observed",
        reference: "701",
        finalized: true,
        state: "recovery_required",
        batch: false,
        expected: "running",
      },
      {
        outcome: "observed",
        reference: "701",
        finalized: true,
        state: "dispatching",
        batch: true,
        expected: "running",
      },
    ];
    // Seed independent intermediate snapshots; never rewrite immutable evidence.
    for (const scenario of cases) {
      const id = crypto.randomUUID();
      const intent = JSON.parse(saved.intent_json);
      if (scenario.batch)
        intent.sessions.push({
          ...intent.sessions[0],
          startMs: intent.sessions[0].startMs + 3000000,
        });
      if (scenario.batch) intent.totalMinor *= 2;
      const json = JSON.stringify(intent);
      const hash = Buffer.from(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json)),
      ).toString("hex");
      await m.db
        .prepare(
          "INSERT INTO attempts(id,owner_id,idempotency_key,intent_json,intent_hash,created_ms,deadline_ms,state) VALUES(?,?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          saved.owner_id,
          id,
          json,
          hash,
          saved.created_ms,
          saved.deadline_ms,
          scenario.state,
        )
        .run();
      await m.db
        .prepare(
          "UPDATE native_checkout_grants SET attempt_id=?,intent_hash=?,state='running' WHERE capability_hash=(SELECT capability_hash FROM guest_access WHERE owner_id=?)",
        )
        .bind(id, hash, saved.owner_id)
        .run();
      await m.db
        .prepare("INSERT INTO session_effects VALUES(?,'session:0',?,?)")
        .bind(id, scenario.outcome, scenario.reference)
        .run();
      if (scenario.finalized)
        await m.db
          .prepare(
            "INSERT INTO session_effects VALUES(?,'finalize','unknown',NULL)",
          )
          .bind(id)
          .run();
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/native/${id}`,
        { headers: c.headers },
      );
      assert.equal(response.status, 200, await response.clone().text());
      assert.deepEqual(await response.json(), {
        attemptId: id,
        state: scenario.expected,
        paymentAvailable: false,
      });
      const anonymous = await m.mf.dispatchFetch(
        m.origin + `/api/booking/native/${id}`,
      );
      assert.equal(anonymous.status, 401);
      if (scenario.expected === "verifying") {
        const denied = await m.mf.dispatchFetch(
          m.origin + `/api/booking/hitpay/${id}`,
          {
            method: "POST",
            headers: c.headers,
            body: JSON.stringify({ accepted: true }),
          },
        );
        assert.notEqual(denied.status, 200);
      }
    }
    assert.equal(
      m.calls.some((call) => isHitPayApiCall(call)),
      false,
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
  } finally {
    await m.close();
  }
});

test(
  "combined preflight overlaps independent reads and drains them before one booking write",
  { timeout: 15000 },
  async () => {
    const fields = Promise.withResolvers();
    const slotEntered = Promise.withResolvers();
    let fieldsPending = false;
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (call.body?.method === "getAdditionalFields") {
          fieldsPending = true;
          await fields.promise;
          fieldsPending = false;
        }
        if (call.body?.method === "getAvailableTimeIntervals")
          slotEntered.resolve();
        if (call.body?.method === "book") assert.equal(fieldsPending, false);
      },
    });
    let pending;
    try {
      const c = await customer(m);
      pending = c.send();
      await slotEntered.promise;
      assert.equal(
        fieldsPending,
        true,
        "availability starts while required fields are blocked",
      );
      assert.equal(
        m.calls.some((call) => call.body?.method === "book"),
        false,
      );
      fields.resolve();
      const response = await pending;
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal((await response.json()).state, "associated");
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      fields.resolve();
      await pending;
      await m.close();
    }
  },
);

test(
  "concurrent preflight drains siblings and rejects revocation before creation",
  { timeout: 15000 },
  async () => {
    const fields = Promise.withResolvers();
    const slotEntered = Promise.withResolvers();
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (call.body?.method === "getAdditionalFields") await fields.promise;
        if (call.body?.method === "getAvailableTimeIntervals")
          slotEntered.resolve();
      },
    });
    let pending;
    try {
      const c = await customer(m);
      pending = c.send();
      await slotEntered.promise;
      await m.db
        .prepare("UPDATE guest_access SET revoked_ms=?")
        .bind(Date.now())
        .run();
      fields.resolve();
      await pending;
      assert.equal(
        m.calls.some((call) => call.body?.method === "book"),
        false,
      );
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
        1,
      );
    } finally {
      fields.resolve();
      await pending;
      await m.close();
    }
  },
);

test(
  "combined preparation overlaps public and admin authentication without premature booking",
  { timeout: 15000 },
  async () => {
    const publicToken = Promise.withResolvers();
    const adminEntered = Promise.withResolvers();
    let publicPending = false;
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (call.body?.method === "getToken") {
          publicPending = true;
          await publicToken.promise;
          publicPending = false;
        }
        if (call.url.endsWith("/admin/auth")) adminEntered.resolve();
      },
    });
    let pending;
    try {
      const c = await customer(m);
      pending = c.send();
      await adminEntered.promise;
      assert.equal(publicPending, true);
      assert.equal(
        m.calls.some((call) => call.body?.method === "book"),
        false,
      );
      publicToken.resolve();
      const response = await pending;
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal((await response.json()).state, "associated");
      assert.equal(
        m.calls.filter((call) => call.body?.method === "getToken").length,
        1,
      );
      assert.equal(
        m.calls.filter((call) => call.url.endsWith("/admin/auth")).length,
        1,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
    } finally {
      publicToken.resolve();
      await pending;
      await m.close();
    }
  },
);

test("concurrent preflight attributes invalid fields correctly and creates no booking", async () => {
  const m = await createBookingMechanism({
    respond: async (call) =>
      call.body?.method === "getAdditionalFields"
        ? Response.json({ jsonrpc: "2.0", id: call.body.id, result: [{}] })
        : undefined,
  });
  try {
    const c = await customer(m);
    const response = await c.send();
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).state, "prerequisites_unavailable");
    assert.equal(
      m.calls.some((call) => call.body?.method === "book"),
      false,
    );
    const row = await m.db
      .prepare(
        "SELECT result_json FROM native_checkout_grants WHERE attempt_id=?",
      )
      .bind(c.input.key)
      .first();
    assert.equal(
      JSON.parse(row.result_json).diagnostic.operation,
      "required-fields",
    );
  } finally {
    await m.close();
  }
});

test("checkout reuses complete creation evidence for one HitPay request without redundant reads", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    const send = (accepted) =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted }),
      });
    assert.equal((await send(false)).status, 400);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 0);
    const response = await send(true);
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.deepEqual(result, {
      attemptId: c.input.key,
      state: "associated",
      paymentAvailable: true,
      checkout: {
        url: m.checkoutUrl,
        expiresAtMs: result.checkout.expiresAtMs,
      },
    });
    assert.ok(result.checkout.expiresAtMs > Date.now());
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => c.body?.method === "getBookingDetails").length,
      0,
    );
    assert.equal(
      m.calls.filter(
        (c) => c.url.endsWith("/admin/invoices/901") && c.method === "GET",
      ).length,
      0,
    );
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    const repeat = await send(true);
    assert.equal(repeat.status, 200);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("combined checkout never creates HitPay after failed booking verification and preserves its attempt", async () => {
  const m = await createBookingMechanism({
    missingCreationDeadline: true,
    respond: async (call) =>
      call.body?.method === "getBookingDetails"
        ? new Response(null, { status: 503 })
        : undefined,
  });
  try {
    const c = await customer(m);
    const send = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const response = await send();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      attemptId: c.input.key,
      state: "recovery_required",
      paymentAvailable: false,
    });
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(m.calls.filter((c) => isHitPayApiCall(c)).length, 0);
    await send();
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(m.calls.filter((c) => isHitPayApiCall(c)).length, 0);
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
      1,
    );
  } finally {
    await m.close();
  }
});

test("combined batch checkout retains one payment effect and exact booking association", async () => {
  const m = await createBookingMechanism({ batch: true });
  try {
    const c = await customer(m);
    const accessDeadline = Date.now() + 300000;
    await m.db
      .prepare("UPDATE guest_access SET expires_ms=?")
      .bind(accessDeadline)
      .run();
    c.input.sessions.push({
      ...c.input.sessions[0],
      startMs: m.startMs + 3000000,
    });
    const send = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const response = await send();
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(
      result.state,
      "associated",
      JSON.stringify(
        await m.db
          .prepare("SELECT result_json FROM native_checkout_grants")
          .first(),
      ),
    );
    assert.equal(result.paymentAvailable, true);
    assert.equal(result.checkout.url, m.checkoutUrl);
    assert.equal(
      m.calls.filter((c) => c.body?.method === "getBookingDetails").length,
      0,
    );
    assert.equal(
      m.calls.filter(
        (c) => c.url.endsWith("/admin/invoices/901") && c.method === "GET",
      ).length,
      0,
    );
    const timing = await m.db
      .prepare(
        "SELECT h.expires_ms,c.booking_created_ms,c.hold_window_ms FROM hitpay_holds h JOIN checkout_progress c ON c.attempt_id=h.attempt_id",
      )
      .first();
    assert.ok(
      timing.expires_ms <= timing.booking_created_ms + timing.hold_window_ms,
    );
    const payment = await m.db
      .prepare(
        "SELECT p.expires_ms,c.booking_created_ms FROM hitpay_payments p JOIN checkout_progress c ON c.attempt_id=p.attempt_id",
      )
      .first();
    assert.equal(payment.expires_ms, payment.booking_created_ms + 480000);
    assert.ok(payment.expires_ms > accessDeadline);
    const renewedAccess = await m.db
      .prepare("SELECT expires_ms FROM guest_access")
      .first();
    assert.ok(renewedAccess.expires_ms > payment.expires_ms);
    assert.ok(renewedAccess.expires_ms > accessDeadline);
    assert.equal(
      response.headers.get("set-cookie").split(";")[0],
      c.headers.cookie,
    );
    assert.equal(
      m.calls.find((c) => isHitPayApiCall(c) && c.method === "POST").body
        .expires_after,
      "7 mins",
    );
    await send();
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 2);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("batch closure fallback and failed hold persistence preserve one original attempt without unsafe payment", async () => {
  for (const failure of ["missing-deadline", "hold-save", "observation-save"]) {
    const m = await createBookingMechanism({
      batch: true,
      missingCreationDeadline: failure === "missing-deadline",
    });
    try {
      const c = await customer(m);
      c.input.sessions.push({
        ...c.input.sessions[0],
        startMs: m.startMs + 3000000,
      });
      if (failure === "hold-save")
        await m.db.exec(
          "CREATE TRIGGER reject_hold BEFORE INSERT ON hitpay_holds BEGIN SELECT RAISE(ABORT,'synthetic hold failure'); END;",
        );
      if (failure === "observation-save")
        await m.db.exec(
          "CREATE TRIGGER reject_observation BEFORE UPDATE OF observation_json ON attempts WHEN NEW.observation_json IS NOT NULL BEGIN SELECT RAISE(ABORT,'synthetic observation failure'); END;",
        );
      const send = () =>
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        });
      const response = await send();
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.paymentAvailable, failure === "missing-deadline");
      assert.equal(
        m.calls.filter((c) => c.body?.method === "getBookingDetails").length,
        failure === "missing-deadline" ? 2 : 0,
      );
      assert.equal(
        m.calls.filter(
          (c) => c.url.endsWith("/admin/invoices/901") && c.method === "GET",
        ).length,
        failure === "missing-deadline" ? 1 : 0,
      );
      if (failure !== "missing-deadline") {
        assert.equal(result.checkout, undefined);
        const retained = await m.db
          .prepare("SELECT id,association_json,observation_json FROM attempts")
          .first();
        assert.equal(retained.id, c.input.key);
        assert.equal(
          retained.association_json,
          null,
          "association and hold roll back together",
        );
        const keys = await m.db
          .prepare(
            "SELECT step,outcome,reference_id FROM session_effects WHERE step LIKE 'native-booking-key:%' ORDER BY step",
          )
          .all();
        assert.equal(keys.results.length, 2);
        assert.ok(
          keys.results.every(
            (key) =>
              key.outcome === "observed" &&
              JSON.parse(key.reference_id).bookingId,
          ),
        );
        assert.equal(
          (
            await m.db
              .prepare(
                "SELECT outcome FROM session_effects WHERE step='finalize'",
              )
              .first()
          ).outcome,
          "unknown",
        );
        assert.equal(retained.observation_json, null);
        assert.equal(
          await m.db.prepare("SELECT * FROM hitpay_holds").first(),
          null,
        );
      }
      await send();
      assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 2);
      assert.equal(
        m.calls.filter((c) => c.body?.method === "closeBatch").length,
        1,
      );
      assert.equal(
        m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
        failure === "missing-deadline" ? 1 : 0,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("scheduled display warming survives idle entry and booking refresh never delays payment handoff", async () => {
  const m = await createBookingMechanism({ displayWarming: true });
  try {
    await (await m.mf.getWorker()).scheduled();
    await (await m.mf.getWorker()).scheduled();
    await (await m.mf.getWorker()).scheduled();
    const before = m.calls.length;
    const month = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    const home = await m.mf.dispatchFetch(m.origin + "/api/calendar/" + month);
    const calendar = await home.json();
    assert.equal(home.status, 200);
    for (const offset of [1, 2]) {
      const next = new Date(month + "-01T00:00:00Z");
      next.setUTCMonth(next.getUTCMonth() + offset);
      const warmed = await m.mf.dispatchFetch(
        m.origin + "/api/calendar/" + next.toISOString().slice(0, 7),
      );
      assert.equal(warmed.status, 200);
      assert.ok((await warmed.json()).dates.length > 0);
    }
    const fourthMonth = new Date(month + "-01T00:00:00Z");
    fourthMonth.setUTCMonth(fourthMonth.getUTCMonth() + 3);
    const rejected = await m.mf.dispatchFetch(
      m.origin + "/api/calendar/" + fourthMonth.toISOString().slice(0, 7),
    );
    assert.equal(rejected.status, 400);
    assert.deepEqual(await rejected.json(), {
      error: "calendar_month_invalid",
    });
    assert.equal(calendar.displayExpiresAtMs, calendar.observedAtMs + 1800000);
    const catalogue = await m.mf.dispatchFetch(m.origin + "/api/catalogue");
    assert.equal(catalogue.status, 200);
    assert.equal(
      m.calls.length,
      before,
      "cron warmed data before any customer visit",
    );
    await (await m.mf.getWorker()).scheduled();
    assert.equal(
      m.calls.length,
      before,
      "minute cron cannot repeat the fifteen-minute warm-up",
    );
    // Retain the booking's month even if the fixture crosses a month boundary.
    await m.mf.dispatchFetch(m.origin + "/api/calendar/" + m.date.slice(0, 7));
    const c = await customer(m);
    const response = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${c.input.key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).paymentAvailable, true);
    const readsAfterCheckout = m.calls.filter(
      (call) => call.body?.method === "getAvailableTimeIntervals",
    ).length;
    const context = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/checkout`,
      { headers: c.headers },
    );
    assert.equal(
      context.status,
      200,
      "checkout context remains available after the cached calendar is updated",
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(
      m.calls.filter(
        (call) =>
          call.url.endsWith("/v1/payment-requests") && call.method === "POST",
      ).length,
      1,
    );
    const updated = await m.mf.dispatchFetch(
      m.origin + "/api/calendar/" + m.date.slice(0, 7),
    );
    const updatedCalendar = await updated.json();
    assert.equal(updated.status, 200);
    assert.equal(
      updatedCalendar.dates
        .flatMap((day) => day.offers ?? [])
        .some((offer) => offer.startMs === m.startMs),
      false,
    );
    assert.equal(
      m.calls.filter(
        (call) => call.body?.method === "getAvailableTimeIntervals",
      ).length,
      readsAfterCheckout,
      "another calendar visit serves the edited snapshot without rebuilding the month",
    );
    assert.equal(updatedCalendar.observedAtMs, calendar.observedAtMs);
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("warming reuses fresh customer range reads while prebuilding the other two months", async () => {
  const m = await createBookingMechanism({ displayWarming: true });
  try {
    const month = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    const url = m.origin + "/api/calendar/" + month;
    const initial = await m.mf.dispatchFetch(url);
    assert.equal(initial.status, 200);
    const calendar = await initial.json();
    const before = m.calls.length;
    await (await m.mf.getWorker()).scheduled();
    const ranges = m.calls
      .slice(before)
      .filter((call) => call.body?.method === "getAvailableTimeIntervals");
    assert.ok(ranges.length > 0, "future months are actually populated");
    assert.ok(
      ranges.every((call) => !call.body.params[0].startsWith(month)),
      "the still-fresh current month is not fetched again",
    );
    assert.deepEqual(await (await m.mf.dispatchFetch(url)).json(), calendar);
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("cold calendar failure preserves diagnostics and recovers without waiting for warming", async () => {
  let fail = true;
  const logs = [];
  const m = await createBookingMechanism({
    displayWarming: true,
    onLog: (message) => logs.push(message),
    respond: async (call) => {
      if (fail && call.body?.method === "getAvailableTimeIntervals")
        return Response.json({ jsonrpc: "2.0", id: call.body.id, result: {} });
    },
  });
  try {
    await (await m.mf.getWorker()).scheduled();
    const month = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    const url = m.origin + "/api/calendar/" + month;
    const failed = await m.mf.dispatchFetch(url);
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { error: "calendar_date_unknown" });
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    const retained = await storage.exec(
      "SELECT key FROM display_snapshots WHERE key LIKE 'calendar:%'",
    );
    assert.equal(
      retained.length,
      0,
      "a failed build must not publish a partial month",
    );
    const diagnostics = logs.flatMap((message) => {
      try {
        return [JSON.parse(message)];
      } catch {
        return [];
      }
    });
    for (const trigger of ["customer", "warming"])
      assert.ok(
        diagnostics.some(
          (entry) =>
            entry.event === "calendar_cache_trace" &&
            entry.phase === "build_failed" &&
            entry.trigger === trigger &&
            entry.code === "calendar_date_unknown",
        ),
        trigger,
      );
    fail = false;
    const recovered = await m.mf.dispatchFetch(url);
    assert.equal(recovered.status, 200);
    const calendar = await recovered.json();
    assert.ok(calendar.dates.length > 0);
    assert.equal(
      recovered.headers.get("X-Calendar-Observed-At"),
      String(calendar.observedAtMs),
    );
    assert.equal(
      recovered.headers.get("X-Calendar-Expires-At"),
      String(calendar.displayExpiresAtMs),
    );
    assert.equal(calendar.displayExpiresAtMs, calendar.observedAtMs + 1800000);
    const before = m.calls.length;
    assert.deepEqual(await (await m.mf.dispatchFetch(url)).json(), calendar);
    assert.equal(
      m.calls.length,
      before,
      "recovered calendar is persisted and reused",
    );
    const events = logs
      .flatMap((message) => {
        try {
          return [JSON.parse(message)];
        } catch {
          return [];
        }
      })
      .filter((entry) => entry.event === "calendar_cache_trace");
    const served = events.find(
      (entry) =>
        entry.phase === "serve" &&
        entry.correlationId === recovered.headers.get("X-Request-ID"),
    );
    assert.equal(served.observedAtMs, calendar.observedAtMs);
    assert.equal(served.persisted, true);
    assert.equal(served.dateCount, calendar.dates.length);
    assert.ok(events.some((entry) => entry.phase === "hit"));
    assert.ok(
      events.some((entry) => entry.phase === "build_saved" && entry.persisted),
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("explicitly unavailable calendar days are cached and expired snapshots rebuild", async () => {
  let closed = true;
  const m = await createBookingMechanism({
    displayWarming: true,
    respond: async (call) => {
      if (!closed || call.body?.method !== "getAvailableTimeIntervals") return;
      const [from, to, , instructor] = call.body.params;
      const result = {};
      for (
        let cursor = Date.parse(from + "T00:00:00Z");
        cursor <= Date.parse(to + "T00:00:00Z");
        cursor += 86400000
      )
        result[new Date(cursor).toISOString().slice(0, 10)] = {
          [String(instructor)]: [],
        };
      return Response.json({ jsonrpc: "2.0", id: call.body.id, result });
    },
  });
  try {
    const url = m.origin + "/api/calendar/" + m.date.slice(0, 7);
    const response = await m.mf.dispatchFetch(url);
    assert.equal(response.status, 200);
    const empty = await response.json();
    assert.ok(empty.dates.length > 0);
    assert.ok(
      empty.dates.every((day) => !day.available && day.offers.length === 0),
    );
    const before = m.calls.length;
    assert.deepEqual(await (await m.mf.dispatchFetch(url)).json(), empty);
    assert.equal(
      m.calls.length,
      before,
      "zero offers is a valid complete cached month",
    );
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await storage.exec("UPDATE display_snapshots SET expires_ms=0");
    // A new isolate clears only the short in-memory reads, preserving expired SQL evidence.
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    closed = false;
    const rebuilt = await m.mf.dispatchFetch(url);
    assert.equal(rebuilt.status, 200);
    const restored = await rebuilt.json();
    assert.ok(
      restored.dates.some((day) =>
        day.offers.some((offer) => offer.startMs === m.startMs),
      ),
    );
    assert.ok(m.calls.length > before);
    const after = m.calls.length;
    assert.deepEqual(await (await m.mf.dispatchFetch(url)).json(), restored);
    assert.equal(m.calls.length, after);
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("failed scheduled display refresh retains a bounded snapshot without renewing its expiry", async () => {
  let fail = false;
  const m = await createBookingMechanism({
    displayWarming: true,
    respond: async (call) => {
      if (fail && call.body?.method === "getAvailableTimeIntervals")
        return new Response("synthetic unavailable", { status: 503 });
    },
  });
  try {
    await (await m.mf.getWorker()).scheduled();
    const month = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    const url = m.origin + "/api/calendar/" + month;
    const original = await (await m.mf.dispatchFetch(url)).json();
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await storage.exec("UPDATE display_warm_month SET started_ms=0");
    fail = true;
    // Eviction removes the short-lived read cache while preserving the snapshot.
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await (await m.mf.getWorker()).scheduled();
    const before = m.calls.length;
    assert.deepEqual(await (await m.mf.dispatchFetch(url)).json(), original);
    assert.equal(
      m.calls.length,
      before,
      "failed refresh leaves valid persisted display available",
    );
    await (await m.mf.getWorker()).scheduled();
    assert.equal(
      m.calls.length,
      before,
      "failed refresh is not replayed every minute",
    );
    await storage.exec("UPDATE display_snapshots SET expires_ms=0");
    const expired = await m.mf.dispatchFetch(url);
    assert.equal(
      expired.status,
      503,
      "expired display cannot silently replace failed provider evidence",
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
  } finally {
    await m.close();
  }
});

test("checkout returns its durable URL while comments are blocked and annotation failure never repeats effects", async () => {
  const gate = Promise.withResolvers();
  const started = Promise.withResolvers();
  const m = await createBookingMechanism({
    respond: async (call) => {
      if (call.url.endsWith("/comment")) {
        started.resolve();
        await gate.promise;
        return new Response(null, { status: 503 });
      }
    },
  });
  try {
    const c = await customer(m);
    const send = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const response = await send();
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(
      m.calls.filter((call) => call.url.endsWith("/comment")).length,
      0,
    );
    assert.equal(
      m.calls.filter((call) => call.url.endsWith("/admin/auth")).length,
      0,
    );
    const webhook = await m.completePayment();
    await webhook.text();
    assert.equal(webhook.status, 202);
    const recovering = m.recover();
    await started.promise;
    assert.equal(result.checkout.url, m.checkoutUrl);
    const saved = await m.db
      .prepare(
        "SELECT checkout_url,request_id,expires_ms FROM hitpay_payments WHERE attempt_id=?",
      )
      .bind(c.input.key)
      .first();
    assert.equal(saved.checkout_url, result.checkout.url);
    assert.ok(result.checkout.url.includes(saved.request_id));
    assert.ok(result.checkout.expiresAtMs <= saved.expires_ms);
    const effects = await m.db
      .prepare(
        "SELECT step,outcome,reference_id FROM session_effects WHERE attempt_id=? AND step LIKE 'native-comment%' ORDER BY step",
      )
      .bind(c.input.key)
      .all();
    assert.deepEqual(
      effects.results.map(({ step, outcome }) => ({ step, outcome })),
      [
        { step: "native-comment:0", outcome: "unknown" },
        { step: "native-comments-pending", outcome: "observed" },
      ],
    );
    assert.equal(
      m.calls.filter((c) => c.body?.method === "getBookingDetails").length,
      1,
    );
    assert.equal(
      m.calls.filter(
        (c) => c.url.endsWith("/admin/invoices/901") && c.method === "GET",
      ).length,
      1,
    );
    assert.ok(
      m.calls.findIndex((c) => isHitPayApiCall(c) && c.method === "POST") <
        m.calls.findIndex((c) => c.url.endsWith("/comment")),
    );
    gate.resolve();
    await recovering;
    assert.equal((await send()).status, 200);
    await m.recover();
    await m.recover();
    assert.equal(m.calls.filter((c) => c.url.endsWith("/comment")).length, 1);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    assert.equal(
      (
        await m.db
          .prepare(
            "SELECT outcome FROM session_effects WHERE attempt_id=? AND step='native-comment:0'",
          )
          .bind(c.input.key)
          .first()
      ).outcome,
      "unknown",
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    gate.resolve();
    await m.close();
  }
});

test("checkout never exposes a HitPay URL when its durable save loses the creation fence", async () => {
  let m;
  m = await createBookingMechanism({
    respond: async (call) => {
      if (isHitPayApiCall(call) && call.method === "POST")
        await m.db
          .prepare("UPDATE hitpay_payments SET generation=generation+1")
          .run();
    },
  });
  try {
    const c = await customer(m);
    const send = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const response = await send();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      attemptId: c.input.key,
      state: "recovery_required",
      paymentAvailable: false,
    });
    const saved = await m.db
      .prepare(
        "SELECT request_id,checkout_url FROM hitpay_payments WHERE attempt_id=?",
      )
      .bind(c.input.key)
      .first();
    assert.deepEqual(saved, { request_id: null, checkout_url: null });
    await send();
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
  } finally {
    await m.close();
  }
});

test("public display reads use one free provider slot without releasing retained unknown admissions", async () => {
  const m = await createBookingMechanism({ displayWarming: true });
  try {
    const url = m.origin + "/api/catalogue";
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await storage.exec("DELETE FROM display_snapshots");
    await storage.exec(
      "INSERT INTO admissions(id,campaign,started_ms) VALUES('retained-unknown','developer-20261008',0)",
    );
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    const before = m.calls.length;
    const catalogue = await m.mf.dispatchFetch(url);
    assert.equal(catalogue.status, 200, await catalogue.text());
    const fresh = m.calls.slice(before);
    assert.equal(
      fresh.filter((call) => call.body?.method === "getEventList").length,
      1,
    );
    assert.equal(
      fresh.filter((call) => call.body?.method === "getUnitList").length,
      1,
    );
    const current = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.deepEqual(
      await current.exec("SELECT id FROM admissions WHERE finished=0"),
      [{ id: "retained-unknown" }],
    );
    await current.exec(
      "INSERT INTO admissions(id,campaign,started_ms) VALUES('second-unknown','developer-20261008',0)",
    );
    const cachedCount = m.calls.length;
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    assert.equal(
      m.calls.length,
      cachedCount,
      "valid display snapshot bypasses occupied provider slots",
    );
    for (const customers of [1, 3, 5, 10]) {
      const responses = await Promise.all(
        Array.from({ length: customers }, () => m.mf.dispatchFetch(url)),
      );
      assert.ok(responses.every((response) => response.status === 200));
      assert.equal(
        m.calls.length,
        cachedCount,
        "concurrent cached browsing never consumes provider slots",
      );
    }
    await current.exec("DELETE FROM display_snapshots");
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.equal((await m.mf.dispatchFetch(url)).status, 503);
    assert.equal(
      m.calls.length,
      cachedCount,
      "two unknown reservations still block new dispatch",
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("interrupted read admissions recover after restart while unknown writes and live reads stay fenced", async () => {
  const m = await createBookingMechanism({ displayWarming: true });
  try {
    const url = m.origin + "/api/catalogue";
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    const reads = await storage.exec(
      "SELECT operation,instance_id FROM provider_request_admissions",
    );
    assert.ok(reads.some((r) => r.operation === "public-auth"));
    assert.ok(reads.some((r) => r.operation === "catalogue-services"));
    const instance = reads[0].instance_id;
    await storage.exec(
      "INSERT INTO admissions(id,campaign,started_ms) VALUES('interrupted-read','developer-20261008',0),('unknown-write','developer-20261008',0)",
    );
    await storage.exec(
      "INSERT INTO provider_request_admissions(id,operation,read_only,instance_id,expires_ms) VALUES('interrupted-read','catalogue-services',1,?,0)",
      instance,
    );
    const before = m.calls.length;
    // A current-instance operation is never reclaimed just because its lease
    // elapsed. An uncached calendar forces admission without replacing the DO.
    const month = m.date.slice(0, 7);
    assert.equal(
      (await m.mf.dispatchFetch(m.origin + "/api/calendar/" + month)).status,
      503,
    );
    assert.equal(m.calls.length, before);
    await storage.exec("DELETE FROM display_snapshots");
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    const restarted = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.deepEqual(
      await restarted.exec("SELECT id FROM admissions WHERE finished=0"),
      [{ id: "unknown-write" }],
    );
    assert.deepEqual(
      await restarted.exec(
        "SELECT reason,evidence FROM admission_releases WHERE id='interrupted-read'",
      ),
      [{ reason: "read_transport_ended", evidence: "catalogue-services" }],
    );
    const used = await restarted.exec("SELECT used FROM budget");
    assert.ok(
      used[0].used >= m.calls.length,
      "recovery never refunds request budget",
    );
    await restarted.exec(
      "INSERT INTO admissions(id,campaign,started_ms) VALUES('recent-read','developer-20261008',0)",
    );
    await restarted.exec(
      "INSERT INTO provider_request_admissions(id,operation,read_only,instance_id,expires_ms) VALUES('recent-read','catalogue-services',1,?,?)",
      instance,
      Date.now() + 60000,
    );
    await restarted.exec("DELETE FROM display_snapshots");
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    const count = m.calls.length;
    assert.equal((await m.mf.dispatchFetch(url)).status, 503);
    assert.equal(
      m.calls.length,
      count,
      "unexpired read plus unknown write still occupy both slots",
    );
  } finally {
    await m.close();
  }
});

test("expired identified write transports free capacity after reset without authorizing another effect", async () => {
  const m = await createBookingMechanism({ displayWarming: true });
  try {
    const url = m.origin + "/api/catalogue";
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await storage.exec(
      "INSERT INTO admissions(id,campaign,started_ms) VALUES('ended-book','developer-20261008',0),('ended-payment','developer-20261008',0)",
    );
    await storage.exec(
      "INSERT INTO provider_request_admissions(id,operation,read_only,instance_id,expires_ms) VALUES('ended-book','book',0,'ended-instance',0),('ended-payment','invoice-external-payment',0,'ended-instance',0)",
    );
    await storage.exec("DELETE FROM display_snapshots");
    const before = m.calls.length;
    await m.mf.unsafeEvictDurableObject(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.equal((await m.mf.dispatchFetch(url)).status, 200);
    const current = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    assert.deepEqual(
      await current.exec(
        "SELECT operation,read_only,reason FROM provider_transport_releases ORDER BY operation",
      ),
      [
        { operation: "book", read_only: 0, reason: "instance_ended" },
        {
          operation: "invoice-external-payment",
          read_only: 0,
          reason: "instance_ended",
        },
      ],
    );
    assert.deepEqual(
      await current.exec("SELECT id FROM admissions WHERE finished=0"),
      [],
    );
    assert.equal(
      m.calls
        .slice(before)
        .filter((c) => c.body?.method === "book" || c.url.includes("payment"))
        .length,
      0,
      "capacity recovery cannot replay writes",
    );
    assert.deepEqual(
      await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first(),
      { n: 0 },
      "capacity recovery never invents or confirms an attempt",
    );
  } finally {
    await m.close();
  }
});

test("failed identity warming proves checkout never started and permits a fresh explicit attempt", async () => {
  let denied = true;
  const m = await createBookingMechanism({
    displayWarming: true,
    respond: async (call) =>
      denied && call.body?.method === "getToken"
        ? new Response(null, { status: 403 })
        : undefined,
  });
  try {
    const c = await customer(m);
    const send = (key) =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, key, accepted: true }),
      });
    const failed = await send(c.input.key);
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).error, "checkout_not_started");
    for (const table of [
      "dispatches",
      "session_effects",
      "hitpay_payments",
      "hitpay_holds",
    ])
      assert.equal(
        (await m.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n,
        0,
        table,
      );
    assert.equal(
      (
        await (
          await m.mf.dispatchFetch(m.origin + "/api/booking/current", {
            headers: c.headers,
          })
        ).json()
      ).state,
      "empty",
    );
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 0);
    // Simulate the existing cooldown/refresh lease elapsing, not a retry bypass.
    const storage = await m.mf.unsafeGetDurableObjectStorage(
      "booking-mechanism",
      "SoccerBotAccountCoordinator",
      { name: "simplybook-developer-account" },
    );
    await storage.exec("UPDATE budget SET cooldown_ms=0");
    await storage.exec("UPDATE refreshes SET expires_ms=0");
    denied = false;
    const next = crypto.randomUUID();
    const response = await send(next);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).paymentAvailable, true);
    assert.equal(
      (
        await m.db
          .prepare(
            "SELECT COUNT(*) AS n FROM rejected_native_checkout_grants WHERE attempt_id=?",
          )
          .bind(c.input.key)
          .first()
      ).n,
      1,
    );
    await send(next);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
  } finally {
    await m.close();
  }
});

test("direct single checkout uses only public authentication and creation before HitPay with bounded D1 work", async () => {
  for (const warm of [false, true]) {
    const logs = [];
    let before = 0;
    const beforePayment = [];
    const m = await createBookingMechanism({
      onLog: (message) => logs.push(message),
      respond: async (call) => {
        if (isHitPayApiCall(call) && call.method === "POST")
          beforePayment.push(...m.calls.slice(before));
        return undefined;
      },
    });
    try {
      if (warm) {
        const response = await m.mf.dispatchFetch(m.origin + "/api/catalogue");
        assert.equal(response.status, 200);
        logs.length = 0;
      }
      before = m.calls.length;
      const c = await customer(m);
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        },
      );
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.paymentAvailable, true);
      assert.equal(result.checkout.url, m.checkoutUrl);
      const current = await checkoutResult(
        m.mf.dispatchFetch(m.origin + "/api/booking/current", {
          headers: c.headers,
        }),
        200,
      );
      assert.equal(
        current.sessions[0].serviceName,
        warm ? "Native Session" : "Your session",
      );
      assert.equal(
        current.sessions[0].instructorName,
        warm ? "Native Trainer" : "Details unavailable",
      );
      const markers = await m.db
        .prepare(
          "SELECT step,outcome FROM session_effects WHERE attempt_id=? AND step IN ('finalize','native-comments-pending') ORDER BY step",
        )
        .bind(c.input.key)
        .all();
      assert.deepEqual(markers.results, [
        { step: "finalize", outcome: "observed" },
        { step: "native-comments-pending", outcome: "observed" },
      ]);

      assert.deepEqual(
        beforePayment
          .filter((c) => c.url.includes("simplybook.me"))
          .map((c) => c.body?.method),
        warm ? ["book"] : ["getToken", "book"],
      );
      const traces = logs.flatMap((message) => {
        try {
          return [JSON.parse(message)];
        } catch {
          return [];
        }
      });
      const checkout = traces.find(
        (entry) =>
          entry.event === "foundation_trace" &&
          entry.boundary === "coordinator",
      );
      assert.ok(checkout, "checkout diagnostics retained");
      const phaseTrace = traces.find(
        (entry) =>
          entry.event === "checkout_trace" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.ok(phaseTrace, "correlated checkout phase trace retained");
      const transports = traces.filter(
        (entry) =>
          entry.event === "provider_transport_timing" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.deepEqual(
        transports.map((entry) => entry.operation),
        warm
          ? ["simplybook", "hitpay_create"]
          : ["public_auth", "simplybook", "hitpay_create"],
      );
      for (const entry of transports) {
        assert.equal(entry.outcome, "ok");
        assert.ok(entry.headersMs >= 0 && entry.bodyMs >= 0);
        assert.equal(entry.durationMs, entry.headersMs + entry.bodyMs);
        assert.doesNotMatch(
          JSON.stringify(entry),
          /synthetic-public-token|checkout\.hit-pay|synthetic@example/,
        );
      }

      assert.equal(phaseTrace.tokenCached, warm);
      assert.equal(phaseTrace.phases.simplybook.calls, 1);
      assert.equal(phaseTrace.phases.hitpay.calls, 1);
      assert.equal(phaseTrace.phases.verification.calls, 0);
      assert.equal(
        Object.values(phaseTrace.phases).reduce(
          (sum, phase) => sum + phase.d1Count,
          0,
        ),
        checkout.spans.d1.count,
      );
      const timing = response.headers.get("server-timing");
      assert.match(timing, /simplybook;dur=[0-9.]+;desc="1 calls"/);
      assert.match(timing, /hitpay;dur=[0-9.]+;desc="1 calls"/);
      assert.match(timing, /checkout_http;dur=[0-9.]+/);
      assert.match(
        timing,
        new RegExp(
          `sb_token;dur=[0-9.]+;desc="${warm ? "cached" : "cache_miss"}"`,
        ),
      );
      for (const phase of Object.values(phaseTrace.phases)) {
        assert.deepEqual(Object.keys(phase).sort(), [
          "calls",
          "d1Count",
          "d1DurationMs",
          "d1Errors",
          "durationMs",
        ]);
        for (const value of Object.values(phase))
          assert.ok(Number.isFinite(value) && value >= 0);
      }
      assert.equal(result.serverTiming, undefined);
      assert.ok(!timing.includes(c.input.key));
      assert.ok(!JSON.stringify(phaseTrace).includes(m.checkoutUrl));

      const http = traces.find(
        (entry) =>
          entry.event === "foundation_trace" &&
          entry.boundary === "http" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.ok(http, "outer binding read is measured");
      assert.equal(http.spans.d1.count, 1);
      // Two extra executions resolve trusted identity and evaluate expiry admission.
      assert.equal(checkout.spans.d1.count, 6);
      assert.equal(checkout.spans.d1.count + http.spans.d1.count, 7);
      console.log(`single checkout D1 executions: ${checkout.spans.d1.count}`);
      const payment = await m.db
        .prepare(
          "SELECT request_id,checkout_url FROM hitpay_payments WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .first();
      assert.ok(payment.request_id);
      assert.equal(payment.checkout_url, result.checkout.url);
      await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        },
      );
      assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
      assert.equal(
        m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
        1,
      );
    } finally {
      await m.close();
    }
  }
});

test("direct single completion retains payment but denies handoff after access revocation", async () => {
  const m = await createBookingMechanism({
    respond: async (call) => {
      if (isHitPayApiCall(call) && call.method === "POST")
        await m.db
          .prepare("UPDATE guest_access SET revoked_ms=?")
          .bind(Date.now())
          .run();
      return undefined;
    },
  });
  try {
    const c = await customer(m);
    const response = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${c.input.key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal(response.status, 401);
    const payment = await m.db
      .prepare(
        "SELECT request_id,checkout_url FROM hitpay_payments WHERE attempt_id=?",
      )
      .bind(c.input.key)
      .first();
    assert.ok(payment.request_id);
    assert.equal(payment.checkout_url, m.checkoutUrl);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
  } finally {
    await m.close();
  }
});

test("checkout failure timing survives token booking and payment failures without exposing request data", async () => {
  for (const fault of ["token", "booking", "payment"]) {
    const logs = [];
    const m = await createBookingMechanism({
      onLog: (message) => logs.push(message),
      respond: async (call) => {
        if (
          (fault === "token" && call.body?.method === "getToken") ||
          (fault === "booking" && call.body?.method === "book") ||
          (fault === "payment" &&
            isHitPayApiCall(call) &&
            call.method === "POST")
        )
          return new Response(null, { status: 503 });
        return undefined;
      },
    });
    try {
      const c = await customer(m);
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        },
      );
      assert.equal(response.status, fault === "token" ? 503 : 200);
      const result = await response.json();
      assert.notEqual(result.paymentAvailable, true);
      const timing = response.headers.get("server-timing");
      assert.match(timing, /checkout;dur=[0-9.]+/);
      assert.ok(!timing.includes(c.input.key));
      const traces = logs.flatMap((message) => {
        try {
          return [JSON.parse(message)];
        } catch {
          return [];
        }
      });
      const trace = traces.find(
        (entry) =>
          entry.event === "checkout_trace" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.ok(trace);
      assert.equal(trace.phases.simplybook.calls, fault === "token" ? 0 : 1);
      assert.equal(trace.phases.hitpay.calls, fault === "payment" ? 1 : 0);
      assert.equal(trace.tokenCached, false);
      assert.ok(!JSON.stringify(trace).includes(c.input.key));
      assert.ok(!JSON.stringify(trace).includes(m.checkoutUrl));
      assert.equal(result.serverTiming, undefined);
    } finally {
      await m.close();
    }
  }
});

test("direct batch checkout uses creation responses for two four and five sessions with one payment and bounded admission work", async () => {
  for (const [count, warm] of [
    [2, false],
    [2, true],
    [4, false],
    [4, true],
    [5, false],
    [5, true],
  ]) {
    const logs = [];
    let before = 0;
    let creationCalls = [];
    const m = await createBookingMechanism({
      batch: true,
      batchSize: count,
      onLog: (message) => logs.push(message),
      respond: async (call) => {
        if (isHitPayApiCall(call) && call.method === "POST")
          creationCalls = m.calls.slice(before);
        return undefined;
      },
    });
    try {
      if (warm) {
        assert.equal(
          (await m.mf.dispatchFetch(m.origin + "/api/catalogue")).status,
          200,
        );
        await m.mf.unsafeEvictDurableObject(
          "booking-mechanism",
          "SoccerBotAccountCoordinator",
          { name: "simplybook-developer-account" },
        );
        logs.length = 0;
      }
      before = m.calls.length;
      const c = await customer(m);
      c.input.sessions = Array.from({ length: count }, (_, index) => ({
        ...c.input.sessions[0],
        startMs: m.startMs + index * 3000000,
      }));
      const send = () =>
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        });
      const response = await send();
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.paymentAvailable, true);
      assert.equal(result.checkout.url, m.checkoutUrl);
      const traces = logs.flatMap((message) => {
        try {
          return [JSON.parse(message)];
        } catch {
          return [];
        }
      });
      const trace = traces.find(
        (entry) =>
          entry.event === "foundation_trace" &&
          entry.boundary === "coordinator",
      );
      assert.ok(trace);
      const phaseTrace = traces.find(
        (entry) =>
          entry.event === "checkout_trace" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.ok(phaseTrace);
      assert.equal(phaseTrace.tokenCached, warm);
      assert.equal(phaseTrace.phases.simplybook.calls, count + 2);
      assert.equal(phaseTrace.phases.hitpay.calls, 1);
      assert.equal(phaseTrace.phases.verification.calls, 0);
      assert.equal(
        Object.values(phaseTrace.phases).reduce(
          (sum, phase) => sum + phase.d1Count,
          0,
        ),
        trace.spans.d1.count,
      );
      assert.match(
        response.headers.get("server-timing"),
        new RegExp(`simplybook;dur=[0-9.]+;desc="${count + 2} calls"`),
      );
      assert.equal(result.serverTiming, undefined);
      assert.ok(!JSON.stringify(phaseTrace).includes(m.checkoutUrl));

      console.log(
        `batch ${count}: D1=${trace.spans.d1.count}; provider=${trace.spans.provider?.count}`,
      );
      assert.ok(
        trace.spans.d1.count === 12 + (count - 2) * 2,
        `D1: ${trace.spans.d1.count}`,
      );
      const methods = creationCalls
        .filter((call) => call.url.includes("simplybook.me"))
        .map((call) => call.body?.method)
        .filter(Boolean);
      console.log(`batch ${count}: methods=${methods.join(",")}`);
      assert.deepEqual(methods, [
        ...(warm ? [] : ["getToken"]),
        "createBatch",
        ...Array(count).fill("book"),
        "closeBatch",
      ]);
      assert.equal(
        creationCalls.filter((call) => call.url.includes("simplybook.me"))
          .length,
        methods.length,
        "no admin/provider preflight calls",
      );
      const association = await m.db
        .prepare("SELECT association_json FROM attempts WHERE id=?")
        .bind(c.input.key)
        .first();
      assert.equal(
        JSON.parse(association.association_json).bookingIds.length,
        count,
      );
      await send();
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        count,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "createBatch").length,
        1,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "closeBatch").length,
        1,
      );
      assert.equal(
        m.calls.filter(
          (call) => isHitPayApiCall(call) && call.method === "POST",
        ).length,
        1,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("direct batch rejection lost response and invalid invoice retain original effects without payment or replay", async () => {
  for (const count of [2, 4])
    for (const fault of ["rejected", "lost", "invoice", "close-lost"]) {
      let dispatched = 0;
      const m = await createBookingMechanism({
        batch: true,
        batchSize: count,
        creationPriceDrift: fault === "invoice",
        respond: async (call) => {
          if (call.body?.method === "book" && ++dispatched === count) {
            if (fault === "lost") return new Response(null, { status: 503 });
            if (fault === "rejected")
              return Response.json({
                jsonrpc: "2.0",
                id: call.body.id,
                error: {
                  code: -32000,
                  message: "Synthetic creation rejection",
                },
              });
          }
          if (fault === "close-lost" && call.body?.method === "closeBatch")
            return new Response(null, { status: 503 });
          return undefined;
        },
      });
      try {
        const c = await customer(m);
        c.input.sessions = Array.from({ length: count }, (_, index) => ({
          ...c.input.sessions[0],
          startMs: m.startMs + index * 3000000,
        }));
        const send = () =>
          m.mf.dispatchFetch(
            m.origin + `/api/booking/checkout/${c.input.key}`,
            {
              method: "POST",
              headers: c.headers,
              body: JSON.stringify({ ...c.input, accepted: true }),
            },
          );
        const response = await send();
        assert.equal(response.status, 200);
        const result = await response.json();
        assert.equal(result.paymentAvailable, false);
        assert.equal(result.state, "recovery_required");
        const effects = await m.db
          .prepare(
            "SELECT step,outcome,reference_id FROM session_effects WHERE attempt_id=? AND step LIKE 'session:%' ORDER BY step",
          )
          .bind(c.input.key)
          .all();
        assert.deepEqual(
          effects.results,
          Array.from({ length: count }, (_, index) => ({
            step: `session:${index}`,
            outcome:
              index === count - 1 && ["rejected", "lost"].includes(fault)
                ? "unknown"
                : "observed",
            reference_id:
              index === count - 1 && ["rejected", "lost"].includes(fault)
                ? null
                : String(701 + index),
          })),
        );
        assert.equal(
          m.calls.filter((call) => call.body?.method === "closeBatch").length,
          ["invoice", "close-lost"].includes(fault) ? 1 : 0,
        );
        const restored = await m.mf.dispatchFetch(
          m.origin + "/api/booking/current",
          { headers: c.headers },
        );
        assert.equal((await restored.json()).attemptId, c.input.key);
        await send();
        assert.equal(dispatched, count);
        assert.equal(
          m.calls.filter(
            (call) => isHitPayApiCall(call) && call.method === "POST",
          ).length,
          0,
        );
        assert.equal(
          (
            await m.db
              .prepare("SELECT COUNT(*) AS n FROM hitpay_payments")
              .first()
          ).n,
          0,
        );
      } finally {
        await m.close();
      }
    }
});

test("consolidated single checkout guards failed transactions and retained references across restart", async () => {
  for (const fault of [
    "revoked-token",
    "revoked-book",
    "conflicting-reference",
    "lost-fence",
    "hold-commit",
    "payment-reserve",
    "payment-save",
    "lost-book",
    "invalid-invoice",
  ]) {
    const m = await createBookingMechanism({
      creationPriceDrift: fault === "invalid-invoice",
      respond: async (call) => {
        if (
          (fault === "revoked-token" && call.body?.method === "getToken") ||
          (fault === "revoked-book" && call.body?.method === "book")
        )
          await m.db
            .prepare("UPDATE guest_access SET revoked_ms=?")
            .bind(Date.now())
            .run();
        if (call.body?.method === "book") {
          if (fault === "conflicting-reference")
            await m.db
              .prepare(
                "UPDATE session_effects SET outcome='observed',reference_id='conflicting-reference' WHERE step='session:0'",
              )
              .run();
          if (fault === "lost-fence")
            await m.db.prepare("UPDATE attempts SET version=version+1").run();
          if (fault === "lost-book") return new Response(null, { status: 503 });
        }
        return undefined;
      },
    });
    try {
      if (fault === "hold-commit")
        await m.db.exec(
          "CREATE TRIGGER reject_hold BEFORE INSERT ON hitpay_holds BEGIN SELECT RAISE(ABORT,'synthetic_hold_failure'); END",
        );
      if (fault === "payment-reserve")
        await m.db.exec(
          "CREATE TRIGGER reject_payment BEFORE INSERT ON hitpay_payments BEGIN SELECT RAISE(ABORT,'synthetic_payment_failure'); END",
        );
      if (fault === "payment-save")
        await m.db.exec(
          "CREATE TRIGGER reject_payment_save BEFORE UPDATE OF request_id ON hitpay_payments BEGIN SELECT RAISE(ABORT,'synthetic_save_failure'); END",
        );
      const c = await customer(m);
      const send = () =>
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        });
      const response = await send();
      const body = await response.json();
      assert.equal(body.checkout, undefined, fault);
      assert.notEqual(body.paymentAvailable, true, fault);
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        fault === "revoked-token" ? 0 : 1,
        fault,
      );
      const payments = m.calls.filter(
        (call) => isHitPayApiCall(call) && call.method === "POST",
      ).length;
      assert.equal(payments, fault === "payment-save" ? 1 : 0, fault);
      const attempt = await m.db
        .prepare("SELECT association_json FROM attempts WHERE id=?")
        .bind(c.input.key)
        .first();
      if (!["payment-reserve", "payment-save"].includes(fault))
        assert.equal(attempt.association_json, null, fault);
      const payment = await m.db
        .prepare(
          "SELECT request_id,checkout_url FROM hitpay_payments WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .first();
      assert.deepEqual(
        payment,
        fault === "payment-save"
          ? { request_id: null, checkout_url: null }
          : null,
        fault,
      );
      if (!["revoked-token", "lost-book"].includes(fault)) {
        const evidence = await m.db
          .prepare(
            "SELECT result_json FROM native_checkout_grants WHERE attempt_id=?",
          )
          .bind(c.input.key)
          .first();
        assert.ok(JSON.parse(evidence.result_json).holdEvidence?.length, fault);
      }
      // Drain the queued annotation before terminating this fixture instance.
      // Eviction is a restart boundary, not cancellation of an active RPC.
      const drained = await m.mf.dispatchFetch(
        m.origin + `/__fixture/drain-annotations?attempt=${c.input.key}`,
      );
      assert.equal(drained.status, 204, fault);
      await m.mf.unsafeEvictDurableObject(
        "booking-mechanism",
        "SoccerBotAccountCoordinator",
        { name: "simplybook-developer-account" },
      );
      await send().catch((error) => {
        throw new Error(`restart ${fault}: ${String(error.cause ?? error)}`, {
          cause: error,
        });
      });
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        fault === "revoked-token" ? 0 : 1,
        fault,
      );
      assert.equal(
        m.calls.filter(
          (call) => isHitPayApiCall(call) && call.method === "POST",
        ).length,
        payments,
        fault,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("protected confirmation traces correlate context status and denied receipt without leaking payment data", async () => {
  const logs = [];
  const m = await createBookingMechanism({
    onLog: (message) => {
      try {
        logs.push(JSON.parse(message));
      } catch {
        /* structured traces only */
      }
    },
  });
  try {
    const c = await customer(m);
    const checkout = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${c.input.key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal(checkout.status, 200);
    let key;
    for (const [route, boundary, status] of [
      ["checkout", "context", 200],
      ["confirmation", "status", 200],
      ["receipt", "receipt", 409],
    ]) {
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/attempts/${c.input.key}/${route}`,
        { headers: c.headers },
      );
      assert.equal(response.status, status);
      const currentKey = response.headers.get("x-recovery-trace");
      assert.match(currentKey, /^[a-f0-9]{64}$/);
      key ??= currentKey;
      assert.equal(currentKey, key);
      const timing = response.headers.get("server-timing");
      assert.match(timing, new RegExp(`confirmation_${boundary};dur=[0-9.]+`));
      assert.match(
        timing,
        /confirmation_d1;dur=[0-9.]+;desc="[1-9][0-9]* calls"/,
      );
      assert.match(timing, /confirmation_http;dur=[0-9.]+/);
      const trace = logs.find(
        (entry) =>
          entry.event === "confirmation_trace" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.ok(trace);
      assert.equal(trace.boundary, boundary);
      assert.equal(trace.recoveryKey, key);
      assert.equal(trace.outcome, status === 200 ? "ok" : "error");
      const foundation = logs.find(
        (entry) =>
          entry.event === "foundation_trace" &&
          entry.correlationId === trace.correlationId,
      );
      assert.equal(
        trace.operations.d1.count + 1,
        foundation.spans.d1.count,
        "outer binding read is outside protected operation timing",
      );
      for (const secret of [c.input.key, c.input.contact.email, m.checkoutUrl])
        assert.ok(!JSON.stringify(trace).includes(secret));
      const body = await response.json();
      assert.equal(body.recoveryKey, undefined);
      assert.equal(body.serverTiming, undefined);
    }
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(
      m.calls.filter((call) => isHitPayApiCall(call) && call.method === "POST")
        .length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("confirmation snapshots reduce reads and observe manual review after poll admission", async () => {
  const logs = [];
  const m = await createBookingMechanism({
    onLog: (line) => {
      try {
        logs.push(JSON.parse(line));
      } catch {}
    },
  });
  try {
    const c = await customer(m);
    const id = c.input.key;
    const headers = { ...c.headers, "X-Booking-Details": "1" };
    const created = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${id}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal(created.status, 200, await created.clone().text());
    async function read(route, count) {
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/attempts/${id}/${route}`,
        { headers },
      );
      assert.equal(response.status, 200);
      const trace = logs.find(
        (entry) =>
          entry.event === "confirmation_trace" &&
          entry.correlationId === response.headers.get("x-request-id"),
      );
      assert.equal(trace.operations.d1.count, count);
      return response.json();
    }
    const context = await read("checkout", 4);
    assert.ok(context.details);
    assert.equal(context.customerConfirmation, undefined);
    assert.equal((await read("confirmation", 5)).status, "pending");
    await m.completePayment();
    await m.recover();
    assert.ok((await read("checkout", 4)).confirmation);
    await m.db
      .prepare("UPDATE attempts SET confirmation_next_ms=0 WHERE id=?")
      .bind(id)
      .run();
    assert.equal((await read("confirmation", 4)).status, "confirmed");
    // Transition precisely at the write boundary, after the initial snapshot.
    // A stale snapshot must never expose the preceding confirmed state.
    await m.db.exec(
      `CREATE TRIGGER review_during_poll AFTER UPDATE OF confirmation_checks ON attempts BEGIN UPDATE hitpay_payments SET state='manual_review',reason='recovery_exhausted' WHERE attempt_id=NEW.id; END;`,
    );
    await m.db
      .prepare("UPDATE attempts SET confirmation_next_ms=0 WHERE id=?")
      .bind(id)
      .run();
    const guarded = await read("confirmation", 5);
    assert.equal(guarded.status, "unresolved");
    assert.equal(guarded.reason, "payment_received_booking_pending");
    assert.equal(guarded.customerConfirmation, undefined);
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(
      m.calls.filter((call) => isHitPayApiCall(call) && call.method === "POST")
        .length,
      1,
    );
    assert.equal(
      m.calls.filter((call) =>
        call.url.endsWith("/admin/invoices/901/accept-payment"),
      ).length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("batch transport claims recheck revocation at each creation boundary without replay", async () => {
  for (const boundary of ["createBatch", "book", "closeBatch"]) {
    let revoked = false;
    const m = await createBookingMechanism({
      batch: true,
      respond: async (call) => {
        if (call.body?.method === boundary && !revoked) {
          revoked = true;
          await m.db
            .prepare("UPDATE guest_access SET revoked_ms=?")
            .bind(Date.now())
            .run();
        }
      },
    });
    try {
      const c = await customer(m);
      c.input.sessions.push({
        ...c.input.sessions[0],
        startMs: m.startMs + 3000000,
      });
      const send = () =>
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        });
      const first = await send();
      const result = await first.json();
      assert.notEqual(result.paymentAvailable, true);
      assert.equal(result.checkout, undefined);
      const count =
        boundary === "createBatch" ? 0 : boundary === "book" ? 1 : 2;
      assert.equal(
        m.calls.filter((c) => c.body?.method === "book").length,
        count,
      );
      assert.equal(
        m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
        0,
      );
      assert.equal((await send()).status, 401);
      assert.equal(
        m.calls.filter((c) => c.body?.method === "book").length,
        count,
      );
      assert.equal(
        (await m.db.prepare("SELECT count(*) AS n FROM attempts").first()).n,
        1,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("single and batch recovery retain verified evidence with bounded read overlap and measured D1 work", async () => {
  for (const count of [1, 2, 4, 5]) {
    const logs = [];
    let measuring = false,
      active = 0,
      maximum = 0;
    const m = await createBookingMechanism({
      batch: count > 1,
      batchSize: count,
      onLog: (line) => {
        try {
          logs.push(JSON.parse(line));
        } catch {}
      },
      respond: async (call) => {
        if (
          measuring &&
          (call.body?.method === "getBookingDetails" ||
            (call.url.endsWith("/admin/invoices/901") && call.method === "GET"))
        ) {
          active++;
          maximum = Math.max(maximum, active);
          try {
            await new Promise((resolve) => setTimeout(resolve, 400));
          } finally {
            active--;
          }
        }
      },
    });
    try {
      const c = await customer(m);
      c.input.sessions = Array.from({ length: count }, (_, i) => ({
        ...c.input.sessions[0],
        startMs: m.startMs + i * 3000000,
      }));
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        },
      );
      assert.equal((await response.json()).paymentAvailable, true);
      await m.completePayment();
      measuring = true;
      await m.recover();
      assert.equal(active, 0);
      assert.equal(maximum, 2);
      const trace = logs.find(
        (e) =>
          e.event === "confirmation_trace" &&
          e.boundary === "recovery" &&
          e.result === "complete",
      );
      assert.ok(
        trace,
        JSON.stringify(logs.filter((e) => e.event === "confirmation_trace")),
      );
      assert.equal(trace.operations.booking_read.count, count);
      assert.equal(trace.operations.invoice_read.count, 1);
      assert.equal(trace.operations.accounting_write.count, 1);
      assert.equal(trace.operations.d1.count, 5);
      console.log(
        `recovery ${count}: D1=${trace.operations.d1.count}; ms=${trace.durationMs}; maxReads=${maximum}`,
      );
      const stored = await m.db
        .prepare(
          "SELECT a.observation_json,c.confirmation_json FROM attempts a JOIN checkout_progress c ON c.attempt_id=a.id WHERE a.id=?",
        )
        .bind(c.input.key)
        .first();
      assert.equal(JSON.parse(stored.observation_json).bookings.length, count);
      assert.equal(JSON.parse(stored.confirmation_json).sessions.length, count);
      assert.equal(
        m.calls.filter((c) => c.body?.method === "book").length,
        count,
      );
      assert.equal(
        m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
        1,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("deferred single and batch checkout reject failed foundation and conditional preparation without provider writes", async () => {
  for (const count of [1, 2])
    for (const fault of ["foundation", "grant", "binding", "effect"]) {
      const m = await createBookingMechanism({
        batch: count > 1,
        batchSize: count,
      });
      try {
        const c = await customer(m);
        c.input.sessions = Array.from({ length: count }, (_, i) => ({
          ...c.input.sessions[0],
          startMs: m.startMs + i * 3000000,
        }));
        if (fault === "foundation")
          await m.db.exec(
            "DROP TRIGGER immutable_foundation_identity_update; UPDATE foundation_identity SET account_id='wrong-account'",
          );
        if (fault === "grant")
          await m.db.exec(
            "CREATE TRIGGER ignore_grant BEFORE INSERT ON native_checkout_grants BEGIN SELECT RAISE(IGNORE); END",
          );
        if (fault === "binding")
          await m.db.exec(
            "CREATE TRIGGER ignore_binding BEFORE UPDATE OF attempt_id ON native_checkout_grants BEGIN SELECT RAISE(IGNORE); END",
          );
        if (fault === "effect")
          await m.db.exec(
            "CREATE TRIGGER ignore_effect BEFORE INSERT ON session_effects WHEN NEW.step='session:0' BEGIN SELECT RAISE(IGNORE); END",
          );
        const response = await m.mf.dispatchFetch(
          m.origin + `/api/booking/checkout/${c.input.key}`,
          {
            method: "POST",
            headers: c.headers,
            body: JSON.stringify({ ...c.input, accepted: true }),
          },
        );
        const result = await response.json();
        assert.notEqual(result.paymentAvailable, true, fault);
        assert.equal(result.checkout, undefined, fault);
        assert.equal(
          m.calls.filter((c) => c.body?.method === "book").length,
          0,
          fault,
        );
        assert.equal(
          m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST")
            .length,
          0,
          fault,
        );
        if (fault === "foundation") assert.equal(m.calls.length, 0);
      } finally {
        await m.close();
      }
    }
});

test("five-call single checkout retains malformed response evidence and blocks payment after failed reservation predicates", async () => {
  for (const fault of ["malformed", "key-rollback", "reservation-revoked"]) {
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (fault === "malformed" && call.body?.method === "book")
          return Response.json({
            jsonrpc: "2.0",
            id: call.body.id,
            result: { bookings: [], invoice: null },
          });
      },
    });
    try {
      const c = await customer(m);
      if (fault === "key-rollback")
        await m.db.exec(
          "CREATE TRIGGER reject_key BEFORE INSERT ON session_effects WHEN NEW.step='native-booking-key' BEGIN SELECT RAISE(ABORT,'synthetic_key_failure'); END",
        );
      if (fault === "reservation-revoked")
        await m.db.exec(
          "CREATE TRIGGER revoke_at_hold AFTER INSERT ON hitpay_holds BEGIN UPDATE guest_access SET revoked_ms=issued_ms; END",
        );
      const send = () =>
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        });
      const result = await (await send()).json();
      assert.notEqual(result.paymentAvailable, true, fault);
      assert.equal(result.checkout, undefined, fault);
      const row = await m.db
        .prepare(
          "SELECT result_json FROM native_checkout_grants WHERE attempt_id=?",
        )
        .bind(c.input.key)
        .first();
      assert.ok(JSON.parse(row.result_json).holdEvidence.length, fault);
      assert.equal(
        (
          await m.db
            .prepare("SELECT COUNT(*) AS n FROM hitpay_payments")
            .first()
        ).n,
        0,
        fault,
      );
      await m.mf.dispatchFetch(
        m.origin + `/__fixture/drain-annotations?attempt=${c.input.key}`,
      );
      await m.mf.unsafeEvictDurableObject(
        "booking-mechanism",
        "SoccerBotAccountCoordinator",
        { name: "simplybook-developer-account" },
      );
      await send();
      assert.equal(
        m.calls.filter((c) => c.body?.method === "book").length,
        1,
        fault,
      );
      assert.equal(
        m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
        0,
        fault,
      );
    } finally {
      await m.close();
    }
  }
});

test("five-call fresh snapshots cannot duplicate checkout across overlapping requests", async () => {
  const m = await createBookingMechanism({
    respond: async (call) => {
      if (call.body?.method === "getToken")
        await new Promise((resolve) => setTimeout(resolve, 100));
    },
  });
  try {
    const c = await customer(m);
    const send = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const bodies = await Promise.all(
      [send(), send()].map((pending) => checkoutResult(pending)),
    );
    assert.ok(bodies.some((r) => r.paymentAvailable === true));
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
      1,
    );
  } finally {
    await m.close();
  }
});

test("five-call speculative preparation cannot change a colliding foreign attempt", async () => {
  for (const [state, version] of [
    ["prepared", 0],
    ["dispatching", 1],
  ]) {
    const m = await createBookingMechanism();
    try {
      const c = await customer(m);
      await m.db
        .prepare(
          "INSERT INTO attempts(id,owner_id,idempotency_key,intent_json,intent_hash,created_ms,deadline_ms,state,version) VALUES(?,'other-owner','other-key','{}',?,?,?, ?,?)",
        )
        .bind(
          c.input.key,
          "a".repeat(64),
          Date.now(),
          Date.now() + 1200000,
          state,
          version,
        )
        .run();
      const before = await m.db
        .prepare("SELECT * FROM attempts WHERE id=?")
        .bind(c.input.key)
        .first();
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: true }),
        },
      );
      assert.equal(response.status, 409);
      assert.deepEqual(
        await m.db
          .prepare("SELECT * FROM attempts WHERE id=?")
          .bind(c.input.key)
          .first(),
        before,
      );
      assert.equal(
        (
          await m.db
            .prepare("SELECT COUNT(*) AS n FROM checkout_payment_routes")
            .first()
        ).n,
        0,
      );
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM dispatches").first()).n,
        0,
      );
      assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 0);
      assert.equal(m.calls.filter((c) => isHitPayApiCall(c)).length, 0);
    } finally {
      await m.close();
    }
  }
});

test("recovery publication rolls back on storage failure and resumes without duplicate accounting", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    const response = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${c.input.key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal((await response.json()).paymentAvailable, true);
    await m.completePayment();
    await m.db.exec(
      "CREATE TRIGGER reject_terminal BEFORE UPDATE OF state ON hitpay_payments WHEN NEW.state='complete' BEGIN SELECT RAISE(ABORT,'synthetic_publication_failure'); END",
    );
    await m.recover();
    const read = () =>
      m.db
        .prepare(
          "SELECT p.state,p.external_state,c.confirmation_json FROM hitpay_payments p JOIN checkout_progress c ON c.attempt_id=p.attempt_id WHERE p.attempt_id=?",
        )
        .bind(c.input.key)
        .first();
    const failed = await read();
    assert.notEqual(failed.state, "complete");
    assert.equal(failed.external_state, "unknown");
    assert.equal(failed.confirmation_json, null);
    await m.db.exec("DROP TRIGGER reject_terminal");
    await m.db
      .prepare("UPDATE hitpay_payments SET ready_ms=0 WHERE attempt_id=?")
      .bind(c.input.key)
      .run();
    await m.recover();
    const recovered = await read();
    assert.equal(recovered.state, "complete");
    assert.ok(recovered.confirmation_json);
    assert.equal(
      m.calls.filter((c) => c.url.endsWith("/accept-payment")).length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("rejected concurrent checkout reads the owned active attempt without repeating provider effects", async () => {
  for (const incomplete of [false, true]) {
    const m = await createBookingMechanism({
      trainerIds: [14, 15],
      invoiceWindowMs: incomplete ? 120000 : 900000,
    });
    try {
      const c = await customer(m);
      const initial = incomplete
        ? await m.mf.dispatchFetch(
            m.origin + `/api/booking/checkout/${c.input.key}`,
            {
              method: "POST",
              headers: c.headers,
              body: JSON.stringify({ ...c.input, accepted: true }),
            },
          )
        : await c.send();
      assert.equal(initial.status, 200);
      if (incomplete) {
        const response = await m.mf.dispatchFetch(
          m.origin + `/api/attempts/${c.input.key}/checkout`,
          { headers: c.headers },
        );
        const context = await response.json();
        assert.equal(context.bookingIssue, "incomplete");
        assert.equal(context.checkout.state, "unavailable");
      }
      const before = m.calls.length;
      const key = crypto.randomUUID();
      const result = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({
            ...c.input,
            key,
            accepted: true,
            sessions: c.input.sessions.map((session) => ({
              ...session,
              startMs: session.startMs + 3000000,
            })),
          }),
        },
      );
      assert.equal(result.status, 503);
      assert.deepEqual(await result.json(), {
        error: "checkout_already_active",
      });
      assert.equal(m.calls.length, before);
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
        1,
      );
      assert.equal(
        (
          await m.db
            .prepare("SELECT COUNT(*) AS n FROM hitpay_payments")
            .first()
        ).n,
        0,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
      const same = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, key, accepted: true }),
        },
      );
      assert.deepEqual(await same.json(), {
        error: "checkout_selection_unavailable",
      });
      assert.deepEqual(
        m.calls
          .slice(before)
          .filter((call) => call.body?.method === "getAvailableTimeIntervals")
          .map((call) => String(call.body.params[3]))
          .sort(),
        ["14", "15"],
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
      const otherKey = crypto.randomUUID();
      const otherTrainer = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${otherKey}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({
            ...c.input,
            key: otherKey,
            accepted: true,
            sessions: c.input.sessions.map((session) => ({
              ...session,
              instructorId: "15",
            })),
          }),
        },
      );
      assert.equal(otherTrainer.status, 503);
      assert.deepEqual(await otherTrainer.json(), {
        error: "checkout_selection_unavailable",
      });
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
        1,
      );
    } finally {
      await m.close();
    }
  }
  const prepared = await createBookingMechanism();
  try {
    const c = await customer(prepared);
    const first = await prepared.mf.dispatchFetch(
      prepared.origin + "/api/booking/prepare",
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify(c.input),
      },
    );
    assert.equal(first.status, 201);
    const before = prepared.calls.length;
    const key = crypto.randomUUID();
    const rejected = await prepared.mf.dispatchFetch(
      prepared.origin + `/api/booking/hold/${key}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, key }),
      },
    );
    assert.equal(rejected.status, 409);
    assert.deepEqual(await rejected.json(), {
      error: "checkout_already_active",
    });
    assert.equal(
      prepared.calls.length,
      before,
      "undispatched preparation needs no capacity read",
    );
    assert.equal(
      (await prepared.db.prepare("SELECT COUNT(*) AS n FROM attempts").first())
        .n,
      1,
    );
    assert.equal(
      prepared.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
  } finally {
    await prepared.close();
  }
});

test("rejected unbound window checks fresh availability and preserves failed or available readback as unresolved", async () => {
  for (const outcome of ["occupied", "available", "failed"]) {
    let inspect = false;
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (!inspect || call.body?.method !== "getAvailableTimeIntervals")
          return;
        if (outcome === "failed") return new Response(null, { status: 503 });
        return Response.json({
          jsonrpc: "2.0",
          id: call.body.id,
          result: {
            [call.body.params[0]]: {
              [String(call.body.params[3])]:
                outcome === "occupied" ? [] : [["12:00:00", "12:50:00"]],
            },
          },
        });
      },
    });
    try {
      const a = await customer(m);
      assert.equal((await a.send()).status, 200);
      const grant = await m.db
        .prepare("SELECT * FROM native_checkout_grants")
        .first();
      const b = await customer(m);
      const token = b.headers.cookie.split("=")[1];
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(token),
          ),
        ),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      const retained = {
        ...grant,
        capability_hash: hash,
        attempt_id: null,
        intent_hash: null,
        state: "granted",
        result_json: null,
        source_revision: "b".repeat(40),
      };
      const columns = Object.keys(retained);
      await m.db
        .prepare(
          `INSERT INTO native_checkout_grants(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
        )
        .bind(...Object.values(retained))
        .run();
      inspect = true;
      const before = m.calls.length;
      const result = await m.mf.dispatchFetch(
        m.origin + `/api/booking/checkout/${b.input.key}`,
        {
          method: "POST",
          headers: b.headers,
          body: JSON.stringify({ ...b.input, accepted: true }),
        },
      );
      assert.equal(result.status, 503);
      assert.deepEqual(await result.json(), {
        error:
          outcome === "occupied"
            ? "checkout_selection_unavailable"
            : "checkout_window_unresolved",
      });
      assert.equal(
        m.calls
          .slice(before)
          .filter((call) => call.body?.method === "getAvailableTimeIntervals")
          .length,
        1,
      );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        1,
      );
      assert.equal(
        (await m.db.prepare("SELECT COUNT(*) AS n FROM attempts").first()).n,
        1,
      );
      assert.equal(
        (
          await m.db
            .prepare("SELECT COUNT(*) AS n FROM hitpay_payments")
            .first()
        ).n,
        0,
      );
      assert.equal(
        (
          await m.db
            .prepare(
              "SELECT source_revision FROM native_checkout_grants WHERE capability_hash=?",
            )
            .bind(hash)
            .first()
        ).source_revision,
        retained.source_revision,
      );
    } finally {
      await m.close();
    }
  }
});

test("409 preparation readback distinguishes unavailable selection from unresolved without effects", async () => {
  for (const occupied of [false, true]) {
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (call.body?.method !== "getAvailableTimeIntervals") return;
        return Response.json({
          jsonrpc: "2.0",
          id: call.body.id,
          result: {
            [call.body.params[0]]: {
              [String(call.body.params[3])]: occupied
                ? []
                : [["12:00:00", "12:50:00"]],
            },
          },
        });
      },
    });
    try {
      const c = await customer(m);
      c.input.sessions[0].totalMinor = 8700;
      const response = await c.send();
      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        error: occupied
          ? "checkout_selection_unavailable"
          : "checkout_window_unresolved",
      });
      for (const table of [
        "attempts",
        "dispatches",
        "session_effects",
        "hitpay_payments",
      ])
        assert.equal(
          (await m.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n,
          0,
        );
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        0,
      );
      assert.deepEqual(m.unexpected, []);
    } finally {
      await m.close();
    }
  }
});

test("409 preparation preserves an existing original booking for recovery", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    assert.equal((await c.send()).status, 200);
    const before = await m.db
      .prepare("SELECT * FROM attempts WHERE id=?")
      .bind(c.input.key)
      .first();
    const calls = m.calls.length;
    c.input.sessions[0].totalMinor = 8700;
    const response = await c.send();
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: "checkout_recovery_required",
    });
    assert.deepEqual(
      await m.db
        .prepare("SELECT * FROM attempts WHERE id=?")
        .bind(c.input.key)
        .first(),
      before,
    );
    assert.equal(m.calls.length, calls);
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_payments").first())
        .n,
      0,
    );
  } finally {
    await m.close();
  }
});

test("automatic recovery completion publishes a receipt before dismissal and repeat acknowledgement", async () => {
  const completion = Promise.withResolvers();
  const displayStarted = Promise.withResolvers();
  const releaseDisplay = Promise.withResolvers();
  let blockDisplay = false;
  let displayWork;

  const m = await createBookingMechanism({
    observationMaxAgeMs: 1000,
    respond: async (call) => {
      if (blockDisplay && call.body?.method === "getAvailableTimeIntervals") {
        displayStarted.resolve();
        await releaseDisplay.promise;
      }
    },
    onLog(message) {
      if (!message.startsWith("{")) return;
      const event = JSON.parse(message);
      if (event.event === "confirmation_trace" && event.boundary === "recovery")
        completion.resolve(event);
    },
  });
  try {
    const c = await customer(m);
    const id = c.input.key;
    const created = await m.mf.dispatchFetch(
      m.origin + `/api/booking/checkout/${id}`,
      {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      },
    );
    assert.equal(created.status, 200, await created.text());
    assert.equal((await m.completePayment()).status, 202);
    // No cron trigger, polling or database writes: the webhook's actual alarm
    // must publish its durable outcome before the test proceeds to dismissal.
    const event = await completion.promise;
    assert.equal(event.outcome, "ok");
    assert.equal(event.result, "complete");
    const context = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${id}/checkout`,
      { headers: c.headers },
    );
    assert.equal((await context.json()).confirmation.attemptId, id);
    const paymentBefore = await m.db
      .prepare("SELECT * FROM hitpay_payments WHERE attempt_id=?")
      .bind(id)
      .first();
    const journalBefore = await m.db
      .prepare("SELECT observation_json FROM attempts WHERE id=?")
      .bind(id)
      .first();
    // Exercise the actual age boundary, not a retry or extended test timeout.
    await waitForClockBoundary(1001);
    const stale = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${id}/receipt`,
      { headers: c.headers },
    );
    assert.equal(stale.status, 409, await stale.text());
    const refreshed = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${id}/receipt`,
      { headers: { ...c.headers, "X-Booking-Refresh": "1" } },
    );
    assert.equal(refreshed.status, 200, await refreshed.text());
    assert.deepEqual(
      await m.db
        .prepare("SELECT * FROM hitpay_payments WHERE attempt_id=?")
        .bind(id)
        .first(),
      paymentBefore,
    );
    assert.deepEqual(
      await m.db
        .prepare("SELECT observation_json FROM attempts WHERE id=?")
        .bind(id)
        .first(),
      journalBefore,
    );
    blockDisplay = true;
    displayWork = m.mf.dispatchFetch(
      m.origin + `/api/calendar/${m.date.slice(0, 7)}`,
    );
    await displayStarted.promise;
    const acknowledgements = await Promise.all(
      [0, 1].map(() =>
        m.mf.dispatchFetch(m.origin + `/api/attempts/${id}/dismiss`, {
          method: "POST",
          headers: c.headers,
        }),
      ),
    );
    for (const dismissed of acknowledgements)
      assert.equal(dismissed.status, 200, await dismissed.text());
    assert.equal(
      (
        await m.db
          .prepare(
            "SELECT COUNT(*) AS count FROM completed_native_checkout_grants WHERE attempt_id=?",
          )
          .bind(id)
          .first()
      ).count,
      1,
    );
    releaseDisplay.resolve();
    assert.equal((await displayWork).status, 200);
    const receipt = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${id}/receipt`,
      { headers: c.headers },
    );
    assert.equal(receipt.status, 409, await receipt.text());
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter((c) => c.url.endsWith("/accept-payment")).length,
      1,
    );
    assert.equal(
      m.calls.filter((c) => isHitPayApiCall(c) && c.method === "POST").length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    releaseDisplay.resolve();
    if (displayWork) await displayWork;
    await m.close();
  }
});

test("customer-selected trainers survive a multi-slot hold and restoration without automatic reassignment", async () => {
  const m = await createBookingMechanism({
    batch: true,
    trainerIds: [14, 15],
    sessionTrainers: [15, 14],
  });
  try {
    const c = await customer(m);
    c.input.sessions[0].instructorId = "15";
    c.input.sessions.push({
      ...c.input.sessions[0],
      instructorId: "14",
      startMs: m.startMs + 3000000,
    });
    const result = await checkoutResult(c.send(), 200);
    assert.equal(result.state, "associated");
    const restored = await m.mf.dispatchFetch(
      m.origin + "/api/booking/current",
      { headers: c.headers },
    );
    assert.equal(restored.status, 200);
    assert.deepEqual(
      (await restored.json()).sessions.map((session) => session.instructorId),
      ["15", "14"],
    );
    const books = m.calls.filter((call) => call.body?.method === "book");
    assert.equal(books.length, 2);
    await checkoutResult(c.send(), 200);
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      2,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});
test("different trainers cannot bypass a shared-studio conflict during concurrent customer holds", async () => {
  const m = await createBookingMechanism({ trainerIds: [14, 15] });
  try {
    const first = await customer(m);
    const second = await customer(m);
    second.input.sessions[0].instructorId = "15";
    const results = await Promise.all(
      [first.send(), second.send()].map((pending) => checkoutResult(pending)),
    );
    assert.equal(
      results.filter((result) => result.state === "associated").length,
      1,
    );
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      1,
    );
    assert.equal(
      (await m.db.prepare("SELECT COUNT(*) AS n FROM hitpay_holds").first()).n,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});
test("direct checkout preserves provider shared-studio rejection across different trainers without a second payment or replay", async () => {
  let books = 0;
  const m = await createBookingMechanism({
    trainerIds: [14, 15],
    respond: async (call) => {
      if (call.body?.method === "book" && ++books > 1)
        return Response.json({
          jsonrpc: "2.0",
          id: call.body.id,
          error: { code: -32000, message: "Synthetic shared studio occupied" },
        });
      return undefined;
    },
  });
  try {
    const first = await customer(m);
    const second = await customer(m);
    second.input.sessions[0].instructorId = "15";
    const send = (c) =>
      m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ ...c.input, accepted: true }),
      });
    const accepted = await checkoutResult(send(first), 200);
    assert.equal(accepted.paymentAvailable, true);
    const denied = await checkoutResult(send(second), 200);
    assert.equal(denied.paymentAvailable, false);
    assert.notEqual(denied.state, "associated");
    await checkoutResult(send(second), 200);
    assert.equal(books, 2);
    assert.equal(
      m.calls.filter((call) => isHitPayApiCall(call) && call.method === "POST")
        .length,
      1,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("client sandbox guest checkout preserves production scope through duplicate requests and paid recovery", async () => {
  const completion = Promise.withResolvers();
  const m = await createBookingMechanism({
    clientSandbox: true,
    onLog(message) {
      if (!message.startsWith("{")) return;
      const event = JSON.parse(message);
      if (event.event === "confirmation_trace" && event.boundary === "recovery")
        completion.resolve(event);
    },
  });
  try {
    const c = await customer(m);
    c.input.sessions[0].serviceId = "3";
    c.input.sessions[0].totalMinor = 10800;
    const results = await Promise.all(
      [c.send(), c.send()].map((r) => checkoutResult(r, 200)),
    );
    assert.ok(results.every((r) => r.attemptId === c.input.key));
    assert.ok(
      results.some((r) => r.state === "associated"),
      JSON.stringify(results),
    );
    const pay = () =>
      m.mf.dispatchFetch(m.origin + `/api/booking/hitpay/${c.input.key}`, {
        method: "POST",
        headers: c.headers,
        body: JSON.stringify({ accepted: true }),
      });
    await checkoutResult(pay(), 200);
    await checkoutResult(pay(), 200);
    const attempt = await m.db
      .prepare("SELECT intent_json FROM attempts WHERE id=?")
      .bind(c.input.key)
      .first();
    assert.equal(JSON.parse(attempt.intent_json).environmentId, "production");
    assert.equal(JSON.parse(attempt.intent_json).totalMinor, 10800);
    assert.equal(m.calls.filter((c) => c.body?.method === "book").length, 1);
    assert.equal(
      m.calls.filter(
        (c) => c.method === "POST" && c.url.endsWith("/v1/payment-requests"),
      ).length,
      1,
    );
    assert.equal((await m.completePayment()).status, 202);
    const event = await completion.promise;
    assert.equal(event.result, "complete");
    const receipt = await m.mf.dispatchFetch(
      m.origin + `/api/attempts/${c.input.key}/receipt`,
      { headers: c.headers },
    );
    assert.equal(receipt.status, 200, await receipt.text());
    assert.equal(
      m.calls.filter((c) => c.url.endsWith("/accept-payment")).length,
      1,
    );
    assert.ok(
      m.calls
        .filter((c) => isHitPayApiCall(c))
        .every((c) => new URL(c.url).hostname === "api.sandbox.hit-pay.com"),
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
});

test("client sandbox disabled or foreign pairing refuses guest booking before provider dispatch", async () => {
  for (const bindings of [
    { CLIENT_SANDBOX_ACCESS: "disabled" },
    { HITPAY_MERCHANT: "foreign" },
    { SIMPLYBOOK_PROD_COMPANY_LOGIN: "foreign" },
  ]) {
    const m = await createBookingMechanism({ clientSandbox: true, bindings });
    try {
      const c = await customer(m);
      c.input.sessions[0].serviceId = "3";
      c.input.sessions[0].totalMinor = 10800;
      const response = await c.send();
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: "combined_hold_unavailable",
      });
      assert.deepEqual(m.calls, []);
    } finally {
      await m.close();
    }
  }
});

/** Complete three journeys without replacing the customer, runtime or provider history. */
async function consecutiveJourneys(sizes) {
  const { createBookingSequence } =
    await import("./booking-sequence-fixture.mjs");
  let completed = Promise.withResolvers();
  const m = await createBookingSequence(sizes, {
    displayWarming: true,
    onLog(message) {
      if (!message.startsWith("{")) return;
      const event = JSON.parse(message);
      if (
        event.event === "confirmation_trace" &&
        event.boundary === "recovery" &&
        event.result === "complete"
      )
        completed.resolve(event);
    },
  });
  try {
    const c = await customer(m);
    const previous = [];
    await checkoutResult(
      m.mf.dispatchFetch(m.origin + `/api/calendar/${m.date.slice(0, 7)}`),
      200,
    );
    const originalRangeReads = m.calls.filter(
      (call) => call.body?.method === "getAvailableTimeIntervals",
    ).length;
    for (const [index, journey] of m.journeys.entries()) {
      completed = Promise.withResolvers();
      const key = crypto.randomUUID();
      const input = {
        ...c.input,
        key,
        accepted: true,
        sessions: journey.starts.map((startMs) => ({
          ...c.input.sessions[0],
          startMs,
          players: index + 1,
        })),
      };
      const checkout = await checkoutResult(
        m.mf.dispatchFetch(m.origin + `/api/booking/checkout/${key}`, {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify(input),
        }),
        200,
      );
      assert.equal(checkout.attemptId, key);
      assert.equal(checkout.paymentAvailable, true);
      const context = () =>
        checkoutResult(
          m.mf.dispatchFetch(m.origin + `/api/attempts/${key}/checkout`, {
            headers: c.headers,
          }),
          200,
        );
      const unpaid = await context();
      assert.equal(unpaid.checkout.url, journey.checkoutUrl);
      assert.equal(unpaid.summary.sessions.length, sizes[index]);
      assert.equal(unpaid.summary.totalMinor, sizes[index] * 8800);
      assert.equal(unpaid.confirmation, undefined);
      for (const old of previous) {
        const saved = await checkoutResult(
          m.mf.dispatchFetch(m.origin + `/api/attempts/${old.id}/checkout`, {
            headers: c.headers,
          }),
          200,
        );
        assert.deepEqual(saved.confirmation, old.proof);
        await checkoutResult(
          m.mf.dispatchFetch(m.origin + `/api/attempts/${old.id}/dismiss`, {
            method: "POST",
            headers: c.headers,
          }),
          200,
        );
      }
      const current = await checkoutResult(
        m.mf.dispatchFetch(m.origin + "/api/booking/current", {
          headers: c.headers,
        }),
        200,
      );
      assert.equal(current.attemptId, key);
      assert.equal((await m.completeJourney(index)).status, 202);
      assert.equal((await completed.promise).outcome, "ok");
      const paid = await context();
      assert.equal(paid.confirmation.attemptId, key);
      assert.equal(paid.confirmation.sessions.length, sizes[index]);
      assert.equal(paid.confirmation.totalMinor, sizes[index] * 8800);
      assert.deepEqual(
        paid.confirmation.sessions.map((s) => s.startMs),
        journey.starts,
      );
      assert.ok(
        paid.confirmation.sessions.every(
          (session) => session.players === index + 1,
        ),
      );
      previous.push({ id: key, proof: paid.confirmation });
      const displayed = await checkoutResult(
        m.mf.dispatchFetch(m.origin + `/api/calendar/${m.date.slice(0, 7)}`),
        200,
      );
      const remainingStarts = displayed.dates
        .flatMap((day) => day.offers ?? [])
        .map((offer) => offer.startMs);
      assert.ok(
        previous.every((old) =>
          old.proof.sessions.every(
            (session) => !remainingStarts.includes(session.startMs),
          ),
        ),
      );
      assert.ok(
        m.journeys
          .slice(index + 1)
          .every((next) =>
            next.starts.every((start) => remainingStarts.includes(start)),
          ),
      );
      assert.equal(
        m.calls.filter(
          (call) => call.body?.method === "getAvailableTimeIntervals",
        ).length,
        originalRangeReads,
        "back-to-back confirmation uses shared snapshot without provider month rebuild",
      );
      await checkoutResult(
        m.mf.dispatchFetch(m.origin + `/api/attempts/${key}/dismiss`, {
          method: "POST",
          headers: c.headers,
        }),
        200,
      );
    }
    const calendar = await checkoutResult(
      m.mf.dispatchFetch(m.origin + `/api/calendar/${m.date.slice(0, 7)}`),
      200,
    );
    assert.deepEqual(
      calendar.dates.flatMap((day) => day.offers ?? []),
      [],
    );
    const restored = await checkoutResult(
      m.mf.dispatchFetch(m.origin + "/api/booking/current", {
        headers: c.headers,
      }),
      200,
    );
    assert.equal(restored.state, "empty");
    const rows = await m.db
      .prepare(
        "SELECT attempt_id,reference,request_id,state FROM hitpay_payments ORDER BY attempt_id",
      )
      .all();
    assert.equal(rows.results.length, 3);
    assert.equal(new Set(rows.results.map((row) => row.reference)).size, 3);
    assert.equal(new Set(rows.results.map((row) => row.request_id)).size, 3);
    assert.ok(rows.results.every((row) => row.state === "complete"));
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      sizes.reduce((a, b) => a + b, 0),
    );
    assert.equal(
      m.calls.filter((call) => isHitPayApiCall(call) && call.method === "POST")
        .length,
      3,
    );
    assert.equal(
      m.calls.filter((call) => call.url.endsWith("/accept-payment")).length,
      3,
    );
    assert.deepEqual(m.unexpected, []);
  } finally {
    await m.close();
  }
}

test("three consecutive paid single bookings retain independent receipts payments and active ownership", async () => {
  await consecutiveJourneys([1, 1, 1]);
});
test("paid multi-session then two single bookings preserve totals capacity and old receipt isolation", async () => {
  await consecutiveJourneys([2, 1, 1]);
});

test("reservation admission caps new checkouts at five sessions before provider writes", async () => {
  const m = await createBookingMechanism({ batch: true, batchSize: 5 });
  try {
    const c = await customer(m);
    c.input.sessions = Array.from({ length: 6 }, (_, index) => ({
      ...c.input.sessions[0],
      startMs: m.startMs + index * 3000000,
    }));
    await checkoutResult(c.send(), 400);
    assert.equal(
      m.calls.filter((call) =>
        ["book", "createBatch"].includes(call.body?.method),
      ).length,
      0,
    );
    c.input.sessions.pop();
    const result = await checkoutResult(c.send(), 200);
    assert.equal(result.state, "associated");
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      5,
    );
  } finally {
    await m.close();
  }
});

test("reservation strikes count each proven unpaid checkout once and protect paid unknown and unprocessed receipts", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    const source = await admission(m, c);
    const now = Date.now();
    await expiredReservation(m, source, now - 5000, "paid");
    await expiredReservation(m, source, now - 4000, "unknown");
    await expiredReservation(m, source, now - 3000, "receipt");
    await expiredReservation(m, source, now - 2000, "verified");
    await admission(m, c);
    await admission(m, c);
    assert.equal(
      (
        await m.db
          .prepare("SELECT COUNT(*) AS n FROM reservation_expiries")
          .first()
      ).n,
      1,
    );
    await expiredReservation(m, source, now - 1000);
    assert.equal((await admission(m, c, 429)).error, "reservation_blocked");
    const before = await m.db
      .prepare("SELECT * FROM reservation_expiries ORDER BY attempt_id")
      .all();
    await admission(m, c, 429);
    assert.deepEqual(
      (
        await m.db
          .prepare("SELECT * FROM reservation_expiries ORDER BY attempt_id")
          .all()
      ).results,
      before.results,
    );
    await checkoutResult(c.send(), 429);
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
  } finally {
    await m.close();
  }
});

test("reservation shared IP survives fresh guest access and uses a rolling day without resetting on payment", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    c.headers["CF-Connecting-IP"] = "192.0.2.21";
    const source = await admission(m, c);
    const now = Date.now();
    await expiredReservation(m, source, now - 25 * 3600000);
    await expiredReservation(m, source, now - 5000);
    const other = await customer(m);
    other.headers["CF-Connecting-IP"] = "192.0.2.21";
    const otherSource = await admission(m, other);
    assert.notEqual(source.customerHash, otherSource.customerHash);
    assert.equal(source.ipHash, otherSource.ipHash);
    await expiredReservation(m, otherSource, now - 1000);
    await admission(m, other, 429);
    other.headers["CF-Connecting-IP"] = "192.0.2.22";
    await admission(m, other);
    // No raw addresses or unverified contact emails are used as customer authority.
    assert.match(source.ipHash, /^[a-f0-9]{64}$/);
    assert.match(source.customerHash, /^[a-f0-9]{64}$/);
  } finally {
    await m.close();
  }
});

test("reservation customer strikes reset on verified payment while shared IP remains blocked", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    c.headers["CF-Connecting-IP"] = "192.0.2.31";
    const source = await admission(m, c);
    const now = Date.now();
    await expiredReservation(m, source, now - 5000);
    await expiredReservation(m, source, now - 4000);
    await admission(m, c, 429);
    const paid = await expiredReservation(m, source, now + 2000, "paid");
    // Successful accounting evidence resets customer strikes, never the IP counter.
    await m.db
      .prepare(
        "UPDATE hitpay_payments SET state='complete',reason='hitpay_paid' WHERE attempt_id=?",
      )
      .bind(paid)
      .run();
    await admission(m, c, 429);
    c.headers["CF-Connecting-IP"] = "192.0.2.32";
    await admission(m, c);
  } finally {
    await m.close();
  }
});

test("reservation one hour blocks expire without clearing strikes and later expiries block again", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    const source = await admission(m, c);
    const now = Date.now();
    await expiredReservation(m, source, now - 3 * 3600000);
    await expiredReservation(m, source, now - 2 * 3600000);
    await admission(m, c);
    await expiredReservation(m, source, now - 1000);
    await admission(m, c, 429);
    assert.equal(
      (
        await m.db
          .prepare("SELECT COUNT(*) AS n FROM reservation_expiries")
          .first()
      ).n,
      3,
    );
  } finally {
    await m.close();
  }
});

test("reservation cooldown arising during preflight prevents the atomic first write and leaves safe retry state", async () => {
  for (const route of ["hold", "checkout"]) {
    let source,
      mechanism,
      injected = false;
    const m = await createBookingMechanism({
      respond: async (call) => {
        if (
          source &&
          !injected &&
          call.body?.method ===
            (route === "checkout" ? "getToken" : "getAvailableTimeIntervals")
        ) {
          injected = true;
          await expiredReservation(mechanism, source, Date.now() - 1000);
        }
      },
    });
    mechanism = m;
    try {
      const c = await customer(m);
      source = await admission(m, c);
      await expiredReservation(m, source, Date.now() - 2000);
      const response = await m.mf.dispatchFetch(
        m.origin + `/api/booking/${route}/${c.input.key}`,
        {
          method: "POST",
          headers: c.headers,
          body: JSON.stringify({ ...c.input, accepted: route === "checkout" }),
        },
      );
      const result = await checkoutResult(Promise.resolve(response));
      assert.equal(
        injected,
        true,
        JSON.stringify(m.calls.map((call) => call.body?.method || call.url)),
      );
      assert.equal(response.status, 429, JSON.stringify(result));
      assert.equal(result.error, "reservation_blocked");
      assert.equal(injected, true);
      assert.equal(
        m.calls.filter((call) => call.body?.method === "book").length,
        0,
      );
      assert.equal(
        (
          await m.db
            .prepare("SELECT COUNT(*) AS n FROM dispatches WHERE attempt_id=?")
            .bind(c.input.key)
            .first()
        ).n,
        0,
      );
      const grant = await m.db
        .prepare("SELECT state FROM native_checkout_grants WHERE attempt_id=?")
        .bind(c.input.key)
        .first();
      if (grant) assert.equal(grant.state, "blocked");
    } finally {
      await m.close();
    }
  }
});

test("reservation verified customer identity persists across guest capabilities and new network addresses", async () => {
  const m = await createBookingMechanism();
  try {
    const first = await customer(m);
    first.headers["CF-Connecting-IP"] = "192.0.2.51";
    const second = await customer(m);
    second.headers["CF-Connecting-IP"] = "192.0.2.52";
    const now = Date.now();
    const access = await m.db
      .prepare("SELECT * FROM guest_access ORDER BY issued_ms")
      .all();
    for (const row of access.results)
      await m.db
        .prepare(
          "INSERT INTO verified_identity(access_hash,owner_id,email,verified_ms,expires_ms) VALUES(?,?,'verified@example.test',?,?)",
        )
        .bind(row.capability_hash, row.owner_id, now - 1000, now + 3600000)
        .run();
    const a = await admission(m, first),
      b = await admission(m, second);
    assert.equal(a.customerHash, b.customerHash);
    assert.notEqual(a.ipHash, b.ipHash);
    await expiredReservation(m, a, now - 2000);
    await expiredReservation(m, a, now - 1000);
    await admission(m, second, 429);
    assert.equal(
      m.calls.filter((call) => call.body?.method === "book").length,
      0,
    );
  } finally {
    await m.close();
  }
});

test("reservation IP authority ignores forwarded headers and canonicalizes IPv6", async () => {
  const m = await createBookingMechanism();
  try {
    const c = await customer(m);
    c.headers["CF-Connecting-IP"] = "2001:db8::1";
    const first = await admission(m, c);
    c.headers["CF-Connecting-IP"] = "2001:0db8:0:0:0:0:0:1";
    c.headers["X-Forwarded-For"] = "192.0.2.99";
    assert.equal((await admission(m, c)).ipHash, first.ipHash);
    await expiredReservation(m, first, Date.now() - 2000);
    await expiredReservation(m, first, Date.now() - 1000);
    await admission(m, c, 429);
    c.headers["CF-Connecting-IP"] = "invalid";
    assert.equal(
      (await admission(m, c, 503)).error,
      "reservation_identity_unavailable",
    );
  } finally {
    await m.close();
  }
});
