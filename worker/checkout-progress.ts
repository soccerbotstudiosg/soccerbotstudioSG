import { retainedInvoiceNumber } from "./invoice-document";
import { authenticate } from "./access";
import { ApiError, digest } from "./policy";
import { receiptSchema } from "../src/domain/native-checkout";
import { assertPaymentScope, paymentScopeSchema } from "./hitpay-contract";
import { receiptData } from "./receipt-data";
import type { HitpayRow } from "./hitpay-journal";

// Customer success requires current booking and paid invoice readback.
// Historical snapshots from the early-payment design are not sufficient.
/** Retain validated customer confirmation without renewing its original timestamp. */
export async function retainCustomerConfirmation(
  env: Env,
  payment: HitpayRow,
  now: number,
) {
  const row = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT CASE WHEN d.attempt_id IS NULL THEN NULL ELSE json_object('order_number',d.order_number,'document_number',d.document_number) END AS invoice_document_json,a.id,a.created_ms,a.intent_json,a.association_json,a.observation_json,a.intent_hash,h.expires_ms,(SELECT availability_json FROM native_checkout_grants WHERE attempt_id=a.id UNION ALL SELECT availability_json FROM completed_native_checkout_grants WHERE attempt_id=a.id UNION ALL SELECT availability_json FROM expired_native_checkout_grants WHERE attempt_id=a.id) AS availability_json FROM attempts a LEFT JOIN invoice_documents d ON d.attempt_id=a.id AND d.association_json=a.association_json JOIN hitpay_holds h ON h.attempt_id=a.id JOIN checkout_progress c ON c.attempt_id=a.id WHERE a.id=? AND a.state='observed' AND a.intent_hash=h.intent_hash AND a.association_json=h.association_json",
    )
    .bind(payment.attempt_id)
    .first<{
      invoice_document_json: string | null;
      id: string;
      created_ms: number;
      intent_json: string;
      association_json: string;
      observation_json: string | null;
      intent_hash: string;
      expires_ms: number;
      availability_json: string | null;
    }>();
  if (!row) return;
  const scope = paymentScopeSchema.parse(JSON.parse(payment.scope_json));
  await assertPaymentScope(env, scope);
  if (
    scope.intentHash !== row.intent_hash ||
    scope.associationJson !== row.association_json ||
    (await digest(row.intent_json)) !== row.intent_hash
  )
    throw new ApiError(409, "hitpay_scope_mismatch");
  const receipt = await receiptData(env, row, now);
  if (receipt.sessions.some((s) => s.startMs <= Date.now())) return;
  await env.STATE.prepare(
    "UPDATE checkout_progress SET confirmation_json=? WHERE attempt_id=? AND confirmation_json IS NULL AND EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=checkout_progress.attempt_id AND p.state='claimed' AND p.generation=? AND p.paid_ms IS NOT NULL AND p.payment_id IS NOT NULL AND p.external_state='observed')",
  )
    .bind(JSON.stringify(receipt), row.id, payment.generation)
    .run();
}

/** Read the retained confirmation for the authorized attempt. */
export async function customerConfirmation(
  env: Env,
  id: string,
  snapshot?: {
    confirmation_json: string;
    scope_json: string;
    invoice_document_json?: string | null;
  } | null,
) {
  const row =
    snapshot === undefined
      ? await env.STATE.withSession("first-primary")
          .prepare(
            "SELECT CASE WHEN d.attempt_id IS NULL THEN NULL ELSE json_object('order_number',d.order_number,'document_number',d.document_number) END AS invoice_document_json,c.confirmation_json,p.scope_json FROM checkout_progress c JOIN hitpay_payments p ON p.attempt_id=c.attempt_id LEFT JOIN invoice_documents d ON d.attempt_id=c.attempt_id AND d.association_json=json_extract(p.scope_json,'$.associationJson') WHERE c.attempt_id=? AND c.confirmation_json IS NOT NULL AND p.paid_ms IS NOT NULL AND p.payment_id IS NOT NULL AND p.state!='manual_review' AND p.external_state='observed'",
          )
          .bind(id)
          .first<{
            confirmation_json: string;
            scope_json: string;
            invoice_document_json: string | null;
          }>()
      : snapshot;
  if (!row) return undefined;
  await assertPaymentScope(
    env,
    paymentScopeSchema.parse(JSON.parse(row.scope_json)),
  );
  const receipt = receiptSchema.parse(JSON.parse(row.confirmation_json));
  const scope = paymentScopeSchema.parse(JSON.parse(row.scope_json));
  if (receipt.providerReferences) {
    const number = await retainedInvoiceNumber(
      env,
      id,
      scope.associationJson,
      receipt.providerReferences.invoiceNumber,
      row.invoice_document_json,
    );
    if (number) receipt.providerReferences.invoiceNumber = number;
    else delete receipt.providerReferences.invoiceNumber;
  }
  return receipt;
}

