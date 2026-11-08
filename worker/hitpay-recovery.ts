import { traceId } from "./diagnostics";
import { invoiceNumberSchema } from "../src/domain/provider-references";
import {
  normalizeNativePaymentResponse,
  nativeValidationReason,
} from "./provider-normalization";
import { confirmationStage, confirmationResult } from "./confirmation-tracing";
import { receiptData } from "./receipt-data";
import { providerCredentialName, ApiError, digest, policy } from "./policy";
import {
  HITPAY_LINK_ATTEMPTS,
  hitpayRecoveryEnabled,
  hitpayFailureReason,
  hitpaySetting,
  paymentScopeSchema,
  assertPaymentScope,
} from "./hitpay-contract";
import {
  hitpayClaimStatements,
  type HitpayRow,
  findHitpayRequest,
  paymentRow,
  reopenHitpayReview,
} from "./hitpay-journal";
import { associationSchema, intentSchema } from "./journal";
import {
  readNativeAttempt,
  nativeSignaturesFromSnapshot,
} from "./native-adapter";
import { ProviderSession, type ProviderControl } from "./provider-session";

/** Emit the committed payment-link incident without customer or checkout data. */
async function reportPaymentLinkFailure(id: string) {
  console.log(
    JSON.stringify({
      event: "payment_link_unavailable",
      correlationId: traceId(),
      recoveryKey: await digest(id),
      provider: "hitpay",
      attempts: HITPAY_LINK_ATTEMPTS,
      outcome: "error",
      action: "check_hitpay_manually",
    }),
  );
}

