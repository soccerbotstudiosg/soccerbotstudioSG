import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
/** Require all three target gates on the selected repository revision and attempt. */
export function validateTargetRun(
  run,
  jobs,
  { repository, revision, target, mainRevision, reservation },
) {
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.equal(run.repository.full_name, repository);
  assert.equal(run.head_repository.full_name, repository);
  assert.equal(run.head_sha, revision);
  assert.equal(run.path, ".github/workflows/verify-target.yml");
  assert.equal(run.event, "workflow_dispatch");
  assert.equal(run.status, "completed");
  assert.equal(run.conclusion, "success");
  for (const name of [
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
    assert.equal(run.head_branch, "main");
    assert.equal(
      revision,
      mainRevision,
      "Production must use current verified main",
    );
  } else {
    assert.equal(target, "staging");
    assert.equal(
      revision,
      reservation,
      "Reserve this exact staging candidate first",
    );
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
  assert.equal(process.env.GITHUB_EVENT_NAME, "workflow_dispatch");
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
  const artifact = validateTargetRun(run, jobs.jobs, {
    repository,
    revision,
    target,
    mainRevision: api("git/ref/heads/main").object.sha,
    reservation: process.env.STAGING_RESERVED_REVISION,
  });
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
