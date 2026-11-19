import { ongoingReadbackEnabled } from "./ongoing-readback";

const recheckMs = 5_000;
const claimLeaseMs = 30_000;
const maxChecks = 5;
const interruptedDispatchMs = 60_000;
const foregroundFinished = "g.state='blocked' AND a.state='recovery_required'";
const interruptedForeground = `g.state='running' AND a.state IN ('dispatching','recovery_required') AND a.observation_json IS NULL
  AND r.state='due' AND r.reason='interrupted' AND r.generation=0 AND r.tries=0 AND r.claimant IS NULL AND r.attempt_version IS NULL
  AND r.updated_ms=d.started_ms AND d.started_ms<=? AND r.ready_ms<=?
  AND a.version=d.fence+(a.association_json IS NOT NULL)+(a.state='recovery_required')`;

// Authority and dispatch evidence shared by finished and interrupted foreground work.
// A prepared attempt, foreign grant, terminal no-creation proof or payment belongs to a different path.
const eligible = `SELECT a.id FROM native_checkout_grants g INDEXED BY native_checkout_ongoing_expiry
  CROSS JOIN attempts a ON a.id=g.attempt_id
  CROSS JOIN recovery_work r ON r.attempt_id=a.id
  JOIN guest_access c ON c.capability_hash=g.capability_hash AND c.owner_id=a.owner_id
  JOIN checkout_payment_routes p ON p.attempt_id=a.id AND p.route='hitpay'
  JOIN dispatches d ON d.attempt_id=a.id AND d.operation='booking.create'
  WHERE g.ongoing=1 AND g.expires_ms>? AND g.intent_hash=a.intent_hash AND a.deadline_ms>?
  AND r.state IN ('due','claimed') AND (r.reason='creation_lookup' OR (r.reason='interrupted' AND r.state='due' AND r.tries=0))
  AND ((a.association_json IS NULL AND d.outcome='unknown') OR
    (a.association_json IS NOT NULL AND d.outcome='observed' AND
      (SELECT count(*) FROM session_effects k WHERE k.attempt_id=a.id AND
        (k.step='native-booking-key' OR k.step GLOB 'native-booking-key:[0-9]*') AND k.outcome='observed' AND k.reference_id IS NOT NULL)
      =json_array_length(a.intent_json,'$.sessions')))
  AND EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND
    ((e.step GLOB 'session:[0-9]*' AND e.outcome='unknown') OR
    ((e.step='native-booking-key' OR e.step GLOB 'native-booking-key:[0-9]*') AND e.outcome='observed' AND e.reference_id IS NOT NULL)))
  AND NOT EXISTS(SELECT 1 FROM no_creation_resolutions n WHERE n.attempt_id=a.id)
  AND NOT EXISTS(SELECT 1 FROM hitpay_holds h WHERE h.attempt_id=a.id)
  AND NOT EXISTS(SELECT 1 FROM hitpay_payments h WHERE h.attempt_id=a.id)`;

/** Find one eligible due attempt for cron to recover after a missed account alarm. */
export async function dueUnknownCreation(env: Env, now: number) {
  if (!ongoingReadbackEnabled(env)) return null;
  return env.STATE.withSession("first-primary")
    .prepare(
      `${eligible} AND ((${foregroundFinished}) OR (${interruptedForeground}))
      AND r.ready_ms<=? ORDER BY r.ready_ms,a.id LIMIT 1`,
    )
    .bind(now, now, now - interruptedDispatchMs, now, now)
    .first<{ id: string }>();
}

/** Arm one original read. Only the serialized account queue may adopt an interrupted foreground job. */
export async function armUnknownCreation(
  env: Env,
  id: string,
  now: number,
  account?: { sql: SqlStorage; instanceId: string },
) {
  if (!ongoingReadbackEnabled(env)) return null;
  const db = env.STATE.withSession("first-primary");
  const arm = db
    .prepare(
      `UPDATE recovery_work SET ready_ms=?,updated_ms=?,reason='creation_lookup'
     WHERE attempt_id=? AND tries=0 AND state='due' AND reason='interrupted'
     AND attempt_id IN (${eligible} AND ${foregroundFinished} AND a.id=?) RETURNING ready_ms`,
    )
    .bind(now, now, id, now, now, id);
  // In-process checkout owns the provider queue for its entire foreground flow. An
  // interrupted instance's last physical write may still own an unexpired slot.
  if (
    !account ||
    account.sql
      .exec(
        `SELECT 1 FROM admissions a INDEXED BY admissions_unfinished
     LEFT JOIN provider_request_admissions t ON t.id=a.id WHERE a.finished=0 AND
     (t.id IS NULL OR (t.read_only=0 AND (t.instance_id=? OR t.expires_ms>?))) LIMIT 1`,
        account.instanceId,
        now,
      )
      .toArray().length
  )
    return arm.first<{ ready_ms: number }>();
  // This transaction only hands possession of a due original dispatch to the
  // read worker. Its outcome, references and payment state remain evidence-driven.
  const [, , armed] = await db.batch([
    db
      .prepare(
        `UPDATE native_checkout_grants SET state='blocked' WHERE attempt_id=? AND
      attempt_id IN (${eligible} AND ${interruptedForeground} AND a.id=?)`,
      )
      .bind(id, now, now, now - interruptedDispatchMs, now, id),
    db
      .prepare(
        "UPDATE attempts SET state='recovery_required',version=version+1 WHERE id=? AND changes()=1",
      )
      .bind(id),
    arm,
  ]);
  return (armed.results[0] as { ready_ms: number } | undefined) ?? null;
}

