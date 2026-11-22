import {
  CHANGEOVER_MINUTES,
  START_INTERVAL_MINUTES,
} from "../src/domain/booking-policy";
import { authenticate, type Access } from "./access";
import { checkoutContext } from "./confirmation";
import { ApiError } from "./policy";

/** Move only the exact still-verified grant. An admission must also own a new key. */
function archiveCompletedGrant(
  env: Env,
  id: string,
  access: Access,
  observation: string,
  nextKey?: string,
) {
  const eligible =
    "attempt_id=? AND capability_hash=? AND ongoing=1 AND state='complete' AND EXISTS(SELECT 1 FROM attempts a WHERE a.id=native_checkout_grants.attempt_id AND a.owner_id=? AND a.observation_json=?) AND EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=native_checkout_grants.attempt_id AND p.state='complete' AND p.reason='verified' AND p.external_state='observed' AND p.paid_ms IS NOT NULL AND p.payment_id IS NOT NULL) AND EXISTS(SELECT 1 FROM guest_access g WHERE g.capability_hash=native_checkout_grants.capability_hash AND g.owner_id=? AND g.revoked_ms IS NULL AND g.expires_ms>?)" +
    (nextKey
      ? " AND NOT EXISTS(SELECT 1 FROM attempts WHERE id=? OR (owner_id=? AND idempotency_key=?)) AND NOT EXISTS(SELECT 1 FROM checkout_preparation_rejections WHERE attempt_id=?)"
      : "");
  const values = [
    id,
    access.capability_hash,
    access.owner_id,
    observation,
    access.owner_id,
    Date.now(),
    ...(nextKey ? [nextKey, access.owner_id, nextKey, nextKey] : []),
  ];
  return [
    env.STATE.prepare(
      `INSERT INTO completed_native_checkout_grants SELECT * FROM native_checkout_grants WHERE ${eligible}`,
    ).bind(...values),
    env.STATE.prepare(
      `DELETE FROM native_checkout_grants WHERE ${eligible} AND EXISTS(SELECT 1 FROM completed_native_checkout_grants h WHERE h.attempt_id=native_checkout_grants.attempt_id AND h.capability_hash=native_checkout_grants.capability_hash)`,
    ).bind(...values),
  ];
}

/** Stage completion archival alongside a different, explicitly submitted checkout. */
export async function completedCheckoutRollover(
  request: Request,
  env: Env,
  access: Access,
  id: string,
  nextKey: string,
  sessions: readonly { startMs: number }[],
) {
  const observation = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT a.observation_json FROM attempts a JOIN hitpay_payments p ON p.attempt_id=a.id WHERE a.id=? AND a.owner_id=? AND a.observation_json IS NOT NULL AND p.state='complete' AND p.reason='verified' AND p.external_state='observed'",
    )
    .bind(id, access.owner_id)
    .first<string>("observation_json");
  if (!observation) return null;
  const proof = await checkoutContext(request, env, id, Date.now());
  if (
    !proof.confirmation ||
    sessions.some((next) =>
      proof.summary.sessions.some(
        (previous) =>
          previous.startMs < next.startMs + START_INTERVAL_MINUTES * 60000 &&
          next.startMs <
            previous.startMs +
              ((previous.durationMinutes ?? 40) + CHANGEOVER_MINUTES) * 60000,
      ),
    )
  )
    return null;
  return archiveCompletedGrant(env, id, access, observation, nextKey);
}

/** Release an eligible completed checkout without erasing unresolved outcomes. */
export async function dismissCompletedCheckout(
  request: Request,
  env: Env,
  id: string,
) {
  const access = await authenticate(request, env, Date.now());
  const proof = await checkoutContext(request, env, id, Date.now());
  if (!proof.confirmation) throw new ApiError(409, "booking_not_confirmed");
  const archived = await env.STATE.prepare(
    "SELECT 1 FROM completed_native_checkout_grants WHERE attempt_id=? AND capability_hash=?",
  )
    .bind(id, access.capability_hash)
    .first();
  if (archived) return { dismissed: true as const };
  const observation = await env.STATE.prepare(
    "SELECT observation_json FROM attempts WHERE id=? AND owner_id=?",
  )
    .bind(id, access.owner_id)
    .first<{ observation_json: string }>();
  if (!observation) throw new ApiError(404, "attempt_unavailable");
  // Revalidate the exact evidence captured for the transaction.
  const checked = await checkoutContext(request, env, id, Date.now());
  if (!checked.confirmation) throw new ApiError(409, "booking_not_confirmed");
  const result = await env.STATE.batch(
    archiveCompletedGrant(env, id, access, observation.observation_json),
  );
  if (result[1].meta.changes !== 1) {
    // A concurrent authenticated exit may have committed the same archival first.
    await authenticate(request, env, Date.now());
    const completed = await env.STATE.withSession("first-primary")
      .prepare(
        "SELECT 1 FROM completed_native_checkout_grants WHERE attempt_id=? AND capability_hash=?",
      )
      .bind(id, access.capability_hash)
      .first();
    if (!completed) throw new ApiError(409, "booking_exit_unavailable");
  }
  return { dismissed: true as const };
}
