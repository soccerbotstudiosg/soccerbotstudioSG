# SoccerBotStudioSG engineering

## Authority and document ownership

This file is the sole owner of repository engineering instructions. User instructions take precedence; current repository instructions supersede stale external skill snapshots. The cloud skill’s older uppercase Journey, Rules & Architecture and CODEX_CLOUD paths are superseded. Use the current document map below.

| File                                                         | Unique purpose                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [Development guide](docs/development.md)                     | Development prerequisites, configuration and command reference.                                        |
| [Agents](AGENTS.md)                                          | Engineering workflow, coding conventions, verification and action boundaries.                          |
| [Runbook](docs/runbook.md)                                   | Dependency maintenance, observability interpretation and operational recovery procedures.              |
| [Security infrastructure](docs/security.md)                  | Security boundaries, implemented controls, evidence limits and proposed additional layers.             |
| [Data lifecycle](docs/data-lifecycle.md)                     | Source-based storage/expiry inventory and pending client privacy-clause mapping; no deletion approval. |
| [North Star](NORTH_STAR.md)                                  | Current outcome and priority.                                                                          |
| [Progress](PROGRESS.md)                                      | Detailed current task, exact leave-off, evidence, blockers and handover; link to Journey history.      |
| [Architecture diagram](docs/architecture/diagram.md)         | Component topology and connections.                                                                    |
| [Architecture decisions](docs/architecture/adr.md)           | Stack rationale, tradeoffs, scaling triggers and alternative designs.                                  |
| [Business rules](docs/business-rules.md)                     | Numbered system invariants and acceptance boundaries.                                                  |
| [Domain operations and API contracts](docs/api-contracts.md) | Named operations, source status, permissions, evidence and transport contracts.                        |
| [Complete journey](docs/journey.md)                          | End-to-end flows, retained milestones and dated change evidence.                                       |

Function-level behavior, guards, failure recovery and evidence are in [Technical behavior](docs/code-owners/technical-behavior.md); start with the [feature map](docs/code-owners/index.md) for navigation.

Read North Star, Progress, Architecture and the relevant Business rules and API contracts before work. Refresh branch/HEAD/index and the remote revision; GitHub is canonical, but the local checkout may differ. Preserve unknown edits, worktrees, dependency symlinks and original evidence. Update the owning document and link to it elsewhere; do not maintain parallel rules, setup guides or status ledgers. Historical entries remain dated evidence, not current instructions or renewed authorization. Preserve milestone IDs and record history once in Complete journey’s dated history.

## Route the request

For every task, read these instructions, then North Star and Progress. Use the existing document map above and follow the relevant route below; inspect actual source and evidence before changing anything. Historical completion does not replace current revision checks.

