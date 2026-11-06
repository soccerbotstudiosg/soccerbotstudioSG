-- Admission identity is separate from payment authority and retained receipts.
CREATE TABLE reservation_sources (
 attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
 customer_hash TEXT NOT NULL CHECK(length(customer_hash)=64),
 ip_hash TEXT NOT NULL CHECK(length(ip_hash)=64),
 created_ms INTEGER NOT NULL CHECK(created_ms>=0)
);
CREATE INDEX reservation_customer ON reservation_sources(customer_hash,attempt_id);
CREATE INDEX reservation_ip ON reservation_sources(ip_hash,attempt_id);
CREATE TABLE reservation_expiries (
 attempt_id TEXT PRIMARY KEY REFERENCES reservation_sources(attempt_id),
 expired_ms INTEGER NOT NULL CHECK(expired_ms>=0)
);
CREATE INDEX reservation_expiry_time ON reservation_expiries(expired_ms);
CREATE TRIGGER reservation_source_immutable BEFORE UPDATE ON reservation_sources BEGIN SELECT RAISE(ABORT,'reservation_source_immutable'); END;
CREATE TRIGGER reservation_expiry_immutable BEFORE UPDATE ON reservation_expiries BEGIN SELECT RAISE(ABORT,'reservation_expiry_immutable'); END;
