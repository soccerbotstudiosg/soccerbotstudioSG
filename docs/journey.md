# Project journey and evidence

[Progress](../PROGRESS.md) records the current candidate and its next gate. This history records milestones, decisions, regressions and their outcomes. The [full record through PR 107](https://github.com/soccerbotstudiosg/soccerbotstudioSG/blob/70f300dd2763e417e46255eb4ebf060f61dc8036/docs/journey.md) preserves the original receipts, intermediate experiments, copy reviews and superseded plans.

## 24 November 2026 — workflow names and runtime summaries

Owner requested category/purpose names and runtime summaries on #117. Candidate names are CI - Application Verification, CI - Dependency Review and Cloudflare - Deploy Verified Release. Required gate job names and file paths remain unchanged. Deployment listens for the new verification name. Read-only always-run summary jobs explain scope and list exact candidate/target context and actual upstream outcomes; they do not mark skipped deployment as released or infer physical acceptance. Dedicated tests cover escaping, failure/skip reporting, complete upstream dependency coverage and matching workflow subscription, alongside existing deployment-boundary tests.

Default-branch trigger semantics require manual exact-head staging during the rename transition because the old main controller still subscribes to the old workflow name. This limitation and the unchanged manual procedure are documented in Runbook. No merge or production activation is authorized by this work.

## 24 November 2026 — remaining Enquire test expectation reconciled

Run 45330246686 on `b4c89e4` passed frontend, both backend browser shards, master booking regression and Worker verification. Live-email jobs 138230028851 and 138230028904 failed the same `tests/live-email.spec.ts:5250` assertion on desktop, phone and tablet: expected sticky, received static. The earlier change missed this independent live-mode spacing test. Updated its positioning assertion and comment to the owner's approved normal-flow behaviour; retained the 32–33px resting gap, proof margins and readiness checks. No application changes or test-count reductions. Fresh browser evidence must come from CI; original failures remain retained.

## 24 November 2026 — Enquire action changed to normal flow

CI 45313757117 on `7956c58` failed `tests/customer.spec.ts:1786` in phone-WebKit in frontend job 138175498544 and backend shard job 138177809736: Send enquiry had viewport ratio zero on initial entry. All 431 unit/component tests, master booking regression and Worker groups passed. The retained screenshot shows the taller contact panel filling the initial viewport; the form-contained sticky action cannot rise above its form. Original failure artifacts remain attached to the run.

Owner explicitly chose a non-sticky Enquire action to avoid obscuring contact details. The focused follow-up keeps the button inside its existing form, sets only its action anchor to static and removes Enquire from bottom scroll padding reserved for sticky actions. Shared booking behaviour, submission, validation and diagnostic logic are unchanged. The existing browser case now requires static form-contained positioning, scrolls to the action, and retains full visibility and submission assertions. This is an approved behaviour change, not a retry/timeout relaxation. CI/device acceptance remains pending.

## 24 November 2026 — opt-in physical keyboard diagnostics

Owner authorized a phone/iPad trace to distinguish native viewport restoration from the current SiteShell correction. Added a staging/development-only, explicit-query and Start-gated recorder with capped in-memory geometry/events, immediate/two-frame observations, actual recovery state/deltas and validation-focus markers. Stop removes listeners and enables Copy or selectable text; no field contents, identifiers, page URLs, network telemetry or persistent storage are collected. Recovery thresholds and scroll decisions are unchanged. This diagnostic is temporary until the physical comparison and repair are complete. The prior Enquire contact styling is consolidated into this candidate.

Seven focused component tests passed initially. Lint caught synchronous effect state initialization; hydration-safe initialization replaces it. Final source/type/lint checks and exact-head CI/staging are recorded in the PR receipt. Physical iPad behaviour is still unresolved; synthetic recorder assertions do not establish device acceptance.

## 23 November 2026 — Enquire contact presentation refinement

Public navigation revision `78874d2` passed CI 45195810032 and staging 45199820016, including the browser-controlled Terms-tab Back test with original Review consent preserved. Staging health/settings confirmed Worker version 51ffa954-bc66-4f54-b85c-15ef1c8bba09, artifact 14832230969. No merge was authorized.

Owner then requested consistent styling of the complete Enquire contact section, ultimately retaining all three Email/Call/WhatsApp actions and shared footer-style icons. The local refinement groups location and hours above a divided row of icon/label/value links, using existing brand colours, a multiline address from shared location constants and mobile stacking. The address assertion now checks its semantic lines. All three Enquire component cases, source/inventory integrity, focused lint and diff checks passed. Visual acceptance and publication of this refinement are pending; booking/navigation behaviour and canonical metadata are unchanged.

## 23 November 2026 — PR #117 public navigation standardization

The first #117 candidate `8fd840d` passed full CI 45185950219 and staging deployment 45189676019 (artifact 14825481644, Worker version d32d700e-5c88-4f60-a462-496a5b94ff33). Owner then reported the physical iPad field problem still present. It remains unresolved despite the narrower simulated threshold regression passing.

Owner authorized extending #117 with one sticky slogan on five public pages, stateful Back (mobile chevron only), direct-entry Home fallback, closing a separately opened legal tab to reveal untouched Review, and direct contact links above Enquire's form. Existing public canonicals remain unchanged; booking/confirmation are excluded from banners. Return metadata is local history presentation state, not booking authority. The production Worker uses no-referrer; same-origin-only referrer overrides on the Review legal link and shared public links let a separately opened same-site tab identify its origin without exposing it to external sites or restoring opener access. Browser-controlled closing remains subject to browser permission, with Home fallback if refused. The existing legal-tab test now clicks its Back control and waits for closure while checking original consent; public navigation/component checks and dependent inventory are updated together. Early focused checks caught a removed-but-still-used Icon import, a missing router.back mock and an obsolete Enquire Home assertion; these were corrected in their owners before publication. Five focused component tests, 33 source-guard tests, source/inventory and policy checks, typecheck, focused lint, formatting and diff checks passed. No provider/payment contracts or dependency versions changed. Physical/device acceptance of this new candidate is pending.

## 23 November 2026 — iPad keyboard visibility follow-up

Owner confirmed the production smoke test of PR #116, put remaining SEO/keywords/copy work on hold and returned to the unresolved physical iPad keyboard-dismissal issue. Owner considers the earlier staging settings failure nonblocking; no underlying cause is asserted here.

Inspection found `SiteShell`'s 25% viewport-reduction threshold could miss a smaller keyboard on a tall display. A synthetic 1200→960→1200 viewport regression failed before repair (zero correction calls; expected an obscured field to move below the header). The fix tracks contraction/restoration with a one-pixel subpixel tolerance, retaining the existing hidden-field geometry check, manual-scroll cancellation and zoom/orientation safeguards. Added visible-field toolbar restoration coverage; original cancellation/late-scroll cases remain. Both site-shell tests passed after repair, as did source integrity, focused ESLint and Prettier. Test titles/counts and inventories are unchanged. Actual Safari event timing and physical iPad acceptance remain pending; this identifies a reproducible code gap, not proof of the owner's device event sequence. No booking/payment/provider contracts changed. Local privacy-table edits remain preserved and unpushed.

## 23 November 2026 — PR #116 staging/merge and privacy table formatting

PR #116's combined head `e495a6ae6612db40c83a978bbe99af76fd8adebb` passed CI run 45169346521. Staging deployment 45172450953 initially uploaded successfully but failed on missing `SOURCE_REVISION` in the immediate settings read. Subsequent health/settings reads confirmed the exact candidate; attempt 2 passed with deployment artifact 14817762286. Owner then authorized merge; squash commit is `896abd1bf9468163ef573afe83b44350fc02a225`. This records staging and merge, not physical-device or production acceptance.

The owner next supplied a privacy-policy screenshot showing centered labels and crowded table cells. Local styling in `src/app/globals.css` adds left/top alignment, a bounded label column, responsive padding, row separators and a shaded header, retaining semantic markup and every policy word. Source integrity, Prettier and diff checks passed. Existing legal-page browser tests remain unchanged; visual verification is owner/CI pending. No booking, provider, dependency, metadata or policy-content changes; corresponding contracts and operational owners remain unchanged.

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

The owner’s manual reschedule/conflicting-checkout test correctly prevented checkout but showed generic no-creation copy. Calendar now renders the existing normal conflict message for this terminal no-creation notice, including reload. Its internal reason, persistence, release checks and affected-session list remain unchanged; pending/uncertain, email-rejection and predispatch cooldown messages retain their own handling. Existing no-creation route/reload tests assert the shared customer copy.

## 23 November 2026 — confirmation copy booking codes

The confirmation clipboard summary now includes each available provider booking code beside its session, preserving receipt-index association when sorting sessions. Missing codes do not delay copying; a subsequent copy uses later-arriving codes. Invoice display and booking/payment authority are unchanged. The existing clipboard test covers partial codes, reversed session order and late receipt updates.

## 23 November 2026 — local SEO candidate and frontend audit

Owner approved media pitch studio positioning, public contact/address details and daily 12–8 pm hours including public holidays; no Google Maps identity is available. The local candidate adds independent canonicals/metadata for Home, Studio, Contact, Terms and Privacy, a five-page production sitemap, robots instructions, business JSON-LD and a permanent legacy refund alias redirect to Terms. Booking logic is unchanged. Staging/demo/subpath builds remain non-indexable.

The owner subsequently instructed that all SEO work remain local pending inspection of two failed CI runs: no SEO commit, push, PR edit, merge or deployment is authorized by that instruction. Artifact verification now rejects indexing leaks and malformed/missing canonical/schema data. Production and staging exports were checked separately; Worker foundation tests cover the redirect destination/status and lack of storage access.

Unused-code review found no safely removable pre-existing runtime modules/imports/classes. Apparently unused frontend exports are consumed by Worker modules or framework conventions, and externally referenced email assets must remain. No existing assets or runtime modules were deleted. A same-configuration production build compared total raw exported JavaScript at 1,505,281 → 1,505,756 bytes (+475); CSS remained 132,627 bytes. These are aggregate artifact sizes, not measured browser transfer/Lighthouse results. No performance improvement is claimed. Live host redirects remain unverified; no Cloudflare settings were changed. The pre-hydration loading cover still hides/inerts content until JavaScript reveals it; altering that navigation behaviour is outside this slice.

### 23 November 2026 — retained PR 115/116 CI failures

PR #115 run `45093383007` (head `00ead66`) and PR #116 run `45094676704` (head `8fc1ad4`) both failed the same two `combined-hold.test.mjs` warming cases. The fixture chooses the next Wednesday at least three days ahead: on 23 November this is 2 December. One assertion compared the edited December snapshot timestamp with November; the other assumed December had no offers. Local repairs compare the booking month before/after and independently expect the fixture booking date in the appropriate month, retaining timestamp, expiry and no-extra-provider-call assertions. Test titles, inventories and application behavior are unchanged. Execution is deferred under the owner's consolidation instruction; no CI rerun or push.

The master case failed at its first expiry-notice assertion on tablet WebKit in #115 and phone WebKit in #116; the other two devices passed each run. Downloaded #116 artifact `14783421187` confirms Home in the error context. Its hosted-link deadline was 01:34:37 UTC; confirmation responses at 01:34:35.684 and 01:34:46.046 remained `payment_verification_pending`, `expired:false`. This is retained diagnostic evidence, not a root-cause conclusion. The test did not attempt Book now or a replacement checkout after Home. Earlier owner-stopped Home repeats remain stopped. The copy-button frontend gate passed; local SEO was absent from these revisions. #115 additionally failed the dependency-review metadata gate. These unresolved gates prevent merge readiness.

### 23 November 2026 — owner-authorized Home-to-new-checkout reproduction

The owner explicitly resumed local recorded expiry diagnostics and asked to follow Book now after Home. No application recovery code changed. Local staging export includes the pending SEO changes; browser execution used existing Chromium 1248 and real isolated Worker/D1/DO behavior with synthetic providers. WebKit startup failed before test execution because host libraries are missing; package retrieval was blocked by the environment proxy. The first Chromium launch was interrupted before the journey because the inherited subpath preview setting disagreed with the root export. Both setup receipts are retained; neither is a product failure.

Runs 3 and 4 reused the master sequence through the first expiry, preserving the original 70-second synthetic hosted link. Both reached Calendar and opened a distinct replacement hosted checkout. Run 5 changed only that fixture lifetime to 73 seconds to move expiry relative to the server-paced status polls. It reproduced Home, followed the visible Book now/guest/session/details/review controls, and opened a distinct new hosted checkout. The separate diagnostic accepts either destination to inspect continuation; the original master test/assertion was not changed or declared passing. No retries, application-state injection, production provider calls or CI reruns were used.

The original run-5 attempt was `41be002e-7f25-4163-96cd-21ce4b745216`, hosted request ending `0020`. Provider readback was pending at the rounded link deadline, then returned expired twice five seconds apart. At Home the durable row already had `state=manual_review`, `reason=hitpay_unpaid_verified`. Book now enforced release: `POST /api/attempts/41be002e-7f25-4163-96cd-21ce4b745216/expire` returned 200 with `expired:true` at 12:34:15.384 SGT. The replacement checkout request at 12:34:19.522 SGT returned 200, state associated, new attempt `d9a746e1-6bcf-4f34-a206-c764ce5a38c6`; the browser navigated to the distinct synthetic hosted request ending `0021`. Payment-request creation count was exactly two. Thus this Home reproduction did not permanently block rebooking and did not bypass expiry enforcement.

The routing mechanism is the bounded expiry display wait racing the next permitted confirmation poll. In the failing CI trace, a post-deadline response still said pending and the next poll was almost at the end of the 20-second display wait; conservative clock uncertainty can end the wait first. Separately, this master sequence changes the saved session selections before a fresh hosted return. Provider hydration intentionally declines to restore the mismatched attempt into the page state, so `browseAfterChecking` cannot accept the Calendar handoff and `returnExpiredCheckout` takes its Home fallback. The successful local reproduction has that same route mechanism while authoritative unpaid evidence has already completed server-side. A narrow routing/timing repair remains to be designed and reviewed; no booking-behavior repair was applied in this investigation.

Workspace evidence is under `/workspace/output/pr116-expiry-investigation/`: `run1.log` through `run5.log`, the diagnostic spec/config, per-run traces/videos, and `home-to-new-checkout.webm`. These are local artifacts, not permanent repository evidence. Diagnostic run 5 passed in 2.1 minutes; the full original master regression and WebKit verification remain pending. All SEO/calendar-test repairs remain local; no push, CI rerun, merge or deployment occurred.

### 23 November 2026 — accepted expiry fallback and consolidated PR cleanup

The owner accepted the reproduced Home detour and absence of a red notice on Calendar re-entry, then authorized cleaning up both PRs and consolidating local changes. No recovery behavior change is included. The master regression now recognizes either direct Calendar plus its notice or Home followed by visible Book now/guest/session entry. Both converge on the existing archived-expiry-grant, hidden-original-slot, conflict, paid-booking and distinct later-checkout assertions; Home re-entry explicitly checks absence of the Calendar alert and fills fresh guest details. This is an approved acceptance change, not an unchanged assertion claimed as fixed. Case titles, device projects, inventories, deadlines and retries remain unchanged.

The two calendar warming repairs passed focused isolated Worker execution (2/2); source integrity, targeted lint and TypeScript checks passed. Earlier copy/SEO unit, tooling, Worker-foundation and both export-profile results are retained rather than rerun unchanged. PR #116 consolidates copy, SEO and these test/doc repairs. PR #115 keeps dependency changes separate, receives the same shared regression repairs and generated versions inventory, and carries a dependency support/impact assessment. Exact-head CI and subsequent staging/owner acceptance remain required; cleanup does not authorize merge or deployment.

### 23 November 2026 — PR #116 SEO browser expectations

Run 45114863987 on c2d293e failed frontend job 137495280788 and backend browser jobs 137495690851/137495690881 because the existing Player App browser case still expected the former homepage title on desktop, phone and tablet. The rendered title matched the approved media pitch studio copy. The same case also retained the old social description and subpath-derived social URLs. Update those independent expectations, including HTML-escaped ampersand in the crawler response; preserve the case title, inventory, assertions, device coverage and timeouts. No application or booking behavior changes. Final browser verification belongs to CI.

The same original run passed master booking regression, all Worker groups and both live-email browser shards; final backend/live-email aggregation was skipped after upstream failure. PR #115 at f1fd818 passed all three required gates in run 45114863922. These results do not establish staging or merge acceptance. Documentation impact is limited to this evidence and Progress; customer flows, contracts, architecture, dependency inventory and UAT expectations are unchanged.

### 23 November 2026 — Distinguish page canonical from deployment asset path

Run 45119353558 on ac2c065 passed backend/live-email gates and master regression. Frontend job 137509313390 failed the Player App case on all device projects: the test expected the root social image URL, but its subpath build correctly emitted /SoccerBotStudioSG/assets/soccerbot-social-preview.jpg through socialPreview.src. The previous correction overgeneralized page canonical behavior to asset paths; its local root export check did not cover this build variant. Restore the existing sitePath-based image expectation; retain the production page canonical and updated approved text. No application changes, retries, timeouts or inventory changes. Final browser verification remains CI-owned.

### 23 November 2026 — Local SEO audit follow-up and Contact presentation

Owner approved displaying address and daily hours above the enquiry form, deferred visible Studio rewording, and requested restoring Send enquiry to the standard Continue-button styling. Removed the enquiry-only blue override introduced by 14ac17f0 on 18 November; the shared primary-action styling now applies, with the existing browser assertion updated. The popup and Contact page share the hours formatter, while structured data derives its opening window from existing booking-policy constants. Booking rules and submission behavior are unchanged.

Strengthened export validation for social titles/descriptions/images, contradictory robots directives and exact opening-day values. Added root production, root staging and demo-subpath fixture coverage and rejection tests for the three audit gaps. All 53 deployment/export tooling tests passed. Actual production, staging and subpath builds/export checks passed. An initial component run caught displacement of the existing acknowledgement below the new address block; preserved that failure in /tmp/seo-audit-unit.log and moved the address block below the acknowledgement, still before the form. All three enquiry component tests then passed. Source guards, focused lint and type checks passed; final visual/browser acceptance remains pending. Keep changes local; no merge/deployment or additional CI triggered.

### 23 November 2026 — Doraemon review and consolidated PR #116 follow-up

Independent review identified an inherited production-host/demo-subpath mismatch for social images, extended by the new JSON-LD artwork, and proved the robots guard accepted a wildcard Disallow for /studio/. The owner authorized both fixes and publication with the local Contact changes. Shared public artwork now strips the demo prefix before resolving against the production origin, including layout fallback metadata and JSON-LD. Export checks enforce the complete generated robots policy and root artwork URLs; tests reject public-route blocks and wrong user-agent scope. Metadata descriptions derive their hours from the shared constants. The enquiry browser case now checks the pseudo-element display/content/visibility as well as the gradient. No payment/recovery behavior or Studio marketing copy changes.

The previous e817e26 head passed all required gates in run 45122514350, but those results do not cover this follow-up. All 54 focused tooling tests, lint, source guards, TypeScript and diff checks passed locally. Existing Contact component checks passed three cases after preserving acknowledgement placement. Actual production-root, staging-root and demo-subpath builds/export checks also passed (/tmp/seo-doraemon-{production,staging,subpath}.log). New exact-head CI, staging and owner acceptance remain pending; no merge/deployment authorization inferred. Development guidance, code-owner navigation and Progress are reconciled; business/API contracts, provider configuration, dependency versions and role UAT are unchanged.

### 23 November 2026 — routine dependency review and shared regression repairs

PR #115 updates libphonenumber-js 1.13.16→1.13.17, user-event 14.6.10→14.6.13, PostCSS 8.5.32→8.5.33 and Vitest 5.1.0→5.1.1. Reviewed published notes and exact lock/registry metadata on 23 November. Vitest brings Vite 8.3.8/Rolldown 1.2.19 and their optional bindings; Node requirements remain compatible with the pinned 24.19.0. The new optional wasm32 binding carries emnapi 2.0.0-beta.2, outside verified native Linux coverage. All changed package licenses remain MIT; resolved packages use registry.npmjs.org and no new install hooks appear. No application API adaptations or customer browser restrictions are introduced. The PR body owns the exact support comparison and provisional DEFER decision pending final CI/staging. Generated versions inventory is refreshed.

Original run 45093383007 failed dependency-assessment metadata, two month-assumption calendar tests, and the first master expiry-notice assertion on tablet WebKit. The calendar fixture can move into the next month; shared fixes compare the same booking month and its actual offered date. Focused baseline-tooling execution passed 2/2; target dependencies require exact-head CI. Owner accepted the reproduced Home expiry fallback after recorded re-entry enforced release and opened a new hosted checkout. The master now follows Home/Book now or direct Calendar, retaining original expiry-grant, conflict, payment and distinct-checkout checks, with unchanged case inventories/deadlines/retries. Booking-flow documentation records the accepted route; no recovery code changed. The same repairs are in #116, which separately owns copy/SEO changes.

### 23 November 2026 — PR #116 staging candidate after dependency merge

PR #115 was merged as 219379179ab66953fa67ca7a8079b1550d71f08a after successful manual staging verification run 45161494005 and staging deployment/health run 45167479876. Owner explicitly waived manual smoke testing for #115 only. PR #116 incorporates that merged dependency revision before its own CI and authorized staging. Only Progress/Journey conflicted; retained both histories and refreshed the current checkpoint. Shared browser/Worker regression repairs merged without changes. No #116 merge or production activation is authorized by the staging request.
