# Continuous development guide

- See [External providers configuration](external-providers-config.md) for SimplyBook, Resend, HitPay and Cloudflare settings, environment differences and verification limits.

- > **Guidance only, not a strict requirement.** These workflows are practical examples; adapt them to the task and available tools.
- [AGENTS.md](../AGENTS.md) remains the authority for repository engineering rules and action boundaries.
- This guide does not override those rules or authorise merges, deployments, provider changes or financial actions.

- Paths and commands below assume the repository root unless stated otherwise.
- GitHub is canonical; a local checkout, Codex workspace or attached ZIP is a revision snapshot.
- Always establish which revision you are editing before combining work.

## Choose a development workflow

| Way                                                                      | Best suited to                                                          | Where work happens                                      | How changes return                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [1. Local VS Code](#1-local-development-with-vs-code)                    | Interactive editing, local debugging and owner-operated browser testing | Your computer and task branch                           | Review diff, commit, push, draft PR                                                              |
| [2. Cloud Containers](#2-development-with-cloud-containers)              | Repository inspection, focused fixes and automated non-browser checks   | Connected repository and managed workspace              | Agent pushes a task branch and opens/updates a draft PR when available                           |
| [3. ZIP attached to chat](#3-development-through-a-zip-attached-to-chat) | File-based review when direct repository access is unavailable          | A clearly identified source snapshot and chat workspace | Reviewed patch/files or guarded installer, then integration into a local branch and normal PR/CI |

- All three routes converge on the same reviewed source and verification process.
- A ZIP or chat response is not a separate deployment pipeline.

## What to read before changing code

- Start with [AGENTS](../AGENTS.md), [North Star](../NORTH_STAR.md) and [Progress](../PROGRESS.md).
- Then follow the task-specific reading order in AGENTS:

- [Business rules](business-rules.md#current-system-rules) define expected behavior and acceptance boundaries.
- [Architecture](architecture/adr.md) and [system diagrams](architecture/diagram.md) explain runtime responsibilities.
- [Code owners](code-owners/index.md) links each feature and business-rule group to its implementation.
- [Versions](versions.md) lists configured tools and locked packages; run evidence records observed tool versions.
- [Runbook](runbook.md) covers incidents, dependencies, monitoring, deployment and recovery.
- [Admin](tests/uat/admin.md), [Trainers](tests/uat/trainers.md) and [Simulated-user](tests/uat/customer.md) worksheets guide owner-operated acceptance.

## 1. Local development with VS Code

### Clone or refresh safely

- Use your own GitHub account with repository access.
- Authenticate through approved Git/VS Code/GitHub tooling; do not put access tokens into remote URLs or source files.
- For a first checkout of the current canonical repository:

```bash
git clone https://github.com/LimYouSheng/SoccerBotStudioSG.git
cd SoccerBotStudioSG
git status --short
git remote -v
code .
```

- `code .` is optional; use VS Code → Open Folder if its shell command is unavailable.
- Select the repository root so its TypeScript, ESLint and formatting configuration are used.
- Avoid conflicting editor formatters; inspect any format-on-save diff before committing.

- For an existing checkout, inspect the branch and working tree first.
- Preserve personal edits and worktrees; do not reset or automatically stash unfamiliar work.
- In a clean checkout, an example new-task flow is:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c fix/short-task-name
```

- Use `feat/…` or `docs/…` when appropriate.
- If main cannot fast-forward, inspect the divergence before changing history.
- A separate worktree is useful when another task has uncommitted work; verify its dependency setup rather than replacing an existing `node_modules` symlink.

### Install and run

- Use the current `.nvmrc` and `package.json` versions, not a version copied from an old chat.
- With an existing nvm installation:

```bash
nvm install
nvm use
node --version
npm --version
python3 --version
npm ci
npm run dev
```

- If you use another Node manager, select the same pinned version with that tool.
- Compare npm with `packageManager` and resolve mismatches deliberately.
- `npm ci` installs the reviewed lockfile; do not use a broad dependency update merely to start development.
- Reuse matching dependencies/caches during routine work.
- Python supports verification/installer tooling, not the hosted application runtime.

- Use the dev server URL printed in your terminal.
- The default base path is `/SoccerBotStudioSG`; inspect configuration before assuming root hosting.
- To inspect the static export, build then preview it with the commands in [Development setup](#development-setup).
- The local preview is not a public share URL.
- Default local composition is demo; it does not prove the live Worker/provider flow.

- As the human developer, use VS Code debugging, browser developer tools and breakpoints to reproduce the issue.
- Record steps, expected/actual behavior and useful redacted evidence.
- Do not perform real provider mutations while debugging unless they are part of an explicitly arranged owner test.

### Iterate and verify

- Edit the existing owning module and affected tests, then run checks appropriate to the change.
- Examples include the relevant `node --test` tooling test, application test, source/policy checks or isolated Worker verification.
- Broaden verification where the change touches shared behavior; do not repeatedly run unrelated suites after sufficient evidence already passes.

- Human/CI browser verification is separate from assistant non-browser checks.
- Local browser setup may require the matching Playwright browser/system dependencies; the owner installs these deliberately.
- Do not upgrade Playwright solely to obtain a browser executable.
- The complete final-revision CI gates still apply before readiness.

## 2. Development with Cloud Containers

- Connect the intended repository/account and select a workspace for the task.
- Check branch, HEAD, working tree and remote main; a previous workspace can contain an unfinished task.
- Confirm the managed environment is ready and supports required tools/network hosts before relying on it.

- A useful task prompt supplies:

```text
Repository and branch/revision:
Goal or reproducible bug:
Expected behavior and relevant BR IDs:
Observed behavior / redacted evidence:
Scope and things to preserve:
Requested deliverable: reviewed change and draft PR
Testing constraints: follow AGENTS.md; browsers are owner/CI-operated
```

- Ask the agent to inspect the owning code and current documents, implement the smallest coherent change, review affected tests, run allowed checks, update the owning documentation and publish a task branch/draft PR.
- State any deployment/merge authority explicitly; a development request alone does not authorise those actions.

- Use managed secret bindings and scoped connections where needed.
- Do not paste production credentials into chat, source, screenshots or a ZIP.
- A credential placeholder or restricted API error does not justify bypassing network policy, replacing injected credentials or disabling TLS verification.
- If access is unavailable, the agent should explain the missing capability and continue independent local work where possible.

- The agent may run non-browser code/Worker checks within their documented isolated scope.
- Under current AGENTS rules, it does not run Playwright, browser screenshots, `npm run verify`, `verify:browser`, browser-running installers or real bookings/payments/notifications.
- The job named `verify / live-email` does not itself prove real provider email delivery; inspect its fixtures and distinguish CI evidence from owner inbox acceptance.

- After a push, inspect the exact PR head and its checks.
- A new push can supersede an older PR run.
- Preserve the first failure and correct its cause; do not weaken inventories/timeouts/assertions to make CI green.
- At a pause, record branch/HEAD, PR/run links, checks performed, unresolved issues and next action in the appropriate progress evidence.
- Do not assume an agent continues monitoring after the chat turn ends.

## 3. Development through a ZIP attached to chat

### Prepare an identifiable source snapshot

- Prefer a clean, committed task revision.
- Review the tracked file list for accidental secrets/customer data before packaging.
- A Git archive includes committed tracked files, including tracked dotfiles, but excludes untracked files and `.git` history; it is not automatically a privacy scrubber.

- Example source archive (run from the intended repository):

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

- Include source, lockfile, manifests, workflow files, `AGENTS.md` and relevant docs/tests.
- Exclude credentials, `.env` files, provider exports, customer data, `.git` credentials/configuration, `node_modules`, build output, caches and unrelated logs.
- If any sensitive file was tracked, remove it from the delivery and resolve the exposure before sharing; do not assume `.gitignore` removes already tracked files.

- Attach the ZIP through the chat attachment control.
- Alongside it, give the repository, branch, full source SHA, archive checksum, task and expected outcome.
- Attach only necessary redacted failure evidence separately.
- Explain whether the chat has repository/tool access; archive-only work cannot honestly claim a GitHub push or verified remote state.

### Review the returned changes

- Ask for a changed-file summary, patch or complete changed files, relevant test results, unresolved limitations and the exact baseline used.
- The assistant should inspect archive paths before extraction and reject path traversal, unsafe symlinks or unexpected case collisions; extraction should use an isolated directory, never overwrite the active checkout blindly.

- Integrate the result into a task branch whose baseline matches the supplied snapshot.
- Review file deletions and configuration changes carefully.
- For a returned Git patch, first inspect it and use `git apply --check` before applying.
- If current main has moved, reconcile the changes explicitly; do not force a patch onto mismatched files.
- Restore excluded local configuration through normal secure setup rather than copying secrets from the chat package.

- Run the meaningful affected checks on the integrated bytes, review the diff and follow the same commit/push/PR path below.
- Chat-reported tests on an extracted snapshot do not replace final-commit CI or provider acceptance.

### If a local installer is requested

- A source ZIP is not an executable installer.
- Routine cloud work needs no Mac installer.
- When an installer is specifically requested, use the repository's [builder](../scripts/build-local-installer.py), [runner](../scripts/local-installer.py) and [guarded updater](../scripts/guarded-update.py) under AGENTS delivery rules.
- The builder takes a reviewed manifest path and output path; consult `python3 scripts/build-local-installer.py --help` rather than inventing a manifest or running an old bundled shell.

- The delivery must bind baseline/candidate bytes, inventory, paths/case and receipt hashes, preserve external backups/failure evidence and identify the exact file/checksum.
- Planning scope permits only its approved documentation/tooling owners and cannot be used to bypass application checks.
- Application installers can execute browsers and therefore remain owner-operated.
- A checksum verifies the delivered bytes, not their correctness or trustworthiness by itself.

## GitHub publishing and what CI does

### Review, commit and push

- Before publication, inspect the working tree and diff; stage only the intended files.
- Example commands, replacing the paths and branch with the actual task:

```bash
git status --short
git diff
git diff --check
git add path/to/changed-file path/to/related-test
git diff --cached
git commit -m "Describe the concrete change"
git push -u origin fix/short-task-name
```

- Create or update one draft PR against `main` through GitHub, an authorised connector or an available CLI.
- Describe the problem/result, meaningful validation and remaining acceptance.
- Keep title/body aligned with the final scope; do not create a new PR for every small correction.
- Do not force-push or push directly to main as a substitute for review.

- For upstream changes, fetch and inspect first.
- If required, merge current main into the task branch, resolve conflicts in their owning files and rerun affected checks; final-head CI must cover the resolved revision.
- Preserve unrelated work and existing failure evidence.

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

- Inspect the actual [workflows](../.github/workflows) and [runbook](runbook.md) for current behavior.
- The archived [legacy workflow](../.github/legacy/verify.yml) preserves former developer policy fixtures and is not an active client workflow.
- Report these outcomes separately.
- Required application readiness remains all three final-head gates, followed by applicable main/deployment verification.

- When CI fails, open the failing job and retained evidence, identify the first failure and fix that cause.
- Do not equate “cancelled” with a test failure or a green Dependabot generation job with a patched deployment.
- A draft PR can run checks; keep it draft until the final revision meets readiness.
- Merge/deploy only with applicable explicit authorization.
- After an authorised deployment, verify receipt/health revision and arrange any necessary owner/provider acceptance.

## Current engineering expectations

- This is an explanatory summary of [AGENTS](../AGENTS.md), not a second rules authority:

- Keep one owner for each responsibility; edit existing modules and update affected tests instead of layering duplicate code or broad CSS overrides.
- Preserve business-rule invariants, customer/privacy boundaries, accepted migrations and existing developer staging/coordinator identity.
- Preserve unknown edits, worktrees and dependency symlinks.
  - Use current manifests and approved scoped credentials; never expose secrets.
- Keep meaningful checks strict.
  - Investigate failures without skipped cases, relaxed inventories, forced clicks, blanket retries or longer timeouts to conceal defects.
- Update the document that owns the information: Progress for evidence/status, Business rules for invariants, Domain operations and API contracts for service boundaries, Journey for dated decisions, Runbook for operations, code map for responsibility, versions generator for inventory.
- Separate source completion, local checks, CI, merge, deployment and owner/provider acceptance.
  - Browser and live-provider actions retain their stated owner/CI boundaries.

- For dependency changes, follow the [runbook procedure](runbook.md#3-dependency-maintenance-and-dependabot) and run `node scripts/versions.mjs write` so [versions.md](versions.md) stays current.
- Do not bypass a freshness failure or use `npm audit fix --force` as routine setup.

## Development setup

- Use Node/npm pinned by `.nvmrc` and `package.json`, Python 3.11+ and Git.
- On initial setup, install the reviewed lockfile with `npm ci`; routine work reuses matching dependencies and browser caches.
- Browser dependencies are installed deliberately by the owner or CI.

- The Worker test runtime is pinned to Miniflare `5.20261023.0-beta`, matching Wrangler `4.153.0` and its patched Sharp/Undici dependencies.
- Keep the package/lockfile and reviewed prerelease policy pin aligned; validate the full Worker suite before changing this runtime.

- CI uses the official Playwright Noble image matching the locked Playwright version, with browsers/system libraries already installed.
- Node remains pinned by `.nvmrc`; the pinned setup-python action supplies Python 3.12 for installer checks.
- Update the image alongside Playwright when upgrading.
- This avoids repeated Ubuntu mirror downloads without changing test gates or job limits.

- `npm run dev` starts local development; `npm run build` creates `out/`; `npm run preview` serves that export locally.
- The default base path is `/SoccerBotStudioSG`; root hosting uses a separately verified empty-prefix build.
- Client provisioning and portability requirements live in [Business rules](business-rules.md#deployment-migration-and-acceptance).

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

- For CI failure investigation, resource pressure or changes to sharding/lifecycle, apply the [CI-diagnosis skill](../.agents/skills/soccerbot-ci-diagnosis/SKILL.md) alongside the test-maintenance skill.
- It owns causal investigation and resource experiments; the commands and execution boundaries below remain authoritative.

- Full/code verification includes `npm audit --audit-level=high`: known high/critical advisories or an unavailable audit service fail the gate.
- Audit output is retained in the normal verification receipt/logs.
- Alerts and security-update PRs complement this gate; a clean audit is not proof against unknown vulnerabilities.

| Command                                     | Scope                                                           |
| ------------------------------------------- | --------------------------------------------------------------- |
| `npm run check:source` / `check:policy`     | Source ownership, imports and configuration policy.             |
| `npm run check:tooling` / `check:installer` | Tooling and guarded installer regression checks.                |
| `npm run verify:code`                       | Full non-browser application/tooling checks, build and export.  |
| `npm run verify:worker`                     | Isolated Worker types and runtime suite.                        |
| `npm run verify:browser`                    | Browser suite operated by owner/CI under AGENTS.                |
| `npm run verify`                            | Combined application/browser verification operated by owner/CI. |

## Browser testing coverage

- [Test suite and safeguards](tests/test-suite.md): current layers, browser profiles, regression protection and evidence limits.
- Automated browsers: desktop Chromium, phone WebKit and tablet WebKit; owner/CI executes browsers.
  - Linux emulation does not establish physical-device or real-provider acceptance.
- [Customer](tests/uat/customer.md), [Admin](tests/uat/admin.md) and [Trainer](tests/uat/trainers.md): two-page task/expected-result worksheets; record exact revision, environment and device versions.
- [Versions](versions.md) owns pins; [Journey](journey.md#browser-testing-coverage) retains prior engine matrices and upgrade evidence.
  - Dependency PRs still require the [support-range comparison](../.agents/skills/soccerbot-dependencies/SKILL.md#required-support-range-comparison-in-every-dependency-pr).

## Configuration

- For a local live frontend build, supply the public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` through your shell or an ignored `.env.local` file.
- The `live-email` target CI job supplies this build-time value from `deployment/production.json` or `deployment/staging.json`; client setup must supply the client's public widget key.
- Cloudflare Worker secrets separately hold the private `TURNSTILE_SECRET` for developer staging or `TURNSTILE_SECRET_KEY` for production, and provider credentials; setting Worker secrets does not configure the static frontend build.
- Default local development remains demo; live builds require their own verification.

- [Historical verification receipts](https://github.com/LimYouSheng/SoccerBotStudioSG/tree/d7a8d2b209b535d23a62702e4d59538e00a47012/docs) remain in Git history, not current source inventories.

## Portable deployment scaffold

- `deployment/staging.json` owns the existing developer resource identity and sandbox mapping.
- `deployment/production.json` records the verified client account, existing D1 and closed temporary origin `https://soccerbot-production.lucky-poetry-b25e.workers.dev`.
- Its public widget is scoped to that hostname.
- Domain hookup, server secrets, foundation registration and client activation are separate.
- The required `coordinatorLocationHint` is empty for existing developer staging and `apac-ne` for the client KIX database.
- Production rejects an empty or unsupported hint.
- `worker/bindings.ts` owns all application coordinator acquisition and supplies the hint on first use; hints do not relocate existing objects or establish actual location.
- Neither file accepts secret fields.
- Missing values fail validation; production cannot inherit staging identities or enable customer/provider access.

- The prepared workflows are:

| Workflow             | Operation                                                                                                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-target.yml`  | Verify the exact PR head for staging, pushed main for production, or an explicit manual target with frontend, backend and live-email gates. Package the tested root export, backend, SQL and optional Pages entry; no deployment credentials.                               |
| `deploy-release.yml` | One completion workflow with separate staging/production jobs and account-scoped tokens. Successful trusted PR verification selects staging; successful pushed-main verification selects production. Manual recovery requires an explicit target and verified revision/run. |

- Deployment inputs are the full revision and successful target verification run ID.
- The deploy job checks GitHub's run/repository/attempt/gate evidence, then artifact hashes, target digest, browser composition, selected account, existing D1 and the selected entry resources before writes.
- It consumes the artifact without rebuilding.
- The client SaaS target checks the dedicated zone/account, active fallback, proxied `AAAA 100::` record and absence of competing routes.
- It deploys the zone-scoped `*/*` route with the real Worker, then checks route ownership.
- All client assets pass through the canonical-origin guard;
- Workers.dev and previews are disabled.
- The optional Pages target instead forwards to a same-account backend.
- Production does not assume a paid GitHub environment/reviewer feature.
- Repository write access can dispatch workflows; this is an explicit operator action, not independent two-person approval.

- Legacy `verify.yml` is archived outside the workflows directory at `.github/legacy/verify.yml`; it is not an active or manually runnable client workflow.
- Completion triggers cannot filter by conclusion, so failed verification can still create one skipped deployment workflow.
- Historical runs remain.
- Completion workflow changes become active only after reaching default-branch main.

- Target verification retains four required final gates: `verify / worker-runtime`, `verify / frontend`, `verify / backend` and `verify / live-email`.
- Worker suites run once across three explicit groups; load smoke belongs to the sustained group.
- Each root release configuration builds once in `browser-build`; two independent runner shards consume that exact export while Worker verification proceeds.
- The two shards run 23 and 22 of 45 disjoint Playwright batches in fresh processes.
- Every batch must pass one or two complete test cases; desktop Chromium, phone WebKit, tablet WebKit, scenario-internal concurrency/reload/recovery, retries=0 and existing deadlines remain intact.
- Two consecutive-journey cases each have a90-second total budget for three complete bookings in one runtime; existing per-action deadlines and other case budgets are unchanged.
- Frontend combined verification runs the same 45 bounded batches sequentially after its code/build checks; it retains its separate project-path export.

- Backend/live-email final gates wait for Worker, build and shard success.
- Aggregation rejects absent/duplicate batches or cases, skipped/retried/error results, foreign source/profile/build bytes and mixed repository/run/attempt evidence.
- It packages the downloaded tested export without rebuilding.
- The same-run artifact names and build digest seal both shard receipts; final complete-inventory validation remains mandatory.
- All verification/build/shard jobs retain 20-minute limits.
- Matrix fail-fast is disabled so independent failures remain observable.
- Additional runners/startup cost is a deliberate tradeoff for bounded browser lifetime and concurrent execution; speed and storage improvement require exact-head CI evidence.

- Worker grouping is declared in `scripts/worker-groups.mjs`, with file/title pairs in `scripts/worker-test-inventory.json`.
- Each complete suite belongs to one group; no test-name filters, skipped cases or modulo assignment are used.
- Each group runs at most two suite processes concurrently.
- Within a scenario, its fixture retains the same runtime/storage until an explicit restart or final cleanup.

| CI group             | Suites                                                       | Lifecycle purpose                                                                                                              |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `worker / contracts` | catalogue, provider-queue, hitpay, webhook, telemetry, pages | Contract and boundary checks; preserve existing per-case fixtures and in-case concurrency                                      |
| `worker / sustained` | combined-hold, runtime, native, foundation; load smoke       | Dedicated sustained-runtime journeys, competing customers, duplicate effects, transactional faults and shared-state invariants |
| `worker / recovery`  | recovery, provider, identity, identity-delivery              | Recovery, reservations and identity continuity, including persisted-runtime restart cases                                      |

- These are whole-suite scheduling groups, not claims that every case has the same lifecycle.
- In particular, runtime/native/foundation/identity still have legacy suite-shared fixtures; grouping does not prove independent-case isolation.
- Some checkout restart cases evict only the Durable Object; runtime replacement tests preserve durable storage explicitly.
- Helper reconstruction, DO eviction and full runtime restart remain distinct evidence.
- Browser journeys retain their existing separate browser shards and complete scenario lifetimes; they are not substitutes for Worker restart coverage.

- Closed-production health distinguishes installation from activation: `environment` reflects validated configuration and `foundationRegistration` reports `pending` or `registered`.
- Pending is allowed only for an existing empty foundation table with all effect switches explicitly disabled; it does not write storage or invoke a DO.
- Protected routes still require exact registration.
- Deployment checks the explicit state and records it in the receipt; missing/mismatched health fields fail rather than being treated as readiness.
- Foundation registration remains a separate reviewed operation.

- `node scripts/verify-worker.mjs group contracts|sustained|recovery` emits original TAP plus a group receipt.
- `node scripts/verify-worker.mjs merge` is CI aggregation: it performs source/type checks and rejects missing/duplicate/unknown/failed groups, file/title inventory mismatches and foreign source/target/repository/run/attempt receipts.
- The stable `verify / worker-runtime` gate and existing `worker-evidence` artifact remain release prerequisites.
- Local `npm run verify:worker` still validates the complete inventory.
- The three group jobs retain 20-minute limits; measured CI timing, not counts alone, determines whether future rebalancing is needed.

- `node scripts/browser-shards.mjs build|run <index>|merge` is internal CI orchestration.
- Owner-operated `verify`/`verify:browser` use its `local` mode for bounded batches; direct `test:e2e` remains the raw Playwright entry point.
- CI browser orchestration sets its process-local Linux `coredump_filter` to zero before spawning batches and verifies inheritance in the child reporter.
- This excludes bulk memory segments from crash dumps while preserving process failures and Playwright traces; full process-memory postmortems are unavailable for these CI browsers.
- It does not change global kernel settings or delete evidence.
- Original reports/traces and numeric resources stay under `test-results/browser-batches/<batch>/`; before/after snapshots bracket each entire Playwright process, including teardown.
- The aggregate `browser.json`, engine matrix and verification receipt preserve existing release consumers.
- Missing counters remain null; bounded unlinked-file diagnostics report inaccessible mappings explicitly and do not prove a complete process-storage inventory.
- Live-email shard runners retain `/tmp` as a verified 2 GiB tmpfs; artifacts and Worker/storage regressions remain disk-backed.
- This does not establish live-provider latency or production power-loss durability.

- Configuration required before enabling client deployment:

| Location                        | Required setting                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository variables            | `DEPLOYMENT_MODE=portable` switches off the legacy main Cloudflare job; leave unset until cutover is reviewed.                                                                                                                                                                                                |
| Repository variables            | `STAGING_DEPLOY_ENABLED=true`, `PRODUCTION_DEPLOY_ENABLED=true` independently enable the prepared workflows. Leave unset during preparation.                                                                                                                                                                  |
| Repository variables            | `STAGING_CLOUDFLARE_ACCOUNT_ID`, `PRODUCTION_CLOUDFLARE_ACCOUNT_ID` must match their reviewed JSON targets.                                                                                                                                                                                                   |
| Repository variable             | `STAGING_RESERVED_REVISION` reserves exactly one full source SHA during owner testing.                                                                                                                                                                                                                        |
| Repository secrets              | `STAGING_CLOUDFLARE_API_TOKEN` and `PRODUCTION_CLOUDFLARE_API_TOKEN`, separately scoped to their accounts/resources. Do not put provider secrets in these JSON files or CI build inputs.                                                                                                                      |
| Public target JSON              | Repository, account, existing resource names/IDs, coordinator name/location hint, canonical origin, Turnstile public key and exactly one SaaS zone or Pages project. Keep staging's Worker/D1/DO identities unchanged. Update the staging repository field only when moving control to the client repository. |
| Cloudflare, separately reviewed | Existing D1, SaaS zone/fallback/custom hostname (or optional Pages project/domain), Worker secrets and immutable foundation registration. A closed first upload may create the declared Worker; it never creates databases, Pages projects, DNS, provider accounts or foundation identity.                    |

- A closed client install does not require a prior healthy Worker.
- D1 skips applied migrations; intermediate deployment receipts identify the last completed phase if upload or Pages deployment fails.
- Reuse the same reviewed resource IDs/artifact after diagnosing a failure.
- There is no automatic rollback, data reset or resource recreation.
- First-install/interruption behavior still needs cloud acceptance; database foundation registration and placement must be validated separately before opening access.

- SimplyBook credential selection follows validated `ENVIRONMENT`: developer uses `SIMPLYBOOK_DEV_*`, production uses `SIMPLYBOOK_PROD_*`, for suffixes `COMPANY_LOGIN`, `ADMIN_LOGIN`, `API_KEY`, `ADMIN_API_USER_KEY` and `SIGNING_SECRET`.
- Install values as Worker secrets in the matching account, never in GitHub build variables or public manifests.
- There is no fallback between environments.
- Production authentication requires the company secret to match `SIMPLYBOOK_EXPECTED_COMPANY_LOGIN`.
- The production manifest's public `simplybook` mapping supplies that expected company and explicit `PRIMARY_SERVICE_ID`/`PREMIUM_SERVICE_ID` (soccerbotadmin, 3/4); target digests and artifact checks seal those values.
- Developer primary service remains 2.
- Missing or equal production service IDs reject calendar selection.
- Health reports credential presence only, not authentication success.
- The client guest path additionally requires explicit `CLIENT_SANDBOX_ACCESS=enabled`, matching expected/actual HitPay sandbox merchant and business ID, matching client company and distinct service IDs, the reviewed sandbox contract and manual SimplyBook external accounting.
- Native grants use the client price profile and retain their environment through payment/recovery.
- Production artifacts force CLIENT_SANDBOX_ACCESS=disabled and continue to reject customer/payment activation.
- Identity email delivery and live merchant contracts remain outside this sandbox path.

- This scaffold is **not live client portability acceptance**.
- Client guest sandbox service/price and account/merchant scope are implemented for verification, while sender scope, live payment host/merchant contracts and activation remain closed/pending; developer-specific historical tools and accepted migrations are preserved.
- Finish those runtime/provider contracts before enabling client bookings.
- Automatic deployment runs through `workflow_run` controllers on trusted main.
- PR verification has no secrets; deployment rejects fork/bot PRs, draft/closed PRs, superseded heads, authors without current repository write permission and mixed attempts.
- Manual staging dispatch still requires a reserved revision.
- The archived legacy Verify file retains developer policy fixtures only; it is not discovered by GitHub Actions.
- Disable deployment in the former repository before enabling the client-owned repository.

- For temporary client hosting, the closed target may use the exact configured Worker name under the verified account's Workers.dev subdomain, with previews disabled and no Pages/SaaS target.
- This does not bypass account, D1, artifact or canonical-origin checks.
- Domain migration later requires a new reviewed target build; no DNS changes occur during bootstrap.
- GitHub settings and encrypted secrets are not copied by a Git push.
- Keep production disabled until its credential is configured; do not copy a proxy credential placeholder into GitHub.

- The closed-production management command is `node scripts/foundation-setup.mjs inspect|register|initialize ARTIFACT_DIR REVISION NAMESPACE_ID OUTPUT [PREVIOUS_RECEIPT]`; see the [registration procedure](runbook.md#closed-production-foundation-registration).
- It uses Wrangler's authenticated remote **service binding**, not a local Durable Object namespace, and disposes the temporary proxy afterward.
- `FoundationManagement` is a named internal entrypoint with no public HTTP handler.
- The ordinary build, health and deployment paths never call registration.
- Local acceptance uses isolated runtime/storage and intercepted providers; cloud transport/placement acceptance is separately recorded.

- The existing release workflow also exposes a manual `setup-foundation` operation.
- `scripts/foundation-workflow.mjs` restricts it to exact verified current-main production dispatch, orchestrates the three management CLI phases and verifies registered/closed public health.
- It shares the production deployment lock and existing credential; it never runs from ordinary PR/main verification or automatic deployment events.
- See the runbook for dispatch fields and partial-completion recovery.

- Client sandbox setup uses the owner-approved existing app404 HitPay sandbox, with its sandbox API key and salt installed privately as `HITPAY_SANDBOX_API_KEY` and `HITPAY_WEBHOOK_SALT` on the client Worker.
- `deployment/production.json` seals expected merchant/business identity in `hitpaySandbox`; this does not enable payment switches or attest API credentials.
- Staging retains its developer resources, SimplyBook company, services and price profile.
- The shared HitPay sandbox is deliberately not provider-isolated, so retained payment scope must match account, environment, company, merchant, business, key digest and original invoice/attempt before recovery.
- Never repoint the existing staging webhook or reinterpret historical payments as client payments.
- Client webhook onboarding and controlled owner acceptance remain separate pending steps.
- A sandbox payment against the client SimplyBook company can affect real provider booking/invoice records; opening a test therefore requires an explicitly scoped owner test and is not part of code deployment.

| Configuration  | Developer staging                                         | Client production target                                                       |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Source/release | Client GitHub repository; eligible verified PR            | Same repository; independently verified main                                   |
| Cloudflare     | Personal account, soccerbot-dev, developer D1/coordinator | Client account, soccerbot-production, separate client D1/coordinator           |
| SimplyBook     | soccerbot, DEV credential names, services2/3              | soccerbotadmin, PROD credential names, services3/4                             |
| Prices         | S$88/S$108                                                | S$108/S$128                                                                    |
| HitPay         | Existing app404 sandbox                                   | Owner-approved reuse of app404 sandbox for tests; client live merchant pending |
| Turnstile      | Developer widget, TURNSTILE_SECRET                        | Client widget, TURNSTILE_SECRET_KEY                                            |
| Email          | Existing developer sender                                 | Client sender/domain awaiting DNS verification and integration                 |
| Access         | Existing developer sandbox release                        | Closed artifact; explicit client sandbox integration does not activate it      |

- These are deployment configurations of one codebase, not separate application forks.
- The shared payment sandbox does not combine Cloudflare storage or SimplyBook identity.
- Current deployment and owner acceptance evidence belong in Progress.
