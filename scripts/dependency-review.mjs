import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Identify dependency manifests, toolchain pins and Action/container changes. */
export function needsDependencyReview(files) {
  return files.some(({ filename, previous_filename, patch }) =>
    [filename, previous_filename].some(
      (name) =>
        name &&
        (/^(package(-lock)?\.json|\.nvmrc|\.node-version)$/.test(name) ||
          (/^\.github\/workflows\//.test(name) &&
            (!patch ||
              /^[+-]\s*(?:-\s*)?(?:uses|image|container|node-version|node-version-file|python-version|python-version-file):/m.test(
                patch,
              )))),
    ),
  );
}

/** Reject missing review sections, empty comparisons and unfilled template text. */
export function validateDependencyReview(body) {
  const text = String(body || "").replace(/<!--[\s\S]*?-->/g, "");
  const errors = [];
  for (const label of [
    "Candidate and benefit",
    "Testing-tool support",
    "Our verified test coverage",
    "Customer impact",
    "Decision",
  ]) {
    const match = text.match(
      new RegExp(`\\*\\*${label}:?\\*\\*:?[ \t]*([^\\n]+)`),
    );
    if (
      !match ||
      match[1].trim().length < 20 ||
      /\b(TODO|TBD|PLACEHOLDER)\b|<fill|\[fill/i.test(match[1])
    )
      errors.push(`Complete **${label}:** with evidence, not a placeholder.`);
  }
  if (!/\*\*Decision:?\*\*:?[ \t]*(MERGE|DEFER|REJECT)\b/i.test(text))
    errors.push("Decision must begin MERGE, DEFER or REJECT.");
  const lines = text.split("\n");
  const header = lines.findIndex((line) =>
    /^\|.*Compatibility surface.*\|.*Before.*\|.*After.*\|/i.test(line),
  );
  const rows =
    header < 0
      ? []
      : lines
          .slice(header + 2)
          .filter(
            (line, i, rest) =>
              line.startsWith("|") &&
              rest.slice(0, i).every((previous) => previous.startsWith("|")),
          );
  if (
    !rows.length ||
    rows.some((row) =>
      row
        .split("|")
        .slice(1, -1)
        .some(
          (cell) =>
            !cell.trim() ||
            /\b(TODO|TBD|PLACEHOLDER)\b|<fill|\[fill/i.test(cell),
        ),
    )
  )
    errors.push(
      "Complete a Compatibility surface / Before / After table with nonempty evidence rows.",
    );
  if (
    !/https:\/\/(github\.com|nodejs\.org|www\.npmjs\.com|registry\.npmjs\.org)\//.test(
      text,
    )
  )
    errors.push("Link upstream or exact-version evidence.");
  return errors;
}

/** Validate the current PR body without executing its text or exposing credentials. */
export async function checkPullRequest(event, request) {
  const pr = event.pull_request;
  if (!pr) return "Not a pull request.";
  const repo = event.repository?.full_name;
  if (
    !/^[\w.-]+\/[\w.-]+$/.test(repo || "") ||
    !Number.isSafeInteger(pr.number)
  )
    throw new Error("Invalid PR event identity");
  const current = await request(`repos/${repo}/pulls/${pr.number}`);
  if (current.head?.sha !== pr.head.sha)
    throw new Error("Superseded PR head; check the current revision.");
  const files = [];
  for (let page = 1; ; page++) {
    const batch = await request(
      `repos/${repo}/pulls/${pr.number}/files?per_page=100&page=${page}`,
    );
    if (!Array.isArray(batch)) throw new Error("Missing changed-file evidence");
    files.push(...batch);
    if (batch.length < 100) break;
    if (page >= 30) throw new Error("Changed-file evidence exceeds API limit");
  }
  if (files.length !== current.changed_files)
    throw new Error("Incomplete changed-file evidence");
  if (!needsDependencyReview(files)) return "No dependency changes.";
  const errors = validateDependencyReview(current.body);
  if (errors.length) throw new Error(errors.join("\n"));
  return "Dependency review format complete; evidence quality still requires human review.";
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  console.log(
    await checkPullRequest(event, async (path) => {
      const response = await fetch(`https://api.github.com/${path}`, {
        headers: {
          authorization: `Bearer ${process.env.GH_TOKEN}`,
          accept: "application/vnd.github+json",
        },
      });
      if (!response.ok)
        throw new Error(
          `GitHub review evidence unavailable (${response.status})`,
        );
      return response.json();
    }),
  );
}
