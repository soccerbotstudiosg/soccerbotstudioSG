# Current checkpoint

Observed 6 November 2026 (Singapore time). History belongs to [Journey](docs/journey.md).

## Booking presentation polish — PR32

Branch `fix/hero-session-copy`, based on merged main `a4185c8`. The hero-strip removal, shared blue selected-card highlight, calendar arrows, responsive contact/price alignment, contact typography and summary spacing are implemented. Session typography and booking/payment/provider behavior remain unchanged.

PR32 application candidate `7f5075904847b2e809fa34836b2b8e3c2346142d` passed all required gates in [42137785715](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/42137785715) and staging [42139117805](https://github.com/soccerbotstudiosg/soccerbotstudioSG/actions/runs/42139117805). Public staging health independently matched that source and version `256dff7b-55c7-4b72-aea6-3118ad9b8ce0` on resume. The original typography failure is retained in Journey.

This follow-up reconciles the handover and provider-setting evidence only. Tests, inventories, application code and configuration remain unchanged. Record the new final-head CI and staging outcomes in [PR32](https://github.com/soccerbotstudiosg/soccerbotstudioSG/pull/32), avoiding another status-only commit after verification.

## Immediate remaining work

- Verify this follow-up's exact-head CI and staged revision; earlier green evidence belongs to `7f50759`. The PR receipt owns the final delivery result.
- Owner reviews the staged presentation. **Hold PR32 open and unmerged until explicitly asked to merge**; this supersedes the earlier conditional merge instruction. Continuing work or adding to this PR does not lift that hold.
- Owner decision on 6 November: **retain the two-minute experiment and hold activation**. The observed two-minute invoice does not support the eight-minute customer payment window. Do not change the provider timeout or application payment window; activation remains blocked until a separately approved compatible policy and provider acceptance are verified. See [provider timing evidence](docs/external-providers-config.md#checkout-timing-follow-up--5-november-2026) and [Admin UAT](docs/uat/admin.md). No provider setting change or real booking/payment is included in this PR.

PR31's merged main `a4185c8` passed independent verification and production deployment; Journey records the exact runs. Production installation does not establish current activation, provider/device acceptance or compatible provider/payment timing. Direct production health from this workspace is blocked at the network proxy; staging health is accessible.
