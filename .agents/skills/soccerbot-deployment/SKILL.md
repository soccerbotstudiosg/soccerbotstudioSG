---
name: soccerbot-deployment
description: Establish SoccerBot deployment and configuration readiness from actual source, artifact, account and runtime evidence. Use for staging/production setup, release preparation, failed deployment, configuration drift, activation and rollback; preserve resource identity and separate installation from provider acceptance.
---

# Deployment and configuration readiness

## Authority and owners

Read [AGENTS](../../../AGENTS.md), [North Star](../../../NORTH_STAR.md), [Progress](../../../PROGRESS.md), the [deployment runbook](../../../docs/runbook.md#6-deployments-and-rollback), [configuration guide](../../../docs/development.md#configuration) and [deployment rules](../../../docs/business-rules.md#deployment-migration-and-acceptance). Inspect the current workflow, target manifests and release scripts; historical checkpoints do not establish current readiness.

This skill owns readiness investigation and evidence-based go/hold recommendations. The runbook owns operational commands and recovery procedures; manifests own intended configuration; Progress owns current state. Apply the [testing](../soccerbot-testing/SKILL.md) and [documentation](../soccerbot-documentation/SKILL.md) skills for repairs and delivery-state changes. Use the [CI diagnosis skill](../soccerbot-ci-diagnosis/SKILL.md) for failed verification and the dependency skill when runtime/package compatibility changes. Load applicable Cloudflare/runtime skills before operating their tools.

Explicit user instructions take precedence. Reuse authorization already given for the same scope; do not repeatedly request it. A readiness review is not permission to merge, provision, change secrets, activate schedules/providers, deploy or roll back. Prepare concrete reviewable changes and identify any still-required authorization only after completing independent authorized preparation. No assistant bookings, payments, refunds, cancellations or notification sends. Never print secret values, tokens, EPP codes or customer records. This skill is not an automatic deploy hook or standing monitor.

## 1. Identify the intended operation

State the exact target and intended outcome: read-only inspection, installation with effects disabled, separate foundation setup, normal release, configuration repair, activation or rollback. Distinguish sandbox credentials on a production-named Worker from real production payment readiness. Identify existing authorizations and explicit exclusions, including any protected run/resource; preserve unknown edits and existing deployments.

Verify the repository, branch/head, checkout path, PR/merge status, workflow event and actor against current evidence. Confirm which repository owns deployment and prevent the retired repository from remaining a second deployer. A display name, authenticated connector or ready token does not prove account/resource ownership. Verify numeric account IDs and resource IDs against the reviewed target; compare staging and production explicitly. Never copy credentials or replace resource identity merely to make a deployment pass.

## 2. Trace source to the release artifact

- Match the exact source revision, repository, target/configuration, successful verification run and attempt, expected job set, artifact identity/digest and release receipt. Read the actual eligibility logic; do not assume a skipped deployment failed or that a green PR deployed anything.
- For trusted PR staging, verify the current PR head and trust/eligibility rules. Keep forks, Dependabot and other untrusted events away from deployment credentials. For main production, independently verify the merged main revision; PR CI is not main evidence. Retain every configured release prerequisite, including Worker verification.
- Deploy the reviewed artifact through the existing release procedure; do not silently rebuild under different environment values. Confirm embedded public build-time configuration separately from Worker runtime bindings.
- Before recommending a release, inspect rollback compatibility, known prior artifact availability and any storage/migration constraints. Source rollback does not undo data changes, provider effects or secrets. Do not modify accepted migrations or reset storage to recover a failed release.

## 3. Reconcile configuration at each store

Build a compact expected/observed/gap comparison in the existing PR or operational owner, not a duplicate secret inventory. For sensitive values record names, scope and verification state only; presence does not prove correctness, validity or provider ownership.

| Surface                      | What to verify                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target manifest and workflow | Intended repository/account, Worker/origin, D1 and DO identity, environment, feature gates, deployment variables and trusted credential selection.                                                                           |
| GitHub Actions               | Required secret names and variable values by target, repository/environment scope and environment protection where applicable. A secret saved in one store does not populate another.                                        |
| Build-time frontend          | Base path, booking mode, public Turnstile sitekey and API origin embedded in the tested artifact. A runtime secret cannot repair a stale static build.                                                                       |
| Worker runtime               | Required binding/secret names, resource IDs, provider company/service mappings, sandbox/live pairing, effect switches and runtime overrides versus the manifest. Determine what the next deployment preserves or overwrites. |
| Cloud Containers/local setup | Selected checkout and pins, installed dependencies/browser image, helper/runtime instructions and externally published settings. Repository updates do not republish the environment.                                        |
| Provider configuration       | Correct company/merchant/sender, entitlements, schedules and capacity, callback/webhook/return URLs, enabled events, signing/authentication pairing and domain/sitekey origins. Preserve unrelated staging mappings.         |

Use existing validators and safe names-only metadata first. If a connector cannot inspect secret presence or a platform blocks access, state the specific unknown and request only the minimum owner evidence. Never ask for a secret to be pasted into chat. Do not interpret a placeholder, absent metadata or masked value as working credentials. Keep DNS activation, registrar transfer, email authentication and certificate issuance/renewal evidence separate; preserve existing mail records.

## 4. Inspect resources and operational behavior

Confirm existing subscriptions, resource ownership, migrations and bindings before any authorized provisioning. Preserve D1 data, DO namespace/class/name/ID and foundation registration; repeated deployment must not create a second coordinator or reset state. Check installation/recovery and incorrect-account rejection through the existing tests and receipts. Idempotency must be demonstrated for the actual operation, including behavior after partial failure, not inferred from a second successful invocation.

Treat D1 placement, Worker execution and coordinator execution as different observations. A placement hint is not a guarantee; a Worker edge location does not prove DO location. Correlate authorized telemetry with the exact coordinator identity and invocation, distinguish storage placement from observed execution, and label historical observations.

Review persistent schedules, recovery switches, calendar warming, monitoring ingestion/redaction, alerts, access protection and cost implications when affected. A configured cron is not evidence of successful execution; an installed secret is not proof of provider authentication; a telemetry flag is not proof of receiver ingestion. Staging can remain reachable after production launches: assess its exposure and test-data boundary explicitly without assuming it inherits production access controls.

## 5. Diagnose deployment and verify acceptance

Read the failing step and receipt before changing configuration or rerunning. Distinguish eligibility rejection, build/artifact failure, account/API permission failure, partial upload, runtime configuration error, foundation state, route propagation and provider failure. A failed workflow may still have created resources or deployed a version: inspect actual state before retrying. A later successful request does not prove the earlier cause was propagation.

After an authorized operation, verify the actual revision/configuration and public health where accessible. Distinguish Worker-created, closed foundation ready, enabled sandbox checkout, live-provider readiness and owner acceptance. A dashboard/API deployment record cannot substitute for public-route health; a network-policy failure cannot prove the site is down. Use bounded checks through approved paths, preserve failures and identify remaining evidence. Do not bypass network controls or extend production traffic without scope.

Use the existing Admin/Trainer/Simulated-user UAT owners for real provider/device acceptance. Do not mark payment, email, webhook, recovery, rollback or monitoring delivery accepted from configuration or synthetic CI alone.

## 6. Readiness receipt

Report the target/operation and authorization; exact repository/source/run/artifact; verified account/resource identities; configuration gaps without secret values; observed health/runtime/provider evidence; rollback constraints; and a **go** or **hold** recommendation with the exact remaining step. Distinguish prepared, verified, deployed, activated and owner-accepted states. Update existing Progress/Journey and affected operational owners under the documentation skill. No unconditional readiness claim while required evidence is missing, and no extra status-only commits merely to restate green CI.
