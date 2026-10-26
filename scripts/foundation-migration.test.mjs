import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
const oldSchema = readFileSync(
  "migrations/0005_foundation_identity.sql",
  "utf8",
);
const upgrade = readFileSync(
  "migrations/0035_portable_foundation_identity.sql",
  "utf8",
);
/** Verify that neither installed identity nor revocation-style immutability is lost. */
function immutable(db) {
  assert.throws(
    () => db.exec("UPDATE foundation_identity SET account_id='other'"),
    /immutable foundation identity/,
  );
  assert.throws(
    () => db.exec("DELETE FROM foundation_identity"),
    /immutable foundation identity/,
  );
}
test("portable foundation upgrade preserves the installed developer identity and immutable triggers", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(oldSchema);
    db.prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)").run(
      "installed-account",
      "developer",
      "installed-database",
      "a".repeat(64),
    );
    const before = db.prepare("SELECT * FROM foundation_identity").get();
    db.exec("BEGIN");
    db.exec(upgrade);
    db.exec("COMMIT");
    assert.deepEqual(
      db.prepare("SELECT * FROM foundation_identity").get(),
      before,
    );
    immutable(db);
  } finally {
    db.close();
  }
});
test("portable foundation leaves a new database unclaimed and permits only explicit supported registration", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(oldSchema);
    db.exec(upgrade);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM foundation_identity").get().n,
      0,
    );
    assert.throws(
      () =>
        db
          .prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)")
          .run("client", "unknown", "client-db", "b".repeat(64)),
      /CHECK/,
    );
    db.prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)").run(
      "client",
      "production",
      "client-db",
      "b".repeat(64),
    );
    immutable(db);
  } finally {
    db.close();
  }
});
test("interrupted transactional foundation migration rolls back without orphaning identity", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(oldSchema);
    db.prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)").run(
      "installed",
      "developer",
      "db",
      "c".repeat(64),
    );
    const before = db.prepare("SELECT * FROM foundation_identity").get();
    db.exec("BEGIN");
    db.exec(upgrade.split("ALTER TABLE")[0]);
    db.exec("ROLLBACK");
    assert.deepEqual(
      db.prepare("SELECT * FROM foundation_identity").get(),
      before,
    );
    immutable(db);
    db.exec(upgrade);
    assert.deepEqual(
      db.prepare("SELECT * FROM foundation_identity").get(),
      before,
    );
    immutable(db);
  } finally {
    db.close();
  }
});
