import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
const ignored = new Set([
  "node_modules",
  ".wrangler",
  ".git",
  ".next",
  "out",
  "test-results",
  "playwright-report",
  "coverage",
  "__pycache__",
]);
/** Fingerprint verification inputs to bind receipts to their source. */
export function fingerprint() {
  const hash = createHash("sha256");
  /** Collect verification input hashes while excluding generated artifacts. */
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (
        ignored.has(entry.name) ||
        entry.name === "next-env.d.ts" ||
        entry.name === "runtime.d.ts" ||
        entry.name === "telemetry-env.d.ts" ||
        entry.name.endsWith(".tsbuildinfo")
      )
        continue;
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink refused: ${file}`);
      if (entry.isDirectory()) visit(file);
      else {
        hash.update(path.relative(process.cwd(), file));
        hash.update("\0");
        hash.update(readFileSync(file));
        hash.update("\0");
      }
    }
  }
  visit(process.cwd());
  return hash.digest("hex");
}
