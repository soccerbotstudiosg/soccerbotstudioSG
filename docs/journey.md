# Project journey and evidence

[Progress](../PROGRESS.md) records the current candidate and its next gate. This history records milestones, decisions, regressions and their outcomes. The [full record through PR 107](https://github.com/soccerbotstudiosg/soccerbotstudioSG/blob/70f300dd2763e417e46255eb4ebf060f61dc8036/docs/journey.md) preserves the original receipts, intermediate experiments, copy reviews and superseded plans.

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

## Part 2 — Dated changes and evidence

### October 2026 — From demo to provider-backed bookings

- The frontend baseline established guest booking, optional verified email, session selection, review and protected confirmation. Demo evidence covered presentation. Provider evidence was collected separately.
- SimplyBook became the source for eligible studio times, trainer relationships, bookings and invoice data. Batch experiments exposed incomplete membership evidence. Checkout consequently requires proof for every selected session before offering payment.
- The hosted payment implementation uses HitPay with the original SimplyBook invoice. A browser return may arrive before the payment result. The Worker reconciles payment and accounting before confirming a valid booking.
- Concurrent and partial-write trials exposed the difference between rejecting a booking before dispatch and losing the result after dispatch. Recovery was tied to the original checkout and its provider records. Security and load work added bounded provider admission, scoped token caching, protected receipt access and redacted diagnostics.

### 27 October 2026 — Client D1 created and primary placement verified

- The client D1 primary was observed at KIX in the APAC region. The probe measured database execution, not checkout latency. The coordinator was configured with the best-effort Japan placement hint.
- At month-end, the client foundation was registered against its configured database and coordinator. Subsequent telemetry observed execution at KIX. Normal releases reuse that foundation.
- Client staging and production verification became separate release gates. Deployment consumes the previously verified artifact for that target. Runner and shard repairs retained the original test assertions.

### 1–6 November 2026 — Client sandbox and acceptance

- Owner sandbox checkouts supplied booking, invoice, webhook and browser-return evidence. Trainer and shared-studio tests exercised time conflicts across providers and consecutive bookings. Staff still needed to verify their own accounts and operations.
- Invoice observation showed that SimplyBook can release capacity later than its configured timeout. Recovery began separating the payment deadline, financial release and the first fresh offer that makes a time selectable again.
- The owner retired customer PDF and calendar downloads. Confirmed receipt access and payment evidence remained protected.
- The five trainers received temporary date-specific test availability for December 2026 and January 2027. Both endpoints were sampled for each trainer. Cleanup must verify any subsequent edits before changing those entries.

### 7–13 November 2026 — Conflict, identity and payment recovery

- Conflict captures showed incorrect cart restoration after refresh. Rejection proof was tied to the original tab and affected sessions. Known conflicts preserve eligible survivors. An incomplete availability response cannot establish which selections were lost.
- Calendar departure exposed a loop after conflict or expiry. The flow separated customer navigation from background settlement and preserved the customer’s replacement draft.
- Verification work covered concurrent email codes, request throttling, remote sign-out, saved-profile reveal and booking capability lifetime. Each code keeps its original expiry.
- The client custom domain was connected. The owner reported a successful sandbox payment and confirmation on that hostname. Live-merchant acceptance remained separate.

### 14–18 November 2026 — Navigation, confirmation and communications

- Refresh, Home/Studio transitions and booking re-entry received regression coverage for the shared loader. Changes to public cards and banners preserved touch interaction and desktop navigation.
- Confirmation adopted the Review summary layout, payment status, copy action and arrival guidance. Copied session details use labelled lines so WhatsApp does not indent them as a numbered list.
- The site introduced branded app notification templates, a short mobile verification header, explicit email acknowledgement and a four-stage booking progress indicator. Provider-managed notification configuration still requires separate acceptance.
- PR 97 passed staging and merged. Fresh-main WebKit verification exposed a scroll-control clearance issue. Staging and merged-main evidence therefore remain revision-specific.
- The maintainer accepted a time-limited picomatch exception. Its advisory, scope and expiry remain in the [security disposition](security/false-positives.md).

### 19 November 2026 — Interrupted checkout and confirmation history

- Quick Back exposed two failures. Returning to Review could skip the original protected lookup, and leaving Continue to pay could bypass the departure prompt. Recovery now distinguishes browser history from an explicit in-flow navigation.
- One capture showed 11 trips between Calendar and Confirmation in 11 seconds. The attempt had no verified release. A later audit found that a late callback from an older attempt could clear a newer cart. Recovery and return hints were bound to their own attempts.
- Random booking sequences exercised consecutive payment, conflict, active checkout, expiry and late payment. Ten of the first 90 expanded cases exposed an archived-release race. Those results came from isolated providers.
- PR 103 passed staging. Fresh-main tablet WebKit then exposed an original-attempt restoration race on reload. A separate deploy check observed the previous source revision during settings propagation. These were different failures.
- A quick-back capture correlated an uncertain-looking booking with SimplyBook’s documented single-book email rejection. PR 107 separated verified rejection from lost transport, corrected account cooldown handling and added replacement, multi-session and multiple-Back cases. PR 107 merged at `289ecf5`.

### 20 November 2026 — Unpaid expiry and provider rejection follow-up

- The owner reached Calendar after expiry but could not acknowledge Review for the next booking. The retained payment journal showed manual review. Returning to Calendar had established neither release nor fresh capacity.
- The local follow-up introduced spaced expiry reads, corrected replacement consent and changed the trainer selector to use the existing card row. Duplicate provider-email notices were traced across Calendar and Contact details.
- Independent isolated reproductions found that later empty expiry responses could mask an earlier successful payment line, and a signed notification could fail to reopen an incomplete paid result. Isolated regressions now verify retention of the payment warning, webhook recovery and continued sampling of an inconclusive cancellation.
- A later production trace recorded a fresh return from HitPay followed by four aborted expiry requests and repeated Home re-entry. The previous component test expected Home while release was pending. The local fix lets the protected release finish when Calendar cannot yet take over. [Physical retest](uat/simulated-user.md#two-tab-master-booking-check)
- Open acceptance includes a real provider expiry and second checkout in one tab, physical iPad keyboard dismissal, native trainer selection and final notification rendering. [Current checkpoint](../PROGRESS.md) · [Customer UAT](uat/simulated-user.md)

### 20 November 2026 — Rejected checkout extended guest access

A competing selection renewed guest access before checkout preparation rejected it. The focused Worker regression reproduced the deadline change with one minute remaining. The transaction that claims the first booking write now renews valid guest access. The change preserves the measured database round-trip budget for single and batch checkouts.

### 20 November 2026 — Cooldown before the first booking write

An availability HTTP 502 preceded the account cooldown. The original checkout recorded an unknown dispatch before provider admission, so five recovery checks ran for a request that never left the Worker. Combined checkout now claims the first write after admission and before transport, and persists a restartable result for a refused first write. [Master regression and incident timing](uat/simulated-user.md#draft-follow-up--manual-simplybook-cancellation-with-a-calendar-left-open)

## 21 November 2026 — hourly starts

Production SimplyBook services 3 and 4 now have 50 minutes of play and 10 minutes of changeover. The production timeline for provider 2 and service 4 returned eight hourly starts for 22 November. The website candidate adopts this grid and records duration on new checkout sessions. Earlier journal entries retain their original 40-minute duration.

## 22 November 2026 — release reconciliation and retained diagnostic limits

- PR #110 merged at `daaf4d3`: competing rejected attempts preserve guest expiry; a provider cooldown before the first booking write yields a restartable no-start result. The 60-second cooldown was retained. PR #111 merged at `0085b64`: 50-minute sessions, 10-minute changeover/hourly starts, corrected eligibility filtering and mobile Studio Back text. PR #113 merged at `799c5c0`: per-session provider booking codes above invoice numbers with bounded late receipt reads. PR #112 merged at `8fc342b`: app email styling and protected recovery after failed/aborted archived expiry release, preserving access-loss handling.
- PR #112 exact-head CI passed; staging health reported `ba8b1e7`. Merged-main [verification](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/44988441426) and [production deployment](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/44989993649) completed successfully. The deployment log records `8fc342bbcd8ac8f8e315f4e47602f058aef8229d`. These receipts do not constitute complete provider/device acceptance.
- Owner-authorized recording encountered an ESM configuration setup error, then a missing headless-shell executable; neither was an application regression. The diagnostic then used installed Chromium with the unchanged application tree, recorded video and synthetic providers. Quick Back passed, including transient red-notice detection. The master run failed at `tests/live-email.spec.ts`'s first expiry-notice assertion after 95 seconds; its final view was Home and prior status responses remained pending. It never attempted Book now or a replacement checkout after Home. The retained trace is `/workspace/output/master-expiry-failure-trace.zip`, SHA-256 `7e44abbb67788103a18f507eb90cb023754a49a281ff16f5d5b0fd6a6cb16657`; video is `/workspace/output/master-expiry-failure.webm`. These are workspace artifacts, not guaranteed permanent repository storage.
- A separate diagnostic continued the original sequence when Calendar appeared and would follow Book now/new checkout if Home appeared. Two later full runs reached Calendar and opened subsequent checkout URLs; a focused repeat also reached Calendar. The third repeat was interrupted on owner request. Home-to-new-checkout remains unexecuted. Successful repeats and reported physical successes do not establish the cause of the failed run or permanent customer blockage. The previous stronger statements that the checkout fix was conclusively broken were unsupported by the stopped test.
- The owner stopped Home-route repeats and requested UI spacing. The current candidate gives Details/Review/security/recovery messages vertical separation and places Review error actions below their message. Trainer selects occupy their full 44px height in normal flow, with the price row reserving equal height before expansion; focus outline clearance is checked within the card. No recovery/cooldown behavior changes belong to this slice.
- Updated repository testing, documentation and deployment skills require precise execution boundaries, separate route/release/new-checkout evidence, classification of fixture and environment failures, and explicit staging/merge authorization. These instruction changes reduce known process risks; they cannot guarantee no recurrence or automatically enforce acceptance.
