-- Public enquiries retain only submission hashes and bounded delivery state.
CREATE TABLE enquiry_requests (
  request_key TEXT PRIMARY KEY,
  input_hash TEXT NOT NULL CHECK(length(input_hash)=64),
  created_ms INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','sent')),
  next_ms INTEGER NOT NULL DEFAULT 0,
  claim_id TEXT,
  verified_ms INTEGER,
  token_hash TEXT UNIQUE,
  sent_ms INTEGER,
  CHECK((verified_ms IS NULL)=(token_hash IS NULL))
);
CREATE TRIGGER enquiry_request_immutable BEFORE UPDATE ON enquiry_requests
WHEN NEW.request_key<>OLD.request_key OR NEW.input_hash<>OLD.input_hash
  OR NEW.created_ms<>OLD.created_ms OR OLD.state='sent'
  OR (OLD.verified_ms IS NOT NULL AND (
    NEW.verified_ms IS NOT OLD.verified_ms OR NEW.token_hash IS NOT OLD.token_hash))
BEGIN SELECT RAISE(ABORT,'enquiry_request_immutable'); END;
