-- Preserve booking ownership when an email owner revokes saved-profile access.
-- Local logout and token replay keep the existing booking revocation default.
ALTER TABLE remembered_identity ADD COLUMN revocation_scope TEXT NOT NULL DEFAULT 'booking'
  CHECK(revocation_scope IN ('booking','profile'));
DROP TRIGGER remembered_family_signout;
CREATE TRIGGER remembered_family_signout AFTER UPDATE OF revoked_ms ON remembered_identity
WHEN OLD.revoked_ms IS NULL AND NEW.revoked_ms IS NOT NULL
BEGIN
  UPDATE verified_identity SET revoked_ms=NEW.revoked_ms WHERE revoked_ms IS NULL AND access_hash IN
    (SELECT access_hash FROM remembered_access WHERE family_id=NEW.id);
  UPDATE guest_access SET revoked_ms=NEW.revoked_ms WHERE NEW.revocation_scope='booking'
    AND revoked_ms IS NULL AND capability_hash IN
    (SELECT access_hash FROM remembered_access WHERE family_id=NEW.id);
END;
