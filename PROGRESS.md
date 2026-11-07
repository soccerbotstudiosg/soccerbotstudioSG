# Current checkpoint

## Current change

PR37, branch `fix/calendar-context-type-size`, base/main `58c40e1`. Published `8fa5974` consolidates18px bold calendar context, sticky desktop cart, compact rolling Week/Month calendar, cart-day colours and message-only incomplete-checkout polling. Its full non-browser verification passed268 tests. CI42361412018 passed frontend and Worker jobs, but live-email browser cases still expected the superseded error message. The follow-up updates those expectations while preserving no-replay, no-payment and original-deadline assertions, and adds numeric provider RPC diagnostics.

The next follow-up fixes the Grafana allowlist dropping `provider_failure`: retain signed numeric RPC codes and classify unknown text categories without dropping events. All11 telemetry tests passed, including sensitive-field exclusion and failure retention at zero success sampling. Raw provider response storage and production Grafana activation are not included.

## Failure audit

The16:42SGT checkout received HTTP200 with an invalid/error SimplyBook RPC envelope, retained no booking reference and never called HitPay. Read-only provider search found no matching active/cancelled booking; the exact original rejection reason was not retained. Context polling only observes state, and scheduled recovery cannot settle this reference-less attempt. Automatic approval review rejected the proposed automatic release because the provider code whitelist did not prove no booking was created. That proposal was reverted; no release-policy change or live repair is included. Operator-verified recovery remains pending clarification.

## Delivery and next steps

Production remains PR36 at `58c40e1` with approved sandbox flags verified. The64-test checkout Worker suite, Worker/app types, scoped lint, source boundaries, inventory and formatting passed. Push the consolidated follow-up and inspect exact-head CI. PR37 is not deployed or accepted on staging. Browser execution and physical-device acceptance remain owner/CI-run. Docs PR33 remains paused; analytics/Search Console/OpenGraph remain outside implemented scope.
