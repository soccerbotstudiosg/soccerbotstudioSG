import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Owner-approved temporary tooling-only risk acceptance; see docs/security/false-positives.md.
export const picomatchException = {
  advisory: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
  expires: "2026-11-25T00:00:00+08:00",
  versions: {
    "node_modules/picomatch": "2.3.2",
    "node_modules/tinyglobby/node_modules/picomatch": "4.0.7",
    "node_modules/vite/node_modules/picomatch": "4.0.7",
    "node_modules/vitest/node_modules/picomatch": "4.0.7",
  },
};

/** Fail closed except for reviewed development-only chains of the single accepted advisory. */
export function assessAudit(report, lock, now = Date.now()) {
  if (
    report?.auditReportVersion !== 2 ||
    report.error ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== "object" ||
    Array.isArray(report.vulnerabilities) ||
    !report.metadata?.vulnerabilities ||
    !lock?.packages ||
    !Number.isFinite(now)
  )
    throw new Error("Invalid audit report, lockfile or clock");
  const entries = Object.entries(report.vulnerabilities);
  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    if (
      report.metadata.vulnerabilities[severity] !==
      entries.filter(([, item]) => item?.severity === severity).length
    )
      throw new Error("Audit severity totals do not match findings");
  }
  if (report.metadata.vulnerabilities.total !== entries.length)
    throw new Error("Audit total does not match findings");
  const accepted = [],
    blocked = [];
  /** Require every root cause and installed path to remain within the reviewed exposure. */
  function covered(name, seen = new Set()) {
    const item = report.vulnerabilities[name];
    if (
      seen.has(name) ||
      !item ||
      item.name !== name ||
      item.severity === "critical" ||
      now >= Date.parse(picomatchException.expires) ||
      !Array.isArray(item.nodes) ||
      !item.nodes.length ||
      !item.nodes.every((node) => lock.packages[node]?.dev === true) ||
      !Array.isArray(item.via) ||
      !item.via.length
    )
      return false;
    const visiting = new Set([...seen, name]);
    return item.via.every((cause) => {
      if (typeof cause === "string") return covered(cause, visiting);
      return (
        name === "picomatch" &&
        cause?.name === "picomatch" &&
        cause.url === picomatchException.advisory &&
        cause.severity === "high" &&
        cause.range === "<=4.0.7" &&
        item.nodes.every(
          (node) =>
            picomatchException.versions[node] &&
            lock.packages[node].version === picomatchException.versions[node],
        )
      );
    });
  }
  for (const [name, item] of entries) {
    if (
      !["info", "low", "moderate", "high", "critical"].includes(
        item?.severity,
      ) ||
      !Array.isArray(item.via) ||
      !item.via.length
    )
      throw new Error(`Malformed finding: ${name}`);
    if (!["high", "critical"].includes(item.severity)) continue;
    (covered(name) ? accepted : blocked).push(name);
  }
  return { accepted, blocked, expires: picomatchException.expires };
}

/** Retain the unfiltered npm evidence and enforce the bounded exception without masking service failures. */
export function runAudit() {
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["audit", "--json"],
    {
      encoding: "utf8",
      timeout: 180000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/dependency-audit-raw.json", result.stdout || "");
  if (result.error || result.signal || ![0, 1].includes(result.status))
    throw new Error(
      "npm audit failed to complete; inspect the raw audit receipt",
    );
  const report = JSON.parse(result.stdout);
  const decision = assessAudit(
    report,
    JSON.parse(readFileSync("package-lock.json", "utf8")),
  );
  if (result.status === 1 && report.metadata.vulnerabilities.total === 0)
    throw new Error("npm audit failed without reporting findings");
  writeFileSync(
    "test-results/dependency-audit-decision.json",
    JSON.stringify(decision, null, 2),
  );
  if (decision.accepted.length)
    console.warn(
      `TEMPORARY RISK ACCEPTANCE: ${picomatchException.advisory}; ${decision.accepted.length} development-only entries; expires ${decision.expires}. This is not a vulnerability fix.`,
    );
  if (decision.blocked.length)
    throw new Error(
      `Unaccepted high/critical findings: ${decision.blocked.join(", ")}`,
    );
  console.log("Dependency audit policy passed; raw findings retained.");
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    runAudit();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
