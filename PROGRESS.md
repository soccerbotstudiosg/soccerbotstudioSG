# Current checkpoint

## Current change

Branch `fix/confirmation-section-order`, based on main `fef8751` (released PR39). Confirmation details now contain Your Sessions, Booking Contact, Location and Before Your Session. Order Summary and Total Paid remain visible below the disclosure. Paid moves beside the large total on mobile and desktop; session circles align with the heading. Viewed calendar dates regain a blue outline and soft background; only cart dates have filled navy circles.

## Verification and delivery

All22 protected-confirmation component tests pass. Existing browser assertions cover disclosure visibility, session alignment and active-date highlighting; browser execution remains CI/owner-run. No test titles or inventories changed. Scoped lint, source integrity, TypeScript and formatting passed; no staging or production change for this candidate.

## Remaining scope

Calendar date-switch scroll/flicker diagnosis and full selected-slot highlighting remain pending. Unknown provider creation reconciliation, production Grafana activation and analytics/Search Console/OpenGraph remain separate scope. Docs PR33 remains paused.