type Claim = {
  attempt_id: string;
  claimant: string;
  generation: number;
  tries: number;
  attempt_version: number;
};

/** Acquire the original attempt's due read, fencing obsolete deliveries and process restarts. */
export async function claimUnknownCreation(env: Env, id: string, now: number) {
  if (!ongoingReadbackEnabled(env)) return null;
  const db = env.STATE.withSession("first-primary");
  const eligibility = ` AND attempt_id IN (${eligible} AND ${foregroundFinished} AND a.id=?)`;
  const [, claimed] = await db.batch([
    db
      .prepare(
        `UPDATE recovery_work SET state='manual_review',reason='creation_lookup_exhausted',claimant=NULL,attempt_version=NULL,updated_ms=?
      WHERE attempt_id=? AND state='claimed' AND reason='creation_lookup' AND ready_ms<=? AND tries>=?${eligibility}`,
      )
      .bind(now, id, now, maxChecks, now, now, id),
    db
      .prepare(
        `UPDATE recovery_work SET state='claimed',claimant=?,generation=generation+1,tries=tries+1,
      attempt_version=(SELECT version+1 FROM attempts WHERE id=attempt_id),
      ready_ms=(SELECT min(?,a.deadline_ms,g.expires_ms) FROM attempts a JOIN native_checkout_grants g ON g.attempt_id=a.id WHERE a.id=recovery_work.attempt_id),updated_ms=?
      WHERE attempt_id=? AND reason='creation_lookup' AND ready_ms<=? AND tries<?${eligibility}
      RETURNING attempt_id,claimant,generation,tries,attempt_version`,
      )
      .bind(
        crypto.randomUUID(),
        now + claimLeaseMs,
        now,
        id,
        now,
        maxChecks,
        now,
        now,
        id,
      ),
    db
      .prepare(
        "UPDATE attempts SET version=version+1 WHERE id=? AND changes()=1",
      )
      .bind(id),
  ]);
  return claimed.results[0] as Claim | undefined;
}

/** Save a bounded retry or terminal disposition only while the original read still owns its lease. */
export async function finishUnknownCreation(
  env: Env,
  claim: Claim,
  resolved: boolean,
  now: number,
) {
  const db = env.STATE.withSession("first-primary");
  const window = await db
    .prepare(
      `SELECT min(a.deadline_ms,g.expires_ms) AS deadline,r.updated_ms,c.first_empty_ms FROM recovery_work r
      JOIN attempts a ON a.id=r.attempt_id JOIN native_checkout_grants g ON g.attempt_id=a.id AND g.intent_hash=a.intent_hash
      JOIN dispatches d ON d.attempt_id=a.id AND d.operation='booking.create'
      LEFT JOIN native_creation_checks c ON c.attempt_id=a.id AND c.intent_hash=a.intent_hash AND c.dispatch_fence=d.fence
      WHERE r.attempt_id=? AND r.state='claimed' AND r.claimant=? AND r.generation=? AND r.ready_ms>?`,
    )
    .bind(claim.attempt_id, claim.claimant, claim.generation, now)
    .first<{
      deadline: number;
      updated_ms: number;
      first_empty_ms: number | null;
    }>();
  if (!window) return null;
  const firstEmpty = window.first_empty_ms;
  const next =
    firstEmpty !== null && firstEmpty >= window.updated_ms
      ? Math.max(now, firstEmpty + recheckMs)
      : now +
        (claim.tries === 1
          ? recheckMs
          : Math.min(30_000 * 2 ** (claim.tries - 2), 120_000));
  const exhausted = claim.tries >= maxChecks || next >= window.deadline;
  const state = resolved ? "complete" : exhausted ? "manual_review" : "due";
  const reason = resolved
    ? "creation_lookup_resolved"
    : exhausted
      ? "creation_lookup_exhausted"
      : "creation_lookup";
  return db
    .prepare(
      `UPDATE recovery_work SET state=?,reason=?,ready_ms=?,updated_ms=?,claimant=NULL,attempt_version=NULL
      WHERE attempt_id=? AND state='claimed' AND claimant=? AND generation=? AND reason='creation_lookup' AND ready_ms>?
      RETURNING state,ready_ms`,
    )
    .bind(
      state,
      reason,
      next,
      now,
      claim.attempt_id,
      claim.claimant,
      claim.generation,
      now,
    )
    .first<{ state: string; ready_ms: number }>();
}
