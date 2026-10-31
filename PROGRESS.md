# SoccerBotStudioSG current task and handover

Updated 31 October 2026, Singapore. This file owns the current task and verified leave-off; [Journey](docs/journey.md) retains dated evidence and [AGENTS](AGENTS.md) owns engineering rules.

## Current task — client provider configuration and acceptance

Client GitHub deployment ownership and closed Cloudflare foundation are established. Client customer operations are **not activated**. Continue on Workers.dev while domain delegation/transfer is pending; do not repeat completed bootstrap work. Leave test 507 untouched.

### Verified deployment checkpoint

- Canonical repository: `soccerbotstudiosg/soccerbotstudioSG`; developer writes use `LimYouSheng`. PR11 merged as `e3f2301f17673cca85bd990003b9891048ff909d`. Final-head verification [41155626100](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41155626100), independent main verification [41157066046](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41157066046) and production deployment [41158088719](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41158088719) passed. Customer/provider access remains disabled. Earlier PR10 bootstrap evidence is retained in Journey.
- Normal releases use Deploy verified release, operation `deploy`: trusted ready PR verification precedes staging; independently verified current main precedes production. `setup-foundation` is a separate manual operation, not part of each release. Developer legacy Verify is owner-confirmed disabled and its repository private; staging remains a separate public endpoint without confirmed Access protection.
- Client account `0b36822648e6905c681a90b6bec5ca7f`, Worker `soccerbot-production`, origin `https://soccerbot-production.lucky-poetry-b25e.workers.dev`, D1 `e2a21801-0107-4db5-8551-ca1ff338df53`, namespace `8420d1cf21eb4af996ecc06adbd6bef4` are retained. All 35 migrations were applied during bootstrap.
- Foundation setup [41084843753](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41084843753) passed. D1 registration matches named coordinator `simplybook-production-account`, ID `c8a6f33d2f0f3d6b32a8a51ae9f74459a87692feb73c765ac4c5219a09783cd0`; the object-list API subsequently returned that ID with `hasStoredData: true`. No alarm or pending wakeups were reported.
- On 31 October at 00:07:57 SGT, a controlled repeat (attempt 2) passed with native tracing temporarily enabled. Trace `eb3b9672b2663f6dc31fc7c8a3c4a482` ties the exact coordinator ID and `inspectFoundation` RPC to `cloudflare.colo=KIX`. This proves observed coordinator execution in Osaka, independently of D1 primary KIX metadata; it is not a permanent placement guarantee. The `apac-ne` hint and identity remain unchanged. Original tracing settings were restored; Grafana production export is not activated.
- Customer/provider access remains disabled. The latest settings inspection found no Worker secret bindings. Application provider credentials, production payment contracts and owner acceptance remain pending. Initial 404/missing-foundation failure and Cloudflare assets-upload error10013 are retained historical failures; later success does not erase them.

### Confirmed provider rules and inspected configuration

Owner confirmed client SimplyBook company `soccerbotadmin`, business SoccerBotStudio Singapore, timezone Asia/Singapore. Keep developer company `soccerbot` separate. On 31 October the owner confirmed **both staging and production permit only one simultaneous booking across the account, with no admin exemption**. This supersedes earlier staging exemption evidence. Settings are owner-confirmed; controlled cross-trainer/customer/admin enforcement acceptance remains unperformed.

Read-only inspection of client company: service 3 Kickoff Special S$108 and service 4 Weekend/Public Holiday S$128, each 40 minutes plus a 10-minute buffer. Active providers Faisal (2), Nabil (3), Caelan (4), Rifqi (5) and Azam (6) are linked to both services. Company and both service weekly hours are noon–8pm daily. All trainer weekly days are off; owner confirmed this is intentional and availability is entered by date. Owner authorized mock date-specific availability for all five trainers, 3–21 November 2026, noon–8pm Singapore time: all five 19-date update requests succeeded (95 trainer-date entries). Readback verified 21 November for all five; not every intermediate date was independently reread. Weekly schedules and 22 November onward were excluded from every write. Read-only checks found existing noon–8pm entries on 22 November for all five, left untouched; the owner identifies that as the official opening date. Owner confirmed final client weekday/weekend-or-public-holiday prices of S$108/S$128, four-hour booking notice and a 15-minute unpaid invoice timeout. Read-only timeline probes for all five providers on 3 November (service 3) and 21 November (service 4) returned the same nine 50-minute starts from 12:00 through 18:40; this sampled two dates, not every mock date. API, Accept payments, Multiple bookings, Limit bookings and custom booking interval features are enabled; enablement alone does not verify their settings, plan entitlements, cutoff or invoice timeout.

