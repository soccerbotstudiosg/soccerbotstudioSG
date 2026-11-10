import { retainedCreationResolution } from "./native-creation-resolution";
import { preparationRejectionContext } from "./checkout-preparation-rejection";
import { confirmationSnapshot } from "./confirmation-snapshot";
import { customerConfirmation, checkoutExpired } from "./checkout-progress";
import {
  storedHitpayCheckout,
  recordedHitpayPayment,
  hitpayConfirmationGuard,
} from "./hitpay-journal";
import {
  START_INTERVAL_MINUTES,
  SESSION_MINUTES,
} from "../src/domain/booking-policy";
import { receiptData, bookingDetailsData } from "./receipt-data";
import { storedNativeCheckout } from "./native-adapter";
import {
  verifyConfirmation,
  verifyRecordedConfirmation,
} from "../src/domain/confirmation";
import { authenticate, type Access } from "./access";
import { intentSchema, associationSchema } from "./journal";
import { ApiError, policy, liveCustomerAccess } from "./policy";
import { checkoutSelectionRejectionSchema } from "../src/domain/native-checkout";
export type { StoredAttempt } from "./confirmation-snapshot";
import type { StoredAttempt } from "./confirmation-snapshot";
export type CheckingWindow = {
  deadlineMs: number;
  nextCheckMs: number;
  remaining: number;
};
/** Recover an exact owned rejection only while every effect boundary is absent. */
async function retainedSelectionRejection(env: Env, id: string, owner: string) {
  const row = await env.STATE.withSession("first-primary")
    .prepare(
      `SELECT g.result_json,a.intent_json FROM attempts a JOIN (
        SELECT attempt_id,state,result_json,intent_hash FROM native_checkout_grants
        UNION ALL
        SELECT attempt_id,state,result_json,intent_hash FROM rejected_native_checkout_grants
      ) g ON g.attempt_id=a.id
      WHERE a.id=? AND a.owner_id=? AND a.state='prepared'
        AND a.association_json IS NULL AND a.observation_json IS NULL
        AND g.state='blocked' AND g.intent_hash=a.intent_hash
        AND NOT EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=a.id)
        AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id)
        AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id)
        AND NOT EXISTS(SELECT 1 FROM hitpay_holds h WHERE h.attempt_id=a.id)
      LIMIT 1`,
    )
    .bind(id, owner)
    .first<{ result_json: string | null; intent_json: string }>();
  if (!row?.result_json) return undefined;
  const result = JSON.parse(row.result_json);
  if (result?.paymentAvailable !== false) return undefined;
  const parsed = checkoutSelectionRejectionSchema.safeParse({
    state: result?.state,
    rejectedSessionIndex: result?.rejectedSessionIndex,
  });
  if (!parsed.success) return undefined;
  const intent = intentSchema.parse(JSON.parse(row.intent_json));
  if (
    parsed.data.rejectedSessionIndex !== undefined &&
    parsed.data.rejectedSessionIndex >= intent.sessions.length
  )
    return undefined;
  return parsed.data;
}
/** Resolve protected confirmation from retained and reconciled evidence. */
export async function confirmation(
  request: Request,
  env: Env,
  id: string,
  now: number,
  report?: (window: CheckingWindow) => void,
) {
  const access = await authenticate(request, env, now);
  let snapshot = await confirmationSnapshot(env, id, access.owner_id);
  let row = snapshot.row;
  row.deadline_ms = snapshot.deadline;
  const creationResolution =
    !row.association_json && row.state === "recovery_required"
      ? await retainedCreationResolution(env, id, access.owner_id)
      : undefined;
  if (creationResolution) {
    await authenticate(request, env, Date.now());
    report?.({ deadlineMs: row.deadline_ms, nextCheckMs: now, remaining: 0 });
    return {
      status: "invalid" as const,
      reason: "booking_not_created",
      creationResolution,
    };
  }
  const rejection =
    row.state === "prepared" && !row.association_json
      ? await retainedSelectionRejection(env, id, access.owner_id)
      : undefined;
  if (rejection) {
    await authenticate(request, env, Date.now());
    report?.({ deadlineMs: row.deadline_ms, nextCheckMs: now, remaining: 0 });
    return {
      status: "invalid" as const,
      reason: "checkout_selection_rejected",
      selectionRejection: rejection,
    };
  }
  // D1 may return evidence committed after this HTTP request began.
  // Evaluate against the current clock, never against the evidence timestamp.
  now = Math.max(now, Date.now());
  const p = policy(env);
  if (now >= row.deadline_ms) {
    report?.({ deadlineMs: row.deadline_ms, nextCheckMs: now, remaining: 0 });
    // The deadline ends checking, not the validity of fresh authoritative proof.
    // Preserve the shared booking/money/paid decision without reopening polls.
    const guard = await hitpayConfirmationGuard(env, id, snapshot.payment);
    if (!guard) {
      const decision = decideStoredConfirmation(row, access, now, p);
      return decision.status === "confirmed"
        ? {
            ...decision,
            customerConfirmation: await customerConfirmation(
              env,
              id,
              snapshot.proof,
            ),
          }
        : decision;
    }
    return {
      ...guard,
      customerConfirmation: await customerConfirmation(env, id, snapshot.proof),
      expired: await checkoutExpired(env, id, now),
    };
  }
  const quota = await env.STATE.prepare(
    "UPDATE attempts SET confirmation_next_ms=? + CASE WHEN confirmation_checks<20 THEN ? ELSE ? END,confirmation_checks=confirmation_checks+1 WHERE id=? AND owner_id=? AND confirmation_next_ms<=? AND confirmation_checks<120 RETURNING confirmation_next_ms,confirmation_checks",
  )
    .bind(
      now,
      liveCustomerAccess(env) ? 2000 : p.POLL_INTERVAL_MS,
      liveCustomerAccess(env)
        ? Math.max(p.POLL_INTERVAL_MS, 10000)
        : p.POLL_INTERVAL_MS,
      row.id,
      access.owner_id,
      now,
    )
    .first<{ confirmation_next_ms: number; confirmation_checks: number }>();
  if (!quota) {
    const saved = await env.STATE.withSession("first-primary")
      .prepare(
        "SELECT confirmation_next_ms,confirmation_checks FROM attempts WHERE id=? AND owner_id=?",
      )
      .bind(row.id, access.owner_id)
      .first<{ confirmation_next_ms: number; confirmation_checks: number }>();
    report?.({
      deadlineMs: row.deadline_ms,
      nextCheckMs: saved?.confirmation_next_ms ?? now + p.POLL_INTERVAL_MS,
      remaining: Math.max(0, 120 - (saved?.confirmation_checks ?? 120)),
    });
    throw new ApiError(
      429,
      saved && saved.confirmation_checks < 120
        ? "checking_throttled"
        : "checking_limit_reached",
    );
  }
  report?.({
    deadlineMs: row.deadline_ms,
    nextCheckMs: quota.confirmation_next_ms,
    remaining: 120 - quota.confirmation_checks,
  });
  // Admission is a write boundary: re-read current evidence after it. An
  // intervening manual-review decision must supersede the initial snapshot.
  snapshot = await confirmationSnapshot(env, id, access.owner_id);
  row = snapshot.row;
  row.deadline_ms = snapshot.deadline;
  now = Math.max(now, Date.now());
  const guard = await hitpayConfirmationGuard(env, id, snapshot.payment);
  if (guard)
    return {
      ...guard,
      customerConfirmation: await customerConfirmation(env, id, snapshot.proof),
      expired: await checkoutExpired(env, id, now),
    };
  const decision = decideStoredConfirmation(row, access, now, p);
  if (decision.reason === "stale_observation") {
    // A completed payment is not permanently fresh booking evidence. Reuse the
    // original bounded financial claim; never reset its tries or expiry.
    const queued = await env.STATE.prepare(
      "UPDATE hitpay_payments SET state='due',reason='booking_refresh_pending',ready_ms=? WHERE attempt_id=? AND state='complete' AND paid_ms IS NOT NULL AND external_state='observed' AND tries<retry_limit AND recovery_end_ms>? RETURNING attempt_id",
    )
      .bind(now, id, now)
      .first();
    if (queued)
      return { status: "pending", reason: "payment_received_booking_pending" };
  }
  return decision.status === "confirmed"
    ? {
        ...decision,
        customerConfirmation: await customerConfirmation(
          env,
          id,
          snapshot.proof,
        ),
      }
    : decision;
}
// Shared decision mapping. Caller supplies independently established authority:
// authenticated customer access, or a current bounded internal recovery claim.
/** Evaluate retained confirmation evidence without trusting browser claims. */
export function decideStoredConfirmation(
  row: StoredAttempt,
  access: Access,
  now: number,
  p: ReturnType<typeof policy>,
  recordedAtMs?: number,
) {
  if (!row.association_json || !row.observation_json)
    return {
      status: now >= row.deadline_ms ? "unresolved" : "pending",
      reason:
        row.state === "recovery_required"
          ? "recovery_required"
          : now >= row.deadline_ms
            ? "verification_window_elapsed"
            : "missing_evidence",
      pollAfterMs: p.POLL_INTERVAL_MS,
    };
  const intent = intentSchema.parse(JSON.parse(row.intent_json)),
    refs = associationSchema.parse(JSON.parse(row.association_json));
  const stored: unknown = JSON.parse(row.observation_json);
  if (
    refs.bookingIds.length !== intent.sessions.length ||
    !stored ||
    typeof stored !== "object" ||
    !("bookings" in stored) ||
    !("invoice" in stored)
  )
    return { status: "unresolved", reason: "invalid_input" };
  const scope = {
      accountId: intent.accountId,
      environmentId: intent.environmentId,
      attemptId: row.id,
    },
    subject = { kind: "guest", id: access.owner_id };
  const attempt = {
    ...scope,
    subject,
    customerId: intent.customerId,
    approvedAtMs: row.created_ms,
    invoiceId: refs.invoiceId,
    money: {
      currency: intent.currency,
      totalMinor: intent.totalMinor,
      taxMinor: intent.taxMinor,
    },
    bookings: intent.sessions.map((s, i) => ({
      session: {
        bookingId: refs.bookingIds[i],
        serviceId: s.serviceId,
        instructorId: s.instructorId,
        startMs: s.startMs,
        playEndMs: s.startMs + SESSION_MINUTES * 60000,
        occupiedStartMs: s.startMs,
        occupiedEndMs: s.startMs + START_INTERVAL_MINUTES * 60000,
      },
      money: {
        currency: intent.currency,
        totalMinor: s.totalMinor,
        taxMinor: s.taxMinor,
      },
    })),
  };
  const input = {
    nowMs: now,
    policy: {
      maxObservationAgeMs: p.OBSERVATION_MAX_AGE_MS,
      verificationDeadlineMs: row.deadline_ms,
    },
    attempt,
    access: {
      ...scope,
      subject,
      permission: "confirmation:read",
      validFromMs: access.issued_ms,
      expiresAtMs: access.expires_ms,
    },
    bookings: stored.bookings,
    invoice: stored.invoice,
  };
  return recordedAtMs === undefined
    ? verifyConfirmation(input)
    : verifyRecordedConfirmation(input, recordedAtMs);
}

