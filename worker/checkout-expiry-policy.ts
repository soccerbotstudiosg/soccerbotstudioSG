// Time alone is not proof of non-payment.
// Dispatched requests require authenticated terminal evidence with an explicit
// empty or strictly verified unstarted payment list. Unprocessed receipts revoke
// eligibility until reconciled.
export const unpaidExpiry = `EXISTS(SELECT 1 FROM hitpay_holds h JOIN checkout_progress c ON c.attempt_id=h.attempt_id WHERE h.attempt_id=native_checkout_grants.attempt_id AND MAX(c.booking_created_ms+c.payment_window_ms+c.checking_buffer_ms+c.recovery_buffer_ms,h.expires_ms)<=?) AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=native_checkout_grants.attempt_id AND NOT (p.state='manual_review' AND p.reason='hitpay_unpaid_verified' AND p.paid_ms IS NULL AND p.payment_id IS NULL AND p.external_state='none' AND NOT EXISTS(SELECT 1 FROM hitpay_receipts r WHERE r.attempt_id=p.attempt_id AND r.rowid>p.receipt_checkpoint)))`;
