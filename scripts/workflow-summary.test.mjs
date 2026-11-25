import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import { workflowSummary } from "./workflow-summary.mjs";

test("workflow summaries retain failed and skipped outcomes and escape context", () => {
  const output = workflowSummary({
    SUMMARY_KIND: "deployment",
    GITHUB_WORKFLOW: "Cloudflare | <script> <SCRIPT> <ScRiPt>",
    SUMMARY_JOBS: JSON.stringify({
      eligibility: { result: "success" },
      staging: { result: "failure" },
      production: { result: "skipped" },
    }),
  });
  assert.match(output, /\| staging \| failure \|/);
  assert.match(output, /\| production \| skipped \|/);
  assert.match(output, /Skipped jobs are not deployment evidence/);
  assert.doesNotMatch(output, /[<>]/);
  assert.throws(() => workflowSummary({ SUMMARY_KIND: "other" }));
  assert.match(
    workflowSummary({ SUMMARY_KIND: "verification" }),
    /does not deploy/,
  );
  assert.match(
    workflowSummary({ SUMMARY_KIND: "dependency" }),
    /does not replace human assessment/,
  );
});

test("named workflows summarize every preceding job with read-only permissions and matching release trigger", () => {
  const expected = {
    "verify-target": ["CI - Application Verification", "verification"],
    "dependency-review": ["CI - Dependency Review", "dependency"],
    "deploy-release": ["Cloudflare - Deploy Verified Release", "deployment"],
  };
  for (const [file, [name, kind]] of Object.entries(expected)) {
    const workflow = YAML.parse(
      readFileSync(`.github/workflows/${file}.yml`, "utf8"),
    );
    assert.equal(workflow.name, name);
    const summary = workflow.jobs.summary;
    assert.equal(summary.if, "always()");
    assert.deepEqual(
      [summary.needs].flat().sort(),
      Object.keys(workflow.jobs)
        .filter((key) => key !== "summary")
        .sort(),
    );
    assert.deepEqual(summary.permissions, { contents: "read" });
    assert.equal(summary.steps[0].with["persist-credentials"], false);
    assert.equal(
      summary.steps[0].with.ref,
      file === "deploy-release"
        ? "main"
        : "${{ github.event.pull_request.head.sha || github.sha }}",
    );
    assert.equal(summary.steps.at(-1).env.SUMMARY_KIND, kind);
    assert.equal(summary.steps.at(-1).env.SUMMARY_JOBS, "${{ toJSON(needs) }}");
    assert.equal(summary.steps.at(-1).run, "node scripts/workflow-summary.mjs");
    assert.equal(summary["continue-on-error"], undefined);
    if (file === "deploy-release")
      assert.deepEqual(workflow.on.workflow_run.workflows, [
        expected["verify-target"][0],
      ]);
  }
});
