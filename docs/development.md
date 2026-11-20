# Continuous development guide

> **Guidance only, not a strict requirement.** These workflows are practical examples; adapt them to the task and available tools. [AGENTS.md](../AGENTS.md) remains the authority for repository engineering rules and action boundaries. This guide does not override those rules or authorise merges, deployments, provider changes or financial actions.

Paths and commands below assume the repository root unless stated otherwise. GitHub is canonical; a local checkout, Codex workspace or attached ZIP is a revision snapshot. Always establish which revision you are editing before combining work.

## Choose a development workflow

| Way                                                                      | Best suited to                                                          | Where work happens                                      | How changes return                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [1. Local VS Code](#1-local-development-with-vs-code)                    | Interactive editing, local debugging and owner-operated browser testing | Your computer and task branch                           | Review diff, commit, push, draft PR                                                              |
| [2. Cloud Containers](#2-development-with-cloud-containers)              | Repository inspection, focused fixes and automated non-browser checks   | Connected repository and managed workspace              | Agent pushes a task branch and opens/updates a draft PR when available                           |
| [3. ZIP attached to chat](#3-development-through-a-zip-attached-to-chat) | File-based review when direct repository access is unavailable          | A clearly identified source snapshot and chat workspace | Reviewed patch/files or guarded installer, then integration into a local branch and normal PR/CI |

All three routes converge on the same reviewed source and verification process. A ZIP or chat response is not a separate deployment pipeline.

## What to read before changing code

Start with [AGENTS](../AGENTS.md), [North Star](../NORTH_STAR.md) and [Progress](../PROGRESS.md). Then follow the task-specific reading order in AGENTS:

- [Business rules](business-rules.md#current-system-rules) define expected behavior and acceptance boundaries.
- [Architecture](architecture/adr.md) and [system diagrams](architecture/diagram.md) explain runtime responsibilities.
- [Code owners](code-owners/index.md) links each feature and business-rule group to its implementation.
- [Versions](versions.md) lists configured tools and locked packages; run evidence records observed tool versions.
- [Runbook](runbook.md) covers incidents, dependencies, monitoring, deployment and recovery.
- [Admin](uat/admin.md), [Trainers](uat/trainers.md) and [Simulated-user](uat/simulated-user.md) worksheets guide owner-operated acceptance.

## 1. Local development with VS Code

### Clone or refresh safely

Use your own GitHub account with repository access. Authenticate through approved Git/VS Code/GitHub tooling; do not put access tokens into remote URLs or source files. For a first checkout of the current canonical repository:

```bash
git clone https://github.com/LimYouSheng/SoccerBotStudioSG.git
cd SoccerBotStudioSG
git status --short
git remote -v
code .
```

`code .` is optional; use VS Code → Open Folder if its shell command is unavailable. Select the repository root so its TypeScript, ESLint and formatting configuration are used. Avoid conflicting editor formatters; inspect any format-on-save diff before committing.

For an existing checkout, inspect the branch and working tree first. Preserve personal edits and worktrees; do not reset or automatically stash unfamiliar work. In a clean checkout, an example new-task flow is:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c fix/short-task-name
```

Use `feat/…` or `docs/…` when appropriate. If main cannot fast-forward, inspect the divergence before changing history. A separate worktree is useful when another task has uncommitted work; verify its dependency setup rather than replacing an existing `node_modules` symlink.

### Install and run

Use the current `.nvmrc` and `package.json` versions, not a version copied from an old chat. With an existing nvm installation:

```bash
nvm install
nvm use
node --version
npm --version
python3 --version
npm ci
npm run dev
```

If you use another Node manager, select the same pinned version with that tool. Compare npm with `packageManager` and resolve mismatches deliberately. `npm ci` installs the reviewed lockfile; do not use a broad dependency update merely to start development. Reuse matching dependencies/caches during routine work. Python supports verification/installer tooling, not the hosted application runtime.

Use the dev server URL printed in your terminal. The default base path is `/SoccerBotStudioSG`; inspect configuration before assuming root hosting. To inspect the static export, build then preview it with the commands in [Development setup](#development-setup). The local preview is not a public share URL. Default local composition is demo; it does not prove the live Worker/provider flow.

As the human developer, use VS Code debugging, browser developer tools and breakpoints to reproduce the issue. Record steps, expected/actual behavior and useful redacted evidence. Do not perform real provider mutations while debugging unless they are part of an explicitly arranged owner test.

### Iterate and verify

Edit the existing owning module and affected tests, then run checks appropriate to the change. Examples include the relevant `node --test` tooling test, application test, source/policy checks or isolated Worker verification. Broaden verification where the change touches shared behavior; do not repeatedly run unrelated suites after sufficient evidence already passes.

Human/CI browser verification is separate from assistant non-browser checks. Local browser setup may require the matching Playwright browser/system dependencies; the owner installs these deliberately. Do not upgrade Playwright solely to obtain a browser executable. The complete final-revision CI gates still apply before readiness.

## 2. Development with Cloud Containers

Connect the intended repository/account and select a workspace for the task. Check branch, HEAD, working tree and remote main; a previous workspace can contain an unfinished task. Confirm the managed environment is ready and supports required tools/network hosts before relying on it.

A useful task prompt supplies:

```text
Repository and branch/revision:
Goal or reproducible bug:
Expected behavior and relevant BR IDs:
Observed behavior / redacted evidence:
Scope and things to preserve:
Requested deliverable: reviewed change and draft PR
Testing constraints: follow AGENTS.md; browsers are owner/CI-operated
```

Ask the agent to inspect the owning code and current documents, implement the smallest coherent change, review affected tests, run allowed checks, update the owning documentation and publish a task branch/draft PR. State any deployment/merge authority explicitly; a development request alone does not authorise those actions.

Use managed secret bindings and scoped connections where needed. Do not paste production credentials into chat, source, screenshots or a ZIP. A credential placeholder or restricted API error does not justify bypassing network policy, replacing injected credentials or disabling TLS verification. If access is unavailable, the agent should explain the missing capability and continue independent local work where possible.

The agent may run non-browser code/Worker checks within their documented isolated scope. Under current AGENTS rules, it does not run Playwright, browser screenshots, `npm run verify`, `verify:browser`, browser-running installers or real bookings/payments/notifications. The job named `verify / live-email` does not itself prove real provider email delivery; inspect its fixtures and distinguish CI evidence from owner inbox acceptance.

- After a push, inspect the exact PR head and its checks.
- A new push can supersede an older PR run.
- Preserve the first failure and correct its cause; do not weaken inventories/timeouts/assertions to make CI green.
- At a pause, record branch/HEAD, PR/run links, checks performed, unresolved issues and next action in the appropriate progress evidence.
- Do not assume an agent continues monitoring after the chat turn ends.

## 3. Development through a ZIP attached to chat

### Prepare an identifiable source snapshot

Prefer a clean, committed task revision. Review the tracked file list for accidental secrets/customer data before packaging. A Git archive includes committed tracked files, including tracked dotfiles, but excludes untracked files and `.git` history; it is not automatically a privacy scrubber.

Example source archive (run from the intended repository):

```bash
git status --short
git rev-parse HEAD
git ls-files
git archive --format=zip --output=../soccerbot-source.zip HEAD
```

- Record the full SHA and SHA-256 of the ZIP.
- On macOS use `shasum -a 256 ../soccerbot-source.zip`; on Linux use `sha256sum ../soccerbot-source.zip`.
- Give the ZIP a meaningful task/revision filename when practical.
- If the task depends on uncommitted changes, either commit reviewed changes to the task branch or explicitly supply a reviewed patch and its baseline; do not describe the archive as including edits that `git archive HEAD` omits.

Include source, lockfile, manifests, workflow files, `AGENTS.md` and relevant docs/tests. Exclude credentials, `.env` files, provider exports, customer data, `.git` credentials/configuration, `node_modules`, build output, caches and unrelated logs. If any sensitive file was tracked, remove it from the delivery and resolve the exposure before sharing; do not assume `.gitignore` removes already tracked files.

Attach the ZIP through the chat attachment control. Alongside it, give the repository, branch, full source SHA, archive checksum, task and expected outcome. Attach only necessary redacted failure evidence separately. Explain whether the chat has repository/tool access; archive-only work cannot honestly claim a GitHub push or verified remote state.

### Review the returned changes

Ask for a changed-file summary, patch or complete changed files, relevant test results, unresolved limitations and the exact baseline used. The assistant should inspect archive paths before extraction and reject path traversal, unsafe symlinks or unexpected case collisions; extraction should use an isolated directory, never overwrite the active checkout blindly.

- Integrate the result into a task branch whose baseline matches the supplied snapshot.
- Review file deletions and configuration changes carefully.
- For a returned Git patch, first inspect it and use `git apply --check` before applying.
- If current main has moved, reconcile the changes explicitly; do not force a patch onto mismatched files.
- Restore excluded local configuration through normal secure setup rather than copying secrets from the chat package.

Run the meaningful affected checks on the integrated bytes, review the diff and follow the same commit/push/PR path below. Chat-reported tests on an extracted snapshot do not replace final-commit CI or provider acceptance.

### If a local installer is requested

A source ZIP is not an executable installer. Routine cloud work needs no Mac installer. When an installer is specifically requested, use the repository's [builder](../scripts/build-local-installer.py), [runner](../scripts/local-installer.py) and [guarded updater](../scripts/guarded-update.py) under AGENTS delivery rules. The builder takes a reviewed manifest path and output path; consult `python3 scripts/build-local-installer.py --help` rather than inventing a manifest or running an old bundled shell.

The delivery must bind baseline/candidate bytes, inventory, paths/case and receipt hashes, preserve external backups/failure evidence and identify the exact file/checksum. Planning scope permits only its approved documentation/tooling owners and cannot be used to bypass application checks. Application installers can execute browsers and therefore remain owner-operated. A checksum verifies the delivered bytes, not their correctness or trustworthiness by itself.

## GitHub publishing and what CI does

### Review, commit and push

Before publication, inspect the working tree and diff; stage only the intended files. Example commands, replacing the paths and branch with the actual task:

```bash
git status --short
git diff
git diff --check
git add path/to/changed-file path/to/related-test
git diff --cached
git commit -m "Describe the concrete change"
git push -u origin fix/short-task-name
```

Create or update one draft PR against `main` through GitHub, an authorised connector or an available CLI. Describe the problem/result, meaningful validation and remaining acceptance. Keep title/body aligned with the final scope; do not create a new PR for every small correction. Do not force-push or push directly to main as a substitute for review.

For upstream changes, fetch and inspect first. If required, merge current main into the task branch, resolve conflicts in their owning files and rerun affected checks; final-head CI must cover the resolved revision. Preserve unrelated work and existing failure evidence.

### Expected Actions behavior

| Action                              | Expected behavior                                                                                                                   | What it does not establish                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Open/update PR                      | Verify runs frontend, backend and live-email gates; new PR pushes can cancel superseded runs                                        | No PR merge or automatic client production deployment                               |
| Frontend verification               | Source/policy, dependency audit, tooling/installer, formatting/lint/types, unit/build/export and browser scope through the verifier | Real provider/inbox acceptance                                                      |
| Backend and live-email verification | Isolated Worker checks, load smoke, respective browser composition and release evidence packaging                                   | Permission to consume real bookings or send notifications                           |
| Versions report                     | Observed Node/npm/Python, checkout revision and full inventory in job summary/evidence                                              | An independently proven deployed version; PR checkout SHA may be GitHub's merge ref |
| Authorised merge                    | Main verifies the merged revision independently                                                                                     | A green PR alone does not prove main/deployment succeeded                           |
| Legacy main deployment              | Separate GitHub Pages export and Cloudflare developer deployment consume verified artifacts under their workflow gates              | Client production activation                                                        |
| Portable target deployment          | Explicit target verification and manual staging/production dispatch using the exact verified revision/artifact                      | Automatic trusted PR staging or paid GitHub approval protections                    |
| Dependabot schedule                 | Update-generation jobs propose version PRs; security updates may arrive separately                                                  | Update jobs labelled main do not mean updates were merged                           |

Inspect the actual [workflows](../.github/workflows) and [runbook](runbook.md) for current behavior. The archived [legacy workflow](../.github/legacy/verify.yml) preserves former developer policy fixtures and is not an active client workflow. Report these outcomes separately. Required application readiness remains all three final-head gates, followed by applicable main/deployment verification.

- When CI fails, open the failing job and retained evidence, identify the first failure and fix that cause.
- Do not equate “cancelled” with a test failure or a green Dependabot generation job with a patched deployment.
- A draft PR can run checks; keep it draft until the final revision meets readiness.
- Merge/deploy only with applicable explicit authorization.
- After an authorised deployment, verify receipt/health revision and arrange any necessary owner/provider acceptance.

## Current engineering expectations

This is an explanatory summary of [AGENTS](../AGENTS.md), not a second rules authority:

- Keep one owner for each responsibility; edit existing modules and update affected tests instead of layering duplicate code or broad CSS overrides.
- Preserve business-rule invariants, customer/privacy boundaries, accepted migrations and existing developer staging/coordinator identity.
- Preserve unknown edits, worktrees and dependency symlinks. Use current manifests and approved scoped credentials; never expose secrets.
- Keep meaningful checks strict. Investigate failures without skipped cases, relaxed inventories, forced clicks, blanket retries or longer timeouts to conceal defects.
- Update the document that owns the information: Progress for evidence/status, Business rules for invariants, Domain operations and API contracts for service boundaries, Journey for dated decisions, Runbook for operations, code map for responsibility, versions generator for inventory.
- Separate source completion, local checks, CI, merge, deployment and owner/provider acceptance. Browser and live-provider actions retain their stated owner/CI boundaries.

For dependency changes, follow the [runbook procedure](runbook.md#3-dependency-maintenance-and-dependabot) and run `node scripts/versions.mjs write` so [versions.md](versions.md) stays current. Do not bypass a freshness failure or use `npm audit fix --force` as routine setup.

## Development setup

Use Node/npm pinned by `.nvmrc` and `package.json`, Python 3.11+ and Git. On initial setup, install the reviewed lockfile with `npm ci`; routine work reuses matching dependencies and browser caches. Browser dependencies are installed deliberately by the owner or CI.

The Worker test runtime is pinned to Miniflare `5.20261023.0-beta`, matching Wrangler `4.153.0` and its patched Sharp/Undici dependencies. Keep the package/lockfile and reviewed prerelease policy pin aligned; validate the full Worker suite before changing this runtime.

The **Master booking regression** job exercises one continuous two-tab checkout journey on desktop Chromium, phone WebKit and tablet WebKit. Open its artifact for per-device results and failure traces. The regular shards exclude this case. The live-email gate verifies the master report against the same build and includes it in the complete browser inventory before staging.

CI uses the official Playwright Noble image matching the locked Playwright version, with browsers/system libraries already installed. Node remains pinned by `.nvmrc`; the pinned setup-python action supplies Python 3.12 for installer checks. Update the image alongside Playwright when upgrading. This avoids repeated Ubuntu mirror downloads without changing test gates or job limits.

`npm run dev` starts local development; `npm run build` creates `out/`; `npm run preview` serves that export locally. The default base path is `/SoccerBotStudioSG`; root hosting uses a separately verified empty-prefix build. Client provisioning and portability requirements live in [Business rules](business-rules.md#deployment-migration-and-acceptance).

- When upgrading Playwright, update its exact package/lock versions and all matching active CI container images together.
- The retained `.github/legacy/verify.yml` policy fixture must match too.
- Regenerate `docs/versions.md`; version-drift tests must mutate the configured version rather than a historical literal.
- Cloud Containers dependencies must be reinstalled from the selected lockfile, and any externally published browser-image/bootstrap pins must be refreshed before owner browser execution; a repository change does not publish environment settings.
- Preserve prior dependency directories and runtime evidence during the transition.
- The Node-only `scripts/browser-clock.test.mjs` exercises the installed Playwright injected clock against the real customer-suite setup in a VM; it extracts that source from the installed bundle and fails explicitly if the internal layout changes.
- Keep both normal progression and frozen-clock regression assertions when adapting that loader; no browser or mock clock substitutes for this check.
- The local installer’s isolated `browser_inventory` adapter also inspects the installed Playwright registry through its exported bundle to resolve Chromium Headless Shell and WebKit executables.
- This remains a version-sensitive tooling boundary because Playwright has no public headless-shell path API; an installer regression calls the real adapter without launching or downloading browsers, while fixture tests retain missing-binary and headless-only checks.

## Verification commands

For CI failure investigation, resource pressure or changes to sharding/lifecycle, apply the [CI-diagnosis skill](../.agents/skills/soccerbot-ci-diagnosis/SKILL.md) alongside the test-maintenance skill. It owns causal investigation and resource experiments; the commands and execution boundaries below remain authoritative.

Full/code verification includes `npm audit --audit-level=high`: known high/critical advisories or an unavailable audit service fail the gate. Audit output is retained in the normal verification receipt/logs. Alerts and security-update PRs complement this gate; a clean audit is not proof against unknown vulnerabilities.

| Command                                     | Scope                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| `npm run check:source` / `check:policy`     | Source ownership, imports and configuration policy.             |
| `npm run check:tooling` / `check:installer` | Tooling and guarded installer regression checks.                |
| `npm run verify:code`                       | Full non-browser application/tooling checks, build and export.  |
| `npm run verify:worker`                     | Isolated Worker types and runtime suite.                        |
| `npm run verify:browser`                    | Browser suite operated by owner/CI under AGENTS.                |
| `npm run verify`                            | Combined application/browser verification operated by owner/CI. |

## Browser testing coverage

- [Playwright projects](../playwright.config.ts) declare the desktop, phone and tablet profiles. [Versions](versions.md) owns the pinned tools.
- PR browser gates run Chromium and WebKit with isolated fixtures. Check the actual run receipt for the tested revision and executed projects.
- The owner tests real Safari, Chrome, Samsung Internet, provider redirects, banking apps and on-screen keyboards on the physical devices. Use the [customer worksheet](uat/simulated-user.md).

## Configuration

- For a local live frontend build, supply the public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` through your shell or an ignored `.env.local` file.
- The `live-email` target CI job supplies this build-time value from `deployment/production.json` or `deployment/staging.json`; client setup must supply the client's public widget key.
- Cloudflare Worker secrets separately hold the private `TURNSTILE_SECRET` for developer staging or `TURNSTILE_SECRET_KEY` for production, and provider credentials; setting Worker secrets does not configure the static frontend build.
- Default local development remains demo; live builds require their own verification.

[Historical verification receipts](https://github.com/LimYouSheng/SoccerBotStudioSG/tree/d7a8d2b209b535d23a62702e4d59538e00a47012/docs) remain in Git history, not current source inventories.

## Portable deployment scaffold

- Choose the [staging](../deployment/staging.json) or [production](../deployment/production.json) manifest. It owns resource identities, origin, public widget key, access profile, SimplyBook mapping and merchant binding.
- Validate changes to target or build-time configuration against that target’s verified artifact. Deployments retain separate credentials and durable state.
- [Deployment and rollback](runbook.md#6-deployments-and-rollback) owns the release commands, artifact checks, recovery procedure and registration workflow.
- [Provider configuration](external-providers-config.md) owns the service settings. [Architecture](architecture/adr.md) records the hosting choice.

### Optional CSS compiler fallback host support

Tailwind4.3.4’s optional oxide WASM fallback declares Node `^20.19.0 || ^22.13.0 || >=23.5.0`, increased from `>=14.0.0` in4.3.3. The configured Node24.19.0 satisfies this range; native oxide retains Node>=20. Linux native CI does not establish execution of the optional WASM fallback or native macOS/Windows acceptance. These are build-host requirements, not new customer-browser restrictions; exact package metadata is retained in package-lock.json.

The static export check requires the initial fixed cover and hidden/inert main content on every route. Checkout Review/payment/confirmation exports use the initial “Checking booking…” status; other routes use “Loading page”. The deployment tests reject a wrong route-specific label as well as missing covers and visible unfinished content.

Dependency verification runs `node scripts/dependency-audit.mjs`; it preserves raw npm findings and enforces the high/critical gate with only the [dated owner-approved exception](security/false-positives.md#temporary-picomatch-risk-acceptance). `npm audit --json` remains the unfiltered diagnostic view.

The unit/component runner caps larger hosts at two concurrent workers, retaining one worker on one/two-CPU machines. This leaves headroom for DOM work, transforms and supervision; all declared cases still run with zero retries and their normal deadlines. The browser and Worker schedules are unchanged.
