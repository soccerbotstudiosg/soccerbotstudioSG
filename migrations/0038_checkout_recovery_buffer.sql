-- Existing attempts retain their original recovery timing.
ALTER TABLE checkout_progress ADD COLUMN recovery_buffer_ms INTEGER NOT NULL DEFAULT 0 CHECK(recovery_buffer_ms IN (0,180000));
CREATE TRIGGER checkout_recovery_immutable BEFORE UPDATE OF recovery_buffer_ms ON checkout_progress BEGIN SELECT RAISE(ABORT,'checkout_recovery_immutable'); END;
