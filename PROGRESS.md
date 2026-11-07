# Current checkpoint

PR34 merged as `ca02f7e` after all exact-head CI gates and staging deployment passed. Broad documentation PR33 remains paused; dated evidence belongs in [Journey](docs/journey.md).

## Current change

- Branch: `fix/booking-home-label`, based on main `ca02f7e`.
- App popup uses standard white/navy styling and regular-weight Roboto at the existing dialog/body sizes; close icon is top-right without underline. Account cards no longer hover; their buttons do. Calendar selector/arrows hover and use full month names on one row.
- First booking step navigation label shortened from Back to home to Home to avoid mobile truncation. Later-step Back controls and confirmation actions retain their labels and behavior.
- All site-link departures from unpaid booking routes now share the leave warning, including every footer link; confirmation preserves the clicked destination and Stay preserves selections. Payment/recovery continuations remain in-flow. Existing browser regression covers every footer link, internal destinations and a captured external new-tab handoff; no inventory change. Browser execution remains CI/owner-operated.
- Owner considers tests A, B and C fully passed. Their detailed checklist/results were not supplied in this turn; do not infer additional provider/device acceptance. Two-tab conflict and booking-defence checks remain to be confirmed.
- Consolidated verify:code passed267 tests, design/tooling checks and14 exported routes (`pr35-consolidated-code.log`); browser inventory remains56 definitions.
- PR35 now includes the Home label, complete site-link departure guard, popup theme and calendar/hover corrections. Owner authorized CI, staging and merge. New-head CI and deployment remain pending. PR34 main verification/production deployment passed; the approved sandbox runtime settings were restored after deployment on 7 November, version `9c892f46-8ded-4dd2-9cd1-e37d82cb5efe`. Nine secrets, D1/DO and minute cron retained; public health is blocked by the workspace proxy.

## Deployed baseline

- PR34 merged as `ca02f7e`; independent main CI42341443187 and production deployment42342120335 passed. Staging had passed head8d2efcd before merge.
- Production sandbox settings restored after the deployment reset them; version `9c892f46-8ded-4dd2-9cd1-e37d82cb5efe`. Customer access, sandbox checkout/recovery/webhook, trusted reads and warming enabled; identity email and token refresh-ahead disabled. Nine secrets/resources and minute cron retained.
- Workspace public health is blocked by the proxy. No assistant booking/payment/cancellation/notification operations. Normal production deployment still restores closed defaults.

## Documentation branch

- PR33 `docs/test-guides-and-reference-cleanup` remains paused.
- Queued reminder rule: clients/providers3 days and24 hours before; no provider configuration mutation or delivery claim.
- Preserve document-specific numbered menus, bullet formatting, in-place reconciliation, journals only in Journey and diagrams unless stale.
