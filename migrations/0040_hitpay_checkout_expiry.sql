-- Keep the hosted link deadline separate from the immutable payment/recovery windows.
-- Historical rows remain unknown until an authenticated HitPay read supplies it.
ALTER TABLE hitpay_payments ADD COLUMN checkout_expires_ms INTEGER
  CHECK (checkout_expires_ms IS NULL OR checkout_expires_ms > 0);
