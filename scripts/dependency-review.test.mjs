import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import {
  needsDependencyReview,
  validateDependencyReview,
  checkPullRequest,
} from "./dependency-review.mjs";

const body = `**Candidate and benefit:** Upgrade the build tool from1.0 to1.1 for a documented parser correction.
| Compatibility surface | Before | After | Impact / source |
| --- | --- | --- | --- |
| Node | >=22 | >=22 | Unchanged; https://github.com/example/tool/releases/tag/v1.1 |
**Testing-tool support:** Node22 and24 remain supported; CI selects24.19.0.
**Our verified test coverage:** Exact revision abc123 passed Linux CI; native macOS remains unverified.
**Customer impact:** No intentional UI or minimum-browser changes; staged visual acceptance pending.
**Decision:** DEFER until staged acceptance and exact-head validation complete.`;

test("dependency review classifies manifests renamed pins and workflow revisions", () => {
  for (const file of [
    { filename: "package-lock.json" },
    {
      filename: ".github/workflows/test.yml",
      patch: '+          python-version: "3.13"',
    },
    {
      filename: ".github/workflows/test.yml",
      patch: '+          node-version: "26"',
    },
    {
      filename: ".github/workflows/test.yml",
      patch: "+    container: node:26",
    },
    { filename: "old", previous_filename: ".nvmrc" },
    {
      filename: ".github/workflows/verify.yml",
      patch: "+      - uses: actions/setup-node@abc",
    },
    { filename: ".github/workflows/verify.yml" },
  ])
    assert.equal(needsDependencyReview([file]), true);
  assert.equal(
    needsDependencyReview([
      { filename: "src/page.tsx" },
      {
        filename: ".github/workflows/test.yml",
        patch: "+      - run: npm test",
      },
    ]),
    false,
  );
});
test("dependency review rejects missing sections empty tables placeholders and comment-only evidence", () => {
  assert.deepEqual(validateDependencyReview(body), []);
  for (const label of [
    "Candidate and benefit",
    "Testing-tool support",
    "Our verified test coverage",
    "Customer impact",
    "Decision",
  ])
    assert.ok(
      validateDependencyReview(body.replace(label, "Removed section")).length,
    );
  for (const invalid of [
    "",
    body.replace(
      /(\*\*(?:Candidate and benefit|Testing-tool support|Our verified test coverage|Customer impact):\*\*)[^\n]*/g,
      "$1",
    ),
    `<!-- ${body} -->`,
    `<!-- ${body}`,
    `<!-- outer <!-- ${body} -->`,
    body.replace("Customer impact", "Customer<!-- hidden --> impact"),
    body.replace(
      "Customer impact",
      "Customer<!<!-- hidden -->-- hidden --> impact",
    ),
    body.replace(">=22 | >=22", " | >=22"),
    body.replace("DEFER until", "APPROVE until"),
    body.replace("No intentional UI", "TODO intentional UI"),
    readFileSync(".github/dependency-review-template.md", "utf8"),
  ])
    assert.ok(validateDependencyReview(invalid).length);
});
test("dependency review reads current body and all file pages and rejects stale or incomplete evidence", async () => {
  const event = {
    repository: { full_name: "owner/repo" },
    pull_request: { number: 1, head: { sha: "exact" }, body: "stale" },
  };
  const current = { head: { sha: "exact" }, body, changed_files: 101 };
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    return path.endsWith("&page=1")
      ? Array.from({ length: 100 }, () => ({ filename: "src/app.ts" }))
      : path.endsWith("&page=2")
        ? [{ filename: "package.json" }]
        : current;
  };
  assert.match(await checkPullRequest(event, request), /format complete/);
  assert.equal(calls.length, 3);
  current.body = "";
  await assert.rejects(checkPullRequest(event, request), /Customer impact/);
  current.body = body;
  current.changed_files = 102;
  await assert.rejects(checkPullRequest(event, request), /Incomplete/);
  current.head.sha = "other";
  await assert.rejects(checkPullRequest(event, request), /Superseded/);
  assert.equal(
    await checkPullRequest({}, () => {
      throw Error("must not read");
    }),
    "Not a pull request.",
  );
});

test("dependency review runs inside the required frontend gate and on PR description edits", () => {
  const workflow = readFileSync(".github/workflows/verify-target.yml", "utf8");
  const frontend = workflow
    .split("  frontend:")[1]
    .split("  browser-build:")[0];
  assert.match(frontend, /run: node scripts\/dependency-review\.mjs/);
  assert.ok(
    frontend.indexOf("node scripts/dependency-review.mjs") <
      frontend.indexOf("npm run verify"),
  );
  const edit = readFileSync(".github/workflows/dependency-review.yml", "utf8");
  const parsed = YAML.parse(edit);
  assert.deepEqual(parsed.on.pull_request.types, ["edited"]);
  assert.equal(parsed.concurrency["cancel-in-progress"], true);
  assert.equal(
    parsed.concurrency.group,
    "dependency-review-${{ github.event.pull_request.number }}",
  );
  assert.match(edit, /pull-requests: read/);
  assert.doesNotMatch(
    edit,
    /pull_request_target|permissions: write-all|secrets\./,
  );
});
