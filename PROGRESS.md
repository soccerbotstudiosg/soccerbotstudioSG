# SoccerBotStudioSG current task and handover

Updated 30 October 2026, Singapore. This file owns the current task, verified checkpoint and next actions. [Journey](docs/journey.md) owns milestones, complete flows and dated history; [AGENTS](AGENTS.md) owns engineering rules. Historical failures and previous plans remain dated evidence, not current release status.

## Current task — client GitHub deployment ownership

Owner requests client-repository PR verification followed by staging deployment, then independent merged-main verification followed by client Cloudflare deployment. Bootstrap client hosting on Workers.dev before domain hookup. Branch `feat/client-github-deployment` starts from `26554bcc2d3b3091263bcadfcc883a2706d99210`.

PR122 is complete: head `5ac174b24e522e6439d2e27227cb73dcbb5f8074` passed run 40839272999 and merged as `26554bcc2d3b3091263bcadfcc883a2706d99210`. Main run [40843356821](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40843356821) passed all three gates and developer deployment. Its archived receipt and current health agree on Worker version `c41fc74a-b8f2-4524-aece-7fbe9054fcba`. On 30 October all 11 inspected public pages, homepage assets and health returned 200; a foreign Origin returned 403. This is developer deployment evidence, not client GitHub ownership or provider/device acceptance. Leave test 507 untouched.

Client account `0b36822648e6905c681a90b6bec5ca7f` has existing D1 `soccerbot-production-state` / `e2a21801-0107-4db5-8551-ca1ff338df53`; the inspected API listed no Workers. Preserve coordinator `simplybook-production-account` and `apac-ne` on first use. The temporary configured origin is `https://soccerbot-production.lucky-poetry-b25e.workers.dev`. A client Turnstile widget was created for that hostname; no secret value was exported. Client operations remain closed; foundation registration, provider secrets and acceptance remain separate.

**Leave-off:** owner-authorized PR1 merged as `930aa230ef1aaa41f4d3e49f9ca2fc26e4e115eb`. Its exact head `7a9d96b73ae5ad1532c09543c6a783d04ae678ea` passed all four jobs in run 41001585832; client-repository staging deployment run 41004241912 succeeded. Main now has only `verify-target.yml` and `deploy-release.yml`. Independent main run 41006678430 passed frontend, Worker/runtime and backend but failed one of 84 live-email cases. Production remains disabled; client Worker installation/provider acceptance is not established. Local origin is the client repository and developer preserves the former remote. Owner deferred GitHub Team/protection and dependency PRs #2/#3; original evidence/branches are preserved and Dependabot remains enabled.

Current branch `fix/ci-runtime-temp-storage` starts from merged main. Main failure: tablet creation-price drift timed out after receiving recovery-required but before navigating from Review to payment (job 123908098889, artifact 12956138759). It passed in 7.18 seconds on the PR run (artifact 12955081086). Diagnostics now show runtime readiness taking 9.42 seconds in the failing case, compared with ordinary subsecond initialization. During the 63.75-second begin/end interval including timeout cleanup, host I/O pressure increased by 48.45 seconds (`some`) / 33.29 seconds (`full`); the passing case's 7.20-second interval recorded 27.7 ms / 7.6 ms. These are host pressure intervals, not additive per-operation latency. Two other slow passing cases also correlate with I/O pressure. More than 5 GB memory was available, without recorded OOM or cgroup CPU throttling. This supports storage contention as the next hypothesis; it does not identify the underlying host/device cause or attribute all pressure to this process.

Miniflare's inspected implementation uses randomized directories below Node's temporary directory for default D1/DO persistence. Candidate mounts only the live-email container's `/tmp` as a 2 GiB tmpfs and verifies its filesystem before dependencies/tests run. Real SQLite, per-case isolated state, same-instance restart semantics, full test/device inventories, assertions, retries=0 and deadlines remain unchanged. Evidence stays in the checkout's `test-results` on disk. Full Worker/storage regressions continue with their existing disk-backed job. No application/provider/configuration or production durability claim changes.

Validation: seven deployment/workflow regressions and policy/version checks passed; source/lint/format/diff checks cover the final candidate. No assistant browser execution. The first exact-head CI run will test the temporary-storage hypothesis using the retained phase/resource diagnostics. Do not treat a green run as proof of all historical causes or rerun unchanged failures blindly. Prior failures, source-review dispositions and local two-CPU probes remain in Journey and `/workspace/work/client-pipeline/`.

Campaign: one focused storage-mitigation slice, bounded to six iterations/90 minutes. Next: publish one follow-up PR, inspect final-head CI and pressure data, then obtain applicable merge authorization and independent main verification. Existing PR1 merge approval is not approval to merge this new PR. Remaining deployment acceptance includes closed-client install, foundation/placement, rollback, provider configuration and owner UAT. Leave test 507 untouched; no live booking/payment/email/DNS operations.

Earlier local evidence: 160 tooling tests, policy/source checks, versions, 354 local link targets and both architecture diagram parses passed. A restored-dependency esbuild failure was resolved by installing the reviewed lockfile without dependency changes; original evidence remains in `/workspace/work/client-pipeline/`. The handover PR routes closed-client static assets through the canonical-origin guard on Workers.dev; its 15 affected deployment tests passed. Current browser repair validation and final-head CI are separate.

Provider test setup: owner-authorized changes added 42 date-specific schedules in SimplyBook company `soccerbot`, 3–16 November 2026 (Singapore): Faisal noon–4pm, Nabil 2–6pm, Caelan 4–8pm. All 42 schedules were read back; November dates outside the range were unchanged. Effective service hours were checked for 3 November. No bookings were created. Customer-flow acceptance still needs to verify trainer choices and the single studio capacity across different trainers; the owner's screenshot showed admin exemption enabled, so admin booking entry is not sufficient evidence. Earlier bookings remain untouched.

