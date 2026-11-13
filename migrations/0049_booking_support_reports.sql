-- One immutable customer-requested staff report per protected booking attempt.
CREATE TABLE booking_support_reports (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  created_ms INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('booking_unconfirmed','checkout_unconfirmed','payment_confirmation_pending')),
  state TEXT NOT NULL CHECK (state IN ('pending','sent')),
  next_ms INTEGER NOT NULL DEFAULT 0,
  sent_ms INTEGER
);
