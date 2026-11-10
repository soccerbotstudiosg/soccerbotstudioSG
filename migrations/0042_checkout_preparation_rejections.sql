-- Durable no-dispatch evidence for rejected keys that never became attempts.
CREATE TABLE checkout_preparation_rejections (
  attempt_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  summary_json TEXT NOT NULL CHECK(json_valid(summary_json)),
  rejection_json TEXT NOT NULL CHECK(json_valid(rejection_json)),
  recorded_ms INTEGER NOT NULL
);
CREATE INDEX preparation_rejection_owner ON checkout_preparation_rejections(owner_id,attempt_id);
CREATE TRIGGER preparation_rejection_preserve_update BEFORE UPDATE ON checkout_preparation_rejections BEGIN SELECT RAISE(ABORT,'immutable preparation rejection'); END;
CREATE TRIGGER preparation_rejection_preserve_delete BEFORE DELETE ON checkout_preparation_rejections BEGIN SELECT RAISE(ABORT,'immutable preparation rejection'); END;
CREATE TRIGGER preparation_rejection_no_attempt BEFORE INSERT ON checkout_preparation_rejections WHEN EXISTS(SELECT 1 FROM attempts WHERE id=NEW.attempt_id OR (owner_id=NEW.owner_id AND idempotency_key=NEW.attempt_id)) BEGIN SELECT RAISE(ABORT,'preparation rejection has attempt'); END;
CREATE TRIGGER preparation_rejection_attempt_fence BEFORE INSERT ON attempts WHEN EXISTS(SELECT 1 FROM checkout_preparation_rejections WHERE attempt_id=NEW.id OR (owner_id=NEW.owner_id AND attempt_id=NEW.idempotency_key)) BEGIN SELECT RAISE(ABORT,'preparation already rejected'); END;
