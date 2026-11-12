-- Permit overlapping code requests while preserving the third-request block and existing evidence.
DROP TRIGGER identity_send_limit;
CREATE TRIGGER identity_send_limit BEFORE INSERT ON identity_challenges
WHEN EXISTS(SELECT 1 FROM identity_request_counters WHERE
  request_count=3 AND ((scope='session' AND subject_key=NEW.owner_id)
    OR (scope='source' AND subject_key=NEW.source_hash)
    OR (scope='email' AND subject_key=NEW.email_hash))
  AND NEW.created_ms<last_request_ms+600000)
  OR EXISTS(SELECT 1 FROM identity_request_denials WHERE owner_id=NEW.owner_id AND blocked_until_ms>NEW.created_ms)
BEGIN SELECT RAISE(ABORT,'identity_request_limited'); END;
