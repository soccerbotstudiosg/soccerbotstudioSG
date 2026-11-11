-- Preserve prior challenges while introducing session/IP request cycles and sticky observed denials.
CREATE INDEX identity_owner_limit ON identity_challenges(owner_id,created_ms);
CREATE TABLE identity_request_counters (
  scope TEXT NOT NULL CHECK(scope IN ('session','source')),
  subject_key TEXT NOT NULL,
  request_count INTEGER NOT NULL CHECK(request_count BETWEEN 1 AND 3),
  last_request_ms INTEGER NOT NULL,
  PRIMARY KEY(scope,subject_key)
);
INSERT INTO identity_request_counters(scope,subject_key,request_count,last_request_ms)
SELECT 'session',owner_id,MIN(3,COUNT(*)),MAX(created_ms) FROM identity_challenges c
WHERE created_ms>(SELECT MAX(created_ms)-600000 FROM identity_challenges WHERE owner_id=c.owner_id)
GROUP BY owner_id;
INSERT INTO identity_request_counters(scope,subject_key,request_count,last_request_ms)
SELECT 'source',source_hash,MIN(3,COUNT(*)),MAX(created_ms) FROM identity_challenges c
WHERE created_ms>(SELECT MAX(created_ms)-600000 FROM identity_challenges WHERE source_hash=c.source_hash)
GROUP BY source_hash;
CREATE TABLE identity_request_denials (
  owner_id TEXT PRIMARY KEY,
  blocked_until_ms INTEGER NOT NULL CHECK(blocked_until_ms>=0)
);
DROP TRIGGER identity_send_limit;
CREATE TRIGGER identity_send_limit BEFORE INSERT ON identity_challenges
WHEN EXISTS(SELECT 1 FROM identity_request_counters WHERE
  ((scope='session' AND subject_key=NEW.owner_id)
    OR (scope='source' AND subject_key=NEW.source_hash AND request_count=3))
  AND NEW.created_ms<last_request_ms+CASE request_count WHEN 3 THEN 600000 ELSE 120000 END)
  OR EXISTS(SELECT 1 FROM identity_request_denials WHERE owner_id=NEW.owner_id AND blocked_until_ms>NEW.created_ms)
BEGIN SELECT RAISE(ABORT,'identity_request_limited'); END;
CREATE TRIGGER identity_request_count AFTER INSERT ON identity_challenges
BEGIN
  INSERT INTO identity_request_counters(scope,subject_key,request_count,last_request_ms)
  VALUES('session',NEW.owner_id,1,NEW.created_ms),('source',NEW.source_hash,1,NEW.created_ms)
  ON CONFLICT(scope,subject_key) DO UPDATE SET
    request_count=CASE WHEN excluded.last_request_ms>=last_request_ms+600000 THEN 1 ELSE request_count+1 END,
    last_request_ms=excluded.last_request_ms;
  INSERT INTO identity_request_denials(owner_id,blocked_until_ms)
    SELECT NEW.owner_id,MAX(last_request_ms+600000) FROM identity_request_counters
    WHERE request_count=3 AND ((scope='session' AND subject_key=NEW.owner_id) OR (scope='source' AND subject_key=NEW.source_hash))
    HAVING COUNT(*)>0
    ON CONFLICT(owner_id) DO UPDATE SET blocked_until_ms=CASE WHEN blocked_until_ms>NEW.created_ms THEN blocked_until_ms ELSE excluded.blocked_until_ms END;
END;
