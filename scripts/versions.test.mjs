import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const script = path.resolve("scripts/versions.mjs");
/** Create isolated source inputs for generated inventory regression checks. */
function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "soccerbot-versions-"));
  mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
  for (const file of [
    "package.json",
    "package-lock.json",
    ".nvmrc",
    ".github/workflows/verify.yml",
    ".github/workflows/verify-target.yml",
  ])
    copyFileSync(file, path.join(dir, file));
  return dir;
}
/** Execute the inventory CLI against isolated manifests. */
function run(dir, mode, extraEnv = {}) {
  return spawnSync(process.execPath, [script, mode], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
  });
}
test("inventory detects stale toolchain data and regenerates deterministically", () => {
  const dir = fixture();
  try {
    assert.equal(run(dir, "write").status, 0);
    const initial = readFileSync(path.join(dir, "docs/versions.md"), "utf8");
    assert.equal(run(dir, "check").status, 0);
    assert.equal(run(dir, "write").status, 0);
    assert.equal(
      readFileSync(path.join(dir, "docs/versions.md"), "utf8"),
      initial,
    );
    writeFileSync(path.join(dir, ".nvmrc"), "24.20.0\n");
    assert.notEqual(run(dir, "check").status, 0);
    assert.equal(run(dir, "write").status, 0);
    assert.equal(run(dir, "check").status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("report retains duplicate package paths and excludes unrelated environment secrets", () => {
  const dir = fixture();
  try {
    assert.equal(spawnSync("git", ["init", "-q"], { cwd: dir }).status, 0);
    assert.equal(
      spawnSync(
        "git",
        [
          "-c",
          "user.name=Fixture",
          "-c",
          "user.email=fixture@example.invalid",
          "commit",
          "--allow-empty",
          "-qm",
          "fixture",
        ],
        { cwd: dir },
      ).status,
      0,
    );
    const summary = path.join(dir, "summary.md");
    const result = run(dir, "report", {
      GITHUB_STEP_SUMMARY: summary,
      UNRELATED_SECRET: "must-not-appear-in-report",
    });
    assert.equal(result.status, 0, result.stderr);
    const bytes = readFileSync(
      path.join(dir, "test-results/versions.json"),
      "utf8",
    );
    const report = JSON.parse(bytes);
    const lock = JSON.parse(
      readFileSync(path.join(dir, "package-lock.json"), "utf8"),
    );
    assert.equal(report.packages.length, Object.keys(lock.packages).length - 1);
    assert.equal(
      new Set(report.packages.map((p) => p.location)).size,
      report.packages.length,
    );
    assert.match(report.observed.Python, /^Python \d+\.\d+\.\d+$/);
    assert.match(report.checkoutRevision, /^[a-f0-9]{40}$/);
    assert.equal(bytes.includes("must-not-appear-in-report"), false);
    assert.match(readFileSync(summary, "utf8"), /not deployment proof/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
