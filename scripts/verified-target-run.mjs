import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
/** Explain expected automatic PR exclusions before allocating deployment credentials. */
export function automaticExclusion(
  run,
  pullRequest,
  { repository, revision, permission },
) {
  if (run.event !== "pull_request") return null;
  if (pullRequest?.state !== "open") return "PR is no longer open";
  if (pullRequest.draft) return "PR is draft";
  if (pullRequest.head?.sha !== revision) return "PR head superseded this run";
  if (
    pullRequest.head?.repo?.full_name !== repository ||
    pullRequest.base?.repo?.full_name !== repository
  )
    return "Fork PR is not a deployment candidate";
  if (
    pullRequest.user?.type !== "User" ||
    run.actor?.type !== "User" ||
    run.triggering_actor?.type !== "User"
  )
    return "Bot-triggered PR is not a deployment candidate";
  if (!["write", "maintain", "admin"].includes(permission))
    return "PR author lacks deployment eligibility";
  return null;
}
/** Require every target gate, including Worker/runtime, on the selected repository revision and attempt. */
export function validateTargetRun(
  run,
  jobs,
  {
    repository,
    revision,
    target,
    mainRevision,
    reservation,
    pullRequest,
    permission,
    attempt,
  },
) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.equal(run.repository.full_name, repository);
  assert.equal(run.head_repository.full_name, repository);
  assert.equal(run.head_sha, revision);
  assert.equal(run.path, ".github/workflows/verify-target.yml");
  assert.ok(["workflow_dispatch", "pull_request", "push"].includes(run.event));
  if (attempt)
    assert.equal(run.run_attempt, Number(attempt), "Superseded run attempt");
  assert.equal(run.status, "completed");
  assert.equal(run.conclusion, "success");
  for (const name of [
    "verify / worker-runtime",
    "verify / frontend",
    "verify / backend",
    "verify / live-email",
  ]) {
    const matches = jobs.filter((job) => job.name === name);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].conclusion, "success");
    assert.equal(matches[0].head_sha, revision);
    assert.equal(matches[0].run_attempt, run.run_attempt);
  }
  if (target === "production") {
    assert.ok(["push", "workflow_dispatch"].includes(run.event));
    assert.equal(run.head_branch, "main");
    assert.equal(
      revision,
      mainRevision,
      "Production must use current verified main",
    );
  } else {
    assert.equal(target, "staging");
    if (run.event === "pull_request") {
      assert.equal(pullRequest?.state, "open");
      assert.equal(pullRequest.draft, false);
      assert.equal(
        pullRequest.head.repo.full_name,
        repository,
        "Fork deployment refused",
      );
      assert.equal(pullRequest.base.repo.full_name, repository);
      assert.equal(pullRequest.base.ref, "main");
      assert.equal(pullRequest.head.sha, revision, "Superseded PR head");
      assert.equal(pullRequest.user.type, "User", "Bot PR deployment refused");
      assert.equal(run.actor?.type, "User");
      assert.equal(run.triggering_actor?.type, "User");
      assert.ok(
        ["write", "maintain", "admin"].includes(permission),
        "PR author must have repository write access",
      );
    } else {
      assert.equal(run.event, "workflow_dispatch");
      assert.equal(
        revision,
        reservation,
        "Reserve this exact staging candidate first",
      );
    }
  }
  return `live-email-evidence-${run.id}-${run.run_attempt}`;
}
/** Resolve evidence through GitHub rather than trusting dispatch inputs or artifact names. */
async function main() {
  const {
    GITHUB_REPOSITORY: repository,
    RELEASE_REVISION: revision,
    RELEASE_TARGET: target,
    VERIFY_RUN_ID: id,
  } = process.env;
  assert.equal(process.env.GITHUB_REF, "refs/heads/main");
  assert.ok(
    ["workflow_dispatch", "workflow_run"].includes(
      process.env.GITHUB_EVENT_NAME,
    ),
  );
  assert.match(id || "", /^[1-9][0-9]*$/);
  const api = (path) =>
    JSON.parse(
      execFileSync("gh", ["api", `repos/${repository}/${path}`], {
        encoding: "utf8",
      }),
    );
  const run = api(`actions/runs/${id}`);
  const jobs = api(
    `actions/runs/${id}/attempts/${run.run_attempt}/jobs?per_page=100`,
  );
  assert.equal(jobs.total_count, jobs.jobs.length);
  let pullRequest, permission;
  if (run.event === "pull_request") {
    assert.equal(target, "staging");
    assert.equal(run.pull_requests?.length, 1, "Require one originating PR");
    pullRequest = api(`pulls/${run.pull_requests[0].number}`);
    permission = api(
      `collaborators/${encodeURIComponent(pullRequest.user.login)}/permission`,
    ).permission;
  }
  const eligibilityOnly = process.argv.includes("--eligibility-only");
  if (eligibilityOnly && process.env.GITHUB_EVENT_NAME === "workflow_run") {
    const reason = automaticExclusion(run, pullRequest, {
      repository,
      revision,
      permission,
    });
    if (reason) {
      appendFileSync(process.env.GITHUB_OUTPUT, "eligible=false\n");
      console.log(`Deployment skipped: ${reason}`);
      return;
    }
  }
  const artifact = validateTargetRun(run, jobs.jobs, {
    repository,
    revision,
    target,
    mainRevision: api("git/ref/heads/main").object.sha,
    reservation: process.env.STAGING_RESERVED_REVISION,
    pullRequest,
    permission,
    attempt: process.env.VERIFY_RUN_ATTEMPT,
  });
  if (eligibilityOnly) {
    appendFileSync(process.env.GITHUB_OUTPUT, "eligible=true\n");
    return;
  }
  execFileSync(
    "gh",
    [
      "run",
      "download",
      id,
      "--repo",
      repository,
      "--name",
      artifact,
      "--dir",
      "work/deploy-evidence",
    ],
    { stdio: "inherit" },
  );
  appendFileSync(process.env.GITHUB_ENV, `VERIFIED_TARGET_RUN=${id}\n`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
