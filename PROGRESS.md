# Current checkpoint

## Current change

Branch `fix/calendar-return-confirmation-loader`, based on PR43 main `257fd22`. Mobile date-selection scroll now exposes the double-chevron return to calendar. Post-payment confirmation uses the full checkout loader directly before verified Booking Confirmed content. Paid is at the top-right of Order Summary with twice its previous text size/padding on mobile and desktop.

## Verification and delivery

All268 component/service cases and the strict zero-skip receipt passed. Browser assertions updated for the new loader and calendar return; owner/CI executes browsers. Two component test titles updated in the inventory without removing cases. User authorized stage then merge on8 November. Publish the consolidated candidate, verify exact-head CI and actual staging health before merge, then verify independent main CI and production deployment. Preserve approved runtime settings; no new provider activation. Delivery receipts belong in the PR until the next substantive checkpoint.

## Remaining scope

Device acceptance remains pending. Unknown SimplyBook no-creation reconciliation, Grafana activation/contact point, analytics/Search Console/OpenGraph and paused docs PR33 remain separate. PR43 delivery and external Python CodeQL download failures are reconciled in Journey.
