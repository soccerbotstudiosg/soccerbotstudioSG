-- Optional display metadata; never payment or booking authority.
CREATE TABLE invoice_documents (
 attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
 association_json TEXT NOT NULL CHECK(json_valid(association_json)),
 order_number TEXT NOT NULL CHECK(length(order_number) BETWEEN 1 AND 128),
 document_number TEXT CHECK(document_number IS NULL OR length(document_number) BETWEEN 1 AND 128),
 observed_ms INTEGER NOT NULL
);