Next steps: complete reviewed production provider/service/credential integration and owner acceptance. Owner confirms HitPay merchant/bank setup is still pending; live guest payment testing cannot proceed. Resend domain `soccerbotsg.com` was created in the confirmed client-owned account (Tokyo region, sending only, tracking off), but DNS verification/setup is paused at owner request because authoritative DNS access is unavailable. Intended sender is contact@soccerbotsg.com. No DNS changes or email sends occurred. Preserve developer mappings and historical booking/payment records.

### Test and documentation reconciliation

The checkpoint update changes capacity acceptance and scheduling instructions. PR11 additionally repairs the browser retention test calendar fixture after its first CI failed at the October/November boundary. Retained `worker/tests/catalogue.test.mjs` checks reject unverified shared capacity and contradictory provider schedules without booking writes; these synthetic assertions do not verify account-wide or admin provider enforcement. Existing Worker/catalogue tests remain valid; no test titles, fixtures or strict inventories are removed or altered. Admin UAT must test the shared limit across different trainers and an admin attempt; Trainer UAT must preserve weekly days off and verify date-specific availability. These checks remain unperformed, not inferred from CI. Foundation CI and cloud execution receipts are separate from provider, device, payment and email acceptance. Source owners still require a reviewed implementation for production provider portability.

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

## Remaining deployment and handover work

- Domain/email preservation, registrar transfer and final domain/HTTPS acceptance remain pending vendor/owner action; use the current domain handover above.
- Configure client SimplyBook, Resend, Turnstile secret and HitPay with separate staging/production credentials. Preserve account/host guards and require exact-final-head gates for implementation changes.
- Company-central Grafana ingestion, environment separation, dashboards, alert delivery and primary/backup responders remain pending. Temporary native tracing did not activate that system.
- Complete owner booking/payment/account-action UAT, controlled capacity checks, rollback/recovery evidence and billing/MFA/access handover before customer activation.

Working checkout: `/workspace/SoccerBotStudioSG`; preserve the dependency symlink and unknown files. No provider changes or live financial/customer actions are authorized by this documentation checkpoint.

## Active implementation — pricing and growing rosters

Branch `feat/client-provider-configuration`, base `e3f2301f17673cca85bd990003b9891048ff909d`. Scope: environment-specific prices and complete bounded calendar reads for a growing trainer roster. Production activation, live payment/notification actions and DNS are excluded. Acceptance: all linked trainers retained, two concurrent ongoing reads, complete-cache-only behavior, deterministic failures and bounded work/payload; staging prices and shared-studio capacity retained. One implementation/check/review block, at most six iterations/90 active minutes; exact-head CI required before a separately authorized merge.

Implemented: developer/client pricing profiles; calendar catalogue price validation uses the trusted environment. The three-trainer cap is replaced by 96 range reads per service/calendar request, two ongoing read lanes and serialized admission. Daily/monthly offers and encoded payloads are bounded; incomplete trainer/date results reject the refresh. Finite experiments remain sequential. Existing expiry, cache isolation and invalidation guards remain. Production native grants, base service mapping and provider/payment scope are still developer-only: this change prepares pricing, not complete production checkout.

Tests: added environment-price/cart, large-roster browser-service and schema-budget assertions; added four Worker catalogue cases for 20 trainers, shared caching/concurrency, excessive work/response size failed sibling drainage and serialized admission/budget checks. Updated omitted-date expectations to reject incomplete trainer lists. Inventories include all new cases; no removals. Final focused pricing/booking/browser-service checks passed 52/52. Worker catalogue checks passed 43/43, including the added admission test. Source/policy checks, Worker boundaries/types and changed-code lint passed. One initial Worker source check rejected the English word “any” in a comment under its blanket unsafe-type pattern; the comment was reworded without changing or relaxing the checker. Exact-head CI remains pending. Browser execution remains CI/owner-operated.

PR11's original run41153806593 failed its calendar-boundary retention fixture; final head d508b4806490fe2b32c37dc985dcb8f6ae00c077 passed and merged. Original jobs124396706565/124396706641 and failure artifacts remain evidence; the advancing fixed-date fixture repaired the October/November mismatch. The prior shard audit retained all 296 frontend/browser titles and 454 original Worker cases plus seven foundation additions; this branch adds cases without reducing any group.

Next: finish focused checks and review, publish draft PR and verify all three final-head gates. Then continue production provider mapping/credentials and merchant preparation; do not enable customer access merely because synthetic CI passes.
