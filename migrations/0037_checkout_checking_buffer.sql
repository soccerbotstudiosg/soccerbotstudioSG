-- Existing attempts retain their original five-minute checking buffer.
ALTER TABLE checkout_progress ADD COLUMN checking_buffer_ms INTEGER NOT NULL DEFAULT 300000 CHECK(checking_buffer_ms IN (60000,300000));
CREATE TRIGGER checkout_buffer_immutable BEFORE UPDATE OF checking_buffer_ms ON checkout_progress BEGIN SELECT RAISE(ABORT,'checkout_buffer_immutable'); END;
