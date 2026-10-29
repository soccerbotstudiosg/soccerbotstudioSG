# SoccerBotStudioSG current task and handover

Updated 29 October 2026, Singapore. This file owns the current task, verified checkpoint and next actions. [Journey](docs/journey.md) owns milestones, complete flows and dated history; [AGENTS](AGENTS.md) owns engineering rules. Historical failures and previous plans remain dated evidence, not current release status.

## Current task — documentation reconciliation and test-maintenance skills

Outcome: adapt the requested Fitfinity procedure into [.agents/skills/soccerbot-documentation/SKILL.md](.agents/skills/soccerbot-documentation/SKILL.md) and add the companion [test-maintenance skill](.agents/skills/soccerbot-testing/SKILL.md), linked from AGENTS for every PR and scope/delivery-state change. Branch `docs/documentation-state-skill` starts from merged main `3c39f88` (PR118). Working tree was clean before this task; dependency files are preserved.

The documentation procedure reviews all documentation owners, changes only affected ones, records exact evidence/acceptance states and keeps delivery receipts current without endless status-only commits. Adaptations use SoccerBot's actual UAT paths, Worker/TypeScript/Zod contracts, three CI gates, isolated Worker storage tests and owner/CI browser boundary. It is an instruction skill, not unattended automation or a new permission grant. AGENTS remains the authority.

The test skill maps changed behavior to existing tests, requires explicit add/update/retain/retire decisions, synchronizes fixtures and strict inventories in the same PR, preserves failure evidence and requires a test-impact receipt. A reasoned no-test-change decision is valid for this procedure-only PR; no runtime, test assertions, fixtures or inventories need edits. This does not retrofit or certify all existing coverage.

Owner impact: both skills and AGENTS own the new procedures; Progress and Journey own task/delivery reconciliation. North Star's campaign budgets, business/API rules, code-owner diagrams, architecture/security/data-lifecycle content, setup/runbook/version inventory and UAT behavior do not change for this procedure-only PR. No application, schema, dependencies, workflows or external settings changed.

Budget: one bounded review/adaptation/validation cycle within the default six-iteration/90-minute block; token/tool cost accounting unavailable. Acceptance: valid skill metadata and paths, consistent owner map, local links/Markdown structure and source/policy checks, followed by exact-final-head CI. No browser rendering is claimed or needed for unchanged diagrams.

**Verified delivery checkpoint:** PR118 merged as `3c39f882d1106185bda10227a21784cafc357e1d`; its final-head run 40804424347 passed all three gates. At this task's read, [main run 40811741772](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40811741772) had passed frontend/backend and frontend deployment, with live-email still running; Cloudflare deployment was not confirmed. This is last-observed evidence, not a live status.

**Leave-off:** update [PR119](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/119) with both documentation-state and test-impact receipts, then inspect its new final-head gates. Merge requires separate authorization. The product outcome remains dependable customer booking and quick rebooking for client UAT/handover; client configuration/deployment proof and privacy-clause mapping for [data lifecycle](docs/data-lifecycle.md) remain pending.

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
