-- Explicit terminal evidence, never inferred from an empty provider search.
CREATE TABLE developer_operations_resolution (
  capability_hash TEXT PRIMARY KEY,
  operation TEXT NOT NULL CHECK(operation IN ('provider_identity','historical_comparison','native_field_discovery','customer_catalogue','native_recovery_window','native_creation_resolution')),
  expires_ms INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('granted','running','complete','blocked')),
  result_json TEXT
);
INSERT INTO developer_operations_resolution SELECT * FROM developer_operations;
DROP TABLE developer_operations;
ALTER TABLE developer_operations_resolution RENAME TO developer_operations;
CREATE INDEX developer_operation_window ON developer_operations(operation,state,expires_ms);
CREATE TABLE no_creation_resolutions (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
  intent_hash TEXT NOT NULL,
  attempt_version INTEGER NOT NULL,
  dispatch_fence INTEGER NOT NULL,
  evidence_source TEXT NOT NULL CHECK(evidence_source IN ('operator_verified_provider','correlated_rpc_rejection')),
  evidence_reference TEXT NOT NULL CHECK(length(evidence_reference) BETWEEN 1 AND 128),
  verified_ms INTEGER NOT NULL,
  resolved_ms INTEGER NOT NULL CHECK(resolved_ms>=verified_ms),
  operator_capability_hash TEXT,
  CHECK((evidence_source='operator_verified_provider' AND operator_capability_hash IS NOT NULL) OR (evidence_source='correlated_rpc_rejection' AND operator_capability_hash IS NULL))
);
CREATE TRIGGER no_creation_preserve_update BEFORE UPDATE ON no_creation_resolutions BEGIN SELECT RAISE(ABORT,'immutable no creation resolution'); END;
CREATE TRIGGER no_creation_preserve_delete BEFORE DELETE ON no_creation_resolutions BEGIN SELECT RAISE(ABORT,'immutable no creation resolution'); END;
CREATE TRIGGER no_creation_attempt_fence BEFORE UPDATE ON attempts WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=OLD.id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_dispatch_fence BEFORE INSERT ON dispatches WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_effect_insert BEFORE INSERT ON session_effects WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_effect_update BEFORE UPDATE ON session_effects WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=OLD.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_payment_fence BEFORE INSERT ON hitpay_payments WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_hold_fence BEFORE INSERT ON hitpay_holds WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_progress_fence BEFORE INSERT ON checkout_progress WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_grant_fence BEFORE INSERT ON native_checkout_grants WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_grant_binding_fence BEFORE UPDATE OF attempt_id ON native_checkout_grants WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
CREATE TRIGGER no_creation_recovery_fence BEFORE UPDATE ON recovery_work WHEN NEW.state!='complete' AND EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=NEW.attempt_id) BEGIN SELECT RAISE(ABORT,'creation already resolved'); END;
