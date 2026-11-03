import { hitpayConfirmationGuard } from "./hitpay-journal";
import { authenticate } from "./access";
import { ApiError, policy } from "./policy";
import { decideStoredConfirmation } from "./confirmation";
import { confirmationSnapshot } from "./confirmation-snapshot";
import { receiptData } from "./receipt-data";

type ReceiptSnapshot = Awaited<ReturnType<typeof confirmationSnapshot>>;
export type ReceiptRefresh = (
  snapshot: ReceiptSnapshot,
  signal: AbortSignal,
) => Promise<unknown>;

/** Authorize receipt access with an optional bounded, read-only evidence refresh. */
export async function bookingReceipt(
  request: Request,
  env: Env,
  id: string,
  now: number,
  refresh?: ReceiptRefresh,
) {
  let access = await authenticate(request, env, now);
  let snapshot = await confirmationSnapshot(env, id, access.owner_id);
  let row = { ...snapshot.row, deadline_ms: snapshot.deadline };
  now = Math.max(now, Date.now());
  const p = policy(env);
  if (await hitpayConfirmationGuard(env, id, snapshot.payment))
    throw new ApiError(409, "receipt_not_verified");
  let decision = decideStoredConfirmation(row, access, now, p);
  if (
    refresh &&
    (decision.reason === "stale_observation" || decision.status === "confirmed")
  ) {
    // Refresh only existing evidence within the original checking window.
    // Share its durable quota; never reopen financial recovery or extend time.
    if (now >= snapshot.deadline)
      throw new ApiError(409, "receipt_verification_expired");
    const quota = await env.STATE.prepare(
      "UPDATE attempts SET confirmation_next_ms=?,confirmation_checks=confirmation_checks+1 WHERE id=? AND owner_id=? AND confirmation_next_ms<=? AND confirmation_checks<120 RETURNING id",
    )
      .bind(now + Math.max(10000, p.POLL_INTERVAL_MS), id, access.owner_id, now)
      .first();
    if (!quota) throw new ApiError(429, "checking_throttled");
    const original = snapshot;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      Math.min(15000, snapshot.deadline - now),
    );
    let observation: unknown;
    try {
      observation = await refresh(snapshot, controller.signal);
      controller.signal.throwIfAborted();
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
    now = Date.now();
    access = await authenticate(request, env, now);
    snapshot = await confirmationSnapshot(env, id, access.owner_id);
    if (
      now >= snapshot.deadline ||
      snapshot.deadline !== original.deadline ||
      snapshot.row.intent_json !== original.row.intent_json ||
      snapshot.row.association_json !== original.row.association_json ||
      snapshot.row.observation_json !== original.row.observation_json ||
      snapshot.row.state !== original.row.state ||
      snapshot.row.payment_json !== original.row.payment_json ||
      (await hitpayConfirmationGuard(env, id, snapshot.payment))
    )
      throw new ApiError(409, "receipt_not_verified");
    // Response-local proof only: do not overwrite the payment/booking journal.
    row = {
      ...snapshot.row,
      deadline_ms: snapshot.deadline,
      observation_json: JSON.stringify(observation),
    };
    decision = decideStoredConfirmation(row, access, now, p);
  }
  if (decision.status !== "confirmed")
    throw new ApiError(409, "receipt_not_verified");
  const receipt = await receiptData(env, row, now);
  const number = receipt.providerReferences?.invoiceNumber;
  // Keep late display metadata separate from the immutable saved confirmation.
  // CAS every proof/scope input and access; this cannot change financial state.
  const save =
    refresh && number
      ? env.STATE.prepare(
          `UPDATE invoice_documents SET document_number=?,observed_ms=?
     WHERE attempt_id=? AND association_json=? AND EXISTS(
       SELECT 1 FROM attempts a WHERE a.id=invoice_documents.attempt_id
         AND a.owner_id=? AND a.association_json=? AND a.observation_json=? AND a.state=?
         AND EXISTS(SELECT 1 FROM guest_access g WHERE g.capability_hash=? AND g.revoked_ms IS NULL AND g.expires_ms>?)
         AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id AND (p.state='manual_review' OR p.external_state!='observed'))
     )`,
        ).bind(
          number,
          now,
          id,
          snapshot.row.association_json,
          access.owner_id,
          snapshot.row.association_json,
          snapshot.row.observation_json,
          snapshot.row.state,
          access.capability_hash,
          Date.now(),
        )
      : undefined;
  await authenticate(request, env, Date.now(), save ? [save] : []);
  return receipt;
}
