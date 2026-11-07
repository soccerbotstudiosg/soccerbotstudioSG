# Current checkpoint

## Current change

PR37, branch `fix/calendar-context-type-size`, published head `15fa407`, base/main `58c40e1`. Consolidating the18px bold context with sticky desktop cart, compact rolling Week/Month calendar, cart-day colours and message-only incomplete-checkout polling until resolution. The new cross-month regression and existing affected suites passed73 tests; recovery access-denial/unmount checks passed22 tests. Full non-browser verification then passed with268 tests, build/export and all code gates. Documentation-only reconciliation follows that receipt; publication and final CI are pending. Browser execution remains CI/owner-run.

## Failure audit

The16:42SGT checkout received HTTP200 with an invalid/error SimplyBook RPC envelope, retained no booking reference and never called HitPay. Read-only SimplyBook search found no matching active/cancelled booking. Exact provider rejection reason is unavailable. Automatic reconciliation cannot settle an unknown creation without retained keys/payment row; context polling observes state only. Preserve the attempt and original effect journal. See the7Nov PR37 audit in Journey and Technical behavior section7. No live repair or provider write has been performed.

## Delivery and next steps

PR36 is deployed at `58c40e1`; production sandbox flags were restored and verified. PR37's expanded working tree is not deployed. Finish focused validation and documentation, push one consolidated candidate and inspect exact-head CI/staging. Do not treat old PR37 checks as acceptance of these changes. Owner staging/physical-device acceptance remains pending; docs PR33 stays paused. Analytics/Search Console/OpenGraph remain outside the implemented scope.
