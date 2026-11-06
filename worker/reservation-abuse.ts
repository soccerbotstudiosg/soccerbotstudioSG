import type { Access } from "./access";
import { ApiError, keyedHash } from "./policy";
import { unpaidExpiry } from "./checkout-expiry-policy";
import {
  RESERVATION_BLOCK_MS,
  RESERVATION_IP_WINDOW_MS,
  RESERVATION_STRIKE_THRESHOLD,
} from "../src/domain/booking-policy";

export type ReservationSource = { customerHash: string; ipHash: string };

/** Canonicalize the trusted edge address without accepting forwarded client input. */
function edgeAddress(request: Request) {
  const value = request.headers.get("CF-Connecting-IP");
  if (!value || value.length > 64 || !/^[a-fA-F0-9:.]+$/.test(value))
    throw new ApiError(503, "reservation_identity_unavailable");
  if (value.includes(":")) {
    try {
      return new URL(`https://[${value}]/`).hostname.toLowerCase();
    } catch {
      throw new ApiError(503, "reservation_identity_unavailable");
    }
  }
  const parts = value.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part) || +part > 255)
  )
    throw new ApiError(503, "reservation_identity_unavailable");
  return parts.map(Number).join(".");
}

/** Bind verified email or guest ownership and the edge IP to keyed, scoped hashes. */
export async function reservationSource(
  request: Request,
  env: Env,
  access: Access,
) {
  const pepper: unknown = Reflect.get(env, "IDENTITY_PEPPER");
  if (
    typeof pepper !== "string" ||
    pepper.length < 32 ||
    pepper.length > 512 ||
    /\s/.test(pepper)
  )
    throw new ApiError(503, "reservation_identity_unavailable");
  const now = Date.now();
  const identity = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT email FROM verified_identity WHERE access_hash=? AND owner_id=? AND revoked_ms IS NULL AND verified_ms<=? AND expires_ms>?",
    )
    .bind(access.capability_hash, access.owner_id, now, now)
    .first<{ email: string }>();
  const scope = [env.DEPLOYMENT_ACCOUNT_ID, env.ENVIRONMENT, env.APP_ORIGIN];
  return {
    customerHash: await keyedHash(pepper, [
      "reservation-customer",
      ...scope,
      identity ? "email" : "guest",
      identity?.email ?? access.owner_id,
    ]),
    ipHash: await keyedHash(pepper, [
      "reservation-ip",
      ...scope,
      edgeAddress(request),
    ]),
  };
}

/** Materialize each proven unpaid expiry once, even if the browser never returns. */
export function reservationExpiryStatement(
  db: D1Database,
  customer: string,
  ip: string,
  now: number,
  attemptScope = false,
) {
  // Reuse the financial release predicate. Neither time alone nor browser claims count.
  const proof = unpaidExpiry.replaceAll("native_checkout_grants", "g");
  return db
    .prepare(
      `INSERT INTO reservation_expiries(attempt_id,expired_ms)
    SELECT s.attempt_id,MAX(h.expires_ms,c.booking_created_ms+c.payment_window_ms+c.checking_buffer_ms+c.recovery_buffer_ms)
    FROM reservation_sources s JOIN attempts a ON a.id=s.attempt_id
    JOIN (SELECT attempt_id,state,ongoing FROM native_checkout_grants UNION ALL SELECT attempt_id,state,ongoing FROM expired_native_checkout_grants) g ON g.attempt_id=a.id
    JOIN hitpay_holds h ON h.attempt_id=a.id JOIN checkout_progress c ON c.attempt_id=a.id
    WHERE (s.customer_hash=${attemptScope ? "(SELECT customer_hash FROM reservation_sources WHERE attempt_id=?)" : "?"} OR s.ip_hash=${attemptScope ? "(SELECT ip_hash FROM reservation_sources WHERE attempt_id=?)" : "?"}) AND g.ongoing=1 AND g.state='complete' AND ${proof}
    ON CONFLICT(attempt_id) DO NOTHING`,
    )
    .bind(customer, ip, now);
}

