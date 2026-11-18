import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assessAudit, picomatchException } from "./dependency-audit.mjs";
const now = Date.parse("2026-11-18T00:00:00+08:00");
/** Construct synthetic findings without trusting npm or the installed dependency tree. */
function fixture() {
  const root = {
    name: "picomatch",
    severity: "high",
    nodes: ["node_modules/picomatch"],
    via: [
      {
        name: "picomatch",
        severity: "high",
        range: "<=4.0.7",
        url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
      },
    ],
  };
  return {
    report: {
      auditReportVersion: 2,
      vulnerabilities: {
        picomatch: root,
        micromatch: {
          name: "micromatch",
          severity: "high",
          nodes: ["node_modules/micromatch"],
          via: ["picomatch"],
        },
      },
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high: 2,
          critical: 0,
          total: 2,
        },
      },
    },
    lock: {
      packages: {
        "node_modules/picomatch": { version: "2.3.2", dev: true },
        "node_modules/micromatch": { version: "4.0.8", dev: true },
      },
    },
  };
}
test("audit accepts only the dated reviewed tooling advisory and its derived findings", () => {
  const { report, lock } = fixture();
  assert.deepEqual(assessAudit(report, lock, now).accepted, [
    "picomatch",
    "micromatch",
  ]);
  assert.deepEqual(assessAudit(report, lock, now).blocked, []);
  assert.equal(picomatchException.expires, "2026-11-25T00:00:00+08:00");
});
test("audit rejects the accepted advisory at its exact expiry", () => {
  const { report, lock } = fixture();
  assert.equal(
    assessAudit(report, lock, Date.parse(picomatchException.expires) - 1)
      .blocked.length,
    0,
  );
  assert.equal(
    assessAudit(report, lock, Date.parse(picomatchException.expires)).blocked
      .length,
    2,
  );
});
test("audit rejects changed versions and new or runtime dependency paths", () => {
  for (const mutate of [
    (r, l) => {
      l.packages["node_modules/picomatch"].version = "4.0.8";
    },
    (r, l) => {
      l.packages["node_modules/picomatch"].dev = false;
    },
    (r, l) => {
      l.packages["node_modules/micromatch"].dev = false;
    },
    (r, l) => {
      r.vulnerabilities.picomatch.nodes.push(
        "node_modules/new/node_modules/picomatch",
      );
      l.packages["node_modules/new/node_modules/picomatch"] = {
        version: "4.0.7",
        dev: true,
      };
    },
  ]) {
    const { report, lock } = fixture();
    mutate(report, lock);
    assert.ok(assessAudit(report, lock, now).blocked.length > 0);
  }
});
test("audit never exempts another advisory attached to picomatch or a parent", () => {
  for (const name of ["picomatch", "micromatch"]) {
    const { report, lock } = fixture();
    report.vulnerabilities[name].via.push({
      name,
      severity: "high",
      url: "https://github.com/advisories/GHSA-other",
    });
    assert.ok(assessAudit(report, lock, now).blocked.includes(name));
  }
});
test("audit rejects critical escalation cyclic and missing advisory chains", () => {
  for (const via of [["micromatch"], ["missing"]]) {
    const { report, lock } = fixture();
    report.vulnerabilities.picomatch.via = via;
    assert.equal(assessAudit(report, lock, now).blocked.length, 2);
  }
  const { report, lock } = fixture();
  report.vulnerabilities.picomatch.severity = "critical";
  report.metadata.vulnerabilities.high = 1;
  report.metadata.vulnerabilities.critical = 1;
  assert.equal(assessAudit(report, lock, now).blocked.length, 2);
});
test("audit rejects unavailable malformed incomplete and inconsistent reports", () => {
  const { report, lock } = fixture();
  for (const invalid of [
    null,
    {},
    { ...report, error: { code: "E503" } },
    { ...report, metadata: {} },
    { ...report, vulnerabilities: {} },
  ])
    assert.throws(() => assessAudit(invalid, lock, now));
  assert.throws(() => assessAudit(report, lock, NaN));
  report.vulnerabilities.picomatch.via = [];
  assert.throws(() => assessAudit(report, lock, now));
});
test("audit permits a genuinely clean report without invoking an exception", () => {
  const { report, lock } = fixture();
  report.vulnerabilities = {};
  for (const key in report.metadata.vulnerabilities)
    report.metadata.vulnerabilities[key] = 0;
  assert.deepEqual(assessAudit(report, lock, now).accepted, []);
});
test("code verification executes the audit gate before tooling or build", () => {
  const source = readFileSync("scripts/verify.mjs", "utf8");
  assert.match(
    source,
    /\["dependency-audit", "node", "scripts\/dependency-audit\.mjs"\]/,
  );
  assert.ok(
    source.indexOf('["dependency-audit"') < source.indexOf('["tooling"'),
  );
  assert.match(source, /throw new Error/);
});
