# Project journey and evidence

This document owns retained milestones, dated decisions, implementation history and verification evidence. [Progress](../PROGRESS.md) contains only the latest checkpoint and immediate tasks. [Booking scenarios and messages](booking-flows.md) owns customer flow diagrams and copy; [role UAT](uat/simulated-user.md), [Admin UAT](uat/admin.md) and [Trainers UAT](uat/trainers.md) own acceptance; [Runbook](runbook.md) owns deployment and operational procedures. Current rules and contracts remain in their existing owners.

## Initial milestone overview

The original nine phases and 44 subiterations remain below. This is the retained delivery plan, not a blanket completion claim. [Progress](../PROGRESS.md) records current evidence, failures and remaining acceptance; later dated decisions can supersede original implementation choices without deleting milestone IDs.

| Phase | Subiterations | Intended outcome                                                          |
| ----- | ------------- | ------------------------------------------------------------------------- |
| M1    | M1.1–M1.4     | Baseline, release discipline, tooling and demo acceptance                 |
| M2    | M2.1–M2.5     | Provider readiness, scheduling/payment proof, recovery and mappings       |
| M3    | M3.1–M3.6     | Worker/data foundation, services, identity and returning-customer access  |
| M4    | M4.1–M4.6     | Authoritative selection, durable checkout and partial-failure recovery    |
| M5    | M5.1–M5.5     | Invoice/payment association, verification, late outcomes and confirmation |
| M6    | M6.1–M6.6     | Exports/content, client rehearsal, delivery, monitoring and UAT package   |
| M7    | M7.1–M7.4     | Client UAT, devices, defect closure and written acceptance                |
| M8    | M8.1–M8.4     | Readiness, verified deployment, live validation and handover              |
| M9    | M9.1–M9.4     | Stabilization, warranty, optional maintenance and retained closeout scope |

### Milestones and retained acceptance criteria

Milestone labels are retained scope, not a live completion ledger; use Progress for the current position. M7 UAT, M8 launch/handover and M9 support remain separate. Preserve the original 44 IDs and commercial schedule. The original criteria below are historical release requirements, not an instruction to repeat waived experiments or use superseded provider designs.

### M1.1 — Reconcile the accepted baseline

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m11--reconcile-the-accepted-baseline).

### M1.2 — Enforce the reviewed release path

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m12--enforce-the-reviewed-release-path).

### M1.3 — Close tooling and delivery findings

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m13--close-tooling-and-delivery-findings).

### M1.4 — Accept the deployed demo visually

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m14--accept-the-deployed-demo-visually).

### M2.1 — Account readiness and temporary setup

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m21--account-readiness-and-temporary-setup).

### M2.2 — Prove scheduling and single-studio slot protection

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m22--prove-scheduling-and-single-studio-slot-protection).

### M2.3 — Prove the native hosted payment route

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m23--prove-the-native-hosted-payment-route).

### M2.4 — Prove failure and recovery semantics

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m24--prove-failure-and-recovery-semantics).

### M2.5 — Freeze the integration contract and mappings

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m25--freeze-the-integration-contract-and-mappings).

### M3.1 — Worker and environment foundation

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m31--worker-and-environment-foundation).

### M3.2 — Named asynchronous service contracts

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m32--named-asynchronous-service-contracts).

### M3.3 — Minimal durable state and migrations

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m33--minimal-durable-state-and-migrations).

### M3.4 — Email challenge and abuse controls

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m34--email-challenge-and-abuse-controls).

### M3.5 — Protected sessions and guest checkout capability

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m35--protected-sessions-and-guest-checkout-capability).

### M3.6 — Safe returning customer prefill

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m36--safe-returning-customer-prefill).

### M4.1 — Authoritative availability and eligible instructors

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m41--authoritative-availability-and-eligible-instructors).

### M4.2 — Connect selection and server revalidation

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m42--connect-selection-and-server-revalidation).

### M4.3 — Create and recover a checkout attempt

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m43--create-and-recover-a-checkout-attempt).

### M4.4 — Create every selected session safely

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m44--create-every-selected-session-safely).

### M4.5 — Handle partial failure and compensation

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m45--handle-partial-failure-and-compensation).

### M4.6 — Close booking recovery end to end

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m46--close-booking-recovery-end-to-end).

### M5.1 — Validate invoice and checkout association

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m51--validate-invoice-and-checkout-association).

### M5.2 — Hosted payment and safe customer return

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m52--hosted-payment-and-safe-customer-return).

### M5.3 — Verify payment status

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m53--verify-payment-status).

### M5.4 — Resolve pending expired late and unknown outcomes

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m54--resolve-pending-expired-late-and-unknown-outcomes).

### M5.5 — Protect the final confirmation

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m55--protect-the-final-confirmation).

### M6.1 — Booking summary and calendar exports

Retained milestone ID/title; PDF/calendar actions were retired by owner decision on2 November2026. Current confirmation and receipt authority remain, with no download acceptance obligation.

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m61--booking-summary-and-calendar-exports).

### M6.2 — Native emails and approved public content

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m62--native-emails-and-approved-public-content).

### M6.3 — Client staging configuration and full rehearsal

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m63--client-staging-configuration-and-full-rehearsal).

### M6.4 — Production build and deployment pipeline

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m64--production-build-and-deployment-pipeline).

### M6.5 — Monitoring alerts and recovery rehearsal

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m65--monitoring-alerts-and-recovery-rehearsal).

### M6.6 — Release audit and UAT package

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m66--release-audit-and-uat-package).

### M7.1 — Run the full client UAT suite

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m71--run-the-full-client-uat-suite).

### M7.2 — Physical devices and operational walkthrough

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m72--physical-devices-and-operational-walkthrough).

### M7.3 — Close defects and rerun affected acceptance

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m73--close-defects-and-rerun-affected-acceptance).

### M7.4 — Record written build acceptance

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m74--record-written-build-acceptance).

### M8.1 — Production readiness and go live decision

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m81--production-readiness-and-go-live-decision).

### M8.2 — Deploy the verified production candidate

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m82--deploy-the-verified-production-candidate).

### M8.3 — Verify live operation

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m83--verify-live-operation).

### M8.4 — Complete training handover and launch acceptance

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m84--complete-training-handover-and-launch-acceptance).

### M9.1 — Launch stabilization review

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m91--launch-stabilization-review).

### M9.2 — Six month warranty operations

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m92--six-month-warranty-operations).

### M9.3 — Optional maintenance service

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m93--optional-maintenance-service).

### M9.4 — Ongoing changes and eventual exit

[Original scope and exit evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m94--ongoing-changes-and-eventual-exit).

## Reading the retained record

The following milestone IDs and history are preserved from the former service-contracts document. Historical “current”, “next” and approval language applies to its recorded date only. Superseded provider designs and waived experiments are evidence, not active instructions. New history belongs here once; current status belongs in Progress.

## Part 2 — Dated changes and evidence

### 30 October 2026 — Merged-main I/O stall and bounded temporary storage

Owner approved PR1 merge as `930aa230ef1aaa41f4d3e49f9ca2fc26e4e115eb` after head `7a9d96b73ae5ad1532c09543c6a783d04ae678ea` passed all four jobs in run 41001585832. Client-repository staging run 41004241912 succeeded; the two-workflow cleanup is now on main. Production remains disabled and client production acceptance is separate.

Independent main run 41006678430 passed Worker/frontend/backend and 83/84 live-email cases. Tablet price drift exceeded the unchanged test deadline (job 123908098889, artifact 12956138759). The same case passed in 7.18 seconds on PR head (artifact 12955081086). Main's fixture runtime-ready phase took 9.42 seconds; its 63.75-second test/cleanup interval recorded host I/O pressure increases of 48.45 seconds some / 33.29 seconds full, versus 27.7 ms / 7.6 ms in the passing 7.20-second interval. Two slow passing cases also correlated with I/O pressure. Available memory exceeded 5 GB with no recorded OOM or cgroup CPU throttling. Host counters establish correlation, not ownership of every stall or the underlying device cause.

Miniflare default D1/DO files live under randomized temporary directories. Prepare a follow-up that mounts live-email `/tmp` as bounded 2 GiB tmpfs and checks the filesystem type before testing. Keep real SQLite, isolated cases, full inventories, all assertions/deadlines and disk-backed artifacts. Worker/storage tests remain in their separate unchanged job. Seven workflow regressions plus policy/version checks passed; exact-head CI remains required to test this hypothesis. No new paid resources, production/storage migration or assistant browser/provider operation. Further merge authorization is separate.

### 30 October 2026 — Instrument intermittent isolated runtime stalls

Run 40995800145 passed frontend/Worker/backend and 82/84 live-email cases; phone booking-readback and tablet unpaid-return exceeded the unchanged test budget (job 123879760699, artifact 12952654625). Previous price-drift/payment-creation cases passed all devices. Tablet synthetic setup completed only around 37 seconds. Earlier setup reductions have not established the underlying cause.

Twelve local non-browser hold cycles under two-CPU affinity showed 464–811 ms initialization, 3649–3667 ms holds, 6–9 ms disposal and settled parent RSS near 260 MB. This does not reproduce WebKit or private-runner memory/host contention. Preserve `repeat-hold-2cpu.log`. The initial stdin phase probe failed because inherited `--input-type=module` conflicted with the dependency's Worker-thread evaluation; the file-based three-cycle probe passed and is retained separately.

Add diagnostic-only fixture phase timings and per-test numeric Linux pressure/memory/cgroup snapshots to existing browser evidence. Correlate by test ID, report missing counters as null, and never record arbitrary resource-file text or credentials. Collector privacy/missing-data regression and all 162 tooling tests passed; types/source/policy/Worker graph/affected lint passed. No test deadline, inventory, assertion, provider implementation, runtime isolation, deployment configuration or browser execution permission changes. Exact-head CI measurements are the next evidence required, not a claimed repair.

### 30 October 2026 — Remove repeated homepage setup from failure journeys

Owner let run 40991915866 finish to collect new failures: frontend, Worker/runtime and backend passed; live-email passed 82/84. Phone payment-creation failure and tablet price drift hit the existing 30-second budget (job 123861479806, artifact 12950643550). Text traces show roughly 12 seconds of isolated runtime initialization plus 9.6–12.1 seconds of homepage warming before booking entry. Retain original evidence and secondary closed-page/socket errors; no assertion established an incorrect booking/payment outcome.

The shared failure helper now enters `/book/account/` directly. Keep real guest, calendar/trainer, contact and Review interactions and all fault/storage/payment assertions. Homepage warming/navigation remains explicitly asserted by the native guest journey, so this removes repeated unrelated setup rather than retiring coverage. Inspected every caller's fault timing and provider-count assumptions; inventory, timeouts and retries unchanged. Types, affected lint/format, source integrity and transport regression passed. Exact-head browser CI remains pending; existing run 40994040151 is left to finish per owner direction. No merge, deployment or external provider action.

### 30 October 2026 — Diagnose client CI and review test-flow freshness

Run 40988799036 passed Worker/runtime, frontend and backend but failed three of 84 live-email cases at the existing 30-second test deadline (job 123851207800, artifact 12949079810). Text traces retained revoked-access setup, exhausted-window setup and unpaid-return teardown timing. The public developer/private client repository difference implies different standard Ubuntu runner capacity (4 CPU/16 GB versus 2 CPU/8 GB); it is not evidence that every failure has only a hardware cause.

Owner requested one suite-wide stale-flow pass. Inventory 60 test files across service/components, browser, Worker and tooling/installer owners; inspect clocks, transports, contract routes, current flow and retained lower-level scenarios. Change payment-recovery and uncertain-booking setup to current checkout; use combined hold for the unpaid-return case so zero-HitPay coverage remains meaningful. Retain split-API concurrency and explicit prepared/finite-authority cases, clarifying two old hold names and their inventories. Use reduced motion only in the authorization case; preserve dedicated animation tests. Closed-page teardown still drains provider work without invoking an already-closed page's route API. No retries, skips, force clicks, timeout increases or inventory reductions.

The review also caught the deployment validator's old three-job assumption. Require explicit successful Worker/runtime evidence on the same SHA/run attempt, alongside all three application gates. Extend negative coverage for each missing, failed, skipped, wrong-revision and wrong-attempt gate; preserve its first failing receipt before the source repair. Update North Star's active workflow/budget link and business-rule deployment checkpoints. Application contracts, account resources, migrations, live provider behavior and client activation are unchanged.

Local checks: 242 service/component tests, 161 tooling tests, 57 installer tests, three hold/checkout regressions and one retained finite-hold regression passed, plus types/source/policy/Worker graph/lint/version checks. Fixture measurements distinguish legacy prepare+hold (~5.5s), combined hold (~4.4s, no HitPay) and direct checkout (~0.9s, includes HitPay); no production performance claim. Original/repair receipts are under `/workspace/work/client-pipeline/`. The source review is not a guarantee that every stale assumption is absent; exact-head browser CI, merge/main, deployment and provider/device acceptance remain separate and pending.

### 30 October 2026 — Retire legacy sidebar workflow

Owner requested removal of unnecessary sidebar workflows. Move the inherited developer verification definition from `.github/workflows` to `.github/legacy/verify.yml`, keeping it only for existing historical-policy regression fixtures. The active directory now contains target verification and consolidated deployment. Update test fixture paths, derive version inventory from active target verification, and reconcile development, artifact-retention links and the test-maintenance skill. Default-branch/sidebar adoption remains pending merge; old run history is not deleted. Dependabot remains enabled and is managed separately by GitHub.

### 30 October 2026 — Consolidate client Actions entries

Owner requested cleanup of duplicate verification and skipped deployment entries. Make inherited `verify.yml` manual-only and replace the two deployment workflows with one `deploy-release.yml`. Keep distinct staging/production jobs and secret bindings, explicit manual target, target-specific enable flags and concurrency, trusted-main checkout, verified artifact/provenance checks and no deployment access in PR verification. Failed verification may still create one skipped completion workflow because GitHub cannot filter completion triggers by conclusion. Existing history remains and completion-controller changes take effect only on default-branch main. Update workflow/policy regression checks and development/security links; no application, provider, dependency or deployment activation change. The first tooling run exposed a now-no-op mutation of the removed legacy PR trigger; replace it with explicit rejection of restored automatic triggers and retain exact unfiltered PR/main assertions on target verification. Preserve tooling-workflow-cleanup.log; all 161 tooling tests passed after correction, alongside source/policy/version, formatting and affected lint checks.

### 30 October 2026 — Separate target verification stages for private runners

Client run 40985961618 at `8488cc3` passed the repaired animation-skip case across all three devices. Frontend job 123837833215 passed 77 browser cases but reached the overall tablet expired-selection deadline; artifact 12947831460's text trace shows successful expiry/removal assertions, replacement payment and confirmation before time ran out after reload. Preserve the archive and `frontend-40985961618.log`. Backend jobs 123837832901 and 123837833221 each passed 454 Worker cases, taking 12–14 minutes, then reached the unchanged 20-minute job deadline during browser checks. These cancellations are not completed browser acceptance.

Move the identical isolated Worker/load checks into a required job, retaining the complete inventory, then require its same-run/attempt artifact before backend/live-email browser execution and packaging. Run browser cases serially to reduce private-runner resource competition; keep all device projects, assertions, zero retries, test deadlines and job deadlines. The trace establishes cumulative budget exhaustion, not a specific application regression or proven CPU diagnosis; CI remains required to assess the scheduling repair. Focused workflow tests enforce the prerequisite and artifact identity. Production credentials/variables are owner-confirmed prepared with deployment disabled. Dependency PRs #2/#3 were closed during cleanup, briefly selected for repair, then explicitly deferred by the owner to a fresh preproduction review. Their branch refs were restored after automatic deletion, but PRs remain closed; no update was merged and Dependabot stays enabled. GitHub Team/protection is also deferred. Test 507 remains untouched.

### 30 October 2026 — Client setup and skip-interaction clock repair

Owner confirmed the staging secret and supplied the client Actions variables for portable deployment to the existing developer account, with staging enabled. The previous developer-repository screenshot showed portable mode for deployer cutover. Initial client main [run 40983795710](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/40983795710), frontend job 123829890820 / artifact 12946457242, passed 77 browser cases but timed out in phone-WebKit clicking “Skip arena transition”: the button was unstable, then detached before the click. The test allowed the automatic navigation timer to compete with its scene assertions and normal click. Preserve `/workspace/work/client-pipeline/frontend-40983795710.log`. Pause the already-installed fixture clock before entry, require the normal click to navigate while automatic completion is paused, then resume for cleanup. Natural-completion coverage remains independently advancing; no retries, force, relaxed timeout, skipped cases or inventory changes. This is a test-fixture repair, with CI browser confirmation pending; it changes no application animation or provider behavior. PR1 remains unmerged and client deployment remains unverified.

### 30 October 2026 — Client GitHub pipeline and closed Worker bootstrap

Owner clarified that staging must deploy from `soccerbotstudiosg/soccerbotstudioSG`, with PR checks then staging, and merged-main checks then client Cloudflare production. Owner authorized Workers.dev before domain hookup and required the intended first-use placement hint. Read-only inspection confirmed existing client D1 `e2a21801-0107-4db5-8551-ca1ff338df53`, account subdomain `lucky-poetry-b25e`, no Workers, and a still-pending customer zone. Created the public widget for the temporary Worker hostname without exporting its secret. Preserve coordinator `simplybook-production-account` and `apac-ne`; neither the hint nor the earlier KIX D1 observation proves DO location.

The handover PR also makes every production static asset pass through the canonical-origin guard on Workers.dev; deployment validates that setting, and 15 affected deployment tests passed after this repair. Implemented target verification on exact PR heads/pushed main, trusted-main completion controllers, stale/fork/bot/permission/attempt rejection and closed Workers.dev target validation. Retained manual recovery and all gate inventories; client verification uses the target workflow rather than duplicating the legacy gates. Client GitHub was initialized at `9328ca0898fdd283796ea7e9e5bb33eec2e45636`; deployment switches and separate credentials still gate external writes. The handover PR exercises client-owned staging verification. Cloud deployment and credential cutover remain pending. The first local tooling run found missing esbuild in the restored October 6 dependencies, not an application failure; retain `/workspace/work/client-pipeline/tooling.log` and reviewed lockfile installation resolved the missing dependency. All 160 tooling tests, source/policy and version checks, 354 link targets and both architecture diagram parses then passed.

Separately reconciled PR122: merge `26554bcc2d3b3091263bcadfcc883a2706d99210`, main run 40843356821 and its deployment receipt match live developer version `c41fc74a-b8f2-4524-aece-7fbe9054fcba`. Read-only HTTP checks passed for 11 pages, assets and health with wrong-Origin rejection. This does not establish client deployment ownership or provider/device acceptance; 507 remains untouched.

### 29 October 2026 — PR122 rotation-notice cascade correction

Run [40837922507](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40837922507), frontend job 123327046300 at `a47f4ba`, passed the repaired amount assertion but failed on `<p class="rotation-notice">`: 14px instead of 16px across desktop, phone and tablet. The other 75 frontend browser cases passed. The explicit `.confirmation-section .rotation-notice` selector in the metadata role tied the scoped body selector and won by source order. Removed that redundant metadata selector; the generic rotation-notice style remains valid outside booking documents. Audited the complete document typography cascade, including summary dates, arrival headings/text, references, paid/total amounts, hints and payment footnotes. The browser assertion now reports every size/font mismatch together rather than stopping at the first element. No assertion, inventory or timeout was relaxed. Original evidence is retained in the run and `/tmp/soccerbot-pr122-run40837922507-failure.txt`. Local `verify:code` passed (242 tests, types/lint/build/export), together with 973 links and formatting/diff checks. Final-head browser CI remains required.

### 29 October 2026 — PR122 confirmation typography correction

Run [40836216699](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40836216699), frontend job 123321499184, failed the typography assertion in all three browser projects: confirmation paid amount computed as 24px instead of the requested 16px. The other 75 frontend browser cases passed. The later `.confirmation-card .paid strong` amount-role selector had the same specificity as the earlier body-role selector, so source order retained 24px. Separated amount sizing from shared emphasis styles: confirmation retains its brand colour, weight and numeric formatting, while the existing scoped body-size token remains canonical. Kept the 16px expectation and added the element markup to assertion diagnostics. Original failure evidence remains in the run/artifact 12881136544 and `/tmp/soccerbot-pr122-frontend-failure-tail.json`. The backend job 123321499391 failed at the identical browser assertion after Worker/load checks passed. The repair passed full local `verify:code` (242 tests, lint/types/build/export), source/policy/format checks and 974 links. New exact-head browser CI remains required; no browser acceptance is inferred from static inspection.

### 29 October 2026 — calendar navigation and fresh confirmation exports

Preceding verified checkpoints: PR120 merged as `a07e31514369e2992ffc9f61e3502a0d5cbc286d`; main run 40820126089 passed verification and existing developer deployments. PR121 passed PR run 40827202583 and merged as `9938fdda23deb5a5a0e5da00deb7a234e6339748`; its main deployment was not reverified in this reconciliation. These are retained observations, not current production acceptance.

PR119 reconciliation passed run 40831379149 at `2a735cf2a17213ee179b7a192a5578bd01228bc6` and merged as `ec7aa2316a7363c473e678254b20ab4c484e2729` with owner authority. The new `fix/booking-navigation-typography` branch keeps this separate from the application repair.

An empty October could not reach available November dates through the next-available action. The regression failed before the repair (`/tmp/soccerbot-next-month-before-fix.json`) and passes with explicit next-month navigation and the supported public horizon. Review/confirmation now share heading/body tokens and left-aligned details; contact and Need help use `contact@soccerbotsg.com`.

Source inspection found that exports only reread stored confirmation evidence; stale proof was rejected without requesting a refresh. Export clicks now permit bounded read-only verification of known bookings/invoice through the existing coordinator, preserving access, account, quota, deadline and financial-state guards. The owner chose fresh verification only, including revisits within the existing window. Response-local proof cannot reopen recovery or replace the journal. This is a reproduced source failure mechanism, not a captured diagnosis of the owner's original network request.

Focused evidence: 50 component/service tests passed; isolated receipt tests cover success, unchanged retained proof/deadline, pacing/exhaustion, foreign owner, revocation during refresh, changed state, closed window, stale/unpaid/cancelled proof and provider failure. The production Worker/coordinator path passed with intercepted providers and unchanged payment rows. Complete local verification passed: `verify:code` (242 tests, lint/types/build/export) and `verify:worker` (454 strict-inventory cases, zero live provider requests). Final code fingerprint: `15b8108e218f4b08b3eaa2e1513d57f93ed9ea6da218312b06b4cff26116b664`; later changes reconcile documentation only. Isolated load smoke passed all four baseline/fault cohorts (`test-results/load-1793259062525/report.json`); 974 local documentation links passed. Browser CI and owner acceptance remain pending. The final browser assertion preserves the existing mobile stacked details layout and wider-screen columns; the export component also checks the explicit pacing message. The first full code pass caught an unsupported `exact` Testing Library option (removed); receipts remain in `/tmp/soccerbot-navigation-first-code-receipt.json` and `/tmp/soccerbot-navigation-first-code-types.log`. The first new receipt fixture attempted to alter immutable creation fields; it now creates the aged attempt initially and tests expiry via a separate retained checkout snapshot. Original failure: `/tmp/soccerbot-receipt-first-failure.log`. No production or owner-device acceptance is claimed.

### 26 October 2026 — PR90 Worker inventory correction

PR90 run `40278282678` passed frontend. Both backend and live-email jobs completed all 442 Worker runtime tests with zero failures/skips/cancellations, then the strict verifier rejected the unchanged Worker inventory: the sign-out test title changed and one expiry regression was added without updating `scripts/worker-test-inventory.json`. The live-email job therefore did not reach browser acceptance. Preserve the original run and artifacts as failure evidence. Correct only those two inventory entries; retain exact inventory comparison and all outcome checks. Test-impact review covers both application and Worker inventories. The complete local Worker verifier now passes 442/442 tests with zero provider requests; source/policy and formatting checks also pass. New final-commit CI remains required.

### 26 October 2026 — All-device sign-out from valid remembered sessions

Owner reports a flicker with the signed-in email retained. Inspection found the button available while the server required verification within five minutes and rejected remembered restoration; the reported request itself was not captured. Owner authorizes removing that extra requirement. Retain authenticated access and atomic current email/owner/expiry/revocation checks; report sign-out failures explicitly and prevent competing identity actions while busy. Test-impact review updates the obsolete freshness expectation and adds expiry, guest, UI failure/retry and service-error coverage. No live sign-outs or browser experiments performed; final-commit CI and deployed owner acceptance remain separate.

### 26 October 2026 — Client account verification and Pages routing preparation

Read-only connector checks verified access to the private, empty client repository and the supplied Cloudflare account; Pages, Worker and D1 lists were empty. No resources, secrets, DNS or repository contents were provisioned. The owner selected `book.soccerbotsg.com` with externally managed DNS and retained HitPay sandbox during preparation; current setup details belong to the hosting contract above.

Prepared an isolated Pages entry forwarding same-origin API requests over a service binding. Four synthetic runtime tests passed, including actual application Worker health/guest-session integration with one retained guest record, backend origin enforcement, raw body/cookie/header preservation, redirects, foreign origins and failed-write no-retry behavior. Provider transport was blocked. Added the cases to the full Worker runner/inventory and negative source-boundary fixtures. Non-browser application verification passed; an initial anonymous-default-export lint warning was repaired without changing assertions. Full Worker regression passed 445/445 with no skips or failures; the final named-export Pages entry separately passed all four routing cases. Final-commit CI remains required. Release packaging, first-install configuration and owner browser acceptance remain pending; this is not a deployed Pages site.

### 22 October 2026 — Client staging and production delivery plan

Owner agrees to one client repository controlling developer-account staging and client-account production. The [architecture diagram](architecture/diagram.md#planned-client-delivery-topology) and [explanation](architecture/adr.md) describe the planned relationships, provider isolation, approval flow and handover. Preserve existing developer infrastructure; implementation, environment protection availability and client UAT remain pending. This documentation update changes no workflows, resources, secrets or provider configuration. Test-impact review: inspect delivery workflow references and documentation checks; runtime tests and inventories are unchanged.

### 22 October 2026 — Unique documentation ownership after PR88

Owner requests that each file have one purpose without duplicated instructions. AGENTS owns engineering policy and the document map; the local skill becomes a discovery entry point; README owns setup/configuration/commands; North Star states the goal; Progress tracks current evidence and actions; Architecture explains topology/interactions; Service Contracts retains system rules and dated history. Historical records remain intact. The external cloud skill cannot be edited through the available tools; AGENTS explicitly supersedes its stale repository guidance. PR88 is already merged, so this is a linked follow-up rather than an amendment of the merged commit. Test-impact review covers planning-document integrity, local links and format/source/policy checks; no runtime, browser test or inventory changes.

PR88 main run `39729470052` failed one of 81 live-email browser cases after passing frontend/backend; Cloudflare deployment was skipped. Saved trace evidence indicates slow fixture startup/execution, but the root cause is not established. Preserve that failure independently of the documentation cleanup.

### 22 October 2026 — One-line major-function documentation

Owner requests conventional one-line function documentation. Add JSDoc/TSDoc summaries to major frontend, service, Worker and JavaScript tooling functions, and PEP 257 docstrings to Python installer functions. Preserve detailed safety rationale and generated/runtime declarations, test assertions and inventories. AGENTS records the convention for future edits. Test-impact review covers source-text checkers, tooling/installer behavior and all application/Worker owners; compare TypeScript output with comments removed and Python ASTs with function docstrings removed, then run non-browser and Worker verification. Python function `__doc__` metadata intentionally changes; no business logic, API, dependency or deployment changes are intended. Final-commit frontend/backend/live-email CI remains required.

### 22 October 2026 — Retire obsolete examples, receipts and proof packet

Owner approves removal of `.env.example`, the three historical JSON receipts (`verification`, `review-verification`, `source-fingerprint`) and `scripts/prepare-identity-proof.mjs` with its dedicated test. The packet is tied to the expired 12 October identity-proof campaign and has no current workflow caller. README now explains the public Turnstile build key separately from private Worker secrets; `.env*` remains ignored. Historical bytes remain in revision `d7a8d2b209b535d23a62702e4d59538e00a47012`. Keep migrations, active synthetic browser/runtime fixtures, installer tooling, test inventories, telemetry setup and assets. Test-impact review searched callers, CI, inventories and document links; only tests of the retired packet are removed. Remaining source/policy/tooling/installer checks and final-commit frontend/backend/live-email CI remain required. No runtime or provider behavior changes.

### 22 October 2026 — Owner waives real-checkout placement experiment

Owner elects to waive the separate four-checkout regional comparison and use the evidence-informed client initial placement strategy. No experiment deployment, cold-token reset, booking or provider operation occurred. Remove the pending quiet-window decision and experiment implementation gates from current work; preserve the completed read-only probe and SJC/KIX findings. Validate client placement and checkout through normal UAT; no measured improvement or 2–3-second guarantee follows. The [superseded preparation protocol](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/d95d8df/docs/SERVICE_CONTRACTS.md#owner-operated-checkout-comparison--preparation) retains the setup constraints and proposed controls. Documentation-only test-impact review: no runtime/browser/fixture/inventory changes; source/policy/format/diff checks apply. PR86 remains unmerged; final-head CI remains required.

### 22 October 2026 — Real checkout experiment preparation and isolation correction

Owner requests preparation of an actual checkout placement comparison without a merge. Source inspection found immutable one-coordinator D1 identity, database-wide recovery selection, background token consumers and a main/existing-resource-only release path. The earlier config-only/shared-existing-D1 proposal is not executable safely and is replaced by the preparation protocol above. No Worker/database was created, no provider call or booking was made, and no active dev configuration changed. A quiet provider-account window versus separate-account choice is pending owner input. Required experiment profile, bootstrap and cold-token control remain implementation gates, not completed work. Test-impact review searched foundation, provider cache/queue, scheduled recovery, browser/CI and release owners; this change itself is documentation-only and uses source/policy/format/diff checks.

### 22 October 2026 — Execution location correction and client placement strategy

Read-only Cloudflare GraphQL analytics for 22 October identify the existing `soccerbot-dev` account DO (`simplybook-developer-account`) in **SJC (San Jose)** in both invocation and periodic datasets. The bounded probe's D1 primary reads were served in **KIX (Osaka)**: current compute and database are not both in Japan. Matching probe object IDs establish **SIN (Singapore)** for `apac-se` and **CDG (Paris)** for `weur`; no matching `apac-ne` record was returned. Its 8–9ms D1 reads suggest proximity to KIX but do not establish its exact execution colo. This supersedes the earlier blanket statement that actual DO locations were unverified; it does not locate every entry Worker invocation or prove a checkout saving.

Owner requests the initial client placement strategy above: create D1 with `apac`, verify its primary location, select a nearby initial DO hint and verify actual execution and end-to-end latency. PR86 remains unmerged by owner confirmation; main is still `f0f000c2f600be1930cacf0b2f884103cb23fba7`. No runtime configuration, resources, state or deployment changed. Test-impact review: documentation-only rules/history/progress update; existing runtime, browser and inventory assertions remain applicable. Source/policy/format/diff checks apply; final-head CI remains required.

### 22 October 2026 — Bounded placement screening after auth patch publication

After auth patch `9f74969268e76a051f3f287f5a7b8eb99138ea4b` was pushed to PR86, the owner authorized a bounded placement experiment. Temporary Worker `soccerbot-placement-20261022` version `838f8834-6736-4d58-b517-50e006360d3d` used a separate DO namespace with hints `apac-se`, `apac-ne`, `weur`; no public endpoint or provider credentials. Nine atomic one-shot claims capped activity at 18 unauthenticated HEAD requests and nine D1 `SELECT 1` reads. Repeated schedules reused stored outcomes. Local workerd checks covered the budget, concurrent claims, failure/no replay and absolute expiry. Scheduled completion reported all nine samples; seven detailed records were retrievable through combined and per-region telemetry queries. Missing: apac-ne round 1 and weur round 0. Do not infer their values.

| Hint    | Round | SimplyBook HEAD ms | HitPay HEAD ms | D1 round-trip ms | SQL ms |
| ------- | ----: | -----------------: | -------------: | ---------------: | -----: |
| apac-se |     0 |               1070 |            123 |               91 | 0.1437 |
| apac-se |     1 |               1062 |            250 |               87 | 0.0970 |
| apac-se |     2 |                281 |             86 |               87 | 0.1085 |
| apac-ne |     0 |                703 |            507 |                9 | 0.1043 |
| apac-ne |     2 |                191 |            152 |                8 | 0.1835 |
| weur    |     1 |                397 |            226 |              231 | 0.1311 |
| weur    |     2 |                126 |            375 |              229 | 0.1078 |

Every captured D1 read reached primary KIX. SimplyBook HEAD returned 200; HitPay HEAD returned 404. These screen public endpoint paths, not authenticated token/booking/payment APIs; no p95, actual DO colo or checkout saving is established. Response-edge labels SIN/KIX/CDG are upstream edges, not DO location proof. Northeast Asia is the first candidate for the current Japan-based D1; Southeast Asia remains a client candidate if D1 is provisioned nearby. Select client D1 and coordinator placement jointly. No active coordinator was moved and no booking/payment was created.

Schedule removal and temporary Worker deletion succeeded; a subsequent settings read returned 404. A proposed logging-only redeploy to consolidate records was rejected by automatic approval review as outside capture/cleanup and was not executed; read-only region queries were used instead. Probe source SHA256: `bdd87f50950ca8619192979e2d106d48f9f05e951b78346ccb17392b9992051b`. The result update is documentation-only; source/policy/format/diff checks apply and final-head CI remains required.

### 22 October 2026 — Public token refresh-ahead and placement diagnostics

Owner requests implementation of refresh-ahead and preparation for placement experiments. The background display queue retires and replaces a public token with at most 20 minutes left, preserving absolute expiry, encrypted persistence, admission and generation protections. One-second-before-expiry refresh was rejected as insufficient margin for observed 0.96–1.50s authentication and scheduler delay. No undocumented coexistence of token generations is assumed. The live developer artifact enables the new switch; closed configuration remains disabled. Transport header/body timings and optional D1 SQL/serving-colo metadata extend sanitized diagnostics and the Tail allowlist. No coordinator relocation, deployment, live booking or measured speedup is claimed. Test-impact review covers provider session/cache, queue warming, transport timing, D1 instrumentation, Tail privacy, release profiles and exact Worker inventory; local and final-head CI receipts are recorded in PROGRESS.

### 22 October 2026 — Security scanning and weekly notification scope

Owner adds dependency vulnerability scanning (Dependabot and npm audit), CodeQL/code scanning, secret scanning/push protection where available, and weekly Dependabot security-email notifications to the future setup. Keep targeted authentication/payment/configuration tests and security review; runtime Grafana monitoring and a clean vulnerability scan do not establish security acceptance. Personal email preferences require owner configuration. Offline inspection found only verify.yml in .github, with no Dependabot configuration, CodeQL workflow or explicit npm audit command. The GitHub connector did not expose account-level security settings; do not claim those protections are disabled or enabled. Documentation-only task: no scanner, account setting, dependency or deployment changed. Source/policy/format/diff checks cover the backlog edit; test inventory and current runtime gates are unchanged.

### 22 October 2026 — Dependency security maintenance added to backlog

Owner requests a to-do item for automatic security detection and update preparation: Dependabot alerts, security-update PRs and weekly grouped routine npm/GitHub Actions updates. Review pinned Node and Worker compatibility-date changes deliberately; preserve exact pins and the lockfile. Merges require review and all three final-commit CI gates; do not automatically merge or deploy unreviewed updates. Cloudflare manages its infrastructure patching; application/toolchain maintenance remains ours. This records future work only: no repository settings, dependencies or deployment behavior changed. Test-impact review: documentation-only backlog/history update; existing test inventories and workflows remain applicable.

### 22 October 2026 — Documentation consolidation and client migration plan

Owner replaces three overlapping canonical documents with Architecture (diagram and one-page explanation) and this two-part Service Contracts document. Cloud setup essentials move into AGENTS. No booking/payment behavior changes. PR85 acceptance documentation was merged before this refactor. The owner will configure client resources before deployment automation and client-repository delivery; portability/provisioning is planned, not implemented. Developer pins remain in runtime and release code and need validated environment configuration.

Test-impact review updated installer document ownership and retained the 44-ID order/missing/duplicate rejection gates; added missing-architecture/contract rejection coverage and formatting coverage for the new folder/local skill. The first source check caught a case collision with old architecture images, now removed. Historical image bytes remain in Git only. Source/policy, installer regressions, formatting and current-link/structure checks passed. Initial broad tooling execution hit restricted local networking/child output; its failed receipt is retained; the supported-permission rerun passed all 132 tooling tests. Final-commit CI remains required. No application or provider behavior changed.

Historical narrative below condenses each Journey checkpoint while linking its full immutable evidence. The archive includes full commit references, failures, raw-evidence hashes, test counts and superseded plans; it is not lost or overwritten. Dates retain their original stated context. Old plans are not current rules or renewed authorization. Historical verification, review-verification and source-fingerprint JSON receipts are retained unchanged in the [pre-cleanup revision](https://github.com/LimYouSheng/SoccerBotStudioSG/tree/d7a8d2b209b535d23a62702e4d59538e00a47012/docs), not the current source tree.

### Acceptance checkpoint — 22 October 2026 SGT

PR84 final head `be31bb91360dc07c37879072d69c1aefa87eae30` passed all three PR gates, then merged as `37adaa3a02fda2fa86e852b1538029dc37749557`. Refreshed main run [39626576749](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/39626576749) passed frontend, backend, live-email and deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#acceptance-checkpoint--22-october-2026-sgt).

### 21 October 2026 — overload recovery and explicit retry qualification

Merge follow-through: PR82 main39576113663 passed all gates and Cloudflare deployment. PR83 merge-resolution9de4c1c passed all three gates in39576302620, then merged as7ced699b1e4fbc25a4d889be8d2e67d0c208faba.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--overload-recovery-and-explicit-retry-qualification).

### 21 October 2026 — scope the409 browser alert to main

PR82 be37f73 run39570386559 passed frontend/backend; live-email again passed78/81. All three new409 executions failed because the unscoped alert locator matched both the actual Review error and Next.js’s route announcer.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--scope-the409-browser-alert-to-main).

### 21 October 2026 — full burst campaign reaches queue limit

Owner authorized the next isolated campaign. Ran npm run test:load on clean 21bc10c47562d42029be59638552e39699aba594.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--full-burst-campaign-reaches-queue-limit).

### 21 October 2026 — isolated load campaign preparation

Owner requested planning/preparing the combined load, rate-limit and webhook test. Created test/resilience-load-preparation from unmerged PR82, preserving the dependency symlink.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--isolated-load-campaign-preparation).

### 21 October 2026 — PR82 browser alert locator correction

Final documentation head ae5694c run39567290859 passed frontend/backend, including435 Worker cases. Live-email passed78/81: the new409 case failed on all three devices at its exact-text locator.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--pr82-browser-alert-locator-correction).

### 21 October 2026 — acceptance consolidated and next campaign planned in PR82

Owner confirms payment attempted after expiry previously failed and completed dismissal permits another booking. These join earlier accepted normal payment, unpaid timeout/rebooking and close/reopen checks; do not repeat normal paths.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--acceptance-consolidated-and-next-campaign-planned-in-pr82).

### 21 October 2026 — preparation409 readback and owner atomicity decision

PR81 merged asab478e0e926ac8b74a1f4157e99ca892691e942e; main run39559855205 succeeded and health matched that revision (Worker1e01a671-3190-4513-9a6d-469fbd7028c3). HAR20 contains successful single checkout; HAR19 ends before the rejected batch checkout and does not retain its409 body.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--preparation409-readback-and-owner-atomicity-decision).

### Consistent calendar selection — 21 October 2026 SGT

Owner observed initial entry choosing an available day but browser refresh selecting unavailable today. TimeStep initialized the date before asynchronous month data arrived and never adjusted it.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#consistent-calendar-selection--21-october-2026-sgt).

### 21 October 2026 — concurrent checkout rejection readback

Owner waived the old unresolved-page refresh retest because home permits another booking after expiry; this is excluded by owner decision, not proven deployed repair. Owner reported abandonment/dismissal and return to selection worked; replacement checkout was not independently evidenced.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--concurrent-checkout-rejection-readback).

### 21 October 2026 — unresolved focus and hold-expiry refresh

Owner requested combining confirmation detail cleanup with foreground/focus and original15-minute hold-expiry checks in PR81. Test1 mostly demonstrated retained unpaid recovery and provider timeout, but the existing page remained unresolved; home later permitted a new booking.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--unresolved-focus-and-hold-expiry-refresh).

### 21 October 2026 — acceptance resumed and confirmation details simplified

PR80 headb4d452c2ad10d18ed16e4044dd39ca05a4e361d6 passed frontend/backend/live-email in39542179705. Owner deferred Grafana hookup and resumed acceptance; no merge/deployment of PR80 occurred.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--acceptance-resumed-and-confirmation-details-simplified).

### 21 October 2026 — PR79 deployment and backend telemetry preparation

Owner explicitly approved PR79 merge. Final repaired head e8989b4e61b9a58e5dc0f4855861ac744ca69ebc passed all three PR gates in39528606402; merge3e74b10a8e96f81051c6c257d6c93a5c277f3f11 passed all three main gates and both deployment jobs in39530449830.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--pr79-deployment-and-backend-telemetry-preparation).

### 21 October 2026 — PR79 browser colour expectation repair

Run39525183294 on6ea34d5 passed live-email; frontend/backend each passed72/75 browser cases and failed the same typography journey on desktop Chromium, phone WebKit and tablet WebKit. tests/customer.spec.ts pageHeading still required navy rgb(5,10,47) for Booking confirmed; the observed rgb(23,96,120) is the owner-requested new confirmation accent. The earlier impact pass missed that generic helper.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--pr79-browser-colour-expectation-repair).

### 21 October 2026 — PR78 handoff and documentation/presentation audit

PR78 owner-merged as69945cc4ecae4593799f7205beedbc82513f9945; handoff records frontend/backend/live-email CI39481563606 passed on acc82ec11bb00dbcf26a4de322d31e8998ca7cec. Remote main fetched at the merge.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#21-october-2026--pr78-handoff-and-documentationpresentation-audit).

### Batch checkout and token retention — 21 October 2026 SGT

Owner accepts confirmation presentation and asks only for minimal batch checkout D1 and reliable tokens. Hometest07: single5 total D1/4.68s redirect; two-session batch17/8.30s; both public-token misses about964ms six minutes apart.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-checkout-and-token-retention--21-october-2026-sgt).

### Five-round-trip recovery experiment — 21 October 2026 SGT

Simulated providers measured5 D1 executions for1/2/4/8 sessions; the predecessor measured25/29/37 for1/2/4. With150ms injected D1 latency and400ms booking/invoice reads, matched single-run baseline→candidate times were5561→3232ms,6679→4146ms and8716→5951ms.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#five-round-trip-recovery-experiment--21-october-2026-sgt).

### Five-call experiment accepted for integration — 21 October 2026 SGT

Owner requested integration and CI after the fresh single-checkout prototype reached five total D1 round trips including HTTP foundation/authentication. Matched simulations with150ms per D1 execution,900ms token,1200ms booking and800ms HitPay gave cold4344→3744ms and warm3576→2824ms means across two fixtures each.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#five-call-experiment-accepted-for-integration--21-october-2026-sgt).

### Hometest06 and optimization experiments — 20 October 2026 SGT

Owner two-session HAR: checkout HTTP11.444seconds, redirect starts11.454seconds after checkout request. Preparation15 D1/2007ms; booking work27 D1/3580ms; payment save2 D1/264ms.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#hometest06-and-optimization-experiments--20-october-2026-sgt).

### Confirmation read experiment — 20 October 2026 SGT

The first consolidation candidate failed a deterministic manual-review-during-admission race: it returned confirmed from its old snapshot. It was rejected.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-read-experiment--20-october-2026-sgt).

### Hometest05 telemetry — 20 October 2026 SGT

PR72 main2c19288 passed CI/deployment39421510974. Owner HAR checkout-to-HitPay navigation5.521seconds: one creation1.696seconds, one HitPay1.016seconds, nine coordinator D1 executions1.301seconds, public-token miss941ms, zero queue wait.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#hometest05-telemetry--20-october-2026-sgt).

### Pending confirmation layout consistency — 20 October 2026 SGT

Owner hometest05 requests one presentation through confirmation checking and verification. Source inspection finds a full-page route Suspense loader and a separate context-loading card before the compact detailed confirmation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pending-confirmation-layout-consistency--20-october-2026-sgt).

### PR72 lost-response test setup — 20 October 2026 SGT

Run39415858902 on767f760 passed frontend/backend and77/78 live-email cases, including all three new timing-header assertions. Offline phone-WebKit trace shows roughly8.5seconds of fixture setup and10seconds of initial calendar loading.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr72-lost-response-test-setup--20-october-2026-sgt).

### Confirmation tracing — 20 October 2026 SGT

PR71 merged as78098bf after all three gates passed; main CI/deployment run39410852918 succeeded. Owner hometest04 records single checkout5.30seconds, nine coordinator D1 calls/1.303seconds, public token cache miss957ms, and return-to-confirmed20.407seconds/receipt21.209seconds.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-tracing--20-october-2026-sgt).

### Ten-call single checkout integration — 20 October 2026 SGT

Owner authorized merging PR70 after all three CI gates passed on5b350aa (run39401212504). PR70 merged as18ccde0; the D1 integration branch starts there.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#ten-call-single-checkout-integration--20-october-2026-sgt).

### PR70 initial receipt versus download gate — 20 October 2026 SGT

Run39394733331 on a51594a passed frontend/backend and74/78 live-email cases. Downloaded logs confirm the same recovery case failed at the blocked initial receipt on all three devices.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr70-initial-receipt-versus-download-gate--20-october-2026-sgt).

### PR70 browser reconciliation-gate correction — 20 October 2026 SGT

Run39391908409 passed frontend/backend and75/78 live-email cases. The same payment-recovery journey failed on all three devices because it deliberately blocked accept-payment but still expected Booking confirmed before releasing that gate.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr70-browser-reconciliation-gate-correction--20-october-2026-sgt).

### Confirmation and queue audit repair — 20 October 2026

Against main194cb5f, owner identified early customer confirmation before SimplyBook readback, unbounded workflow queues, missing physical capacity acceptance and conflicting documentation. The candidate moves success retention after current confirmed-booking/paid-invoice observation and rejects legacy premature proof until reconciliation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-and-queue-audit-repair--20-october-2026).

### PR69 main integration — 20 October 2026 SGT

PR69 had no CI run because its tracing branch conflicted with main after PR68 merged. Integrate main194cb5f without rewriting branch history: retain batch creation-only behavior inside request-bound tracing, retain both test sets and ordered inventory, and preserve both historical entries.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr69-main-integration--20-october-2026-sgt).

### Checkout phase tracing — 20 October 2026 SGT

Owner requests measurement of the7.6-second single checkout before pursuing3seconds. Separate tracing branch starts from merged PR67/main dc74690; batch optimization PR68 remains independent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-phase-tracing--20-october-2026-sgt).

### Batch checkout creation path — 20 October 2026 SGT

After HAR13 single checkout reached HitPay in7.60seconds, owner stops single optimization and authorizes the same provider strategy for direct batch checkout. Extend the ongoing creation-only path to batch: public token, createBatch, one sequential book per session, closeBatch, validated complete unpaid invoice and one HitPay request.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-checkout-creation-path--20-october-2026-sgt).

### Checkout D1 consolidation — 20 October 2026 SGT

The follow-up reduces isolated warm/cold single checkout from34 to27 D1 executions (HAR12 baseline47). Archive/read grants in one primary batch; pass the committed canonical association/version forward; batch checkout completion with the final authenticated access read.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-d1-consolidation--20-october-2026-sgt).

### Lean single checkout — 20 October 2026 SGT

Owner authorizes SimplyBook settings as the one-studio capacity authority and removes per-checkout admin identity/plan, catalogue, required-field, instructor eligibility and slot reads. Apply first to ongoing direct single checkout; historical split holds and batch preflight remain unchanged for the staged experiment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#lean-single-checkout--20-october-2026-sgt).

### PR66 CI cookie-adapter correction — 20 October 2026 SGT

Run39365196455 on77f06d3 passed frontend/backend and75/78 live-email cases. Only the new identity-warming test failed on all three devices, after its UI/no-effect assertions passed: its direct current-status fetch copied the preview cookie name instead of using the existing adapter that maps it to the real Worker cookie.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr66-ci-cookie-adapter-correction--20-october-2026-sgt).

### Authentication rejection diagnostic follow-up — 20 October 2026 SGT

The60-second admin-token cache already refreshes on the next identity operation after expiry; HAR10 failed during fresh admin-auth, not a missing refresh. Existing logs discarded the exact401/403 distinction.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#authentication-rejection-diagnostic-follow-up--20-october-2026-sgt).

### HAR10 confirmation stability and pre-dispatch authentication failure — 20 October 2026 SGT

Owner HAR10 ran deployed5e9e2d8 after PR65. Its first checkout returned the HitPay handoff in14.8seconds and payment subsequently reconciled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har10-confirmation-stability-and-pre-dispatch-authentication-failure--20-october-2026-sgt).

### Confirmation read timestamp race — 20 October 2026 SGT

PR64 passed all PR gates and owner merged it as c7ee697. Main run39355419233 passed frontend/backend and74/75 live-email cases; tablet WebKit payment recovery timed out and Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-read-timestamp-race--20-october-2026-sgt).

### Independent payment deadlines — 20 October 2026 SGT

HAR09 records a29.1second four-session checkout ending in recovery_required. The saved batch-close evidence confirms four bookings and an unpaid invoice; correlated deployed c08aa04 telemetry proves HitPay creation returned422 JSON.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#independent-payment-deadlines--20-october-2026-sgt).

### Interrupted provider transport recovery — 20 October 2026 SGT

Owner requires errors to be logged and isolated while unrelated customers continue. A06:07:38SGT Cloudflare storage reset during read-only warmDisplay left one unclassified admission unfinished; parallel reads then exhausted the remaining slot.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#interrupted-provider-transport-recovery--20-october-2026-sgt).

### Lost checkout response test ordering — 20 October 2026

PR62 merged as de71b72 after all three PR gates passed. Main run39340832488 passed frontend/backend but failed one of75 live-email cases; Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#lost-checkout-response-test-ordering--20-october-2026).

### PR62 checkout transport verification — 20 October 2026 SGT

Owner explicitly authorizes merging PR62 after all three final-head CI gates pass. Initial head0b5a76c passed frontend/backend and73/75 live-email cases; two desktop Chromium checkout assertions lost response resources after immediate HitPay navigation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr62-checkout-transport-verification--20-october-2026-sgt).

### Actual batch response investigation and optimization — 20 October 2026 SGT

Read-only D1 evidence for owner hometest03 proves cumulative intermediate booking arrays1–4, require_confirm=true and no invoice; final closure invoice has four lines with nested is_confirmed=true, status=new, payment_received=false and a due_datetime equal to subsequent invoice readback. Closure receipt to final invoice-read receipt spans5.937seconds, including intervening processing; no promised speedup.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#actual-batch-response-investigation-and-optimization--20-october-2026-sgt).

### Owner prioritizes checkout URL handoff — 19 October 2026 SGT

Owner authorizes removing awaited comment I/O and the extra context request before initial HitPay navigation. Added durable deferred comments with account queue/cron ownership and one-write claims; the checkout reply carries only its validated, saved URL and expiry to a transient client callback.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-prioritizes-checkout-url-handoff--19-october-2026-sgt).

### Owner adds recurring display warm-up — 19 October 2026 SGT

After history review established the old fifteen-minute warmer was proposed but excluded, owner authorizes implementing it with PR61 and requests immediate updates for booking creation. Implement account-DO persistent public snapshots, fifteen-minute due claims on existing minute cron, creation-triggered invalidation/background refresh and original thirty-minute display deadlines.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-adds-recurring-display-warm-up--19-october-2026-sgt).

### Browsing loading and cache investigation — 19 October 2026 SGT

Started successor from actual main d15caba after PR60 merge. Owner reports homepage/guest flicker, awkward locking and slow initial calendar.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#browsing-loading-and-cache-investigation--19-october-2026-sgt).

### PR60 flow implementation and CI diagnosis — 19 October 2026 SGT

Inspected failed run39209839579 atf03049e. Frontend/backend browser lanes each failed two journeys on all three devices: assertions targeted Studio1 and Selected sessions inside the new collapsed full-details disclosure.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr60-flow-implementation-and-ci-diagnosis--19-october-2026-sgt).

### Editable Review, combined checkout and compact confirmation — 19 October 2026 SGT

Owner supersedes creation-during-Review and queued provider edits: Details runs fresh read-only availability checks, then opens editable Review without creating a customer, booking or payment. Changed details reset consent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#editable-review-combined-checkout-and-compact-confirmation--19-october-2026-sgt).

### HAR08 confirmation continuity and record reconciliation — 19 October 2026 SGT

Owner reports successful checkout and asks for pending do-not-refresh guidance, removal of repeated confirmation loading, and read-only record reconciliation. HAR08 shows customerConfirmation in a pending response, followed by confirmed without that snapshot; the hook discarded the proof while the611ms receipt request completed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har08-confirmation-continuity-and-record-reconciliation--19-october-2026-sgt).

### Email-code browser interaction repair — 19 October 2026 SGT

Final-policy CI39200175005 frontend passed74/75 browser cases. Tablet WebKit filled the code while main was still inert during the loading transition; the trace retained an empty input, so native required validation prevented the expected incorrect-code response.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#email-code-browser-interaction-repair--19-october-2026-sgt).

### Fifteen-minute hold and eight-minute payment policy — 19 October 2026 SGT

Owner authorizes adding this policy to PR59 and merging only after final-commit required CI passes. Owner reports SimplyBook's timeout changed to15minutes; provider behavior is not independently verified.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#fifteen-minute-hold-and-eight-minute-payment-policy--19-october-2026-sgt).

### Completed-dismissal CI setup repair — 19 October 2026 SGT

Merged-main50656c9 CI39198249437 passed74/75 live-email cases; phone WebKit timed out before reaching dismissal. Trace shows about22seconds spent creating the synthetic hold/payment before navigation, then waiting for fully reconciled confirmation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#completed-dismissal-ci-setup-repair--19-october-2026-sgt).

### Pre-creation concurrency implementation — 19 October 2026 SGT

Owner requests implementing all safe independent pre-creation overlap. Source audit found sequential token acquisition, independent preflight reads and provider identity preparation after local persistence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pre-creation-concurrency-implementation--19-october-2026-sgt).

### HAR07 upstream failure and measured hold delay — 19 October 2026 SGT

HAR07's11:38SGT trial used Worker version4acf4e0f, correlated with deployed sourcef966884. Holding succeeded in16.678seconds; the first verifying poll began13.295seconds after dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har07-upstream-failure-and-measured-hold-delay--19-october-2026-sgt).

### Payment-first confirmation and expiry implementation — 19 October 2026 SGT

Owner clarified that verified matching payment should immediately complete the customer-facing booking when the existing hold remains valid; SimplyBook reconciliation must continue regardless of the page. A clicked download may wait, but confirmation must stay usable.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#payment-first-confirmation-and-expiry-implementation--19-october-2026-sgt).

### Creation-first optimistic Review clarification — 19 October 2026 SGT

Owner clarifies that Review should appear after booking creation, with comments/readback continuing while payment stays disabled. Earlier source waited for comment acknowledgement.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#creation-first-optimistic-review-clarification--19-october-2026-sgt).

### HAR06 Details-to-Review latency follow-up — 19 October 2026 SGT

Owner manually measures13–14seconds. The hold starts09:11:29.401; the last running poll completes about09:11:42.586, the first verifying poll about09:11:43.907 (14.506s after start), and the hold response about09:11:45.135 (15.734s).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har06-details-to-review-latency-follow-up--19-october-2026-sgt).

### HAR06 checkout abort and compact pending return — 19 October 2026 SGT

Safely inspected owner HAR06, captured09:11:00–09:13:02 SGT. It records one hold POST200 (15.734s), one HitPay-preparation POST200 (3.407s, paymentAvailable=true), an aborted checkout-context request (28ms), then a successful context read containing an available sandbox HitPay URL.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har06-checkout-abort-and-compact-pending-return--19-october-2026-sgt).

### Owner requires a test-impact pass after every change — 19 October 2026

Repeated CI repairs exposed an incomplete impact review: the one-month preload updated guestDetails and component expectations but missed a separate native guest journey's warmedMonths wait and two four-call assertions. CI39176339093 passed frontend/backend but failed that journey on all three devices (69/72 live-email).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-requires-a-test-impact-pass-after-every-change--19-october-2026).

### One-month browser expectation repair — 19 October 2026 SGT

CI39176339093 on3a34e2a passed frontend/backend, but live-email passed69/72: the same native guest journey timed out on all three engines. Its separate warmedMonths setup still waited for four responses, then asserted four calendar calls twice.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#one-month-browser-expectation-repair--19-october-2026-sgt).

### One-month calendar preload — 19 October 2026 SGT

Owner reduces eager calendar loading from four months to the displayed month only. Homepage preloads the current Singapore calendar month; another month is fetched only when opened.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#one-month-calendar-preload--19-october-2026-sgt).

### Final single-booking optimization pass — 19 October 2026 SGT

CatalogueReads overlaps the independent service/instructor reads only for ongoing customer access under the existing ProviderSession and serialized admission owner. The initial full runtime run exposed three finite-path rate rejections; finite/historical reads retain their original sequential dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#final-single-booking-optimization-pass--19-october-2026-sgt).

### Three UI follow-ups to PR55 — 19 October 2026 SGT

Additional owner requests: preferred communication has Email as its default with exactly Email, Call (existing phone identifier), SMS and WhatsApp; remove the placeholder and retain stored preferences. The shared method catalogue also supplies SimplyBook comment labels.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#three-ui-follow-ups-to-pr55--19-october-2026-sgt).

### Follow-up latency review and earlier Review — 19 October 2026 SGT

Owner requests a full bottleneck pass together with duplicate reference acknowledgement removal, then explicitly asks to show Review after step3 of8 (comment), while readback continues. Source confirms progress previously waited for association persistence after comment handling.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#follow-up-latency-review-and-earlier-review--19-october-2026-sgt).

### Latest05 duplicated loading and measured delay — 19 October 2026 SGT

The owner reports two loading phases and ineffective optimistic Review. Offline HAR confirms holding14.112s and first verifying response at about12.75s; earlier replies are running.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest05-duplicated-loading-and-measured-delay--19-october-2026-sgt).

### Optimistic Review milestone test — 19 October 2026 SGT

PR53 candidate8d3571b passed frontend/backend and71/72 live browser runs. Offline tablet trace showed two protected progress responses still running, before creation was associated; the test incorrectly started its five-second UI assertion from the Details click, including all preflight/provider setup.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#optimistic-review-milestone-test--19-october-2026-sgt).

### Pending-checkout accessible status repair — 19 October 2026 SGT

PR52 main39149579852 passed all three gates and deployed verified692cf92 to the developer Worker. PR53 CI39151457912 passed Worker verification; frontend/backend each passed69/72 browser runs, failing the same pending-checkout status assertion on three devices.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pending-checkout-accessible-status-repair--19-october-2026-sgt).

### Latency review, main failure and comment reconciliation — 19 October 2026 SGT

PR51/52 exact PR gates passed and both were owner-authorized merged. PR51 main39149518497 subsequently failed one tablet dismissal-retry case:53/54 live runs passed, both other gates passed, Cloudflare skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latency-review-main-failure-and-comment-reconciliation--19-october-2026-sgt).

### Partial-batch recovery CI repair — 19 October 2026 SGT

PR52 eb4573c passes frontend and backend gates. Live-email passes58/63; later-conflict reload returns native_snapshot_unavailable because the rejected session never acquires a validated offer snapshot.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#partial-batch-recovery-ci-repair--19-october-2026-sgt).

### Location dialog focus repair — 19 October 2026 SGT

PR52 candidate179ae0d failed the same desktop Chromium focus-return assertion in both frontend and backend browser gates (71/72 passed in each). Closing the location dialog removed it before passive-effect cleanup could reliably restore native focus.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#location-dialog-focus-repair--19-october-2026-sgt).

### Latest04 and batch sequencing — 19 October 2026 SGT

Owner supplies latest04, requests contact spacing, signed-in email prominence, header hover repair, studio-location popup and batch duplicate removal. Map preference: lowest latency.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest04-and-batch-sequencing--19-october-2026-sgt).

### Independent checking-window regression — 19 October 2026 SGT

The repaired dismissal journey passes all3 devices on4fc8ce3. Two tablet cases timed out when combining full guest selection, uncertain holding, reload and checking-window exhaustion.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#independent-checking-window-regression--19-october-2026-sgt).

### Browser failure regression expansion — 18 October 2026

Owner challenged the unchanged69 browser runs and requested comprehensive failure coverage. That number is23 legacy scenarios across3 devices; it did not include new failure journeys.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#browser-failure-regression-expansion--18-october-2026).

### Owner-approved combined hold — 18 October 2026

Source review of merged PR49/main87fde3c found Details → Review still performed preparation-stage fresh calendar reads followed by authoritative prebooking reads. latest03 measured8.691s preparation plus15.984s holding. Owner requested removal of that sequential duplication and initially proposed deleting mutable D1 rows on failure.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-approved-combined-hold--18-october-2026).

### Latest03 returning-session report and immediate rebooking — 18 October 2026

Owner reports unavailable-session display after returning with email and requests immediate first-step rebooking with backend work in the background. Refreshed main includes merged PR48 atd89ad5e.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest03-returning-session-report-and-immediate-rebooking--18-october-2026).

### Latest02 investigation, payment wake-up and email blocker — 18 October 2026

Owner requested at least80% latency reduction after latest02.har. Fresh deployed revision matches mergedPR47/main45ec58c.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest02-investigation-payment-wake-up-and-email-blocker--18-october-2026).

### Checkout grant-read consolidation — 18 October 2026

Owner requested removing repeated ownership checks after reviewing the latest single-session HAR. Actual observed Details → Review improved28.866s→27.271s while provider calls fell28→24; roughly10s remained outside provider spans.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-grant-read-consolidation--18-october-2026).

### Owner directs initial comments — 18 October 2026

Owner says to send the comment without further considerations. Apply that current decision over the earlier conditional-update prerequisite: wire the already validated formatter into the admitted admin comment write for the newly created booking set.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-directs-initial-comments--18-october-2026).

### Handoff flash and missing comments — 18 October 2026

Owner reports Review flashing after the spinner before the first HitPay navigation, plus missing players, school and communication method in provider Comments. A focused regression reproduces loading becoming success before navigation completes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#handoff-flash-and-missing-comments--18-october-2026).

### PR46 browser status assertion repair — 18 October 2026

CI39120279412 passed frontend/backend gates and17/18 live-email browser cases. The new completed-exit journey passed desktop Chromium, phone WebKit and tablet WebKit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr46-browser-status-assertion-repair--18-october-2026).

### Completed booking exit and provider diagnostics — 18 October 2026

Owner reports Make another booking returns to confirmation after successful payment and requests both explicit exit actions deactivate that routing. Source reset rejects restored checking attempts; hard navigation restores the same server-bound grant.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#completed-booking-exit-and-provider-diagnostics--18-october-2026).

### Circular mouse cursor — 18 October 2026

Owner requests a circular cursor with a lagging centre dot. Added one root-level pointer decoration with bounded dot travel and an animation loop that stops when settled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#circular-mouse-cursor--18-october-2026).

### Single-session booking validation optimization — 18 October 2026

Owner chooses single-session optimization first; multi-session atomicity testing remains deferred. Refreshed main6b8555a includes merged PR43.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#single-session-booking-validation-optimization--18-october-2026).

### Full confirmation, return continuity and transition loading — 17 October 2026

Owner HAR captured two sessions: prepare5.311s, hold44.370s, payment creation8.483s and checkout context0.737s. Return polling starts18:37:52SGT, first reports payment received at18:38:38 and confirmed at18:38:49; receipt200 completes around18:38:51.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#full-confirmation-return-continuity-and-transition-loading--17-october-2026).

### Paid return continuity and restore-before-prefetch — 17 October 2026

Owner requests repair after merged main4b59217 failed live-email CI39016144380. Frontend/backend passed; Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paid-return-continuity-and-restore-before-prefetch--17-october-2026).

### PR41 CI repair and paid-return diagnosis — 17 October 2026

PR41 run39012995799 failed browser checks: remembered identity expanded the email card and moved the guest action on desktop/tablet; confirmation tests still expected an inline heading; overlapping context/status work exposed the wrong accessible loading label. Keep the guest card independent of secondary account actions, reserve equal description space, and preserve equal primary button dimensions.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr41-ci-repair-and-paid-return-diagnosis--17-october-2026).

### HAR-fixed-01 booking loading and latency review — 17 October 2026

Owner reports unequal guest/email buttons, layout movement during requests, a long Review booking wait, and requests the same full-page logo loader used for home-to-studio navigation. Stretch the account cards and give both primary actions the same full width/minimum height.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har-fixed-01-booking-loading-and-latency-review--17-october-2026).

### Owner-requested migration process and testing documentation — 16 October 2026

Owner asks whether the booking optimization is available for the next test and requests a separate documentation PR for the full migration process, environment files, actual-API browser tests, mutation testing and latency/performance requirements. At this checkpoint PR39 head2c03fe1 is unmerged; the Worker serves source be9982b3 using activated new-account version140 c2a562d1.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-requested-migration-process-and-testing-documentation--16-october-2026).

### Migration sweep: remove old-account session preload — 16 October 2026

The owner-requested final pass found the experimental NativeSessionInit frame still loading soccerbotstudiosg on every live booking selection. Direct HitPay checkout does not use that native hosted-session experiment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-sweep-remove-old-account-session-preload--16-october-2026).

### Migration version activated — 16 October 2026

Owner explicitly authorized activation. Deployment ad3432df-b58f-4c74-b1a6-d5db7fb6729a activated saved version140 c2a562d1-3469-4b5c-8ecc-cd22837377f4 at17:29:45SGT,100% traffic.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-version-activated--16-october-2026).

### Deployed provider mismatch — 16 October 2026

Ordinary curl through the supported managed network returns HTTP200 for Worker health, catalogue and October calendar; the earlier Python HTTP403/1010 is client-dependent evidence, not general Cloudflare unreachability. Health still identifies source be9982b3 and version f2400190-6db5-4436-8c74-16371055b117.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#deployed-provider-mismatch--16-october-2026).

### 16 October 2026 — acceptance preparation and inactive legacy work

Owner confirms HitPay works locally, old records are noncritical test history, new-account settings complete, webhook unchanged and the new environment shell saved. They request verification and readiness for the first owner acceptance.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#16-october-2026--acceptance-preparation-and-inactive-legacy-work).

### Environment readiness and owner confirmations — 16 October 2026

Owner reports latest environment changes installed, confirms migration checklist item3 complete (new-account signing/settings/schedules), and confirms item4 webhook configuration remains unchanged. Record these as owner confirmations, separate from independently observed provider evidence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#environment-readiness-and-owner-confirmations--16-october-2026).

### 16 October 2026 — fresh runtime, migration readback and queue optimization

Refreshed remote main and actual Cloudflare SOURCE_REVISION: be9982b3b0420db88907ecb727d049cd87a86ee4. The clean historical experiment checkout 897cbfe was 196 commits behind, with no unique commits; it remains unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#16-october-2026--fresh-runtime-migration-readback-and-queue-optimization).

### Opening hours, four-hour lead and observed HitPay host — 16 October 2026

Owner requested the noon–20:00 permanent opening window and four-hour lead together with the diagnosed HitPay fix. Read-only owner-local API checks returned HTTP200, one exact reference, matching amount/currency and path, and the checkout.sandbox.hit-pay.com host.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#opening-hours-four-hour-lead-and-observed-hitpay-host--16-october-2026).

### HAR06 checkout latency and payment diagnostics — 16 October 2026

Owner HAR06 and redacted Worker/D1 evidence establish booking49/invoice40 created successfully at11:38SGT, with confirmed booking flags and an unpaid invoice. Details-to-Review took about53seconds: roughly20seconds queued behind background month work,5seconds for the browser-triggered fresh day read,6seconds for preparation (another fresh read), and21seconds for holding creation/readback (19 provider calls).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har06-checkout-latency-and-payment-diagnostics--16-october-2026).

### Sandbox deployment and recovery correction — 16 October 2026

Expanded local verification exposed an existing fixture calling Date.now separately for the start and end of an exactly20-minute grant. A millisecond boundary violates the unchanged database maximum.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#sandbox-deployment-and-recovery-correction--16-october-2026).

### Hold-state experiment evidence — 16 October 2026

CI38836809759 passed frontend verification and all337 runtime tests in both Worker jobs, but the strict ordered inventory rejected the two new titles appended at the end. Move only those two entries to their native-test execution position; all335 existing titles and every assertion remain unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#hold-state-experiment-evidence--16-october-2026).

### Complete sandbox configuration readback — 16 October 2026

Owner requested a full configuration check, which exposed five missing bindings beyond the previously restored route/enablement flags. Owner then authorized setting them.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#complete-sandbox-configuration-readback--16-october-2026).

### Calendar return and local reconciliation — 16 October 2026

Owner verified24October09:00 is correctly unavailable; that report is withdrawn. A separate frontend pause survives successful fresh validation followed by preparation failure, leaving Back-to-calendar loading until a selection edit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#calendar-return-and-local-reconciliation--16-october-2026).

### Stable guest option and HAR04/05 — 16 October 2026

PR34 is owner-merged as4e98eae after all three PR gates passed in38828870612. Owner reports guest-button movement when saved identity restores.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#stable-guest-option-and-har0405--16-october-2026).

### Confirmation restoration race exposed by mechanism tests — 16 October 2026

CI38823092566 reaches real holding/payment on all browser projects. Paid return passes on phone/tablet, while desktop receives confirmed200 then remains Checking: initial BookingProvider hydration/restoration changes the revision and cancels that protected read before a second request is throttled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-restoration-race-exposed-by-mechanism-tests--16-october-2026).

### Test longevity audit — 16 October 2026

Owner requests a review of all tests following the weekday-dependent CI failure. Inventory:50 files, comprising24 frontend/unit,10 Worker,3 browser and13 tooling/installer files.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#test-longevity-audit--16-october-2026).

### Mechanism browser transport and checking evidence — 16 October 2026

Run38820026896 exposed assumptions hidden by instantaneous API mocks: calendar warming/holding require response-based synchronization, and WebKit interception omitted the guest cookie. Run38821167567 passed335 Worker tests and frontend CI; its desktop journey reached payment and confirmation but an immediate second read met the real five-second quota.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#mechanism-browser-transport-and-checking-evidence--16-october-2026).

### Main CI weekday fixture failure — 16 October 2026

Owner merged PR33 as6a88134. Main run38816624792 failed frontend unit verification: two booking receipt tests expected8800 but received10800 after Singapore midnight made their real-clock tomorrow a Saturday.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#main-ci-weekday-fixture-failure--16-october-2026).

### HAR03 holding request rejected before provider dispatch — 15 October 2026

PR32 merged/deployed40cca80; main run38755799186 succeeded. HAR02 exposed reset sandbox flags; these were restored/read back with unrelated bindings and secrets preserved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har03-holding-request-rejected-before-provider-dispatch--15-october-2026).

### Owner HAR: Review booking interrupted — 15 October 2026

PR31 merged as1971d26; GitHub main run38747070570 passed verification and deployment. Owner registered completed/failed HitPay webhook and replaced placeholder salt; sandbox activation was separately read back.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-har-review-booking-interrupted--15-october-2026).

### Preserve hosted navigation until document unload — 15 October 2026

PR31 run38742439558 passed frontend/backend gates and the desktop live checkout journey. Phone/tablet WebKit exposed a second race: setting checkout success after location.assign lets the route guard issue an internal payment navigation before the external document commits.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preserve-hosted-navigation-until-document-unload--15-october-2026).

### HitPay browser handoff correction and activation request — 15 October 2026

PR31 run38740776215 passed frontend and Worker checks but the live-email journey failed on all three browser projects: the route guard changed review to /book/payment/ while protected HitPay context was still loading, unmounting review and cancelling its request. Keep review mounted during the active live checkout handoff; cancellation/unknown outcomes retain existing recovery behavior.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#hitpay-browser-handoff-correction-and-activation-request--15-october-2026).

### Direct HitPay final local verification — 15 October 2026

Final non-browser application verification passed177 unit tests plus source/tooling/lint/types and the production export. Final Worker verification passed333 tests with zero failures/skips and zero provider requests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#direct-hitpay-final-local-verification--15-october-2026).

### Direct hosted HitPay implementation resumed — 15 October 2026

Owner approves source implementation and hosted HitPay navigation after disclaimer; no intermediate payment screen. Owner moves fresh availability checking to after Details and requires retained details on calendar reselection.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#direct-hosted-hitpay-implementation-resumed--15-october-2026).

### Post-reset verification and ongoing email preparation — 15 October 2026

Live health/SQL confirmed deployedb20f481/versionfdd603d2, both admission indexes and1 row read for each targeted indexed query. Catalogue and October calendar succeeded.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#post-reset-verification-and-ongoing-email-preparation--15-october-2026).

### Coordinator optimization and security-widget layout — 14 October 2026

Owner reports roughly1,461 rows per admission query and4,690,285 daily rows read. Source optimization adds two indexes without relaxing provider limits or deleting history.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#coordinator-optimization-and-security-widget-layout--14-october-2026).

### Deployed customer rule; final month exposes token timing — 14 October 2026

PR27/source95df33c passed172 local unit/component tests and all three PR gates, merged as9d1d107, then passed all main gates and GitHub Cloudflare deployment. Worker suite303 and live browser15 passed; user browser execution and paid/webhook acceptance remain separate.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#deployed-customer-rule-final-month-exposes-token-timing--14-october-2026).

### Owner replaces customer 48-hour lead — 14 October 2026

YS sets the latest business decision to 2.5 hours before session start and explicitly confirms it supersedes 48 hours. Implementation shares 150 minutes across customer display and server checks; finite historical trials remain unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-replaces-customer-48-hour-lead--14-october-2026).

### Homepage browser gate catches impossible-date display reads — 14 October 2026

CI38508429832 passed Worker boundaries and frontend browsers. The expanded native homepage flight rejected two pre-Continue daily requests for today, while retaining the expected four calendar requests and one catalogue request.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#homepage-browser-gate-catches-impossible-date-display-reads--14-october-2026).

### Homepage public metadata regression alignment — 14 October 2026

CI38507816042 rejected the old ongoing-access assertion that anonymous /api/catalogue returns401. The authorized homepage contract now returns only public service metadata.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#homepage-public-metadata-regression-alignment--14-october-2026).

### Owner refines homepage prefetch and loading presentation — 14 October 2026

While PR27 cold-cache CI ran, YS requested immediate homepage warming, no new cache request on guest/email entry, a larger centred spinning logo without visible status text, and a check of Details ordering. Inspection found public months already start on homepage but member/service transitions could restart reads; session metadata was only fetched after entry.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-refines-homepage-prefetch-and-loading-presentation--14-october-2026).

### Live prices verified; reproduce cold-prefetch expiry before repair — 14 October 2026

PR26 passed all PR/main gates and deployed46b3201/versiona42014f2-3171-401c-ba78-9ce1d3cf0d46 through successful GitHub run38504874365. October public offers now validate at the intended two native service prices.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#live-prices-verified-reproduce-cold-prefetch-expiry-before-repair--14-october-2026).

### Preserve two deployment findings and repair their owners — 14 October 2026

PR25/source45655ab passed all three gates, merged asb8917b1, and all three main gates passed. GitHub uploaded and activated Worker75b5c5d8 at10:51 Singapore, but its immediate health response still named36b84bd.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preserve-two-deployment-findings-and-repair-their-owners--14-october-2026).

### Complete browser cache, branded loading and dual native prices — 14 October 2026

Owner requested immediate cached date/time selection, fresh validation at main Continue, SoccerBot spinning-logo loading throughout booking, and SGD88 weekday / SGD108 weekend/public-holiday native checkout. Created premium service3 with the explicitly approved three providers.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#complete-browser-cache-branded-loading-and-dual-native-prices--14-october-2026).

### Replace experiment closure with ordinary customer access — 14 October 2026

YS asked to remove automatic live-access closure, enable native checkout continuously and deploy from GitHub. Clarified that private browsing resets browser state but shares the backend/cache and produces real booking/payment effects.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#replace-experiment-closure-with-ordinary-customer-access--14-october-2026).

### Physical calendar inspection preparation — 14 October 2026

Fresh Cloudflare settings confirm a39cee7 deployed, provider/delivery disabled, end0, ceiling704 and no public calendar window. YS requested live access after observing unavailable session information.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#physical-calendar-inspection-preparation--14-october-2026).

### Post-merge diagnostic assertion collision — 14 October 2026

PR22 merged as4536186. Main run38476420076 passed frontend, live-email and Pages deployment, but backend passed294/295 Worker cases: the privacy assertion's unanchored2099 marker matched the generated correlation UUID, not leaked provider data.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#post-merge-diagnostic-assertion-collision--14-october-2026).

### Protected reload readiness — 14 October 2026

CI run38444619826 passed backend and live-email, including the repaired native guest journey on all three browser projects and295 Worker cases. Frontend passed165 unit/component cases and68 browser cases; one phone-WebKit synthetic reload assertion expired while its protected checkout read was still pending.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#protected-reload-readiness--14-october-2026).

### WebKit exposed a calendar clock race — 14 October 2026

CI run38442449150 passed frontend and all295 live Worker cases, but the live guest journey timed out on phone/tablet WebKit clicking a disabled known-available date. The provider receipt was newer than BookingProvider's minute-based display clock, so the freshness upper bound rejected it until the next minute.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#webkit-exposed-a-calendar-clock-race--14-october-2026).

### Final local checks and inventory correction — 14 October 2026

Full website non-browser verification passed with164 unit/component cases, production build and export checks. All295 Worker cases passed with zero failures/skips, but the verification wrapper correctly rejected the reviewed inventory because its file ordering differed from Node execution ordering.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#final-local-checks-and-inventory-correction--14-october-2026).

### Finish pending code and deploy — 14 October 2026

YS requested completion and deployment. Refreshed PR22/local b2862e0 and retained preceding changes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#finish-pending-code-and-deploy--14-october-2026).

### Interface-first North Star and calendar cache — 14 October 2026

YS requested a North Star making the live interface1:1 with demo first, retaining Turnstile and security additions, and explicitly removed trainer priority. YS then requested shared prefetch up to four months and updating both view/cache after failed selection.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#interface-first-north-star-and-calendar-cache--14-october-2026).

### Owner rejects homepage detour; readiness checked — 14 October 2026

Owner clarified that customers must not open SimplyBook homepage and asked whether the website is ready. Inspected local HEAD/status and relevant source: b2862e0, documentation-only modifications, unchanged direct checkout anchor and no browser initialization candidate.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-rejects-homepage-detour-readiness-checked--14-october-2026).

### Invoice34 body and fuller journey proposal — 14 October 2026

Owner supplied actual invoice-details body linking34 to confirmed booking43 for SGD88, not released by timeout, but with status paid / payment_received false / processor delay / null payment date. Recorded safe projection; no payment acceptance inferred.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#invoice34-body-and-fuller-journey-proposal--14-october-2026).

### Homepage-first checkout34 rendered after displayed due time — 14 October 2026

Owner reports loading the public homepage, then opening the original reference34 link exactly once in this trial at00:09 Singapore on14October. Supplied screenshot shows checkout with HitPay option,Payment pending,Pay later,$88,Kickoff Special15October19:00,created13October17:48 and due13October18:18.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#homepage-first-checkout34-rendered-after-displayed-due-time--14-october-2026).

### Broader community research: related precedents, no exact verified fix — 13 October 2026

YS requested looking beyond documentation. Searched WordPress support, Reddit, Stack Overflow, GitHub, runtime issue trackers, general web and provider user reports.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#broader-community-research-related-precedents-no-exact-verified-fix--13-october-2026).

### Existing-evidence diagnosis replaces repeated checkout experiments — 13 October 2026

YS challenged repeated403 tests and authorized analysis of retained evidence instead. Compared six exact b2862e0 source owners and public provider/HTTP documentation; app link flow matches documented generate-and-redirect contract.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#existing-evidence-diagnosis-replaces-repeated-checkout-experiments--13-october-2026).

### Same original reference34 link reaches both checkout and e403 — 13 October 2026

Owner confirms pasting the same provider-issued /v2/client/pay-later/id/{id}/hash/{token} entry link. Success redirects to #invoice/pay/{id}/direct-link/1; failure redirects to #error/e403.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#same-original-reference34-link-reaches-both-checkout-and-e403--13-october-2026).

### Native checkout34 reached intermittently with30-minute window — 13 October 2026

Owner requested one more native test opening immediately, proposed a temporary payment timeout30 minutes, and reported the change complete. Manual protocole208ef1793fe bounded one new booking/link/navigation, existing automatic test notifications, no payment or retry, and restoration to10 minutes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-checkout34-reached-intermittently-with30-minute-window--13-october-2026).

### Native invoice33 exists; displayed due time confounds the control — 13 October 2026

Owner supplied SimplyBook invoice detail #O-0000033: Pending payment / Pending(Pay Later), created13October17:02, due13October17:12, matching existing test client, Kickoff Special15October18:00,quantity1,SGD88,tax0. This establishes the SimplyBook invoice/order exists despite SBPay showing no related invoice document.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-invoice33-exists-displayed-due-time-confounds-the-control--13-october-2026).

### SBPay transaction33 explicitly has no related invoice document — 13 October 2026

Owner supplied transaction33 detail and status-log screenshots: Pending Pay later,SGD88, existing test customer39; booking line Kickoff Special15October18:00,quantity1, with Nabil tag. Created and last changed both display13October17:02.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#sbpay-transaction33-explicitly-has-no-related-invoice-document--13-october-2026).

### Native control exact error and post-failure pending state — 13 October 2026

Owner supplied the exact reference33 response {"error":"Access denied","data":[]} and confirmed payment remains Pending after the403. This matches the earlier invoice32 error; no visible timeout cancellation explains the current control, though pending alone does not prove every link/session authority remains valid.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-control-exact-error-and-post-failure-pending-state--13-october-2026).

### Native emailed link reproduces invoice-details403 with cookies sent — 13 October 2026

Owner approved successor manual packetb750ac59776c to open existing payment reference33 email link once after reporting it still pending and previously unopened. No new booking/link or Worker action.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-emailed-link-reproduces-invoice-details403-with-cookies-sent--13-october-2026).

### Native dashboard Pay Later link issued; navigation stopped — 13 October 2026

Owner approved sealed manual packet36f2efe5b74a for one existing-test-client/Nabil/Kickoff Special booking on15October18:00–18:50, leaving the displayed50-minute interval unchanged as a native-path control, not app40-minute acceptance. Pending (Pay Later) was selected.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-dashboard-pay-later-link-issued-navigation-stopped--13-october-2026).

### Ten-minute payment timeout compared with original failure — 13 October 2026

Owner reports the payment timeout is10 minutes. Invoice32 dashboard creation is15:41 Singapore (minute precision); retained handoff occurred15:41:32 and the owner failure report was received15:43:33.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#ten-minute-payment-timeout-compared-with-original-failure--13-october-2026).

### Invoice 32 now cancelled by timeout — 13 October 2026

Owner dashboard screenshot shows invoice #O-00000032, SGD88, created 13 October 15:41, item 15 October 16:30, payment status “Cancelled by timeout” and no payment received shown. Rows31 and30 visibly show the same status.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#invoice-32-now-cancelled-by-timeout--13-october-2026).

### Owner allowance snapshot and closed browser log — 13 October 2026

YS reported the original Network log closed, leaving native cookie/session handling unverified. Later supplied account valid until19October2026,6 days displayed,9 bookings remaining and0 SMS/WhatsApp/AI booking credits; blank custom-feature allowance recorded as unknown.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-allowance-snapshot-and-closed-browser-log--13-october-2026).

### Invoice403 authorization traced against source and public contract — 13 October 2026

YS authorized investigation after supplying GET invoice-details403 and Access denied. Verified five exact b2862e0 source owners and the private handoff shape without publishing its hash.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#invoice403-authorization-traced-against-source-and-public-contract--13-october-2026).

### Fresh native link isolates a403 invoice-access failure — 13 October 2026

After YS requested the next step, prepared b78955c40c72 using the same exact tested b2862e0 artifact and current25-migration state. A new complete-history SELECT consumed1 management request, bringing the carried count532.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#fresh-native-link-isolates-a403-invoice-access-failure--13-october-2026).

### Checkout-opening diagnostic stopped at availability — 13 October 2026

YS chose desktop Chrome/Edge and approved sealed ae8d4e8ba18b once. CI38360169797 passed frontend/backend/live-email on b2862e0; exact artifact11795270145 and287 Worker tests verified.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-opening-diagnostic-stopped-at-availability--13-october-2026).

### Checkout-only diagnostic source prerequisite — 13 October 2026

YS authorized proceeding with the next fresh checkout-opening diagnostic. Preparation found native_checkout_grants still capped624 while carried usage is618, so even the32-call availability admission cannot proceed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-only-diagnostic-source-prerequisite--13-october-2026).

### Owner readback narrows checkout investigation — 13 October 2026

YS answered: “1. Yes 2.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-readback-narrows-checkout-investigation--13-october-2026).

### Native settings checked through the connected account — 13 October 2026

After YS authorized the next read-only step, verified the connector company matches configured developer identity, then read Accept Payments and the complete90-feature list. Accept Payments is enabled/configured; Client Login is off; Take Me Back Home is on, differing from the historical off state.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-settings-checked-through-the-connected-account--13-october-2026).

### Read-only checkout diagnosis — 13 October 2026

YS requested diagnosis after confirming the link came directly from SimplyBook. Local/remote branch heads remainadd9cc2; retained outcome documentation is uncommitted.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#read-only-checkout-diagnosis--13-october-2026).

### Owner payment flight reached an immediate checkout 404 — 13 October 2026

YS approved packet301173108ab6 and the finite amended budgets. Exact-source CI38355111288 passed all three gates onadd9cc2, artifact11792912177 verified151 sealed files/287 Worker tests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-payment-flight-reached-an-immediate-checkout-404--13-october-2026).

### Checkout verification selected; finite budget source prepared — 13 October 2026

YS says "verify on checkout", removing the dashboard-name lookup dependency. Added explicit704 policy support because the proposed80-call payment/capture flight cannot fit the remaining57 ordinary calls under640.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-verification-selected-finite-budget-source-prepared--13-october-2026).

### Owner requests payment before further webhook investigation — 13 October 2026

YS reports that SimplyBook provides no developer support, asks to test payment first, and suggests payment-link completion may activate callbacks. YS explicitly agrees to prepare an owner-operated payment test.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-requests-payment-before-further-webhook-investigation--13-october-2026).

### Paired-control ingress investigation completed — 13 October 2026

Following YS's “ok lets do that”, used a bounded five-request maximum read-only inspection; four management requests were consumed. The first callback-prefix query returned zero events through 12:31:07 Singapore.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paired-control-ingress-investigation-completed--13-october-2026).

### Paired control executed; no signed receipts on either channel — 13 October 2026

Retained preparation failures: packet221ce3fe2188 stopped before live mutation because its expected subscription fingerprint came from a prior preservation subset with two rows, omitting that prior flight's own closed third record. A read-only closure proved all23 historical tables unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paired-control-executed-no-signed-receipts-on-either-channel--13-october-2026).

### Paired webhook control preparation — 13 October 2026

After the owner said “ok do it”, implemented separate fixed capture routes for booking and invoice notifications. Structural-only capture cannot safely infer event identity, so immutable per-window scope metadata isolates the diagnostic channels without storing payload values.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paired-webhook-control-preparation--13-october-2026).

### Deeper diagnosis identified an unproven event prerequisite — 13 October 2026

YS requested looking deeper. Rechecked the exact subscription destination/event proof and fixed-origin routing, extended stored-log search through10:44:54 Singapore, read Cloudflare Access/subdomain configuration and retained subscription2's closed local reference.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#deeper-diagnosis-identified-an-unproven-event-prerequisite--13-october-2026).

### Read-only delivery diagnosis completed — 13 October 2026

After YS said “ok determine”, compared stored developer HTTP telemetry with the sealed test's request IDs. All 14 expected operator requests matched correlation ID and status; all returned events were untruncated.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#read-only-delivery-diagnosis-completed--13-october-2026).

### Live acknowledgement fix accepted; no signed receipt at observation — 13 October 2026

YS approved packet7ec56094976f and amended limits. Exact-source CI and the282-test artifact were verified before execution.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#live-acknowledgement-fix-accepted-no-signed-receipt-at-observation--13-october-2026).

### DELETE acknowledgement regression and repair — 13 October 2026

YS requested resolving response handling and another acceptance test after the empty active list was verified. Official webhook documentation describes DELETE and active-list semantics without prescribing the DELETE body.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#delete-acknowledgement-regression-and-repair--13-october-2026).

### Empty active list confirmed after unknown DELETE — 13 October 2026

After clarifying that subscription DELETE does not cancel a booking, YS requested the read-only check and approved the one-extra-deployment amendment31→32. Packet1089bf8b452a reused tested source1e6bfbe and executed one authenticated active-list read.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#empty-active-list-confirmed-after-unknown-delete--13-october-2026).

### Cleanup crossed the parser guard and stopped at DELETE response — 13 October 2026

YS approved packet10c62a001eea with amended limits, then asked for status. The packet executed once on CI-passing source1e6bfbe.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#cleanup-crossed-the-parser-guard-and-stopped-at-delete-response--13-october-2026).

### Subscription flag mismatch repaired in its owner — 13 October 2026

YS requested “ok fix” after the read-only diagnostic. A new lifecycle regression with string flags failed on the prior numeric-only parser with `webhook_subscription_proof_incomplete`; the private failing receipt is retained.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#subscription-flag-mismatch-repaired-in-its-owner--13-october-2026).

### Actual subscription string mismatch observed — 13 October 2026

After YS approved packet46b93ebc17fa7, its exact CI-passing source27f03fc executed one active-subscription read. Five physical calls advanced455→460.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#actual-subscription-string-mismatch-observed--13-october-2026).

### Webhook flight stopped; access closed, subscription unresolved — 13 October 2026

Packet `b918a81d06e991549f9d67e449098bf87e8109bc9ea6affc98d69d7773d06a99` executed once under the approved campaign on source `f2e0a3e91824f569a161f29447471d5081259719`. All three gates passed in CI38313369930; artifact11776470322/SHA256 `ed0207005a4ce1a38bc3f8c9302e05895be968d9afbeddf40a05d5725c3d1e14` matched150 sealed files and273 strict Worker tests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#webhook-flight-stopped-access-closed-subscription-unresolved--13-october-2026).

### Approved technical payment/webhook campaign — 13 October 2026

Current subscription increment: all273 Worker runtime tests passed with zero failures/skips and no external provider calls; generated types, source/policy guards, affected lint and checker regressions passed. The packaged release now verifies preservation through pending0022/0023.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-technical-paymentwebhook-campaign--13-october-2026).

### Subscription source verification — 13 October 2026

The first focused run retained six passing and two failed subscription cases: immediate create-to-cleanup transition hit the existing four-per-second account limiter because each operation initialized pacing at zero. Initialize each bounded operation's first admission at the current time, preserving the300ms physical-request spacing across the boundary.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#subscription-source-verification--13-october-2026).

### Payment/webhook investigation and first repair — 13 October 2026

YS approved merging PR21 because of its size. It merged as383cc2e at00:17:30Singapore; main CI38276366243 passed frontend/backend/live-email and demo deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paymentwebhook-investigation-and-first-repair--13-october-2026).

### Developer native booking accepted and independently closed — 13 October 2026

Packet `217dfd4e4df2` executed once after YS approved the exact packet and amended resource limits. Source `8bd66c1` passed all three CI gates in run `38273011816`; artifact `11758121123` matched 148 sealed files, 257 Worker tests and all 21 immutable migrations.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#developer-native-booking-accepted-and-independently-closed--13-october-2026).

### Owner roster and instructor priority — 12 October 2026

YS supplied the October 2026 roster and explicitly set instructor priority **Faisal → Caelan → Nabil** when multiple instructors are available. Apply priority only among instructors eligible and freshly available for the entire selected session; do not replace an unavailable preferred instructor with an unverified one.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-roster-and-instructor-priority--12-october-2026).

### Approved setup inspection completed and closed — 12 October 2026

Packet `87a458a946d513e8e466dcf52f1f0cc9888d7bdf313cd1c0b347224bec94f87e` consumed the explicitly approved read-only scope on source `3af1323eda250b29f2bd95e2583d5dc49cbe161b`. Company, service 2, instructor 3 and combined working-hour reads all returned 15 October 09:00–21:00 Singapore and an empty interval list for 16 October.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-setup-inspection-completed-and-closed--12-october-2026).

### Full native acceptance execution resumed — 12 October2026

YS instructed “execute it now” against the consolidated full native acceptance draft. Continue technical implementation, evidence-backed discovery preparation, tests and PR21 publication.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#full-native-acceptance-execution-resumed--12-october2026).

### Native campaign stopped on actual date availability — 12 October2026

Sealed packet3f6019db7880 ran sourcee122ba5 after all-three CI38236452119/artifact11740802365 passed. The authenticated15–29October calendar returned14 start times on15October and no other offered date.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-campaign-stopped-on-actual-date-availability--12-october2026).

### Actual calendar discovery before the final native gate — 12 October2026

Flight4 accepted single booking35/invoice27; its independent22October availability probe returned zero offers. Two Cloudflare settings GET timeouts during closure were both charged as unknown management reads.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#actual-calendar-discovery-before-the-final-native-gate--12-october2026).

### Native single proof accepted and closed — 12 October2026

Flight4 consumed packet50e2a1263ac7 on24153c3, all-three CI38232933900/artifact11740055253. single proof at15 October 14:00Singapore: bookings35, invoice27, 1 signed confirmed booking reads, authoritative unpaid invoice, SGD88/tax0 and one native link retained unopened. Attempt375bbc00-297f-43fd-9671-2b0961aa5979 is observed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-single-proof-accepted-and-closed--12-october2026).

### Availability-only stop and actual-attempt accounting — 12 October2026

Flight3 consumed packet8e6824f42e2b on ee2853a (all-three CI38230887077/artifact11739086074).16October returned zero offers. The grant cache and request ledger prove no prepare/native POST, no attempt and no booking dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#availability-only-stop-and-actual-attempt-accounting--12-october2026).

### 12 October — same-date native checkout accepted

Flight2 used exact-source6ac6165 from all-green CI38229148061/artifact11737163517 under sealed packet5eb211c4ac62. New15October12:20/13:10Singapore selections completed batch7/bookings33/34 and invoice26.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october--same-date-native-checkout-accepted).

### 12 October — first autonomous flight reaches batch closure

The exact-source a206106 artifact passed all three CI38226503628 gates. Sealed packet dea4fe21baae ran once under YS's bounded campaign approval, applied0021 preserving history, and selected15October10:40/11:30Singapore.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october--first-autonomous-flight-reaches-batch-closure).

### Owner requests execution to native acceptance — 12 October2026

Current public book-response prose permits multi-entry batch responses; the accompanying recurring example does not supply aliases or a membership rule. A reproduced synthetic cumulative response failed on old code at the observed creation.bookings/mismatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-requests-execution-to-native-acceptance--12-october2026).

### Approved live trial reaches the second book — 12 October2026

YS approved exact packet c0916326b895 after the limits amendment and final-source CI. Artifact11735290126 bound6bc54f7,147 sealed files and241 passing Worker cases.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-live-trial-reaches-the-second-book--12-october2026).

### Live test requested; amended limits approved — 12 October2026

After the batch-association correction passed all three final-source CI38220464328 gates, YS requested live testing. The carried196/224 ledger leaves12 ordinary calls and cannot admit normal availability/checkout.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#live-test-requested-amended-limits-approved--12-october2026).

### 12 October2026 — local experiment for missing batch echo

YS requested “start experiment” after the approved follow-up identified creation.batch_id/missing. Refreshed current6759773/PR21 and canonical evidence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october2026--local-experiment-for-missing-batch-echo).

### 12 October2026 — approved follow-up reached batch membership validation

YS approved sealed packet a14dfea95559506c2a78c664d9436a22e29cfd38587a355399b5ab1139f27c4e with “approved, go”. Executed exact4671f3791560f9a7d09ba87de1643130a8267b69 after all three CI38217379501 gates passed and live-email artifact11732905946/archive2f0215674d0abe1085521e7bafead7e9cadbf026dd1304238b6ed4873afedf47 verified146 sealed files.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october2026--approved-follow-up-reached-batch-membership-validation).

### 12 October2026 — prepare owner-requested follow-up experiment

YS requested another experiment after the precise require_payment correction and all three final-source CI38216192722 gates passed. Checked local/remote d21e2b8 and the private independent closure receipt.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october2026--prepare-owner-requested-follow-up-experiment).

### 12 October2026 — exact approved diagnostic found the first failing field

YS approved sealed packet5a170ff0d98c54ff012d4980d8138942238afc9e0db1e61dd55bf717e30b82c7 with “approve go”. Executed exact source47b37dbb46480e66e17cfa763bb2acff1ea2b574 after all three CI38213290654 gates passed and artifact11729658054 verified145 sealed files (archive SHA2567f8b9247c1a30081b70e99ccac078d8c79eaf5bef9cfd5b03d66c5c1181a4967).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october2026--exact-approved-diagnostic-found-the-first-failing-field).

### 12 October 2026 — audit the intermediate creation contract before a new proof

YS requested all three proposed steps: inspect official contract/examples, compare every consumed field, correct demonstrated mismatches with tests, and prepare a bounded diagnostic proof if documentation remains incomplete. Reviewed the public wiki's actual response-example section, current API index and provider staff batch/client-signature guidance.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october-2026--audit-the-intermediate-creation-contract-before-a-new-proof).

### 12 October 2026 — actual retained-booking read passed all independent predicates

Owner approved packet120046b5 with “Approve, go”. Preflight corroborated the handover closed version,125/192/active0,18 applied migrations and exact retained key/session custody.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october-2026--actual-retained-booking-read-passed-all-independent-predicates).

### 12 October 2026 — owner requests a real format read

YS challenged continuing from guessed response semantics and requested a current read checked against all applicable fields. The preceding private-diagnostics source a9ecf38 passed all three CI38207930497 jobs.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october-2026--owner-requests-a-real-format-read).

### 12 October 2026 — diagnose the failed192 checkout without another booking trial

Owner handover reports the approved exact192 packet executed from5dacab5, applied0018 with historical preservation, passed readiness/availability/immutable preparation and retained one batch/booking. Integration validation stopped at book/session0 with native_representation_unverified and125 cumulative provider calls after independent cleanup reads.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october-2026--diagnose-the-failed192-checkout-without-another-booking-trial).

### 12 October 2026 — owner-approved192 preparation after budget preflight

Cart lifecycle source9843246 passed all three CI38201415046 gates and229 local Worker tests. User requested the live checkout proof.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#12-october-2026--owner-approved192-preparation-after-budget-preflight).

### Owner corrected unfinished-cart interpretation — 12 October 2026

The approved residual-only pass installed the verified source, passed readiness and read the retained booking. No invoice reference was present.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-corrected-unfinished-cart-interpretation--12-october-2026).

### Corrected identity proof retained a partial booking — 12 October 2026

Exact-source CI for6e845cb passed all three gates after the preview diagnostic correction. Its approved developer proof passed baseline/active readiness, availability and immutable preparation, then returned recovery_required.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#corrected-identity-proof-retained-a-partial-booking--12-october-2026).

### Preview failure reporting during identity-fix CI — 12 October 2026

The corrected identity source passed backend and live-email CI, including224 Worker cases and their browser/release gates. Frontend passed68/69 browser cases; one tablet synthetic checkout received HTML404 instead of200.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preview-failure-reporting-during-identity-fix-ci--12-october-2026).

### Idle readiness passed; identity expiry reproduced and repaired — 12 October 2026

The exact approved idle-lifecycle experiment passed baseline, activation and closure readiness. Availability and immutable preparation succeeded; native checkout stopped before effects at provider_identity_expired while reading catalogue instructors for the second session.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#idle-readiness-passed-identity-expiry-reproduced-and-repaired--12-october-2026).

### Configuration mismatch isolated; owner requests a controlled fix — 12 October 2026

The latest finite proof confirmed Worker activation while protected coordinator readiness retained the previous disabled configuration. All bounded observations agreed; execution stopped before native authority, provider calls or bookings, then verified closure.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#configuration-mismatch-isolated-owner-requests-a-controlled-fix--12-october-2026).

### Approved128 proof closed before provider dispatch — 12 October 2026

YS approved the exact finite packet. It applied0017 while preserving all historical rows and installed the reviewed128 policy.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved128-proof-closed-before-provider-dispatch--12-october-2026).

### Owner-approved128-call preparation — 12 October 2026

YS approved preparing a128-call cumulative continuation with33 already consumed and16 reserved for recovery. Implemented an explicit80-or128 configuration policy with80 as the committed default, preserving the account/campaign ledger and old per-grant limits.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-approved128-call-preparation--12-october-2026).

### Native prerequisite diagnosis source — 12 October 2026

Inspection found orchestration deliberately converted preflight failures into prerequisites_unavailable while the finite checkout retained no private cause. Added a bounded private diagnostic in the existing grant result, with observation of existing prebooking reads.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-prerequisite-diagnosis-source--12-october-2026).

### Signing amendment execution and closure — 12 October 2026

YS explicitly approved the prepared signing amendment. Execution applied only0015/0016, preserved every historical row, uploaded the exact sealed native release and installed the missing encrypted binding.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#signing-amendment-execution-and-closure--12-october-2026).

### Backend proof first stop — 12 October 2026

After explicit owner approval, the backend proof ran its first two read-only management checks at00:14:28–00:14:29SGT. The current deployment version matched the expected baseline, but the returned binding inventory lacked the required native signing secret.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#backend-proof-first-stop--12-october-2026).

### 11 October — native uncertainty and compensation continuation

YS requested native booking be carried through settlement rather than stopped at another PR checkpoint. Inspection found returned references could be lost before strict creation validation, and a failed checkout handoff could leave saved state dispatching.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#11-october--native-uncertainty-and-compensation-continuation).

### Native browser fixture correction — 11 October

At2972d2d, CI38135134330 passed the Worker gates and all12 existing live identity/browser cases. The three new native journey cases stopped at the Details action because the new fixture asked for a button named Continue; the existing product action is Review booking (also used by the original customer suite).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-browser-fixture-correction--11-october).

### 11 October — customer-native continuation after5878001

Checkpoint5878001 passed CI38133435815. Continued immediately into native availability/selection/Details/Review/preparation/checkout/restore in the existing owners, with no provider or remote account operations.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#11-october--customer-native-continuation-after5878001).

### 11 October — native checkout implementation and owner configuration confirmation

Owner answered that tax is disabled,S$88 is the full total,40+10minutes is configured and Client Login is disabled. Implemented a scoped expiring owner declaration, fresh guest/native-client separation, native multi-session batching/line joins, durable keys and signed known-ID recovery, and a finite protected checkout composition under new empty0016.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#11-october--native-checkout-implementation-and-owner-configuration-confirmation).

### Metadata discovery accepted and closed — 11 October 2026

YS approved packet SHA256 `e535f54372e47d6cde632f8b643b91dd669cb90eade2efbcdc9c50343831321a` in this session. Executed10:07:35–10:09:04UTC (18:07:35–18:09:04SGT),89.318 seconds within the20-minute limit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#metadata-discovery-accepted-and-closed--11-october-2026).

### 2026-10-11 — Defer physical flight until native and webhook technical completion

YS asked for webhook instructions after native technical readiness, with a strong directive to resolve the integration, and clarified that the whole flight should be tested together. Recorded one combined acceptance stage, preserving automated/contract validation now and physical acceptance pending.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--defer-physical-flight-until-native-and-webhook-technical-completion).

### 2026-10-11 — Execute the six native completion items

YS asked to draft and execute the six remaining native-booking items, then merged PR20 after exact head2d48ed0 CI38128735760 completed frontend/backend/live-email successfully. Verified merge25aac892.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--execute-the-six-native-completion-items).

### 2026-10-11 — Final native checkout decisions

Every booking automatically attempts a Comments entry `Number of players: N` (default1, range1–4). When the optional fifth Details field is filled, append `School / organisation: VALUE` on the next line; omit that line when blank.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--final-native-checkout-decisions).

### 2026-10-11 — Native-first North Star and one-studio clarification

YS requested the full plan and immediate execution with native booking followed by webhooks. Refreshed cleanf881510/PR20 and green three-job CI38116387515; drafted the complete dependency sequence through client UAT/launch/support.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--native-first-north-star-and-one-studio-clarification).

### 2026-10-11 — Remember me consent and reachable contact editing

YS specified that contact details save only when Remember me is selected, on Details form submission, without a separate booking save button or duration in the label. The90-day absolute policy remains.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--remember-me-consent-and-reachable-contact-editing).

### 2026-10-11 — Owner replaces provider-only prefill with website contact profile

YS explicitly selected latest name/phone confirmed on this website, including one shared profile for a shared email and no changes to old bookings. This replaces the prior prerequisite for SimplyBook-only prefill.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--owner-replaces-provider-only-prefill-with-website-contact-profile).

### 2026-10-11 — Merged North Star execution package

Owner merged PR19 at298c9c8f443063f8b21a2e7b006993a1ec76a9e7. Main CI38112617043 passed all three verification jobs and Pages deployment; this is separate from PR-headc2f2506/CI38049449145 and deployed Worker4a10133.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-11--merged-north-star-execution-package).

### 2026-10-10 — PR19 owner proof and explicit closure

User approved the exact37-management/4-deployment packet and confirmed two-profile readiness. Seven preflight reads matched closed sourcef2795a1/version3bb98b99, secret binding types, no schedules,0001–0012 schema/history and two closed windows.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--pr19-owner-proof-and-explicit-closure).

### 2026-10-10 — PR18 merge and finite identity-proof preparation

Owner merged PR18 atfe179d205437850884d5fb5dc7ed177245ccead9. Main independently passed38044816610 frontend/backend/live-email and Pages deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--pr18-merge-and-finite-identity-proof-preparation).

### 2026-10-10 — PR18 release-preservation checker repair

Candidate47cc928 CI38043587921 passed172 Worker cases and9 live-browser executions before sealed-release validation failed on a read of `_cf_METADATA.key` with SQLITE_AUTH. The new preservation inventory accidentally included D1's protected internal table.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--pr18-release-preservation-checker-repair).

### 2026-10-10 — M3.5 source continuation from merged PR17

Refreshed GitHub and local state: main2f08b1c contains PR17/headb94b14a and PR16 functionality; main's separate CI38041760947 passed. Preserved the clean historical experiment checkout897cbfe and opened a new feature worktree.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--m35-source-continuation-from-merged-pr17).

### 2026-10-10 — Quotation A3 and next quick-rebooking North Star

Owner clarified that quick rebooking is a core requirement, then supplied APP404-SBS-Q-WEB-001.pdf. Read p3 A3 directly: verified approved SimplyBook name/phone prefill, customer review/correction, safe duplicate/shared-email handling and expiring single-use verification/rate limits.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--quotation-a3-and-next-quick-rebooking-north-star).

### 2026-10-10 — Owner email test and explicit closure

Replacement sourcef2795a1 passed all three CI jobs and local139-file seal plus17 compiled-Worker cases. Approved0012 preserved the original closed record and every baseline table fingerprint.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--owner-email-test-and-explicit-closure).

### Unused email window replacement — 10 October 2026

The first live-email candidate087576ed was deployed after preserving original asset202 and URL-check failures; corrected account HTML/sitekey JS matched sealed bytes. Source/version readiness passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#unused-email-window-replacement--10-october-2026).

### 2026-10-10 — Email activation packet review

Reconciled owner Dashboard setup and five approved read-only checks: initial plaintext bindings were corrected by owner, then secret_text types verified. Prior deployment budget is exhausted; unknown Dashboard usage remains explicit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-10--email-activation-packet-review).

### 8 October 2026 — Developer integration continuation

Fresh deployed Worker authentication now succeeds for both public and admin credentials; company login matches and booking allowance is26/50. Four durably reserved requests, active0; operator grant closed after identical read-back.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--developer-integration-continuation).

### 2026-10-04 — Frontend foundation

### Inputs and authority

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-04--frontend-foundation).

### 2026-10-04 — Documentation/process review before GitHub

### Scope and reviewed sources

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-04--documentationprocess-review-before-github).

### 2026-10-04 — Reference restoration and standardized guarded update

### Baseline, authorization and root cause

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-04--reference-restoration-and-standardized-guarded-update).

### 4 October 2026 — macOS temporary-directory repair

- User reached Node 24.19.0, then the delivered installer refused its own temporary candidate under `/var/folders/.../T`. The stack ends in candidate preflight, before backup or source application.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--macos-temporary-directory-repair).

### 4 October 2026 — case-insensitive filesystem test repair

- User's macOS receipt confirms the restoration applied and source/policy gates passed. The tooling gate executed 43 cases: 41 passed and two failed (`rejects case-colliding files`, `rejects case-colliding parent directories`).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--case-insensitive-filesystem-test-repair).

### 4 October 2026 — restore the required installer delivery format

- User supplied the completed macOS run of `SoccerBotStudioSG_MacOS_Checks_2026-10-04.sh`: 45 tooling, 24 installer and 29 application/component cases passed, with formatting, lint, types, exact unit receipt and production export. Node was 24.19.0 and npm 11.17.0.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--restore-the-required-installer-delivery-format).

### 4 October 2026 — local verification format corrected

The user supplied two external local-delivery and publication shell examples dated 4 October 2026. Both were decoded and inspected as text, never executed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--local-verification-format-corrected).

### 4 October 2026 — correct headless browser preflight

User run `SoccerBotStudioSG_Standard_Local_2026-10-04.icv43q_h` passed runtime, Git/source, staged health and all 25 installed dependency-version checks, then stopped on full Chromium before source writes. The supplied external project local reference does not make this additional executable check.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--correct-headless-browser-preflight).

### 4 October 2026 — first complete user browser run and bounded repair

Uploaded log `Pasted markdown(2).md`, run `SoccerBotStudioSG_Standard_Local_2026-10-04.7vmw50eb`: runtime/source/dependency/browser/port preflight passed, source applied, code checks and all 29 unit/component cases passed, and a fresh static export completed. The browser matrix executed all 30 cases: 25 passed and five failed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--first-complete-user-browser-run-and-bounded-repair).

### 4 October 2026 — enquiry hydration input loss

User run `SoccerBotStudioSG_Standard_Local_2026-10-04.m_abcjyr` passed code/build and 29 of 30 browser cases. Guardian cases passed on all projects; the assistant journey passed desktop/tablet.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--enquiry-hydration-input-loss).

### 4 October 2026 — duplicated generated Next.js types

User run `SoccerBotStudioSG_Standard_Local_2026-10-04.62mfyqb4` applied the enquiry hydration candidate (`8062281fbed3a75a2eb6aa0b6963cfe895477c5ab759c41325a47c6c34703a6f`) and retained unchanged Git state. Source, policy, tooling, installer, formatting and lint gates passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--duplicated-generated-nextjs-types).

### 4 October 2026 — PR 2 browser selector failure

PR 2 was published at `b987f01c10f1c3822eb0cbe0713938da7d224ccd`. Its complete remote tree matches the reviewed generated-type repair candidate.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--pr-2-browser-selector-failure).

### 4 October 2026 — frozen-clock regression in the attempted CI repair

User receipt and failure archive `SoccerBotStudioSG_Standard_Local_2026-10-04.wqezwg0h` bind to candidate `201d73121041b176510749c4212d3f63799da2ae1ac64c6e63d247c816fcb6a0` on unchanged PR head `b987f01c10f1c3822eb0cbe0713938da7d224ccd`. Every non-browser gate passed, including all 33 application cases and the build.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--frozen-clock-regression-in-the-attempted-ci-repair).

### 4 October 2026 — GitHub Pages was publishing the README

PR #2 merged at `168b19bc7ab680ac236cb348b48514df64a26c7b`; previous feature head `02dc272d54b3b3cb3f0ab3e4ba9b935ec9ee043e` shares tree `0516f3c2d7cd9bc936df1535d387f022ad9d1ef9`. All 109 reviewed files matched that remote tree byte-for-byte before this repair.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--github-pages-was-publishing-the-readme).

### 4 October 2026 — accepted Pages evidence and complete iteration baseline

The user requested durable engineering rules and exact installer examples after repeated wrong-file/fingerprint mistakes, then a numbered roadmap through deployment/post-deployment and a guarded local installer for that plan. Reviewed the attached iteration handoff, current repository owners, latest external project handbook, general guidelines, exact external project local example and SoccerBot Pages local/R2 publication shells as data.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--accepted-pages-evidence-and-complete-iteration-baseline).

### 4 October 2026 — Booking oracle follow-up and instructor rotation

YS reported “ok pass” for the planning installer, then requested exact rolling/footer logos and booking sizing/placement, full-width actions, instructor choice retained at the time step, and instructor names on slots across 9am–9pm in three-hour blocks. A temporary instruction prohibited crossing rotations; the subsequent repeated correction allows crossings with a customer disclaimer.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#4-october-2026--booking-oracle-follow-up-and-instructor-rotation).

### 5 October 2026 — instructor selection failure repair

YS supplied the unchanged `SoccerBotStudioSG_Standard_Local_2026-10-04.ji57rqjm` receipt and failure ZIP. Application completed with candidate-map fingerprint `04cbf8201e128b1df082956bb26eadd016e3474309fa1207ea88b81bc305c80e`; branch `fix/pages-deployment`, HEAD `12c174a98c97a5d7c7b0cd041c090e31a903e95b`, and index were preserved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#5-october-2026--instructor-selection-failure-repair).

### 5 October 2026 — accepted local repair and booking-flow update

YS supplied `SoccerBotStudioSG_Instructor_Selection_Local_2026-10-05.962a08ae.json`. Its full local verification passed: 13 gates, 38 unit/component cases and 33 browser executions, with browser execution true and no omitted/extra cases.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#5-october-2026--accepted-local-repair-and-booking-flow-update).

### 5 October 2026 — header-blue and typography standardization

At 07:01 SGT, YS reported the booking-flow update “all good” and requested a deep colour/font/size audit with clear heading/body boundaries, especially inside booking. The client identified teal as inconsistent with the actual main header.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#5-october-2026--header-blue-and-typography-standardization).

### 5 October 2026 — latency architecture and measurement planning

At 07:38 SGT YS reported the design-system update “all good” and paused implementation to examine SimplyBook latency. At 08:43 SGT YS authorized deep incorporation into the design/architecture plan plus baseline measurements and best-target acceptance planning.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#5-october-2026--latency-architecture-and-measurement-planning).

### 6 October 2026 — client read-only discovery and boundary repair

YS first exercised developer account `app404`, then supplied the separate client account `soccerbotstudio` and exact service `Kickoff Special`. Client access was authorized read-only; YS stated native booking goes live on 7 October.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#6-october-2026--client-read-only-discovery-and-boundary-repair).

### 6 October 2026 — Codex Cloud transition and external project source adaptation

At 20:51 SGT YS requested a remaining-API check, refactored documents ready for Codex Cloud, and forwarding the work to GitHub. The named “Model Context Protocol Overview” and “Engineering Workflow Principles” discussions establish bounded North Stars/Ralph runs, autonomous routine repairs, focused iteration/full CI, Cloud Playwright and optional local viewing, a usable preview, and a human merge/deploy boundary.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md).

### 6 October 2026 — verified Mac baseline and separate sync PR

YS uploaded `SoccerBotStudioSG_Local_Checkpoint_2026-10-06.569kaq7o.json` at 21:36 SGT. The receipt was collected at 21:35:24 SGT; its SHA-256 is `a896ceb7d09e88dd44ded1425031d7fc90702364ce6b59cf3128db692818d431`, and its shell SHA matches the delivered `b23a49d1708809e8ac1ced74b56406b3cc36ef49004428281f5ba3a7d9b67ddd`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#6-october-2026--verified-mac-baseline-and-separate-sync-pr).

### 6 October 2026 — merge approval failure and enforced check naming

YS objected to the unauthorized PR #4 merge. The assistant acknowledged the error and paused further writes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#6-october-2026--merge-approval-failure-and-enforced-check-naming).

### 6 October 2026 — CI status-check naming

YS requested the same `verify / frontend` status-check name as external project. Read the actual external project `pages.yml` caller and reusable `verify.yml`: its `verify` caller invokes the `frontend` job.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#6-october-2026--ci-status-check-naming).

### 6 October 2026 — Cloud experiment refreshed from latest main

At 23:11 SGT YS requested the Cloud migration PR updated from latest main and concrete Codex Cloud setup steps. Independently matched all 121 baseline blob hashes/modes to tree `61918e04933afd960358903a2aa152a0872c7024`; prepared an isolated candidate and reconciled the eight experimental documents.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#6-october-2026--cloud-experiment-refreshed-from-latest-main).

### 7 October 2026 — booking-page readiness test repair

The C3/C4 documentation handoff at `74ca490f8a52025eff16933e500933c359eebfee` failed required [CI run 37559663874](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37559663874), attempt 1: the time-step interaction expected two instructor cards and received one. The [original failure artifact](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37559663874/artifacts/11456785312) and C3 receipts are preserved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--booking-page-readiness-test-repair).

### 7 October 2026 — M2.1 capability reconciliation with Cloud preview deferred

YS's handoff authorizes M2 provider feasibility while retaining CLOUD-01's unresolved user-preview acceptance. Started from clean `experiment/codex-cloud-workflow-2026-10-06` at `a6f1a6cc151200727d7806ff97a79c963edb2516`, with passing [full CI 37560542328](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37560542328) and unchanged original C3 receipts.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--m21-capability-reconciliation-with-cloud-preview-deferred).

### 7 October 2026 — elapsed-slot Cloud application trial

YS authorized one meaningful demo application cycle from reviewed `d6b3ccdbf7455ddcda4103484caedf6b8b57a928`, with clean tree/index and draft PR #6. It supersedes M2 planning as the bounded active task without closing any provider prerequisite.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--elapsed-slot-cloud-application-trial).

### 7 October 2026 — YS merge and developer payment evidence reconciliation

YS merged PR #6 at main `37c220a33caa85f875baaf98726205cec7b9d495`; GitHub run `37568173451` is completed/success for that main SHA. YS explicitly moved application inspection to deployed main.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--ys-merge-and-developer-payment-evidence-reconciliation).

### 7 October 2026 — developer API access and planned Cloudflare release workflow

YS merged PR #7 at 14:21 SGT as main `e883c1af117a960eeae9359c4db9923d774888dd`, tree `16920dff690824b89e4e129d1742bd932b11e1ec`. Main run `37581074421` passed independent `verify / frontend` and the existing Pages deployment; PR head `34effa7f5182368de0a28a16c8e878cb0551e6aa` had passed run `37579661636`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--developer-api-access-and-planned-cloudflare-release-workflow).

### 7 October 2026 — native invoice checkout research and owner evidence

YS requested public-document research before asking for technical answers, with zero additional provider-account calls and no single-session execution. Refreshed PR #8: open at reviewed `04e82f800508c08defa433776f715259333772cf`, earlier successful run `37583277947`; fetched main remains `e883c1af117a960eeae9359c4db9923d774888dd`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--native-invoice-checkout-research-and-owner-evidence).

### 7 October 2026 — staged native checkout experiments replace support gate

YS confirmed PR #8 merged and directed official research plus controlled experiments rather than requiring six live-chat answers. Refreshed actual main `97b42c7d561ffa0167eb3ca1113d18e143a9e0d9`, tree `976cf0a064a82bb655d22fc9156c5a4663a80068`; independently rechecked main run `37589441392` with successful required job `112687131937` and existing deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#7-october-2026--staged-native-checkout-experiments-replace-support-gate).

### 2026-10-08 — Native developer Card proof reconciled; browser-return reliability preparation

PR #9 was independently refreshed open, draft and unmerged at `21c8fc855a0e6d8371b541b7ef35d3d4ee1b4e75` on `docs/native-checkout-stages-2026-10-07`. The existing detached PR worktree and historical `897cbfe737d31069ae25dca39c638cdededf3593` checkout were initially clean and preserved; no new checkout, reset or publication.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#2026-10-08--native-developer-card-proof-reconciled-browser-return-reliability-preparation).

### 8 October 2026 — Owner canary failed; automatic return control prepared

Owner Edge showed Fetch.requestPaused followed by Fetch.continueRequest, then DNS_PROBE_FINISHED_NXDOMAIN for the reserved canary. This fails return prevention; the source of continuation is unknown.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--owner-canary-failed-automatic-return-control-prepared).

### 8 October 2026 — CAP05 Cloud-only capacity preparation; no overlapping instructor fixture

YS requested executable Cloud-only preparation, zero provider-account calls and no local terminal/browser dependency. PR#9 was freshly checked open/draft/unmerged at21c8fc855a0e6d8371b541b7ef35d3d4ee1b4e75; reused its existing detached worktree and seven documentation edits with empty index.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--cap05-cloud-only-capacity-preparation-no-overlapping-instructor-fixture).

### 8 October 2026 — DUP06 scope decision and offline executable preparation

YS clarified that one studio uses non-overlapping instructor timetables and explicitly deferred cross-instructor shared-resource testing and further resource allocation. CAP05's invalid pair is retired unexecuted, not accepted.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--dup06-scope-decision-and-offline-executable-preparation).

### DUP06 contact-control correction — 8 October 2026

YS requested automatic clear identities and repeated continuation. Names are APP404 DUP06 A and APP404 DUP06 B.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#dup06-contact-control-correction--8-october-2026).

### 8 October 2026 — approved DUP06 stopped at first authentication

DUP06 execution stopped after request43: Admin authentication transport outcome unknown, no HTTP status retained and no retry. No public authentication, availability, booking or recovery request was sent; no new booking exists from this run.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--approved-dup06-stopped-at-first-authentication).

### 8 October 2026 — agreed payment-confirmation design recorded

YS agreed that the intended supported native-checkout return should end at our frontend confirmation route. Initial copy is “Checking your payment and booking…”.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--agreed-payment-confirmation-design-recorded).

### Capacity request43 offline diagnosis and proposed diagnostic continuation — 8 October 2026

Capacity remains the active objective. Usage stays43 (2 owner-reported +41 journaled), with19 capacity requests paused and14 NR04 requests reserved; no booking was created by DUP06.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#capacity-request43-offline-diagnosis-and-proposed-diagnostic-continuation--8-october-2026).

### 8 October 2026 — bounded developer evidence campaign

Owner adopted a complete A–G campaign, superseding prior future-operation approval gates while preserving the expired DUP06/NR04 history. Verified start43 (2 owner-reported +41 journaled); private campaign journal explicitly absorbed unused19+14 into200 additional, cumulative243.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--bounded-developer-evidence-campaign).

### 8 October 2026 — focused continuation, native reconciliation and publication authority

The owner opened a new four-hour continuation after the73-request campaign and supplied native-dashboard findings for24. Preflight14:14:10SGT set deadline18:14:10SGT, start73 (2 owner-reported +71 journaled),60 additional within outer243, effective ceiling133, six possible bookings/two sandbox submissions and12-call recovery floor.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--focused-continuation-native-reconciliation-and-publication-authority).

### 8 October 2026 — offline protected-confirmation component

Owner explicitly approved the narrow dependency exception before M2.5: implement and publish one offline domain verifier, review relevant M1 prerequisites, preserve every live/release gate, and make zero provider-account requests. M1 source and test controls support this slice; fresh main-protection read returned GitHub403, advisory disposition/full release controls remain open, and no physical/visual acceptance is inferred.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--offline-protected-confirmation-component).

### 8 October 2026 — Cloudflare development foundation campaign

The new direct North Star authorizes a narrow development dependency exception, named isolated Cloudflare resources/deployment and draft publication; no merge, production, paid service, client writes or provider settings change. One working agent and one PROGRESS ledger.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--cloudflare-development-foundation-campaign).

### 8 October 2026 — Cloudflare campaign publication receipt

Draft PR #11 publishes application revision `8c56f2658e9586b2b841e53c3ee179925b809d89`. CI [37754354471](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37754354471) passed both verification jobs: 84 application cases, 25 actual Worker/D1/coordinator cases, and 48 browser executions for each hosting path.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#8-october-2026--cloudflare-campaign-publication-receipt).

### 9 October 2026 — M3.2 asynchronous booking implementation

01:00SGT bounded task, deadline07:00; explicit M1/M2.5 dependency exception, one agent and zero provider calls. Refreshed cleanc10d843, main3bf8e3b, draftPR11, green37800070002 and existing deployment9d0a3c9f.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--m32-asynchronous-booking-implementation).

### 9 October 2026 — M3.3 durable recovery implementation

08:34SGT start,14:34SGT deadline; one agent and explicit dependency exception. PR connector reports accepted0ab4085, draft/unmerged, main3bf8e3b.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--m33-durable-recovery-implementation).

### 9 October 2026 — Experiment 1 separate checkout

The owner reordered the next task ahead of M3.4: implement and visibly demonstrate separate checkout while preserving M3.3 and all closed campaigns. A typed protected checkout context now supplies a summary and explicitly unavailable live capability.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--experiment-1-separate-checkout).

### 9 October 2026 — native sandbox preparation after merged Experiment1

PR11 is owner-merged at49000e6716cf9aeabd3d7a62f1b2579fb9a59078. Its final source0363e70 passed PR CI37875189183.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--native-sandbox-preparation-after-merged-experiment1).

### 9 October 2026 — historical responses to native adapter implementation

PR12 was rechecked open/draft/unmerged at7b83a8b; its completed two-job CI37884721443 and repairs are reused. Current main49000e6 remains unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--historical-responses-to-native-adapter-implementation).

### 9 October 2026 — SimplyBook-owned dynamic data continuation

Start14:01SGT, finite stop20:01SGT, one agent and at most3 repairs per issue. PR12 was found owner-merged at e91fb12; PR13 remained open at8a4226b.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--simplybook-owned-dynamic-data-continuation).

### 9 October 2026 — precise native discovery after owner-merged PR13

Started15:10SGT with one agent and21:10SGT deadline. Actual main757fd28 and run37896841542 were inspected: both required verification jobs and existing Pages deployment succeeded.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--precise-native-discovery-after-owner-merged-pr13).

### 9 October 2026 — approved discovery execution stopped before provider dispatch

YS approved the exact discovery-only packet. Source661cbf54ae33bd8e08f00d631ea78772f9ea2ded, tested merge13479d792bcd3ed2d66614dfd15c4973dd87ab75, treeb002e2c8cd7e0fe14ea627d5db17929080aab669 passed both jobs in CI37899051046.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--approved-discovery-execution-stopped-before-provider-dispatch).

### 9 October main integration engineering checkpoint

The governing continuation permits one agent/24 active hours/72 elapsed hours/60 loops/six evidence-based repairs, not new external execution. PR14 adds an asynchronous guest/identity boundary, protected finite customer catalogue and an unconfigured scheduled recovery handler using the existing durable and canonical confirmation owners.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-main-integration-engineering-checkpoint).

### 9 October 2026 — recovered environment and bounded Resend composition

Fresh workspace contained a clean older experiment checkout, not the retained campaign worktrees. Recovered exact PR14/15 through Git and confirmed both reported final CI runs.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--recovered-environment-and-bounded-resend-composition).

### 9 October 2026 — public Turnstile binding and separate live-email evidence

Fresh attachment recovered PR16 source/tree exactly while preserving the older experiment checkout. Earlier private campaign worktrees/receipts were absent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#9-october-2026--public-turnstile-binding-and-separate-live-email-evidence).

### Progress ledger archive — through PR78

Complete PROGRESS.md from merge69945cc4ecae4593799f7205beedbc82513f9945, moved here on21October2026. These are dated historical checkpoints, not current status or reusable execution authority.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#progress-ledger-archive--through-pr78).

### Batch checkout and durable token cache — 21 October 2026 SGT

PR77 is merged as432300a. Current branch perf/batch-checkout-token-cache consolidates existing checkout owners: total batch D1 target17→11 for2sessions,23→15 for4,35→23 for8; single remains5.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-checkout-and-durable-token-cache--21-october-2026-sgt).

### Five-round-trip reconciliation experiment — 21 October 2026 SGT

Owner confirms PR75 merged and requests reconciliation targeting five D1 round trips for single booking with minimal batch growth. PR76 checkout was retargeted to main and updated to cd00252; its final-head CI39467856039 passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#five-round-trip-reconciliation-experiment--21-october-2026-sgt).

### Five-D1 single checkout integration — 21 October 2026 SGT

PR75 was updated with main at fb0c87c without source-tree changes. Owner authorized integration and CI on21October.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#five-d1-single-checkout-integration--21-october-2026-sgt).

### Batch checkout and reconciliation optimization — 20 October 2026 SGT

PR74 fbbd18c full CI39431684472 passed. Follow-up branch perf/batch-and-confirmation is stacked on it.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-checkout-and-reconciliation-optimization--20-october-2026-sgt).

### Confirmation read consolidation — 20 October 2026 SGT

Integrate the safe local experiment onto main e178bf6 (PR73). Request-local primary snapshots reduce context D1 executions10→4, pending status7→5 and confirmed status5→4; receipt remains5.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-read-consolidation--20-october-2026-sgt).

### Unified pending confirmation presentation — 20 October 2026 SGT

Branch fix/confirmation-pending-layout starts from merged PR72/main2c19288. Owner hometest05 shows protected context followed by pending payment-received status and verified confirmation; request success does not establish browser paint.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#unified-pending-confirmation-presentation--20-october-2026-sgt).

### Confirmation tracing — 20 October 2026 SGT

PR72 head767f760 passed frontend/backend but live-email run39415858902 passed77/78. Offline phone-WebKit trace shows slow cold fixture/browsing setup and preserved original-attempt recovery, then exhaustion of the unchanged30-second budget before reload.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-tracing--20-october-2026-sgt).

### Ten-call checkout implementation — 20 October 2026 SGT

PR70 passed final-head CI and was merged with owner authorization as18ccde0. Active branch perf/checkout-ten-d1 integrates guarded D1 consolidation into the actual single checkout.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#ten-call-checkout-implementation--20-october-2026-sgt).

### PR70 initial receipt versus download gate — 20 October 2026 SGT

Run39394733331 on a51594a passed frontend/backend and74/78 live-email cases. Downloaded logs confirm the same recovery case failed at the blocked initial receipt on all three devices.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr70-initial-receipt-versus-download-gate--20-october-2026-sgt).

### PR70 browser reconciliation-gate correction — 20 October 2026 SGT

Run39391908409 passed frontend/backend and75/78 live-email cases. The same payment-recovery journey failed on all three devices because it deliberately blocked accept-payment but still expected Booking confirmed before releasing that gate.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr70-browser-reconciliation-gate-correction--20-october-2026-sgt).

### Active audit repair — 20 October 2026

Branch fix/confirmation-and-queue-guards from main194cb5f. Implement current-booking confirmation gate, bounded queue admission/recovery priority, and canonical current-rule summaries.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#active-audit-repair--20-october-2026).

### PR69 main integration — 20 October 2026 SGT

PR69 had no CI run because its tracing branch conflicted with main after PR68 merged. Integrate main194cb5f without rewriting branch history: retain batch creation-only behavior inside request-bound tracing, retain both test sets and ordered inventory, and preserve both historical entries.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr69-main-integration--20-october-2026-sgt).

### Checkout phase tracing — 20 October 2026 SGT

Owner requests measurement of the7.6-second single checkout before pursuing3seconds. Separate tracing branch starts from merged PR67/main dc74690; batch optimization PR68 remains independent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-phase-tracing--20-october-2026-sgt).

### Batch checkout creation path — 20 October 2026 SGT

After HAR13 single checkout reached HitPay in7.60seconds, owner stops single optimization and authorizes the same provider strategy for direct batch checkout. Extend the ongoing creation-only path to batch: public token, createBatch, one sequential book per session, closeBatch, validated complete unpaid invoice and one HitPay request.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-checkout-creation-path--20-october-2026-sgt).

### Checkout D1 consolidation — 20 October 2026 SGT

The follow-up reduces isolated warm/cold single checkout from34 to27 D1 executions (HAR12 baseline47). Archive/read grants in one primary batch; pass the committed canonical association/version forward; batch checkout completion with the final authenticated access read.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-d1-consolidation--20-october-2026-sgt).

### Lean single checkout — 20 October 2026 SGT

Owner authorizes SimplyBook settings as the one-studio capacity authority and removes per-checkout admin identity/plan, catalogue, required-field, instructor eligibility and slot reads. Apply first to ongoing direct single checkout; historical split holds and batch preflight remain unchanged for the staged experiment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#lean-single-checkout--20-october-2026-sgt).

### PR66 CI cookie-adapter correction — 20 October 2026 SGT

Run39365196455 on77f06d3 passed frontend/backend and75/78 live-email cases. Only the new identity-warming test failed on all three devices, after its UI/no-effect assertions passed: its direct current-status fetch copied the preview cookie name instead of using the existing adapter that maps it to the real Worker cookie.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr66-ci-cookie-adapter-correction--20-october-2026-sgt).

### Authentication rejection diagnostic follow-up — 20 October 2026 SGT

The60-second admin-token cache already refreshes on the next identity operation after expiry; HAR10 failed during fresh admin-auth, not a missing refresh. Existing logs discarded the exact401/403 distinction.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#authentication-rejection-diagnostic-follow-up--20-october-2026-sgt).

### HAR10 confirmation stability and pre-dispatch authentication failure — 20 October 2026 SGT

Owner HAR10 ran deployed5e9e2d8 after PR65. Its first checkout returned the HitPay handoff in14.8seconds and payment subsequently reconciled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har10-confirmation-stability-and-pre-dispatch-authentication-failure--20-october-2026-sgt).

### Confirmation read timestamp race — 20 October 2026 SGT

PR64 passed all PR gates and owner merged it as c7ee697. Main run39355419233 passed frontend/backend and74/75 live-email cases; tablet WebKit payment recovery timed out and Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-read-timestamp-race--20-october-2026-sgt).

### Independent payment deadlines — 20 October 2026 SGT

HAR09 records a29.1second four-session checkout ending in recovery_required. The saved batch-close evidence confirms four bookings and an unpaid invoice; correlated deployed c08aa04 telemetry proves HitPay creation returned422 JSON.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#independent-payment-deadlines--20-october-2026-sgt).

### Interrupted provider transport recovery — 20 October 2026 SGT

Owner requires errors to be logged and isolated while unrelated customers continue. A06:07:38SGT Cloudflare storage reset during read-only warmDisplay left one unclassified admission unfinished; parallel reads then exhausted the remaining slot.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#interrupted-provider-transport-recovery--20-october-2026-sgt).

### Lost checkout response test ordering — 20 October 2026

PR62 merged as de71b72 after all three PR gates passed. Main run39340832488 passed frontend/backend but failed one of75 live-email cases; Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#lost-checkout-response-test-ordering--20-october-2026).

### PR62 checkout transport verification — 20 October 2026 SGT

Owner explicitly authorizes merging PR62 after all three final-head CI gates pass. Initial head0b5a76c passed frontend/backend and73/75 live-email cases; two desktop Chromium checkout assertions lost response resources after immediate HitPay navigation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr62-checkout-transport-verification--20-october-2026-sgt).

### Batch closure fast path — 20 October 2026 SGT

Owner authorizes validated final batch-close evidence reuse and fewer persistence round trips. Based on main d0c0be8 and bounded read-only evidence from hometest03: intermediate books accumulate1–4 entries without invoice; closeBatch includes four confirmed nested invoice bookings, unpaid state and due_datetime matching later readback.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#batch-closure-fast-path--20-october-2026-sgt).

### Active checkout optimization on PR61

Cache extension checkpoint21000da passed full local code and386 runtime tests; the inventory-order gate failure was identified during the final combined run. Owner now prioritizes deferred comment I/O and returning the saved URL in the authenticated checkout response.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#active-checkout-optimization-on-pr61).

### PR61 extension — persistent display snapshots

Owner authorizes fifteen-minute scheduled warming plus booking-triggered refresh, with eager browser download on site entry. Source implemented and focused persistence/scheduled/failure/checkout-handoff/client/release checks passed; full verify:code passed215 tests plus tooling/types/lint/build/export and 386/386 Worker runtime tests passed; the inventory-order gate failure was subsequently identified and corrected during the final combined run; final-head CI pending.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr61-extension--persistent-display-snapshots).

### Browsing-loading successor — 19 October 2026 SGT

Baseline main d15caba; branch fix/browsing-loading-cache. Fix explicit local display loading and stable guest feedback; serve valid public calendar/catalogue cache hits before provider queue; start short catalogue prefetch before month work.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#browsing-loading-successor--19-october-2026-sgt).

### PR60 streamed Review restoration race — 19 October 2026 SGT

Headbe08170 passed frontend/backend; live-email passed74/75. Tablet WebKit exposed a mount-order race: restoration finished before Review mounted, so the default browsing flag launched calendar/catalogue reads.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr60-streamed-review-restoration-race--19-october-2026-sgt).

### PR60 final request-count correction — 19 October 2026 SGT

Head13650ab frontend/backend passed; live-email passed72/75. The three device failures reached a second stale availability-count assertion after checkout return: expected1 instead of the agreed0.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr60-final-request-count-correction--19-october-2026-sgt).

### PR60 live-email follow-up — 19 October 2026 SGT

Head580f6aa passed frontend and backend including75/75 browser cases each and383 Worker tests. Live-email passed66/75: extra catalogue prefetch on restored editable Review (reproduced in component test), revoked access now correctly enters protected denied UI instead of the old Details alert, and an expiry alert selector also matched the framework route announcer.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pr60-live-email-follow-up--19-october-2026-sgt).

### Active PR60 implementation — 19 October 2026 SGT

Working branch fix/confirmation-return-loading, starting headf03049e; main0fd2c6e. Run39209839579 failed browser gates; underlying Worker checks passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#active-pr60-implementation--19-october-2026-sgt).

### Editable Review, combined checkout and compact confirmation — 19 October 2026 SGT

Owner supersedes creation-during-Review and queued provider edits: Details runs fresh read-only availability checks, then opens editable Review without creating a customer, booking or payment. Changed details reset consent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#editable-review-combined-checkout-and-compact-confirmation--19-october-2026-sgt).

### HAR08 confirmation continuity and record reconciliation — 19 October 2026 SGT

Owner reports successful checkout and asks for pending do-not-refresh guidance, removal of repeated confirmation loading, and read-only record reconciliation. HAR08 shows customerConfirmation in a pending response, followed by confirmed without that snapshot; the hook discarded the proof while the611ms receipt request completed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har08-confirmation-continuity-and-record-reconciliation--19-october-2026-sgt).

### Email-code browser interaction repair — 19 October 2026 SGT

Final-policy CI39200175005 frontend passed74/75 browser cases. Tablet WebKit filled the code while main was still inert during the loading transition; the trace retained an empty input, so native required validation prevented the expected incorrect-code response.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#email-code-browser-interaction-repair--19-october-2026-sgt).

### Fifteen-minute hold and eight-minute payment policy — 19 October 2026 SGT

Owner authorizes adding this policy to PR59 and merging only after final-commit required CI passes. Owner reports SimplyBook's timeout changed to15minutes; provider behavior is not independently verified.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#fifteen-minute-hold-and-eight-minute-payment-policy--19-october-2026-sgt).

### Completed-dismissal CI setup repair — 19 October 2026 SGT

Merged-main50656c9 CI39198249437 passed74/75 live-email cases; phone WebKit timed out before reaching dismissal. Trace shows about22seconds spent creating the synthetic hold/payment before navigation, then waiting for fully reconciled confirmation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#completed-dismissal-ci-setup-repair--19-october-2026-sgt).

### Bounded pre-creation concurrency — 19 October 2026 SGT

Owner authorizes concurrency after HAR06/07 analysis: booking response arrived11.19/11.33seconds after coordinator start, while first Review-eligible browser response improved14.51→13.64seconds and full hold worsened15.73→16.68seconds. Implement within one serialized booking job: overlap public/admin authentication for ongoing customers; run required-fields, eligibility and availability through two drained read lanes after fresh catalogue; overlap validated local attempt persistence with provider identity preparation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#bounded-pre-creation-concurrency--19-october-2026-sgt).

### HAR07 payment transport investigation — 19 October 2026 SGT

Owner HAR07 at11:38SGT shows hold200 in16.678seconds, first verifying reply beginning13.295seconds after hold dispatch, then HitPay preparation503 hitpay_transport_unknown in3.262seconds. No checkout URL reached the browser.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har07-payment-transport-investigation--19-october-2026-sgt).

### Shared checkout expiry and payment-first confirmation — 19 October 2026 SGT

Owner authorizes implementing a five-minute payment deadline from successful booking creation, expiry return to calendar with contact retained, customer confirmation after verified matching HitPay payment, download-only waiting for reconciliation, and CI repair. This supersedes the earlier requirement to hide all success/actions until SimplyBook accounting finishes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#shared-checkout-expiry-and-payment-first-confirmation--19-october-2026-sgt).

### Pending task: controlled coordinator concurrency — 19 October 2026 SGT

**Pending; start after single-booking checkout is stable.** Review latest main, then implement [controlled account-coordinator concurrency](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pending-controlled-account-coordinator-concurrency--19-october-2026-sgt). Browsing/provider work may overlap within shared limits, valid cache hits avoid slow work, booking writes initially stay serialized, and reconciliation must not starve.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#pending-task-controlled-coordinator-concurrency--19-october-2026-sgt).

### Creation-first optimistic Review clarification — 19 October 2026 SGT

Owner clarifies that Review should appear after booking creation, with comments/readback continuing while payment stays disabled. Earlier source waited for comment acknowledgement.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#creation-first-optimistic-review-clarification--19-october-2026-sgt).

### Checkout handoff repair — 19 October 2026 SGT

HAR06 is parsed: successful hold/payment preparation, available sandbox checkout URL, aborted first context request, then pending confirmation polling without captured external navigation. Retained Details-rendered Review was missing from BookingPage's handoff guard; its cleanup aborted the redirect owner.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-handoff-repair--19-october-2026-sgt).

### Mandatory test-impact pass — 19 October 2026

Owner requires one complete test-impact review after every logical change and repair. Follow AGENTS Verify and the [Service Contracts procedure](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/docs/SERVICE_CONTRACTS.md#mandatory-test-impact-pass-after-every-change--19-october-2026), including all duplicated setup/response waits and final exact-commit CI.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#mandatory-test-impact-pass--19-october-2026).

### One-month browser expectation repair — 19 October 2026 SGT

CI39176339093 on3a34e2a passed frontend/backend, but live-email passed69/72: the same native guest journey timed out on all three engines. Its separate warmedMonths setup still waited for four responses, then asserted four calendar calls twice.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#one-month-browser-expectation-repair--19-october-2026-sgt).

### One-month calendar preload — 19 October 2026 SGT

Owner reduces eager calendar loading from four months to the displayed month only. Homepage preloads the current Singapore calendar month; another month is fetched only when opened.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#one-month-calendar-preload--19-october-2026-sgt).

### Final single-booking optimization pass — 19 October 2026 SGT

CatalogueReads overlaps the independent service/instructor reads only for ongoing customer access under the existing ProviderSession and serialized admission owner. The initial full runtime run exposed three finite-path rate rejections; finite/historical reads retain their original sequential dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#final-single-booking-optimization-pass--19-october-2026-sgt).

### Review continuity, pending confirmation and immediate home — 19 October 2026 SGT

Additional owner requests: preferred communication has Email as its default with exactly Email, Call (existing phone identifier), SMS and WhatsApp; remove the placeholder and retain stored preferences. The shared method catalogue also supplies SimplyBook comment labels.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#review-continuity-pending-confirmation-and-immediate-home--19-october-2026-sgt).

### Comment milestone and D1 latency pass — 19 October 2026 SGT

Source baseline origin/main40e735e (PR54); isolated branch perf/review-comment-milestone. Single-booking Review now qualifies from its matched acknowledged comment before association persistence, with payment still gated by all completed hold checks.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#comment-milestone-and-d1-latency-pass--19-october-2026-sgt).

### Latest05 Review transition repair — 19 October 2026 SGT

Owner HAR latest05 records a14.112s combined hold; first verifying reply is visible about12.75s after dispatch, leaving only about1.36s before completion. Main/deployed baseline836a5c4 is confirmed by the preceding successful PR53/main deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest05-review-transition-repair--19-october-2026-sgt).

### Single-booking verification latency and reference clarity — 19 October 2026 SGT

PR51 merged as abad20d and PR52 as 692cf92 after their exact PR gates passed. PR51's subsequent main run39149518497 failed one tablet live-email dismissal-retry case (53/54); frontend/backend passed and Cloudflare deployment was skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#single-booking-verification-latency-and-reference-clarity--19-october-2026-sgt).

### Latest04 UI and combined batch follow-up — 19 October 2026 SGT

Owner requests contact-action spacing, more prominent signed-in email, navy Book now hover text, an on-demand studio location popup, and removal of duplicate batch checks before an owner-operated two-browser conflict test. Branch feat/batch-preflight-location-ui builds on PR51's browser failures repair (4fc8ce3); do not confuse that pending parent PR with main.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest04-ui-and-combined-batch-follow-up--19-october-2026-sgt).

### Independent checking-window regression — 19 October 2026 SGT

The repaired dismissal journey passes all3 devices on4fc8ce3. Two tablet cases timed out when combining full guest selection, uncertain holding, reload and checking-window exhaustion.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#independent-checking-window-regression--19-october-2026-sgt).

### Browser failure coverage expansion — 18 October 2026

The owner explicitly requires browser regression coverage for error handling, not only mechanism tests. The legacy suite remains23 scenarios across3 devices (69 runs).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#browser-failure-coverage-expansion--18-october-2026).

### Combined Details-to-Review hold — 18 October 2026

Owner authorizes one request with one authoritative single-session prebooking validation. Branch `perf/combined-booking-hold` starts from owner-merged PR49/main87fde3c.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#combined-details-to-review-hold--18-october-2026).

### Latest03 immediate rebooking — 18 October 2026

Current branch `fix/returning-session-rebooking` starts from refreshed merged main d89ad5e (PR48). Latest03 shows successful email verification/contact reads, valid catalogue responses and a13.031s completed-attempt dismissal before navigation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest03-immediate-rebooking--18-october-2026).

### Latest02 performance and email access — 18 October 2026

Branch `perf/payment-recovery-wakeup` starts from refreshed main45ec58c. Source adds durable webhook-triggered payment recovery, coordinator recovery D1 timing and the ongoing contact authority repair.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest02-performance-and-email-access--18-october-2026).

### Checkout authority optimization — 18 October 2026

Branch `perf/checkout-authority` starts from refreshed main9a15cae. Consolidate repeated forward checkout grant reads while preserving entry/response authentication, write-boundary grants, atomic dispatch/effect claims, cleanup and payment recovery.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-authority-optimization--18-october-2026).

### Booking presentation repair and measured latency — 17 October 2026

Owner HAR-fixed-01 reached hold200, payment handoff200 and eventual confirmation/receipt200 on deployed PR39 source b9f2b51. Measured preparation7.8seconds plus hold21.1seconds remains too long for the owner.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#booking-presentation-repair-and-measured-latency--17-october-2026).

### Migration process and testing requirements documentation — 16 October 2026

Owner requests a separate documentation-only PR for the next client migration: per-environment secret configuration, saved-versus-active deployment verification, legacy recovery/receipt continuity, actual application-API browser tests, isolated code mutation and side-effect tests, and measured latency/performance acceptance. Rules and Architecture and Service Contracts own the requirements; Journey records the decision.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-process-and-testing-requirements-documentation--16-october-2026).

### Migration sweep: remove old-account session preload — 16 October 2026

The owner-requested final pass found the experimental NativeSessionInit frame still loading soccerbotstudiosg on every live booking selection. Direct HitPay checkout does not use that native hosted-session experiment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-sweep-remove-old-account-session-preload--16-october-2026).

### Migration version activated — 16 October 2026

Owner explicitly authorized activation. Deployment ad3432df-b58f-4c74-b1a6-d5db7fb6729a activated saved version140 c2a562d1-3469-4b5c-8ecc-cd22837377f4 at17:29:45SGT,100% traffic.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-version-activated--16-october-2026).

### Deployed provider mismatch — 16 October 2026

Ordinary curl through the supported managed network returns HTTP200 for Worker health, catalogue and October calendar; the earlier Python HTTP403/1010 is client-dependent evidence, not general Cloudflare unreachability. Health still identifies source be9982b3 and version f2400190-6db5-4436-8c74-16371055b117.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#deployed-provider-mismatch--16-october-2026).

### First new-account acceptance preparation — 16 October 2026

Owner requests verification and readiness for one first acceptance test, confirms local HitPay connectivity, treats old test records as noncritical, confirms new-account checklist settings complete and webhook unchanged. Keep old rows intact; original-scope application receipt continuity is outside this new-account acceptance scope.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#first-new-account-acceptance-preparation--16-october-2026).

### Environment readiness and owner confirmations — 16 October 2026

Owner reports latest environment changes installed, confirms migration checklist item3 complete (new-account signing/settings/schedules), and confirms item4 webhook configuration remains unchanged. Record these as owner confirmations, separate from independently observed provider evidence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#environment-readiness-and-owner-confirmations--16-october-2026).

### Migration verification and booking queue review — 16 October 2026

Fresh GitHub main and Cloudflare SOURCE_REVISION both remain be9982b3b0420db88907ecb727d049cd87a86ee4. Preserve the clean historical checkout at 897cbfe; current local work is on fix/migration-booking-check-review in /workspace/work/soccerbot-migration.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#migration-verification-and-booking-queue-review--16-october-2026).

### Opening hours, four-hour lead and observed HitPay host — 16 October 2026

PR37 is merged in remote main9d9e273. New branch applies the owner-approved noon–20:00 SGT opening window,240-minute lead and exact checkout.sandbox.hit-pay.com allowance established by local read-only evidence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#opening-hours-four-hour-lead-and-observed-hitpay-host--16-october-2026).

### HAR06 checkout latency and payment diagnostics — 16 October 2026

Owner HAR06 and redacted Worker/D1 evidence establish booking49/invoice40 created successfully at11:38SGT, with confirmed booking flags and an unpaid invoice. Details-to-Review took about53seconds: roughly20seconds queued behind background month work,5seconds for the browser-triggered fresh day read,6seconds for preparation (another fresh read), and21seconds for holding creation/readback (19 provider calls).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#har06-checkout-latency-and-payment-diagnostics--16-october-2026).

### Sandbox deployment and recovery correction — 16 October 2026

Owner requests durable sandbox settings, automatic calendar return for confirmed reservation conflicts, and webhook recovery from recoverable manual review. Main dd3c31b passed all three CI gates and deployed, but the generated live artifact inherited native/disabled payment defaults and omitted five sandbox settings.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#sandbox-deployment-and-recovery-correction--16-october-2026).

### Hold-state experiment evidence — 16 October 2026

Owner authorizes narrow diagnostic capture before the next physical hold experiment. Deployed4e98eae retained structural errors and identifiers but not rejected status values.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#hold-state-experiment-evidence--16-october-2026).

### Complete sandbox configuration readback — 16 October 2026

Owner requested a full configuration check, which exposed five missing bindings beyond the previously restored route/enablement flags. Owner then authorized setting them.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#complete-sandbox-configuration-readback--16-october-2026).

### Calendar return and local reconciliation — 16 October 2026

Owner verified24October09:00 is correctly unavailable; that report is withdrawn. A separate frontend pause survives successful fresh validation followed by preparation failure, leaving Back-to-calendar loading until a selection edit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#calendar-return-and-local-reconciliation--16-october-2026).

### Stable guest option and HAR04/05 — 16 October 2026

PR34 is owner-merged as4e98eae after all three PR gates passed in38828870612. Owner reports guest-button movement when saved identity restores.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#stable-guest-option-and-har0405--16-october-2026).

### Confirmation restoration race exposed by mechanism tests — 16 October 2026

CI38823092566 reaches real holding/payment on all browser projects. Paid return passes on phone/tablet, while desktop receives confirmed200 then remains Checking: initial BookingProvider hydration/restoration changes the revision and cancels that protected read before a second request is throttled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#confirmation-restoration-race-exposed-by-mechanism-tests--16-october-2026).

### Test reliability audit — 16 October 2026

Reviewed the inventory of50 test files (24 frontend/unit,10 Worker,3 browser,13 tooling/installer) for clock dependence, fixture coupling, weak assertions, isolation and mocked boundaries. PR34 fixes the weekday clock failure.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#test-reliability-audit--16-october-2026).

### Deterministic booking test clock — 16 October 2026

PR33 merged6a88134; main run38816624792 frontend failed two real-clock tomorrow fixtures at Singapore midnight (expected8800, correct Saturday price10800). Pin the test Date clock to a known weekday without changing product pricing or receipt assertions.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#deterministic-booking-test-clock--16-october-2026).

### Holding HTTP boundary repair — 15 October 2026

Baseline deployed40cca80, branch fix/allow-booking-hold-request. HAR03 and bounded backend evidence identify a missing hold=1 query allowance before authentication/provider dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#holding-http-boundary-repair--15-october-2026).

### Review booking owner-test repair — 15 October 2026

Current branch fix/review-hold-continuation starts from deployed main1971d26. HAR and D1 establish preparation without holding/payment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#review-booking-owner-test-repair--15-october-2026).

### Direct hosted HitPay implementation resumed — 15 October 2026

Worktree /workspace/work/direct-hitpay, branch feat/direct-hitpay-sandbox, refreshed main baseline49eed77f10811c8787596b1ca44a49dfb50c889c. Source implementation now includes direct hosted navigation, Details-stage fresh selection validation, additive0029 payment provenance, independent HitPay ingress/retrieval, one-shot external SimplyBook finalisation and bounded financial recovery.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#direct-hosted-hitpay-implementation-resumed--15-october-2026).

### Durable Object read optimization and Turnstile layout — 14 October 2026

Current baseline is deployed f268988. Additive admission indexes and a populated-object runtime regression are implemented; focused regression and Worker types/source checks passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#durable-object-read-optimization-and-turnstile-layout--14-october-2026).

### Preparing one checkout-opening diagnostic — 13 October 2026

Source-only0025 raises native grant schema cap624→688; carried618 otherwise cannot satisfy availability admission. Focused extended-grant runtime test passed; full checks/CI/artifact and a new executor remain in progress.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preparing-one-checkout-opening-diagnostic--13-october-2026).

### Owner settings evidence received — 13 October 2026

Homepage loads; SBPay PRO on free trial; Take Me Back Home enabled with no settings available to owner. General homepage failure/disabled PRO are not supported causes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-settings-evidence-received--13-october-2026).

### Read-only native settings checked; owner browser results pending — 13 October 2026

Connected SimplyBook identity matches the developer binding. Accept Payments enabled/configured; Client Login off; Take Me Back Home on.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#read-only-native-settings-checked-owner-browser-results-pending--13-october-2026).

### Checkout diagnosis: endpoint and handoff match; native error unresolved — 13 October 2026

Confirmed exact handoff/retained URL equality, invoice31 association and failure before the original submission/checkout deadlines and access closure. Official documentation matches our payment-link endpoint.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkout-diagnosis-endpoint-and-handoff-match-native-error-unresolved--13-october-2026).

### Owner checkout 404; test stopped and independently closed — 13 October 2026

Packet301173108ab6 created booking40 and exact unpaid invoice31, SGD88, for Nabil3/service2 on15October15:40 Singapore. Both callback subscriptions were active and the protected checkout handoff passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-checkout-404-test-stopped-and-independently-closed--13-october-2026).

### Owner payment packet preparation continues — 13 October 2026

Merchant verification will occur on the owner checkout before payment, as requested. Application preparation adds explicit704 budget support and refreshes release metadata; current live640 remains closed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-payment-packet-preparation-continues--13-october-2026).

### Payment test preparation, access still closed — 13 October 2026

Owner readiness is confirmed for one proposed native payment test. YS confirms Sandbox mode and tentatively names app404; actual merchant display identity remains to be checked in the owner browser.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#payment-test-preparation-access-still-closed--13-october-2026).

### Paired control source prepared — 13 October 2026

The next experiment uses fixed booking/invoice callback routes with independent finite windows, caps and deduplication. Each subscription keeps its one-use grant and exact baseline checks; remove invoice first, then booking, preserving prior subscriptions.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paired-control-source-prepared--13-october-2026).

### Webhook investigation: verify the event prerequisite — 13 October 2026

No callback was recorded through 10:44:54 Singapore. The exact destination and active `new_booking` registration were verified before booking 38; current Cloudflare reads report Access not enabled and the public Worker address enabled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#webhook-investigation-verify-the-event-prerequisite--13-october-2026).

### Live DELETE fix passed; signed delivery not observed — 13 October 2026

Packet7ec56094976f created confirmed booking38 and exact unpaid invoice29, SGD88, with Nabil on15October15:40 Singapore. The checkout link remains unopened.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#live-delete-fix-passed-signed-delivery-not-observed--13-october-2026).

### Active subscription baseline restored — 13 October 2026

Approved read-only packet1089bf8b452a returned an empty active-subscription array without repeating DELETE. The original empty active baseline is restored; this does not establish permanent deletion of inactive provider records or webhook delivery acceptance.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#active-subscription-baseline-restored--13-october-2026).

### Latest live result: DELETE unknown, test stopped — 13 October 2026

Approved packet10c62a001eea passed actual string-flag and unique subscription identity checks, then dispatched DELETE once and stopped on `provider_representation_unknown`. No new live booking/subscription test started.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest-live-result-delete-unknown-test-stopped--13-october-2026).

### Current source repair — 13 October 2026

YS requested the subscription parser fix. Exact string"0"/"1" and numeric0/1 are now accepted; unknown flags remain rejected with private field codes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-source-repair--13-october-2026).

### Latest result: subscription diagnostic closed — 13 October 2026

Approved packet46b93ebc17fa7 observed a string `is_active`, rejected by the numeric-only subscription validator. Its exact value and subscription identity remain unproven.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#latest-result-subscription-diagnostic-closed--13-october-2026).

### Webhook flight stopped; access closed, subscription unresolved — 13 October 2026

Packet `b918a81d06e991549f9d67e449098bf87e8109bc9ea6affc98d69d7773d06a99` executed once under the approved campaign on source `f2e0a3e91824f569a161f29447471d5081259719`. All three gates passed in CI38313369930; artifact11776470322/SHA256 `ed0207005a4ce1a38bc3f8c9302e05895be968d9afbeddf40a05d5725c3d1e14` matched150 sealed files and273 strict Worker tests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#webhook-flight-stopped-access-closed-subscription-unresolved--13-october-2026).

### Approved technical payment/webhook campaign — 13 October 2026

Current subscription increment: all273 Worker runtime tests passed with zero failures/skips and no external provider calls; generated types, source/policy guards, affected lint and checker regressions passed. The packaged release now verifies preservation through pending0022/0023.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-technical-paymentwebhook-campaign--13-october-2026).

### Payment/webhook source increment — 13 October 2026

PR21 merged at `383cc2e70d952f2a37377046ccfd226c0e2a403e` after explicit owner approval. Independent main CI `38276366243` passed frontend, backend, live-email and Pages demo publication.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#paymentwebhook-source-increment--13-october-2026).

### Developer native booking accepted and independently closed — 13 October 2026

Packet `217dfd4e4df2` executed once after YS approved the exact packet and amended resource limits. Source `8bd66c1` passed all three CI gates in run `38273011816`; artifact `11758121123` matched 148 sealed files, 257 Worker tests and all 21 immutable migrations.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#developer-native-booking-accepted-and-independently-closed--13-october-2026).

### Owner roster and instructor priority — 12 October 2026

YS supplied the October 2026 roster and explicitly set instructor priority **Faisal → Caelan → Nabil** when multiple instructors are available. Apply priority only among instructors eligible and freshly available for the entire selected session; do not replace an unavailable preferred instructor with an unverified one.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#owner-roster-and-instructor-priority--12-october-2026).

### Approved setup inspection completed and closed — 12 October 2026

Independent closure at 23:21:46 Singapore verified source `3af1323` / version `bd48335e-de9b-4b11-b0ba-b6ed5267f2f5`: Worker and coordinator matched, provider and identity access disabled, end 0, 387/512 calls with active 0 and 16 recovery calls untouched. Both new capabilities expired and returned 401; schedules remain empty; all 18 historical table snapshots and 21 applied migrations are preserved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-setup-inspection-completed-and-closed--12-october-2026).

### Full native acceptance execution resumed — 12 October2026

YS instructed “execute it now” against the consolidated full native acceptance draft. Continue technical implementation, evidence-backed discovery preparation, tests and PR21 publication.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#full-native-acceptance-execution-resumed--12-october2026).

### Native campaign stopped on actual date availability — 12 October2026

Sealed packet3f6019db7880 ran sourcee122ba5 after all-three CI38236452119/artifact11740802365 passed. The authenticated15–29October calendar returned14 start times on15October and no other offered date.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-campaign-stopped-on-actual-date-availability--12-october2026).

### Actual calendar discovery before the final native gate — 12 October2026

Current actual campaign totals:373 provider,128 management,57 direct Worker,12 deployments;4 flights/3 actual attempts,5 conservative book allowances,1 consumed migration. One actual attempt remains, with original512 total/16 recovery and20:30Singapore deadline.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#actual-calendar-discovery-before-the-final-native-gate--12-october2026).

### Native single proof accepted and closed — 12 October2026

Flight4 consumed packet50e2a1263ac7 on24153c3, all-three CI38232933900/artifact11740055253. single proof at15 October 14:00Singapore: bookings35, invoice27, 1 signed confirmed booking reads, authoritative unpaid invoice, SGD88/tax0 and one native link retained unopened. Attempt375bbc00-297f-43fd-9671-2b0961aa5979 is observed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-single-proof-accepted-and-closed--12-october2026).

### Availability-only stop and actual-attempt accounting — 12 October2026

Flight3 consumed packet8e6824f42e2b on ee2853a (all-three CI38230887077/artifact11739086074).16October returned zero offers. The grant cache and request ledger prove no prepare/native POST, no attempt and no booking dispatch.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#availability-only-stop-and-actual-attempt-accounting--12-october2026).

### Native campaign flight2 accepted same-date; independently closed — 12 October2026

Source6ac6165 passed all three CI38229148061 gates. Artifact11737163517 verified148 sealed files/exact tree/246 Worker tests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-campaign-flight2-accepted-same-date-independently-closed--12-october2026).

### Native campaign flight1 closed; batch closure phase isolated — 12 October2026

Sealed dea4fe21baae executed sourcea206106 from all-green CI38226503628/artifact11736683975 (148 sealed files,244 Worker cases). Applied0021 with preservation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-campaign-flight1-closed-batch-closure-phase-isolated--12-october2026).

### Current task — complete native-booking acceptance, 12 October2026

YS requests a fixed North Star and continued execution until accepted. Rechecked clean local/remote b582a46 on draft PR21 and successful final CI38224131965.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--complete-native-booking-acceptance-12-october2026).

### 256 trial executed; second receipt cardinality failure — 12 October2026

Exact approved packet c0916326b895 executed once on6bc54f7 after all three CI38222064282 gates and artifact11735290126 verification. Applied0020 with preservation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#256-trial-executed-second-receipt-cardinality-failure--12-october2026).

### Approved live-test amendment preparation — 12 October2026

YS requested a live test and explicitly approved cumulative256 with196 carried/16 reserved and deadline17:30Singapore today. Corrected source3e3628d passed all three CI38220464328 gates.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-live-test-amendment-preparation--12-october2026).

### Current task — synthetic batch-membership experiment, 12 October2026

YS asked to start an experiment. Rechecked clean6759773/remote PR21 and the closed196/224 ledger evidence.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--synthetic-batch-membership-experiment-12-october2026).

### Current task — follow-up experiment identified missing batch echo, 12 October2026

Approved packet a14dfea95559 executed exact4671f37 from all-green CI38217379501/artifact11732905946. Migration0019 applied and independently preserved all historical rows/foreign keys;0001–0019 immutable, none pending.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--follow-up-experiment-identified-missing-batch-echo-12-october2026).

### Next finite experiment prepared — 12 October2026

Preparing the owner-requested next experiment using the corrected intermediate validator. Final prior source d21e2b8 passed all three CI38216192722 gates.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#next-finite-experiment-prepared--12-october2026).

### Current task — live field identified and correction prepared, 12 October2026

Approved packet5a170ff0 executed on tested47b37db (all three CI38213290654 gates; artifact11729658054). First book returned a five-field object and failed creation.booking.require_payment/missing, meaning absent or null.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--live-field-identified-and-correction-prepared-12-october2026).

### Current task — intermediate contract audit and finite proof preparation, 12 October2026

Compared every consumed creation field with official public docs/examples and staff guidance. Public example is recurring, so current multiple-booking batch_id echo, batch/client hash details and intermediate end representation remain unresolved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--intermediate-contract-audit-and-finite-proof-preparation-12-october2026).

### Current task — creation-envelope evidence after the successful read, 12 October 2026

Approved packet120046b5 executed and closed from tested8ac2227. The single retained-booking read passed all13 independent predicates, including50-minute occupied end, with40+10 service/buffer and confirmed status.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-task--creation-envelope-evidence-after-the-successful-read-12-october-2026).

### Historical checkpoint — inspect the retained booking format, 12 October 2026

Owner requested an actual existing-record read instead of guessed provider semantics. Read-only source is prepared: explicit one-use inspect mode, one exact retained key, shared independent predicates, no invoice/cancel/finalize/write, no scheduler/replay and no attempt/effect mutation.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--inspect-the-retained-booking-format-12-october-2026).

### Historical checkpoint — precise native diagnostics, 12 October 2026

Owner requested specific private validation errors and evidence-based diagnosis before another booking trial. Continued draft PR21 from5dacab5 on feat/native-checkout-completion-20261011; main25aac892 is unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--precise-native-diagnostics-12-october-2026).

### Historical checkpoint — approved192 checkout-proof preparation, 12 October2026

Owner approved preparation only: carry90 used toward192, reserve16, at most102 further provider calls (86 ordinary). Existing128 policy cannot start availability with22 ordinary calls because32 must remain for checkout.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--approved192-checkout-proof-preparation-12-october2026).

### Historical checkpoint — correct the cart lifecycle, 12 October 2026

Residual-only recovery is closed and booking/cart unchanged. The owner corrected our premature expectation of an invoice for an unfinished cart.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--correct-the-cart-lifecycle-12-october-2026).

### Historical checkpoint — existing residual recovery, 12 October 2026

The corrected identity proof is closed with one retained native booking and no verified link or cancellation. Native booking is not settled.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--existing-residual-recovery-12-october-2026).

### Preview failure reporting during identity-fix CI — 12 October 2026

The corrected identity source passed backend and live-email CI, including224 Worker cases and their browser/release gates. Frontend passed68/69 browser cases; one tablet synthetic checkout received HTML404 instead of200.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preview-failure-reporting-during-identity-fix-ci--12-october-2026).

### Historical checkpoint — identity refresh across native reads, 12 October 2026

The approved idle procedure passed exact baseline/activation/closure readiness. Native checkout reached a distinct retained failure: provider_identity_expired on sessionIndex1, catalogue-instructors, before booking.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--identity-refresh-across-native-reads-12-october-2026).

### Historical checkpoint — test coordinator idle-lifecycle activation, 12 October 2026

The protected-readiness proof isolated an actual mismatch: active Worker, same-source coordinator still on the preceding closed configuration. Four observations exhausted the packet's readiness bound before creating native authority or making any provider request.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--test-coordinator-idle-lifecycle-activation-12-october-2026).

### Historical checkpoint — coordinator readiness and private window diagnosis, 12 October 2026

The exact approved128 proof executed and closed. Migration0017 preserved all existing rows; availability stopped at customer-window admission before any provider call, attempt or booking.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--coordinator-readiness-and-private-window-diagnosis-12-october-2026).

### Historical checkpoint — exact128-call continuation preparation, 12 October 2026

YS approved preparing a finite128-call cumulative policy, carrying33 used and reserving16 for recovery; no live action is approved. Source keeps the same campaign and persistent coordinator ledger.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--exact128-call-continuation-preparation-12-october-2026).

### Historical checkpoint — preserve private prerequisite evidence, 12 October 2026

The finite native checkout's prerequisite failure previously discarded its cause. Source now retains bounded private stage/code/operation/representation evidence in the existing grant result while preserving the customer response and one-use behavior.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--preserve-private-prerequisite-evidence-12-october-2026).

### Historical checkpoint — native HTTP/RPC diagnosis after verified closure, 12 October 2026

Approved signing amendment is executed and explicitly closed. Encrypted signing binding installed;0015/0016 applied and immutable.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--native-httprpc-diagnosis-after-verified-closure-12-october-2026).

### Historical checkpoint — missing deployed signing binding, 12 October 2026

Approved native backend proof stopped after two read-only management requests: required signing binding absent from the developer Worker. No migration, deployment, activation, provider request, booking, checkout link, cancellation, payment or notification occurred.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--missing-deployed-signing-binding-12-october-2026).

### Historical checkpoint — native failure-path closure, 11 October 2026

Continuation on PR21/feat/native-checkout-completion-20261011 from5e89220, actual main25aac892 unchanged. Implemented pre-validation reference retention, durable post-booking handoff recovery, strict known-reference compensation and default-denied finite cleanup permission in source-only0016.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--native-failure-path-closure-11-october-2026).

### 11 October — protected native customer flow

The existing customer journey now carries native service/provider IDs and current names/prices from catalogue and bounded date availability through players, Details, Review, immutable preparation and the one-use native checkout. Submitted slots must match server-retained offers; the Worker still rechecks the entire cart and each write.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#11-october--protected-native-customer-flow).

### 11 October — native checkout implementation and owner configuration confirmation

Owner confirmed developer tax0/S$88 final,40+10minutes and Client Login off. Source now has scoped declaration-based prebooking, fresh guest/native-client separation, single and multi-session native booking/invoice validation, no-replay effects, lost-finalization known-ID recovery and a one-use protected checkout route.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#11-october--native-checkout-implementation-and-owner-configuration-confirmation).

### Metadata discovery accepted and closed — 11 October 2026

YS approved packet SHA256 `e535f54372e47d6cde632f8b643b91dd669cb90eade2efbcdc9c50343831321a` in this session. Executed10:07:35–10:09:04UTC (18:07:35–18:09:04SGT),89.318 seconds within the20-minute limit.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#metadata-discovery-accepted-and-closed--11-october-2026).

### Current direction — technical integration before combined testing

YS now wants native booking and webhook/reconciliation technical work settled first, then one combined physical acceptance flight. Native source increment remains in PR21; Service Contracts contains the complete webhook execution brief with explicit delivery/signature/acknowledgement/idempotency/reconciliation/fallback/negative-test and closure gates.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#current-direction--technical-integration-before-combined-testing).

### Native booking completion task — six deliverables, 11 October 2026

Outcome: complete the supported customer booking path before treating native checkout or later webhooks as accepted. Owner-approved policies above remain unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-booking-completion-task--six-deliverables-11-october-2026).

### Previous task — native one-studio policy and North Star execution, 11 October 2026

Every booking automatically attempts a Comments entry `Number of players: N` (default1, range1–4). When the optional fifth Details field is filled, append `School / organisation: VALUE` on the next line; omit that line when blank.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#previous-task--native-one-studio-policy-and-north-star-execution-11-october-2026).

### Previous checkpoint — website-confirmed contact profile, 11 October 2026

YS explicitly replaced SimplyBook-only prefill with latest website-confirmed name/phone. One profile per normalized verified email/account/origin, shared by users of that email; saving only with Remember me selected at form submission, existing booking history untouched.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#previous-checkpoint--website-confirmed-contact-profile-11-october-2026).

### Previous checkpoint — North Star planning package, 11 October 2026

YS approved execution of the full North Star plan. Refreshed main `298c9c8f443063f8b21a2e7b006993a1ec76a9e7` contains owner-merged PR19; independent main CI38112617043 passed frontend/backend/live-email and Pages demo deployment.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#previous-checkpoint--north-star-planning-package-11-october-2026).

### Historical checkpoint — PR19 identity proof closed, 10 October 2026

Owner approved exact packet SHA256 `29eaa053cf5f251744aea5accbcf4fff121de90b6906b32b70d04fd3cb785148` and confirmed readiness. Executed sealed source `4a10133a001e1c1a4552e120a3d91b3c875bc664`, CI38045722099 (all three jobs passed), live artifact11667384145/ZIP SHA256 `8de0df981805a6f1f5aa81f0e0e14194182bd9740d649e820dcbaf08b2b23790`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoint--pr19-identity-proof-closed-10-october-2026).

### Replacement email test closed — 10 October 2026

Deployed sourcef2795a1ef9c54e06ac2335f824a59e20c3b17f5e passed all three CI38036772168 jobs. Artifact11663527637/SHA2569bfc92f07ce78b73ab63d4d08c0d136f7b3cc6c57aab70bb05714f3119c06254,139 sealed files and12 migration byte identities verified;17 exact compiled-Worker cases passed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#replacement-email-test-closed--10-october-2026).

### Historical checkpoints — superseded by the current ledger

### Unused email window replacement — 10 October 2026

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-checkpoints--superseded-by-the-current-ledger).

### Email execution preparation — 10 October 2026

PR17 remains draft/open. Pinned deployment candidate is source `087576edbebe90bc60097d8655d6f758d91ab722`, successful CI37943447592, live artifact11622777711, ZIP SHA256 `14d31042f96a44f4b1d1124a1aa1104f84086ba8141de6a7e030bb60ab8e287c`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#email-execution-preparation--10-october-2026).

### Live-email preparation continuation — 9 October 2026

Recovered exact PR16 `d8180f82e9556e9640227edd76c58d72e33b1b4b` / tree `85f4f011f65f883c5bb75921320c3a359645443b`; GitHub still reports draft/open/unmerged. New branch `feat/live-email-candidate-20261009` is stacked on it.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#live-email-preparation-continuation--9-october-2026).

### Resend composition continuation — 9 October 2026

Recovered PR14 source5673e79 and PR15 sourcea43ffb8, both draft/open/unmerged. Independently re-read both required successful CI jobs37909399171/37909424450.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#resend-composition-continuation--9-october-2026).

### Main integration campaign — active 9 October 2026

Governing instruction: MAIN INTEGRATION NORTH STAR, supplied9October. One agent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#main-integration-campaign--active-9-october-2026).

### Approved discovery execution — closed 9 October 2026

YS approved the concrete discovery-only packet with “Yes Go.” Management window07:42:10–08:42:10UTC; one180-second grant, maximum5 provider calls,66 management requests and4 deployments including rollback. Exact approved/deployed source661cbf54ae33bd8e08f00d631ea78772f9ea2ded passed both CI jobs37899051046; backend artifact11600959051 was downloaded, SHA256-checked and its135 sealed files/eight migrations verified without rebuilding.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#approved-discovery-execution--closed-9-october-2026).

### Historical native mapping discovery preparation — 9 October 2026

One agent, start15:10SGT, hard stop21:10SGT, maximum3 repairs per distinct issue. Owner-merged PR13 verified at main757fd288084d0e76c7cb7b766e33c4724d6988d0; main CI37896841542 actually passed verify/frontend and verify/backend and existing Pages deploy.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-native-mapping-discovery-preparation--9-october-2026).

### Historical native adapter checkpoint — completed 9 October 2026

One agent; start13:00SGT, deadline19:00SGT; at most3 repairs per distinct issue. PR12 remains draft/unmerged, reviewed7b83a8b passed both CI jobs37884721443 (123 application,97 Worker,69 browser per path).

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-native-adapter-checkpoint--completed-9-october-2026).

### Historical native preparation checkpoint (completed in PR12)

### Preparation history

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-native-preparation-checkpoint-completed-in-pr12).

### Historical Experiment1 handover (superseded current status)

**Technical checkpoint passed:** source842adb94cdd0cc9c2952d8e13a62c3f43d98c30f, [Verify37874680093](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37874680093): exact `verify / frontend` and `verify / backend` both success.95 Worker cases,121 application cases and63 browser executions per root/Pages path, all original Chromium/phone-WebKit/tablet-WebKit projects, strict zero-skip/retry receipts. CI tested merge of this source into unchanged main3bf8e3b; deploy skipped.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-experiment1-handover-superseded-current-status).

### M3.3 technical handover — 9 October 2026

**Implemented:** existing access/intent/idempotency/effect/association/coordinator owners reused. Additive0006 records due work atomically with dispatch; internal bounded recovery claims fence original processes, expire/reclaim with durable generations and attempts, reject stale completion and retain unknown effect identity.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#m33-technical-handover--9-october-2026).

### M3.2 technical handover — 9 October 2026

**Implemented / Synthetic-tested:** the existing Preview journey now uses named asynchronous availability, checkout, pay, check and resolve contracts. Customers see loading and safe failure/unavailable states; selections/contact input survive errors.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#m32-technical-handover--9-october-2026).

### M3.1 technical handover — 08 October 2026, 23:21 SGT

**M3.1 technical scope verified under the approved exception; formal milestone closure pending the named dependencies.** Technical verification uses isolated runtime/concurrency evidence plus deployed foundation checks. Live log retrieval is separately unverified because the scoped observability query returned403; no production timing/placement or owner acceptance is claimed.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#m31-technical-handover--08-october-2026-2321-sgt).

### M3.1 execution record — 8 October 2026, 22:26 SGT

One agent; maximum six hours, deadline 9 October 04:26 SGT. Provider campaign stays closed: zero new provider calls/bookings/payments authorized.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#m31-execution-record--8-october-2026-2226-sgt).

### Closed continuation — 8 October 2026, 18:38 SGT

**Campaign complete; North Star incomplete.** One-agent continuation ran from the conservative17:26SGT start; closed before23:26SGT deadline. No automatic restart.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#closed-continuation--8-october-2026-1838-sgt).

### Continuation execution record — 8 October 2026

- Window: conservative start 17:26 SGT, deadline 23:26 SGT, maximum six hours; no automatic restart. One agent.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#continuation-execution-record--8-october-2026).

### Historical Cloudflare developer campaign — 8 October 2026

- Base: PR #10 owner-merged at `3bf8e3b45b0d771bc76e9087932c0180000d83d0`; main CI37743098312 passed. Historical checkout897cbfe remains unchanged.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-cloudflare-developer-campaign--8-october-2026).

### Finite accounting and resume boundary

Conservative execution window 16:00–22:00 SGT on 8 October 2026, maximum six hours; no automatic restart. Final automated management accounting is **56/200** Cloudflare requests, including 11 preflight and 36 Wrangler requests.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#finite-accounting-and-resume-boundary).

### Historical provider continuation checkpoint — 8 October 2026

- Provider continuation closed with concrete blockers; **M2 remains incomplete**. Execution source was PR#9 candidate `21c8fc855a0e6d8371b541b7ef35d3d4ee1b4e75`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-provider-continuation-checkpoint--8-october-2026).

### Historical campaign checkpoint — superseded by continuation above

- Developer evidence campaign finished with concrete blockers; M2 is not complete. Source remains PR9 draft/unmerged at `21c8fc855a0e6d8371b541b7ef35d3d4ee1b4e75`, detached isolated worktree.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-campaign-checkpoint--superseded-by-continuation-above).

### Historical pre-campaign checkpoint — 8 October 2026

- PR#9 refreshed open/draft/unmerged at `21c8fc855a0e6d8371b541b7ef35d3d4ee1b4e75`. Reused detached worktree; historical `897cbfe737d31069ae25dca39c638cdededf3593`, empty index and seven existing documentation edits preserved.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-pre-campaign-checkpoint--8-october-2026).

### Checkpoint — 7 October 2026

- Active North Star: official research plus staged controlled developer experiments; no blanket six-answer support gate. Current preparation uses **0 provider-account requests, 0 business writes**; original allowance remains **3/3 exhausted**. - Refreshed main after merged PR #8: `97b42c7d561ffa0167eb3ca1113d18e143a9e0d9`, tree `976cf0a064a82bb655d22fc9156c5a4663a80068`.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#checkpoint--7-october-2026).

### Historical task ledger — superseded by current campaign checkpoint

Detailed checkpoint, decisions and verification evidence retained in the immutable source below.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-task-ledger--superseded-by-current-campaign-checkpoint).

### Native checkout staged preparation — 7 October 2026

- YS confirms development company/merchant/HitPay isolation, intended service/instructor/resource/timing/price-tax/intake structure, controlled notification inbox and YS dashboard reconciliation. Recorded as owner confirmations, not executed API evidence; do not request them again. - Service Contracts retains D6–D14 native invoice/payment-link research and adds D15–D20 corrections.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#native-checkout-staged-preparation--7-october-2026).

### Developer access and backend-plan reconciliation — 7 October 2026

- Fresh managed attachment: source configuration `5b37073b-4577-4be4-ac01-85c7f49399d0~cecfg_6ac526346c988198a82b0507650e2a7b`, version `5b37073b-4577-4be4-ac01-85c7f49399d0~cecfgver_6ac5dbcc564881988d31dffcafbb93e5`, desired/observed revision **4**, observations current, phase running. No environment display name was returned; the exact environment ID is in the sanitized receipt.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#developer-access-and-backend-plan-reconciliation--7-october-2026).

### C3 runtime restoration evidence — 7 October 2026

- Verified reviewed checkpoint: `experiment/codex-cloud-workflow-2026-10-06` at full HEAD `897cbfe737d31069ae25dca39c638cdededf3593`; base `0cea68168738c722d05be9d3580938b65a4860c7` ancestry passed. Source and index were clean and unchanged throughout verification.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#c3-runtime-restoration-evidence--7-october-2026).

### C4 evidence review — 7 October 2026

- Existing [PR #6](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/6) was open, draft and unmerged at that historical review. At review, the head was `897cbfe737d31069ae25dca39c638cdededf3593` on `experiment/codex-cloud-workflow-2026-10-06`, matching local HEAD and the C3 checkpoint.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#c4-evidence-review--7-october-2026).

### Preparation evidence

- Latest external project comparison: PR #8 head `16eea945f9324b6f20610d0a0b98b1a1cb6014e9`, based on main `7970f65b5975a6554c46eb521c7ca118939e4bb9`. Re-read its four entry/Cloud files and the relevant canonical docs/runbook sections.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#preparation-evidence).

### Provider evidence and remaining work

- Client public catalogue, timezone, timeframe, work-calendar envelopes, 1/7/31-day availability and sampled end-time reads were exercised. Read-only discovery is sufficient to proceed with this source transition. - Latest R2: 51/51 calls passed, no retries, 268 offered starts unchanged between snapshots, 16 offered end-time samples all 50 minutes.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#provider-evidence-and-remaining-work).

### Documentation handoff — 7 October 2026

The user authorized committing/pushing only the intended documentation to existing draft PR #6 and updating its description. This handoff preserves the C3/C4 findings above and replaces obsolete host-install instructions in `docs/CODEX_CLOUD.md` with the verified retained Docker reuse procedure.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#documentation-handoff--7-october-2026).

### Bounded CI repair — 7 October 2026

- Documentation handoff commit `74ca490f8a52025eff16933e500933c359eebfee` reached [CI run 37559663874](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37559663874), attempt 1, but `verify / frontend` failed at `time-step.test.tsx:47` (two instructor cards expected, one received). Preserve the [original failure artifact](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37559663874/artifacts/11456785312); 42 unit/component/service cases passed and one failed, so build/browser gates did not execute.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#bounded-ci-repair--7-october-2026).

### M2.1 reconciliation — 7 October 2026

- Started from clean branch `experiment/codex-cloud-workflow-2026-10-06`, HEAD `a6f1a6cc151200727d7806ff97a79c963edb2516`, clean index. [Full CI 37560542328](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/37560542328) passed that repair candidate (43 unit/component/service, 42 browser cases); C3 runtime/evidence and original failures are reused, not rerun or rewritten. - [Service Contracts](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/docs/SERVICE_CONTRACTS.md#m21-capability-matrix--reconciled-7-october-2026) now owns the 14-row capability matrix, dated official sources, exact next proof, responsible access roles and synthetic reconciliation plan. No production adapter, Worker API or payment flow is implemented. - Reused the canonical 51/51 R2 findings, 268 unchanged starts and 16 offered-start 50-minute intervals.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#m21-reconciliation--7-october-2026).

### Elapsed-slot application trial — 7 October 2026

- Preserved checkpoint/index identity in `/workspace/work/elapsed-slot-trial/baseline.json`. Preparation key/image and all three inherited variables match the C3 configuration.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#elapsed-slot-application-trial--7-october-2026).

### Historical developer native-payment reconciliation — before PR #7 merge

- Four original private chat attachments inspected: Card HitPay `Screenshot 2026-10-07 121355.png`, Card SimplyBook/SBPay `121405.png`, PayNow HitPay `122134.png`, PayNow SimplyBook/SBPay `122144.png` (same filename prefix/date). Originals remain with YS/in the conversation; no repository image copies, contact data or reconstructed original files.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#historical-developer-native-payment-reconciliation--before-pr-7-merge).

### Next run

Use the single next-ready task in the current ledger above and the proposed ordering in NORTH_STAR. Historical discovery/email setup instructions below are not fresh authority.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#next-run).

### Update discipline

- Keep one current ledger, not a transcript. Move completed milestone summaries to Journey. - Retain source identity, command, environment, result/count, log/workflow reference and limitations. - Carry diagnoses and next actions forward.

[Full dated evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_JOURNEY.md#update-discipline).

### Historical contract and rule source index

The superseded [4 October diagram](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/architecture/SoccerBotStudio_Architecture.svg) remains in Git history.

Supporting sections not repeated in the narrative remain available at the exact pre-refactor revision. These links preserve complete details without duplicating current rules.

- [Complete historical service_contracts.md](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md).
- [Complete historical SOCCERBOT_RULES_AND_ARCHITECTURE.md](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md).
- [Complete historical CODEX_CLOUD.md](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/CODEX_CLOUD.md).

<details>
<summary>Historical section index: service_contracts.md</summary>

- [Prepared isolated load runner — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#prepared-isolated-load-runner--21-october-2026).
- [Burst results and overload follow-up — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#burst-results-and-overload-follow-up--21-october-2026).
- [Remaining acceptance and combined resilience campaign — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#remaining-acceptance-and-combined-resilience-campaign--21-october-2026).
- [Consistent calendar selection — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#consistent-calendar-selection--21-october-2026-sgt).
- [Rejected checkout readback — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#rejected-checkout-readback--21-october-2026-sgt).
- [Unresolved confirmation refresh — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#unresolved-confirmation-refresh--21-october-2026-sgt).
- [Confirmation details and acceptance follow-up — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#confirmation-details-and-acceptance-follow-up--21-october-2026).
- [Backend OpenTelemetry export — preparation, 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#backend-opentelemetry-export--preparation-21-october-2026).
- [Test-suite audit — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#test-suite-audit--21-october-2026).
- [Checkout and recovery storage contracts](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-and-recovery-storage-contracts).
- [Provider token cache contract](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#provider-token-cache-contract).
- [Confirmation read snapshot contract](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#confirmation-read-snapshot-contract).
- [Current checkout and queue contracts — 20 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#current-checkout-and-queue-contracts--20-october-2026).
- [Historical contracts and evidence](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-contracts-and-evidence).
- [Checkout phase tracing — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-phase-tracing--20-october-2026-sgt).
- [Batch checkout creation path — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#batch-checkout-creation-path--20-october-2026-sgt).
- [Checkout D1 consolidation — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-d1-consolidation--20-october-2026-sgt).
- [Lean single checkout — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#lean-single-checkout--20-october-2026-sgt).
- [PR66 CI cookie-adapter correction — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#pr66-ci-cookie-adapter-correction--20-october-2026-sgt).
- [Authentication rejection diagnostic follow-up — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#authentication-rejection-diagnostic-follow-up--20-october-2026-sgt).
- [HAR10 confirmation stability and pre-dispatch authentication failure — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#har10-confirmation-stability-and-pre-dispatch-authentication-failure--20-october-2026-sgt).
- [Confirmation read timestamp race — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#confirmation-read-timestamp-race--20-october-2026-sgt).
- [Independent payment deadlines — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#independent-payment-deadlines--20-october-2026-sgt).
- [Interrupted provider transport recovery — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#interrupted-provider-transport-recovery--20-october-2026-sgt).
- [Lost checkout response test ordering — 20 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#lost-checkout-response-test-ordering--20-october-2026).
- [PR62 checkout transport verification — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#pr62-checkout-transport-verification--20-october-2026-sgt).
- [Validated batch closure handoff — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#validated-batch-closure-handoff--20-october-2026-sgt).
- [Direct saved checkout handoff — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#direct-saved-checkout-handoff--19-october-2026-sgt).
- [Scheduled public snapshots — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#scheduled-public-snapshots--19-october-2026-sgt).
- [Public display cache fast path and loading scope — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#public-display-cache-fast-path-and-loading-scope--19-october-2026-sgt).
- [Local Review and fixed payment-checking contract — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#local-review-and-fixed-payment-checking-contract--19-october-2026-sgt).
- [Editable Review, combined checkout and compact confirmation — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#editable-review-combined-checkout-and-compact-confirmation--19-october-2026-sgt).
- [HAR08 confirmation continuity and record reconciliation — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#har08-confirmation-continuity-and-record-reconciliation--19-october-2026-sgt).
- [Email-code browser interaction repair — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#email-code-browser-interaction-repair--19-october-2026-sgt).
- [Fifteen-minute hold and eight-minute payment policy — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#fifteen-minute-hold-and-eight-minute-payment-policy--19-october-2026-sgt).
- [Completed-dismissal CI setup repair — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#completed-dismissal-ci-setup-repair--19-october-2026-sgt).
- [Pre-creation read concurrency — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#pre-creation-read-concurrency--19-october-2026-sgt).
- [HitPay transport failure diagnostics — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#hitpay-transport-failure-diagnostics--19-october-2026-sgt).
- [Checkout progress, expiry and customer success — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-progress-expiry-and-customer-success--19-october-2026-sgt).
- [Checkout handoff lifecycle regression — 19 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-handoff-lifecycle-regression--19-october-2026).
- [Mandatory test-impact pass after every change — 19 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#mandatory-test-impact-pass-after-every-change--19-october-2026).
- [One-month calendar preload — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#one-month-calendar-preload--19-october-2026-sgt).
- [Final single-booking optimization pass — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#final-single-booking-optimization-pass--19-october-2026-sgt).
- [Checkout display details and immediate confirmed-page exit — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-display-details-and-immediate-confirmed-page-exit--19-october-2026-sgt).
- [Latest05 latency pass and comment milestone — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#latest05-latency-pass-and-comment-milestone--19-october-2026-sgt).
- [Review presentation continuity — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#review-presentation-continuity--19-october-2026-sgt).
- [Single-booking latency contract — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#single-booking-latency-contract--19-october-2026-sgt).
- [Combined batch validation and owner conflict check — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#combined-batch-validation-and-owner-conflict-check--19-october-2026-sgt).
- [Independent checking-window regression — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#independent-checking-window-regression--19-october-2026-sgt).
- [Browser failure acceptance matrix — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#browser-failure-acceptance-matrix--18-october-2026).
- [Combined holding request — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#combined-holding-request--18-october-2026).
- [Rebooking background dismissal and latest03 evidence — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#rebooking-background-dismissal-and-latest03-evidence--18-october-2026).
- [Latest02 latency and email repair — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#latest02-latency-and-email-repair--18-october-2026).
- [Checkout authority and timing — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-authority-and-timing--18-october-2026).
- [Initial comments enabled in source — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#initial-comments-enabled-in-source--18-october-2026).
- [Comment-delivery audit and HitPay handoff — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#comment-delivery-audit-and-hitpay-handoff--18-october-2026).
- [Completed booking exit and provider diagnostics — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#completed-booking-exit-and-provider-diagnostics--18-october-2026).
- [Single-session validation consolidation — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#single-session-validation-consolidation--18-october-2026).
- [Saved confirmation and current receipt — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#saved-confirmation-and-current-receipt--17-october-2026).
- [Paid return continuity and restore-before-prefetch — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#paid-return-continuity-and-restore-before-prefetch--17-october-2026).
- [PR41 CI repair and paid-return diagnosis — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#pr41-ci-repair-and-paid-return-diagnosis--17-october-2026).
- [HAR-fixed-01 booking loading and latency review — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#har-fixed-01-booking-loading-and-latency-review--17-october-2026).
- [Migration runbook and required acceptance evidence — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#migration-runbook-and-required-acceptance-evidence--16-october-2026).
- [Migration sweep: remove old-account session preload — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#migration-sweep-remove-old-account-session-preload--16-october-2026).
- [One-attempt new-account acceptance packet — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#one-attempt-new-account-acceptance-packet--16-october-2026).
- [Environment readiness and owner confirmations — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#environment-readiness-and-owner-confirmations--16-october-2026).
- [Booking-check review and legacy continuity requirements — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#booking-check-review-and-legacy-continuity-requirements--16-october-2026).
- [Opening hours, four-hour lead and observed HitPay host — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#opening-hours-four-hour-lead-and-observed-hitpay-host--16-october-2026).
- [HAR06 checkout latency and payment diagnostics — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#har06-checkout-latency-and-payment-diagnostics--16-october-2026).
- [Sandbox deployment and recovery correction — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#sandbox-deployment-and-recovery-correction--16-october-2026).
- [Private hold evidence — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#private-hold-evidence--16-october-2026).
- [Holding request HTTP boundary — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#holding-request-http-boundary--15-october-2026).
- [Review booking continuation and failed selection — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#review-booking-continuation-and-failed-selection--15-october-2026).
- [Direct hosted HitPay handoff — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#direct-hosted-hitpay-handoff--15-october-2026).
- [Ongoing identity and physical-test readiness — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#ongoing-identity-and-physical-test-readiness--15-october-2026).
- [Indexed admission acceptance — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#indexed-admission-acceptance--14-october-2026).
- [Token-boundary calendar failure and correction — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#token-boundary-calendar-failure-and-correction--14-october-2026).
- [Customer lead-time contract — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#customer-lead-time-contract--14-october-2026).
- [Anonymous homepage metadata and entry reuse — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#anonymous-homepage-metadata-and-entry-reuse--14-october-2026).
- [Cold calendar prefetch freshness contract — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#cold-calendar-prefetch-freshness-contract--14-october-2026).
- [Premium catalogue map and deployment health evidence — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#premium-catalogue-map-and-deployment-health-evidence--14-october-2026).
- [Cached time offers and priced native services — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#cached-time-offers-and-priced-native-services--14-october-2026).
- [Continuous customer browsing and checkout — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#continuous-customer-browsing-and-checkout--14-october-2026).
- [Session/calendar inspection window — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#sessioncalendar-inspection-window--14-october-2026).
- [Anonymous calendar and final receipt — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#anonymous-calendar-and-final-receipt--14-october-2026).
- [Calendar overview, fresh continuation and hidden initialization — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#calendar-overview-fresh-continuation-and-hidden-initialization--14-october-2026).
- [Revised experiment: no visible provider-homepage detour — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#revised-experiment-no-visible-provider-homepage-detour--14-october-2026).
- [Proposed full customer-journey experiment — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#proposed-full-customer-journey-experiment--14-october-2026).
- [Homepage-first checkout34 rendered after displayed due time — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#homepage-first-checkout34-rendered-after-displayed-due-time--14-october-2026).
- [Broader community research: related precedents, no exact verified fix — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#broader-community-research-related-precedents-no-exact-verified-fix--13-october-2026).
- [Invoice authorization investigation: session continuity is the specific lead — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#invoice-authorization-investigation-session-continuity-is-the-specific-lead--13-october-2026).
- [Same original reference34 link reaches both checkout and e403 — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#same-original-reference34-link-reaches-both-checkout-and-e403--13-october-2026).
- [Native checkout34 reached intermittently with30-minute window — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-checkout34-reached-intermittently-with30-minute-window--13-october-2026).
- [Native invoice33 exists; displayed due time confounds the control — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-invoice33-exists-displayed-due-time-confounds-the-control--13-october-2026).
- [SBPay transaction33 explicitly has no related invoice document — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#sbpay-transaction33-explicitly-has-no-related-invoice-document--13-october-2026).
- [Native control exact error and post-failure pending state — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-control-exact-error-and-post-failure-pending-state--13-october-2026).
- [Native emailed link reproduces invoice-details403 with cookies sent — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-emailed-link-reproduces-invoice-details403-with-cookies-sent--13-october-2026).
- [Native dashboard Pay Later link issued; navigation stopped — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-dashboard-pay-later-link-issued-navigation-stopped--13-october-2026).
- [Ten-minute payment timeout compared with original failure — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#ten-minute-payment-timeout-compared-with-original-failure--13-october-2026).
- [Invoice 32 now cancelled by timeout — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#invoice-32-now-cancelled-by-timeout--13-october-2026).
- [Owner-reported remaining account allowance — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#owner-reported-remaining-account-allowance--13-october-2026).
- [Native invoice-link authorization: documented boundary — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-invoice-link-authorization-documented-boundary--13-october-2026).
- [Native invoice access403 captured; browser payment remains blocked — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-invoice-access403-captured-browser-payment-remains-blocked--13-october-2026).
- [Checkout diagnostic budget failure and verified closure — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-diagnostic-budget-failure-and-verified-closure--13-october-2026).
- [Fresh checkout-opening diagnostic preparation — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#fresh-checkout-opening-diagnostic-preparation--13-october-2026).
- [Owner confirms native homepage and PRO trial — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#owner-confirms-native-homepage-and-pro-trial--13-october-2026).
- [Current native settings readback — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#current-native-settings-readback--13-october-2026).
- [Checkout 404 diagnosis narrowed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#checkout-404-diagnosis-narrowed--13-october-2026).
- [Native payment-link navigation failure — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-payment-link-navigation-failure--13-october-2026).
- [Proposed owner payment and paired callback test — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#proposed-owner-payment-and-paired-callback-test--13-october-2026).
- [Booking 39 ingress correlation and provider trace boundary — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#booking-39-ingress-correlation-and-provider-trace-boundary--13-october-2026).
- [Paired delivery control result and next evidence — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#paired-delivery-control-result-and-next-evidence--13-october-2026).
- [Paired booking/invoice capture contract — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#paired-bookinginvoice-capture-contract--13-october-2026).
- [Deeper investigation: pre-payment event expectation is unproven — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#deeper-investigation-pre-payment-event-expectation-is-unproven--13-october-2026).
- [Stored delivery evidence: no recorded arrival at the Worker — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#stored-delivery-evidence-no-recorded-arrival-at-the-worker--13-october-2026).
- [New booking accepted; webhook observation failed; cleanup verified — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#new-booking-accepted-webhook-observation-failed-cleanup-verified--13-october-2026).
- [Body-independent DELETE acknowledgement — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#body-independent-delete-acknowledgement--13-october-2026).
- [Read-only reconciliation restored the active baseline — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#read-only-reconciliation-restored-the-active-baseline--13-october-2026).
- [Cleanup DELETE outcome unknown; access closed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#cleanup-delete-outcome-unknown-access-closed--13-october-2026).
- [Subscription flag repair — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#subscription-flag-repair--13-october-2026).
- [Subscription diagnostic executed and closed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#subscription-diagnostic-executed-and-closed--13-october-2026).
- [Webhook flight stopped; access closed, subscription unresolved — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#webhook-flight-stopped-access-closed-subscription-unresolved--13-october-2026).
- [Read-only subscription structure diagnostic](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#read-only-subscription-structure-diagnostic).
- [Approved technical payment/webhook campaign — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#approved-technical-paymentwebhook-campaign--13-october-2026).
- [Finite webhook subscription lifecycle](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#finite-webhook-subscription-lifecycle).
- [Payment correction and authenticated webhook capture — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#payment-correction-and-authenticated-webhook-capture--13-october-2026).
- [Developer native booking accepted and independently closed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#developer-native-booking-accepted-and-independently-closed--13-october-2026).
- [Owner roster and instructor priority — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#owner-roster-and-instructor-priority--12-october-2026).
- [Approved setup inspection completed and closed — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#approved-setup-inspection-completed-and-closed--12-october-2026).
- [Full native acceptance execution resumed — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#full-native-acceptance-execution-resumed--12-october2026).
- [Native campaign stopped on actual date availability — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-campaign-stopped-on-actual-date-availability--12-october2026).
- [Actual calendar discovery before the final native gate — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#actual-calendar-discovery-before-the-final-native-gate--12-october2026).
- [Native single proof accepted and closed — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-single-proof-accepted-and-closed--12-october2026).
- [Availability-only stop and actual-attempt accounting — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#availability-only-stop-and-actual-attempt-accounting--12-october2026).
- [Native acceptance evidence after flight2 — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-acceptance-evidence-after-flight2--12-october2026).
- [Observed closeBatch envelope and invoice validation contract — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#observed-closebatch-envelope-and-invoice-validation-contract--12-october2026).
- [Native acceptance checklist and approved autonomous campaign — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-acceptance-checklist-and-approved-autonomous-campaign--12-october2026).
- [Batch response collection validation — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#batch-response-collection-validation--12-october2026).
- [256 trial: second book receipt collection rejected — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#256-trial-second-book-receipt-collection-rejected--12-october2026).
- [Approved limits and next live-test packet — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#approved-limits-and-next-live-test-packet--12-october2026).
- [Retained batch identity and optional receipt echo — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#retained-batch-identity-and-optional-receipt-echo--12-october2026).
- [Observed missing intermediate batch echo — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#observed-missing-intermediate-batch-echo--12-october2026).
- [Next finite experiment prepared — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#next-finite-experiment-prepared--12-october2026).
- [Observed intermediate payment-flag absence — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#observed-intermediate-payment-flag-absence--12-october2026).
- [Intermediate creation contract audit — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#intermediate-creation-contract-audit--12-october-2026).
- [Executed existing-record inspection — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#executed-existing-record-inspection--12-october-2026).
- [Native validation diagnosis contract — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-validation-diagnosis-contract--12-october-2026).
- [Finite192-call continuation contract — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#finite192-call-continuation-contract--12-october-2026).
- [Documented native lifecycle and validation phases — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#documented-native-lifecycle-and-validation-phases--12-october-2026).
- [Residual-only recovery and post-write diagnostics — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#residual-only-recovery-and-post-write-diagnostics--12-october-2026).
- [Preview handler error boundary](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#preview-handler-error-boundary).
- [Forward-read identity contract — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#forward-read-identity-contract--12-october-2026).
- [Idle-lifecycle configuration experiment — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#idle-lifecycle-configuration-experiment--12-october-2026).
- [Native readiness contract after verified closure — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-readiness-contract-after-verified-closure--12-october-2026).
- [Finite128-call policy contract — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#finite128-call-policy-contract--12-october-2026).
- [Internal native prerequisite diagnosis — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#internal-native-prerequisite-diagnosis--12-october-2026).
- [Native proof observations and safe RPC errors — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-proof-observations-and-safe-rpc-errors--12-october-2026).
- [Deployed signing prerequisite — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#deployed-signing-prerequisite--12-october-2026).
- [Native failure recovery and compensation — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-failure-recovery-and-compensation--11-october-2026).
- [Protected customer-native operations — 11 October](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#protected-customer-native-operations--11-october).
- [11 October — native checkout implementation and owner configuration confirmation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#11-october--native-checkout-implementation-and-owner-configuration-confirmation).
- [Current metadata evidence — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#current-metadata-evidence--11-october-2026).
- [Webhook and payment reconciliation task — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#webhook-and-payment-reconciliation-task--11-october-2026).
- [Native completion implementation contract — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-completion-implementation-contract--11-october-2026).
- [Native execution priority and studio allocation — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-execution-priority-and-studio-allocation--11-october-2026).
- [Next A3 delivery package — source preparation, 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#next-a3-delivery-package--source-preparation-11-october-2026).
- [PR19 proof execution outcome — closed, 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#pr19-proof-execution-outcome--closed-10-october-2026).
- [Historical M3.4–M3.5 packet — prepared then approved and closed, 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-m34m35-packet--prepared-then-approved-and-closed-10-october-2026).
- [M3.5 implementation design — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m35-implementation-design--10-october-2026).
- [M2.5/M3.6 lookup research — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m25m36-lookup-research--10-october-2026).
- [Historical proposed A3 remembered identity and prefill contract — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-proposed-a3-remembered-identity-and-prefill-contract--10-october-2026).
- [Replacement email test result — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#replacement-email-test-result--10-october-2026).
- [Unused email window replacement — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#unused-email-window-replacement--10-october-2026).
- [Corrected readiness and discovery package — prepared, not authorized](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#corrected-readiness-and-discovery-package--prepared-not-authorized).
- [End-to-end developer acceptance matrix — reconciled 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#end-to-end-developer-acceptance-matrix--reconciled-11-october-2026).
- [Connected developer composition — source checkpoint, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#connected-developer-composition--source-checkpoint-9-october-2026).
- [M3.3 durable recovery contract — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m33-durable-recovery-contract--9-october-2026).
- [Implemented developer foundation — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#implemented-developer-foundation--8-october-2026).
- [Composition and authority — M3.2, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#composition-and-authority--m32-9-october-2026).
- [Implemented operations — demo only](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#implemented-operations--demo-only).
- [Demo instructor rotation and customer disclosure](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#demo-instructor-rotation-and-customer-disclosure).
- [Current data and state model](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#current-data-and-state-model).
- [Future Worker contract requirements — not implemented endpoints](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#future-worker-contract-requirements--not-implemented-endpoints).
- [Planned latency-aware live operations — design only, 5 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#planned-latency-aware-live-operations--design-only-5-october-2026).
- [Required evidence and change discipline](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#required-evidence-and-change-discipline).
- [Presentation navigation boundary — 4 October restoration](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#presentation-navigation-boundary--4-october-restoration).
- [Iteration dependencies — current planning baseline](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#iteration-dependencies--current-planning-baseline).
- [Observed SimplyBook reads — 6 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#observed-simplybook-reads--6-october-2026).
- [M2.1 capability matrix — reconciled 7 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m21-capability-matrix--reconciled-7-october-2026).
- [Developer native-payment evidence and first proof — 7 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#developer-native-payment-evidence-and-first-proof--7-october-2026).
- [M2 Card proof and browser-return reliability preparation — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m2-card-proof-and-browser-return-reliability-preparation--8-october-2026).
- [Historical M2.2 CAP05 preparation — retired by subsequent owner scope decision](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-m22-cap05-preparation--retired-by-subsequent-owner-scope-decision).
- [Historical M2.2 DUP06 same-instructor duplicate-slot preparation — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-m22-dup06-same-instructor-duplicate-slot-preparation--8-october-2026).
- [DUP06 contact-control correction — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#dup06-contact-control-correction--8-october-2026).
- [8 October 2026 — approved DUP06 stopped at first authentication](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#8-october-2026--approved-dup06-stopped-at-first-authentication).
- [Historical capacity request43 offline diagnosis and proposed diagnostic continuation — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-capacity-request43-offline-diagnosis-and-proposed-diagnostic-continuation--8-october-2026).
- [Historical developer integration campaign disposition — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#historical-developer-integration-campaign-disposition--8-october-2026).
- [Focused continuation contracts and disposition — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#focused-continuation-contracts-and-disposition--8-october-2026).
- [M3.2 bounded native-contract research — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#m32-bounded-native-contract-research--9-october-2026).
- [Finite developer email composition — 9 October continuation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#finite-developer-email-composition--9-october-continuation).
- [Native single-session preparation — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-single-session-preparation--9-october-2026).
- [Native adapter contracts — PR13 checkpoint, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-adapter-contracts--pr13-checkpoint-9-october-2026).
- [Dynamic catalogue and pre-booking — current contract](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#dynamic-catalogue-and-pre-booking--current-contract).
- [Native configuration discovery — current, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SERVICE_CONTRACTS.md#native-configuration-discovery--current-9-october-2026).

</details>

<details>
<summary>Historical section index: SOCCERBOT_RULES_AND_ARCHITECTURE.md</summary>

- [Consistent calendar selection — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#consistent-calendar-selection--21-october-2026-sgt).
- [Rejected checkout presentation — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#rejected-checkout-presentation--21-october-2026-sgt).
- [Unresolved return-page refresh — 21 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#unresolved-return-page-refresh--21-october-2026-sgt).
- [Confirmation details presentation — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#confirmation-details-presentation--21-october-2026).
- [Backend telemetry preparation — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#backend-telemetry-preparation--21-october-2026).
- [Current implementation rules — 20 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-implementation-rules--20-october-2026).
- [Isolated load preparation — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#isolated-load-preparation--21-october-2026).
- [Milestone status — 21 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#milestone-status--21-october-2026).
- [Historical design record](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#historical-design-record).
- [Checkout phase tracing — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#checkout-phase-tracing--20-october-2026-sgt).
- [Batch checkout creation path — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#batch-checkout-creation-path--20-october-2026-sgt).
- [Checkout D1 consolidation — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#checkout-d1-consolidation--20-october-2026-sgt).
- [Lean single checkout — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#lean-single-checkout--20-october-2026-sgt).
- [PR66 CI cookie-adapter correction — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pr66-ci-cookie-adapter-correction--20-october-2026-sgt).
- [Authentication rejection diagnostic follow-up — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#authentication-rejection-diagnostic-follow-up--20-october-2026-sgt).
- [HAR10 confirmation stability and pre-dispatch authentication failure — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#har10-confirmation-stability-and-pre-dispatch-authentication-failure--20-october-2026-sgt).
- [Confirmation read timestamp race — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#confirmation-read-timestamp-race--20-october-2026-sgt).
- [Independent payment deadlines — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#independent-payment-deadlines--20-october-2026-sgt).
- [Interrupted provider transport recovery — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#interrupted-provider-transport-recovery--20-october-2026-sgt).
- [Lost checkout response test ordering — 20 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#lost-checkout-response-test-ordering--20-october-2026).
- [PR62 checkout transport verification — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pr62-checkout-transport-verification--20-october-2026-sgt).
- [Batch evidence reuse and bounded persistence — 20 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#batch-evidence-reuse-and-bounded-persistence--20-october-2026-sgt).
- [Checkout handoff optimization — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#checkout-handoff-optimization--19-october-2026-sgt).
- [Persistent display warming and booking-triggered refresh — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#persistent-display-warming-and-booking-triggered-refresh--19-october-2026-sgt).
- [Browsing cache priority and local loading — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#browsing-cache-priority-and-local-loading--19-october-2026-sgt).
- [Local Review and anchored return checking — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#local-review-and-anchored-return-checking--19-october-2026-sgt).
- [Editable Review, combined checkout and compact confirmation — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#editable-review-combined-checkout-and-compact-confirmation--19-october-2026-sgt).
- [HAR08 confirmation continuity and record reconciliation — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#har08-confirmation-continuity-and-record-reconciliation--19-october-2026-sgt).
- [Email-code browser interaction repair — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#email-code-browser-interaction-repair--19-october-2026-sgt).
- [Fifteen-minute hold and eight-minute payment policy — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#fifteen-minute-hold-and-eight-minute-payment-policy--19-october-2026-sgt).
- [Completed-dismissal CI setup repair — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#completed-dismissal-ci-setup-repair--19-october-2026-sgt).
- [Pre-creation concurrency ownership — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pre-creation-concurrency-ownership--19-october-2026-sgt).
- [Payment failure diagnostic boundary — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#payment-failure-diagnostic-boundary--19-october-2026-sgt).
- [Customer confirmation and shared checkout deadline — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#customer-confirmation-and-shared-checkout-deadline--19-october-2026-sgt).
- [Pending: controlled account-coordinator concurrency — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pending-controlled-account-coordinator-concurrency--19-october-2026-sgt).
- [Retained Review checkout handoff — 19 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#retained-review-checkout-handoff--19-october-2026).
- [Test-impact review is part of every change — 19 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#test-impact-review-is-part-of-every-change--19-october-2026).
- [One-month calendar preload — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#one-month-calendar-preload--19-october-2026-sgt).
- [Final single-booking optimization pass — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#final-single-booking-optimization-pass--19-october-2026-sgt).
- [Stable Review and confirmation presentation — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#stable-review-and-confirmation-presentation--19-october-2026-sgt).
- [Comment-complete Review and D1 round trips — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#comment-complete-review-and-d1-round-trips--19-october-2026-sgt).
- [Review route continuity — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#review-route-continuity--19-october-2026-sgt).
- [Verification latency ownership — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#verification-latency-ownership--19-october-2026-sgt).
- [Combined batch and location UI ownership — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#combined-batch-and-location-ui-ownership--19-october-2026-sgt).
- [Independent checking-window regression — 19 October 2026 SGT](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#independent-checking-window-regression--19-october-2026-sgt).
- [Browser failure-test ownership — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#browser-failure-test-ownership--18-october-2026).
- [Combined holding ownership — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#combined-holding-ownership--18-october-2026).
- [Immediate explicit rebooking — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#immediate-explicit-rebooking--18-october-2026).
- [Immediate payment recovery and ongoing contact access — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#immediate-payment-recovery-and-ongoing-contact-access--18-october-2026).
- [Checkout authority consolidation — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#checkout-authority-consolidation--18-october-2026).
- [New-booking comment delivery — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#new-booking-comment-delivery--18-october-2026).
- [HitPay navigation loading and missing booking comments — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#hitpay-navigation-loading-and-missing-booking-comments--18-october-2026).
- [Completed booking exit and provider diagnostics — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#completed-booking-exit-and-provider-diagnostics--18-october-2026).
- [Circular mouse cursor — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#circular-mouse-cursor--18-october-2026).
- [Single-session holding validation — 18 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#single-session-holding-validation--18-october-2026).
- [Confirmation return presentation — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#confirmation-return-presentation--17-october-2026).
- [Paid return continuity and restore-before-prefetch — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#paid-return-continuity-and-restore-before-prefetch--17-october-2026).
- [PR41 CI repair and paid-return diagnosis — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#pr41-ci-repair-and-paid-return-diagnosis--17-october-2026).
- [Booking loading presentation — 17 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#booking-loading-presentation--17-october-2026).
- [Account migration and test evidence requirements — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#account-migration-and-test-evidence-requirements--16-october-2026).
- [Migration sweep: remove old-account session preload — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#migration-sweep-remove-old-account-session-preload--16-october-2026).
- [Foreground booking scheduling and migration boundary — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#foreground-booking-scheduling-and-migration-boundary--16-october-2026).
- [Opening hours, four-hour lead and observed HitPay host — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#opening-hours-four-hour-lead-and-observed-hitpay-host--16-october-2026).
- [HAR06 checkout latency and payment diagnostics — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#har06-checkout-latency-and-payment-diagnostics--16-october-2026).
- [Approved sandbox deployment and recoverable rejection — 16 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#approved-sandbox-deployment-and-recoverable-rejection--16-october-2026).
- [Holding request ingress — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#holding-request-ingress--15-october-2026).
- [Review booking repair boundary — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#review-booking-repair-boundary--15-october-2026).
- [Direct hosted HitPay handoff — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#direct-hosted-hitpay-handoff--15-october-2026).
- [Ongoing developer identity — 15 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#ongoing-developer-identity--15-october-2026).
- [Admission storage query cost — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#admission-storage-query-cost--14-october-2026).
- [Identity cache cannot outlive provider tokens — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#identity-cache-cannot-outlive-provider-tokens--14-october-2026).
- [Customer booking cutoff is 150 minutes — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#customer-booking-cutoff-is-150-minutes--14-october-2026).
- [Homepage display cache survives entry — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#homepage-display-cache-survives-entry--14-october-2026).
- [Fresh catalogue for cold month reads — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#fresh-catalogue-for-cold-month-reads--14-october-2026).
- [Observed catalogue representation and deployment propagation — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#observed-catalogue-representation-and-deployment-propagation--14-october-2026).
- [Browser availability and date-dependent pricing — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#browser-availability-and-date-dependent-pricing--14-october-2026).
- [Ongoing developer customer access — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#ongoing-developer-customer-access--14-october-2026).
- [Live inspection admission repair — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#live-inspection-admission-repair--14-october-2026).
- [Homepage reads and protected receipt parity — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#homepage-reads-and-protected-receipt-parity--14-october-2026).
- [Demo parity and cached calendar implementation — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#demo-parity-and-cached-calendar-implementation--14-october-2026).
- [Customer-path constraint and readiness — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#customer-path-constraint-and-readiness--14-october-2026).
- [Current checkout experiment direction — 14 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-checkout-experiment-direction--14-october-2026).
- [Separate invoice due time, checkout rendering and link authorization — 14 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#separate-invoice-due-time-checkout-rendering-and-link-authorization--14-october2026).
- [Current checkout reliability boundary — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-checkout-reliability-boundary--13-october-2026).
- [Native diagnostic grant support remains bounded — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-diagnostic-grant-support-remains-bounded--13-october-2026).
- [Interpret the native error before repairing — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#interpret-the-native-error-before-repairing--13-october-2026).
- [Checkout reachability is an outstanding acceptance gate — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#checkout-reachability-is-an-outstanding-acceptance-gate--13-october-2026).
- [Payment preparation retains a separate submission gate — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#payment-preparation-retains-a-separate-submission-gate--13-october-2026).
- [Owner payment is the next diagnostic boundary — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#owner-payment-is-the-next-diagnostic-boundary--13-october-2026).
- [Read-only ingress evidence — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#read-only-ingress-evidence--13-october-2026).
- [Current developer acceptance state — 13 October 2026, 12:14 Singapore](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-developer-acceptance-state--13-october-2026-1214-singapore).
- [Paired diagnostic channels retain independent authority — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#paired-diagnostic-channels-retain-independent-authority--13-october-2026).
- [Verify event prerequisites before delivery acceptance — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#verify-event-prerequisites-before-delivery-acceptance--13-october-2026).
- [Separate accepted checkout/cleanup from failed signed-delivery observation — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#separate-accepted-checkoutcleanup-from-failed-signed-delivery-observation--13-october-2026).
- [DELETE acknowledgement is separate from restoration proof — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#delete-acknowledgement-is-separate-from-restoration-proof--13-october-2026).
- [Active webhook baseline reconciled — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#active-webhook-baseline-reconciled--13-october-2026).
- [Cleanup response boundary reached; access closed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#cleanup-response-boundary-reached-access-closed--13-october-2026).
- [Subscription flag repair prepared — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#subscription-flag-repair-prepared--13-october-2026).
- [Current webhook diagnostic result — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-webhook-diagnostic-result--13-october-2026).
- [Webhook flight stopped; access closed, subscription unresolved — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#webhook-flight-stopped-access-closed-subscription-unresolved--13-october-2026).
- [Approved technical payment/webhook campaign — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#approved-technical-paymentwebhook-campaign--13-october-2026).
- [Payment and callback boundaries — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#payment-and-callback-boundaries--13-october-2026).
- [Developer native booking accepted and independently closed — 13 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#developer-native-booking-accepted-and-independently-closed--13-october-2026).
- [Owner roster and instructor priority — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#owner-roster-and-instructor-priority--12-october-2026).
- [Approved setup inspection completed and closed — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#approved-setup-inspection-completed-and-closed--12-october-2026).
- [Full native acceptance execution resumed — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#full-native-acceptance-execution-resumed--12-october2026).
- [Native campaign stopped on actual date availability — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-campaign-stopped-on-actual-date-availability--12-october2026).
- [Actual calendar discovery before the final native gate — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#actual-calendar-discovery-before-the-final-native-gate--12-october2026).
- [Native single proof accepted and closed — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-single-proof-accepted-and-closed--12-october2026).
- [Availability-only stop and actual-attempt accounting — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#availability-only-stop-and-actual-attempt-accounting--12-october2026).
- [Same-date closure/readback authority verified — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#same-date-closurereadback-authority-verified--12-october2026).
- [Separate allocation and batch closure evidence — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#separate-allocation-and-batch-closure-evidence--12-october2026).
- [Acceptance-driven native continuation — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#acceptance-driven-native-continuation--12-october2026).
- [Second-response collection boundary observed — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#second-response-collection-boundary-observed--12-october2026).
- [Owner-approved live-test limits — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#owner-approved-live-test-limits--12-october2026).
- [Batch association from retained creation identity — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#batch-association-from-retained-creation-identity--12-october2026).
- [Follow-up evidence and accepted boundary — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#follow-up-evidence-and-accepted-boundary--12-october2026).
- [Next finite experiment prepared — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#next-finite-experiment-prepared--12-october2026).
- [Latest creation evidence and correction boundary — 12 October2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#latest-creation-evidence-and-correction-boundary--12-october2026).
- [Creation-contract comparison and next proof boundary — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#creation-contract-comparison-and-next-proof-boundary--12-october-2026).
- [Current provider read evidence — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-provider-read-evidence--12-october-2026).
- [Existing-record inspection boundary — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#existing-record-inspection-boundary--12-october-2026).
- [Specific native diagnostics and closed192 proof — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#specific-native-diagnostics-and-closed192-proof--12-october-2026).
- [Approved192 continuation preparation — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#approved192-continuation-preparation--12-october-2026).
- [Cart allocation and invoice finalization are separate — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#cart-allocation-and-invoice-finalization-are-separate--12-october-2026).
- [Existing-residual operator recovery — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#existing-residual-operator-recovery--12-october-2026).
- [Identity freshness between forward reads — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#identity-freshness-between-forward-reads--12-october-2026).
- [Binding lifecycle evidence — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#binding-lifecycle-evidence--12-october-2026).
- [Coordinator readiness and admission diagnostics — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#coordinator-readiness-and-admission-diagnostics--12-october-2026).
- [Explicit developer budget continuation — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#explicit-developer-budget-continuation--12-october-2026).
- [Private native prerequisite evidence — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#private-native-prerequisite-evidence--12-october-2026).
- [Native amendment executed and closed — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-amendment-executed-and-closed--12-october-2026).
- [Native proof preflight status — 12 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-proof-preflight-status--12-october-2026).
- [11 October — native recovery and compensation source](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#11-october--native-recovery-and-compensation-source).
- [11 October — protected native customer flow](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#11-october--protected-native-customer-flow).
- [11 October — native checkout implementation and owner configuration confirmation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#11-october--native-checkout-implementation-and-owner-configuration-confirmation).
- [Metadata discovery accepted and closed — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#metadata-discovery-accepted-and-closed--11-october-2026).
- [Combined acceptance direction — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#combined-acceptance-direction--11-october-2026).
- [Native completion source increment — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-completion-source-increment--11-october-2026).
- [Native-first execution direction — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-first-execution-direction--11-october-2026).
- [Current M3.6 decision — website-confirmed contact, 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-m36-decision--website-confirmed-contact-11-october-2026).
- [Governing North Star execution checkpoint — 11 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#governing-north-star-execution-checkpoint--11-october-2026).
- [Current accepted state — finite identity proof closed, 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-accepted-state--finite-identity-proof-closed-10-october-2026).
- [Finite remembered-identity proof preparation — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#finite-remembered-identity-proof-preparation--10-october-2026).
- [Remembered identity source checkpoint — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#remembered-identity-source-checkpoint--10-october-2026).
- [Historical A3 quick rebooking and remembered-device decision — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#historical-a3-quick-rebooking-and-remembered-device-decision--10-october-2026).
- [Developer email acceptance checkpoint — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#developer-email-acceptance-checkpoint--10-october-2026).
- [Unused email window replacement — 10 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#unused-email-window-replacement--10-october-2026).
- [Governing main integration continuation — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#governing-main-integration-continuation--9-october-2026).
- [Live-email candidate preparation — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#live-email-candidate-preparation--9-october-2026).
- [M3.2 exception — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m32-exception--9-october-2026).
- [Development foundation exception — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#development-foundation-exception--8-october-2026).
- [Authority and current scope](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#authority-and-current-scope).
- [Current accepted developer evidence and reliability boundary — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-accepted-developer-evidence-and-reliability-boundary--8-october-2026).
- [Historical work boundary and standing source rules — 7 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#historical-work-boundary-and-standing-source-rules--7-october-2026).
- [Current product rules — latest quotation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-product-rules--latest-quotation).
- [Target stack and ownership](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#target-stack-and-ownership).
- [Source ownership](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#source-ownership).
- [Booking invariants](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#booking-invariants).
- [Booking oracle and instructor preview — 4 October follow-up](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#booking-oracle-and-instructor-preview--4-october-follow-up).
- [Central colour and typography contract — 5 October](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#central-colour-and-typography-contract--5-october).
- [Low-latency booking architecture and acceptance plan — 5 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#low-latency-booking-architecture-and-acceptance-plan--5-october-2026).
- [B1 provider evidence register — 6 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#b1-provider-evidence-register--6-october-2026).
- [Development process — latest external project adaptation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md).
- [Development accounts and client cutover](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#development-accounts-and-client-cutover).
- [Architecture picture and component costs](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#architecture-picture-and-component-costs).
- [Guarded local delivery — retained for transition and optional use](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#guarded-local-delivery--retained-for-transition-and-optional-use).
- [Presentation fidelity and early tooling baseline](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#presentation-fidelity-and-early-tooling-baseline).
- [GitHub demo release contract](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#github-demo-release-contract).
- [Current acceptance and transition gate](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-acceptance-and-transition-gate).
- [Bounded planning delivery and identity safeguards](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#bounded-planning-delivery-and-identity-safeguards).
- [M1–M9 iteration plan — 4 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m1m9-iteration-plan--4-october-2026).
- [M1 — Foundation closure and delivery safeguards](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m1--foundation-closure-and-delivery-safeguards).
- [Current M2 acceptance — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#current-m2-acceptance--8-october-2026).
- [M2 — Provider feasibility and account configuration](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m2--provider-feasibility-and-account-configuration).
- [M3 — Server foundation and customer identity](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m3--server-foundation-and-customer-identity).
- [M4 — Live availability and reliable booking creation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m4--live-availability-and-reliable-booking-creation).
- [M5 — Hosted payment and authoritative confirmation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m5--hosted-payment-and-authoritative-confirmation).
- [M6 — Complete the customer flow and release preparation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m6--complete-the-customer-flow-and-release-preparation).
- [M7 — Client testing and acceptance](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m7--client-testing-and-acceptance).
- [M8 — Production deployment and handover](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m8--production-deployment-and-handover).
- [M9 — Post deployment support and maintenance](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#m9--post-deployment-support-and-maintenance).
- [Planning scope coverage and support boundaries](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#planning-scope-coverage-and-support-boundaries).
- [Developer evidence campaign invariants — 8 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#developer-evidence-campaign-invariants--8-october-2026).
- [Experiment 1 — separate checkout scope exception, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#experiment-1--separate-checkout-scope-exception-9-october-2026).
- [Combined developer release packet — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#combined-developer-release-packet--9-october-2026).
- [Native adapter preparation boundary — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-adapter-preparation-boundary--9-october-2026).
- [Dynamic-data findings — current, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#dynamic-data-findings--current-9-october-2026).
- [Native discovery release boundary — current, 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#native-discovery-release-boundary--current-9-october-2026).
- [Main integration composition checkpoint — 9 October 2026](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#main-integration-composition-checkpoint--9-october-2026).
- [Resend source preparation — 9 October continuation](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f0f000c2f600be1930cacf0b2f884103cb23fba7/docs/SOCCERBOT_RULES_AND_ARCHITECTURE.md#resend-source-preparation--9-october-continuation).

</details>

### 26 October 2026 — deployment scaffold and account follow-up

Prepared target manifests, separate manual developer/client deployment workflows and target verification gates on the PR91 merged baseline. External vendor setup remains paused. The client manifest intentionally lacks unconfirmed IDs/origin/widget key and rejects activation; no resources, secrets, DNS, client repository or deployed state changed. Runtime account/database/coordinator validation now accepts explicit target identities while retaining immutable foundation checks. Developer identities are preserved. Legacy developer payment/provider runtime scope is not generalized to client live operation by this scaffold.

Owner reported email verification unavailable after all-device sign-out with Remember me selected, but proceeding when unticked. Root cause remains unconfirmed; added an isolated fresh-login/revoked-family regression without changing revocation or rate limits. Saved-contact management now returns to booking options only after successful save; failed/aborted saves remain guarded. Local component checks pass; full Worker/browser evidence remains CI-owned.

### 27 October 2026 — Client D1 created and primary placement verified

Owner explicitly requested assistant resource creation with deliberate placement. Rechecked the `soccerbot` connection against account `0b36822648e6905c681a90b6bec5ca7f` and confirmed its D1 inventory was empty before creation. Created `soccerbot-production-state`, ID `e2a21801-0107-4db5-8551-ca1ff338df53`, at `2026-10-27T03:21:42.867Z` (11:21:42 Singapore), using `primary_location_hint: apac` and read replication disabled. Cloudflare returned `created_in_region: APAC`.

The read-only `SELECT 1 AS placement_probe` returned `served_by_primary: true`, `served_by_region: APAC`, `served_by_colo: KIX`, `changed_db: false`, zero rows read/written and SQL duration 0.1929 ms. That duration is database execution time, not end-to-end application latency. KIX establishes the observed primary location in Osaka, Japan. Select `apac-ne` for the new coordinator first-use hint according to the placement strategy; it remains a best-effort request requiring actual DO execution evidence. No object has been initialized by this step. Current production call sites lack a hint; prepare and verify their common placement configuration before first use.

The public production target now records account/database IDs, while missing origin/sitekey and the existing closed-access guard continue to reject deployment. No application schema or foundation registration was written. Worker/DO creation must consume the reviewed application artifact after SaaS routing and placement changes pass required gates. Developer resources, DNS, email and provider accounts were unchanged.

### 27 October 2026 — Explicit coordinator first-use placement prepared

Added `coordinatorLocationHint` to sealed deployment targets and rendered `COORDINATOR_LOCATION_HINT` bindings. The client KIX primary selects `apac-ne`; developer staging keeps an empty hint and its original coordinator name/identity. Centralized all application HTTP, catalogue, operator, scheduler and webhook acquisitions in `worker/bindings.ts`. Production without a supported nonempty hint fails before object acquisition. Foundation identity derivation remains unchanged and does not acquire a stub. Source validation rejects direct production coordinator acquisition outside the binding owner.

Focused tests cover client placement on repeated acquisition, missing/invalid hint rejection before acquisition, unchanged developer selection, malformed-name rejection, artifact digest changes and source-rule rejection fixtures. These synthetic tests establish call/configuration behavior, not physical placement. Cloudflare first-use hints are best effort; actual namespace/object execution location must be observed after verified deployment, with no replacement of an existing identity.

Local placement preparation verification: 25 focused deployment/placement/source-rule checks and the full 448-case Worker suite passed, including strict inventory and zero failures/skips/cancellations/TODOs. Generated Worker types, source/policy checks and affected lint/format checks passed. Browser execution remains CI/owner-operated; final-commit CI, merge, application deployment and physical placement acceptance are pending.

### 27 October 2026 — SaaS Worker entry and delivery ownership preparation

Owner confirmed that the client repository must retain developer SimplyBook/Resend/Turnstile/payment sandbox connections for PR staging, with production provider secrets kept in the client Worker only when integrations are accepted. Grafana belongs to the owner's company central account, with separated environment ingestion credentials and labels. Prepared weekly grouped Dependabot version updates; account-level security updates/scanning remain unverified and automatic trusted PR deployment remains future work.

Client target now chooses the dedicated `soccerbotsg.win` SaaS zone and `https://booking.standardsoftwares.com` origin rather than a Pages project. Target generation seals the zone-scoped `*/*` route, disables Workers.dev/previews and runs the Worker before every asset. Deployment verifies the selected account owns the active zone, the active fallback has its declared proxied originless AAAA record, and no competing route would be replaced. After upload it verifies route ownership before health acceptance. It does not edit DNS or custom hostnames. Production static access rejects foreign or HTTP origins and unsafe methods; API authority and provider closures remain unchanged. The optional Pages adapter and its existing coverage remain intact.

121 affected local tests passed with zero failures/skips/cancellations/TODOs, plus Worker types, source/policy and affected lint/format checks. Initial new HEAD-body expectation failed and was corrected to HTTP HEAD semantics without changing application behavior or prior assertions. Full combined-revision CI, deployment and provider/browser acceptance remain pending; the prior placement-only CI pass does not certify this new candidate.

### 27 October 2026 — Dependency update grouping and action-pin ownership

Owner requested repair after the initial Dependabot PR failures. Routine groups now include minor/patch updates only, with coordinated tooling excluded and major upgrades proposed individually. CI policy no longer duplicates workflow action hashes; it still requires approved action identities, full commit pins, unchanged deployment commands/permissions and verified artifacts. TypeScript 7 migration is not included; source compiler API and lint compatibility require separate acceptance. PR94/95 original failure runs are retained in Progress. No dependency update, merge or deployment is authorized by this policy change alone.

### 27 October 2026 — Compatible dependency vulnerability remediation

Owner requested remediation after the dependency audit. Update Next.js and its lint configuration together, Zod, compatible transitive DOMPurify/Vite/Undici, and the Wrangler/Miniflare pair. The chosen Miniflare beta matches Wrangler's own dependency and provides patched Sharp/Undici; do not use the audit's suggested historical downgrade. Preserve the compiler/lint/browser baseline, strict source checks, test inventories and production closures. Progress owns package versions, audit snapshots and verification/deployment evidence. Known advisory clearance on a branch is distinct from deployment and provider acceptance. Full/code verification now runs a blocking high/critical dependency audit and retains its result; audit-service errors fail rather than silently skipping security checks.

### 27 October 2026 — Security updates and remediation integrated with dependency maintenance

Owner requested version updates, Dependabot alerts and security updates together. The YAML now explicitly separates scheduled version updates from minor/patch npm security-update grouping, preserving individual major/tooling fixes and existing CI/deployment authority. Repository-level Dependency graph, alerts and automatic security-update settings need separate confirmation in both repositories; configuration copying alone does not enable them. Current audit findings and activation evidence are owned by Progress, with the operational workflow in README. Failed compatibility gates require a reviewed fix or mitigation, not automatic advisory dismissal or weakened verification. No dependency upgrades are included in this configuration change.

### 28 October 2026 — Repository version inventory

Owner requested a standalone Versions file in the repository root. Generate `Versions.md` from toolchain declarations and the complete npm lock inventory, preserving nested paths and optional/development labels. Verification rejects stale documentation and emits observed tools with checkout revision and lock hash into existing evidence artifacts and Actions summaries. Configured Python series and observed patch version are distinct; verification inventory does not establish production deployment. No automated documentation commits or elevated workflow permissions are introduced.

### 28 October 2026 — Feature ownership diagrams and rule identifiers

Owner requested recursive Mermaid code-ownership diagrams and numbered business rules. `docs/code-owners.md` owns feature-to-file navigation and the rule-to-owner index; Part 1 retains rule authority with stable BR-001 through BR-032 identifiers for the existing rule groups. Existing rule text, heading anchors and milestone IDs are preserved. Implemented feature responsibility is distinct from test evidence and client deployment status. Demo adapters are identified only where current service composition selects them.

### 28 October 2026 — Role-based UAT preparation

Owner requested the external project role-worksheet format adapted to SoccerBot, explicitly including SimplyBook Admin operations and Trainer schedule entry. `docs/uat` provides only Admin, Trainers and Simulated-User worksheets with blank results and rule/owner references, following the owner’s scope correction. Shared instructions are embedded in each sheet; there is no UAT README or Owner sheet. Existing provider permissions and approved test accounts govern execution; no new staff portal, production transaction authority or acceptance result is introduced.

### 28 October 2026 — Operational runbook drafted

Owner requested dependency/observability guidance moved out of README and a complete runbook with Grafana signal interpretation and potential fixes. `docs/runbook.md` owns these procedures; source-derived event/panel dictionaries distinguish Tempo diagnostics from raw logs, sampled observations from traffic counts and prepared telemetry from activation. Source review also identifies current developer-only producer/service filtering and absent production environment labels. Operational alerts, restore objectives, provider recovery and client deployment acceptance remain evidence-dependent; no operational action was executed by drafting the runbook.

### 28 October 2026 — Agent instructions own task routing

Owner replaced the README-directory request with an enhancement to the existing agent document map. `Agents.md` is the canonical cased instruction owner and includes ordered task routes; The previous uppercase file is removed to preserve case-insensitive checkout compatibility; the local engineering skill points to `Agents.md`. README retains setup/configuration; no parallel Development guide remains.

The owner also requested the generated version inventory at `docs/versions.md`; its generator, freshness check, tests and current document links follow that path.

### 28 October 2026 — Standard agent filename restored

Owner confirmed standard `AGENTS.md` after reviewing automatic discovery behavior. Retained the enhanced task routes and restored this exact filename across current links, local skill, formatting commands and installer ownership checks. Only one case variant exists. This supersedes the earlier filename decision.

### 28 October 2026 — Continuous development guidance replaces root README

Owner requested removal of the root README and a guidance-only `docs/development.md` covering local VS Code, Codex Cloud and ZIP-attached chat development. Existing setup/verification/configuration content is retained there, with GitHub publication, CI expectations, safe archive integration and guarded delivery guidance. AGENTS remains authoritative; current links and formatting commands use the new guide.

### 28 October 2026 — Architecture decision records

Owner requested a separate PR replacing the architecture explanation with ADRs covering stack rationale, tradeoffs, scaling and alternatives. `docs/architecture/adr.md` distinguishes implemented choices, pending activation and proposed contingencies; reconstructed reasoning is not presented as historical comparative benchmarking. Topology remains in diagram.md and operational recovery remains in the runbook.

### 28 October 2026 — Business rules, operation contracts and journey split

Split the former service-contracts owner into three lowercase documents. Retain all BR IDs and milestone IDs; expand named operations with source status, policy, implementation and test owners using external project’s inventory structure. Document actual API routes, schemas, guards, effects and failure semantics. Place milestone overview and criteria before the complete role-based journey; retain prior dated history unchanged. Navigation and installer ownership follow the split. No runtime, provider configuration, deployment or acceptance claim changes.

### 28 October 2026 — Progress becomes the current-task handover

Replaced the accumulated Progress ledger with the detailed active documentation task, stacked PR/base and revision observations, completed checks, exact leave-off, unresolved PR112 browser evidence, ordered continuation and deferred client-deployment checkpoints. Current status belongs in Progress; milestones, complete flows and dated history belong here. The [prior Progress snapshot](https://github.com/LimYouSheng/SoccerBotStudioSG/blob/f40e8ef9a526df65b5861049e3cbe8068c40fc73/PROGRESS.md) preserves all earlier receipts and superseded status without duplicating this history. No runtime change or renewed provider/deployment authorization.

### 28 October 2026 — API contract filename standardized

Renamed the combined domain operation inventory and HTTP contract owner to `api-contracts.md` at the owner’s request. Updated document links, Progress handover and installer planning requirements; contract content and runtime behavior are unchanged.

### 28 October 2026 — Documentation stack merge begins

Owner authorized merge when eligible. PR111 merged as `cb33dec4102d2b9cb4a3219c920d99046483840e` after all three final-head checks passed. PR112 was retargeted to main; GitHub reported it behind, so main was merged into its branch and that update carried into PR113 without content conflicts. Remaining merges await checks on the refreshed heads; no bypass or automatic production activation was performed. Progress owns the next merge/handover checkpoint.

### 28 October 2026 — Security infrastructure documented

Added security.md with a top-level Mermaid trust-boundary diagram, asset/threat map, identity/access, environment validation, financial effects/recovery, webhook/provider boundaries, token/data controls, bounded availability, supply-chain protections and observability/operator responsibilities. Current source controls are distinguished from pending client/domain/Grafana/MFA/restore acceptance and proposed future layers. A prioritized adoption matrix records rationale and acceptance evidence. Linked from AGENTS and the Runbook; no security setting, credential, runtime or provider state changed.

### 28 October 2026 — Status, API examples and operational readiness expanded

Reconciled business-rule checkpoints with actual source/recorded evidence: selected client Worker hosting does not require Pages; placement hints are implemented in validated configuration/binding source but actual DO location acceptance is pending; developer dependency-security settings were owner-confirmed. Added fictional API examples and cross-operation state interpretation without weakening authority/recovery rules. Runbook now provides proposed alert thresholds, source prerequisites, routing acceptance, draft RPO/RTO, isolated restore steps, stop conditions and a blank evidence record. Owner requested leaving alert responders and destinations unassigned. No alert, credential, provider or restore operation was executed.

Owner reported DNS settings/nameserver/record-pointing rights, then confirmed `soccerbotsg.com`: vendor supplied “PP unlock” and email records, with transfer not yet performed. Registrar/account, meaning of the unlock and actual authoritative DNS editing rights remain unverified. This records access information, not a completed transfer/DNS change or an approved nameserver migration; no transfer code is stored here.

### 28 October 2026 — PR114 concurrent response lifetime repair

Preserved failure run 40659464431/job 122718693323: competing-customer checkout test tried to parse an already-consumed response. A minimal Miniflare/Undici forced-GC experiment reproduced cancellation of the original response’s shared unread stream before caller consumption. Changed three concurrent checkout tests to consume each response as it arrives before joining results; retained original HTTP/booking/financial assertions, concurrency and timeouts. No runtime or provider behavior changed. All three affected tests passed together and the immediate-consumption GC comparison passed; source/Worker checks, lint and formatting passed. Final-head CI remains required.

### 28 October 2026 — PR115 dismissal readiness synchronized

Retained run 40665671472 and artifact 12806647325. Static trace inspection showed automatic payment recovery/browser polling consumed most of the dismissal scenario’s 30-second budget: visible confirmation at 24.61 seconds, explicit retry at 27.86 seconds, timeout before return-navigation assertions. Closed-connection cleanup errors followed the timeout; underlying runner/storage latency remains unproven. Dismissal now awaits the real automatic recovery-completion event before browser navigation, asserting its complete outcome. Existing recovery journey and every dismissal assertion remain; no retries, sleeps, extended timeout or application change. A new isolated Worker regression passed, verifying committed confirmation, repeated dismissal, retained receipt and single financial effects. Final-head browser CI remains required.

### 28 October 2026 — Documentation stack merged and developer main verified

PR113 merged as `28333129b94e2b6a728724e5c19f602125d951e1`, PR114 as `f176954c88a47419baa1a034255c8745a11e88cf`, and PR115 as `dffb24a12aae68de4ee32d6e7477bf227b3f0c50`. PR115 initially omitted its new Worker regression from the strict inventory: run 40669492573 passed all 450 runtime tests but failed inventory comparison. The missing entry was added without weakening the guard. Final PR run 40681775555 and [merged main run 40684219386](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40684219386) passed; main frontend and Cloudflare deployment jobs also passed. The completed stack left no open PRs or pending CI at the checkpoint. This is developer-deployment evidence, not client production activation.

#### Retained PR112 tablet WebKit failure evidence

[Original run 40652609843](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40652609843), revision `1b25b892165934282479e3676d4456d2a3403045`: frontend and live-email passed; backend browser verification had 73 passes and two failures. Preserve [backend evidence artifact 12801265051](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40652609843/artifacts/12801265051), named `backend-evidence-40652609843-1`.

1. `tests/experiment.spec.ts` — “synthetic paid but invalid booking needs recovery instead of claiming success”: Open checkout was visible, but `.booking-flow-overlay` intercepted clicks until the 30-second test timeout.
2. Same file — “synthetic access revocation hides protected details and stops checking”: preparation timed out waiting for `/api/attempts/:id/checkout`.

Root cause is **not established**. Inspection owners: [experiment tests](../tests/experiment.spec.ts), [loading provider](../src/features/booking/booking-loading.tsx), [protected confirmation](../src/features/booking/protected-confirmation.tsx), [checking lifecycle](../src/features/booking/confirmation-checking.ts), and [preview server](../scripts/serve-export.mjs). No runtime repair, forced click, longer timeout, retry or weakened assertion was applied. A later green run would not by itself explain the original failure.

### 28 October 2026 — Current ownership plan and technical behavior reconciled

Owner requested reconciling stale Progress/hosting statements and completing the function-level behavior documentation. Current plan is `soccerbotsg.com` registrar transfer first, then client-managed Cloudflare DNS; neither transfer nor delegation is verified complete. The earlier vendor-retained DNS/SaaS assumption is superseded as an ownership decision, while the actual closed SaaS target remains unchanged pending reviewed reassessment. Updated architecture/security/rules/runbook/UAT and the current Journey overview; historical entries remain historical.

Moved the feature map to `docs/code-owners/index.md`, preserved its diagrams and BR mapping, and added `technical-behavior.md` for named feature functions, guards, failures, recovery, diagrams and evidence. Screenshot capture is explicitly pending owner/CI; no screenshots, provider effects or DNS/registrar actions were performed. Progress now records the completed stack and this new documentation task separately.

### 28 October 2026 — Source-based data lifecycle draft

Owner requested documenting actual application behavior before mapping the client’s pending PDPA/privacy clauses. Added [data lifecycle](data-lifecycle.md) with a diagram, browser/D1/DO/provider/log/backup inventory, implemented validity and narrow cleanup behavior, retained-data gaps, clause worksheet and proposed implementation gates. Inspected 35 migrations in empty in-memory SQLite and source paths only; no deployed records or account retention settings were queried. Expiry/revocation and active-grant archival are distinguished from deletion; retention preview remains disabled for cleanup. Corrected the security overview’s public snapshot storage to Durable Objects and linked the owning document from AGENTS/runbook/security. No retention periods approved, cleanup implemented or provider/runtime changes made. Policy mapping and external-account verification remain pending.

### 28 October 2026 — PR116 checking-budget test initialization repair

[Run 40706485933](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40706485933), revision `b137a79`, passed frontend/live-email but failed one of 75 backend browser cases: phone WebKit “reload and duplicate tabs retain one checking window with a shared server allowance” read a null initial budget and threw at `budget.deadline`. Preserve [backend artifact 12825031736](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40706485933/artifacts/12825031736). The link-visible setup did not synchronize with the checking hook’s later effect that saves localStorage. The test now arms a first-confirmation-request listener before setup; that request follows budget persistence. It validates the attempt and numeric deadline before reloading. Existing cross-reload/tab deadline and server allowance assertions remain unchanged; no retry, sleep, forced click, timeout increase or runtime modification. Browser validation belongs to CI. PR117’s later run 40714296582 passed all three gates with unchanged application/test code; that pass does not repair PR116’s race or replace its own final-head checks.

### 29 October 2026 — Repair recovery sequence diagram syntax

The section 7 note in [technical behavior](code-owners/technical-behavior.md#7-recovery-confirmation-exports-and-completed-exit) contained a literal semicolon, which Mermaid interpreted as a sequence statement separator. Reproduced the original parse failure with a temporary Mermaid 11 installation outside the repository, then confirmed the comma replacement parses. Diagram meaning, operations and application behavior are unchanged. No browser rendering or repository dependency change was performed.

### 29 October 2026 — Campaign operating guide and repository-wide rendering audit

Adapted the user-supplied the supplied external reference into [North Star](../NORTH_STAR.md), retaining scoped campaigns, bounded evidence-driven iterations, budgets, completion states and handover. Replaced external project/AWS/PostgreSQL-specific assumptions with SoccerBot owners, actual workflow limits, isolated Worker storage evidence and owner/CI browser/provider boundaries. AGENTS retains authority; Progress owns the active outcome. No scheduler, background agent, permissions or CI behavior was added.

Inspected all 18 tracked Markdown files: all 30 Mermaid diagrams pass parsing after the section 7 repair. Markdown structure and local-link checks accompany this audit; these are syntax checks, not owner-side GitHub visual acceptance. Temporary parser dependencies remain outside the repository.

### 29 October 2026 — per-slot trainer choice and grouped trainer cards

Owner explicitly chose independent trainer selection for every slot while retaining one booking per time across the studio. Subsequent direction specifies a dropdown in the time slot and trainer cards below the right-hand summary, grouping multiple times under the same trainer and stacking different trainers. Availability now retains simultaneous trainer alternatives; selections still forbid overlapping sessions. Ongoing customer grants allow selected eligible trainers; finite non-overlapping trial contracts retain their old guard. Shared SimplyBook capacity remains an owner-configured prerequisite, not proven by UI options or a serialized Worker queue.

Test impact includes dropdown selection/change/removal/restoration, trainer-card grouping, duplicate-offer rejection, immutable trainer identities, multi-trainer batch restoration and cross-trainer studio conflicts using intercepted synthetic providers. First local failures identified obsolete single-offer demo expectations, a new test expecting the wrong existing conflict status (`late`), and a prebooking test missing its required contact-mode fixture. Those fixtures/assertions were corrected without changing application failure semantics. The source audit also rejected local font sizes; the new controls now use existing typography tokens. Full isolated Worker verification passed 454 cases. All frontend/code stages passed, but its initial receipt correctly refused documentation changes during verification; unchanged-source verification is required before publication. Current verification and delivery state remain in [Progress](../PROGRESS.md); no live provider acceptance is implied.

### 29 October 2026 — Documentation reconciliation skill and PR118 checkpoint

PR118 merged as `3c39f882d1106185bda10227a21784cafc357e1d` after final-head run 40804424347 passed frontend/backend/live-email. Main run 40811741772 was still in progress at this task's inspection: frontend/backend and frontend deployment passed; live-email was running and Cloudflare deployment unconfirmed. Earlier parser failure and correction evidence remain retained.

Adapted the requested the supplied external reference into [SoccerBot's local skill](../.agents/skills/soccerbot-documentation/SKILL.md). AGENTS explicitly invokes it for all PRs and delivery-state changes. The procedure covers owner impact, validation, exact evidence, concise PR receipts and status reconciliation without recursive status-only commits. SoccerBot's UAT paths, source contracts, isolated Worker tests, three gates and owner/CI browser restrictions replace project-specific assumptions. No runtime, dependency, workflow, provider or permissions change; no unattended enforcement is claimed.

### 29 October 2026 — Test-maintenance skill added to PR119

Owner requested an explicit procedure to prevent test maintenance being missed across PRs. Added [soccerbot-testing](../.agents/skills/soccerbot-testing/SKILL.md), invoked by AGENTS alongside documentation reconciliation. It maps full PR behavior to assertions/fixtures and frontend/browser or Worker inventories, requires add/update/retain/retire dispositions, independent expected outcomes, relevant negative/concurrency/recovery coverage, evidence-driven race diagnosis and a concise PR test-impact receipt. No blanket test additions, weakened assertions, inventory reductions, rerun-until-green or new external/browser authority. This is agent/reviewer guidance, not an automated enforcement hook. For this procedure-only change, existing executable tests, fixtures and inventories remain unchanged with a documented rationale; existing coverage has not been comprehensively re-audited.

### 29 October 2026 — Reconcile PR119 after trainer selection and spacing

Reconciled the documentation/test-maintenance procedures with main `9938fdd` (PR121), retaining PR120 trainer functionality, PR121 presentation and all current test inventories. Earlier PR119 CI passed at `4cb7bdd`; the merge reconciliation creates a new revision requiring its own complete gates. The owner authorized reconciliation and merge once green. Progress now records the merged trainer changes and the separately authorized, read-back-verified SimplyBook test schedules; no runtime or provider mutation is included in this PR. Local link, format, source/policy and diff checks accompany the revised handover; final CI, merge and subsequent main deployment are separate receipts.

### 30 October 2026 — PR4 storage evidence and backend disk exhaustion

PR4 head `4971c4f366762a8856ac9cd68d14ece1e6d95f10`, run [41009857773](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41009857773), passed frontend, Worker/runtime and all 84 live-email cases (10.8 minutes). The earlier failing price-drift case's runtime initialization improved from 9.42 seconds to 0.50 seconds with `/tmp` tmpfs; this is encouraging case-level evidence, not proof of whole-suite speedup or the sole cause of historical failures.

Backend job 123917861105 failed with `SQLITE_FULL` followed immediately by the GitHub runner failing to write its own log with `No space left on device`. Its saved artifact 12957803459 is 2,561,347 bytes uncompressed; its restored npm cache was roughly 253 MB compressed. The original runner was torn down without disk usage measurements, so the specific consumer remains unknown. Client Cloudflare D1 capacity is not implicated by these local CI errors.

Retained tmpfs only for live-email. Added numeric per-test filesystem bytes/inodes and backend before-setup/before-browser/after-browser directory and filesystem diagnostics, with post-browser output attempted even after failure. No deletion, reduced assertions/inventories, retry or deadline relaxation. Extended the existing resource-evidence regression for zero capacity, inode and missing-filesystem values without exposing arbitrary contents. Progress and Development own the updated checkpoint and diagnostic contract; application/API/security/data-lifecycle/UAT/version owners are unchanged. Focused checks accompany the diagnostic candidate; CI, PR4 merge and independent main acceptance remain pending.

### 30 October 2026 — PR4 merge, repeated main disk failure and browser-lifetime evidence

Owner approved PR4 merge as `5637bc9fa9b75259b00075acecb56f837352206c` after all four gates passed run 41013267782 at `07c6e2c90a1c1e896b9f1855e6dbdeff920d4d43`. Independent main run 41017685933 again failed backend (job 123942861745, artifact 12961222544), while frontend, Worker/runtime and live-email passed. Disk free space fell from 9.0 GB to 24 MB; inodes remained plentiful. Small temporary/build/artifact directories and stable measured caches did not account for the loss.

Per-test filesystem evidence stayed around 8.7 GiB free during Chromium, dropped to 2.69 GiB during phone WebKit, recovered to 8.71 GiB at the phone/tablet boundary, then exhausted during tablet WebKit. This supports browser-lifetime allocations as the next hypothesis, not a proven deleted-file diagnosis. Owner requested CI reliability and efficiency optimization; preserve complete inventories/devices/gates and require both exact-final-head PR and independent main receipts.

Prepared bounded unlinked descriptor/mapping inspection at material disk changes, deduplicated by device/inode with allocated-byte and filesystem-type measurements. It emits only allowlisted process categories and numeric metadata, never file contents, paths or command lines, and marks inaccessible/truncated scans. Expanded bounded size snapshots to the whole checkout and previously unmeasured container roots; inspect core-dump settings without modifying them. Retained live-email tmpfs and all test semantics. Existing evidence regression now verifies a real unlinked-file allocation and duplicate-descriptor accounting. Eight focused tests passed; other source checks accompany publication. Diagnosis, CI and a scoped repair remain pending; no production deployment or provider acceptance is claimed.

### 30 October 2026 — Bounded browser batches and concurrent runner shards

PR5's diagnostic head `ff40ef7ccf32c70c546c9ab73fb73e01ea74ce13` passed run 41021290101 with all 454 Worker, 78 backend-browser and 84 live-email cases, but backend still consumed roughly 6.2 GB and `/proc` mappings were partly inaccessible. This did not repair the earlier disk failure or prove its allocation source. Owner requested sharding and bounded browser lifetime, retaining all coverage and exact-artifact deployment.

Prepared one build per root release configuration, two independent runner shards per configuration, and 42 disjoint fresh-process batches accepting one or two complete cases each. Shards run alongside Worker verification; final named backend/live-email gates wait for all dependencies, reject missing/duplicate/foreign/mixed-attempt evidence and validate the complete device/case inventory before packaging the identical downloaded export. Frontend's separate project-path build retains combined code/browser verification through sequential fresh-process batches. No timeout/retry/assertion/device reduction; in-test recovery/reload/multi-tab behavior remains intact. Existing live-email tmpfs stays scoped to its shard containers. Per-batch pre/post-process storage receipts measure whether teardown releases space; the underlying upstream allocation remains unresolved.

Extended workflow/provenance regressions and added synthetic aggregation tests across both full inventories, including absent/duplicate batches/cases, oversize, skips, retries, changed builds and mixed attempts. Tooling passed 164 tests; focused final refinements and source checks accompany publication. Development, ADR-007, Security, Runbook, Progress and the factual campaign budget document the new execution/evidence boundary. Application/provider/API/data-lifecycle/UAT/version behavior is unchanged. Final-head CI, merge authorization, independent main and deployment/provider acceptance remain pending. Future GitHub writes use developer `LimYouSheng`, while the client organization remains repository owner.

### 30 October 2026 — Main verification, core-memory containment and deployment eligibility

PR5 merged as `6461333e6bacc68a7833f1c2e0c6386f1478e5c7`; independent main run 41029098361 passed all ten jobs in roughly 18m10s, but sampled free space reached 0.059 GiB frontend, 2.650 GiB backend and 2.886 GiB live-email. Earlier claims of storage containment therefore remain limited to their observed run. Production stayed disabled; staging attempts 41024136843/41028108011 rejected the then-draft PR before deployment.

Owner requested completion of storage repair, clean deployment exclusions, verified client-repository staging and closed client bootstrap. Retained runtime evidence showed unlimited core size and a host systemd-coredump pipe. Retrieved Linux `Documentation/filesystems/proc.rst` section 3.4 confirms process memory filtering and child inheritance. Candidate sets only the CI browser parent process's coredump_filter to zero, validates application and child inheritance, and retains crash statuses, all test semantics and Playwright evidence. Full memory cores are excluded; global host settings and prior evidence remain untouched. This is a scoped mitigation requiring exact-head measurement, not proof of the underlying crash cause.

Added credential-free trusted-main deployment eligibility, treating expected automatic PR exclusions as skipped while preserving complete candidate checks before deployment. Manual invalid candidates and incorrect revisions/accounts are not accepted. Tests retain all prior rejection cases and verify core filter failures/disabled local behavior. Tooling passed 165 tests; source checks accompany publication; CI, staging, merge/main and bootstrap acceptance are pending.

Read-only account inspection confirmed existing client D1 `e2a21801-0107-4db5-8551-ca1ff338df53` with no tables, no Worker/DO namespaces and Workers subdomain `lucky-poetry-b25e`. Billing OAuth read was unsupported; no subscription change attempted. Staging Access is not enabled; Workers.dev remains enabled and previews disabled. Owner made the developer repository private; this was verified, but it does not gate staging. Owner was asked to disable the legacy Verify workflow because variable/workflow management is unavailable through connected tools and shell API access is denied. Preserve test 507. Runbook records the closed bootstrap/resource and staging-exposure boundaries; Development/Security describe the executable changes. Application/API/provider/data-lifecycle/UAT/version behavior is unchanged.

### 30 October 2026 — Deliberate Worker groups after verified storage containment

PR6 merged as `23d64aec64650e9b817d59a5d0957e428b19349e`. PR run 41034336627 and main 41039538712 passed all ten jobs. Main retained 78/78/84 browser cases and sampled minimum free disk of 8.589/8.742/8.907 GiB, versus earlier near-full main evidence; all 732 samples confirmed the zero core-memory filter. Client-repository staging deployment 41036494066 installed `9148e2a` as Worker version `de4005c9-d110-4a3a-bbeb-6075b932ee50`. Production remained disabled; owner confirmed the old developer Verify workflow disabled, preserving 507.

Owner paused deployment to review isolation, sustained journeys/concurrency and restart evidence, then requested clearer grouping and deliberate sharding. The source audit found good isolated booking fixtures and genuine persisted runtime restarts, but legacy suite-shared runtime/native/foundation/identity fixtures remain; DO eviction and helper reconstruction are not whole-runtime crash evidence. The new scheduler groups complete suites as contracts, sustained and recovery, with 109/181/164 unchanged cases and load smoke in sustained. Two suite processes per group bound contention without splitting scenario steps. File/title inventory conversion preserves every previous title in order. The stable Worker gate validates all group TAP and exact source/target/repository/run/attempt identities before release consumers proceed. Local checks and final-head CI are recorded in the PR receipt; grouping performance and deployment are not claimed from source alone.

### 30 October 2026 — Closed bootstrap health and retained client resources

PR7 merged as `54ee49aa558d6b8825b0b2f3c65044d6602c8adf`; independent main 41055120073 passed. Owner resumed production bootstrap. Run 41058572295 applied 35 migrations to existing client D1 and installed Worker version `16e561b7-143f-4a8e-80d8-dbc12e3badd9` with DO namespace `8420d1cf21eb4af996ecc06adbd6bef4`. It failed on immediate health HTTP 404; owner later observed application `environment_unavailable`. The initial routing cause remains unconfirmed. Read-only API inspection confirmed no foundation row, D1 primary KIX/Osaka metadata, no explicit Worker placement and zero listed DO objects; `apac-ne` is a retained first-use hint, not proved object placement.

Exact deployed artifact in an isolated runtime reproduced missing-foundation 503 and locally registered 200 with zero outbound requests; the old health label also always said developer. Owner authorized repair. Read-only closed-production health now reports explicit pending registration without claiming the database, creating a coordinator or granting protected access; existing foreign identity and any enabled effect switch fail. Deployment requires the configured environment and explicit registration state and records that state. Three fresh-runtime regression cases extend Worker inventory to 457; protected operation and immutability assertions remain. No production storage mutation, recreation or HTTP-error retry was introduced. Full CI, staging/main deployment and separate registration/activation remain acceptance steps in the PR receipt.

### 30 October 2026 — closed-install foundation management prepared

Following the production health failure and PR8, the owner authorized the careful registration plan. Added an internal service-binding management entrypoint and sealed-artifact/control-plane checked command with separate inspection, insert-only registration and hinted initialization. Inspection derives a real namespace ID without creating the object. Matching repeats/concurrent requests preserve one immutable registration; foreign state fails. Initialization checks alarms/wakeups without provider transport and does not claim physical location. Added isolated sustained runtime tests, including full-runtime restart with durable storage retained, and tooling receipt/lost-acknowledgement tests. Inventory grows from 457 to 461 without removing prior cases. Initial local RPC-proxy assertion/serialization failures were retained and corrected with explicit field handling. No client registration, object initialization, new resource, provider action or placement acceptance occurred during source preparation. CI, merge, cloud transport and installation acceptance remain separate checkpoints.

Local validation completed: foundation 17/17, tooling 173/173 and affected type/lint/source/policy/format checks passed. A missing-variable fixture initially supplied unsupported JavaScript `undefined` to Miniflare; it now omits that binding, preserving the intended fail-closed assertion. The restart test captures primitive identity values before disposing the old RPC runtime. PR8 CI41061444056 passed all 13 jobs; staging41063448713 was running at this checkpoint.

### 30 October 2026 — production deployed; management execution bridge prepared

PR8 and PR9 merged as6f5b595 and b1c007a. Independent main CI41067934442 passed. The older PR8 production candidate was correctly rejected after main advanced. Production41070141827 attempt1 failed before Worker upload at Cloudflare assets-upload-session (10013); one failed-job rerun passed with unchanged code/configuration/artifact, consistent with a transient upload-service failure. Active version7fbbd68c-9970-41c6-b8eb-911a13db07b0 serves b1c007a at100%; closed health passed, foundation remains empty, and DO placement remains unverified.

The owner authorized inspection, registration and initialization. Workspace inspection found only the developer-scoped Cloudflare credential; client-settings authentication returned403/10000 before any write. Added a manual setup operation to the existing release workflow using its existing client secret and shared production lock, avoiding token copying or new public management endpoints. The operation consumes current-main verified evidence, performs all three phases in order and checks final registered/closed health; automatic deployments are unchanged. Focused workflow/registration/deployment tests passed24/24; full tooling passed177/177, lint/source/policy checks passed, and the exact deployed sealed artifact validated against the client target. Exact-head CI remains pending publication. Cloud setup still requires reviewed merge, deployment and an owner dispatch because connected GitHub tools lack workflow dispatch. No registration or initialization was performed during preparation.

### 31 October 2026 — verified client foundation, Osaka execution and provider-rule reconciliation

PR10 merged as 21c3f16eb0e31ede252bbc08e809584cb4371e0d; main verification 41081622665 and production deployment 41083613159 passed. Setup 41084843753 registered the retained client D1/coordinator identity and initialized the named object with apac-ne. The initially empty object-list response later contained the matching coordinator with stored data. Attempt 2 repeated the guarded setup successfully while native tracing was temporarily enabled. At 00:07:57 SGT trace eb3b9672b2663f6dc31fc7c8a3c4a482, RPC span bf047c6b8eec0c4f, associated inspectFoundation and coordinator c8a6f33d2f0f3d6b32a8a51ae9f74459a87692feb73c765ac4c5219a09783cd0 with cloudflare.colo KIX. This is direct observed Osaka coordinator execution, independent of D1 primary KIX metadata. Original tracing settings were restored; customer/provider access stayed disabled. No permanent placement or Grafana activation is claimed.

Owner confirmed soccerbotadmin as the client SimplyBook company and superseded earlier staging admin-exemption evidence: both environments have one simultaneous booking account-wide, without an admin override. Weekly trainer days off are intentional; date-specific entries supply availability. Read-only inspection found two services (3/S$108 and 4/S$128), 40-minute sessions plus 10-minute buffer, five trainers linked to both services, and noon–8pm company/service hours daily. Service-day pricing, actual date-specific schedules, cutoff/invoice timeout, credentials and production provider/payment adaptation remain pending. No provider settings or live bookings were changed.

Reconciled Progress, runbook, business rules and Admin/Trainer UAT masters; renamed the development-guide environment to Cloud Containers. Test impact: retain executable synthetic suites and strict inventories unchanged; update manual capacity checks to require admin rejection and scheduling checks to preserve weekly days off. Automated CI cannot establish SimplyBook configuration enforcement; owner/provider UAT remains unperformed. Historical failures and earlier settings are retained as dated evidence.

### 31 October 2026 — owner-authorized pre-opening trainer availability

Owner approved mock availability in client company soccerbotadmin for all five existing trainers (IDs2–6),3–21 November2026 inclusive, noon–8pm Singapore time, with no breaks. Five date-specific update requests covering95 trainer-date entries returned success. Existing matching entries were not counted as newly created. Readback checked21 November for every trainer; exhaustive intermediate-date verification remains unperformed. No weekly schedule, service, booking, payment or notification was changed. Every write excluded22 November onward. A subsequent read found existing noon–8pm availability on22 November for all five; those opening-day entries were preserved, not created by this operation.

Draft PR11 run41153806593 exposed a separate Payment preview test date-boundary failure in both backend browser shards across three devices: the test selects tomorrow (1 November) without advancing from October. Worker groups passed. Original failure logs/artifacts are retained; no blind rerun or timeout increase was performed.

### 31 October 2026 — PR11 deterministic Payment preview calendar fixture

Run 41153806593 failed the same retention test on three devices while waiting for 1 November from the October calendar. The test used the host date to select tomorrow without changing the displayed month. Scope expanded within PR11: pin the browser calendar to 5 October and select 6 October, then restore real wall time before server-backed synthetic checkout. Preserve all selection/contact equality assertions, timeouts and inventory titles. Existing customer-suite month/year boundary tests remain in place. No application behavior, provider records or CI retry policy changed. Local static checks are separate from the required new exact-head browser CI.

### 31 October 2026 — client pricing preparation and growing trainer rosters

PR11 merged at e3f2301f17673cca85bd990003b9891048ff909d after final-head run41155626100 passed; independent main41157066046 and production deployment41158088719 passed with operations closed. Original calendar-boundary failure41153806593 remains retained evidence. Owner confirmed final client prices S$108/S$128, four-hour booking notice and a 15-minute unpaid provider invoice timeout. Timeline reads sampled all five trainers on 3 November/service3 and21 November/service4: nine starts,12:00–18:40 every50minutes; no schedule changes followed these reads.

Owner confirmed client Resend ownership; domain soccerbotsg.com was created sending-only in Tokyo with tracking disabled. Intended sender contact@soccerbotsg.com; DNS verification is paused because owner lacks authoritative access. No DNS or email send occurred. HitPay merchant/bank setup is not configured; owner will conduct guest acceptance later.

Source inspection found a three-provider calendar cap and a separate100-offer daily DTO cap. At owner request, branch feat/client-provider-configuration prepares environment-specific pricing and full-roster reads with explicit request, response and freshness budgets. Two ongoing read lanes retain serialized admission and existing account controls; missing trainer/date responses fail rather than silently shortening the list. Cache isolation, shared reads and invalidation fences remain. Twenty-trainer synthetic coverage verifies180 choices/day and60 range calls/month. Added tests/inventories retain existing capacity/payment recovery coverage. Focused checks and publication evidence belong to the active Progress checkpoint and PR receipt; no production provider activation or real payment acceptance is claimed.

Focused final checks for the growing-roster slice:52/52 pricing and booking-service assertions and43/43 Worker catalogue assertions passed. Added admission coverage proves300ms spacing and budget rejection with controlled timers. Source/policy, Worker boundaries/types and changed-code lint passed after rewording a comment caught by the existing blanket unsafe-type regex; no checker was weakened. Full frontend/backend/live-email CI, merge and deployment remain separate pending evidence.

### 31 October 2026 — PR12 dependent-guard failure and testing-skill correction

Run41164857960 at3f87d2a1777f51f872b96a9a5ed81f734e57a598 exposed incomplete test-maintenance work. Frontend job124430111549 failed worker-groups tooling: expected461total/109contracts cases were stale after four additions, and the old109-to108 pass-count mutation no longer altered its fixture. Contracts job124430111546 passed all113runtime cases but the ordered TAP validator rejected the appended inventory positions. Original artifact13028607374 is retained. Sustained/recovery groups and both backend browser shards passed in that run; complete new-head CI remains separate.

The repair preserves every case and strict ordered validation: four inventory entries move to declaration order, reviewed totals become465(113contracts/188sustained/164recovery), malformed-count fixtures derive the mutation from fixture size and must differ from valid input, and a literal declaration-order regression catches this mismatch before runtime. That regression failed against the original inventory. Replaying the same captured CI TAP failed before and passed after the order-only repair. At the owner's request, the repository testing skill now requires reviewing all dependent counts, order, schemas, fixtures, shard/aggregate/report/release guards and verifying wrappers or retained evidence, with specific evidence in each PR. No application assertions, runtime protections or test cases were weakened or removed.

Repair validation:178/178 tooling checks and7/7 focused shard/group checks passed, including original-failure reproduction and corrected CI-log replay. All four original browser shards and sustained/recovery Worker groups finished successfully; the original aggregate gates remained skipped. New final-head CI is required after publication.

### 31 October 2026 — client credential installation checkpoint

PR12 head0cfc27d9b58ac597f2ad4ef53d421d7d70782b86 passed all13 verification jobs in41166049859, then owner-authorized staging deployment41167107951 attempt2 passed. Production was skipped; PR remains unmerged. Owner requested consolidating remaining configuration before spending another full CI round.

Owner privately installed the five SIMPLYBOOK_PROD credential bindings and TURNSTILE_SECRET_KEY on soccerbot-production. Names-only readback confirmed all six. The client Turnstile widget's public configuration matches the Workers.dev hostname in managed mode. No secret value, authentication success, signature validation or browser acceptance was inferred from presence. The current source still needs production credential/service integration. API User Key expiry was described as five years; exact date and renewal responsibility remain pending, with no reminder created. HitPay merchant setup and Resend/DNS remain blocked or paused as previously recorded. No customer/provider operations were activated.

### 31 October 2026 — Local client credential and service wiring

Prepared the uncommitted PR12 follow-up without pushing or consuming Actions minutes. Validated environment selects SimplyBook DEV/PROD credentials, company and signing keys with no cross-environment fallback; production company must match its sealed target mapping. Client service3/4 mapping is carried through rendering, calendar selection and artifact validation. Native grants, production payments and identity delivery remain closed/pending. Turnstile wiring now matches the owner-installed production `TURNSTILE_SECRET_KEY`, retaining staging `TURNSTILE_SECRET`. This is configuration support, not real credential authentication, bot acceptance or client activation.

Initial checks caught generated Env's developer literal narrowing and the cache isolation fixture's invented environment name. Validated parsing resolves the type check; a valid production scope with matching synthetic credential contents now verifies developer ciphertext remains unusable across environments. Original failure retained in `/tmp/soccerbot-config-contracts.log`. Final local checks:179 tooling tests; strict contracts115, sustained188 plus load smoke, recovery164 all passed (467 Worker cases), with source/layer/types/policy and changed-code lint passing. Runtime source fingerprint `a8ce2de4d941a373af19f488a3ab30e67367283fff8eb2448f21e90a2c7fb0b2`; documentation reconciled afterward. Added credential/mapping assertions and artifact substitutions; retained existing journey, restart, identity and webhook tests. Inventories/order and dependent group totals updated together; no removed cases. Both repository documentation and test-maintenance procedures applied. Development, API contracts, security, technical behavior, runbook and Progress were reconciled; no changes to topology, migrations, retention, UAT requirements or engineering authority were needed. Full final-head CI, merge/deployment and provider/browser acceptance remain separate and unperformed for this follow-up.

### 31 October 2026 — Reuse app404 sandbox for client setup

Owner chose the existing app404 HitPay sandbox instead of creating a client-owned sandbox. Names-only client Worker readback retained the six SimplyBook/Turnstile secrets and found no HitPay API key or webhook salt. Prepared owner installation instructions for sandbox secrets only, with production customer/payment access closed. Existing developer staging, webhook configuration and historical payment authority remain unchanged; no financial/provider calls occurred. Live merchant ownership/readiness and reviewed production sandbox integration remain outstanding.

31 October follow-up: owner reported saving the app404 sandbox API key and webhook salt on soccerbot-production. Names-only Cloudflare readback confirmed HITPAY_SANDBOX_API_KEY and HITPAY_WEBHOOK_SALT, bringing the client Worker to eight secret bindings. Values were not inspected; no authentication, signature acceptance, payment request or webhook setup was performed. Existing production contract guards remain closed; reviewed client-company sandbox integration is the next engineering step.

### 31 October 2026 — Client guest sandbox scope implementation

Following owner authorization to reuse app404 sandbox, prepared a local extension supporting client company/service credentials and pricing while retaining production identity in native grant, catalogue, journal, payment and confirmation records. Explicit client sandbox access requires the reviewed company and merchant/business pairing. Production targets still render that switch disabled, and artifact validation rejects activation/substitution. HitPay transport remains sandbox-only; developer finite tools, staging history and identity-email restrictions remain unchanged. Payment, booking and invoice effects were exercised only through intercepted synthetic providers. Actual client SimplyBook acceptance, webhook setup, live merchant readiness and deployment remain pending.

New tests cover scoped client guest duplicate holds, one payment request despite repeat payment calls, paid recovery/receipt and foreign/disabled no-dispatch rejection, plus contract and artifact mutations. Preserved all earlier cases and updated strict Worker inventory to470 (116/190/164). Original focused failures exposed incorrect new test assumptions about combined-checkout replay and guest-cookie creation; corrected the fixture to use the established hold-replay scenario and exact booking rejection guard without loosening existing tests. Logs remain `/tmp/soccerbot-client-sandbox-focused*.log`. Both repository skills applied; affected owners are Progress, Journey, Development, API contracts, Security, Runbook and Technical behavior. Architecture topology, retention/migrations, UAT requirements and authority remain unchanged.

Final local client-sandbox validation: strict wrappers passed116 contracts,190 sustained plus load smoke,164 recovery (470 total); all180 tooling tests passed and the final four group/inventory guards passed. The first contracts run115/116 failed the legacy assertion rejecting production catalogue scope. Replaced it with separate-cache read counts, cache-only miss before a client read, retained client cache after developer invalidation, and unknown-environment rejection. No case/title was removed. Sustained/recovery receipts use fingerprint `6dbf6af68c3624a8ec327f7cea783b453c34ac41f9ef476010d74bfd2ada9dc4`; contracts rerun uses `574ab6eb5209183e281d103fe1dfa102c851ce49ad39698f30fdcc236bb3f148` after that catalogue-test-only correction. These are local scoped receipts, not a fabricated same-fingerprint aggregate or final-head CI pass. Original failure `/tmp/soccerbot-sandbox-contracts.log`; successful `/tmp/soccerbot-sandbox-contracts-final.log`, sustained/recovery logs and test-results receipts retained. Documentation and a grant-description comment were reconciled after verification; runtime behavior was unchanged. Next: review the consolidated local candidate for the planned single CI run; no push/merge/deployment or real provider actions occurred in this slice.

### 31 October — staging calendar/trainer request audit

Owner reports staging does not show the previously requested single time/trainer section and first-available-day/loading behavior. Read-only staging health confirms revision0cfc27d9b58ac597f2ad4ef53d421d7d70782b86, version39480c81-db76-438f-ae9d-8b87a582dc3e. Served booking JS includes trainer-choice/time-choice, trainer selection, Checking available dates and See next month markers; this is HTTP/source evidence, not browser visual acceptance. GitHub confirms developer PR120 and121 merged. Current source retains per-slot trainer selection, but PR121 deliberately styles the dropdown as a separate bordered section. First-available-date selection from fa5a30c is limited to the displayed month; the existing regression explicitly requires manual navigation from empty October to November. The date grid renders immediately with a compact loader below it, not a calendar-area loading replacement. Therefore the stronger requested cohesive-card and cross-month initial selection/loading behavior is not fully implemented; no missing deployment or browser-cache cause was established. No UI code changed during this audit. Owner confirmed the inspected endpoint is the page being viewed: soccerbot-dev.limyousheng-94.workers.dev/book/time/.

### 31 October 2026 — Correct initial calendar discovery and unify time/trainer presentation

Owner confirmed the staging page and authorized the missing behavior after the audit distinguished merged implementation from the stronger requested UI. TimeStep now displays a calendar-area loader until its initial availability is resolved, advancing sequentially through at most four supported months for a new unsaved live booking. Failure and user navigation stop automatic discovery; valid saved selection and later manual navigation remain. Time and trainer selection share one bordered card with an internal divider and visible keyboard focus. Calendar transport/caching, pricing, backend/provider access and booking authority remain unchanged.26 focused component tests passed. Added one inventoried test with deferred success/empty/failure/manual-navigation scenarios (frontend/browser299→300) and updated the existing CI browser trainer case for shared borders/divider; no browser execution or visual acceptance claimed. Both repository skills applied; Technical behavior and Simulated-user UAT updated, with current evidence in Progress. Other architecture/security/provider/data-lifecycle owners require no additional changes for this UI slice. All changes remain local alongside the verified client sandbox work.

UI correction validation: full local `npm run verify:code` passed with246 unit/component tests, exact300-title frontend/browser inventory (browser titles not executed locally), tooling/installer checks, format/lint/types, optimized build and11-route static export. Receipt fingerprint `dad9b9b48678fbd95711f6bb9aa6790643eb9f339bebf0c6c5aee1afe1026b29`; documentation updated afterward. The dependency audit passed its high-severity gate with16 moderate vulnerabilities still reported; dependency changes were outside this UI slice. No browser visual acceptance, push, CI run, merge or staging deployment occurred.

### 31 October 2026, 22:05 Singapore — client guest sandbox runtime activation

PR12 merged as `bcb5e8e85cd31aece7394a8c1b6ff68d60061068` after all 13 final-head jobs passed in run41203309066. Independent main run41206136608 and production deployment41207347576 passed. Owner explicitly authorized enabling client guest sandbox checkout for an owner-operated test. Cloudflare settings PATCH succeeded and readback confirmed client sandbox/provider/customer access, HitPay checkout/recovery/webhook and live readback enabled, with the existing app404 sandbox pairing and SimplyBook services3/4. Public display warming and token refresh-ahead switches are enabled. Identity email remains disabled; all eight installed secrets were preserved by inherited bindings. No booking, payment or email was performed by the assistant.

This is an explicitly authorized runtime override, not a change to the sealed release manifest: the manifest remains closed and the next normal deployment will disable access. Reconcile release activation policy in a reviewed follow-up before relying on persistence across releases. D1, coordinator identity and apac-ne hint are unchanged.

Application timing logs are enabled/persisted at sampling1; Cloudflare telemetry query returned production foundation_trace events, including the new runtime version `1170ba6b-b929-4b30-8c55-377d4f4861b9`. Query-string redaction is now enabled. Native distributed traces remain disabled; Grafana production export/alerts remain inactive. Payment/recovery timings cannot be claimed before the owner's test. Workspace HTTP health read was blocked by CONNECT403; dashboard settings evidence does not replace public route/provider acceptance.

Automatic approval review rejected installation of the persistent once-per-minute schedule as not specifically authorized. Explicit owner approval was requested; no schedule mutation succeeded. Pending: schedule approval, public health/calendar/provider checks, owner guest sandbox payment, correlated checkout/recovery timing report. Earlier closed checkpoints below are historical and superseded by this runtime observation.

31 October 2026, 22:08:59 Singapore follow-up: after explicit owner approval, the client Worker once-per-minute schedule was installed successfully. API readback confirmed exactly `* * * * *`. The earlier automatic-review rejection remains retained above; later owner authorization allowed this action. Schedule execution, provider acceptance and owner guest sandbox payment remain unverified. No subscription change was made.

### 31 October 2026 — loader logo cleanup

The owner reported noisy cyan in the spinning loader and paused sandbox acceptance. Static source rendering reproduced compression speckling: the previous dark-logo SVG embeds a JPEG and recolours it through a matrix. Prepared a cleaned image restoration and optimized WebP, wired through the existing darkLogo owner for loader/footer. Header light logo, loader mechanics and payment state remain unchanged. Asset rendering was inspected without a browser; visual owner acceptance and final CI remain pending. Existing test inventories are retained because no executable behaviour or test titles changed.

Logo validation: all nine `src/components/booking-navigation.test.tsx` cases passed; `npm run check:source` and `npm run check:policy` passed. No new test or inventory change is needed for an asset-only mapping change; existing loader behaviour assertions remain intact. Payment/recovery/runtime owners and rules are unchanged by the logo repair.

### PR13 first CI failure and repair — 31 October 2026

Run41209467303 on head11267bfc8cac639a7233db143f4906937def1836 failed frontend and both backend browser shards because the existing oracle booking sizing test still asserted the old footer SVG filename. Desktop Chromium, phone WebKit and tablet WebKit all received the intended new WebP. This was an incomplete dependent-test review by the assistant, not an observed payment/runtime failure. All Worker groups and both live-email browser shards passed; aggregate gates were skipped after the browser failure. Original job evidence is retained in jobs124561232153,124561835019,124561835049 and their uploaded artifacts.

Repair updates the exact expected footer asset path without changing the header assertion, layout checks, test title, retries or timeouts. Full-source search found no other executable reference to the retired dark-logo filename. Earlier statements that no test update was necessary are superseded by this finding. Inventories, counts and shard assignments remain unchanged because this updates an existing assertion. Browser execution remains CI/owner-operated; new exact-head CI is required.

### 1 November 2026 Singapore — guest sandbox re-enabled after logo release

Owner requested test checkout activation after PR13 merge. Main verification41216341934 and deployment41217448707 passed for d49dc3e5b67ae0701568a54bfb57a9651332feb1. Cloudflare readback confirmed that release had restored closed access. Re-enabled the previously authorized client guest sandbox pairing and access/payment/recovery/webhook switches on this exact revision, preserving secret/resource bindings. Identity email remains disabled. The persistent once-per-minute schedule already existed and was verified, not duplicated. Application timing logs remain enabled/persisted; restored query-string redaction. These remain runtime overrides and will require reconciliation with the closed release manifest. Owner test/provider acceptance and timing measurements are pending; no assistant booking/payment/email operation occurred.

### Client public catalogue portability repair — 1 November 2026 Singapore

Owner observed session information unavailable after authorized activation of d49dc3e. Production telemetry confirms /api/catalogue returned503 (correlation9635ad97-45f5-4669-901e-97ca776d7e51); an earlier request e73961f0-4c01-4943-9ca1-31e2e74f2fb8 had an admin-auth transport success and failed after provider reads. The public endpoint's precise error text remains unavailable through workspace/web fetch. Read-only SimplyBook connector confirms client services3/4 at108/128,40-minute sessions,10-minute buffers and five providers.

Source inspection found a definite portability defect: internal catalogue bindings accepted production, but customerCatalogueSchema retained z.literal(developer), rejecting the public production projection on both Worker and browser. Existing browser-service rejection tests incorrectly classified production as foreign. A new production iteration within the existing service test failed before the schema repair (1 failed/3 passed; /tmp/client-catalogue-before.log) and passes after. The schema now accepts only developer/production; unknown environments, extra/private fields, stale/future/partial/oversized responses remain rejected. Extended the existing Worker public-window case through production projection and customerCatalogue route.

Dependent review: searched remaining developer-only schema checks and catalogue consumers; retained same-origin transport, public-only DTO, service filtering, caching/deadlines and strict field guards. No test titles/counts changed, so inventories and shards are retained. Focused service tests8/8 and Worker catalogue46/46 passed. Full code/contract-wrapper verification and exact-head CI pending. No provider mutation, booking/payment/email, merge or deployment occurred in this repair.

Verification process correction: the first local contracts wrapper completed its runtime cases but rejected the receipt because documentation was updated during verification, changing the source fingerprint. Its original log is retained at /tmp/client-catalogue-contracts.log. The concurrent code wrapper has the same invalidated baseline; neither is claimed as a final candidate pass. Freeze the candidate before rerunning final wrappers; exact-final-head CI remains required.

### 1 November 2026 — restore sandbox after catalogue repair release

Main verification41254073431 and deployment41255109162 passed for f99a1ee1d92b8413e54baf7600a82ebbc78ca60d. Owner still saw unavailable sessions. API inspection found the new revision installed but CLIENT_SANDBOX_ACCESS, LIVE_CUSTOMER_ACCESS, PROVIDER_ACCESS and HITPAY_CHECKOUT disabled by the closed deployment manifest. Restored all previously authorized guest sandbox/recovery/webhook/readback/warming settings, preserving eight secret bindings and identity email disabled. Settings readback succeeded; no CI rerun, booking or payment occurred. Workspace public catalogue HTTP remains blocked by CONNECT403, so end-to-end availability after restoration requires owner refresh and correlated telemetry. The permanent manifest/runtime mismatch remains unresolved and must be reconciled before another release.

### 1 November 2026 — configuration presence and webhook recovery audit

Read-only Worker settings confirm eight client guest-sandbox secrets and ten staging secrets by name/type, separate account/storage identities and once-per-minute recovery schedules. Client webhook authentication returned401, while the original owner attempt completed automatically at08:35:03 SGT (7794ms processing); per-endpoint salt correctness remains unresolved. Production email secrets/integration remain pending with delivery disabled. Closed production source still differs from enabled runtime; another release will close sandbox access. GitHub settings listing is unsupported by the connected tool; successful deployment is historical functional evidence, not a current settings inventory. See PROGRESS current audit for limitations. No credentials exposed, provider effects initiated or CI run for this inspection.

### 1 November 2026 — successful owner webhook and confirmation timing

Owner test3 capture confirms payment flow reached confirmed/verified and receipt200. Correlated webhook returned202 in929ms; automatic recovery completed in5758ms (including1373ms queue), with no recorded provider-operation errors in that recovery. Browser return-side API start to confirmed response8.663s, to receipt response9.128s; catalogue224ms/calendar281ms/checkout3070ms. This accepts the tested sandbox delivery after earlier401s, not all failure scenarios or live payments. Current audit receipt and unresolved configuration gaps are in PROGRESS. No assistant provider effects or CI run.

### 1 November 2026 — return-latency diagnosis

Read-only queue query for owner test3 confirms foreground start00:47:30.889UTC, display jobs start00:47:33.624 and00:47:37.403, recovery enters00:47:46.090 and starts00:47:47.463 (1373ms wait), completes00:47:51.848. The preceding display job therefore occupies the serial queue for about10.060s. holdCustomer queues bookingComments followed by refreshDisplayAfterWrite; calendar warming is the likely second job but current provider_queue telemetry lacks an operation label, so exact attribution remains inferred. Recovery priority cannot preempt active display I/O. Recovery's active processing4385ms plus queue1373ms and subsequent browser poll account for the observed delay. Commit7ef7503 (20 October) deliberately gated customer success on current confirmed-booking/paid-invoice readback, replacing early payment-only confirmation; this predates client migration. No source/runtime changes or real provider operations were performed. Next owner experiment: two sequential one-session sandbox checkouts, immediate payment versus waiting20seconds on HitPay before paying, preserve DevTools logs through receipt. Compare background queue overlap and return timing; do not infer general latency from two samples.

### 1 November 2026 — proposed pre-accounting success boundary review

Inspected recovery, native transport, confirmation/proof guards and October19/20 history. The proposed fresh valid-booking plus verified HitPay payment boundary still permits an unpaid SimplyBook invoice. Recording external payment is PUT /admin/invoices/{id}/accept-payment, not optional local bookkeeping. SimplyBook's Accept Payments documentation states unpaid transactions/bookings are automatically cancelled at the configured timeout; owner configuration is15minutes. Therefore pre-accounting success cannot meet the requested no-false-success guarantee if accounting fails or remains unknown. Existing lost-write handling retains unknown state and uses readback without duplicate writes. A successful mutation response alone has not been established as an atomic booking-and-paid-invoice guarantee. Keep current success gate; do not restore legacy pre-read/payment-only proof. Four focused isolated regressions passed (lost accounting response, cancelled booking, failed booking read, on-time payment after hold expiry), log /tmp/confirmation-boundary-review.log. No application/test source changed and no CI/provider effects. Queue scheduling and browser confirmation-delivery improvements remain separate latency candidates; they do not require weakening this boundary.

### 1 November 2026 — payment-recording response fast confirmation candidate

Owner clarified success should follow recording payment, not precede it. Candidate reuses complete validated paid invoice/nested booking evidence from accept-payment instead of unconditionally fetching it again. Durable claim/version publication remains the success boundary. Incomplete/invalid bodies use readback; transport uncertainty never publishes early success or repeats accounting. Confirmed status carries retained attempt-bound receipt details so the existing proof UI renders before separate receipt completion. Existing test titles/inventories remain, with additional mismatch, fallback and delayed-receipt assertions. Live response contract and latency remain owner acceptance, not synthetic evidence. No activation or deployment change is included.

Candidate verification retained first failed HitPay stale-claim boundary receipt40/41 (/tmp/payment-response-worker.log) and the dependent single/batch read-count failure (/tmp/payment-response-batch-before.log). The paid-booking injection now forces the incomplete-response fallback; the accounting boundary still checks fast-path stale-generation rejection. Single/batch read counts now require one booking read per session and one invoice read. Existing titles/counts/shards remain unchanged. Initial full verify:code passed before these dependent test repairs; final consolidated checks follow.

### 1 November 2026 — retained payment continuation and dependent browser repair

PR15 scope now includes the original-link Continue payment action and original-deadline countdown. No fresh booking/payment, no extra provider check on click, no extension into the recovery buffer. Payment detection persists through later pending responses; expiry hides controls without asserting settlement. Expanded existing component cases cover same URL, no click fetch, reload deadline, expiry and stale available-context suppression after payment. CI41265735490 retained a three-device stale delayed-receipt expectation; repaired it to require confirmation before receipt completion. A local missing-loading-placeholder regression was caught and repaired without weakening its assertion. Titles, inventories and sharding remain unchanged. Consolidated local checks and new-head CI are pending; owner sandbox duplicate-payment and device acceptance remain separate.

### 2 November 2026 — clock-independent continuation and late confirmation proof

PR15 head720f5db passed all gates in CI41268704987. Owner-approved audit follow-up anchors checkout expiry/polling to authenticated response Date plus monotonic elapsed time, conservatively including second precision and request transit. HitPay continuation is withheld without usable server time. A fresh confirmed decision after the checking deadline carries the same retained proof as the normal path; no new polling budget or provider operation. Expanded existing regressions retain inventories/shards. Late-proof fixture failures exposed an approval newer than its simulated deadline, immutable creation protection, and a legacy five-minute window expectation; setup was corrected without relaxing production guards. Consolidated verification/new-head CI remain pending, and no deployment or real payment was performed.

### 2 November 2026 — Dependabot artifact action guard repair

PR16 updates the SHA-pinned download-artifact action to8.0.2. CI41371387964 proved the download paths through all browser shards and Worker groups, but frontend tooling compared the new pin to a duplicated4.3.0 hash. The guard now checks the exact official action name and full commit pin while retaining artifact identity/path/run-attempt/credential assertions. Existing test titles and inventories remain unchanged. Both repository skills applied; local code verification and final-head CI remain pending, followed by owner review/merge. No application/provider/runtime-resource change or deployment.

### 2 November 2026 — authorized merge campaign and PR16 synchronization

Owner authorized merging PR15–18 after reviewing testing-tool versus customer impact. PR15 passed all13 final-head jobs and merged as beb657a8363044445b57c57554cd08f5f21a00e3. Owner accepts post-deployment testing on the not-yet-live client Worker with repository access closed and manual sandbox activation when needed. PR16 synchronization retains the payment history and action-maintenance history; conflicts were limited to Progress/Journey. Fresh synchronized-head CI is required before continuing. No manual deployment activation or provider transaction performed; protected507 untouched.

### 2 November 2026 — Dependabot Playwright runtime alignment

PR17 changes Playwright to1.64.1. CI41371551538 rejected stale generated versions and all four browser shards could not launch because CI still used1.58.2 browser images. Matching Noble images now accompany the package/lock update in active workflows and the retained legacy policy fixture; generated dependency inventory is refreshed. The version-drift guard derives the current version and asserts every negative mutation changes its fixture, preserving rejection instead of copying an old version. Local dependency directory1.58.2 was retained under /workspace/soccerbot-dependency-backups before npm ci installed the reviewed lock. Existing synthetic installer fixture versions are self-contained inputs, not production pins, and remain unchanged. The first local code check also caught a removed internal clockSource.js path; the Node-VM clock test now extracts exactly one installed injected clock from the Playwright bundle via TypeScript AST. Both clock behaviours and the policy suite passed37/37 without a browser. Original failure is retained in /tmp/dependabot17-code.log. Both repository skills applied. Consolidated local code verification and full new-head CI remain pending, then owner review/merge; no browser was run by the assistant and no deployment occurred.

### 2 November 2026 — dependency coupling audit and installer compatibility

Owner requested checking the rest of the application for dependency hardcoding. Search of production src/worker found public package imports and no embedded package-version checks; application data-schema versions remain intentional. Tooling review found a second Playwright1.64.1 compatibility break: the local installer imported the removed lib/server/registry/index.js. Its isolated metadata adapter now resolves the exact headless-shell/WebKit paths through Playwright’s exported core bundle; the real installed adapter is exercised without launching/downloading browsers, alongside retained missing-executable, headless-only and full-Chromium-not-a-substitute regressions. This remains an explicitly tested version-sensitive boundary, not a stable public Playwright API. Manifest/lock/image pins, reviewed prerelease policy and standalone installer Node policy remain deliberate. PR17 follow-up local verification and exact-head CI pending; PR16 and payment PR15 remain separate. No merge, deployment or provider actions.

### 2 November 2026 — Playwright route teardown ordering

PR17 run41374085710 at e7ce012 exposed two live-email desktop Chromium failures in job125051191066: route.fulfill reported Route is already handled after fixture cleanup removed interception while Worker responses remained pending. Inspection of Playwright1.64.1 confirms removing an active handler continues its route. All transport cleanup callers already stop application traffic with about:blank; transport.drain now finishes its tracked response work before unrouteAll, preserving real Worker bodies and strict error propagation. The existing Node transport regression now models a delayed response and fails if handler removal precedes fulfillment. No browser test cases, retries, timeouts, inventories or application behavior changed. Original logs/artifacts retained; consolidated verification and final CI pending.

### 2 November 2026 — PR17 combined-source verification candidate

PR17 incorporates synchronized PR16 head8cbb8d8, which includes merged payment PR15. Workflow changes and the payment/browser transport source merged without conflict; only Progress/Journey required preserving both histories. The candidate retains original payment safety/continuation assertions and the Playwright teardown fix, with no manual activation or provider actions. Local code verification and exact-head CI follow for this combined candidate before the authorized sequential merges.

### 2 November 2026 — dependency suitability review skill

Owner requested a dedicated repository skill after reviewing Dependabot compatibility failures, and declined an automated Actions summary. Added soccerbot-dependencies to own full-version-interval upstream research, benefit and suitability, platform/peer/runtime and supply-chain review, justified application changes versus fixture/environment repairs, and a PR merge/defer/reject recommendation. AGENTS and the dependency runbook link it; testing/documentation skills retain their existing owners and cross-link the new procedure. Exact pins, independent assertions, original failure evidence and separate merge/deployment authority remain required. No application/dependency/workflow/test-inventory behavior changed. Source/CI-policy checks and formatting passed; skill metadata, instruction-only scope and 87 local link targets were validated. Separate draft publication follows; this instruction does not execute automatically in Actions.

At this checkpoint PR16 and PR17 final heads passed all13 CI jobs in runs41373470332 and41375585310 respectively; neither was merged at the last review. The Playwright review also identified platform support changes across intermediate releases, illustrating why green Linux CI alone is not universal platform acceptance. Existing dependency and payment branches remain separate.

### 2 November 2026 — deployment readiness and CI diagnosis skills

Owner requested the first two proposed operational skills. Extended draft PR18 with soccerbot-deployment for source-to-artifact provenance, verified account/resource identity, configuration stores and secret-name-only checks, partial deployment, placement evidence, activation and rollback readiness; soccerbot-ci-diagnosis for preserved first-failure evidence, causal classification, SQLite/filesystem/process lifecycle investigation, complete shards and distinct independent/journey/restart scenarios, bounded experiments and CI cost tradeoffs. AGENTS, the deployment runbook and development verification guide link the procedures. Existing testing/documentation owners, explicit protected runs and merge/deployment/provider permissions remain authoritative. No executable behavior, workflow, dependency or inventory changed; no performance skill or automated Actions summary added. Follow-up source/CI-policy and formatting checks passed; 133 local link targets, new skill metadata/anchors and Markdown-only scope validated. Publication follows; final-head CI and merge remain separate.

### 2 November 2026 — dependency support ranges and browser coverage

Owner requested explicit support-version changes in every dependency PR and an appropriate browser coverage owner. Extended soccerbot-dependencies with a mandatory before/after table for upstream requirements, repository pins, added/removed/unchanged support and exact verified coverage, citing version-specific sources and evidence. Unknown or unspecified bounds remain explicit rather than invented. Development now owns the dated baseline1.58.2/proposed1.64.1 bundled-engine matrix and Linux emulation limits; customer UAT records model and exact OS/browser versions. The runbook links the requirement. Test-host support is distinct from customer-browser policy; no continuous customer range, application change or new test execution is implied. Browser metadata was inspected without launching browsers; source/CI-policy and formatting checks passed, along with 87 local link targets and new support/coverage anchors. Draft publication follows.

### 2 November 2026 — explicit support semantics and PR review cleanup

Owner requested cleaned PR descriptions and consultation before any merge. Dependency review and browser-coverage guidance now require distinct Testing-tool support, Our verified test coverage and Customer impact statements. Untested does not mean broken; removal of upstream test-host support can affect tool installation/execution without itself changing customer-browser requirements. PR15–18 descriptions are consolidated around final behavior, exact-head evidence, retained original failures and outstanding acceptance, replacing accumulating contradictory status notes. No merge, auto-merge, deployment or provider action is part of this cleanup. Follow-up source/CI-policy and formatting checks passed; affected local link targets validated. Publication follows; the owner must be consulted before merging.

### 2 November 2026 — PR18 synchronized merge candidate

The owner's explicit merge-all instruction supplies the requested consultation outcome. PR18 now incorporates PR17 head807dd43, including PR16 synchronized head8cbb8d8 and merged payment PR15. Progress/Journey conflicts were reconciled by retaining each history; instructions, coverage matrix and UAT fields merge with the reviewed code without additional application changes. Updated the coverage checkpoint to distinguish this branch's1.64.1 pin from historical1.58.2 evidence. The combined payment/action/Playwright candidate passed local verify:code at fingerprint e87aab1210ee2473c4142d7ad208dfe8124bbe42778bc30b22d19b60aa0b3d59 before instruction-only integration. Fresh final-head CI remains required; keep closed production defaults and manual owner sandbox activation as agreed. No provider transaction, runtime activation or management of507 performed.

## 2 November 2026 — closed deployment propagation repair

Release [41386001023](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41386001023) uploaded PR15 merge beb657a (Worker version9093bac7-b578-4f77-84a8-8f4d0a5581b0), then job125087292909 rejected still-visible predecessor f99a1ee against undefined. Closed-mode first-install support introduced in915de5f2 skipped predecessor capture even for redeployments. Earlier passes did not exercise this transition; they do not establish correct propagation handling.

The focused repair reads the predecessor in either access mode, allows only HTTP404 for a missing closed first installation, and keeps exact final revision/health, bounded observations and rejection of unknown revisions, malformed health and transport/HTTP errors. A regression with the original shortcut failed locally in `/tmp/closed-propagation-before.log`; repaired deployment tests passed11/11 in `/tmp/closed-propagation-after.log`. Testing and documentation skills applied; tooling tests are automatically discovered and no frontend/browser/Worker inventory or sharding change is required. Runbook owns the operational distinction. Full local `npm run verify:code` passed, with the receipt retained at `/tmp/closed-propagation-code-receipt.json`; final-head CI and actual post-release health remain pending; no access activation, booking, payment or notification was performed.

The previously authorized merge campaign completed after all13 jobs passed on each synchronized head: PR16/run41384996754 → merge872b62d; PR17/run41385294723 → merge7ceea60; PR18/run41385462579 → merge4454b334. The propagation repair is a separate follow-up; fresh-main CI/deployment and provider acceptance are not implied by these merges.

## 2 November 2026 — production sandbox re-enabled for owner timing tests

Staging deployment41391686571 and production deployment41389536404 passed for merged revision4454b334; Cloudflare settings independently report that revision on both Workers. At owner request, production sandbox settings were restored for payment-confirmation latency and leaving/returning to the original checkout link with its timer. Reviewed account/company/service/merchant identity and eight installed secret names before PATCH; readback confirmed enabled guest/provider/payment/recovery/webhook/readback/warming settings and disabled identity email. Secret/resource bindings were inherited. Timing logs remain persisted at sampling1 and query-string redaction was restored. Existing cron `* * * * *` was confirmed unchanged. No CI rerun or assistant booking/payment/email operation. Owner browser/provider measurements and timing analysis remain pending; source closed-mode defaults still overwrite runtime activation on a later release. PR19 remains draft/unmerged despite passing CI; staging-before-merge process documentation/enforcement is still outstanding.

## 2 November 2026 — PR19 customer feedback consolidation (prepared)

Owner tests found Continue payment on the hosted-payment return while payment was still checking, and excessive pending details. The original booking payment step now explicitly opts into unpaid continuation; the confirmation-return route never offers it and route parameters remain non-evidence. Pending presentation ends with summary, original-deadline timer and button; confirmed details/exports keep their authorization boundaries. Expanded regressions failed against the original runtime components before passing the repaired implementation.

Long loading explanations and error messages are shortened to customer outcomes and safe next steps. Unexpected account/enquiry errors are no longer rendered verbatim; locally authored guidance is explicitly marked. Shared alert/notice styles replace inconsistent plain errors, with field validation and loader layouts retained. Browser locators, fixtures and the renamed inventory title are reconciled; owner visual/device acceptance and final CI remain pending. The release procedure now explicitly requires actual exact-head staging and owner acceptance, including drafts/bot exclusions, but does not claim an automated production prerequisite. All changes remain on draft PR19; no merge, deployment or new CI for the local scope.

Local consolidated `npm run verify:code` passed: 246 unit/component cases and strict inventory, 182 tooling cases, installers, source/policy, format/lint/types and build/export. Audit had no high-severity failure, but reported 16 moderate lint-tool dependency findings; no dependency mutation. Receipt retained at `/tmp/pr19-final-code-receipt.json`. Updated evidence-only documentation is separately checked; no assistant browser execution, staging acceptance or merge claim.

## 2 November 2026 — confirmation render timing and preserved CI failure

Run41396104194 on PR19 head8e7691a failed three distinct browser message assertions across frontend/backend/live-email: old receipt-failure wording, old checking-deadline wording and malformed `Your Contact...`. These are missed test-copy migrations, not evidence of failed Worker verification; all Worker groups passed. Repair exact messages without removing their safety assertions.

Owner-reuploaded test4 HAR was read successfully: checkout handoff3.164s; after confirmation navigation, context0.978s, payment-pending1.542s, paid-booking-pending4.301s, verified proof6.990s, receipt7.381s. Test5 contained pending responses and no confirmed result. HAR does not establish paint timing. Recorded deployed JavaScript and source render the pending booking card early, with success withheld until proof; the owner's report of earlier success remains unresolved rather than dismissed.

Owner authorized UI tracing. Prepared bounded, local Performance/console events with hashed server correlation, build checkout revision and response/post-commit/visible-frame observations. No new network/telemetry endpoint or customer data payload. Added explicit no-confirmed-event-without-proof, hidden/unmount/error-isolation tests and a real-API browser assertion. Runbook/UAT explain capture and limitations. Final verification and owner screen acceptance pending; no merge/deployment.

Final local `npm run verify:code` passed with248 unit/component cases, strict inventory,182 tooling cases, installers, source/policy, format/lint/types and build/export. The high-severity audit gate passed with the previously reported moderate lint-tool findings. Receipt `/tmp/pr19-render-final-code-receipt.json`; evidence-only documentation checked separately. New browser assertions and the three CI repairs still require final-head browser CI.

## 2 November 2026 — environment pricing and provider configuration reference

PR19 head `eace296782601c1fb787a953dcfbc9ef11f2bb04` passed verification41398617144 (all13 jobs) and staging deployment41400005340; exact revision and runner health were confirmed. This repaired the earlier obsolete browser-message assertions and staged local-only confirmation render timing. Production remained4454b334; owner acceptance/merge were not claimed.

Owner then identified staging pricing and requested a separate provider configuration reference. Read-only service APIs reconfirmed developer88/108 and client108/128,40-minute sessions,10-minute buffers and all five linked client trainers. Source inspection found homepage88 and live session88/108 text hardcoded; both now select the centralized profile using the validated live catalogue environment, with no numeric homepage fallback when unavailable. Two component regressions and five existing pricing/two catalogue cases passed locally. Inventory increases from248 to250. Full `npm run verify:code` passed, including250 unit/component and182 tooling cases, strict inventory, installer/source/policy, format/lint/types and11-route build/export (`/tmp/pr19-pricing-code-receipt.json`). New-head CI/staging pending at preparation.

`external-providers-config.md` records SimplyBook, Resend, HitPay and Cloudflare roles/settings with API-observed, owner-confirmed, historical and pending boundaries. It excludes credential values/customer records and explains temporary sandbox settings, notification evidence limits and unrelated provider-hosted marketing drift. AGENTS, documentation skill, development/runbook, technical behavior and customer UAT link or describe their affected ownership. No provider settings, bookings, payments or notifications were changed.

## 2 November 2026 — invoice document references and notification preparation

Pricing/provider-reference head895091414674a513862685648cf1f7002a438146 passed all13 jobs in41402237300 and deployed staging in41403617840, Worker528f8f20-cc17-4059-b764-58ef14fc8c5c. Owner expanded PR19 before merge to replace visible internal references, update downloads/contact and draft full HTML emails. Glenna's WhatsApp number is +65 9014 3819; change/cancel messages remain requests until studio confirmation. Owner clarified staff accounts are for mobile use, not phone-number login.

Read-only SimplyBook paid invoice inspection confirmed a separate `number` field; visual mapping to the SBPay document remains owner acceptance. Optional validated metadata flows through existing observations/confirmation receipts without additional reads or changing financial identity. Visible IDs are removed from confirmation/PDF, calendar UIDs remain stable, legacy missing numbers remain compatible. Two new export cases and extended existing normalization/recovery/receipt/customer tests accompany the change. Focused57 service/component/domain and one native regression passed; full final gates/staging pending at preparation.

Three complete HTML drafts include unchanged approved logo pixels as PNG, recipient-specific content and unbound editor placeholders. API inspection reports Custom email/Flexible Notifications disabled and the connector has no template write operation. No provider setting, invitation, email, booking or payment was performed. Existing provider/config/UAT owners record pending email productionization, mobile staff role/permission checks, WhatsApp handling and notification trigger/variable/recipient acceptance.

Local source guard caught the obsolete `confirmation-provider-references` CSS rule after its panel was removed. The rule was removed rather than weakening source checks; first failure receipt `/tmp/pr19-invoice-source-failure.json` retained. No CI run was spent on that incomplete candidate.

The next local tooling pass rejected the new pure provider-reference contract import at the Worker boundary. Added that exact shared contract to the allowlist with an adjacent-path negative regression, retaining component/demo/unknown-layer rejection. Failure receipts `/tmp/pr19-invoice-layer-failure.json` and `/tmp/pr19-invoice-layer-tooling.log` preserved; no CI spent.

Final consolidated local verification passed:252 unit/component cases,182 tooling cases, installer/source/policy/format/lint/types/build/export and all470 isolated Worker cases with exact inventory. Receipts `/tmp/pr19-invoice-code-receipt.json` and `/tmp/pr19-invoice-worker-receipt.json`. HTML structure and changed-document relative paths passed; email-client rendering remains unperformed. Owner paused custom email and requested staging PR19 followed by flow/physical checks. Preserve drafts inactive, publish one candidate and require new-head CI/staging before owner testing; no merge/production activation.

### 2 November 2026 — PR19 staging physical follow-up

Exact candidate75891e9 passed all13 verification jobs (41407426255) and staging41408849972, version9b316f22-721f-40f5-8f03-18c7a55740c6. Owner test6 confirmed the original booking page reaches confirmed status but reported resumed checkout tab behavior, mismatched invoice prefix, failed details download and presentation issues. HAR retained outside source:252 requests, final receipt200; no failing export click is captured. Same-tab continuation, formal pending copy, stable download controls and arrival/WhatsApp presentation are prepared with23 focused cases passing. Actual Pay document mapping and export failure remain investigation items; no invented root cause, relaxed freshness or provider changes.

Owner then explicitly retired Download booking details and Add to calendar rather than continue failure diagnosis. Removed their handlers/formatters and unused jsPDF4.2.1; the source guard first reported the unreachable formatter and was preserved. Two formatter-only cases retired; multi-session/trainer and receipt/financial safety assertions remain. Invoice display withheld because the owner cannot verify Pay after trial expiry; O→SI is not assumed. Same-tab browser history/continuation/paid-return coverage extends the existing isolated Worker journey, with physical HitPay redirect still pending owner UAT.

Local complete verification caught an obsolete mutable test gate and the five-action confirmation layout assertion (plus its browser count). Corrected both before publication; retained `/tmp/pr19-retire-exports-lint-failure.json` and `/tmp/pr19-test6-action-count-failure.json`. No CI was spent on these incomplete candidates.

PR19 candidate8b1e4d0: frozen local verification passed250 unit/component and182 tooling checks. CI41413610923 failed only the new same-tab continuation journey in live-email shard1/job125173237425 on all3 device projects. Artifact13127516321 retained; trace confirms checkout available/unexpired but HTTP Date missing because dispatchFetch bypasses the HTTP server. Fixture transport now supplies Date from its host clock when absent, and the journey checks that prerequisite. No extra retries/timeouts, application-clock fallback or weaker assertions. Remaining executed CI checks passed; final dependent aggregations skipped after the shard failure.

CI41415574981 on36fd07a: missing-Date repair lets Chromium complete the full same-tab journey. WebKit phone/tablet reach the synthetic paid completion but Playwright rejects route.fulfill302 (job125179386536). Replace only the hosted-provider simulator with a200 HTML completion document calling location.replace to the verified return URL; actual Worker confirmation remains authoritative. Retain all devices, assertions and timeouts. Real HitPay redirect acceptance remains separate.

## 2 November 2026 — test8 second-checkout calendar repair (prepared)

Owner recording on staged38c2134 confirms the first payment/booking, dismissal, then a distinct checkout for the identical slot. No calendar reread occurs between bookings. Second checkout stops at SimplyBook book with private provider_rpc_failed diagnostic and zero HitPay calls; exact provider rejection is unavailable. Confirmation restart retained browser display data despite server post-write invalidation. The repair invalidates browser month/day state before the new draft; existing regression demonstrates old-source failure and22 focused cases pass. Server unknown-write recovery remains conservative. Full verification/delivery and the expanded owner second-booking UAT remain pending; this is not proof of the precise provider rejection or successful second live checkout.

## 2 November 2026 — combined booking-journey audit (prepared)

Verified7dd0bfe CI41422527794/all13 and staging41424174940 exact-source deployment (Worker23aec032-988e-456a-b8f3-1b9119fc11f9). Owner requested combinations beyond isolated happy paths. The audit reproduced an expiry-release error leaking across confirmation attempts; scope it to attempt/revision. It also reproduced calendar reads staying paused when confirmation restart follows checkout in the same mounted app; explicitly resume reads alongside cache invalidation. Existing tests now chain old-dismissal/new-active-attempt protection and paid-return/new-calendar/reload/old-receipt navigation. Focused60 component cases pass; original failure is retained. Test counts/titles/shards unchanged. UAT owns the transition matrix and explicitly retains two successful independent paid bookings as provider acceptance because the existing mechanism models one reservation. Full code/new-head CI/staging pending; no merge, production change or live provider action.

## 2 November 2026 — two-pass full consecutive-journey audit (prepared)

Reconciled270e97d's successful all13 CI41438559984 and exact staging41440199901/Worker91179174-df10-4769-a770-41f0c83688f9. Owner requested three complete successive journeys, including multi then single. Pass1 traces state/payment ownership and executes three single and multi→single→single reservations in one isolated runtime/customer session. Pass2 checks retained earlier receipts, repeated old dismissal during a new unpaid attempt, independent identities/totals, capacity consumption and final empty restoration. Both Worker sequences pass; no additional application logic error found. New corresponding browser cases cover forms, Back/reload/old-link/Continue and three paid confirmations; CI pending. Sequence provider uses distinct retained records, replacing the prior one-reservation coverage limitation for these scenarios. Initial synthetic expiry-format failure retained and corrected; no application guard relaxed. Worker inventory472 (116/192/164), browser inventory+2; exact ordering/group guards updated. Full checks, CI/staging and owner provider acceptance remain separate and pending.

Local sustained wrapper passed192 cases plus load smoke; first full code verification caught the increased90 live device cases exceeding42 batches at two cases maximum. Browser layout increases to45 (23/22 per runner shard), with path bounds/types and independent guard expectations reconciled; original failure retained, no bound weakening. This is verification infrastructure only, not customer runtime behavior.

### 2 November 2026 — Restore provider invoice display for owner UAT

After PR19 merged as fc52077 with explicit owner authorization before remaining physical checks, owner requested the invoice number visible again to compare full flows. Restore optional provider invoice metadata unchanged on confirmed live cards; absent/pending metadata stays hidden and internal IDs remain excluded. Same-tab navigation does not prove the O/SI difference resolved. No financial checks, API calls, dependencies or configuration changed. Update existing component expectation and exact inventory title; preserve case counts. Owner comparison with SimplyBook Pay, reload and old/new tabs remains pending.

Owner expanded the unpushed follow-up to a short confirmation-icon pop and a full customer-message review. Invoice-only21 component cases and full non-browser code verification passed; subsequent CSS uses380ms transform animation only with no-preference motion. Added the UAT copy worksheet with recovery/reconciliation scenario mappings, exact current copy and proposed replacements. No copy replacements or CI publication yet; consolidate wording before final verification.

### 2 November 2026 — Archived handover checkpoints

The following is the retained pre-reconciliation Progress record. All status, authorization and next-step statements in this subsection describe their original checkpoints, not the current release. Current state and pending work are owned exclusively by [Progress](../PROGRESS.md). Preserved failures and historical hashes are not acceptance of later candidates.

#### Two-pass consecutive-journey audit — 2 November 2026

Baseline270e97d passed all13 jobs in CI41438559984 and staging41440199901; exact-source Worker91179174-df10-4769-a770-41f0c83688f9 installed at19:55 Singapore time. PR19 remains unmerged. This supersedes earlier pending delivery checkpoints below. Owner requested two audit passes before physical acceptance, specifically three complete back-to-back journeys and multi-session → single-session.

Pass1: traced draft reset/calendar resume, completed-grant archival, active-attempt restoration, immutable payment identity/deadlines and retained receipts. Added a sequence provider fixture over the existing isolated real Worker harness, with independent booking/invoice/payment records and persistent capacity. Both full sequences [single,single,single] and [multi,single,single] pass locally without resetting runtime, customer cookie, database or provider history. No additional application defect found in this pass.

Pass2: verified old receipts and repeated old dismissals while a newer booking is unpaid, distinct payment references/requests, exact session totals/players, zero remaining capacity and empty current-attempt restoration after final dismissal. Both isolated sequences pass again. Added corresponding browser journeys: actual customer forms and payment creation, same-tab hosted completion, second-journey Back/reload/old-confirmation/current-payment continuation, unchanged original payment identity/deadline, three distinct paid confirmations and customer details. Browser execution remains CI-only and pending. New three-journey cases have an explicit90-second total budget; existing cases, per-action timeouts and retries are unchanged. No test timeout was increased in response to a failure.

Test/guard impact: two Worker cases (470→472; sustained190→192; contracts116/recovery164 unchanged), two browser cases across desktop/phone/tablet. Exact declaration-order inventories and group-count guard updated. The full code tooling gate caught90 live device cases exceeding42 batches at2 cases maximum; expand to45 batches (23/22 per shard), preserving the1–2-case bound and updating path validation/types/independent negative fixtures. Original /tmp/sequence-first-code-failure.json and /tmp/sequence-code.log retained; no CI run spent on that candidate. Source/type checks and4 worker-group guard tests pass; sustained wrapper passed all192 cases and its1/3-customer baseline/fault smoke scenarios; frozen code verification follows after the browser batching guard repair. First fixture run rejected a millisecond-bearing invoice expiry; corrected synthetic provider format to match the existing accepted provider fixture, retaining /tmp/three-journeys-first.log and /tmp/three-journeys-diagnostic.log. Passing second-pass receipt /tmp/three-journeys-pass2.log. No production source, schema, dependency or permission change. Next: full local checks, one consolidated PR19 CI/staging update, then owner provider/device acceptance. No merge/production action; email remains on hold.

#### Previous combination-journey audit — 2 November 2026

Baseline7dd0bfe passed all13 jobs in CI41422527794 and staging41424174940; deploy job125207109781 installed exact revision as Worker23aec032-988e-456a-b8f3-1b9119fc11f9 at09:55UTC. Production skipped. This supersedes the pending delivery note below. Owner requested combination-flow audit; no merge/production changes or assistant provider/browser actions.

Audit scope: paid Back/Continue return → new journey → reload → old confirmation; old completed dismissal while a newer attempt is active; lost responses/reload; duplicate tabs; expiry/grace/late payment; multi-session partial failure. Existing tests were inspected by assertions, not titles. Concrete defect: ProtectedConfirmation retained an unscoped expiry-release error across attempt/revision changes. Extended expiry regression fails on baseline and passes when the error is bound to its originating attempt/revision. A second composition (checkout in the same mounted provider → confirmation restart) showed calendar reads remain paused: invalidate alone removes old entries but does not start the replacement read. Explicitly resume calendar reads on confirmation restart. That regression fails on the previous candidate; original evidence /tmp/journey-audit-paused-original.log. No payment decision, provider call, expiry authorization or recovery policy changed.

Existing rebooking regression additionally rejects an old confirmation exit before and after delayed dismissal finishes while a newer attempt remains active. Existing three-device paid-return browser journey now continues through Make another booking, a new empty provider calendar, dismissal, reload and reopening the old confirmed link, with original one-booking/payment/accounting assertions retained. This single-reservation provider fixture does not prove two different successful paid reservations in succession; that owner UAT remains explicitly pending. The audit matrix is in simulated-user UAT. The first consolidated full code verification passed before the pause finding; rerun the frozen complete candidate after that source change. Focused60 component cases pass; original expiry failure retained in /tmp/journey-audit-expiry-original.log. Test titles/counts/inventories/shards unchanged; full local verification/new-head CI/staging pending. Budget: one bounded audit pass, consolidate into existing PR19. Custom email remains on hold.

#### Test8 rebooking investigation — 2 November 2026

Starting candidate38c2134 passed all13 jobs in41417374930 and staging41418928595 (Worker be93da41-e491-4217-babd-aa507e0e8d5f). Owner test8 used normal checkout after Back → Continue → paid confirmation → Make another booking. HAR shows distinct attempts but the same service/trainer/start, no calendar read between bookings, and second checkout returning recovery_required before any HitPay call. Read-only staging D1 diagnostic confirms execution/book/provider_rpc_failed; it does not retain the provider's exact rejection reason. An occupied-slot rejection is plausible, not proven. No provider writes/replays or runtime changes were performed.

Prepared repair: restartAfterConfirmation invalidates browser calendar/day availability before clearing the draft. Server post-write display invalidation/refresh already exists; no extra synchronous payment check, provider retry, financial proof change or recovery relaxation. Existing rebooking regression now proves a retained available calendar disappears while the replacement read is pending and resolves to unavailable, while preserving dismissal gating/failure assertions. The test fails against original source and all22 focused cases pass with the fix. Initial fixture failure (availability capability incorrectly retained as demo inside a live adapter) is preserved in /tmp/test8-focused.log; calendar coverage now uses a consistent demo adapter, separately from the retained live dismissal fixture. Inventories/titles/counts unchanged. Full local verification, final-head CI/staging and owner second-booking acceptance pending. UAT explicitly covers the second checkout and cross-trainer occupied-time exclusion. No merge/production authorization; email remains on hold.

#### Current owner UAT follow-up — 2 November 2026

PR19 candidate `75891e9e8450880c02696c5d4682832e6ee4da6f` passed all13 CI jobs in41407426255 and staging41408849972; Worker version9b316f22-721f-40f5-8f03-18c7a55740c6 and revision independently read back. Owner test6 reports successful confirmation in the original tab, but resumed HitPay opens another tab, invoice prefix differs from Pay, and details download fails. Acceptance is not complete. No merge/production authorization; custom email remains on hold.

Current repair: same-tab continuation and formal copy; WhatsApp Enquiry; instructor guidance inside arrival box with the separate footer removed. Owner subsequently removed both download actions; their UI handlers, local PDF/calendar module and unused jsPDF4.2.1 dependency are retired. Live invoice label is withheld: owner screenshot confirms O order and SI paid-invoice labels with different sequences, but the exact paid-document API mapping is unverified; no invented prefix. Protected receipt/financial/storage contracts remain. Existing browser journey now exercises Back → same-link continuation → synthetic signed payment/hosted redirect → confirmed in the same tab, preserving deadline, one booking/request and accounting effect. Two export-only tests retired (252→250 unit cases); multi-date/trainer assertions retained and renamed inventories synchronized. Initial source guard correctly rejected the now-unreachable export module; remove it rather than relax reachability. Download failure itself remains undiagnosed, not repaired; no need for further owner download capture after removal. Local failures retained: unreachable retired formatter, obsolete `let` in the browser fixture, and a five-action layout expectation after two actions were removed. Corresponding module cleanup, const correction, component/browser action assertions and exact inventory names are reconciled. Published candidate8b1e4d0 passed frozen local code verification. CI41413610923 passed frontend, all Worker groups/aggregation and three browser shards; live-email shard1 failed the new continuation case on desktop Chromium, phone/tablet WebKit. Retained artifact13127516321 proves valid checkout context but no HTTP Date header in the in-process transport, so the required server clock is absent and continuation correctly stays hidden. Repair adds Date in the synthetic HTTP adapter from the fixture host clock, preserving any provider header and all application guards; the journey now asserts it. No application behavior change for this repair. Original failure ZIP retained outside source. Revised CI41415574981 confirms the Date repair: Chromium completes the new journey; phone/tablet WebKit fail only because Playwright route.fulfill rejects synthetic302 responses. Replace that provider simulation with a completion document using same-tab location.replace; retain real Worker/signed payment and all navigation/identity assertions. Job125179386536 logs are the retained failure evidence. No application change or timeout relaxation. Revised final CI/staging pending.

Updated 2 November 2026, Singapore. This file owns the current task and verified leave-off; [Journey](journey.md) retains dated evidence and [AGENTS](../AGENTS.md) owns engineering rules.

#### Historical preparation — customer invoice references, exports and notification drafts

PR19 on `fix/closed-deployment-propagation` remains ready/unmerged. Head `895091414674a513862685648cf1f7002a438146` passed all13 CI jobs in41402237300 and staging41403617840 (Worker version528f8f20-cc17-4059-b764-58ef14fc8c5c); runner revision/health passed. This includes pricing, provider documentation and earlier customer-feedback/render tracing work. Production remains4454b334. New local follow-up below is not covered by that staging receipt.

Owner requested building customer-facing invoice/document and contact/export changes on PR19, drafting full branded HTML notifications and staging again. Replace visible internal IDs with the optional official SimplyBook invoice number; preserve financial identities/calendar UIDs, legacy receipts and safe confirmation timing. No extra provider read is added for the number. Glenna +65 9014 3819 owns WhatsApp change/cancellation requests; messages do not themselves mutate a booking. Three complete customer/admin/trainer HTML drafts and an unchanged-pixel PNG logo are prepared. SimplyBook Custom email/Flexible Notifications are API-observed disabled; connector exposes no template editing capability. Draft placeholders must be mapped to the editor's actual variables, paid/confirmed trigger and correct recipients before activation; no email/feature was enabled or sent.

Focused evidence:57 component/domain/service cases passed; native normalization regression passed with pending/paid number changes and missing/invalid display metadata. Existing Worker recovery/receipt tests are extended; two export cases increase unit inventory250→252 while Worker470-case inventory/grouping is retained. First full code pass stopped at the source guard because removal of the provider-ID panel left its CSS class unused; removed that obsolete rule, retaining `/tmp/pr19-invoice-source-failure.json` and `/tmp/pr19-invoice-code.log`. A second local tooling guard identified the new pure `provider-references` contract import missing from the Worker layer allowlist; explicitly allowed only that contract and retained an adjacent-path rejection regression (`/tmp/pr19-invoice-layer-failure.json`). Final local `npm run verify:code` passed252 unit/component and182 tooling cases plus installer/source/policy/format/lint/types/build/export; `npm run verify:worker` passed all470 cases with strict inventories/source/types. Receipts `/tmp/pr19-invoice-code-receipt.json` and `/tmp/pr19-invoice-worker-receipt.json`. HTML parser/relative-link checks passed; no email-client/browser rendering acceptance is claimed. New-head CI/staging remain pending. Keep all related work in PR19 and stage only after final-head gates. Owner visual/payment/email acceptance and merge remain pending.

Custom email is **on hold at owner request**. Retain HTML drafts only; do not enable/configure/send notifications. Immediate next action: publish the consolidated application candidate, verify exact-head CI and staging, then guide owner visual/navigation, unpaid continuation, payment return, timing and export/WhatsApp tests one at a time. No merge or production deployment.

#### Pending owner setup and acceptance

- Productionize email: client DNS/sender verification, reviewed credential/sender scope and all three identity/account actions; verify provider booking-notification triggers and eliminate duplicates. Configuration and draft templates: `docs/external-providers-config.md`; acceptance: customer/Admin UAT.
- WhatsApp booking changes/cancellations: number supplied, UI/export implementation in progress; confirm operational handling/policy with Glenna. Never imply automatic change/refund.
- Junior employee and trainer individual accounts on mobile phones (not phone-number login): verify roles, seats/costs, permitted duties/denials and existing provider mappings. Owner creates/invites, configures recovery/MFA and performs mobile permission tests. Proposed matrices in Admin/Trainer UAT remain subject to actual capabilities/owner approval.
- Compare invoice document number to SimplyBook Pay display, validate legacy/multiple-session downloads and calendar identity, and preview supported notification variables/layouts before enabling.

#### Retained owner-test checkpoint — production sandbox on merged PR15–18

On 2 November 2026 Singapore, owner authorized enabling the required configuration for payment-confirmation latency and leave/return checkout-timer tests. Both staging and production installed revision4454b334; staging deployment41391686571 and production deployment41389536404 passed. PR19 head1c3af975 passed all13 jobs in41387551473 but remains draft/unmerged; its published deployment repair and newer local customer changes are not installed.

Production settings PATCH and independent readback restored the previously approved soccerbotadmin/services3/4 + app404 HitPay sandbox pairing, guest/customer/provider access, HitPay checkout/recovery/webhook, live readback and display/token warming. All8 secret bindings were retained by inheritance; identity delivery stays disabled. Application timing logs remain enabled/persisted at sampling1; query-string redaction is restored. Existing once-per-minute schedule was read back unchanged. Settings evidence does not establish browser/provider acceptance. Owner performs all checkout/payment actions; assistant correlates timings and reports receipt/confirmation publication separately from actual browser rendering. The source manifest remains closed and a subsequent deployment can disable this runtime override. No new CI run is needed for the settings change.

Next: owner captures one immediate sandbox payment and one leave-unpaid/return/continue-original-link case with timer observations. Record Singapore timestamps and browser evidence; inspect telemetry before claiming latency improvement, countdown preservation or no duplicate provider effects. Documentation edits are retained locally for consolidation, avoiding a status-only CI run. The agreed draft→ready→verified staging→owner acceptance→merge policy and its automated enforcement remain outstanding work.

#### Active repair — closed deployment propagation

Branch `fix/closed-deployment-propagation` builds on the verified PR18 stack, now merged into main4454b334. PR16–18 each passed all13 final-head checks before their authorized merges. Production release [41386001023](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41386001023), job125087292909, uploaded revision beb657a and Worker version9093bac7-b578-4f77-84a8-8f4d0a5581b0, then failed health verification: the old revision f99a1ee was compared with an undefined predecessor. Closed mode had skipped preflight predecessor capture since commit915de5f2; this is an existing propagation defect, not evidence of invalid closed configuration. New-version public health and owner acceptance remain unverified.

The repair captures existing health for closed releases, permitting only HTTP404 for absent first-install health. It retains exact-revision/closed-state checks, the existing observation bound and unknown-revision/error rejection. The regression failed against the original shortcut, then all11 deployment tests passed after repair. Browser/Worker inventories and shards are unchanged; this adds tooling cases only. Full local `npm run verify:code` passed (including tooling, installer, source/policy, audit, formatting, lint, types, unit inventory and build/export); final-head CI remains required before merge; no runtime activation or provider effects. Next: publish the focused repair, require its final-head CI and review, then verify a fresh-main release. Leave507 untouched.

#### Current merge campaign — PR15–18

Owner authorized merging all ready PRs on 2 November after consultation. PR15 headc827924 passed all13 jobs in run41369195891 and merged as beb657a8363044445b57c57554cd08f5f21a00e3. Owner accepts testing on the not-yet-live client production Worker after deployment; pre-merge staging UAT is waived for this change. Keep repository production access closed; manual sandbox activation is the accepted testing procedure and a later deployment may close it again. This supersedes older statements treating that intentional setup as a merge blocker. Provider/device/latency acceptance remains outstanding.

PR16 synchronized head8cbb8d8 passed all13 jobs in run41384996754 and merged as872b62d. PR17 head807dd43 passed all13 jobs in run41385294723 and merged as7ceea60. PR18 headd741014 passed all13 jobs in run41385462579 and merged as4454b334. Both source and retained documentation histories are integrated. Fresh-main verification/deployment is separate; the propagation repair above is still pending. No live provider effects or manual activation were performed. Leave507 untouched.

#### PR15 implementation checkpoint — historical before merge

Draft PR #15, branch fix/payment-response-confirmation. Head720f5dbaa4a6c483304fdab97f62da61ac2dc014 passed all required CI gates in run41268704987. Owner requested an audit, then approved tightening two findings: device-clock dependence in continuation and the late-confirmation branch omitting retained proof. Prepared server-Date/monotonic timing shared by context validation, polling, countdown and click guard; missing server time hides Continue payment. Fresh confirmed results after the checking deadline now include retained proof without renewing checks or financial effects.

Both repository skills applied. Existing tests expanded for clock skew in both directions, wall-clock changes, reload, click-before-timer expiry, missing server time, and late confirmed proof with unchanged payment journal. Titles/counts/shards remain unchanged. Focused37 UI/service tests passed before the final boundary assertions; isolated late-proof fixture initially failed due an inconsistent approval/deadline timeline, then its immutable creation guard correctly rejected an attempted fixture adjustment. Fixture setup now seeds the older approval at insertion; its legacy five-minute payment-window expectation was also reconciled. Original local logs /tmp/tighten-late-proof*.log retained. The first consolidated local check was stopped to separate conservative expiry bounds from polling and preserve integer budget timestamps. Consolidated verification follows before one PR update. No merge/deployment/provider acceptance. Production sandbox/manifest mismatch remains a release blocker.

#### Latest owner sandbox acceptance — 1 November 2026, Singapore

Owner reports success and supplied test3.devtools. HAR confirms checkout association3070ms, confirmed/verified response after three polls, and receipt200. From first return-side API request to confirmed response was8.663s; receipt completed9.128s after that request (network evidence, not measured paint). Catalogue224ms/calendar281ms. Matching attempt hash93a829933d0fa165df5b36b65404bae8c897027e152b92916cbdf0b83b383128 correlates recovery to successful webhook correlation2fbf3d58-81c3-40cf-861e-fd87d44cc5e7: HTTP202 in929ms, recovery complete in5758ms including1373ms queue,330ms HitPay read,1077ms booking-before,1854ms accounting and1015ms booking-after. Runtime version101c45da-cf01-4689-bb15-e969cf8dac67. This supersedes the earlier webhook-authentication failure for this tested delivery; no secret contents inspected. One owner sandbox sample does not establish latency percentiles or live-payment acceptance. Two zero-duration internal context/status error traces coexist with successful HAR responses; their cause is not established. No assistant payment/replay or CI run. The closed-manifest/runtime mismatch and production email setup remain pending.

#### Current configuration audit — 1 November 2026, Singapore

This read-only checkpoint supersedes earlier closed-runtime statements below; those remain dated history. Canonical main and client deployment are f99a1ee1d92b8413e54baf7600a82ebbc78ca60d (deployment41255109162 successful); staging reports PR14 head aa5885275b8c9a2c1537023c7e6a61c6ef93cd13. Cloudflare settings confirm all eight client guest-sandbox secrets and all ten staging secrets by name/type, matching account/D1/coordinator bindings, enabled sandbox/recovery switches and a once-per-minute schedule on each Worker. Secret presence does not establish secret correctness. Client webhook deliveries returned401 during signature validation; its per-endpoint salt remains unverified. The owner's captured attempt subsequently completed through automatic recovery at08:35:03 SGT, with7794ms recovery processing. No assistant payment/replay occurred.

Production RESEND_API_KEY and IDENTITY_PEPPER are absent with identity delivery deliberately disabled; client sender integration/DNS acceptance remains pending. Staging TURNSTILE_SECRET versus client TURNSTILE_SECRET_KEY is intentional. Production manifest remains closed and will disable the current runtime sandbox overrides on another normal release; reconcile before releasing again. Production query-string redaction is true, staging false; native traces remain disabled, application logs enabled. GitHub connector rejects Actions secret/variable listing, so current repository settings cannot be directly certified; workflow requirements and successful deployment evidence were inspected instead. Cloud Containers reports configured developer credentials ready, not client credentials; its developer signing secret is still represented as a runtime variable. No secret values inspected, settings changed, CI triggered or application tests altered by this audit.

#### Loader logo cleanup — prepared 31 October 2026

Owner paused guest sandbox testing to fix speckled cyan in the loader logo. Branch `fix/clean-loading-logo` starts from merged main `bcb5e8e85cd31aece7394a8c1b6ff68d60061068`. Inspection reproduced the noise in a static render: darkLogo was an SVG wrapper around a JPEG with a colour matrix, not vector artwork. Prepared a cleaned raster restoration with solid cyan lettering/strokes, optimized to a 44,650-byte WebP at 1130px width. The shared darkLogo mapping updates the loader and footer; the header's separate light logo is unchanged. Original source asset remains available for comparison. Loader animation, timing, accessibility and payment logic are unchanged. Visual fidelity still needs owner review; no browser was operated by the assistant.

#### Runtime acceptance checkpoint — 31 October 2026, 22:05 Singapore

PR12 merged as `bcb5e8e85cd31aece7394a8c1b6ff68d60061068` after all 13 final-head jobs passed in run41203309066. Independent main run41206136608 and production deployment41207347576 passed. Owner explicitly authorized enabling client guest sandbox checkout for an owner-operated test. Cloudflare settings PATCH succeeded and readback confirmed client sandbox/provider/customer access, HitPay checkout/recovery/webhook and live readback enabled, with the existing app404 sandbox pairing and SimplyBook services3/4. Public display warming and token refresh-ahead switches are enabled. Identity email remains disabled; all eight installed secrets were preserved by inherited bindings. No booking, payment or email was performed by the assistant.

This is an explicitly authorized runtime override, not a change to the sealed release manifest: the manifest remains closed and the next normal deployment will disable access. Reconcile release activation policy in a reviewed follow-up before relying on persistence across releases. D1, coordinator identity and apac-ne hint are unchanged.

Application timing logs are enabled/persisted at sampling1; Cloudflare telemetry query returned production foundation_trace events, including the new runtime version `1170ba6b-b929-4b30-8c55-377d4f4861b9`. Query-string redaction is now enabled. Native distributed traces remain disabled; Grafana production export/alerts remain inactive. Payment/recovery timings cannot be claimed before the owner's test. Workspace HTTP health read was blocked by CONNECT403; dashboard settings evidence does not replace public route/provider acceptance.

Automatic approval review rejected installation of the persistent once-per-minute schedule as not specifically authorized. Owner subsequently explicitly approved the persistent schedule. At 22:08:59 Singapore, PUT succeeded and GET readback confirmed exactly `* * * * *` on soccerbot-production. This proves schedule configuration, not execution or recovery acceptance. Pending: first scheduled execution, public health/calendar/provider checks, owner guest sandbox payment, correlated checkout/recovery timing report. Earlier closed checkpoints below are historical and superseded by this runtime observation.

#### PR17 implementation checkpoint — historical before synchronization

Owner requested repairing Dependabot PRs16/17 to passing CI before personally reviewing/merging. This branch updates Playwright1.58.2→1.64.1 with matching Noble images in the active target workflow and retained legacy policy fixture. The version-drift negative test now derives its input version from package.json and verifies mutations change valid configuration. Generated versions are refreshed from the lockfile. Original CI41371551538 failed frontend's stale versions inventory and every browser shard at launch because the image still contained1.58.2 browser binaries; Worker groups passed. These failures did not exercise application browser behavior. Existing Node24 meets the new Node20 minimum. First local verification caught Playwright removing lib/generated/clockSource.js. The existing Node-VM clock regression now extracts the installed injected clock from coreBundle.js using TypeScript AST, requiring exactly one source and retaining both timing assertions; it never loads a browser or substitutes a mock. Original failure /tmp/dependabot17-code.log retained; clock/policy checks37/37 passed. Full consolidated local verification/new-head CI follow; browser/device compatibility remains CI/owner evidence. Broader dependency audit found no package-version literals or private package imports in production src/worker. It did find the installer’s removed private registry path; the adapter now uses the installed exported bundle and has a real-package metadata-only regression alongside its retained executable checks. Reviewed runtime/CI pins and standalone installer runtime policy remain deliberate; this does not promise compatibility with arbitrary future versions. Consolidated local verification and final-head CI are required after this follow-up. Original repaired run41374085710 then exposed two live-email Chromium teardown failures (job125051191066): removing the route handler before pending Worker responses finished caused Playwright to continue the route and reject its later fulfill. All transport teardown callers already stop app traffic; drain now awaits tracked response work before unrouteAll. A deterministic delayed-response regression proves that ordering without suppressing errors, retries or changing product assertions. The intermediate installer-only follow-up does not fix this race; final consolidated CI remains required. No merge/deployment. PR16's action guard repair and PR15's payment work remain separate branches.

#### Current task — client provider configuration and acceptance

#### PR18 scope and validation checkpoint

PR18 adds dependency suitability, deployment/configuration readiness and CI failure/efficiency skills, with AGENTS/runbook/development discovery links. It requires separate Testing-tool support, Our verified test coverage and Customer impact statements in dependency PRs; development owns exact browser coverage and UAT records exact OS/browser/device versions. Existing testing/documentation ownership and runtime permissions remain authoritative. No Actions summary or performance skill added. Local source/policy/format/link checks passed on the instruction-only revisions; original exact-head CI7bbdb1f passed all13 jobs in run41382500330.

For the authorized merge campaign, PR18 now incorporates PR17 synchronized head807dd43, including merged PR15 and refreshed PR16. Application and testing changes are inherited from those PRs; PR18's own delta remains instructions/documentation only. All histories are retained. The combined source passed local verify:code before instruction-only integration; final combined-head CI is required before merging. The owner's subsequent “merge all accordingly” is the requested consultation outcome and authorizes these merges after verification; no additional permission is needed for that same scope. Production remains closed in source, with manual activation accepted for owner testing.

#### Deployment continuation — client provider configuration and acceptance

Client GitHub deployment ownership and closed Cloudflare foundation are established. Client customer operations are **not activated**. Continue on Workers.dev while domain delegation/transfer is pending; do not repeat completed bootstrap work. Leave test 507 untouched.

##### Verified deployment checkpoint

- Canonical repository: `soccerbotstudiosg/soccerbotstudioSG`; developer writes use `LimYouSheng`. PR11 merged as `e3f2301f17673cca85bd990003b9891048ff909d`. Final-head verification [41155626100](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41155626100), independent main verification [41157066046](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41157066046) and production deployment [41158088719](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41158088719) passed. Customer/provider access remains disabled. Earlier PR10 bootstrap evidence is retained in Journey.
- Normal releases use Deploy verified release, operation `deploy`: trusted ready PR verification precedes staging; independently verified current main precedes production. `setup-foundation` is a separate manual operation, not part of each release. Developer legacy Verify is owner-confirmed disabled and its repository private; staging remains a separate public endpoint without confirmed Access protection.
- Client account `0b36822648e6905c681a90b6bec5ca7f`, Worker `soccerbot-production`, origin `https://soccerbot-production.lucky-poetry-b25e.workers.dev`, D1 `e2a21801-0107-4db5-8551-ca1ff338df53`, namespace `8420d1cf21eb4af996ecc06adbd6bef4` are retained. All 35 migrations were applied during bootstrap.
- Foundation setup [41084843753](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41084843753) passed. D1 registration matches named coordinator `simplybook-production-account`, ID `c8a6f33d2f0f3d6b32a8a51ae9f74459a87692feb73c765ac4c5219a09783cd0`; the object-list API subsequently returned that ID with `hasStoredData: true`. No alarm or pending wakeups were reported.
- On 31 October at 00:07:57 SGT, a controlled repeat (attempt 2) passed with native tracing temporarily enabled. Trace `eb3b9672b2663f6dc31fc7c8a3c4a482` ties the exact coordinator ID and `inspectFoundation` RPC to `cloudflare.colo=KIX`. This proves observed coordinator execution in Osaka, independently of D1 primary KIX metadata; it is not a permanent placement guarantee. The `apac-ne` hint and identity remain unchanged. Original tracing settings were restored; Grafana production export is not activated.
- Customer/provider access remains disabled. The owner subsequently installed six client secret bindings (names-only evidence below). Authentication acceptance, production payment contracts and owner acceptance remain pending. Initial 404/missing-foundation failure and Cloudflare assets-upload error10013 are retained historical failures; later success does not erase them.

##### Confirmed provider rules and inspected configuration

Owner confirmed client SimplyBook company `soccerbotadmin`, business SoccerBotStudio Singapore, timezone Asia/Singapore. Keep developer company `soccerbot` separate. On 31 October the owner confirmed **both staging and production permit only one simultaneous booking across the account, with no admin exemption**. This supersedes earlier staging exemption evidence. Settings are owner-confirmed; controlled cross-trainer/customer/admin enforcement acceptance remains unperformed.

Read-only inspection of client company: service 3 Kickoff Special S$108 and service 4 Weekend/Public Holiday S$128, each 40 minutes plus a 10-minute buffer. Active providers Faisal (2), Nabil (3), Caelan (4), Rifqi (5) and Azam (6) are linked to both services. Company and both service weekly hours are noon–8pm daily. All trainer weekly days are off; owner confirmed this is intentional and availability is entered by date. Owner authorized mock date-specific availability for all five trainers, 3–21 November 2026, noon–8pm Singapore time: all five 19-date update requests succeeded (95 trainer-date entries). Readback verified 21 November for all five; not every intermediate date was independently reread. Weekly schedules and 22 November onward were excluded from every write. Read-only checks found existing noon–8pm entries on 22 November for all five, left untouched; the owner identifies that as the official opening date. Owner confirmed final client weekday/weekend-or-public-holiday prices of S$108/S$128, four-hour booking notice and a 15-minute unpaid invoice timeout. Read-only timeline probes for all five providers on 3 November (service 3) and 21 November (service 4) returned the same nine 50-minute starts from 12:00 through 18:40; this sampled two dates, not every mock date. API, Accept payments, Multiple bookings, Limit bookings and custom booking interval features are enabled; enablement alone does not verify their settings, plan entitlements, cutoff or invoice timeout.

Next steps: complete reviewed production provider/service/credential integration and owner acceptance. Owner confirms HitPay merchant/bank setup is still pending; live guest payment testing cannot proceed. Resend domain `soccerbotsg.com` was created in the confirmed client-owned account (Tokyo region, sending only, tracking off), but DNS verification/setup is paused at owner request because authoritative DNS access is unavailable. Intended sender is contact@soccerbotsg.com. No DNS changes or email sends occurred. Preserve developer mappings and historical booking/payment records.

##### Test and documentation reconciliation

The checkpoint update changes capacity acceptance and scheduling instructions. PR11 additionally repairs the browser retention test calendar fixture after its first CI failed at the October/November boundary. Retained `worker/tests/catalogue.test.mjs` checks reject unverified shared capacity and contradictory provider schedules without booking writes; these synthetic assertions do not verify account-wide or admin provider enforcement. Existing Worker/catalogue tests remain valid; no test titles, fixtures or strict inventories are removed or altered. Admin UAT must test the shared limit across different trainers and an admin attempt; Trainer UAT must preserve weekly days off and verify date-specific availability. These checks remain unperformed, not inferred from CI. Foundation CI and cloud execution receipts are separate from provider, device, payment and email acceptance. Source owners still require a reviewed implementation for production provider portability.

#### Current domain handover — pending vendor action

The client zone was prepared and inspected, with assigned nameservers `daniella.ns.cloudflare.com` and `merlin.ns.cloudflare.com`. Cloudflare Registrar requires the destination zone to become active **before** initiating the EPP transfer. Existing registrar DS status and five extra cPanel service proxy settings require vendor review. Preserve email hosting; no assistant DNS change or message send. Once the vendor confirms the nameserver change, recheck zone activation and email routing before guiding the owner through EPP/payment submission. Never place the EPP code in repository evidence.

#### Historical deployment checkpoint — retained context, not current task status

#### Verified main and completed PR stack

Final merged revision: `dffb24a12aae68de4ee32d6e7477bf227b3f0c50`. [Main run 40684219386](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40684219386) completed successfully: frontend, backend and live-email gates, frontend deployment and Cloudflare deployment. This proves the existing developer deployment workflow, not client production activation. Before starting this new documentation branch, GitHub had zero open PRs and zero pending/queued/running workflows; that is a checkpoint, not a continuously live count.

| PR                                                               | Outcome | Merge revision                             |
| ---------------------------------------------------------------- | ------- | ------------------------------------------ |
| [111](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/111) | Merged  | `cb33dec4102d2b9cb4a3219c920d99046483840e` |
| [112](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/112) | Merged  | `e9e6bbe4d35ac161dbf8651bff9ee521a51279ae` |
| [113](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/113) | Merged  | `28333129b94e2b6a728724e5c19f602125d951e1` |
| [114](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/114) | Merged  | `f176954c88a47419baa1a034255c8745a11e88cf` |
| [115](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/115) | Merged  | `dffb24a12aae68de4ee32d6e7477bf227b3f0c50` |

PR114’s consumed-response repair and PR115’s dismissal setup/inventory repair passed final checks. Original failure receipts and their explanations are retained in [Journey’s dated history](journey.md#part-2--dated-changes-and-evidence). The earlier PR112 tablet timing failure has no established root cause; later green runs do not retroactively diagnose it. It is a retained investigation item, not a currently failing final-main gate.

#### Remaining deployment and handover work

- Domain/email preservation, registrar transfer and final domain/HTTPS acceptance remain pending vendor/owner action; use the current domain handover above.
- Configure client SimplyBook, Resend, Turnstile secret and HitPay with separate staging/production credentials. Preserve account/host guards and require exact-final-head gates for implementation changes.
- Company-central Grafana ingestion, environment separation, dashboards, alert delivery and primary/backup responders remain pending. Temporary native tracing did not activate that system.
- Complete owner booking/payment/account-action UAT, controlled capacity checks, rollback/recovery evidence and billing/MFA/access handover before customer activation.

Working checkout: `/workspace/SoccerBotStudioSG`; preserve the dependency symlink and unknown files. No provider changes or live financial/customer actions are authorized by this documentation checkpoint.

#### Active implementation — pricing and growing rosters

Branch `feat/client-provider-configuration`, base `e3f2301f17673cca85bd990003b9891048ff909d`. Scope: environment-specific prices and complete bounded calendar reads for a growing trainer roster. Production activation, live payment/notification actions and DNS are excluded. Acceptance: all linked trainers retained, two concurrent ongoing reads, complete-cache-only behavior, deterministic failures and bounded work/payload; staging prices and shared-studio capacity retained. One implementation/check/review block, at most six iterations/90 active minutes; exact-head CI required before a separately authorized merge.

Implemented: developer/client pricing profiles; calendar catalogue price validation uses the trusted environment. The three-trainer cap is replaced by 96 range reads per service/calendar request, two ongoing read lanes and serialized admission. Daily/monthly offers and encoded payloads are bounded; incomplete trainer/date results reject the refresh. Finite experiments remain sequential. Existing expiry, cache isolation and invalidation guards remain. The local client sandbox follow-up supports environment-bound native grants and sandbox payment recovery; deployment remains closed and live merchant integration is pending. Local follow-up configuration adds explicit client company/service mapping and environment-selected credentials; it does not complete production checkout.

Tests: added environment-price/cart, large-roster browser-service and schema-budget assertions; added four Worker catalogue cases for 20 trainers, shared caching/concurrency, excessive work/response size failed sibling drainage and serialized admission/budget checks. Updated omitted-date expectations to reject incomplete trainer lists. Inventories include all new cases; no removals. Final focused pricing/booking/browser-service checks passed 52/52. Worker catalogue checks passed 43/43, including the added admission test. Source/policy checks, Worker boundaries/types and changed-code lint passed. One initial Worker source check rejected the English word “any” in a comment under its blanket unsafe-type pattern; the comment was reworded without changing or relaxing the checker. Original PR12 head `3f87d2a1777f51f872b96a9a5ed81f734e57a598`, run41164857960, failed frontend tooling and contracts evidence validation. Frontend job124430111549 retained stale461/109 counts and a no-op negative fixture; contracts job124430111546 passed113/113 runtime cases but rejected the four new inventory entries appended out of declaration order. Artifact13028607374 preserves the contracts receipt. This was an incomplete dependent-guard update, not a failed booking assertion. Repaired inventory order without adding/removing cases, updated reviewed totals to465 (113/188/164), made the negative count fixture size-independent and explicitly non-no-op, and added literal-source-order regression coverage. The new regression rejected the original ordering; the same captured CI TAP rejected before and passed after the order-only repair. The testing skill now explicitly requires all dependent-guard updates and wrapper/evidence validation. Repair validation: all178 tooling tests and seven focused shard/group tests passed; source/policy/lint/format checks passed. The original run finished with all four browser shards and sustained/recovery groups passing; aggregate backend/live-email gates were skipped because contracts evidence failed. New exact-head CI remains required. Browser execution remains CI/owner-operated.

PR11's original run41153806593 failed its calendar-boundary retention fixture; final head d508b4806490fe2b32c37dc985dcb8f6ae00c077 passed and merged. Original jobs124396706565/124396706641 and failure artifacts remain evidence; the advancing fixed-date fixture repaired the October/November mismatch. The prior shard audit retained all 296 frontend/browser titles and 454 original Worker cases plus seven foundation additions; this branch adds cases without reducing any group.

PR12 final head `0cfc27d9b58ac597f2ad4ef53d421d7d70782b86` passed all 13 jobs in verification run41166049859. Owner-authorized staging deployment41167107951 attempt2 passed with Worker version39480c81-db76-438f-ae9d-8b87a582dc3e. PR is ready for review but remains unmerged. Owner requested consolidating configuration before another CI run; keep subsequent edits local until the next coherent candidate.

##### Owner-installed client credentials — 31 October 2026

Names-only Cloudflare inspection confirmed these six secret bindings on client account `0b36822648e6905c681a90b6bec5ca7f`, Worker `soccerbot-production`: `SIMPLYBOOK_PROD_API_KEY`, `SIMPLYBOOK_PROD_SIGNING_SECRET`, `SIMPLYBOOK_PROD_ADMIN_API_USER_KEY`, `SIMPLYBOOK_PROD_COMPANY_LOGIN`, `SIMPLYBOOK_PROD_ADMIN_LOGIN` and `TURNSTILE_SECRET_KEY`. Owner supplied them privately. Company login is soccerbotadmin; the owner identified the API user's login as contact@soccerbotsg.com. Presence does not prove correct values, successful authentication or webhook signing. Deployed production still uses the earlier code. Local follow-up wiring selects production SimplyBook names and verifies the expected company, without fallback to developer keys.

Turnstile widget SoccerBot client Worker, public sitekey `0x4AAAAAAFr7YXp64r3SY34-`, was inspected in the client account: managed mode, allowed hostname soccerbot-production.lucky-poetry-b25e.workers.dev. Secret contents were not returned or compared; browser token/siteverify acceptance remains pending. Owner reports a five-year API User Key expiry; exact expiry and responsible renewal owner are unrecorded, and no reminder has been created.

Local configuration implementation now selects production credentials, company and service mapping (3 weekday,4 premium), preserving developer isolation and closed production operations. It also resolves the installed Turnstile binding name: production uses TURNSTILE_SECRET_KEY; staging retains TURNSTILE_SECRET. Consolidate changes before the next full CI. HitPay merchant configuration remains pending; Resend/DNS remains owner-paused. No merge, production activation, booking, payment or email send follows from installing these secrets.

Earlier local configuration validation (31 October, before the client-sandbox slice below): all179 tooling tests passed; strict Worker wrappers passed contracts115/115, sustained188/188 plus load smoke, and recovery164/164 (467 total). Execution source fingerprint: `a8ce2de4d941a373af19f488a3ab30e67367283fff8eb2448f21e90a2c7fb0b2`; subsequent edits reconcile documentation only. Worker types, source/layer checks, source/policy and changed-code lint passed. No test cases were removed; inventory declaration order and dependent totals now115/188/164 were checked. First local checks caught generated developer-literal type narrowing and an invalid `another-environment` token-cache fixture; use validated environment parsing and a valid production credential scope to preserve the cross-environment cache rejection assertion. The first failed contracts log is retained at `/tmp/soccerbot-config-contracts.log`; successful local logs use `/tmp/soccerbot-config-*.log` and strict receipts under `test-results/worker-group-*.json`. No new CI, push, merge or deployment occurred. This earlier configuration slice is superseded by the client-sandbox implementation and final local evidence below. Client live payment and identity-email contracts, real authentication and owner acceptance remain pending; do not activate access from these local passes.

HitPay setup decision: owner authorized reusing the existing app404 sandbox for client testing; a separate client sandbox account is not required. Preserve developer staging's existing merchant and historical payment scope. After the owner saved the app404 sandbox credentials, names-only client Worker readback confirmed HITPAY_SANDBOX_API_KEY and HITPAY_WEBHOOK_SALT alongside the six existing SimplyBook/Turnstile secrets (eight total). Secret values were not read and authentication/signature acceptance was not established. Client-company sandbox payment/grant integration has now been implemented locally as described below, retaining closed payment/access switches until separately accepted testing. Secret installation alone does not authorize activation. The subsequent local client sandbox integration and its validation are described below; deployment remains closed. No webhook destination or sandbox credential rotation is authorized by this step. Eventual live client merchant setup remains separate.

##### Active slice — client guest sandbox integration

Owner authorized reusing app404 sandbox with client SimplyBook soccerbotadmin. Local implementation adds an explicit client sandbox access gate, validates company/service and sandbox merchant/business pairing, permits environment-bound native grants/journal/payment scope, and preserves production identity during confirmation. Client grants require the client pricing profile, four-hour notice, premium mapping and customer-choice scheduling without finite developer trial exceptions. HitPay transport remains sandbox-only. Production target rendering forces CLIENT_SANDBOX_ACCESS=disabled; deployment validation rejects activation or substituted expected merchant/business values. Developer staging resources, provider credentials and history remain unchanged. Client email identity flows, live HitPay, provider webhook onboarding, deployment and owner acceptance remain outstanding.

Added client guest runtime coverage for duplicate holds, repeated payment creation, paid recovery and receipt; rejected disabled/foreign pairings before provider dispatch. Added contract cross-scope/price/trial-exception rejections and artifact mapping/activation mutations; extended the existing frontend catalogue test to accept the correctly scoped client response and reject a cross-environment response. No removed titles; Worker inventory increases467→470 (116 contracts,190 sustained,164 recovery), with dependent totals and literal ordering updated together. First focused fixture assertions incorrectly expected duplicate combined-checkout requests to both return200 and a guest-cookie request to return503 when closed; actual routes distinguish hold replay from checkout execution and permit guest capability creation. The test now exercises the existing duplicate-hold path and asserts the booking guard's exact400 combined_hold_unavailable response with zero provider effects. No application guard or timeout was relaxed. Original focused logs remain `/tmp/soccerbot-client-sandbox-focused*.log`.

Work block: local client-sandbox slice, up to6 iterations/90 active minutes; four implementation/fixture-check iterations completed. Focused client tests3/3, tooling180/180, frontend service checks12/12 plus the updated catalogue4/4, Worker types/source/policy and changed-code lint passed. Complete Worker wrappers passed as recorded below; final-head CI, merge and deployment remain unperformed. Do not open the client sandbox merely because the code or secret names exist.

Final local client-sandbox validation: strict wrappers passed116 contracts,190 sustained plus load smoke,164 recovery (470 total); all180 tooling tests passed and the final four group/inventory guards passed. The first contracts run115/116 failed the legacy assertion rejecting production catalogue scope. Replaced it with separate-cache read counts, cache-only miss before a client read, retained client cache after developer invalidation, and unknown-environment rejection. No case/title was removed. Sustained/recovery receipts use fingerprint `6dbf6af68c3624a8ec327f7cea783b453c34ac41f9ef476010d74bfd2ada9dc4`; contracts rerun uses `574ab6eb5209183e281d103fe1dfa102c851ce49ad39698f30fdcc236bb3f148` after that catalogue-test-only correction. These are local scoped receipts, not a fabricated same-fingerprint aggregate or final-head CI pass. Original failure `/tmp/soccerbot-sandbox-contracts.log`; successful `/tmp/soccerbot-sandbox-contracts-final.log`, sustained/recovery logs and test-results receipts retained. Documentation and a grant-description comment were reconciled after verification; runtime behavior was unchanged. Next: review the consolidated local candidate for the planned single CI run; no push/merge/deployment or real provider actions occurred in this slice.

##### 31 October — staging calendar/trainer request audit

Owner reports staging does not show the previously requested single time/trainer section and first-available-day/loading behavior. Read-only staging health confirms revision0cfc27d9b58ac597f2ad4ef53d421d7d70782b86, version39480c81-db76-438f-ae9d-8b87a582dc3e. Served booking JS includes trainer-choice/time-choice, trainer selection, Checking available dates and See next month markers; this is HTTP/source evidence, not browser visual acceptance. GitHub confirms developer PR120 and121 merged. Current source retains per-slot trainer selection, but PR121 deliberately styles the dropdown as a separate bordered section. First-available-date selection from fa5a30c is limited to the displayed month; the existing regression explicitly requires manual navigation from empty October to November. The date grid renders immediately with a compact loader below it, not a calendar-area loading replacement. Therefore the stronger requested cohesive-card and cross-month initial selection/loading behavior is not fully implemented; no missing deployment or browser-cache cause was established. No UI code changed during this audit. Owner confirmed the inspected endpoint is the page being viewed: soccerbot-dev.limyousheng-94.workers.dev/book/time/.

##### Active UI correction — calendar discovery and unified time/trainer card

Owner authorized correcting the audited staging behavior. Implemented one shared outer time/trainer card with an internal divider and keyboard focus outline. Initial live calendar entry without saved sessions now shows an in-panel spinner instead of provisional dates/times, searches current plus three following months sequentially, and selects the first eligible date. It stops on failure or manual navigation; valid saved/selected dates and later manual browsing/refresh semantics remain. No retries, polling, expanded horizon or backend changes. Focused26/26 component tests passed, including new deferred-response scenarios for initial loading, next-month availability, all-empty horizon, failure and manual navigation superseding an old reply. Existing valid-choice/refresh/restoration tests retained. Frontend/browser inventory299→300; Worker inventory remains470. Existing owner/CI browser trainer test now checks shared-card borders/divider; browser execution and visual acceptance remain unperformed. Documentation and Simulated-user UAT reconciled. Full local verify:code passed on the consolidated candidate:246 unit/component cases with exact inventory and zero skips/retries, tooling/installer, format/lint/types, build and export11 routes. Browser execution remains CI/owner-only; no push, merge or deployment occurred. Dependency audit passed the configured high-severity threshold but reports16 moderate vulnerabilities, retained for the separate dependency/security review.

UI verification receipt: `test-results/verification-code.json`, status passed, source fingerprint `dad9b9b48678fbd95711f6bb9aa6790643eb9f339bebf0c6c5aee1afe1026b29`; execution preceded this documentation-only evidence update. Full log `/tmp/soccerbot-ui-verify-code.log`. The deployed staging revision remains0cfc27d until the consolidated candidate is published, verified and deployed.

Logo validation: all nine `src/components/booking-navigation.test.tsx` cases passed; `npm run check:source` and `npm run check:policy` passed. No new test or inventory change is needed for an asset-only mapping change; existing loader behaviour assertions remain intact. Payment/recovery/runtime owners and rules are unchanged by the logo repair.

##### PR13 first CI failure and repair — 31 October 2026

Run41209467303 on head11267bfc8cac639a7233db143f4906937def1836 failed frontend and both backend browser shards because the existing oracle booking sizing test still asserted the old footer SVG filename. Desktop Chromium, phone WebKit and tablet WebKit all received the intended new WebP. This was an incomplete dependent-test review by the assistant, not an observed payment/runtime failure. All Worker groups and both live-email browser shards passed; aggregate gates were skipped after the browser failure. Original job evidence is retained in jobs124561232153,124561835019,124561835049 and their uploaded artifacts.

Repair updates the exact expected footer asset path without changing the header assertion, layout checks, test title, retries or timeouts. Full-source search found no other executable reference to the retired dark-logo filename. Earlier statements that no test update was necessary are superseded by this finding. Inventories, counts and shard assignments remain unchanged because this updates an existing assertion. Browser execution remains CI/owner-operated; new exact-head CI is required.

##### 1 November 2026 Singapore — guest sandbox re-enabled after logo release

Owner requested test checkout activation after PR13 merge. Main verification41216341934 and deployment41217448707 passed for d49dc3e5b67ae0701568a54bfb57a9651332feb1. Cloudflare readback confirmed that release had restored closed access. Re-enabled the previously authorized client guest sandbox pairing and access/payment/recovery/webhook switches on this exact revision, preserving secret/resource bindings. Identity email remains disabled. The persistent once-per-minute schedule already existed and was verified, not duplicated. Application timing logs remain enabled/persisted; restored query-string redaction. These remain runtime overrides and will require reconciliation with the closed release manifest. Owner test/provider acceptance and timing measurements are pending; no assistant booking/payment/email operation occurred.

##### Client public catalogue portability repair — 1 November 2026 Singapore

Owner observed session information unavailable after authorized activation of d49dc3e. Production telemetry confirms /api/catalogue returned503 (correlation9635ad97-45f5-4669-901e-97ca776d7e51); an earlier request e73961f0-4c01-4943-9ca1-31e2e74f2fb8 had an admin-auth transport success and failed after provider reads. The public endpoint's precise error text remains unavailable through workspace/web fetch. Read-only SimplyBook connector confirms client services3/4 at108/128,40-minute sessions,10-minute buffers and five providers.

Source inspection found a definite portability defect: internal catalogue bindings accepted production, but customerCatalogueSchema retained z.literal(developer), rejecting the public production projection on both Worker and browser. Existing browser-service rejection tests incorrectly classified production as foreign. A new production iteration within the existing service test failed before the schema repair (1 failed/3 passed; /tmp/client-catalogue-before.log) and passes after. The schema now accepts only developer/production; unknown environments, extra/private fields, stale/future/partial/oversized responses remain rejected. Extended the existing Worker public-window case through production projection and customerCatalogue route.

Dependent review: searched remaining developer-only schema checks and catalogue consumers; retained same-origin transport, public-only DTO, service filtering, caching/deadlines and strict field guards. No test titles/counts changed, so inventories and shards are retained. Focused service tests8/8 and Worker catalogue46/46 passed. Full code/contract-wrapper verification and exact-head CI pending. No provider mutation, booking/payment/email, merge or deployment occurred in this repair.

Verification process correction: the first local contracts wrapper completed its runtime cases but rejected the receipt because documentation was updated during verification, changing the source fingerprint. Its original log is retained at /tmp/client-catalogue-contracts.log. The concurrent code wrapper has the same invalidated baseline; neither is claimed as a final candidate pass. Freeze the candidate before rerunning final wrappers; exact-final-head CI remains required.

##### 1 November 2026 — restore sandbox after catalogue repair release

Main verification41254073431 and deployment41255109162 passed for f99a1ee1d92b8413e54baf7600a82ebbc78ca60d. Owner still saw unavailable sessions. API inspection found the new revision installed but CLIENT_SANDBOX_ACCESS, LIVE_CUSTOMER_ACCESS, PROVIDER_ACCESS and HITPAY_CHECKOUT disabled by the closed deployment manifest. Restored all previously authorized guest sandbox/recovery/webhook/readback/warming settings, preserving eight secret bindings and identity email disabled. Settings readback succeeded; no CI rerun, booking or payment occurred. Workspace public catalogue HTTP remains blocked by CONNECT403, so end-to-end availability after restoration requires owner refresh and correlated telemetry. The permanent manifest/runtime mismatch remains unresolved and must be reconciled before another release.

##### 1 November 2026 — return-latency diagnosis

Read-only queue query for owner test3 confirms foreground start00:47:30.889UTC, display jobs start00:47:33.624 and00:47:37.403, recovery enters00:47:46.090 and starts00:47:47.463 (1373ms wait), completes00:47:51.848. The preceding display job therefore occupies the serial queue for about10.060s. holdCustomer queues bookingComments followed by refreshDisplayAfterWrite; calendar warming is the likely second job but current provider_queue telemetry lacks an operation label, so exact attribution remains inferred. Recovery priority cannot preempt active display I/O. Recovery's active processing4385ms plus queue1373ms and subsequent browser poll account for the observed delay. Commit7ef7503 (20 October) deliberately gated customer success on current confirmed-booking/paid-invoice readback, replacing early payment-only confirmation; this predates client migration. No source/runtime changes or real provider operations were performed. Next owner experiment: two sequential one-session sandbox checkouts, immediate payment versus waiting20seconds on HitPay before paying, preserve DevTools logs through receipt. Compare background queue overlap and return timing; do not infer general latency from two samples.

##### 1 November 2026 — proposed pre-accounting success boundary review

Inspected recovery, native transport, confirmation/proof guards and October19/20 history. The proposed fresh valid-booking plus verified HitPay payment boundary still permits an unpaid SimplyBook invoice. Recording external payment is PUT /admin/invoices/{id}/accept-payment, not optional local bookkeeping. SimplyBook's Accept Payments documentation states unpaid transactions/bookings are automatically cancelled at the configured timeout; owner configuration is15minutes. Therefore pre-accounting success cannot meet the requested no-false-success guarantee if accounting fails or remains unknown. Existing lost-write handling retains unknown state and uses readback without duplicate writes. A successful mutation response alone has not been established as an atomic booking-and-paid-invoice guarantee. Keep current success gate; do not restore legacy pre-read/payment-only proof. Four focused isolated regressions passed (lost accounting response, cancelled booking, failed booking read, on-time payment after hold expiry), log /tmp/confirmation-boundary-review.log. No application/test source changed and no CI/provider effects. Queue scheduling and browser confirmation-delivery improvements remain separate latency candidates; they do not require weakening this boundary.

### 2 November 2026 — Documentation reconciliation after PR19

PR19 merged asfc52077; independent main CI41463340174 and production deployment41465604404 passed. Production job125346381997 installed Workere18d326e-f191-4f4a-92f0-cda7e2efcfa8 with closed customer/provider/payment/email switches. Staging retains tested7634a29. Local invoice display, confirmation animation and proposed message refactoring are not deployed. Replaced competing Progress checkpoints with one current handover, preserving their full prior evidence in the archived subsection. At owner request removed cross-project names/links from current and historical documentation while retaining the decisions and failure evidence; original bytes remain in Git history. Corrected retired export references, invoice/storage wording and implemented client topology. The subsequent owner request authorizes the small scenario catalogue, now in docs/booking-flows.md; it describes local source and does not establish physical/provider acceptance.

### 2 November2026 — Approved copy, feedback spacing and scenario diagrams

Applied the owner's twelve-row copy selection exactly, including the loader instruction and Continue-payment wording. Unselected recommendations remain proposals. Paid-but-unresolved fallback now retains the payment-received message rather than contradicting it; extended the existing proof-invalidated regression to assert this and the alert container. Feedback uses existing alert/notice classes,12px title/body spacing and8px paragraph spacing; pending header paragraphs have12px separation. Source message inventory and browser locators were reviewed without changing case counts. Focused151-case run initially passed149 with two stale substring expectations (saved confirmation and changed email session); retained /tmp/approved-copy-focused.log, updated those expected customer outcomes, and all22 cases in that file passed in /tmp/approved-copy-retest.log. No authorization/payment guard was relaxed. Added19 compact Mermaid scenario diagrams with one-line descriptions, including revoked access, partial batch, reconciliation, expiry, OTP return and consecutive journeys. Full final verification follows on frozen source; no new CI or deployment.

Validation receipt: combined non-browser `verify:code` passed250 unit/component and182 tooling cases plus installer/source/policy/format/lint/types/build and11-route export. Full documentation audit parsed50 Mermaid diagrams and resolved1299 local links/anchors across26 Markdown files. Normalized comparison confirms original committed Progress evidence is preserved in its archive. No cross-project naming reference remains in repository documentation. Results are local; browser layout/physical provider acceptance and final-head CI remain pending. This receipt-only update changes no executable source; the saved full-code receipt is /tmp/combined-feedback-code-receipt.json.

### 2 November2026 — One scenario and message owner

At owner request consolidated current scenario messages and remaining copy-review proposals into docs/booking-flows.md. The19 small diagrams remain the primary view; the complete review is retained in an expandable section for reference. Removed the separate message-review document and updated ownership/navigation links. No application, test or deployment changes. Earlier references to a separate worksheet describe the preparation stage; the linked consolidated document is now authoritative.

Post-consolidation validation: all50 Mermaid diagrams parsed and1294 local links/anchors resolved across25 Markdown files. AGENTS, the documentation skill, Progress, UAT, code-owner guidance and Journey navigation point to the single scenario/message owner. No obsolete separate-message path remains. Existing executable verification remains applicable because this consolidation changes only documentation.

### 2 November 2026 — Approved frontend hardening follow-up

Owner approved shorter availability, identity and new-booking messages, accurate selection/reservation/checkout-expiry guidance, consistent notice actions, wrapping invoice references and accessible dialog headings/close controls. The first focused run passed166/169; three assertions still expected old copy. Retained `/tmp/frontend-hardening-focused.log`; updated those expectations without changing test titles, counts or guards. Existing leave-dialog browser assertion now checks the expiry-aware wording. No browser or provider execution, publication or deployment is implied.

Final consolidated `npm run verify:code` passed:250 unit/component cases,182 tooling cases, installer/source/policy guards, formatting, lint, types, production build and11-route export. Evidence: `/tmp/frontend-final-code.log` and `/tmp/frontend-final-code-receipt.json`. Documentation checks passed:50 Mermaid diagrams and1294 local links across25 Markdown files. Browser/physical acceptance remains pending; no new CI, publication or deployment.

### 2 November 2026 — Consolidated candidate pre-publication audit

Reviewed current AGENTS and repository testing/documentation skills, actual remote main fc52077, source diff, confirmed/pending invoice and animation guards, paid fallback, checkout expiry guidance, dialog semantics and test/inventory consumers. No new blocking logic issue found in this bounded pass. Worker contracts, dependencies, migrations, provider calls and workflow gates are unchanged. Existing full local verification is retained; browser CI and physical acceptance remain pending. Owner authorized publishing one draft follow-up PR and CI, not merge or deployment.

### 3 November 2026 — PR20 browser CI repair

[Run41512855656](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41512855656) on0bff7c6 failed in jobs125510336963 and125510336783. The dismissal test retained the obsolete “Your confirmation is saved” assertion on all three profiles. Desktop Chromium also measured the icon during its380ms scale animation (45.139px versus the48px minimum). Frontend, all Worker groups and backend browser shards passed; final backend/live-email aggregation was skipped, not accepted.

Update the dismissal expectation to the approved full message; retain saved-receipt, retry, attempt-identity and provider-effect assertions. Await the actual icon animation finished promises before measuring its final rendered bounds; reduced motion returns immediately. Keep the48px minimum, with no sleeps, retries, skips, timeout increases or inventory changes. This is a browser-test repair, not an application/payment change. Original run/artifacts remain failure evidence; owner/CI browser execution remains required.

Repair validation: source ownership/import/graph/test-control and policy guards, TypeScript, targeted ESLint and formatting passed. All1294 documentation links and50 Mermaid diagrams passed. No browser run was executed locally; the unchanged full application suite receipt is retained, and the repaired browser cases require new-head CI.

### 3 November 2026 — Retained checkpoint before Progress cleanup

The following snapshot preserves prior implementation details, receipts, failures and deferred setup items moved out of Progress. Its status statements describe the earlier observation only; use Progress and PR20 for the current checkpoint.

#### SoccerBotStudioSG current task and handover

Updated 2 November 2026, Singapore. [Journey](journey.md#part-2--dated-changes-and-evidence) owns historical decisions and retained failures; its archived handover subsection preserves the former Progress checkpoints. This file is the only active checkpoint.

#### Current outcome and scope

Working branch `fix/confirmation-invoice-number`; draft [PR20](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/20), inspected head `0bff7c6080992aee2bd37790000451c92c7e0058`. CI run41512855656 started automatically after publication and failed in live-email browser shards. Repairing two browser-test assumptions before one new push; no merge or deployment authorized.

Owner requested restoring optional provider invoice display for flow tests, a brief confirmation pop, a complete customer-message review, and reconciliation of all documentation. Current local implementation restores the provider number unchanged only on confirmed live cards when present; internal IDs stay hidden. The O/SI discrepancy is unresolved: same-tab navigation is a hypothesis, not proof of the provider's final paid-document mapping. The confirmed icon animates for380ms only when reduced motion is not requested. Neither change modifies payment/booking proof, expiry, accounting or provider calls.

[Customer message review](booking-flows.md#copy-review-baseline-and-disposition) contains251 message/guidance entries, current wording, proposed wording, safety constraints and recovery/reconciliation state mappings. The owner-approved twelve-row selection is applied locally; the additional frontend hardening suggestions are also approved and applied locally. Remaining unapproved proposals stay unapplied. Paid-evidence/unresolved fallback now preserves the payment-received message instead of contradicting it. Feedback uses shared alert/notice styling with explicit heading/body spacing. Consolidate any further owner copy changes before CI publication. No follow-up merge authorization. Custom email remains **on hold**.

#### Verified delivery state

| Surface    | Exact evidence                                                                                                                                                         | Meaning                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR19       | Head7634a29; all13 jobs passed in [CI41458664464](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41458664464)                                     | Includes472 Worker cases and the two three-journey browser sequences on all three configured profiles                                                                                                         |
| Staging    | [Deployment41461046935](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41461046935), source7634a29; Worker9751ec72-2d61-4cff-80b2-6d440f182e9d    | Verified staging candidate; no later staging deployment claimed                                                                                                                                               |
| Merge      | [PR19](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/19) merged asfc52077 at explicit owner instruction                                                  | Owner elected to merge before remaining physical/provider acceptance; not a standing waiver                                                                                                                   |
| Main CI    | [41463340174](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41463340174), success                                                                | Independent merged-revision verification completed                                                                                                                                                            |
| Production | [Deployment41465604404](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41465604404), job125346381997; Worker e18d326e-f191-4f4a-92f0-cda7e2efcfa8 | Exactfc52077 deployed at22:51 Singapore; release health passed. Deployment log records customer/provider/checkout/identity-delivery/client-sandbox switches disabled. Not live trading or provider acceptance |

The production release restores closed source defaults. Earlier manually enabled sandbox settings are historical and must not be described as currently enabled. No runtime activation was performed during this documentation work.

#### Local verification and remaining acceptance

- Invoice-only change:21 protected-confirmation component cases and complete non-browser `npm run verify:code` passed; logs `/tmp/invoice-restore-focused.log` and `/tmp/invoice-restore-code.log`. Existing test title/inventory updated together; case counts unchanged.
- Subsequent animation: source ownership/import/graph/test-control check passed. Full combined non-browser verification passed before this receipt-only documentation update; browser rendering and CI remain pending. No assistant browser/provider execution.
- Documentation reconciliation: archive competing Progress checkpoints, remove cross-project naming/links at owner request, reconcile retired exports, invoice visibility, client topology, production closed state and pending UAT. Review all canonical owners; unchanged dependencies, storage schemas and operational permissions require no invented changes. The initial link audit found four links affected by the archive/heading move; corrected relative paths and retained the former topology anchor. Initial Mermaid audit parsed all31 existing diagrams including historical Journey diagrams. Final checks passed: all50 Mermaid diagrams (including historical ones),1294 local links/anchors across25 Markdown files after consolidation, and no cross-project naming references. Normalized comparison confirms all original committed Progress evidence survives in the archive.
- [Booking scenarios](booking-flows.md) now contains19 small Mermaid diagrams at owner request, each with one-line scenario description and actions/messages. Includes revoked identity/confirmation access, unknown writes, partial batches, paid reconciliation, expiry/grace, OTP return, retained receipts and three consecutive journeys. Journey retains overview/history; contracts retain authority; role UAT retains acceptance.

#### Pending owner setup and acceptance

- Full provider/device tests: single → single → single; multi → single → single; Back → Continue → pay → same-tab return; reload/old links; correct separate receipts/payment identity; expiry/grace and interrupted card OTP/3DS/bank-app return. Synthetic passes do not establish issuer/browser behavior.
- Compare provider invoice number at first confirmation, saved confirmation, reload and old/new tabs with SimplyBook Pay. PDF/calendar actions are retired; no download acceptance remains required. WhatsApp Enquiry is implemented for Glenna +65 9014 3819; confirm staff handling/policies. Enquiry/dismissal does not cancel or refund.
- Productionize email: client DNS/sender verification, reviewed credential/sender scope, identity actions and duplicate-free provider booking notifications. Keep [HTML drafts](external-providers-config.md#complete-html-drafts-and-editor-setup) inactive until variables, paid triggers, recipients and layout are accepted.
- Junior employee/trainer individual SimplyBook accounts on mobile phones: owner creates/invites accounts, validates roles, costs, recovery/MFA and allowed/denied tasks. Proposed matrices remain in [Admin](uat/admin.md) and [Trainer](uat/trainers.md) UAT.
- Domain/email preservation and registrar transfer remain vendor/owner work. Destination zone nameservers were recorded as `daniella.ns.cloudflare.com` and `merlin.ns.cloudflare.com`; current delegation/DNSSEC/HTTPS acceptance has not been rechecked. Preserve mail hosting; never record EPP secrets.
- Live HitPay merchant/bank setup, sender delivery, controlled shared-studio capacity checks, rollback/recovery rehearsal, monitoring ingestion/alert delivery and operator access handover remain separately accepted work. Existing sandbox credentials do not establish live readiness.

#### Next action and budget

Push the bounded PR20 browser-test repair after local source/type/lint/format and documentation checks. Preserve original run41512855656. The icon-size assertion now awaits the actual finite animation completion before retaining the48px rendered-size checks; dismissal feedback expects approved wording while saved receipt, identity, retry and effect-count checks remain unchanged. Test titles/counts/inventories and workflow gates are unchanged. Verify the new exact-head CI; draft status still prevents staging.

Focused copy verification:149/151 initially passed; two obsolete substring assertions updated for the approved wording, then all22 cases in the affected file passed. Logs `/tmp/approved-copy-focused.log` and `/tmp/approved-copy-retest.log`; no skipped cases, retries or relaxed guards. Full `npm run verify:code` passed on the frozen application/test/diagram candidate:250 unit/component cases,182 tooling cases, installer/source/policy, format/lint/types/build and11-route export. Evidence `/tmp/combined-feedback-code.log` and `/tmp/combined-feedback-code-receipt.json`. This subsequent edit records results only; executable source is unchanged, documentation checks rerun, and new-head browser CI remains pending.

Documentation consolidation: owner requested one scenario/message document. Current messages stay in the19 small diagrams; the complete251-row review and remaining proposals are preserved in an expandable section of docs/booking-flows.md. Removed the separate message Markdown file and updated AGENTS, the documentation skill and all references. Application/test source unchanged; document/link/diagram checks passed for this consolidation. No separate message-document path remains.

Frontend hardening approved and implemented: shorter identity/availability/transition copy, accurate checkout-expiry guidance, consistent retry action layout, long invoice wrapping, unique dialog heading IDs and nonshrinking close controls. Updated existing assertions; no new or removed cases. First focused run166/169 retained in `/tmp/frontend-hardening-focused.log`; three obsolete copy expectations corrected. Final consolidated `npm run verify:code` passed:250 unit/component cases,182 tooling cases, installer/source/policy guards, formatting, lint, types, production build and11-route export. Evidence: `/tmp/frontend-final-code.log` and `/tmp/frontend-final-code-receipt.json`. Documentation checks passed:50 Mermaid diagrams and1294 local links across25 Markdown files. Browser/physical acceptance remains pending; no new CI, publication or deployment.

Repair validation: source ownership/import/graph/test-control and policy guards, TypeScript, targeted ESLint and formatting passed. All1294 documentation links and50 Mermaid diagrams passed. No browser run was executed locally; the unchanged full application suite receipt is retained, and the repaired browser cases require new-head CI.

### 3 November 2026 — Documentation ownership correction

Reduce Progress to one current checkpoint and immediate tasks. Preserve its former detailed evidence above, alongside the earlier archived checkpoints. Remove duplicated end-to-end, customer, recovery, staff and deployment overviews; their current owners are booking-flows, role UAT, business rules/contracts and the runbook. In particular, the removed deployment sketch omitted the required staging acceptance step and must not be used as a release procedure. Original milestone criteria and dated history remain intact. Update AGENTS and the documentation skill to prevent appending historical receipts to Progress again. This is a documentation-only change; no application, tests, workflow or provider configuration changes.

### 3 November 2026 — PR20 merged for owner trial runs

All13 jobs in CI41544574146 passed for61ff22e, including the corrected browser assertions. Owner then explicitly requested merge followed by trial runs. PR20 merged as662bea3764bb7546a216f1f4f3790fbcb1e28a67. Actual PR20 staging/provider acceptance was not established before this merge; it must not be inferred from green CI. Independent main verification/release remains separately checked. The local Progress/Journey cleanup is unpushed and excluded from the merge.

### 3 November 2026 — Formalize code-writing rules

Owner requested a repository code-writing skill guided by ZY-Ang/clawdy CLAUDE.md. Added soccerbot-code-writing: root-cause repair in existing owners, removal of superseded workarounds, authoritative configuration/provider values, legitimate literals/pins, positive outcome assertions, bounded regression/mutation evidence and proof of guard execution. The external repository's commands, hooks and merge policy are not imported. AGENTS routes code work to the skill; documentation skill cross-links its ownership. This is local instruction/documentation work, not a new automated enforcement hook or an application/configuration change; kept with the unpushed documentation batch.

Owner also requested adapting the reference to existing skills. Testing now owns bounded pre-fix/mutation proof, positive evidence of execution, copy-substring/animation review and missing-guard rejection; CI diagnosis checks these before treating an absent failure as success. Code-writing cross-links these procedures rather than duplicating them. Documentation skill links code-writing ownership. Reviewed dependency/deployment skills remain unchanged: the reference does not justify altering version pins, release permissions or provider acceptance. No mutation, browser or CI execution is claimed for this instruction-only update.

### 3 November 2026 — Guest sandbox checkout reactivated on production

Owner requested activation for trial runs on662bea3. The first broad settings update was rejected by automatic approval review; no mutation occurred. After checking the sandbox-only payment transport and required gates, a narrower settings PATCH succeeded: guest/customer/provider access, HitPay sandbox checkout/recovery/webhook and the previously reviewed app404/company soccerbotadmin/services3/4 pairing. Background warming, ongoing native readback, observability, email, schedules and resource settings were not changed. Independent settings readback confirms activation and retention of eight secret bindings. Public HTTP remains blocked by this workspace proxy; browser/provider acceptance belongs to the owner. Repository defaults stay closed and the next deployment can disable this override. No CI or assistant booking/payment operation.

### 3 November 2026 — test9 owner trial and diagnosed gaps

Owner accepted confirmation animation and requested a compact Refresh control right of the month chooser. Implemented locally with equal grid columns and44px minimum height; retained accessible name and retry owner. All17 booking-parity component cases passed; browser layout remains owner/CI acceptance. No push/deployment.

Offline HAR test9: checkout4210ms; initial catalogue6001ms; calendar16922ms initially and16683ms after Make another booking; first confirmed response approximately8792ms after return checks started. This HAR does not contain browser performance-mark entries, so it does not establish exact confirmation paint time. Server confirmation tracing establishes6120ms recovery: booking_before3030ms, accounting1737ms, booking_after1006ms, plus other stages. The booking_after fallback means the direct accounting response did not satisfy the existing validator; do not remove safety readback based only on latency. Approximately1.9s passed between recovery completion and the browser's confirmed response.

Server telemetry fills the missing HAR failure: catalogue and completed-dismissal requests each returned503 after approximately15.7s; display queue expiry was15000ms while the month calendar performed25 provider operations and returned200. Confirmed defect: long calendar work blocks catalogue and foreground dismissal. Runtime display warming/token refresh were left disabled during the narrower sandbox activation; this differs from earlier warm-cache trials, so timings are not an equivalent regression benchmark. Backend repair must prevent starvation while retaining provider admission, response correlation, bounded queues and transactional dismissal safety; it is not implemented in this checkpoint.

Receipt supplied order number O-00000006; owner supplied paid invoice SI-2026000005. Read-only SimplyBook Production invoice lookup independently confirmed the same provider invoice ID6 is now paid with number SI-2026000005. Thus number is stale provider metadata, not a UI-generated prefix. The current receipt reads retained observation data; correct final-document enrichment must remain separate from immediate safe confirmation, validate invoice association and avoid guessed prefixes. This backend repair also remains pending. Original telemetry/HAR retained, no assistant booking/payment/cancel/email actions.

### 3 November 2026 — shared calendar restoration and safety audit (local)

Owner requested restoring the shared calendar design, enabling warming before the next trial, consolidating the existing local changes and auditing unsafe paths. Branch `fix/shared-calendar-cache` starts from merged main `662bea3`; existing skills, documentation reconciliation and Refresh layout edits were preserved. Checkout no longer invalidates all month snapshots or starts a whole-month rebuild. Owner-scoped journalled dispatch excludes affected shared-studio times, including uncertain dispatches; preflight rejection removes only the rejected trainer/service offer. Price/transient errors are not occupancy evidence. Authoritative fresh day reads merge into retained display data without extending original expiry. Provider-confirmed day/scheduled reads can restore released capacity; local timeout alone cannot. Generation fences prevent older refreshes restoring exclusions. Cache-maintenance errors are diagnosed without replacing durable payment results. D1-only completed dismissal bypasses provider work and concurrent acknowledgements retain a single archive. Scheduled warming yields between provider operations when checkout/recovery waits; started reads drain, incomplete months remain unpublished, and deferred refresh retries on the next scheduler turn.

Configuration PATCH and independent readback verified production `PUBLIC_DISPLAY_WARMING=enabled`, preserving the other45 bindings and eight secrets on source662bea3. Minute cron already exists; token refresh-ahead remains disabled. This is configuration evidence, not deployment or provider acceptance of the local repair. Recheck activation after the next deployment because closed source defaults may overwrite runtime settings.

Intermediate local evidence:98 catalogue/combined-hold cases passed before the safety-audit additions; four focused warming, blocked-refresh concurrent dismissal and consecutive single/multi journeys passed; the rejection-cache regression and snapshot tests passed. An intermediate sustained wrapper executed192 cases successfully, but its source-identity check was invalidated by the continuing audit edits and branch update; it is not final-head evidence. Final verification remains pending in Progress. Test inventories retain existing case titles; assertions were strengthened in their owning cases. Invoice metadata enrichment remains a separate unresolved test9 item; no new CI, source deployment, merge or browser acceptance is claimed here.

Final local audit evidence: the full Worker wrapper ran472 cases against the repaired application source:471 passed, with one outdated `provider.test.mjs` catalogue-key assertion failing because persisted catalogue responses now include `displayExpiresAtMs`. Updated the strict expected key list and asserted the fixed30-minute expiry; the focused case passed and the complete recovery-group wrapper passed164/164 with its inventory/source-identity checks. No application change was needed for that repair. The original full-run failure is retained in `/tmp/cache-full-runtime-first.log` and `/tmp/cache-full-receipt-first.json`; repaired-group evidence is `/tmp/cache-recovery-final.log` and `test-results/worker-group-recovery.json`. All472 cases are covered across those executions, not a fabricated single green full-run receipt. Additional evidence:53 cache/queue cases, four focused journey/dismissal cases, four guard cases, Worker types, source/policy/lint/format and26-file1297-link checks passed. Isolated exclusion and yield mutations failed their intended assertions; the first yield-mutation setup missed its copied manifest, was preserved, then corrected before meaningful mutation evidence. No browser, real booking/payment or notification was executed. No new CI or source deployment was started. Remaining acceptance: provider shared-studio enforcement with stale tabs, real release timing, scheduled-read handoff, invoice metadata repair and owner physical flows. A single in-flight provider operation is deliberately not preempted.

Owner requested one complete local green run rather than combined evidence. Executed `node scripts/verify-worker.mjs` again without application edits during execution:472/472 passed, zero failures/skips/cancellations, runtime522.514s. Source checks, Worker and telemetry type generation, type checking and runtime inventory validation all passed. Receipt `test-results/verification-worker.json` has status `passed`; full log `/tmp/cache-complete-rerun.log`. This is now a single complete green local run; the prior failed receipt remains historical evidence. No CI push, merge, source deployment or provider/browser acceptance was performed.

Owner subsequently authorized pushing this tested consolidated batch to CI. Prepare a draft PR on `fix/shared-calendar-cache` against main662bea3, reusing the complete472/472 local evidence. Include the preserved Refresh layout and skills/documentation work. Invoice metadata enrichment remains explicitly open; this publication is not a claim that it is repaired. Draft CI does not deploy staging, and this instruction does not authorize merge or production deployment. Record the exact PR/run in the publication receipt rather than making a status-only follow-up commit.

### 3 November 2026 — PR21 production and test10 follow-up

PR21 merged by explicit owner request as86e3cd58316bb60b1c43989e9180451661e9d44b. Main CI41571261491 and production deploy41572619343 succeeded. Owner then authorized checkout and warming activation; settings readback verified both, with HitPay sandbox, identity delivery disabled and token refresh-ahead disabled. Cache snapshot timestamps confirmed warming. This did not establish staging acceptance or complete provider UAT.

Owner test10 reported numbered tests1,2,4 complete, with calendar/control spacing, countdown alignment and invoice defects. HAR returned O-00000007/8 in both first confirmation and receipt, with no subsequent enrichment. Read-only SimplyBook lookup returned SI-2026000006/7 for the same invoice IDs. Owner reports client email already had the correct number almost immediately; HAR alone does not establish UI paint timing.

Local branch `fix/test10-confirmation-details` compacts calendar controls, removes ordinary availability helper text while retaining errors/loading and legend, and centres the payment countdown. Invoice enrichment records the original unpaid document before accounting, compares authenticated paid numbers without guessing prefixes, and retains final display metadata separately in migration0036. Normal/saved confirmation can receive bounded receipt updates without replaying financial recovery. Historical records without a captured baseline omit unverified numbers; no provider changes or historical backfill performed.

Initial component run exposed the obsolete saved-confirmation no-read expectation (29/30); its replacement checks late invoice enrichment, receipt precedence, refresh header and stopping once final metadata arrives. The corrected focused run passed30/30. Initial targeted Worker run passed; subsequent receipt regression verifies fresh-proof enrichment, hidden order number, persisted display data and unchanged financial observation. An intermediate full wrapper was interrupted during consolidation; its remaining process tree was stopped and its partial output is not pass evidence. Final verification receipts are generated in `test-results/verification-worker.json` and `test-results/verification-code.json`. Owner visual/provider acceptance and publication remain pending.

Owner additionally requested a mini invoice-value loader and the same pop animation on late invoice arrival. Implemented16px spinner, polite value announcement and reduced-motion-aware380ms pop without replaying the confirmation checkmark. A code verification attempt caught a local calendar font-size token violation; corrected to the existing shared label token. The code wrapper is rerun against the consolidated source; its generated receipt owns the final result.

Regression evidence: focused confirmation/calendar tests passed30/30; the expanded confirmation case passed21/21 including mini-loader stop after six unsuccessful reads. In isolated copies, restoring saved-proof precedence failed at the missing FINAL-DOCUMENT-7 assertion; accepting the unpaid order as a final document failed with ORDER-SYNTHETIC-42 where no invoice was expected. The first backend mutation invocation lacked a helper script and is not mutation evidence; the corrected invocation reached the intended assertion. A complete frontend code attempt passed its individual checks,250 unit/component tests and static build/export, but rejected its combined receipt because source changed during execution; a fresh consolidated run is required. Browser execution remains owner/CI-controlled.

The first complete Worker run finished470/472: exact D1-count assertions exposed redundant metadata round trips. Rather than relaxing the measured contract, confirmation/recovery now join invoice metadata into existing snapshots and batch original-document capture with the accounting reservation. The unchanged confirmation and single/batch reconciliation assertions pass again, including five reconciliation round trips. The full wrapper is rerun after this repair; the original failed output remains `/tmp/test10-final-worker.log`. Frontend code verification passed all14 checks,250 tests and static build/export on its consolidated candidate; the final source receipt is regenerated after the Worker repair.

Owner also requested the special-contact recipient check. Source composition in the deployed86e3cd5 selects `demoEnquiryService` even in live mode; it validates locally and returns delivered:false. No live enquiry endpoint or recipient binding exists. Read-only production settings confirmed the deployed revision and no enquiry/contact/recipient binding. The public contact address is contact@soccerbotsg.com, not an implemented form recipient. No test email or provider mutation was performed. Live delivery is a separate unimplemented task.

### 3 November 2026 — schema map added to the local test10 batch

At owner request, added [Database schema](architecture/database-schema.md) with a compact overview, grouped crow’s-foot ER diagrams, separate application-managed relationship diagrams and one-line inventories for all32 final D1 tables and11 coordinator SQLite tables. Explained crow’s-foot versus Chen relationship diamonds and the line-end cardinalities. Reconstructed the D1 schema by applying migrations0001–0036 in an isolated in-memory SQLite database; extracted coordinator/token/display runtime declarations separately. Archive tables correctly show unique attempt indexes without inherited primary/foreign keys; JSON/provider and cross-store relationships are not presented as foreign keys. Migration0036 remains local and not deployed. No production rows were read or modified for the map.

Linked the schema owner from AGENTS, the documentation skill, topology/ADR, code owners and data lifecycle. Retention rules remain in data-lifecycle; no new schema or application changes were made in this documentation step. Final application verification from the preceding batch passed all14 code checks/250 frontend-unit tests and the full472/472 Worker run, with zero Worker failures/skips/cancellations; outputs are `/tmp/test10-code-release.log` and `/tmp/test10-worker-consolidated.log`. Later documentation edits change the whole-tree fingerprint but not the tested application inputs; reuse those checks and run final-head CI on publication. Physical/provider acceptance, PR publication and deployment remain pending.

Schema map checks matched all32 D1 and11 Durable Object tables, all19 distinct declared foreign-key table pairs and1246 local documentation links. Added constraint-ownership guidance and explained why application-managed archive links do not make archive tables removable. Source ownership checks passed; no application, migration or runtime changes were made in this documentation step.

### 3 November 2026 — test10 batch authorized for CI

Owner authorized CI publication of the consolidated invoice/calendar/countdown/schema-documentation batch. GitHub inspection found no open client PR; PR21 was already merged. Publish the tested work from `fix/test10-confirmation-details` as a new draft against main86e3cd5, with final-head CI pending. Reuse the passing local250-test frontend and472-test Worker evidence; later documentation changes passed source/schema/link/format checks. Enquiry/Resend setup stays deferred. This authorization does not include merging, deployment or external email sends.