// A protected context/read boundary, not an invented native preparation method.
/** Build protected checkout context for handoff and recovery presentation. */
export async function checkoutContext(
  request: Request,
  env: Env,
  id: string,
  now: number,
) {
  const access = await authenticate(request, env, now);
  let snapshot;
  try {
    snapshot = await confirmationSnapshot(env, id, access.owner_id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const rejection = await preparationRejectionContext(
        request,
        env,
        id,
        access,
      );
      if (rejection) return rejection;
    }
    throw error;
  }
  const row = snapshot.row;
  const intent = intentSchema.parse(JSON.parse(row.intent_json));
  const creationResolution =
    !row.association_json && row.state === "recovery_required"
      ? await retainedCreationResolution(env, id, access.owner_id)
      : undefined;
  const selectionRejection =
    row.state === "prepared" && !row.association_json
      ? await retainedSelectionRejection(env, id, access.owner_id)
      : undefined;
  const hitpayCheckout = await storedHitpayCheckout(
    env,
    id,
    now,
    snapshot.payment,
  );
  const payment =
    hitpayCheckout === null
      ? undefined
      : await recordedHitpayPayment(
          env,
          id,
          row.intent_hash,
          row.association_json,
          row.intent_json,
          snapshot.payment.payment,
        );
  let savedConfirmation;
  if (payment && row.observation_json) {
    const evidence = JSON.parse(row.observation_json);
    const times = [
      evidence.invoice?.observedAtMs,
      ...(Array.isArray(evidence.bookings)
        ? evidence.bookings.map(
            (booking: { observedAtMs?: number }) => booking.observedAtMs,
          )
        : []),
    ];
    const recordedAt = times.every(Number.isSafeInteger)
      ? Math.max(...times)
      : NaN;
    if (
      decideStoredConfirmation(
        row,
        access,
        Math.max(now, Date.now()),
        policy(env),
        recordedAt,
      ).status === "confirmed"
    )
      try {
        savedConfirmation = await receiptData(env, row, recordedAt);
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "receipt_details_unavailable"
        )
          throw error;
      }
  }
  let details;
  if (
    request.headers.get("X-Booking-Details") === "1" &&
    !savedConfirmation &&
    row.association_json
  ) {
    try {
      details = await bookingDetailsData(env, row);
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        error.code !== "receipt_details_unavailable"
      )
        throw error;
    }
  }
  // This display-only deadline never shortens the protected reconciliation windows.
  const paymentWindows =
    row.association_json &&
    snapshot.payment.route === "hitpay" &&
    (row.hold_expires_ms !== null || snapshot.payment.payment !== null)
      ? [
          snapshot.payment.payment?.expires_ms,
          snapshot.payment.payment?.checkout_expires_ms,
          row.booking_created_ms !== null && row.payment_window_ms !== null
            ? row.booking_created_ms + row.payment_window_ms
            : undefined,
        ].filter(
          (value): value is number =>
            typeof value === "number" &&
            Number.isSafeInteger(value) &&
            value > 0,
        )
      : [];
  const paymentExpiresAtMs = paymentWindows.length
    ? Math.min(...paymentWindows)
    : undefined;
  await authenticate(request, env, Date.now());
  return {
    attemptId: id,
    mode: "live" as const,
    selectionRejection,
    creationResolution,
    payment,
    confirmation: savedConfirmation,
    details,
    ...(!creationResolution &&
    row.state === "recovery_required" &&
    !row.association_json &&
    !snapshot.payment.payment
      ? { bookingIssue: "incomplete" as const }
      : {}),
    ...(snapshot.payment.payment &&
    !snapshot.payment.payment.request_id &&
    !snapshot.payment.payment.checkout_url &&
    snapshot.payment.payment.paid_ms === null &&
    snapshot.payment.payment.payment_id === null &&
    (["due", "claimed"].includes(snapshot.payment.payment.state) ||
      snapshot.payment.payment.reason === "payment_link_unavailable")
      ? {
          paymentIssue:
            snapshot.payment.payment.state === "manual_review"
              ? ("link_unavailable" as const)
              : ("link_recovering" as const),
        }
      : {}),
    customerConfirmation:
      hitpayCheckout === null
        ? undefined
        : await customerConfirmation(env, id, snapshot.proof),
    expired:
      hitpayCheckout === null ? undefined : await checkoutExpired(env, id, now),
    checkout:
      hitpayCheckout ??
      (row.association_json &&
      row.deadline_ms > now &&
      String(env.PROVIDER_ACCESS) === "trusted-reads"
        ? await storedNativeCheckout(
            env.STATE,
            id,
            JSON.parse(row.association_json),
            now,
          )
        : { state: "unavailable" as const }),
    summary: {
      players: intent.sessions[0].players,
      totalMinor: intent.totalMinor,
      currency: intent.currency,
      sessions: intent.sessions.map((s) => ({
        startMs: s.startMs,
        players: s.players,
      })),
    },
    checking: {
      deadlineMs: snapshot.deadline,
      ...(paymentExpiresAtMs === undefined ? {} : { paymentExpiresAtMs }),
      ...(row.hold_expires_ms === null
        ? {}
        : {
            holdExpiresAtMs: row.hold_expires_ms,
            ...(row.booking_created_ms !== null && row.recovery_buffer_ms
              ? {
                  recoveryEndsAtMs: Math.max(
                    row.hold_expires_ms,
                    snapshot.deadline + row.recovery_buffer_ms,
                  ),
                }
              : {}),
          }),
      nextCheckMs: row.confirmation_next_ms,
      pollAfterMs: policy(env).POLL_INTERVAL_MS,
    },
  };
}
