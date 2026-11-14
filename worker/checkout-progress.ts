import { unpaidExpiry } from "./checkout-expiry-policy";
import { retainedInvoiceNumber } from "./invoice-document";
import { authenticate } from "./access";
import { ApiError } from "./policy";
import { receiptSchema } from "../src/domain/native-checkout";
import { assertPaymentScope, paymentScopeSchema } from "./hitpay-contract";

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
