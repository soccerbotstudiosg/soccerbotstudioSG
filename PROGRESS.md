# Current checkpoint

Observed 6 November 2026 (Singapore time). History belongs to [Journey](docs/journey.md).

## Persistent selected session card

Local branch `fix/session-card-selection`, based on merged main `a1b5a28`. Keep the compact priced card in its grid after selection, highlight it blue, and reveal the existing full-width player controls/inclusions below. Booking-contact display values are right-aligned like prices. No provider, payment, capacity or pricing logic changes.

Updated the existing browser case to retain selected-card width, prices and accessible selected state; case inventory unchanged. Browser execution remains owner/CI-operated. Local source, lint and type checks passed. The existing time-step regression now explicitly checks click-again collapse/reopen without adding a session; all 9 time-step tests passed. Time-card toggling was already implemented and its application logic remains unchanged. Publication is not yet performed.

PR30 passed CI and staging and was merged as `a1b5a28`. Main deployment status has not been rechecked for this UI request. The two-minute SimplyBook invoice versus eight-minute payment-window decision remains unresolved; do not infer provider acceptance or booking activation.