// Time alone is not proof of non-payment.
// Dispatched requests require authenticated terminal evidence with an explicit
// empty or strictly verified unstarted payment list. Unprocessed receipts revoke
// eligibility until reconciled.
const unpaidExpiry = `EXISTS(SELECT 1 FROM hitpay_holds h JOIN checkout_progress c ON c.attempt_id=h.attempt_id WHERE h.attempt_id=native_checkout_grants.attempt_id AND MAX(c.booking_created_ms+c.payment_window_ms+c.checking_buffer_ms,h.expires_ms)<=?) AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=native_checkout_grants.attempt_id AND NOT (p.state='manual_review' AND p.reason='hitpay_unpaid_verified' AND p.paid_ms IS NULL AND p.payment_id IS NULL AND p.external_state='none' AND NOT EXISTS(SELECT 1 FROM hitpay_receipts r WHERE r.attempt_id=p.attempt_id AND r.rowid>p.receipt_checkpoint)))`;

/** Derive the checking deadline from retained checkout timing. */
export async function checkoutCheckingDeadline(
  env: Env,
  id: string,
  fallback: number,
) {
  const progress = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT booking_created_ms,payment_window_ms,checking_buffer_ms FROM checkout_progress WHERE attempt_id=?",
    )
    .bind(id)
    .first<{
      booking_created_ms: number;
      payment_window_ms: number;
      checking_buffer_ms: number;
    }>();
  return progress
    ? progress.booking_created_ms +
        progress.payment_window_ms +
        progress.checking_buffer_ms
    : fallback;
}

/** Determine expiry from the attempt's original checkout deadline. */
export async function checkoutExpired(env: Env, id: string, now: number) {
  return !!(await env.STATE.withSession("first-primary")
    .prepare(
      `SELECT 1 FROM native_checkout_grants WHERE attempt_id=? AND ongoing=1 AND state='complete' AND ${unpaidExpiry} UNION ALL SELECT 1 FROM expired_native_checkout_grants WHERE attempt_id=? AND ${unpaidExpiry.replaceAll("native_checkout_grants", "expired_native_checkout_grants")}`,
    )
    .bind(id, now, id, now)
    .first());
}
/** Check expiry while preserving unresolved payment outcomes. */
export async function expireCheckout(request: Request, env: Env, id: string) {
  const access = await authenticate(request, env, Date.now());
  if (
    await env.STATE.prepare(
      `SELECT 1 FROM expired_native_checkout_grants WHERE attempt_id=? AND capability_hash=? AND EXISTS(SELECT 1 FROM attempts a WHERE a.id=expired_native_checkout_grants.attempt_id AND a.owner_id=?) AND ${unpaidExpiry.replaceAll("native_checkout_grants", "expired_native_checkout_grants")}`,
    )
      .bind(id, access.capability_hash, access.owner_id, Date.now())
      .first()
  )
    return { expired: true };
  const eligible = `attempt_id=? AND capability_hash=? AND ongoing=1 AND state='complete' AND EXISTS(SELECT 1 FROM attempts a WHERE a.id=native_checkout_grants.attempt_id AND a.owner_id=?) AND EXISTS(SELECT 1 FROM guest_access g WHERE g.capability_hash=native_checkout_grants.capability_hash AND g.revoked_ms IS NULL AND g.expires_ms>?) AND ${unpaidExpiry}`;
  const now = Date.now(),
    values = [id, access.capability_hash, access.owner_id, now, now];
  const results = await env.STATE.batch([
    env.STATE.prepare(
      `INSERT INTO expired_native_checkout_grants SELECT * FROM native_checkout_grants WHERE ${eligible}`,
    ).bind(...values),
    env.STATE.prepare(
      `DELETE FROM native_checkout_grants WHERE ${eligible} AND EXISTS(SELECT 1 FROM expired_native_checkout_grants h WHERE h.attempt_id=native_checkout_grants.attempt_id AND h.capability_hash=native_checkout_grants.capability_hash)`,
    ).bind(...values),
  ]);
  if (results[1].meta.changes !== 1)
    throw new ApiError(409, "checkout_expiry_unresolved");
  return { expired: true };
}
