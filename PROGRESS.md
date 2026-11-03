# Current checkpoint

Observed 3 November 2026, Singapore. Replace this checkpoint when work advances; dated evidence belongs in [Journey](docs/journey.md#part-2--dated-changes-and-evidence).

## Current state

- [PR20](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/20) merged at owner request as `662bea3764bb7546a216f1f4f3790fbcb1e28a67`. All13 checks passed for PR head61ff22e in [CI41544574146](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/41544574146).
- Owner requested trial runs after merge. PR20 staging deployment/physical acceptance was not established before this merge; do not describe CI as provider acceptance. Main CI41555359170 and production deployment41557099523 succeeded for662bea3. Guest sandbox checkout activation was subsequently verified through Cloudflare settings.
- The consolidated local changes and new repository code-writing skill are prepared for the owner-authorized draft PR on `fix/shared-calendar-cache`; merged PR20 contains the application/test changes, not this cleanup.
- Staging remains last recorded PR19 source7634a29. Production runs662bea3 with guest sandbox checkout/recovery/webhook enabled; identity email stays disabled. Public HTTP is blocked by the workspace proxy, so owner browser acceptance is still pending.

## Immediate remaining tasks

1. Complete the remaining test9 invoice-number repair: enrich final paid document metadata without delaying safe confirmation or guessing prefixes. This remains an explicit open item; owner has now requested CI for the tested cache/UI/documentation batch.
2. Keep the accounting-response fallback until its rejection reason is evidenced; do not remove authoritative verification to improve timing. Exact UI paint remains owner-trace evidence.
3. Publish the owner-authorized consolidated candidate as a draft PR and inspect exact-head CI: shared-cache restoration/safety audit, matching Refresh layout, documentation cleanup and local skills are together on `fix/shared-calendar-cache`. CI is pending publication at this checkpoint; no merge or source deployment is authorized by this push.
4. After authorized deployment, recheck warming and perform the documented stale-tab and consecutive single/multi-session provider trials. An in-flight provider read can still delay checkout; local simulation is not provider acceptance.

## Latest local evidence

Shared-cache repair and safety audit are implemented. At the owner's request, the complete local Worker wrapper was rerun after the assertion repair and passed472/472 in one run, with zero failures, skips or cancellations. Source checks, both type-generation steps, Worker type checking and runtime inventory validation all passed; `test-results/verification-worker.json` reports `passed`, with log `/tmp/cache-complete-rerun.log`. This supersedes the earlier mixed full/group evidence; the original failure remains in Journey. Additional cache/queue contracts53/53, targeted consecutive journeys and blocked-refresh dismissal4/4, guard tests4/4, lint/format and documentation links passed. Isolated exclusion/yield mutations failed as intended. Refresh-layout17-case evidence remains valid for unchanged UI source. GitHub and owner browser/provider acceptance remain pending.

Production still runs662bea3. `PUBLIC_DISPLAY_WARMING=enabled` was independently read back; token refresh-ahead and identity email remain disabled. The local cache repair is not deployed. Owner test9 evidence and this audit are retained in [Journey](docs/journey.md#3-november-2026--shared-calendar-restoration-and-safety-audit-local). Custom email stays on hold.
