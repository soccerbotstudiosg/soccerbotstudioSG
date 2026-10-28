# SoccerBotStudioSG current task and handover

Updated 28 October 2026, Singapore. This file is the current working checkpoint: what is being done, what is verified, where work stopped and how to resume. Replace superseded status here rather than accumulating a second history. The [Journey](docs/journey.md) owns the [milestone plan](docs/journey.md#initial-milestone-overview), complete flows and [dated decisions/evidence](docs/journey.md#part-2--dated-changes-and-evidence). [AGENTS.md](AGENTS.md) owns execution rules.

## Current task — PR114 consumed-response CI repair

Owner requested resolving PR114’s failed Worker gate. Original run 40659464431, job 122718693323, failed at combined-hold.test.mjs when parsing the competing-customer response: “Body is unusable: Body has already been read.” Frontend/backend passed on that head; this was a Worker-test failure in the live-email job, not an email send failure.

**Cause reproduced:** installed Miniflare wraps an Undici response with `new Response2(response.body, response)`; the original response’s garbage-collection finalizer can cancel its shared, unread stream. A minimal synthetic Worker plus forced GC reproduced bodyUsed=true before caller consumption and the identical exception, without booking logic. The tests held early responses unread while awaiting their competing requests.

**Fix:** consume each response immediately on its own request promise, then await the concurrent results. Applied to three overlapping/competing-checkout tests. Retained original HTTP-status and financial/booking assertions; no application change, serialization, retry, sleep or timeout relaxation. A temporary additional 200 assertion in the third scenario correctly exposed its permitted competing 409; removed that newly introduced assumption, preserving the original scenario semantics.

**Evidence:** all three affected tests passed together (3 passed, zero failed/skipped/cancelled); the minimal forced-GC experiment reproduces the old behavior and passes with immediate consumption. Source/Worker boundaries, lint, formatting and diff checks passed. Local receipts: `/tmp/soccerbot-miniflare-response-gc-proof.log`, `/tmp/soccerbot-response-all-fixed.log`; the intermediate failure remains `/tmp/soccerbot-response-overlap-fixed.log`. These local paths are session evidence, not permanent handover artifacts. Original CI receipt remains on GitHub.

**Leave-off:** publish the fix on PR114, carry it into dependent PR115, and require all final-head frontend/backend/live-email gates. A local repair is not yet a CI pass. Security documentation remains part of PR114; its architecture and proposed controls are unchanged. Existing PR111–113 merge authorization remains in effect; this task authorizes fixing PR114, not bypassing its checks.

## Exact leave-off and repository state

Workspace: `/workspace/work/soccerbot-client-portability`. Preserve its dependency symlink and unknown files. Working branch: `docs/security-infrastructure`, based on PR113. PR111 merged into main as `cb33dec4102d2b9cb4a3219c920d99046483840e`; PR112 and PR113 remain unmerged.

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
2. Review the security documentation diff and its final-head CI, alongside the latest PR113 revision. Preserve the separate PR111/112 scope and base dependencies. Record actual outcomes here when known.
3. Continue the previously requested failed-PR investigation using retained job logs and CI trace/network artifacts. Determine which operation kept loading active or prevented checkout context from arriving; fix the responsible owner only when evidence supports a cause. Owner/CI runs browser verification.
4. Once all final-head gates and review pass, report readiness for the security PR. The owner has authorized merging this stack when checks pass; any separate deployment action still follows its applicable authorization. If PR bases merge, retarget dependent PRs in order and verify the resulting base/head combinations.
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
