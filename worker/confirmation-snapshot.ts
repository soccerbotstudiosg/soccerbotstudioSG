export type StoredAttempt = {
  id: string;
  created_ms: number;
  deadline_ms: number;
  state: string;
  intent_json: string;
  association_json: string | null;
  observation_json: string | null;
};
import type { HitpayRow } from "./hitpay-journal";
import { ApiError } from "./policy";

// Request-local primary snapshot. Never retained across HTTP requests or writes.
/** Build a confirmation snapshot from retained booking evidence. */
export async function confirmationSnapshot(
  env: Env,
  id: string,
  owner: string,
) {
  const row = await env.STATE.withSession("first-primary")
    .prepare(
      `
    SELECT a.id,a.created_ms,a.deadline_ms,a.state,a.intent_json,a.intent_hash,
      a.association_json,a.observation_json,a.confirmation_next_ms,
      CASE WHEN a.association_json IS NOT NULL AND a.state='recovery_required' AND a.observation_json IS NULL AND r.route='hitpay' AND p.attempt_id IS NULL
        THEN EXISTS(SELECT 1 FROM native_checkout_grants g JOIN recovery_work w ON w.attempt_id=g.attempt_id
          WHERE g.attempt_id=a.id AND g.intent_hash=a.intent_hash AND min(g.expires_ms,a.deadline_ms)>?
          AND g.ongoing=1 AND g.state IN ('running','blocked') AND json_type(g.result_json,'$.hostedCheckoutRequested')='true'
          AND w.state IN ('due','claimed') AND w.reason IN ('interrupted','creation_lookup'))
        ELSE 0 END AS recovering_hosted_checkout,
      CASE WHEN d.attempt_id IS NULL THEN NULL ELSE json_object('order_number',d.order_number,'document_number',d.document_number) END AS invoice_document_json,
      r.route,c.booking_created_ms,c.payment_window_ms,c.checking_buffer_ms,c.recovery_buffer_ms,c.confirmation_json,
      (SELECT expires_ms FROM hitpay_holds WHERE attempt_id=a.id) AS hold_expires_ms,
      EXISTS(SELECT 1 FROM recovery_work w WHERE w.attempt_id=a.id AND w.state='manual_review' AND w.reason IN ('native_booking_paid_review','native_booking_cancelled_review','creation_lookup_exhausted')) AS native_creation_review,
      CASE WHEN p.attempt_id IS NULL THEN NULL ELSE json_object(
        'attempt_id',p.attempt_id,'scope_json',p.scope_json,'reference',p.reference,
        'request_id',p.request_id,'checkout_url',p.checkout_url,'expires_ms',p.expires_ms,
        'checkout_expires_ms',p.checkout_expires_ms,
        'created_ms',p.created_ms,'recovery_end_ms',p.recovery_end_ms,
        'state',p.state,'reason',p.reason,'tries',p.tries,'retry_limit',p.retry_limit,
        'ready_ms',p.ready_ms,'generation',p.generation,'paid_ms',p.paid_ms,
        'payment_id',p.payment_id,'external_state',p.external_state,
        'external_reservation',p.external_reservation) END AS payment_json,
      (SELECT availability_json FROM native_checkout_grants WHERE attempt_id=a.id
       UNION ALL SELECT availability_json FROM completed_native_checkout_grants WHERE attempt_id=a.id
       UNION ALL SELECT availability_json FROM expired_native_checkout_grants WHERE attempt_id=a.id) AS availability_json
    FROM attempts a
    LEFT JOIN invoice_documents d ON d.attempt_id=a.id AND d.association_json=a.association_json
    LEFT JOIN checkout_payment_routes r ON r.attempt_id=a.id
    LEFT JOIN hitpay_payments p ON p.attempt_id=a.id
    LEFT JOIN checkout_progress c ON c.attempt_id=a.id
    WHERE a.id=? AND a.owner_id=?
  `,
    )
    .bind(Date.now(), id, owner)
    .first<
      StoredAttempt & {
        recovering_hosted_checkout: number;
        invoice_document_json: string | null;
        intent_hash: string;
        confirmation_next_ms: number;
        route: string | null;
        booking_created_ms: number | null;
        payment_window_ms: number | null;
        checking_buffer_ms: number | null;
        recovery_buffer_ms: number | null;
        hold_expires_ms: number | null;
        confirmation_json: string | null;
        payment_json: string | null;
        native_creation_review: number;
        availability_json: string | null;
      }
    >();
  if (!row) throw new ApiError(404, "attempt_unavailable");
  const payment = row.payment_json
    ? (JSON.parse(row.payment_json) as HitpayRow)
    : null;
  return {
    row,
    payment: {
      route: row.route,
      payment,
      nativeCreationReview: row.native_creation_review === 1,
    },
    deadline:
      row.booking_created_ms === null
        ? row.deadline_ms
        : row.booking_created_ms +
          row.payment_window_ms! +
          row.checking_buffer_ms!,
    proof:
      row.confirmation_json &&
      payment?.paid_ms != null &&
      payment.payment_id &&
      payment.state !== "manual_review" &&
      payment.external_state === "observed"
        ? {
            confirmation_json: row.confirmation_json,
            invoice_document_json: row.invoice_document_json,
            scope_json: payment.scope_json,
          }
        : null,
  };
}
