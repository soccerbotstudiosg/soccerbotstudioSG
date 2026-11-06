// Synthetic historical rows exercise real D1 admission predicates without provider calls.
import assert from "node:assert/strict";

/** Seed an already-created reservation with its original recovery boundary. */
export async function expiredReservation(
  m,
  source,
  expiredMs,
  payment = "none",
) {
  const id = crypto.randomUUID();
  await m.db.batch([
    m.db
      .prepare(
        "INSERT INTO attempts(id,owner_id,idempotency_key,intent_json,intent_hash,created_ms,deadline_ms,state) VALUES(?,?,?,'{}',?, ?,?,'observed')",
      )
      .bind(
        id,
        "synthetic-expired-owner",
        id,
        "f".repeat(64),
        expiredMs - 720000,
        expiredMs,
      ),
    m.db
      .prepare("INSERT INTO reservation_sources VALUES(?,?,?,?)")
      .bind(id, source.customerHash, source.ipHash, expiredMs - 720000),
    m.db
      .prepare(
        "INSERT INTO checkout_progress(attempt_id,booking_created_ms,payment_window_ms,checking_buffer_ms,recovery_buffer_ms) VALUES(?,?,480000,60000,180000)",
      )
      .bind(id, expiredMs - 720000),
    m.db
      .prepare("INSERT INTO hitpay_holds VALUES(?,'{}','{}',?,?)")
      .bind(id, "f".repeat(64), expiredMs - 120000),
    m.db
      .prepare(
        "INSERT INTO expired_native_checkout_grants(attempt_id,state,ongoing) VALUES(?,'complete',1)",
      )
      .bind(id),
  ]);
  if (payment !== "none") {
    const paid = payment === "paid";
    await m.db
      .prepare(
        "INSERT INTO hitpay_payments(attempt_id,scope_json,reference,expires_ms,created_ms,recovery_end_ms,state,reason,ready_ms,paid_ms,payment_id,external_state) VALUES(?,'{}',?,?,?,?,'manual_review',?,0,?,?,?)",
      )
      .bind(
        id,
        id,
        expiredMs,
        expiredMs - 720000,
        expiredMs,
        payment === "unknown" ? "hitpay_pending" : "hitpay_unpaid_verified",
        paid ? expiredMs - 1000 : null,
        paid ? crypto.randomUUID() : null,
        paid ? "observed" : "none",
      )
      .run();
    if (payment === "receipt")
      await m.db
        .prepare("INSERT INTO hitpay_receipts VALUES(?,?,?)")
        .bind(crypto.randomUUID(), id, Date.now())
        .run();
  }
  return id;
}

/** Exercise the actual admission function through the synthetic-only harness. */
export async function admission(m, c, status = 200) {
  const response = await m.mf.dispatchFetch(
    m.origin + "/__fixture/reservation-admission",
    { headers: c.headers },
  );
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  return body;
}
