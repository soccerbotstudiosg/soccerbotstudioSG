# Current checkpoint

PR34 merged as `ca02f7e` after all exact-head CI gates and staging deployment passed. Broad documentation PR33 remains paused; dated evidence belongs in [Journey](docs/journey.md).

## Current change

- Branch: `fix/booking-home-label`, based on main `ca02f7e`.
- First booking step navigation label shortened from Back to home to Home to avoid mobile truncation. Later-step Back controls and confirmation actions retain their labels and behavior.
- Existing leave-booking browser regression updated to find Home; no inventory change. Browser execution remains CI/owner-operated.
- Owner considers tests A, B and C fully passed. Their detailed checklist/results were not supplied in this turn; do not infer additional provider/device acceptance. Two-tab conflict and booking-defence checks remain to be confirmed.
- Label change is prepared for a separate draft PR; CI and deployment remain pending. PR34 main verification/production delivery status must be read from GitHub before making a current deployment claim.

## Deployed baseline

- PR32 merged as `e23d203`; independent main CI42251148911 and deployment42252782624 passed. Staging source `9ea535f` has the same application tree.
- Production runtime restored to approved HitPay sandbox testing on7 November. Missing IDENTITY_PEPPER installed after explicit owner approval; eight existing secrets/resources retained. Version `5619f5ac-f746-4aec-86aa-fde64f927c3a`.
- Customer access, sandbox checkout/recovery/webhook and warming enabled; identity email and token refresh-ahead disabled. Workspace public health returns403; owner browser/provider acceptance pending.
- No assistant booking/payment/cancellation/notification operations. Normal production redeployment restores closed defaults; activation is separately scoped.

## Documentation branch

- PR33 `docs/test-guides-and-reference-cleanup` remains paused.
- Queued reminder rule: clients/providers3 days and24 hours before; no provider configuration mutation or delivery claim.
- Preserve document-specific numbered menus, bullet formatting, in-place reconciliation, journals only in Journey and diagrams unless stale.