/** Reconcile payment and booking accounting without replaying uncertain effects. */
export async function recoverHitpay(
  env: Env,
  id: string,
  provider: ProviderSession,
  base: ProviderControl,
  schedule?: (readyMs: number) => Promise<void>,
) {
  if (
    !hitpayRecoveryEnabled(env) ||
    policy(env).PROVIDER_ACCESS !== "trusted-reads"
  )
    return;
  confirmationStage("claim");
  const initial = await env.STATE.withSession("first-primary").batch([
    ...hitpayClaimStatements(env, id, Date.now()),
    env.STATE.prepare(
      "SELECT CASE WHEN d.attempt_id IS NULL THEN NULL ELSE json_object('order_number',d.order_number,'document_number',d.document_number) END AS invoice_document_json,a.id,a.created_ms,a.intent_json,a.intent_hash,a.association_json,a.version,h.expires_ms AS hold_expires_ms,c.booking_created_ms,c.payment_window_ms,c.checking_buffer_ms,(SELECT availability_json FROM native_checkout_grants WHERE attempt_id=a.id UNION ALL SELECT availability_json FROM completed_native_checkout_grants WHERE attempt_id=a.id UNION ALL SELECT availability_json FROM expired_native_checkout_grants WHERE attempt_id=a.id) AS availability_json FROM attempts a LEFT JOIN invoice_documents d ON d.attempt_id=a.id AND d.association_json=a.association_json LEFT JOIN hitpay_holds h ON h.attempt_id=a.id LEFT JOIN checkout_progress c ON c.attempt_id=a.id WHERE a.id=?",
    ).bind(id),
    env.STATE.prepare(
      "SELECT step,reference_id FROM session_effects WHERE attempt_id=? AND outcome='observed' AND (step='native-booking-key' OR step GLOB 'native-booking-key:[0-9]*')",
    ).bind(id),
    env.STATE.prepare(
      "SELECT state,ready_ms FROM hitpay_payments WHERE attempt_id=?",
    ).bind(id),
  ]);
  const row = initial[2].results[0] as HitpayRow | undefined;
  if (
    (initial[0].results as { reason: string }[]).some(
      (entry) => entry.reason === "payment_link_unavailable",
    )
  )
    await reportPaymentLinkFailure(id);
  if (!row) {
    const retained = initial[5].results[0] as
      { state: string; ready_ms: number } | undefined;
    if (retained && ["due", "claimed"].includes(retained.state))
      await schedule?.(retained.ready_ms);
    return;
  }
  confirmationResult("pending");
  // The 120-second durable claim is never renewed here. Read-only provider
  // work uses this bounded 90-second lease; each physical call still passes
  // through the account governor. Every financial mutation/publication checks
  // the current generation and unexpired lease in its own D1 statement.
  const end = Math.min(Date.now() + 90000, row.ready_ms);
  let calls = 0;
  const reserve = async () => {
    if (Date.now() >= end) throw new ApiError(409, "hitpay_claim_expired");
    if (++calls > 40) throw new ApiError(503, "hitpay_recovery_budget");
  };
  const diagnoseClaim = async () => {
    if (Date.now() >= end) throw new ApiError(409, "hitpay_claim_expired");
    const current = await paymentRow(env.STATE, id);
    if (
      !current ||
      current.state !== "claimed" ||
      current.generation !== row.generation ||
      current.ready_ms <= Date.now()
    )
      throw new ApiError(409, "hitpay_claim_stale");
  };
  const control: ProviderControl = {
    ...base,
    reserve: async (metadata) => {
      await reserve();
      return base.reserve(metadata);
    },
  };
  let checkingDeadline = row.expires_ms + 300000;
  let releaseDeadline = checkingDeadline;
  let result = "due",
    reason = "verification_pending";
  let linkRecovered = !!row.checkout_url;
  let terminalCommitted = false;
  let accountingTransportEnded = false;
  try {
    const scope = paymentScopeSchema.parse(JSON.parse(row.scope_json));
    await assertPaymentScope(env, scope);
    const attempt = initial[3].results[0] as
      | {
          invoice_document_json: string | null;
          id: string;
          created_ms: number;
          intent_json: string;
          intent_hash: string;
          association_json: string;
          version: number;
          hold_expires_ms: number | null;
          booking_created_ms: number | null;
          payment_window_ms: number | null;
          checking_buffer_ms: number | null;
          availability_json: string | null;
        }
      | undefined;
    if (attempt?.booking_created_ms != null)
      checkingDeadline =
        attempt.booking_created_ms +
        attempt.payment_window_ms! +
        attempt.checking_buffer_ms!;
    releaseDeadline = Math.max(
      checkingDeadline,
      attempt?.hold_expires_ms ?? checkingDeadline,
    );
    if (
      !attempt ||
      attempt.intent_hash !== scope.intentHash ||
      (await digest(attempt.intent_json)) !== scope.intentHash ||
      attempt.association_json !== scope.associationJson
    )
      throw new ApiError(409, "hitpay_scope_mismatch");
    const intent = intentSchema.parse(JSON.parse(attempt.intent_json)),
      refs = associationSchema.parse(JSON.parse(attempt.association_json));
    if (
      intent.customerId !== scope.customerId ||
      intent.totalMinor !== scope.totalMinor ||
      intent.currency !== scope.currency ||
      refs.invoiceId !== scope.invoiceId
    )
      throw new ApiError(409, "hitpay_scope_mismatch");
    confirmationStage("hitpay");
    const verified = await findHitpayRequest(env, row, reserve);
    confirmationStage("payment_evidence");
    if (row.paid_ms !== null && !verified.paymentId)
      throw new ApiError(409, "hitpay_paid_state_changed");
    if (row.payment_id !== null && row.payment_id !== verified.paymentId)
      throw new ApiError(409, "hitpay_payment_identity_changed");
    const paidAtMs = row.paid_ms ?? Date.now();
    const evidence = await env.STATE.prepare(
      "UPDATE hitpay_payments SET request_id=COALESCE(request_id,?),checkout_url=COALESCE(checkout_url,?),checkout_expires_ms=CASE WHEN ? IS NULL THEN checkout_expires_ms ELSE MIN(COALESCE(checkout_expires_ms,?),?) END,paid_ms=COALESCE(paid_ms,?),payment_id=COALESCE(payment_id,?) WHERE attempt_id=? AND state='claimed' AND generation=? AND ready_ms>? AND (payment_id IS NULL OR payment_id=?)",
    )
      .bind(
        verified.id,
        verified.url,
        verified.expiresAtMs,
        verified.expiresAtMs,
        verified.expiresAtMs,
        verified.paymentId ? paidAtMs : null,
        verified.paymentId ?? null,
        id,
        row.generation,
        Date.now(),
        verified.paymentId ?? null,
      )
      .run();
    if (evidence.meta.changes !== 1)
      throw new ApiError(409, "hitpay_claim_stale");
    linkRecovered = true;
    if (!verified.paymentId) {
      if (row.paid_ms !== null)
        throw new ApiError(409, "hitpay_paid_state_changed");
      reason = "payment_pending";
      if (["failed", "expired", "canceled"].includes(verified.status)) {
        // Recheck terminal-looking request states through the fixed grace
        // window; expiry alone is not proof that settlement is impossible.
        result = Date.now() >= releaseDeadline ? "manual_review" : "due";
        reason = "hitpay_payment_" + verified.status;
      }
      if (
        verified.unpaidTerminal &&
        Date.now() >= checkingDeadline &&
        row.external_state === "none" &&
        attempt.hold_expires_ms !== null &&
        verified.expiresAtMs !== null &&
        verified.expiresAtMs <= Date.now()
      ) {
        result = "manual_review";
        reason = "hitpay_unpaid_verified";
      }
      return;
    }
    const secret = hitpaySetting(
      env,
      providerCredentialName(env, "SIGNING_SECRET"),
    );
    if (!secret) throw new ApiError(503, "native_signing_unavailable");
    const signatures = await nativeSignaturesFromSnapshot(
      initial[4].results as { step: string; reference_id: string }[],
      refs,
      secret,
    );
    const read = async () => {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        Math.max(1, end - Date.now()),
      );
      try {
        return (
          await readNativeAttempt({
            parallelSingle: true,
            parallelBatch: true,
            paymentProcessor: scope.externalProcessor,
            scope: {
              attemptId: id,
              companyLogin: scope.companyLogin,
              timezone: "Asia/Singapore",
              intent,
            },
            association: refs,
            signature: async (bookingId) => {
              const signature = signatures.get(bookingId);
              if (!signature)
                throw new ApiError(503, "native_signing_unavailable");
              return signature;
            },
            signal: controller.signal,
            exchange: async (operation, signal) => {
              // Immutable known-ID reads share this run's bounded claim lease;
              // physical admission, provider pacing and cancellation remain per-call.
              // Accounting and publication recheck durable generation in SQL.
              await provider.identity(env, control);
              return provider.nativeRead(env, control, operation, signal);
            },
          })
        ).observation;
      } finally {
        clearTimeout(timer);
        controller.abort();
      }
    };
    confirmationStage("booking_before");
    let observation = await read();
    if (
      observation.bookings.some((b) => b.status !== "confirmed") ||
      !["paid", "unpaid"].includes(observation.invoice.status)
    )
      throw new ApiError(409, "hitpay_paid_booking_invalid");
    if (observation.invoice.status === "paid" && row.external_state === "none")
      throw new ApiError(409, "invoice_already_paid_review");
    const assertLiveHold = () => {
      // On-time payment may reconcile only while the original hold remains live.
      if (
        paidAtMs >= row.expires_ms ||
        Date.now() >= (attempt.hold_expires_ms ?? row.expires_ms) ||
        intent.sessions.some((s) => s.startMs <= Date.now())
      )
        throw new ApiError(409, "hitpay_late_payment_review");
    };
    if (observation.invoice.status !== "paid") {
      const orderNumber = invoiceNumberSchema.safeParse(
        observation.invoice.documentNumber,
      );
      const orderStatement = orderNumber.success
        ? // Preserve the unpaid document before accounting changes its number.
          // An immutable first observation prevents later order numbers replacing it.
          env.STATE.prepare(
            `INSERT OR IGNORE INTO invoice_documents(attempt_id,association_json,order_number,observed_ms)
           SELECT a.id,a.association_json,?,? FROM attempts a JOIN hitpay_payments p ON p.attempt_id=a.id
           WHERE a.id=? AND a.association_json=? AND p.state='claimed' AND p.generation=? AND p.scope_json=? AND p.ready_ms>?`,
          ).bind(
            orderNumber.data,
            Date.now(),
            id,
            scope.associationJson,
            row.generation,
            row.scope_json,
            Date.now(),
          )
        : undefined;
      confirmationStage("accounting");
      assertLiveHold();
      if (row.external_state !== "none") {
        reason = "external_write_unknown";
        return;
      }
      if (
        hitpaySetting(env, "SIMPLYBOOK_EXTERNAL_PAYMENT") !== "sandbox-reviewed"
      )
        throw new ApiError(503, "external_payment_disabled");
      const processor = hitpaySetting(env, "SIMPLYBOOK_EXTERNAL_PROCESSOR");
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(processor))
        throw new ApiError(503, "external_payment_disabled");
      const reserveStatement = env.STATE.prepare(
        "UPDATE hitpay_payments SET external_state='unknown' WHERE attempt_id=? AND state='claimed' AND generation=? AND ready_ms>? AND external_state='none' AND paid_ms IS NOT NULL AND payment_id=? AND scope_json=? AND COALESCE((SELECT expires_ms FROM hitpay_holds WHERE attempt_id=hitpay_payments.attempt_id),expires_ms)>? RETURNING attempt_id",
      ).bind(
        id,
        row.generation,
        Date.now(),
        verified.paymentId,
        row.scope_json,
        Date.now(),
      );
      const reservation = orderStatement
        ? (await env.STATE.batch([orderStatement, reserveStatement]))[1]
            .results[0]
        : await reserveStatement.first();
      if (reservation && orderNumber.success && !attempt.invoice_document_json)
        attempt.invoice_document_json = JSON.stringify({
          order_number: orderNumber.data,
          document_number: null,
        });
      if (!reservation) {
        await diagnoseClaim();
        throw new ApiError(409, "external_payment_reserved");
      }
      // Transport success alone is not evidence; an unknown write is never replayed.
      const recorded = await provider.nativeWrite(
        env,
        control,
        {
          kind: "invoice-external-payment",
          invoiceId: refs.invoiceId,
          processor,
        },
        async () => {
          if (Date.now() >= end)
            throw new ApiError(409, "hitpay_claim_expired");
          assertLiveHold();
        },
        async (reservationId) => {
          const stored = await env.STATE.prepare(
            "UPDATE hitpay_payments SET external_reservation=? WHERE attempt_id=? AND state='claimed' AND generation=? AND ready_ms>? AND external_state='unknown' AND external_reservation IS NULL AND COALESCE((SELECT expires_ms FROM hitpay_holds WHERE attempt_id=hitpay_payments.attempt_id),expires_ms)>? RETURNING attempt_id",
          )
            .bind(reservationId, id, row.generation, Date.now(), Date.now())
            .first();
          if (!stored) {
            await diagnoseClaim();
            throw new ApiError(409, "external_payment_reserved");
          }
        },
      );
      // A returned transport has already durably finished its DO admission.
      // Older unknown-write recoveries must retain the release-before-terminal path.
      accountingTransportEnded = true;
      // A complete paid invoice response already includes current booking evidence.
      // Missing or inconsistent bodies retain the authoritative readback path.
      try {
        observation = normalizeNativePaymentResponse(
          recorded.body,
          {
            attemptId: id,
            companyLogin: scope.companyLogin,
            timezone: "Asia/Singapore",
            intent,
            association: refs,
            paymentProcessor: scope.externalProcessor,
            bookingObservedAtMs: recorded.receivedAtMs,
            invoiceObservedAtMs: recorded.receivedAtMs,
          },
          observation,
        );
      } catch (error) {
        if (!nativeValidationReason(error)) throw error;
        confirmationStage("booking_after");
        observation = await read();
      }
    }
    if (
      observation.invoice.status !== "paid" ||
      observation.bookings.some((b) => b.status !== "confirmed")
    ) {
      reason = "payment_received_booking_pending";
      return;
    }
    confirmationStage("publish");
    if (Date.now() >= end) throw new ApiError(409, "hitpay_claim_expired");
    const observedAt = Date.now();
    let confirmationJson: string | undefined;
    if (
      attempt.hold_expires_ms !== null &&
      attempt.booking_created_ms !== null
    ) {
      const receipt = await receiptData(
        env,
        { ...attempt, observation_json: JSON.stringify(observation) },
        observedAt,
      );
      if (!receipt.sessions.some((session) => session.startMs <= Date.now()))
        confirmationJson = JSON.stringify(receipt);
    }
    const statements = [
      env.STATE.prepare(
        "UPDATE attempts SET observation_json=?,observation_ms=?,version=version+1,state='observed' WHERE id=? AND version=? AND association_json=? AND intent_hash=? AND state IN ('dispatching','observed','recovery_required') AND (observation_ms IS NULL OR observation_ms<?) AND EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=attempts.id AND p.state='claimed' AND p.generation=? AND p.ready_ms>? AND p.paid_ms IS NOT NULL AND p.payment_id=?)",
      ).bind(
        JSON.stringify(observation),
        observedAt,
        id,
        attempt.version,
        attempt.association_json,
        scope.intentHash,
        observedAt,
        row.generation,
        observedAt,
        verified.paymentId,
      ),
      env.STATE.prepare(
        "UPDATE hitpay_payments SET external_state='observed' WHERE attempt_id=? AND state='claimed' AND generation=? AND ready_ms>? AND changes()=1 RETURNING external_reservation",
      ).bind(id, row.generation, observedAt),
      ...(confirmationJson === undefined
        ? []
        : [
            env.STATE.prepare(
              "UPDATE checkout_progress SET confirmation_json=COALESCE(confirmation_json,?) WHERE attempt_id=? AND changes()=1 AND EXISTS(SELECT 1 FROM attempts a JOIN hitpay_holds h ON h.attempt_id=a.id JOIN hitpay_payments p ON p.attempt_id=a.id WHERE a.id=checkout_progress.attempt_id AND a.state='observed' AND a.intent_hash=h.intent_hash AND a.association_json=h.association_json AND p.state='claimed' AND p.generation=? AND p.paid_ms IS NOT NULL AND p.payment_id IS NOT NULL AND p.external_state='observed')",
            ).bind(confirmationJson, id, row.generation),
          ]),
      ...(accountingTransportEnded
        ? [
            env.STATE.prepare(
              "UPDATE hitpay_payments SET state='complete',reason='verified',ready_ms=? WHERE attempt_id=? AND state='claimed' AND generation=? AND changes()=1",
            ).bind(observedAt + 90000, id, row.generation),
          ]
        : []),
    ];
    // Each predicate is chained inside one primary transaction. Provider writes
    // remain separately reserved; success requires current paid booking evidence.
    const published =
      await env.STATE.withSession("first-primary").batch(statements);
    if (published.some((entry) => entry.meta.changes !== 1)) {
      await diagnoseClaim();
      throw new ApiError(409, "stale_completion");
    }
    terminalCommitted = accountingTransportEnded;
    const retained = published[1].results[0] as {
      external_reservation: string | null;
    };
    if (retained.external_reservation && !accountingTransportEnded)
      base.reconciled?.(retained.external_reservation, id);
    result = "complete";
    reason = "verified";
  } catch (error) {
    reason = hitpayFailureReason(error);
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      ![
        "hitpay_creation_unresolved",
        "hitpay_claim_expired",
        "hitpay_claim_stale",
      ].includes(error.code)
    )
      result = "manual_review";
  } finally {
    confirmationStage("commit");
    if (
      result === "due" &&
      (row.tries >= row.retry_limit || Date.now() >= row.recovery_end_ms)
    ) {
      result = "manual_review";
      reason = "recovery_exhausted";
    }
    if (
      result === "due" &&
      !linkRecovered &&
      row.request_id === null &&
      row.paid_ms === null &&
      row.tries >= HITPAY_LINK_ATTEMPTS - 1
    ) {
      result = "manual_review";
      reason = "payment_link_unavailable";
    }
    // Commit the terminal decision and the pending-receipt wake-up together.
    // If storage fails, the retained claim lease remains reclaimable by cron.
    if (!terminalCommitted) {
      const committed = await env.STATE.batch([
        env.STATE.prepare(
          "UPDATE hitpay_payments SET state=?,reason=?,ready_ms=? WHERE attempt_id=? AND state='claimed' AND generation=? RETURNING state,ready_ms",
        ).bind(
          result,
          reason,
          Date.now() < checkingDeadline
            ? Math.min(checkingDeadline, Date.now() + 90000)
            : Date.now() < releaseDeadline
              ? Math.min(releaseDeadline, Date.now() + 90000)
              : Date.now() +
                Math.min(3600000, 90000 * 2 ** Math.min(row.tries - 1, 6)),
          id,
          row.generation,
        ),
        reopenHitpayReview(env.STATE, id, Date.now()),
      ]);
      const retained = committed[0].results[0] as
        { state: string; ready_ms: number } | undefined;
      if (
        retained?.state === "manual_review" &&
        reason === "payment_link_unavailable"
      )
        await reportPaymentLinkFailure(id);
      if (retained?.state === "due") {
        console.log(
          JSON.stringify({
            event: "payment_recovery_retry",
            reason,
            readyAtMs: retained.ready_ms,
            generation: row.generation,
          }),
        );
        await schedule?.(retained.ready_ms);
      }
    }
    confirmationResult(
      result === "complete"
        ? "complete"
        : result === "manual_review"
          ? "manual_review"
          : "pending",
    );
  }
}
