---
name: soccerbot-testing
description: Review and maintain SoccerBot tests, fixtures and strict inventories for every PR and behavior change. Use during implementation, bug repair, dependency/workflow updates, CI diagnosis and release readiness; record concrete test impact and exact evidence before publication.
---

# Test maintenance and evidence

## Authority and scope

Apply this procedure to every PR, including documentation-only, dependency, workflow and automated updates, and repeat the impact review when its scope changes. Read root AGENTS.md, NORTH_STAR.md and PROGRESS.md first; paths below are repository-root relative unless explicitly linked. AGENTS owns engineering permissions; explicit user instructions take precedence. The documentation reconciliation skill owns document state and the campaign guide owns work budgets. This skill owns test-impact review and evidence quality, not business policy or deployment permission.

Review tests during implementation and before publishing the PR, not only after merging. A skill is an instruction source, **not an automated CI hook**. Existing CI checks inventories and outcomes, but cannot prove that every changed behavior has a meaningful assertion. Report the review in the PR so its reasoning is inspectable.

No assistant browser execution, screenshots, `npm run verify`, `verify:browser` or browser-running installers. Owner/CI operates browsers and physical devices. Use isolated synthetic data and intercepted provider requests for local Worker tests. This procedure grants no live bookings, payments, refunds, cancellations, notification sends, DNS/email/registrar changes, production load or historical cleanup authority. The `live-email` gate name is not permission to send real email.

## 1. Map the whole change to existing tests

1. Inspect the full PR diff against its actual base, exact source head, working tree and relevant CI receipts. For stacked PRs, identify inherited behavior separately from the current slice. Preserve unknown edits and original failures.
2. Identify each changed behavior, guard or contract using docs/business-rules.md, docs/api-contracts.md and docs/code-owners/index.md. Include callers, indirect consumers, browser/service adapters, schemas, migrations, configuration and provider boundaries; changed filenames alone are insufficient.
3. Search existing tests by function, operation, route, state, error and business-rule meaning. Read assertions, fixtures, interception and setup; a matching test title is not coverage evidence.
4. Assign each affected behavior one disposition: **add**, **update**, **retain with evidence**, or **remove with replacement/retirement justification**. Record the concrete test path/title and why it covers the expected outcome. If coverage is missing, close the gap or explicitly retain it as a readiness blocker.
5. Review the following owners for impact. Use existing owners and avoid duplicate suites.

| Change surface                                                           | Test and verification owners to inspect                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain rules, browser services, React state and components               | Colocated `src/**/*.test.ts` / `src/**/*.test.tsx`; synthetic adapters/fixtures; `tests/component-setup.ts`; `scripts/test-inventory.json`.                                                                                                   |
| Customer navigation, checkout, reload, duplicate tabs and exports        | `tests/customer.spec.ts`, `tests/experiment.spec.ts`, `tests/live-email.spec.ts`, `playwright.config.ts` and applicable shared fixtures. Browser execution is owner/CI only; keep relevant desktop/phone/tablet coverage.                     |
| HTTP authorization, D1/DO state, provider effects, identity and recovery | `worker/tests/*.test.mjs`, associated harnesses/fixtures, `scripts/verify-worker.mjs`, `scripts/worker-test-inventory.json`. Exercise actual isolated Worker storage/runtime where required, not only mocked helper returns.                  |
| Tooling, CI policy, deployment, artifact/configuration validation        | `scripts/*.test.mjs`, `scripts/check-source.mjs`, `scripts/check-policy.mjs`, `scripts/verify.mjs`, `scripts/verify-test-results.mjs`, `.github/workflows/verify.yml`; preserve exact-source/artifact and incorrect-account rejection checks. |
| Local installer or delivery packaging                                    | `scripts/guarded-update.test.py`, `scripts/local-installer.test.py`, source/fingerprint and backup-preservation checks. Do not execute historical installer bundles against the active checkout.                                              |
| Provider capacity, coordination or performance behavior                  | Existing queue/transport/recovery tests and `scripts/load.test.mjs`; inspect `scripts/run-load.mjs` and relevant smoke/plan configuration before execution. Do not infer production capacity from synthetic success.                          |
| Dependency/runtime updates                                               | Affected consumers and compatibility suites plus normal required CI. An unchanged application diff does not imply no behavior risk; separate vulnerability remediation from optional upgrades.                                                |
| Documentation-only or harmless presentation/prose correction             | Validate affected links, examples, diagrams or structure as appropriate. State why executable tests/inventories remain valid. Do not invent tests or edit unrelated expectations merely to satisfy this skill.                                |

## 2. Establish meaningful acceptance before changing expectations

For a defect, preserve its original run/job/artifact or reproduce it in an authorized isolated check. State the independently expected behavior and the failure mechanism. Where practical, demonstrate that the regression assertion fails on the old behavior and passes after the fix; document inability to reproduce or a browser-only CI dependency honestly.

Choose relevant cases based on risk rather than copying this whole list into every PR:

