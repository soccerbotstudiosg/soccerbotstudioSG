# SoccerBotStudioSG current task and handover

Updated 29 October 2026, Singapore. This file owns the current task, verified checkpoint and next actions. [Journey](docs/journey.md) owns milestones, complete flows and dated history; [AGENTS](AGENTS.md) owns engineering rules. Historical failures and previous plans remain dated evidence, not current release status.

## Current task — per-slot trainer selection

Outcome: after choosing each time, the customer explicitly chooses an available trainer from that slot’s dropdown. Below the right-hand booking summary, one trainer card lists all selected times for that trainer; different trainer cards stack vertically. Different sessions may use different trainers; studio capacity remains one across all trainers (BR-001/002). Branch `feat/per-slot-trainer-choice` starts from main `3c39f882d1106185bda10227a21784cafc357e1d` (PR118 merged). PR119's documentation/testing skills remain a separate draft.

Scope: availability offer identity, calendar/prebooking validation, time selection and demo parity, retained selected-trainer snapshots, regression tests/inventories and owning docs. No provider configuration, live booking, payment, notification or deployment changes. Preserve legacy finite non-overlapping trial contracts and immutable financial recovery evidence.

Acceptance: show a time once with its eligible trainer choices; require an explicit choice independently per slot; retain/change/remove that choice without duplicating the slot; reject stale or foreign trainer selections; preserve single shared-studio conflicts across different trainers and batch failure recovery. Local unit/isolated Worker evidence is separate from owner/CI browser and live SimplyBook shared-resource acceptance. Final frontend/backend/live-email gates remain required.

Queue: (1) offer/validation contracts, (2) time picker and demo, (3) frontend/Worker/browser regression cases and inventories, (4) documentation reconciliation, full permitted local verification and draft PR. Budget: six substantive iterations/90 active minutes per review block; no additional agents or external cost. Token/tool cost accounting unavailable. Source implementation is authorized; merge is not.

**Checkpoint:** implementation, focused regressions and full Worker verification complete: 454 runtime cases passed, zero skipped/cancelled/todo, plus Worker source/type checks. All frontend/code stages passed (241 unit cases, tooling/installer checks, audit, formatting/lint/types, build and export); the first full code receipt was refused because documentation changed during the run. Retain `/tmp/trainer-verify-code.log` and rerun against the unchanged committed candidate before publication. Focused evidence: all 39 catalogue/prebooking cases, three new isolated workerd/D1/DO cases (multi-trainer batch/restoration, competing cross-trainer holds, direct provider conflict/no duplicate payment), and 25 selected component/service cases passed. Added one browser journey plus updated existing customer/live-email/experiment selection helpers; browser execution belongs to CI. Inventories retain every existing case and expand by five frontend/browser and four Worker cases. Documentation check: 18 Markdown files, 31 Mermaid diagrams and 84 tables passed; local links were rechecked after the runbook addition.

The first full unit pass had one new-test expectation error: demo shared-capacity denial is `late`, not `conflict`; corrected to the established state. Earlier obsolete single-offer expectations and missing contact-mode test fixture were repaired, and local typography now uses approved tokens. Failed receipts remain in `/tmp/trainer-unit-first.log`, `/tmp/trainer-all-units.log`, `/tmp/trainer-catalogue.log` and `/tmp/trainer-source.log`; this environment’s scratch evidence is not a permanent CI artifact.

**Leave-off:** publish the committed candidate only after its unchanged-source code receipt passes, then inspect the draft feature PR’s frontend/backend/live-email CI. The PR records the final commit and verification receipts. Four source/test/documentation slices are complete within the first six-iteration/90-minute block; this is final verification/delivery, not provider acceptance. No application/browser/provider acceptance, merge or deployment claimed. Shared studio capacity is enforced by SimplyBook’s configured shared resource; client acceptance must verify two customers choosing different trainers cannot reserve the same studio time. Older builds reject new customer-choice grants: follow the compatible rollback requirement in [Runbook](docs/runbook.md#trainer-choice-rollout-and-recovery). [Journey](docs/journey.md) retains prior milestones and dated evidence.

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
