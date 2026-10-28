# SoccerBotStudioSG current task and handover

Updated 28 October 2026, Singapore. This file is the current working checkpoint: what is being done, what is verified, where work stopped and how to resume. Replace superseded status here rather than accumulating a second history. The [Journey](docs/journey.md) owns the [milestone plan](docs/journey.md#initial-milestone-overview), complete flows and [dated decisions/evidence](docs/journey.md#part-2--dated-changes-and-evidence). [AGENTS.md](AGENTS.md) owns execution rules.

## Current task — PR115 dismissal test setup synchronization

Original failed run [40665671472](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40665671472), live-email job 122739392571, head `2c22ab2`: frontend/backend passed; browser live-email had 83 passes and one tablet-WebKit failure. Preserve artifact `live-email-evidence-40665671472-1` (12806647325). PR114 repair head `d7abf17` passed all three gates in run 40665300590.

**Trace evidence:** the dismissal test spent 20.68 seconds waiting for confirmation and reached visible confirmation at 24.61 seconds. The saved-receipt warning passed at 27.85 seconds; retry began at 27.86 seconds. The test exhausted its unchanged 30-second budget; retry acknowledgement then completed during teardown. Closed-socket/page errors were secondary cleanup symptoms. Recorded API requests took about 1.9–2.8 seconds while recovery and browser polling overlapped. This establishes where the budget was consumed, not the underlying CI host/storage latency cause.

**Repair:** synchronize this dismissal scenario with the real automatic recovery-completion trace before opening the browser page. Assert successful complete recovery and retain all existing browser receipt, lost-response, explicit retry, saved-navigation and single-effect assertions. The separate payment-recovery browser journey still tests pending return and automatic webhook wake-up. No application/provider change, fabricated confirmation, cron invocation, retry, sleep, timeout extension or reduced test inventory.

**Local evidence:** added isolated Worker regression verifies the automatic completion event precedes readable committed confirmation, repeat dismissal acknowledgements preserve the receipt, and booking/payment/accounting each occur once. Passed (1 test, zero failed/skipped), receipt `/tmp/pr115-recovery-regression.log`. Browser test lint, TypeScript and source checks passed. Static inspection of the saved trace used no browser. Final-head CI must establish tablet acceptance; the repair does not yet prove every CI timing issue resolved.

**Leave-off:** publish this repair on PR115, inspect all final-head gates and preserve the original failed receipt. PR113 and PR114 are green on their last observed heads; all three PRs remain unmerged. Full CI remains enabled for documentation changes; any future classification design must preserve code/config/dependency gates and exact-artifact deployment requirements.

## Operational documentation retained

Owner asked to improve three existing areas identified in the documentation review: current-status accuracy, concrete API examples, and recovery/alert runbook detail. Work is on `docs/operational-contract-detail`, based on the pending security-document branch.

- **Status reconciliation:** Business rules now distinguish source implementation from recorded account observations and pending acceptance. Corrected the stale mandatory-Pages prerequisite, future-only first-use placement claim and security-settings language. Preserve all 32 BR IDs and financial/identity invariants; the code-owner index follows the revised summaries.
- **API examples:** Added fictional request/response examples for guest access, email challenge, preparation, consent/selection rejection, uncertain checkout, protected context, payment-pending/confirmed decisions, throttling/access denial, webhook acknowledgement and repeatable dismissal. A Mermaid transition diagram explains why HTTP success is not payment confirmation. No credentials or actual customer records appear.
- **Runbook:** Added proposed alert thresholds, data-source prerequisites, no-data/false-positive caveats, delivery acceptance and recovery target proposals. Expanded the isolated restore procedure, stop conditions and blank evidence worksheet. Owner explicitly requested leaving primary/backup responders and destinations **unassigned**. Proposed thresholds/RPO/RTO are not approved settings or SLA commitments; no alert was provisioned/sent and no restore was executed.

**Deployment decision:** owner confirmed transfer of `soccerbotsg.com` to the client registrar first, followed by client Cloudflare nameservers/DNS management. Vendor supplied “PP unlock” and email records; transfer has not occurred. Confirm registrar/account and preserve all email/DNS records before any owner-executed change. Reassess the earlier vendor-retained DNS/SaaS design against the confirmed ownership plan. No transfer code is stored here.

## Exact leave-off and repository state

Workspace: `/workspace/work/soccerbot-client-portability`. Preserve its dependency symlink and unknown files. Working branch: `docs/operational-contract-detail`, based on the security-document branch (PR114). PR111 merged into main as `cb33dec4102d2b9cb4a3219c920d99046483840e`; PR112 merged as `e9e6bbe4d35ac161dbf8651bff9ee521a51279ae`; main verification run 40662586831 passed. PR113 remains unmerged with final-head run 40662641178 passed.

| PR                                                               | Branch / base                                                       | Last observed revision and CI                                                                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [111](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/111) | `feat/version-inventory` → `main`                                   | Merged as `cb33dec4102d2b9cb4a3219c920d99046483840e` after all three required checks passed at head `35bc305`. Independent main verification/deployment must be inspected separately. |
| [112](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/112) | `docs/architecture-adr` → `main`                                    | Merged as `e9e6bbe4d35ac161dbf8651bff9ee521a51279ae`; main run 40662586831 passed.                                                                                                    |
| [113](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/113) | `docs/contracts-expansion` → `main`                                 | Head `b6ff105abad3cb4ebaa84016ddb08e4ec714fcd7`; run 40662641178 passed.                                                                                                              |
| [114](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/114) | `docs/security-infrastructure` → `docs/contracts-expansion`         | Repair head `d7abf17`; run 40665300590 passed.                                                                                                                                        |
| [115](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/115) | `docs/operational-contract-detail` → `docs/security-infrastructure` | Head `2c22ab2` failed run 40665671472 in tablet dismissal; current repair requires fresh CI.                                                                                          |

These are timestamped observations, not live status. Refresh exact heads and checks before acting. Main independently verifies merged revisions.

## Verification completed and limits

- All 32 BR IDs and all 44 milestone headings were retained. Prior dated history matched the original verbatim before the new split entry was appended.
- Local file links and Markdown anchors resolve. Formatting, source ownership, policy, version freshness and diff checks passed for the split.
- All 30 local installer regressions passed; actual planning-document integrity passed with the three new owners.
- No assistant browser or live provider tests were run. Final-head frontend, backend and live-email CI remains required; the earlier passing head does not establish this candidate’s acceptance.

## Open failure — PR112 tablet WebKit checkout

[Original run 40652609843](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40652609843), revision `1b25b892165934282479e3676d4456d2a3403045`: frontend and live-email passed; backend browser verification had 73 passes and two failures. Preserve [backend evidence artifact 12801265051](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40652609843/artifacts/12801265051), named `backend-evidence-40652609843-1`.

1. `tests/experiment.spec.ts` — “synthetic paid but invalid booking needs recovery instead of claiming success”: Open checkout was visible, but `.booking-flow-overlay` intercepted clicks until the 30-second test timeout.
2. Same file — “synthetic access revocation hides protected details and stops checking”: preparation timed out waiting for `/api/attempts/:id/checkout`.

Root cause is **not established**. Inspection owners: [experiment tests](tests/experiment.spec.ts), [loading provider](src/features/booking/booking-loading.tsx), [protected confirmation](src/features/booking/protected-confirmation.tsx), [checking lifecycle](src/features/booking/confirmation-checking.ts), and [preview server](scripts/serve-export.mjs). No runtime repair, forced click, longer timeout, retry or weakened assertion was applied. A later green run would not by itself explain the original failure.

## Resume here

1. Read AGENTS, this handover, [Business rules](docs/business-rules.md), [operation inventory](docs/api-contracts.md#1-domain-operation-inventory) and [Journey milestones](docs/journey.md#initial-milestone-overview). Refresh branch, index, main and all three PR heads/checks.
2. Review the operational/API documentation diff and its final-head CI, alongside PR114 and the latest PR113 revision. Preserve the separate PR111/112 scope and base dependencies. Record actual outcomes here when known.
3. Continue the previously requested failed-PR investigation using retained job logs and CI trace/network artifacts. Determine which operation kept loading active or prevented checkout context from arriving; fix the responsible owner only when evidence supports a cause. Owner/CI runs browser verification.
4. Once all final-head gates and review pass, report readiness for the new documentation PRs. The owner has authorized merging this stack when checks pass; any separate deployment action still follows its applicable authorization. If PR bases merge, retarget dependent PRs in order and verify the resulting base/head combinations.
5. Resume client deployment work after this documentation/CI work is settled, using the checklist below and the [delivery journey](docs/journey.md#deployment-acceptance-and-handover-journey).

## Deployment handover retained for the next task

Client production is not established. These are previously recorded checkpoints, not a fresh infrastructure inspection:

- Client Cloudflare connection `soccerbot`, account `0b36822648e6905c681a90b6bec5ca7f`; personal connection `Primary`. Verify actual account IDs before operations. Client D1 exists and its recorded primary probe was KIX/Osaka; target hint is `apac-ne`. Immutable foundation registration, first-use coordinator execution/placement and exact-artifact client installation remain acceptance work. See [provisioning record](docs/journey.md#27-october-2026--client-d1-created-and-primary-placement-verified).
- SaaS zone `soccerbotsg.win` and active fallback were prepared; test DNS zone `standardsoftwares.com` is in Primary. Start with `booking.standardsoftwares.com`, separately prove its apex, then reassess the production design for the owner’s confirmed transfer-first/client-managed DNS plan for `soccerbotsg.com`. `app404.ai` is excluded. Recheck hostname ownership, proxy/CAA and persistent certificate-validation requirements. [Hosting rules](docs/business-rules.md#client-hosting-setup-prepared-not-deployed) own requirements.
- Recheck client repository `soccerbotstudiosg/soccerbotstudioSG` before copying. Preserve developer staging data/coordinator and provider credentials; client production credentials, origins and mappings stay separate. Automatic trusted PR staging and duplicate-deployer cutover remain to be completed/verified.
- Owner confirmed developer-repository Dependency graph, Dependabot alerts and security updates enabled; PR108 remediation is in current main. The earlier “not enabled/no audit workflow” notes are historical, not current blockers. Client repository settings and current advisories need separate inspection; [runbook](docs/runbook.md#3-dependency-maintenance-and-dependabot) owns maintenance.
- Central company Grafana is the intended monitoring account. Exporter activation, environment/service separation, receiver ingestion, dashboards and alert acceptance remain pending. Billing/MFA, client integrations and owner UAT remain handover work.

The requested code-owners folder/function-level technical-behavior expansion remains paused. The separately installed cloud skill cannot be edited by the available read-only skill tools; current AGENTS explicitly supersedes its stale snapshot. No routine browser, DNS/email, real booking/payment/refund/cancellation or notification action is authorized by this handover. Give the owner one setup step at a time when setup resumes.

## Historical context

Use [Journey’s dated history](docs/journey.md#part-2--dated-changes-and-evidence) for decisions and receipts, [Business rules](docs/business-rules.md) for invariants, and [Runbook](docs/runbook.md) for operational procedures. The prior Progress snapshot is linked from Journey’s handover-refactor entry; superseded “current” statements remain historical evidence rather than being repeated here.
