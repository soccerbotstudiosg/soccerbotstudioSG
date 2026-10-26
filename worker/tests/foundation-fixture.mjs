import { readFileSync, readdirSync } from "node:fs";
export async function seedFoundation(mf, db) {
  await db.exec(
    readFileSync("migrations/0005_foundation_identity.sql", "utf8")
      .replace(/^--.*$/gm, "")
      .replace(/\n/g, " "),
  );
  const ns = await mf.getDurableObjectNamespace("COORDINATOR");
  await db
    .prepare("INSERT INTO foundation_identity VALUES(1,?,?,?,?)")
    .bind(
      "517f4f85eb8f982b483dbc05b797fd88",
      "developer",
      "297a991b-70a7-438d-a0e3-39fa3a7f2cee",
      ns.idFromName("simplybook-developer-account").toString(),
    )
    .run();
}

/** Initialize synthetic databases with their foundation registered before schema upgrades. */
export async function initializeFixture(
  mf,
  db,
  names = readdirSync("migrations").sort(),
) {
  await seedFoundation(mf, db);
  const sql = names
    .filter((name) => !name.startsWith("0005"))
    .map((name) =>
      readFileSync(`migrations/${name}`, "utf8")
        .replace(/^--.*$/gm, "")
        .replace(/\n/g, " "),
    )
    .join(" ");
  if (sql) await db.exec(sql);
}
