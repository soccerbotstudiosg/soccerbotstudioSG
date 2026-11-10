-- Retain already-observed cooldowns across network and identity changes.
-- These rows are not strikes and never manufacture historical booking evidence.
CREATE TABLE reservation_denials (
  customer_hash TEXT NOT NULL CHECK(length(customer_hash)=64),
  owner_id TEXT NOT NULL CHECK(length(owner_id)>0),
  blocked_until_ms INTEGER NOT NULL CHECK(blocked_until_ms>=0),
  PRIMARY KEY(customer_hash,owner_id)
);
CREATE INDEX reservation_denial_owner ON reservation_denials(owner_id,blocked_until_ms);
