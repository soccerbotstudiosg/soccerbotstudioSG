-- Bind redeemed Turnstile proof to one owned checkout intent across lost responses.
CREATE TABLE checkout_bot_proofs (
  attempt_key TEXT PRIMARY KEY,
  capability_hash TEXT NOT NULL REFERENCES guest_access(capability_hash),
  input_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  verified_ms INTEGER NOT NULL,
  expires_ms INTEGER NOT NULL CHECK(expires_ms>verified_ms)
) STRICT;
