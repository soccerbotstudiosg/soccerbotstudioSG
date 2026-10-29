# SoccerBotStudioSG current task and handover

Updated 29 October 2026, Singapore. This file owns the current task, verified checkpoint and next actions. [Journey](docs/journey.md) owns milestones, complete flows and dated history; [AGENTS](AGENTS.md) owns engineering rules. Historical failures and previous plans remain dated evidence, not current release status.

## Current task — section 7 Mermaid rendering repair, 29 October 2026

The recovery sequence diagram in [technical behavior](docs/code-owners/technical-behavior.md#7-recovery-confirmation-exports-and-completed-exit) failed parsing because a literal semicolon in its note was interpreted as a statement separator. Reproduced with Mermaid 11 using a temporary parser outside the repository; replacing the semicolon with a comma passes. No application, dependency manifest or workflow changed. Browser rendering remains owner/CI-operated.

Branch `docs/fix-recovery-diagram` starts from main `150b705`, containing merged PR116 and PR117. Their final PR checks passed; post-merge deployment status is not reverified in this narrow task. Publish this repair as a draft PR and inspect its final-head CI.

Domain handover remains pending vendor action: the client zone was prepared and inspected, with assigned nameservers `daniella.ns.cloudflare.com` and `merlin.ns.cloudflare.com`. Cloudflare Registrar requires the destination zone to become active **before** initiating the EPP transfer; this supersedes the transfer-first ordering in the earlier checkpoint below. Existing registrar DS status and five extra cPanel service proxy settings require vendor review. Preserve email hosting; no assistant DNS change or message send.

## Previous task checkpoint — retained history, superseded by the current task above

## Active CI repair — PR116 checking-budget initialization

Run [40706485933](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40706485933) failed one phone WebKit case after reading an uninitialized checking budget. Frontend/live-email and 74 other browser cases passed. The duplicate-tab test now waits for the initial confirmation request, which follows budget persistence, before capturing its baseline. Deadline/allowance assertions remain intact; no application behavior or timeouts changed. Original evidence and diagnosis are retained in [Journey](docs/journey.md#28-october-2026--pr116-checking-budget-test-initialization-repair).

Leave-off: repair `cdef7e7` is pushed to PR116 and included in PR117; require fresh final-head CI. PR117 at `91539f2` independently passed all three gates in run 40714296582. Its prior green result predates this repair. Neither PR is merged by this task.

## Current task — data lifecycle draft before client clause mapping

Owner requested a Markdown draft based on application behavior, then mapping to the client’s PDPA/privacy clauses before implementation. Branch: `docs/data-lifecycle-draft`, stacked on unmerged [PR116](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/116), head `cdef7e7`; application baseline remains verified main `dffb24a`.

- Added [data-lifecycle.md](docs/data-lifecycle.md): lifecycle diagram, 18 inventory categories, source validity periods, actual narrow cleanup, provider/log/backup boundaries and a pending clause-mapping worksheet.
- Reviewed all 35 migrations in an empty in-memory SQLite database and source storage/cleanup paths. No deployed data or account retention settings were inspected. Expiry, revocation and grant archival do not establish erasure; `retentionPreview` explicitly leaves cleanup disabled.
- Linked the lifecycle owner from AGENTS, security and runbook. Corrected the security overview to place public display snapshots in Durable Object storage, not D1.
- No retention duration approved, cleanup implemented, provider action taken or runtime changed. Client clauses, external settings and operational decisions remain pending; alert responders stay unassigned.

**Validation scope:** Markdown links/anchors, formatting, source/policy and diff checks. Browser execution, provider acceptance and cleanup tests are not applicable evidence for this documentation-only change.

**Leave-off:** [PR117](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/117) is published as a stacked draft; inspect final-head CI before claiming readiness. Review the worksheet with the client’s clauses before proposing implementation. PR116 contains the prior status/hosting reconciliation and code-owner/technical-behavior expansion and was still unmerged at this task’s checkpoint. Main/deployment receipts below do not establish acceptance of either documentation candidate.

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

## Domain decision and next deployment step

**Confirmed plan:** transfer `soccerbotsg.com` to the client registrar first, then delegate authoritative DNS to the client Cloudflare account. The vendor supplied “PP unlock” and email records. **Not verified:** transfer completion, destination registrar/account, exact current zone/account rights, nameserver change, mail-record completeness or production hostname configuration. Do not store transfer codes in the repository.

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
