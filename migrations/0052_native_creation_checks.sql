-- Private evidence for the exact dispatched booking operation. No provider payloads or contact details.
CREATE TABLE native_creation_checks (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
  intent_hash TEXT NOT NULL,
  dispatch_fence INTEGER NOT NULL CHECK(dispatch_fence>0),
  book_rpc_id TEXT,
  book_rpc_code INTEGER,
  book_rpc_ended_ms INTEGER,
  first_empty_ms INTEGER,
  checked_ms INTEGER,
  list_result TEXT CHECK(list_result IN ('empty','candidate','ambiguous','unavailable')),
  windows_available INTEGER CHECK(windows_available IN (0,1)),
  CHECK((book_rpc_id IS NULL AND book_rpc_code IS NULL AND book_rpc_ended_ms IS NULL)
     OR (book_rpc_id IS NOT NULL AND length(book_rpc_id)=36 AND book_rpc_code IS NOT NULL AND book_rpc_ended_ms IS NOT NULL)),
  CHECK(first_empty_ms IS NULL OR (list_result IS NOT NULL AND list_result='empty' AND checked_ms IS NOT NULL AND windows_available IS NOT NULL AND first_empty_ms<=checked_ms))
);
CREATE TRIGGER native_creation_rpc_immutable BEFORE UPDATE OF book_rpc_id,book_rpc_code,book_rpc_ended_ms ON native_creation_checks
WHEN OLD.book_rpc_id IS NOT NULL
BEGIN SELECT RAISE(ABORT,'immutable book rpc completion'); END;
CREATE TRIGGER native_creation_check_scope_immutable BEFORE UPDATE OF attempt_id,intent_hash,dispatch_fence ON native_creation_checks
BEGIN SELECT RAISE(ABORT,'immutable creation check scope'); END;

-- Keep the original opaque values across signing-key rotation. Archives use SELECT *.
ALTER TABLE native_checkout_grants ADD COLUMN creation_markers_json TEXT
  CHECK(creation_markers_json IS NULL OR (json_valid(creation_markers_json) AND json_type(creation_markers_json)='array' AND length(creation_markers_json)<=805));
ALTER TABLE rejected_native_checkout_grants ADD COLUMN creation_markers_json TEXT;
ALTER TABLE completed_native_checkout_grants ADD COLUMN creation_markers_json TEXT;
ALTER TABLE expired_native_checkout_grants ADD COLUMN creation_markers_json TEXT;
CREATE TRIGGER native_checkout_creation_markers_immutable BEFORE UPDATE OF creation_markers_json ON native_checkout_grants
WHEN OLD.creation_markers_json IS NOT NULL AND OLD.creation_markers_json IS NOT NEW.creation_markers_json
BEGIN SELECT RAISE(ABORT,'immutable creation markers'); END;
