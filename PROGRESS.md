# Current checkpoint

## Current change

Branch `fix/mobile-hero-address-size`, based on PR38 merge5906074. Mobile hero address12px; compact guest/email and outlet/session choices; navy calendar circle only when a session for that date is in the cart. Existing browser tests cover viewport bounds and before/after session date styling. No new test titles/inventory changes. Expanded details retain normal scrolling; desktop layout unchanged.

## Delivery and next steps

PR38 passed CI42373108885 and staging42373863153 attempt2, exact source26dc5c9. Owner authorized merge5906074; main verification42376087390 and production release must be observed separately. Continue the authorized production settings restoration after deployment. Publish this mobile follow-up separately; its CI/staging/merge are pending.

## Remaining scope

Unknown provider creation reconciliation, raw response retention, production Grafana activation and analytics/Search Console/OpenGraph remain separate scope. Docs PR33 remains paused.

CI42376495787 exposed one remaining obsolete20px mobile session-product assertion; update to16px mobile/20px desktop without relaxing precision. Final-head CI and staging remain pending. PR38 production is deployed at5906074 with18 approved settings restored/read back.
