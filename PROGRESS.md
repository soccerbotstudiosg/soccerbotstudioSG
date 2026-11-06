# Current checkpoint

Observed 6 November 2026 (Singapore). History: [Journey](docs/journey.md).

## PR32 compact banners and reversible selection

Branch `fix/hero-session-copy`; baseline44540b6 passed final CI42150456756 and staging42152250578 with matching health. Owner explicitly revoked merge with **“dont merge”**; automatic review blocked the in-flight request. PR32 remains open/unmerged. No runtime settings were enabled. This supersedes every earlier merge/activation sequence in dated records.

Current requested iteration: Contact us becomes a compact photo-free abstract banner, targeting60% less desktop height while keeping typography; Studio booking uses the same visual owner with different copy. Outlet card matches session-card width. Clicking either selected card again deselects it and hides dependent controls; outlet deselection resets the nested session disclosure. Existing draft details, service IDs, provider mappings, prices, capacity and all booking/payment/recovery guards remain unchanged. Outlet remains preparatory UI scaffolding only.

Validation: extend existing selection and public-page cases without changing test counts; run focused selection tests and one consolidated local code pass, then exact-head CI and staging for this candidate. Final delivery receipt goes in [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32), not another status-only commit.

## Remaining work

- Finish checks, publish this iteration to PR32, verify its CI and staging. **Do not merge or enable settings.** Owner visual acceptance remains pending.
- Provider decision remains ten-minute timeout; screenshot shows10 selected, but saving/effective new invoice deadline still needs owner verification. App timing remains8-minute payment,1-minute checking,3-minute recovery. [A–D worksheet](docs/uat/simulated-user.md#ad-acceptance-worksheet) remains owner-operated and pending.
- Domain connection/WAF/rate-limit work is deferred until owner tests are finalized. Read-only inspection found soccerbotsg.com active in Cloudflare but no production Worker custom domain; managed rulesets listed, no custom edge-rate-limit ruleset established. This is not evidence of protection for the workers.dev route.
- Wider external work remains in [Runbook](docs/runbook.md), [Admin UAT](docs/uat/admin.md) and [Trainer UAT](docs/uat/trainers.md).
