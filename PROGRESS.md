# Current checkpoint

## Current change

Branch `fix/calendar-day-appearance`, based on merged main021e775. Remove calendar legend and availability dots; darker unavailable days; navy circular viewed/cart-selected dates; remove guidance below session slots. Screen-reader cart membership remains. Existing browser assertions updated with no inventory changes. All19 calendar/parity component cases passed; source/lint/types and publication receipt record remaining checks. Browser viewport acceptance remains CI/owner-run.

## Delivery and next steps

PR37 is merged and deployed: candidate CI42366998310, staging42367766013, main CI42367943252 and production42368627772 passed. Production source021e775;18 approved booking/HitPay sandbox settings restored and read back. Independent post-activation shell health was blocked by CONNECT proxy403. Publish the new calendar presentation candidate as a draft PR; final CI/staging/merge remain pending for this change.

## Remaining scope

Unknown SimplyBook creation with no booking reference/payment row still requires authoritative reconciliation; diagnostics cannot retroactively recover the original provider response. Production Grafana activation, raw response retention and analytics/Search Console/OpenGraph are not implemented. Docs PR33 remains paused.
