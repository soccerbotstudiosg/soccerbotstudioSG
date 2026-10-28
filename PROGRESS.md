# SoccerBotStudioSG current task and handover

Updated 28 October 2026, Singapore. This file is the current working checkpoint: what is being done, what is verified, where work stopped and how to resume. Replace superseded status here rather than accumulating a second history. The [Journey](docs/journey.md) owns the [milestone plan](docs/journey.md#initial-milestone-overview), complete flows and [dated decisions/evidence](docs/journey.md#part-2--dated-changes-and-evidence). [AGENTS.md](AGENTS.md) owns execution rules.

## Current task — documentation ownership and developer handover

The owner has authorized merging these PRs if their required checks pass. PR111 is now merged; PR112 was retargeted to main and synchronized after GitHub reported it behind. PR113 includes that synchronization. Next: wait for final-head checks, merge PR112 when eligible, then retarget/synchronize PR113 and require its final checks before merging. No further merge permission is needed for this reviewed stack.

The owner requested splitting the mixed service-contracts document into three files, with a Fitfinity-style domain operation inventory and detailed API contracts. The latest refinement is to make this Progress file a detailed current-task handover and put the initial milestone overview before the full journey.

Implemented on `docs/contracts-expansion`, [draft PR113](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/113):

| Owner                                            | Completed content                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [business-rules.md](docs/business-rules.md)      | All 32 stable BR groups, preserving their IDs and requirements; rule links updated throughout the repository.                                                                                                                                                                                                                                                          |
| [api-contracts.md](docs/api-contracts.md)        | Named service methods with source status, permission policy, implementation/API mapping and test evidence owners, followed by domain responsibilities and detailed request/response, validation, access, effect and recovery contracts. Distinguishes live adapters, protected confirmation, local helpers, unavailable legacy interfaces and preview-only operations. |
| [journey.md](docs/journey.md)                    | Initial nine-phase overview and all 44 milestone criteria first; then customer, trainer, administrator, failure/recovery and delivery journeys; retained dated history.                                                                                                                                                                                                |
| [AGENTS.md](AGENTS.md), navigation and installer | Current document ownership/read order and local links; planning installer requires the three replacement documents and checks milestone ordering in Journey. Root README and redundant local skill wrapper remain removed.                                                                                                                                             |
| This file                                        | Current-task checkpoint, exact leave-off, known failures, verification boundaries and ordered continuation. Historical material is reached through Journey.                                                                                                                                                                                                            |

The contract split was published at `f40e8ef9a526df65b5861049e3cbe8068c40fc73`. This handover refinement is a subsequent documentation change on the same PR; obtain its exact head from Git rather than treating the earlier SHA as the final candidate. No runtime behavior, provider settings or deployment was changed by this task.

## Exact leave-off and repository state

Workspace: `/workspace/work/soccerbot-client-portability`. Preserve its dependency symlink and unknown files. Working branch: `docs/contracts-expansion`. PR111 merged into main as `cb33dec4102d2b9cb4a3219c920d99046483840e`; PR112 and PR113 remain unmerged.

| PR                                                               | Branch / base                                        | Last observed revision and CI                                                                                                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [111](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/111) | `feat/version-inventory` → `main`                    | Merged as `cb33dec4102d2b9cb4a3219c920d99046483840e` after all three required checks passed at head `35bc305`. Independent main verification/deployment must be inspected separately. |
| [112](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/112) | `docs/architecture-adr` → `main`                     | Head `51082e6c4e41f5ae3950f64f7a103a2f0036e8ce` includes main. Previous head `6588170` passed all three gates; refreshed-head CI required.                                            |
| [113](https://github.com/LimYouSheng/SoccerBotStudioSG/pull/113) | `docs/contracts-expansion` → `docs/architecture-adr` | Includes the PR112 synchronization at `802a254`, followed by this handover update. Read the exact latest head/checks from GitHub.                                                     |

PR112 and PR113 remain drafts pending final-head checks. These are timestamped observations, not live status. Retarget PR113 after PR112 merges and synchronize if GitHub requires it; do not bypass checks. Owner merge authorization applies to this stack. Main independently verifies each merged revision before exact-artifact deployment.

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
2. Review the final documentation diff and check CI for the exact latest PR113 revision. Preserve the separate PR111/112 scope and base dependencies. Record actual outcomes here when known.
3. Continue the previously requested failed-PR investigation using retained job logs and CI trace/network artifacts. Determine which operation kept loading active or prevented checkout context from arriving; fix the responsible owner only when evidence supports a cause. Owner/CI runs browser verification.
4. Once all final-head gates and review pass, report readiness. The owner has authorized merging this stack when checks pass; any separate deployment action still follows its applicable authorization. If PR bases merge, retarget dependent PRs in order and verify the resulting base/head combinations.
5. Resume client deployment work after this documentation/CI work is settled, using the checklist below and the [delivery journey](docs/journey.md#deployment-acceptance-and-handover-journey).

## Deployment handover retained for the next task

Client production is not established. These are previously recorded checkpoints, not a fresh infrastructure inspection:

- Client Cloudflare connection `soccerbot`, account `0b36822648e6905c681a90b6bec5ca7f`; personal connection `Primary`. Verify actual account IDs before operations. Client D1 exists and its recorded primary probe was KIX/Osaka; target hint is `apac-ne`. Immutable foundation registration, first-use coordinator execution/placement and exact-artifact client installation remain acceptance work. See [provisioning record](docs/journey.md#27-october-2026--client-d1-created-and-primary-placement-verified).
- SaaS zone `soccerbotsg.win` and active fallback were prepared; test DNS zone `standardsoftwares.com` is in Primary. Start with `booking.standardsoftwares.com`, separately prove its apex, then prepare vendor instructions for `soccerbotsg.com` with Uncoverin retaining DNS. `app404.ai` is excluded. Recheck hostname ownership, proxy/CAA and persistent certificate-validation requirements. [Hosting rules](docs/business-rules.md#client-hosting-setup-prepared-not-deployed) own requirements.
- Recheck client repository `soccerbotstudiosg/soccerbotstudioSG` before copying. Preserve developer staging data/coordinator and provider credentials; client production credentials, origins and mappings stay separate. Automatic trusted PR staging and duplicate-deployer cutover remain to be completed/verified.
- Owner confirmed developer-repository Dependency graph, Dependabot alerts and security updates enabled; PR108 remediation is in current main. The earlier “not enabled/no audit workflow” notes are historical, not current blockers. Client repository settings and current advisories need separate inspection; [runbook](docs/runbook.md#3-dependency-maintenance-and-dependabot) owns maintenance.
- Central company Grafana is the intended monitoring account. Exporter activation, environment/service separation, receiver ingestion, dashboards and alert acceptance remain pending. Billing/MFA, client integrations and owner UAT remain handover work.

The requested code-owners folder/function-level technical-behavior expansion remains paused. The separately installed cloud skill cannot be edited by the available read-only skill tools; current AGENTS explicitly supersedes its stale snapshot. No routine browser, DNS/email, real booking/payment/refund/cancellation or notification action is authorized by this handover. Give the owner one setup step at a time when setup resumes.

## Historical context

Use [Journey’s dated history](docs/journey.md#part-2--dated-changes-and-evidence) for decisions and receipts, [Business rules](docs/business-rules.md) for invariants, and [Runbook](docs/runbook.md) for operational procedures. The prior Progress snapshot is linked from Journey’s handover-refactor entry; superseded “current” statements remain historical evidence rather than being repeated here.