## Current domain handover — pending vendor action

The client zone was prepared and inspected, with assigned nameservers `daniella.ns.cloudflare.com` and `merlin.ns.cloudflare.com`. Cloudflare Registrar requires the destination zone to become active **before** initiating the EPP transfer. Existing registrar DS status and five extra cPanel service proxy settings require vendor review. Preserve email hosting; no assistant DNS change or message send. Once the vendor confirms the nameserver change, recheck zone activation and email routing before guiding the owner through EPP/payment submission. Never place the EPP code in repository evidence.

## Historical deployment checkpoint — retained context, not current task status

## Verified main and completed PR stack

Final merged revision: `dffb24a12aae68de4ee32d6e7477bf227b3f0c50`. [Main run 40684219386](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40684219386) completed successfully: frontend, backend and live-email gates, frontend deployment and Cloudflare deployment. This proves the existing developer deployment workflow, not client production activation. Before starting this new documentation branch, GitHub had zero open PRs and zero pending/queued/running workflows; that is a checkpoint, not a continuously live count.

| PR                                                               | Outcome | Merge revision                             |
| ---------------------------------------------------------------- | ------- | ------------------------------------------ |
| [111](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/111) | Merged  | `cb33dec4102d2b9cb4a3219c920d99046483840e` |
| [112](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/112) | Merged  | `e9e6bbe4d35ac161dbf8651bff9ee521a51279ae` |
| [113](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/113) | Merged  | `28333129b94e2b6a728724e5c19f602125d951e1` |
| [114](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/114) | Merged  | `f176954c88a47419baa1a034255c8745a11e88cf` |
| [115](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/115) | Merged  | `dffb24a12aae68de4ee32d6e7477bf227b3f0c50` |

PR114’s consumed-response repair and PR115’s dismissal setup/inventory repair passed final checks. Original failure receipts and their explanations are retained in [Journey’s dated history](docs/journey.md#part-2--dated-changes-and-evidence). The earlier PR112 tablet timing failure has no established root cause; later green runs do not retroactively diagnose it. It is a retained investigation item, not a currently failing final-main gate.

## Earlier domain plan — superseded by current domain handover above

**Earlier plan (superseded):** transfer `soccerbotsg.com` to the client registrar first, then delegate authoritative DNS to the client Cloudflare account. The vendor supplied “PP unlock” and email records. **Not verified:** transfer completion, destination registrar/account, exact current zone/account rights, nameserver change, mail-record completeness or production hostname configuration. Do not store transfer codes in the repository.

Registrar ownership, authoritative DNS delegation and application hosting are three separate states. Preserve existing nameservers/DNS/email service during registrar transfer; prepare and compare the destination zone and DNSSEC/DS transition before an owner-executed delegation change. Confirm the supported same-account Worker hostname/routing design and costs, then prove direct `https://soccerbotsg.com` access, managed TLS/renewal prerequisites, redirects, same-origin API, cookies and rollback. Record first issuance and actual renewal separately.

The existing [production target](deployment/production.json) still declares the earlier SaaS zone `soccerbotsg.win`, test origin `booking.standardsoftwares.com` and closed access with a missing Turnstile sitekey. This documentation does not migrate or bypass that configuration. Reassess it in a separately reviewed implementation after ownership is verified. Earlier separate-account test zones may be retained; they do not prove the new production topology. `app404.ai` remains excluded.

**First setup step when deployment resumes:** confirm the destination registrar and whether the `soccerbotsg.com` registrar transfer has actually completed. Then inspect ownership and the preserved DNS/email baseline read-only. Give the owner one small setup step at a time; owner/CI operates browsers and the owner executes registrar/DNS changes.

## Other deployment and handover work retained

Client production is not established. The following are recorded checkpoints, not a new infrastructure inspection:

- Client Cloudflare connection `soccerbot`, account `0b36822648e6905c681a90b6bec5ca7f`; personal connection `Primary`. Verify actual IDs before action. D1 primary probe was KIX/Osaka; target hint is `apac-ne`. Foundation registration, first-use coordinator execution/location and exact-artifact installation remain acceptance work. Preserve developer staging data/coordinator identity.
- Recheck client repository `soccerbotstudiosg/soccerbotstudioSG` before copying. Separately scoped staging/production credentials, origins and mappings; automatic trusted PR staging and duplicate-deployer cutover remain work.
- Developer Dependency graph, Dependabot alerts and security updates were owner-confirmed. Client repository settings and fresh advisories require their own checks; [runbook](docs/runbook.md#3-dependency-maintenance-and-dependabot) owns maintenance.
- Company-central Grafana remains intended. Receiver ingestion, service/environment separation, dashboards, alert provisioning and delivery acceptance are pending. Primary/backup responders and alert destinations remain **unassigned** by owner choice. Proposed alert thresholds and RPO/RTO are not approved commitments; restore procedures have not been exercised.
- Reconfirm client SimplyBook schedules/prices/services, Resend sender authentication, Turnstile mappings and HitPay production settings before activation. Billing/MFA, one owner booking/payment journey, account actions, navigation, monitoring and rollback remain handover work. Preserve email/DNS records.

Workspace: `/workspace/work/soccerbot-client-portability`; preserve the untracked dependency symlink and unknown files. No assistant live booking, payment, refund, cancellation, notification, DNS/email or registrar action is authorized by this document. [Development](docs/development.md), [Business rules](docs/business-rules.md), [API contracts](docs/api-contracts.md) and [Runbook](docs/runbook.md) remain the owning guides.
