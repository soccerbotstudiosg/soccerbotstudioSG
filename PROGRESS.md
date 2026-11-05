# Current checkpoint

Observed 5 November 2026. Historical evidence belongs in [Journey](docs/journey.md).

## Current task — PR27 final layout and safety audit

Branch `fix/booking-price-alignment`, base `eb0649475c9fe80a4349d87dc945fccbb7bba06b`. Candidate `af169dfcd08f0d02d3105ed454fc07b54a9cea14` passed CI41975407857. User authorized publishing the consolidated local follow-up to the same PR for CI. No merge or production deployment authorized.

Follow-up: right-align currency labels beneath cart/review totals; restore the caption selector group; assert calendar weekday typography in the existing browser test; extend existing isolated payment tests for receipts arriving during proof, invalid access, idempotent release, archived late-payment denial and newly occupied provider availability. Correct the stale four-month comment to three. No Worker production logic or test inventory changes in this follow-up.

## Verification and next actions

Previous candidate passed full local code/Worker verification and CI. Follow-up passed four focused isolated Worker cases, source/lint/format and diff checks. Browser rendering/assertions require exact-new-head CI; do not reuse prior-head CI as acceptance. Retain existing evidence rather than repeat unaffected full suites merely to publish.

Commit/push this consolidated follow-up and update PR27, then verify all three exact-head CI gates before staging. Provider10-minute timeout, deployed calendar speed, C/D retests and owner staging acceptance remain pending. A provider read failure after release can still leave conservative unavailable offers until a successful refresh; no slot is blindly restored. No assistant browser execution, live provider writes, merge or production deployment occurred.