| Request                               | Read next, in order                                                                                                                                                                                                                  | Work / evidence destination                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Debug a feature or failing test       | [Relevant business rule](docs/business-rules.md#current-system-rules) → [Operation contracts](docs/api-contracts.md) → [Code owners](docs/code-owners/index.md) → [Verification commands](docs/development.md#verification-commands) | Owning feature, services or Worker module and its tests; record findings in Progress                                |
| Develop a feature                     | [Business rules](docs/business-rules.md#current-system-rules) → [Architecture](docs/architecture/adr.md) → [Code owners](docs/code-owners/index.md) → [Setup](docs/development.md#development-setup)                                 | Existing source owner and affected tests; update its owning documentation                                           |
| Fix CI / update dependencies          | [Runbook dependency procedure](docs/runbook.md#3-dependency-maintenance-and-dependabot) → [Versions](docs/versions.md) → [Verification commands](docs/development.md#verification-commands)                                          | [Workflows](.github/workflows), [scripts](scripts), package manifests and final-revision CI evidence                |
| Deploy / recover / roll back          | [Runbook deployment procedure](docs/runbook.md#6-deployments-and-rollback) → [Configuration](docs/development.md#portable-deployment-scaffold) → [Deployment rules](docs/business-rules.md#deployment-migration-and-acceptance)      | [Target manifests](deployment), verified artifacts and deployment receipts                                          |
| Diagnose an incident / Grafana signal | [Incident response](docs/runbook.md#5-incident-response-and-recovery) → [Signal dictionary](docs/runbook.md#4-monitoring-and-observability) → [Code owners](docs/code-owners/index.md)                                               | Correlated diagnostic/provider evidence and affected source owner                                                   |
| Review security / harden a boundary   | [Security infrastructure](docs/security.md) → [Business rules](docs/business-rules.md) → [API contracts](docs/api-contracts.md) → [Runbook](docs/runbook.md)                                                                         | Existing security owner and regression evidence; record findings and acceptance in Progress                         |
| Inspect DNS / HTTPS                   | [Runbook DNS procedure](docs/runbook.md#8-domain-dns-and-https) → [Hosting requirements](docs/business-rules.md#client-hosting-setup-prepared-not-deployed)                                                                          | [Admin domain checks](docs/uat/admin.md#cloudflare-domain-dns-and-https-checks); owner/vendor executes changes      |
| Prepare / review UAT                  | Relevant [Admin](docs/uat/admin.md), [Trainers](docs/uat/trainers.md) or [Simulated-user](docs/uat/simulated-user.md) worksheet → linked business rules                                                                              | Owner-run evidence tied to revision/environment; retain failures and blockers                                       |
| Understand topology / hand over       | [System diagram](docs/architecture/diagram.md) → [Architecture](docs/architecture/adr.md) → [Code owners](docs/code-owners/index.md) → [Handover](docs/runbook.md#9-operational-records-and-handover)                                | [Milestones](docs/journey.md#milestones-and-retained-acceptance-criteria), access inventory and recorded acceptance |

## Implement

Use one feature branch and edit existing component/domain/service/style owners. Remove superseded logic; no duplicate patched owners, CSS override tails or speculative abstractions. Preserve approved presentation, unrelated behavior and strict source/import/type/lint boundaries. Apply system invariants from Business rules at every affected execution path; never modify accepted migrations or expose secrets/customer data.

Use one-line JSDoc/TSDoc summaries (`/** ... */`) for major TypeScript/JavaScript functions and one-line PEP 257 docstrings (`"""..."""`) for Python functions. Describe purpose or an important constraint with an imperative sentence; omit redundant type/parameter prose. Keep detailed safety rationale beside the relevant logic. Exclude generated code, test callbacks and trivial accessors from blanket documentation.

## Verify and publish

After every logical change or repair, search affected components, services, Worker/browser tests, fixtures and inventories. Update obsolete assumptions without weakening their purpose, then run meaningful affected checks using the [command reference](docs/development.md#verification-commands). Never add retries, sleeps, forced clicks, skipped cases, looser timeouts or reduced inventories to conceal failures. Preserve the first failed receipt and diagnose it.

Owner/CI operates browsers and physical devices: no assistant Playwright, screenshots, `npm run verify`, `verify:browser` or browser-running installers. Simulations do not establish provider or production acceptance. Report source changes, local verification, CI, merge, deployment and owner/provider acceptance separately.

Inspect → change → test-impact review → affected checks → update owning documents → review diff → commit/push task branch and draft PR. Readiness requires all three final-commit gates: `verify / frontend`, `verify / backend`, `verify / live-email`. Reuse unchanged valid local evidence when publishing; do not rerun suites solely to publish. Main verifies the merged revision independently; deployment consumes its tested artifact without rebuilding.

Never merge, auto-merge, push main, deploy or change protection without applicable explicit authorization. No assistant bookings, payments, cancellations, refunds, notification sends or historical cleanup. No destructive reset, force push or unapproved provider/account changes. New provisioning, secrets installation and production activation are separate actions. No background agents or standing service.

## Execution environment and local delivery

Follow the development guide for tool versions and configuration. Preserve inherited network proxy/CA settings; use supported permissions, never disable TLS or bypass the proxy. Check credential presence without printing values. Worker tests use isolated workerd/D1/DO with intercepted synthetic providers; test authorization does not permit live outbound calls. Local port 4173 is not a public preview; do not claim a preview URL without evidence.

Routine cloud source work needs no Mac installer. If delivering one, use `scripts/build-local-installer.py`, `local-installer.py` and `guarded-update.py`. Under one repository lock, validate baseline/candidate bytes, inventory, paths/case and receipt hashes; preserve external backups and failure receipts. Planning scope accepts only documentation/approved delivery tooling and never runs Node or browsers; application delivery retains all applicable gates. Never execute historical bundled shells against current checkouts. Verify final bytes, hash, filename and links before delivery.
