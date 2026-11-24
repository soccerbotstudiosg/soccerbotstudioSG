import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const descriptions = {
  verification:
    "Runs source, formatting, lint, type, unit/component, browser and Worker checks, including the master booking regression. Builds target-specific artifacts for later verified deployment. This workflow does not deploy or establish physical-device acceptance.",
  deployment:
    "Checks candidate eligibility and exact-revision verification evidence, then deploys the sealed artifact to the selected Cloudflare target and checks deployment health. Foundation setup runs only when explicitly selected. Skipped jobs are not deployment evidence; inspect the deployment receipt artifact for the actual released revision and health result.",
  dependency:
    "Checks dependency-change review requirements against the current PR description and changed files. This validates the review format; it does not replace human assessment, perform a vulnerability audit, or deploy anything.",
};
/** Escape untrusted context before placing it in a Markdown table. */
const cell = (value) => String(value ?? "unknown").replace(/[\r\n|<>`]/g, " ");
/** Explain the workflow and report actual job outcomes without promoting skips to success. */
export function workflowSummary(env) {
  const description = descriptions[env.SUMMARY_KIND];
  if (!description) throw new Error("Unknown workflow summary kind");
  const jobs = JSON.parse(env.SUMMARY_JOBS || "{}");
  const rows = Object.entries(jobs).map(
    ([name, job]) => `| ${cell(name)} | ${cell(job.result)} |`,
  );
  return `## ${cell(env.GITHUB_WORKFLOW)}\n\n${description}\n\n| Context | Value |\n| --- | --- |\n| Event | ${cell(env.GITHUB_EVENT_NAME)} |\n| Target / operation | ${cell(env.SUMMARY_TARGET)} / ${cell(env.SUMMARY_OPERATION)} |\n| Candidate revision | ${cell(env.SUMMARY_REVISION)} |\n| Run / attempt | ${cell(env.GITHUB_RUN_ID)} / ${cell(env.GITHUB_RUN_ATTEMPT)} |\n\n### Job results\n\n| Job | Result |\n| --- | --- |\n${rows.join("\n")}\n\nResults above are execution outcomes, not approval to merge or proof of physical/provider acceptance. Failed or cancelled jobs require their original logs; a successful summary job does not override them.\n`;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!process.env.GITHUB_STEP_SUMMARY)
    throw new Error("Missing GitHub summary destination");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, workflowSummary(process.env));
}