/** Build a server-only deadline expression for customer and rolling shared-IP strikes. */
export function reservationBlockedUntilSql(
  customer: string,
  ip: string,
  now: string,
) {
  const paidReset = `(SELECT COALESCE(MAX(p.paid_ms),0) FROM reservation_sources r JOIN hitpay_payments p ON p.attempt_id=r.attempt_id
    WHERE r.customer_hash=${customer} AND p.paid_ms IS NOT NULL AND p.payment_id IS NOT NULL AND p.external_state='observed')`;
  const until = (
    where: string,
  ) => `(SELECT CASE WHEN COUNT(*)>=${RESERVATION_STRIKE_THRESHOLD} THEN COALESCE(MAX(e.expired_ms),0)+${RESERVATION_BLOCK_MS} ELSE 0 END
    FROM reservation_expiries e JOIN reservation_sources s ON s.attempt_id=e.attempt_id WHERE ${where})`;
  return `MAX(${until(`s.customer_hash=${customer} AND e.expired_ms>${paidReset}`)},${until(`s.ip_hash=${ip} AND e.expired_ms>${now}-${RESERVATION_IP_WINDOW_MS}`)})`;
}

/** Refuse new reservations while preserving already dispatched checkout recovery. */
export async function assertReservationAdmission(
  env: Env,
  source: ReservationSource,
) {
  const now = Date.now();
  const result = await env.STATE.withSession("first-primary").batch([
    reservationExpiryStatement(
      env.STATE,
      source.customerHash,
      source.ipHash,
      now,
    ),
    env.STATE.prepare(
      `SELECT ${reservationBlockedUntilSql("q.customer", "q.ip", String(now))} AS blocked_until FROM (SELECT ? AS customer, ? AS ip) q`,
    ).bind(source.customerHash, source.ipHash),
  ]);
  const until = (result[1].results[0] as { blocked_until: number })
    .blocked_until;
  if (until > now) throw new ApiError(429, "reservation_blocked");
}

/** Build the source insert for the same transaction as deferred attempt preparation. */
export function reservationSourceStatement(
  db: D1Database,
  id: string,
  source: ReservationSource,
) {
  return db
    .prepare(
      "INSERT INTO reservation_sources(attempt_id,customer_hash,ip_hash,created_ms) SELECT id,?,?,? FROM attempts WHERE id=? ON CONFLICT(attempt_id) DO NOTHING",
    )
    .bind(source.customerHash, source.ipHash, Date.now(), id);
}

/** Persist the original admission identity without overwriting it on retry. */
export async function retainReservationSource(
  env: Env,
  id: string,
  source: ReservationSource,
) {
  await reservationSourceStatement(env.STATE, id, source).run();
}

/** Mark a refused preparation retryable only when no financial effect has started. */
export async function rejectReservationPreparation(db: D1Database, id: string) {
  const result = await db.batch([
    db
      .prepare(
        "UPDATE native_checkout_grants SET state='blocked',result_json=? WHERE attempt_id=? AND ongoing=1 AND state IN ('granted','running') AND EXISTS(SELECT 1 FROM attempts a WHERE a.id=native_checkout_grants.attempt_id AND a.state='prepared' AND a.association_json IS NULL) AND NOT EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=native_checkout_grants.attempt_id) AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=native_checkout_grants.attempt_id) AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=native_checkout_grants.attempt_id)",
      )
      .bind(
        JSON.stringify({
          state: "checkout_not_started",
          paymentAvailable: false,
        }),
        id,
      ),
    db
      .prepare(
        "SELECT 1 FROM dispatches WHERE attempt_id=? UNION ALL SELECT 1 FROM session_effects WHERE attempt_id=? UNION ALL SELECT 1 FROM hitpay_payments WHERE attempt_id=?",
      )
      .bind(id, id, id),
  ]);
  if (result[1].results.length)
    throw new ApiError(409, "checkout_recovery_required");
}
