-- Preserve the installed identity while supporting a separately registered client.
-- This schema upgrade never claims a database or changes an existing identity.
CREATE TABLE foundation_identity_upgrade (
  singleton INTEGER PRIMARY KEY CHECK (singleton=1),
  account_id TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('developer','production')),
  database_id TEXT NOT NULL,
  coordinator_id TEXT NOT NULL CHECK (length(coordinator_id)=64)
);
INSERT INTO foundation_identity_upgrade SELECT * FROM foundation_identity;
DROP TRIGGER immutable_foundation_identity_update;
DROP TRIGGER immutable_foundation_identity_delete;
DROP TABLE foundation_identity;
ALTER TABLE foundation_identity_upgrade RENAME TO foundation_identity;
CREATE TRIGGER immutable_foundation_identity_update BEFORE UPDATE ON foundation_identity
BEGIN SELECT RAISE(ABORT, 'immutable foundation identity'); END;
CREATE TRIGGER immutable_foundation_identity_delete BEFORE DELETE ON foundation_identity
BEGIN SELECT RAISE(ABORT, 'immutable foundation identity'); END;
