# SoccerBotStudioSG current task and handover

Updated 30 October 2026, Singapore. This file owns the current task, verified checkpoint and next actions. [Journey](docs/journey.md) owns milestones, complete flows and dated history; [AGENTS](AGENTS.md) owns engineering rules. Historical failures and previous plans remain dated evidence, not current release status.

## Current task — client GitHub deployment ownership

Owner requests client-repository PR verification followed by staging deployment, then independent merged-main verification followed by client Cloudflare deployment. Bootstrap client hosting on Workers.dev before domain hookup. Branch `feat/client-github-deployment` starts from `26554bcc2d3b3091263bcadfcc883a2706d99210`.

PR122 is complete: head `5ac174b24e522e6439d2e27227cb73dcbb5f8074` passed run 40839272999 and merged as `26554bcc2d3b3091263bcadfcc883a2706d99210`. Main run [40843356821](https://github.com/LimYouSheng/SoccerBotStudioSG/actions/runs/40843356821) passed all three gates and developer deployment. Its archived receipt and current health agree on Worker version `c41fc74a-b8f2-4524-aece-7fbe9054fcba`. On 30 October all 11 inspected public pages, homepage assets and health returned 200; a foreign Origin returned 403. This is developer deployment evidence, not client GitHub ownership or provider/device acceptance. Leave test 507 untouched.

Client account `0b36822648e6905c681a90b6bec5ca7f` has existing D1 `soccerbot-production-state` / `e2a21801-0107-4db5-8551-ca1ff338df53`; the initial inspection listed no Workers; the later bootstrap installed the Worker and namespace described below. Preserve coordinator `simplybook-production-account` and `apac-ne` on first use. The temporary configured origin is `https://soccerbot-production.lucky-poetry-b25e.workers.dev`. A client Turnstile widget was created for that hostname; no secret value was exported. Client operations remain closed; foundation registration, provider secrets and acceptance remain separate.

**Leave-off:** PR7 merged as `54ee49aa558d6b8825b0b2f3c65044d6602c8adf`; main verification 41055120073 passed. PR7 head 384ab87 passed all 13 jobs in 14m39s with 454 Worker and 240 browser cases, observed Worker evidence ready in 8m41s and healthy disk headroom. Owner resumed client bootstrap and enabled production deployment. Staging remains PR6 head `9148e2a`; PR7 was draft during its successful CI and both deployment jobs correctly skipped. Owner deferred staging refresh to the next CI/release cycle. Developer legacy Verify is owner-confirmed disabled; preserve 507.

Production run 41058572295 failed after applying 35 migrations and uploading the exact Worker. Existing client D1 `e2a21801-0107-4db5-8551-ca1ff338df53`, Worker `soccerbot-production`, version `16e561b7-143f-4a8e-80d8-dbc12e3badd9` at 100%, and DO namespace `8420d1cf21eb4af996ecc06adbd6bef4` are retained. Workers.dev is enabled, previews disabled; all customer/provider/email/payment switches remain disabled. Initial health returned 404; owner later confirmed `environment_unavailable`. Primary D1 read metadata reported KIX/Osaka, Worker placement is unset and object listing returned zero objects. Preserve `simplybook-production-account` and the `apac-ne` first-use hint; actual DO placement is not proved.

Current implementation: `feat/foundation-setup-workflow` from merged main `b1c007a29a7b8f88de00192f2ad75df125c52cf1`. PR8 and PR9 merged; main CI41067934442 passed. Production deployment41070141827 first failed at Cloudflare assets-upload-session with error10013, then a single failed-job retry succeeded unchanged. Cloudflare confirms revision b1c007a and version7fbbd68c-9970-41c6-b8eb-911a13db07b0 at 100%; closed health passed. Foundation remains empty and the namespace object list remains empty. D1 primary reads still report KIX.

Execution gap: the workspace credential belongs to developer account517f4f85eb8f982b483dbc05b797fd88; a read-only client-settings request returned403/10000. The client secret is already in GitHub Actions. Prepare a manual `setup-foundation` operation in the existing Deploy verified release workflow, using the same production concurrency lock and existing production secret, strict current-main verification/artifact checks, three separately receipted phases and final registered-but-closed health. Automatic deployments remain deployment-only; no additional workflow sidebar entry. All 177 tooling tests passed, including phase ordering/failure, dispatch authority, matching closed health and workflow credential/lock boundaries; lint/source/policy checks passed. The deployed b1c007a sealed artifact was validated locally against the client account, D1, coordinator name and apac-ne hint. Cloud execution remains pending reviewed merge, fresh-main verification/deployment and owner manual dispatch; connector tools do not expose workflow dispatch. No registration or coordinator initialization has occurred.

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
