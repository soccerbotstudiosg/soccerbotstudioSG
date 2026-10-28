# SoccerBot operations runbook

Draft — 28 October 2026. For authorised operators of the existing developer deployment and the forthcoming client deployment. Procedures marked pending are handover work, not evidence that an integration is running. Confirm the current revision, account and environment before acting. [Progress](../PROGRESS.md) owns current evidence/blockers; [Business rules](business-rules.md) owns system rules; [Development guide](development.md#configuration) owns configuration reference. This document owns operational procedures. [Security infrastructure](security.md) explains trust boundaries, current controls and proposed additional layers.

Navigation: [Ownership](#1-ownership-and-access) · [Routine checks](#2-routine-checks) · [Dependencies](#3-dependency-maintenance-and-dependabot) · [Grafana](#4-monitoring-and-observability) · [Incidents](#5-incident-response-and-recovery) · [Deployments](#6-deployments-and-rollback) · [Data recovery](#7-data-protection-and-restore) · [DNS/HTTPS](#8-domain-dns-and-https) · [Handover](#9-operational-records-and-handover).

## 1. Ownership and access

| Area                                            | Responsible role                                                | Operational boundary                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Business acceptance and incident decisions      | Business owner                                                  | Approves live transactions, financial corrections, downtime and residual risks                                     |
| Code, CI and release recovery                   | Engineering/release operator                                    | Reviews changes, diagnoses failures and deploys approved verified artifacts                                        |
| Booking services, schedules, staff and invoices | SimplyBook Admin                                                | Uses the correct company; preserves booking history and shared studio capacity                                     |
| Instructor availability                         | SimplyBook Trainer                                              | Edits only owner-approved fields within actual provider permissions                                                |
| Merchant, payments and refunds                  | Authorised HitPay operator                                      | Confirms authoritative financial state; cancellation does not imply refund                                         |
| Hosting, D1/DO, secrets and TLS routing         | Authorised Cloudflare operator                                  | Verifies account IDs; preserves existing coordinator identity and foundation                                       |
| Customer-domain DNS                             | Current DNS operator → client operator after accepted migration | Preserves existing DNS/email during registrar transfer; client DNS ownership starts only after verified delegation |
| Central Grafana and alert delivery              | Owner company monitoring operator                               | Separate environment credentials, dashboards, alert receivers and retention                                        |

Populate named primary/backup contacts and provider support channels in the owner-controlled access inventory before handover. Do not store passwords, API keys, bank details or recovery codes here. Complete MFA and billing arrangements. Confirm least-privilege access with each provider; being a SimplyBook Admin does not grant HitPay or Cloudflare authority.

Current identity reference (verify against the actual target before changes):

| Environment                | Identity / source                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Developer hosting, Primary | Cloudflare account `517f4f85eb8f982b483dbc05b797fd88`; current Worker `soccerbot-dev`                                           |
| Client hosting, soccerbot  | Cloudflare account `0b36822648e6905c681a90b6bec5ca7f`; target [production.json](../deployment/production.json)                  |
| Staging resource mapping   | [staging.json](../deployment/staging.json); existing data and DO identity retained                                              |
| Canonical code today       | `LimYouSheng/SoccerBotStudioSG`; client repository ownership switch remains a separately verified cutover                       |
| Client domain proof        | SaaS zone `soccerbotsg.win`; test DNS `standardsoftwares.com` in Primary; eventual `soccerbotsg.com` DNS remains vendor-managed |

## 2. Routine checks

Suggested operating cadence; owner must assign coverage and confirm alert delivery before handover.

| When                                     | Check                                                                                                                          | Evidence / follow-up                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Each operational day                     | Availability/HTTPS, latest deployment outcome, provider incidents, unresolved booking/payment cases and security notifications | Record anomalies, affected environment and incident reference; an empty sampled dashboard is not health proof |
| Each Monday after scheduled updates      | Dependabot jobs, open update PRs, Security alerts and failed verification                                                      | Apply section 3; retain failures rather than merging around them                                              |
| After every release/configuration change | Deployed revision and health, origin/API routing, authorised customer smoke check, provider mapping and alert visibility       | Match deployment receipt to exact revision; use the role UAT sheets                                           |
| Monthly and before handover              | Access/MFA/billing, certificate renewal prerequisites, alert receivers, retention/restore readiness and unused credentials     | Revalidate actual provider settings; track missing coverage                                                   |
| After an incident                        | Reconcile affected attempts/payments, confirm recovery, capture root cause and update procedures                               | Avoid closing on a single green graph or provider response                                                    |

Do not run real bookings/payments or send test notifications merely to fill a monitoring gap. Arrange owner-operated test transactions separately. Monitoring checks must not consume customer capacity or create financial effects.

## 3. Dependency maintenance and Dependabot

[Dependabot configuration](../.github/dependabot.yml) schedules weekly npm and GitHub Actions **version updates** (Monday 09:00 Singapore), limited to one open version-update PR per ecosystem. Minor/patch updates are grouped; major upgrades and coordinated compiler, lint, Node-type, Playwright and Cloudflare tooling updates remain individual. Security updates have separate GitHub limits and are not constrained to this weekly schedule or two-PR limit.

**Security setup is per repository.** In GitHub Settings → Advanced Security (or Code security), enable Dependency graph, Dependabot alerts and Dependabot security updates. Do this for both the canonical repository and the client repository when populated; copying YAML does not copy repository settings. Confirm the settings and review Security → Dependabot alerts; an empty PR list is not evidence that alerts are enabled or vulnerabilities absent. Progress records owner/API confirmation for each repository. The current connector cannot change these settings.

The `npm-security` group applies only to minor/patch security updates. Major and coordinated tooling fixes remain individual PRs; exclusions from grouping do not ignore those updates. Alerts identify known vulnerable dependencies; security updates attempt a fixing PR when GitHub can resolve one. No automatic merge is enabled. Triage severity, affected dependency path and actual runtime/development usage. Prefer a compatible patched release; when none exists, adapt the source/toolchain rather than dismissing a vulnerability because CI fails. Track any temporary mitigation and remaining exposure. Do not run `npm audit fix --force` or accept a runtime downgrade without review.

For an update, preserve exact package/lockfile agreement and run all three CI gates. Playwright upgrades must include matching CI container images; TypeScript upgrades must retain the compiler APIs used by source checks and satisfy lint peers. Workflow files own action revisions; CI enforces approved action names, full commit SHA pins and deployment gates. Passing PR CI is followed by review/authorized merge, fresh main verification and deployment of that tested artifact. Developer staging currently deploys from successful main; client production retains separate manual deployment. A fixed branch or merged lockfile alone does not establish that the deployed version is fixed. Automatic trusted PR staging remains pending and must exclude Dependabot/forks from deployment credentials.

Use `npm audit --json` to supplement GitHub alerts and retain the report when triaging. Audit severity is not proof of exploitability or compromise, and a clean report covers only known advisories. Repository security settings, audit findings, remediation evidence and deployment status are recorded in Progress.

### What to expect on Mondays

GitHub schedules npm and GitHub Actions checks for Monday 09:00 Asia/Singapore; actual start may be delayed. “Dependabot Updates” jobs labelled `main` inspect the default branch and propose updates: they do not merge or deploy it. No eligible updates may mean no new PR. New/refreshed PR commits trigger Verify. At most one version-update PR per ecosystem is open; manual remediation and security PRs are outside that combined two-PR limit. Security alerts/updates can arrive on any day. GitHub notification preferences control email/in-app notifications; this chat is not a standing monitor.

### Update and remediation procedure

1. Read the PR Files changed and upstream release/advisory notes. Identify direct/transitive packages, compatibility changes and runtime versus tooling exposure. SHA-pinned Actions still need review of the upstream commit change.
2. Update package and lockfile together. Coordinate Wrangler/Miniflare, compiler/lint peers, Playwright/container versions and Node types where necessary; no blanket major upgrades or historical runtime downgrades.
3. Run `node scripts/versions.mjs write` and commit `docs/versions.md` with the update. A Dependabot PR that changes locked versions will otherwise fail the freshness check. This is deliberate: the repository snapshot must match the reviewed lockfile. A trusted maintainer refreshes the bot branch or incorporates the update into a reviewed remediation branch; CI never pushes generated files to main.
4. Run relevant local checks under AGENTS, then require all three final-head CI gates: frontend, backend and live-email. Owner/CI operates browsers. Preserve original failure evidence; diagnose incompatibility instead of weakening tests, suppressing alerts or retrying blindly.
5. Review and explicitly authorise merge. Main verifies its merged revision independently. Confirm the deployment receipt and `/api/health` revision before reporting a deployed patch.
6. Recheck GitHub Open Dependabot alerts and the audit report. Closed-as-fixed differs from dismissed. GitHub counts advisories; npm may count affected packages/meta-vulnerabilities, so counts need not match. Capture both results and the deployed revision.

`npm audit --audit-level=high` blocks full/code verification on high/critical advisories and audit-service errors. Lower-severity alerts still require triage. If a combined reviewed PR supersedes bot PRs, check each diff and close only covered duplicates. A failed update is an unresolved proposal, not a change already applied to production. Do not merge a failing compatibility update simply because an advisory exists; patch the incompatibility or document an approved temporary mitigation and deadline.

Version lookup: [versions.md](versions.md) shows configured tools and the entire locked inventory. Actions Summary and `versions.json`/`versions.md` in each verification artifact show observed tools and checkout revision. Python is a verification tool; its CI series can remain 3.12 while the observed patch version changes. Cloudflare controls the production Worker runtime; local workerd is the test runtime, not its exact production version.

## 4. Monitoring and observability

### Current implementation and activation status

The [Tail Worker](../worker/telemetry.ts) reconstructs allowlisted diagnostic summaries as OTLP **traces in Grafana Tempo**, outside the customer request path. It does not forward raw Tail logs, create a Loki log archive or emit a complete native distributed trace tree. The [dashboard](../observability/grafana-dashboard.json) uses TraceQL metrics; the chosen Tempo service must support those queries.

The committed [telemetry configuration](../wrangler.telemetry.jsonc) has `EXPORT_ENABLED=false`, an empty endpoint and no enabled attachment established here. The exporter accepts only producer `soccerbot-dev` and writes only resource `service.name=soccerbot-dev`. Dashboard queries also hardcode that service. There is **no current configurable production service/environment label**. Separate production credentials alone are insufficient: reviewed code/config/dashboard changes and producer matching are required before client telemetry can be activated. Central company Grafana remains the intended destination; verify actual deployment and receiver state in Progress.

Activation checklist for the authorised operator:

1. Confirm producer account, Worker and intended service/environment separation. Implement and verify any production mapping first; avoid mixing staging and production observations.
2. Configure the supported Grafana OTLP gateway endpoint and securely install `GRAFANA_AUTHORIZATION`; never commit it. Current endpoint format is `https://otlp-gateway-<region>.grafana.net/otlp`, with Basic authorization; the exporter appends `/v1/traces`.
3. Review sampling and receiver permissions, attach the separately deployed Tail Worker to the correct producer and enable only after configuration is validated. These are pending operator actions, not instructions to mutate live resources automatically.
4. Use an arranged diagnostic observation to verify actual Tempo ingestion, correct service, dashboard queries, redaction and overhead. Export HTTP success alone is insufficient.
5. Configure and exercise alert receivers, retention and an independent availability/TLS check. The dashboard JSON contains panels, **not provisioned alert rules**. Record the accepted setup and owner.

### What is exported and what it means

All exported attributes below use the `soccerbot.` prefix; in TraceQL they appear as `span.soccerbot.<field>`. Each admitted diagnostic requires a valid correlation UUID. Only allowlisted, bounded numeric/string fields are exported; additional source log fields may be intentionally omitted.

| Event                       | Exported detail                                                                                                                                                                                                                                                    | Meaning / interpretation                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `foundation_trace`          | `boundary` = http/coordinator/scheduled; `durationMs`, `outcome`, optional `http_status`; storage/d1/coordinator/coordinator_rpc/coordinator_wait/provider `.count`, `.durationMs`, `.errors`; `d1_execution.statements`, `d1_execution.sqlDurationMs`, `d1_colos` | Overall server boundary and aggregate calls. D1 SQL execution is distinct from full D1 call time. Colos describe available D1 metadata, not DO placement. Missing metadata is not zero execution time.                                  |
| `checkout_trace`            | `durationMs`, `outcome`, `token_cached`, `tokenDurationMs`; phase `durationMs`, `calls`, `d1Count`, `d1DurationMs`, `d1Errors`; total `d1_count`                                                                                                                   | Checkout work and its contributing phases. Phases: queue, prepare, simplybook, booking_work, verification, hitpay, payment_save. Timings may overlap; do not add them as exclusive wall time.                                           |
| `confirmation_trace`        | `boundary` = recovery/status/context/receipt; `result` = pending/complete/manual_review/not_claimed; optional hashed `recovery_key`; stage durations, operation counts/durations/errors, cache counters                                                            | Recovery/confirmation work and current result. `not_claimed` can mean another worker owns eligible work; it does not independently prove failure. `complete` describes this operation’s result, not an unauthenticated payment receipt. |
| `provider_transport_timing` | `operation` = public_auth/admin_auth/simplybook/hitpay_create; `headersMs`, `bodyMs`, `durationMs`, `outcome`                                                                                                                                                      | Time to response headers and subsequent body/parse work. Includes network and provider processing; not an isolated network RTT measurement.                                                                                             |
| `provider_token_cache`      | `family` = public/admin; `result` listed below                                                                                                                                                                                                                     | Persistent-token lifecycle observations. No token value or credential is sent.                                                                                                                                                          |
| `hitpay_transport_failure`  | `operation` = create/read/search; `representation` = json/html/other/missing; bounded numeric `status`; `outcome=error`                                                                                                                                            | Safe classification of payment transport failure. HTML can indicate an upstream gateway/security response; it is not proof of the cause. Response text and source `validationFields` are not forwarded by this exporter.                |

Confirmation stage fields are `stage.<name>.durationMs`: queue, claim, hitpay, payment_evidence, booking_before, accounting, booking_after, publish, commit, status, context and receipt. Operation fields are `<name>.count/durationMs/errors`: d1, admission, public_auth, admin_auth, identity, tariff, booking_read, invoice_read, accounting_write, hitpay_read and hitpay_search. Cache counters are `cache.public_hit/miss/shared`, `cache.admin_hit/miss/shared` and `cache.identity_hit/miss/shared`. A missing field is not a fabricated zero.

Common metadata: `correlation_id`, `retention` (`failure` or `sampled_success`), `sample_rate`, `timing=diagnostic_summary`, `truncated`, optional `execution_model` and `worker_version`. The Worker version UUID is not the Git commit; use deployment evidence to map it. Correlation attributes join related HTTP/RPC/alarms; each invocation has its own trace and no invented parent chain.

### Token event dictionary

| Result                      | Meaning                                                       | What to check / possible correction                                                                                              |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `absent`                    | No retained usable entry found                                | Normal first-use possibility; inspect authentication latency and whether repeated misses occur on the same account               |
| `restored`                  | Valid encrypted token restored from persistent state          | Expected cache behavior; restoration does not extend expiry or bypass current identity/payment checks                            |
| `expired`                   | Original lifetime elapsed                                     | Expected bounded expiry; inspect demand authentication if latency rises                                                          |
| `scope_changed`             | Stored account/environment/credential scope no longer matches | Check intentional credential/account changes; never reuse a token from another environment                                       |
| `invalid`                   | Stored entry failed validation/decryption                     | Inspect recent configuration/secret changes and scoped failure evidence; do not delete DO state as a quick fix                   |
| `authentication_rejected`   | Provider rejected the relevant authentication generation      | Verify provider status, account entitlement and credentials; rotate/reconfigure only through the authorised process              |
| `stale_rejection`           | Rejection belongs to an older token generation                | Check that current generation remains usable; do not invalidate the replacement manually                                         |
| `refresh_due` / `refreshed` | Proactive public-token refresh became due / completed         | Check configured refresh-ahead and provider health; failed replacement retires the old generation and is not immediately retried |

Public retention is 50 minutes; admin retention is 60 seconds. Public refresh-ahead, when enabled, triggers with at most 20 minutes remaining in the serialized warming workflow. Short admin lifetime can legitimately create misses. Do not extend token lifetimes or disable identity checks to improve a latency graph.

### Dashboard panels and investigation

| Existing panel                                      | What to notice                                                  | Investigate / potential fix                                                                                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout latency — sampled successes                | Sustained p50/p95 rise compared with the same workload/revision | Split queue, SimplyBook, HitPay, token and D1 contributions. Check recent release and provider status before changing code. Separate cold/warm and single/batch samples.          |
| Confirmation / recovery latency — sampled successes | Boundary-specific rise in recovery/status/context/receipt       | Inspect stage/operation fields and unresolved retained attempts; repair provider/accounting issues rather than treating return navigation as confirmation.                        |
| Checkout D1 round trips — sampled successes         | Changed mean after release or workload change                   | Compare single/batch mix and source path. Baseline successful single checkout is five D1 trips; batch is 2×sessions+7. A mean across mixed traffic is not a regression threshold. |
| Queue wait — sampled checkout                       | Persistent wait or accompanying `provider_queue_busy` errors    | Check provider latency, arrival rate and admitted work. Preserve queue limits/priority/fences; address the bottleneck or owner-approved admission policy, not blind retries.      |
| SimplyBook checkout phase — sampled successes       | Time concentrated in booking provider work                      | Compare transport/auth/body timing and account quota/service status. Validate mappings; escalate upstream latency with safe timestamps/correlation.                               |
| HitPay checkout phase — sampled successes           | Payment creation latency or failed creation nearby              | Check transport failures, merchant/environment and retained request state. Read back uncertain effects before any repeat creation.                                                |
| Token cache observations — exported samples         | Hit/miss mix changes                                            | Counts concern exported checkout summaries, not every token lookup. Correlate persistent-token events and authentication timings.                                                 |
| Persistent token events — exported observations     | Invalid/rejected events or repeated scope changes               | Use the token dictionary; distinguish expected expiry from a secret/account mismatch.                                                                                             |
| Retained failure summaries — not unique incidents   | More exported failure summaries                                 | Group by correlation, event and recovery key. One incident may emit many summaries; do not call this an error rate.                                                               |
| Confirmation D1 round trips — sampled successes     | Counts change for a specific boundary                           | Compare like operations and recovery outcomes. Successful reconciliation baseline is five D1 trips, not a cap on failures or every status request.                                |

These are the existing dashboard panels. Raw transport details, D1 SQL timings and several recovery fields are available in trace attributes but do not all have dedicated panels.

Useful Explore queries for the current developer service (select the correct Tempo datasource and time range):

```text
{ resource.service.name = "soccerbot-dev" && span.soccerbot.retention = "failure" }
{ resource.service.name = "soccerbot-dev" && span.soccerbot.event = "hitpay_transport_failure" }
{ resource.service.name = "soccerbot-dev" && span.soccerbot.correlation_id = "<correlation UUID>" }
{ resource.service.name = "soccerbot-dev" && span.soccerbot.recovery_key = "<hashed recovery key>" }
```

### Sampling, gaps and export diagnostics

Successful correlations are deterministically sampled at 10% by default. Recognized failed invocations/errors, manual-review results, invalid cache records and authentication rejections bypass success sampling, within export bounds. A retained record is not necessarily itself an error: other summaries from that failed invocation are retained too. This does not guarantee every failure is stored.

Bounds: first 32 Tail events, first 256 log messages per event, one parseable string per message up to 32 KiB, at most 128 emitted spans and 512,000 bytes of outbound JSON; five-second export timeout and 50 ms CPU configuration. No redirects, persistent spool or exporter retry. Malformed, unrelated, nonmatching-producer and uncorrelated records are discarded. `dropped` is a bounded exporter counter, not a complete measure of all discarded input. `truncated=true` means source evidence may be incomplete.

The Tail Worker’s own `telemetry_export` logs remain **Cloudflare exporter diagnostics**, not one of the six exported Grafana events:

| Result           | Operator action                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `invalid_config` | Check enablement, endpoint format, authorization shape and numeric sample rate (0–1) without displaying the secret                   |
| `oversize`       | Review bounded payload volume with engineering; do not forward raw logs or remove privacy limits                                     |
| `accepted_http`  | Confirm matching traces in Tempo; an HTTP acceptance is not proof of queryable ingestion                                             |
| `rejected_http`  | Check status, receiver credential scope, endpoint and Grafana capacity/account state; do not log receiver response bodies            |
| `unavailable`    | Check connectivity, timeout/provider availability; restore configuration/service and observe new events, as there is no replay spool |

No exporter log can also mean export disabled, no matching producer, no accepted diagnostics or success sampling excluded that invocation. Check those before diagnosing a receiver outage.

### Alerts to configure before handover

**Configuration status:** the repository contains dashboard panels, not provisioned alert rules. Actual deployed thresholds, Grafana contact points and delivery are **not verified/configured by this document**. Owner instructed on 28 October 2026 to leave primary responder, backup and destinations unassigned. The values below are concrete starting proposals for review, not an agreed SLA or a report that alerts are running. Do not enable an unattended alert and treat it as operational coverage.

| ID / signal                          | Proposed trigger and clear condition                                                                                                                                                                 | Data prerequisite / limitations                                                                                                                                              | First response                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| AL-01 Availability / trusted HTTPS   | Probe each approved host every minute from two locations; critical when both fail for 3 consecutive checks; clear after 3 consecutive successes from both                                            | Independent synthetic GET of a non-mutating public route, trusted hostname certificate validation and expected response marker; distinguish expected maintenance from outage | Check DNS/TLS/route, deployment revision and platform status; no booking transaction as health probe                             |
| AL-02 Certificate expiry             | Warning at less than 21 days, critical at less than 7 days; clear once a trusted replacement has more than 21 days                                                                                   | Live certificate expiry per exact host; separately inspect hostname/DCV/CAA activation. Renewal timing can vary; tune after observing managed renewal                        | Inspect renewal prerequisites and responsible DNS/hosting owner; no recurring manual cert uploads                                |
| AL-03 API server errors              | Warning at 5% 5xx over 10 minutes with at least 20 requests; critical at 20% over 5 minutes with at least 20 requests; clear after 10 minutes below warning                                          | Complete unsampled edge/application request counters by environment/route/status are needed. Do not compute a true error rate from failure-biased sampled Tempo spans        | Correlate request IDs, queue/provider failures and recent configuration; preserve original uncertain attempts                    |
| AL-04 Provider queue admission       | Warning for 3 `full`/`expired` observations in 5 minutes; critical if repeated for 15 minutes; clear after 10 minutes without observations **and** verified telemetry health                         | Allowlisted provider_queue events; these are observed counts, not total traffic rates. Export loss can undercount                                                            | Inspect provider latency, queue priority and physical concurrency; do not increase capacity or timeout blindly                   |
| AL-05 Payment/booking inconsistency  | Critical on any newly confirmed integrity breach; warning for a recoverable unresolved attempt still needing attention beyond its original recovery window; clear only after recorded reconciliation | Authorized durable recovery inspection or a new redacted metric/event is needed; no existing generic dashboard query is claimed to count this correctly                      | Preserve original IDs/evidence, owner reviews authoritative HitPay/SimplyBook records; never trigger a new payment automatically |
| AL-06 Exporter/monitoring blind spot | Warning for 3 observed export failures in 5 minutes, or loss of a separately configured heartbeat for 10 minutes; clear after successful ingestion/heartbeat evidence                                | Platform exporter outcomes plus an independent heartbeat/receiver test; no traffic is not proof of broken telemetry and HTTP export success is not ingestion proof           | Check endpoint/auth/service mapping, receiver and platform logs; do not expose authorization values                              |
| AL-07 Dependency security            | Triage each new high/critical advisory on detection; clear on verified remediation and deployment/re-scan, not simply PR creation                                                                    | GitHub alerts and npm audit; security notification preferences are account settings, independent of Grafana                                                                  | Apply section 3; inspect actual affected path, patch compatibility and deployed revision                                         |

A monetary integrity event needs prompt escalation even at low traffic. All other thresholds require tuning against observed production traffic and false positives without removing financial/identity safeguards. Transport duration includes provider processing, so a high duration alone does not identify network fault.

### Alert routing and acceptance record

| Field                                          | Current value                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Primary responder                              | **Unassigned — owner requested**                                                                                                   |
| Backup responder                               | **Unassigned — owner requested**                                                                                                   |
| Primary email/channel/contact point            | **Unassigned — owner requested**                                                                                                   |
| Escalation email/channel/contact point         | **Unassigned — owner requested**                                                                                                   |
| Coverage hours / timezone                      | Unagreed; do not assume 24/7 coverage                                                                                              |
| Proposed critical acknowledgement / escalation | 15 minutes / escalate after 15 minutes without acknowledgement during agreed coverage; not a commitment until coverage is assigned |
| Proposed warning triage                        | Next staffed business period; tighten for active customer/financial impact                                                         |
| Actual rule UIDs / receiver delivery evidence  | Not configured or verified here                                                                                                    |

Before activation, record the environment/service, exact query, approved threshold/evaluation/no-data/error policy, rule UID, contact-point UID, named primary/backup, coverage hours, escalation and runbook link. Group related alerts by environment/service/symptom; do not group by raw customer/payment identifiers. Separate monitoring-query errors from application failures. Maintenance silences need an owner, reason and expiry; never mute unresolved financial integrity findings as routine maintenance.

Acceptance: use an owner-authorized synthetic alert fixture, observe firing, delivery to the intended receiver, acknowledgement/escalation, resolution and any reminder/deduplication behavior. Record timestamps and redacted evidence. Perform the delivery test without a real booking, payment or customer email. No alert notification is sent as part of writing this runbook.

## 5. Incident response and recovery

1. Record start time in Singapore time and UTC, environment, hostname, deployed revision/version, symptoms, affected case IDs and safe correlation/recovery keys. Protect personal and financial data in restricted incident evidence.
2. Classify impact: payment correctness/data exposure first, then booking availability, then degraded performance/telemetry. Assign an incident owner and update cadence; involve the authorised financial operator for uncertain payments.
3. Check recent deployments/config changes, `/api/health`, Cloudflare and provider service status. Read retained evidence before mutation. Coordinate any containment through reviewed access controls; do not improvise a new flag or stop scheduled recovery blindly.
4. Make the smallest justified correction through the proper change path. Do not replay an uncertain write, delete evidence, rename the DO, mark invoices paid manually to force a pass, or weaken queue/security checks.
5. Verify authoritative booking/payment state and deployment health, then run an arranged owner smoke check if required. Record recovery and remaining affected attempts; observation of one successful request does not close all cases.

| Symptom                             | First checks                                                                                             | Potential recovery / stop condition                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Site down / wrong content           | DNS/hostname/certificate, route ownership, Worker revision, assets and health                            | Restore approved routing/artifact only after identifying cause; keep mail records and vendor ownership intact                                |
| Email code missing or rejected      | Correct environment/inbox, Resend sender/domain status, bot proof, throttling and code validity          | Correct verified configuration through authorised operator; respect resend limits. No repeated notification sends to force a fault.          |
| Remember me or saved details fail   | Session expiry, revocation, account identity and latest UI revision                                      | Reverify fresh identity and test both consent choices; old revoked sessions must stay invalid. Never restore authority from browser storage. |
| Slot visible but cannot book        | Provider availability/eligibility, cutoff, shared capacity and stale display                             | Refresh within contract; inspect original attempt outcome. Do not override shared resource constraints.                                      |
| Checkout timeout / busy             | Queue wait, transport timings, claimed effects and original attempt                                      | Recover existing identity via authoritative readback; fix saturation/upstream issue without creating a replacement blindly                   |
| Paid in HitPay, website pending     | Merchant/request/amount/currency match, webhook evidence, booking/invoice accounting and recovery result | Let authorised reconciliation establish completion; escalate `manual_review` with retained evidence. Never equate a return URL with paid.    |
| Duplicate-looking financial records | Request versus transaction IDs, original attempt and provider records                                    | Financial operator determines actual duplicates; no automatic cancellation/refund or historical cleanup                                      |
| D1/DO errors after release          | Migration ledger, foundation/account IDs, bindings and coordinator identity                              | Stop wrong-account deployment; diagnose last successful phase. Never reset foundation/data to satisfy preflight.                             |
| Grafana empty                       | Export status/attachment, exact producer, sample/time range, datasource and exporter logs                | Follow section 4; do not conclude application health from no traces                                                                          |

## 6. Deployments and rollback

Normal release: inspect PR changes and final-head gates, obtain applicable merge authorization, merge, then verify the merged revision and deployed artifact. Legacy main developer deployment remains active until the reviewed portable cutover. The standalone GitHub Pages export is separate from the Cloudflare customer backend.

Portable deployment procedure (when configured/enabled):

1. Validate the explicit [target](../deployment) and account/resource identity. Keep production closed while required origin/sitekey/foundation/provider setup is incomplete.
2. Run **Verify deployment target** for the selected target/revision. Confirm all three gates on that revision; retain sealed artifact and receipts.
3. Reserve the staging candidate when required. On main, dispatch **Deploy staging** or **Deploy production** with exact 40-character `revision` and successful `verify_run_id`. Repository variables must enable the intended workflow and `DEPLOYMENT_MODE=portable`; see [Development setup](development.md#portable-deployment-scaffold).
4. The verifier checks provenance, target and gates; deployment checks resources, migration state, artifact hashes, upload and health. Do not bypass a rejected preflight.
5. Retain `deployment.json`, observed revision, provider access state and routing evidence. Verification/deployment artifacts currently retain for 14 days: archive approved recovery evidence securely before expiry.
6. At repository cutover, disable deployment from the former repository before enabling competing ownership. Copying code does not copy security settings or secrets.

Interrupted deployment: inspect the receipt’s last completed phase, current Worker revision, D1 migration ledger and route state. A failed job can have applied migrations or uploaded code. Reuse the same reviewed resource identities/artifact only after diagnosing the interruption and validating rerun eligibility; do not blindly dispatch repeatedly.

Rollback is **not an automated arbitrary historical-revision switch**. Production workflow requires verified current main, so an older SHA can be rejected. Normal code rollback is a reviewed revert on main, fresh target verification and deployment of the resulting verified artifact, provided schema compatibility is established. Emergency restoration of a retained prior Cloudflare version/artifact requires a separately approved operator procedure and resource/schema review; do not bypass workflow gates or claim that this path is already rehearsed. Code rollback does not reverse D1 migrations, bookings, payments, notifications or provider-side effects.

## 7. Data protection and restore

D1 stores access/attempt/effect/payment/recovery evidence; the Durable Object separately stores coordination and encrypted token state. SimplyBook and HitPay hold their own authoritative records. A D1 backup alone is not a full system recovery point, and restoring application storage does not undo an external payment.

The [data lifecycle draft](data-lifecycle.md) owns the source-based storage inventory, expiry versus deletion distinctions and pending client privacy-clause mapping. Its validity periods are not approved disposal periods; cleanup remains a separate reviewed implementation.

### Recovery targets and actual capability

RPO is the maximum acceptable data-loss window; RTO is the time from incident declaration to safe service restoration. Neither is yet an agreed production commitment. Record measured recovery time separately from targets. Provider recovery entitlements/retention must be verified for the selected account/plan; this document does not assume a particular platform backup window or automatic DO restore facility.

| Asset / failure                                           | Proposed planning target                                                                                                              | Actual status and acceptance requirement                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static site / application release defect                  | RPO: last verified artifact and its complete target/configuration record; RTO: 60 minutes during agreed coverage                      | Exact-artifact release path exists; actual rollback duration and schema compatibility need a recorded rehearsal                                                            |
| D1 personal/access/attempt records                        | RPO: 24 hours for planning **only if business/legal retention accepts it**; RTO: 4 hours for planning, subject to reconciliation      | Backup/restore capability and recovery point not established for client account. Reject this target if records cannot be reconstructed safely; tighter RPO may be required |
| Financial grants/effects and booking/payment associations | No silent loss or replay of financial effects is acceptable; RTO remains uncommitted until reconciliation feasibility is demonstrated | A backup within 24 hours is insufficient by itself. Reconcile all external effects since the restore point; retain unknown outcomes and keep affected writes closed        |
| DO coordinator identity and durable state                 | Preserve the original named identity; no assumed acceptable loss window or measured restore time                                      | Inspect supported recovery with Cloudflare/operator before a drill. Never replace/rename the object to clear uncertainty or improve placement                              |
| Provider records                                          | Provider-owned recovery/retention and support arrangements                                                                            | Verify SimplyBook/HitPay account entitlements and restricted export/support options; the website cannot restore their authority from a local browser snapshot              |
| Diagnostics and audit evidence                            | Agree retention and incident-evidence hold separately from application RPO                                                            | Tempo samples are not a complete financial audit record; restrict exports and preserve investigation evidence                                                              |

Owner must approve achievable targets, coverage and retention before handover. These draft values neither change existing commercial commitments nor establish a zero-loss guarantee. Primary/backup recovery operators and support destinations remain unassigned until nominated.

### Restore procedure to rehearse — not yet executed

1. **Declare and scope.** Record incident, environment/account, affected stores, current deployment revision, first observed fault and the intended recovery cutoff. Separate bad code from bad data; prefer a verified release rollback when storage is sound.
2. **Contain without destroying evidence.** Authorized operator closes affected writes/schedulers/integrations through reviewed controls; preserve current database/DO evidence, migration ledger, original identities and read-only provider records. Stop if external effects cannot be fenced. Do not revoke/delete records just to produce a clean test.
3. **Verify recoverability.** Record supported recovery mechanism, available recovery points and retention, encryption/access controls, operator permissions and expected scope. Verify access to the previous artifact/configuration and provider reconciliation evidence before changing the target.
4. **Prepare isolation.** Restore to an approved isolated target with external booking/payment/notification writes and automatic replay disabled. A copied foundation must not be silently re-registered as production; use a reviewed inspection/test configuration and do not bypass production identity guards. If this cannot be done safely, mark the drill blocked.
5. **Restore and inspect.** Record recovery point, start/end time and tool/provider receipt. Check expected migration sequence, schema, row relationships, original attempt/grant/effect/payment associations, revocation/identity state and integrity of retained evidence. Keep customer data and backup credentials outside public artifacts.
6. **Reconcile external truth.** Inspect provider changes after the restore point under separately authorized read access. Match booking/invoice/payment references, amount/currency/account and effects; preserve unresolved/late/duplicate cases. Restored old tokens, grants or claims must not authorize replay. Re-establish safe access/token state through its owner, not arbitrary SQL edits.
7. **Verify failure handling.** In isolation with synthetic provider interception, demonstrate that pre-restore completed/unknown effects cannot be duplicated; revoked access stays denied or is deliberately invalidated under an approved plan. Check context/receipt protection, queue/recovery behavior and migration compatibility. Owner/CI operates any browser test.
8. **Decide cutover.** Compare measured RPO/RTO with approved targets; list unresolved discrepancies. Owner approves cutover only with a safe write boundary and reconciled financial state. If not safe, retain the current containment and recovery evidence rather than enabling checkout.
9. **Validate and close.** Verify exact deployed artifact/target, health/DNS, authorized identity/receipt reads, monitoring and scheduled recovery. Arrange any real booking/payment acceptance separately with the owner. Record rollback path, support ownership, residual risk and the next drill date.

Stop conditions include wrong account/foundation, unsupported/incomplete backup, missing effect references, ambiguous provider settlement, unable-to-disable writes, newly exposed sensitive data or failed revocation protection. Escalate with evidence; do not “repair” by deleting rows, resetting migration history, or creating a replacement coordinator.

### Restore evidence worksheet

Keep this as the blank master; store completed results in restricted owner-controlled evidence. No successful restore or measured RPO/RTO is claimed until this is completed.

| Field                                                              | Result / evidence                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| Drill/incident ID, operator and approving owner                    | Unassigned / not run                                 |
| Account, environment, database and coordinator identities          | To record                                            |
| Original revision/artifact/configuration and migration ledger      | To record                                            |
| Backup mechanism, recovery-point timestamp and support entitlement | To verify                                            |
| Isolation and external-write/notification block evidence           | To record before restoration                         |
| Restore start/end and measured downtime                            | Not measured                                         |
| Actual data-loss window and missing/reconciled records             | Not measured                                         |
| Booking/payment effects after recovery point                       | To reconcile; no raw customer details in public docs |
| No-duplicate-effects and revoked-access tests                      | Not run                                              |
| Integrity/migration/foundation checks                              | Not run                                              |
| Approved RPO/RTO comparison                                        | Pending owner targets and drill                      |
| Cutover/rollback decision and residual discrepancies               | Not approved                                         |
| Monitoring and owner acceptance evidence                           | Pending                                              |

## 8. Domain, DNS and HTTPS

Use [Admin Cloudflare UAT](uat/admin.md#cloudflare-domain-dns-and-https-checks) for inspection. Confirm registrar, authoritative DNS owner, Cloudflare account IDs and hosting owner separately. Cloudflare nameservers do not identify which account owns the zone. `app404.ai` remains outside the proof.

Current owner decision is **registrar transfer first, then client Cloudflare DNS** for `soccerbotsg.com`. Neither transfer nor delegation has been verified complete. Confirm registrar unlock/transfer eligibility and destination account without storing transfer codes in repository evidence. During registrar transfer, preserve existing nameservers and DNS service unless the owner separately approves a reviewed migration. Populate and compare the destination zone, including MX/SPF/DKIM/DMARC and other existing records, before changing delegation. Assess DS/DNSSEC coordination and record the old nameservers/zone for rollback. A completed registrar transfer alone does not copy DNS or establish client hosting.

Reassess the prepared SaaS deployment target against supported same-account Worker hosting after ownership is confirmed; do not skip SaaS checks while still using that target. [ADR-008](architecture/adr.md#adr-008--managed-custom-hostnames-with-vendor-controlled-dns) records the amended decision.

Before any owner/vendor change, save the approved DNS baseline and exact record/TTL/proxy/validation/CAA instructions and rollback contact. Preserve MX/SPF/DKIM/DMARC. For SaaS, inspect fallback origin, custom hostname status, route ownership and persistent automated validation. A subdomain proof cannot establish apex support. Verify trusted coverage, redirects, same-origin API and secure cookies on each approved hostname.

Certificate incident: distinguish DNS validation/CAA, hostname activation, routing and actual certificate expiry. Correct the failed prerequisite through the authorised DNS/hosting operator, then verify issuance and availability. Prefer persistent managed renewal; do not introduce routine manual TXT changes/uploads as the fix. Record initial issuance and actual renewal separately, with expiry/availability alert evidence. Exact owner/operator DNS instructions and apex acceptance remain required before production handover.

## 9. Operational records and handover

For each incident/change, record: owner, timestamps, environment/account IDs, revision/run/artifact, reason and scope, affected rule/case IDs, redacted evidence, before/after observations, approval where required, verification, residual risks and next review date. Keep actual customer/payment identifiers in restricted evidence rather than public PR descriptions.

Keep [Admin](uat/admin.md), [Trainers](uat/trainers.md) and [Simulated user](uat/simulated-user.md) worksheets as blank masters; store completed results with revision/environment and preserve failures/retests. [Code owners](code-owners/index.md) locates implementation responsibility, not on-call people. Name primary/backup responders, verify billing/MFA, prove monitoring receiver delivery, rehearse recovery/rollback and obtain owner sign-off before handover. SMS, packages and MCP admin integration remain separately quoted scope.