- Intended outcome, boundary values and invalid input; verify important side effects and non-effects, not just HTTP success.
- Wrong owner/account/origin, expired or revoked access, token replay and sensitive-data exposure for protected operations.
- Duplicate requests, concurrent callers, stale/late responses, lost acknowledgement, interruption/restart and idempotent recovery where state or effects change.
- Unknown provider writes, paid-but-invalid booking, original financial identity and absence of duplicate booking/payment/accounting effects for financial paths.
- Reload, back/forward, duplicate tabs, saved details and visibility/focus where browser persistence or lifecycle changes.
- First installation, safe reruns, wrong-resource rejection, migration compatibility and rollback where deployment/storage changes.

Expected results must come from the rule/contract, not by invoking the implementation to calculate its own expected answer. Avoid tautological assertions, blanket snapshots, arbitrary coverage targets and tests that only mirror private helpers. Small reversible low-impact changes do not automatically require new tests. Existing adequate coverage may remain unchanged with a specific explanation.

When requirements legitimately change, update obsolete tests and their fixtures in the **same PR**, explaining the old/new contract. When requirements do not change, do not rewrite expectations to make defective code pass. Removing or renaming tests must preserve their behavioral coverage or explain the authorized retirement; old failures remain evidence in Journey.

## 3. Synchronize fixtures and strict inventories

Review fixtures for valid and intentionally invalid cases, correct account/environment scope, deterministic clocks and the same constraints as the real boundary. Keep provider calls intercepted; fixture defaults must not silently grant permission the production path would reject.

`scripts/test-inventory.json` records frontend/browser file-title pairs inspected by `scripts/test-inventory.mjs`; `scripts/worker-test-inventory.json` records Worker runtime case names validated by `scripts/verify-worker.mjs`. Adding, renaming, moving or retiring inventoried tests requires the matching inventory edit in the same PR. Inspect discovered and executed cases against the declared inventory; unchanged totals do not prove unchanged coverage. Do not regenerate a reduced inventory to conceal missing execution, skips or failures. Tooling/Python tests have their own runners; do not pretend these two inventories cover every repository test.

For a setup race, wait on the actual prerequisite before asserting dependent state. Arm response/request/event listeners before the triggering action. Verify the event belongs to the intended attempt and represents the needed state; merely receiving a response does not prove a later React effect finished. Preserve normal timeouts and assertions. Never fix failures with sleeps, retries, forced clicks, skipped/exclusive cases, loose assertions, inflated timeouts or reduced device/inventory scope.

## 4. Execute, diagnose and keep evidence bounded

Use docs/development.md's verification commands and inspect the executable runner before selecting a focused command. Run the smallest meaningful permitted checks, then required complete gates at a coherent candidate boundary. A filtered test pass does not replace a complete strict-inventory run. Do not repeatedly run unchanged suites after success or failure without a relevant change or new diagnostic evidence.

Classify failures as application, test/fixture, environment, provider or unresolved using evidence. Save the first failure; record source, command/run, environment, test title, expected versus observed behavior and cause. A later green run does not by itself establish flakiness or explain the earlier failure. Fix the owning cause, review adjacent coverage and rerun appropriate checks; retain unresolved questions.

All three exact-final-head gates remain required: `verify / frontend`, `verify / backend`, `verify / live-email`. Recheck the head and complete outcomes before any authorized merge. Main verifies the merge independently; deployment and provider/device acceptance are separate. If browser execution is needed, push the candidate for CI under AGENTS and report it pending rather than claiming local browser acceptance.

## 5. PR test-impact receipt and handover

Add a concise table or paragraph to the existing PR body alongside its documentation-state receipt:

| Field                  | Evidence to include                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Behavior / risk        | Changed rule, operation or boundary and independently expected outcome.                                                                                    |
| Test disposition       | Specific paths/titles added, updated, retained or retired and coverage rationale; include a justified no-test-change decision for documentation-only work. |
| Fixtures / inventories | What was reviewed/updated and why declared and executed coverage still agree.                                                                              |
| Verification           | Actual commands/run links, source revision, environment and outcomes; identify local focused checks versus complete CI.                                    |
| Failure / gaps         | Original failure receipt, diagnosed cause or unresolved hypothesis, blocked checks and required owner/provider/device evidence.                            |
| Next action            | Remaining acceptance and current readiness; no invented success or standing monitor.                                                                       |

Use PROGRESS.md for the current task and docs/journey.md for durable evidence under the documentation skill. Once the tested head is green, update the PR/user receipt rather than repeatedly committing status and invalidating that head. For Dependabot PRs, perform this impact review before merge; release notes and a green badge alone are not the test assessment.

## Exit criteria

Every changed behavior has a justified test disposition; affected assertions, fixtures and inventories agree with the intended contract; relevant negative/recovery cases are covered or explicitly blocked; permitted checks have recorded outcomes; no coverage was weakened to obtain green. Publication may precede browser CI completion, but merge readiness cannot. This skill improves the review discipline; it does not certify complete coverage or make future failures impossible.
